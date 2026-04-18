# W2.4 — 실적 탭 실데이터 연동

## 목표
EarningsTab 을 분기별 매출/영업이익/순이익 실데이터 차트로 교체. 데이터 소스는 DART 재무제표 API (/api/dart/financial) 신규 구축.

## STEP 0 — DART 재무제표 API 스펙 확인
- DART OpenAPI 문서: https://opendart.fss.or.kr/guide/main.do
- 엔드포인트: /api/fnlttSinglAcntAll.json (단일회사 전체 재무제표) 또는 /api/fnlttSinglAcnt.json (주요계정)
- 파라미터: corp_code, bsns_year (2021~2025), reprt_code (11011=사업보고서 / 11012=반기 / 11013=1분기 / 11014=3분기)
- 주요 account_nm: "매출액", "영업이익", "당기순이익", "자산총계", "부채총계", "자본총계"

## STEP 1 — lib/dart-financial.ts 생성
async function fetchDartFinancial(corpCode: string, year: number, reprtCode: string) → FinancialStatement
- lib/dart.ts 의 fetchDart / getDartCorpCode 재사용
- account_nm 파싱해서 revenue/operatingIncome/netIncome 정규화 반환
- thstrm_amount (당기 금액) 우선, 없으면 frmtrm_amount (전기)
- 단위: 원 (그대로 유지, UI 에서 조/억 포맷팅)

## STEP 2 — /api/stocks/earnings 라우트 신규
- 파라미터: symbol (KR 종목)
- 반환: { quarters: [{ period: "2025Q1", revenue, operatingIncome, netIncome, opMargin, netMargin }, ...], annual: [...] }
- 최근 5년 × 4분기 = 20개 데이터 포인트 (1분기/반기/3분기/사업보고서 조합)
- corp_code 없으면 DartKeyMissingError → { quarters: [], annual: [], fallbackReason: "..." } 형태로 graceful

## STEP 3 — EarningsTab 실데이터 차트로 교체
- recharts (이미 설치됨) 기반
- 상단: 연간 막대차트 (매출/영업이익/순이익, 최근 5년) — grouped bar
- 하단: 분기 추이 라인차트 (최근 8분기)
- 테이블: 분기별 상세 (매출/영업이익/순이익/OP마진%/순이익률%)
- 색상: 라이트 테마 + 한국 UP=RED(#FF3B30) / DOWN=BLUE(#007AFF) 컨벤션 유지
- 데이터 없을 때 "DART 재무제표 조회 불가 — corp_code 또는 조회년도 확인 필요" 안내

## STEP 4 — 검증
curl -s "http://localhost:3333/api/stocks/earnings?symbol=005930" | jq '.quarters | length, .annual | length'
expected: quarters ≥ 8, annual ≥ 3

## STEP 5 — Chrome MCP 검증 대기
http://localhost:3333/stocks/005930?tab=earnings 화면 캡처 후 Cowork 검증 → OK 면 push

## STEP 6 — git commit
"feat(W2.4): EarningsTab 실데이터 - DART 재무제표 API 연동"
(push 는 Cowork 검증 후)
