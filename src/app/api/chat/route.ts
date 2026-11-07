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
    const { message, history } = body as { message: string; history?: ChatMessage[] };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Process through the AI shopping agent
    const agentResponse = await processShoppingRequest(message.trim(), history || []);

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
