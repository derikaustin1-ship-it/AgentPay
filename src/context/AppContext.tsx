// src/context/AppContext.tsx
// Application-wide state management using React Context
// Manages chat messages, budget settings, and order state

'use client';

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { ChatMessage, UserBudget, Order, SpendingSummary, ProductRecommendation } from '@/types';

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
  | { type: 'SET_PAGE'; payload: string };

// ============================================================
// Initial State
// ============================================================

const initialState: AppState = {
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: `# 👋 Welcome to AgentPay!

I'm your AI shopping assistant. I can help you:

- 🔍 **Find products** matching your needs
- 📊 **Compare options** across price, features, and ratings
- 💰 **Manage your budget** to avoid overspending
- 💳 **Process payments** through PayPal Sandbox

**Try asking me something like:**
- "Find wireless headphones under $100"
- "Find a birthday gift for someone who loves hiking, budget $50"
- "Compare affordable smartwatches"

*Note: I currently search a demo product catalogue. Results are demonstration data.*`,
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
    default:
      return state;
  }
}

// ============================================================
// Context
// ============================================================

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
}

const AppContext = createContext<AppContextType | null>(null);

// ============================================================
// Provider
// ============================================================

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const sendMessage = useCallback(async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    dispatch({ type: 'SET_PROCESSING', payload: true });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history: state.messages.slice(-10),
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
        content: `I'm sorry, I couldn't process your request. Please check your connection and try again.\n\n*Error: ${error instanceof Error ? error.message : 'Network error'}*`,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Network error',
      };
      dispatch({ type: 'ADD_MESSAGE', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: false });
    }
  }, [state.messages]);

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
