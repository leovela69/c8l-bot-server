export const dynamic = 'force-static';
// app/api/wallet/convert/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: Request) {
    const { userId, fromCurrency, toCurrency, amount } = await req.json();

    // 1. Obtener wallets del usuario
    const { data: wallet, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error || !wallet) return NextResponse.json({ error: 'Wallet no encontrada' }, { status: 404 });

    // 2. Obtener tasa de cambio fija
    const { data: fromCurrencyData } = await supabase.from('currency_types').select('id').eq('code', fromCurrency).single();
    const { data: toCurrencyData } = await supabase.from('currency_types').select('id').eq('code', toCurrency).single();

    if (!fromCurrencyData || !toCurrencyData) {
        return NextResponse.json({ error: 'Monedas de origen o destino no válidas' }, { status: 400 });
    }

    const { data: rateData, error: rateError } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('from_currency_id', fromCurrencyData.id)
        .eq('to_currency_id', toCurrencyData.id)
        .single();

    if (rateError || !rateData) return NextResponse.json({ error: 'Tasa de cambio no encontrada' }, { status: 404 });

    // 3. Verificar si el usuario tiene saldo suficiente
    if (wallet[`${fromCurrency.toLowerCase()}_balance`] < amount) {
        return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 400 });
    }

    const convertedAmount = amount * rateData.rate;

    // 4. Actualizar saldos en la base de datos
    const { error: updateError } = await supabase.rpc('convert_currency', {
        p_user_id: userId,
        p_from_currency: fromCurrency,
        p_to_currency: toCurrency,
        p_amount: amount,
        p_converted_amount: convertedAmount
    });

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    return NextResponse.json({ success: true, convertedAmount });
}