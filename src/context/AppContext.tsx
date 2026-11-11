// src/context/AppContext.tsx
// Application-wide state management using React Context
// Manages chat messages, budget settings, order state, country/currency preferences, and live exchange rates

'use client';

import React, { createContext, useContext, useReducer, useCallback, ReactNode, useEffect } from 'react';
import {
  ChatMessage,
  UserBudget,
  Order,
  SpendingSummary,
  ProductRecommendation,
  UserPreferences,
  ExchangeRatesState,
} from '@/types';
import { getCountryByCode, DEFAULT_COUNTRY } from '@/lib/countries';
import { formatCurrency, convertWithRates } from '@/lib/exchange-rates';

// ============================================================
// State Types
// ============================================================

interface AppState {
  // Chat state
  messages: ChatMessage[];
  isProcessing: boolean;
  
  // Budget state
  budget: UserBudget | null;
  
  // Orders
  orders: Order[];
  
  // Spending
  spendingSummary: SpendingSummary | null;
  
  // Selected product for checkout
  selectedProduct: ProductRecommendation | null;
  showCheckout: boolean;
  
  // Sidebar
  sidebarOpen: boolean;
  
  // Active page
  activePage: string;

  // Country & Currency Preferences
  userPreferences: UserPreferences | null;
  exchangeRates: Record<string, number> | null;
  ratesTimestamp: string | null;
  ratesSource: string | null;
  showCountrySelector: boolean;
  hasLoadedPreferences: boolean;
}

type AppAction =
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'SET_BUDGET'; payload: UserBudget }
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'SET_SPENDING_SUMMARY'; payload: SpendingSummary }
  | { type: 'SELECT_PRODUCT'; payload: ProductRecommendation | null }
  | { type: 'SHOW_CHECKOUT'; payload: boolean }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'CLOSE_SIDEBAR' }
  | { type: 'OPEN_SIDEBAR' }
  | { type: 'SET_PAGE'; payload: string }
  | { type: 'SET_USER_PREFERENCES'; payload: UserPreferences }
  | { type: 'SET_EXCHANGE_RATES'; payload: ExchangeRatesState }
  | { type: 'OPEN_COUNTRY_SELECTOR' }
  | { type: 'CLOSE_COUNTRY_SELECTOR' }
  | { type: 'SET_LOADED_PREFERENCES'; payload: boolean };

// ============================================================
// Initial State
// ============================================================

const initialState: AppState = {
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: `# 👋 Welcome to AgentPay!

I'm your AI shopping assistant with global multi-currency intelligence and budget protection.

- 🔍 **Global Product Discovery** matching your criteria
- 💱 **Live Currency Localisation** for your country
- 🛡️ **Autonomous Spending Guard** protecting your budget
- 💳 **PayPal Sandbox Checkout** verified & captured securely

**Try asking me something like:**
- "Find wireless headphones under $100"
- "Suggest a great mechanical keyboard for coding"
- "Find trail running shoes under 80 dollars"`,
      timestamp: new Date().toISOString(),
    },
  ],
  isProcessing: false,
  budget: null,
  orders: [],
  spendingSummary: null,
  selectedProduct: null,
  showCheckout: false,
  sidebarOpen: false,
  activePage: 'assistant',
  userPreferences: null,
  exchangeRates: null,
  ratesTimestamp: null,
  ratesSource: null,
  showCountrySelector: false,
  hasLoadedPreferences: false,
};

// ============================================================
// Reducer
// ============================================================

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'SET_BUDGET':
      return { ...state, budget: action.payload };
    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
    case 'ADD_ORDER':
      return { ...state, orders: [action.payload, ...state.orders] };
    case 'SET_SPENDING_SUMMARY':
      return { ...state, spendingSummary: action.payload };
    case 'SELECT_PRODUCT':
      return { ...state, selectedProduct: action.payload };
    case 'SHOW_CHECKOUT':
      return { ...state, showCheckout: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'CLOSE_SIDEBAR':
      return { ...state, sidebarOpen: false };
    case 'OPEN_SIDEBAR':
      return { ...state, sidebarOpen: true };
    case 'SET_PAGE':
      return { ...state, activePage: action.payload, sidebarOpen: false };
    case 'SET_USER_PREFERENCES':
      return { ...state, userPreferences: action.payload };
    case 'SET_EXCHANGE_RATES':
      return {
        ...state,
        exchangeRates: action.payload.rates,
        ratesTimestamp: action.payload.timestamp,
        ratesSource: action.payload.source,
      };
    case 'OPEN_COUNTRY_SELECTOR':
      return { ...state, showCountrySelector: true };
    case 'CLOSE_COUNTRY_SELECTOR':
      return { ...state, showCountrySelector: false };
    case 'SET_LOADED_PREFERENCES':
      return { ...state, hasLoadedPreferences: action.payload };
    default:
      return state;
  }
}

// ============================================================
// Context
// ============================================================

export interface ConvertedPriceInfo {
  displayAmount: number;
  displayCurrency: string;
  originalAmount: number;
  originalCurrency: string;
  exchangeRate: number;
  isConverted: boolean;
  formatted: string;
  formattedOriginal: string;
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  sendMessage: (content: string) => Promise<void>;
  loadBudget: () => Promise<void>;
  saveBudget: (maxPurchase: number, dailyLimit: number) => Promise<void>;
  loadOrders: () => Promise<void>;
  loadSpendingSummary: () => Promise<void>;
  selectProduct: (product: ProductRecommendation) => void;
  clearSelectedProduct: () => void;
  proceedToCheckout: () => void;
  selectProductForCheckout: (product: ProductRecommendation) => void;
  cancelCheckout: () => void;
  loadUserPreferences: () => Promise<void>;
  saveUserPreferences: (countryCode: string, currencyCode: string) => Promise<boolean>;
  loadExchangeRates: () => Promise<void>;
  openCountrySelector: () => void;
  closeCountrySelector: () => void;
  getConvertedPrice: (amountUSD: number) => ConvertedPriceInfo;
  formatPrice: (amountUSD: number) => string;
}

const AppContext = createContext<AppContextType | null>(null);

// ============================================================
// Provider
// ============================================================

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load live exchange rates
  const loadExchangeRates = useCallback(async () => {
    try {
      const res = await fetch('/api/exchange-rates');
      const json = await res.json();
      if (json.success && json.data) {
        dispatch({
          type: 'SET_EXCHANGE_RATES',
          payload: json.data,
        });
      }
    } catch (err) {
      console.warn('Could not load exchange rates:', err);
    }
  }, []);

  // Load user country & currency preference
  const loadUserPreferences = useCallback(async () => {
    try {
      const res = await fetch('/api/user/preferences');
      const json = await res.json();
      if (json.success) {
        if (json.data) {
          dispatch({ type: 'SET_USER_PREFERENCES', payload: json.data });
        } else {
          // First visit: show country selector modal
          dispatch({ type: 'OPEN_COUNTRY_SELECTOR' });
        }
      }
    } catch (err) {
      console.warn('Could not load user preferences:', err);
    } finally {
      dispatch({ type: 'SET_LOADED_PREFERENCES', payload: true });
    }
  }, []);

  // Save user preferences
  const saveUserPreferences = useCallback(
    async (countryCode: string, currencyCode: string): Promise<boolean> => {
      try {
        const res = await fetch('/api/user/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ countryCode, currencyCode }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          dispatch({ type: 'SET_USER_PREFERENCES', payload: json.data });
          dispatch({ type: 'CLOSE_COUNTRY_SELECTOR' });
          return true;
        }
        return false;
      } catch (err) {
        console.error('Failed to save preferences:', err);
        return false;
      }
    },
    []
  );

  const openCountrySelector = useCallback(() => {
    dispatch({ type: 'OPEN_COUNTRY_SELECTOR' });
  }, []);

  const closeCountrySelector = useCallback(() => {
    dispatch({ type: 'CLOSE_COUNTRY_SELECTOR' });
  }, []);

  // Convert USD price to current user display currency
  const getConvertedPrice = useCallback(
    (amountUSD: number): ConvertedPriceInfo => {
      const targetCurrency = state.userPreferences?.currencyCode || 'USD';
      const targetCountry = state.userPreferences?.country || DEFAULT_COUNTRY;
      const isUSD = targetCurrency.toUpperCase() === 'USD';

      if (isUSD || !state.exchangeRates) {
        const formatted = formatCurrency(amountUSD, 'USD', 'en-US');
        return {
          displayAmount: amountUSD,
          displayCurrency: 'USD',
          originalAmount: amountUSD,
          originalCurrency: 'USD',
          exchangeRate: 1.0,
          isConverted: false,
          formatted,
          formattedOriginal: formatted,
        };
      }

      const { displayAmount, rate } = convertWithRates(
        amountUSD,
        targetCurrency,
        state.exchangeRates
      );

      const formatted = formatCurrency(displayAmount, targetCurrency, targetCountry.locale);
      const formattedOriginal = formatCurrency(amountUSD, 'USD', 'en-US');

      return {
        displayAmount,
        displayCurrency: targetCurrency,
        originalAmount: amountUSD,
        originalCurrency: 'USD',
        exchangeRate: rate,
        isConverted: true,
        formatted,
        formattedOriginal,
      };
    },
    [state.userPreferences, state.exchangeRates]
  );

  const formatPrice = useCallback(
    (amountUSD: number): string => {
      const converted = getConvertedPrice(amountUSD);
      return converted.formatted;
    },
    [getConvertedPrice]
  );

  // Send chat message with country & currency awareness
  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
      dispatch({ type: 'SET_PROCESSING', payload: true });

      try {
        const countryCode = state.userPreferences?.countryCode || 'US';
        const currencyCode = state.userPreferences?.currencyCode || 'USD';

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            history: state.messages.slice(-10),
            countryCode,
            currencyCode,
          }),
        });

        const data = await response.json();

        if (data.success) {
          const assistantMessage: ChatMessage = {
            id: `msg-${Date.now()}-resp`,
            role: 'assistant',
            content: data.data.message,
            timestamp: new Date().toISOString(),
            products: data.data.products,
          };
          dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
        } else {
          const errorMessage: ChatMessage = {
            id: `msg-${Date.now()}-err`,
            role: 'assistant',
            content: `I'm sorry, I encountered an error: ${data.error || 'Unknown error'}. Please try again.`,
            timestamp: new Date().toISOString(),
            error: data.error,
          };
          dispatch({ type: 'ADD_MESSAGE', payload: errorMessage });
        }
      } catch (error) {
        const errorMessage: ChatMessage = {
          id: `msg-${Date.now()}-err`,
          role: 'assistant',
          content: `I'm sorry, I couldn't process your request. Please check your connection and try again.\n\n*Error: ${
            error instanceof Error ? error.message : 'Network error'
          }*`,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Network error',
        };
        dispatch({ type: 'ADD_MESSAGE', payload: errorMessage });
      } finally {
        dispatch({ type: 'SET_PROCESSING', payload: false });
      }
    },
    [state.messages, state.userPreferences]
  );

  const loadBudget = useCallback(async () => {
    try {
      const response = await fetch('/api/budget');
      const data = await response.json();
      if (data.success && data.data) {
        dispatch({ type: 'SET_BUDGET', payload: data.data });
      }
    } catch (error) {
      console.error('Failed to load budget:', error);
    }
  }, []);

  const saveBudget = useCallback(async (maxPurchase: number, dailyLimit: number) => {
    try {
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxPurchaseAmount: maxPurchase, dailySpendingLimit: dailyLimit }),
      });
      const data = await response.json();
      if (data.success) {
        dispatch({ type: 'SET_BUDGET', payload: data.data });
      }
    } catch (error) {
      console.error('Failed to save budget:', error);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      if (data.success) {
        dispatch({ type: 'SET_ORDERS', payload: data.data });
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  }, []);

  const loadSpendingSummary = useCallback(async () => {
    try {
      const response = await fetch('/api/spending');
      const data = await response.json();
      if (data.success) {
        dispatch({ type: 'SET_SPENDING_SUMMARY', payload: data.data });
      }
    } catch (error) {
      console.error('Failed to load spending summary:', error);
    }
  }, []);

  const selectProduct = useCallback((product: ProductRecommendation) => {
    dispatch({ type: 'SELECT_PRODUCT', payload: product });
  }, []);

  const clearSelectedProduct = useCallback(() => {
    dispatch({ type: 'SELECT_PRODUCT', payload: null });
  }, []);

  const proceedToCheckout = useCallback(() => {
    dispatch({ type: 'SHOW_CHECKOUT', payload: true });
  }, []);

  const selectProductForCheckout = useCallback((product: ProductRecommendation) => {
    dispatch({ type: 'SELECT_PRODUCT', payload: product });
    dispatch({ type: 'SHOW_CHECKOUT', payload: true });
  }, []);

  const cancelCheckout = useCallback(() => {
    dispatch({ type: 'SELECT_PRODUCT', payload: null });
    dispatch({ type: 'SHOW_CHECKOUT', payload: false });
  }, []);

  // Load preferences and exchange rates on mount
  useEffect(() => {
    loadUserPreferences();
    loadExchangeRates();
  }, [loadUserPreferences, loadExchangeRates]);

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        sendMessage,
        loadBudget,
        saveBudget,
        loadOrders,
        loadSpendingSummary,
        selectProduct,
        clearSelectedProduct,
        proceedToCheckout,
        selectProductForCheckout,
        cancelCheckout,
        loadUserPreferences,
        saveUserPreferences,
        loadExchangeRates,
        openCountrySelector,
        closeCountrySelector,
        getConvertedPrice,
        formatPrice,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
