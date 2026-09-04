from typing import Optional, Callable
from app.schemas import Decision

def reconciliation_gate(
    order,
    gateway_status: str,
    gateway_signature_valid: bool,
    gateway_amount: int,
    already_corrected_fn: Optional[Callable[[str], bool]] = None,
    is_already_corrected: Optional[bool] = None
) -> Decision:
    """
    Deterministic Gate Function for Payment Reconciliation.
    
    CRITICAL INVARIANT: The LLM is NEVER called before this gate.
    All money-affecting decisions are deterministic, safe, and bounded.
    
    Time Complexity: O(1) — fixed 5-stage sequential verification.
    Space Complexity: O(1) — no historical buffer or memory allocation.
    
    Rules:
    1. Idempotency guard — never double-correct an order.
    2. Unambiguous gateway confirmation — gateway status MUST be 'captured'.
    3. Payload integrity — signature must be authentic and amount must match exactly.
    4. Terminal state guard — never alter orders that are refunded, disputed, or charged back.
    5. Safe auto-correction approved.
    """
    order_id = getattr(order, "id", str(order))
    order_amount = getattr(order, "amount", None)
    order_status = getattr(order, "status", None)

    # 1. Idempotency — never correct twice (O(1) lookup)
    has_corrected = False
    if is_already_corrected is not None:
        has_corrected = is_already_corrected
    elif already_corrected_fn is not None:
        has_corrected = already_corrected_fn(order_id)
    elif order_status == "corrected":
        has_corrected = True

    if has_corrected:
        return Decision(
            allowed=False,
            reason="Already corrected — idempotency guard"
        )

    # 2. Only act on unambiguous success signal
    if gateway_status != "captured":
        return Decision(
            allowed=False,
            reason=f"Gateway status is {gateway_status}, not captured — no action"
        )

    # 3. Signature & amount integrity check — never trust unverified or mismatched payloads
    if not gateway_signature_valid:
        return Decision(
            allowed=False,
            reason="Signature verification failed — escalate, do not auto-correct"
        )

    if gateway_amount != order_amount:
        return Decision(
            allowed=False,
            reason=f"Amount mismatch (gateway: {gateway_amount}, db: {order_amount}) — escalate, possible fraud/error"
        )

    # 4. Never touch orders already in a terminal dispute/refund state
    if order_status in ("refunded", "disputed", "charged_back"):
        return Decision(
            allowed=False,
            reason=f"Order in terminal state {order_status} — escalate"
        )

    # 5. All checks passed — safe, bounded correction
    return Decision(
        allowed=True,
        reason="Gateway confirms captured, signature valid, amount matches, no dispute"
    )
