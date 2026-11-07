// src/app/api/paypal/create-order/route.ts
// Creates a PayPal Sandbox order after validating spending limits
// Never trusts amounts from the frontend — validates everything server-side

import { NextRequest, NextResponse } from 'next/server';
import { createPayPalOrder, isPayPalConfigured } from '@/lib/paypal';
import { checkSpendingLimits } from '@/lib/budget';
import { getProductById, createOrder } from '@/lib/database';

export const dynamic = 'force-dynamic';

const DEFAULT_USER_ID = 'demo-user-1';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Step 1: Get the product from the database (server-side price, not from frontend)
    const product = getProductById(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Step 2: Server-side spending limit validation
    const spendingCheck = checkSpendingLimits(product.price, DEFAULT_USER_ID);
    if (!spendingCheck.allowed) {
      return NextResponse.json({
        success: false,
        error: 'Budget limit exceeded',
        data: { spendingCheck },
      }, { status: 403 });
    }

    // Step 3: Check if PayPal is configured
    if (!isPayPalConfigured()) {
      // Create a simulated order for demo purposes
      const demoOrderId = `DEMO-${Date.now()}`;
      const orderId = `order-${Date.now()}`;

      createOrder({
        id: orderId,
        userId: DEFAULT_USER_ID,
        productId: product.id,
        productName: product.name,
        productImage: product.image_url || '',
        paypalOrderId: demoOrderId,
        amount: product.price,
        currency: product.currency || 'USD',
        paymentStatus: 'pending',
      });

      return NextResponse.json({
        success: true,
        data: {
          orderId,
          paypalOrderId: demoOrderId,
          approvalUrl: null,
          amount: product.price,
          currency: product.currency || 'USD',
          productName: product.name,
          isDemo: true,
          message: 'PayPal credentials not configured. This is a simulated order. Configure PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env.local for real PayPal Sandbox integration.',
        },
      });
    }

    // Step 4: Create PayPal Sandbox order
    const origin =
      request.headers.get('origin') ||
      (request.headers.get('x-forwarded-host')
        ? `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('x-forwarded-host')}`
        : null) ||
      (request.headers.get('host')
        ? `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`
        : null) ||
      (process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : null) ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const paypalOrder = await createPayPalOrder(
      product.price,
      product.currency || 'USD',
      product.name,
      `${origin}/api/paypal/success`,
      `${origin}/api/paypal/cancel`
    );

    // Step 5: Store order in database
    const orderId = `order-${Date.now()}`;
    createOrder({
      id: orderId,
      userId: DEFAULT_USER_ID,
      productId: product.id,
      productName: product.name,
      productImage: product.image_url || '',
      paypalOrderId: paypalOrder.id,
      amount: product.price,
      currency: product.currency || 'USD',
      paymentStatus: 'pending',
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        paypalOrderId: paypalOrder.id,
        approvalUrl: paypalOrder.approvalUrl,
        amount: product.price,
        currency: product.currency || 'USD',
        productName: product.name,
        isDemo: false,
      },
    });
  } catch (error) {
    console.error('PayPal create order error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    );
  }
}
