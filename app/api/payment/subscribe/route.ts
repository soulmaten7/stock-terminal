import { NextRequest, NextResponse } from 'next/server';
import { issueBillingKey, chargeBilling, PLANS, PlanKey } from '@/lib/payment';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const { authKey, customerKey, plan } = await request.json();
    if (!authKey || !customerKey || !plan) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const planInfo = PLANS[plan as PlanKey];
    if (!planInfo || planInfo.price === 0) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const billingResult = await issueBillingKey(authKey, customerKey);
    if (billingResult.code) {
      return NextResponse.json({ error: billingResult.message }, { status: 400 });
    }

    const billingKey = billingResult.billingKey;
    const orderId = `SUB-${customerKey}-${Date.now()}`;

    const chargeResult = await chargeBilling(billingKey, customerKey, planInfo.price, orderId, `StockTerminal ${planInfo.name}`);
    if (chargeResult.code) {
      return NextResponse.json({ error: chargeResult.message }, { status: 400 });
    }

    await supabase.from('users').update({
      role: plan,
      subscription_status: 'active',
      billing_key: billingKey,
    }).eq('id', customerKey);

    await supabase.from('payments').insert({
      user_id: customerKey,
      payment_type: 'subscription',
      amount: planInfo.price,
      payment_method: chargeResult.method,
      payment_key: chargeResult.paymentKey,
      order_id: orderId,
      status: 'completed',
    });

    return NextResponse.json({ success: true, plan, paymentKey: chargeResult.paymentKey });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
