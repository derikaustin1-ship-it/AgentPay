// src/components/PaymentResultModal.tsx
// Displays comprehensive payment result states:
// - Payment Successful (with digital receipt & sandbox disclaimer)
// - Payment Cancelled (clear status without charges)
// - Payment Failed (clear error details)
// - Payment Pending / Verifying (with progress spinner)

'use client';

import React from 'react';
import {
  CheckCircleIcon,
  AlertCircleIcon,
  XIcon,
  CreditCardIcon,
  ArrowRightIcon,
  ShoppingBagIcon,
  ShieldCheckIcon,
} from './Icons';

export interface PaymentResultData {
  state: 'pending' | 'success' | 'cancelled' | 'failed';
  paypalOrderId?: string;
  captureId?: string;
  amount?: string | number;
  currency?: string;
  productName?: string;
  productImage?: string;
  errorMessage?: string;
  alreadyCaptured?: boolean;
}

interface PaymentResultModalProps {
  result: PaymentResultData | null;
  onClose: () => void;
  onViewOrders: () => void;
}

export default function PaymentResultModal({
  result,
  onClose,
  onViewOrders,
}: PaymentResultModalProps) {
  if (!result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                result.state === 'success'
                  ? 'bg-emerald-100 text-emerald-600'
                  : result.state === 'cancelled'
                  ? 'bg-amber-100 text-amber-600'
                  : result.state === 'failed'
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-blue-100 text-blue-600'
              }`}
            >
              {result.state === 'success' && <CheckCircleIcon className="w-5 h-5" />}
              {result.state === 'cancelled' && <AlertCircleIcon className="w-5 h-5" />}
              {result.state === 'failed' && <AlertCircleIcon className="w-5 h-5" />}
              {result.state === 'pending' && <CreditCardIcon className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 text-base">
                  {result.state === 'success' && 'Payment Successful'}
                  {result.state === 'cancelled' && 'Payment Cancelled'}
                  {result.state === 'failed' && 'Payment Failed'}
                  {result.state === 'pending' && 'Payment Pending'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  PayPal Sandbox
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {result.state === 'success' && 'Transaction completed with explicit user approval'}
                {result.state === 'cancelled' && 'Checkout was cancelled by user on PayPal'}
                {result.state === 'failed' && 'Unable to complete payment capture'}
                {result.state === 'pending' && 'Verifying transaction status with PayPal Sandbox'}
              </p>
            </div>
          </div>
          {result.state !== 'pending' && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <XIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* STATE 1: PENDING / VERIFYING */}
          {result.state === 'pending' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">Verifying PayPal Payment...</h4>
                <p className="text-xs text-slate-500">
                  Contacting PayPal Sandbox to verify approval and capture order
                </p>
              </div>
              {result.paypalOrderId && (
                <p className="text-[11px] text-slate-400 font-mono">
                  Order ID: {result.paypalOrderId}
                </p>
              )}
            </div>
          )}

          {/* STATE 2: SUCCESS RECEIPT */}
          {result.state === 'success' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs border border-emerald-200">
                  <CheckCircleIcon className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 pt-2">
                  Sandbox Payment Complete!
                </h4>
                <p className="text-xs text-slate-500">
                  {result.alreadyCaptured
                    ? 'Displaying previously confirmed Sandbox receipt'
                    : 'Payment captured securely via PayPal REST Orders API'}
                </p>
              </div>

              {/* Digital Transaction Receipt */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2.5">
                {result.paypalOrderId && (
                  <div className="flex justify-between items-center text-slate-500">
                    <span>PayPal Sandbox Order ID:</span>
                    <code className="bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px] font-mono font-bold text-slate-800">
                      {result.paypalOrderId}
                    </code>
                  </div>
                )}
                {result.captureId && (
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Transaction / Capture ID:</span>
                    <code className="bg-white px-2 py-0.5 rounded border border-emerald-200 text-[11px] font-mono font-bold text-emerald-800">
                      {result.captureId}
                    </code>
                  </div>
                )}
                {result.productName && (
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Product:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[220px]">
                      {result.productName}
                    </span>
                  </div>
                )}
                {result.amount && (
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Captured Amount:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      ${Number(result.amount).toFixed(2)} {result.currency || 'USD'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-500">
                  <span>Order Status:</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                    COMPLETED (SANDBOX)
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Timestamp:</span>
                  <span suppressHydrationWarning>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Explicit Simulation Disclaimer */}
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <div className="font-bold flex items-center space-x-1 text-amber-950">
                  <ShieldCheckIcon className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Simulated AgentPay Checkout</span>
                </div>
                <p className="leading-relaxed">
                  This transaction was executed in the <strong>PayPal Sandbox environment</strong>. External merchants or retailers are not billed and no physical package will be shipped.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3 pt-1">
                <button
                  type="button"
                  onClick={onViewOrders}
                  className="w-1/2 py-3 px-4 rounded-xl border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <ShoppingBagIcon className="w-3.5 h-3.5" />
                  <span>View in Order History</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: CANCELLED SCREEN */}
          {result.state === 'cancelled' && (
            <div className="text-center py-2 space-y-4">
              <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
                <AlertCircleIcon className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-900">Payment Was Cancelled</h4>
                <p className="text-xs text-slate-500">
                  You cancelled the checkout session before approving payment on PayPal Sandbox.
                </p>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 text-left space-y-2">
                <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                  <span>✓ No charges were made</span>
                </div>
                <p className="text-amber-900/90 text-[11px] leading-relaxed">
                  Your funds and daily spending limit remain completely untouched. You can select another product or resume shopping at any time.
                </p>
                {result.paypalOrderId && (
                  <p className="text-[11px] text-amber-800 font-mono pt-1 border-t border-amber-200/80">
                    Cancelled Session ID: {result.paypalOrderId}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}

          {/* STATE 4: FAILED SCREEN */}
          {result.state === 'failed' && (
            <div className="text-center py-2 space-y-4">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
                <AlertCircleIcon className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-900">Payment Could Not Be Captured</h4>
                <p className="text-xs text-rose-600">
                  {result.errorMessage || 'An error occurred while confirming your PayPal payment.'}
                </p>
              </div>

              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-950 text-left space-y-2">
                <div className="font-bold text-rose-900">Security & Safety Notice</div>
                <p className="text-rose-900/90 text-[11px] leading-relaxed">
                  No duplicate charges were processed. If this was caused by an expired or unapproved session, please initiate checkout again.
                </p>
                {result.paypalOrderId && (
                  <p className="text-[11px] text-rose-800 font-mono pt-1 border-t border-rose-200/80">
                    Order ID: {result.paypalOrderId}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

