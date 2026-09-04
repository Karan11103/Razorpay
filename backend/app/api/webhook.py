import json
from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, Depends, Request, Header
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models import Order, WebhookEvent
from app.chaos import chaos_relay

router = APIRouter(prefix="/webhook", tags=["Webhook"])

@router.post("/razorpay")
async def handle_razorpay_webhook(
    request: Request,
    db: Session = Depends(get_db),
    x_razorpay_signature: str = Header(None)
):
    """
    Chaos Webhook Relay Receiver.
    
    Inspects incoming webhook and, based on configurable chaos probabilities:
    (a) delivered: Updates order status to 'captured'
    (b) dropped: Silently ignores update -> CREATES GHOST PAYMENT STATE
    (c) delayed: Simulates transport latency
    (d) corrupted: Mutates payload/signature to simulate corrupted delivery
    
    All events are logged to WebhookEvent table.
    """
    raw_body = await request.body()
    try:
        data: Dict[str, Any] = json.loads(raw_body.decode("utf-8")) if raw_body else {}
    except Exception:
        data = {}

    # Extract order_id from standard Razorpay payload or direct payload
    order_id = (
        data.get("order_id")
        or data.get("payload", {}).get("payment", {}).get("entity", {}).get("order_id")
    )
    force_action = data.get("force_chaos_action")

    # Run through Chaos Webhook Relay
    action, transformed_payload, signature_valid = chaos_relay.process_payload(
        data,
        force_action=force_action
    )

    # Log to WebhookEvent table
    webhook_log = WebhookEvent(
        order_id=order_id,
        payload=json.dumps(transformed_payload),
        status=action,
        delivered_at=datetime.utcnow()
    )
    db.add(webhook_log)

    order_updated = False
    if action == "delivered" and signature_valid and order_id:
        # Normal delivery: update merchant DB to captured
        order = db.scalar(select(Order).where(Order.id == order_id))
        if order and order.status == "pending":
            order.status = "captured"
            order.updated_at = datetime.utcnow()
            order_updated = True

    elif action == "dropped":
        # Silent drop creates ghost payment!
        # Do not update Order status; order remains 'pending' while gateway is 'captured'.
        pass

    elif action == "corrupted":
        # Corrupted payload: validation failure
        pass

    db.commit()

    return {
        "status": "success" if action == "delivered" else action,
        "chaos_action": action,
        "order_id": order_id,
        "order_state_updated": order_updated,
        "message": (
            "Webhook delivered normally." if action == "delivered"
            else "CHAOS: Webhook dropped silently (Ghost Payment state created)." if action == "dropped"
            else f"CHAOS: Webhook delayed by {transformed_payload.get('simulated_delay_seconds', 30)}s." if action == "delayed"
            else "CHAOS: Webhook payload corrupted (Signature verification will fail)."
        )
    }
