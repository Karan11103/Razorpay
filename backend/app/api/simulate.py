from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models import Order
from app.schemas import OrderCreate, OrderResponse
from app.razorpay_client import gateway_client

router = APIRouter(prefix="/simulate", tags=["Simulation"])

@router.post("/checkout", response_model=OrderResponse)
def simulate_checkout(payload: OrderCreate, db: Session = Depends(get_db)):
    """
    Creates a new checkout session.
    1. Generates an order on Razorpay Test API (or mock test harness).
    2. Persists the order in the merchant DB with status 'pending'.
    """
    try:
        # Create test order in Razorpay
        rzp_order = gateway_client.create_order(
            amount=payload.amount,
            currency=payload.currency
        )
        order_id = rzp_order["id"]

        order = Order(
            id=order_id,
            amount=payload.amount,
            currency=payload.currency,
            status="pending",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(order)
        db.commit()
        db.refresh(order)

        return order
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Checkout simulation failed: {str(e)}")
