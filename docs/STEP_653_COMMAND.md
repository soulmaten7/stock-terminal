<!-- 2026-07-07 -->
# STEP 653 — GB 공시 이벤트 층 (RNS via Investegate) · Part A

> **목표**: 영국 종목 페이지에 **RNS 공시 층** — US(EDGAR)·KR(DART)·JP(EDINET) 이벤트층의 GB 짝. (R1 한국어 요약은 STEP 654.)
>
> **소스 결정**: GB엔 EDINET급 공식 무료 종합 API가 없음(FCA NSM은 정식보고서만 → 완전성 미달). 종합 RNS = Investegate(서버렌더·무료·회사별 페이지). **온디맨드+캐시**(크론 X), **원문은 Investegate로 링크(귀속)**, 요약은 공개 RNS 기반 자체 생성 — ToS 완화. 규모 커지면 정식 RNS 라이선스로 업그레이드.
>
> **Cowork이 이미 함** (tsc EXIT=0):
> - `app/api/gb-events/route.ts`(신규) — `symbol.L`→TIDM→`investegate.co.uk/company/{TIDM}` fetch→표 파싱(`announcement-link`)→**노이즈 필터**(Form 8.x·Rule 8·TR-1·PDMR·자기주식 일일 등 제외)→material 판정→최근 8건. 10분 캐시. UA 헤더.
> - `app/stock/[symbol]/StockLensClient.tsx` — `GbEventLayer`(JpEventLayer 미러·요약 없이) + `isGB = /\.L$/` 분기.
>
> **전제**: STEP 651(`e95017f`) 이후. **빌드 + 커밋만.** 새 env/DB/패키지 없음.

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error" | head -8
```

## 1) 변경 확인
```bash
cd ~/stock-terminal && git status --short | grep -E "gb-events|StockLensClient|STEP_653"
```
- 기대: `app/api/gb-events/route.ts`(신규) · `app/stock/[symbol]/StockLensClient.tsx`(수정) · `docs/STEP_653_COMMAND.md`(신규).

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add app/api/gb-events/route.ts "app/stock/[symbol]/StockLensClient.tsx" docs/STEP_653_COMMAND.md && git commit -m "feat(gb): 종목 페이지 RNS 공시 층(Investegate·온디맨드)+isGB 배선" && git push
```

## 3) (배포 후) Cowork 검증 — 🔴 핵심 = Vercel→Investegate 도달성
- `onetrillion.app/stock/SHEL.L`(쉘)·`/stock/MKS.L`(막스&스펜서) → **최근 중대 공시** 카드에 RNS 리스트(Results·Trading·AGM 등), Form 8.x 노이즈 없이. 클릭 → Investegate 원문.
- **도달성 실패 시**(빈 층): Vercel이 Investegate 차단당한 것 → 대체안(LSE 직접·프록시) 검토 필요. Cowork이 `/api/gb-events?symbol=SHEL.L` 직접 호출로 진단.

## ✅ 완료 시 → STEP 654 GB R1 한국어 요약(공시 상세 본문 추출). 이후 VN→CN → 광고(대화 먼저).
