// src/app/page.tsx
// Main application dashboard for AgentPay
// Includes PayPal Sandbox Checkout return handlers and PaymentResultModal

'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import ChatAssistant from '@/components/ChatAssistant';
import ProductComparison from '@/components/ProductComparison';
import SpendingDashboard from '@/components/SpendingDashboard';
import OrderHistory from '@/components/OrderHistory';
import BudgetSettings from '@/components/BudgetSettings';
import PaymentModal from '@/components/PaymentModal';
import PaymentResultModal, { PaymentResultData } from '@/components/PaymentResultModal';

function AppContent() {
  const { state, loadBudget, loadOrders, loadSpendingSummary, dispatch } = useApp();
  const { activePage } = state;
  const searchParams = useSearchParams();

  const [paymentResult, setPaymentResult] = useState<PaymentResultData | null>(null);

  // Load initial data on mount
  useEffect(() => {
    loadBudget();
    loadOrders();
    loadSpendingSummary();
  }, [loadBudget, loadOrders, loadSpendingSummary]);

  // Handle PayPal return query parameters (?payment=approved | cancelled | failed)
  useEffect(() => {
    const payment = searchParams.get('payment');
    const paypalOrderId = searchParams.get('paypalOrderId');

    if (!payment) return;

    if (payment === 'approved' && paypalOrderId) {
      // Step 1: Set pending status while verifying on backend
      setPaymentResult({
        state: 'pending',
        paypalOrderId,
      });

      // Step 2: Call secure server-side capture endpoint
      fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paypalOrderId }),
      })
        .then(async (res) => {
          const json = await res.json();
          if (!res.ok || !json.success) {
            throw new Error(json.error || 'Payment capture failed');
          }
          return json;
        })
        .then((json) => {
          setPaymentResult({
            state: 'success',
            paypalOrderId,
            captureId: json.data?.captureId,
            amount: json.data?.amount,
            currency: json.data?.currency,
            productName: json.data?.productName,
            productImage: json.data?.productImage,
            alreadyCaptured: json.alreadyCaptured,
          });
          loadOrders();
          loadSpendingSummary();
        })
        .catch((err) => {
          console.error('PayPal capture error:', err);
          setPaymentResult({
            state: 'failed',
            paypalOrderId,
            errorMessage: err instanceof Error ? err.message : 'Failed to capture payment',
          });
        });
    } else if (payment === 'cancelled') {
      setPaymentResult({
        state: 'cancelled',
        paypalOrderId: paypalOrderId || undefined,
      });
      loadOrders();
    } else if (payment === 'failed') {
      setPaymentResult({
        state: 'failed',
        paypalOrderId: paypalOrderId || undefined,
        errorMessage: searchParams.get('error') || 'Payment authorization failed',
      });
    }
  }, [searchParams, loadOrders, loadSpendingSummary]);

  function handleClosePaymentResult() {
    setPaymentResult(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }

  function handleViewOrdersFromResult() {
    setPaymentResult(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname);
    }
    dispatch({ type: 'SET_PAGE', payload: 'orders' });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto">
          {activePage === 'assistant' && <ChatAssistant />}
          {activePage === 'comparison' && <ProductComparison />}
          {activePage === 'spending' && <SpendingDashboard />}
          {activePage === 'orders' && <OrderHistory />}
          {activePage === 'budget' && <BudgetSettings />}
        </main>
      </div>

      {/* Global Payment Approval Screen */}
      <PaymentModal />

      {/* Global Payment Result Modal (Success, Cancelled, Failed, Pending) */}
      <PaymentResultModal
        result={paymentResult}
        onClose={handleClosePaymentResult}
        onViewOrders={handleViewOrdersFromResult}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500 text-sm">
          Loading AgentPay...
        </div>
      }
    >
      <AppContent />
    </Suspense>
  );
}
