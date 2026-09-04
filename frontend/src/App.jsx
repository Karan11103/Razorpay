import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import StatCards from './components/StatCards';
import LiveFeed from './components/LiveFeed';
import ChaosPanel from './components/ChaosPanel';
import AuditTable from './components/AuditTable';
import EscalationQueue from './components/EscalationQueue';
import ArchitectureView from './components/ArchitectureView';
import { fetchStats, fetchRecentEvents, fetchEscalations, simulateCheckout, simulateWebhook, triggerReconcile } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    ghost_payments_caught_count: 0,
    ghost_payments_caught_rupees: 0,
    auto_corrected_count: 0,
    escalated_count: 0,
    total_reconciled: 0,
    avg_detection_latency_seconds: 0,
    active_pending_count: 0
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [escalationsCount, setEscalationsCount] = useState(0);
  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [isHeroSimulating, setIsHeroSimulating] = useState(false);

  // Poll stats and recent events every 3.5 seconds
  const refreshData = useCallback(async () => {
    try {
      const [statsData, eventsData, escData] = await Promise.all([
        fetchStats().catch(() => null),
        fetchRecentEvents().catch(() => null),
        fetchEscalations().catch(() => null)
      ]);

      if (statsData) setStats(statsData);
      if (eventsData) setRecentEvents(eventsData);
      if (escData) setEscalationsCount(escData.length);
    } catch (e) {
      console.error('Polling error:', e);
    }
  }, []);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3500);
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleManualFeedRefresh = async () => {
    setIsFeedLoading(true);
    await refreshData();
    setIsFeedLoading(false);
  };

  // Quick Ghost Payment Simulation triggered from Hero or Navbar
  const handleQuickGhostSimulation = async () => {
    setIsHeroSimulating(true);
    try {
      const order = await simulateCheckout(49900, 'INR');
      await simulateWebhook(order.id, 'drop');
      await new Promise(r => setTimeout(r, 400));
      await triggerReconcile(0);
      await refreshData();
      setActiveTab('dashboard');
    } catch (err) {
      console.error('Quick simulation failed:', err);
    } finally {
      setIsHeroSimulating(false);
    }
  };

  const handleTriggerPoller = async () => {
    setIsHeroSimulating(true);
    try {
      await triggerReconcile(0);
      await refreshData();
    } catch (err) {
      console.error('Poller trigger failed:', err);
    } finally {
      setIsHeroSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-[#FBF7EE] flex flex-col font-sans selection:bg-[#FBF7EE] selection:text-[#07090E]">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        escalationsCount={escalationsCount}
        onQuickDemo={handleQuickGhostSimulation}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Overview Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Moody, Bold Razorpay Buildathon Hero Banner */}
            <HeroBanner
              onSimulateGhost={handleQuickGhostSimulation}
              onTriggerPoller={handleTriggerPoller}
              isRunning={isHeroSimulating}
            />

            {/* Clean Metric Cards */}
            <StatCards stats={stats} />

            {/* Sandbox Controls */}
            <ChaosPanel onActionComplete={refreshData} />

            {/* Live Stream Activity Feed */}
            <LiveFeed
              events={recentEvents}
              isLoading={isFeedLoading}
              onRefresh={handleManualFeedRefresh}
            />
          </div>
        )}

        {/* Audit Trail Tab */}
        {activeTab === 'audit' && (
          <div className="animate-fadeIn">
            <AuditTable />
          </div>
        )}

        {/* Escalations Tab */}
        {activeTab === 'escalations' && (
          <div className="animate-fadeIn">
            <EscalationQueue onResolved={refreshData} />
          </div>
        )}

        {/* Sandbox Tab */}
        {activeTab === 'simulation' && (
          <div className="space-y-6 animate-fadeIn">
            <ChaosPanel onActionComplete={refreshData} />
            <LiveFeed
              events={recentEvents}
              isLoading={isFeedLoading}
              onRefresh={handleManualFeedRefresh}
            />
          </div>
        )}

        {/* Architecture Tab */}
        {activeTab === 'architecture' && (
          <div className="animate-fadeIn">
            <ArchitectureView />
          </div>
        )}

      </main>

      {/* Atmospheric Buildathon Footer */}
      <footer className="border-t border-[#182030] bg-[#07090E] py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-300 italic">Razorpay</span>
            <span className="text-slate-600">/</span>
            <span>Ghost Payment Detector</span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">AI Buildathon Bangalore</span>
          </div>
          <div className="flex items-center space-x-3 font-mono text-[11px] text-slate-500">
            <span>/ Deterministic Gate</span>
            <span>/ O(1) Idempotency</span>
            <span>/ Isolated LLM Explainer</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
