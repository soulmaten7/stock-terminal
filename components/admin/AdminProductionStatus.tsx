'use client';

import { useEffect, useState, useCallback } from 'react';
import SelectDropdown from '@/components/toolbox/SelectDropdown';

type Item = {
  id: number;
  country: string;
  content_type: string;
  symbol: string;
  stock_name: string;
  target_date: string;
  title: string | null;
  status: string;
  uploaded_at: string | null;
  youtube_url: string | null;
};

const TYPE_LABEL: Record<string, string> = { report: '리포트형', growth_story: '성장스토리' };
const STATUS_LABEL: Record<string, string> = { '대기중': '대기중', '기획됨': '기획됨', '조립됨': '조립됨', '업로드됨': '업로드됨' };

const COUNTRY_OPTIONS = [{ value: '', label: '전체' }, { value: 'KR', label: '한국' }, { value: 'US', label: '미국' }];
const TYPE_OPTIONS = [{ value: '', label: '전체' }, { value: 'report', label: '리포트형' }, { value: 'growth_story', label: '성장스토리' }];

export default function AdminProductionStatus({ initial }: { initial: Item[] }) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<number | null>(null);
  const [country, setCountry] = useState('');
  const [type, setType] = useState('');
  const [unuploaded, setUnuploaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (country) params.set('country', country);
      if (type) params.set('type', type);
      if (unuploaded) params.set('unuploaded', '1');
      const res = await fetch('/api/admin/production-status?' + params.toString());
      const j = await res.json();
      setRows(j.items ?? []);
    } catch {
      // 조회 실패는 조용히 무시 — 화면은 직전 목록을 유지
    } finally {
      setLoading(false);
    }
  }, [country, type, unuploaded]);

  // 최초 렌더는 서버가 준 initial을 그대로 쓰고, 필터가 바뀔 때만 재조회
  const [firstRender, setFirstRender] = useState(true);
  useEffect(() => {
    if (firstRender) { setFirstRender(false); return; }
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, type, unuploaded]);

  async function toggleUploaded(id: number, uploaded: boolean) {
    setBusy(id);
    const prev = rows;
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status: uploaded ? '업로드됨' : '조립됨', uploaded_at: uploaded ? new Date().toISOString() : null } : x)));
    try {
      const res = await fetch('/api/admin/production-status', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, uploaded }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setRows(prev);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SelectDropdown value={country} onChange={setCountry} options={COUNTRY_OPTIONS} />
        <SelectDropdown value={type} onChange={setType} options={TYPE_OPTIONS} />
        <label className="flex items-center gap-1.5 text-xs text-unjong-muted">
          <input type="checkbox" checked={unuploaded} onChange={(e) => setUnuploaded(e.target.checked)} />
          업로드 안 한 것만
        </label>
        {loading ? <span className="text-xs text-unjong-muted">불러오는 중…</span> : null}
      </div>

      {!rows.length ? (
        <p className="py-8 text-center text-sm text-unjong-muted">해당하는 제작 항목이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-unjong-border text-xs text-unjong-muted">
              <tr>
                <th className="py-2 pr-3">날짜</th>
                <th className="py-2 pr-3">국가</th>
                <th className="py-2 pr-3">유형</th>
                <th className="py-2 pr-3">종목</th>
                <th className="py-2 pr-3">제목</th>
                <th className="py-2 pr-3">상태</th>
                <th className="py-2">업로드</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((it) => (
                <tr key={it.id} className="border-b border-unjong-border align-top">
                  <td className="py-2 pr-3 text-xs text-unjong-muted">{it.target_date}</td>
                  <td className="py-2 pr-3 text-unjong-muted">{it.country}</td>
                  <td className="py-2 pr-3 text-unjong-muted">{TYPE_LABEL[it.content_type] ?? it.content_type}</td>
                  <td className="py-2 pr-3 font-medium text-unjong-primary">{it.stock_name}</td>
                  <td className="max-w-[16rem] py-2 pr-3 text-unjong-primary">{it.title || '—'}</td>
                  <td className="py-2 pr-3">
                    <span className={`rounded px-2 py-0.5 text-[11px] ${it.status === '업로드됨' ? 'bg-unjong-mint text-unjong-background' : 'border border-unjong-border text-unjong-muted'}`}>
                      {STATUS_LABEL[it.status] ?? it.status}
                    </span>
                  </td>
                  <td className="py-2">
                    <input
                      type="checkbox"
                      checked={it.status === '업로드됨'}
                      disabled={busy === it.id}
                      onChange={(e) => toggleUploaded(it.id, e.target.checked)}
                      className="h-4 w-4 accent-unjong-mint disabled:opacity-50"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
