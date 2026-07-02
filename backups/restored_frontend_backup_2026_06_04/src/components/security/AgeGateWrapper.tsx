'use client';
import React, { useState, useEffect } from 'react';
import { AgeGate } from './AgeGate';

export function AgeGateWrapper({ children }: { children: React.ReactNode }) {
  // Start as true to avoid flash — corrected after mount
  const [ageVerified, setAgeVerified] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const localVal = window.localStorage ? window.localStorage.getItem('age_verified') : null;
        const sessionVal = window.sessionStorage ? window.sessionStorage.getItem('age_verified') : null;
        const verified = localVal || sessionVal;
        
        console.log('[C8L AgeGateWrapper] Checking status:', { localVal, sessionVal, verified });
        
        if (verified !== 'true') {
          setAgeVerified(false);
        }
      } catch (e) {
        console.error('[C8L AgeGateWrapper] Error reading age_verified status from storage:', e);
        // Fallback to false if storage fails so they can verify and enter
        setAgeVerified(false);
      }
    }
  }, []);

  const handleVerified = () => {
    console.log('[C8L AgeGateWrapper] Age verified successfully. Saving to storage...');
    if (typeof window !== 'undefined') {
      try {
        if (window.localStorage) {
          window.localStorage.setItem('age_verified', 'true');
        }
      } catch (e) {
        console.error('[C8L AgeGateWrapper] Error writing to localStorage:', e);
      }
      try {
        if (window.sessionStorage) {
          window.sessionStorage.setItem('age_verified', 'true');
        }
      } catch (e) {
        console.error('[C8L AgeGateWrapper] Error writing to sessionStorage:', e);
      }
    }
    setAgeVerified(true);
  };

  return (
    <>
      {children}
      {mounted && !ageVerified && (
        <AgeGate onVerified={handleVerified} />
      )}
    </>
  );
}
