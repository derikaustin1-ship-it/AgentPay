// src/lib/channel3.ts
// Official Channel3 Product Search API integration
// Server-side only: CHANNEL3_API_KEY is read securely from environment variables

import { Product } from '@/types';

const CHANNEL3_API_URL = 'https://api.trychannel3.com/v1/search';
const CHANNEL3_API_KEY = process.env.CHANNEL3_API_KEY || '';

/**
 * Check if a valid Channel3 API key is configured.
 */
export function isChannel3Configured(): boolean {
  return Boolean(
    CHANNEL3_API_KEY &&
    !CHANNEL3_API_KEY.includes('your_channel3_api_key') &&
    CHANNEL3_API_KEY.trim().length > 5
  );
}

export interface Channel3RawProduct {
  id: string;
  title: string;
  description?: string;
  brands?: { id?: string; name?: string }[];
  category?: string | { id?: string; name?: string };
  images?: {
    url?: string;
    cleaned_url?: string;
    is_main_image?: boolean;
    shot_type?: string;
    alt_text?: string;
  }[];
  key_features?: string[];
  offers?: {
    url?: string;
    domain?: string;
    price?: {
      price?: number;
      compare_at_price?: number | null;
      currency?: string;
    };
    availability?: string;
    condition?: string;
  }[];
  ratings?: {
    value?: number;
    count?: number;
    source_count?: number;
  };
}

export interface Channel3SearchResponse {
  products: Channel3RawProduct[];
}

/**
 * Search products using the official Channel3 API.
 * Uses POST https://api.trychannel3.com/v1/search with x-api-key header.
 */
export async function searchChannel3Products(
  query: string,
  options?: {
    maxPrice?: number;
    limit?: number;
  }
): Promise<Product[]> {
  if (!isChannel3Configured()) {
    throw new Error(
      'CHANNEL3_API_KEY is not configured in .env.local. Please provide a valid Channel3 API key.'
    );
  }

  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return [];
  }

  try {
    const response = await fetch(CHANNEL3_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CHANNEL3_API_KEY.trim(),
      },
      body: JSON.stringify({
        query: cleanQuery,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Channel3 Authentication Failed (${response.status}): Invalid API key.`);
      }
      if (response.status === 429) {
        throw new Error('Channel3 API Rate Limit Exceeded. Please try again later.');
      }
      throw new Error(`Channel3 API Error (${response.status}): ${errorText}`);
    }

    const data: Channel3SearchResponse = await response.json();
    const rawProducts = data.products || [];

    // Map raw Channel3 product schema to AgentPay Product model
    const mapped: Product[] = rawProducts
      .map((p) => {
        const primaryOffer = p.offers?.[0];
        const price = primaryOffer?.price?.price ?? 0;
        const currency = primaryOffer?.price?.currency || 'USD';
        const brand = p.brands?.[0]?.name || 'Brand';
        const seller = primaryOffer?.domain || 'Verified Merchant';
        const productUrl = primaryOffer?.url || '#';

        // Select main or cleaned hero image
        const mainImg = p.images?.find((img) => img.is_main_image) || p.images?.[0];
        const imageUrl = mainImg?.cleaned_url || mainImg?.url || '';

        // Category formatting
        const categoryStr =
          typeof p.category === 'string'
            ? p.category
            : p.category?.name || 'general';

        return {
          id: `c3-${p.id}`,
          name: p.title || 'Untitled Product',
          brand,
          price: Number(price),
          currency,
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
          description: p.description || '',
          seller,
          productUrl,
          category: categoryStr,
          rating: p.ratings?.value,
          reviewCount: p.ratings?.count,
          availability: primaryOffer?.availability || 'InStock',
          features: Array.isArray(p.key_features) ? p.key_features : [],
          isDemo: false, // Verified live product from Channel3 API
        };
      })
      // Ensure products have valid price
      .filter((p) => p.price > 0);

    // Apply budget awareness
    if (typeof options?.maxPrice === 'number' && !isNaN(options.maxPrice) && options.maxPrice > 0) {
      const withinBudget = mapped.filter((p) => p.price <= options.maxPrice!);
      if (withinBudget.length >= 3) {
        return options?.limit ? withinBudget.slice(0, options.limit) : withinBudget;
      } else if (withinBudget.length > 0) {
        // Include within-budget products first, plus closest alternatives
        const aboveBudget = mapped
          .filter((p) => p.price > options.maxPrice!)
          .sort((a, b) => a.price - b.price);
        const combined = [...withinBudget, ...aboveBudget];
        return options?.limit ? combined.slice(0, options.limit) : combined;
      }
    }

    return options?.limit ? mapped.slice(0, options.limit) : mapped;
  } catch (error: any) {
    console.error('Channel3 API Search Error:', error);
    throw error;
  }
}

