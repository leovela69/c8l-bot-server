import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key';

export const isStripeActivated = process.env.NEXT_PUBLIC_STRIPE_ACTIVATED === 'true';

let stripeInstance: Stripe | null = null;

if (isStripeActivated) {
  try {
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-01-27.accredited-beta' as any, // Utiliza el apiVersion seguro o castea para evitar errores de TS
      typescript: true,
    });
  } catch (error) {
    console.error('Error al inicializar Stripe en modo activo:', error);
  }
}

export const getStripe = (): Stripe | null => {
  if (!isStripeActivated) return null;
  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-01-27.accredited-beta' as any,
      typescript: true,
    });
  }
  return stripeInstance;
};
