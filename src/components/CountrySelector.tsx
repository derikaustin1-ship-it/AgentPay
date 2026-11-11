// src/components/CountrySelector.tsx
// Modal for global country selection and automatic currency localisation

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { COUNTRIES, CountryConfig, DEFAULT_COUNTRY } from '@/lib/countries';
import { SearchIcon, XIcon, CheckIcon, GlobeIcon, AlertTriangleIcon, InfoIcon } from './Icons';

export default function CountrySelector() {
  const { state, saveUserPreferences, closeCountrySelector } = useApp();
  const { showCountrySelector, userPreferences } = state;

  const [search, setSearch] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(
    userPreferences?.countryCode || DEFAULT_COUNTRY.code
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userPreferences?.countryCode) {
      setSelectedCountryCode(userPreferences.countryCode);
    }
  }, [userPreferences]);

  // Close on Escape key if user already has a saved country preference
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && showCountrySelector && userPreferences) {
        closeCountrySelector();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCountrySelector, userPreferences, closeCountrySelector]);

  const filteredCountries = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.currencyCode.toLowerCase().includes(q)
    );
  }, [search]);

  if (!showCountrySelector) return null;

  const selectedCountry = COUNTRIES.find((c) => c.code === selectedCountryCode) || DEFAULT_COUNTRY;
  const isFirstVisit = !userPreferences;

  async function handleConfirm() {
    setIsSaving(true);
    try {
      await saveUserPreferences(selectedCountry.code, selectedCountry.currencyCode);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="country-selector-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-50 to-blue-50/30">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <GlobeIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 id="country-selector-title" className="text-lg sm:text-xl font-bold text-slate-900">
                {isFirstVisit ? 'Welcome to AgentPay: Select Your Country' : 'Country & Currency Settings'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Prices and AI recommendations will be automatically localized to your chosen currency.
              </p>
            </div>
          </div>
          {!isFirstVisit && (
            <button
              type="button"
              onClick={closeCountrySelector}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <XIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search country name, code, or currency (e.g., India, EUR, GBP)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900 placeholder-slate-400"
              autoFocus
            />
          </div>
        </div>

        {/* Country Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-slate-100 space-y-1">
          {filteredCountries.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              No matching countries found for &ldquo;{search}&rdquo;.
            </div>
          ) : (
            filteredCountries.map((country: CountryConfig) => {
              const isSelected = country.code === selectedCountryCode;
              return (
                <div
                  key={country.code}
                  onClick={() => setSelectedCountryCode(country.code)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50 border border-blue-200 text-slate-900 shadow-xs'
                      : 'hover:bg-slate-50 border border-transparent text-slate-700'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedCountryCode(country.code);
                    }
                  }}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="text-2xl shrink-0" role="img" aria-label={country.name}>
                      {country.flag}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-slate-900 truncate">
                          {country.name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 font-medium text-slate-600">
                          {country.code}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-500">
                        <span className="font-medium text-slate-700">
                          {country.currencyCode} ({country.currencySymbol})
                        </span>
                        {country.paypalDomesticUnavailable && (
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded text-[11px] flex items-center gap-1 font-medium border border-amber-200">
                            Domestic PayPal restricted
                          </span>
                        )}
                        {!country.paypalSupportedCurrency && !country.paypalDomesticUnavailable && (
                          <span className="text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded text-[11px]">
                            Converts to USD at checkout
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 ml-3">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <CheckIcon className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-slate-300" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Country Notice Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50">
          {selectedCountry.paypalDomesticUnavailable && (
            <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-2.5 text-xs text-amber-900">
              <AlertTriangleIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">PayPal India Domestic Restriction Notice:</span>
                <p className="mt-0.5 text-amber-800">
                  Per RBI and PayPal India regulations, direct INR domestic merchant payments between Indian accounts are not supported. For demo testing, sandbox checkouts will execute seamlessly in USD equivalent.
                </p>
              </div>
            </div>
          )}

          {!selectedCountry.paypalSupportedCurrency && !selectedCountry.paypalDomesticUnavailable && (
            <div className="mb-3 p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-start space-x-2.5 text-xs text-blue-900">
              <InfoIcon className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Checkout Currency Information:</span>
                <p className="mt-0.5 text-blue-800">
                  {selectedCountry.currencyCode} is supported for local display and price comparisons. PayPal Sandbox checkout authorization will be processed in USD.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Selected: <span className="font-bold text-slate-900">{selectedCountry.flag} {selectedCountry.name} ({selectedCountry.currencyCode})</span>
            </div>

            <div className="flex items-center space-x-2">
              {!isFirstVisit && (
                <button
                  type="button"
                  onClick={closeCountrySelector}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Saving...' : isFirstVisit ? 'Confirm & Enter Store' : 'Save Preference'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
