// src/lib/test-country-currency.js
// Automated test script for Country, Currency, and Live Exchange Rate features

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('🌍 AGENTPAY: GLOBAL COUNTRY & CURRENCY VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Exchange Rates API
  try {
    process.stdout.write('👉 TEST 1: Live Exchange Rates API returns valid rates and source... ');
    const res = await fetch(`${BASE_URL}/api/exchange-rates`);
    const json = await res.json();
    if (!res.ok || !json.success || !json.data.rates || !json.data.rates.EUR || !json.data.rates.INR) {
      throw new Error('Invalid exchange rates response payload');
    }
    console.log(`✅ PASSED (USD/EUR: ${json.data.rates.EUR}, USD/INR: ${json.data.rates.INR}, Source: ${json.data.source})`);
    passed++;
  } catch (err) {
    console.log(`❌ FAILED: ${err.message}`);
    failed++;
  }

  // Test 2: User Preference Update (Set to India INR)
  try {
    process.stdout.write('👉 TEST 2: Save and persist user country & currency (India / INR)... ');
    const postRes = await fetch(`${BASE_URL}/api/user/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countryCode: 'IN', currencyCode: 'INR' }),
    });
    const postJson = await postRes.json();
    if (!postRes.ok || !postJson.success || postJson.data.countryCode !== 'IN' || postJson.data.currencyCode !== 'INR') {
      throw new Error('Failed to update user preference');
    }

    const getRes = await fetch(`${BASE_URL}/api/user/preferences`);
    const getJson = await getRes.json();
    if (!getRes.ok || !getJson.success || getJson.data.countryCode !== 'IN') {
      throw new Error('Persisted preference does not match updated country');
    }
    console.log(`✅ PASSED (Persisted country: ${getJson.data.country.name}, Currency: ${getJson.data.currencyCode}, Flag: ${getJson.data.country.flag})`);
    passed++;
  } catch (err) {
    console.log(`❌ FAILED: ${err.message}`);
    failed++;
  }

  // Test 3: India Domestic PayPal Gating Flag
  try {
    process.stdout.write('👉 TEST 3: India country profile surfaces PayPal domestic limitation... ');
    const res = await fetch(`${BASE_URL}/api/user/preferences`);
    const json = await res.json();
    if (!json.data.country.paypalDomesticUnavailable) {
      throw new Error('paypalDomesticUnavailable flag is missing for India');
    }
    console.log('✅ PASSED (paypalDomesticUnavailable: true verified)');
    passed++;
  } catch (err) {
    console.log(`❌ FAILED: ${err.message}`);
    failed++;
  }

  // Test 4: Reset User Preference to US / USD
  try {
    process.stdout.write('👉 TEST 4: Revert user country to US / USD... ');
    const res = await fetch(`${BASE_URL}/api/user/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countryCode: 'US', currencyCode: 'USD' }),
    });
    const json = await res.json();
    if (!res.ok || !json.success || json.data.countryCode !== 'US') {
      throw new Error('Failed to reset preference to US');
    }
    console.log('✅ PASSED');
    passed++;
  } catch (err) {
    console.log(`❌ FAILED: ${err.message}`);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`🏁 COUNTRY & CURRENCY SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');
}

runTests();

