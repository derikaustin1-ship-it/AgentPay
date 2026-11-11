// src/components/ProductCard.tsx
// Rich recommendation card displaying product details, AI rationale, pros/cons,
// trust risk warnings, visual selection highlight, and functional Select Product action.

'use client';

import React from 'react';
import { ProductRecommendation } from '@/types';
import { useApp } from '@/context/AppContext';
import CurrencyDisplay from './CurrencyDisplay';
import {
  StarIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  CheckIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  CreditCardIcon,
  LayersIcon,
} from './Icons';

interface ProductCardProps {
  recommendation: ProductRecommendation;
  rank?: number;
}

export default function ProductCard({ recommendation, rank }: ProductCardProps) {
  const { state, selectProduct, dispatch } = useApp();
  const { product, matchScore, reasoning, advantages, limitations, trustWarnings } = recommendation;
  const isSelected = state.selectedProduct?.product.id === product.id;

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between group relative ${
        isSelected
          ? 'ring-2 ring-blue-600 border-blue-600 shadow-lg shadow-blue-500/10 bg-blue-50/15'
          : 'border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300'
      }`}
    >
      <div>
        {/* Card Header & Image */}
        <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
            {isSelected && (
              <span className="bg-emerald-600 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 animate-in fade-in">
                <CheckCircleIcon className="w-3.5 h-3.5 text-white" />
                <span>Selected</span>
              </span>
            )}
            {rank && (
              <span className="bg-slate-900/80 backdrop-blur-md text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-xs">
                #{rank} Top Pick
              </span>
            )}
            <span className="bg-blue-600/90 backdrop-blur-md text-white font-semibold text-xs px-2.5 py-1 rounded-full shadow-xs">
              {matchScore}% Match
            </span>
          </div>

          {/* Live vs Demo badge */}
          <div className="absolute top-3 right-3">
            {product.isDemo ? (
              <span className="bg-amber-500/90 backdrop-blur-md text-white font-medium text-[11px] px-2 py-0.5 rounded-full shadow-xs">
                Demo Catalogue
              </span>
            ) : (
              <span className="bg-emerald-600/90 backdrop-blur-md text-white font-semibold text-[11px] px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Channel3 Live
              </span>
            )}
          </div>

          {/* Price overlay at bottom of image with live currency conversion */}
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-white/50">
            <CurrencyDisplay amountUSD={product.price} showOriginal={true} size="md" />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5">
          {/* Brand & Rating */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold text-blue-700 tracking-wide uppercase text-[11px]">
              {product.brand}
            </span>
            {product.rating && (
              <div className="flex items-center space-x-1 text-amber-500 font-semibold">
                <StarIcon className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{product.rating.toFixed(1)}</span>
                <span className="text-slate-400">({product.reviewCount || 0})</span>
              </div>
            )}
          </div>

          {/* Product Name */}
          <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* AI Recommendation Reasoning */}
          <div className="mb-4 p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-slate-700 leading-relaxed">
            <span className="font-semibold text-blue-900 block mb-1">🤖 AI Recommendation Rationale:</span>
            {reasoning}
          </div>

          {/* Pros & Cons Section */}
          <div className="space-y-2 mb-4 text-xs">
            {advantages && advantages.length > 0 && (
              <div>
                <span className="font-semibold text-emerald-800 text-[11px] uppercase tracking-wider block mb-1">
                  Advantages:
                </span>
                <ul className="space-y-1">
                  {advantages.slice(0, 3).map((adv, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5 text-slate-600">
                      <CheckIcon className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {limitations && limitations.length > 0 && (
              <div className="pt-1">
                <span className="font-semibold text-amber-800 text-[11px] uppercase tracking-wider block mb-1">
                  Limitations to consider:
                </span>
                <ul className="space-y-1">
                  {limitations.slice(0, 2).map((lim, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5 text-slate-500">
                      <AlertCircleIcon className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                      <span>{lim}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Product Trust & Price Warnings */}
          {trustWarnings && trustWarnings.length > 0 && (
            <div className="mb-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 space-y-1">
              <div className="flex items-center space-x-1.5 font-semibold text-amber-800">
                <ShieldAlertIcon className="w-4 h-4 text-amber-600" />
                <span>Product Advisory</span>
              </div>
              {trustWarnings.map((warning, wIdx) => (
                <p key={wIdx} className="text-[11px] text-amber-800/90 leading-tight">
                  • {warning.message} <span className="text-slate-500">{warning.details}</span>
                </p>
              ))}
            </div>
          )}

          {/* Merchant / Seller verification */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100">
            <span>Sold by: <strong className="text-slate-700">{product.seller}</strong></span>
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500" /> {product.isDemo ? 'Verified Demo Seller' : 'Live Retailer'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-5 pt-0 grid grid-cols-2 gap-2.5">
        <button
          onClick={() => {
            selectProduct(recommendation);
            dispatch({ type: 'SET_PAGE', payload: 'comparison' });
          }}
          className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <LayersIcon className="w-3.5 h-3.5 text-slate-500" />
          <span>Compare</span>
        </button>

        <button
          onClick={() => selectProduct(recommendation)}
          className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
            isSelected
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 ring-1 ring-emerald-500'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20'
          }`}
        >
          {isSelected ? (
            <>
              <CheckCircleIcon className="w-4 h-4 text-white" />
              <span>✓ Selected</span>
            </>
          ) : (
            <>
              <CheckIcon className="w-3.5 h-3.5 text-white" />
              <span>Select Product</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

