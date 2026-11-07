# AgentPay

> **Find smarter. Spend safer. Shop with confidence.**

AgentPay is an AI-powered personal shopping and secure payment assistant. It combines agentic natural-language product discovery, real-time product search via Channel3 API, multi-criteria recommendation ranking with Gemini, server-side budget protection, and user-approved PayPal Sandbox checkout.

---

## 🌟 Verified Integrations (Live Tested)

### 1. Channel3 Product Search API
- **Endpoint:** `POST https://api.trychannel3.com/v1/search`
- **Authentication:** `x-api-key` header (server-side only)
- **Features:**
  - Live e-commerce product search across top online retailers (e.g., Macy's, Best Buy, Newegg, Selfridges).
  - Retrieves real-time prices, merchant domains, specifications, images, and verified user ratings.
  - Dedicated test endpoint: `GET /api/test/channel3?q=wireless+headphones`
  - Reusable module: `src/lib/channel3.ts`

### 2. Google Gemini API Integration (`@google/genai`)
- **SDK:** Official Google GenAI SDK (`@google/genai`)
- **Model:** `gemini-3-flash-preview`
- **Capabilities:**
  - Secure server-side credential loading via `GEMINI_API_KEY`.
  - Structured entity extraction: extracts category, maximum budget, currency, user preferences, and important features.
  - Test endpoint: `GET /api/test/gemini`
  - Reusable module: `src/lib/gemini.ts`

### 3. PayPal Sandbox REST Orders API (v2)
- **API Version:** PayPal Orders REST API v2 (`/v2/checkout/orders`)
- **Environment:** PayPal Sandbox (`https://api-m.sandbox.paypal.com`)
- **Capabilities:**
  - Server-side OAuth2 Bearer token generation using `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`.
  - Server-side order creation with strict price verification.
  - Explicit user approval workflow with generated Sandbox approval URLs.
  - Payment capture with idempotent duplicate-capture protection (`HTTP 409`).
  - Test endpoint: `GET /api/test/paypal`
  - Reusable module: `src/lib/paypal.ts`

---

## 🧪 Independent Integration Test Endpoints

You can verify all three external services independently at any time while the server is running:

| Service | Endpoint | Method | Expected Output | Status |
|---|---|---|---|---|
| **Channel3 API** | `/api/test/channel3?q=wireless+headphones` | `GET` / `POST` | Live products from online retailers (Macy's, Newegg, etc.) with real prices | **Verified Live** |
| **Gemini AI** | `/api/test/gemini` | `GET` / `POST` | Structured JSON with extracted category, budget ($100), and preferences | **Verified Live** |
| **PayPal Sandbox** | `/api/test/paypal` | `GET` | Validates OAuth2 token and creates a verified Sandbox test order | **Verified Live** |

### Test using PowerShell:
```powershell
# Test Channel3 Live Product Search
Invoke-RestMethod -Uri "http://localhost:3000/api/test/channel3?q=wireless+headphones" -Method Get | ConvertTo-Json -Depth 5

# Test Gemini AI Extraction
Invoke-RestMethod -Uri "http://localhost:3000/api/test/gemini" -Method Get | ConvertTo-Json -Depth 5

# Test PayPal Sandbox Orders v2
Invoke-RestMethod -Uri "http://localhost:3000/api/test/paypal" -Method Get | ConvertTo-Json -Depth 5
```

---

## 🛠️ Architecture & Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide fintech icons.
- **Backend:** Next.js Route Handlers (`src/app/api/...`), TypeScript.
- **Database:** Atomic persistent JSON relational store (`agentpay.db.json`) mirroring SQLite schema.
- **Product Search:** Channel3 Search API (`src/lib/channel3.ts`).
- **AI Agent:** Google GenAI SDK (`@google/genai`) via `src/lib/gemini.ts`.
- **Payments:** PayPal REST Orders API v2 (`src/lib/paypal.ts`).

---

## 🤖 Intelligent Shopping Agent Architecture

AgentPay's agentic workflow connects **Gemini AI**, **Channel3 Product Search**, and **Smart Budget Protection**:

1. **Conversational Intent & Constraint Understanding:**
   - Multi-turn conversational parsing with Gemini (`analyzeConversationWithGemini`).
   - Extracts: Product category, numeric budget, preferred brands, technical requirements, intended usage (e.g. programming & music), and refinement intent (`cheaper`, `better_rated`, `different_brand`, `compare`).
   - Short follow-up question triggered if essential information is missing.

2. **Live Product Discovery via Channel3:**
   - Optimized search queries dispatched to `api.trychannel3.com/v1/search`.
   - Real-time prices, merchant domains, specifications, clean images, and customer review counts.

3. **Transparent AI Product Comparison & Ranking:**
   - Retrieved candidate products passed to Gemini (`evaluateAndRankProductsWithAI`).
   - Evaluated across match with user requirements, budget fit, features, ratings, and merchant reputation.
   - Non-price-biased ranking (highest value/fit ranked top, not merely the cheapest).
   - Generates tailored rationale linking actual product specs to user usage, with honest pros and limitations.

4. **Product Trust Advisory:**
   - Heuristic and anomaly scanner (`analyzeProductTrust`) flagging unrated items, unverified merchants, or anomalous price discrepancies.

5. **Server-Side Budget Enforcement:**
   - Verifies maximum purchase limits and remaining daily budget before allowing checkout.

6. **Interactive Comparison & Approval:**
   - Side-by-side comparison matrix (`ProductComparison.tsx`).
   - User-controlled PayPal Sandbox approval screen (`PaymentModal.tsx`).

---

## 🛡️ Milestone 4: Smart Budget Protection

AgentPay enforces spending controls strictly on the server:

### 1. Spending Controls Configuration
Users configure their thresholds in **Budget Settings** (`src/components/BudgetSettings.tsx`):
- **Maximum Amount Per Purchase:** Limits single-item price.
- **Daily Spending Limit:** Sets maximum allowable cumulative spend per calendar day.
- **Quick Preset Profiles:**
  - 🛡️ *Conservative:* \$50 max item / \$100 daily limit
  - ⚖️ *Balanced (Default):* \$100 max item / \$200 daily limit
  - 🚀 *Flexible:* \$250 max item / \$500 daily limit

### 2. Strict Backend Validation (`POST /api/budget/validate`)
When a user selects a product and clicks **Continue**:
1. Server reads official price from database by `productId` (client price is ignored).
2. Server queries user budget and recorded captured spending for today (`getTodaySpending`).
3. Computes exact currency cents (`Math.round(val * 100)`) to eliminate floating-point precision errors.
4. If either limit is exceeded:
   - **Blocks checkout immediately.**
   - PayPal approval buttons are hidden/disabled.
   - Shows detailed explanation, current daily spend, and remaining daily balance.
   - Provides quick navigation to *"Ask AI for Cheaper Alternatives"* or *"Adjust Budget Settings"*.
5. If purchase is within limits:
   - Displays a green **Budget Pre-Approved** banner.
   - Allows user to proceed to the explicit PayPal Sandbox review step.

### 3. Automated Test Suite
Run the 4 verification test scenarios at any time:
```bash
node src/lib/test-budget-scenarios.js
```

---

## 💳 Milestone 5: PayPal Sandbox Checkout

AgentPay implements a secure, explicit user-approval checkout flow using the PayPal REST Orders API (v2):

### 1. Order Creation & Budget Enforcement (`POST /api/paypal/create-order`)
- When the user selects a product and clicks **Continue**, strict server-side budget validation runs first.
- If spending limits are exceeded, checkout is blocked (`HTTP 403`) and no PayPal order is created.
- Product price is fetched directly from the database; client-sent prices are never trusted.
- If allowed, a PayPal Sandbox order is generated with `intent: 'CAPTURE'` and returns a secure `approvalUrl`.
- Order details are stored in the database with status `pending`.

### 2. Order Review Screen (`src/components/PaymentModal.tsx`)
- Displays product name, image, seller, and server-verified item price.
- Itemized breakdown showing item price, $0.00 Sandbox fee, and total sandbox charge.
- Clear **"PayPal Sandbox / Test Payment"** badge and simulation disclaimer:
  *"This is a simulated AgentPay Sandbox checkout using PayPal Sandbox. External merchants are not billed and no physical goods are shipped."*
- Prominent notice emphasizing that the AI agent never executes payments autonomously.
- Action buttons: "Cancel" and **"Continue to PayPal for Approval →"**.

### 3. Explicit User Approval & Redirect
- Clicking "Continue to PayPal for Approval" redirects the user directly to the official PayPal Sandbox checkout approval page (`approvalUrl`).
- The user must explicitly log in to their Sandbox test buyer account and approve the payment.
- If the user cancels on PayPal, the return URL (`/api/paypal/cancel`) updates the order status to `cancelled` and redirects back to AgentPay with `?payment=cancelled`.

### 4. Secure Payment Capture & Pre-Verification (`POST /api/paypal/capture-order`)
- When the user returns with approval (`?payment=approved&paypalOrderId=...`), the backend verifies the order status with PayPal (`getPayPalOrderStatus`).
- **Strict Approval Guard:** Orders with status `CREATED` (not yet approved by the user) or invalid order IDs are rejected (`HTTP 400`).
- Only eligible, approved orders are captured via `/v2/checkout/orders/{id}/capture`.
- **Idempotent Duplicate-Capture Protection:** If a user reloads the receipt page, the endpoint detects `isOrderAlreadyCaptured` and safely returns the existing receipt (`alreadyCaptured: true`) with `HTTP 200`, preventing duplicate charges and double-spending additions.

### 5. Multi-State Payment Results (`src/components/PaymentResultModal.tsx`)
Displays clear, dedicated modals for all payment states:
- **Payment Successful:** Green checkmark, PayPal Sandbox Order ID, item breakdown, captured amount, timestamp, and simulated checkout notice.
- **Payment Cancelled:** Amber alert confirming the user cancelled checkout and that no funds were charged.
- **Payment Failed:** Red alert showing the reason for capture failure with retry options.
- **Payment Pending:** Animated spinner and status indicator while contacting PayPal to verify approval.

### 6. Automated Test Suite (All 6 Scenarios Passed)
Run the complete Milestone 5 test suite:
```bash
node src/lib/test-paypal-scenarios.js
```
Verified scenarios:
1. ✅ **Successful Sandbox Order Creation** with server-side price verification and approval URL.
2. ✅ **User Cancellation Flow** handled by `/api/paypal/cancel` with safe redirect.
3. ✅ **Payment Failure Handling** rejecting missing or malformed payloads with `HTTP 400`.
4. ✅ **Budget Limit Enforcement** blocking order creation with `HTTP 403 Forbidden`.
5. ✅ **Idempotent Page Reloads** returning existing receipts without duplicate captures.
6. ✅ **Rejection of Invalid / Unapproved Orders** preventing unauthorized capture.

---

## 📊 Milestone 6: Order History and Spending Dashboard

AgentPay provides a persistent audit trail and real-time spending metrics calculated strictly on the backend:

### 1. Order History (`src/components/OrderHistory.tsx`)
- **Verified Transaction Details:** Displays product name, image, item price, currency, timestamp, PayPal Sandbox order ID, and transaction capture ID.
- **Accurate Statuses:** Displays exact transaction states:
  - `✓ Successful` (`captured` on PayPal Sandbox)
  - `⏳ Pending Approval` (`pending` user action)
  - `✕ Cancelled` (user explicitly cancelled on PayPal)
  - `✕ Failed` (capture or authorization failed)
- **Status Filter Tabs:** All Orders, Successful, Pending, Cancelled, and Failed.
- **Search Bar:** Real-time filtering by product name, PayPal order ID, or capture ID.
- **Loading, Empty, & Error States:** Animated skeletons, friendly empty search prompts, and retry handlers.

### 2. Spending Dashboard (`src/components/SpendingDashboard.tsx`)
Displays 6 core financial indicators computed strictly from verified successful captures:
1. **Total Successful Spending:** Cumulative sum of verified `captured` orders only ($0.00 from cancelled/failed).
2. **Successful Orders Count:** Total number of successful purchases.
3. **Today's Spending:** Verified spend recorded today against the daily allowance.
4. **Daily Spending Limit:** User's configured daily ceiling.
5. **Remaining Daily Budget:** Exact calculation: `dailySpendingLimit - todaySpending`.
6. **Maximum Single Purchase Limit:** Per-item threshold configured in Budget Settings.
- **Visual Budget Utilization:** Animated progress bar with threshold status tags (*Within Safe Limits*, *Moderate Spend*, *High Spending Alert*).
- **Recent Verified Activity Table:** Clean table listing recent purchases with status badges and timestamps.

### 3. Database Architecture & Security
- Relational JSON store (`agentpay.db.json`) persistent across server restarts and page reloads.
- Associated records tied to user ID (`demo-user-1`).
- **Duplicate Order Protection:** Prevents duplicate order records and duplicate captures.
- **Zero Sensitive Data Storage:** No credit card numbers, CVVs, or bank credentials are ever stored.

### 4. Automated Test Suite (All 7 Scenarios Passed)
Run the Milestone 6 test suite:
```bash
node src/lib/test-milestone6-scenarios.js
```
Verified scenarios:
1. ✅ **Successful payment appears in order history.**
2. ✅ **Cancelled payment does not count as spending ($0.00).**
3. ✅ **Failed payment does not count as spending ($0.00).**
4. ✅ **Dashboard totals match verified successful transactions.**
5. ✅ **Daily remaining budget updates correctly.**
6. ✅ **Refreshing the page preserves order history.**
7. ✅ **One order is not counted twice (idempotency guard).**

---

## 🔒 Security Highlights

- **Server-Side Credentials:** Secrets (`CHANNEL3_API_KEY`, `GEMINI_API_KEY`, `PAYPAL_CLIENT_SECRET`) are never included in frontend client bundles.
- **Backend Spending Enforcement:** Transactions are evaluated against user budget settings before contacting PayPal.
- **Idempotent Capture Guard:** Orders cannot be captured more than once.
- **Zero Autonomous Payments:** The AI agent can never complete or capture a payment without explicit user confirmation.

---

## 🚀 Running the Project

### Local Development & Testing

```bash
# Install dependencies
npm install

# Run automated end-to-end verification suite
node src/lib/test-e2e-flow.js

# Run individual milestone test suites
node src/lib/test-budget-scenarios.js      # Milestone 4: Budget Protection
node src/lib/test-paypal-scenarios.js      # Milestone 5: PayPal Sandbox Checkout
node src/lib/test-milestone6-scenarios.js  # Milestone 6: Order History & Dashboard

# Production build & start
npm run build
npm run start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deployment Guide (Vercel)

AgentPay is fully optimized for zero-configuration deployment to [Vercel](https://vercel.com).

### Step 1: Push Code to GitHub
```bash
git init
git add .
git commit -m "feat: AgentPay complete hackathon release"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/agentpay.git
git push -u origin main
```

### Step 2: Import into Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** → **Project** and select your GitHub repository.
3. Framework Preset: **Next.js** (automatically detected).
4. Root Directory: `agentpay` (or `./` if repository root is the project root).

### Step 3: Configure Environment Variables in Vercel
In the Vercel project configuration page (under **Environment Variables**), add the following variable names:

| Variable Name | Required | Description | Example / Value |
|---|---|---|---|
| `AI_PROVIDER` | Yes | AI engine selector | `gemini` |
| `GEMINI_API_KEY` | Yes | Google GenAI API Key | *(From Google AI Studio)* |
| `GEMINI_MODEL` | Yes | Gemini model identifier | `gemini-3-flash-preview` |
| `PAYPAL_API_BASE` | Yes | PayPal Sandbox REST API URL | `https://api-m.sandbox.paypal.com` |
| `PAYPAL_CLIENT_ID` | Yes | PayPal Sandbox Client ID | *(From PayPal Developer Portal)* |
| `PAYPAL_CLIENT_SECRET` | Yes | PayPal Sandbox Client Secret | *(From PayPal Developer Portal)* |
| `CHANNEL3_API_KEY` | Yes | Channel3 Product Search API Key | *(From TryChannel3)* |

> [!NOTE]
> `APP_URL` and `VERCEL_URL` are automatically resolved by Vercel's edge network. All PayPal redirect URLs dynamically map to your production URL.

### Step 4: Deploy & Verify
Click **Deploy**. Once built, verify the deployment endpoints:
- Application UI: `https://your-agentpay-domain.vercel.app`
- Test Channel3: `https://your-agentpay-domain.vercel.app/api/test/channel3`
- Test Gemini: `https://your-agentpay-domain.vercel.app/api/test/gemini`
- Test PayPal: `https://your-agentpay-domain.vercel.app/api/test/paypal`
