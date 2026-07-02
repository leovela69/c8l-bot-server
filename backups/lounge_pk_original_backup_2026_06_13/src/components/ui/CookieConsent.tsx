// components/ui/CookieConsent.tsx
import CookieConsent from 'react-cookie-consent';

export function CookieBanner() {
  return (
    <CookieConsent
      location="bottom"
      buttonText="Aceptar"
      cookieName="c8l_cookie_consent"
      style={{ background: '#000', borderTop: '2px solid #D4AF37' }}
      buttonStyle={{ background: '#D4AF37', color: '#000', fontWeight: 'bold' }}
    >
      Usamos cookies para mejorar tu experiencia. Al continuar aceptas nuestra{' '}
      <a href="/privacy" style={{ color: '#D4AF37' }}>Política de privacidad</a>.
    </CookieConsent>
  );
}