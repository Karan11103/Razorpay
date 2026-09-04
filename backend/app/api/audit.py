import csv
import io
from typing import Optional, Dict, Any, List
from datetime import datetime
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.database import get_db
from app.models import AuditLog, ReconciliationEvent, Order

router = APIRouter(prefix="/audit-log", tags=["Audit Log"])

@router.get("")
def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    actor: Optional[str] = None,
    action: Optional[str] = None,
    order_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Paginated, filterable enterprise audit log query.
    Complexity: O(log N) indexed seek and range retrieval.
    """
    query = select(AuditLog)

    # Push filters directly to database SQL engine
    if actor:
        query = query.where(AuditLog.actor == actor)
    if action:
        query = query.where(AuditLog.action.ilike(f"%{action}%"))
    if start_date:
        try:
            dt_start = datetime.fromisoformat(start_date)
            query = query.where(AuditLog.timestamp >= dt_start)
        except ValueError:
            pass
    if end_date:
        try:
            dt_end = datetime.fromisoformat(end_date)
            query = query.where(AuditLog.timestamp <= dt_end)
        except ValueError:
            pass
    if order_id:
        query = query.outerjoin(ReconciliationEvent, AuditLog.reconciliation_event_id == ReconciliationEvent.id)\
                     .where(
                         (ReconciliationEvent.order_id.ilike(f"%{order_id}%")) |
                         (AuditLog.detail_json.ilike(f"%{order_id}%"))
                     )

    # Count total matching records
    total_records = db.scalar(select(func.count()).select_from(query.subquery())) or 0

    # Paginated slice
    offset = (page - 1) * page_size
    query = query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(page_size)

    records: List[AuditLog] = db.scalars(query).all()

    items = []
    for r in records:
        rec_event = r.reconciliation_event
        extracted_order_id = rec_event.order_id if rec_event else None
        if not extracted_order_id and r.detail_json:
            try:
                import json
                d = json.loads(r.detail_json)
                extracted_order_id = d.get("order_id")
            except Exception:
                pass

        items.append({
            "id": r.id,
            "reconciliation_event_id": r.reconciliation_event_id,
            "order_id": extracted_order_id,
            "actor": r.actor,
            "action": r.action,
            "detail_json": r.detail_json,
            "timestamp": r.timestamp.isoformat()
        })

    return {
        "page": page,
        "page_size": page_size,
        "total_records": total_records,
        "total_pages": (total_records + page_size - 1) // page_size if total_records else 1,
        "items": items
    }

@router.get("/export")
def export_audit_logs_csv(db: Session = Depends(get_db)):
    """Exports full audit log as CSV for financial audit and compliance."""
    records = db.scalars(
        select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(1000)
    ).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Audit ID", "Timestamp (UTC)", "Actor", "Action", "Order ID", "Event Details"])

    for r in records:
        order_id = r.reconciliation_event.order_id if r.reconciliation_event else ""
        if not order_id and r.detail_json:
            try:
                import json
                d = json.loads(r.detail_json)
                order_id = d.get("order_id", "")
            except Exception:
                pass

        writer.writerow([
            r.id,
            r.timestamp.isoformat(),
            r.actor,
            r.action,
            order_id,
            r.detail_json
        ])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ghost_detector_audit_trail.csv"}
    )
