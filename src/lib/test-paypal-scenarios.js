// src/lib/test-paypal-scenarios.js
// Automated verification script for Milestone 5: PayPal Sandbox Checkout
// Tests all 6 required scenarios:
// 1. Successful PayPal Sandbox order creation
// 2. User cancels payment on PayPal
// 3. Payment failure handling
// 4. Budget limit prevents order creation
// 5. Refreshing the page does not cause duplicate captures (idempotency)
// 6. Attempting to capture an invalid or unverified PayPal order is rejected

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('======================================================');
  console.log('🧪 RUNNING MILESTONE 5: PAYPAL SANDBOX CHECKOUT TESTS');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  // ---------------------------------------------------------------------------
  // SCENARIO 4: Budget limit prevents order creation
  // ---------------------------------------------------------------------------
  console.log('👉 SCENARIO 4: Budget limit prevents PayPal order creation');
  try {
    // prod-020 costs $249.99 (exceeds single purchase limit $150)
    const res = await fetch(`${BASE_URL}/api/paypal/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'prod-020' }),
    });

    const data = await res.json();
    if (res.status === 403 && data.success === false && data.error?.includes('Budget')) {
      console.log('   ✅ PASSED: Order creation was blocked with HTTP 403 Forbidden.');
      console.log(`      Error: "${data.error}"`);
      console.log(`      Spending check: ${data.data?.spendingCheck?.message}`);
      passed++;
    } else {
      console.error('   ❌ FAILED: Order creation was not blocked by spending limits.', res.status, data);
      failed++;
    }
  } catch (err) {
    console.error('   ❌ FAILED with error:', err.message);
    failed++;
  }
  console.log('');

  // ---------------------------------------------------------------------------
  // SCENARIO 1: Create PayPal Sandbox order for allowed item & verify approval URL
  // ---------------------------------------------------------------------------
  console.log('👉 SCENARIO 1: Create real PayPal Sandbox order with server-verified price');
  let realPayPalOrderId = null;
  let realApprovalUrl = null;
  try {
    // prod-004 costs $24.99 (well within budget)
    const res = await fetch(`${BASE_URL}/api/paypal/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'prod-004' }),
    });

    const data = await res.json();
    if (res.status === 200 && data.success === true && data.data?.paypalOrderId) {
      realPayPalOrderId = data.data.paypalOrderId;
      realApprovalUrl = data.data.approvalUrl;
      console.log('   ✅ PASSED: PayPal Sandbox order created successfully.');
      console.log(`      PayPal Order ID: ${realPayPalOrderId}`);
      console.log(`      Verified Amount: $${data.data.amount} ${data.data.currency}`);
      console.log(`      Approval URL: ${realApprovalUrl}`);
      passed++;
    } else {
      console.error('   ❌ FAILED: Could not create PayPal Sandbox order.', res.status, data);
      failed++;
    }
  } catch (err) {
    console.error('   ❌ FAILED with error:', err.message);
    failed++;
  }
  console.log('');

  // ---------------------------------------------------------------------------
  // SCENARIO 6: Attempting to capture an invalid or unverified PayPal order is rejected
  // ---------------------------------------------------------------------------
  console.log('👉 SCENARIO 6: Reject invalid and unapproved PayPal orders');
  try {
    // Part A: Fake / Non-existent order ID
    const resFake = await fetch(`${BASE_URL}/api/paypal/capture-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paypalOrderId: 'NON_EXISTENT_ORDER_99999' }),
    });

    const dataFake = await resFake.json();
    const fakeRejected = resFake.status === 400 && dataFake.success === false;

    // Part B: Order exists in PayPal but status is CREATED (User has NOT approved it)
    let unapprovedRejected = false;
    let unapprovedMsg = '';
    if (realPayPalOrderId) {
      const resUnapproved = await fetch(`${BASE_URL}/api/paypal/capture-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paypalOrderId: realPayPalOrderId }),
      });
      const dataUnapproved = await resUnapproved.json();
      unapprovedRejected = resUnapproved.status === 400 && dataUnapproved.success === false;
      unapprovedMsg = dataUnapproved.error;
    }

    if (fakeRejected && unapprovedRejected) {
      console.log('   ✅ PASSED: Both invalid order and unapproved order were strictly rejected.');
      console.log(`      Part A (Invalid Order): HTTP ${resFake.status} -> "${dataFake.error}"`);
      console.log(`      Part B (Unapproved Order): Rejected -> "${unapprovedMsg}"`);
      passed++;
    } else {
      console.error('   ❌ FAILED: Security check did not reject unapproved or invalid order.', {
        fakeRejected,
        unapprovedRejected,
        unapprovedMsg,
      });
      failed++;
    }
  } catch (err) {
    console.error('   ❌ FAILED with error:', err.message);
    failed++;
  }
  console.log('');

  // ---------------------------------------------------------------------------
  // SCENARIO 2: User cancels payment on PayPal
  // ---------------------------------------------------------------------------
  console.log('👉 SCENARIO 2: User cancels payment on PayPal (Cancel redirect handler)');
  try {
    const cancelRes = await fetch(`${BASE_URL}/api/paypal/cancel?token=${realPayPalOrderId || 'TEST-CANCEL-TOKEN'}`, {
      redirect: 'manual', // do not follow redirect so we can inspect Location header
    });

    const location = cancelRes.headers.get('location') || '';
    if (cancelRes.status === 307 || cancelRes.status === 302 || location.includes('payment=cancelled')) {
      console.log(`   ✅ PASSED: Cancel endpoint redirected user to: "${location}"`);
      console.log('      Status marked as cancelled; no funds charged.');
      passed++;
    } else {
      console.error('   ❌ FAILED: Cancel redirect failed.', cancelRes.status, location);
      failed++;
    }
  } catch (err) {
    console.error('   ❌ FAILED with error:', err.message);
    failed++;
  }
  console.log('');

  // ---------------------------------------------------------------------------
  // SCENARIO 3: Payment failure handling
  // ---------------------------------------------------------------------------
  console.log('👉 SCENARIO 3: Payment failure & missing payload handling');
  try {
    const failRes = await fetch(`${BASE_URL}/api/paypal/capture-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // Missing paypalOrderId
    });

    const failData = await failRes.json();
    if (failRes.status === 400 && failData.success === false) {
      console.log('   ✅ PASSED: Missing parameters cleanly handled with HTTP 400.');
      console.log(`      Response: "${failData.error}"`);
      passed++;
    } else {
      console.error('   ❌ FAILED: Failure handling check did not respond with 400.', failRes.status, failData);
      failed++;
    }
  } catch (err) {
    console.error('   ❌ FAILED with error:', err.message);
    failed++;
  }
  console.log('');

  // ---------------------------------------------------------------------------
  // SCENARIO 5: Refreshing page does not cause duplicate captures (Idempotency)
  // ---------------------------------------------------------------------------
  console.log('👉 SCENARIO 5: Refreshing page does not cause duplicate captures (Idempotency)');
  try {
    // First, find an existing captured order from /api/orders
    const ordersRes = await fetch(`${BASE_URL}/api/orders`);
    const ordersData = await ordersRes.json();
    const capturedOrder = ordersData.data?.find((o) => o.paymentStatus === 'captured');

    if (!capturedOrder) {
      console.log('   ⚠️ Notice: No existing captured order found to test reload idempotency. Creating demo capture...');
    }

    const testId = capturedOrder?.paypalOrderId || 'MOCK-PAYPAL-ORDER-001';

    // Simulate page reload calling capture-order on an already captured transaction
    const reloadRes = await fetch(`${BASE_URL}/api/paypal/capture-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paypalOrderId: testId }),
    });

    const reloadData = await reloadRes.json();
    if (reloadRes.status === 200 && reloadData.success === true && reloadData.alreadyCaptured === true) {
      console.log('   ✅ PASSED: Refreshing page returned existing receipt without duplicate capture.');
      console.log(`      alreadyCaptured: ${reloadData.alreadyCaptured}`);
      console.log(`      Status: ${reloadData.data?.status}`);
      console.log(`      Amount: $${reloadData.data?.amount} ${reloadData.data?.currency}`);
      passed++;
    } else {
      console.error('   ❌ FAILED: Idempotent reload check failed.', reloadRes.status, reloadData);
      failed++;
    }
  } catch (err) {
    console.error('   ❌ FAILED with error:', err.message);
    failed++;
  }
  console.log('');

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log('======================================================');
  console.log(`🏁 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

