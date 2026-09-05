import json
from unittest.mock import patch, MagicMock
from app.explainer import explain_reconciliation_event, generate_fallback_explanation
from app.config import settings

def test_fallback_explanation_allowed():
    event = {
        "order_id": "order_test_123",
        "gate_decision": "allowed",
        "gateway_status": "captured",
        "gate_reason": "Gateway confirms captured, signature valid, amount matches",
        "amount": 250000
    }
    result = generate_fallback_explanation(event)
    assert "summary" in result
    assert "customer_message" in result
    assert "order_test_123" in result["summary"]
    assert "2500.00" in result["summary"]

def test_fallback_explanation_blocked():
    event = {
        "order_id": "order_test_456",
        "gate_decision": "blocked",
        "gateway_status": "failed",
        "gate_reason": "Gateway status is failed",
        "amount": 100000
    }
    result = generate_fallback_explanation(event)
    assert "summary" in result
    assert "customer_message" in result
    assert "order_test_456" in result["summary"]
    assert "blocked" in result["summary"]

def test_explainer_falls_back_when_no_key():
    event = {
        "order_id": "order_test_789",
        "gate_decision": "allowed",
        "gateway_status": "captured",
        "gate_reason": "Gateway confirms captured",
        "amount": 50000
    }
    with patch.object(settings, "GROQ_API_KEY", "your_groq_api_key_here"), \
         patch.object(settings, "ANTHROPIC_API_KEY", ""):
        result = explain_reconciliation_event(event)
        assert "summary" in result
        assert "customer_message" in result
        assert "order_test_789" in result["summary"]

def test_explainer_groq_success():
    event = {
        "order_id": "order_test_groq",
        "gate_decision": "allowed",
        "gateway_status": "captured",
        "gate_reason": "Gateway confirms captured",
        "amount": 150000
    }

    mock_resp = MagicMock()
    mock_resp.raise_for_status.return_value = None
    mock_resp.json.return_value = {
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": json.dumps({
                        "summary": "Groq verified payment was captured on gateway and safely auto-corrected.",
                        "customer_message": "Your payment has been successfully verified! Thank you."
                    })
                }
            }
        ]
    }

    with patch.object(settings, "GROQ_API_KEY", "gsk-valid-test-key"), \
         patch("httpx.Client") as mock_client:
        mock_instance = MagicMock()
        mock_instance.__enter__.return_value = mock_instance
        mock_instance.post.return_value = mock_resp
        mock_client.return_value = mock_instance

        result = explain_reconciliation_event(event)
        assert result["summary"] == "Groq verified payment was captured on gateway and safely auto-corrected."
        assert "Thank you" in result["customer_message"]

