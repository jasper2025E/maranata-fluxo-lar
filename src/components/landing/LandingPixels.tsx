import { useEffect } from "react";

interface LandingPixelsProps {
  utmParams: {
    source: string | null;
    medium: string | null;
    campaign: string | null;
    term: string | null;
    content: string | null;
  };
}

// This component handles pixel tracking for marketing
export function LandingPixels({ utmParams }: LandingPixelsProps) {
  useEffect(() => {
    // Store UTM params in sessionStorage for later use
    if (Object.values(utmParams).some(v => v !== null)) {
      sessionStorage.setItem('utm_params', JSON.stringify(utmParams));
    }

    // Track PageView event
    trackEvent('PageView');
  }, []);

  return null;
}

// Utility function to track events - can be extended to call actual pixel APIs
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  const win = window as unknown as Record<string, unknown>;

  // Meta Pixel
  if (typeof win.fbq === 'function') {
    (win.fbq as (action: string, event: string, params?: unknown) => void)('track', eventName, params);
  }

  // Google Analytics / gtag
  if (typeof win.gtag === 'function') {
    (win.gtag as (...args: unknown[]) => void)('event', eventName, params);
  }

  // TikTok Pixel
  if (win.ttq && typeof (win.ttq as { track?: unknown }).track === 'function') {
    ((win.ttq as { track: (event: string, params?: unknown) => void }).track)(eventName, params);
  }

  // Log for development
  if (import.meta.env.DEV) {
    console.log(`[Pixel Event] ${eventName}`, params);
  }
}

// Pre-defined event functions
export const trackLeadStart = () => trackEvent('Lead', { content_category: 'inscricao_iniciada' });
export const trackInitiateCheckout = (value: number) => trackEvent('InitiateCheckout', { value, currency: 'BRL' });
export const trackPurchase = (value: number, transactionId: string) => trackEvent('Purchase', { 
  value, 
  currency: 'BRL', 
  transaction_id: transactionId 
});
