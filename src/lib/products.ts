// src/lib/products.ts
// Product search and trust analysis service
// Integrates with official Channel3 Product Search API when configured,
// with transparent fallback to local catalogue when offline or unconfigured.

import {
  searchProducts as dbSearchProducts,
  getProductById as dbGetProductById,
  upsertProducts as dbUpsertProducts,
  DbProduct,
} from './database';
import { isChannel3Configured, searchChannel3Products } from './channel3';
import { Product, ProductSearchParams, TrustWarning } from '@/types';

/**
 * Search the product catalogue.
 * Prioritizes live Channel3 API products when CHANNEL3_API_KEY is configured.
 */
export async function searchProductCatalogue(params: ProductSearchParams): Promise<Product[]> {
  const queryStr = params.query?.trim() || '';
  const searchTerms = queryStr || [params.category, ...(params.preferences || [])].filter(Boolean).join(' ');

  // 1. If Channel3 is configured, search live retailer products
  if (isChannel3Configured() && searchTerms.trim()) {
    try {
      const channel3Results = await searchChannel3Products(searchTerms, {
        maxPrice: params.maxPrice,
      });

      if (channel3Results.length > 0) {
        // Cache discovered live products in database for order lookup and checkout
        const dbItems: DbProduct[] = channel3Results.map((p) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          price: p.price,
          currency: p.currency,
          image_url: p.imageUrl,
          description: p.description,
          seller: p.seller,
          product_url: p.productUrl,
          category: p.category,
          rating: p.rating ?? null,
          review_count: p.reviewCount ?? null,
          availability: p.availability || 'InStock',
          features: JSON.stringify(p.features || []),
          is_demo: 0,
        }));
        dbUpsertProducts(dbItems);

        return channel3Results;
      }
    } catch (c3Error) {
      console.warn('Channel3 search failed, falling back to local catalogue:', c3Error);
    }
  }

  // 2. Local fallback catalogue
  const results = dbSearchProducts(
    searchTerms,
    params.category,
    params.maxPrice
  );

  return results.map((row) => ({
    id: row.id,
    name: row.name,
    brand: row.brand,
    price: row.price,
    currency: row.currency || 'USD',
    imageUrl: row.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
    description: row.description || '',
    seller: row.seller || 'Demo Merchant',
    productUrl: row.product_url || '#',
    category: row.category || '',
    rating: row.rating ?? undefined,
    reviewCount: row.review_count ?? undefined,
    availability: row.availability || 'In Stock',
    features: row.features ? JSON.parse(row.features) : [],
    isDemo: row.is_demo === 1,
  }));
}

/**
 * Get a single product by ID.
 */
export async function getProduct(productId: string): Promise<Product | null> {
  const row = dbGetProductById(productId);
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    price: row.price,
    currency: row.currency || 'USD',
    imageUrl: row.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
    description: row.description || '',
    seller: row.seller || 'Demo Merchant',
    productUrl: row.product_url || '#',
    category: row.category || '',
    rating: row.rating ?? undefined,
    reviewCount: row.review_count ?? undefined,
    availability: row.availability || 'In Stock',
    features: row.features ? JSON.parse(row.features) : [],
    isDemo: row.is_demo === 1,
  };
}

/**
 * Analyze a product for trust signals and price warnings.
 * Uses objective, cautious language as required by specification.
 */
export function analyzeProductTrust(product: Product, similarProducts?: Product[]): TrustWarning[] {
  const warnings: TrustWarning[] = [];

  // Check for missing seller information
  if (!product.seller || product.seller.trim() === '' || product.seller.toLowerCase() === 'unknown') {
    warnings.push({
      type: 'missing_seller',
      severity: 'medium',
      message: 'Seller information is not specified.',
      details: 'Consider checking seller credibility before purchasing items from unverified sources.',
    });
  }

  // Check for short or missing description
  if (!product.description || product.description.trim().length < 25) {
    warnings.push({
      type: 'missing_description',
      severity: 'low',
      message: 'Brief product description.',
      details: 'Product details are limited. Confirm specifications match your requirements.',
    });
  }

  // Check for lack of ratings
  if (!product.rating && !product.reviewCount) {
    warnings.push({
      type: 'incomplete_details',
      severity: 'low',
      message: 'No user reviews recorded yet.',
      details: 'This item has no recorded ratings. Consider checking return policies.',
    });
  }

  // Check for large price differences compared to similar products
  if (similarProducts && similarProducts.length > 1) {
    const prices = similarProducts.map((p) => p.price);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const priceDiff = Math.abs(product.price - avgPrice) / avgPrice;

    if (priceDiff > 0.45) {
      warnings.push({
        type: 'price_anomaly',
        severity: 'medium',
        message: 'Price difference detected.',
        details: `This item's price ($${product.price.toFixed(2)}) differs significantly from comparable items (avg: $${avgPrice.toFixed(2)}). Consider checking seller and product details.`,
      });
    }
  }

  return warnings;
}
