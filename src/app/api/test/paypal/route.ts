// src/app/api/test/paypal/route.ts
// Test endpoint for PayPal Sandbox REST Orders API v2 integration
// Verifies OAuth access token generation, order creation, and status checking

import { NextRequest, NextResponse } from 'next/server';
import { isPayPalConfigured, createPayPalOrder, getPayPalOrderStatus } from '@/lib/paypal';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isPayPalConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error:
          'PayPal credentials not configured. Please ensure PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are set in .env.local.',
        hint: 'You can generate Sandbox credentials at https://developer.paypal.com/dashboard/applications/sandbox',
      },
      { status: 503 }
    );
  }

  try {
    // Test Step 1: Create a Sandbox order for verification
    const origin =
      request.headers.get('origin') ||
      (request.headers.get('x-forwarded-host')
        ? `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('x-forwarded-host')}`
        : null) ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const testAmount = 25.0;
    const testOrder = await createPayPalOrder(
      testAmount,
      'USD',
      'AgentPay Sandbox Test Item',
      `${origin}/api/paypal/success`,
      `${origin}/api/paypal/cancel`
    );

    // Test Step 2: Query order status to verify read permissions
    const statusResult = await getPayPalOrderStatus(testOrder.id);

    return NextResponse.json({
      success: true,
      environment: 'PayPal Sandbox REST v2',
      apiBase: process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com',
      testResults: {
        oauthTokenObtained: true,
        orderCreated: true,
        orderId: testOrder.id,
        orderStatus: statusResult.status,
        approvalUrl: testOrder.approvalUrl,
        testedAmount: `$${testAmount.toFixed(2)} USD`,
        serverSideValidated: true,
      },
      note: 'The test order was created in Sandbox state. PayPal requires explicit user approval before capturing payment.',
    });
  } catch (error: any) {
    console.error('PayPal test endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'PayPal Sandbox integration test failed',
        troubleshooting: [
          'Verify your Client ID and Client Secret in .env.local.',
          'Ensure your application is configured as "Sandbox" in the PayPal Developer Dashboard.',
          'Verify that PAYPAL_API_BASE is set to https://api-m.sandbox.paypal.com.',
        ],
      },
      { status: 500 }
    );
  }
}

