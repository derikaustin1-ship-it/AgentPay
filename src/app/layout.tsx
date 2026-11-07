// src/app/layout.tsx
import type { Metadata } from 'next';
import { AppProvider } from '@/context/AppContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'AgentPay — AI-Powered Agentic Shopping & Secure Payment Assistant',
  description: 'Find smarter. Spend safer. Shop with confidence. AI product discovery with PayPal Sandbox payments and automated budget protection.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
