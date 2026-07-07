<!-- 2026-07-07 -->
# STEP 650 — JP 공시 이벤트 층 UI (EDINET → 종목 페이지) · Part A

> **목표**: STEP 646에서 만든 `jp_disclosures`(12,466건) 데이터를 **일본 종목 페이지에 표시**. US EventLayer(EDGAR)·KR KrEventLayer(DART)의 JP 짝. (R1 한국어 원문요약은 다음 STEP 651.)
>
> **Cowork이 이미 함** (tsc EXIT=0):
> - `app/api/jp-events/route.ts` — `?symbol=7203.T` → `secCodeOf`(72030) → jp_disclosures 최근 40건 조회 → 화이트리스트(有報·분기·반기·임시 등) + 임시보고서(material) 필터 → 최근 8건. docType→한국어 라벨. 10분 인메모리 캐시.
> - `app/api/jp-events/doc/route.ts` — EDINET 원문 **PDF 프록시**(`type=2`). 키를 서버측에 숨긴 채 스트리밍(`?docid=`). 링크 클릭 시 원문 PDF.
> - `app/stock/[symbol]/StockLensClient.tsx` — `JpEventLayer`(KrEventLayer 복제) 추가 + `isJP = /^\d{4}\.T$/` 분기. 임시보고서엔 **"중대" 배지** + 사유(`current_report_reason`) 노출.
>
> **전제**: STEP 649(`52805ab`) 이후. **빌드 + 커밋만** (DB·env 변경 없음 — EDINET_API_KEY는 STEP 646~647에서 이미 Vercel에 설정됨).

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error" | head -8
```

## 1) 변경 확인
```bash
cd ~/stock-terminal && git status --short | grep -E "jp-events|StockLensClient|STEP_650"
```
- 기대: `app/api/jp-events/route.ts`(신규) · `app/api/jp-events/doc/route.ts`(신규) · `app/stock/[symbol]/StockLensClient.tsx`(수정) · `docs/STEP_650_COMMAND.md`(신규).

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add app/api/jp-events/route.ts app/api/jp-events/doc/route.ts "app/stock/[symbol]/StockLensClient.tsx" docs/STEP_650_COMMAND.md && git commit -m "feat(jp): 종목 페이지 JP 공시 이벤트 층(EDINET)+원문 PDF 프록시·isJP 배선" && git push
```

## 3) (배포 후) Cowork 검증
- `onetrillion.app/stock/7203.T`(도요타)·`/stock/6758.T`(소니) → **최근 중대 공시** 카드에 有報·임시보고서 리스트. 임시보고서엔 "중대" 배지 + 사유. 클릭 → EDINET 원문 PDF.
- KR(`005930`)·US(`AAPL`)는 기존대로(회귀 없음) 확인.

## ✅ 완료 시 → 다음: STEP 651 JP R1 한국어 원문요약(EDINET zip 텍스트 추출) → 완전성 GB(RNS)→VN→CN → 광고(대화 먼저).
