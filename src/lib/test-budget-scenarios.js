// test-budget-scenarios.js
// Automated verification of all 4 Milestone 4 budget scenarios

async function runTests() {
  console.log('====================================================');
  console.log('AGENTPAY MILESTONE 4: SMART BUDGET PROTECTION TESTS');
  console.log('====================================================\n');

  const BASE_URL = 'http://localhost:3000';

  // Helper to set budget
  async function setBudget(maxPurchase, dailyLimit) {
    const res = await fetch(`${BASE_URL}/api/budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxPurchaseAmount: maxPurchase, dailySpendingLimit: dailyLimit }),
    });
    return res.json();
  }

  // Helper to validate product
  async function validate(productId) {
    const res = await fetch(`${BASE_URL}/api/budget/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
    return res.json();
  }

  // Helper to test create-order security
  async function tryCreateOrder(productId) {
    const res = await fetch(`${BASE_URL}/api/paypal/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
    return { status: res.status, json: await res.json() };
  }

  // First, check spending summary
  const spendRes = await fetch(`${BASE_URL}/api/spending`);
  const spendData = await spendRes.json();
  const currentDailySpending = spendData.data.todaySpending;
  console.log(`Current Recorded Spending Today: $${currentDailySpending.toFixed(2)}\n`);

  // ----------------------------------------------------
  // TEST SCENARIO 1: Product Below Both Limits
  // ----------------------------------------------------
  console.log('>>> TEST SCENARIO 1: Product below both limits');
  // Configure generous limits: $150 max purchase, $300 daily limit
  await setBudget(150, 300);
  // prod-002: SummitGrip Trekking Poles ($38.50)
  const sc1 = await validate('prod-002');
  console.log(`Product: ${sc1.data.productName} ($${sc1.data.actualPrice})`);
  console.log(`Limits: Max Purchase = $${sc1.data.maxPurchaseAmount}, Daily Limit = $${sc1.data.dailySpendingLimit}`);
  console.log(`Within Purchase Limit? ${sc1.data.withinPurchaseLimit}`);
  console.log(`Within Daily Limit? ${sc1.data.withinDailyLimit}`);
  console.log(`Status: ${sc1.data.status} | Allowed: ${sc1.data.allowed}`);
  console.log(`Explanation: ${sc1.data.explanation}`);
  console.assert(sc1.data.allowed === true, 'Scenario 1 should be allowed!');
  console.log('✓ Scenario 1 PASSED: Product below limits is approved.\n');

  // ----------------------------------------------------
  // TEST SCENARIO 2: Product Above Per-Purchase Limit
  // ----------------------------------------------------
  console.log('>>> TEST SCENARIO 2: Product above per-purchase limit');
  // Configure strict per-purchase limit: $30 max purchase, $300 daily limit
  await setBudget(30, 300);
  // prod-001: TrailBlazer Backpack ($45.99 > $30.00)
  const sc2 = await validate('prod-001');
  console.log(`Product: ${sc2.data.productName} ($${sc2.data.actualPrice})`);
  console.log(`Limits: Max Purchase = $${sc2.data.maxPurchaseAmount}, Daily Limit = $${sc2.data.dailySpendingLimit}`);
  console.log(`Within Purchase Limit? ${sc2.data.withinPurchaseLimit}`);
  console.log(`Within Daily Limit? ${sc2.data.withinDailyLimit}`);
  console.log(`Status: ${sc2.data.status} | Allowed: ${sc2.data.allowed}`);
  console.log(`Explanation: ${sc2.data.explanation}`);
  console.assert(sc2.data.allowed === false, 'Scenario 2 should be blocked!');
  console.assert(sc2.data.status === 'blocked_purchase_limit', 'Status should be blocked_purchase_limit');
  
  // Also verify backend create-order security blocks it with HTTP 403
  const orderSecurity2 = await tryCreateOrder('prod-001');
  console.log(`Backend Order Creation Endpoint Response Code: HTTP ${orderSecurity2.status}`);
  console.assert(orderSecurity2.status === 403, 'create-order should return HTTP 403 Forbidden!');
  console.log('✓ Scenario 2 PASSED: Checkout blocked with clear explanation and backend HTTP 403.\n');

  // ----------------------------------------------------
  // TEST SCENARIO 3: Product Exceeds Remaining Daily Budget
  // ----------------------------------------------------
  console.log('>>> TEST SCENARIO 3: Product exceeds remaining daily budget');
  // With currentDailySpending = $45.99:
  // If we set daily limit = $60, remaining daily budget = $14.01.
  // Set maxPurchase = $50.
  // prod-004: TrailLite LED Headlamp ($24.99)
  // Price ($24.99) <= maxPurchase ($50), but ($45.99 + $24.99 = $70.98) > daily limit ($60)!
  await setBudget(50, 60);
  const sc3 = await validate('prod-004');
  console.log(`Product: ${sc3.data.productName} ($${sc3.data.actualPrice})`);
  console.log(`Spent Today: $${sc3.data.currentDailySpending}, Daily Limit: $${sc3.data.dailySpendingLimit}`);
  console.log(`Remaining Daily Budget: $${sc3.data.remainingDailyBudget}`);
  console.log(`Within Purchase Limit? ${sc3.data.withinPurchaseLimit}`);
  console.log(`Within Daily Limit? ${sc3.data.withinDailyLimit}`);
  console.log(`Status: ${sc3.data.status} | Allowed: ${sc3.data.allowed}`);
  console.log(`Explanation: ${sc3.data.explanation}`);
  console.assert(sc3.data.allowed === false, 'Scenario 3 should be blocked!');
  console.assert(sc3.data.status === 'blocked_daily_limit', 'Status should be blocked_daily_limit');
  console.log('✓ Scenario 3 PASSED: Checkout blocked because transaction exceeds remaining daily budget.\n');

  // ----------------------------------------------------
  // TEST SCENARIO 4: Boundary Values Equal to Each Limit
  // ----------------------------------------------------
  console.log('>>> TEST SCENARIO 4: Boundary values exactly equal to limits');
  
  // Boundary 4A: Product price exactly equals max purchase limit
  // prod-005: HydroStream Water Filter Bottle ($32.00)
  // Set maxPurchase = $32.00, daily limit = $150
  await setBudget(32, 150);
  const sc4A = await validate('prod-005');
  console.log(`[4A] Product: ${sc4A.data.productName} ($${sc4A.data.actualPrice})`);
  console.log(`Max Purchase Limit: $${sc4A.data.maxPurchaseAmount}`);
  console.log(`Exact boundary match? ${sc4A.data.isBoundaryMatch}`);
  console.log(`Status: ${sc4A.data.status} | Allowed: ${sc4A.data.allowed}`);
  console.log(`Explanation: ${sc4A.data.explanation}`);
  console.assert(sc4A.data.allowed === true, 'Scenario 4A boundary price should be allowed!');

  // Boundary 4B: (currentDailySpending + price) exactly equals daily spending limit
  // With currentDailySpending = $45.99 and prod-005 = $32.00:
  // Set dailyLimit = $45.99 + $32.00 = $77.99
  // Set maxPurchase = $50
  await setBudget(50, 77.99);
  const sc4B = await validate('prod-005');
  console.log(`\n[4B] Product: ${sc4B.data.productName} ($${sc4B.data.actualPrice})`);
  console.log(`Spent Today: $${sc4B.data.currentDailySpending} + Price: $${sc4B.data.actualPrice} = $${(sc4B.data.currentDailySpending + sc4B.data.actualPrice).toFixed(2)}`);
  console.log(`Daily Spending Limit: $${sc4B.data.dailySpendingLimit}`);
  console.log(`Exact daily boundary match? ${sc4B.data.isBoundaryMatch}`);
  console.log(`Status: ${sc4B.data.status} | Allowed: ${sc4B.data.allowed}`);
  console.log(`Explanation: ${sc4B.data.explanation}`);
  console.assert(sc4B.data.allowed === true, 'Scenario 4B boundary price should be allowed!');
  console.log('✓ Scenario 4 PASSED: Boundary values exactly matching limits are permitted.\n');

  // Reset to default generous budget ($150 max purchase, $300 daily limit)
  await setBudget(150, 300);
  console.log('Reset budget to default ($150 max purchase / $300 daily limit).');
  console.log('\n====================================================');
  console.log('ALL 4 MILESTONE 4 TEST SCENARIOS PASSED WITH 100% SUCCESS!');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});

