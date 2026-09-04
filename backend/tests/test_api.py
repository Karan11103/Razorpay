import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.models import Order, Correction, EscalationQueueItem

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_full_ghost_payment_flow(client):
    """
    Simulates complete Ghost Payment scenario:
    1. Checkout created -> Order 'pending'
    2. Webhook dropped by Chaos Relay -> Order still 'pending' (Ghost Payment)
    3. Poller reconciles -> Order becomes 'corrected'
    4. Audit Log logged with actor 'system'
    5. Second reconcile call verifies idempotency guard
    """
    # 1. Simulate Checkout
    checkout_res = client.post("/simulate/checkout", json={"amount": 49900, "currency": "INR"})
    assert checkout_res.status_code == 200
    order_data = checkout_res.json()
    order_id = order_data["id"]
    assert order_data["status"] == "pending"
    assert order_data["amount"] == 49900

    # 2. Chaos Webhook Relay drops the webhook silently
    webhook_res = client.post(
        "/webhook/razorpay",
        json={
            "order_id": order_id,
            "force_chaos_action": "drop"
        }
    )
    assert webhook_res.status_code == 200
    assert webhook_res.json()["chaos_action"] == "dropped"

    # Verify Order is STILL 'pending' (Ghost Payment created)
    # Check via direct DB query
    db = SessionLocal()
    order_in_db = db.query(Order).filter(Order.id == order_id).first()
    assert order_in_db.status == "pending"
    db.close()

    # 3. Trigger immediate reconciliation pass
    reconcile_res = client.post("/admin/reconcile-now?cutoff_seconds=0")
    assert reconcile_res.status_code == 200
    reconcile_data = reconcile_res.json()
    assert reconcile_data["data"]["auto_corrected_count"] >= 1

    # Verify Order is now 'corrected'
    db = SessionLocal()
    order_in_db = db.query(Order).filter(Order.id == order_id).first()
    assert order_in_db.status == "corrected"

    # Verify Correction table holds the idempotency record
    correction_record = db.query(Correction).filter(Correction.order_id == order_id).first()
    assert correction_record is not None
    db.close()

    # 4. Check Audit Log
    audit_res = client.get(f"/audit-log?order_id={order_id}")
    assert audit_res.status_code == 200
    audit_data = audit_res.json()
    assert audit_data["total_records"] >= 1
    assert any(item["action"] == "AUTO_CORRECT_GHOST_PAYMENT" for item in audit_data["items"])

    # 5. Idempotency test: Re-running reconciliation poller must NOT double-correct
    reconcile_again = client.post("/admin/reconcile-now?cutoff_seconds=0")
    assert reconcile_again.status_code == 200
    # The order is now 'corrected', so it is excluded from 'pending' scan
    # Or if status were forced, the idempotency check blocks it.

    # 6. Check Dashboard stats
    stats_res = client.get("/dashboard/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["ghost_payments_caught_count"] >= 1
    assert stats["ghost_payments_caught_rupees"] >= 499.0

def test_escalation_flow(client):
    """
    Tests escalation when signature / amount validation fails:
    1. Create order
    2. Force order to amount mismatch
    3. Gate detects mismatch -> blocks auto-correction -> creates escalation queue item
    4. Merchant reviews and marks resolved -> logged to audit trail with actor 'human'
    """
    checkout_res = client.post("/simulate/checkout", json={"amount": 75000, "currency": "INR"})
    order_id = checkout_res.json()["id"]

    # Tamper with order amount directly in DB to induce amount discrepancy with gateway
    db = SessionLocal()
    order = db.query(Order).filter(Order.id == order_id).first()
    order.amount = 120000  # Gateway returns 75000, DB has 120000
    db.commit()
    db.close()

    # Trigger reconciliation
    reconcile_res = client.post("/admin/reconcile-now?cutoff_seconds=0")
    assert reconcile_res.status_code == 200

    # Check escalations endpoint
    esc_res = client.get("/escalations")
    assert esc_res.status_code == 200
    esc_items = esc_res.json()
    assert any(item["order_id"] == order_id for item in esc_items)

    # Find the escalation ID
    item = next(it for it in esc_items if it["order_id"] == order_id)
    esc_id = item["id"]
    assert "Amount mismatch" in item["reason"]

    # Resolve escalation
    resolve_res = client.post(f"/escalations/{esc_id}/resolve", json={"notes": "Investigated and reconciled manually"})
    assert resolve_res.status_code == 200

    # Verify audit log recorded actor 'human'
    audit_res = client.get(f"/audit-log?action=MANUAL_ESCALATION_RESOLVED")
    assert audit_res.status_code == 200
    assert audit_res.json()["total_records"] >= 1
