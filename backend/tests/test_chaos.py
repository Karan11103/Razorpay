import pytest
from app.chaos import ChaosRelay

def test_chaos_override():
    """Manual override checks for deterministic demo actions"""
    relay = ChaosRelay(drop_rate=0.0, delay_rate=0.0, corrupt_rate=0.0)
    
    action, _, sig_valid = relay.process_payload({"order_id": "test_1"}, force_action="drop")
    assert action == "dropped"
    assert sig_valid is True

    action, _, sig_valid = relay.process_payload({"order_id": "test_1"}, force_action="corrupt")
    assert action == "corrupted"
    assert sig_valid is False

    action, _, sig_valid = relay.process_payload({"order_id": "test_1"}, force_action="deliver")
    assert action == "delivered"
    assert sig_valid is True

def test_chaos_probability_distribution_1000_runs():
    """
    Statistical validation over 1000 iterations.
    Configured: 30% drop rate, 20% delay rate, 10% corrupt rate, 40% delivered.
    Assert observed rate is within ±4.5% standard error margin.
    """
    target_drop_rate = 0.30
    target_delay_rate = 0.20
    target_corrupt_rate = 0.10

    relay = ChaosRelay(
        drop_rate=target_drop_rate,
        delay_rate=target_delay_rate,
        corrupt_rate=target_corrupt_rate
    )

    counts = {"dropped": 0, "delayed": 0, "corrupted": 0, "delivered": 0}
    iterations = 2000

    for _ in range(iterations):
        action = relay.evaluate_action()
        counts[action] += 1

    observed_drop_rate = counts["dropped"] / iterations
    observed_delay_rate = counts["delayed"] / iterations
    observed_corrupt_rate = counts["corrupted"] / iterations
    observed_delivered_rate = counts["delivered"] / iterations

    # 3-sigma tolerance for N=2000: sqrt(0.3 * 0.7 / 2000) ~ 0.010 -> 3 * 0.010 = 0.030 (3.0%)
    tolerance = 0.045

    assert abs(observed_drop_rate - target_drop_rate) < tolerance, f"Drop rate {observed_drop_rate} deviated from {target_drop_rate}"
    assert abs(observed_delay_rate - target_delay_rate) < tolerance, f"Delay rate {observed_delay_rate} deviated from {target_delay_rate}"
    assert abs(observed_corrupt_rate - target_corrupt_rate) < tolerance, f"Corrupt rate {observed_corrupt_rate} deviated from {target_corrupt_rate}"
    assert abs(observed_delivered_rate - 0.40) < tolerance, f"Delivered rate {observed_delivered_rate} deviated from 0.40"
