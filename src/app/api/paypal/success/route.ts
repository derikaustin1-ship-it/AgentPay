// src/app/api/paypal/success/route.ts
// Handles PayPal payment success redirect

import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatusByPayPalId } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token'); // PayPal order ID

  if (token) {
    updateOrderStatusByPayPalId(token, 'approved');
  }

  // Redirect back to the app with the PayPal order ID for capture
  return NextResponse.redirect(new URL(`/?payment=approved&paypalOrderId=${token}`, request.url));
}
