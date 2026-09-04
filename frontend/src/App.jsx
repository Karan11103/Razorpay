import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatCards from './components/StatCards';
import LiveFeed from './components/LiveFeed';
import ChaosPanel from './components/ChaosPanel';
import AuditTable from './components/AuditTable';
import EscalationQueue from './components/EscalationQueue';
import ArchitectureView from './components/ArchitectureView';
import { fetchStats, fetchRecentEvents, fetchEscalations } from './services/api';

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
    // 3.5s interval (complies with "poll every 3-5 seconds — not under 2s")
    const interval = setInterval(refreshData, 3500);
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleManualFeedRefresh = async () => {
    setIsFeedLoading(true);
    await refreshData();
    setIsFeedLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        escalationsCount={escalationsCount}
        isLive={true}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Stat Cards */}
            <StatCards stats={stats} onReconcileClick={refreshData} />

            {/* Embedded Simulation Controls Banner for live demos */}
            <ChaosPanel onActionComplete={refreshData} />

            {/* Live Event Stream Feed */}
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

        {/* Escalations Queue Tab */}
        {activeTab === 'escalations' && (
          <div className="animate-fadeIn">
            <EscalationQueue onResolved={refreshData} />
          </div>
        )}

        {/* Simulation Controls Dedicated Tab */}
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

        {/* Architecture & Complexity Tab */}
        {activeTab === 'architecture' && (
          <div className="animate-fadeIn">
            <ArchitectureView />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/80 bg-[#080d1a] py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Ghost Payment Detector — Razorpay AI Buildathon</span>
          <div className="flex items-center space-x-4">
            <span className="text-slate-400">Deterministic Bounded Reconciler</span>
            <span>•</span>
            <span className="text-cyan-400 font-mono">O(1) Idempotency</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono">Isolated LLM</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
