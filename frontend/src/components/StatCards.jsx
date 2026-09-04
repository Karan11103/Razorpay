import React from 'react';
import { IndianRupee, ShieldCheck, Clock, AlertCircle } from 'lucide-react';

export default function StatCards({ stats }) {
  const cards = [
    {
      label: 'Ghost Payments Caught',
      value: `₹${(stats.ghost_payments_caught_rupees || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      detail: `${stats.ghost_payments_caught_count || 0} orders auto-corrected`,
      status: '100% Gated Match',
      statusType: 'success'
    },
    {
      label: 'Reconciliation Decisions',
      value: `${stats.auto_corrected_count || 0} / ${stats.escalated_count || 0}`,
      detail: `${stats.total_reconciled || 0} total evaluated events`,
      status: 'Auto-Corrected vs Escalated',
      statusType: 'neutral'
    },
    {
      label: 'Avg Detection Latency',
      value: `${stats.avg_detection_latency_seconds || 0}s`,
      detail: 'Webhook loss to DB recovery',
      status: 'Target: < 30s',
      statusType: 'neutral'
    },
    {
      label: 'Active Pending Orders',
      value: `${stats.active_pending_count || 0}`,
      detail: 'In database awaiting gateway sync',
      status: stats.active_pending_count > 0 ? 'Action Pending' : 'Healthy',
      statusType: stats.active_pending_count > 0 ? 'warning' : 'success'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-[#0F1626] rounded-lg p-4 border border-slate-800 hover:border-slate-700 transition-colors shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {card.label}
            </span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
              card.statusType === 'success' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50' :
              card.statusType === 'warning' ? 'bg-amber-950/60 text-amber-300 border-amber-800/50' :
              'bg-slate-800/80 text-slate-300 border-slate-700'
            }`}>
              {card.status}
            </span>
          </div>

          <div className="text-2xl font-bold font-mono text-white tracking-tight my-1">
            {card.value}
          </div>

          <div className="text-xs text-slate-400 pt-1 border-t border-slate-800/60 flex items-center justify-between">
            <span>{card.detail}</span>
            <span className="font-mono text-[10px] text-slate-500">O(1)</span>
          </div>
        </div>
      ))}
    </div>
  );
}
