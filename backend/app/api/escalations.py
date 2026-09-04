import json
from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models import EscalationQueueItem, ReconciliationEvent, AuditLog, Order
from app.schemas import EscalationItemResponse

router = APIRouter(prefix="/escalations", tags=["Escalations"])

@router.get("", response_model=List[EscalationItemResponse])
def get_open_escalations(db: Session = Depends(get_db)):
    """
    Retrieves all open escalation items requiring human merchant operations review.
    """
    items = db.scalars(
        select(EscalationQueueItem)
        .where(EscalationQueueItem.status == "open")
        .order_by(EscalationQueueItem.created_at.desc())
    ).all()

    response = []
    for item in items:
        # Retrieve latest reconciliation event for this order to pull LLM summaries
        rec_event = db.scalars(
            select(ReconciliationEvent)
            .where(ReconciliationEvent.order_id == item.order_id)
            .order_by(ReconciliationEvent.created_at.desc())
        ).first()

        order = db.scalar(select(Order).where(Order.id == item.order_id))

        response.append(EscalationItemResponse(
            id=item.id,
            order_id=item.order_id,
            reason=item.reason,
            status=item.status,
            assigned_to=item.assigned_to,
            created_at=item.created_at,
            resolved_at=item.resolved_at,
            order_amount=order.amount_in_rupees if order else None,
            llm_summary=rec_event.llm_summary if rec_event else None,
            customer_message=rec_event.customer_message if rec_event else None
        ))

    return response

@router.post("/{escalation_id}/resolve")
def resolve_escalation(
    escalation_id: int,
    notes: str = "Resolved by merchant operations",
    db: Session = Depends(get_db)
):
    """
    Marks an escalated item as resolved.
    Appends an immutable entry to AuditLog with actor='human'.
    """
    item = db.scalar(select(EscalationQueueItem).where(EscalationQueueItem.id == escalation_id))
    if not item:
        raise HTTPException(status_code=404, detail="Escalation item not found")

    item.status = "resolved"
    item.resolved_at = datetime.utcnow()

    # Append to AuditLog
    audit_entry = AuditLog(
        actor="human",
        action="MANUAL_ESCALATION_RESOLVED",
        detail_json=json.dumps({
            "escalation_id": escalation_id,
            "order_id": item.order_id,
            "reason": item.reason,
            "resolution_notes": notes
        }),
        timestamp=datetime.utcnow()
    )
    db.add(audit_entry)
    db.commit()

    return {
        "status": "success",
        "message": f"Escalation #{escalation_id} for order {item.order_id} marked as resolved."
    }
