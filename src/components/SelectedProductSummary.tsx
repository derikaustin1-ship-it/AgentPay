// src/components/SelectedProductSummary.tsx
// Displays the selected-product confirmation summary with details,
// live status indicator, retailer link, and the Continue action button.

'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import CurrencyDisplay from './CurrencyDisplay';
import {
  CheckCircleIcon,
  ExternalLinkIcon,
  ArrowRightIcon,
  XIcon,
  ShieldCheckIcon,
  StarIcon,
} from './Icons';

export default function SelectedProductSummary() {
  const { state, clearSelectedProduct, proceedToCheckout } = useApp();
  const { selectedProduct } = state;

  if (!selectedProduct) return null;

  const { product, matchScore, reasoning } = selectedProduct;
  const hasValidUrl = product.productUrl && product.productUrl !== '#' && product.productUrl.startsWith('http');
  const maxPurchase = state.budget?.maxPurchaseAmount || 100;
  const isWithinLimit = product.price <= maxPurchase;

  return (
    <div className="w-full max-w-4xl mx-auto my-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3">
      <div className={`bg-gradient-to-r border-2 rounded-2xl shadow-lg p-4 sm:p-5 ${
        isWithinLimit 
          ? 'from-blue-50 via-indigo-50/50 to-white border-blue-500/80' 
          : 'from-amber-50 via-rose-50/40 to-white border-amber-500/80'
      }`}>
        {/* Status Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isWithinLimit ? 'bg-emerald-400' : 'bg-amber-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isWithinLimit ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></span>
            </span>
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
              Product Selected
            </span>
            <span className="text-slate-300">|</span>
            {isWithinLimit ? (
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                Within ${maxPurchase} Purchase Limit
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-rose-800 bg-rose-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                ⚠️ Exceeds ${maxPurchase} Single Purchase Limit
              </span>
            )}
          </div>

          <button
            onClick={clearSelectedProduct}
            className="text-xs text-slate-400 hover:text-slate-700 flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
            title="Deselect this product"
          >
            <XIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Change Selection</span>
          </button>
        </div>

        {/* Selected Product Card Content */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
            {/* Thumbnail */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 shadow-2xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
              <span className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                {matchScore}%
              </span>
            </div>

            {/* Details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 mb-0.5">
                <span className="font-bold text-blue-700 uppercase tracking-wider text-[11px]">
                  {product.brand || 'Verified Brand'}
                </span>
                <span>•</span>
                <span>
                  Sold by: <strong className="text-slate-800">{product.seller || 'Verified Retailer'}</strong>
                </span>
                {product.rating && (
                  <>
                    <span>•</span>
                    <span className="flex items-center text-amber-500 font-semibold">
                      <StarIcon className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                      {product.rating.toFixed(1)}
                    </span>
                  </>
                )}
              </div>

              <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1 mb-1" title={product.name}>
                {product.name}
              </h4>

              <div className="flex items-center gap-3 text-xs">
                {hasValidUrl && (
                  <a
                    href={product.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 hover:underline text-[11px] font-medium"
                  >
                    <span>View on Retailer Site</span>
                    <ExternalLinkIcon className="w-3 h-3" />
                  </a>
                )}
                <span className="text-[11px] text-slate-500">ID: <code className="bg-white/80 px-1 py-0.5 rounded border border-slate-200 text-[10px]">{product.id}</code></span>
              </div>
            </div>
          </div>

          {/* Price & Continue Action Button */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-blue-100 shrink-0">
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Actual Price</span>
              <CurrencyDisplay amountUSD={product.price} showOriginal={true} size="xl" />
            </div>

            <button
              id="continue-to-review-btn"
              onClick={proceedToCheckout}
              className="inline-flex items-center justify-center space-x-2 py-2.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
            >
              <span>Continue</span>
              <ArrowRightIcon className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

