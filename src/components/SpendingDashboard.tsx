// src/components/SpendingDashboard.tsx
// Real-time financial dashboard displaying server-calculated spending metrics,
// budget utilization rates, daily remaining allowances, and transaction logs.
// Strictly calculates spending using verified successful captures only (cancelled and failed are excluded).

'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  WalletIcon,
  TrendingUpIcon,
  ShieldCheckIcon,
  HistoryIcon,
  ArrowRightIcon,
  CreditCardIcon,
  RefreshCwIcon,
  SparklesIcon,
  AlertCircleIcon,
  SlidersIcon,
} from './Icons';

export default function SpendingDashboard() {
  const { state, loadSpendingSummary, dispatch } = useApp();
  const { spendingSummary, budget } = state;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  async function fetchSummary() {
    setIsLoading(true);
    setError(null);
    try {
      await loadSpendingSummary();
    } catch (err) {
      console.error('Failed to load spending summary:', err);
      setError('Unable to load real-time spending calculations from server.');
    } finally {
      setIsLoading(false);
    }
  }

  // Safe fallback to budget values from state if summary is loading
  const totalSpent = spendingSummary?.totalSpending ?? 0;
  const orderCount = spendingSummary?.orderCount ?? 0;
  const todaySpent = spendingSummary?.todaySpending ?? 0;
  const dailyLimit = spendingSummary?.dailySpendingLimit ?? budget?.dailySpendingLimit ?? 200;
  const remainingDaily = spendingSummary?.remainingDailyBudget ?? Math.max(0, dailyLimit - todaySpent);
  const maxPurchase = spendingSummary?.maxPurchaseAmount ?? budget?.maxPurchaseAmount ?? 100;
  const utilization = spendingSummary?.budgetUtilization ?? (dailyLimit > 0 ? (todaySpent / dailyLimit) * 100 : 0);
  const recentOrders = spendingSummary?.recentOrders ?? [];

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8">
      {/* Page Title & Navigation Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <WalletIcon className="w-6 h-6 text-blue-600" />
              Spending & Budget Dashboard
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              PayPal Sandbox Test
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Calculated strictly from server-verified successful captures · Cancelled or failed attempts are excluded
          </p>
        </div>

        {/* Quick Navigation Controls */}
        <div className="flex items-center space-x-2 flex-wrap">
          <button
            onClick={() => dispatch({ type: 'SET_PAGE', payload: 'orders' })}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <HistoryIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>Order History</span>
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_PAGE', payload: 'assistant' })}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>Shop with AI</span>
          </button>
          <button
            onClick={fetchSummary}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh spending metrics"
            aria-label="Refresh dashboard"
          >
            <RefreshCwIcon className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-900">
          <div className="flex items-center space-x-2">
            <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchSummary}
            className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Verified Spending Policy Banner */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start space-x-3 text-xs text-slate-600">
        <ShieldCheckIcon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-slate-900 block">Strict Verified Spending Policy</span>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Total spending and daily balances are calculated exclusively from successful payments (<code className="text-slate-800 font-mono">status: COMPLETED</code>). Unapproved, cancelled, or failed transactions are strictly ignored and contribute <strong>$0.00</strong> to your spending totals.
          </p>
        </div>
      </div>

      {/* 6 Core Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Metric 1: Total Successful Spending */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Successful Spending
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <WalletIcon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">${totalSpent.toFixed(2)}</span>
            <span className="text-xs text-slate-400 block mt-0.5">USD (Sandbox)</span>
          </div>
          <div className="mt-3 text-[11px] text-emerald-600 font-medium flex items-center gap-1 border-t border-slate-100 pt-2">
            <ShieldCheckIcon className="w-3.5 h-3.5" />
            Verified successful captures only
          </div>
        </div>

        {/* Metric 2: Number of Successful Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Successful Orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheckIcon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">{orderCount}</span>
            <span className="text-xs text-slate-400 block mt-0.5">completed transactions</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span>Cancelled/Failed:</span>
            <span className="text-slate-700 font-semibold">
              {(state.orders.length - orderCount) >= 0 ? state.orders.length - orderCount : 0} excluded
            </span>
          </div>
        </div>

        {/* Metric 3: Today's Spending */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Today&apos;s Spending
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUpIcon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">${todaySpent.toFixed(2)}</span>
            <span className="text-xs text-slate-400 block mt-0.5">USD spent today</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span>Budget Utilization:</span>
            <span className="font-semibold text-slate-800">{utilization.toFixed(1)}%</span>
          </div>
        </div>

        {/* Metric 4: Daily Spending Limit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Daily Spending Limit
            </span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <SlidersIcon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">${dailyLimit.toFixed(2)}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Maximum allowable per day</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            <button
              onClick={() => dispatch({ type: 'SET_PAGE', payload: 'budget' })}
              className="text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              Adjust Daily Limit <ArrowRightIcon className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Metric 5: Remaining Daily Budget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Remaining Daily Budget
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheckIcon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className={`text-2xl font-bold ${remainingDaily > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ${remainingDaily.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">Available for purchases today</span>
          </div>
          <div className="mt-3 text-[11px] text-emerald-700 font-medium border-t border-slate-100 pt-2 flex items-center gap-1">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500" />
            Active budget protection guard
          </div>
        </div>

        {/* Metric 6: Maximum Single Purchase Limit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Max Purchase Limit
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCardIcon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">${maxPurchase.toFixed(2)}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Per-item safety ceiling</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            <button
              onClick={() => dispatch({ type: 'SET_PAGE', payload: 'budget' })}
              className="text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              Configure Single Limit <ArrowRightIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Budget Utilization & Guardrail Progress */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Today&apos;s Budget Utilization</h3>
            <p className="text-xs text-slate-500">Automated server-side threshold monitoring</p>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              utilization >= 90
                ? 'bg-rose-100 text-rose-800'
                : utilization >= 60
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {utilization >= 90 ? 'High Spending Alert' : utilization >= 60 ? 'Moderate Spend' : 'Within Safe Limits'}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              utilization >= 90
                ? 'bg-rose-500'
                : utilization >= 60
                ? 'bg-amber-500'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, utilization))}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>Spent today: ${todaySpent.toFixed(2)}</span>
          <span className="font-semibold text-slate-700">Remaining daily allowance: ${remainingDaily.toFixed(2)}</span>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HistoryIcon className="w-5 h-5 text-blue-600" />
              Recent Verified Activity
            </h3>
            <p className="text-xs text-slate-500">Latest recorded transactions from server database</p>
          </div>
          <button
            onClick={() => dispatch({ type: 'SET_PAGE', payload: 'orders' })}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            View all orders <ArrowRightIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            <p className="mb-2">No transactions recorded yet.</p>
            <p className="text-xs text-slate-400">
              Use the AI Shopping Assistant to select a product and complete your first PayPal Sandbox demo purchase!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Order ID</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentOrders.map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-slate-900 max-w-[200px] truncate">
                      {ord.product_name || ord.productName}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-500">
                      {(ord.paypal_order_id || ord.paypalOrderId || ord.id).slice(0, 18)}...
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">
                      ${Number(ord.amount).toFixed(2)} USD
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          (ord.payment_status || ord.paymentStatus) === 'captured'
                            ? 'bg-emerald-100 text-emerald-800'
                            : (ord.payment_status || ord.paymentStatus) === 'cancelled'
                            ? 'bg-amber-100 text-amber-800'
                            : (ord.payment_status || ord.paymentStatus) === 'failed'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {((ord.payment_status || ord.paymentStatus) === 'captured' ? 'SUCCESSFUL' : (ord.payment_status || ord.paymentStatus || 'PENDING')).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400">
                      {new Date(ord.created_at || ord.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
