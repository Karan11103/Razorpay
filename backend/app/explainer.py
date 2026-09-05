import json
import logging
from typing import Dict, Any, Optional
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

def _clean_json_text(text: str) -> str:
    """Helper to strip markdown code blocks from LLM output."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text


def _call_groq_api(api_key: str, event_data: Dict[str, Any]) -> Optional[Dict[str, str]]:
    """Calls Groq LPU (OpenAI-compatible) using httpx."""
    import httpx

    user_content = (
        f"Generate incident explanation for the following reconciliation event:\n"
        f"{json.dumps(event_data, indent=2)}"
    )

    url = f"{settings.GROQ_API_BASE.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # Attempt 1: with json_object response_format
    try:
        payload = {
            "model": settings.GROQ_MODEL or "groq/compound-mini",
            "messages": [
                {"role": "system", "content": EXPLAINER_SYSTEM_PROMPT},
                {"role": "user", "content": user_content}
            ],
            "temperature": 0.1,
            "max_tokens": 400,
            "response_format": {"type": "json_object"}
        }
        with httpx.Client(timeout=12.0) as client:
            resp = client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["choices"][0]["message"]["content"]
            clean_text = _clean_json_text(raw_text)
            parsed = json.loads(clean_text)
            if "summary" in parsed and "customer_message" in parsed:
                return {
                    "summary": str(parsed["summary"]),
                    "customer_message": str(parsed["customer_message"])
                }
    except Exception as e:
        logger.warning(f"Groq API Attempt 1 failed: {e}")

    # Retry once without response_format constraint
    try:
        retry_prompt = (
            "CRITICAL: Output ONLY raw JSON matching schema:\n"
            '{"summary": "...", "customer_message": "..."}\n'
            "No markdown ticks, no commentary.\n" + user_content
        )
        payload = {
            "model": settings.GROQ_MODEL or "groq/compound-mini",
            "messages": [
                {"role": "system", "content": EXPLAINER_SYSTEM_PROMPT},
                {"role": "user", "content": retry_prompt}
            ],
            "temperature": 0.1,
            "max_tokens": 400
        }
        with httpx.Client(timeout=12.0) as client:
            resp = client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["choices"][0]["message"]["content"]
            clean_text = _clean_json_text(raw_text)
            parsed = json.loads(clean_text)
            if "summary" in parsed and "customer_message" in parsed:
                return {
                    "summary": str(parsed["summary"]),
                    "customer_message": str(parsed["customer_message"])
                }
    except Exception as e:
        logger.warning(f"Groq API Retry failed: {e}")

    return None


def explain_reconciliation_event(event_data: Dict[str, Any]) -> Dict[str, str]:
    """
    AI Explainer module (powered by Groq / LPU).
    Takes a structured ReconciliationEvent JSON and produces:
    { "summary": str, "customer_message": str }
    
    GUARANTEES:
    - Never modifies database state or Order status.
    - Never participates in gating or money movement.
    - Retries on invalid response, then safely falls back to template.
    """
    placeholder_tokens = ["your_", "placeholder", "your_groq", "your_grok", "your_anthropic", "xxx", "key_here"]

    # 1. Primary AI Provider: Groq API
    groq_key = (settings.GROQ_API_KEY or "").strip()
    if groq_key and not any(p in groq_key.lower() for p in placeholder_tokens):
        result = _call_groq_api(groq_key, event_data)
        if result:
            return result

    # 2. Optional Fallback Provider: Anthropic Claude (if configured)
    anthropic_key = (settings.ANTHROPIC_API_KEY or "").strip()
    if anthropic_key and not any(p in anthropic_key.lower() for p in placeholder_tokens):
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=anthropic_key)
            user_content = (
                f"Generate incident explanation for the following reconciliation event:\n"
                f"{json.dumps(event_data, indent=2)}"
            )
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=400,
                system=EXPLAINER_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_content}]
            )
            text = _clean_json_text(response.content[0].text)
            parsed = json.loads(text)
            if "summary" in parsed and "customer_message" in parsed:
                return parsed
        except Exception as e:
            logger.warning(f"Fallback Anthropic call failed: {e}")

    # 3. Ultimate Safe Fallback: Deterministic Template Engine
    return generate_fallback_explanation(event_data)
