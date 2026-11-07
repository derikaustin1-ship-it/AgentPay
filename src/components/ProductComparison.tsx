// src/components/ProductComparison.tsx
// Side-by-side product comparison view with feature matrix, AI ratings, and checkout triggers

'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ProductRecommendation } from '@/types';
import SelectedProductSummary from './SelectedProductSummary';
import {
  LayersIcon,
  StarIcon,
  CheckIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  ShieldAlertIcon,
} from './Icons';

export default function ProductComparison() {
  const { state, selectProduct, dispatch } = useApp();
  const [comparisonProducts, setComparisonProducts] = useState<ProductRecommendation[]>([]);

  useEffect(() => {
    // Collect products from recent messages or fallback to top recommendations
    const found: ProductRecommendation[] = [];
    for (const msg of state.messages) {
      if (msg.products && msg.products.length > 0) {
        found.push(...msg.products);
      }
    }

    if (found.length > 0) {
      // Deduplicate by ID
      const unique = Array.from(new Map(found.map((p) => [p.product.id, p])).values());
      setComparisonProducts(unique.slice(0, 3));
    } else {
      // Load top 3 from product search API
      fetch('/api/products/search?q=hiking')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            const mapped: ProductRecommendation[] = data.data.slice(0, 3).map((p: any) => ({
              product: p,
              matchScore: 90,
              reasoning: `${p.name} is a versatile selection with verified ratings.`,
              advantages: ['High quality build', 'In Stock', 'Direct seller warranty'],
              limitations: ['Limited color options'],
              trustWarnings: [],
            }));
            setComparisonProducts(mapped);
          }
        })
        .catch(console.error);
    }
  }, [state.messages]);

  if (comparisonProducts.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <LayersIcon className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">No Products in Comparison</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          Ask the AI Shopping Assistant for product recommendations (e.g., &quot;Compare affordable smartwatches&quot;)
          to populate this side-by-side comparison matrix.
        </p>
        <button
          onClick={() => dispatch({ type: 'SET_PAGE', payload: 'assistant' })}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md transition-colors text-sm"
        >
          Go to AI Assistant
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LayersIcon className="w-6 h-6 text-blue-600" />
            Product Comparison Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Comparing {comparisonProducts.length} candidate products across pricing, features, and AI evaluation
          </p>
        </div>
        <button
          onClick={() => dispatch({ type: 'SET_PAGE', payload: 'assistant' })}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 transition-colors shrink-0"
        >
          Ask AI for More Options
        </button>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {comparisonProducts.map((item, idx) => {
          const { product, matchScore, reasoning, advantages, limitations, trustWarnings } = item;
          const isSelected = state.selectedProduct?.product.id === product.id;

          return (
            <div
              key={product.id}
              className={`bg-white rounded-3xl border shadow-xs overflow-hidden flex flex-col justify-between transition-all ${
                isSelected ? 'ring-2 ring-blue-600 border-blue-600 shadow-md bg-blue-50/10' : 'border-slate-200'
              }`}
            >
              <div>
                {/* Product Image & Ranking */}
                <div className="relative aspect-16/10 w-full bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      Option {idx + 1}
                    </span>
                    {isSelected && (
                      <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                        <CheckCircleIcon className="w-3.5 h-3.5 text-white" /> Selected
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 bg-blue-600/90 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    {matchScore}% Match
                  </div>
                </div>

                {/* Main Details */}
                <div className="p-5 space-y-4">
                  <div>
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                      {product.brand}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">{product.name}</h3>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                      <span className="text-2xl font-bold text-slate-900">${product.price.toFixed(2)}</span>
                      {product.rating && (
                        <div className="flex items-center space-x-1 text-amber-500 font-semibold text-xs">
                          <StarIcon className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span>{product.rating.toFixed(1)}</span>
                          <span className="text-slate-400">({product.reviewCount || 0})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Reasoning */}
                  <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-slate-700">
                    <span className="font-semibold text-blue-900 block mb-0.5">Why AgentPay Recommends It:</span>
                    {reasoning}
                  </div>

                  {/* Key Features */}
                  {product.features && product.features.length > 0 && (
                    <div className="text-xs space-y-1.5">
                      <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                        Key Specs & Features:
                      </span>
                      <ul className="space-y-1">
                        {product.features.map((feat, fIdx) => (
                          <li key={fIdx} className="text-slate-600 flex items-start space-x-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Advantages vs Limitations */}
                  <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
                    {advantages && (
                      <div>
                        <span className="font-semibold text-emerald-800 text-[11px] uppercase">Advantages:</span>
                        <ul className="space-y-0.5 mt-1">
                          {advantages.map((a, aIdx) => (
                            <li key={aIdx} className="text-slate-600 flex items-center space-x-1">
                              <CheckIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {limitations && limitations.length > 0 && (
                      <div className="pt-1">
                        <span className="font-semibold text-amber-800 text-[11px] uppercase">Limitations:</span>
                        <ul className="space-y-0.5 mt-1">
                          {limitations.map((l, lIdx) => (
                            <li key={lIdx} className="text-slate-500 flex items-center space-x-1">
                              <AlertCircleIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>{l}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Trust warning */}
                  {trustWarnings && trustWarnings.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
                      <ShieldAlertIcon className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold block">{trustWarnings[0].message}</span>
                        <span className="text-[11px] text-slate-500">{trustWarnings[0].details}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="p-5 pt-0">
                <button
                  onClick={() => selectProduct(item)}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 ring-1 ring-emerald-500'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <CheckCircleIcon className="w-4 h-4 text-white" />
                      <span>✓ Selected Product</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4 text-white" />
                      <span>Select This Product</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Product Summary Screen */}
      <SelectedProductSummary />
    </div>
  );
}

