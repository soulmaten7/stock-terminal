<!-- 2026-06-23 -->
# STEP 372 — [코드 헬스] 죽은 API 라우트 정리 (~55개)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_372_COMMAND.md 파일 내용대로 실행해줘
```

## 🔴 실행 에이전트 주의 (안전망)
- 아래 삭제 목록은 **현재 코드 어디서도 fetch 안 되고(0-참조) · 라우트끼리 서로 호출 안 함**을 확인한 것이다.
- **절대 건드리지 말 것(보존)**: `app/api/cron/*`(vercel.json 크론), 그리고 삭제목록에 **없는** 모든 라우트.
- 순서: 삭제 → `npm run build` → **빌드 통과 시에만** 클린 재시작·런타임 확인 → 커밋. **빌드 실패 시 커밋하지 말고** `Cannot find module` 메시지 출력 후 멈춰라(어떤 라우트가 import로 쓰임 → 그건 살림).

---

## 🎯 목표
STEP 370(컴포넌트 정리) 후 남은 **옛 기능 API 라우트**(종목상세·KIS·home대시보드·stocks·partners·chat·calendar·db·옛 yahoo/news/dart 변형) 삭제. 게이트웨이가 쓰는 라우트·크론은 보존.

**보존(삭제 금지) 핵심**: cron/{fss-advisors,youtube-refresh} · advisors · ai-analysis · dart/feed · dividend/feed · ecos · fred · ipo/feed · kis/volume-rank · krx/{ranking,etf-performance,etn,etn-performance} · likes(dormant) · macro/summary · news/feed · reports · rooms/{favorite,submit,[id]/verify} · sec · toolbox/{favorite,click} · yahoo/{indices,kr-performance,reit-performance} · admin/{reports,submissions}.

---

## 🗑️ 삭제

```bash
cd ~/stock-terminal

# 1) 통째로 죽은 디렉토리
rm -rf app/api/alerts app/api/calendar app/api/chat app/api/db app/api/forex \
       app/api/global app/api/home app/api/partners app/api/stocks app/api/themes

# 2) dart — feed만 남기고 옛 변형 삭제
rm -rf app/api/dart/company app/api/dart/disclosures-longterm app/api/dart/earnings-calendar

# 3) kis — volume-rank만 남기고 옛 종목상세용 삭제
rm -rf app/api/kis/chart app/api/kis/execution app/api/kis/investor app/api/kis/investor-rank \
       app/api/kis/market-cap app/api/kis/market-investor app/api/kis/movers app/api/kis/orderbook \
       app/api/kis/price app/api/kis/sector app/api/kis/sector-rank app/api/kis/theme \
       app/api/kis/token app/api/kis/vi

# 4) krx — ranking·etf/etn 성과만 남기고
rm -rf app/api/krx/short-interest app/api/krx/warning

# 5) news — feed만 남기고 옛 변형
rm -rf app/api/news/market app/api/news/stock app/api/news/us

# 6) toolbox — favorite·click만 남기고
rm -rf app/api/toolbox/list

# 7) yahoo — indices·kr-performance·reit-performance만 남기고 옛 종목상세/US
rm -rf app/api/yahoo/chart app/api/yahoo/etf-performance app/api/yahoo/m7 app/api/yahoo/prepost \
       app/api/yahoo/quote app/api/yahoo/quote-detail app/api/yahoo/sector-etf \
       app/api/yahoo/us-movers app/api/yahoo/us-performance
```

## ✅ 빌드 검증 (필수)
```bash
cd ~/stock-terminal && npm run build
```
- ✅ 무에러 → 다음.
- ❌ `Cannot find module '@/...'` → **커밋하지 말고** 모듈명 출력 후 멈춤(그 라우트는 import로 쓰임 → Cowork가 살림 지시).

## ✅ 런타임 검증 (클린 재시작 — API 삭제라 필수)
```bash
pkill -f "next dev"; rm -rf .next; npm run dev
```
브라우저:
1. 홈 **종목·상품** 표 정상 로드(거래대금순·기간데이터) — `/api/krx/ranking`·`/api/yahoo/kr-performance` 살아있음.
2. 상단 티커(KOSPI·NASDAQ…) 정상 — `/api/yahoo/indices`.
3. 뉴스·공시·거시·공모주 피드 정상 — `/api/{news,dart,macro,ipo,dividend}/feed` 등.
4. 리딩방·즐겨찾기·관리자 정상.
> 위 중 하나라도 깨지면 그 라우트를 잘못 지운 것 → 알려줘(되살림).

## 📦 커밋·푸시 (빌드+런타임 통과 시에만)
```bash
cd ~/stock-terminal && git add -A && git commit -m "chore(cleanup): 죽은 API 라우트 ~55개 삭제(옛 종목상세·KIS·home·stocks 등), 크론·활성 보존 (STEP 372)" && git push
```

---

> **한 줄 요약**: 0-참조 옛 API 라우트 ~55개 삭제(크론·활성·likes 보존). 빌드(import 의존)+런타임(게이트웨이) 통과 시에만 커밋. 이걸로 죽은 코드 정리 마무리.
