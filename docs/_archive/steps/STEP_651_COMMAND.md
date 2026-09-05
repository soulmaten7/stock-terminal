<!-- 2026-07-07 -->
# STEP 651 — JP R1 원문 요약 (EDINET CSV → 한국어) + docType 라벨 수정 · Part B

> **목표**: JP 공시 층에 **원문 기반 한국어 AI 요약**(R1) 추가 — US(EDGAR)·KR(DART) R1의 JP 짝. + STEP 650 라이브에서 발견한 **docType 라벨 오류**(180=臨時報告書인데 350으로 잘못 매핑) 수정.
>
> **왜 원문 추출인가**: JP 임시보고서의 `current_report_reason`은 "第19条第2項第9号の2" 같은 **법조문 코드**라 그 자체로는 의미 없음(DB 실측). → US/KR처럼 **문서 본문**을 요약해야 함.
>
> **Cowork이 이미 함** (tsc EXIT=0):
> - `app/api/jp-events/route.ts` — docType 맵 실측 반영(180 임시·190 정정임시·120 사업·160 반기·270 공개매수). 노이즈(135 確認書·235 내부통제·350/360 大量保有) 제외.
> - `app/api/jp-events/summary/route.ts`(신규) — EDINET 원문 **CSV(type=5) 다운로드 → fflate unzip → 일본어 본문 추출(탭구분·UTF-16LE·HTML제거·서술형만) → gpt-4o-mini 한국어 사실 요약 → filing_summaries 캐시**(accession=docID). KR summary 파이프라인 미러. 추출 실패 시 502(UI 조용히 숨김).
> - `app/stock/[symbol]/StockLensClient.tsx` — `JpFilingSummary`(KrFilingSummary 미러) 추가 + JpEventLayer 각 항목에 배선.
>
> **전제**: STEP 650(`1c3dadd`) 이후. **빌드 + 커밋만.** 새 env/DB/패키지 없음 — `fflate`(기존 dep)·`OPENAI_API_KEY`·`EDINET_API_KEY`·`filing_summaries` 테이블 모두 이미 존재.

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error" | head -8
```

## 1) 변경 확인
```bash
cd ~/stock-terminal && git status --short | grep -E "jp-events|StockLensClient|STEP_651"
```
- 기대: `app/api/jp-events/route.ts`(수정) · `app/api/jp-events/summary/route.ts`(신규) · `app/stock/[symbol]/StockLensClient.tsx`(수정) · `docs/STEP_651_COMMAND.md`(신규).

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add app/api/jp-events/route.ts app/api/jp-events/summary/route.ts "app/stock/[symbol]/StockLensClient.tsx" docs/STEP_651_COMMAND.md && git commit -m "feat(jp): R1 EDINET 원문(CSV)→한국어 AI 요약 + docType 라벨 실측 수정" && git push
```

## 3) (배포 후) Cowork 검증
- `onetrillion.app/stock/7203.T`(도요타) → 공시 라벨이 **한국어**(임시보고서·사업보고서 등)로 바뀌고, 각 항목 아래 **"AI 요약 · 원문 기반"** 한국어 2~3문장 뜨는지.
- 첫 조회는 다운로드+요약이라 몇 초 지연(캐시 후 즉시). 소니(`6758.T`)도 확인.
- KR(`005930`)·US(`AAPL`) 회귀 없음 확인.

## ✅ 완료 시 → JP 종목 페이지 R1 완성(공시층+원문요약). 다음: 완전성 GB(RNS)→VN→CN → 광고(대화 먼저).
