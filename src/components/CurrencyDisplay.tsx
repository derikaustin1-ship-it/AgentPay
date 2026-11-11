// src/components/CurrencyDisplay.tsx
// Localized currency display component with conversion transparency and exchange rate details

'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';

interface CurrencyDisplayProps {
  amountUSD: number;
  showOriginal?: boolean;
  className?: string;
  originalClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function CurrencyDisplay({
  amountUSD,
  showOriginal = false,
  className = '',
  originalClassName = '',
  size = 'md',
}: CurrencyDisplayProps) {
  const { getConvertedPrice, state } = useApp();
  const info = getConvertedPrice(amountUSD);

  const sizeClasses = {
    sm: 'text-xs font-semibold',
    md: 'text-sm font-bold',
    lg: 'text-base sm:text-lg font-bold',
    xl: 'text-xl sm:text-2xl font-extrabold',
  };

  const rateTooltip = info.isConverted
    ? `Converted from $${amountUSD.toFixed(2)} USD at 1 USD = ${info.exchangeRate.toFixed(4)} ${info.displayCurrency} (${state.ratesSource || 'Live API'})`
    : 'Original USD price';

  return (
    <span className="inline-flex flex-col items-baseline" title={rateTooltip}>
      <span className={`text-slate-900 tracking-tight ${sizeClasses[size]} ${className}`}>
        {info.isConverted && <span className="text-slate-400 font-normal mr-0.5">~</span>}
        {info.formatted}
      </span>
      {showOriginal && info.isConverted && (
        <span className={`text-[11px] text-slate-400 font-normal mt-0.5 ${originalClassName}`}>
          ({info.formattedOriginal} USD)
        </span>
      )}
    </span>
  );
}
