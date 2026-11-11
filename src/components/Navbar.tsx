// src/components/Navbar.tsx
// Top header bar with quick fintech stats, mobile menu trigger, and environment status

'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { MenuIcon, ShieldCheckIcon, WalletIcon } from './Icons';

export default function Navbar() {
  const { state, dispatch, formatPrice, openCountrySelector } = useApp();
  const { activePage, spendingSummary, budget, sidebarOpen, userPreferences } = state;

  const currentCountry = userPreferences?.country || {
    flag: '🇺🇸',
    name: 'United States',
    code: 'US',
    currencyCode: 'USD',
  };

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
    rewards: {
      title: 'PayPal Rewards Intelligence',
      subtitle: 'Researched cash back rules, regional eligibility, and program mechanics',
    },
    budget: {
      title: 'Budget Settings',
      subtitle: 'Configure automated spending controls and maximum item limits',
    },
    settings: {
      title: 'Preferences & Settings',
      subtitle: 'Manage country, currency display, and account guardrails',
    },
  };

  const current = pageTitles[activePage] || {
    title: 'AgentPay',
    subtitle: 'AI-Powered Agentic Shopping & Payment Assistant',
  };

  return (
    <header className="h-16 sm:h-18 bg-white border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs shrink-0">
      <div className="flex items-center space-x-2.5 sm:space-x-4 min-w-0">
        {/* Hamburger Menu Button */}
        <button
          type="button"
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 cursor-pointer"
          aria-label="Open navigation menu"
          aria-expanded={sidebarOpen}
        >
          <MenuIcon className="w-6 h-6 text-slate-800" />
        </button>

        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 truncate">
            {current.title}
          </h2>
          <p className="text-xs text-slate-500 hidden md:block truncate">{current.subtitle}</p>
        </div>
      </div>

      {/* Quick Nav Links for Primary Views (Desktop Large) */}
      <div className="hidden xl:flex items-center space-x-1 bg-slate-100/80 p-1 rounded-xl text-xs font-semibold shrink-0">
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_PAGE', payload: 'assistant' })}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activePage === 'assistant' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Shopping
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_PAGE', payload: 'spending' })}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activePage === 'spending' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Dashboard
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_PAGE', payload: 'orders' })}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activePage === 'orders' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Order History
        </button>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Country & Currency Selector Trigger */}
        <button
          type="button"
          onClick={openCountrySelector}
          className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer"
          title="Change Country & Currency"
          aria-label="Change Country and Currency"
        >
          <span className="text-sm leading-none">{currentCountry.flag}</span>
          <span className="font-bold">{userPreferences?.currencyCode || 'USD'}</span>
        </button>

        {/* Real-time Budget Pill (Medium screens and up) */}
        <div className="hidden md:flex items-center space-x-2 bg-slate-50 border border-slate-200/80 px-3.5 py-1.5 rounded-full text-xs">
          <WalletIcon className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-slate-500 font-medium">Daily Left:</span>
          <span className="font-bold text-slate-900">
            {spendingSummary
              ? formatPrice(spendingSummary.remainingDailyBudget)
              : formatPrice(budget?.dailySpendingLimit || 200)}
          </span>
        </div>

        {/* Sandbox Indicator */}
        <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold">
          <ShieldCheckIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
          <span className="hidden sm:inline">Sandbox Mode</span>
          <span className="sm:hidden text-[11px]">Sandbox</span>
        </div>

        {/* Demo User Badge */}
        <div className="flex items-center space-x-2 pl-1.5 sm:pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
            DU
          </div>
          <span className="text-xs font-medium text-slate-700 hidden sm:inline">Demo User</span>
        </div>
      </div>
    </header>
  );
}
