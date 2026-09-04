import React from 'react';
import { ShieldCheck, Activity, Terminal, AlertTriangle, Layers, Zap } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, escalationsCount, isLive, toggleChaosModal }) {
  const tabs = [
    { id: 'dashboard', label: 'Live Dashboard', icon: Activity },
    { id: 'audit', label: 'Audit Trail', icon: Terminal },
    { 
      id: 'escalations', 
      label: 'Escalations', 
      icon: AlertTriangle,
      badge: escalationsCount > 0 ? escalationsCount : null 
    },
    { id: 'simulation', label: 'Chaos Simulation', icon: Zap, highlight: true },
    { id: 'architecture', label: 'Architecture & Boundary', icon: Layers },
  ];

  return (
    <header className="border-b border-slate-800 bg-[#0c1220]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">Ghost Payment Detector</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  Razorpay AI Buildathon
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono hidden sm:block">
                Deterministic Gated Autonomous Reconciliation
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                      : tab.highlight
                      ? 'text-amber-400 hover:bg-amber-500/10 hover:text-amber-300'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${tab.highlight && !isActive ? 'text-amber-400 animate-pulse' : ''}`} />
                  <span className="hidden md:inline">{tab.label}</span>
                  {tab.badge && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-bounce">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* System Live Pill */}
          <div className="hidden lg:flex items-center space-x-2 pl-4 border-l border-slate-800">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="text-right">
              <p className="text-[11px] font-semibold text-slate-300">POLler ACTIVE</p>
              <p className="text-[10px] font-mono text-emerald-400">30s Cron Sync</p>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
