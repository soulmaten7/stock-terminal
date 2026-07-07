<!-- 2026-07-07 -->
# STEP 643 — SEO ⑤ 해외종목 한글명 매핑 (서학개미 검색)

> **문제**: 해외종목이 영문명(Apple Inc.·Tesla)이라 한국인이 "애플 주가"·"테슬라 주가"로 검색하면 안 걸림. 서학개미 트래픽 손실.
>
> **해결**: 많이 찾는 해외종목 121종에 한글명 부여 → 제목·h1·설명·키워드·JSON-LD가 한글명 우선(영문명 병기).
> - `data/foreign_ko_names.json` (신규): 티커→한글명 121개(US 메가/인기주 + 주요 ETF + JP/CN 대표). **교차 검증**: 118개 영문명 일치 확인, META·ARM·BABA만 us_symbols.json에 없어 → 오버라이드가 **JSON 없어도 한글명 반환** + **사이트맵에도 합류**(구글 발견되게).
> - `lib/stockName.ts`: `FK` 오버라이드 — 티커 있으면 `name`=한글, `en`=원어/영문명 보존.
> - `app/stock/[symbol]/page.tsx`: 제목 `애플 (AAPL) 주가…`, 설명·키워드에 영문명 병기(`애플(Apple Inc.·AAPL)`·keywords `[애플, 애플 주가, Apple Inc., AAPL…]`), JSON-LD `alternateName`=영문명.
> - `app/sitemap.ts`: 한글명 티커 union(META 등 3개 추가 → ~19,986).
>
> **표시 흐름**: SSR `initialName`=한글 → h1 한글 유지(STEP 639 로직). `/api/lens`(야후 영문)는 여전히 영문이지만 h1은 한글 우선.
>
> **Cowork이 이미 함** (tsc EXIT=0): 위 4파일.
> **전제**: STEP 642(`2956ce7`) 이후. **빌드 + 커밋만**.

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error|/stock" | head -12
```
- ✅ 기대: `Compiled successfully` · `/stock/[symbol]` ƒ(Dynamic).

## 1) 변경 확인
```bash
cd ~/stock-terminal && git status --short | grep -E "foreign_ko_names|stockName|stock/\[symbol\]|sitemap"
```
- 기대: `?? data/foreign_ko_names.json` · `M lib/stockName.ts` · `M app/stock/[symbol]/page.tsx` · `M app/sitemap.ts`

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add data/foreign_ko_names.json lib/stockName.ts "app/stock/[symbol]/page.tsx" app/sitemap.ts docs/STEP_643_COMMAND.md && git commit -m "seo(foreign): 해외종목 한글명 121종 매핑 — 애플·테슬라·엔비디아 등 서학개미 검색 + META·BABA 사이트맵 합류" && git push
```

## 3) (배포 후) Cowork 라이브 스팟체크
- `/stock/TSLA`=테슬라 · `/stock/AAPL`=애플 · `/stock/META`=메타 · `/stock/7203.T`=도요타 · `/stock/0700.HK`=텐센트 — title·h1·keywords 한글명 확인.

## ✅ 완료 시 → 한국어 SEO 폴리시 완결. 다음: 한국어 광고 설정.
