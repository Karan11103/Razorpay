import pytest
from app.gate import reconciliation_gate
from app.schemas import Decision

class MockOrder:
    def __init__(self, id="order_test_123", amount=50000, status="pending"):
        self.id = id
        self.amount = amount
        self.status = status

def test_gate_happy_path():
    """Branch 6: All checks pass -> allowed=True"""
    order = MockOrder(id="order_1", amount=50000, status="pending")
    decision = reconciliation_gate(
        order=order,
        gateway_status="captured",
        gateway_signature_valid=True,
        gateway_amount=50000,
        is_already_corrected=False
    )
    assert decision.allowed is True
    assert "Gateway confirms captured" in decision.reason

def test_gate_idempotency_guard():
    """Branch 1: Already corrected -> allowed=False, idempotency guard"""
    order = MockOrder(id="order_1", amount=50000, status="pending")
    decision = reconciliation_gate(
        order=order,
        gateway_status="captured",
        gateway_signature_valid=True,
        gateway_amount=50000,
        is_already_corrected=True
    )
    assert decision.allowed is False
    assert "Already corrected" in decision.reason

    # Also test via already_corrected_fn callback
    decision2 = reconciliation_gate(
        order=order,
        gateway_status="captured",
        gateway_signature_valid=True,
        gateway_amount=50000,
        already_corrected_fn=lambda oid: oid == "order_1"
    )
    assert decision2.allowed is False
    assert "Already corrected" in decision2.reason

def test_gate_wrong_gateway_status():
    """Branch 2: Gateway status is not 'captured' (e.g. 'failed', 'authorized')"""
    order = MockOrder(id="order_1", amount=50000, status="pending")
    for status in ["failed", "authorized", "created", "refunded"]:
        decision = reconciliation_gate(
            order=order,
            gateway_status=status,
            gateway_signature_valid=True,
            gateway_amount=50000,
            is_already_corrected=False
        )
        assert decision.allowed is False
        assert f"Gateway status is {status}, not captured" in decision.reason

def test_gate_invalid_signature():
    """Branch 3a: Bad cryptographic signature -> escalate, do not auto-correct"""
    order = MockOrder(id="order_1", amount=50000, status="pending")
    decision = reconciliation_gate(
        order=order,
        gateway_status="captured",
        gateway_signature_valid=False,
        gateway_amount=50000,
        is_already_corrected=False
    )
    assert decision.allowed is False
    assert "Signature verification failed" in decision.reason

def test_gate_amount_mismatch():
    """Branch 3b: Gateway amount does not match order amount -> escalate"""
    order = MockOrder(id="order_1", amount=50000, status="pending")
    decision = reconciliation_gate(
        order=order,
        gateway_status="captured",
        gateway_signature_valid=True,
        gateway_amount=75000,  # mismatch!
        is_already_corrected=False
    )
    assert decision.allowed is False
    assert "Amount mismatch" in decision.reason

def test_gate_terminal_dispute_refund_states():
    """Branch 4: Order in terminal state (refunded, disputed, charged_back) -> escalate"""
    for terminal_status in ["refunded", "disputed", "charged_back"]:
        order = MockOrder(id="order_1", amount=50000, status=terminal_status)
        decision = reconciliation_gate(
            order=order,
            gateway_status="captured",
            gateway_signature_valid=True,
            gateway_amount=50000,
            is_already_corrected=False
        )
        assert decision.allowed is False
        assert f"Order in terminal state {terminal_status}" in decision.reason
