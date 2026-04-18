// 2026-04-18 세션 #15 (F) — /admin/partners/leads 리드 대시보드
// 필터(파트너·기간·검색) + 리스트 테이블 + CSV Export
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, RefreshCw, Search } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

type Lead = {
  id: string | number;
  partner_id: number | null;
  partner_slug: string | null;
  partner_name: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  source_slug: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  consent_marketing: boolean | null;
  created_at: string;
};

type PartnerOption = { slug: string; name: string };

function todayIso(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function LeadsAdminInner() {
  const [partnerOptions, setPartnerOptions] = useState<PartnerOption[]>([]);
  const [partnerSlug, setPartnerSlug] = useState('');
  const [from, setFrom] = useState(todayIso(-30));
  const [to, setTo] = useState(todayIso(0));
  const [q, setQ] = useState('');

  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 파트너 옵션 로드 (리드 필터 드롭다운 용)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/partners');
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'load partners failed');
        const opts: PartnerOption[] = (json.partners || []).map((p: { slug: string; name: string }) => ({ slug: p.slug, name: p.name }));
        setPartnerOptions(opts);
      } catch {
        // 무시: 드롭다운만 비게 됨
      }
    })();
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (partnerSlug) params.set('partner_slug', partnerSlug);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (q) params.set('q', q);
      params.set('limit', '200');
      const res = await fetch(`/api/admin/partners/leads?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'load leads failed');
      setLeads(json.leads || []);
      setTotal(json.total ?? 0);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const csvHref = useMemo(() => {
    const params = new URLSearchParams();
    if (partnerSlug) params.set('partner_slug', partnerSlug);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (q) params.set('q', q);
    params.set('format', 'csv');
    params.set('limit', '2000');
    return `/api/admin/partners/leads?${params.toString()}`;
  }, [partnerSlug, from, to, q]);

  // KPI 집계 (클라이언트측)
  const kpis = useMemo(() => {
    const withEmail = leads.filter((l) => l.email).length;
    const withPhone = leads.filter((l) => l.phone).length;
    const withConsent = leads.filter((l) => l.consent_marketing).length;
    const slotBreakdown = new Map<string, number>();
    leads.forEach((l) => {
      const key = l.utm_medium || '(direct)';
      slotBreakdown.set(key, (slotBreakdown.get(key) ?? 0) + 1);
    });
    return {
      total: leads.length,
      withEmail,
      withPhone,
      withConsent,
      topSlots: Array.from(slotBreakdown.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
  }, [leads]);

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/partners" className="text-xs text-[#0ABAB5] hover:underline">← 파트너 관리</Link>
          <h1 className="text-2xl font-bold mt-1">리드 대시보드</h1>
          <p className="text-xs text-[#999999] mt-1">파트너별·기간별 리드 수집 현황. CSV Export 지원 (UTF-8 BOM 포함).</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="px-3 py-2 text-xs border border-[#E5E7EB] rounded flex items-center gap-1.5 hover:bg-[#F5F7FA]"
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> 조회
          </button>
          <a
            href={csvHref}
            className="px-3 py-2 text-xs bg-[#0ABAB5] text-white rounded flex items-center gap-1.5 hover:bg-[#09a6a1]"
          >
            <Download className="w-3.5 h-3.5" /> CSV 다운로드
          </a>
        </div>
      </div>

      {/* 필터 */}
      <div className="mb-4 p-4 bg-white border border-[#E5E7EB] rounded-lg">
        <div className="grid grid-cols-4 gap-3">
          <label className="block">
            <span className="block text-xs text-[#666666] mb-1">파트너</span>
            <select value={partnerSlug} onChange={(e) => setPartnerSlug(e.target.value)} className="input-sm">
              <option value="">— 전체 —</option>
              {partnerOptions.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name} ({p.slug})
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs text-[#666666] mb-1">시작일</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-sm" />
          </label>
          <label className="block">
            <span className="block text-xs text-[#666666] mb-1">종료일</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-sm" />
          </label>
          <label className="block">
            <span className="block text-xs text-[#666666] mb-1">검색 (이름·이메일·전화·문의)</span>
            <div className="flex">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && load()}
                placeholder="키워드"
                className="input-sm rounded-r-none flex-1"
              />
              <button
                onClick={load}
                className="px-3 bg-[#F5F7FA] border border-l-0 border-[#E5E7EB] rounded-r text-xs hover:bg-[#E5E7EB]"
                aria-label="검색"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <Kpi label="총 리드" value={kpis.total.toString()} />
        <Kpi label="이메일 보유" value={`${kpis.withEmail} / ${kpis.total}`} />
        <Kpi label="전화 보유" value={`${kpis.withPhone} / ${kpis.total}`} />
        <Kpi label="마케팅 동의" value={`${kpis.withConsent} / ${kpis.total}`} />
      </div>

      {kpis.topSlots.length > 0 && (
        <div className="mb-4 p-3 bg-white border border-[#E5E7EB] rounded-lg">
          <div className="text-xs font-bold text-[#666666] mb-2">UTM Medium(슬롯) 별 유입 TOP 5</div>
          <div className="flex flex-wrap gap-2">
            {kpis.topSlots.map(([slot, n]) => (
              <span key={slot} className="text-xs px-2 py-1 bg-[#F5F7FA] border border-[#E5E7EB] rounded">
                <strong className="font-mono">{slot}</strong> · {n}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 리스트 */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F7FA] text-xs text-[#666666]">
            <tr>
              <th className="text-left px-3 py-2">created_at</th>
              <th className="text-left px-3 py-2">파트너</th>
              <th className="text-left px-3 py-2">이름</th>
              <th className="text-left px-3 py-2">이메일</th>
              <th className="text-left px-3 py-2">전화</th>
              <th className="text-left px-3 py-2">문의</th>
              <th className="text-left px-3 py-2">UTM</th>
              <th className="text-center px-3 py-2">동의</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12 text-[#999999]">로딩 중…</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-[#999999]">조회된 리드가 없습니다</td></tr>
            ) : (
              leads.map((l) => (
                <tr key={String(l.id)} className="border-t border-[#F0F0F0] hover:bg-[#FAFBFC]">
                  <td className="px-3 py-2 text-xs text-[#666666] whitespace-nowrap">
                    {new Date(l.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false })}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {l.partner_name ? (
                      <>
                        <div className="font-medium">{l.partner_name}</div>
                        <div className="font-mono text-[11px] text-[#999999]">{l.partner_slug}</div>
                      </>
                    ) : <span className="text-[#999999]">—</span>}
                  </td>
                  <td className="px-3 py-2 font-medium">{l.name}</td>
                  <td className="px-3 py-2 text-xs text-[#666666]">{l.email || '-'}</td>
                  <td className="px-3 py-2 text-xs text-[#666666]">{l.phone || '-'}</td>
                  <td className="px-3 py-2 text-xs text-[#666666] max-w-[240px] truncate" title={l.message || ''}>
                    {l.message || '-'}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {l.utm_medium ? (
                      <span className="inline-block px-1.5 py-0.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded font-mono text-[11px]">
                        {l.utm_medium}
                      </span>
                    ) : <span className="text-[#999999]">direct</span>}
                  </td>
                  <td className="px-3 py-2 text-center text-xs">
                    {l.consent_marketing ? (
                      <span className="text-[#0ABAB5] font-bold">✓</span>
                    ) : <span className="text-[#CCCCCC]">−</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-[#999999]">
        조회 결과: {leads.length} / 전체 {total}건 · CSV는 최대 2000건까지 Export.
      </p>

      <style jsx>{`
        :global(.input-sm) {
          width: 100%;
          height: 34px;
          padding: 0 10px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 13px;
          background: #fff;
          outline: none;
        }
        :global(.input-sm:focus) {
          border-color: #0abab5;
        }
      `}</style>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg">
      <div className="text-xs text-[#999999] mb-1">{label}</div>
      <div className="text-xl font-bold font-mono">{value}</div>
    </div>
  );
}

export default function LeadsAdminPage() {
  return (
    <AuthGuard minPlan="admin">
      <LeadsAdminInner />
    </AuthGuard>
  );
}
