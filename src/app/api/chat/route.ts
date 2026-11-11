// src/app/api/chat/route.ts
// AI Shopping Assistant chat endpoint
// Processes user messages through the AI agent

import { NextRequest, NextResponse } from 'next/server';
import { processShoppingRequest } from '@/lib/ai-agent';
import { ChatMessage } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history, countryCode, currencyCode } = body as {
      message: string;
      history?: ChatMessage[];
      countryCode?: string;
      currencyCode?: string;
    };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Process through the AI shopping agent with country and currency context
    const agentResponse = await processShoppingRequest(
      message.trim(),
      history || [],
      countryCode || 'US',
      currencyCode || 'USD'
    );

    return NextResponse.json({
      success: true,
      data: agentResponse,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
