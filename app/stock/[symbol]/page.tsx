'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type LensRead = {
  key: string;
  nameEn: string;
  name: string;
  summary: string;
  short: string | null;
  long: string | null;
  detail: Record<string, number | null>;
  note?: string;
};
type FCriterion = { key: string; label: string; pass: boolean; note: string };
type FScoreResp = { supported: boolean; reason?: string; score: number; max: number; grade: string; criteria: FCriterion[]; asOf?: string };
type LensResp = { symbol: string; name?: string; price?: number | null; lenses?: LensRead[]; fscore?: FScoreResp | null; error?: string };

// 라벨 → 색 (긍정=up / 부정=down / 과열=경고 / 중립·적정=muted)
function labelColor(l: string | null): string {
  if (!l) return 'text-unjong-muted';
  if (['강세', '상승추세', '저평가'].includes(l)) return 'text-unjong-up';
  if (['약세', '하락추세', '고평가', '침체'].includes(l)) return 'text-unjong-down';
  if (l === '과열') return 'text-amber-500';
  return 'text-unjong-muted';
}

function gradeColor(g: string): string {
  if (g === '우량') return 'text-unjong-up';
  if (g === '부실') return 'text-unjong-down';
  return 'text-unjong-muted';
}

// TRAI 로고 뱃지 — 민트 T 모노그램(브랜드 색). AI 종합 분석의 브랜드 마크.
function TraiMark({ size = 28 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="flex flex-shrink-0 items-center justify-center rounded-lg bg-unjong-accent font-bold leading-none text-white"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.56) }}
    >
      T
    </span>
  );
}

const SUMMARY_CLASS = 'cursor-pointer list-none text-[11px] text-unjong-muted hover:text-unjong-accent [&::-webkit-details-marker]:hidden';

function FScoreCard({ f }: { f: FScoreResp }) {
  if (!f.supported) {
    return (
      <div className="rounded-xl border border-unjong-border bg-white p-4">
        <div className="font-bold text-unjong-primary">Piotroski F-Score</div>
        <div className="mt-0.5 text-xs text-unjong-accent">F-스코어 · 재무 건전성</div>
        <p className="mt-2 text-sm text-unjong-muted">{f.reason || '이 종목은 F-Score를 적용할 수 없어요.'}</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-unjong-border bg-white p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <div className="font-bold text-unjong-primary">Piotroski F-Score</div>
          <div className="mt-0.5 text-xs text-unjong-accent">F-스코어 · 재무 건전성{f.asOf ? ` · ${f.asOf} 기준` : ''}</div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tabular-nums text-unjong-primary">{f.score}</span>
          <span className="text-sm text-unjong-muted">/ {f.max}</span>
          <span className={`ml-1 text-sm font-bold ${gradeColor(f.grade)}`}>{f.grade}</span>
        </div>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-unjong-primary/80">9개 재무 규칙으로 건전성을 점검 — 부실 회피 필터예요(수익 예측 아님).</p>
      <div className="grid grid-cols-1 gap-y-1.5 sm:grid-cols-2 sm:gap-x-4">
        {f.criteria.map((c) => (
          <div key={c.key} className="flex items-start gap-1.5 text-xs">
            <span className={c.pass ? 'text-unjong-up' : 'text-unjong-down'}>{c.pass ? '✓' : '✗'}</span>
            <span className="text-unjong-primary">{c.label}</span>
            <span className="ml-auto tabular-nums text-unjong-muted">{c.note}</span>
          </div>
        ))}
      </div>
      <details className="mt-3 border-t border-unjong-border pt-2">
        <summary className={SUMMARY_CLASS}>▾ 자세히 · 검증 근거·한계</summary>
        <p className="mt-2 text-[11px] leading-relaxed text-unjong-muted">
          자체 검증(미국 넓은 표본·12년·월별 롱숏)에선 점수와 이후 수익률에 유효한 관계가 없었어요(t≈0.7·시장/규모/가치 조정 후에도 무의미). 수익 예측이 아니라 재무 건전성 해석으로만 보세요 — 원래 용도도 저평가(저PBR) 가치주 안에서 부실을 거르는 필터랍니다.
        </p>
      </details>
    </div>
  );
}

export default function StockLensPage() {
  const params = useParams();
  const symbol = decodeURIComponent(String(params?.symbol || ''));
  const [data, setData] = useState<LensResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiContent, setAiContent] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  async function askAI() {
    setAiLoading(true);
    try {
      const r = await fetch('/api/ai-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, name: data?.name, lenses: data?.lenses, fscore: data?.fscore }),
      });
      const j = await r.json();
      setAiContent(j.content || 'TRAI 종합을 불러오지 못했어요.');
    } catch {
      setAiContent('TRAI 종합 생성 중 오류가 났어요.');
    } finally {
      setAiLoading(false);
    }
  }

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
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Link href="/" className="text-sm text-unjong-muted hover:text-unjong-accent">← 홈</Link>

      <div className="mt-3 max-w-3xl">
        <div className="mb-1 flex flex-wrap items-baseline gap-x-2">
          <h1 className="text-xl font-bold text-unjong-primary">{data?.name || ticker}</h1>
          <span className="text-sm text-unjong-muted">{ticker}</span>
        </div>
        {data?.price != null ? (
          <p className="text-sm text-unjong-muted">현재가 {data.price.toLocaleString()}</p>
        ) : null}

        <p className="mt-3 rounded-lg bg-unjong-background px-3 py-2 text-xs leading-relaxed text-unjong-muted">
          기법 렌즈는 <b className="text-unjong-primary">예측이 아니라 방향성 해석</b>이에요. 각 기법 기준으로 지금 어떻게 보이는지를 근거 수치와 함께 보여줄 뿐, 투자 판단은 본인 몫입니다.
        </p>
      </div>

      {loading ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-unjong-background" />)}
        </div>
      ) : lenses.length === 0 && !data?.fscore ? (
        <p className="mt-6 text-center text-sm text-unjong-muted">데이터를 불러오지 못했어요. (일부 종목은 아직 지원되지 않을 수 있어요)</p>
      ) : (
        <div className="mt-4 grid items-start gap-3 lg:grid-cols-2">
          {data?.fscore ? <FScoreCard f={data.fscore} /> : null}
          {lenses.map((L) => (
            <div key={L.key} className="rounded-xl border border-unjong-border bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-unjong-primary">{L.nameEn}</div>
                  <div className="mt-0.5 text-xs text-unjong-accent">{L.name}</div>
                </div>
                <div className="flex items-center gap-3 whitespace-nowrap pt-0.5 text-xs">
                  <span className="text-unjong-muted">단기 <b className={labelColor(L.short)}>{L.short ?? '—'}</b></span>
                  <span className="text-unjong-muted">장기 <b className={labelColor(L.long)}>{L.long ?? '—'}</b></span>
                </div>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-unjong-primary/80">{L.summary}</p>
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-unjong-muted">
                {Object.entries(L.detail).map(([k, v]) => (
                  <span key={k}>{k}: <span className="tabular-nums text-unjong-primary">{v ?? '—'}</span></span>
                ))}
              </div>
              {L.note ? (
                <details className="mt-2.5 border-t border-unjong-border pt-2">
                  <summary className={SUMMARY_CLASS}>▾ 자세히 · 검증 근거·한계</summary>
                  <p className="mt-2 text-[11px] leading-relaxed text-unjong-muted">{L.note}</p>
                </details>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {!loading && (data?.lenses?.length || data?.fscore) ? (
        <div className="mt-4 max-w-3xl">
          {aiContent ? (
            <div className="rounded-xl border border-unjong-accent/40 bg-unjong-background p-4">
              <div className="mb-2 flex items-center gap-2">
                <TraiMark size={22} />
                <span className="text-sm font-bold text-unjong-primary">TRAI 종합 분석</span>
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-unjong-primary">{aiContent}</p>
              <p className="mt-2 text-[11px] text-unjong-muted">렌즈 데이터를 정리한 해석이에요 · 예측·투자권유 아님</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={askAI}
              disabled={aiLoading}
              className="flex w-full items-center gap-3 rounded-xl border border-unjong-accent/50 bg-unjong-background p-4 text-left transition hover:border-unjong-accent disabled:opacity-60"
            >
              <TraiMark size={28} />
              <span className="flex-1">
                <span className="block text-sm font-semibold text-unjong-primary">{aiLoading ? 'TRAI가 종합하는 중…' : 'TRAI 종합 분석'}</span>
                <span className="block text-[11px] text-unjong-muted">5개 렌즈를 한눈에 정리 · 예측 아님</span>
              </span>
              {!aiLoading ? <span aria-hidden className="text-lg text-unjong-accent">→</span> : null}
            </button>
          )}
        </div>
      ) : null}

      <p className="mt-6 max-w-3xl text-center text-[11px] text-unjong-muted">
        결정론 기법 렌즈(무료) + TRAI 종합. 예측이 아니라 정직한 해석이에요.
      </p>
    </main>
  );
}
