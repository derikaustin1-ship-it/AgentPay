// src/app/api/spending/route.ts
// Spending dashboard data API

import { NextResponse } from 'next/server';
import { getSpendingSummary } from '@/lib/database';

export const dynamic = 'force-dynamic';

const DEFAULT_USER_ID = 'demo-user-1';

export async function GET() {
  try {
    const summary = getSpendingSummary(DEFAULT_USER_ID);

    return NextResponse.json({
      success: true,
      data: {
        totalSpending: summary.totalSpending,
        orderCount: summary.orderCount,
        todaySpending: summary.todaySpending,
        dailySpendingLimit: summary.dailySpendingLimit,
        remainingDailyBudget: summary.remainingDailyBudget,
        maxPurchaseAmount: summary.maxPurchaseAmount,
        budgetUtilization: summary.budgetUtilization,
        recentOrders: summary.recentOrders.map(order => ({
          id: order.id,
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
      },
    });
  } catch (error) {
    console.error('Spending GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load spending data' },
      { status: 500 }
    );
  }
}
