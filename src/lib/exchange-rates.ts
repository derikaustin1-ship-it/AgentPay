// src/lib/exchange-rates.ts
// Live exchange rate service with caching, precision conversion, and currency formatting

import { ZERO_DECIMAL_CURRENCIES, getCountryByCode } from './countries';

export interface ExchangeRatesData {
  rates: Record<string, number>;
  timestamp: string;
  source: string;
}

// In-memory cache
let cachedRates: ExchangeRatesData | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Fallback rates if external API is unreachable
const FALLBACK_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.25,
  CAD: 1.36,
  AUD: 1.52,
  JPY: 155.4,
  SGD: 1.34,
  CHF: 0.90,
  SEK: 10.75,
  NOK: 10.85,
  DKK: 6.87,
  PLN: 3.98,
  CZK: 23.2,
  BRL: 5.15,
  MXN: 16.85,
  AED: 3.67,
  NZD: 1.66,
  HKD: 7.82,
  MYR: 4.72,
  PHP: 57.6,
  THB: 36.8,
};

/**
 * Fetch latest live exchange rates against USD with 1-hour caching.
 */
export async function getExchangeRates(): Promise<ExchangeRatesData> {
  const now = Date.now();
  if (cachedRates && now < cacheExpiresAt) {
    return cachedRates;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && typeof data.rates === 'object') {
        cachedRates = {
          rates: {
            ...FALLBACK_RATES,
            ...data.rates,
            USD: 1.0,
          },
          timestamp: data.time_last_update_utc || new Date().toISOString(),
          source: 'open.er-api.com (Live)',
        };
        cacheExpiresAt = now + CACHE_TTL_MS;
        return cachedRates;
      }
    }
  } catch (err) {
    console.warn('Live exchange rate fetch failed, utilizing cached/fallback rates:', err);
  }

  // Fallback if not already cached
  if (!cachedRates) {
    cachedRates = {
      rates: FALLBACK_RATES,
      timestamp: new Date().toISOString(),
      source: 'Internal Reference Cache',
    };
    cacheExpiresAt = now + 5 * 60 * 1000; // retry in 5 mins
  }

  return cachedRates;
}

/**
 * Convert USD amount to a target currency.
 */
export async function convertFromUSD(amountUSD: number, targetCurrency: string) {
  const ratesData = await getExchangeRates();
  const upper = targetCurrency.toUpperCase();
  const rate = ratesData.rates[upper] || 1.0;
  const isZeroDecimal = (ZERO_DECIMAL_CURRENCIES as readonly string[]).includes(upper);

  let rawDisplayAmount = amountUSD * rate;
  let displayAmount = isZeroDecimal ? Math.round(rawDisplayAmount) : Math.round(rawDisplayAmount * 100) / 100;

  return {
    displayAmount,
    rate,
    timestamp: ratesData.timestamp,
    source: ratesData.source,
  };
}

/**
 * Synchronously convert USD amount using a provided rates map.
 */
export function convertWithRates(amountUSD: number, targetCurrency: string, rates: Record<string, number>) {
  const upper = targetCurrency.toUpperCase();
  const rate = rates[upper] || (upper === 'USD' ? 1.0 : 1.0);
  const isZeroDecimal = (ZERO_DECIMAL_CURRENCIES as readonly string[]).includes(upper);

  let rawDisplayAmount = amountUSD * rate;
  let displayAmount = isZeroDecimal ? Math.round(rawDisplayAmount) : Math.round(rawDisplayAmount * 100) / 100;

  return {
    displayAmount,
    rate,
  };
}

/**
 * Format currency amount with appropriate locale, symbol, and decimals.
 */
export function formatCurrency(amount: number, currencyCode: string, locale?: string): string {
  const upper = currencyCode.toUpperCase();
  const isZeroDecimal = (ZERO_DECIMAL_CURRENCIES as readonly string[]).includes(upper);

  const targetLocale = locale || (upper === 'INR' ? 'en-IN' : upper === 'EUR' ? 'de-DE' : upper === 'GBP' ? 'en-GB' : upper === 'JPY' ? 'ja-JP' : 'en-US');

  try {
    return new Intl.NumberFormat(targetLocale, {
      style: 'currency',
      currency: upper,
      minimumFractionDigits: isZeroDecimal ? 0 : 2,
      maximumFractionDigits: isZeroDecimal ? 0 : 2,
    }).format(amount);
  } catch {
    return `${upper} ${amount.toFixed(isZeroDecimal ? 0 : 2)}`;
  }
}
