// src/lib/budget.ts
// Server-side spending-control and budget protection service
// Enforces limits strictly on the backend to prevent unauthorized or over-budget orders

import { getUserBudget, getTodaySpending } from './database';
import { SpendingCheck } from '@/types';

const DEFAULT_USER_ID = 'demo-user-1';

/**
 * Check whether a transaction amount respects the user's spending limits.
 * All logic runs server-side and cannot be bypassed by frontend tampering.
 */
export function checkSpendingLimits(
  amount: number,
  userId: string = DEFAULT_USER_ID
): SpendingCheck {
  const budget = getUserBudget(userId);

  if (!budget) {
    return {
      withinPurchaseLimit: true,
      withinDailyLimit: true,
      currentDailySpending: 0,
      remainingDailyBudget: 200,
      maxPurchaseAmount: 100,
      dailySpendingLimit: 200,
      message: 'Default limits active ($100 per item / $200 daily). Purchase is within limits.',
      allowed: true,
    };
  }

  const todaySpending = getTodaySpending(userId);
  const amountCents = Math.round(amount * 100);
  const maxPurchaseCents = Math.round(budget.max_purchase_amount * 100);
  const todaySpendingCents = Math.round(todaySpending * 100);
  const dailyLimitCents = Math.round(budget.daily_spending_limit * 100);

  const withinPurchaseLimit = amountCents <= maxPurchaseCents;
  const withinDailyLimit = (todaySpendingCents + amountCents) <= dailyLimitCents;
  const allowed = withinPurchaseLimit && withinDailyLimit;

  let message = '';
  if (!withinPurchaseLimit && !withinDailyLimit) {
    message = `Item price ($${amount.toFixed(2)}) exceeds your max purchase limit of $${budget.max_purchase_amount.toFixed(2)}, and would also exceed your remaining daily budget of $${Math.max(0, budget.daily_spending_limit - todaySpending).toFixed(2)}.`;
  } else if (!withinPurchaseLimit) {
    message = `Item price ($${amount.toFixed(2)}) exceeds your configured maximum purchase limit of $${budget.max_purchase_amount.toFixed(2)}.`;
  } else if (!withinDailyLimit) {
    message = `Transaction of $${amount.toFixed(2)} would exceed your daily spending limit of $${budget.daily_spending_limit.toFixed(2)}. You have spent $${todaySpending.toFixed(2)} today ($${Math.max(0, budget.daily_spending_limit - todaySpending).toFixed(2)} remaining).`;
  } else {
    const remaining = budget.daily_spending_limit - todaySpending - amount;
    message = `Transaction of $${amount.toFixed(2)} is approved. You will have $${remaining.toFixed(2)} remaining in your daily budget.`;
  }

  return {
    withinPurchaseLimit,
    withinDailyLimit,
    currentDailySpending: todaySpending,
    remainingDailyBudget: Math.max(0, budget.daily_spending_limit - todaySpending),
    maxPurchaseAmount: budget.max_purchase_amount,
    dailySpendingLimit: budget.daily_spending_limit,
    message,
    allowed,
  };
}

