// src/components/OrderHistory.tsx
// Verified transaction audit log displaying all captured, pending, cancelled, and failed PayPal Sandbox orders
// Features strict status verification, capture ID tracking, filter tabs, and responsive fintech styling

'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  HistoryIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  ArrowRightIcon,
  WalletIcon,
  SparklesIcon,
} from './Icons';

export default function OrderHistory() {
  const { state, loadOrders, dispatch } = useApp();
  const { orders } = state;

  const [filter, setFilter] = useState<'all' | 'captured' | 'pending' | 'cancelled' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setIsLoading(true);
    setError(null);
    try {
      await loadOrders();
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError('Could not connect to the database to load order history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Filter logic
  const filteredOrders = orders.filter((o) => {
    // Status filter
    if (filter === 'captured' && o.paymentStatus !== 'captured') return false;
    if (filter === 'pending' && o.paymentStatus !== 'pending' && o.paymentStatus !== 'approved') return false;
    if (filter === 'cancelled' && o.paymentStatus !== 'cancelled') return false;
    if (filter === 'failed' && o.paymentStatus !== 'failed') return false;

    // Search query filter (by product name or PayPal Order ID)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = o.productName?.toLowerCase().includes(q);
      const matchOrder = o.paypalOrderId?.toLowerCase().includes(q);
      const matchCapture = o.paypalCaptureId?.toLowerCase().includes(q);
      return matchName || matchOrder || matchCapture;
    }

    return true;
  });

  // Calculate verified successful spend strictly from captured orders
  const capturedOrders = orders.filter((o) => o.paymentStatus === 'captured');
  const totalVerifiedSpent = capturedOrders.reduce((sum, o) => sum + o.amount, 0);

  function getStatusBadge(status: string) {
    switch (status) {
      case 'captured':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Successful
          </span>
        );
      case 'pending':
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Pending Approval
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            Cancelled
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
            {status.toUpperCase()}
          </span>
        );
    }
  }

  function formatDateTime(isoString: string) {
    try {
      const d = new Date(isoString);
      return {
        date: d.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        time: d.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };
    } catch {
      return { date: isoString, time: '' };
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Page Title & Navigation Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <HistoryIcon className="w-6 h-6 text-blue-600" />
              Order History & Audit Log
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              PayPal Sandbox Test
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Verified server records · Only completed captures reflect as spending
          </p>
        </div>

        {/* Quick Links & Refresh */}
        <div className="flex items-center space-x-2 flex-wrap">
          <button
            onClick={() => dispatch({ type: 'SET_PAGE', payload: 'spending' })}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <WalletIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>Spending Dashboard</span>
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_PAGE', payload: 'assistant' })}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>Shop with AI</span>
          </button>
          <button
            onClick={fetchOrders}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh order history"
            aria-label="Refresh orders"
          >
            <RefreshCwIcon className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Verified Total Spent
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            ${totalVerifiedSpent.toFixed(2)} USD
          </span>
          <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
            <ShieldCheckIcon className="w-3.5 h-3.5" />
            Captured purchases only
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Successful Orders
          </span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">
            {capturedOrders.length}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            Out of {orders.length} total attempts
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Non-Spending Sessions
          </span>
          <span className="text-2xl font-bold text-slate-600 mt-1 block">
            {orders.filter((o) => o.paymentStatus !== 'captured').length}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            Cancelled, pending, or failed ($0.00 counted)
          </span>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              filter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setFilter('captured')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              filter === 'captured'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Successful ({capturedOrders.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              filter === 'pending'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Pending ({orders.filter((o) => o.paymentStatus === 'pending' || o.paymentStatus === 'approved').length})
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              filter === 'cancelled'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Cancelled ({orders.filter((o) => o.paymentStatus === 'cancelled').length})
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              filter === 'failed'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Failed ({orders.filter((o) => o.paymentStatus === 'failed').length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product or order ID..."
            className="w-full sm:w-64 px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-900">
          <div className="flex items-center space-x-2">
            <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchOrders}
            className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* LOADING STATE */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-slate-200 rounded-xl" />
                <div className="space-y-2">
                  <div className="w-48 h-4 bg-slate-200 rounded" />
                  <div className="w-32 h-3 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="w-24 h-6 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {!isLoading && !error && filteredOrders.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingBagIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-base">No Orders Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `No orders matching "${searchQuery}". Try clearing your search.`
                : 'No transactions found under this status filter.'}
            </p>
          </div>
          <button
            onClick={() => dispatch({ type: 'SET_PAGE', payload: 'assistant' })}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <SparklesIcon className="w-4 h-4" />
            <span>Discover Products with AI</span>
          </button>
        </div>
      )}

      {/* ORDERS LIST */}
      {!isLoading && !error && filteredOrders.length > 0 && (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const dt = formatDateTime(order.createdAt);
            const isCaptured = order.paymentStatus === 'captured';

            return (
              <div
                key={order.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Product Image & Details */}
                <div className="flex items-center space-x-4 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={order.productImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'}
                    alt={order.productName}
                    className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200/50"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{order.productName}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                      <span suppressHydrationWarning className="font-medium text-slate-700">
                        {dt.date} at {dt.time}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200/60">
                        Order: {order.paypalOrderId}
                      </span>
                      {order.paypalCaptureId && (
                        <span className="font-mono text-[11px] bg-emerald-50 px-2 py-0.5 rounded text-emerald-700 border border-emerald-200 font-semibold">
                          Capture ID: {order.paypalCaptureId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Price, Status & Metadata */}
                <div className="flex items-center justify-between md:justify-end space-x-4 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-base font-bold text-slate-900 block">
                      ${order.amount.toFixed(2)} {order.currency}
                    </span>
                    {order.displayAmount && order.displayCurrency && order.displayCurrency !== order.currency && (
                      <span className="text-xs text-blue-600 font-medium block">
                        ≈ {order.displayCurrency} {order.displayAmount.toFixed(2)}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {isCaptured ? 'Captured in Sandbox' : 'No Charge Recorded'}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>{getStatusBadge(order.paymentStatus)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
