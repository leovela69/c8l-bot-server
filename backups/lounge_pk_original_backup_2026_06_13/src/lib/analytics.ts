// lib/analytics.ts
import posthog from 'posthog-js';

export const trackEvent = (name: string, properties?: any) => {
  if (typeof window !== 'undefined') {
    posthog.capture(name, properties);
  }
};

// Uso en componentes:
trackEvent('cover_uploaded', { duration: 120, genre: 'pop' });
trackEvent('gift_sent', { gift_type: 'rose', receiver_id: '...' });