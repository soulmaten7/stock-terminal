'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LENS_COPY } from '@/lib/lensCopy';

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
  outlook?: string | null;
};
type FCriterion = { key: string; label: string; pass: boolean; note: string; group: string; plain: string };
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
  const band = f.score >= 7 ? '양호' : f.score <= 3 ? '취약' : '중간';
  const GROUPS: Array<[string, string]> = [['수익성', '돈 버는 힘'], ['재무 안정성', '빚·자금'], ['효율성', '장사 효율']];
  return (
    <div className="overflow-hidden rounded-2xl border border-unjong-border bg-white shadow-sm">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-unjong-background/40">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-lg font-bold text-unjong-primary">Piotroski F-Score</span>
          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-600">건전성</span>
          <span className="text-xs text-unjong-muted">· 부실 위험 체크</span>
        </div>
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-unjong-border bg-white text-unjong-muted">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
        </span>
      </button>
      {open ? (
        <div className="border-t border-unjong-border bg-unjong-background/50 px-4 pb-4 pt-3.5">
          {/* 이게 뭐예요? — 지금 뭘 하는지만 */}
          <div className="rounded-xl border border-unjong-border bg-white p-3">
            <p className="text-[12px] font-medium text-unjong-accent">이게 뭐예요?</p>
            <p className="mt-1 text-sm leading-relaxed text-unjong-primary">{LENS_COPY.ko.fscore.what}</p>
          </div>

          {/* 판정 — 9칸 트래커 + 점수 */}
          <div className="mt-3.5 flex items-center justify-between gap-3">
            <div className="flex flex-1 gap-[3px]" style={{ maxWidth: 240 }}>
              {Array.from({ length: f.max }, (_, i) => (
                <span key={i} className={`h-3 flex-1 rounded-sm ${i < f.score ? 'bg-unjong-accent' : 'border border-unjong-border bg-unjong-background'}`} />
              ))}
            </div>
            <span className="whitespace-nowrap text-base font-bold text-unjong-primary">{f.score}<span className="text-xs font-normal text-unjong-muted"> / {f.max}</span></span>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-unjong-primary">9개 중 {f.score}개 양호 — 점수가 높을수록 재무가 튼튼해요. <span className="text-unjong-muted">지금은 {band} 구간이에요.{f.asOf ? ` (${f.asOf} 기준)` : ''}</span></p>

          {/* 자세히 — 9항목 3그룹 */}
          <details className="mt-3.5 border-t border-unjong-border pt-3">
            <summary className={SUMMARY_CLASS}>▾ 9개 항목 — 세 갈래로 보기</summary>
            <div className="mt-2.5 space-y-3">
              {GROUPS.map(([g, sub]) => {
                const items = f.criteria.filter((c) => c.group === g);
                const passed = items.filter((c) => c.pass).length;
                return (
                  <div key={g}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[12px] font-medium text-unjong-primary">{g} <span className="font-normal text-unjong-muted">{sub}</span></span>
                      <span className="text-[11px] text-unjong-muted"><span className={passed > 0 ? 'font-medium text-unjong-accent' : 'font-medium text-amber-600'}>{passed}</span>/{items.length} 통과</span>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {items.map((c) => (
                        <div key={c.key} className="flex items-baseline gap-1.5 text-[12px]">
                          <span className={c.pass ? 'text-unjong-up' : 'text-unjong-muted'}>{c.pass ? '✓' : '✗'}</span>
                          <span className="text-unjong-primary">{c.label} <span className="text-unjong-muted">({c.plain})</span></span>
                          <span className="ml-auto whitespace-nowrap tabular-nums text-unjong-muted">{c.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>

          {/* 자세히 — 점수 기준·유래·왜 건전성 */}
          <details className="mt-2.5">
            <summary className={SUMMARY_CLASS}>▾ 점수 기준 · 유래 · 왜 &apos;건전성&apos; 등급인지</summary>
            <div className="mt-2 space-y-2 border-l-2 border-unjong-border pl-2.5">
              <div>
                <p className="text-[11.5px] font-medium text-unjong-primary">점수 읽는 법</p>
                <p className="text-[12px] leading-relaxed text-unjong-muted">실무에선 보통 <span className="text-unjong-primary">7점↑ 양호 · 4~6 중간 · 0~3 취약</span>으로 봐요. 피오트로스키가 만든 9개 신호를 더한 값이에요(높을수록 튼튼).</p>
              </div>
              <div>
                <p className="text-[11.5px] font-medium text-unjong-primary">왜 &apos;건전성&apos; 등급이에요?</p>
                <p className="text-[12px] leading-relaxed text-unjong-muted">회계학자 피오트로스키가 2000년, 저평가 가치주 중 <span className="text-unjong-primary">진짜 부실한 곳을 걸러내려</span> 만든 지표예요. 다만 우리 넓은 표본·12년 백테스트에선 점수와 이후 수익률에 유효한 관계가 없었어요(t≈0.7). 그래서 &apos;수익 예측&apos;이 아니라 <span className="text-unjong-primary">재무 건전성 해석</span>으로만 써요 — 그게 이 렌즈 등급이 &apos;건전성&apos;인 이유예요.</p>
              </div>
            </div>
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

        <div className="mt-3 rounded-lg bg-unjong-background px-3 py-2.5">
          <p className="text-[11px] font-medium text-unjong-muted">이 화면 읽는 법</p>
          <p className="mt-1 text-xs leading-relaxed text-unjong-muted">각 렌즈는 <b className="text-unjong-primary">&apos;예측&apos;이 아니라</b>, 검증된 기법이 이 종목을 어떻게 읽는지예요. 기법마다 다르게 볼 수 있고 그 차이가 정보고요. 카드마다 <b className="text-unjong-primary">신뢰도 등급</b>이 붙어요 — <span className="text-unjong-accent">검증</span>(수익 신호 입증) · <span className="text-amber-600">표본약함</span> · <span className="text-unjong-muted">참고용</span> · <span className="text-amber-600">건전성</span>(재무 해석·수익 신호 아님). 우리는 &quot;사라/사지마라&quot; 안 해요.</p>
        </div>

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
                  {L.outlook ? (
                    <div className="mt-2.5">
                      <p className="text-[11px] font-medium text-unjong-muted">이 기법 방향</p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-unjong-primary/90">{L.outlook}</p>
                    </div>
                  ) : (L.verdict ? <p className="mt-2.5 text-[13px] leading-relaxed text-unjong-primary/90">{L.verdict.plain}</p> : null)}
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

      <p className="mt-6 max-w-4xl text-center text-[11px] text-unjong-muted">
        검증된 기법 렌즈로 이 종목을 읽어드려요 — 예측도, 권유도 아니에요. 판단은 당신 몫이에요.
      </p>
    </main>
  );
}
