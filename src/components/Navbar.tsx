// src/components/Navbar.tsx
// Top header bar with quick fintech stats, mobile menu trigger, and environment status

'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { MenuIcon, ShieldCheckIcon, WalletIcon } from './Icons';

export default function Navbar() {
  const { state, dispatch } = useApp();
  const { activePage, spendingSummary, budget } = state;

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    assistant: {
      title: 'AI Shopping Assistant',
      subtitle: 'Natural language shopping with intelligent budget protection',
    },
    comparison: {
      title: 'Product Comparison',
      subtitle: 'Side-by-side analysis of features, pricing, and AI recommendation rationale',
    },
    spending: {
      title: 'Spending Dashboard',
      subtitle: 'Track real-time transactions, budget utilization, and purchase limits',
    },
    orders: {
      title: 'Order History',
      subtitle: 'Verified records of PayPal Sandbox captured transactions',
    },
    budget: {
      title: 'Budget Settings',
      subtitle: 'Configure automated spending controls and maximum item limits',
    },
  };

  const current = pageTitles[activePage] || {
    title: 'AgentPay',
    subtitle: 'AI-Powered Agentic Shopping & Payment Assistant',
  };

  return (
    <header className="h-18 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          <MenuIcon className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {current.title}
          </h2>
          <p className="text-xs text-slate-500 hidden sm:block">{current.subtitle}</p>
        </div>
      </div>

      {/* Quick Nav Links for Primary Views */}
      <div className="hidden xl:flex items-center space-x-1 bg-slate-100/80 p-1 rounded-xl text-xs font-semibold">
        <button
          onClick={() => dispatch({ type: 'SET_PAGE', payload: 'assistant' })}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activePage === 'assistant' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Shopping
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_PAGE', payload: 'spending' })}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activePage === 'spending' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_PAGE', payload: 'orders' })}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activePage === 'orders' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Order History
        </button>
      </div>

      <div className="flex items-center space-x-3">
        {/* Real-time Budget Pill */}
        <div className="hidden md:flex items-center space-x-2 bg-slate-50 border border-slate-200/80 px-3.5 py-1.5 rounded-full text-xs">
          <WalletIcon className="w-4 h-4 text-blue-600" />
          <span className="text-slate-500 font-medium">Daily Left:</span>
          <span className="font-bold text-slate-900">
            ${spendingSummary ? spendingSummary.remainingDailyBudget.toFixed(2) : (budget?.dailySpendingLimit ? budget.dailySpendingLimit.toFixed(2) : '200.00')}
          </span>
        </div>

        {/* Sandbox Indicator */}
        <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-full text-xs font-semibold">
          <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
          <span>Sandbox Mode</span>
        </div>

        {/* Demo User Badge */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            DU
          </div>
          <span className="text-xs font-medium text-slate-700 hidden sm:inline">Demo User</span>
        </div>
      </div>
    </header>
  );
}

