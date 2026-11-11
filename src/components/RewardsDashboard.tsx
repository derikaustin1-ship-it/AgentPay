// src/components/RewardsDashboard.tsx
// Researched PayPal Rewards intelligence dashboard, regional eligibility checker, and AI Q&A assistant

'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { getRewardsEligibility, PAYPAL_OFFICIAL_REWARDS_TERMS_URL } from '@/lib/rewards-info';
import {
  GiftIcon,
  ShieldCheckIcon,
  ExternalLinkIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  SparklesIcon,
  SendIcon,
  CoinsIcon,
  InfoIcon,
} from './Icons';

export default function RewardsDashboard() {
  const { state, openCountrySelector } = useApp();
  const countryCode = state.userPreferences?.countryCode || 'US';
  const countryName = state.userPreferences?.country?.name || 'United States';
  const flag = state.userPreferences?.country?.flag || '🇺🇸';

  const eligibility = getRewardsEligibility(countryCode, countryName);

  // Gemini Rewards Assistant state
  const [question, setQuestion] = useState('');
  const [qaList, setQaList] = useState<Array<{ q: string; a: string }>>([
    {
      q: 'Can third-party apps read my personal PayPal Rewards points balance?',
      a: 'No. PayPal does not offer a public third-party REST API that allows external developers or applications to read or manipulate personal rewards points. AgentPay maintains complete security and honesty by not fabricating fake points balances or requesting unauthorized credentials.',
    },
    {
      q: 'How do pending points work on PayPal?',
      a: 'When you make an eligible purchase, earned points typically appear as "Pending" in your PayPal wallet for 1 to 90 days. This pending window ensures that returns, refunds, or cancellations are reconciled before points become available for cash back redemption.',
    },
  ]);
  const [isAsking, setIsAsking] = useState(false);

  async function handleAskQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || isAsking) return;

    const userQ = question.trim();
    setQuestion('');
    setIsAsking(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Rewards Assistant Query: The user is in ${countryName} (${countryCode}). Answer this specific factual question regarding PayPal Rewards program terms, regional eligibility, or redemption mechanics accurately and honestly: "${userQ}"`,
          history: [],
          countryCode,
          currencyCode: state.userPreferences?.currencyCode || 'USD',
        }),
      });

      const data = await res.json();
      if (data.success && data.data?.message) {
        setQaList((prev) => [{ q: userQ, a: data.data.message }, ...prev]);
      } else {
        setQaList((prev) => [
          {
            q: userQ,
            a: 'Could not fetch a response at this moment. Please refer directly to official PayPal documentation.',
          },
          ...prev,
        ]);
      }
    } catch {
      setQaList((prev) => [
        {
          q: userQ,
          a: 'Network error communicating with rewards assistant. Please try again.',
        },
        ...prev,
      ]);
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-200 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-semibold">
              <GiftIcon className="w-3.5 h-3.5" />
              <span>PayPal Rewards Intelligence & Verification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              PayPal Rewards & Regional Eligibility
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Transparent, researched insights into PayPal’s official rewards mechanics, cash back rules, and regional country qualifications.
            </p>
          </div>

          <a
            href={PAYPAL_OFFICIAL_REWARDS_TERMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 bg-white text-slate-900 hover:bg-slate-100 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shrink-0 cursor-pointer"
          >
            <span>Official Legal Terms</span>
            <ExternalLinkIcon className="w-4 h-4 text-slate-500" />
          </a>
        </div>
      </div>

      {/* Regional Country Eligibility Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{flag}</span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 text-base">{countryName}</h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                  {countryCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Current Country Selection</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {eligibility.isEligible ? (
              <span className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-bold">
                <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                <span>Rewards Eligible Territory</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-full text-xs font-bold">
                <AlertTriangleIcon className="w-4 h-4 text-amber-600" />
                <span>Rewards Regionally Restricted</span>
              </span>
            )}
            <button
              type="button"
              onClick={openCountrySelector}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2 cursor-pointer"
            >
              Change
            </button>
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <h4 className="text-sm font-bold text-slate-900">{eligibility.headline}</h4>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{eligibility.summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
            {eligibility.keyRules.map((rule, idx) => (
              <div
                key={idx}
                className="flex items-start space-x-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100"
              >
                <span className="text-blue-600 font-bold shrink-0">•</span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Honest Architecture Notice Callout */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 flex items-start space-x-3.5">
        <InfoIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-amber-950">
            Factual Fintech Integrity: Why AgentPay Does Not Display a Real-time Points Balance
          </h4>
          <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
            Unlike payment authorization APIs (such as PayPal REST Orders v2), PayPal does <strong>not provide a public consumer API</strong> for third-party websites to query personal rewards points balances or execute programmatic redemptions. Rather than displaying fake numbers or asking for unauthorized account credentials, AgentPay provides honest, verified program policies and regional verification.
          </p>
        </div>
      </div>

      {/* 4 Pillars of PayPal Rewards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-2 hover:border-blue-200 transition-all shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CoinsIcon className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-slate-900">Earning Rules & Accrual</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Points are earned on eligible transactions made through PayPal Checkout at participating retailers. Merchant-specific cash back multipliers can offer 1% to 10%+ return.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-2 hover:border-blue-200 transition-all shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheckIcon className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-slate-900">Pending vs Available Balance</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            All newly earned points enter a mandatory pending phase (typically 1 to 90 days) to match merchant order fulfillment and return windows. Once cleared, points move to available status.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-2 hover:border-blue-200 transition-all shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <GiftIcon className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-slate-900">Redemption Options</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Points can be converted directly into cash balance added to your personal PayPal account, applied as an immediate checkout discount at point of sale, or redeemed for retail digital vouchers.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-2 hover:border-blue-200 transition-all shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <ExternalLinkIcon className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-slate-900">Official PayPal Verification</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Always view and manage your authenticated points balance directly inside the official PayPal mobile app or PayPal website dashboard under the Rewards tab.
          </p>
        </div>
      </div>

      {/* Gemini Smart Rewards Q&A Assistant */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center">
            <SparklesIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Ask Gemini: Rewards & Points Assistant</h3>
            <p className="text-xs text-slate-500">Ask any specific question about rewards rules, regional terms, or point redemption</p>
          </div>
        </div>

        <form onSubmit={handleAskQuestion} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Do points expire? Can I convert points to cash?"
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 placeholder-slate-400"
            disabled={isAsking}
          />
          <button
            type="submit"
            disabled={isAsking || !question.trim()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-semibold rounded-xl text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isAsking ? (
              <span className="text-xs">Analyzing...</span>
            ) : (
              <>
                <span>Ask</span>
                <SendIcon className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="space-y-3 pt-2 divide-y divide-slate-100">
          {qaList.map((item, i) => (
            <div key={i} className="pt-3 first:pt-0 space-y-1">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="text-blue-600 font-extrabold">Q:</span>
                <span>{item.q}</span>
              </div>
              <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-800 mr-1">A:</span>
                {item.a}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AgentPay Loyalty Architecture Concept (Clearly labeled roadmap) */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 border border-indigo-900/60 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold tracking-wider uppercase bg-indigo-500/30 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
              Architecture Roadmap
            </span>
            <span className="text-xs text-slate-400">AgentPay Native Feature</span>
          </div>
          <span className="text-xs text-slate-400">Phase 2 Exploration</span>
        </div>
        <h4 className="text-base font-bold text-white">AgentPay Autonomous Merchant Cash Back Engine</h4>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          In future updates, AgentPay’s autonomous agent will automatically scan affiliate networks and merchant promotion APIs during product discovery to find eligible cashback deals and promo codes before checkout, helping you stack savings transparently across global currencies.
        </p>
      </div>
    </div>
  );
}
