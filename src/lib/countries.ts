// src/lib/countries.ts
// Global country, currency, and PayPal capabilities registry

export interface CountryConfig {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  flag: string; // Emoji
  currencyCode: string; // ISO 4217
  currencySymbol: string;
  locale: string;
  paypalCheckoutSupported: boolean;
  paypalSupportedCurrency: boolean;
  paypalDomesticUnavailable?: boolean;
  notes?: string;
}

/**
 * Official PayPal REST API supported currencies.
 * Transactions created via PayPal Orders API v2 must use one of these.
 */
export const PAYPAL_SUPPORTED_CURRENCIES = [
  'AUD', 'BRL', 'CAD', 'CNY', 'CZK', 'DKK', 'EUR', 'HKD', 'HUF', 'ILS',
  'JPY', 'MYR', 'MXN', 'NOK', 'NZD', 'PHP', 'PLN', 'GBP', 'RUB', 'SGD',
  'SEK', 'CHF', 'TWD', 'THB', 'USD'
] as const;

/**
 * Currencies that do not use decimal places in standard formatting (zero-decimal currencies).
 */
export const ZERO_DECIMAL_CURRENCIES = ['JPY', 'HUF', 'TWD', 'KRW', 'VND'] as const;

/**
 * Verified global country directory with ISO codes, currencies, and PayPal capabilities.
 */
export const COUNTRIES: CountryConfig[] = [
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currencyCode: 'USD',
    currencySymbol: '$',
    locale: 'en-US',
    paypalCheckoutSupported: true,
    paypalSupportedCurrency: true,
    notes: 'Full PayPal Checkout and PayPal Rewards support.',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currencyCode: 'GBP',
    currencySymbol: '£',
    locale: 'en-GB',
    paypalCheckoutSupported: true,
    paypalSupportedCurrency: true,
    notes: 'Full PayPal Checkout support.',
  },
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    currencyCode: 'INR',
    currencySymbol: '₹',
    locale: 'en-IN',
    paypalCheckoutSupported: true,
    paypalSupportedCurrency: false, // INR is not a direct PayPal REST API currency; sandbox orders execute in USD
    paypalDomesticUnavailable: true,
    notes: 'PayPal India does not support domestic INR peer/merchant transactions due to RBI guidelines. Sandbox payments process in converted USD.',
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    currencyCode: 'EUR',
    currencySymbol: '€',
    locale: 'de-DE',
    paypalCheckoutSupported: true,
    paypalSupportedCurrency: true,
    notes: 'Full PayPal Checkout support.',
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    currencyCode: 'EUR',
    currencySymbol: '€',
    locale: 'fr-FR',
    paypalCheckoutSupported: true,
    paypalSupportedCurrency: true,
    notes: 'Full PayPal Checkout support.',
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    currencyCode: 'CAD',
    currencySymbol: 'CA$',
    locale: 'en-CA',
    paypalCheckoutSupported: true,
    paypalSupportedCurrency: true,
    notes: 'Full PayPal Checkout support.',
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    currencyCode: 'AUD',
    currencySymbol: 'A$',
    locale: 'en-AU',
    paypalCheckoutSupported: true,
    paypalSupportedCurrency: true,
    notes: 'Full PayPal Checkout support.',
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    currencyCode: 'JPY',
    currencySymbol: '¥',
    locale: 'ja-JP',
    paypalCheckoutSupported: true,
    paypalSupportedCurrency: true,
    notes: 'Zero-decimal currency. Full PayPal Checkout support.',
  },
  {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    currencyCode: 'SGD',
    currencySymbol: 'S$',
    locale: 'en-SG',
    paypalCheckoutSupported: true,
    paypalSupportedCurrency: true,
    notes: 'Full PayPal Checkout support.',
  },
  {
    code: 'IT',
    name: 'Italy',
    flag: '🇮🇹',
    currencyCode: 'EUR',
    currencySymbol: '€',
    locale: 'it-IT',
    paypalCheckoutSupported: true,
    paypalSupportedCurrency: true,
    notes: 'Full PayPal Checkout support.',
  },
  {
    code: 'ES',
    name: 'Spain',
    flag: '🇪🇸',
    currencyCode: 'EUR',
    currencySymbol: '€',
    locale: 'es-ES',
    paypalCheckoutSupported: true,
    paypalSupportedCurrency: true,
    notes: 'Full PayPal Checkout support.',
  },
  {
    code: 'NL',
    name: 'Netherlands',
    flag: '🇳🇱',
    currencyCode: 'EUR',
    currencySymbol: '€',
    locale: 'nl-NL',
    paypalCheckoutSupported: true,
    paypalSupportedCurrency: true,
    notes: 'Full PayPal Checkout support.',
  },
  {
    code: 'CH',
    name: 'Switzerland',
    flag: '🇨🇭',
    currencyCode: 'CHF',
    currencySymbol: 'CHF',
    locale: 'de-CH',
    paypalCheckoutSupported: true,
    paypalSupportedCurrency: true,
    notes: 'Full PayPal Checkout support.',
  },
  {
    code: 'SE',
    name: 'Sweden',
    flag: '🇸🇪',
    currencyCode: 'SEK',
    currencySymbol: 'kr',
    locale: 'sv-SE',
    paypalCheckoutSupported: true,
    paypalSupportedCurrency: true,
    notes: 'Full PayPal Checkout support.',
  },
  {
    code: 'NO',
    name: 'Norway',
    flag: '🇳🇴',
    currencyCode: 'NOK',
    currencySymbol: 'kr',
    locale: 'nb-NO',
    paypalCheckoutSupported: true,
    paypalSupportedCurrency: true,
    notes: 'Full PayPal Checkout support.',
  },
  {
    code: 'DK',
    name: 'Denmark',
    flag: '🇩🇰',
    currencyCode: 'DKK',
    currencySymbol: 'kr.',
    locale: 'da-DK',
    paypalCheckoutSupported: true,
    paypalSupportedCurrency: true,
    notes: 'Full PayPal Checkout support.',
  },
  {
    code: 'PL',
    name: 'Poland',
    flag: '🇵🇱',
    currencyCode: 'PLN',
    currencySymbol: 'zł',
    locale: 'pl-PL',
    paypalCheckoutSupported: true,
    paypalSupportedCurrency: true,
    notes: 'Full PayPal Checkout support.',
  },
  {
    code: 'CZ',
    name: 'Czech Republic',
    flag: '🇨🇿',
    currencyCode: 'CZK',
    currencySymbol: 'Kč',
    locale: 'cs-CZ',
    paypalCheckoutSupported: true,
    paypalSupportedCurrency: true,
    notes: 'Full PayPal Checkout support.',
  },
  {
    code: 'BR',
    name: 'Brazil',
    flag: '🇧🇷',
    currencyCode: 'BRL',
    currencySymbol: 'R$',
    locale: 'pt-BR',
    paypalCheckoutSupported: true,
    paypalSupportedCurrency: true,
    notes: 'Full PayPal Checkout support.',
  },
  {
    code: 'MX',
    name: 'Mexico',
    flag: '🇲🇽',
    currencyCode: 'MXN',
    currencySymbol: 'Mex$',
    locale: 'es-MX',
    paypalCheckoutSupported: true,
    paypalSupportedCurrency: true,
    notes: 'Full PayPal Checkout support.',
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    currencyCode: 'AED',
    currencySymbol: 'AED',
    locale: 'ar-AE',
    paypalCheckoutSupported: true,
    paypalSupportedCurrency: false, // Standard PayPal checkout processes in USD for AED buyers
    notes: 'PayPal accounts supported; payments processed in USD.',
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    flag: '🇳🇿',
    currencyCode: 'NZD',
    currencySymbol: 'NZ$',
    locale: 'en-NZ',
    paypalCheckoutSupported: true,
    paypalSupportedCurrency: true,
    notes: 'Full PayPal Checkout support.',
  },
  {
    code: 'HK',
    name: 'Hong Kong SAR',
    flag: '🇭🇰',
    currencyCode: 'HKD',
    currencySymbol: 'HK$',
    locale: 'zh-HK',
    paypalCheckoutSupported: true,
    paypalSupportedCurrency: true,
    notes: 'Full PayPal Checkout support.',
  },
  {
    code: 'MY',
    name: 'Malaysia',
    flag: '🇲🇾',
    currencyCode: 'MYR',
    currencySymbol: 'RM',
    locale: 'ms-MY',
    paypalCheckoutSupported: true,
    paypalSupportedCurrency: true,
    notes: 'Full PayPal Checkout support.',
  },
  {
    code: 'PH',
    name: 'Philippines',
    flag: '🇵🇭',
    currencyCode: 'PHP',
    currencySymbol: '₱',
    locale: 'en-PH',
    paypalCheckoutSupported: true,
    paypalSupportedCurrency: true,
    notes: 'Full PayPal Checkout support.',
  },
  {
    code: 'TH',
    name: 'Thailand',
    flag: '🇹🇭',
    currencyCode: 'THB',
    currencySymbol: '฿',
    locale: 'th-TH',
    paypalCheckoutSupported: true,
    paypalSupportedCurrency: true,
    notes: 'Full PayPal Checkout support.',
  },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // United States (USD)

export function getCountryByCode(code: string): CountryConfig {
  const found = COUNTRIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
  return found || DEFAULT_COUNTRY;
}

export function isPayPalSupportedCurrency(currencyCode: string): boolean {
  return PAYPAL_SUPPORTED_CURRENCIES.includes(currencyCode.toUpperCase() as any);
}
