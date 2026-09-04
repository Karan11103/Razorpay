import React from 'react';
import { Shield, Layers, Terminal } from 'lucide-react';

export default function ArchitectureView() {
  const complexityData = [
    {
      component: 'Order Lookup for Poller',
      complexity: 'O(1) seek',
      defense: 'Compound B-Tree index on (status, created_at); B-Tree index seek eliminates linear table scan'
    },
    {
      component: 'Batch Reconciliation Poll',
      complexity: 'O(N) time, O(1) RAM',
      defense: 'Stream-processed via cursor pagination (limit/offset); never loads all database orders into memory'
    },
    {
      component: 'Reconciliation Gate Function',
      complexity: 'O(1) time',
      defense: 'Strict 5-step deterministic verification with early returns; zero iteration over transaction history'
    },
    {
      component: 'Idempotency Guard',
      complexity: 'O(1) avg',
      defense: 'Unique primary key constraint on `corrections(order_id)`; eliminates scanning audit trail tables'
    },
    {
      component: 'Audit Log Write',
      complexity: 'O(1) append',
      defense: 'Append-only SQLite table with autoincrement ID; records are immutable and never updated or deleted'
    },
    {
      component: 'Dashboard Aggregations',
      complexity: 'O(log N)',
      defense: 'Computed directly within SQLite engine using indexed COUNT and SUM queries; zero in-memory app filtering'
    },
    {
      component: 'LLM Explainer Module',
      complexity: 'O(1) post-decision',
      defense: 'Asynchronous post-gate call; completely isolated with zero database write access and zero money movement'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Executive Statement Callout */}
      <div className="bg-[#0D111A] border border-[#182030] rounded-lg p-5">
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="w-4 h-4 text-[#FBF7EE]" />
          <h3 className="text-sm font-semibold text-[#FBF7EE] tracking-tight">
            AI Judgment Boundary: Why Deterministic Gates Guard Financial State
          </h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          In core financial infrastructure, non-deterministic language models cannot be trusted to execute state transitions or move money. In Ghost Payment Detector, 
          <strong className="text-[#FBF7EE]"> 100% of money-affecting decisions are bounded by a deterministic, mathematical gate function </strong> 
          verifying gateway capture status, cryptographic signatures, and amount parity. The LLM is strictly isolated downstream: it only consumes structured outcome JSON to draft incident summaries for engineers and customer updates.
        </p>
      </div>

      {/* Architecture Flow */}
      <div className="bg-[#0D111A] rounded-lg border border-[#182030] p-5">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[#FBF7EE]" />
          End-to-End System Pipeline
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          {/* Step 1 */}
          <div className="bg-[#07090E] p-4 rounded border border-[#182030] space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#182030]">
              <span className="font-semibold text-[#FBF7EE]">1. Ingestion & Chaos</span>
              <span className="font-mono text-[10px] text-slate-500">/ PHASE 01</span>
            </div>
            <div className="space-y-2 text-slate-400">
              <div className="p-2.5 rounded bg-[#0D111A] border border-[#182030]">
                <span className="font-medium text-slate-200 block mb-0.5">Checkout Simulator</span>
                Creates order on Razorpay Test API & persists in merchant DB with status: <code className="text-amber-400 font-mono text-[11px]">pending</code>.
              </div>
              <div className="p-2.5 rounded bg-[#0D111A] border border-[#182030]">
                <span className="font-medium text-slate-200 block mb-0.5">Chaos Webhook Relay</span>
                Randomly drops, delays, or corrupts incoming webhooks to reproduce the 2am webhook loss failure mode.
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-[#07090E] p-4 rounded border border-[#182030] space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#182030]">
              <span className="font-semibold text-[#FBF7EE]">2. Deterministic Gate</span>
              <span className="font-mono text-[10px] text-emerald-400">/ PHASE 02</span>
            </div>
            <div className="space-y-2 text-slate-400">
              <div className="p-2.5 rounded bg-[#0D111A] border border-[#182030]">
                <span className="font-medium text-slate-200 block mb-0.5">Reconciliation Poller (30s)</span>
                Queries <code className="text-slate-300 font-mono text-[11px]">WHERE status='pending'</code> via compound index & fetches Razorpay ground truth.
              </div>
              <div className="p-2.5 rounded bg-[#0D111A] border border-[#182030]">
                <span className="font-medium text-slate-200 block mb-1">5-Stage Verification</span>
                <ul className="space-y-1 text-[11px] text-slate-300 font-mono">
                  <li>• Idempotency guard check</li>
                  <li>• Gateway status == 'captured'</li>
                  <li>• Signature integrity verification</li>
                  <li>• Exact amount parity match</li>
                  <li>• Terminal status guard</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-[#07090E] p-4 rounded border border-[#182030] space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#182030]">
              <span className="font-semibold text-[#FBF7EE]">3. Resolution & Audit</span>
              <span className="font-mono text-[10px] text-blue-400">/ PHASE 03</span>
            </div>
            <div className="space-y-2 text-slate-400">
              <div className="p-2.5 rounded bg-[#0D111A] border border-[#182030]">
                <span className="font-medium text-slate-200 block mb-0.5">Auto-Correct / Escalate</span>
                On approval: Order <code className="text-emerald-400 font-mono text-[11px]">corrected</code>. On block: Order <code className="text-amber-400 font-mono text-[11px]">escalated</code> to human queue.
              </div>
              <div className="p-2.5 rounded bg-[#0D111A] border border-[#182030]">
                <span className="font-medium text-slate-200 block mb-0.5">Read-Only AI Explainer</span>
                Reads post-gate outcome JSON to generate incident summary and customer message. Zero DB write permissions.
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Complexity Table */}
      <div className="bg-[#0D111A] rounded-lg border border-[#182030] p-5">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#FBF7EE]" />
          Time & Space Complexity Proof
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#07090E] text-slate-400 uppercase font-mono text-[10px] border-b border-[#182030]">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Component</th>
                <th className="py-2.5 px-4 font-semibold">Complexity</th>
                <th className="py-2.5 px-4 font-semibold">Architectural Defense</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182030] text-slate-300 font-mono">
              {complexityData.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#0E1420]">
                  <td className="py-2.5 px-4 font-sans font-medium text-[#FBF7EE]">{item.component}</td>
                  <td className="py-2.5 px-4 text-emerald-400 font-semibold">{item.complexity}</td>
                  <td className="py-2.5 px-4 font-sans text-xs text-slate-400">{item.defense}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
