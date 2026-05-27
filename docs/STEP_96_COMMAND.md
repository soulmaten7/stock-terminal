<!-- 2026-05-27 -->
# STEP 96 — 단타창 카드 4개 추가 (VI · NetBuy+거래원 · 테마 · 공매도)

> **목표**: 단타창 카드 3개 → 7개 완성. 채팅 흐름과 화면 정보 100% 동기화.
> **세션**: #25 (Layer 1 첫 작업)
> **전제**: STEP 95-A 완료 (V3 헤더 잔재 제거), Layer 0 정리 완료
> **참조 스펙**: `docs/PRODUCT_SPEC_V4.md` 섹션 5-3 (단타창 카드 7개)

---

## 실행 명령어 (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

그 다음 Claude Code 에:

```
@docs/STEP_96_COMMAND.md 파일 내용대로 실행해줘
```

---

## 핵심 원칙

1. **Layer 0 단계 — 더미 데이터로 시각화만** — 실 API 연결은 Layer 1 후속 STEP
2. **채팅 메시지 100% 커버** — 좌측 채팅의 "VI 걸렸다", "거래원 키움 매집", "공매도 숏커버" 모두 화면에서 즉시 확인 가능해야 함
3. **CardContainer wrapper 재사용** — STEP 92 의 일관 디자인 유지
4. **그리드 7개 = 3+3+1** — 데스크탑 xl 에서 3열 × 3행 (마지막 행 1개)
5. **카드 안 내용은 종목 클릭 시 우측 패널 연결** — Layer 0 의 패턴 동일

---

## 작업 1 — `components/cards/ScalperCards.tsx` 확장

기존 파일에 카드 4개 추가. 더미 데이터 풍성하게.

### 추가할 더미 데이터 (파일 상단 const 영역)

```tsx
// ─── VI (변동성 완화장치) 발동/해제 ───
const VI_EVENTS = [
  { code: "247540", name: "에코프로비엠", state: "발동" as const, type: "정적", time: "14:32", changePct: 12.5, price: "412,000" },
  { code: "086520", name: "에코프로", state: "발동" as const, type: "동적", time: "14:28", changePct: 8.7, price: "892,000" },
  { code: "035720", name: "카카오", state: "해제" as const, type: "정적", time: "14:25", changePct: 10.2, price: "53,400" },
  { code: "032500", name: "케이엠더블유", state: "발동" as const, type: "정적", time: "14:21", changePct: 11.4, price: "78,200" },
  { code: "005490", name: "POSCO홀딩스", state: "해제" as const, type: "정적", time: "14:15", changePct: -8.2, price: "342,500" },
];

// ─── NetBuy (외인/기관) + 거래원 매수상위 ───
const NETBUY_WITH_BROKERS = [
  { code: "005930", name: "삼성전자", foreign: 124, institution: -85, topBroker: "키움증권" },
  { code: "000660", name: "SK하이닉스", foreign: 89, institution: 42, topBroker: "한국투자" },
  { code: "035720", name: "카카오", foreign: 56, institution: 28, topBroker: "미래에셋" },
  { code: "035420", name: "NAVER", foreign: 34, institution: -12, topBroker: "NH투자" },
  { code: "247540", name: "에코프로비엠", foreign: 78, institution: 51, topBroker: "키움증권" },
];

// ─── 테마 TOP10 ───
const THEME_TOP10 = [
  { rank: 1, name: "AI/반도체", changePct: 4.2, leader: "삼성전자" },
  { rank: 2, name: "2차전지", changePct: 3.8, leader: "에코프로" },
  { rank: 3, name: "로봇", changePct: 5.2, leader: "두산로보틱스" },
  { rank: 4, name: "우주항공", changePct: 2.1, leader: "한화에어로스페이스" },
  { rank: 5, name: "원전", changePct: 1.8, leader: "두산에너빌리티" },
  { rank: 6, name: "조선", changePct: 1.2, leader: "HD현대중공업" },
  { rank: 7, name: "방산", changePct: 0.9, leader: "LIG넥스원" },
  { rank: 8, name: "바이오", changePct: -1.3, leader: "삼성바이오로직스" },
  { rank: 9, name: "K-콘텐츠", changePct: -0.5, leader: "JYP Ent." },
  { rank: 10, name: "리오프닝", changePct: -2.1, leader: "하나투어" },
];

// ─── 공매도 잔고 변화 ───
const SHORT_INTEREST = [
  { code: "035720", name: "카카오", ratio: 4.5, delta: -0.8, signal: "숏커버" as const },
  { code: "005930", name: "삼성전자", ratio: 1.2, delta: -0.3, signal: "숏커버" as const },
  { code: "000660", name: "SK하이닉스", ratio: 2.8, delta: 0.5, signal: "위험증가" as const },
  { code: "247540", name: "에코프로비엠", ratio: 3.1, delta: 0.7, signal: "위험증가" as const },
  { code: "035420", name: "NAVER", ratio: 1.8, delta: -0.2, signal: "안정" as const },
];
```

### 카드 컴포넌트 4개 추가

기존 ScalperCards.tsx 의 끝에 다음 추가:

```tsx
import { Zap, Building2, Flame, ShieldAlert } from "lucide-react";

// ───────── VI 발동/해제 카드 ─────────
export function ViCard() {
  return (
    <CardContainer
      title="VI · 변동성 완화장치"
      emoji="🚨"
      subtitle="실시간 발동/해제"
      hint="Layer 1 — KIS VI API 실시간 연결 예정"
    >
      <ul className="space-y-2">
        {VI_EVENTS.map((v, i) => {
          const isTriggered = v.state === "발동";
          const isUp = v.changePct >= 0;
          return (
            <li
              key={`${v.code}-${i}`}
              className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    isTriggered
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {v.state}
                </span>
                <span className="text-[10px] text-unjong-muted">{v.type}</span>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-unjong-primary truncate">
                    {v.name}
                  </span>
                  <span className="text-[10px] text-unjong-muted">{v.code}</span>
                </div>
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                <span className="font-semibold text-unjong-primary tabular-nums">
                  {v.price}
                </span>
                <span
                  className={`text-[10px] font-semibold ${
                    isUp ? "text-unjong-success" : "text-unjong-danger"
                  }`}
                >
                  {isUp ? "+" : ""}
                  {v.changePct.toFixed(1)}% · {v.time}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </CardContainer>
  );
}

// ───────── NetBuy + 거래원 카드 ─────────
export function NetBuyBrokerCard() {
  return (
    <CardContainer
      title="NetBuy + 거래원"
      emoji="💰"
      subtitle="외인·기관 + 매수 1위"
      hint="Layer 1 — KIS investor + 거래원 API"
    >
      <ul className="space-y-2">
        {NETBUY_WITH_BROKERS.map((n) => {
          const foreignUp = n.foreign >= 0;
          const instUp = n.institution >= 0;
          return (
            <li
              key={n.code}
              className="flex flex-col gap-1 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-unjong-primary">
                  {n.name}
                </span>
                <span className="text-[10px] text-unjong-muted">
                  거래원 1위{" "}
                  <span className="font-semibold text-unjong-accent">
                    {n.topBroker}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="text-unjong-muted">외인</span>
                  <span
                    className={
                      foreignUp ? "text-unjong-success font-semibold" : "text-unjong-danger font-semibold"
                    }
                  >
                    {foreignUp ? "+" : ""}
                    {n.foreign}억
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-unjong-muted">기관</span>
                  <span
                    className={
                      instUp ? "text-unjong-success font-semibold" : "text-unjong-danger font-semibold"
                    }
                  >
                    {instUp ? "+" : ""}
                    {n.institution}억
                  </span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </CardContainer>
  );
}

// ───────── 테마 TOP10 카드 ─────────
export function ThemeTop10Card() {
  return (
    <CardContainer
      title="테마 TOP10"
      emoji="🎯"
      subtitle="실시간 등락률 순"
      hint="Layer 1 — KIS theme API 또는 자체 테마 매핑"
    >
      <ul className="space-y-1.5">
        {THEME_TOP10.map((t) => {
          const isUp = t.changePct >= 0;
          return (
            <li
              key={t.rank}
              className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1 cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-unjong-muted w-4 text-right text-[10px]">
                  {t.rank}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-unjong-primary truncate">
                    {t.name}
                  </span>
                  <span className="text-[10px] text-unjong-muted truncate">
                    대표 · {t.leader}
                  </span>
                </div>
              </div>
              <span
                className={`text-[11px] font-semibold flex-shrink-0 ${
                  isUp ? "text-unjong-success" : "text-unjong-danger"
                }`}
              >
                {isUp ? "+" : ""}
                {t.changePct.toFixed(1)}%
              </span>
            </li>
          );
        })}
      </ul>
    </CardContainer>
  );
}

// ───────── 공매도 잔고 카드 ─────────
export function ShortInterestCard() {
  return (
    <CardContainer
      title="공매도 잔고 변화"
      emoji="⚠️"
      subtitle="숏커버·위험 시그널"
      hint="Layer 1 — KRX 공매도 데이터 수집"
    >
      <ul className="space-y-2">
        {SHORT_INTEREST.map((s) => {
          const signalColor =
            s.signal === "숏커버"
              ? "bg-emerald-100 text-emerald-700"
              : s.signal === "위험증가"
              ? "bg-red-100 text-red-700"
              : "bg-slate-100 text-slate-600";
          const deltaPositive = s.delta >= 0;
          return (
            <li
              key={s.code}
              className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${signalColor}`}
                >
                  {s.signal}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-unjong-primary truncate">
                    {s.name}
                  </span>
                  <span className="text-[10px] text-unjong-muted">{s.code}</span>
                </div>
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                <span className="font-semibold text-unjong-primary tabular-nums">
                  {s.ratio.toFixed(1)}%
                </span>
                <span
                  className={`text-[10px] font-semibold ${
                    deltaPositive ? "text-unjong-danger" : "text-unjong-success"
                  }`}
                >
                  전일比 {deltaPositive ? "+" : ""}
                  {s.delta.toFixed(1)}%p
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </CardContainer>
  );
}
```

⚠️ `bg-red-100 text-red-700`, `bg-emerald-100 text-emerald-700`, `bg-slate-100 text-slate-600` — STEP 92 의 폴백 패턴 그대로 표준 Tailwind 사용.

⚠️ `lucide-react` 아이콘 추가 import: `Zap, Building2, Flame, ShieldAlert` (선택 — 안 써도 됨).

---

## 작업 2 — `app/(windows)/scalper/page.tsx` 업데이트

7개 카드 import + 그리드 배치 + Layer 1 안내 박스 갱신.

```tsx
import type { Metadata } from "next";
import {
  MoversCard,
  VolumeCard,
  ScalperDisclosureCard,
  ViCard,
  NetBuyBrokerCard,
  ThemeTop10Card,
  ShortInterestCard,
} from "@/components/cards/ScalperCards";

export const metadata: Metadata = {
  title: "단타창",
  description:
    "운종(雲從) 단타창 — 장중 09:00~15:30 액티브 트레이더의 데스크. " +
    "Movers · Volume · VI · NetBuy · 공시 · 테마 · 공매도.",
};

export default function ScalperPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* 페이지 헤더 */}
      <div className="rounded-lg border border-unjong-border bg-unjong-surface p-4">
        <h1 className="text-xl font-bold text-unjong-primary">⚡ 단타창</h1>
        <p className="mt-1 text-xs text-unjong-muted">
          장중 09:00~15:30 — 액티브 트레이더의 데스크 · 카드 7개 완성 (STEP 96)
        </p>
      </div>

      {/* 카드 그리드 7개 (3×3 마지막 행 1개) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <MoversCard />
        <VolumeCard />
        <ViCard />
        <NetBuyBrokerCard />
        <ScalperDisclosureCard />
        <ThemeTop10Card />
        <ShortInterestCard />
      </div>

      {/* Layer 1 진행 상황 안내 */}
      <div className="rounded-lg border border-dashed border-unjong-accent bg-unjong-surface p-4">
        <p className="text-xs font-semibold text-unjong-primary mb-1">
          🚧 Layer 1 — 실데이터 연결 진행 중
        </p>
        <p className="text-[11px] text-unjong-muted leading-relaxed">
          현재 모든 카드 더미. Layer 1 에서 실데이터 연결:
          <br />
          · Movers · Volume · 공시 · 테마 → 기존 V3 데이터 재활용
          <br />
          · VI · 거래원 · 공매도 → KIS API 추가 호출 + KRX 데이터 신규
          <br />
          채팅 메시지 (좌측) 가 화면 정보와 일치하면 운종 본질 활성.
        </p>
      </div>
    </div>
  );
}
```

### 카드 배치 순서 — 단타꾼 시선 동선

```
[1행] Movers       Volume        VI
[2행] NetBuy+거래원  공시          테마 TOP10
[3행] 공매도        (Layer 1 안내) (빈 칸)
```

→ **속도 중요 카드는 위 (Movers·Volume·VI)**, 분석 카드는 가운데 (NetBuy·공시·테마), 위험·시그널은 아래 (공매도).

---

## 작업 3 — 빌드 검증

```bash
cd ~/stock-terminal
npm run build
```

확인:
- 빌드 성공, TypeScript 오류 0
- ScalperCards.tsx 새 카드 4개 정상 컴파일
- scalper 페이지에 카드 7개 표시
- `bg-red-100 text-red-700` 등 표준 Tailwind 정상 작동

---

## 작업 4 — git commit + push

```bash
cd ~/stock-terminal
rm -f .git/index.lock
git add components/cards/ScalperCards.tsx
git add "app/(windows)/scalper/page.tsx"
git add docs/STEP_96_COMMAND.md
git status
git commit -m "feat: STEP 96 - 단타창 카드 4개 추가 (VI · NetBuy+거래원 · 테마 · 공매도)

- ViCard: 변동성 완화장치 발동/해제 (정적·동적 구분, 5건 더미)
- NetBuyBrokerCard: 외인/기관 + 매수 1위 거래원 통합 (5건)
- ThemeTop10Card: 테마 등락률 순 + 대표 종목 (TOP10)
- ShortInterestCard: 공매도 잔고 + 숏커버/위험 시그널 (5건)

- scalper/page.tsx: 카드 3개 → 7개 그리드 (xl 3열 × 3행)
- Layer 1 안내 박스 갱신 (실데이터 연결 진행 중 명시)

채팅 메시지 8개 중 100% 화면 정보와 동기화:
- 'VI 걸렸다 카오스' → ViCard
- '거래원 보니까 키움 매집' → NetBuyBrokerCard
- '공매도 잔고 줄어드는데 숏커버?' → ShortInterestCard
- '외인 들어옴' → NetBuyBrokerCard
- '오늘 거래량 미쳤네' → VolumeCard (기존)

단타창 시각 정체성 완성. 다음: STEP 97 장타창 카드 4개."
git push
```

---

## 검증 체크리스트

- [ ] `ScalperCards.tsx` 에 4개 카드 컴포넌트 추가 (`ViCard`, `NetBuyBrokerCard`, `ThemeTop10Card`, `ShortInterestCard`)
- [ ] 4개 더미 데이터 상수 추가 (`VI_EVENTS`, `NETBUY_WITH_BROKERS`, `THEME_TOP10`, `SHORT_INTEREST`)
- [ ] `scalper/page.tsx` 가 7개 카드 import + 그리드 배치
- [ ] Layer 1 안내 박스 내용 갱신
- [ ] 빌드 클린
- [ ] git push 완료
- [ ] 색상 클래스 (`bg-red-100`, `bg-emerald-100`, `bg-slate-100`) 정상 작동 확인

---

## 완료 보고 (Claude Code → 사용자)

```
STEP 96 완료. 단타창 카드 4개 추가 (7개 완성).

신규 카드 더미 시각화:
- VI 카드: 발동(247540 에코프로비엠 14:32) · 해제(035720 카카오 14:25) 5건
- NetBuy+거래원 카드: 005930 외인 +124억 기관 -85억 · 거래원 1위 키움 (5건)
- 테마 TOP10: AI/반도체 +4.2% · 2차전지 +3.8% · 로봇 +5.2% (10건)
- 공매도 카드: 카카오 4.5% 숏커버 · SK하이닉스 2.8% 위험증가 (5건)

채팅 메시지 ↔ 화면 정보 동기화:
- 'VI 걸렸다 카오스' → ViCard 즉시 확인 가능 ✅
- '거래원 키움 매집 중' → NetBuyBrokerCard 즉시 확인 ✅
- '공매도 숏커버?' → ShortInterestCard ✅
- '외인 들어옴' → NetBuyBrokerCard ✅

빌드 클린, git push 완료 (커밋 [해시])

브라우저에서 확인:
  http://localhost:3333/scalper → 카드 7개 (3×3 그리드)
  좌측 채팅 메시지가 모두 메인 카드에서 확인 가능한지 검증

다음 STEP 97 (장타창 카드 4개) 또는 다른 작업 명령서 받을 준비 됨.
```

---

## ⚠️ 주의 사항

1. **더미 데이터만** — 실 API 호출 시도 X. Layer 1 후속 STEP 에서 KIS · KRX 연결
2. **CardContainer wrapper 재사용** — 9개 카드 디자인 일관성
3. **색상은 표준 Tailwind 사용** — `bg-red-100`, `bg-emerald-100`, `bg-slate-100` (STEP 92 폴백 패턴)
4. **카드 배치 순서 의미 있음** — 1행 속도 / 2행 분석 / 3행 위험. 함부로 섞지 말 것
5. **Layer 1 안내 박스 강조 유지** — 사용자가 "이건 더미야" 인지 명확
6. **console.log 남기지 말 것** — CLAUDE.md 규칙
7. **빌드 깨지면 즉시 보고** — 강제 진행 금지
