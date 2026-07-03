'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type LensRead = {
  key: string;
  nameEn: string;
  name: string;
  summary: string;
  about: string;
  grade: string;
  gradeTier: 'strong' | 'partial' | 'ref';
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
  if (['강세', '상승추세'].includes(l)) return 'text-unjong-up';
  if (['약세', '하락추세', '침체'].includes(l)) return 'text-unjong-down';
  if (l === '과열') return 'text-amber-500';
  return 'text-unjong-muted';
}

function gradeColor(g: string): string {
  if (g === '우량') return 'text-unjong-up';
  if (g === '부실') return 'text-unjong-down';
  return 'text-unjong-muted';
}

// 신뢰도 배지 색 — strong=민트(검증)·partial=앰버(조건부/해석)·ref=회색(참고)
function gradeBadgeClass(tier: string): string {
  if (tier === 'strong') return 'bg-unjong-accent/15 text-unjong-accent';
  if (tier === 'partial') return 'bg-amber-50 text-amber-600';
  return 'bg-unjong-background text-unjong-muted';
}

// 기법 엇갈림 = 정보. 방향 축의 핵심 긴장(모멘텀 × 밸류)만 읽어 종목 '성향'을 서술(예측·매수신호 아님).
// 5개를 억지로 한 표로 뭉치지 않음(축이 다름: 저변동·F-Score는 위험·건전성 축).
function styleRead(lenses: LensRead[]): string | null {
  const mom = lenses.find((l) => l.key === 'momentum');
  const val = lenses.find((l) => l.key === 'valuation');
  if (!mom || !val) return null;
  const bull = mom.long === '강세', bear = mom.long === '약세';
  const cheap = val.long === '낮음', pricey = val.long === '높음';
  if (bull && pricey) return '모멘텀↑ · 밸류 비쌈 → 모멘텀·성장 성격 (추세엔 부합, 가치엔 불리)';
  if (bear && cheap) return '모멘텀↓ · 밸류 쌈 → 가치·역발상 성격 (가치엔 부합, 추세엔 불리)';
  if (bull && cheap) return '모멘텀↑ · 밸류도 쌈 → 드문 정렬 (추세·가치 모두 우호)';
  if (bear && pricey) return '모멘텀↓ · 밸류 비쌈 → 둘 다 비우호 (주의)';
  return '뚜렷한 성향 없음 — 중립 구간';
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
const LEARN_CLASS = 'cursor-pointer list-none text-[11px] font-medium text-unjong-accent hover:opacity-80 [&::-webkit-details-marker]:hidden';

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
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-unjong-primary">Piotroski F-Score</span>
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-600">건전성 해석</span>
          </div>
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
      <details className="mt-3">
        <summary className={LEARN_CLASS}>▾ F-스코어 알아보기</summary>
        <p className="mt-1.5 text-xs leading-relaxed text-unjong-muted">회계학자 피오트로스키가 2000년 만든, 기업 재무 건강을 9개 항목으로 점수 매기는 체크리스트예요(수익성·부채·효율의 전년 대비 개선). 원래 값싼 가치주 중 &lsquo;진짜 부실한 곳&rsquo;을 걸러내려 만들었어요 — 그래서 수익 예측이 아니라 재무 건전성 판단에 씁니다.</p>
      </details>
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
  const style = styleRead(lenses);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Link href="/" className="text-sm text-unjong-muted hover:text-unjong-accent">← 홈</Link>

      <div className="mt-3 max-w-4xl">
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

        {style ? (
          <div className="mt-3 rounded-lg border border-unjong-border bg-white px-3 py-2.5">
            <p className="text-xs font-semibold text-unjong-primary">
              <span className="text-unjong-accent">기법 성향</span> · {style}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-unjong-muted">
              여러 기법이 같은 방향이면 신뢰가 높고, 엇갈리면 그 자체가 정보(종목의 성격·불확실성)예요 — 억지로 하나의 점수로 합치지 마세요.
            </p>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-4 max-w-4xl space-y-3">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-unjong-background" />)}
        </div>
      ) : lenses.length === 0 && !data?.fscore ? (
        <p className="mt-6 text-center text-sm text-unjong-muted">데이터를 불러오지 못했어요. (일부 종목은 아직 지원되지 않을 수 있어요)</p>
      ) : (
        <div className="mt-4 max-w-4xl space-y-3">
          {data?.fscore ? <FScoreCard f={data.fscore} /> : null}
          {lenses.map((L) => (
            <div key={L.key} className="rounded-xl border border-unjong-border bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-unjong-primary">{L.nameEn}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${gradeBadgeClass(L.gradeTier)}`}>{L.grade}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-unjong-accent">{L.name}</div>
                </div>
                <div className="flex items-center gap-3 whitespace-nowrap pt-0.5 text-xs">
                  <span className="text-unjong-muted">단기 <b className={labelColor(L.short)}>{L.short ?? '—'}</b></span>
                  <span className="text-unjong-muted">장기 <b className={labelColor(L.long)}>{L.long ?? '—'}</b></span>
                </div>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-unjong-primary/80">{L.summary}</p>
              {L.about ? (
                <details className="mt-2">
                  <summary className={LEARN_CLASS}>▾ {L.name} 알아보기</summary>
                  <p className="mt-1.5 text-xs leading-relaxed text-unjong-muted">{L.about}</p>
                </details>
              ) : null}
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
        <div className="mt-4 max-w-4xl">
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

      <p className="mt-6 max-w-4xl text-center text-[11px] text-unjong-muted">
        결정론 기법 렌즈(무료) + TRAI 종합. 예측이 아니라 정직한 해석이에요.
      </p>
    </main>
  );
}
