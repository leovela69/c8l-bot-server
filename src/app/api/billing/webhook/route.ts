import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase/client';
import { getStripe, isStripeActivated } from '../../../../lib/stripe';

// Helper to get next sequential invoice number in TS
async function getNextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear().toString();
  const prefix = `C8L-${year}-`;
  
  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .like('invoice_number', `${prefix}%`);
      
    const count = invoices ? invoices.length : 0;
    const nextNum = (count + 1).toString().padStart(4, '0');
    return `${prefix}${nextNum}`;
  } catch (err) {
    console.error('Error fetching sequential invoice number:', err);
    return `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
  }
}

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');

  let metadata: any = null;
  let paymentIntentId = 'mock_pi_' + Math.random().toString(36).substring(7);

  // A. MODO REAL: Procesar webhook de Stripe
  if (isStripeActivated && signature) {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe client loading error' }, { status: 500 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err: any) {
      console.error('Stripe webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Firma de webhook inválida' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      metadata = session.metadata;
      paymentIntentId = session.payment_intent || paymentIntentId;
    } else {
      return NextResponse.json({ received: true });
    }
  } 
  // B. MODO MOCK: Permitir simulación desde la interfaz de usuario
  else {
    try {
      const parsedBody = JSON.parse(payload);
      if (parsedBody.isMockTrigger) {
        metadata = parsedBody.metadata;
        paymentIntentId = parsedBody.paymentIntentId || paymentIntentId;
      } else {
        return NextResponse.json({ error: 'Sin firma de Stripe' }, { status: 400 });
      }
    } catch (err) {
      return NextResponse.json({ error: 'Cuerpo de petición no válido para simulación' }, { status: 400 });
    }
  }

  // C. PROCESAR METADATOS DE COMPRA E INVOICE
  if (metadata) {
    const { userId, taxId, name, address, country, euVatNumber, baseAmount, vatRate, vatAmount, totalAmount } = metadata;

    try {
      // 1. Promocionar usuario a Premium
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ plan: 'premium' })
        .eq('id', userId);

      if (userUpdateError) {
        console.error('Error upgrading user plan in webhook:', userUpdateError);
      }

      // 2. Generar número secuencial de factura
      const invoiceNumber = await getNextInvoiceNumber();

      // 3. Crear registro de factura
      const { error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          user_id: userId,
          stripe_payment_intent_id: paymentIntentId,
          tax_id: taxId,
          name: name,
          address: address,
          country: country,
          eu_vat_number: euVatNumber || null,
          concept: 'Suscripción Premium C8L Music IA',
          base_amount: parseFloat(baseAmount),
          vat_rate: parseFloat(vatRate),
          vat_amount: parseFloat(vatAmount),
          total_amount: parseFloat(totalAmount)
        });

      if (invoiceError) {
        console.error('Error inserting invoice in database:', invoiceError);
        return NextResponse.json({ error: 'Error al registrar factura en base de datos' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Plan de usuario actualizado e Invoice registrada con éxito.',
        invoice_number: invoiceNumber
      });

    } catch (err: any) {
      console.error('Error processing checkout session webhook:', err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: false });
}
