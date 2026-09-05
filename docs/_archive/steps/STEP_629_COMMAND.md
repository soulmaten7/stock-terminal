<!-- 2026-07-06 -->
# STEP 629 — GbMarketBoard (영국 종목보드 + 수익률 크론 + FTSE 지수바)

> **목표**: market 탭 "준비 중" → 실제 영국 종목보드. 야후 `.L` 시세(펜스 GBp)+`gb_stock_perf` 크론(1주~6개월). **VN 보드 클론**(전부 야후 = VN과 동일 구조).
> **Cowork이 이미 함**: `data/gb_symbols.json`(FTSE 350·349종목·클린 영문명) · `gb_names`(349·R3용) · `gb_stock_perf`·`gb_names` 테이블 + 마이그 037·038 · **지수바에 FTSE 100·250·USD/GBP 추가**(`app/api/yahoo/indices/route.ts`) · 야후 .L 10/10 해석 확인.
> **전제**: STEP 628(`29e040d`) 이후.
> 🔴 실행: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

## 생성/편집 (VN 파일을 클론 → GB)

### 1) `lib/gbPerf.ts` (신규) — `lib/vnPerf.ts` 클론
- 복사 후: `../data/vn_symbols.json`→**`../data/gb_symbols.json`** · `computeVnPerf`→**`computeGbPerf`** · upsert `vn_stock_perf`→**`gb_stock_perf`**. (야후 chart 방식 그대로 — `.L` 심볼이라 수정 없음.)

### 2) `app/api/cron/gb-perf/route.ts` (신규) — `app/api/cron/vn-perf/route.ts` 클론
- `computeVnPerf`→`computeGbPerf` import만 교체.

### 3) `vercel.json` — gb-perf 크론 추가
```
찾기:
    { "path": "/api/cron/vn-perf", "schedule": "0 8 * * *" },
바꾸기:
    { "path": "/api/cron/vn-perf", "schedule": "0 8 * * *" },
    { "path": "/api/cron/gb-perf", "schedule": "0 8 * * *" },
```

### 4) `app/api/yahoo/gb-list/route.ts` (신규) — `app/api/yahoo/vn-list/route.ts` 클론
- 복사 후: `@/data/vn_symbols.json`→**`@/data/gb_symbols.json`** · 조인 `vn_stock_perf`→**`gb_stock_perf`**. (전부 야후 `.L` quote — VN과 동일 단일 경로.)

### 5) `components/toolbox/GbMarketBoard.tsx` (신규) — `components/toolbox/VnMarketBoard.tsx` 클론
- 복사 후 변경:
  - fetch `/api/yahoo/vn-list`→**`/api/yahoo/gb-list`**.
  - 통화 `formatPrice(…, 'VN')`→**`'GB'`**(펜스 `p`·lib/currency.ts에 이미 있음).
  - 즐겨찾기/렌즈 `market`·`country` `'VN'`→**`'GB'`**.
  - 종목명: gb_symbols.json 이름이 이미 클린(HSBC·Shell plc) → **VN의 `CTCP` strip 있으면 제거**(GB는 불필요).
  - (서브탭 = 단일 리스트 유지. FTSE100/250 구분은 후속 선택.)

### 6) `components/toolbox/ToolboxClient.tsx` — GB Placeholder를 보드로
```
찾기:
          ) : country === 'VN' ? (
            <VnMarketBoard isLoggedIn={isLoggedIn} />
          ) : (
            <Placeholder emoji="🇬🇧" title="영국 종목·상품 — 준비 중" desc="곧 제공됩니다" />
          )
바꾸기:
          ) : country === 'VN' ? (
            <VnMarketBoard isLoggedIn={isLoggedIn} />
          ) : (
            <GbMarketBoard isLoggedIn={isLoggedIn} />
          )
```
+ 상단 import에 `import GbMarketBoard from './GbMarketBoard';` 추가.

## 빌드 + perf 1회 채우기 + 눈검수
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -10
```
```bash
cd ~/stock-terminal && (npm run dev >/tmp/gb_dev.log 2>&1 &) ; sleep 14
set -a; source .env.local 2>/dev/null; set +a
curl -s -H "authorization: Bearer $CRON_SECRET" "http://localhost:3333/api/cron/gb-perf" | head -c 200; echo
# 확인: {"ok":true,"computed":3xx,...}
```
- [ ] 클린 재시작 후 영국 탭 market: **영문 종목명 + 펜스(p) 가격 + 1일% + 1주~6개월 + AI 렌즈 컬럼**. HSBC·Shell·AstraZeneca·Unilever 뜸.
- [ ] 상단 지수바에 **FTSE 100·FTSE 250** 노출.

## 커밋
```bash
cd ~/stock-terminal && git add lib/gbPerf.ts app/api/cron/gb-perf/route.ts app/api/yahoo/gb-list/route.ts components/toolbox/GbMarketBoard.tsx components/toolbox/ToolboxClient.tsx app/api/yahoo/indices/route.ts vercel.json data/gb_symbols.json supabase/migrations/037_gb_names.sql supabase/migrations/038_gb_stock_perf.sql docs/STEP_629_COMMAND.md && git commit -m "feat(gb): GbMarketBoard 종목보드(FTSE 350·야후 .L·펜스) + FTSE 100/250 지수바 + market 배선" && git push
```

## ✅ 완료 시: 영국 = 링크46+피드+**종목보드**+지수바. 다음 = **R3 영국 뉴스**(getGbName·en-GB·3중 검수) → **매매처 UK 브로커** → 영국 완성.
