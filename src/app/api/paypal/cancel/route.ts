// src/app/api/paypal/cancel/route.ts
// Handles PayPal payment cancellation redirect

import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatusByPayPalId } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token'); // PayPal order ID

  if (token) {
    updateOrderStatusByPayPalId(token, 'cancelled');
  }

  // Redirect back to the app with cancelled status and order token
  const redirectUrl = new URL(
    `/?payment=cancelled${token ? `&paypalOrderId=${encodeURIComponent(token)}` : ''}`,
    request.url
  );

  return NextResponse.redirect(redirectUrl);
}
