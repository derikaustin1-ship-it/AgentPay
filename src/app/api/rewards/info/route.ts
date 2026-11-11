// src/app/api/rewards/info/route.ts
// API route providing verified PayPal Rewards intelligence and regional eligibility

import { NextResponse } from 'next/server';
import { getRewardsEligibility } from '@/lib/rewards-info';
import { getCountryByCode } from '@/lib/countries';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get('countryCode') || 'US';
    const country = getCountryByCode(countryCode);

    const data = getRewardsEligibility(country.code, country.name);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching rewards info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve rewards information' },
      { status: 500 }
    );
  }
}
