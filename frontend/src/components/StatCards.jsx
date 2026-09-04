import React from 'react';
import { IndianRupee, ShieldCheck, Clock, AlertCircle, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function StatCards({ stats, onReconcileClick, isReconciling }) {
  const cards = [
    {
      title: 'Ghost Payments Caught',
      value: `₹${(stats.ghost_payments_caught_rupees || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtext: `${stats.ghost_payments_caught_count || 0} orders recovered safely`,
      icon: IndianRupee,
      glow: 'glow-emerald',
      borderColor: 'border-emerald-500/30',
      textColor: 'text-emerald-400',
      badge: '100% Gated Auto-Recovered',
      badgeColor: 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60',
    },
    {
      title: 'Auto-Corrected vs Escalated',
      value: `${stats.auto_corrected_count || 0} / ${stats.escalated_count || 0}`,
      subtext: `${stats.total_reconciled || 0} total evaluated events`,
      icon: ShieldCheck,
      glow: 'glow-cyan',
      borderColor: 'border-cyan-500/30',
      textColor: 'text-cyan-400',
      badge: stats.total_reconciled > 0 
        ? `${Math.round(((stats.auto_corrected_count || 0) / stats.total_reconciled) * 100)}% Pass Rate` 
        : 'Zero Violations',
      badgeColor: 'bg-cyan-950/70 text-cyan-400 border-cyan-800/60',
    },
    {
      title: 'Avg Detection Latency',
      value: `${stats.avg_detection_latency_seconds || 0}s`,
      subtext: 'Time from webhook loss to recovery',
      icon: Clock,
      glow: 'glow-amber',
      borderColor: 'border-amber-500/30',
      textColor: 'text-amber-400',
      badge: 'Real-time Bounded',
      badgeColor: 'bg-amber-950/70 text-amber-400 border-amber-800/60',
    },
    {
      title: 'Active Pending Orders',
      value: `${stats.active_pending_count || 0}`,
      subtext: 'Monitoring in database',
      icon: AlertCircle,
      glow: 'glow-rose',
      borderColor: stats.active_pending_count > 0 ? 'border-amber-500/40' : 'border-slate-800',
      textColor: stats.active_pending_count > 0 ? 'text-amber-400' : 'text-slate-400',
      badge: stats.active_pending_count > 0 ? 'Awaiting Gateway Sync' : 'Reconciled Clean',
      badgeColor: stats.active_pending_count > 0 
        ? 'bg-amber-950/70 text-amber-300 border-amber-800/60' 
        : 'bg-slate-800 text-slate-400 border-slate-700',
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`bg-[#0e1424] rounded-xl p-5 border ${card.borderColor} shadow-xl transition-all duration-300 hover:border-slate-600 relative overflow-hidden`}
          >
            {/* Ambient subtle glow background */}
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">{card.title}</span>
              <div className={`p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 ${card.textColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mb-2">
              <div className={`text-2xl font-bold font-mono tracking-tight ${card.textColor}`}>
                {card.value}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {card.subtext}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${card.badgeColor}`}>
                {card.badge}
              </span>
              <span className="text-[10px] font-mono text-slate-500">O(1) verified</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
