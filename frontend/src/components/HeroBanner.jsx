import React from 'react';
import { Play, RefreshCw, Sparkles, ArrowDown } from 'lucide-react';

export default function HeroBanner({ onSimulateGhost, onTriggerPoller, isRunning }) {
  return (
    <div className="relative border-b border-[#182030] pb-10 pt-8 mb-8 overflow-hidden">
      
      {/* Subtle atmospheric ambient glow in background */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-amber-950/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-4xl">
        
        {/* Small Intro Line (Mirroring 'Think you can build real AI?') */}
        <p className="text-slate-400 text-sm sm:text-base font-medium tracking-tight mb-2">
          Webhook delivery dropped at 2:00 AM? Gateway captured, merchant blind.
        </p>

        {/* Monumental Headline (Mirroring the huge 'Prove it.' in cream off-white) */}
        <h1 className="text-5xl sm:text-7xl font-extrabold text-[#FBF7EE] tracking-tighter mb-4 font-sans leading-none">
          Reconcile it.
        </h1>

        {/* Description Line */}
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6 max-w-2xl">
          An autonomous system that reconciles Razorpay payment status against merchant database state, 
          safely auto-corrects ghost payments using a deterministic 5-rule gate, and isolates the LLM 
          strictly to incident explanations. Never to move money.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={onSimulateGhost}
            disabled={isRunning}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-md text-xs sm:text-sm font-semibold bg-[#FBF7EE] text-[#07090E] hover:bg-[#E5DFD1] transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simulate Ghost Payment Scenario</span>
          </button>

          <button
            onClick={onTriggerPoller}
            disabled={isRunning}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-md text-xs sm:text-sm font-medium bg-[#0E1320] hover:bg-[#151C2E] text-slate-300 border border-[#1E283D] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isRunning ? 'animate-spin' : ''}`} />
            <span>Run Reconciliation Poller</span>
          </button>
        </div>

        {/* Minimalist Metadata Tags with slashes (Exact mirror of buildathon page bottom tags) */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 font-mono">
          <span className="text-slate-300"><span className="text-slate-600 mr-1">/</span>5-Rule Deterministic Gate</span>
          <span className="text-slate-300"><span className="text-slate-600 mr-1">/</span>O(1) Idempotency Constraint</span>
          <span className="text-slate-300"><span className="text-slate-600 mr-1">/</span>Isolated Read-Only LLM</span>
          <span className="text-slate-300"><span className="text-slate-600 mr-1">/</span>Append-Only Audit Trail</span>
        </div>

      </div>

    </div>
  );
}
