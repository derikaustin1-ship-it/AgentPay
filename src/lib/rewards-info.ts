// src/lib/rewards-info.ts
// Verified factual knowledge base for PayPal Rewards program

export interface RewardsEligibility {
  status: 'eligible' | 'region_restricted' | 'partial_support' | 'unsupported';
  isEligible: boolean;
  countryCode: string;
  countryName: string;
  headline: string;
  summary: string;
  officialTermsUrl: string;
  supportedCurrencies: string[];
  keyRules: string[];
  disclaimer: string;
}

export const PAYPAL_OFFICIAL_REWARDS_TERMS_URL =
  'https://www.paypal.com/us/legalhub/useragreement-full#paypal-rewards';

/**
 * Returns verified factual information on PayPal Rewards based on user's country.
 * NOTE: PayPal does not offer a public third-party API to query or redeem individual user points.
 */
export function getRewardsEligibility(countryCode: string, countryName?: string): RewardsEligibility {
  const upper = (countryCode || 'US').toUpperCase();
  const name = countryName || (upper === 'US' ? 'United States' : upper === 'IN' ? 'India' : upper === 'GB' ? 'United Kingdom' : 'Selected Country');

  if (upper === 'US') {
    return {
      status: 'eligible',
      isEligible: true,
      countryCode: 'US',
      countryName: 'United States',
      headline: 'PayPal Rewards is fully active for US Personal Accounts',
      summary:
        'US-based PayPal account holders (18+) can earn points on eligible purchases and merchant cash back offers. Points can be redeemed for cash back into your PayPal balance, checkout discounts, or digital gift cards.',
      officialTermsUrl: PAYPAL_OFFICIAL_REWARDS_TERMS_URL,
      supportedCurrencies: ['USD'],
      keyRules: [
        'Must have an eligible US PayPal personal account in good standing',
        'Points accrue on eligible purchases made through PayPal Checkout',
        'Points generally reflect as pending for 1 to 90 days depending on merchant return policies',
        'Points can be converted to cash back transferred directly to your PayPal balance',
      ],
      disclaimer:
        'AgentPay does not read or manipulate your personal PayPal Rewards balance. PayPal does not expose an open third-party API for external rewards management.',
    };
  }

  if (upper === 'IN') {
    return {
      status: 'unsupported',
      isEligible: false,
      countryCode: 'IN',
      countryName: 'India',
      headline: 'PayPal Rewards is not available for India accounts',
      summary:
        'PayPal Rewards points and merchant cash back programs are currently restricted to US and select tier-1 regions. Furthermore, domestic payments in INR are restricted under RBI guidelines.',
      officialTermsUrl: PAYPAL_OFFICIAL_REWARDS_TERMS_URL,
      supportedCurrencies: ['USD'],
      keyRules: [
        'India accounts are restricted to export/cross-border commercial receipts',
        'PayPal Rewards points program is not operational in India',
        'Purchases made in Sandbox will not accumulate reward points',
      ],
      disclaimer:
        'No rewards or points will be accumulated or redeemed for INR / India account profiles.',
    };
  }

  if (['GB', 'DE', 'FR', 'AU', 'CA'].includes(upper)) {
    return {
      status: 'partial_support',
      isEligible: false,
      countryCode: upper,
      countryName: name,
      headline: `PayPal Deals & Offers available; Point-based Rewards restricted`,
      summary:
        `While PayPal provides localized merchant deals and promotional coupons in ${name}, the unified PayPal Rewards points-accumulation and cash back redemption system is primarily restricted to US accounts.`,
      officialTermsUrl: PAYPAL_OFFICIAL_REWARDS_TERMS_URL,
      supportedCurrencies: ['USD'],
      keyRules: [
        'Merchant discounts and voucher codes may apply at checkout',
        'Points accumulation system is currently non-operational for this country profile',
      ],
      disclaimer:
        'AgentPay displays verified promotional policies only. No fake points balances are created.',
    };
  }

  return {
    status: 'region_restricted',
    isEligible: false,
    countryCode: upper,
    countryName: name,
    headline: `PayPal Rewards points not supported in ${name}`,
    summary:
      'The official PayPal Rewards program is currently unavailable in this geographic territory. Standard PayPal Sandbox checkout remains fully operational.',
    officialTermsUrl: PAYPAL_OFFICIAL_REWARDS_TERMS_URL,
    supportedCurrencies: ['USD'],
    keyRules: [
      'Rewards program unavailable in this region',
      'Transactions will process without rewards point accrual',
    ],
    disclaimer:
      'AgentPay adheres to strict data honesty and never fabricates unsupported rewards balances.',
  };
}
