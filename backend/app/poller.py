import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models import Order, Correction, ReconciliationEvent, AuditLog, EscalationQueueItem, WebhookEvent
from app.gate import reconciliation_gate
from app.razorpay_client import gateway_client
from app.explainer import explain_reconciliation_event
from app.config import settings

logger = logging.getLogger("poller")

def reconcile_pending_orders(db: Session, cutoff_seconds: int = None, limit: int = 100) -> Dict[str, Any]:
    """
    Executes a reconciliation batch pass over pending orders.
    
    Time Complexity: O(N) where N is number of pending orders older than cutoff.
    Space Complexity: O(1) per order using paginated chunk processing.
    
    Order lookup uses index on (status, created_at).
    Idempotency check uses O(1) unique primary key lookup on corrections table.
    Audit log writes are O(1) append-only.
    """
    if cutoff_seconds is None:
        cutoff_seconds = settings.RECONCILIATION_CUTOFF_SECONDS

    cutoff_time = datetime.utcnow() - timedelta(seconds=cutoff_seconds)

    # Indexed query on (status, created_at)
    query = (
        select(Order)
        .where(Order.status == "pending")
        .where(Order.created_at <= cutoff_time)
        .order_by(Order.created_at.asc())
        .limit(limit)
    )

    pending_orders: List[Order] = db.scalars(query).all()

    scanned_count = len(pending_orders)
    auto_corrected_count = 0
    escalated_count = 0
    events_summary = []

    for order in pending_orders:
        order_id = order.id
        db_status_before = order.status

        # O(1) idempotency check against corrections table
        is_already_corrected = (
            db.scalar(select(Correction).where(Correction.order_id == order_id)) is not None
        )

        # Query gateway truth directly from Razorpay Test API
        gateway_data = gateway_client.fetch_payment_status(order_id)
        gateway_status = gateway_data.get("status", "unknown")
        gateway_amount = gateway_data.get("amount", order.amount)

        # Check if any incoming webhook for this order was corrupted (e.g. signature failure)
        corrupted_webhook = db.scalar(
            select(WebhookEvent)
            .where(WebhookEvent.order_id == order_id)
            .where(WebhookEvent.status == "corrupted")
        )
        gateway_sig_valid = (corrupted_webhook is None)

        # Deterministic Gate Evaluation (O(1))
        decision = reconciliation_gate(
            order=order,
            gateway_status=gateway_status,
            gateway_signature_valid=gateway_sig_valid,
            gateway_amount=gateway_amount,
            is_already_corrected=is_already_corrected
        )

        if decision.allowed:
            # 1. State transition
            order.status = "corrected"
            order.updated_at = datetime.utcnow()
            db_status_after = "corrected"
            auto_corrected_count += 1

            # 2. Idempotency record insertion
            correction_entry = Correction(
                order_id=order_id,
                created_at=datetime.utcnow()
            )
            db.add(correction_entry)

            # 3. Create ReconciliationEvent
            rec_event = ReconciliationEvent(
                order_id=order_id,
                gateway_status=gateway_status,
                db_status_before=db_status_before,
                gate_decision="allowed",
                gate_reason=decision.reason,
                db_status_after=db_status_after,
                created_at=datetime.utcnow()
            )
            db.add(rec_event)
            db.flush()  # assign rec_event.id

            # 4. Append to immutable AuditLog (actor='system')
            audit_entry = AuditLog(
                reconciliation_event_id=rec_event.id,
                actor="system",
                action="AUTO_CORRECT_GHOST_PAYMENT",
                detail_json=json.dumps({
                    "order_id": order_id,
                    "amount": order.amount,
                    "currency": order.currency,
                    "gateway_status": gateway_status,
                    "db_before": db_status_before,
                    "db_after": db_status_after,
                    "decision": "allowed",
                    "reason": decision.reason
                }),
                timestamp=datetime.utcnow()
            )
            db.add(audit_entry)

        else:
            # Blocked by gate — Escalate (transition out of 'pending' to prevent re-poll storm)
            order.status = "escalated"
            order.updated_at = datetime.utcnow()
            db_status_after = "escalated"
            escalated_count += 1

            # 1. Create ReconciliationEvent
            rec_event = ReconciliationEvent(
                order_id=order_id,
                gateway_status=gateway_status,
                db_status_before=db_status_before,
                gate_decision="blocked",
                gate_reason=decision.reason,
                db_status_after=db_status_after,
                created_at=datetime.utcnow()
            )
            db.add(rec_event)
            db.flush()

            # 2. Append to immutable AuditLog
            audit_entry = AuditLog(
                reconciliation_event_id=rec_event.id,
                actor="system",
                action="BLOCKED_ESCALATED",
                detail_json=json.dumps({
                    "order_id": order_id,
                    "amount": order.amount,
                    "gateway_status": gateway_status,
                    "decision": "blocked",
                    "reason": decision.reason
                }),
                timestamp=datetime.utcnow()
            )
            db.add(audit_entry)

            # 3. Insert into EscalationQueueItem if not already queued
            existing_esc = db.scalar(
                select(EscalationQueueItem)
                .where(EscalationQueueItem.order_id == order_id)
                .where(EscalationQueueItem.status == "open")
            )
            if not existing_esc:
                esc_item = EscalationQueueItem(
                    order_id=order_id,
                    reason=decision.reason,
                    status="open",
                    created_at=datetime.utcnow()
                )
                db.add(esc_item)

        # 5. Isolated LLM Explainer invocation (post-decision)
        try:
            event_dict = {
                "order_id": order_id,
                "gateway_status": gateway_status,
                "db_status_before": db_status_before,
                "gate_decision": "allowed" if decision.allowed else "blocked",
                "gate_reason": decision.reason,
                "db_status_after": db_status_after,
                "amount": order.amount,
                "currency": order.currency
            }
            explanation = explain_reconciliation_event(event_dict)
            rec_event.llm_summary = explanation.get("summary")
            rec_event.customer_message = explanation.get("customer_message")
        except Exception as e:
            logger.error(f"Error generating explanation for {order_id}: {e}")
            rec_event.llm_summary = f"Reconciliation {decision.reason}."
            rec_event.customer_message = "Your order status is being verified."

        db.commit()

        events_summary.append({
            "order_id": order_id,
            "decision": "allowed" if decision.allowed else "blocked",
            "reason": decision.reason,
            "summary": rec_event.llm_summary,
            "customer_message": rec_event.customer_message
        })

    return {
        "scanned_count": scanned_count,
        "auto_corrected_count": auto_corrected_count,
        "escalated_count": escalated_count,
        "events": events_summary
    }
