# Make (Integromat) 자동화 시나리오 설계
<!-- 2026-04-09 -->

## 시나리오 1: 뉴스 수집 — 매 시간

**트리거:** 매 시간 정각 (Scheduling → Every 1 hour)

1. **HTTP 모듈** × 5 (병렬)
   - 한국경제: `https://www.hankyung.com/feed/economy`
   - 매일경제: `https://www.mk.co.kr/rss/30100041/`
   - 서울경제: `https://www.sedaily.com/RSS/BC`
   - 연합뉴스: `https://www.yna.co.kr/rss/economy.xml`
   - 조선비즈: `https://biz.chosun.com/rss/allnews.xml`

2. **XML/JSON 파싱** → 제목, URL, 발행시간, 매체명 추출

3. **Supabase INSERT** (중복 체크: `title + url` 해시)
   - 테이블: `news`
   - 필드: title, source, url, published_at, country='KR'

---

## 시나리오 2: DART 공시 수집 — 매 5분 (장중)

**트리거:** 평일 08:30~18:00, 매 5분

1. **HTTP 모듈**: `GET https://opendart.fss.or.kr/api/list.json`
   - crtfc_key: `{{DART_API_KEY}}`
   - bgn_de: `{{오늘 YYYYMMDD}}`
   - page_count: 20

2. **JSON 파싱** → 각 공시 항목

3. **키워드 매칭** (Router 모듈)
   - "유상증자", "무상증자", "합병", "실적", "매출" → is_important = true

4. **Supabase INSERT**
   - 테이블: `disclosures`
   - 중복 체크: `rcept_no` (접수번호)

---

## 시나리오 3: KRX 수급 데이터 — 매일 16:30

**트리거:** 평일 16:30

1. **HTTP 모듈**: 한투 API `/uapi/domestic-stock/v1/quotations/inquire-investor`
   - 상위 30종목 순회 (Iterator 사용)
   - OAuth 토큰 → `/oauth2/tokenP`

2. **데이터 변환**: 외국인/기관/개인 순매수량, 순매수금액

3. **Supabase INSERT**
   - 테이블: `supply_demand`
   - 필드: stock_id, trade_date, foreign_net, institution_net, individual_net

---

## 시나리오 4: AI 분석 갱신 — 매주 일요일

**트리거:** 매주 일요일 03:00

1. **Supabase SELECT**: stocks 테이블에서 is_active=true 상위 50종목

2. **Iterator**: 각 종목에 대해

3. **HTTP 모듈**: 내부 API `POST /api/ai-analysis`
   - stockId, analysisType (5종), data (재무/수급 스냅샷)

4. **결과**: ai_analysis 테이블에 UPSERT (7일 유효)

5. **Rate limit**: 종목 간 2초 딜레이 (OpenAI 제한)

---

## 시나리오 5: 경제 캘린더 — 매주 월요일

**트리거:** 매주 월요일 06:00

1. **HTTP 모듈**: FRED API
   - 시리즈: GDP, CPIAUCSL, FEDFUNDS, UNRATE, DGS10
   - 최근 발표일 + 다음 발표 예정일

2. **데이터 가공**: 이번 주 발표 예정 지표 필터링

3. **Supabase INSERT**
   - 테이블: `economic_calendar` (별도 생성 필요)
   - 필드: indicator_name, release_date, previous_value, forecast_value, importance

---

## 환경변수 (Make에서 설정)

| 변수 | 값 |
|------|-----|
| SUPABASE_URL | .env.local의 NEXT_PUBLIC_SUPABASE_URL |
| SUPABASE_SERVICE_KEY | .env.local의 SUPABASE_SERVICE_ROLE_KEY |
| DART_API_KEY | .env.local의 DART_API_KEY |
| KIS_APP_KEY | .env.local의 KIS_APP_KEY |
| KIS_APP_SECRET | .env.local의 KIS_APP_SECRET |
| OPENAI_API_KEY | .env.local의 OPENAI_API_KEY |
| FRED_API_KEY | .env.local의 FRED_API_KEY |

---

## 모니터링

- 각 시나리오 실행 후 성공/실패 로그 → Supabase `automation_logs` 테이블
- 관리자 대시보드 `/admin`에서 최근 실행 상태 확인
- 실패 시 이메일 알림 (Make 내장 Error Handler)
