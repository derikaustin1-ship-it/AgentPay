// src/lib/ai-agent.ts
// AI Shopping Agent with tool-calling capabilities and deep Gemini + Channel3 integration
// Uses Gemini API with structured conversational parsing, real Channel3 product search,
// transparent AI comparison and ranking, and server-side budget protection.

import { searchProductCatalogue } from './products';
import { analyzeProductTrust } from './products';
import { checkSpendingLimits } from './budget';
import { GoogleGenAI } from '@google/genai';
import { 
  isGeminiConfigured,
  analyzeConversationWithGemini,
  evaluateAndRankProductsWithAI,
  AIComparisonResponse
} from './gemini';
import { 
  Product, ProductRecommendation, ShoppingRequirements, 
  AgentResponse, SpendingCheck, ChatMessage 
} from '@/types';

// ============================================================
// AI Provider Configuration
// ============================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
const AI_PROVIDER = process.env.AI_PROVIDER || 'gemini';

/**
 * Check if an AI provider is configured and available.
 */
export function isAIConfigured(): boolean {
  if (AI_PROVIDER === 'rule-based') return true;
  if (AI_PROVIDER === 'gemini') return isGeminiConfigured();
  return false;
}

// ============================================================
// Fallback Rule-Based Requirements Extraction
// ============================================================

function extractRequirementsFallback(userMessage: string): ShoppingRequirements {
  const msg = userMessage.toLowerCase();
  
  // Extract budget from message
  const budgetMatch = msg.match(/\$(\d+(?:\.\d{2})?)|(\d+(?:\.\d{2})?)\s*(?:dollars?|usd|budget)/);
  const maxBudget = budgetMatch ? parseFloat(budgetMatch[1] || budgetMatch[2]) : undefined;

  // Extract category
  let productCategory = 'general';
  const categoryMap: Record<string, string[]> = {
    'outdoor': ['hiking', 'camping', 'outdoor', 'trail', 'trek', 'backpack', 'tent', 'nature'],
    'electronics': ['headphone', 'earbuds', 'speaker', 'watch', 'smartwatch', 'laptop', 'computer', 'tech', 'electronic', 'wireless'],
    'shoes': ['shoe', 'sneaker', 'running shoe', 'trainer', 'footwear', 'boot'],
    'music': ['music', 'musical', 'instrument', 'speaker', 'record', 'vinyl', 'audio'],
  };

  for (const [cat, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(kw => msg.includes(kw))) {
      productCategory = cat;
      break;
    }
  }

  // Extract preferences & usage
  const preferences: string[] = [];
  const intendedUsage: string[] = [];
  if (msg.includes('programming') || msg.includes('coding') || msg.includes('developer')) {
    intendedUsage.push('programming / coding');
    preferences.push('comfortable for long sessions');
  }
  if (msg.includes('music') || msg.includes('audio') || msg.includes('sound quality')) {
    intendedUsage.push('music playback');
  }
  if (msg.includes('gift') || msg.includes('birthday') || msg.includes('present')) preferences.push('gift');
  if (msg.includes('lightweight') || msg.includes('compact') || msg.includes('portable')) preferences.push('portable');
  if (msg.includes('waterproof') || msg.includes('water resistant')) preferences.push('waterproof');
  if (msg.includes('budget') || msg.includes('affordable') || msg.includes('cheap')) preferences.push('budget-friendly');

  // Extract brands if mentioned
  const preferredBrands: string[] = [];
  if (msg.includes('sony')) preferredBrands.push('Sony');
  if (msg.includes('bose')) preferredBrands.push('Bose');
  if (msg.includes('anker') || msg.includes('soundcore')) preferredBrands.push('Anker');
  if (msg.includes('sennheiser')) preferredBrands.push('Sennheiser');
  if (msg.includes('jbl')) preferredBrands.push('JBL');

  // Extract important features
  const importantFeatures: string[] = [];
  if (msg.includes('noise cancel') || msg.includes('anc')) importantFeatures.push('Active Noise Cancellation (ANC)');
  if (msg.includes('battery') || msg.includes('long lasting')) importantFeatures.push('Long battery life');
  if (msg.includes('bluetooth') || msg.includes('wireless')) importantFeatures.push('Wireless / Bluetooth');

  // Check if essential info is missing
  const isGreetingOrVague = ['hi', 'hello', 'hey', 'help me', 'shop'].includes(msg.trim());

  return {
    productCategory,
    preferences,
    maxBudget,
    preferredBrands,
    importantFeatures,
    intendedUsage,
    constraints: maxBudget ? [`Budget: $${maxBudget}`] : [],
    searchQuery: userMessage,
    isMissingEssentialInfo: isGreetingOrVague,
    followUpQuestion: isGreetingOrVague ? 'What kind of product or gift are you looking for today? Feel free to mention your budget or preferred features!' : undefined,
  };
}

// ============================================================
// Heuristic Ranking Fallback (when LLM is offline)
// ============================================================

function rankProductsHeuristic(
  products: Product[],
  requirements: ShoppingRequirements
): ProductRecommendation[] {
  return products
    .map(product => {
      let matchScore = 50;
      const advantages: string[] = [];
      const limitations: string[] = [];

      // Price match scoring
      if (requirements.maxBudget) {
        if (product.price <= requirements.maxBudget) {
          matchScore += 18;
          advantages.push(`Fits within your $${requirements.maxBudget} budget`);
        } else {
          matchScore -= 25;
          limitations.push(`Exceeds your $${requirements.maxBudget} budget`);
        }
        const priceRatio = product.price / requirements.maxBudget;
        if (priceRatio >= 0.5 && priceRatio <= 0.95) {
          matchScore += 10;
        }
      }

      // Rating scoring
      if (product.rating) {
        if (product.rating >= 4.5) { matchScore += 15; advantages.push(`Highly rated (${product.rating}/5)`); }
        else if (product.rating >= 4.0) { matchScore += 10; advantages.push(`Well rated (${product.rating}/5)`); }
        else if (product.rating < 3.5) { matchScore -= 10; limitations.push(`Lower rating (${product.rating}/5)`); }
      }

      // Feature match scoring
      if (product.features) {
        for (const feature of requirements.importantFeatures) {
          const featureLower = feature.toLowerCase();
          if (product.features.some(f => f.toLowerCase().includes(featureLower))) {
            matchScore += 8;
            advantages.push(`Has ${feature}`);
          }
        }
      }

      // Intended usage matching
      if (requirements.intendedUsage?.includes('programming / coding')) {
        if (product.features?.some(f => f.toLowerCase().includes('noise') || f.toLowerCase().includes('comfort') || f.toLowerCase().includes('battery'))) {
          matchScore += 12;
          advantages.push('Quiet isolation and comfort suitable for long programming sessions');
        }
      }

      if (requirements.intendedUsage?.includes('music playback')) {
        if (product.features?.some(f => f.toLowerCase().includes('bass') || f.toLowerCase().includes('driver') || f.toLowerCase().includes('sound') || f.toLowerCase().includes('dac'))) {
          matchScore += 10;
          advantages.push('Enhanced audio drivers for rich music detail');
        }
      }

      // Trust analysis
      const trustWarnings = analyzeProductTrust(product);
      if (trustWarnings.length > 0) {
        matchScore -= trustWarnings.length * 5;
      }

      const reasoning = generateFallbackReasoning(product, requirements, advantages);

      return {
        product,
        matchScore: Math.max(0, Math.min(100, matchScore)),
        reasoning,
        advantages,
        limitations,
        trustWarnings,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

function generateFallbackReasoning(
  product: Product,
  requirements: ShoppingRequirements,
  advantages: string[]
): string {
  const parts: string[] = [];

  if (requirements.intendedUsage && requirements.intendedUsage.length > 0) {
    parts.push(`Recommended for ${requirements.intendedUsage.join(' and ')}.`);
  }

  if (requirements.maxBudget && product.price <= requirements.maxBudget) {
    parts.push(`At $${product.price.toFixed(2)}, it fits within your $${requirements.maxBudget} budget.`);
  }

  if (product.rating && product.rating >= 4.0) {
    parts.push(`Customer verified rating: ${product.rating}/5 from ${product.reviewCount || 'multiple'} reviews.`);
  }

  if (advantages.length > 0) {
    parts.push(`Key strengths: ${advantages.slice(0, 3).join(', ')}.`);
  }

  return parts.join(' ') || `${product.name} is a solid match for your shopping criteria.`;
}

// ============================================================
// Main Agent Processing (Gemini + Channel3 + Smart Budget)
// ============================================================

export async function processShoppingRequest(
  userMessage: string,
  chatHistory: ChatMessage[]
): Promise<AgentResponse> {
  try {
    let requirements: ShoppingRequirements;

    // Step 1: Conversational Understanding & Query Formulation with Gemini
    if (isGeminiConfigured()) {
      try {
        const geminiAnalysis = await analyzeConversationWithGemini(userMessage, chatHistory);

        // Check if essential information is missing
        if (geminiAnalysis.isMissingEssentialInfo && geminiAnalysis.followUpQuestion) {
          return {
            message: geminiAnalysis.followUpQuestion,
          };
        }

        requirements = {
          productCategory: geminiAnalysis.productCategory,
          maxBudget: geminiAnalysis.maxBudget ?? undefined,
          preferredBrands: geminiAnalysis.preferredBrands,
          productRequirements: geminiAnalysis.productRequirements,
          intendedUsage: geminiAnalysis.intendedUsage,
          otherPreferences: geminiAnalysis.otherPreferences,
          preferences: [...geminiAnalysis.otherPreferences, ...geminiAnalysis.intendedUsage],
          importantFeatures: geminiAnalysis.productRequirements,
          constraints: geminiAnalysis.maxBudget ? [`Budget: $${geminiAnalysis.maxBudget}`] : [],
          searchQuery: geminiAnalysis.searchQuery,
          refinementAction: geminiAnalysis.refinementAction,
        };
      } catch (geminiError) {
        console.warn('Gemini conversational analysis failed, using fallback parser:', geminiError);
        requirements = extractRequirementsFallback(userMessage);
      }
    } else {
      requirements = extractRequirementsFallback(userMessage);
      if (requirements.isMissingEssentialInfo && requirements.followUpQuestion) {
        return {
          message: requirements.followUpQuestion,
        };
      }
    }

    // Step 2: Product Discovery via Channel3
    const query = requirements.searchQuery || userMessage;
    let products = await searchProductCatalogue({
      query,
      category: requirements.productCategory !== 'general' ? requirements.productCategory : undefined,
      maxPrice: requirements.maxBudget,
      preferences: requirements.preferences,
    });

    // If initial search found nothing, try broader query
    if (products.length === 0) {
      const broadQuery = requirements.productCategory !== 'general' 
        ? requirements.productCategory 
        : userMessage.split(' ').slice(0, 3).join(' ');
      products = await searchProductCatalogue({ query: broadQuery });
    }

    if (products.length === 0) {
      return {
        message: `I searched live retailer catalogues and demo inventory for "${query}", but couldn't find matching products within your criteria.

Could you try:
- Increasing your budget slightly
- Relaxing specific feature constraints
- Trying an alternate brand or category`,
      };
    }

    // Step 3: AI Product Evaluation & Comparison with Gemini
    let topRecommendations: ProductRecommendation[] = [];
    let comparisonSummary = '';

    if (isGeminiConfigured() && products.length > 0) {
      try {
        // Send candidate products to Gemini for transparent evaluation and ranking
        const candidatePool = products.slice(0, 8);
        const aiEvaluation: AIComparisonResponse = await evaluateAndRankProductsWithAI(candidatePool, requirements);
        
        comparisonSummary = aiEvaluation.comparisonSummary;

        // Map evaluations back to ProductRecommendations
        const evalMap = new Map(aiEvaluation.evaluations.map(e => [e.productId, e]));

        // Sort products according to Gemini's rankings
        const ranked = candidatePool
          .map(product => {
            const ev = evalMap.get(product.id);
            const trustWarnings = analyzeProductTrust(product, candidatePool);

            if (ev) {
              return {
                product,
                matchScore: Math.min(100, Math.max(0, ev.matchScore)),
                reasoning: ev.whyItMatches,
                advantages: ev.advantages,
                limitations: ev.limitations,
                trustWarnings,
                rank: ev.rank,
              };
            } else {
              // Heuristic score fallback for unranked candidate
              const heuristicRec = rankProductsHeuristic([product], requirements)[0];
              return {
                ...heuristicRec,
                rank: 99,
              };
            }
          })
          .sort((a, b) => a.rank - b.rank);

        topRecommendations = ranked.slice(0, 3);
      } catch (evalError) {
        console.warn('Gemini AI evaluation failed, falling back to heuristic ranking:', evalError);
        topRecommendations = rankProductsHeuristic(products, requirements).slice(0, 3);
      }
    } else {
      topRecommendations = rankProductsHeuristic(products, requirements).slice(0, 3);
    }

    // Step 4: Smart Budget Protection
    let spendingCheck: SpendingCheck | undefined;
    if (topRecommendations.length > 0) {
      // Check the primary recommended product against limits
      spendingCheck = checkSpendingLimits(topRecommendations[0].product.price);
    }

    // Step 5: Construct Formatted Conversational Assistant Message
    const isLive = topRecommendations.some(r => !r.product.isDemo);
    const message = formatAgentResponse({
      userMessage,
      requirements,
      topRecommendations,
      spendingCheck,
      comparisonSummary,
      isLive,
    });

    return {
      message,
      products: topRecommendations,
      spendingCheck,
    };
  } catch (error) {
    console.error('Agent processing error:', error);
    return {
      message: `I encountered an unexpected issue while processing your request. Please try again.\n\n*Error: ${error instanceof Error ? error.message : 'Unknown error'}*`,
    };
  }
}

// ============================================================
// Response Message Formatting
// ============================================================

interface FormatAgentResponseParams {
  userMessage: string;
  requirements: ShoppingRequirements;
  topRecommendations: ProductRecommendation[];
  spendingCheck?: SpendingCheck;
  comparisonSummary?: string;
  isLive: boolean;
}

function formatAgentResponse({
  requirements,
  topRecommendations,
  spendingCheck,
  comparisonSummary,
  isLive,
}: FormatAgentResponseParams): string {
  const parts: string[] = [];

  // Header / Context summary
  const usageText = requirements.intendedUsage && requirements.intendedUsage.length > 0
    ? ` for **${requirements.intendedUsage.join(' & ')}**`
    : '';
  const budgetText = requirements.maxBudget
    ? ` within your **$${requirements.maxBudget}** budget`
    : '';

  parts.push(`I analyzed available options and selected the **top 3 recommendations**${usageText}${budgetText}:`);
  parts.push('');

  // Source attribution
  if (isLive) {
    parts.push(`*🛍️ Sourced in real time from verified online retailers via **Channel3 Search API**.*`);
  } else {
    parts.push(`*📋 Demonstration catalog items.*`);
  }
  parts.push('');

  // Top 3 detailed descriptions
  topRecommendations.forEach((rec, idx) => {
    const { product, matchScore, reasoning, advantages, limitations } = rec;
    parts.push(`### #${idx + 1}. ${product.name} — **$${product.price.toFixed(2)}**`);
    parts.push(`*Brand: **${product.brand}** · Seller: **${product.seller}** · Match: **${matchScore}%**${product.rating ? ` · Rating: ⭐ ${product.rating}/5 (${product.reviewCount || 0} reviews)` : ''}*`);
    parts.push('');
    parts.push(`> **Why it matches:** ${reasoning}`);
    parts.push('');
    if (advantages && advantages.length > 0) {
      parts.push(`✅ **Key Advantages:** ${advantages.join(' · ')}`);
    }
    if (limitations && limitations.length > 0) {
      parts.push(`⚠️ **Considerations:** ${limitations.join(' · ')}`);
    }
    parts.push('');
  });

  // Comparison synthesis
  if (comparisonSummary) {
    parts.push('---');
    parts.push(`### ⚖️ AI Comparison Overview`);
    parts.push(comparisonSummary);
    parts.push('');
  }

  // Budget validation check
  if (spendingCheck) {
    parts.push('---');
    if (spendingCheck.allowed) {
      parts.push(`🛡️ **Budget Protection:** ${spendingCheck.message}`);
    } else {
      parts.push(`🚨 **Budget Warning:** ${spendingCheck.message}`);
    }
    parts.push('');
  }

  parts.push(`You can click **Compare** to view a side-by-side spec matrix, or click **Review & Pay** to start secure PayPal Sandbox checkout.`);

  return parts.join('\n');
}
