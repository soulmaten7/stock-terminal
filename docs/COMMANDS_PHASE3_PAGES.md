# Phase 3 — 신규 페이지 구현 명령어

---

## 명령어 1: 뉴스·공시 전체 페이지 (/news)

```
docs/PAGE_FRAME_SPEC.md의 "3. 뉴스·공시" 섹션을 참고해서 /news 페이지를 만들어줘.

[파일 구조]
app/news/page.tsx — 서버 컴포넌트 (메타데이터)
components/news/NewsClient.tsx — 클라이언트 메인
components/news/NewsFeed.tsx — 뉴스/공시 혼합 피드 (시간역순)
components/news/NewsFilter.tsx — 필터 사이드바
components/news/DisclosurePreview.tsx — 공시 원문 미리보기 (확장형)

[뉴스 피드]
- 기존 /api/news + /api/dart 데이터 활용
- 시간역순으로 뉴스와 공시가 혼합 표시
- 각 항목: 시간 | [매체/공시] | 제목 | 종목태그
- 공시는 빨간 점 + 밝은 배경 하이라이트
- 뉴스 매체별 컬러 태그 (한경=파랑, 매경=초록, 서울=보라, 연합=빨강, 조선=주황)
- 무한 스크롤 또는 "더보기" 버튼
- 5분마다 자동 새로고침

[필터 사이드바]
- 탭: [전체] [뉴스만] [공시만]
- 매체 필터: 체크박스 (한국경제, 매일경제, 서울경제, 연합뉴스, 조선비즈)
- 공시 유형 필터: 실적발표, 유상증자, 무상증자, 최대주주변경, 자사주, 기타
- 키워드 검색: 입력창
- 키워드 알림 설정: 🔔 버튼 (UI만, 기능은 나중에)

[공시 미리보기]
- 공시 항목 클릭하면 아코디언으로 확장
- DART 원문 링크 + PDF 바로보기 버튼
- 중요 키워드 하이라이트 (유상증자, 실적, 최대주주 등)

[스타일]
- 2컬럼: 피드(좌, 70%) + 필터(우, 30%)
- 768px 이하: 필터는 상단 접이식
- 기존 Tiffany 스타일 유지
```

---

## 명령어 2: 시장 분석 페이지 (/analysis)

```
docs/PAGE_FRAME_SPEC.md의 "4. 시장 분석" 섹션을 참고해서 /analysis 페이지를 만들어줘.

[파일 구조]
app/analysis/page.tsx
components/analysis/AnalysisClient.tsx
components/analysis/SectorHeatmap.tsx — 업종별 히트맵
components/analysis/ThemeGroups.tsx — 테마별 종목 묶음
components/analysis/MarketFlow.tsx — 시장 전체 수급
components/analysis/ShortInterest.tsx — 공매도 잔고 TOP
components/analysis/CreditBalance.tsx — 신용잔고 변동 TOP
components/analysis/EtfSpread.tsx — ETF/ETN 괴리율
components/analysis/EconomicDashboard.tsx — FRED 경제지표

[업종별 히트맵 — SectorHeatmap]
- 업종(IT, 바이오, 금융, 자동차, 화학, 철강, 건설 등)을 색상 블록으로
- 상승: 초록~진초록, 하락: 빨강~진빨강, 보합: 회색
- 블록 크기 = 시가총액 비중
- 클릭하면 해당 업종 종목 리스트 펼침
- 더미 데이터로 구현 (나중에 KRX 데이터 연결)

[테마별 종목 — ThemeGroups]
- 테마: 2차전지, AI반도체, 자율주행, 바이오, 방산, 원전 등
- 각 테마: 대장주 3~5개 + 테마 평균 등락률
- 더미 데이터

[시장 전체 수급 — MarketFlow]
- 외국인/기관/개인 당일 순매수 금액
- 프로그램 매매 차익/비차익
- 막대 차트 (Recharts 사용)
- 더미 데이터

[공매도/신용 — ShortInterest, CreditBalance]
- 테이블 형태, 더미 데이터
- 나중에 KRX 데이터 연결

[ETF 괴리율 — EtfSpread]
- ETF/ETN 이름 | 기초지수 | 괴리율(%) | 방향
- 더미 데이터

[FRED 경제지표 — EconomicDashboard]
- 기존 /api/fred 엔드포인트 활용 (FRED API 키 있음)
- 미국 기준금리, CPI, 실업률, PMI 최근 12개월 추이 차트
- Recharts LineChart 사용
- 마지막 업데이트 날짜 표시

[레이아웃]
- 히트맵이 상단 풀 너비
- 그 아래 2~3컬럼 그리드
- 경제지표 대시보드는 하단 풀 너비
```

---

## 명령어 3: 스크리너 페이지 (/screener)

```
docs/PAGE_FRAME_SPEC.md의 "5. 스크리너" 섹션을 참고해서 /screener 페이지를 만들어줘.

[파일 구조]
app/screener/page.tsx
components/screener/ScreenerClient.tsx
components/screener/PresetFilters.tsx — 프리셋 버튼들
components/screener/FilterBuilder.tsx — 커스텀 필터
components/screener/ScreenerResults.tsx — 결과 테이블

[프리셋 필터 — PresetFilters]
- 가로 스크롤 버튼들:
  🔥 거래량 급등 | 📈 신고가 돌파 | 💰 저PER 가치주 | 🏦 외국인 순매수 | 📊 골든크로스 | 💎 고배당
- 클릭하면 FilterBuilder에 해당 조건 자동 세팅

[커스텀 필터 — FilterBuilder]
- 시장: 코스피/코스닥 체크박스
- 시가총액: 범위 슬라이더 (100억 ~ 무제한)
- PER: 범위 슬라이더 (0 ~ 100)
- PBR: 범위 슬라이더 (0 ~ 10)
- 거래량: 드롭다운 (평소 대비 100%/200%/500% 이상)
- 외국인 순매수: 드롭다운 (1일/3일/5일 연속)
- 이동평균: 드롭다운 (5일선 위/20일선 위/60일선 위)
- 배당수익률: 범위 슬라이더 (0% ~ 10%)
- [검색] 버튼 + [초기화] 버튼

[결과 테이블 — ScreenerResults]
- 종목코드 | 종목명 | 현재가 | 등락률 | 거래량 | PER | PBR | 배당률 | 외국인비중 | [★추가]
- 정렬 가능 (컬럼 헤더 클릭)
- 종목명 클릭 → /stocks/[symbol] 이동
- ★ 클릭 → 관심종목 추가
- 지금은 더미 종목 데이터 30개로 프론트엔드 필터링
- 나중에 Supabase stocks 테이블에서 서버사이드 필터링

[스타일]
- 프리셋: bg-[#0D1117] 다크 영역
- 필터: bg-white Tiffany border
- 결과: 깔끔한 테이블, 줄무늬(striped)
```

---

## 명령어 4: 비교 분석 페이지 (/compare)

```
docs/PAGE_FRAME_SPEC.md의 "6. 비교 분석" 섹션을 참고해서 /compare 페이지를 만들어줘.

[파일 구조]
app/compare/page.tsx
components/compare/CompareClient.tsx
components/compare/StockSelector.tsx — 종목 선택 (최대 4개)
components/compare/ChartOverlay.tsx — 차트 겹치기
components/compare/CompareTable.tsx — 지표 비교 테이블
components/compare/SectorCompare.tsx — 업종 내 비교

[종목 선택 — StockSelector]
- 검색 입력창 최대 4개 (+ 버튼으로 추가)
- 자동완성 드롭다운 (종목명/코드 입력 시)
- 선택된 종목 태그로 표시 (x로 제거)
- 더미 종목 리스트로 자동완성 구현

[차트 겹치기 — ChartOverlay]
- Recharts LineChart로 구현
- 각 종목의 최근 3개월 수익률을 정규화(기준일=100)해서 비교
- 종목별 다른 색상 라인
- 더미 데이터

[비교 테이블 — CompareTable]
- 지표: 시가총액, PER, PBR, ROE, 배당수익률, 외국인비중, 52주고가, 52주저가
- 종목별 컬럼으로 나란히 비교
- 최고값 하이라이트 (초록 배경)

[업종 내 비교 — SectorCompare]
- 선택 종목의 업종에 속한 다른 종목들
- PER/PBR 기준 버블차트 또는 테이블
- "이 업종에서 이 종목의 위치"를 직관적으로

더미 데이터로 완성하고, 나중에 Supabase stocks/financials 테이블 연결.
```
