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
    const interval = setInterval(refreshData, 3500);
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleManualFeedRefresh = async () => {
    setIsFeedLoading(true);
    await refreshData();
    setIsFeedLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans">
      
      {/* Top Enterprise Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        escalationsCount={escalationsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Metric Cards */}
            <StatCards stats={stats} />

            {/* Developer Sandbox Controls */}
            <ChaosPanel onActionComplete={refreshData} />

            {/* Reconciliation Stream */}
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

        {/* Simulation Controls Dedicated View */}
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

      {/* Enterprise Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0B111E] py-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Razorpay AI Buildathon • Track 01 (Agentic Commerce) / Track 03 (Revenue Recovery)</span>
          <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-500">
            <span>Deterministic Gate</span>
            <span>•</span>
            <span>O(1) Idempotency</span>
            <span>•</span>
            <span>Isolated Read-Only LLM</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
