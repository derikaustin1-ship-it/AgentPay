// src/app/api/orders/route.ts
// Order management API

import { NextResponse } from 'next/server';
import { getUserOrders } from '@/lib/database';

export const dynamic = 'force-dynamic';

const DEFAULT_USER_ID = 'demo-user-1';

export async function GET() {
  try {
    const orders = getUserOrders(DEFAULT_USER_ID);

    return NextResponse.json({
      success: true,
      data: orders.map(order => ({
        id: order.id,
        userId: order.user_id,
        productId: order.product_id,
        productName: order.product_name,
        productImage: order.product_image,
        paypalOrderId: order.paypal_order_id,
        paypalCaptureId: order.paypal_capture_id,
        amount: order.amount,
        currency: order.currency,
        paymentStatus: order.payment_status,
        createdAt: order.created_at,
        isSandbox: Boolean(order.is_sandbox),
      })),
    });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load orders' },
      { status: 500 }
    );
  }
}
