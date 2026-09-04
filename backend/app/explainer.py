import json
import logging
from typing import Dict, Any
from app.config import settings

logger = logging.getLogger("explainer")

EXPLAINER_SYSTEM_PROMPT = """You are an incident explanation assistant for a high-volume payment infrastructure gateway.
Your job is to read a structured reconciliation event and output an incident summary for the merchant engineering team and a courteous message for the customer.

RULES:
1. You NEVER make financial decisions or state modifications.
2. Output strictly valid JSON matching this schema:
{
  "summary": "Brief 1-2 sentence engineering explanation of the discrepancy and gate resolution",
  "customer_message": "Courteous, reassuring customer update explaining order status"
}
3. Do not include markdown ticks, backticks, or preamble. Return only raw JSON.
"""

def generate_fallback_explanation(event: Dict[str, Any]) -> Dict[str, str]:
    """Deterministic fallback templates guaranteeing pipeline never crashes on LLM errors or missing API key."""
    order_id = event.get("order_id", "Unknown")
    decision = event.get("gate_decision", "allowed")
    gateway_status = event.get("gateway_status", "unknown")
    reason = event.get("gate_reason", "")
    amount_rupees = event.get("amount", 0) / 100.0 if "amount" in event else 0.0

    if decision == "allowed":
        summary = (
            f"Ghost payment detected for order {order_id} (₹{amount_rupees:.2f}). Gateway reported '{gateway_status}' "
            f"while merchant DB was stale. Gate verified signature and exact amount. Safely auto-corrected to completed."
        )
        customer_msg = (
            f"Good news! Your payment of ₹{amount_rupees:.2f} for order #{order_id[-8:]} was successfully verified with the bank. "
            f"Your order is confirmed and will be processed immediately."
        )
    else:
        summary = (
            f"Reconciliation blocked for order {order_id}. Gate stopped automatic correction due to: {reason}. "
            f"Escalated to merchant operations queue for manual review."
        )
        customer_msg = (
            f"We noticed an unexpected status during payment verification for order #{order_id[-8:]}. "
            f"Our operations team is actively reviewing your order to ensure everything is resolved quickly."
        )

    return {"summary": summary, "customer_message": customer_msg}

def explain_reconciliation_event(event_data: Dict[str, Any]) -> Dict[str, str]:
    """
    LLM Explainer module.
    Takes a structured ReconciliationEvent JSON and produces:
    { "summary": str, "customer_message": str }
    
    GUARANTEES:
    - Never modifies database state or Order status.
    - Never participates in gating or money movement.
    - Retries once on invalid JSON, then safely falls back to template.
    """
    api_key = settings.ANTHROPIC_API_KEY
    if not api_key or api_key.strip() == "":
        # Graceful, immediate fallback when Anthropic API key is not configured
        return generate_fallback_explanation(event_data)

    import anthropic
    client = anthropic.Anthropic(api_key=api_key)

    user_content = (
        f"Generate incident explanation for the following reconciliation event:\n"
        f"{json.dumps(event_data, indent=2)}"
    )

    # Attempt 1
    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=400,
            system=EXPLAINER_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_content}]
        )
        text = response.content[0].text.strip()
        parsed = json.loads(text)
        if "summary" in parsed and "customer_message" in parsed:
            return parsed
    except Exception as e:
        logger.warning(f"LLM Attempt 1 failed or returned invalid JSON: {e}")

    # Retry once with stricter instruction
    try:
        retry_prompt = (
            "CRITICAL: Output ONLY raw JSON with keys 'summary' and 'customer_message'. "
            "No markdown, no commentary:\n" + user_content
        )
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=400,
            system=EXPLAINER_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": retry_prompt}]
        )
        text = response.content[0].text.strip()
        # Strip potential code fences if returned
        if text.startswith("```"):
            lines = text.splitlines()
            text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
        parsed = json.loads(text)
        if "summary" in parsed and "customer_message" in parsed:
            return parsed
    except Exception as e:
        logger.warning(f"LLM Attempt 2 failed: {e}. Reverting to fallback template.")

    # Ultimate safe fallback
    return generate_fallback_explanation(event_data)
