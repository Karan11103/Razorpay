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
    <div className="bg-[#0D111A] rounded-lg border border-[#182030] overflow-hidden">
      
      {/* Header */}
      <div className="p-4 border-b border-[#182030] flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-[#FBF7EE] tracking-tight">Merchant Escalation Queue</h3>
            {items.length > 0 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/50">
                {items.length} Pending
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Orders where auto-correction was blocked by the deterministic gate (signature mismatch, amount disparity)
          </p>
        </div>

        <button
          onClick={loadEscalations}
          className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded bg-[#07090E] hover:bg-[#121826] border border-[#182030] transition-colors"
        >
          Refresh
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-[#0E1815] border-b border-emerald-800/60 text-emerald-300 text-xs flex items-center space-x-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* List */}
      <div className="divide-y divide-[#182030] p-4 space-y-3">
        {items.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs font-mono">
            / No transactions currently require human intervention.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-[#07090E] rounded-lg p-4 border border-[#182030] space-y-3"
            >
              {/* Top Row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#181308] text-amber-400 border border-amber-800/50 uppercase">
                    Gate Blocked
                  </span>
                  <span className="font-mono text-xs font-semibold text-[#FBF7EE]">
                    {item.order_id}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  {item.order_amount && (
                    <span className="text-sm font-mono font-semibold text-[#FBF7EE]">
                      ₹{item.order_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                  <button
                    onClick={() => handleResolve(item.id, item.order_id)}
                    disabled={resolvingId === item.id}
                    className="flex items-center space-x-1 px-3 py-1 rounded text-xs font-semibold bg-[#FBF7EE] text-[#07090E] hover:bg-[#E5DFD1] transition-all disabled:opacity-50"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{resolvingId === item.id ? 'Resolving...' : 'Approve & Resolve'}</span>
                  </button>
                </div>
              </div>

              {/* Gate Reason */}
              <div className="text-xs bg-[#0D111A] p-2.5 rounded border border-[#182030] text-slate-300 font-mono">
                <span className="text-slate-500 font-semibold uppercase text-[10px] block">Deterministic Gate Verification Failure:</span>
                <span className="text-amber-300">{item.reason}</span>
              </div>

              {/* LLM Advisory Box */}
              {item.llm_summary && (
                <div className="bg-[#0D111A] border border-[#182030] rounded p-3 text-xs space-y-1.5">
                  <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider block">
                    / AI Incident Summary (Advisory Only)
                  </span>
                  <p className="text-slate-300 leading-relaxed font-sans">
                    {item.llm_summary}
                  </p>
                  {item.customer_message && (
                    <div className="pt-2 border-t border-[#182030] flex items-start space-x-2 text-slate-400">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
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
