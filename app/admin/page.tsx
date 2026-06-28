import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import AdminReports from '@/components/admin/AdminReports';
import AdminBusinessClaims from '@/components/admin/AdminBusinessClaims';
import AdminFssLookup from '@/components/admin/AdminFssLookup';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: '트릴리언 관리자' };

type Report = { id: number; target_name: string; reason: string; content: string | null; status: string; created_at: string };
type BizClaim = { id: string; biz_no: string; company_name: string; representative: string | null; contact: string | null; nts_valid: string | null; start_dt: string | null; doc_signed: string | null; status: string; created_at: string };

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
  const reports = (reportsData ?? []) as Report[];

  // 업체 인증 신청(클레임) + 업체명 매핑 + 서류 서명 URL
  const { data: claimsData } = await admin.from('business_claims').select('id, biz_no, contact, doc_url, status, created_at, nts_valid, start_dt').order('created_at', { ascending: false }).limit(500);
  const claimRows = claimsData ?? [];
  const claimBizNos = [...new Set(claimRows.map((c) => c.biz_no as string))];
  const nameMap: Record<string, string> = {};
  const repMap: Record<string, string | null> = {};
  if (claimBizNos.length) {
    const { data: bizes } = await admin.from('fss_advisors').select('biz_no, company_name, representative').in('biz_no', claimBizNos);
    for (const b of bizes ?? []) { nameMap[b.biz_no as string] = b.company_name as string; repMap[b.biz_no as string] = (b.representative as string) ?? null; }
  }
  const claims: BizClaim[] = [];
  for (const c of claimRows) {
    let doc_signed: string | null = null;
    if (c.doc_url) {
      const { data: sig } = await admin.storage.from('business-docs').createSignedUrl(c.doc_url as string, 3600);
      doc_signed = sig?.signedUrl ?? null;
    }
    claims.push({ id: c.id as string, biz_no: c.biz_no as string, company_name: nameMap[c.biz_no as string] ?? (c.biz_no as string), representative: repMap[c.biz_no as string] ?? null, contact: (c.contact as string) ?? null, nts_valid: (c.nts_valid as string) ?? null, start_dt: (c.start_dt as string) ?? null, doc_signed, status: c.status as string, created_at: c.created_at as string });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-bold text-unjong-primary">트릴리언 관리자</h1>
      <p className="mb-8 mt-1 text-sm text-unjong-muted">금감원 조회 · 신고 · 업체 인증 신청</p>

      {/* 금감원 신고 조회 */}
      <section className="mb-12">
        <h2 className="mb-3 text-base font-bold text-unjong-primary">🔎 금감원 신고 조회 · 사업자번호로 등록 여부 확인</h2>
        <AdminFssLookup />
      </section>

      {/* 신고 */}
      <section className="mb-12">
        <h2 className="mb-3 text-base font-bold text-unjong-primary">🚨 신고 ({reports.length})</h2>
        <AdminReports initial={reports} />
      </section>

      {/* 업체 인증 신청(클레임) */}
      <section>
        <h2 className="mb-3 text-base font-bold text-unjong-primary">🛡 업체 인증 신청 ({claims.length}) · 서류 확인 후 승인하면 verified·게재</h2>
        <AdminBusinessClaims initial={claims} />
      </section>
    </div>
  );
}
