// 2026-04-18 세션 #15 (H) — /admin/partners/clicks 대시보드
// 슬롯별·파트너별·일자별 집계 + 최근 클릭 목록 + 리드 전환율
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, MousePointerClick, Trash2 } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

type Click = {
  id: string | number;
  partner_id: number;
  partner_slug: string | null;
  partner_name: string | null;
  slot_key: string | null;
  source_page: string | null;
  clicked_at: string;
};

type SlotAgg = { slot: string; clicks: number; leads: number; convRate: number };
type PartnerAgg = { partner_id: number; slug: string; name: string; clicks: number; leads: number; convRate: number };
type DayAgg = { date: string; clicks: number; leads: number };

type ApiResp = {
  total: number;
  leadTotal: number;
  bySlot: SlotAgg[];
  byPartner: PartnerAgg[];
  byDay: DayAgg[];
  recent: Click[];
};

type PartnerOption = { slug: string; name: string };

function todayIso(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function ClicksAdminInner() {
  const [partnerOptions, setPartnerOptions] = useState<PartnerOption[]>([]);
  const [partnerSlug, setPartnerSlug] = useState('');
  const [slotKey, setSlotKey] = useState('');
  const [from, setFrom] = useState(todayIso(-30));
  const [to, setTo] = useState(todayIso(0));

  const [resp, setResp] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 2026-04-18 세션 #15 (L): 행별 삭제 상태
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/partners');
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'load partners failed');
        const opts: PartnerOption[] = (json.partners || []).map((p: { slug: string; name: string }) => ({
          slug: p.slug,
          name: p.name,
        }));
        setPartnerOptions(opts);
      } catch {
        // 비-admin 이거나 DB 에러 — 대시보드는 열리고 드롭다운만 빈 상태
      }
    })();
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (partnerSlug) params.set('partner_slug', partnerSlug);
      if (slotKey) params.set('slot_key', slotKey);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await fetch(`/api/admin/partners/clicks?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'load clicks failed');
      setResp(json);
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

  // 2026-04-18 세션 #15 (L): 클릭 레코드 삭제
  const onDeleteClick = async (clickId: string | number) => {
    if (!confirm(`클릭 #${clickId} 을(를) 삭제하시겠습니까? (되돌릴 수 없음)`)) return;
    setRowError(null);
    setDeletingId(clickId);
    try {
      const res = await fetch(`/api/admin/partners/clicks/${clickId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'delete failed');
      await load();
    } catch (e) {
      setRowError(String(e instanceof Error ? e.message : e));
    } finally {
      setDeletingId(null);
    }
  };

  const maxDayCount = useMemo(() => {
    if (!resp?.byDay?.length) return 1;
    return Math.max(...resp.byDay.map((d) => Math.max(d.clicks, d.leads)), 1);
  }, [resp]);

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/partners" className="text-xs text-[#0ABAB5] hover:underline">← 파트너 관리</Link>
          <h1 className="text-2xl font-bold mt-1 flex items-center gap-2">
            <MousePointerClick className="w-5 h-5 text-[#0ABAB5]" /> 클릭/UTM 대시보드
          </h1>
          <p className="text-xs text-[#999999] mt-1">
            파트너 슬롯 클릭 수집·리드 전환율·슬롯별 성과 · 최근 30일 기본 (KST 기준 일자 집계)
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/partners/leads"
            className="px-3 py-2 text-xs border border-[#E5E7EB] rounded hover:bg-[#F5F7FA]"
          >
            리드 대시보드 →
          </Link>
          <button
            onClick={load}
            className="px-3 py-2 text-xs border border-[#E5E7EB] rounded flex items-center gap-1.5 hover:bg-[#F5F7FA]"
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> 조회
          </button>
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
            <span className="block text-xs text-[#666666] mb-1">슬롯 키 (직접 입력)</span>
            <input
              value={slotKey}
              onChange={(e) => setSlotKey(e.target.value)}
              placeholder="예: home-row3-left"
              className="input-sm"
            />
          </label>
          <label className="block">
            <span className="block text-xs text-[#666666] mb-1">시작일</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-sm" />
          </label>
          <label className="block">
            <span className="block text-xs text-[#666666] mb-1">종료일</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-sm" />
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <Kpi label="총 클릭" value={String(resp?.total ?? 0)} />
        <Kpi label="총 리드" value={String(resp?.leadTotal ?? 0)} />
        <Kpi
          label="전체 전환율"
          value={
            resp && resp.total > 0
              ? `${((resp.leadTotal / resp.total) * 100).toFixed(1)}%`
              : '—'
          }
        />
        <Kpi label="활성 슬롯" value={String(resp?.bySlot?.length ?? 0)} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* 슬롯별 */}
        <Card title="슬롯별 클릭 · 리드 · 전환율">
          {resp?.bySlot?.length ? (
            <table className="w-full text-sm">
              <thead className="bg-[#F5F7FA] text-xs text-[#666666]">
                <tr>
                  <th className="text-left px-3 py-2">슬롯</th>
                  <th className="text-right px-3 py-2">클릭</th>
                  <th className="text-right px-3 py-2">리드</th>
                  <th className="text-right px-3 py-2">전환율</th>
                </tr>
              </thead>
              <tbody>
                {resp.bySlot.map((s) => (
                  <tr key={s.slot} className="border-t border-[#F0F0F0]">
                    <td className="px-3 py-2 font-mono text-xs">{s.slot}</td>
                    <td className="text-right px-3 py-2 font-mono">{s.clicks}</td>
                    <td className="text-right px-3 py-2 font-mono">{s.leads}</td>
                    <td className="text-right px-3 py-2 font-mono text-[#0ABAB5]">
                      {(s.convRate * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyRow text="슬롯별 데이터가 없습니다" />
          )}
        </Card>

        {/* 파트너별 */}
        <Card title="파트너별 클릭 · 리드 · 전환율">
          {resp?.byPartner?.length ? (
            <table className="w-full text-sm">
              <thead className="bg-[#F5F7FA] text-xs text-[#666666]">
                <tr>
                  <th className="text-left px-3 py-2">파트너</th>
                  <th className="text-right px-3 py-2">클릭</th>
                  <th className="text-right px-3 py-2">리드</th>
                  <th className="text-right px-3 py-2">전환율</th>
                </tr>
              </thead>
              <tbody>
                {resp.byPartner.map((p) => (
                  <tr key={p.partner_id} className="border-t border-[#F0F0F0]">
                    <td className="px-3 py-2">
                      <div className="font-medium text-xs">{p.name}</div>
                      <div className="font-mono text-[11px] text-[#999999]">{p.slug}</div>
                    </td>
                    <td className="text-right px-3 py-2 font-mono">{p.clicks}</td>
                    <td className="text-right px-3 py-2 font-mono">{p.leads}</td>
                    <td className="text-right px-3 py-2 font-mono text-[#0ABAB5]">
                      {(p.convRate * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyRow text="파트너별 데이터가 없습니다" />
          )}
        </Card>
      </div>

      {/* 일자별 추이 (ASCII bar) */}
      <Card title="일자별 추이 (KST)">
        {resp?.byDay?.length ? (
          <div className="space-y-1.5 py-2">
            {resp.byDay.map((d) => {
              const clickPct = (d.clicks / maxDayCount) * 100;
              const leadPct = (d.leads / maxDayCount) * 100;
              return (
                <div key={d.date} className="flex items-center gap-3 text-xs">
                  <span className="font-mono text-[#666666] w-20">{d.date}</span>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#F5F7FA] rounded overflow-hidden h-3">
                        <div className="h-full bg-[#0ABAB5]" style={{ width: `${clickPct}%` }} />
                      </div>
                      <span className="font-mono w-14 text-right">클릭 {d.clicks}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#F5F7FA] rounded overflow-hidden h-3">
                        <div className="h-full bg-[#FF9500]" style={{ width: `${leadPct}%` }} />
                      </div>
                      <span className="font-mono w-14 text-right">리드 {d.leads}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyRow text="일자별 데이터가 없습니다" />
        )}
      </Card>

      {/* 최근 클릭 100건 */}
      <Card title={`최근 클릭 ${resp?.recent?.length ?? 0}건`}>
        {rowError && (
          <div className="mx-2 mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">{rowError}</div>
        )}
        {resp?.recent?.length ? (
          <table className="w-full text-sm">
            <thead className="bg-[#F5F7FA] text-xs text-[#666666]">
              <tr>
                <th className="text-left px-3 py-2">clicked_at</th>
                <th className="text-left px-3 py-2">파트너</th>
                <th className="text-left px-3 py-2">슬롯</th>
                <th className="text-left px-3 py-2">source_page</th>
                <th className="text-right px-3 py-2 w-16">액션</th>
              </tr>
            </thead>
            <tbody>
              {resp.recent.map((c) => (
                <tr key={String(c.id)} className="border-t border-[#F0F0F0] hover:bg-[#FAFBFC] align-top">
                  <td className="px-3 py-2 text-xs text-[#666666] whitespace-nowrap">
                    {new Date(c.clicked_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false })}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {c.partner_name ? (
                      <>
                        <div className="font-medium">{c.partner_name}</div>
                        <div className="font-mono text-[11px] text-[#999999]">{c.partner_slug}</div>
                      </>
                    ) : (
                      <span className="text-[#999999]">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs font-mono">{c.slot_key || '—'}</td>
                  <td className="px-3 py-2 text-xs text-[#666666] max-w-[320px] truncate" title={c.source_page || ''}>
                    {c.source_page || '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => onDeleteClick(c.id)}
                      disabled={deletingId === c.id}
                      className="p-1 text-[#999999] hover:text-[#FF3B30] hover:bg-red-50 rounded disabled:opacity-40"
                      title="이 클릭 레코드 삭제"
                      aria-label="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyRow text="클릭 이벤트가 없습니다" />
        )}
      </Card>

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

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden mb-4">
      <div className="px-4 py-2 bg-[#F5F7FA] text-xs font-bold text-[#666666] border-b border-[#E5E7EB]">
        {title}
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <div className="text-center py-8 text-[#999999] text-sm">{text}</div>;
}

export default function ClicksAdminPage() {
  return (
    <AuthGuard minPlan="admin">
      <ClicksAdminInner />
    </AuthGuard>
  );
}
