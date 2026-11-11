// src/app/api/user/preferences/route.ts
// API route to get and update user country and currency preferences

import { NextResponse } from 'next/server';
import { getUserPreference, updateUserPreference } from '@/lib/database';
import { getCountryByCode } from '@/lib/countries';

const DEMO_USER_ID = 'demo-user-1';

export async function GET() {
  try {
    const pref = getUserPreference(DEMO_USER_ID);
    if (!pref) {
      return NextResponse.json({
        success: true,
        data: null, // First visit indicator
      });
    }

    const country = getCountryByCode(pref.country_code);

    return NextResponse.json({
      success: true,
      data: {
        countryCode: pref.country_code,
        currencyCode: pref.currency_code,
        country,
        updatedAt: pref.updated_at,
      },
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve preferences' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { countryCode, currencyCode } = body;

    if (!countryCode || !currencyCode) {
      return NextResponse.json(
        { success: false, error: 'Both countryCode and currencyCode are required' },
        { status: 400 }
      );
    }

    const country = getCountryByCode(countryCode);
    const updated = updateUserPreference(
      DEMO_USER_ID,
      country.code,
      currencyCode.toUpperCase()
    );

    return NextResponse.json({
      success: true,
      data: {
        countryCode: updated.country_code,
        currencyCode: updated.currency_code,
        country,
        updatedAt: updated.updated_at,
      },
    });
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
