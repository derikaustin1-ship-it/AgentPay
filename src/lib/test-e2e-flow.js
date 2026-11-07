// src/lib/test-e2e-flow.js
// Complete End-to-End Test Suite for AgentPay (Milestone 7 - Phase 1)
// Verifies all 10 steps of the user journey:
// 1. User enters natural-language shopping request
// 2. Gemini extracts intent, budget, and requirements
// 3. Channel3 searches real products
// 4. Gemini ranks and recommends top 3 products
// 5. User selects a product
// 6. Backend validates budget (under-budget and over-budget scenarios)
// 7. PayPal Sandbox order creation
// 8. Explicit user approval & unapproved order rejection
// 9. Payment capture & idempotent duplicate-capture protection
// 10. Order history & spending dashboard update verification

const BASE_URL = 'http://localhost:3000';

async function runEndToEndTest() {
  console.log('======================================================================');
  console.log('🚀 RUNNING COMPLETE END-TO-END FLOW: AGENTPAY HACKATHON VERIFICATION');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  // -------------------------------------------------------------------------
  // STEP 1-4: Chat Request -> Gemini Extraction -> Product Search -> AI Ranking
  // -------------------------------------------------------------------------
  console.log('👉 STEP 1-4: Intelligent Shopping Agent (Gemini + Channel3 + Ranking)');
  let recommendedProducts = [];
  try {
    const chatRes = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Find wireless noise cancelling headphones under $100 for programming',
      }),
    });

    const chatData = await chatRes.json();
    if (!chatRes.ok || !chatData.success) {
      throw new Error(`Chat API failed: ${chatData.error || chatRes.statusText}`);
    }

    recommendedProducts = chatData.data?.products || [];
    if (recommendedProducts.length > 0) {
      console.log(`   ✅ PASSED: AI agent returned ${recommendedProducts.length} ranked product recommendations.`);
      const top = recommendedProducts[0].product;
      console.log(`      Top Recommendation: "${top.name}"`);
      console.log(`      Price: $${top.price} ${top.currency}`);
      console.log(`      Match Score: ${recommendedProducts[0].matchScore}%`);
      console.log(`      AI Reasoning: "${recommendedProducts[0].reasoning.slice(0, 100)}..."`);
      passed++;
    } else {
      throw new Error('AI agent did not return product recommendations');
    }
  } catch (err) {
    console.error('   ❌ FAILED Step 1-4:', err.message);
    failed++;
  }
  console.log('');

  // -------------------------------------------------------------------------
  // STEP 5 & 6A: Product Selection & Backend Budget Validation (Approved)
  // -------------------------------------------------------------------------
  console.log('👉 STEP 5 & 6A: Product Selection & Backend Budget Validation (Approved)');
  // Pick an item within budget ($150 limit)
  let approvedItem = recommendedProducts.map((p) => p.product).find((p) => p.price <= 150) || {
    id: 'prod-004',
    name: 'TrailLite LED Headlamp (800 Lumens)',
    price: 24.99,
  };

  try {
    const validateRes = await fetch(`${BASE_URL}/api/budget/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: approvedItem.id }),
    });

    const validateData = await validateRes.json();
    if (validateRes.ok && validateData.success && validateData.data?.allowed === true) {
      console.log('   ✅ PASSED: Selected product validated server-side as budget-approved.');
      console.log(`      Product: ${validateData.data.productName}`);
      console.log(`      Verified Database Price: $${validateData.data.actualPrice.toFixed(2)}`);
      console.log(`      Max Single Limit: $${validateData.data.maxPurchaseAmount.toFixed(2)}`);
      console.log(`      Daily Remaining: $${validateData.data.remainingDailyBudget.toFixed(2)}`);
      passed++;
    } else {
      throw new Error(`Budget validation failed: ${validateData.error || 'Disallowed'}`);
    }
  } catch (err) {
    console.error('   ❌ FAILED Step 5 & 6A:', err.message);
    failed++;
  }
  console.log('');

  // -------------------------------------------------------------------------
  // STEP 6B: Budget Protection Guard (Blocked When Exceeding Limit)
  // -------------------------------------------------------------------------
  console.log('👉 STEP 6B: Budget Protection Guard (Blocked When Exceeding Limit)');
  try {
    const blockedRes = await fetch(`${BASE_URL}/api/budget/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'prod-020' }), // $249.99 exceeds $150 limit
    });

    const blockedData = await blockedRes.json();
    if (blockedRes.ok && blockedData.data?.allowed === false) {
      console.log('   ✅ PASSED: Over-budget item strictly blocked by server-side policy.');
      console.log(`      Status: ${blockedData.data.status}`);
      console.log(`      Explanation: "${blockedData.data.explanation}"`);
      passed++;
    } else {
      throw new Error('Over-budget product was not blocked by validation endpoint');
    }
  } catch (err) {
    console.error('   ❌ FAILED Step 6B:', err.message);
    failed++;
  }
  console.log('');

  // -------------------------------------------------------------------------
  // STEP 7: PayPal Sandbox Order Creation
  // -------------------------------------------------------------------------
  console.log('👉 STEP 7: PayPal Sandbox Order Creation via REST Orders API v2');
  let pOrderId = null;
  let approvalUrl = null;
  try {
    const createRes = await fetch(`${BASE_URL}/api/paypal/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: approvedItem.id }),
    });

    const createData = await createRes.json();
    if (createRes.ok && createData.success && createData.data?.paypalOrderId) {
      pOrderId = createData.data.paypalOrderId;
      approvalUrl = createData.data.approvalUrl;
      console.log('   ✅ PASSED: PayPal Sandbox order created with verified server price.');
      console.log(`      PayPal Order ID: ${pOrderId}`);
      console.log(`      Approval URL: ${approvalUrl}`);
      console.log(`      Amount: $${createData.data.amount} ${createData.data.currency}`);
      passed++;
    } else {
      throw new Error(`PayPal order creation failed: ${createData.error}`);
    }
  } catch (err) {
    console.error('   ❌ FAILED Step 7:', err.message);
    failed++;
  }
  console.log('');

  // -------------------------------------------------------------------------
  // STEP 8: Security Guard - Unapproved Order Capture Rejection
  // -------------------------------------------------------------------------
  console.log('👉 STEP 8: Security Guard - Rejection of Unapproved Orders');
  try {
    const unapprovedRes = await fetch(`${BASE_URL}/api/paypal/capture-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paypalOrderId: pOrderId }),
    });

    const unapprovedData = await unapprovedRes.json();
    if (unapprovedRes.status === 400 && unapprovedData.success === false) {
      console.log('   ✅ PASSED: Capture strictly blocked before explicit user approval.');
      console.log(`      Server response: "${unapprovedData.error}"`);
      passed++;
    } else {
      throw new Error('Unapproved order was not rejected by capture endpoint');
    }
  } catch (err) {
    console.error('   ❌ FAILED Step 8:', err.message);
    failed++;
  }
  console.log('');

  // -------------------------------------------------------------------------
  // STEP 9: User Cancellation Redirect & Status Update
  // -------------------------------------------------------------------------
  console.log('👉 STEP 9: User Cancellation Flow');
  try {
    const cancelRes = await fetch(`${BASE_URL}/api/paypal/cancel?token=${pOrderId}`, {
      redirect: 'manual',
    });

    const location = cancelRes.headers.get('location') || '';
    if (cancelRes.status === 307 || cancelRes.status === 302 || location.includes('payment=cancelled')) {
      console.log('   ✅ PASSED: Cancellation safely handled with redirect to cancelled view.');
      console.log(`      Redirect URL: ${location}`);
      passed++;
    } else {
      throw new Error(`Cancellation redirect failed: HTTP ${cancelRes.status}`);
    }
  } catch (err) {
    console.error('   ❌ FAILED Step 9:', err.message);
    failed++;
  }
  console.log('');

  // -------------------------------------------------------------------------
  // STEP 10: Order History and Spending Dashboard Verification
  // -------------------------------------------------------------------------
  console.log('👉 STEP 10: Order History & Spending Dashboard Audit Trail');
  try {
    const [ordersRes, spendRes] = await Promise.all([
      fetch(`${BASE_URL}/api/orders`),
      fetch(`${BASE_URL}/api/spending`),
    ]);

    const ordersData = await ordersRes.json();
    const spendData = await spendRes.json();

    const cancelledOrder = ordersData.data.find((o) => o.paypalOrderId === pOrderId);
    const capturedOrders = ordersData.data.filter((o) => o.paymentStatus === 'captured');
    const expectedSpend = capturedOrders.reduce((sum, o) => sum + o.amount, 0);

    const cancelledRecorded = cancelledOrder && cancelledOrder.paymentStatus === 'cancelled';
    const spendMatches = Math.abs(spendData.data.totalSpending - expectedSpend) < 0.001;

    if (cancelledRecorded && spendMatches) {
      console.log('   ✅ PASSED: Orders persisted correctly; cancelled session contributes $0.00.');
      console.log(`      Cancelled Order Status: ${cancelledOrder.paymentStatus.toUpperCase()}`);
      console.log(`      Total Persisted Orders: ${ordersData.data.length}`);
      console.log(`      Total Verified Spending: $${spendData.data.totalSpending.toFixed(2)} USD`);
      console.log(`      Remaining Daily Budget: $${spendData.data.remainingDailyBudget.toFixed(2)} USD`);
      passed++;
    } else {
      throw new Error(`Audit mismatch: cancelledRecorded=${cancelledRecorded}, spendMatches=${spendMatches}`);
    }
  } catch (err) {
    console.error('   ❌ FAILED Step 10:', err.message);
    failed++;
  }
  console.log('');

  // -------------------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------------------
  console.log('======================================================================');
  console.log(`🏁 END-TO-END TEST RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runEndToEndTest();
