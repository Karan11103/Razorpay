from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Index, Float
from sqlalchemy.orm import relationship
from app.database import Base

class Order(Base):
    """
    Merchant Order DB — source of truth for merchant state.
    Indexed on (status, created_at) to ensure O(1) seek for pending reconciliation poll.
    """
    __tablename__ = "orders"

    id = Column(String(64), primary_key=True, index=True)
    amount = Column(Integer, nullable=False)  # in paise (e.g. 50000 = ₹500.00)
    currency = Column(String(8), default="INR", nullable=False)
    status = Column(String(32), default="pending", nullable=False)  # pending | captured | failed | corrected | refunded | disputed
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    webhook_events = relationship("WebhookEvent", back_populates="order", cascade="all, delete-orphan")
    reconciliation_events = relationship("ReconciliationEvent", back_populates="order", cascade="all, delete-orphan")
    escalations = relationship("EscalationQueueItem", back_populates="order", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_orders_status_created_at", "status", "created_at"),
    )

    @property
    def amount_in_rupees(self) -> float:
        return self.amount / 100.0


class Correction(Base):
    """
    Dedicated table providing O(1) idempotency guard.
    Primary key constraint on order_id ensures an order can NEVER be double-corrected.
    """
    __tablename__ = "corrections"

    order_id = Column(String(64), primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class WebhookEvent(Base):
    """
    Log of every webhook received/injected by the Chaos Webhook Relay.
    Status indicates whether the webhook was delivered, dropped, delayed, or corrupted.
    """
    __tablename__ = "webhook_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(String(64), ForeignKey("orders.id"), nullable=True, index=True)
    payload = Column(Text, nullable=False)
    status = Column(String(32), nullable=False)  # delivered | dropped | delayed | corrupted
    delivered_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    order = relationship("Order", back_populates="webhook_events")


class ReconciliationEvent(Base):
    """
    Record of every reconciliation evaluation performed by the Poller & Gate.
    Stores gateway status, before/after states, gate decision and reason,
    as well as the asynchronously attached LLM explanation.
    """
    __tablename__ = "reconciliation_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(String(64), ForeignKey("orders.id"), nullable=False, index=True)
    gateway_status = Column(String(32), nullable=False)
    db_status_before = Column(String(32), nullable=False)
    gate_decision = Column(String(16), nullable=False)  # allowed | blocked
    gate_reason = Column(Text, nullable=False)
    db_status_after = Column(String(32), nullable=False)
    llm_summary = Column(Text, nullable=True)
    customer_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    order = relationship("Order", back_populates="reconciliation_events")
    audit_logs = relationship("AuditLog", back_populates="reconciliation_event")


class AuditLog(Base):
    """
    Append-only immutable audit trail for compliance and full financial traceability.
    Every state change or gate blockage is permanently recorded.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    reconciliation_event_id = Column(Integer, ForeignKey("reconciliation_events.id"), nullable=True, index=True)
    actor = Column(String(32), default="system", nullable=False)  # system | llm | human
    action = Column(String(64), nullable=False)
    detail_json = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    reconciliation_event = relationship("ReconciliationEvent", back_populates="audit_logs")


class EscalationQueueItem(Base):
    """
    Queue of orders where auto-correction was safely blocked by the gate function
    and escalated for human merchant review.
    """
    __tablename__ = "escalation_queue"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(String(64), ForeignKey("orders.id"), nullable=False, index=True)
    reason = Column(Text, nullable=False)
    status = Column(String(16), default="open", nullable=False)  # open | resolved
    assigned_to = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    order = relationship("Order", back_populates="escalations")

    __table_args__ = (
        Index("ix_escalation_status_created_at", "status", "created_at"),
    )
