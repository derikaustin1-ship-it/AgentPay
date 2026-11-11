// src/components/Settings.tsx
// Global application settings for country, currency preferences, and payment controls

'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { DEFAULT_COUNTRY } from '@/lib/countries';
import {
  GlobeIcon,
  ShieldCheckIcon,
  SlidersIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from './Icons';

export default function Settings() {
  const { state, openCountrySelector, loadExchangeRates, dispatch } = useApp();
  const currentCountry = state.userPreferences?.country || DEFAULT_COUNTRY;
  const currencyCode = state.userPreferences?.currencyCode || 'USD';

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Preferences & Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage your localization, currency display preferences, and transaction guardrails.
        </p>
      </div>

      {/* Country & Currency Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <GlobeIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Country & Currency</h3>
              <p className="text-xs text-slate-500">
                Display prices, product recommendations, and spending estimates in your local currency.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openCountrySelector}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            Change Country
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Selected Country
            </span>
            <div className="flex items-center space-x-2 mt-1.5">
              <span className="text-2xl">{currentCountry.flag}</span>
              <div>
                <p className="text-sm font-bold text-slate-900 leading-tight">{currentCountry.name}</p>
                <span className="text-xs text-slate-500 font-mono">{currentCountry.code}</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Display Currency
            </span>
            <p className="text-sm font-bold text-slate-900 mt-1.5">
              {currencyCode} ({currentCountry.currencySymbol})
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {currencyCode === 'USD' ? 'Default Store Currency' : 'Converted Display'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Exchange Rate Data
              </span>
              <button
                type="button"
                onClick={loadExchangeRates}
                className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                title="Refresh exchange rates"
              >
                <RefreshCwIcon className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs font-semibold text-slate-800 mt-1.5 truncate">
              {state.ratesSource || 'open.er-api.com (Live)'}
            </p>
            <p suppressHydrationWarning className="text-[10px] text-slate-400 mt-0.5 truncate">
              Updated: {state.ratesTimestamp ? new Date(state.ratesTimestamp).toLocaleTimeString() : 'Current session'}
            </p>
          </div>
        </div>

        {currentCountry.paypalDomesticUnavailable && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-2.5 text-xs text-amber-900">
            <AlertTriangleIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">India Domestic Restriction Notice:</span>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                Under Reserve Bank of India (RBI) regulations, domestic merchant transactions between Indian PayPal accounts are not permitted. PayPal Sandbox orders in AgentPay will process in USD.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Spending Controls Link */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <SlidersIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">Smart Budget Controls</h3>
            <p className="text-xs text-slate-500">
              Configure daily maximums and single-item purchase limits.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_PAGE', payload: 'budget' })}
          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
        >
          Manage Limits
        </button>
      </div>

      {/* Security & Sandbox Status */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheckIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">Security & PayPal Sandbox</h3>
            <p className="text-xs text-slate-500">
              Transactions occur strictly within PayPal’s developer test sandbox environment.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-700">Environment</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              PayPal Sandbox (REST v2)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-700">Client Secret Protection</span>
            <span className="flex items-center gap-1 font-semibold text-slate-800">
              <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" /> Server-side isolated
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-700">Price Validation</span>
            <span className="flex items-center gap-1 font-semibold text-slate-800">
              <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" /> Backend-enforced (no client tampering)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
