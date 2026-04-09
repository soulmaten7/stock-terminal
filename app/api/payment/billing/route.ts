import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'Toss Payments not configured' }, { status: 500 });
  }

  try {
    const { paymentKey, orderId, amount, userId, months } = await request.json();

    // 토스페이먼츠 결제 승인
    const res = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const paymentResult = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: paymentResult.message || 'Payment failed' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 결제 내역 기록
    await supabase.from('payments').insert({
      user_id: userId,
      payment_type: 'subscription',
      amount,
      payment_method: paymentResult.method,
      payment_key: paymentKey,
      order_id: orderId,
      status: 'completed',
    });

    // 사용자 구독 업데이트
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (months || 1));

    await supabase.from('users').update({
      role: 'premium',
      subscription_status: 'active',
      subscription_start_date: startDate.toISOString(),
      subscription_end_date: endDate.toISOString(),
    }).eq('id', userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 });
  }
}
