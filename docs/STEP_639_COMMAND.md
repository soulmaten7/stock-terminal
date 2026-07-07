<!-- 2026-07-07 -->
# STEP 639 — SEO ④ 검증 후속 픽스 (네이티브 이름 유지 + US 잡음 제거)

> **STEP 638 라이브 검증에서 발견** (브라우저 원시 DOM + /api/lens 실측):
> - ✅ 종목 JSON-LD(BreadcrumbList+Corporation)·홈 JSON-LD(Organization+WebSite)·sitemap 19,983 URL — 전부 정상.
> - ❌ **h1 하이드레이션 불일치**: 봇/초기HTML은 "삼성전자"인데, 로딩 후 `/api/lens`(야후 영문)가 덮어써 **"SamsungElec"로 바뀜**. 000660도 "SK하이닉스"→"SK hynix". 한국시장 주력인데 영문으로 깜빡임.
> - ❌ **US 이름 잡음**: `Apple Inc. - Common Stock` (야후 lens는 `Apple Inc.`로 더 깔끔). 제목·h1에 " - Common Stock"이 붙음.
>
> **원인**: `/api/lens` 이름 소스(야후, 영문/로마자)와 우리 SSR 소스(kr_stock_snapshot·번들 JSON, 네이티브)가 다름.
>
> **해결** (Cowork이 이미 함, tsc EXIT=0):
> - `lib/stockName.ts`: US 상장명 잡음 제거 함수(`cleanUsName`) — " - Common Stock/Shares/Ordinary Shares" 접미 제거. → 제목·h1 둘 다 `Apple Inc.`로 깔끔(SSR 소스라 양쪽 동시 적용).
> - `app/stock/[symbol]/StockLensClient.tsx`: h1 우선순위 `data?.name || initialName` → **`initialName || data?.name`**. SSR 네이티브 이름(삼성전자·トヨタ自動車)이 유지돼 깜빡임 제거 + `<title>`과 일치. (미해석 종목은 initialName이 없어 기존대로 data.name 폴백 — 안전.)
>
> **전제**: STEP 637(`0046c2c`) 이후. 이 STEP은 **빌드 + 커밋만**.

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error|/stock" | head -12
```
- ✅ 기대: `Compiled successfully` · `/stock/[symbol]` ƒ(Dynamic).

## 1) 변경 확인
```bash
cd ~/stock-terminal && git status --short | grep -E "stockName|StockLensClient"
```
- 기대: `M lib/stockName.ts` · `M app/stock/[symbol]/StockLensClient.tsx`

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add lib/stockName.ts "app/stock/[symbol]/StockLensClient.tsx" docs/STEP_639_COMMAND.md && git commit -m "seo(fix): h1 네이티브 이름 유지(삼성전자·トヨタ 깜빡임 제거) + US 상장명 'Common Stock' 잡음 제거" && git push
```

## 3) (배포 후) Cowork 재검증
- 종목 페이지 로딩 후에도 h1이 **삼성전자·SK하이닉스·トヨタ自動車** 유지(영문으로 안 바뀜).
- US 제목·h1 = `Apple Inc.` (- Common Stock 사라짐).

## ✅ 완료 시 → SEO 1차 완결. 다음: 세션 문서 4종 갱신 커밋 → 한국어 SEO 마무리(구글 서치콘솔 sitemap 제출 등) → 광고 설정.
