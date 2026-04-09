import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'Payment not configured' }, { status: 500 });
  }

  try {
    const { paymentKey, orderId, amount, userId, bannerId } = await request.json();

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
      return NextResponse.json({ error: paymentResult.message }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 결제 기록
    await supabase.from('payments').insert({
      user_id: userId,
      payment_type: 'banner',
      amount,
      payment_method: paymentResult.method,
      payment_key: paymentKey,
      order_id: orderId,
      status: 'completed',
      banner_id: bannerId,
    });

    // 배너 활성화
    await supabase.from('banners').update({
      payment_status: 'paid',
      is_active: true,
    }).eq('id', bannerId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Banner payment failed' }, { status: 500 });
  }
}
