from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.poller import reconcile_pending_orders
from app.chaos import chaos_relay
from app.schemas import ChaosConfig, ChaosConfigResponse

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.post("/reconcile-now")
def trigger_immediate_reconciliation(cutoff_seconds: int = 0, db: Session = Depends(get_db)):
    """
    Manually triggers the reconciliation poller immediately.
    Defaults to cutoff_seconds=0 for snappy live demonstrations.
    """
    result = reconcile_pending_orders(db, cutoff_seconds=cutoff_seconds)
    return {
        "status": "success",
        "message": f"Reconciliation batch complete. Scanned: {result['scanned_count']}, Auto-corrected: {result['auto_corrected_count']}, Escalated: {result['escalated_count']}",
        "data": result
    }

@router.post("/chaos-config", response_model=ChaosConfigResponse)
def update_chaos_config(config: ChaosConfig):
    """Updates simulation chaos probabilities in real time."""
    chaos_relay.set_probabilities(
        drop_rate=config.drop_rate,
        delay_rate=config.delay_rate,
        corrupt_rate=config.corrupt_rate
    )
    return {
        "drop_rate": chaos_relay.drop_rate,
        "delay_rate": chaos_relay.delay_rate,
        "corrupt_rate": chaos_relay.corrupt_rate,
        "pass_rate": chaos_relay.pass_rate
    }

@router.get("/chaos-config", response_model=ChaosConfigResponse)
def get_chaos_config():
    """Retrieves current chaos simulation probabilities."""
    return {
        "drop_rate": chaos_relay.drop_rate,
        "delay_rate": chaos_relay.delay_rate,
        "corrupt_rate": chaos_relay.corrupt_rate,
        "pass_rate": chaos_relay.pass_rate
    }
