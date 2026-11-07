// src/components/Sidebar.tsx
// Fintech dashboard sidebar with navigation, brand identity, and live budget status

'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  SparklesIcon,
  ShoppingBagIcon,
  WalletIcon,
  SlidersIcon,
  HistoryIcon,
  ShieldCheckIcon,
  LayersIcon,
} from './Icons';

export default function Sidebar() {
  const { state, dispatch } = useApp();
  const { activePage, budget, spendingSummary } = state;

  const navItems = [
    { id: 'assistant', label: 'AI Shopping Assistant', icon: SparklesIcon, badge: 'Agentic' },
    { id: 'comparison', label: 'Product Comparison', icon: LayersIcon },
    { id: 'spending', label: 'Spending Dashboard', icon: WalletIcon },
    { id: 'orders', label: 'Order History', icon: HistoryIcon, count: state.orders.length },
    { id: 'budget', label: 'Budget Settings', icon: SlidersIcon },
  ];

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col justify-between transition-transform duration-300 ease-in-out border-r border-slate-800 ${
        state.sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                AgentPay
                <span className="text-[10px] uppercase font-semibold bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30">
                  AI Pay
                </span>
              </h1>
              <p className="text-xs text-slate-400">Find smarter. Spend safer.</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Platform
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => dispatch({ type: 'SET_PAGE', payload: item.id })}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold bg-violet-500/30 text-violet-200 px-1.5 py-0.5 rounded-full border border-violet-400/20">
                    {item.badge}
                  </span>
                )}
                {typeof item.count === 'number' && item.count > 0 && (
                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Live Budget Overview */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/60">
        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 mb-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-medium">Daily Budget</span>
            <span className="text-emerald-400 font-semibold">
              ${spendingSummary ? spendingSummary.remainingDailyBudget.toFixed(2) : '200.00'} left
            </span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-500"
              style={{
                width: `${Math.min(100, spendingSummary ? spendingSummary.budgetUtilization : 0)}%`,
              }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2">
            <span>Limit: ${budget ? budget.dailySpendingLimit.toFixed(2) : '200.00'}</span>
            <span>Max item: ${budget ? budget.maxPurchaseAmount.toFixed(2) : '100.00'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between px-2 py-1.5 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-300">PayPal Sandbox</span>
          </div>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700">
            REST v2
          </span>
        </div>
      </div>
    </aside>
  );
}

