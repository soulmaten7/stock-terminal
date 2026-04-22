'use client';

import { useState, useEffect } from 'react';
import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';

interface Quarter {
  period: string;
  revenue: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  opMargin: number | null;
  netMargin: number | null;
}

function fmtAmt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000_000_000) return `${sign}${(abs / 1_000_000_000_000).toFixed(1)}조`;
  if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toFixed(0)}억`;
  return `${sign}${abs.toLocaleString('ko-KR')}`;
}

function fmtPct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `${n.toFixed(1)}%`;
}

export default function FinancialsTab() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const _selected = useSelectedSymbolStore((s) => s.selected);
  const selected = mounted ? _selected : null;
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!selected || selected.market !== 'KR') return;
    setLoading(true);
    setError(false);
    fetch(`/api/stocks/earnings?symbol=${selected.code}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const recent = (d?.quarters ?? []).slice(-4) as Quarter[];
        setQuarters(recent);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [selected?.code, selected?.market]);

  if (!selected) {
    return <div className="py-8 text-center text-xs text-[#999]">좌측에서 종목을 선택하세요</div>;
  }

  if (selected.market !== 'KR') {
    return (
      <div className="py-8 text-center text-xs text-[#999]">
        <p>US 종목 재무 연결 예정</p>
        <p className="text-[#BBB] mt-1">STEP 75+ 보강 예정</p>
      </div>
    );
  }

  if (loading) return <TableSkeleton />;
  if (error) return <div className="py-8 text-center text-xs text-[#999]">재무 데이터를 불러오지 못했습니다</div>;

  const periods = quarters.map((q) => q.period);

  return (
    <div className="py-3 space-y-5">
      <Section title="손익계산서">
        {quarters.length ? (
          <FinancialTable
            periods={periods}
            rows={[
              { label: '매출',     values: quarters.map((q) => fmtAmt(q.revenue)) },
              { label: '영업이익', values: quarters.map((q) => fmtAmt(q.operatingIncome)) },
              { label: '순이익',   values: quarters.map((q) => fmtAmt(q.netIncome)) },
              { label: '영업이익률', values: quarters.map((q) => fmtPct(q.opMargin)) },
              { label: '순이익률', values: quarters.map((q) => fmtPct(q.netMargin)) },
            ]}
          />
        ) : (
          <p className="text-[11px] text-[#BBB]">데이터 없음 — DART 미등록 종목</p>
        )}
      </Section>

      <Section title="재무상태표">
        <p className="text-[11px] text-[#BBB]">연결 예정 (STEP 75)</p>
        <FinancialTable
          periods={periods.length ? periods : ['--', '--', '--', '--']}
          rows={[
            { label: '자산총계', values: periods.length ? periods.map(() => '—') : ['--', '--', '--', '--'] },
            { label: '부채총계', values: periods.length ? periods.map(() => '—') : ['--', '--', '--', '--'] },
            { label: '자본총계', values: periods.length ? periods.map(() => '—') : ['--', '--', '--', '--'] },
          ]}
        />
      </Section>

      <Section title="현금흐름표">
        <p className="text-[11px] text-[#BBB]">연결 예정 (STEP 75)</p>
        <FinancialTable
          periods={periods.length ? periods : ['--', '--', '--', '--']}
          rows={[
            { label: '영업활동', values: periods.length ? periods.map(() => '—') : ['--', '--', '--', '--'] },
            { label: '투자활동', values: periods.length ? periods.map(() => '—') : ['--', '--', '--', '--'] },
            { label: '재무활동', values: periods.length ? periods.map(() => '—') : ['--', '--', '--', '--'] },
          ]}
        />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="text-[11px] font-bold text-[#444] mb-2 tracking-wide">{title}</h4>
      {children}
    </section>
  );
}

function FinancialTable({ rows, periods }: { rows: { label: string; values: string[] }[]; periods: string[] }) {
  return (
    <table className="w-full text-[11px] tabular-nums">
      <thead>
        <tr className="text-[#999]">
          <th className="text-left font-normal py-1 w-16" />
          {periods.map((p, i) => (
            <th key={i} className="text-right font-normal py-1">{p}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="border-t border-[#F0F0F0]">
            <td className="py-1.5 text-[#444]">{row.label}</td>
            {row.values.map((v, i) => (
              <td key={i} className="py-1.5 text-right text-black">{v}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TableSkeleton() {
  return (
    <div className="py-3 space-y-5 animate-pulse">
      {[0, 1, 2].map((i) => (
        <div key={i}>
          <div className="h-3 bg-[#F0F0F0] rounded w-1/4 mb-3" />
          {[0, 1, 2].map((j) => (
            <div key={j} className="flex gap-4 mb-2">
              <div className="h-2.5 bg-[#F0F0F0] rounded w-12" />
              <div className="h-2.5 bg-[#F0F0F0] rounded flex-1" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
