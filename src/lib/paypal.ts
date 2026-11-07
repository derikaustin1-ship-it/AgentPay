// src/lib/paypal.ts
// PayPal Sandbox integration using the official PayPal REST Orders API (v2)
// Server-side only: client secret is never exposed to the browser

import { isOrderAlreadyCaptured } from './database';

const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';

/**
 * Check if real PayPal Sandbox credentials are provided in the environment.
 */
export function isPayPalConfigured(): boolean {
  return Boolean(
    PAYPAL_CLIENT_ID && 
    PAYPAL_CLIENT_SECRET && 
    !PAYPAL_CLIENT_ID.includes('your_paypal_client_id')
  );
}

/**
 * Get an OAuth2 Bearer Access Token from PayPal Sandbox.
 */
async function getAccessToken(): Promise<string> {
  if (!isPayPalConfigured()) {
    throw new Error(
      'PayPal Sandbox credentials not configured. Please add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to .env.local.'
    );
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal Sandbox OAuth error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Resolve the dynamic application base URL for PayPal redirects.
 * Automatically adapts between local development, Vercel deployments, and custom domains.
 */
export function getDefaultBaseUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

/**
 * Create a PayPal Sandbox Order (v2/checkout/orders).
 * The order amount is computed and verified on the server.
 */
export async function createPayPalOrder(
  amount: number,
  currency: string = 'USD',
  productName: string = 'AgentPay Order',
  returnUrl: string = `${getDefaultBaseUrl()}/api/paypal/success`,
  cancelUrl: string = `${getDefaultBaseUrl()}/api/paypal/cancel`
): Promise<{
  id: string;
  status: string;
  approvalUrl: string;
}> {
  const accessToken = await getAccessToken();

  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: amount.toFixed(2),
        },
        description: `${productName} — AgentPay Sandbox Purchase`,
      },
    ],
    application_context: {
      brand_name: 'AgentPay (Sandbox)',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal Sandbox Create Order failed (${response.status}): ${errorText}`);
  }

  const orderData = await response.json();
  const approvalLink = orderData.links?.find(
    (link: { rel: string; href: string }) => link.rel === 'approve'
  );

  return {
    id: orderData.id,
    status: orderData.status,
    approvalUrl: approvalLink?.href || '',
  };
}

/**
 * Capture payment for an approved PayPal Sandbox Order.
 * Includes idempotent check against duplicate captures.
 */
export async function capturePayPalOrder(orderId: string): Promise<{
  id: string;
  status: string;
  amount?: string;
  currency?: string;
  captureId?: string;
}> {
  // Guard against duplicate capture
  if (isOrderAlreadyCaptured(orderId)) {
    throw new Error('This transaction has already been captured. Duplicate capture prevented.');
  }

  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal Sandbox Capture failed (${response.status}): ${errorText}`);
  }

  const captureData = await response.json();
  const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];

  return {
    id: captureData.id,
    status: captureData.status,
    amount: capture?.amount?.value || captureData.purchase_units?.[0]?.amount?.value,
    currency: capture?.amount?.currency_code || captureData.purchase_units?.[0]?.amount?.currency_code,
    captureId: capture?.id,
  };
}

/**
 * Get status of an existing PayPal Sandbox Order.
 */
export async function getPayPalOrderStatus(orderId: string): Promise<{
  id: string;
  status: string;
  amount?: string;
  currency?: string;
  captureId?: string;
}> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal Sandbox Order status check failed (${response.status}): ${errorText}`);
  }

  const orderData = await response.json();
  const purchaseUnit = orderData.purchase_units?.[0];
  const capture = purchaseUnit?.payments?.captures?.[0];

  return {
    id: orderData.id,
    status: orderData.status,
    amount: purchaseUnit?.amount?.value,
    currency: purchaseUnit?.amount?.currency_code,
    captureId: capture?.id,
  };
}

