import random
from typing import Tuple, Dict, Any, Optional
from app.config import settings

class ChaosRelay:
    """
    Chaos Webhook Relay Engine.
    Configurable probabilities for:
    - drop_rate: silently drops incoming webhook (creates ghost payment state)
    - delay_rate: delays processing
    - corrupt_rate: mutates signature/payload to simulate corrupted delivery
    - remainder: delivered normally
    """
    def __init__(
        self,
        drop_rate: float = settings.DEFAULT_DROP_RATE,
        delay_rate: float = settings.DEFAULT_DELAY_RATE,
        corrupt_rate: float = settings.DEFAULT_CORRUPT_RATE
    ):
        self.set_probabilities(drop_rate, delay_rate, corrupt_rate)

    def set_probabilities(self, drop_rate: float, delay_rate: float, corrupt_rate: float):
        total = drop_rate + delay_rate + corrupt_rate
        if total > 1.0:
            # Normalize if sum exceeds 1.0
            self.drop_rate = drop_rate / total
            self.delay_rate = delay_rate / total
            self.corrupt_rate = corrupt_rate / total
        else:
            self.drop_rate = max(0.0, min(1.0, drop_rate))
            self.delay_rate = max(0.0, min(1.0, delay_rate))
            self.corrupt_rate = max(0.0, min(1.0, corrupt_rate))

    @property
    def pass_rate(self) -> float:
        return max(0.0, 1.0 - (self.drop_rate + self.delay_rate + self.corrupt_rate))

    def evaluate_action(self, force_action: Optional[str] = None) -> str:
        """
        Determines action: 'dropped', 'delayed', 'corrupted', or 'delivered'.
        Supports manual overrides for pitch demo reproducibility.
        """
        if force_action in ("dropped", "drop"):
            return "dropped"
        if force_action in ("delayed", "delay"):
            return "delayed"
        if force_action in ("corrupted", "corrupt"):
            return "corrupted"
        if force_action in ("delivered", "deliver", "normal"):
            return "delivered"

        roll = random.random()
        if roll < self.drop_rate:
            return "dropped"
        elif roll < self.drop_rate + self.delay_rate:
            return "delayed"
        elif roll < self.drop_rate + self.delay_rate + self.corrupt_rate:
            return "corrupted"
        else:
            return "delivered"

    def process_payload(
        self,
        payload: Dict[str, Any],
        force_action: Optional[str] = None
    ) -> Tuple[str, Dict[str, Any], bool]:
        """
        Applies chaos action to incoming webhook payload.
        Returns:
            (action, transformed_payload, signature_valid)
        """
        action = self.evaluate_action(force_action)
        processed = dict(payload)

        if action == "corrupted":
            # Mutate payload signature and amount to simulate corrupted transit
            processed["payment_signature"] = "tampered_corrupt_signature_xyz"
            processed["corrupted"] = True
            # Also mutate payload amount to trigger validation mismatch
            if "amount" in processed:
                processed["amount"] = processed["amount"] + 9999
            return action, processed, False

        elif action == "dropped":
            # Silent drop — no delivery to order DB
            return action, processed, True

        elif action == "delayed":
            # Delayed delivery simulation flag
            processed["simulated_delay_seconds"] = random.randint(30, 300)
            return action, processed, True

        else:
            # Normal delivered webhook
            return "delivered", processed, True

chaos_relay = ChaosRelay()
