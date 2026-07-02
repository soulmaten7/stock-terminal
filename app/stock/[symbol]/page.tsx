'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type LensRead = {
  key: string;
  name: string;
  short: string | null;
  long: string | null;
  detail: Record<string, number | null>;
  note?: string;
};
type LensResp = { symbol: string; name?: string; price?: number | null; lenses?: LensRead[]; error?: string };

// 라벨 → 색 (긍정=up / 부정=down / 과열=경고 / 중립·적정=muted)
function labelColor(l: string | null): string {
  if (!l) return 'text-unjong-muted';
  if (['강세', '상승추세', '저평가'].includes(l)) return 'text-unjong-up';
  if (['약세', '하락추세', '고평가', '침체'].includes(l)) return 'text-unjong-down';
  if (l === '과열') return 'text-amber-500';
  return 'text-unjong-muted';
}

export default function StockLensPage() {
  const params = useParams();
  const symbol = decodeURIComponent(String(params?.symbol || ''));
  const [data, setData] = useState<LensResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    fetch('/api/lens?symbol=' + encodeURIComponent(symbol))
      .then((r) => r.json())
      .then((j) => { setData(j); setLoading(false); })
      .catch(() => setLoading(false));
  }, [symbol]);

  const lenses = data?.lenses ?? [];
  const ticker = symbol.replace(/\.(KS|KQ|T|HK|SS|SZ)$/, '');

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/" className="text-sm text-unjong-muted hover:text-unjong-accent">← 홈</Link>

      <div className="mt-3 mb-1 flex flex-wrap items-baseline gap-x-2">
        <h1 className="text-xl font-bold text-unjong-primary">{data?.name || ticker}</h1>
        <span className="text-sm text-unjong-muted">{ticker}</span>
      </div>
      {data?.price != null ? (
        <p className="text-sm text-unjong-muted">현재가 {data.price.toLocaleString()}</p>
      ) : null}

      <p className="mt-3 rounded-lg bg-unjong-background px-3 py-2 text-xs leading-relaxed text-unjong-muted">
        🧭 기법 렌즈는 <b className="text-unjong-primary">예측이 아니라 방향성 해석</b>이에요. 각 기법 기준으로 지금 어떻게 보이는지를 근거 수치와 함께 보여줄 뿐, 투자 판단은 본인 몫입니다.
      </p>

      {loading ? (
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-unjong-background" />)}
        </div>
      ) : lenses.length === 0 ? (
        <p className="mt-8 text-center text-sm text-unjong-muted">데이터를 불러오지 못했어요. (일부 종목은 아직 지원되지 않을 수 있어요)</p>
      ) : (
        <div className="mt-4 space-y-3">
          {lenses.map((L) => (
            <div key={L.key} className="rounded-xl border border-unjong-border p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-bold text-unjong-primary">{L.name}</span>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-unjong-muted">단기 <b className={labelColor(L.short)}>{L.short ?? '—'}</b></span>
                  <span className="text-unjong-muted">장기 <b className={labelColor(L.long)}>{L.long ?? '—'}</b></span>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-unjong-muted">
                {Object.entries(L.detail).map(([k, v]) => (
                  <span key={k}>{k}: <span className="tabular-nums text-unjong-primary">{v ?? '—'}</span></span>
                ))}
              </div>
              {L.note ? <p className="mt-2 text-[11px] leading-relaxed text-unjong-muted">※ {L.note}</p> : null}
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-[11px] text-unjong-muted">
        결정론 기법 렌즈(무료). 곧 실시간 뉴스·공시를 종합한 &quot;AI보기&quot;가 추가됩니다.
      </p>
    </main>
  );
}
