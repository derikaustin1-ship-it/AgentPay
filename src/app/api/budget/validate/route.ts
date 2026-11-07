// src/app/api/budget/validate/route.ts
// Backend spending-limit validation endpoint
// Verifies actual product price from database against user spending limits
// Never trusts values sent by the frontend

import { NextRequest, NextResponse } from 'next/server';
import { getProductById, getUserBudget, getTodaySpending } from '@/lib/database';

export const dynamic = 'force-dynamic';

const DEFAULT_USER_ID = 'demo-user-1';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, userId } = body as { productId?: string; userId?: string };

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Product ID is required for budget validation' },
        { status: 400 }
      );
    }

    const activeUserId = userId || DEFAULT_USER_ID;

    // 1. Fetch official product details from server database (cannot be spoofed by client)
    const product = getProductById(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: `Product with ID '${productId}' was not found in the catalogue` },
        { status: 404 }
      );
    }

    const actualPrice = Number(product.price);
    const currency = product.currency || 'USD';

    // 2. Fetch official user budget from database
    const budget = getUserBudget(activeUserId);
    const maxPurchaseAmount = budget ? Number(budget.max_purchase_amount) : 100;
    const dailySpendingLimit = budget ? Number(budget.daily_spending_limit) : 200;

    // 3. Fetch recorded spending for today from database (only captured orders)
    const currentDailySpending = Number(getTodaySpending(activeUserId));
    const remainingDailyBudget = Math.max(0, dailySpendingLimit - currentDailySpending);

    // 4. Validate spending limits strictly using 2-decimal rounded currency cents to avoid floating-point errors
    const priceCents = Math.round(actualPrice * 100);
    const maxPurchaseCents = Math.round(maxPurchaseAmount * 100);
    const todaySpendingCents = Math.round(currentDailySpending * 100);
    const dailyLimitCents = Math.round(dailySpendingLimit * 100);
    const projectedTotalDailyCents = todaySpendingCents + priceCents;

    const withinPurchaseLimit = priceCents <= maxPurchaseCents;
    const withinDailyLimit = projectedTotalDailyCents <= dailyLimitCents;
    const allowed = withinPurchaseLimit && withinDailyLimit;

    // 5. Boundary value detection
    const isPurchaseBoundary = priceCents === maxPurchaseCents;
    const isDailyBoundary = projectedTotalDailyCents === dailyLimitCents;
    const isBoundaryMatch = isPurchaseBoundary || isDailyBoundary;

    // 6. Formulate precise, transparent explanations
    let status: 'approved' | 'blocked_purchase_limit' | 'blocked_daily_limit' | 'blocked_both' = 'approved';
    let message = '';
    let explanation = '';

    const remainingAfter = Math.max(0, remainingDailyBudget - actualPrice);

    if (!withinPurchaseLimit && !withinDailyLimit) {
      status = 'blocked_both';
      message = `Checkout Blocked: Price exceeds both single purchase limit and daily budget limit.`;
      explanation = `The product price ($${actualPrice.toFixed(2)}) exceeds your configured maximum purchase limit of $${maxPurchaseAmount.toFixed(2)} AND would exceed your remaining daily budget of $${remainingDailyBudget.toFixed(2)} (Spent today: $${currentDailySpending.toFixed(2)} of $${dailySpendingLimit.toFixed(2)}).`;
    } else if (!withinPurchaseLimit) {
      status = 'blocked_purchase_limit';
      message = `Checkout Blocked: Price exceeds maximum purchase limit.`;
      explanation = `The product price ($${actualPrice.toFixed(2)}) exceeds your configured maximum single purchase limit of $${maxPurchaseAmount.toFixed(2)}. Your remaining daily budget is $${remainingDailyBudget.toFixed(2)}.`;
    } else if (!withinDailyLimit) {
      status = 'blocked_daily_limit';
      message = `Checkout Blocked: Transaction exceeds remaining daily spending limit.`;
      explanation = `A purchase of $${actualPrice.toFixed(2)} would exceed your daily spending limit of $${dailySpendingLimit.toFixed(2)}. You have already spent $${currentDailySpending.toFixed(2)} today, leaving $${remainingDailyBudget.toFixed(2)} available.`;
    } else if (isBoundaryMatch) {
      status = 'approved';
      if (isPurchaseBoundary && isDailyBoundary) {
        message = `Budget Approved (Boundary): Purchase exactly reaches your single-item and daily spending limits.`;
        explanation = `The product price ($${actualPrice.toFixed(2)}) exactly equals your maximum purchase limit of $${maxPurchaseAmount.toFixed(2)} and completes your daily spending limit of $${dailySpendingLimit.toFixed(2)}.`;
      } else if (isPurchaseBoundary) {
        message = `Budget Approved (Boundary): Price exactly equals your maximum purchase limit.`;
        explanation = `The product price ($${actualPrice.toFixed(2)}) exactly matches your maximum purchase limit of $${maxPurchaseAmount.toFixed(2)}. You will have $${remainingAfter.toFixed(2)} remaining in your daily budget.`;
      } else {
        message = `Budget Approved (Boundary): Transaction exactly reaches your daily spending limit.`;
        explanation = `The product price ($${actualPrice.toFixed(2)}) is within your $${maxPurchaseAmount.toFixed(2)} limit and brings your daily spending to exactly $${dailySpendingLimit.toFixed(2)} ($0.00 remaining).`;
      }
    } else {
      status = 'approved';
      message = `Budget Approved: Transaction is safely within all spending controls.`;
      explanation = `The product price ($${actualPrice.toFixed(2)}) is within your $${maxPurchaseAmount.toFixed(2)} limit. After this purchase, you will have $${remainingAfter.toFixed(2)} remaining in your daily budget.`;
    }

    return NextResponse.json({
      success: true,
      data: {
        allowed,
        productId: product.id,
        productName: product.name,
        productImage: product.image_url,
        brand: product.brand,
        seller: product.seller,
        actualPrice,
        currency,
        maxPurchaseAmount,
        dailySpendingLimit,
        currentDailySpending,
        remainingDailyBudget,
        remainingAfterPurchase: remainingAfter,
        withinPurchaseLimit,
        withinDailyLimit,
        isBoundaryMatch,
        isPurchaseBoundary,
        isDailyBoundary,
        status,
        message,
        explanation,
      },
    });
  } catch (error) {
    console.error('Budget validate error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during budget validation' },
      { status: 500 }
    );
  }
}
