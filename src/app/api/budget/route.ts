// src/app/api/budget/route.ts
// Budget settings API - get and update user spending limits

import { NextRequest, NextResponse } from 'next/server';
import { getUserBudget, updateUserBudget } from '@/lib/database';

export const dynamic = 'force-dynamic';

const DEFAULT_USER_ID = 'demo-user-1';

export async function GET() {
  try {
    const budget = getUserBudget(DEFAULT_USER_ID);
    
    if (!budget) {
      return NextResponse.json({
        success: true,
        data: {
          userId: DEFAULT_USER_ID,
          maxPurchaseAmount: 100,
          dailySpendingLimit: 200,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: budget.user_id,
        maxPurchaseAmount: budget.max_purchase_amount,
        dailySpendingLimit: budget.daily_spending_limit,
        createdAt: budget.created_at,
        updatedAt: budget.updated_at,
      },
    });
  } catch (error) {
    console.error('Budget GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load budget settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { maxPurchaseAmount, dailySpendingLimit } = body;

    // Validate inputs
    if (typeof maxPurchaseAmount !== 'number' || maxPurchaseAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Maximum purchase amount must be a positive number' },
        { status: 400 }
      );
    }
    if (typeof dailySpendingLimit !== 'number' || dailySpendingLimit <= 0) {
      return NextResponse.json(
        { success: false, error: 'Daily spending limit must be a positive number' },
        { status: 400 }
      );
    }
    if (maxPurchaseAmount > dailySpendingLimit) {
      return NextResponse.json(
        { success: false, error: 'Maximum purchase amount cannot exceed daily spending limit' },
        { status: 400 }
      );
    }

    updateUserBudget(DEFAULT_USER_ID, maxPurchaseAmount, dailySpendingLimit);

    const updated = getUserBudget(DEFAULT_USER_ID);

    return NextResponse.json({
      success: true,
      data: {
        userId: DEFAULT_USER_ID,
        maxPurchaseAmount: updated?.max_purchase_amount || maxPurchaseAmount,
        dailySpendingLimit: updated?.daily_spending_limit || dailySpendingLimit,
        updatedAt: updated?.updated_at,
      },
    });
  } catch (error) {
    console.error('Budget POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update budget settings' },
      { status: 500 }
    );
  }
}
