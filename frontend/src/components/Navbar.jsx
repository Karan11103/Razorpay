import React from 'react';
import { Activity, FileText, AlertCircle, Layers, Terminal, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, escalationsCount, onQuickDemo }) {
  const tabs = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'audit', label: 'Audit Trail' },
    { 
      id: 'escalations', 
      label: 'Escalations',
      badge: escalationsCount > 0 ? escalationsCount : null
    },
    { id: 'simulation', label: 'Sandbox' },
    { id: 'architecture', label: 'Architecture' },
  ];

  return (
    <header className="border-b border-[#182030] bg-[#07090E]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Slash Sub-product (Identical to razorpay.com/buildathon) */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              {/* Razorpay Brand Text Icon */}
              <span className="font-extrabold text-lg tracking-tighter text-white italic">
                Razorpay
              </span>
              <span className="text-slate-400 font-normal text-sm tracking-tight">
                /ghost-detector
              </span>
            </div>
            <span className="hidden sm:inline-block text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded bg-[#101726] text-slate-400 border border-[#1E283D] ml-2">
              Track 01 • Agentic Commerce
            </span>
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            
            {/* Nav Tabs */}
            <nav className="flex items-center space-x-1 sm:space-x-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-3 py-1.5 rounded-md text-xs sm:text-sm transition-all ${
                      isActive
                        ? 'text-[#FBF7EE] font-semibold bg-[#111726]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#0E1320]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Status indicator */}
            <div className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-slate-400">poller active</span>
            </div>

            {/* Cream Primary Button (like "Apply now" in buildathon) */}
            <button
              onClick={onQuickDemo}
              className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#FBF7EE] text-[#07090E] hover:bg-[#E5DFD1] transition-all shadow-sm active:scale-95"
            >
              Simulate 2am Drop
            </button>

          </div>

        </div>
      </div>
    </header>
  );
}
