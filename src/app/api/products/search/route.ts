// src/app/api/products/search/route.ts
// Product search API endpoint supporting both Channel3 live API and local catalogue

import { NextRequest, NextResponse } from 'next/server';
import { searchProductCatalogue } from '@/lib/products';
import { isChannel3Configured } from '@/lib/channel3';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;

    const products = await searchProductCatalogue({
      query,
      category,
      maxPrice,
    });

    const isLive = products.some((p) => !p.isDemo);

    return NextResponse.json({
      success: true,
      data: products,
      meta: {
        source: isLive ? 'channel3_live_api' : 'demo_catalogue',
        channel3Active: isChannel3Configured(),
        note: isLive
          ? 'Live real-time product data sourced from Channel3 search API.'
          : 'Demonstration catalogue data.',
        count: products.length,
      },
    });
  } catch (error: any) {
    console.error('Product search error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Product search failed' },
      { status: 500 }
    );
  }
}
