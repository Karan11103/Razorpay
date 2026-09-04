from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, select

from app.database import get_db
from app.models import Order, ReconciliationEvent, EscalationQueueItem
from app.schemas import DashboardStats, ReconciliationEventResponse

router = APIRouter(tags=["Dashboard"])

@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Computes real-time dashboard aggregates using indexed SQL queries.
    Complexity: O(log N) via indexed B-tree lookups — no full-table scans or in-memory loops.
    """
    # 1. Corrected Ghost Payments count and ₹ recovered (indexed on status)
    ghost_stats = db.execute(
        select(
            func.count(Order.id),
            func.coalesce(func.sum(Order.amount), 0)
        ).where(Order.status == "corrected")
    ).one()
    ghost_count = ghost_stats[0]
    ghost_rupees = ghost_stats[1] / 100.0

    # 2. Gate Decision counts (allowed vs blocked)
    decision_stats = db.execute(
        select(
            func.count(ReconciliationEvent.id).filter(ReconciliationEvent.gate_decision == "allowed"),
            func.count(ReconciliationEvent.id).filter(ReconciliationEvent.gate_decision == "blocked")
        )
    ).one()
    auto_corrected = decision_stats[0]
    escalated = decision_stats[1]
    total_reconciled = auto_corrected + escalated

    # 3. Active pending orders count
    pending_count = db.scalar(
        select(func.count(Order.id)).where(Order.status == "pending")
    ) or 0

    # 4. Average detection latency in seconds
    # In SQLite, julianday computes days; multiplying by 86400 gives seconds
    latency_query = db.execute(
        select(
            func.coalesce(
                func.avg(
                    (func.julianday(ReconciliationEvent.created_at) - func.julianday(Order.created_at)) * 86400.0
                ),
                0.0
            )
        )
        .select_from(ReconciliationEvent)
        .join(Order, ReconciliationEvent.order_id == Order.id)
    ).scalar() or 0.0

    avg_latency = max(0.0, round(float(latency_query), 1))

    return DashboardStats(
        ghost_payments_caught_count=ghost_count,
        ghost_payments_caught_rupees=round(ghost_rupees, 2),
        auto_corrected_count=auto_corrected,
        escalated_count=escalated,
        total_reconciled=total_reconciled,
        avg_detection_latency_seconds=avg_latency,
        active_pending_count=pending_count
    )

@router.get("/events/recent")
def get_recent_reconciliation_events(limit: int = 20, db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """
    Returns recent reconciliation events for live dashboard stream.
    Complexity: O(log N + K) using index on created_at.
    """
    events = db.execute(
        select(
            ReconciliationEvent,
            Order.amount,
            Order.currency
        )
        .join(Order, ReconciliationEvent.order_id == Order.id)
        .order_by(ReconciliationEvent.created_at.desc())
        .limit(limit)
    ).all()

    result = []
    for rec, amount, currency in events:
        result.append({
            "id": rec.id,
            "order_id": rec.order_id,
            "amount": amount,
            "amount_in_rupees": (amount or 0) / 100.0,
            "currency": currency,
            "gateway_status": rec.gateway_status,
            "db_status_before": rec.db_status_before,
            "gate_decision": rec.gate_decision,
            "gate_reason": rec.gate_reason,
            "db_status_after": rec.db_status_after,
            "llm_summary": rec.llm_summary,
            "customer_message": rec.customer_message,
            "created_at": rec.created_at.isoformat()
        })
    return result
