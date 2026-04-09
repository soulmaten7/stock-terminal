import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, data } = body;

    const supabase = createAdminClient();

    switch (eventType) {
      case 'BILLING_KEY_ISSUED':
        // 빌링키 발급 완료
        await supabase.from('users').update({
          billing_key: data.billingKey,
        }).eq('id', data.customerKey);
        break;

      case 'PAYMENT_STATUS_CHANGED':
        // 결제 상태 변경
        if (data.status === 'DONE') {
          await supabase.from('payments').update({
            status: 'completed',
          }).eq('payment_key', data.paymentKey);
        }
        break;

      default:
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
