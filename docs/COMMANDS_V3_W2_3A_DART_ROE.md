# W2.3 보강 — DART corp_codes 시딩 + ROE 계산식

## STEP 0 — 환경 확인
- .env.local 에 DART_API_KEY 있는지 확인 (없으면 "DART 키 없이 진행 — 배당수익률 skip" 메시지 출력)
- DART_API_KEY 는 https://opendart.fss.or.kr/uss/umt/EgovMberInsertView.do 에서 발급 (무료, 일 10,000 요청)

## STEP 1 — DART corp_codes 시딩 (키 있을 때만)
scripts/seed-dart-corpcodes.py 실행 → corp_codes 테이블에 KOSPI+KOSDAQ 종목의 corp_code 매핑 저장
- DART OpenAPI /api/corpCode.xml 호출 (ZIP 파일 반환 → unzip → XML 파싱)
- corp_code, corp_name, stock_code 3컬럼 추출해서 supabase.table('corp_codes').upsert() 
- UNIQUE(stock_code) 제약

## STEP 2 — ROE 계산식 추가
lib/stock-overview.ts (혹은 /api/stocks/overview 라우트) 에서 ROE 계산:
- financials 테이블에서 net_income / equity 를 직접 조회
- 만약 net_income, equity 컬럼이 없으면 scripts/seed-financials-snapshot.py 를 수정해서 KIS API "국내주식-기본재무정보" 엔드포인트에서 net_income, equity 추가 시딩
- ROE = (net_income / equity) × 100 (% 단위)
- 소수점 둘째자리까지 표시

## STEP 3 — 검증
curl -s "http://localhost:3000/api/stocks/overview?symbol=005930" | jq .
expected: roe, dividendYield 필드 숫자로 채워짐

## STEP 4 — git commit (push 대기)
git add + commit "feat(W2.3 보강): DART corp_codes + ROE 계산"
