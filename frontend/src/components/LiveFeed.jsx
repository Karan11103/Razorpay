import React, { useState } from 'react';
import { ArrowRight, MessageSquare, Copy, Check, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export default function LiveFeed({ events, isLoading, onRefresh }) {
  const [copiedId, setCopiedId] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
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
    <div className="bg-[#0F1626] rounded-lg border border-slate-800 shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Reconciliation Activity Feed
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              (Live Stream • 3.5s auto-poll)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit of evaluated orders, deterministic gate decisions, and incident summaries
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#0C66E4]' : 'text-slate-400'}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stream List */}
      <div className="divide-y divide-slate-800/80 max-h-[580px] overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No reconciliation events recorded yet. Trigger a test order in the Sandbox above.
          </div>
        ) : (
          events.map((ev) => {
            const isAllowed = ev.gate_decision === 'allowed';
            const isExpanded = expandedRows[ev.id] !== false; // default expanded

            return (
              <div key={ev.id} className="p-4 hover:bg-slate-900/30 transition-colors">
                
                {/* Main Event Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2.5">
                    {/* Status Pill */}
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold font-mono border ${
                      isAllowed 
                        ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/50' 
                        : 'bg-amber-950/50 text-amber-400 border-amber-800/50'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isAllowed ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {isAllowed ? 'AUTO-CORRECTED' : 'BLOCKED & ESCALATED'}
                    </span>

                    <span className="font-mono text-xs font-semibold text-slate-200">
                      {ev.order_id}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <span className="font-mono font-semibold text-white">
                      ₹{((ev.amount_in_rupees) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {formatTimestamp(ev.created_at)}
                    </span>
                    <button
                      onClick={() => toggleRow(ev.id)}
                      className="text-slate-400 hover:text-slate-200 p-0.5"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* State Transition & Gate Verification */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 bg-slate-900/50 px-3 py-1.5 rounded border border-slate-800 font-mono mb-2.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-500">State:</span>
                    <span className="text-amber-400">{ev.db_status_before}</span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span className={isAllowed ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
                      {ev.db_status_after}
                    </span>
                  </div>
                  <span className="text-slate-700 hidden sm:inline">|</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-500">Gateway Truth:</span>
                    <span className="text-slate-200 font-medium">{ev.gateway_status}</span>
                  </div>
                  <span className="text-slate-700 hidden sm:inline">|</span>
                  <div className="truncate max-w-md">
                    <span className="text-slate-500">Gate:</span> <span className="text-slate-300">{ev.gate_reason}</span>
                  </div>
                </div>

                {/* AI Explainer Accordion Body */}
                {isExpanded && ev.llm_summary && (
                  <div className="bg-[#0B111E] border border-slate-800 rounded p-3 text-xs space-y-2">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                        Incident Explanation (Advisory LLM)
                      </span>
                      <p className="text-slate-300 leading-relaxed">
                        {ev.llm_summary}
                      </p>
                    </div>

                    {ev.customer_message && (
                      <div className="pt-2 border-t border-slate-800/80 flex items-start justify-between gap-2 text-slate-400">
                        <div className="flex items-start space-x-2">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                          <span className="text-slate-300 italic text-[11px]">"{ev.customer_message}"</span>
                        </div>
                        <button
                          onClick={() => handleCopy(ev.id, ev.customer_message)}
                          className="shrink-0 text-slate-400 hover:text-white p-1"
                          title="Copy message draft"
                        >
                          {copiedId === ev.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
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
