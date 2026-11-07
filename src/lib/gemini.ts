// src/lib/gemini.ts
// Official Google GenAI SDK integration for AgentPay
// Server-side only: GEMINI_API_KEY is read securely from environment variables

import { GoogleGenAI, Type, Schema } from '@google/genai';
import { Product, ShoppingRequirements, ChatMessage } from '@/types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

/**
 * Check if the Gemini API key is configured.
 */
export function isGeminiConfigured(): boolean {
  return Boolean(
    GEMINI_API_KEY &&
    !GEMINI_API_KEY.includes('your_gemini_api_key') &&
    GEMINI_API_KEY.trim().length > 10
  );
}

/**
 * Structured schema definition for shopping request extraction.
 */
export interface StructuredShoppingAnalysis {
  productCategory: string;
  maxBudget: number | null;
  currency: string;
  preferences: string[];
  importantFeatures: string[];
  occasion?: string;
  rawUnderstoodQuery: string;
  summary: string;
}

const shoppingAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    productCategory: {
      type: Type.STRING,
      description: 'The primary category of the product, e.g. electronics, outdoor, audio, shoes, home, etc.',
    },
    maxBudget: {
      type: Type.NUMBER,
      description: 'The maximum budget extracted from the request as a positive numeric value in USD, or null if unstated.',
    },
    currency: {
      type: Type.STRING,
      description: 'The currency code (e.g. USD).',
    },
    preferences: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'List of preferences such as portability, brand preference, gift recipient, wireless, etc.',
    },
    importantFeatures: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Specific technical or physical features requested (e.g. noise cancellation, battery life, waterproof).',
    },
    occasion: {
      type: Type.STRING,
      description: 'The occasion if mentioned (e.g. birthday, holiday, anniversary, personal use).',
    },
    rawUnderstoodQuery: {
      type: Type.STRING,
      description: 'Cleaned search query optimized for catalogue lookup.',
    },
    summary: {
      type: Type.STRING,
      description: 'Concise summary of what the user wants to buy.',
    },
  },
  required: [
    'productCategory',
    'currency',
    'preferences',
    'importantFeatures',
    'rawUnderstoodQuery',
    'summary',
  ],
};

/**
 * Analyze a natural language shopping request using the official Google GenAI SDK.
 * Returns a typed structured JSON response.
 */
export async function analyzeShoppingRequest(
  userPrompt: string
): Promise<StructuredShoppingAnalysis> {
  if (!isGeminiConfigured()) {
    throw new Error(
      'GEMINI_API_KEY is not configured or is using placeholder text. Please check your .env.local file.'
    );
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const systemInstruction =
    'You are an expert e-commerce shopping analyst for AgentPay. ' +
    'Extract the exact product category, numeric budget, user preferences, and important features ' +
    'from the user shopping request. Never guess a price if none was stated. Output strict JSON matching the schema.';

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: shoppingAnalysisSchema,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini API returned an empty response.');
    }

    const parsed: StructuredShoppingAnalysis = JSON.parse(text);
    return parsed;
  } catch (error: any) {
    const message = error?.message || String(error);
    if (message.includes('API_KEY_INVALID') || message.includes('403')) {
      throw new Error(`Gemini API Authentication Error: Invalid API Key provided (${message}).`);
    } else if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
      throw new Error(`Gemini API Rate Limit / Quota Exceeded (${message}).`);
    } else if (message.includes('404') || message.includes('model not found')) {
      throw new Error(`Gemini Model Not Found: The model '${GEMINI_MODEL}' may not be supported on this key (${message}).`);
    }
    throw new Error(`Gemini API Error: ${message}`);
  }
}

// ============================================================
// Conversational Understanding & Query Formulation with Gemini
// ============================================================

export interface ConversationalAnalysisResult {
  productCategory: string;
  maxBudget: number | null;
  preferredBrands: string[];
  productRequirements: string[];
  intendedUsage: string[];
  otherPreferences: string[];
  searchQuery: string;
  isMissingEssentialInfo: boolean;
  followUpQuestion: string | null;
  refinementAction: 'none' | 'cheaper' | 'better_rated' | 'different_brand' | 'usage_change' | 'compare';
  summary: string;
}

const conversationalSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    productCategory: {
      type: Type.STRING,
      description: 'The product category (e.g., electronics, audio, shoes, outdoor, etc.). If general or unknown, return "general".',
    },
    maxBudget: {
      type: Type.NUMBER,
      description: 'Maximum budget in USD. If not mentioned or null, return null.',
    },
    preferredBrands: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Any brands mentioned by the user (e.g. Sony, Bose, Nike, Apple, Anker).',
    },
    productRequirements: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Key technical/physical requirements (e.g., noise cancellation, wireless, over-ear, waterproof, long battery).',
    },
    intendedUsage: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Intended use cases mentioned by the user (e.g., programming, music, running, commuting, hiking, gaming).',
    },
    otherPreferences: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Other user preferences (e.g. comfortable earcups, gift for sister, compact, durable).',
    },
    searchQuery: {
      type: Type.STRING,
      description: 'The optimized, clean search terms for product search API. If user asks to refine (e.g. "show cheaper alternatives", "show Sony"), build the complete search term combining past context.',
    },
    isMissingEssentialInfo: {
      type: Type.BOOLEAN,
      description: 'True ONLY if the user provided zero product hints or constraints (e.g. just said "hello", "help me shop", "what can you do?").',
    },
    followUpQuestion: {
      type: Type.STRING,
      description: 'If isMissingEssentialInfo is true, provide a friendly 1-sentence follow-up question asking what item, occasion, or budget they are looking for. Otherwise null.',
    },
    refinementAction: {
      type: Type.STRING,
      description: 'Identifies user intent if this is a follow-up refinement: "none", "cheaper", "better_rated", "different_brand", "usage_change", "compare".',
    },
    summary: {
      type: Type.STRING,
      description: 'A 1-sentence summary of the user shopping goal.',
    },
  },
  required: [
    'productCategory',
    'preferredBrands',
    'productRequirements',
    'intendedUsage',
    'otherPreferences',
    'searchQuery',
    'isMissingEssentialInfo',
    'refinementAction',
    'summary',
  ],
};

/**
 * Uses Gemini to parse a natural language shopping request, maintaining multi-turn context.
 */
export async function analyzeConversationWithGemini(
  userMessage: string,
  chatHistory: ChatMessage[] = []
): Promise<ConversationalAnalysisResult> {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API is not configured.');
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  // Format recent chat history context for the model
  const recentHistory = chatHistory
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.slice(0, 300)}`)
    .join('\n\n');

  const systemInstruction =
    'You are the AgentPay Intelligent Shopping Assistant conversational parser. ' +
    'Your task is to understand the user shopping intent, taking into account any recent conversation history. ' +
    'Extract product category, budget limit, brands, requirements, intended usage, and construct an optimized search query. ' +
    'If the user is asking to refine a previous search (e.g. "show cheaper alternatives", "show products from Sony", "compare them"), ' +
    'preserve the core product category from history and adjust the search query, budget, or brand accordingly. ' +
    'If the user request is completely empty or just a greeting without any shopping criteria, set isMissingEssentialInfo=true ' +
    'and formulate a polite 1-sentence follow-up question. Never invent ratings or fictitious prices.';

  const prompt = `Recent conversation history:
${recentHistory || 'No prior conversation.'}

Current user message:
"${userMessage}"

Analyze the user's intent and output strict JSON according to the schema.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      systemInstruction,
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: conversationalSchema,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Gemini API returned empty conversational analysis.');
  }

  return JSON.parse(text) as ConversationalAnalysisResult;
}

// ============================================================
// AI Product Evaluation & Comparison with Gemini
// ============================================================

export interface AIProductEvaluation {
  productId: string;
  rank: number;
  matchScore: number;
  whyItMatches: string;
  advantages: string[];
  limitations: string[];
  budgetFit: string;
}

export interface AIComparisonResponse {
  evaluations: AIProductEvaluation[];
  topThreeIds: string[];
  comparisonSummary: string;
}

const comparisonSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    evaluations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          productId: { type: Type.STRING },
          rank: { type: Type.NUMBER, description: '1, 2, or 3 for top picks, 4+ for others' },
          matchScore: { type: Type.NUMBER, description: 'Match score between 0 and 100 based on user criteria' },
          whyItMatches: {
            type: Type.STRING,
            description: 'Clear factual explanation of why this product matches the user specific usage, requirements, and budget.',
          },
          advantages: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '2 to 3 real advantages drawn strictly from the actual product specs and verified reviews.',
          },
          limitations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '1 to 2 honest trade-offs or constraints.',
          },
          budgetFit: {
            type: Type.STRING,
            description: 'Factual statement regarding how this price fits the user budget.',
          },
        },
        required: ['productId', 'rank', 'matchScore', 'whyItMatches', 'advantages', 'limitations', 'budgetFit'],
      },
    },
    topThreeIds: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'The product IDs of the top 3 recommended products in ranking order.',
    },
    comparisonSummary: {
      type: Type.STRING,
      description: 'A concise synthesis comparing the top 3 options (e.g. Best Overall vs Best Value vs Premium Alternative).',
    },
  },
  required: ['evaluations', 'topThreeIds', 'comparisonSummary'],
};

/**
 * Passes actual retrieved products to Gemini to compare, rank, and evaluate based on user criteria.
 */
export async function evaluateAndRankProductsWithAI(
  products: Product[],
  requirements: ShoppingRequirements
): Promise<AIComparisonResponse> {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API is not configured.');
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  // Format real product data for Gemini
  const productDataText = products.map((p, idx) => `
[Product ${idx + 1}]
ID: ${p.id}
Name: ${p.name}
Brand: ${p.brand}
Price: $${p.price.toFixed(2)} ${p.currency}
Seller / Retailer: ${p.seller}
Rating: ${p.rating ? `${p.rating}/5` : 'No rating recorded'} (${p.reviewCount ? `${p.reviewCount} reviews` : '0 reviews'})
Availability: ${p.availability || 'InStock'}
Features: ${p.features && p.features.length > 0 ? p.features.join('; ') : 'Standard manufacturer specifications'}
Description: ${p.description ? p.description.slice(0, 300) : 'None provided'}
Source: ${p.isDemo ? 'Demo Catalog' : 'Live Channel3 Retailer Offer'}
`).join('\n---\n');

  const systemInstruction =
    'You are AgentPay\'s Chief Product Evaluation AI. You evaluate real shopping results against user requirements. ' +
    'CRITICAL RULES: ' +
    '1. Base your evaluation strictly on the actual product information provided. Do not fabricate ratings, features, or sellers. ' +
    '2. Do not automatically rank the cheapest product first. Value, features, build quality, and user suitability matter most. ' +
    '3. Compare products thoroughly against the user stated budget, intended usage (e.g. programming, music, hiking), and key requirements. ' +
    '4. Select the top 3 most suitable products and rank them 1, 2, and 3. ' +
    '5. Explain why each matches the user request with clear, evidence-based reasoning.';

  const prompt = `User Requirements:
- Category: ${requirements.productCategory}
- Budget: ${requirements.maxBudget ? `$${requirements.maxBudget}` : 'Flexible / Not specified'}
- Intended Usage: ${requirements.intendedUsage?.join(', ') || 'General use'}
- Key Features Desired: ${requirements.importantFeatures?.join(', ') || 'Any'}
- Brand Preferences: ${requirements.preferredBrands?.join(', ') || 'Any'}
- Other Preferences: ${requirements.preferences?.join(', ') || 'None'}

Retrieved Products:
${productDataText}

Evaluate all candidate products, assign match scores (0-100), rank the top 3, and explain the comparison. Output strict JSON according to the schema.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      systemInstruction,
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: comparisonSchema,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Gemini API returned empty evaluation response.');
  }

  return JSON.parse(text) as AIComparisonResponse;
}

