// src/app/api/exchange-rates/route.ts
// API route to provide live exchange rates and metadata to the client

import { NextResponse } from 'next/server';
import { getExchangeRates } from '@/lib/exchange-rates';

export async function GET() {
  try {
    const data = await getExchangeRates();
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve exchange rates',
      },
      { status: 500 }
    );
  }
}
