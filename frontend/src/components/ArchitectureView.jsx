import React from 'react';
import { ShieldCheck, Database, Cpu, Lock, FileCode, CheckCircle, XCircle, ArrowRight, Zap, Bot, Terminal } from 'lucide-react';

export default function ArchitectureView() {
  const complexityData = [
    {
      component: 'Order Lookup for Poller',
      complexity: 'O(1) seek',
      defense: 'Compound index on (status, created_at); B-Tree index scan instead of linear table scan'
    },
    {
      component: 'Batch Reconciliation Poll',
      complexity: 'O(N) time, O(1) RAM',
      defense: 'Stream-processed via paginated cursor limit/offset; never loads all orders into Python memory'
    },
    {
      component: 'Reconciliation Gate Function',
      complexity: 'O(1) time',
      defense: 'Strict 5-step deterministic checks with early returns; zero loops over historical transactions'
    },
    {
      component: 'Idempotency Guard',
      complexity: 'O(1) avg',
      defense: 'Unique primary key constraint on `corrections(order_id)`; eliminates O(N) audit log scans'
    },
    {
      component: 'Audit Log Write',
      complexity: 'O(1) append',
      defense: 'Append-only immutable record; never updated or deleted; permanent compliance trail'
    },
    {
      component: 'Dashboard Aggregations',
      complexity: 'O(log N)',
      defense: 'Direct SQL engine aggregations (COUNT/SUM on indexed status); zero application-level filtering'
    },
    {
      component: 'LLM Explainer Module',
      complexity: 'O(1) post-decision',
      defense: 'Asynchronous post-gate call; zero access to order state mutation or financial logic'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* AI Boundary Defense Statement */}
      <div className="bg-gradient-to-r from-blue-950/60 to-slate-900 border border-cyan-500/40 rounded-xl p-5 shadow-2xl">
        <div className="flex items-center space-x-2.5 mb-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white tracking-wide">
            The AI Judgment Boundary: Why the LLM Never Moves Money
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          <strong className="text-cyan-300">Core Engineering Invariant:</strong> In fintech infrastructure, non-deterministic language models must never make financial state transitions. In Ghost Payment Detector, 
          <span className="text-emerald-400 font-semibold"> 100% of money-affecting decisions are executed by a deterministic, mathematical gate function </span> 
          verifying gateway truth, cryptographic signatures, and amount parity. The LLM is strictly isolated downstream: it only reads the structured incident outcome to draft human-readable explanations and customer updates.
        </p>
      </div>

      {/* Visual Pipeline Diagram */}
      <div className="bg-[#0e1424] rounded-xl border border-slate-800 p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          Reconciliation Pipeline Architecture
        </h3>

        {/* Diagram Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1: Order Generation & Ingestion */}
          <div className="space-y-4">
            <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>01. Ingestion & Chaos</span>
            </div>

            {/* Checkout */}
            <div className="bg-slate-900/90 border border-slate-700 rounded-lg p-3.5 shadow-md">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1">
                <span>Checkout Simulator</span>
                <span className="font-mono text-[10px] text-cyan-400">REST API</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Creates test order in Razorpay & persists in merchant DB with status: <code className="text-amber-400">pending</code>.
              </p>
            </div>

            {/* Chaos Relay */}
            <div className="bg-amber-950/20 border border-amber-500/40 rounded-lg p-3.5 shadow-md">
              <div className="flex items-center justify-between text-xs font-bold text-amber-300 mb-1">
                <span>Chaos Webhook Relay</span>
                <span className="font-mono text-[10px] text-amber-400">Simulation</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Randomly drops, delays, or corrupts incoming webhooks to reproduce the 2am webhook loss failure mode.
              </p>
            </div>

            {/* Merchant DB */}
            <div className="bg-slate-900/90 border border-slate-700 rounded-lg p-3.5 shadow-md">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1">
                <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-slate-400" /> Merchant DB</span>
                <span className="font-mono text-[10px] text-emerald-400">SQLite (WAL)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Order remains stuck in <code className="text-amber-400">pending</code> when webhook is silently dropped ("Ghost Payment").
              </p>
            </div>
          </div>

          {/* Column 2: Deterministic Reconciliation Gate */}
          <div className="space-y-4">
            <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>02. Deterministic Gate</span>
            </div>

            {/* Poller */}
            <div className="bg-slate-900/90 border border-slate-700 rounded-lg p-3.5 shadow-md">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1">
                <span>Reconciliation Poller</span>
                <span className="font-mono text-[10px] text-cyan-400">30s / Cron</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Queries <code className="text-cyan-300">WHERE status='pending'</code> via compound index & fetches Razorpay ground truth.
              </p>
            </div>

            {/* Gate Box */}
            <div className="bg-emerald-950/30 border-2 border-emerald-500/50 rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-300 mb-2">
                <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Gate Function</span>
                <span className="text-[10px] font-mono bg-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-300">O(1) Strict</span>
              </div>
              <ul className="text-[11px] text-slate-300 space-y-1.5">
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>1. Idempotency Guard (unique constraint)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>2. Gateway status == 'captured'</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>3. Cryptographic signature & amount match</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>4. Terminal status check (no refund/dispute)</span>
                </li>
              </ul>
            </div>

            {/* Fork Outcomes */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-emerald-950/40 border border-emerald-500/40 p-2.5 rounded-lg text-center">
                <span className="text-[10px] font-bold text-emerald-400 block uppercase">Allowed</span>
                <span className="text-[10px] text-slate-300">Auto-correct to completed & log</span>
              </div>
              <div className="bg-amber-950/40 border border-amber-500/40 p-2.5 rounded-lg text-center">
                <span className="text-[10px] font-bold text-amber-400 block uppercase">Blocked</span>
                <span className="text-[10px] text-slate-300">Escalate to human review queue</span>
              </div>
            </div>
          </div>

          {/* Column 3: Post-Decision Explainability & UI */}
          <div className="space-y-4">
            <div className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>03. Read-Only AI & Audit</span>
            </div>

            {/* Explainer Box */}
            <div className="bg-purple-950/20 border border-purple-500/40 rounded-lg p-3.5 shadow-md">
              <div className="flex items-center justify-between text-xs font-bold text-purple-300 mb-1">
                <span className="flex items-center gap-1.5"><Bot className="w-3.5 h-3.5" /> AI Explainer</span>
                <span className="font-mono text-[10px] text-purple-400">Post-Gate</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Receives structured event JSON post-decision. Produces incident engineering summary + courteous customer message draft.
              </p>
              <div className="mt-2 text-[10px] font-mono text-rose-300 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/40">
                GUARANTEE: Cannot mutate DB or move funds
              </div>
            </div>

            {/* Audit Trail */}
            <div className="bg-slate-900/90 border border-slate-700 rounded-lg p-3.5 shadow-md">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1">
                <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-cyan-400" /> Immutable Audit Log</span>
                <span className="font-mono text-[10px] text-cyan-400">Append-Only</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Every state transition recorded with actor, action, timestamp, and JSON diff for enterprise compliance.
              </p>
            </div>

            {/* Dashboard */}
            <div className="bg-slate-900/90 border border-slate-700 rounded-lg p-3.5 shadow-md">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1">
                <span>Reactive Dashboard</span>
                <span className="font-mono text-[10px] text-cyan-400">React + Tailwind</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Real-time metrics, live incident feed, CSV exports, and simulation control sliders.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Complexity Defense Table */}
      <div className="bg-[#0e1424] rounded-xl border border-slate-800 p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          Time & Space Complexity Proof (Fintech Scale)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3.5">Component</th>
                <th className="py-2.5 px-3.5">Complexity</th>
                <th className="py-2.5 px-3.5">Architectural Defense</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
              {complexityData.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40">
                  <td className="py-2.5 px-3.5 font-sans font-semibold text-slate-200">{item.component}</td>
                  <td className="py-2.5 px-3.5 text-cyan-400 font-bold">{item.complexity}</td>
                  <td className="py-2.5 px-3.5 font-sans text-xs text-slate-400">{item.defense}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
