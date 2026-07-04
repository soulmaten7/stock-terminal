'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LENS_COPY, LENS_READINGS, SPECTRUM_LABELS } from '@/lib/lensCopy';

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
  verdict?: { phrase: string; plain: string; tone: 'pos' | 'warn' | 'flat' } | null;
  spectrum?: { labels: [string, string, string]; active: number } | null;
  headline?: string | null;
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

// 판정(reading) 색조 — pos=민트(우호적 읽기)·warn=앰버(주의 읽기)·flat=중립(기본색). '이 기법 시각'일 뿐 예측 아님(상단 전제).
function verdictColor(tone?: string): string {
  if (tone === 'pos') return 'text-unjong-accent';
  if (tone === 'warn') return 'text-amber-600';
  return 'text-unjong-primary';
}

// 3구간 스펙트럼 — 이 종목이 이 기법 눈엔 어디쯤인지 위치로. 켜지는 칸만 색조. 모든 기법 공통(패밀리룩).
function Spectrum({ labels, active, tone }: { labels: [string, string, string]; active: number; tone?: string }) {
  const on = tone === 'pos' ? 'border-unjong-accent bg-unjong-accent/10 text-unjong-accent'
    : tone === 'warn' ? 'border-amber-400 bg-amber-50 text-amber-600'
    : 'border-unjong-muted bg-unjong-background text-unjong-primary';
  return (
    <div className="mt-2.5 flex gap-1.5">
      {labels.map((l, i) => (
        <span key={i} className={`flex-1 rounded-md border py-1 text-center text-[12px] ${i === active ? `font-medium ${on}` : 'border-unjong-border text-unjong-muted'}`}>{l}</span>
      ))}
    </div>
  );
}

// 신뢰도 배지 색 — strong=민트(검증)·partial=앰버(조건부/해석)·ref=회색(참고)
function gradeBadgeClass(tier: string): string {
  if (tier === 'strong') return 'bg-unjong-accent/15 text-unjong-accent';
  if (tier === 'partial') return 'bg-amber-50 text-amber-600';
  return 'bg-unjong-background text-unjong-muted';
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
  const [open, setOpen] = useState(false);
  if (!f.supported) {
    return (
      <div className="rounded-2xl border border-unjong-border bg-white p-4 shadow-sm">
        <div className="font-bold text-unjong-primary">Piotroski F-Score</div>
        <div className="mt-0.5 text-xs text-unjong-accent">F-스코어 · 재무 건전성</div>
        <p className="mt-2 text-sm text-unjong-muted">{f.reason || '이 종목은 F-Score를 적용할 수 없어요.'}</p>
      </div>
    );
  }
  const fState = f.score >= 7 ? 'strong' : f.score <= 3 ? 'weak' : 'mid';
  const fRead = LENS_READINGS.ko.fscore[fState];
  const fCol = fState === 'strong' ? 'text-unjong-accent' : fState === 'weak' ? 'text-amber-600' : 'text-unjong-primary';
  const fActive = fState === 'strong' ? 2 : fState === 'weak' ? 0 : 1;
  const fTone = fState === 'strong' ? 'pos' : fState === 'weak' ? 'warn' : 'flat';
  return (
    <div className="overflow-hidden rounded-2xl border border-unjong-border bg-white shadow-sm">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-start justify-between gap-3 p-4 text-left transition-colors hover:bg-unjong-background/40">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-unjong-primary">Piotroski F-Score</span>
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-600">건전성 해석</span>
            <span className="text-xs text-unjong-accent">F-스코어 · 재무 건전성</span>
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-unjong-muted">{LENS_COPY.ko.fscore.what}{f.asOf ? ` · ${f.asOf} 기준` : ''}</p>
        </div>
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-unjong-border bg-white text-unjong-muted">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
        </span>
      </button>
      {open ? (
        <div className="border-t border-unjong-border bg-unjong-background/50 px-4 pb-4 pt-3">
          <div className="flex items-baseline gap-2">
            <p className={`text-base font-bold ${fCol}`}>{fRead.phrase}</p>
            <span className="text-[13px] text-unjong-muted">점수 <span className="tabular-nums font-medium text-unjong-primary">{f.score}</span> / {f.max}</span>
          </div>
          <Spectrum labels={SPECTRUM_LABELS.ko.fscore} active={fActive} tone={fTone} />
          <p className="mt-2.5 text-[13px] leading-relaxed text-unjong-primary/90">{fRead.plain}</p>
          <details className="mt-2.5">
            <summary className={LEARN_CLASS}>▾ F-스코어 알아보기</summary>
            <p className="mt-1.5 text-xs leading-relaxed text-unjong-muted">{LENS_COPY.ko.fscore.about}</p>
          </details>
          <div className="mt-3 grid grid-cols-1 gap-y-1.5 border-t border-unjong-border pt-3 sm:grid-cols-2 sm:gap-x-4">
            {f.criteria.map((c) => (
              <div key={c.key} className="flex items-start gap-1.5 text-xs">
                <span className={c.pass ? 'text-unjong-up' : 'text-unjong-down'}>{c.pass ? '✓' : '✗'}</span>
                <span className="text-unjong-primary">{c.label}</span>
                <span className="ml-auto tabular-nums text-unjong-muted">{c.note}</span>
              </div>
            ))}
          </div>
          <details className="mt-3">
            <summary className={SUMMARY_CLASS}>▾ 자세히 · 검증 근거·한계</summary>
            <p className="mt-2 text-[11px] leading-relaxed text-unjong-muted">
              자체 검증(미국 넓은 표본·12년·월별 롱숏)에선 점수와 이후 수익률에 유효한 관계가 없었어요(t≈0.7·시장/규모/가치 조정 후에도 무의미). 수익 예측이 아니라 재무 건전성 해석으로만 보세요 — 원래 용도도 저평가(저PBR) 가치주 안에서 부실을 거르는 필터랍니다.
            </p>
          </details>
        </div>
      ) : null}
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

  const [openLens, setOpenLens] = useState<Set<string>>(new Set());
  const lenses = data?.lenses ?? [];
  const ticker = symbol.replace(/\.(KS|KQ|T|HK|SS|SZ)$/, '');
  const toggleLens = (k: string) => setOpenLens((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });

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
          아래는 <b className="text-unjong-primary">각 기법이 이 종목을 보는 시각</b>이에요 — 예측이 아니라 "이 기법으로 보면 이렇게 읽힌다". 기법마다 다르게 볼 수 있고, 그 차이가 정보예요. 판단 근거가 되는 정확한 수치도 카드마다 함께 있어요.
        </p>

        <p className="mt-2 text-[11px] text-unjong-muted">각 렌즈를 눌러 상세(쉬운 해석·유래·검증 근거)를 펼쳐 보세요.</p>
      </div>

      {loading ? (
        <div className="mt-4 max-w-4xl space-y-3">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-unjong-background" />)}
        </div>
      ) : lenses.length === 0 && !data?.fscore ? (
        <p className="mt-6 text-center text-sm text-unjong-muted">데이터를 불러오지 못했어요. (일부 종목은 아직 지원되지 않을 수 있어요)</p>
      ) : (
        <div className="mt-4 max-w-4xl space-y-4">
          {data?.fscore ? <FScoreCard f={data.fscore} /> : null}
          {lenses.map((L) => {
            const isOpen = openLens.has(L.key);
            return (
            <div key={L.key} className="overflow-hidden rounded-2xl border border-unjong-border bg-white shadow-sm">
              <button type="button" onClick={() => toggleLens(L.key)} aria-expanded={isOpen} className="flex w-full items-start justify-between gap-3 p-4 text-left transition-colors hover:bg-unjong-background/40">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-unjong-primary">{L.nameEn}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${gradeBadgeClass(L.gradeTier)}`}>{L.grade}</span>
                    <span className="text-xs text-unjong-accent">{L.name}</span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-unjong-muted">{L.summary}</p>
                </div>
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-unjong-border bg-white text-unjong-muted">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
                </span>
              </button>
              {isOpen ? (
                <div className="border-t border-unjong-border bg-unjong-background/50 px-4 pb-4 pt-3">
                  {L.verdict ? (
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`text-base font-bold ${verdictColor(L.verdict.tone)}`}>{L.verdict.phrase}</p>
                      {L.headline ? <span className="whitespace-nowrap text-[12px] text-unjong-muted">{L.headline}</span> : null}
                    </div>
                  ) : null}
                  {L.spectrum ? <Spectrum labels={L.spectrum.labels} active={L.spectrum.active} tone={L.verdict?.tone} /> : null}
                  {L.verdict ? <p className="mt-2.5 text-[13px] leading-relaxed text-unjong-primary/90">{L.verdict.plain}</p> : null}
                  {L.about ? (
                    <details className="mt-2.5">
                      <summary className={LEARN_CLASS}>▾ {L.name} 알아보기</summary>
                      <p className="mt-1.5 text-xs leading-relaxed text-unjong-muted">{L.about}</p>
                    </details>
                  ) : null}
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-unjong-border pt-2.5 text-[12px] text-unjong-muted">
                    <span className="font-medium text-unjong-primary/70">근거 수치</span>
                    {Object.entries(L.detail).map(([k, v]) => (
                      <span key={k}>{k}: <span className="tabular-nums text-unjong-primary">{v ?? '—'}</span></span>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-unjong-muted">
                    <span>단기 <b className={labelColor(L.short)}>{L.short ?? '—'}</b></span>
                    <span>장기 <b className={labelColor(L.long)}>{L.long ?? '—'}</b></span>
                  </div>
                  {L.note ? (
                    <details className="mt-2.5">
                      <summary className={SUMMARY_CLASS}>▾ 자세히 · 검증 근거·한계</summary>
                      <p className="mt-2 text-[11px] leading-relaxed text-unjong-muted">{L.note}</p>
                    </details>
                  ) : null}
                </div>
              ) : null}
            </div>
            );
          })}
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
