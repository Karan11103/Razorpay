from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, ConfigDict

# Gate Decision
class Decision(BaseModel):
    allowed: bool
    reason: str

# Order schemas
class OrderCreate(BaseModel):
    amount: int = Field(..., description="Amount in paise (e.g. 50000 = ₹500.00)", gt=0)
    currency: str = Field("INR", max_length=3)

class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    amount: int
    amount_in_rupees: float
    currency: str
    status: str
    created_at: datetime
    updated_at: datetime

# Webhook payload & simulation
class WebhookSimulatePayload(BaseModel):
    order_id: str
    payment_id: Optional[str] = None
    amount: Optional[int] = None
    status: Optional[str] = "captured"
    force_chaos_action: Optional[str] = None  # "drop", "delay", "corrupt", "deliver" or None for probabilistic

# Chaos Config
class ChaosConfig(BaseModel):
    drop_rate: float = Field(..., ge=0.0, le=1.0)
    delay_rate: float = Field(..., ge=0.0, le=1.0)
    corrupt_rate: float = Field(..., ge=0.0, le=1.0)

class ChaosConfigResponse(ChaosConfig):
    pass_rate: float

# Reconciliation Event
class ReconciliationEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: str
    gateway_status: str
    db_status_before: str
    gate_decision: str
    gate_reason: str
    db_status_after: str
    llm_summary: Optional[str] = None
    customer_message: Optional[str] = None
    created_at: datetime

# Audit Log
class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reconciliation_event_id: Optional[int] = None
    actor: str
    action: str
    detail_json: str
    timestamp: datetime

# Escalation Queue
class EscalationItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: str
    reason: str
    status: str
    assigned_to: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    order_amount: Optional[float] = None
    llm_summary: Optional[str] = None
    customer_message: Optional[str] = None

# Dashboard Stats
class DashboardStats(BaseModel):
    ghost_payments_caught_count: int
    ghost_payments_caught_rupees: float
    auto_corrected_count: int
    escalated_count: int
    total_reconciled: int
    avg_detection_latency_seconds: float
    active_pending_count: int

# Reconcile Batch Result
class ReconcileBatchResult(BaseModel):
    scanned_count: int
    auto_corrected_count: int
    escalated_count: int
    events: List[Dict[str, Any]]
