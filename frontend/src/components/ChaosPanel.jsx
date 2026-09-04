import React, { useState, useEffect } from 'react';
import { Zap, Play, RefreshCw, AlertOctagon, Sliders, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { simulateCheckout, simulateWebhook, triggerReconcile, updateChaosConfig, fetchChaosConfig } from '../services/api';

export default function ChaosPanel({ onActionComplete }) {
  const [dropRate, setDropRate] = useState(40);
  const [delayRate, setDelayRate] = useState(20);
  const [corruptRate, setCorruptRate] = useState(10);
  const [amountRupees, setAmountRupees] = useState(499);
  const [statusMsg, setStatusMsg] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    fetchChaosConfig()
      .then((cfg) => {
        setDropRate(Math.round(cfg.drop_rate * 100));
        setDelayRate(Math.round(cfg.delay_rate * 100));
        setCorruptRate(Math.round(cfg.corrupt_rate * 100));
      })
      .catch(() => {});
  }, []);

  const passRate = Math.max(0, 100 - (dropRate + delayRate + corruptRate));

  const handleSliderChange = async (newDrop, newDelay, newCorrupt) => {
    setDropRate(newDrop);
    setDelayRate(newDelay);
    setCorruptRate(newCorrupt);
    try {
      await updateChaosConfig({
        drop_rate: newDrop / 100,
        delay_rate: newDelay / 100,
        corrupt_rate: newCorrupt / 100
      });
    } catch (e) {
      console.error(e);
    }
  };

  // 1-Click Ghost Payment Demo Shortcut: Checkout -> Webhook Drop -> Immediate Auto-Reconciliation
  const handleFullGhostScenario = async () => {
    setIsRunning(true);
    setStatusMsg({ type: 'info', text: 'Step 1/3: Creating simulated checkout order on Razorpay Gateway...' });
    try {
      const paise = Math.round(amountRupees * 100);
      const order = await simulateCheckout(paise, 'INR');

      setStatusMsg({
        type: 'warning',
        text: `Step 2/3: Order ${order.id} created as 'pending'. Injecting CHAOS: Dropping webhook silently...`
      });

      await simulateWebhook(order.id, 'drop');

      setStatusMsg({
        type: 'warning',
        text: `Ghost payment created! Merchant DB has ${order.id} as 'pending' while Gateway has 'captured'. Triggering poller...`
      });

      // Brief delay for realism
      await new Promise(r => setTimeout(r, 600));

      const recResult = await triggerReconcile(0);

      setStatusMsg({
        type: 'success',
        text: `SUCCESS! Poller detected ghost payment and deterministic gate auto-corrected order ${order.id} to 'corrected'.`
      });

      if (onActionComplete) onActionComplete();
    } catch (err) {
      setStatusMsg({ type: 'error', text: `Scenario failed: ${err.message}` });
    } finally {
      setIsRunning(false);
    }
  };

  // Create isolated order
  const handleCreateOrderOnly = async () => {
    setIsRunning(true);
    try {
      const paise = Math.round(amountRupees * 100);
      const order = await simulateCheckout(paise, 'INR');
      setStatusMsg({
        type: 'info',
        text: `Order ${order.id} created (₹${amountRupees}). Status: 'pending'. Ready for webhook or reconciliation.`
      });
      if (onActionComplete) onActionComplete();
    } catch (err) {
      setStatusMsg({ type: 'error', text: `Failed to create order: ${err.message}` });
    } finally {
      setIsRunning(false);
    }
  };

  // Trigger manual reconciliation pass
  const handleManualReconcile = async () => {
    setIsRunning(true);
    try {
      const result = await triggerReconcile(0);
      const d = result.data;
      setStatusMsg({
        type: 'success',
        text: `Poller completed: ${d.scanned_count} pending orders scanned, ${d.auto_corrected_count} auto-corrected, ${d.escalated_count} escalated.`
      });
      if (onActionComplete) onActionComplete();
    } catch (err) {
      setStatusMsg({ type: 'error', text: `Reconciliation failed: ${err.message}` });
    } finally {
      setIsRunning(false);
    }
  };

  // Trigger Corrupted Webhook Scenario
  const handleCorruptedWebhookScenario = async () => {
    setIsRunning(true);
    try {
      const paise = Math.round(amountRupees * 100);
      const order = await simulateCheckout(paise, 'INR');
      await simulateWebhook(order.id, 'corrupt');
      await triggerReconcile(0);
      setStatusMsg({
        type: 'warning',
        text: `Corrupted payload injected! Gate detected invalid signature & blocked auto-correction. Pushed to Escalation Queue.`
      });
      if (onActionComplete) onActionComplete();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-amber-500/50 bg-[#12141f] p-5 shadow-2xl relative mb-6">
      
      {/* Simulation Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-amber-500/30 mb-5">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <AlertOctagon className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-amber-400 uppercase tracking-wide">
                Chaos-Injection Harness
              </h2>
              <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40">
                Simulation Only — Demo Controls
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Inject controlled webhook failures to reproduce 2am ghost-payment incidents live during your pitch.
            </p>
          </div>
        </div>

        {/* Quick Amount Setting */}
        <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700">
          <span className="text-xs text-slate-400 font-medium">Test Order Value:</span>
          <span className="text-xs text-slate-300">₹</span>
          <input
            type="number"
            value={amountRupees}
            onChange={(e) => setAmountRupees(Number(e.target.value))}
            className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* Drop Rate */}
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-semibold text-rose-400">Webhook Drop Rate</span>
            <span className="font-mono font-bold text-rose-400">{dropRate}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={dropRate}
            onChange={(e) => handleSliderChange(Number(e.target.value), delayRate, corruptRate)}
            className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <p className="text-[10px] text-slate-500 mt-1">Simulates network blackhole & timeout</p>
        </div>

        {/* Delay Rate */}
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-semibold text-amber-400">Delay Rate</span>
            <span className="font-mono font-bold text-amber-400">{delayRate}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={delayRate}
            onChange={(e) => handleSliderChange(dropRate, Number(e.target.value), corruptRate)}
            className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <p className="text-[10px] text-slate-500 mt-1">Simulates 30s-10m queue backlog</p>
        </div>

        {/* Corruption Rate */}
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-semibold text-purple-400">Corruption Rate</span>
            <span className="font-mono font-bold text-purple-400">{corruptRate}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={corruptRate}
            onChange={(e) => handleSliderChange(dropRate, delayRate, Number(e.target.value))}
            className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <p className="text-[10px] text-slate-500 mt-1">Mutates HMAC signature & payload</p>
        </div>

        {/* Delivered Rate */}
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-semibold text-emerald-400">Normal Delivery</span>
            <span className="font-mono font-bold text-emerald-400">{passRate}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-lg overflow-hidden mt-2">
            <div className="bg-emerald-500 h-full" style={{ width: `${passRate}%` }} />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Healthy normal webhook delivery</p>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        
        {/* Star Button: Full Ghost Payment Demo */}
        <button
          onClick={handleFullGhostScenario}
          disabled={isRunning}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-black shadow-lg shadow-amber-500/20 transition-all transform active:scale-95 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-black" />
          <span>Trigger Ghost Payment Scenario</span>
        </button>

        {/* Corrupted Signature Scenario */}
        <button
          onClick={handleCorruptedWebhookScenario}
          disabled={isRunning}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800/60 transition-all disabled:opacity-50"
        >
          <ShieldAlert className="w-4 h-4 text-purple-400" />
          <span>Corrupt Signature (Test Escalation Gate)</span>
        </button>

        {/* Create Order Only */}
        <button
          onClick={handleCreateOrderOnly}
          disabled={isRunning}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all disabled:opacity-50"
        >
          <Play className="w-4 h-4 text-cyan-400" />
          <span>Create Test Order (Pending)</span>
        </button>

        {/* Manual Reconcile Now */}
        <button
          onClick={handleManualReconcile}
          disabled={isRunning}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/60 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-cyan-400 ${isRunning ? 'animate-spin' : ''}`} />
          <span>Run Reconciliation Poller Now</span>
        </button>

      </div>

      {/* Live Status Message Banner */}
      {statusMsg && (
        <div className={`mt-4 p-3 rounded-lg text-xs font-medium border flex items-start space-x-2 ${
          statusMsg.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' :
          statusMsg.type === 'warning' ? 'bg-amber-950/40 border-amber-500/40 text-amber-300' :
          statusMsg.type === 'error' ? 'bg-rose-950/40 border-rose-500/40 text-rose-300' :
          'bg-blue-950/40 border-blue-500/40 text-blue-300'
        }`}>
          <div className="mt-0.5 shrink-0">
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
          </div>
          <span className="leading-relaxed">{statusMsg.text}</span>
        </div>
      )}

    </div>
  );
}
