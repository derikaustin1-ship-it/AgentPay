// src/app/api/test/channel3/route.ts
// Test endpoint for official Channel3 Product Search API integration
// Uses POST https://api.trychannel3.com/v1/search with x-api-key header

import { NextRequest, NextResponse } from 'next/server';
import { searchChannel3Products, isChannel3Configured } from '@/lib/channel3';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'wireless headphones';
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;

  return handleChannel3Search(query, maxPrice);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const query = body.query || 'wireless headphones';
    const maxPrice = typeof body.maxPrice === 'number' ? body.maxPrice : undefined;

    return handleChannel3Search(query, maxPrice);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Invalid request body' },
      { status: 400 }
    );
  }
}

async function handleChannel3Search(query: string, maxPrice?: number) {
  if (!isChannel3Configured()) {
    return NextResponse.json(
      {
        success: false,
        error:
          'CHANNEL3_API_KEY is not configured in .env.local. Please set CHANNEL3_API_KEY to test the integration.',
        apiEndpoint: 'https://api.trychannel3.com/v1/search',
      },
      { status: 503 }
    );
  }

  try {
    const startTime = Date.now();
    const products = await searchChannel3Products(query, { maxPrice });
    const elapsedMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      provider: 'Channel3 Product Search API',
      apiEndpoint: 'https://api.trychannel3.com/v1/search',
      query,
      maxPriceFilter: maxPrice ?? null,
      totalReturned: products.length,
      elapsedMs,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        price: p.price,
        currency: p.currency,
        seller: p.seller,
        rating: p.rating ?? null,
        reviewCount: p.reviewCount ?? null,
        availability: p.availability,
        features: p.features,
        imageUrl: p.imageUrl,
        productUrl: p.productUrl,
        isDemo: p.isDemo,
      })),
      diagnostics: {
        priceRange: products.length > 0
          ? {
              min: Math.min(...products.map((p) => p.price)),
              max: Math.max(...products.map((p) => p.price)),
            }
          : null,
        merchants: Array.from(new Set(products.map((p) => p.seller))),
        brands: Array.from(new Set(products.map((p) => p.brand))),
      },
    });
  } catch (error: any) {
    console.error('Channel3 test endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Channel3 API call failed',
        apiEndpoint: 'https://api.trychannel3.com/v1/search',
      },
      { status: 500 }
    );
  }
}

