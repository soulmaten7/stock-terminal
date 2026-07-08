<!-- 2026-07-07 -->
# STEP 654 — GB R1 원문 요약 (RNS 본문 → 한국어) + material 확장 · Part B

> **목표**: GB 공시 층에 **원문 기반 한국어 AI 요약**(R1) 추가 — US(EDGAR)·KR(DART)·JP(EDINET) R1의 GB 짝. 영어 RNS → 한국어. + STEP 653 라이브에서 본 **"중대" 배지 누락**(quarter·update·buyback) 수정.
>
> **Cowork이 이미 함** (tsc EXIT=0):
> - `app/api/gb-events/summary/route.ts`(신규) — Investegate 공시 상세 fetch → **`{source}-announcement` 컨테이너 본문 추출**(gnw/rns/prn…·HTML제거·푸터컷·12k캡) → gpt-4o-mini 한국어 사실 요약 → filing_summaries 캐시(accession=`GB`+id). SSRF 방지(Investegate 공시 URL만 허용). KR/JP summary 미러.
> - `app/api/gb-events/route.ts` — `MATERIAL` 정규식 확장(quarter·q1~4·update·outlook·earnings·buyback·agreement·completion 등) → 배지 정확도↑.
> - `app/stock/[symbol]/StockLensClient.tsx` — `GbFilingSummary`(url 전달) + GbEventLayer 각 항목 배선.
>
> **전제**: STEP 653(`7a7f3f6`) 이후. **빌드 + 커밋만.** 새 env/DB/패키지 없음 — `OPENAI_API_KEY`·`filing_summaries` 이미 존재.

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error" | head -8
```

## 1) 변경 확인
```bash
cd ~/stock-terminal && git status --short | grep -E "gb-events|StockLensClient|STEP_654"
```
- 기대: `app/api/gb-events/route.ts`(수정) · `app/api/gb-events/summary/route.ts`(신규) · `app/stock/[symbol]/StockLensClient.tsx`(수정) · `docs/STEP_654_COMMAND.md`(신규).

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add app/api/gb-events/route.ts app/api/gb-events/summary/route.ts "app/stock/[symbol]/StockLensClient.tsx" docs/STEP_654_COMMAND.md && git commit -m "feat(gb): R1 RNS 원문→한국어 AI 요약 + material 배지 확장" && git push
```

## 3) (배포 후) Cowork 검증
- `onetrillion.app/stock/SHEL.L`(쉘) → 각 공시 아래 **"AI 요약 · 원문 기반"** 한국어 2~3문장(Q2 아웃룩 수치 등). "중대" 배지가 update/quarter/buyback에도 붙는지.
- `/stock/AZN.L`(아스트라제네카) 등도 확인. KR/US/JP 회귀 없음.

## ✅ 완료 시 → GB 종목 페이지 R1 완성(US·KR·JP와 동급). 다음: VN→CN 공시 → 광고(대화 먼저).
