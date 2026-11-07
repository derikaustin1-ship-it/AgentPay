// src/components/ChatAssistant.tsx
// Core Conversational AI Shopping Assistant Interface
// Features prompt suggestions, formatted response bubbles, product recommendations,
// live status transitions, and server-side budget checks.

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import ProductCard from './ProductCard';
import SelectedProductSummary from './SelectedProductSummary';
import {
  SparklesIcon,
  SendIcon,
  ShieldCheckIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  LayersIcon,
} from './Icons';

export default function ChatAssistant() {
  const { state, sendMessage, dispatch } = useApp();
  const { messages, isProcessing, budget } = state;
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasProducts = messages.some((m) => m.products && m.products.length > 0);

  const starterPrompts = [
    'Find wireless headphones for programming and music under $100.',
    'Find a birthday gift for my sister who loves hiking. My budget is $50.',
    'Compare three affordable smartwatches.',
    'Find running shoes under $80.',
  ];

  const refinementPrompts = [
    'Show cheaper alternatives.',
    'Find a better-rated option.',
    'Show products from Sony.',
    'Compare these three products.',
    'Find headphones with 50+ hour battery life.',
  ];

  const activePrompts = hasProducts ? refinementPrompts : starterPrompts;

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  function handleSend(textToSend?: string) {
    const text = (textToSend || inputValue).trim();
    if (!text || isProcessing) return;
    sendMessage(text);
    setInputValue('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleClearChat() {
    dispatch({
      type: 'SET_MESSAGES',
      payload: [
        {
          id: 'welcome-reset',
          role: 'assistant',
          content: `Chat history cleared. How can I assist your shopping today? You can specify category, features, or budget (e.g. "Hiking gear under $50").`,
          timestamp: new Date().toISOString(),
        },
      ],
    });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] bg-slate-50/50">
      {/* Subheader / Status Banner */}
      <div className="bg-white border-b border-slate-200/80 px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-semibold text-slate-800">Model:</span>
          <span className="text-slate-600 font-medium">Gemini 3.8 Flash</span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px] sm:text-xs">
            <span className="hidden sm:inline">Channel3 Live Search Connected</span>
            <span className="sm:hidden">Channel3 Live</span>
          </span>
        </div>
        <button
          onClick={handleClearChat}
          className="text-slate-400 hover:text-slate-600 active:text-slate-800 flex items-center space-x-1 transition-colors min-h-[32px] px-2 rounded-lg cursor-pointer ml-auto sm:ml-0"
          title="Reset conversation"
        >
          <RefreshCwIcon className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={message.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-4xl mx-auto`}
            >
              {/* Message Header */}
              <div className="flex items-center space-x-2 mb-1 px-1 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-600">
                  {isUser ? 'You' : 'AgentPay Assistant'}
                </span>
                <span>•</span>
                <span>
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl px-5 py-4 max-w-2xl text-sm leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-br-xs shadow-md shadow-blue-600/15'
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs shadow-xs'
                }`}
              >
                {/* Formatted Markdown Content */}
                <div className="space-y-2 whitespace-pre-wrap font-normal">
                  {message.content}
                </div>
              </div>

              {/* Product Recommendations Grid (if message contains products) */}
              {message.products && message.products.length > 0 && (
                <div className="w-full mt-4 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 px-1">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                      <SparklesIcon className="w-4 h-4 text-blue-600" /> Top {message.products.length} Matching
                      Recommendations
                    </span>
                    
                    <button
                      onClick={() => dispatch({ type: 'SET_PAGE', payload: 'comparison' })}
                      className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full border border-blue-200 transition-all cursor-pointer shadow-2xs self-start sm:self-auto"
                      title="Open side-by-side comparison matrix"
                    >
                      <LayersIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Compare Products</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {message.products.map((rec, idx) => (
                      <ProductCard key={rec.product.id} recommendation={rec} rank={idx + 1} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-start max-w-4xl mx-auto space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <SparklesIcon className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs px-5 py-3 shadow-xs">
              <div className="flex items-center space-x-2 text-xs text-slate-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                <span>AI Agent querying Channel3 live retailer offers, comparing specs with Gemini, and checking budget...</span>
              </div>
            </div>
          </div>
        )}

        {/* Selected Product Summary Screen */}
        <SelectedProductSummary />

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Shopping Prompts Bar */}
      <div className="bg-white/80 backdrop-blur-md border-t border-slate-200/80 px-4 sm:px-6 py-2.5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <SparklesIcon className="w-3 h-3 text-amber-500" /> {hasProducts ? 'Refine:' : 'Prompts:'}
            </span>
            {activePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={isProcessing}
                className="shrink-0 text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200/80 transition-all text-left truncate max-w-[280px]"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Input Bar */}
      <div className="bg-white border-t border-slate-200 p-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center space-x-3">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me what you're shopping for (e.g., 'Find running shoes under $70')..."
            disabled={isProcessing}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-inner"
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isProcessing}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 text-white font-semibold p-3.5 rounded-2xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
          >
            <SendIcon className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-[11px] text-center text-slate-400 mt-2 max-w-4xl mx-auto">
          AgentPay AI searches demo products and protects your budget. Payments are explicitly user-approved via PayPal Sandbox.
        </p>
      </div>
    </div>
  );
}

