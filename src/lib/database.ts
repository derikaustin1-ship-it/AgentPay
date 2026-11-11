// src/lib/database.ts
// Persistent storage engine for AgentPay
// Uses a robust JSON file store that mirrors the exact relational schema
// required by the project (users, user_budgets, products, orders, shopping_preferences).
// Requires no native compilation so it works reliably on every environment.

import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Determine the writable database path.
 * In serverless environments (like Vercel or AWS Lambda), process.cwd() is read-only.
 * We automatically copy the initial seed file to os.tmpdir() and use that writable path.
 */
function getDbPath(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpPath = path.join(os.tmpdir(), 'agentpay.db.json');
    if (!fs.existsSync(tmpPath)) {
      const seedPath = path.join(process.cwd(), 'agentpay.db.json');
      if (fs.existsSync(seedPath)) {
        try {
          fs.copyFileSync(seedPath, tmpPath);
        } catch {
          // ignore copy error
        }
      }
    }
    return tmpPath;
  }
  return path.join(process.cwd(), 'agentpay.db.json');
}

export interface DbUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface DbUserBudget {
  id: string;
  user_id: string;
  max_purchase_amount: number;
  daily_spending_limit: number;
  created_at: string;
  updated_at: string;
}

export interface DbProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  image_url: string;
  description: string;
  seller: string;
  product_url: string;
  category: string;
  rating: number | null;
  review_count: number | null;
  availability: string;
  features: string; // JSON array stored as string
  is_demo: number;
}

export interface DbOrder {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  paypal_order_id: string;
  paypal_capture_id?: string;
  amount: number;
  currency: string;
  payment_status: 'pending' | 'approved' | 'captured' | 'cancelled' | 'failed';
  created_at: string;
  is_sandbox: number;
  // Converted / display currency metadata
  display_amount?: number;
  display_currency?: string;
  exchange_rate?: number;
  exchange_rate_timestamp?: string;
}

export interface DbShoppingPreference {
  id: string;
  user_id: string;
  preferred_brands: string; // JSON array
  preferred_categories: string; // JSON array
  max_budget: number | null;
}

export interface DbUserPreference {
  id: string;
  user_id: string;
  country_code: string;
  currency_code: string;
  updated_at: string;
}

interface DatabaseSchema {
  users: DbUser[];
  user_budgets: DbUserBudget[];
  products: DbProduct[];
  orders: DbOrder[];
  shopping_preferences: DbShoppingPreference[];
  user_preferences: DbUserPreference[];
}

const DEFAULT_DEMO_PRODUCTS: DbProduct[] = [
  // Hiking & Outdoor
  {
    id: 'prod-001',
    name: 'TrailBlazer Compact Hiking Backpack (25L)',
    brand: 'OutdoorPro',
    price: 45.99,
    currency: 'USD',
    image_url: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=600&q=80',
    description: 'A lightweight 25L hiking backpack with hydration bladder compartment, multiple pockets, and rain cover. Perfect for day hikes.',
    seller: 'OutdoorPro Official',
    product_url: '#',
    category: 'outdoor',
    rating: 4.5,
    review_count: 342,
    availability: 'In Stock',
    features: JSON.stringify(['25L capacity', 'Hydration bladder compartment', 'Built-in rain cover', 'Padded shoulder straps', 'Chest and waist straps']),
    is_demo: 1,
  },
  {
    id: 'prod-002',
    name: 'SummitGrip Trekking Poles (Pair)',
    brand: 'MountainGear',
    price: 38.50,
    currency: 'USD',
    image_url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=600&q=80',
    description: 'Adjustable aluminum trekking poles with cork handles and tungsten carbide tips. Collapses for easy storage.',
    seller: 'MountainGear Store',
    product_url: '#',
    category: 'outdoor',
    rating: 4.3,
    review_count: 189,
    availability: 'In Stock',
    features: JSON.stringify(['Adjustable length 24-54 inches', 'Cork grip handles', 'Tungsten carbide tips', 'Anti-shock mechanism', 'Includes carrying bag']),
    is_demo: 1,
  },
  {
    id: 'prod-003',
    name: 'NatureView Compact Binoculars 10x42',
    brand: 'OptiVision',
    price: 49.99,
    currency: 'USD',
    image_url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=600&q=80',
    description: 'Waterproof compact binoculars ideal for hiking and birdwatching. Clear optics with 10x magnification.',
    seller: 'OptiVision Direct',
    product_url: '#',
    category: 'outdoor',
    rating: 4.4,
    review_count: 267,
    availability: 'In Stock',
    features: JSON.stringify(['10x42 magnification', 'Waterproof and fog-proof', 'BAK4 prism', 'Includes neck strap and case', 'Weighs only 1.2 lbs']),
    is_demo: 1,
  },
  {
    id: 'prod-004',
    name: 'TrailLite LED Headlamp (800 Lumens)',
    brand: 'BrightPath',
    price: 24.99,
    currency: 'USD',
    image_url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb325?auto=format&fit=crop&w=600&q=80',
    description: 'Rechargeable LED headlamp with 800 lumens, red light mode, and adjustable strap. IPX6 waterproof.',
    seller: 'BrightPath Gear',
    product_url: '#',
    category: 'outdoor',
    rating: 4.6,
    review_count: 521,
    availability: 'In Stock',
    features: JSON.stringify(['800 lumens max', 'USB-C rechargeable', 'Red light mode', 'IPX6 waterproof', '12-hour battery life']),
    is_demo: 1,
  },
  {
    id: 'prod-005',
    name: 'HydroStream Water Filter Bottle (24oz)',
    brand: 'PureTrail',
    price: 32.00,
    currency: 'USD',
    image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
    description: 'Portable water filter bottle that removes 99.9% of bacteria and parasites. BPA-free, 24oz capacity.',
    seller: 'PureTrail Outdoor',
    product_url: '#',
    category: 'outdoor',
    rating: 4.7,
    review_count: 415,
    availability: 'In Stock',
    features: JSON.stringify(['Removes 99.9% bacteria', '24oz capacity', 'BPA-free', 'Filter lasts 1500 liters', 'Squeeze or sip design']),
    is_demo: 1,
  },

  // Electronics - Headphones
  {
    id: 'prod-006',
    name: 'SoundWave Pro Wireless Headphones',
    brand: 'AudioTech',
    price: 79.99,
    currency: 'USD',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    description: 'Over-ear wireless headphones with active noise cancelling, 40-hour battery, and premium sound quality.',
    seller: 'AudioTech Official',
    product_url: '#',
    category: 'electronics',
    rating: 4.5,
    review_count: 892,
    availability: 'In Stock',
    features: JSON.stringify(['Active noise cancelling', '40-hour battery', 'Bluetooth 5.3', 'Hi-Res Audio certified', 'Foldable design']),
    is_demo: 1,
  },
  {
    id: 'prod-007',
    name: 'BassBoost Wireless Earbuds',
    brand: 'SoundCore',
    price: 49.99,
    currency: 'USD',
    image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
    description: 'True wireless earbuds with deep bass, 8-hour playtime, and IPX5 water resistance.',
    seller: 'SoundCore Store',
    product_url: '#',
    category: 'electronics',
    rating: 4.2,
    review_count: 1203,
    availability: 'In Stock',
    features: JSON.stringify(['Deep bass driver', '8hr playtime + 24hr case', 'IPX5 water resistant', 'Touch controls', 'Built-in microphone']),
    is_demo: 1,
  },
  {
    id: 'prod-008',
    name: 'ClearSound Studio Monitor Headphones',
    brand: 'ProAudio',
    price: 94.99,
    currency: 'USD',
    image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80',
    description: 'Professional studio monitor headphones with flat frequency response for accurate sound reproduction.',
    seller: 'ProAudio Direct',
    product_url: '#',
    category: 'electronics',
    rating: 4.7,
    review_count: 345,
    availability: 'In Stock',
    features: JSON.stringify(['Flat frequency response', '50mm drivers', 'Detachable cable', 'Comfortable for long sessions', 'Includes 3.5mm and 6.35mm adapters']),
    is_demo: 1,
  },

  // Electronics - Smartwatches
  {
    id: 'prod-009',
    name: 'FitTrack Active Smartwatch',
    brand: 'TechWear',
    price: 69.99,
    currency: 'USD',
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
    description: 'Affordable smartwatch with heart rate monitoring, GPS, sleep tracking, and 7-day battery life.',
    seller: 'TechWear Official',
    product_url: '#',
    category: 'electronics',
    rating: 4.1,
    review_count: 678,
    availability: 'In Stock',
    features: JSON.stringify(['Heart rate monitor', 'Built-in GPS', 'Sleep tracking', '7-day battery', '5ATM water resistant']),
    is_demo: 1,
  },
  {
    id: 'prod-010',
    name: 'PulsePro Sports Watch',
    brand: 'FitGear',
    price: 89.99,
    currency: 'USD',
    image_url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=600&q=80',
    description: 'Advanced sports watch with multi-sport tracking, blood oxygen monitoring, and AMOLED display.',
    seller: 'FitGear Store',
    product_url: '#',
    category: 'electronics',
    rating: 4.4,
    review_count: 432,
    availability: 'In Stock',
    features: JSON.stringify(['AMOLED display', 'Blood oxygen monitor', '100+ sport modes', '14-day battery', 'Stainless steel frame']),
    is_demo: 1,
  },
  {
    id: 'prod-011',
    name: 'MiniWatch Lite',
    brand: 'CompactTech',
    price: 39.99,
    currency: 'USD',
    image_url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=600&q=80',
    description: 'Lightweight budget smartwatch with step counting, notifications, and 10-day battery life.',
    seller: 'CompactTech Store',
    product_url: '#',
    category: 'electronics',
    rating: 3.9,
    review_count: 890,
    availability: 'In Stock',
    features: JSON.stringify(['Step and calorie counter', 'Phone notifications', '10-day battery', 'IP68 waterproof', 'Lightweight 28g']),
    is_demo: 1,
  },

  // Electronics - Laptops
  {
    id: 'prod-012',
    name: 'CodeBook Pro 14 Laptop',
    brand: 'DevTech',
    price: 899.99,
    currency: 'USD',
    image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80',
    description: 'Developer-focused laptop with 14" display, 16GB RAM, 512GB SSD, and excellent keyboard for programming.',
    seller: 'DevTech Official',
    product_url: '#',
    category: 'electronics',
    rating: 4.6,
    review_count: 234,
    availability: 'In Stock',
    features: JSON.stringify(['14-inch IPS display', '16GB DDR5 RAM', '512GB NVMe SSD', 'Backlit keyboard', '12-hour battery']),
    is_demo: 1,
  },
  {
    id: 'prod-013',
    name: 'SwiftBook Air 13 Laptop',
    brand: 'UltraPC',
    price: 649.99,
    currency: 'USD',
    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
    description: 'Ultralight 13" laptop weighing just 2.2 lbs with all-day battery life. Great for students and professionals.',
    seller: 'UltraPC Store',
    product_url: '#',
    category: 'electronics',
    rating: 4.3,
    review_count: 567,
    availability: 'In Stock',
    features: JSON.stringify(['13.3-inch display', '8GB RAM', '256GB SSD', '2.2 lbs weight', '15-hour battery']),
    is_demo: 1,
  },

  // Shoes
  {
    id: 'prod-014',
    name: 'SpeedStride Running Shoes',
    brand: 'RunFast',
    price: 64.99,
    currency: 'USD',
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    description: 'Lightweight running shoes with responsive cushioning and breathable mesh upper.',
    seller: 'RunFast Official',
    product_url: '#',
    category: 'shoes',
    rating: 4.4,
    review_count: 1456,
    availability: 'In Stock',
    features: JSON.stringify(['Responsive foam cushioning', 'Breathable mesh upper', 'Rubber outsole', 'Weighs 8.5 oz', 'Available in 6 colors']),
    is_demo: 1,
  },
  {
    id: 'prod-015',
    name: 'TrailRunner Pro All-Terrain Shoes',
    brand: 'PathFinder',
    price: 79.99,
    currency: 'USD',
    image_url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80',
    description: 'Durable trail running shoes with aggressive tread pattern and rock plate protection.',
    seller: 'PathFinder Gear',
    product_url: '#',
    category: 'shoes',
    rating: 4.5,
    review_count: 623,
    availability: 'In Stock',
    features: JSON.stringify(['Vibram outsole', 'Rock plate protection', 'Water-resistant upper', 'Reinforced toe cap', 'Ankle support collar']),
    is_demo: 1,
  },
  {
    id: 'prod-016',
    name: 'CloudWalk Daily Trainers',
    brand: 'ComfortStep',
    price: 44.99,
    currency: 'USD',
    image_url: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80',
    description: 'Comfortable everyday training shoes with cloud-like cushioning. Perfect for gym and casual wear.',
    seller: 'ComfortStep Store',
    product_url: '#',
    category: 'shoes',
    rating: 4.2,
    review_count: 2103,
    availability: 'In Stock',
    features: JSON.stringify(['Cloud foam midsole', 'Slip-on design', 'Machine washable', 'Arch support', 'Memory foam insole']),
    is_demo: 1,
  },

  // Music Gifts
  {
    id: 'prod-017',
    name: 'PortaBeat Mini Bluetooth Speaker',
    brand: 'SoundBox',
    price: 34.99,
    currency: 'USD',
    image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80',
    description: 'Portable waterproof Bluetooth speaker with 360-degree sound and 12-hour battery.',
    seller: 'SoundBox Audio',
    product_url: '#',
    category: 'electronics',
    rating: 4.3,
    review_count: 876,
    availability: 'In Stock',
    features: JSON.stringify(['360-degree sound', 'IPX7 waterproof', '12-hour battery', 'USB-C charging', 'Built-in microphone']),
    is_demo: 1,
  },
  {
    id: 'prod-018',
    name: 'VinylSpin Portable Record Player',
    brand: 'RetroSound',
    price: 89.99,
    currency: 'USD',
    image_url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=600&q=80',
    description: 'Compact portable record player with built-in speakers and Bluetooth output.',
    seller: 'RetroSound Store',
    product_url: '#',
    category: 'electronics',
    rating: 4.1,
    review_count: 234,
    availability: 'In Stock',
    features: JSON.stringify(['3-speed turntable', 'Built-in stereo speakers', 'Bluetooth output', 'RCA line out', 'Vintage suitcase design']),
    is_demo: 1,
  },

  // High-price items (for budget protection demonstration)
  {
    id: 'prod-019',
    name: 'UltraHike Professional Tent (4-Person)',
    brand: 'CampMaster',
    price: 189.99,
    currency: 'USD',
    image_url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80',
    description: 'Professional 4-person tent with aluminum poles, full-coverage rainfly, and vestibule.',
    seller: 'CampMaster Pro',
    product_url: '#',
    category: 'outdoor',
    rating: 4.8,
    review_count: 156,
    availability: 'In Stock',
    features: JSON.stringify(['4-person capacity', 'Aluminum poles', 'Full rainfly', '2 vestibules', 'Sets up in 5 minutes']),
    is_demo: 1,
  },
  {
    id: 'prod-020',
    name: 'ProTrail GPS Navigation Watch',
    brand: 'ExploreMax',
    price: 249.99,
    currency: 'USD',
    image_url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=600&q=80',
    description: 'Advanced GPS navigation watch with topographic maps, compass, and barometric altimeter.',
    seller: 'ExploreMax Gear',
    product_url: '#',
    category: 'outdoor',
    rating: 4.6,
    review_count: 189,
    availability: 'In Stock',
    features: JSON.stringify(['Topographic maps', 'ABC sensors', 'Multi-band GPS', 'Solar charging', 'Sapphire crystal display']),
    is_demo: 1,
  },
];

function readDb(): DatabaseSchema {
  const dbPath = getDbPath();
  try {
    if (!fs.existsSync(dbPath)) {
      const initialData: DatabaseSchema = {
        users: [
          {
            id: 'demo-user-1',
            name: 'Demo User',
            email: 'demo@agentpay.app',
            created_at: new Date().toISOString(),
          },
        ],
        user_budgets: [
          {
            id: 'budget-1',
            user_id: 'demo-user-1',
            max_purchase_amount: 100.00,
            daily_spending_limit: 200.00,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        products: DEFAULT_DEMO_PRODUCTS,
        orders: [],
        shopping_preferences: [],
        user_preferences: [],
      };
      fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2), 'utf8');
      return initialData;
    }
    const raw = fs.readFileSync(dbPath, 'utf8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    if (!parsed.products || parsed.products.length === 0) {
      parsed.products = DEFAULT_DEMO_PRODUCTS;
      fs.writeFileSync(dbPath, JSON.stringify(parsed, null, 2), 'utf8');
    }
    if (!parsed.user_preferences) {
      parsed.user_preferences = [];
      fs.writeFileSync(dbPath, JSON.stringify(parsed, null, 2), 'utf8');
    }
    return parsed;
  } catch (err) {
    console.error('Error reading agentpay database file:', err);
    return {
      users: [{ id: 'demo-user-1', name: 'Demo User', email: 'demo@agentpay.app', created_at: new Date().toISOString() }],
      user_budgets: [{ id: 'budget-1', user_id: 'demo-user-1', max_purchase_amount: 100, daily_spending_limit: 200, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }],
      products: DEFAULT_DEMO_PRODUCTS,
      orders: [],
      shopping_preferences: [],
      user_preferences: [],
    };
  }
}

function writeDb(data: DatabaseSchema): void {
  const dbPath = getDbPath();
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing agentpay database file:', err);
    // If writing failed due to read-only filesystem, try os.tmpdir() fallback
    try {
      const fallbackPath = path.join(os.tmpdir(), 'agentpay.db.json');
      fs.writeFileSync(fallbackPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (fallbackErr) {
      console.error('Fatal: Could not write database to fallback path either:', fallbackErr);
    }
  }
}

// ============================================================
// Database Query Helpers
// ============================================================

/** Get user budget settings */
export function getUserBudget(userId: string): DbUserBudget | undefined {
  const db = readDb();
  return db.user_budgets.find(b => b.user_id === userId);
}

/** Update user budget settings */
export function updateUserBudget(userId: string, maxPurchase: number, dailyLimit: number): void {
  const db = readDb();
  const existingIndex = db.user_budgets.findIndex(b => b.user_id === userId);
  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    db.user_budgets[existingIndex].max_purchase_amount = maxPurchase;
    db.user_budgets[existingIndex].daily_spending_limit = dailyLimit;
    db.user_budgets[existingIndex].updated_at = now;
  } else {
    db.user_budgets.push({
      id: `budget-${Date.now()}`,
      user_id: userId,
      max_purchase_amount: maxPurchase,
      daily_spending_limit: dailyLimit,
      created_at: now,
      updated_at: now,
    });
  }
  writeDb(db);
}

/** Get today's total spending for a user */
export function getTodaySpending(userId: string): number {
  const db = readDb();
  const todayStr = new Date().toISOString().slice(0, 10);

  return db.orders
    .filter(
      o => o.user_id === userId &&
           o.payment_status === 'captured' &&
           o.created_at.slice(0, 10) === todayStr
    )
    .reduce((sum, o) => sum + o.amount, 0);
}

/** Search products in demo catalogue */
export function searchProducts(
  query: string,
  category?: string,
  maxPrice?: number
): DbProduct[] {
  const db = readDb();
  const q = query.toLowerCase().trim();

  return db.products.filter(p => {
    let matchesQuery = true;
    if (q) {
      const words = q.split(/\s+/).filter(w => w.length > 2);
      const target = `${p.name} ${p.description} ${p.brand} ${p.category}`.toLowerCase();
      // Match if any meaningful word matches or whole query matches
      matchesQuery = target.includes(q) || words.some(w => target.includes(w));
    }

    let matchesCategory = true;
    if (category) {
      matchesCategory = p.category.toLowerCase().includes(category.toLowerCase());
    }

    let matchesPrice = true;
    if (typeof maxPrice === 'number' && !isNaN(maxPrice)) {
      matchesPrice = p.price <= maxPrice;
    }

    return matchesQuery && matchesCategory && matchesPrice;
  }).slice(0, 20);
}

/** Get a product by ID */
export function getProductById(productId: string): DbProduct | undefined {
  const db = readDb();
  return db.products.find(p => p.id === productId);
}

/** Upsert products into database (caches discovered Channel3 products for order lookup) */
export function upsertProducts(products: DbProduct[]): void {
  const db = readDb();
  for (const p of products) {
    const idx = db.products.findIndex(existing => existing.id === p.id);
    if (idx >= 0) {
      db.products[idx] = p;
    } else {
      db.products.push(p);
    }
  }
  writeDb(db);
}

/** Create a new order (with duplicate protection) */
export function createOrder(order: {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productImage: string;
  paypalOrderId: string;
  paypalCaptureId?: string;
  amount: number;
  currency: string;
  paymentStatus: 'pending' | 'approved' | 'captured' | 'cancelled' | 'failed' | string;
  displayAmount?: number;
  displayCurrency?: string;
  exchangeRate?: number;
  exchangeRateTimestamp?: string;
}): void {
  const db = readDb();
  // Prevent duplicate order creation if an order with this PayPal Order ID already exists
  const existingOrder = db.orders.find(o => o.paypal_order_id === order.paypalOrderId);
  if (existingOrder) {
    existingOrder.payment_status = order.paymentStatus as DbOrder['payment_status'];
    if (order.paypalCaptureId) {
      existingOrder.paypal_capture_id = order.paypalCaptureId;
    }
    if (order.displayAmount !== undefined) existingOrder.display_amount = order.displayAmount;
    if (order.displayCurrency !== undefined) existingOrder.display_currency = order.displayCurrency;
    if (order.exchangeRate !== undefined) existingOrder.exchange_rate = order.exchangeRate;
    if (order.exchangeRateTimestamp !== undefined) existingOrder.exchange_rate_timestamp = order.exchangeRateTimestamp;
    writeDb(db);
    return;
  }

  db.orders.unshift({
    id: order.id,
    user_id: order.userId,
    product_id: order.productId,
    product_name: order.productName,
    product_image: order.productImage,
    paypal_order_id: order.paypalOrderId,
    paypal_capture_id: order.paypalCaptureId,
    amount: order.amount,
    currency: order.currency,
    payment_status: order.paymentStatus as DbOrder['payment_status'],
    created_at: new Date().toISOString(),
    is_sandbox: 1,
    display_amount: order.displayAmount,
    display_currency: order.displayCurrency,
    exchange_rate: order.exchangeRate,
    exchange_rate_timestamp: order.exchangeRateTimestamp,
  });
  writeDb(db);
}

/** Update order payment status by order ID */
export function updateOrderStatus(orderId: string, status: string): void {
  const db = readDb();
  const order = db.orders.find(o => o.id === orderId);
  if (order) {
    order.payment_status = status as DbOrder['payment_status'];
    writeDb(db);
  }
}

/** Update order status and capture ID by PayPal order ID */
export function updateOrderStatusByPayPalId(paypalOrderId: string, status: string, captureId?: string): void {
  const db = readDb();
  const order = db.orders.find(o => o.paypal_order_id === paypalOrderId);
  if (order) {
    order.payment_status = status as DbOrder['payment_status'];
    if (captureId) {
      order.paypal_capture_id = captureId;
    }
    writeDb(db);
  }
}

/** Get an order by PayPal order ID */
export function getOrderByPayPalId(paypalOrderId: string): DbOrder | undefined {
  const db = readDb();
  return db.orders.find(o => o.paypal_order_id === paypalOrderId);
}

/** Get all orders for a user */
export function getUserOrders(userId: string): DbOrder[] {
  const db = readDb();
  return db.orders
    .filter(o => o.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/** Get spending summary for a user strictly calculated from successful captures */
export function getSpendingSummary(userId: string) {
  const db = readDb();
  const userOrders = db.orders.filter(o => o.user_id === userId);
  // Calculate spending strictly from successful captures only. Cancelled and failed are excluded.
  const capturedOrders = userOrders.filter(o => o.payment_status === 'captured');

  const totalSpending = capturedOrders.reduce((sum, o) => sum + o.amount, 0);
  const orderCount = capturedOrders.length;
  const todaySpending = getTodaySpending(userId);
  const budget = getUserBudget(userId);
  const dailyLimit = budget?.daily_spending_limit || 200;
  const maxPurchase = budget?.max_purchase_amount || 100;

  const recentOrders = userOrders.slice(0, 10);

  return {
    totalSpending,
    orderCount,
    todaySpending,
    dailySpendingLimit: dailyLimit,
    remainingDailyBudget: Math.max(0, dailyLimit - todaySpending),
    maxPurchaseAmount: maxPurchase,
    recentOrders,
    budgetUtilization: dailyLimit > 0 ? (todaySpending / dailyLimit) * 100 : 0,
  };
}

/** Check if an order with this PayPal ID was already captured (duplicate protection) */
export function isOrderAlreadyCaptured(paypalOrderId: string): boolean {
  const db = readDb();
  return db.orders.some(o => o.paypal_order_id === paypalOrderId && o.payment_status === 'captured');
}

/** Get user country and currency preferences */
export function getUserPreference(userId: string): DbUserPreference | undefined {
  const db = readDb();
  return db.user_preferences?.find(p => p.user_id === userId);
}

/** Update or set user country and currency preferences */
export function updateUserPreference(
  userId: string,
  countryCode: string,
  currencyCode: string
): DbUserPreference {
  const db = readDb();
  if (!db.user_preferences) {
    db.user_preferences = [];
  }

  const existingIndex = db.user_preferences.findIndex(p => p.user_id === userId);
  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    db.user_preferences[existingIndex].country_code = countryCode.toUpperCase();
    db.user_preferences[existingIndex].currency_code = currencyCode.toUpperCase();
    db.user_preferences[existingIndex].updated_at = now;
    writeDb(db);
    return db.user_preferences[existingIndex];
  } else {
    const newPref: DbUserPreference = {
      id: `pref-${Date.now()}`,
      user_id: userId,
      country_code: countryCode.toUpperCase(),
      currency_code: currencyCode.toUpperCase(),
      updated_at: now,
    };
    db.user_preferences.push(newPref);
    writeDb(db);
    return newPref;
  }
}


