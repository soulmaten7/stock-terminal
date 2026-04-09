# Phase 1 — 홈페이지 리팩토링 명령어
<!-- Claude Code에 순서대로 입력할 명령어 모음 -->

---

## 명령어 1: 홈 레이아웃 3층 구조 + 광고란 재설계

```
docs/PAGE_FRAME_SPEC.md를 읽고 홈페이지를 3층 라이브스코어 구조로 리팩토링해줘.

현재 HomeClient.tsx는 3컬럼(채팅|차트|뉴스/공시) 구조인데, 이걸 아래 구조로 완전히 바꿔야 해:

[전체 레이아웃]
- max-w-[1400px] mx-auto (콘텐츠 영역)
- 콘텐츠 좌우에 광고 컬럼 배치 (콘텐츠 바깥, 화면 양쪽 여백 활용)

[1층 — 뷰포트에 보이는 영역, 스크롤 전]
좌: 채팅 영역 (기존 SidebarChat 재활용, 너비 280px)
우: 라이브 스코어보드 영역 (flex-1, 나머지 공간)
  - 상단: 관심종목 실시간 현재가 테이블 (WatchlistLive 컴포넌트 신규)
  - 중단: 외국인/기관 실시간 순매수 TOP 5 (InstitutionalFlow 컴포넌트 신규)
  - 하단: 속보 뉴스/공시 혼합 피드 (BreakingFeed 컴포넌트 신규)

[2층 — 스크롤하면 나오는 영역]
섹션 타이틀: "오늘의 시장" (h2)
2x2 또는 2x3 그리드:
  - 거래량 급등 종목 (VolumeSpike 컴포넌트 신규)
  - 프로그램 매매 동향 (ProgramTrading 컴포넌트 신규)
  - 글로벌 선물 지수 — TradingView MiniSymbolOverview 위젯 4개 (S&P500, NASDAQ, WTI, GOLD)
  - 코스피/코스닥 미니 차트 — TradingView MiniChart 위젯 2개
  - 투자주의/경고 종목 (WarningStocks 컴포넌트 신규)

[3층 — 더 스크롤하면 나오는 영역]
섹션 타이틀: "주요 일정" (h2)
카드 레이아웃:
  - 경제지표 발표 일정 (EconomicCalendar 컴포넌트 신규)
  - IPO 일정 (IpoSchedule 컴포넌트 신규)
  - 실적 발표 예정 (EarningsCalendar 컴포넌트 신규)

[좌우 광고]
- 1층 옆: AdBanner 컴포넌트 type="premium" (인증 메이저 광고)
- 2~3층 옆: AdBanner 컴포넌트 type="general" (일반 광고)
- 광고란 너비: 160px, 콘텐츠 영역 바깥 position
- 화면 너비 1600px 이하에서는 광고란 숨김

[스타일 규칙]
- 기존 Tiffany 스타일 유지: bg-white, border-[3px] border-[#0ABAB5]
- 다크 배경 카드: bg-[#0D1117] (차트/금융데이터 영역)
- 텍스트: 흐릿한 rgba/opacity 금지, 전부 solid HEX (#000000, #4A4A4A)
- 1층은 min-h-[calc(100vh-8rem)]으로 뷰포트 꽉 채우기
- 2층, 3층은 자연스러운 높이

[신규 컴포넌트 파일 생성 위치]
components/home/ 폴더에:
- WatchlistLive.tsx
- InstitutionalFlow.tsx
- BreakingFeed.tsx
- VolumeSpike.tsx
- ProgramTrading.tsx
- GlobalFutures.tsx
- MarketMiniCharts.tsx
- WarningStocks.tsx
- EconomicCalendar.tsx
- IpoSchedule.tsx
- EarningsCalendar.tsx
- AdBanner.tsx

지금은 한투 API가 없으니까 모든 실시간 데이터 컴포넌트는 더미 데이터로 만들되,
실제 API 연동할 수 있는 구조(props 또는 fetch 함수)를 미리 잡아놔.
기존 TodayDisclosures.tsx, TodayNews.tsx는 BreakingFeed에 통합해서 혼합 피드로 만들어.
기존 MarketTabs.tsx는 2층 글로벌 선물/미니차트로 분리해서 재활용해.
기존 SupplyDemandSummary.tsx는 InstitutionalFlow로 리팩토링해.
기존 BannerSection.tsx는 AdBanner로 리팩토링해.

빌드 에러 없이 완성해줘. console.log 남기지 마.
```

---

## 명령어 2: 헤더 네비게이션 업데이트

```
Header.tsx의 네비게이션 메뉴를 업데이트해줘.

현재 메뉴에서 새로운 페이지 구조에 맞게 변경:

네비게이션 항목 (좌→우):
[홈] [종목] [뉴스·공시] [시장분석] [스크리너] [비교] [링크허브]

각 항목의 경로:
- 홈: /
- 종목: /stocks
- 뉴스·공시: /news (신규 페이지, 아직 없으면 임시 page.tsx 생성)
- 시장분석: /analysis (신규 페이지, 아직 없으면 임시 page.tsx 생성)
- 스크리너: /screener (신규 페이지, 아직 없으면 임시 page.tsx 생성)
- 비교: /compare (신규 페이지, 아직 없으면 임시 page.tsx 생성)
- 링크허브: /link-hub

우측 아이콘:
- 검색 🔍 (기존 유지)
- 알림 🔔 (신규 — 아이콘만, 기능은 나중에)
- 관심종목 ★ (기존 유지)
- 마이페이지/로그인 👤 (기존 유지)

신규 페이지들은 임시로 "준비 중입니다" 텍스트만 넣어둬.
기존 Tiffany 2줄 헤더 스타일 그대로 유지.
빌드 에러 없이.
```

---

## 명령어 3: 1층 핵심 — WatchlistLive 관심종목 실시간 테이블

```
components/home/WatchlistLive.tsx를 만들어줘.

이 컴포넌트는 홈 1층 라이브 스코어보드의 핵심이야.
라이브스코어에서 경기 스코어가 실시간으로 바뀌는 것처럼,
관심종목의 현재가/등락률/거래량이 실시간으로 업데이트되는 테이블.

[UI 구조]
- 상단: "관심종목" 타이틀 + [편집] 버튼
- 테이블 헤더: 종목명 | 현재가 | 등락률 | 거래량
- 각 행: 종목 데이터 (클릭하면 /stocks/[symbol]로 이동)
- 등락률 양수면 빨간색(#FF3B30), 음수면 파란색(#007AFF)
- 가격 변동 시 잠깐 깜빡이는 효과 (CSS animation, 배경색 잠깐 밝아졌다 원복)
- 최대 20종목 표시, 스크롤 가능

[데이터]
- 지금은 더미 데이터 10개 종목 (삼성전자, SK하이닉스, LG에너지솔루션, 현대차, NAVER, 카카오, 삼성바이오, 셀트리온, 기아, 포스코홀딩스)
- 나중에 한투 OpenAPI WebSocket으로 교체할 수 있도록 데이터 fetch 구조 분리
- useEffect로 5초마다 더미 데이터의 가격을 ±0.5% 범위로 랜덤 변동시켜서 실시간 느낌 구현

[스타일]
- bg-white border-[3px] border-[#0ABAB5] rounded-lg
- 텍스트 solid 색상만 (#000000, #4A4A4A)
- 높이: 1층의 약 50% 차지
```

---

## 명령어 4: 1층 — InstitutionalFlow 외국인/기관 순매수

```
components/home/InstitutionalFlow.tsx를 만들어줘.

외국인/기관이 오늘 뭘 사고 파는지 실시간으로 보여주는 컴포넌트.
채팅하면서 "기관이 삼성 쓸어담고 있어!" 이런 대화의 근거가 되는 데이터.

[UI 구조]
- 상단: "실시간 수급" 타이틀
- 탭: [외국인] [기관] 전환
- 테이블: 순매수 상위 5종목
  - 종목명 | 순매수량 | 순매수금액
  - 순매수 양수면 빨간색 + ▲, 음수면 파란색 + ▼
- 하단: "전체 보기 →" 링크 (/analysis로 이동)

[데이터]
- 더미 데이터 (외국인 TOP 5, 기관 TOP 5)
- 나중에 한투 API / KRX 데이터로 교체할 구조
- useEffect로 30초마다 순매수량 약간 변동 (실시간 느낌)

[스타일]
- bg-white border-[3px] border-[#0ABAB5] rounded-lg
- 1층의 약 25% 높이
```

---

## 명령어 5: 1층 — BreakingFeed 속보 뉴스/공시 혼합 피드

```
components/home/BreakingFeed.tsx를 만들어줘.

기존 TodayDisclosures.tsx와 TodayNews.tsx를 합쳐서 하나의 혼합 피드로.
시간순으로 뉴스와 공시가 섞여서 흘러가는 구조.

[UI 구조]
- 상단: "속보" 타이틀 + 🔴 라이브 인디케이터 (깜빡이는 빨간 점)
- 피드 리스트 (시간역순):
  - 09:32 [한경] 삼성전자, 2분기 실적 가이던스 상향...
  - 09:30 [공시] 유상증자 결정 — ○○○ (빨간 점 + 하이라이트)
  - 09:28 [연합] 코스피, 장 초반 강보합 출발...
  - ...
- [공시]는 빨간 점 + 밝은 배경 하이라이트
- [뉴스]는 매체명 컬러 태그 (한경=파랑, 매경=초록, 서울=보라, 연합=빨강, 조선=주황)
- 클릭하면 뉴스는 새 탭, 공시는 /news 페이지로 이동
- 최대 15건, 스크롤 가능
- "전체 보기 →" 링크 (/news)

[데이터]
- 기존 /api/dart, /api/news 엔드포인트 활용
- 5분마다 자동 새로고침 (기존 로직 유지)
- 데이터 없을 때 더미 데이터 표시

[스타일]
- bg-white border-[3px] border-[#0ABAB5] rounded-lg
- 1층의 약 25% 높이
```

---

## 명령어 6: 2층 — 오늘의 시장 섹션

```
2층 "오늘의 시장" 섹션에 들어갈 컴포넌트들을 만들어줘.

1. components/home/VolumeSpike.tsx
- "거래량 급등" 타이틀
- 평소 대비 거래량 200% 이상 급등 종목 리스트
- 종목명 | 현재가 | 등락률 | 거래량 | 급등배율(x3.2 이런 식)
- 더미 데이터 5종목
- bg-[#0D1117] 다크 스타일, 텍스트 #E0E0E0

2. components/home/ProgramTrading.tsx
- "프로그램 매매" 타이틀
- 차익거래: +200억 / 비차익거래: -100억 (막대 그래프 또는 숫자)
- 순매수 양수면 빨강, 음수면 파랑
- 더미 데이터
- bg-[#0D1117] 다크 스타일

3. components/home/GlobalFutures.tsx
- "글로벌 선물" 타이틀
- TradingView MiniSymbolOverview 위젯 사용
- 4개: SP:SPX (S&P500), NASDAQ:NDX (나스닥), NYMEX:CL1! (WTI원유), COMEX:GC1! (금)
- 위젯 심볼이 안 되면 텍스트 카드로 대체 (더미 데이터)
- bg-[#0D1117] 다크 스타일

4. components/home/MarketMiniCharts.tsx
- "코스피/코스닥" 타이틀
- TradingView MiniChart 위젯 2개 (KRX:KOSPI, KRX:KOSDAQ)
- 심볼 안 되면 텍스트 카드 대체
- bg-[#0D1117] 다크 스타일

5. components/home/WarningStocks.tsx
- "투자주의/경고" 타이틀
- ⚠️ 아이콘 + 종목 리스트
- 종류: 투자주의 / 투자경고 / 투자위험 구분 태그
- 더미 데이터 3종목
- bg-[#0D1117] 다크 스타일

2층 전체를 감싸는 섹션: bg-[#F8F9FA] (연한 회색 배경으로 1층과 구분)
그리드: grid grid-cols-2 lg:grid-cols-3 gap-4
```

---

## 명령어 7: 3층 — 주요 일정 섹션

```
3층 "주요 일정" 섹션에 들어갈 컴포넌트들을 만들어줘.

1. components/home/EconomicCalendar.tsx
- "경제지표 일정" 타이틀 + 📅 아이콘
- 이번 주 주요 경제지표 발표 일정 카드
- 날짜 | 시간 | 지표명 | 이전값 | 예상값 | 중요도(별 1~3개)
- 더미 데이터: CPI, FOMC, 고용지표, PMI 등 5건
- bg-white border-[3px] border-[#0ABAB5]

2. components/home/IpoSchedule.tsx
- "IPO 일정" 타이틀 + 🆕 아이콘
- 신규 상장 예정 종목 카드
- 종목명 | 공모가 밴드 | 상장일 | 시장(코스피/코스닥)
- 더미 데이터 3건
- bg-white border-[3px] border-[#0ABAB5]

3. components/home/EarningsCalendar.tsx
- "실적 발표 예정" 타이틀 + 📊 아이콘
- 이번 주 실적 발표 예정 종목
- 종목명 | 발표일 | 컨센서스(예상 영업이익)
- 더미 데이터 5건
- bg-white border-[3px] border-[#0ABAB5]

3층 전체를 감싸는 섹션: bg-white
그리드: grid grid-cols-1 lg:grid-cols-3 gap-4
```

---

## 명령어 8: 좌우 광고란

```
components/home/AdBanner.tsx를 만들어줘.

[Props]
- type: "premium" | "general"
- position: "left" | "right"

[UI]
- 세로 배너 (160px x 600px)
- type="premium": 테두리 금색(#C9A96E), "인증 광고" 뱃지
- type="general": 테두리 회색(#D1D5DB), "광고" 뱃지
- 배너 이미지는 placeholder (회색 박스 + "광고 문의: ad@stockterminal.com")
- 나중에 Supabase banners 테이블에서 이미지 로드하는 구조

[배치]
- HomeClient.tsx에서 콘텐츠 영역 양쪽에 absolute 또는 fixed로 배치
- 화면 너비 1600px 이상에서만 표시 (min-[1600px]:block)
- 1층 높이에서는 type="premium"
- 2~3층 높이에서는 type="general"
- 스크롤 따라가지 않음 (absolute, 각 층에 맞춰 배치)

기존 BannerSection.tsx는 삭제해도 됨 (AdBanner로 대체).
```

---

## 명령어 9: 최종 확인

```
홈페이지 리팩토링 후 아래 사항 확인해줘:

1. npm run build 에러 없는지
2. 1층이 뷰포트를 꽉 채우는지 (스크롤 전에 채팅 + 스코어보드가 다 보이는지)
3. 2층으로 스크롤이 자연스러운지
4. 3층까지 콘텐츠가 이어지는지
5. 1600px 이상에서 좌우 광고란이 보이는지
6. 1200px 이하에서 채팅이 숨겨지는지 (기존 반응형 유지)
7. 768px 이하에서 모바일 대응이 깨지지 않는지
8. console.log 남아있지 않은지
9. 기존 Header, TickerBar, Footer가 정상 작동하는지

문제 있으면 바로 수정해줘.
```

---

## 사용 방법
위 명령어를 1번부터 순서대로 Claude Code에 입력하면 됨.
한 번에 하나씩만 실행하고, 결과 확인 후 다음으로 넘어갈 것.
명령어 1이 제일 크고 중요 — 전체 뼈대를 잡는 것.
명령어 2~8은 각 컴포넌트를 하나씩 채워넣는 것.
명령어 9는 최종 검증.
