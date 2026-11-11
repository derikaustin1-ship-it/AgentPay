// src/lib/test-rewards-info.js
// Automated verification of PayPal Rewards intelligence and regional gating

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('🎁 AGENTPAY: PAYPAL REWARDS INTELLIGENCE TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: US Rewards Eligibility
  try {
    process.stdout.write('👉 TEST 1: US country returns eligible rewards status... ');
    const res = await fetch(`${BASE_URL}/api/rewards/info?countryCode=US`);
    const json = await res.json();
    if (!res.ok || !json.success || !json.data.isEligible || json.data.status !== 'eligible') {
      throw new Error('US should be marked as eligible');
    }
    if (!json.data.officialTermsUrl.includes('paypal-rewards')) {
      throw new Error('Official terms URL is missing or invalid');
    }
    console.log(`✅ PASSED (${json.data.headline})`);
    passed++;
  } catch (err) {
    console.log(`❌ FAILED: ${err.message}`);
    failed++;
  }

  // Test 2: India Rewards Ineligibility
  try {
    process.stdout.write('👉 TEST 2: India country returns unsupported status honestly... ');
    const res = await fetch(`${BASE_URL}/api/rewards/info?countryCode=IN`);
    const json = await res.json();
    if (!res.ok || !json.success || json.data.isEligible !== false || json.data.status !== 'unsupported') {
      throw new Error('India should be marked as unsupported');
    }
    console.log(`✅ PASSED (${json.data.headline})`);
    passed++;
  } catch (err) {
    console.log(`❌ FAILED: ${err.message}`);
    failed++;
  }

  // Test 3: No Fabricated Balance Verification
  try {
    process.stdout.write('👉 TEST 3: Rewards payload contains zero fabricated numerical balances... ');
    const res = await fetch(`${BASE_URL}/api/rewards/info?countryCode=US`);
    const json = await res.json();
    if ('pointsBalance' in json.data || 'currentPoints' in json.data) {
      throw new Error('Fabricated points balance detected! Integrity rule violated.');
    }
    console.log('✅ PASSED (Strict fintech integrity preserved)');
    passed++;
  } catch (err) {
    console.log(`❌ FAILED: ${err.message}`);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`🏁 REWARDS INTELLIGENCE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');
}

runTests();

