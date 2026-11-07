// src/components/BudgetSettings.tsx
// Interactive budget and spending limit management screen with server-side validation

'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  SlidersIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  WalletIcon,
  CreditCardIcon,
} from './Icons';

export default function BudgetSettings() {
  const { state, saveBudget, loadBudget, loadSpendingSummary } = useApp();
  const { budget } = state;

  const [maxPurchase, setMaxPurchase] = useState<number>(100);
  const [dailyLimit, setDailyLimit] = useState<number>(200);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadBudget();
  }, [loadBudget]);

  useEffect(() => {
    if (budget) {
      setMaxPurchase(budget.maxPurchaseAmount);
      setDailyLimit(budget.dailySpendingLimit);
    }
  }, [budget]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage('');
    setSaveSuccess(false);

    if (maxPurchase <= 0) {
      setErrorMessage('Maximum purchase amount must be greater than $0.');
      return;
    }
    if (dailyLimit <= 0) {
      setErrorMessage('Daily spending limit must be greater than $0.');
      return;
    }
    if (maxPurchase > dailyLimit) {
      setErrorMessage('Maximum single purchase amount cannot exceed the daily spending limit.');
      return;
    }

    setIsSaving(true);
    try {
      await saveBudget(maxPurchase, dailyLimit);
      await loadSpendingSummary();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setErrorMessage('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  function applyPreset(presetMax: number, presetDaily: number) {
    setMaxPurchase(presetMax);
    setDailyLimit(presetDaily);
    setSaveSuccess(false);
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <SlidersIcon className="w-6 h-6 text-blue-600" />
          Smart Budget & Spending Controls
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Enforced server-side before any PayPal Sandbox order is created or authorized.
        </p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Preset Profiles */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
            Quick Budget Profiles
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => applyPreset(50, 100)}
              className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all group"
            >
              <div className="font-bold text-slate-900 text-xs group-hover:text-blue-600">
                🛡️ Conservative
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                $50 max item / $100 daily limit
              </div>
            </button>

            <button
              type="button"
              onClick={() => applyPreset(100, 200)}
              className="p-3.5 rounded-2xl border border-blue-500 bg-blue-50/40 text-left transition-all"
            >
              <div className="font-bold text-blue-900 text-xs">⚖️ Balanced (Recommended)</div>
              <div className="text-[11px] text-blue-700 mt-1">
                $100 max item / $200 daily limit
              </div>
            </button>

            <button
              type="button"
              onClick={() => applyPreset(250, 500)}
              className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all group"
            >
              <div className="font-bold text-slate-900 text-xs group-hover:text-blue-600">
                🚀 Flexible
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                $250 max item / $500 daily limit
              </div>
            </button>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSave} className="space-y-6 pt-4 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Input 1: Maximum Item Purchase */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Maximum Single Purchase Limit</span>
                <span className="text-blue-600 font-mono">${maxPurchase.toFixed(2)}</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-semibold">
                  $
                </span>
                <input
                  type="number"
                  min="5"
                  max="5000"
                  step="5"
                  value={maxPurchase}
                  onChange={(e) => setMaxPurchase(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-4 py-3 text-sm text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Any item priced higher than this amount will be blocked before payment authorization.
              </p>
            </div>

            {/* Input 2: Daily Spending Limit */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Daily Spending Ceiling</span>
                <span className="text-indigo-600 font-mono">${dailyLimit.toFixed(2)}</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-semibold">
                  $
                </span>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  step="10"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-4 py-3 text-sm text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Sum of all captured orders within the same calendar day cannot exceed this amount.
              </p>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center space-x-2">
              <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2 animate-fade-in">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Budget limits successfully saved and active in the database!</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheckIcon className="w-4 h-4 text-white" />
              <span>{isSaving ? 'Updating Database...' : 'Save Spending Limits'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security & Enforcement Explanation */}
      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <ShieldCheckIcon className="w-4 h-4 text-blue-600" />
          Server-Side Safety Guarantee
        </h4>
        <p className="leading-relaxed">
          Unlike client-only shopping websites, AgentPay validates these rules on the server inside the{' '}
          <code className="text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded">/api/paypal/create-order</code>{' '}
          endpoint. Even if client code is manipulated, orders exceeding your budget are rejected before PayPal is
          contacted.
        </p>
      </div>
    </div>
  );
}

