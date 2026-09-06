'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation'; // useParams는 로케일 무관 — next/navigation 그대로
import { useRouter, usePathname } from '@/i18n/navigation';
import { pickLocale } from '@/lib/lensCopy';
import { formatPrice, formatTradeValue } from '@/lib/currency';
import { changeColorClass } from '@/lib/lensTones';
import { verdictLabel } from '@/components/reports/ReportRow';
import { useAuthStore } from '@/stores/authStore';
import { ExternalLink, Sparkles, ArrowLeft, Star } from 'lucide-react';

// 현재가 통화기호용 국가 코드(보드의 formatPrice 키와 동일 — KR/US/JP/HK/CN/VN/GB).
// 기존 isCN은 HK를 합쳐놔 formatPrice엔 못 씀(HK≠CN 통화) → 별도 도출.
const countryOf = (s: string) =>
  /^\d{6}(\.(KS|KQ))?$/i.test(s) ? 'KR'
  : /\.T$/i.test(s) ? 'JP'
  : /\.HK$/i.test(s) ? 'HK'
  : /\.(SS|SZ)$/i.test(s) ? 'CN'
  : /\.VN$/i.test(s) ? 'VN'
  : /\.L$/i.test(s) ? 'GB' : 'US';

type LensRead = {
  key: string;
  nameEn: string;
  name: string;
  summary: string;
  about: string;
  grade: string;
  gradeTier: 'strong' | 'partial' | 'ref';
  horizon: 'short' | 'mid' | 'long';
  short: string | null;
  long: string | null;
  detail: Record<string, number | null>;
  note?: string;
  verdict?: { phrase: string; plain: string; tone: 'pos' | 'warn' | 'flat' } | null;
  spectrum?: { labels: [string, string, string]; active: number } | null;
  headline?: string | null;
  outlook?: string | null;
  percentile?: number | null;
  cutoffs?: { lo: number; hi: number } | null;
  cutSource?: { market: string; n: number; asOf: string | null } | null; // 컷 출처(STEP 805 §6)
  valueBasis?: 'ttm' | 'annual' | null; // PER 기준(STEP 809 §1)
  state?: string | null;
  // STEP 831 §10 깊이 표준(근거 상세) — 미지원/결측이면 undefined.
  decomposition?: { identityKey: string; source?: 'direct' | 'computed'; parts: { key: string; value: number | null; unit: 'money' | 'pct' | 'x' }[] } | null;
  timeSeries?: { metricKey: string; unit: 'pct' | 'x' | 'money'; points: { year: number | null; value: number | null; missing?: boolean }[] } | null;
  distribution?: { market: string; n: number; asOf: string | null; min: number; p30: number; median: number; p70: number; max: number } | null;
};
type FCriterion = { key: string; label: string; pass: boolean; note: string; group: string; plain: string };
type FScoreResp = { supported: boolean; reason?: string; score: number; max: number; grade: string; criteria: FCriterion[]; asOf?: string };
type LensResp = { symbol: string; name?: string; price?: number | null; changePercent?: number | null; tradeAmount?: number | null; lenses?: LensRead[]; fscore?: FScoreResp | null; error?: string };
type EventDef = { item: string; label: string; klass: 'A' | 'B' | 'general'; lenses: string[]; severity: 'info' | 'watch' | 'serious'; flagLens: boolean };
type MatEvent = { date: string; items: string[]; defs: EventDef[]; link: string };
type EventsResp = { symbol: string; events?: MatEvent[] };

// 근거 수치 라벨 — 엔진이 주는 stable 키(rsi14·ma200vs…)를 언어별 표시로. 라벨 없는 키는 키 그대로(새 렌즈가 와도 안 깨짐).
// 이벤트 severity → 점 색(사실의 무게지 방향 아님)
function sevDot(sev: string): string {
  return sev === 'serious' ? 'bg-unjong-danger' : sev === 'watch' ? 'bg-amber-400' : 'bg-unjong-muted';
}

// 이벤트 → 렌즈별 플래그 맵. A(근거 흔듦)/B(새 맥락)만, general은 리스트에만.

// ── 공시 카드(STEP 792 신설 · 2026-09-05 ORDER_트릴리언홈피드로 AI 요약 제거) ──────────
// 6개국(KR/JP/GB/CN/VN/US) 공용 원료. 목록(제목·날짜·원문 링크)만 보여준다 — 검증된
// 증권사 리포트 옆에 LLM 생성 요약이 같은 신뢰도로 보이는 걸 막기 위해 AI 요약 블록을
// 제거했다(요약 API 라우트 자체는 안 지움, 화면 호출만 끊음). 기본 5건+동일날짜·제목 그룹핑은 유지.
type NormalizedFiling = {
  key: string;
  title: string; // 트림 전 원본 — 표시는 항상 trimTitle() 거침(원본 데이터 자체는 불변)
  date: string; // 그룹핑 키(국가별 포맷 그대로 — 정확히 같을 때만 묶어 과다묶임 방지)
  dateLabel: string; // 화면 표시용(국가별 포맷 적용 완료)
  href: string;
  material?: boolean;
  extraSub?: string; // JP reason처럼 제목 아래 보조 한 줄
};

function trimTitle(s: string): string {
  return s.trim().replace(/\s+/g, ' ');
}

// 같은 (키) 값을 가진 항목을 대표(rep)+나머지(extra)로 묶는다 — "임의 dedupe 금지": 건수는 그대로 보존하고 표시만 묶음.
function groupByKey<T>(items: T[], keyFn: (t: T) => string): { rep: T; extra: T[] }[] {
  const groups: { rep: T; extra: T[] }[] = [];
  const index = new Map<string, number>();
  for (const it of items) {
    const k = keyFn(it);
    const gi = index.get(k);
    if (gi != null) groups[gi].extra.push(it);
    else { index.set(k, groups.length); groups.push({ rep: it, extra: [] }); }
  }
  return groups;
}

// 공시 1행(또는 동일날짜·동일제목 그룹). AI 요약 제거 후 펼침 토글은 그룹(동일날짜·제목 2건+)일 때만
// 남긴다 — 개별 원문 링크를 다 보여주기 위해서다(그룹 아니면 펼쳐도 보여줄 게 없어 토글 자체를 안 그림).
// KR/JP/GB/CN/VN 5개국 공용(US는 defs 다중분류 구조가 달라 별도 UsMaterialRow).
function FilingRow({ group, materialLabel }: { group: { rep: NormalizedFiling; extra: NormalizedFiling[] }; materialLabel?: string }) {
  const t = useTranslations('StockLens');
  const items = [group.rep, ...group.extra];
  const [open, setOpen] = useState(false);
  const rep = group.rep;
  const isGroup = group.extra.length > 0;
  const isMaterial = materialLabel !== undefined && items.some((it) => it.material);
  const dotClass = materialLabel !== undefined ? (isMaterial ? 'bg-unjong-mint' : 'bg-unjong-muted/40') : 'bg-unjong-mint';
  return (
    <li>
      <div className="flex items-start gap-2 rounded-lg border border-unjong-border">
        <a href={rep.href} target="_blank" rel="noopener noreferrer nofollow" className="group flex min-w-0 flex-1 items-start gap-2 px-2.5 py-2 transition-colors hover:bg-unjong-background/40">
          <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium leading-snug text-unjong-primary">
              {trimTitle(rep.title)}
              {isMaterial ? <span className="ml-1.5 rounded bg-unjong-mint/10 px-1 py-0.5 text-[13px] sm:text-[10px] font-semibold text-unjong-mint">{materialLabel}</span> : null}
              {isGroup ? <span className="ml-1.5 rounded bg-unjong-background px-1 py-0.5 text-[13px] sm:text-[10px] text-unjong-muted">{t('events.groupCount', { n: items.length })}</span> : null}
            </p>
            {rep.extraSub ? <p className="mt-0.5 truncate text-[13px] sm:text-[11px] text-unjong-muted">{rep.extraSub}</p> : null}
            <p className="mt-0.5 text-[13px] sm:text-[11px] text-unjong-muted">{rep.dateLabel}</p>
          </div>
          <ExternalLink size={12} className="mt-1 shrink-0 text-unjong-muted opacity-0 transition-opacity group-hover:opacity-100" />
        </a>
        {isGroup ? (
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={t('events.expandAria')} className="flex h-11 w-11 shrink-0 items-center justify-center text-unjong-muted hover:text-unjong-accent">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
          </button>
        ) : null}
      </div>
      {open && isGroup ? (
        <div className="space-y-1.5 py-1.5 pl-1">
          {items.map((it, idx) => (
            <a key={it.key} href={it.href} target="_blank" rel="noopener noreferrer nofollow" className="block text-[13px] sm:text-[11px] font-medium text-unjong-accent hover:underline">
              {t('events.original', { n: idx + 1 })}
            </a>
          ))}
        </div>
      ) : null}
    </li>
  );
}

// 5개국(KR/JP/GB/CN/VN) 공용 공시 카드 — 기본 5건+더보기, 동일날짜·제목 그룹핑(AI 요약 없음).
function FilingsCard({ titleLabel, srcLabel, noticeNode, footerText, items, materialLabel, emptyNode }: {
  titleLabel: string; srcLabel: string; noticeNode: ReactNode; footerText: string; items: NormalizedFiling[]; materialLabel?: string; emptyNode?: ReactNode;
}) {
  const t = useTranslations('StockLens');
  const [expanded, setExpanded] = useState(false);
  // 빈 상태 안내(emptyNode)가 있으면 0건이어도 "공시 없음" 카드를 띄운다(정직한 결측·STEP 795 §5). 없으면 기존처럼 숨김(로딩 실패 등).
  if (!items.length && !emptyNode) return null;
  const groups = groupByKey(items, (it) => it.date + '|' + trimTitle(it.title));
  const visible = expanded ? groups : groups.slice(0, 5);
  const remaining = groups.length - 5;
  return (
    <div className="mt-3 rounded-2xl border border-unjong-border bg-unjong-surface p-3.5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-bold text-unjong-primary">{titleLabel}</span>
        <span className="text-[13px] sm:text-[11px] text-unjong-muted">{srcLabel}</span>
      </div>
      {items.length ? (
        <>
          {/* noticeNode("아직 렌즈에 안 반영된 최신 공시")는 공시가 있다는 전제 — 0건일 땐 출력 금지(STEP 797 §1). */}
          <p className="mt-0.5 text-[13px] sm:text-[11px] leading-relaxed text-unjong-muted">{noticeNode}</p>
          <ul className="mt-2.5 space-y-1.5">
            {visible.map((g) => <FilingRow key={g.rep.key} group={g} materialLabel={materialLabel} />)}
          </ul>
          {!expanded && remaining > 0 ? (
            <button type="button" onClick={() => setExpanded(true)} className="mt-2 text-[13px] sm:text-[11px] font-medium text-unjong-accent hover:underline">
              {t('events.showMore', { n: remaining })}
            </button>
          ) : null}
        </>
      ) : (
        <p className="mt-2.5 rounded-lg border border-unjong-border bg-unjong-background/40 px-2.5 py-2 text-[13px] sm:text-[12px] text-unjong-muted">{emptyNode}</p>
      )}
      <p className="mt-2 text-[13px] sm:text-[10px] leading-relaxed text-unjong-muted">{footerText}</p>
    </div>
  );
}

// STEP 595: KR 공시 이벤트 층(DART). US EventLayer(EDGAR)의 KR 짝.
type KrEvent = { date: string; report_nm: string; rcept_no: string; url: string };
function KrEventLayer({ symbol }: { symbol: string }) {
  const t = useTranslations('StockLens');
  const [events, setEvents] = useState<KrEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch('/api/kr-events?symbol=' + encodeURIComponent(symbol))
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((j) => { if (!alive) return; if (j.error) { setError(true); setLoaded(true); return; } setEvents(j.events || []); setLoaded(true); }) // error(fetch_failed·unsupported)면 숨김(STEP 797)
      .catch(() => { if (alive) { setError(true); setLoaded(true); } });
    return () => { alive = false; };
  }, [symbol]);
  if (!loaded || error) return null;
  const fmtD = (s: string) => (/^\d{8}$/.test(s) ? `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}` : s);
  const items: NormalizedFiling[] = events.map((e, i) => ({
    key: e.rcept_no || String(i),
    title: e.report_nm,
    date: e.date,
    dateLabel: fmtD(e.date),
    href: e.url,
  }));
  return (
    <FilingsCard
      titleLabel={t('events.recentFilings')}
      srcLabel={t('events.srcDart')}
      noticeNode={t.rich('events.notReflected', { b: (c) => <b className="text-unjong-primary">{c}</b> })}
      footerText={t('events.goDart')}
      items={items}
      emptyNode={t.rich('events.noMaterial', { b: (c) => <b className="text-unjong-primary">{c}</b> })}
    />
  );
}

// STEP 650: JP 공시 이벤트 층(EDINET·미리계산). US EventLayer(EDGAR)·KR KrEventLayer(DART)의 JP 짝.
// 원문 = /api/jp-events/doc 프록시(키 서버측 PDF).
type JpEvent = { doc_id: string; title: string; date: string; reason: string | null; material: boolean; type_code: string | null };
function JpEventLayer({ symbol }: { symbol: string }) {
  const t = useTranslations('StockLens');
  const [events, setEvents] = useState<JpEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch('/api/jp-events?symbol=' + encodeURIComponent(symbol))
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((j) => { if (!alive) return; if (j.error) { setError(true); setLoaded(true); return; } setEvents(j.events || []); setLoaded(true); }) // error(fetch_failed·unsupported)면 숨김(STEP 797)
      .catch(() => { if (alive) { setError(true); setLoaded(true); } });
    return () => { alive = false; };
  }, [symbol]);
  if (!loaded || error) return null;
  const fmtD = (s: string) => { const d = new Date(s); return isNaN(+d) ? s : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; };
  const items: NormalizedFiling[] = events.map((e) => ({
    key: e.doc_id,
    title: e.title,
    date: e.date,
    dateLabel: fmtD(e.date),
    href: `/api/jp-events/doc?docid=${encodeURIComponent(e.doc_id)}`,
    material: e.material,
    extraSub: e.reason ?? undefined,
  }));
  return (
    <FilingsCard
      titleLabel={t('events.recentFilings')}
      srcLabel={t('events.srcEdinet')}
      noticeNode={t.rich('events.notReflected', { b: (c) => <b className="text-unjong-primary">{c}</b> })}
      footerText={t('events.goEdinet')}
      items={items}
      materialLabel={t('events.material')}
      emptyNode={t.rich('events.noMaterial', { b: (c) => <b className="text-unjong-primary">{c}</b> })}
    />
  );
}

// STEP 653: GB 공시 이벤트 층(RNS via Investegate·온디맨드). US/KR/JP 이벤트층의 GB 짝.
// 제목은 영어(RNS 원문). 원문=Investegate 링크(귀속).
type GbEvent = { id: string; title: string; date: string; time: string; source: string; url: string; material: boolean };
function GbEventLayer({ symbol }: { symbol: string }) {
  const t = useTranslations('StockLens');
  const [events, setEvents] = useState<GbEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch('/api/gb-events?symbol=' + encodeURIComponent(symbol))
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((j) => { if (!alive) return; if (j.error) { setError(true); setLoaded(true); return; } setEvents(j.events || []); setLoaded(true); }) // error(fetch_failed·unsupported)면 숨김(STEP 797)
      .catch(() => { if (alive) { setError(true); setLoaded(true); } });
    return () => { alive = false; };
  }, [symbol]);
  if (!loaded || error) return null;
  const items: NormalizedFiling[] = events.map((e) => ({
    key: e.id,
    title: e.title,
    date: e.date,
    dateLabel: e.date,
    href: e.url,
    material: e.material,
  }));
  return (
    <FilingsCard
      titleLabel={t('events.recentFilings')}
      srcLabel={t('events.srcRns')}
      noticeNode={t.rich('events.notReflected', { b: (c) => <b className="text-unjong-primary">{c}</b> })}
      footerText={t('events.goRns')}
      items={items}
      materialLabel={t('events.material')}
      emptyNode={t.rich('events.noMaterial', { b: (c) => <b className="text-unjong-primary">{c}</b> })}
    />
  );
}

type CnEvent = { id: string; title: string; date: string; source: string; url: string; pdf: string; material: boolean };
function CnEventLayer({ symbol }: { symbol: string }) {
  const t = useTranslations('StockLens');
  const [events, setEvents] = useState<CnEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch('/api/cn-events?symbol=' + encodeURIComponent(symbol))
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((j) => { if (!alive) return; if (j.error) { setError(true); setLoaded(true); return; } setEvents(j.events || []); setLoaded(true); }) // error(fetch_failed·unsupported)면 숨김(STEP 797)
      .catch(() => { if (alive) { setError(true); setLoaded(true); } });
    return () => { alive = false; };
  }, [symbol]);
  if (!loaded || error) return null;
  const items: NormalizedFiling[] = events.map((e) => ({
    key: e.id,
    title: e.title,
    date: e.date,
    dateLabel: e.date,
    href: e.url,
    material: e.material,
  }));
  const srcLabel = events[0]?.source === 'HKEXnews' ? t('events.srcHkex') : t('events.srcCninfo');
  const footerText = events[0]?.source === 'HKEXnews' ? t('events.goHkex') : t('events.goCninfo');
  return (
    <FilingsCard
      titleLabel={t('events.recentFilings')}
      srcLabel={srcLabel}
      noticeNode={t.rich('events.notReflected', { b: (c) => <b className="text-unjong-primary">{c}</b> })}
      footerText={footerText}
      items={items}
      materialLabel={t('events.material')}
      emptyNode={t.rich('events.noMaterial', { b: (c) => <b className="text-unjong-primary">{c}</b> })}
    />
  );
}
type VnEvent = { id: string; title: string; date: string; source: string; url: string; material: boolean };
function VnEventLayer({ symbol }: { symbol: string }) {
  const t = useTranslations('StockLens');
  const [events, setEvents] = useState<VnEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch('/api/vn-events?symbol=' + encodeURIComponent(symbol))
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((j) => { if (!alive) return; if (j.error) { setError(true); setLoaded(true); return; } setEvents(j.events || []); setLoaded(true); }) // error(fetch_failed·unsupported)면 숨김(STEP 797)
      .catch(() => { if (alive) { setError(true); setLoaded(true); } });
    return () => { alive = false; };
  }, [symbol]);
  if (!loaded || error) return null;
  const items: NormalizedFiling[] = events.map((e) => ({
    key: e.id,
    title: e.title,
    date: e.date,
    dateLabel: e.date,
    href: e.url,
    material: e.material,
  }));
  return (
    <FilingsCard
      titleLabel={t('events.recentNews')}
      srcLabel={t('events.srcGnews')}
      noticeNode={t.rich('events.notReflectedNews', { b: (c) => <b className="text-unjong-primary">{c}</b> })}
      footerText={t('events.goNews')}
      items={items}
      materialLabel={t('events.major')}
      emptyNode={t.rich('events.noRecentNews', { b: (c) => <b className="text-unjong-primary">{c}</b> })}
    />
  );
}

// R3: 종목 최근 뉴스 요약 + 중립 토픽 태그(지연·조건부·헤드라인 없으면 숨김). 뉴스=사실 브리핑, 감성 점수 아님.
function StockNewsBrief({ symbol }: { symbol: string }) {
  const t = useTranslations('StockLens');
  const locale = pickLocale(useLocale()); // 뉴스요약도 로케일별 생성·캐시(?lang=) — 안 넘기면 en 화면에 한국어 요약이 온다
  const [d, setD] = useState<{ summary: string; tags: string[] } | null>(null);
  // STEP 809 §6: 실패(429·502·500)를 조용히 숨기지 않는다 — 진짜 '뉴스 없음'(200+summary:null)만 숨기고 실패는 결측 1줄로 표시.
  const [state, setState] = useState<'loading' | 'done' | 'hide' | 'error'>('loading');
  useEffect(() => {
    let alive = true;
    setState('loading');
    fetch('/api/news-brief?symbol=' + encodeURIComponent(symbol) + '&lang=' + locale)
      .then(async (r) => {
        const j = await r.json().catch(() => ({} as Record<string, unknown>));
        if (!alive) return;
        if (r.ok && j.summary) { setD({ summary: j.summary as string, tags: (j.tags as string[]) || [] }); setState('done'); }
        else if (r.ok && !j.error) setState('hide'); // 진짜 뉴스 없음(200·summary null·error 없음) → 숨김
        else setState('error'); // 429(레이트리밋)·502(LLM)·500(키) 등 → 실패 표시
      })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [symbol, locale]);
  if (state === 'hide') return null;
  return (
    <div className="mt-3 rounded-2xl border border-unjong-accent/20 bg-unjong-accent/5 p-3.5">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Sparkles size={13} className="text-unjong-accent" />
        <span className="text-[13px] font-bold text-unjong-accent">{t('newsBrief.title')}</span>
        <span className="ml-auto text-[13px] sm:text-[10px] text-unjong-muted">{t('newsBrief.badge')}</span>
      </div>
      {state === 'error'
        ? <p className="text-[13px] sm:text-[12px] text-unjong-muted">{t('loadError')}</p>
        : state === 'loading' || !d
        ? <p className="text-[13px] sm:text-[12px] text-unjong-muted">{t('newsBrief.loading')}</p>
        : (<>
            <p className="text-[15px] leading-relaxed sm:text-[13px] text-unjong-primary">{d.summary}</p>
            {d.tags.length ? <div className="mt-2 flex flex-wrap gap-1.5">{d.tags.map((tag, i) => <span key={i} className="rounded-full border border-unjong-border bg-unjong-surface px-2 py-0.5 text-[13px] sm:text-[10px] text-unjong-muted">{tag}</span>)}</div> : null}
          </>)}
    </div>
  );
}

// 이벤트 사실 레이어 — 최근 중대 8-K(사실만·예측 없음). 렌즈 점수엔 안 섞임.
// US 중대 이벤트(material) 1행(또는 동일날짜·동일라벨 그룹) — FilingRow의 US 짝. defs 다중분류(severity·item 배지·"왜")
// 구조가 5개국 공용 NormalizedFiling과 달라 별도 컴포넌트지만, trimTitle·그룹 배지는 그대로 공유한다
// (STEP 792 — "추출이 위험하면 6벌 동일 수정" 조항에 따른 절충. 2026-09-05 AI 요약 제거로 온디맨드 fetch는 없앰).
function UsMaterialRow({ group }: { group: { rep: MatEvent; extra: MatEvent[] } }) {
  const t = useTranslations('StockLens');
  const items = [group.rep, ...group.extra];
  const [open, setOpen] = useState(false);
  const rep = group.rep;
  const d = rep.defs[0];
  if (!d) return null;
  const why = d.klass === 'A' ? t('events.whyA') : d.klass === 'B' ? t('events.whyB') : t('events.whyGeneral');
  const isGroup = group.extra.length > 0;
  return (
    <li>
      <div className="flex items-start gap-2 rounded-lg border border-unjong-border">
        <a href={rep.link} target="_blank" rel="noopener noreferrer nofollow" className="group flex min-w-0 flex-1 items-start gap-2 px-2.5 py-2 transition-colors hover:bg-unjong-background/40">
          <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${sevDot(d.severity)}`} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span className="text-[13px] font-medium text-unjong-primary">{trimTitle(d.label)}</span>
              {rep.defs.length > 1 ? <span className="text-[13px] sm:text-[11px] text-unjong-muted">{t('events.andMore', { n: rep.defs.length - 1 })}</span> : null}
              <span className="rounded bg-unjong-background px-1 py-0.5 text-[13px] sm:text-[10px] text-unjong-muted">{rep.defs.map((x) => x.item).join('·')}</span>
              {isGroup ? <span className="rounded bg-unjong-background px-1 py-0.5 text-[13px] sm:text-[10px] text-unjong-muted">{t('events.groupCount', { n: items.length })}</span> : null}
            </div>
            <p className="mt-0.5 text-[13px] sm:text-[11px] text-unjong-muted">{rep.date} · {why}</p>
          </div>
          <ExternalLink size={12} className="mt-1 shrink-0 text-unjong-muted opacity-0 transition-opacity group-hover:opacity-100" />
        </a>
        {isGroup ? (
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={t('events.expandAria')} className="flex h-11 w-11 shrink-0 items-center justify-center text-unjong-muted hover:text-unjong-accent">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
          </button>
        ) : null}
      </div>
      {open && isGroup ? (
        <div className="space-y-1.5 py-1.5 pl-1">
          {items.map((e, idx) => (
            <a key={e.link + idx} href={e.link} target="_blank" rel="noopener noreferrer nofollow" className="block text-[13px] sm:text-[11px] font-medium text-unjong-accent hover:underline">
              {t('events.original', { n: idx + 1 })}
            </a>
          ))}
        </div>
      ) : null}
    </li>
  );
}

// symbol은 더 이상 안 쓴다(AI 요약 URL 생성용이었음) — 형제 *EventLayer들과 호출부 인터페이스만 맞춘다.
function EventLayer({ events }: { events: MatEvent[]; symbol?: string }) {
  const t = useTranslations('StockLens');
  const [showRoutine, setShowRoutine] = useState(false);
  const [expandedMaterial, setExpandedMaterial] = useState(false);
  if (!events.length) return null;
  const sevRank = (e: MatEvent) => e.defs.reduce((m, d) => Math.max(m, d.severity === 'serious' ? 2 : d.severity === 'watch' ? 1 : 0), 0);
  const material = events.filter((e) => sevRank(e) >= 1).sort((a, b) => sevRank(b) - sevRank(a)); // 중대(serious/watch)=기본 노출
  const routine = events.filter((e) => sevRank(e) === 0); // 루틴(info)=묶어 접힘(기존 그대로 — 이미 요약 자동호출 없었음)
  const groups: { label: string; count: number }[] = [];
  for (const e of routine) {
    const l = e.defs[0]?.label ?? t('events.etcLabel');
    const g = groups.find((x) => x.label === l);
    if (g) g.count += 1; else groups.push({ label: l, count: 1 });
  }
  const routineRow = (e: MatEvent, i: number) => {
    const d = e.defs[0];
    if (!d) return null;
    const why = d.klass === 'A' ? t('events.whyA') : d.klass === 'B' ? t('events.whyB') : t('events.whyGeneral');
    return (
      <li key={i}>
        <a href={e.link} target="_blank" rel="noopener noreferrer nofollow" className="group flex items-start gap-2 rounded-lg border border-unjong-border px-2.5 py-2 transition-colors hover:bg-unjong-background/40">
          <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${sevDot(d.severity)}`} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span className="text-[13px] font-medium text-unjong-primary">{trimTitle(d.label)}</span>
              {e.defs.length > 1 ? <span className="text-[13px] sm:text-[11px] text-unjong-muted">{t('events.andMore', { n: e.defs.length - 1 })}</span> : null}
              <span className="rounded bg-unjong-background px-1 py-0.5 text-[13px] sm:text-[10px] text-unjong-muted">{e.defs.map((x) => x.item).join('·')}</span>
            </div>
            <p className="mt-0.5 text-[13px] sm:text-[11px] text-unjong-muted">{e.date} · {why}</p>
          </div>
          <ExternalLink size={12} className="mt-1 shrink-0 text-unjong-muted opacity-0 transition-opacity group-hover:opacity-100" />
        </a>
      </li>
    );
  };
  const materialGroups = groupByKey(material, (e) => e.date + '|' + trimTitle(e.defs[0]?.label ?? ''));
  const visibleMaterialGroups = expandedMaterial ? materialGroups : materialGroups.slice(0, 5);
  const remainingMaterial = materialGroups.length - 5;
  return (
    <div className="mt-3 rounded-2xl border border-unjong-border bg-unjong-surface p-3.5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-bold text-unjong-primary">{t('events.recentFilingsUs')}</span>
        <span className="text-[13px] sm:text-[11px] text-unjong-muted">{t('events.srcSec')}</span>
      </div>
      <p className="mt-0.5 text-[13px] sm:text-[11px] leading-relaxed text-unjong-muted">{t.rich('events.notReflected', { b: (c) => <b className="text-unjong-primary">{c}</b> })}</p>
      {material.length ? (
        <>
          <ul className="mt-2.5 space-y-1.5">{visibleMaterialGroups.map((g) => <UsMaterialRow key={g.rep.link} group={g} />)}</ul>
          {!expandedMaterial && remainingMaterial > 0 ? (
            <button type="button" onClick={() => setExpandedMaterial(true)} className="mt-2 text-[13px] sm:text-[11px] font-medium text-unjong-accent hover:underline">
              {t('events.showMore', { n: remainingMaterial })}
            </button>
          ) : null}
        </>
      ) : (
        <p className="mt-2.5 rounded-lg border border-unjong-border bg-unjong-background/40 px-2.5 py-2 text-[13px] sm:text-[12px] text-unjong-muted">{t.rich('events.noMaterial', { b: (c) => <b className="text-unjong-primary">{c}</b> })}</p>
      )}
      {routine.length ? (
        <div className="mt-2">
          <button type="button" onClick={() => setShowRoutine((v) => !v)} className="flex w-full items-center gap-1 text-left text-[13px] sm:text-[11px] text-unjong-muted hover:text-unjong-accent">
            <span className={`inline-block transition-transform ${showRoutine ? 'rotate-90' : ''}`}>▸</span>
            <span>{t('events.routine', { n: routine.length })} <span className="text-unjong-muted/80">· {groups.map((g) => `${g.label} ${g.count}`).join(' · ')}</span></span>
          </button>
          {showRoutine ? <ul className="mt-1.5 space-y-1.5">{routine.map((e, i) => routineRow(e, i))}</ul> : null}
        </div>
      ) : null}
      <p className="mt-2 text-[13px] sm:text-[10px] leading-relaxed text-unjong-muted">{t('events.goSec')}</p>
    </div>
  );
}


// 상세 헤더 아이콘 전용 관심 별(STEP 771 §2) — 모바일 리스트 별 제거의 대체 진입점. market 관례=KR만 'KRX', 그 외는 country와 동일(보드 컴포넌트들과 동일 규칙).
function WatchStarToggle({ symbol, name, country }: { symbol: string; name: string; country: string }) {
  const tb = useTranslations('Board'); // '관심종목 추가/해제' 재사용(dedup)
  const { user, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname(); // 로케일 무관 경로 — 로그인 후 이 종목으로 복귀(next)
  const [watched, setWatched] = useState<boolean | null>(null); // null=조회 전
  const [pop, setPop] = useState(false);
  const inFlight = useRef(false); // 연타 방지(STEP 804 §5)

  useEffect(() => {
    if (!user) { setWatched(false); return; }
    let alive = true;
    fetch('/api/watchlist').then((r) => r.json()).then((j) => {
      if (!alive) return;
      const set = new Set(((j.watchlist ?? []) as { symbol: string }[]).map((w) => w.symbol));
      setWatched(set.has(symbol));
    }).catch(() => { if (alive) setWatched(false); });
    return () => { alive = false; };
  }, [user, symbol]);

  function toggle() {
    if (authLoading) return; // 하이드레이션 중엔 판단 보류(로그인 사용자가 로그인 페이지로 튕기지 않게·STEP 804 §6)
    if (!user) { router.push(`/auth/login?next=${encodeURIComponent(pathname)}`); return; }
    if (inFlight.current) return; // 연타 방지
    inFlight.current = true;
    const next = !watched;
    setWatched(next);
    setPop(true);
    setTimeout(() => setPop(false), 200);
    const market = country === 'KR' ? 'KRX' : country;
    fetch('/api/watchlist', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, name_ko: name, market, country, add: next }),
    }).then((r) => { if (!r.ok) setWatched(!next); }) // 400(비대상 시장 거부 등) 응답은 throw하지 않아 res.ok로 별도 확인 필요(STEP 799)
      .catch(() => setWatched(!next))
      .finally(() => { inFlight.current = false; });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={watched ? tb('watchRemove') : tb('watchAdd')}
      className={`flex h-11 w-11 shrink-0 items-center justify-center transition-transform duration-200 ${pop ? 'scale-125' : 'scale-100'} ${watched ? 'text-unjong-mint' : 'text-unjong-muted'}`}
    >
      <Star size={24} fill={watched ? 'currentColor' : 'none'} />
    </button>
  );
}

// 🔴 2026-09-05(ORDER_트릴리언리포트렌더): channel_reports를 symbol로 읽어 시간순 카드로 쌓는다.
// 디자인 최소 — 새 색·레이아웃 발명 없이 기존 다크 토큰만 재사용. verdict·가격은 landing.json 원문 문자열
// 그대로 출력(파싱·재계산 금지) — API가 이미 report_date desc로 정렬해서 준다.
type ChannelReport = {
  report_date: string;
  broker: string;
  verdict: string | null;
  target_price: string | null;
  current_price: string | null;
  upside: string | null;
  reasons: { title: string; detail?: string }[] | null;
  earnings_summary: string | null;
  broker_average: string | null;
  title: string | null; // ORDER_트릴리언국가확장구조_0905 STEP2 — 채널이 보내는 영상 제목/대표 소제목
};

function verdictClass(v: string | null): string {
  if (v === '상향') return 'text-unjong-up';
  if (v === '하향') return 'text-unjong-down';
  return 'text-unjong-primary';
}
// verdict는 채널 수집 코드가 쓰는 한국어 고정 어휘(자유번역 절대 금지 — 콘텐츠 번역 구현 8번 안전장치) —
// components/reports/ReportRow.tsx의 고정 사전(verdictLabel)을 그대로 재사용한다(재구현 금지).

// 리포트 상세 본문(이유 전체·실적 전망) — 최신 1건은 항상 펼침, 과거 건은 클릭해야 같은 수준으로 펼쳐진다
// (2026-09-05 ORDER_트릴리언리포트상세화 STEP1: 요약 카드였던 걸 "텍스트로 가장 깊게 읽는 곳"으로).
function ReportDetail({ r }: { r: ChannelReport }) {
  const t = useTranslations('StockLens');
  return (
    <>
      {r.current_price || r.target_price || r.upside ? (
        <p className="mt-2 text-[13px] tabular-nums text-unjong-muted">
          {r.current_price ? <>{t('reports.currentPrice')} {r.current_price}</> : null}
          {r.target_price ? <>{r.current_price ? ' · ' : ''}{t('reports.targetPrice')} {r.target_price}</> : null}
          {r.upside ? <>{(r.current_price || r.target_price) ? ' · ' : ''}{t('reports.upside')} {r.upside}</> : null}
        </p>
      ) : null}
      {r.broker_average ? (
        <p className="mt-1 text-[13px] text-unjong-muted">{t('reports.brokerAverage')} {r.broker_average}</p>
      ) : null}
      {r.reasons?.length ? (
        <div className="mt-3 space-y-1.5">
          <p className="text-[13px] font-semibold text-unjong-primary">{t('reports.reasonsLabel')}</p>
          {r.reasons.map((reason, ri) => (
            <div key={ri}>
              <p className="text-[13px] font-medium text-unjong-primary">{ri + 1}. {reason.title}</p>
              {reason.detail ? <p className="text-[13px] leading-relaxed text-unjong-muted">{reason.detail}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
      {r.earnings_summary ? (
        <div className="mt-3 border-t border-unjong-border pt-2.5">
          <p className="text-[13px] font-semibold text-unjong-primary">{t('reports.earningsSummaryLabel')}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-unjong-muted">{r.earnings_summary}</p>
        </div>
      ) : null}
    </>
  );
}

function ReportLayer({ symbol }: { symbol: string }) {
  const t = useTranslations('StockLens');
  const locale = pickLocale(useLocale()); // 2026-09-06: 번역(?lang=)·verdict 라벨 둘 다 이 값 기준
  const [reports, setReports] = useState<ChannelReport[] | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set()); // 최신(index 0)은 항상 펼침 — 여긴 과거 건만 담는다

  useEffect(() => {
    if (!symbol) return;
    let alive = true;
    fetch('/api/channel-reports?symbol=' + encodeURIComponent(symbol) + '&lang=' + locale)
      .then((r) => r.json())
      .then((j) => { if (alive) setReports(j.reports ?? []); })
      .catch(() => { if (alive) setReports([]); });
    return () => { alive = false; };
  }, [symbol, locale]);

  if (reports === null) return null; // 로딩 중 — 최소 디자인이라 스켈레톤 생략(깜빡임 방지 목적만)

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-unjong-border bg-unjong-surface/50 p-6 text-center">
        <p className="text-sm font-medium text-unjong-primary">{t('reportComingSoon')}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-unjong-muted">{t('reportComingSoonDesc')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-unjong-primary">{t('reports.title')}</h2>
      {reports.map((r, i) => {
        const isLatest = i === 0;
        const isOpen = isLatest || expanded.has(i);
        return (
          <div key={i} className="rounded-2xl border border-unjong-border bg-unjong-surface p-4">
            {r.title ? <p className="mb-1.5 text-[14px] font-semibold text-unjong-primary">{r.title}</p> : null}
            {isLatest ? (
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[13px] font-medium text-unjong-primary">{r.report_date} · {r.broker}</span>
                {r.verdict ? <span className={`text-sm font-bold ${verdictClass(r.verdict)}`}>{verdictLabel(locale, r.verdict)}</span> : null}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setExpanded((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; })}
                aria-expanded={isOpen}
                aria-label={t('reports.expandAria')}
                className="flex w-full flex-wrap items-baseline justify-between gap-2 text-left"
              >
                <span className="text-[13px] font-medium text-unjong-primary">{r.report_date} · {r.broker}</span>
                <span className="flex items-center gap-2">
                  {r.verdict ? <span className={`text-sm font-bold ${verdictClass(r.verdict)}`}>{verdictLabel(locale, r.verdict)}</span> : null}
                  {r.target_price ? <span className="text-[13px] tabular-nums text-unjong-muted">{r.target_price}</span> : null}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-unjong-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
                </span>
              </button>
            )}
            {isOpen ? <ReportDetail r={r} /> : null}
          </div>
        );
      })}
    </div>
  );
}

export default function StockLensClient({ initialName }: { initialName?: string }) {
  const t = useTranslations('StockLens');
  const locale = pickLocale(useLocale()); // 가격 포맷·번역 언어(?lang=) — 안 넘기면 en 화면에 한국어가 온다
  const params = useParams();
  const router = useRouter();
  const symbol = decodeURIComponent(String(params?.symbol || ''));
  const isKR = /^\d{6}(\.(KS|KQ))?$/i.test(symbol); // KR 6자리(±.KS/.KQ) → DART 공시 층
  const isJP = /^\d{4}\.T$/i.test(symbol); // JP 4자리.T → EDINET 공시 층
  const isGB = /\.L$/i.test(symbol); // GB {TIDM}.L → RNS(Investegate) 공시 층
  const isVN = /\.VN$/i.test(symbol); // VN {TICKER}.VN → 공시(Google News RSS·vi) 층
  const isCN = /(\d{6}\.(SS|SZ)|\d{1,5}\.HK)$/i.test(symbol); // A주 cninfo + HK HKEXnews
  const [data, setData] = useState<LensResp | null>(null);
  const [events, setEvents] = useState<MatEvent[]>([]);

  // 🔴 2026-09-05(ORDER_트릴리언종목페이지비우기): 렌즈 카드·F스코어·AI 브리핑 등 모델 UI는 지웠지만
  // 이 fetch는 그대로 둔다 — 현재가·등락률·거래대금·이름이 /api/lens 응답에 같이 담겨 있어(계산 로직은
  // 이번 STEP에서 안 건드림), 호출까지 끊으면 가격 표시가 사라진다. data.lenses/data.fscore는 이제 안 쓴다.
  useEffect(() => {
    if (!symbol) return;
    let alive = true;
    setData(null); // 심볼·로케일 변경 시 옛 데이터 즉시 비움
    fetch('/api/lens?symbol=' + encodeURIComponent(symbol) + '&lang=' + locale)
      .then((r) => r.json())
      .then((j) => { if (alive) setData(j); })
      .catch(() => {});
    return () => { alive = false; };
  }, [symbol, locale]);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    fetch('/api/events?symbol=' + encodeURIComponent(symbol) + '&lang=' + locale) // 공시 라벨도 언어별 — 안 넘기면 en 화면에 한국어 라벨
      .then((r) => r.json())
      .then((j: EventsResp) => { if (!cancelled) setEvents(j.events ?? []); })
      .catch(() => { if (!cancelled) setEvents([]); });
    return () => { cancelled = true; };
  }, [symbol, locale]);

  const ticker = symbol.replace(/\.(KS|KQ|T|HK|SS|SZ|VN|L)$/, '');

  return (
    <main className="mx-auto max-w-[1040px] px-4 py-6 sm:px-6">
      <button type="button" onClick={() => { if (typeof window !== 'undefined' && window.history.length > 1) router.back(); else router.push('/'); }} className="inline-flex min-h-11 items-center gap-1.5 text-sm text-unjong-muted hover:text-unjong-accent">
        <ArrowLeft size={20} />
        {t('back')}
      </button>

      <div className="mt-3 max-w-4xl">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-baseline gap-x-2">
              <h1 className="text-xl font-bold text-unjong-primary">{initialName || data?.name || ticker}</h1>
              <span className="text-sm text-unjong-muted">{ticker}</span>
            </div>
            {data?.price != null ? (
              <p className="text-[15px] tabular-nums text-unjong-muted sm:text-sm">
                {formatPrice(data.price, countryOf(symbol))}
                {data.changePercent != null ? (
                  <span className={changeColorClass(data.changePercent, locale)}> {data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%</span>
                ) : null}
                {/* STEP 809 §7: 거래대금=전 거래일 스냅샷 / 등락률=실시간 → 시점 다름을 표기(한 줄에 시점 혼재 정직화) */}
                {data.tradeAmount != null ? <span> · {t('tradeAmount')} {formatTradeValue(data.tradeAmount, countryOf(symbol))} <span className="text-[11px]">{t('tradeAmountBasis')}</span></span> : null}
              </p>
            ) : null}
          </div>
          <WatchStarToggle symbol={symbol} name={initialName || data?.name || ticker} country={countryOf(symbol)} />
        </div>
      </div>

      {/* 🔴 2026-09-05: 리포트 레이어 — channel_reports를 symbol로 읽어 시간순 카드로(ORDER_트릴리언리포트렌더_0905) */}
      <div className="mt-4 max-w-4xl">
        <ReportLayer symbol={symbol} />
      </div>

      <div className="mt-4 max-w-4xl">
        {isKR ? <KrEventLayer symbol={symbol} /> : isJP ? <JpEventLayer symbol={symbol} /> : isGB ? <GbEventLayer symbol={symbol} /> : isVN ? <VnEventLayer symbol={symbol} /> : isCN ? <CnEventLayer symbol={symbol} /> : <EventLayer events={events} symbol={symbol} />}
        <StockNewsBrief symbol={symbol} />{/* R3: KR 포함 전 국가 — 라우트가 KR이면 한글명·한국 뉴스로 분기 */}
      </div>
    </main>
  );
}
