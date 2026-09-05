<!-- 2026-06-20 -->
# STEP 332 — [정리] 증권사 탭 제거 + 링크 카테고리 중복 헤더 제거

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_332_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
1. **증권사 탭 제거** — 종목·상품 안에 증권사 바로가기가 들어왔으니 게이트웨이 독립 탭은 중복.
2. **링크 카테고리 헤더 제거** — 탭에 이미 카테고리명이 떠 있는데 아래 "[카테고리] / N곳·운종 큐레이션"은 군더더기. (뉴스·차트·리포트 등 링크 카테고리 전부)

> 변경: `components/toolbox/ToolboxClient.tsx` 4곳. (`BrokerRanking` 컴포넌트 자체는 종목·상품에서 계속 쓰므로 유지 — 임포트만 정리)

---

## 📄 `components/toolbox/ToolboxClient.tsx` (수정 4곳)

### 1 — 안 쓰는 import 제거(BrokerRanking·SectionHeader)
**찾기:**
```tsx
import LinkCard, { type LinkItem } from './LinkCard';
import BrokerRanking from './BrokerRanking';
import YoutubeRanking, { type YtChannel } from './YoutubeRanking';
import AdvisorDirectory from './AdvisorDirectory';
import MarketBoard from './MarketBoard';
import SectionHeader from './SectionHeader';
```
**바꾸기:**
```tsx
import LinkCard, { type LinkItem } from './LinkCard';
import YoutubeRanking, { type YtChannel } from './YoutubeRanking';
import AdvisorDirectory from './AdvisorDirectory';
import MarketBoard from './MarketBoard';
```

### 2 — TAB_ORDER에서 'broker' 제거
**찾기:**
```tsx
const TAB_ORDER = ['market', 'news', 'broker', 'youtube', 'chart', 'analysis', 'research', 'disclosure', 'etf', 'ipo', 'macro', 'exchange', 'community', 'room'];
```
**바꾸기:**
```tsx
const TAB_ORDER = ['market', 'news', 'youtube', 'chart', 'analysis', 'research', 'disclosure', 'etf', 'ipo', 'macro', 'exchange', 'community', 'room'];
```

### 3 — SPECIAL_LABELS에서 broker 제거
**찾기:**
```tsx
const SPECIAL_LABELS: Record<string, string> = { market: '종목·상품', youtube: '유튜브', broker: '증권사', room: '리딩방·검증' };
```
**바꾸기:**
```tsx
const SPECIAL_LABELS: Record<string, string> = { market: '종목·상품', youtube: '유튜브', room: '리딩방·검증' };
```

### 4 — 디스패처에서 broker 분기 + 링크 카테고리 SectionHeader 제거
**찾기:**
```tsx
        ) : activeTab === 'broker' ? (
          country === 'KR' ? <BrokerRanking /> : <Placeholder emoji="🇺🇸" title="미국 증권사 — 준비 중" />
        ) : catLinks.length === 0 ? (
          <Placeholder emoji="🗂️" title={`${cat?.label ?? ''} · ${countryLabel} 링크 준비 중`} />
        ) : (
          <section className="min-w-0">
            <SectionHeader title={cat?.label ?? ''} subtitle={`${catLinks.length}곳 · 운종 큐레이션`} />
            <div>
```
**바꾸기:**
```tsx
        ) : catLinks.length === 0 ? (
          <Placeholder emoji="🗂️" title={`${cat?.label ?? ''} · ${countryLabel} 링크 준비 중`} />
        ) : (
          <section className="min-w-0">
            <div>
```

---

## ✅ 검증
```bash
npm run build
```
- 빌드 무에러 (BrokerRanking·SectionHeader는 ToolboxClient에서 더 이상 안 쓰므로 임포트 제거됨. BrokerRanking 컴포넌트 자체는 MarketBoard에서 계속 사용).

개발 서버:
1. 상단 탭에서 **증권사 사라짐** (종목·상품 / 뉴스 / 유튜브 / 차트·시세 / …).
2. 링크 카테고리(뉴스·차트 등) 누르면 **위 헤더 없이 바로 링크 리스트**.
3. 종목·상품 안 증권사 바로가기는 그대로.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add components/toolbox/ToolboxClient.tsx && git commit -m "ui(gateway): 증권사 독립 탭 제거(종목·상품에 흡수) + 링크 카테고리 중복 헤더 제거 (STEP 332)" && git push
```

---

> **한 줄 요약**: 게이트웨이에서 증권사 탭 제거 + 링크 카테고리의 '[이름]/N곳 큐레이션' 중복 헤더 제거.
