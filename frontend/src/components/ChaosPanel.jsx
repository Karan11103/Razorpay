import React, { useState, useEffect } from 'react';
import { Sliders, Play, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
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

  // Full Ghost Payment Demo: Checkout -> Webhook Drop -> Immediate Auto-Reconciliation
  const handleFullGhostScenario = async () => {
    setIsRunning(true);
    setStatusMsg({ type: 'info', text: 'Simulating checkout order on Razorpay Gateway...' });
    try {
      const paise = Math.round(amountRupees * 100);
      const order = await simulateCheckout(paise, 'INR');

      setStatusMsg({
        type: 'info',
        text: `Order ${order.id} generated. Simulating network failure (silent webhook drop)...`
      });

      await simulateWebhook(order.id, 'drop');
      await new Promise(r => setTimeout(r, 400));
      await triggerReconcile(0);

      setStatusMsg({
        type: 'success',
        text: `Ghost payment resolved: Gate verified captured gateway state for order ${order.id} and auto-corrected order.`
      });

      if (onActionComplete) onActionComplete();
    } catch (err) {
      setStatusMsg({ type: 'error', text: `Simulation error: ${err.message}` });
    } finally {
      setIsRunning(false);
    }
  };

  const handleCorruptedWebhookScenario = async () => {
    setIsRunning(true);
    try {
      const paise = Math.round(amountRupees * 100);
      const order = await simulateCheckout(paise, 'INR');
      await simulateWebhook(order.id, 'corrupt');
      await triggerReconcile(0);
      setStatusMsg({
        type: 'warning',
        text: `Tampered signature detected for ${order.id}. Auto-correction safely blocked; sent to Escalation Queue.`
      });
      if (onActionComplete) onActionComplete();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  const handleManualReconcile = async () => {
    setIsRunning(true);
    try {
      const result = await triggerReconcile(0);
      const d = result.data;
      setStatusMsg({
        type: 'success',
        text: `Batch complete: ${d.scanned_count} scanned, ${d.auto_corrected_count} auto-corrected, ${d.escalated_count} escalated.`
      });
      if (onActionComplete) onActionComplete();
    } catch (err) {
      setStatusMsg({ type: 'error', text: `Reconciliation error: ${err.message}` });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-[#0F1626] rounded-lg border border-slate-800 p-5 shadow-sm mb-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Developer Sandbox & Chaos Testing
            </h3>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
              Isolated Test Relay
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure failure probabilities or trigger one-click simulations to test reconciliation resilience.
          </p>
        </div>

        {/* Amount Input */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Test Amount:</span>
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded px-2 py-1">
            <span className="text-slate-400 text-xs mr-1">₹</span>
            <input
              type="number"
              value={amountRupees}
              onChange={(e) => setAmountRupees(Number(e.target.value))}
              className="w-16 bg-transparent text-white font-mono font-medium focus:outline-none text-xs"
            />
          </div>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        
        <div className="bg-slate-900/60 p-3 rounded border border-slate-800/80">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-300 font-medium">Webhook Drop Rate</span>
            <span className="font-mono text-slate-200 font-semibold">{dropRate}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={dropRate}
            onChange={(e) => handleSliderChange(Number(e.target.value), delayRate, corruptRate)}
            className="w-full h-1 bg-slate-700 rounded cursor-pointer accent-[#0C66E4]"
          />
          <span className="text-[10px] text-slate-500 block mt-1">Silent network drops</span>
        </div>

        <div className="bg-slate-900/60 p-3 rounded border border-slate-800/80">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-300 font-medium">Delay Rate</span>
            <span className="font-mono text-slate-200 font-semibold">{delayRate}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={delayRate}
            onChange={(e) => handleSliderChange(dropRate, Number(e.target.value), corruptRate)}
            className="w-full h-1 bg-slate-700 rounded cursor-pointer accent-[#0C66E4]"
          />
          <span className="text-[10px] text-slate-500 block mt-1">Queue latency spikes</span>
        </div>

        <div className="bg-slate-900/60 p-3 rounded border border-slate-800/80">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-300 font-medium">Corruption Rate</span>
            <span className="font-mono text-slate-200 font-semibold">{corruptRate}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={corruptRate}
            onChange={(e) => handleSliderChange(dropRate, delayRate, Number(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded cursor-pointer accent-[#0C66E4]"
          />
          <span className="text-[10px] text-slate-500 block mt-1">Signature tampering</span>
        </div>

        <div className="bg-slate-900/60 p-3 rounded border border-slate-800/80">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-300 font-medium">Normal Delivery</span>
            <span className="font-mono text-emerald-400 font-semibold">{passRate}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded overflow-hidden mt-2">
            <div className="bg-emerald-500 h-full" style={{ width: `${passRate}%` }} />
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">Healthy transit</span>
        </div>

      </div>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          onClick={handleFullGhostScenario}
          disabled={isRunning}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-[#0C66E4] hover:bg-[#0052CC] text-white transition-colors disabled:opacity-50 shadow-sm"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Simulate Ghost Payment Scenario</span>
        </button>

        <button
          onClick={handleCorruptedWebhookScenario}
          disabled={isRunning}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Simulate Corrupted Signature</span>
        </button>

        <button
          onClick={handleManualReconcile}
          disabled={isRunning}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isRunning ? 'animate-spin' : ''}`} />
          <span>Trigger Reconciliation Poller</span>
        </button>
      </div>

      {/* Clean Status Banner */}
      {statusMsg && (
        <div className={`mt-3.5 p-2.5 rounded text-xs font-medium border flex items-center space-x-2 ${
          statusMsg.type === 'success' ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300' :
          statusMsg.type === 'warning' ? 'bg-amber-950/40 border-amber-800/50 text-amber-300' :
          statusMsg.type === 'error' ? 'bg-rose-950/40 border-rose-800/50 text-rose-300' :
          'bg-slate-900 border-slate-700 text-slate-300'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

    </div>
  );
}
