import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import AdminReports from '@/components/admin/AdminReports';
import AdminSubmissions from '@/components/admin/AdminSubmissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: '트릴리언 관리자' };

type Report = { id: number; target_name: string; reason: string; content: string | null; status: string; created_at: string };
type Submission = { id: number; room_name: string; company_name: string | null; platform: string; homepage: string; fss_matched: boolean; status: string; created_at: string };

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

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
  const { data: reportsData } = await admin.from('room_reports').select('*').order('created_at', { ascending: false }).limit(1000);
  const { data: subsData } = await admin.from('room_submissions').select('*').order('created_at', { ascending: false }).limit(1000);
  const reports = (reportsData ?? []) as Report[];
  const subs = (subsData ?? []) as Submission[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-bold text-unjong-primary">트릴리언 관리자</h1>
      <p className="mb-8 mt-1 text-sm text-unjong-muted">신고·자가등록 접수 현황 · 최신순</p>

      {/* 신고 */}
      <section className="mb-12">
        <h2 className="mb-3 text-base font-bold text-unjong-primary">🚨 신고 ({reports.length})</h2>
        <AdminReports initial={reports} />
      </section>

      {/* 자가등록 */}
      <section>
        <h2 className="mb-3 text-base font-bold text-unjong-primary">📝 자가등록 ({subs.length}) · 대기는 승인해야 공개</h2>
        <AdminSubmissions initial={subs} />
      </section>
    </div>
  );
}
