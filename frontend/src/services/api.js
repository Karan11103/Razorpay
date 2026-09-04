const API_BASE = '/api';

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/dashboard/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchRecentEvents() {
  const res = await fetch(`${API_BASE}/events/recent?limit=15`);
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

export async function fetchAuditLogs(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/audit-log?${query}`);
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

export function getAuditExportUrl() {
  return `${API_BASE}/audit-log/export`;
}

export async function fetchEscalations() {
  const res = await fetch(`${API_BASE}/escalations`);
  if (!res.ok) throw new Error('Failed to fetch escalations');
  return res.json();
}

export async function resolveEscalation(id, notes = 'Resolved by merchant operations') {
  const res = await fetch(`${API_BASE}/escalations/${id}/resolve?notes=${encodeURIComponent(notes)}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to resolve escalation');
  return res.json();
}

export async function fetchChaosConfig() {
  const res = await fetch(`${API_BASE}/admin/chaos-config`);
  if (!res.ok) throw new Error('Failed to fetch chaos config');
  return res.json();
}

export async function updateChaosConfig(config) {
  const res = await fetch(`${API_BASE}/admin/chaos-config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error('Failed to update chaos config');
  return res.json();
}

export async function simulateCheckout(amount = 49900, currency = 'INR') {
  const res = await fetch(`${API_BASE}/simulate/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, currency })
  });
  if (!res.ok) throw new Error('Failed to simulate checkout');
  return res.json();
}

export async function simulateWebhook(orderId, forceAction = null) {
  const res = await fetch(`${API_BASE}/webhook/razorpay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: orderId,
      force_chaos_action: forceAction
    })
  });
  if (!res.ok) throw new Error('Failed to deliver webhook');
  return res.json();
}

export async function triggerReconcile(cutoffSeconds = 0) {
  const res = await fetch(`${API_BASE}/admin/reconcile-now?cutoff_seconds=${cutoffSeconds}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to trigger reconciliation');
  return res.json();
}
