<!-- 2026-04-18 -->
# V3 W1.6 — 위젯 라이트 전환 + C안 Row 재배치 (통합)

> **2가지 작업 한 번에**:
> 1. **다크→라이트**: 5개 위젯(거래량급등/코스피·코스닥/프로그램매매/글로벌선물/투자주의)의 `bg-[#0D1117]` 잔재 제거 → 흰색 카드 쉘과 통일
> 2. **Row 재배치 (C안)**: Row 3~5 를 "속보 세로 대형 컬럼(row-span 3) + 경제지표·IPO·실적 세로 스택" 형태로 변경. Bloomberg Terminal T자형 레이아웃.
>
> **왜 한 번에**: 두 작업 모두 홈 페이지 파일(HomeClient + 5개 위젯)만 건드리므로 따로 커밋하면 검증 부담만 늘어남. 한 번 빌드·검증·커밋으로 처리.

---

## 🎯 최종 목표 레이아웃

```
┌─────────────────────────────────────────────────────┬──────────┐
│ Row 1 (400px): [관심종목]      │ [수급 TOP10]        │ Partner  │
│ Row 2 (300px): [거래량 급등]   │ [코스피/코스닥]     │ Slot     │
│ Row 3~5 (924): [              │ [경제지표  300]     │ (W4)     │
│                [              │ [IPO 일정  300]     │          │
│                [속보 (tall)   │ [실적 발표 300]     │          │
│                [             ]│                      │          │
│ Row 6 (300px): [프로그램 │ 글로벌선물 │ 경고종목] 3등분    │          │
└─────────────────────────────────────────────────────┴──────────┘
```

**색상 매핑 규칙** (다크→라이트)

| 기존 | 신규 | 용도 |
|------|------|------|
| `bg-[#0D1117]` | 제거 (CARD 래퍼가 이미 흰색) | 위젯 루트 배경 |
| `bg-[#161B22]` | `bg-[#F5F7FA]` | 내부 블록/호버 |
| `border-[#2D3748]` | `border-[#E5E7EB]` | 보더 |
| `text-white` | `text-black` | 본문 |
| `text-[#CCCCCC]` | `text-[#666666]` | 보조 |
| `hover:bg-[#161B22]` | `hover:bg-[#F5F7FA]` | hover |
| TradingView `colorTheme: 'dark'` | `'light'` | 미니차트 |
| 한국 상승(`#FF3B30` / `#FF4D4D`) / 하락(`#007AFF` / `#2196F3`) | **유지** | 색 컨벤션 |

---

## STEP 0 — 사전 확인

```bash
cd ~/Desktop/OTMarketing
git status
git log --oneline -3
npm run build 2>&1 | tail -10
```

직전 커밋이 W1.5 Bento Grid 인지, 빌드 OK 인지 확인.

---

## STEP 1 — VolumeSpike.tsx (거래량 급등) 라이트 전환

**파일**: `components/home/VolumeSpike.tsx`

아래 3개 치환:

```
치환 1 — loading 블록 루트
old:
      <div className="bg-[#0D1117] p-4 h-full">
        <h3 className="text-white font-bold text-sm mb-3">거래량 급등</h3>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-6 bg-[#161B22] animate-pulse" />))}
        </div>
      </div>

new:
      <div className="p-4 h-full">
        <h3 className="text-black font-bold text-sm mb-3">거래량 급등</h3>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-6 bg-[#F5F7FA] animate-pulse rounded" />))}
        </div>
      </div>

치환 2 — return 루트
old:
    <div className="bg-[#0D1117] p-4 h-full">
      <h3 className="text-white font-bold text-sm mb-3">거래량 급등</h3>
new:
    <div className="p-4 h-full">
      <h3 className="text-black font-bold text-sm mb-3">거래량 급등</h3>

치환 3 — 링크 아이템
old:
          <Link key={s.symbol} href={`/stocks/${s.symbol}`}
            className="flex items-center justify-between py-1.5 hover:bg-[#161B22] px-2 -mx-2">
            <div>
              <span className="text-white font-bold text-sm">{s.name}</span>
new:
          <Link key={s.symbol} href={`/stocks/${s.symbol}`}
            className="flex items-center justify-between py-1.5 hover:bg-[#F5F7FA] px-2 -mx-2 rounded">
            <div>
              <span className="text-black font-bold text-sm">{s.name}</span>
```

---

## STEP 2 — MarketMiniCharts.tsx (코스피/코스닥) 라이트 전환

**파일**: `components/home/MarketMiniCharts.tsx`

```
치환 1 — TradingView colorTheme
old:
      symbol, width: '100%', height: '100%', locale: 'kr',
      dateRange: '1D', colorTheme: 'dark', isTransparent: true, autosize: true,
new:
      symbol, width: '100%', height: '100%', locale: 'kr',
      dateRange: '1D', colorTheme: 'light', isTransparent: true, autosize: true,

치환 2 — TVMini wrapper
old:
    <div className="bg-[#161B22] border border-[#2D3748] p-2">
      <p className="text-[#999999] text-xs font-bold mb-1">{label}</p>
new:
    <div className="bg-[#F5F7FA] border border-[#E5E7EB] p-2 rounded">
      <p className="text-[#666666] text-xs font-bold mb-1">{label}</p>

치환 3 — export default 루트
old:
    <div className="bg-[#0D1117] p-4 h-full">
      <h3 className="text-white font-bold text-sm mb-3">코스피 / 코스닥</h3>
new:
    <div className="p-4 h-full">
      <h3 className="text-black font-bold text-sm mb-3">코스피 / 코스닥</h3>
```

---

## STEP 3 — ProgramTrading.tsx (프로그램 매매) 라이트 전환

**파일**: `components/home/ProgramTrading.tsx`

```
치환 1 — Bar
old:
        <span className="text-[#CCCCCC] text-sm font-bold w-20 shrink-0">{label}</span>
        <div className="flex-1 mx-3 h-5 bg-[#161B22] relative">
          <div className={`h-full ${value >= 0 ? 'bg-[#FF4D4D]' : 'bg-[#2196F3]'}`} style={{ width: `${w}%` }} />
new:
        <span className="text-[#666666] text-sm font-bold w-20 shrink-0">{label}</span>
        <div className="flex-1 mx-3 h-5 bg-[#F5F7FA] rounded relative overflow-hidden">
          <div className={`h-full ${value >= 0 ? 'bg-[#FF4D4D]' : 'bg-[#2196F3]'}`} style={{ width: `${w}%` }} />

치환 2 — 루트
old:
    <div className="bg-[#0D1117] p-4 h-full">
      <h3 className="text-white font-bold text-sm mb-3">프로그램 매매</h3>
new:
    <div className="p-4 h-full">
      <h3 className="text-black font-bold text-sm mb-3">프로그램 매매</h3>

치환 3 — 합계 구분선·라벨
old:
      <div className="border-t border-[#2D3748] mt-2 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-white font-bold text-sm">합계</span>
new:
      <div className="border-t border-[#E5E7EB] mt-2 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-black font-bold text-sm">합계</span>
```

---

## STEP 4 — GlobalFutures.tsx (글로벌 선물) 라이트 전환

**파일**: `components/home/GlobalFutures.tsx`

```
치환 1 — 루트
old:
    <div className="bg-[#0D1117] p-4 h-full">
      <h3 className="text-white font-bold text-sm mb-3">글로벌 선물</h3>
new:
    <div className="p-4 h-full">
      <h3 className="text-black font-bold text-sm mb-3">글로벌 선물</h3>

치환 2 — 셀
old:
          <div key={f.name} className="bg-[#161B22] p-3 border border-[#2D3748]">
            <p className="text-[#999999] text-xs font-bold mb-1">{f.name}</p>
            <p className="text-white font-mono-price font-bold text-base">{f.value}</p>
new:
          <div key={f.name} className="bg-[#F5F7FA] p-3 border border-[#E5E7EB] rounded">
            <p className="text-[#666666] text-xs font-bold mb-1">{f.name}</p>
            <p className="text-black font-mono-price font-bold text-base">{f.value}</p>
```

---

## STEP 5 — WarningStocks.tsx (투자주의·경고) 라이트 전환

**파일**: `components/home/WarningStocks.tsx`

```
치환 1 — 루트
old:
    <div className="bg-[#0D1117] p-4 h-full">
      <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-[#FF9500]" /> 투자주의/경고
      </h3>
new:
    <div className="p-4 h-full">
      <h3 className="text-black font-bold text-sm mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-[#FF9500]" /> 투자주의/경고
      </h3>

치환 2 — 링크 아이템
old:
          <Link key={s.symbol} href={`/stocks/${s.symbol}`}
            className="flex items-center justify-between py-1.5 hover:bg-[#161B22] px-2 -mx-2">
            <span className="text-white font-bold text-sm">{s.name}</span>
new:
          <Link key={s.symbol} href={`/stocks/${s.symbol}`}
            className="flex items-center justify-between py-1.5 hover:bg-[#F5F7FA] px-2 -mx-2 rounded">
            <span className="text-black font-bold text-sm">{s.name}</span>
```

---

## STEP 6 — HomeClient.tsx C안 Row 재배치

**파일**: `components/home/HomeClient.tsx`

**변경점**:
- Row 3 (경제지표 + IPO/실적 상하 쪼개기) → 제거
- Row 4 (속보 col-span-2, 400px) → 제거
- 신규 Row 3~5 블록: **속보 `gridRow: span 3, height: 924` + 경제지표·IPO·실적 각 300px 세로 스택**
- Row 5 (프로그램·글로벌·경고) → Row 6 으로 이동, 구조 유지

**실행 명령어**:

```
components/home/HomeClient.tsx 를 아래 내용으로 완전 교체:

'use client';

import { useEffect } from 'react';
import WatchlistLive from './WatchlistLive';
import InstitutionalFlow from './InstitutionalFlow';
import BreakingFeed from './BreakingFeed';
import VolumeSpike from './VolumeSpike';
import ProgramTrading from './ProgramTrading';
import GlobalFutures from './GlobalFutures';
import MarketMiniCharts from './MarketMiniCharts';
import WarningStocks from './WarningStocks';
import EconomicCalendar from './EconomicCalendar';
import IpoSchedule from './IpoSchedule';
import EarningsCalendar from './EarningsCalendar';

const CARD = 'bg-white border border-[#E5E7EB] rounded-lg overflow-hidden flex flex-col';

export default function HomeClient() {
  useEffect(() => {
    const scrollTop = () => window.scrollTo(0, 0);
    scrollTop();
    const timers = [50, 150, 300, 600, 1000].map((ms) => setTimeout(scrollTop, ms));
    requestAnimationFrame(scrollTop);
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="mx-auto px-4 py-4" style={{ maxWidth: 1920 }}>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'minmax(0,1fr) 240px' }}>
        {/* ═══ 메인 영역: Bento Grid ═══ */}
        <div className="grid grid-cols-2 gap-3">
          {/* ROW 1 — 관심종목 | 수급 TOP10 (400px) */}
          <div className={CARD} style={{ height: 400 }}>
            <WatchlistLive />
          </div>
          <div className={CARD} style={{ height: 400 }}>
            <InstitutionalFlow />
          </div>

          {/* ROW 2 — 거래량 급등 | 코스피/코스닥 (300px) */}
          <div className={CARD} style={{ height: 300 }}>
            <VolumeSpike />
          </div>
          <div className={CARD} style={{ height: 300 }}>
            <MarketMiniCharts />
          </div>

          {/* ROW 3~5 — 속보 (tall, row-span-3) | 경제지표·IPO·실적 세로 스택 */}
          <div className={CARD} style={{ height: 924, gridRow: 'span 3' }}>
            <BreakingFeed />
          </div>
          <div className={CARD} style={{ height: 300 }}>
            <EconomicCalendar />
          </div>
          <div className={CARD} style={{ height: 300 }}>
            <IpoSchedule />
          </div>
          <div className={CARD} style={{ height: 300 }}>
            <EarningsCalendar />
          </div>

          {/* ROW 6 — 프로그램매매 | 글로벌선물 | 경고종목 (col-span-2, 3등분) */}
          <div className={`${CARD} col-span-2 grid grid-cols-3 gap-0`} style={{ height: 300 }}>
            <div className="border-r border-[#F0F0F0] overflow-hidden">
              <ProgramTrading />
            </div>
            <div className="border-r border-[#F0F0F0] overflow-hidden">
              <GlobalFutures />
            </div>
            <div className="overflow-hidden">
              <WarningStocks />
            </div>
          </div>
        </div>

        {/* ═══ 우측: Partner Slot 예약 공간 (240px) ═══ */}
        <aside className="hidden min-[1400px]:block">
          <div className="sticky top-[120px] flex flex-col gap-3">
            <div
              className="bg-[#F8F9FA] border border-dashed border-[#D1D5DB] rounded-lg flex items-center justify-center text-xs text-[#999999] tracking-widest"
              style={{ height: 400 }}
            >
              PARTNER SLOT<br />(W4)
            </div>
            <div
              className="bg-[#F8F9FA] border border-dashed border-[#D1D5DB] rounded-lg flex items-center justify-center text-xs text-[#999999] tracking-widest"
              style={{ height: 300 }}
            >
              PARTNER SLOT<br />(W4)
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
```

---

## STEP 7 — 잔존 다크테마 검사

```bash
cd ~/Desktop/OTMarketing
grep -rn "bg-\[#0D1117\]\|bg-\[#161B22\]\|border-\[#2D3748\]" components/home/ | grep -vE "AdColumn|BannerSection|AdBanner|MarketTabs|TodayNews|TodayDisclosures|SupplyDemandSummary|TopMovers"
```

**기대**: 출력 **0줄**. 레거시 파일(AdColumn 등)은 grep -v 로 제외 — HomeClient 가 import 안 함.

출력이 남아있으면 해당 파일·라인을 Cowork에게 공유.

---

## STEP 8 — 빌드 + dev 서버

```bash
cd ~/Desktop/OTMarketing
npm run build 2>&1 | tail -20
```

성공하면:

```bash
pkill -f "next dev" 2>/dev/null
sleep 1
rm -f .fuse_hidden* 2>/dev/null
npm run dev > /tmp/nextdev.log 2>&1 &
sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:3333
```

`200` 이면 STEP 9 로.

---

## STEP 9 — Cowork Chrome MCP 재검증 요청

사용자에게:

> STEP 8 까지 통과했으면 알려줘. Chrome MCP 로 다시 점검할게:
> 1. 다크 잔재 0개
> 2. Row 3~5 속보 세로 tall column, 경제·IPO·실적 각 300px 세로 스택
> 3. Row 6 프로그램매매·글로벌선물·경고종목 3등분
> 4. 페이지 높이 < 2,300px
> 5. 첫 화면 위젯 수 ≥ 6개 (유지)

---

## STEP 10 — git 커밋 & push (Cowork 승인 후)

```bash
cd ~/Desktop/OTMarketing
rm -f .git/index.lock 2>/dev/null
git add -A
git status

git commit -m "style+layout(home): V3 W1.6 - light theme unify + C안 tall news column"
git push origin main
```

상세 메시지:

```
style+layout(home): V3 W1.6 - light theme unify + C안 tall news column

라이트 테마 통일 (5 위젯):
- VolumeSpike / MarketMiniCharts / ProgramTrading / GlobalFutures / WarningStocks
- bg-[#0D1117] 제거, CARD 래퍼 흰색 상속
- bg-[#161B22] → bg-[#F5F7FA], border-[#2D3748] → #E5E7EB
- text-white → text-black, text-[#CCCCCC] → text-[#666666]
- MarketMiniCharts TradingView colorTheme dark → light
- 한국 상승/하락 색(#FF3B30 / #2196F3) 유지

C안 Row 재배치 (HomeClient):
- Row 3~5: 속보 row-span-3 (924px tall) + 경제지표·IPO·실적 세로 스택 (각 300px)
- Bloomberg Terminal T자형 레이아웃
- 속보 한 화면 아이템 수 7개 → 17개
- 캘린더 3개 각각 독립 300px 확보 → 3-5개 항목 노출
- Row 6: 프로그램매매·글로벌선물·경고종목 3등분 유지
```

---

## 🛡️ 롤백

문제 발생 시:

```bash
git log --oneline -5
git revert <W1.6 SHA>
git push origin main
```

---

## 📋 Claude Code 체크리스트

- [ ] STEP 0: 사전 확인 (빌드 OK)
- [ ] STEP 1: VolumeSpike 3치환
- [ ] STEP 2: MarketMiniCharts 3치환 (TradingView light 포함)
- [ ] STEP 3: ProgramTrading 3치환
- [ ] STEP 4: GlobalFutures 2치환
- [ ] STEP 5: WarningStocks 2치환
- [ ] STEP 6: HomeClient.tsx C안 교체
- [ ] STEP 7: grep 잔재 검사 → 0줄
- [ ] STEP 8: build + dev 200 OK
- [ ] STEP 9: Cowork 재검증 요청 (멈춤)
- [ ] STEP 10: Cowork 승인 후 git push

---

## 📎 참고

- 직전 단계: `docs/COMMANDS_V3_W1_5_HOME.md` (Bento Grid 2×5)
- 전체 V3: `docs/PRODUCT_SPEC_V3.md`
- 다음 단계: `docs/COMMANDS_V3_PHASE1.md` W2 (종목 상세 8탭)
- C안 결정 근거: 2026-04-18 Cowork Chrome MCP 검증 세션 — Bloomberg T자형 레이아웃, 속보 정보량 2.5배 증가
