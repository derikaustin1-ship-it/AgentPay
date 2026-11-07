// src/app/api/paypal/capture-order/route.ts
// Captures an approved PayPal Sandbox order securely
// Features pre-capture status verification, duplicate-capture protection, and idempotency handling

import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder, getPayPalOrderStatus, isPayPalConfigured } from '@/lib/paypal';
import { updateOrderStatusByPayPalId, isOrderAlreadyCaptured, getOrderByPayPalId } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paypalOrderId } = body;

    if (!paypalOrderId || typeof paypalOrderId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid PayPal order ID is required' },
        { status: 400 }
      );
    }

    // Step 1: Idempotency & Duplicate capture protection
    // If order was already captured, return the existing receipt safely instead of throwing 409
    if (isOrderAlreadyCaptured(paypalOrderId)) {
      const existingOrder = getOrderByPayPalId(paypalOrderId);
      return NextResponse.json({
        success: true,
        alreadyCaptured: true,
        message: 'Order has already been captured. Returning existing receipt.',
        data: {
          paypalOrderId,
          captureId: existingOrder?.paypal_capture_id,
          status: 'COMPLETED',
          amount: existingOrder ? existingOrder.amount.toFixed(2) : undefined,
          currency: existingOrder ? existingOrder.currency : 'USD',
          productName: existingOrder ? existingOrder.product_name : undefined,
          productImage: existingOrder ? existingOrder.product_image : undefined,
          isDemo: Boolean(!isPayPalConfigured() || existingOrder?.is_sandbox),
        },
      });
    }

    // Step 2: Handle Demo Mode (PayPal credentials not configured)
    if (!isPayPalConfigured()) {
      const dbOrder = getOrderByPayPalId(paypalOrderId);
      updateOrderStatusByPayPalId(paypalOrderId, 'captured');
      
      return NextResponse.json({
        success: true,
        data: {
          paypalOrderId,
          status: 'COMPLETED',
          amount: dbOrder ? dbOrder.amount.toFixed(2) : '0.00',
          currency: dbOrder ? dbOrder.currency : 'USD',
          productName: dbOrder?.product_name || 'Simulated Item',
          productImage: dbOrder?.product_image || '',
          isDemo: true,
          message: 'Simulated capture (PayPal not configured). This is a demo transaction.',
        },
      });
    }

    // Step 3: Verify the PayPal Sandbox order status with PayPal before attempting capture
    let paypalStatus;
    try {
      paypalStatus = await getPayPalOrderStatus(paypalOrderId);
    } catch (statusErr) {
      console.error('PayPal getOrderStatus error:', statusErr);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or unverified PayPal order ID. Order was not found in PayPal Sandbox.',
        },
        { status: 400 }
      );
    }

    // If order is already completed on PayPal, update DB and return receipt
    if (paypalStatus.status === 'COMPLETED') {
      updateOrderStatusByPayPalId(paypalOrderId, 'captured', paypalStatus.captureId);
      const dbOrder = getOrderByPayPalId(paypalOrderId);
      return NextResponse.json({
        success: true,
        alreadyCaptured: true,
        data: {
          paypalOrderId: paypalStatus.id,
          captureId: paypalStatus.captureId,
          status: 'COMPLETED',
          amount: paypalStatus.amount,
          currency: paypalStatus.currency || 'USD',
          productName: dbOrder?.product_name,
          productImage: dbOrder?.product_image,
          isDemo: false,
        },
      });
    }

    // Ensure user has explicitly approved the order (status must be APPROVED)
    if (paypalStatus.status !== 'APPROVED') {
      return NextResponse.json(
        {
          success: false,
          error: `Order cannot be captured because user approval is required. Current status: ${paypalStatus.status}.`,
        },
        { status: 400 }
      );
    }

    // Step 4: Securely capture payment with PayPal REST Orders API
    const captureResult = await capturePayPalOrder(paypalOrderId);

    if (captureResult.status === 'COMPLETED') {
      updateOrderStatusByPayPalId(paypalOrderId, 'captured', captureResult.captureId);
      const dbOrder = getOrderByPayPalId(paypalOrderId);

      return NextResponse.json({
        success: true,
        data: {
          paypalOrderId: captureResult.id,
          captureId: captureResult.captureId,
          status: captureResult.status,
          amount: captureResult.amount || paypalStatus.amount,
          currency: captureResult.currency || paypalStatus.currency || 'USD',
          productName: dbOrder?.product_name,
          productImage: dbOrder?.product_image,
          isDemo: false,
        },
      });
    } else {
      updateOrderStatusByPayPalId(paypalOrderId, 'failed');
      return NextResponse.json(
        {
          success: false,
          error: `PayPal payment capture did not complete. Status: ${captureResult.status}`,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('PayPal capture error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to capture payment' },
      { status: 500 }
    );
  }
}
