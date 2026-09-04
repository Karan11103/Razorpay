import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, UserCheck, MessageSquare, Bot, ArrowUpRight } from 'lucide-react';
import { fetchEscalations, resolveEscalation } from '../services/api';

export default function EscalationQueue({ onResolved }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const loadEscalations = async () => {
    setIsLoading(true);
    try {
      const data = await fetchEscalations();
      setItems(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEscalations();
  }, []);

  const handleResolve = async (id, orderId) => {
    setResolvingId(id);
    try {
      await resolveEscalation(id, `Manual verification by merchant operator for ${orderId}`);
      setActionSuccess(`Escalation #${id} for ${orderId} resolved and logged to audit trail.`);
      setTimeout(() => setActionSuccess(null), 4000);
      await loadEscalations();
      if (onResolved) onResolved();
    } catch (err) {
      console.error(err);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="bg-[#0e1424] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-semibold text-white">Merchant Escalation Queue</h2>
              {items.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {items.length} Pending Human Review
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Orders blocked by deterministic gate checks (signature tampering, amount mismatch, terminal state) requiring operator decision
            </p>
          </div>
        </div>

        <button
          onClick={loadEscalations}
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors"
        >
          Refresh Queue
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-950/50 border-b border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Escalation Cards */}
      <div className="divide-y divide-slate-800 p-4 sm:p-6 space-y-4">
        {items.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-400 mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">Escalation Queue Clear</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No orders are currently blocked. To test the escalation gate, use the Simulation Controls to corrupt a webhook payload.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/60 rounded-xl p-4 sm:p-5 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800/60 uppercase">
                    Blocked by Gate
                  </span>
                  <span className="font-mono text-xs font-bold text-white">
                    {item.order_id}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  {item.order_amount && (
                    <span className="text-sm font-mono font-bold text-cyan-400">
                      ₹{item.order_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                  <button
                    onClick={() => handleResolve(item.id, item.order_id)}
                    disabled={resolvingId === item.id}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-black shadow-sm transition-all disabled:opacity-50"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{resolvingId === item.id ? 'Resolving...' : 'Mark Resolved'}</span>
                  </button>
                </div>
              </div>

              {/* Reason */}
              <div className="text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300 font-mono">
                <span className="text-rose-400 font-semibold">GATE BLOCK REASON: </span>
                {item.reason}
              </div>

              {/* LLM Plain-Language Assistance */}
              {item.llm_summary && (
                <div className="bg-blue-950/20 border border-blue-900/40 rounded-lg p-3 text-xs">
                  <div className="flex items-center space-x-1.5 text-blue-400 font-medium mb-1">
                    <Bot className="w-3.5 h-3.5" />
                    <span>AI Incident Summary (Advisory Only)</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {item.llm_summary}
                  </p>
                  {item.customer_message && (
                    <div className="mt-2 pt-2 border-t border-blue-900/30 flex items-start space-x-2 text-slate-400">
                      <MessageSquare className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                      <span className="italic text-slate-300">"{item.customer_message}"</span>
                    </div>
                  )}
                </div>
              )}

            </div>
          ))
        )}
      </div>

    </div>
  );
}
