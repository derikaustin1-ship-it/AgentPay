// src/types/index.ts
// Central type definitions for the AgentPay application

// ============================================================
// Product Types
// ============================================================

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  imageUrl: string;
  description: string;
  seller: string;
  productUrl: string;
  category: string;
  rating?: number;
  reviewCount?: number;
  availability?: string;
  features?: string[];
  isDemo: boolean; // Always true for demo catalogue items
}

export interface ProductSearchParams {
  query: string;
  category?: string;
  maxPrice?: number;
  minPrice?: number;
  preferences?: string[];
  brands?: string[];
}

export interface ProductRecommendation {
  product: Product;
  matchScore: number; // 0-100
  reasoning: string;
  advantages: string[];
  limitations: string[];
  trustWarnings: TrustWarning[];
}

// ============================================================
// Trust & Warning Types
// ============================================================

export interface TrustWarning {
  type: 'missing_seller' | 'missing_description' | 'price_anomaly' | 'incomplete_details' | 'suspicious_offer';
  severity: 'low' | 'medium' | 'high';
  message: string;
  details: string;
}

// ============================================================
// Budget Types
// ============================================================

export interface UserBudget {
  id: string;
  userId: string;
  maxPurchaseAmount: number;
  dailySpendingLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface SpendingCheck {
  withinPurchaseLimit: boolean;
  withinDailyLimit: boolean;
  currentDailySpending: number;
  remainingDailyBudget: number;
  maxPurchaseAmount: number;
  dailySpendingLimit: number;
  message: string;
  allowed: boolean;
}

export interface BudgetValidationResult {
  allowed: boolean;
  productId: string;
  productName: string;
  productImage: string;
  brand: string;
  seller: string;
  actualPrice: number;
  currency: string;
  maxPurchaseAmount: number;
  dailySpendingLimit: number;
  currentDailySpending: number;
  remainingDailyBudget: number;
  remainingAfterPurchase: number;
  withinPurchaseLimit: boolean;
  withinDailyLimit: boolean;
  isBoundaryMatch: boolean;
  isPurchaseBoundary?: boolean;
  isDailyBoundary?: boolean;
  status: 'approved' | 'blocked_purchase_limit' | 'blocked_daily_limit' | 'blocked_both';
  message: string;
  explanation: string;
}

// ============================================================
// Order Types
// ============================================================

export interface Order {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productImage: string;
  paypalOrderId: string;
  paypalCaptureId?: string;
  amount: number;
  currency: string;
  paymentStatus: 'pending' | 'approved' | 'captured' | 'cancelled' | 'failed';
  createdAt: string;
  isSandbox: boolean;
  displayAmount?: number;
  displayCurrency?: string;
  exchangeRate?: number;
  rateTimestamp?: string;
}

// ============================================================
// Country & Currency Preferences Types
// ============================================================

export interface UserPreferences {
  countryCode: string;
  currencyCode: string;
  country: {
    code: string;
    name: string;
    flag: string;
    currencyCode: string;
    currencySymbol: string;
    locale: string;
    paypalCheckoutSupported: boolean;
    paypalSupportedCurrency: boolean;
    paypalDomesticUnavailable?: boolean;
    notes?: string;
  };
  updatedAt: string;
}

export interface ExchangeRatesState {
  rates: Record<string, number>;
  timestamp: string;
  source: string;
}

// ============================================================
// Chat Types
// ============================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  products?: ProductRecommendation[];
  isLoading?: boolean;
  searchStatus?: string;
  error?: string;
}

export interface ShoppingRequirements {
  productCategory: string;
  preferences: string[];
  maxBudget?: number;
  preferredBrands: string[];
  importantFeatures: string[];
  productRequirements?: string[];
  intendedUsage?: string[];
  otherPreferences?: string[];
  occasion?: string;
  constraints: string[];
  searchQuery?: string;
  isMissingEssentialInfo?: boolean;
  followUpQuestion?: string;
  refinementAction?: 'none' | 'cheaper' | 'better_rated' | 'different_brand' | 'usage_change' | 'compare';
}

// ============================================================
// PayPal Types
// ============================================================

export interface PayPalOrder {
  id: string;
  status: string;
  approvalUrl?: string;
  amount: number;
  currency: string;
}

export interface PaymentApproval {
  product: Product;
  amount: number;
  currency: string;
  remainingBudget: number;
  paypalOrderId: string;
  status: string;
}

// ============================================================
// Dashboard Types
// ============================================================

export interface SpendingSummary {
  totalSpending: number;
  orderCount: number;
  todaySpending: number;
  dailySpendingLimit: number;
  remainingDailyBudget: number;
  maxPurchaseAmount: number;
  recentOrders: Order[];
  budgetUtilization: number; // percentage
}

// ============================================================
// AI Agent Types
// ============================================================

export type AgentToolName = 
  | 'search_products'
  | 'compare_products'
  | 'recommend_products'
  | 'check_spending_limits'
  | 'create_paypal_order'
  | 'get_order_status';

export interface AgentToolCall {
  name: AgentToolName;
  arguments: Record<string, unknown>;
}

export interface AgentResponse {
  message: string;
  toolCalls?: AgentToolCall[];
  products?: ProductRecommendation[];
  spendingCheck?: SpendingCheck;
  paypalOrder?: PayPalOrder;
}

// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

