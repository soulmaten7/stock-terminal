'use client';

import { useEffect, useState, useCallback } from 'react';
import SelectDropdown from '@/components/toolbox/SelectDropdown';

type Item = {
  id: number;
  country: string;
  content_type: string;
  symbol: string | null;
  stock_name: string;
  target_date: string;
  assembled_date: string;
  title: string | null;
  status: string;
  uploaded_at: string | null;
  youtube_url: string | null;
  instagram_note: string | null;
  manual_override: boolean;
  bundled_symbols: string[] | null;
};

const TYPE_LABEL: Record<string, string> = { report: '리포트형', growth_story: '성장스토리', longform: '롱폼' };
const STATUS_LABEL: Record<string, string> = { '대기중': '대기중', '기획됨': '기획됨', '조립됨': '조립됨', '업로드됨': '업로드됨' };

const COUNTRY_OPTIONS = [{ value: '', label: '전체' }, { value: 'KR', label: '한국' }, { value: 'US', label: '미국' }];
const TYPE_OPTIONS = [{ value: '', label: '전체' }, { value: 'report', label: '리포트형' }, { value: 'growth_story', label: '성장스토리' }, { value: 'longform', label: '롱폼' }];
const ADD_COUNTRY_OPTIONS = [{ value: 'KR', label: '한국' }, { value: 'US', label: '미국' }];

export default function AdminProductionStatus({ initial }: { initial: Item[] }) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<number | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [country, setCountry] = useState('');
  const [type, setType] = useState('');
  const [unuploaded, setUnuploaded] = useState(false);
  const [loading, setLoading] = useState(false);

  // 롱폼 수동 추가 — 채널이 EarthTicker에 롱폼을 아직 적재하지 않아
  // 자동 트리거 소스가 없다(2026-09-08). 준비 단계로 admin이 직접 한 줄
  // 추가하는 폼만 둔다.
  const [showAddForm, setShowAddForm] = useState(false);
  const [addCountry, setAddCountry] = useState('KR');
  const [addTitle, setAddTitle] = useState('');
  const [addSymbols, setAddSymbols] = useState('');
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState('');

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

  // longform 전용 — 자동 증거 소스가 없어 계속 수동 체크박스로 관리한다.
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

  // report·growth_story 예외 처리 — 게시 증거 자동판정(20260915)이 틀렸다고
  // 판단될 때만 쓴다. 확인창을 거쳐 현재 표시된 상태의 반대값으로 수동 고정한다.
  async function manualOverride(id: number, currentStatus: string) {
    const next = currentStatus !== '업로드됨';
    const label = next ? '업로드됨' : '조립됨';
    const ok = window.confirm(`이 항목을 자동판정 대신 수동으로 '${label}'(으)로 고정합니다. 계속할까요?`);
    if (!ok) return;
    setBusy(id);
    const prev = rows;
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status: label, uploaded_at: next ? new Date().toISOString() : null, manual_override: true } : x)));
    try {
      const res = await fetch('/api/admin/production-status', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, uploaded: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setRows(prev);
    } finally {
      setBusy(null);
    }
  }

  // 수동 재정의 해제 — 되돌린 직후 실제 상태는 서버 트리거가 증거 기준으로
  // 다시 계산하므로(클라이언트가 미리 알 수 없음), 낙관적 갱신 대신 재조회한다.
  async function clearOverride(id: number) {
    setBusy(id);
    try {
      const res = await fetch('/api/admin/production-status', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, clearOverride: true }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // 실패해도 아래 refetch가 실제 서버 상태를 다시 보여준다
    } finally {
      await refetch();
      setBusy(null);
    }
  }

  // "override 전부 해제" — 현재 필터로 걸러진 rows 중 수동 재정의된 report·
  // growth_story만 대상(longform은 override 개념이 없어 기존 체크박스 그대로).
  async function bulkClearOverride() {
    const targets = rows.filter((r) => r.content_type !== 'longform' && r.manual_override);
    if (!targets.length) return;
    const ok = window.confirm(`현재 목록에서 수동 재정의된 ${targets.length}건을 전부 자동판정으로 되돌립니다. 계속할까요?`);
    if (!ok) return;

    setBulkBusy(true);
    try {
      const results = await Promise.all(targets.map((t) =>
        fetch('/api/admin/production-status', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: t.id, clearOverride: true }),
        })
      ));
      if (results.some((r) => !r.ok)) throw new Error();
    } finally {
      await refetch();
      setBulkBusy(false);
    }
  }

  async function submitAddLongform(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    if (!addTitle.trim()) { setAddError('제목을 입력해 주세요'); return; }
    setAddBusy(true);
    try {
      const res = await fetch('/api/admin/production-status', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: addCountry, title: addTitle.trim(), symbols: addSymbols.trim() }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? '추가 실패');
      setAddTitle('');
      setAddSymbols('');
      setShowAddForm(false);
      refetch();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : '추가 실패');
    } finally {
      setAddBusy(false);
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
        <span className="mx-1 h-4 w-px bg-unjong-border" />
        <button
          type="button"
          disabled={bulkBusy || !rows.some((r) => r.content_type !== 'longform' && r.manual_override)}
          onClick={bulkClearOverride}
          className="rounded border border-unjong-border px-2 py-1 text-[11px] text-unjong-muted hover:text-unjong-primary disabled:opacity-50"
        >
          override 전부 해제(자동판정 복귀)
        </button>
        <span className="mx-1 h-4 w-px bg-unjong-border" />
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="rounded border border-unjong-border px-2 py-1 text-[11px] text-unjong-muted hover:text-unjong-primary"
        >
          + 롱폼 추가
        </button>
        {loading || bulkBusy ? <span className="text-xs text-unjong-muted">{bulkBusy ? '적용 중…' : '불러오는 중…'}</span> : null}
      </div>

      {showAddForm ? (
        <form onSubmit={submitAddLongform} className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-unjong-border bg-unjong-surface p-3">
          <div>
            <label className="mb-1 block text-[11px] text-unjong-muted">국가</label>
            <SelectDropdown value={addCountry} onChange={setAddCountry} options={ADD_COUNTRY_OPTIONS} />
          </div>
          <div className="flex-1 basis-64">
            <label className="mb-1 block text-[11px] text-unjong-muted">제목(예: 실리콘투 · 코스맥스 · 에이피알 — 9월 8일)</label>
            <input
              type="text" value={addTitle} onChange={(e) => setAddTitle(e.target.value)}
              className="w-full rounded-lg border border-unjong-border bg-unjong-background px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-mint"
            />
          </div>
          <div className="flex-1 basis-64">
            <label className="mb-1 block text-[11px] text-unjong-muted">묶인 종목(쉼표로 구분, 선택)</label>
            <input
              type="text" value={addSymbols} onChange={(e) => setAddSymbols(e.target.value)} placeholder="실리콘투, 코스맥스, 에이피알"
              className="w-full rounded-lg border border-unjong-border bg-unjong-background px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-mint"
            />
          </div>
          <button type="submit" disabled={addBusy} className="rounded-lg bg-unjong-accent px-3 py-2 text-xs font-semibold text-unjong-background disabled:opacity-50">
            {addBusy ? '추가 중…' : '추가'}
          </button>
          {addError ? <p className="w-full text-xs text-red-500">{addError}</p> : null}
        </form>
      ) : null}

      {!rows.length ? (
        <p className="py-8 text-center text-sm text-unjong-muted">해당하는 제작 항목이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-unjong-border text-xs text-unjong-muted">
              <tr>
                <th className="py-2 pr-3">조립일</th>
                <th className="py-2 pr-3">기준일</th>
                <th className="py-2 pr-3">국가</th>
                <th className="py-2 pr-3">유형</th>
                <th className="py-2 pr-3">종목</th>
                <th className="py-2 pr-3">제목</th>
                <th className="py-2 pr-3">상태</th>
                <th className="py-2">관리</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((it) => (
                <tr key={it.id} className="border-b border-unjong-border align-top">
                  <td className="py-2 pr-3 text-xs text-unjong-muted">{it.assembled_date}</td>
                  <td className="py-2 pr-3 text-xs text-unjong-muted">{it.target_date}</td>
                  <td className="py-2 pr-3 text-unjong-muted">{it.country}</td>
                  <td className="py-2 pr-3 text-unjong-muted">{TYPE_LABEL[it.content_type] ?? it.content_type}</td>
                  <td className="py-2 pr-3 font-medium text-unjong-primary">{it.stock_name}</td>
                  <td className="max-w-[16rem] py-2 pr-3 text-unjong-primary">{it.title || '—'}</td>
                  <td className="py-2 pr-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`rounded px-2 py-0.5 text-[11px] ${it.status === '업로드됨' ? 'bg-unjong-mint text-unjong-background' : 'border border-unjong-border text-unjong-muted'}`}>
                        {STATUS_LABEL[it.status] ?? it.status}
                      </span>
                      {it.manual_override ? <span className="text-[10px] text-unjong-muted" title="관리자가 자동판정 대신 수동으로 고정한 값">(수동)</span> : null}
                    </div>
                    {it.youtube_url || it.instagram_note ? (
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                        {it.youtube_url ? (
                          <a href={it.youtube_url} target="_blank" rel="noopener noreferrer" className="text-unjong-mint hover:underline">유튜브</a>
                        ) : null}
                        {it.instagram_note && it.instagram_note.startsWith('http') ? (
                          <a href={it.instagram_note} target="_blank" rel="noopener noreferrer" className="text-unjong-mint hover:underline">인스타</a>
                        ) : null}
                      </div>
                    ) : null}
                  </td>
                  <td className="py-2">
                    {it.content_type === 'longform' ? (
                      <input
                        type="checkbox"
                        checked={it.status === '업로드됨'}
                        disabled={busy === it.id || bulkBusy}
                        onChange={(e) => toggleUploaded(it.id, e.target.checked)}
                        className="h-4 w-4 accent-unjong-mint disabled:opacity-50"
                      />
                    ) : it.manual_override ? (
                      <button
                        type="button"
                        disabled={busy === it.id || bulkBusy}
                        onClick={() => clearOverride(it.id)}
                        className="rounded border border-unjong-border px-2 py-1 text-[11px] text-unjong-muted hover:text-unjong-primary disabled:opacity-50"
                      >
                        되돌리기
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy === it.id || bulkBusy}
                        onClick={() => manualOverride(it.id, it.status)}
                        className="rounded border border-unjong-border px-2 py-1 text-[11px] text-unjong-muted hover:text-unjong-primary disabled:opacity-50"
                      >
                        수동 재정의
                      </button>
                    )}
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
