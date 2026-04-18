# W2.4 — 실적 탭 실데이터 연동

## 목표
EarningsTab 을 분기별 매출/영업이익/순이익 실데이터 차트로 교체. 데이터 소스는 DART 재무제표 API 신규 구축.

## STEP 0 — DART 재무제표 API 스펙 확인
- 엔드포인트: /api/fnlttSinglAcntAll.json (단일회사 전체 재무제표)
- 파라미터: corp_code, bsns_year, reprt_code (11011=사업보고서 / 11012=반기 / 11013=1분기 / 11014=3분기)
- 주요 account_nm: "매출액", "영업이익", "당기순이익"
- corp_code 는 public.dart_corp_codes 에서 stock_code 로 조회 (3,959건 이미 upsert)

## STEP 1 — lib/dart-financial.ts 생성
fetchDartFinancial(corpCode, year, reprtCode) → FinancialStatement
- lib/dart.ts 재사용
- account_nm 파싱 → { revenue, operatingIncome, netIncome } 정규화
- thstrm_amount 우선

## STEP 2 — /api/stocks/earnings 라우트 신규
- 입력: symbol (KR 종목)
- 출력: { quarters: [{ period, revenue, operatingIncome, netIncome, opMargin, netMargin }...], annual: [...] }
- 최근 5년 × 4분기 (1분기/반기/3분기/사업보고서 조합)
- corp_code 없으면 { quarters: [], annual: [], fallbackReason } graceful

## STEP 3 — EarningsTab 실데이터 차트 교체
- recharts (이미 설치)
- 상단 연간 그룹 바차트 (매출/영업이익/순이익, 5년)
- 하단 분기 라인차트 (8분기)
- 하단 테이블 (분기별 상세 + OP/순이익률)
- 라이트 테마 + UP=RED / DOWN=BLUE (실적 증가/감소 컨벤션 적용)
- 데이터 없을 때 "DART 재무제표 조회 불가" 안내

## STEP 4 — 검증
curl -s "http://localhost:3333/api/stocks/earnings?symbol=005930" | jq '.quarters | length, .annual | length'
expected: quarters ≥ 8, annual ≥ 3

## STEP 5 — Chrome MCP 검증 대기 (Cowork 에서 함)

## STEP 6 — git commit "feat(W2.4): EarningsTab 실데이터 - DART 재무제표 API"
