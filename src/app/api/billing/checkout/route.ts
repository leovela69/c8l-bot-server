import { NextResponse } from 'next/server';
import { getStripe, isStripeActivated } from '../../../../lib/stripe';

// Países de la Unión Europea (códigos ISO 3166-1 alpha-2)
const EU_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'HR', 
  'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 
  'SI', 'SK', 'GR', 'EL'
]);

function calculateVAT(country: string, baseAmount: number, euVatNumber?: string): { vatRate: number; vatAmount: number; taxRule: string } {
  const countryUpper = (country || 'ES').trim().toUpperCase();
  const euVatClean = (euVatNumber || '').trim();

  // 1. España
  if (countryUpper === 'ES') {
    return { vatRate: 21, vatAmount: Number((baseAmount * 0.21).toFixed(2)), taxRule: 'IVA Español General (21%)' };
  }

  // 2. Unión Europea (excepto España)
  if (EU_COUNTRIES.has(countryUpper)) {
    if (euVatClean && euVatClean.length >= 5) {
      return { vatRate: 0, vatAmount: 0, taxRule: 'IVA Intracomunitario 0% (NIF-IVA Validado)' };
    } else {
      return { vatRate: 21, vatAmount: Number((baseAmount * 0.21).toFixed(2)), taxRule: 'IVA Español 21% (Intracomunitario sin NIF-IVA)' };
    }
  }

  // 3. Fuera de la UE (Exportaciones)
  return { vatRate: 0, vatAmount: 0, taxRule: 'Exportación exenta de IVA 0% (Fuera de UE)' };
}

export async function POST(req: Request) {
  try {
    const { userId, taxId, name, address, country, euVatNumber } = await req.json();

    if (!userId || !taxId || !name || !address || !country) {
      return NextResponse.json({ error: 'Faltan campos obligatorios para facturación (userId, taxId, name, address, country)' }, { status: 400 });
    }

    const baseAmount = 19.99; // Precio de la suscripción Premium
    const { vatRate, vatAmount, taxRule } = calculateVAT(country, baseAmount, euVatNumber);
    const totalAmount = baseAmount + vatAmount;

    // A. MODO MOCK (Simulado para Leo Vela, NO cobra nada)
    if (!isStripeActivated) {
      // Retornar un mock checkout URL interactivo
      const mockCheckoutUrl = `/billing/checkout-mock?userId=${encodeURIComponent(userId)}&taxId=${encodeURIComponent(taxId)}&name=${encodeURIComponent(name)}&address=${encodeURIComponent(address)}&country=${encodeURIComponent(country)}&euVatNumber=${encodeURIComponent(euVatNumber || '')}&baseAmount=${baseAmount}&vatRate=${vatRate}&vatAmount=${vatAmount}&totalAmount=${totalAmount}&taxRule=${encodeURIComponent(taxRule)}`;
      
      return NextResponse.json({
        success: true,
        mode: 'mock',
        url: mockCheckoutUrl,
        message: 'Modo simulación activo. Redirigiendo a pasarela mock.'
      });
    }

    // B. MODO REAL (Stripe Checkout)
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe no configurado correctamente.' }, { status: 500 });
    }

    // El precio en centavos para Stripe
    const stripeUnitAmount = Math.round(totalAmount * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'C8L Music IA Premium',
              description: `Suscripción Premium C8L Agency - ${taxRule}`,
            },
            unit_amount: stripeUnitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin-c8l-control?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin-c8l-control?payment=cancelled`,
      metadata: {
        userId,
        taxId,
        name,
        address,
        country,
        euVatNumber: euVatNumber || '',
        baseAmount: baseAmount.toString(),
        vatRate: vatRate.toString(),
        vatAmount: vatAmount.toString(),
        totalAmount: totalAmount.toString(),
        taxRule
      }
    });

    return NextResponse.json({
      success: true,
      mode: 'live',
      url: session.url
    });

  } catch (error: any) {
    console.error('Error in checkout route:', error);
    return NextResponse.json({ error: error.message || 'Error del servidor' }, { status: 500 });
  }
}
