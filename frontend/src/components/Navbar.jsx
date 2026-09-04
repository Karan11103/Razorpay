import React from 'react';
import { Layers, Activity, FileText, AlertCircle, Terminal, CheckCircle2, ChevronRight } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, escalationsCount }) {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: Activity },
    { id: 'audit', label: 'Audit Trail', icon: FileText },
    { 
      id: 'escalations', 
      label: 'Escalations', 
      icon: AlertCircle,
      badge: escalationsCount > 0 ? escalationsCount : null 
    },
    { id: 'simulation', label: 'Sandbox Controls', icon: Terminal },
    { id: 'architecture', label: 'Architecture', icon: Layers },
  ];

  return (
    <header className="border-b border-slate-800 bg-[#0B111E] sticky top-0 z-30">
      {/* Top utility sub-bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 py-1.5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-2 font-medium">
          <span className="text-slate-300 font-semibold">Razorpay</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span>Payment Infrastructure</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-slate-200">Ghost Payment Reconciler</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] text-slate-300 font-mono">Gateway Poller: 30s</span>
          </div>
          <span className="text-slate-700">|</span>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
            TEST MODE
          </span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Logo & Product Name */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#0C66E4] flex items-center justify-center font-bold text-white text-sm shadow-sm">
              <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                <path d="M13.5 2L3 14h7v8l10.5-12h-7V2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-white tracking-tight text-sm sm:text-base">
                  Ghost Payment Detector
                </span>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/60">
                  Gated Engine
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#142036] text-[#3B82F6] border border-blue-900/60 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

        </div>
      </div>
    </header>
  );
}
