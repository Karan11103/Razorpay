import React from 'react';

export default function StatCards({ stats }) {
  const cards = [
    {
      label: 'Recovered Revenue',
      value: `₹${(stats.ghost_payments_caught_rupees || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: `${stats.ghost_payments_caught_count || 0} orders auto-corrected`,
      tag: '/ 100% Gated Match'
    },
    {
      label: 'Gate Decisions',
      value: `${stats.auto_corrected_count || 0} / ${stats.escalated_count || 0}`,
      sub: `${stats.total_reconciled || 0} evaluated events`,
      tag: '/ Auto-Corrected vs Escalated'
    },
    {
      label: 'Detection Latency',
      value: `${stats.avg_detection_latency_seconds || 0}s`,
      sub: 'Time to state convergence',
      tag: '/ Bounded Real-Time'
    },
    {
      label: 'Pending In Database',
      value: `${stats.active_pending_count || 0}`,
      sub: 'Orders monitoring in DB',
      tag: stats.active_pending_count > 0 ? '/ Action Awaiting' : '/ Synchronized'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-[#0D111A] rounded-lg p-5 border border-[#182030] hover:border-[#222D42] transition-colors"
        >
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">
            {card.label}
          </div>

          <div className="text-3xl font-extrabold font-mono text-[#FBF7EE] tracking-tight my-1">
            {card.value}
          </div>

          <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-[#182030] flex items-center justify-between">
            <span>{card.sub}</span>
            <span className="font-mono text-[10px] text-slate-500">{card.tag}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
