import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { advertiserType, companyName, bizNumber, repName, phone, email } = body;

    const { data, error } = await supabase.from('advertisers').insert({
      user_id: user.id,
      advertiser_type: advertiserType,
      company_name: companyName,
      business_registration_number: bizNumber,
      representative_name: repName,
      contact_phone: phone,
      contact_email: email,
      is_approved: advertiserType === 'general',
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
