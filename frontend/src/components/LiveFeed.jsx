import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Bot, ArrowRight, MessageSquare, Copy, Check, RefreshCw } from 'lucide-react';

export default function LiveFeed({ events, isLoading, onRefresh }) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTimestamp = (isoStr) => {
    try {
      const dt = new Date(isoStr);
      return dt.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="bg-[#0e1424] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              Live Reconciliation Stream
              <span className="text-xs font-normal text-slate-400 font-mono">(auto-polled every 3s)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Deterministic gate evaluations & isolated LLM-generated incident explanations
            </p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Feed List */}
      <div className="divide-y divide-slate-800/80 max-h-[600px] overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-800/70 mx-auto flex items-center justify-center text-slate-400 mb-3">
              <RefreshCw className="w-6 h-6 animate-pulse" />
            </div>
            <p className="text-sm text-slate-300 font-medium">No reconciliation events yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Use the Simulation Controls to trigger a test checkout and drop a webhook to observe the auto-reconciliation in real time.
            </p>
          </div>
        ) : (
          events.map((ev) => {
            const isAllowed = ev.gate_decision === 'allowed';
            const statusColor = isAllowed 
              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400'
              : 'border-amber-500/40 bg-amber-950/20 text-amber-400';

            return (
              <div key={ev.id} className="p-4 sm:p-5 hover:bg-slate-900/30 transition-colors">
                
                {/* Event Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${statusColor}`}>
                      {isAllowed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>AUTO-CORRECTED</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span>BLOCKED & ESCALATED</span>
                        </>
                      )}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-200">
                      {ev.order_id}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <span className="font-mono font-bold text-cyan-400">
                      ₹{((ev.amount_in_rupees) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {formatTimestamp(ev.created_at)}
                    </span>
                  </div>
                </div>

                {/* State Transition Pill */}
                <div className="flex items-center space-x-2 text-xs mb-3 bg-slate-900/70 p-2 rounded-lg border border-slate-800/80 font-mono">
                  <span className="text-slate-400">DB State:</span>
                  <span className="text-amber-400 font-semibold uppercase">{ev.db_status_before}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className={`font-semibold uppercase ${isAllowed ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {ev.db_status_after}
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400">Gateway Truth:</span>
                  <span className="text-cyan-400 font-semibold uppercase">{ev.gateway_status}</span>
                </div>

                {/* Gate Reason */}
                <div className="text-xs text-slate-300 mb-3 pl-2 border-l-2 border-slate-700">
                  <span className="text-slate-500 font-mono text-[11px] block">DETERMINISTIC GATE REASON:</span>
                  {ev.gate_reason}
                </div>

                {/* LLM Incident Summary & Customer Draft */}
                {ev.llm_summary && (
                  <div className="mt-3 bg-gradient-to-r from-blue-950/30 to-indigo-950/20 border border-blue-900/40 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-1.5 text-xs text-blue-400 font-medium">
                        <Bot className="w-3.5 h-3.5" />
                        <span>AI Incident Explainer (Non-Financial Scope)</span>
                      </div>
                      <span className="text-[10px] text-blue-300 font-mono bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/40">
                        Isolated Post-Gate
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed mb-2">
                      {ev.llm_summary}
                    </p>

                    {/* Customer Message Draft */}
                    {ev.customer_message && (
                      <div className="pt-2 border-t border-blue-900/40 mt-2 flex items-start justify-between gap-2">
                        <div className="flex items-start space-x-2 text-xs text-slate-400">
                          <MessageSquare className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                          <span className="italic text-slate-300">"{ev.customer_message}"</span>
                        </div>
                        <button
                          onClick={() => handleCopy(ev.id, ev.customer_message)}
                          className="shrink-0 p-1 rounded hover:bg-blue-900/40 text-slate-400 hover:text-white transition-colors"
                          title="Copy customer message"
                        >
                          {copiedId === ev.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
