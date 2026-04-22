# WIDGET_SPEC: Chart (차트)

> **최종 업데이트**: 2026-04-22
> **우선순위**: P0 (위젯) / P0 (페이지)
> **위치**: `components/widgets/ChartWidget.tsx` (홈 위젯) · `app/chart/page.tsx` (상세 페이지)

---

## 1. 레퍼런스 벤치마크

### 주 레퍼런스 — TradingView
- **URL**: https://www.tradingview.com/chart/
- **핵심 UI**: 풀스크린 차트 + 상단 툴바(종목 검색·시간프레임·지표) + 좌측 그림 도구 + 우측 종목 패널
- **차트**: 캔들 기본, 시간프레임 1m/5m/15m/1h/1D/1W/1M, 지표 100+종, 저장 레이아웃
- **매수매도 요소**: "Trade" 버튼 — **제외 대상**

### 보조 레퍼런스 — Koyfin Advanced Chart
- **URL**: https://app.koyfin.com/chart
- **핵심 UI**: 다중 차트 패널(2x2 등), 종목 비교, 펀더멘털 오버레이
- **특이사항**: 블룸버그 대체를 노리는 프로 툴 — 모든 지표·기간 프리셋 강력

### 보조 레퍼런스 — 네이버증권 차트
- **URL**: https://finance.naver.com/item/fchart.naver?code=005930
- **핵심 UI**: 봉 타입 토글(캔들/라인/바), 기간(1일/1주/3개월/1년/3년/10년), 이동평균선 5/20/60/120
- **한국 투자자 UX 기준점**: 색상 체계(상승 빨강/하락 파랑) 재확인

---

## 2. 현재 상태 (STEP 51 기준)

### ChartWidget (홈 위젯) — 작동 중
- KRX(6자리): `lightweight-charts` + KIS API (`/api/kis/chart`)
- 해외: `TradingView tv.js` 임베드
- 심볼 검색 폼(상단 우측)
- 로딩·에러 UI

### `/chart` 페이지 — **스텁** (교체 대상)
- `WidgetDetailStub` 기반 더미 테이블 20행
- 실제 차트 없음, "실데이터 연결 예정" 뱃지만 표시
- **사용자 가치 0** → STEP 52에서 완전 교체

---

## 3. Gap 분석

| 항목 | TradingView/Koyfin | 현재 | 갭 |
|------|---------------------|------|----|
| 풀스크린 차트 페이지 | ✅ 전용 URL | ❌ 스텁 | **P0** |
| 시간프레임 전환 | 1m~1M 자유 | KRX 일봉만 | P0 (일/주/월) + Phase B(분봉) |
| 심볼 URL 파라미터 | `?symbol=AAPL` | 없음 | **P0** |
| OHLCV 데이터 테이블 | 차트 하단 또는 별도 탭 | 더미 | P0 (KRX 실데이터) |
| 기술 지표 오버레이 | MA/RSI/MACD 등 | 없음 | Phase B |
| 저장 레이아웃 | 로그인 계정 연동 | 없음 | Phase C |
| 다중 차트 비교 | 2x2/1+3 등 | 없음 | Phase C |

---

## 4. Phase A — STEP 52 범위 (즉시 실행)

### 4-1. 홈 위젯 연결 개선 (ChartWidget.tsx)
- **Before**: `href="/chart"` (고정)
- **After**: `href={'/chart?symbol=' + raw}` (현재 티커 전달)
- 사용자가 위젯에서 AAPL 입력 후 ↗ 클릭 → `/chart?symbol=NASDAQ:AAPL`

### 4-2. `/chart` 페이지 신설 (풀스크린)
- `app/chart/page.tsx` — Suspense 래퍼 (`useSearchParams` 사용 위함)
- `components/chart/ChartPageClient.tsx` 신설 — 본체
- URL 파라미터: `?symbol=005930` (기본값), 없으면 `005930`
- UI 구성:
  1. **상단 헤더**: 뒤로가기 + 페이지 타이틀("차트") + 현재 종목명·심볼
  2. **컨트롤 바**: 심볼 검색 폼(인풋+이동) + 기간 토글(일/주/월, KRX만)
  3. **차트 영역**: 높이 600px, 풀폭
     - KRX: `lightweight-charts` 캔들+거래량
     - 해외: TradingView tv.js 임베드 (autosize)
  4. **OHLCV 테이블** (KRX 전용): 최근 30일, 신순 정렬
     - 컬럼: 날짜 · 시가 · 고가 · 저가 · 종가 · 거래량 · 등락률
     - 종가 상승/하락 색상 (빨강/파랑)

### 4-3. 기간 토글 (D/W/M)
- `/api/kis/chart`는 이미 `period=D|W|M` 지원 → API 변경 불필요
- 상단 컨트롤 바에 탭 3개: **일 · 주 · 월**
- 선택 시 fetch 재실행

### 4-4. Phase A 제외 (의도적)
- 분봉(1m/5m/15m/1h): 다른 KIS 엔드포인트 필요(`inquire-time-itemchartprice`) → Phase B
- 기술지표(MA20, RSI, MACD): 차후 별도 STEP
- 그림 도구: TradingView 유료 기능 · 자체 구현 과도 → Phase C
- 다중 차트 비교: 레이아웃 대규모 작업 → Phase C

---

## 5. Phase B — 향후 (STEP 53+ 시점)

1. **분봉 차트** — KIS `inquire-time-itemchartprice` 엔드포인트 추가
2. **기술 지표** — 사용자 설정(MA20/60/120, 볼린저밴드, RSI14)
3. **차트 상단 요약 패널** — 현재가, 전일비, 52주 최고/최저, 시가총액 (StockHeader 재활용)

## 6. Phase C — 장기 (P1 이후)

1. **저장 레이아웃** — Supabase 테이블 `chart_layouts` (user_id, name, config JSON)
2. **다중 차트 비교** — 1개 캔버스에 복수 라인 중첩 (종가 비율 정규화)
3. **그림 도구** — 추세선, 피보나치 (lightweight-charts 공식 지원 범위 내)

---

## 7. 참고 원칙 재확인 (REFERENCE_PLATFORM_MAPPING.md §6)

- ✅ **보고 검색하는 기능만** 가져온다
- ❌ "Trade" 버튼·주문 창·알림 같은 실행 기능은 제외
- ✅ 중복 기능은 가장 잘 구현된 플랫폼 하나 선택 → **TradingView 임베드가 이미 최선**이므로 해외는 tv.js 유지
- ✅ 자체 UI 디자인 최소화 — 기능 동등성 먼저

---

## 8. STEP 52 성공 기준

- [ ] 홈 차트 위젯 ↗ 클릭 → `/chart?symbol=005930` 이동, 풀스크린 차트 렌더
- [ ] `/chart?symbol=AAPL` 직접 접근 → TradingView tv.js 정상 임베드
- [ ] KRX 기간 토글(일/주/월) 전환 시 차트 재렌더
- [ ] OHLCV 테이블 30행, 신순 정렬, 색상 코딩 (KRX)
- [ ] 빌드 통과 (`npm run build` 0 에러)
