// src/components/Sidebar.tsx
// Fintech dashboard sidebar with navigation, brand identity, live budget status,
// and fully responsive mobile drawer with backdrop overlay and close controls.

'use client';

import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  SparklesIcon,
  WalletIcon,
  SlidersIcon,
  HistoryIcon,
  ShieldCheckIcon,
  LayersIcon,
  XIcon,
} from './Icons';

export default function Sidebar() {
  const { state, dispatch } = useApp();
  const { activePage, budget, spendingSummary, sidebarOpen } = state;

  const navItems = [
    { id: 'assistant', label: 'AI Shopping Assistant', icon: SparklesIcon, badge: 'Agentic' },
    { id: 'comparison', label: 'Product Comparison', icon: LayersIcon },
    { id: 'spending', label: 'Spending Dashboard', icon: WalletIcon },
    { id: 'orders', label: 'Order History', icon: HistoryIcon, count: state.orders.length },
    { id: 'budget', label: 'Budget Settings', icon: SlidersIcon },
  ];

  // Close sidebar on Escape key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && sidebarOpen) {
        dispatch({ type: 'CLOSE_SIDEBAR' });
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, dispatch]);

  // Lock body background scroll when mobile sidebar drawer is open
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (sidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  // Close mobile drawer on viewport resize to desktop (>= 1024px)
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024 && sidebarOpen) {
        dispatch({ type: 'CLOSE_SIDEBAR' });
        document.body.style.overflow = '';
      }
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen, dispatch]);

  function handleNavigate(pageId: string) {
    dispatch({ type: 'SET_PAGE', payload: pageId });
  }

  return (
    <>
      {/* Mobile Background Overlay (semi-transparent dark backdrop) */}
      <div
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity duration-300 lg:hidden ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => dispatch({ type: 'CLOSE_SIDEBAR' })}
        aria-label="Close navigation sidebar overlay"
        role="button"
        tabIndex={sidebarOpen ? 0 : -1}
      />

      {/* Sidebar Drawer */}
      <aside
        id="app-sidebar"
        aria-label="Main Navigation"
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[80vw] max-w-[320px] lg:w-64 bg-slate-900 text-white flex flex-col justify-between transition-transform duration-300 ease-in-out border-r border-slate-800 shadow-2xl lg:shadow-none overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="p-4 sm:p-5 lg:p-6 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <ShieldCheckIcon className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5 truncate">
                  AgentPay
                  <span className="text-[10px] uppercase font-semibold bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30">
                    AI Pay
                  </span>
                </h1>
                <p className="text-xs text-slate-400 truncate">Find smarter. Spend safer.</p>
              </div>
            </div>

            {/* Mobile Close (X) Button */}
            <button
              type="button"
              onClick={() => dispatch({ type: 'CLOSE_SIDEBAR' })}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer shrink-0"
              aria-label="Close sidebar"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 sm:p-4 space-y-1.5" aria-label="Sidebar navigation links">
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Platform
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white active:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0 ml-2">
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
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer / Live Budget Overview */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 shrink-0">
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
    </>
  );
}
