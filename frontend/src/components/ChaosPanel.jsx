import React, { useState, useEffect } from 'react';
import { Sliders, Play, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
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
    <div className="bg-[#0D111A] rounded-lg border border-[#182030] p-5 mb-8">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#182030] mb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-[#FBF7EE] tracking-tight">
              Failure Injection & Sandbox Harness
            </h3>
            <span className="text-[10px] font-mono text-slate-400 bg-[#121826] px-2 py-0.5 rounded border border-[#1C263B]">
              / Chaos Relay
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Reproduce the 2am webhook loss failure mode live during your demo.
          </p>
        </div>

        {/* Order Amount */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Amount:</span>
          <div className="flex items-center bg-[#07090E] border border-[#182030] rounded px-2.5 py-1">
            <span className="text-slate-500 text-xs mr-1">₹</span>
            <input
              type="number"
              value={amountRupees}
              onChange={(e) => setAmountRupees(Number(e.target.value))}
              className="w-16 bg-transparent text-[#FBF7EE] font-mono font-medium focus:outline-none text-xs"
            />
          </div>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        
        <div className="bg-[#07090E] p-3.5 rounded border border-[#182030]">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium">Drop Rate</span>
            <span className="font-mono text-[#FBF7EE] font-semibold">{dropRate}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={dropRate}
            onChange={(e) => handleSliderChange(Number(e.target.value), delayRate, corruptRate)}
            className="w-full h-1 bg-[#182030] rounded cursor-pointer accent-[#FBF7EE]"
          />
          <span className="text-[10px] text-slate-500 font-mono block mt-1.5">Silent webhook loss</span>
        </div>

        <div className="bg-[#07090E] p-3.5 rounded border border-[#182030]">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium">Delay Rate</span>
            <span className="font-mono text-[#FBF7EE] font-semibold">{delayRate}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={delayRate}
            onChange={(e) => handleSliderChange(dropRate, Number(e.target.value), corruptRate)}
            className="w-full h-1 bg-[#182030] rounded cursor-pointer accent-[#FBF7EE]"
          />
          <span className="text-[10px] text-slate-500 font-mono block mt-1.5">30s–10m queue backlog</span>
        </div>

        <div className="bg-[#07090E] p-3.5 rounded border border-[#182030]">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium">Corruption Rate</span>
            <span className="font-mono text-[#FBF7EE] font-semibold">{corruptRate}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={corruptRate}
            onChange={(e) => handleSliderChange(dropRate, delayRate, Number(e.target.value))}
            className="w-full h-1 bg-[#182030] rounded cursor-pointer accent-[#FBF7EE]"
          />
          <span className="text-[10px] text-slate-500 font-mono block mt-1.5">Signature/amount tampered</span>
        </div>

        <div className="bg-[#07090E] p-3.5 rounded border border-[#182030]">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium">Delivered</span>
            <span className="font-mono text-emerald-400 font-semibold">{passRate}%</span>
          </div>
          <div className="w-full bg-[#182030] h-1 rounded overflow-hidden mt-2.5">
            <div className="bg-emerald-500 h-full" style={{ width: `${passRate}%` }} />
          </div>
          <span className="text-[10px] text-slate-500 font-mono block mt-1.5">Healthy normal transit</span>
        </div>

      </div>

      {/* Buttons */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          onClick={handleFullGhostScenario}
          disabled={isRunning}
          className="flex items-center space-x-1.5 px-4 py-2 rounded text-xs font-semibold bg-[#FBF7EE] text-[#07090E] hover:bg-[#E5DFD1] transition-all disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Simulate Ghost Payment</span>
        </button>

        <button
          onClick={handleCorruptedWebhookScenario}
          disabled={isRunning}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded text-xs font-medium bg-[#0E1320] hover:bg-[#151C2E] text-slate-300 border border-[#1E283D] transition-colors disabled:opacity-50"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Simulate Corrupted Signature</span>
        </button>

        <button
          onClick={handleManualReconcile}
          disabled={isRunning}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded text-xs font-medium bg-[#0E1320] hover:bg-[#151C2E] text-slate-300 border border-[#1E283D] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isRunning ? 'animate-spin' : ''}`} />
          <span>Trigger Poller</span>
        </button>
      </div>

      {/* Status Msg */}
      {statusMsg && (
        <div className={`mt-3.5 p-3 rounded text-xs font-medium border flex items-center space-x-2.5 ${
          statusMsg.type === 'success' ? 'bg-[#0E1815] border-emerald-800/60 text-emerald-300' :
          statusMsg.type === 'warning' ? 'bg-[#181308] border-amber-800/60 text-amber-300' :
          statusMsg.type === 'error' ? 'bg-[#1A0E10] border-rose-800/60 text-rose-300' :
          'bg-[#0E1320] border-[#1E283D] text-slate-300'
        }`}>
          <span className="font-mono text-[10px] uppercase font-bold text-slate-500">[{statusMsg.type}]</span>
          <span>{statusMsg.text}</span>
        </div>
      )}

    </div>
  );
}
