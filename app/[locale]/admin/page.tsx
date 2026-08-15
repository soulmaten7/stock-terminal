import { redirect } from '@/i18n/navigation';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import AdminAdInquiries from '@/components/admin/AdminAdInquiries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: '트릴리언 관리자' };

type AdInquiry = { id: number; slot: string | null; company: string; contact_name: string | null; email: string | null; phone: string | null; message: string | null; status: string; created_at: string };

export default async function AdminPage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect({ href: '/auth/login', locale });

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (me?.role !== 'admin') {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-lg font-bold text-unjong-primary">접근 권한이 없습니다</p>
        <p className="mt-2 text-sm text-unjong-muted">관리자만 볼 수 있는 페이지예요.</p>
      </div>
    );
  }

  const admin = createAdminClient();

  // 광고 문의(ad_inquiries)
  const { data: inquiriesData } = await admin.from('ad_inquiries').select('*').order('created_at', { ascending: false }).limit(500);
  const inquiries = (inquiriesData ?? []) as AdInquiry[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-bold text-unjong-primary">트릴리언 관리자</h1>

      {/* STEP1035: 업체 클레임·신고 큐(리딩방·유사투자자문)는 spinoff/advisor-directory로 분리·삭제.
          광고 문의만 남는다 — 큐가 하나뿐이라 탭 없이 바로 렌더. */}
      <section className="mt-4">
        <h2 className="mb-1.5 text-xs font-medium text-unjong-muted">광고 문의 ({inquiries.length})</h2>
        <AdminAdInquiries initial={inquiries} />
      </section>
    </div>
  );
}
