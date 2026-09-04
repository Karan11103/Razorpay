import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, UserCheck, MessageSquare } from 'lucide-react';
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
      await resolveEscalation(id, `Manual verification completed by merchant operations for ${orderId}`);
      setActionSuccess(`Escalation #${id} for ${orderId} resolved and logged.`);
      setTimeout(() => setActionSuccess(null), 3000);
      await loadEscalations();
      if (onResolved) onResolved();
    } catch (err) {
      console.error(err);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="bg-[#0F1626] rounded-lg border border-slate-800 shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-white tracking-tight">Merchant Operations Escalation Queue</h3>
            {items.length > 0 && (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/50">
                {items.length} Pending Review
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Orders where auto-correction was blocked by the deterministic gate (e.g. signature mismatch, amount disparity)
          </p>
        </div>

        <button
          onClick={loadEscalations}
          className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {actionSuccess && (
        <div className="p-2.5 bg-emerald-950/40 border-b border-emerald-800/40 text-emerald-300 text-xs flex items-center space-x-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* List */}
      <div className="divide-y divide-slate-800/80 p-4 space-y-3">
        {items.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
            <span className="font-semibold text-slate-200 block text-sm">Escalation Queue Clear</span>
            No transactions currently require human intervention.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/50 rounded-lg p-4 border border-slate-800 hover:border-slate-700 transition-colors space-y-3"
            >
              {/* Top Row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/40 uppercase">
                    Gate Blocked
                  </span>
                  <span className="font-mono text-xs font-semibold text-white">
                    {item.order_id}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  {item.order_amount && (
                    <span className="text-sm font-mono font-semibold text-white">
                      ₹{item.order_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                  <button
                    onClick={() => handleResolve(item.id, item.order_id)}
                    disabled={resolvingId === item.id}
                    className="flex items-center space-x-1 px-3 py-1 rounded text-xs font-medium bg-[#0C66E4] hover:bg-[#0052CC] text-white transition-colors disabled:opacity-50"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{resolvingId === item.id ? 'Resolving...' : 'Approve & Resolve'}</span>
                  </button>
                </div>
              </div>

              {/* Gate Reason */}
              <div className="text-xs bg-[#090D16] p-2.5 rounded border border-slate-800 text-slate-300 font-mono">
                <span className="text-slate-500 font-semibold uppercase text-[10px] block">Deterministic Gate Verification Failure:</span>
                <span className="text-amber-300">{item.reason}</span>
              </div>

              {/* LLM Advisory Box */}
              {item.llm_summary && (
                <div className="bg-[#0B111E] border border-slate-800 rounded p-3 text-xs space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    AI Incident Summary (Advisory Only)
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {item.llm_summary}
                  </p>
                  {item.customer_message && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-start space-x-2 text-slate-400">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                      <span className="text-slate-300 italic text-[11px]">"{item.customer_message}"</span>
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
