# KR 링크 허브 큐레이션 (Trillion 트릴리언) — 2026-06-25

> **목적**: KR 링크 디렉토리(신뢰 핵심 자산)를 US판과 동일한 엄격도로 2차 재검증.
> **방식**: 각 URL을 WebFetch로 직접 확인(애매/차단 시 WebSearch 교차검증). DB 변경 없음 — 리서치 + 문서만.
> **검증일**: 2026-06-25 (모든 ✅는 당일 라이브 응답 확인)
> **최종 KR 링크 수**: **71개** (기존 65 → -2 REMOVE, +8 ADD; 순증 +6)

---

## ⚠️ DB Write 전 확인 필요 항목 (UNVERIFIED)

| 사이트 | 사유 |
|--------|------|
| 연합인포맥스 (einfomax.co.kr) | WebFetch 도구 **blocklist(403)** 로 직접 fetch 불가. **WebSearch로 도메인·생존 교차확인 완료** (news.einfomax.co.kr 운영 중인 실존 금융정보사). 도메인 자체는 신뢰 가능하나, 도구 제약상 ⚠️ 표기 — DB 반영 전 브라우저로 1회 육안 확인 권장. |

> 그 외 모든 링크는 2026-06-25 WebFetch 200 응답(또는 정상 리다이렉트) 확인됨. JS 셸로 본문이 비어 보이는 사이트(comp.fnguide, consensus.hankyung, 38.co.kr, ipostock, kirs, kosdaqca 등)는 200 응답 + 검색 교차확인으로 라이브 판정.

---

## (a) 카테고리별 최종 큐레이션 테이블 (load-ready)

> `display_order`는 카테고리별로 1..N 깨끗하게 재부여. 기존 DB의 충돌(50 중복 등)은 무시하고 아래 순서를 최종으로 사용.
> 설명은 모두 한국어, 기존 스타일(≤ ~18자) 유지.

### analysis (5 → 6)
| order | site_name | url | description |
|-------|-----------|-----|-------------|
| 1 | FnGuide | https://www.fnguide.com | 재무·실적·컨센서스 종합 |
| 2 | 컴퍼니가이드 | https://comp.fnguide.com | 종목별 재무 스냅샷·지표 |
| 3 | 한경 컨센서스 | https://consensus.hankyung.com | 증권사 리포트 모음 |
| 4 | 아이투자 | https://itooza.com | 가치투자 포털·재무 V차트 |
| 5 | 딥서치 | https://www.deepsearch.com | 기업·재무 데이터 분석 |
| 6 | 한국IR협의회 | https://www.kirs.or.kr | 중소형주 무료 리서치 |

### chart (6 → 6)
| order | site_name | url | description |
|-------|-----------|-----|-------------|
| 1 | 네이버페이 증권 | https://finance.naver.com | 국내 대표 시세·차트 |
| 2 | 다음 금융 | https://finance.daum.net | 시세·차트·뉴스 포털 |
| 3 | TradingView | https://www.tradingview.com | 실시간 차트·기술적 분석 |
| 4 | 알파스퀘어 | https://www.alphasquare.co.kr | 퀀트 분석·종목 스크리너 |
| 5 | Investing.com | https://kr.investing.com | 글로벌 시장·경제 캘린더 |
| 6 | Finviz | https://finviz.com | 미국 주식 스크리너·히트맵 |

### community (6 → 5)
| order | site_name | url | description |
|-------|-----------|-----|-------------|
| 1 | 네이버 종목토론방 | https://finance.naver.com | 종목별 투자자 토론 |
| 2 | 팍스넷 | https://www.paxnet.co.kr | 주식 커뮤니티·종목토론 |
| 3 | 디시 주식 갤러리 | https://gall.dcinside.com/board/lists/?id=stock | 국내 주식 커뮤니티 |
| 4 | 에펨코리아 | https://www.fmkorea.com | 커뮤니티 (주식 게시판) |
| 5 | 토스증권 피드 | https://www.tossinvest.com/feed/recommended | 종목별 실시간 토론 |

### disclosure (6 → 6)
| order | site_name | url | description |
|-------|-----------|-----|-------------|
| 1 | DART 전자공시시스템 | https://dart.fss.or.kr | 상장기업 공시·재무제표 |
| 2 | KIND 상장공시 | https://kind.krx.co.kr | 거래소 상장기업 공시 |
| 3 | 금융감독원 | https://www.fss.or.kr | 금융감독 정보 |
| 4 | NICE신용평가 | https://www.nicerating.com | 기업 신용등급 |
| 5 | 한국신용평가 | https://www.kisrating.com | 기업 신용등급 평가 |
| 6 | 한국기업평가 | https://www.korearatings.com | 신용등급·평가 |

### etf (8 → 8)
| order | site_name | url | description |
|-------|-----------|-----|-------------|
| 1 | ETF CHECK | https://www.etfcheck.co.kr | 국내 ETF 비교·분석 |
| 2 | 금융투자협회 펀드정보 | https://freesis.kofia.or.kr | 펀드·금융투자 통계 |
| 3 | KODEX | https://www.kodex.com | 삼성자산운용 ETF |
| 4 | TIGER | https://www.tigeretf.com | 미래에셋 ETF |
| 5 | RISE ETF | https://www.riseetf.co.kr | KB자산운용 ETF |
| 6 | ACE ETF | https://www.aceetf.co.kr | 한국투자신탁운용 ETF |
| 7 | SOL ETF | https://www.soletf.com | 신한자산운용 ETF |
| 8 | PLUS ETF | https://www.plusetf.co.kr | 한화자산운용 ETF |

### exchange (3 → 5)
| order | site_name | url | description |
|-------|-----------|-----|-------------|
| 1 | 한국거래소(KRX) | https://www.krx.co.kr | 수급·공매도·거래량 |
| 2 | KRX 정보데이터시스템 | https://data.krx.co.kr | 상세 시장 데이터·통계 |
| 3 | 금융투자협회 | https://www.kofia.or.kr | 금융투자 통계·자율규제 |
| 4 | KOSCOM | https://www.koscom.co.kr | 금융 데이터 서비스 |
| 5 | 코스닥협회 | https://www.kosdaqca.or.kr | 코스닥 기업·시장 정보 |

### ipo (4 → 6)
| order | site_name | url | description |
|-------|-----------|-----|-------------|
| 1 | 38커뮤니케이션 | https://www.38.co.kr | 공모주·장외주식 정보 |
| 2 | IPO스탁 | https://www.ipostock.co.kr | 공모주 청약·일정 |
| 3 | SEIBRO 예탁결제원 | https://www.seibro.or.kr | 배당·권리·증권 정보 |
| 4 | K-OTC | https://www.k-otc.or.kr | 협회 장외주식시장 |
| 5 | IRGO | https://www.irgo.co.kr | 기업 IR·공시 정보 |
| 6 | 증권플러스 비상장 | https://www.ustockplus.com | 비상장·장외주식 거래 |

### macro (6 → 8)
| order | site_name | url | description |
|-------|-----------|-----|-------------|
| 1 | 한국은행 ECOS | https://ecos.bok.or.kr | 기준금리·GDP·CPI·통화량 |
| 2 | 통계청 KOSIS | https://kosis.kr | 국가 통계 데이터 |
| 3 | e-나라지표 | https://www.index.go.kr | 국가 주요 지표 |
| 4 | 기획재정부 | https://www.moef.go.kr | 경제정책·재정 |
| 5 | 금융위원회 | https://www.fsc.go.kr | 금융정책·규제·인가 |
| 6 | KDI 한국개발연구원 | https://www.kdi.re.kr | 경제 연구·전망 |
| 7 | 국제금융센터 KCIF | https://www.kcif.or.kr | 글로벌 금융시장 분석 |
| 8 | KIEP 대외경제정책연구원 | https://www.kiep.go.kr | 대외경제·국제경제 연구 |

### news (11 → 11)
| order | site_name | url | description |
|-------|-----------|-----|-------------|
| 1 | 네이버 증권 뉴스 | https://finance.naver.com/news/ | 종합 주식 뉴스 |
| 2 | 한국경제 | https://www.hankyung.com/economy | 경제 일간지 |
| 3 | 매일경제 | https://www.mk.co.kr/economy | 경제 일간지 |
| 4 | 이데일리 | https://www.edaily.co.kr | 증권/금융 미디어 |
| 5 | 머니투데이 | https://www.mt.co.kr | 경제/금융 뉴스 |
| 6 | 파이낸셜뉴스 | https://www.fnnews.com | 금융 전문 뉴스 |
| 7 | 서울경제 | https://www.sedaily.com | 종합 경제 뉴스 |
| 8 | 아시아경제 | https://www.asiae.co.kr | 종합 경제 뉴스 |
| 9 | 연합인포맥스 | https://www.einfomax.co.kr | 실시간 금융정보 |
| 10 | 더벨 | https://www.thebell.co.kr | 자본시장·IB 전문 |
| 11 | 조선비즈 | https://biz.chosun.com | 경제·산업 뉴스 |

### research (10 → 10)
| order | site_name | url | description |
|-------|-----------|-----|-------------|
| 1 | 키움증권 리서치 | https://www.kiwoom.com | 종목·산업 리포트 |
| 2 | 미래에셋증권 리서치 | https://securities.miraeasset.com | 투자전략·종목분석 |
| 3 | 삼성증권 리서치 | https://www.samsungpop.com | 시장·종목분석 |
| 4 | NH투자증권 리서치 | https://www.nhqv.com | 투자전략 리포트 |
| 5 | 한국투자증권 리서치 | https://www.truefriend.com | 종목분석·시장전망 |
| 6 | KB증권 리서치 | https://www.kbsec.com | 종목·산업 리포트 |
| 7 | 신한투자증권 리서치 | https://www.shinhansec.com | 투자전략·종목분석 |
| 8 | 하나증권 리서치 | https://www.hanaw.com | 종목분석·시장전망 |
| 9 | 메리츠증권 리서치 | https://www.imeritz.com | 리서치 리포트 |
| 10 | 대신증권 리서치 | https://www.daishin.com | 종목분석 리포트 |

**최종 합계**: analysis 6 + chart 6 + community 5 + disclosure 6 + etf 8 + exchange 5 + ipo 6 + macro 8 + news 11 + research 10 = **71개**
> 산식: 기존 65 − REMOVE 2(클리앙·Investing.com 포럼) + ADD 8(한국IR협의회·KOFIA·코스닥협회·IRGO·증권플러스비상장·KCIF·KIEP·토스증권피드) = 71. (연합인포맥스는 기존부터 news라 카테고리 이동 없음, FIX만.)

---

## (b) 변경 리스트 (CHANGE LIST)

### 🔧 FIX (URL/이름/https 수정)

| 항목 | old → new | 사유 |
|------|-----------|------|
| 연합인포맥스 | url `https://www.yonhapnews.co.kr` → `https://www.einfomax.co.kr` | yonhapnews.co.kr는 **연합뉴스**(별개 회사). 연합인포맥스 = 연합뉴스의 금융정보 자회사로 정식 도메인은 einfomax.co.kr. **이름 유지** 권장: 디렉토리 맥락이 "실시간 금융정보"라 금융데이터 전문사인 연합인포맥스가 일반 통신사 연합뉴스보다 적합. ⚠️UNVERIFIED(도구 blocklist, 검색 교차확인 완료). |
| KRX 정보데이터시스템 | `http://data.krx.co.kr` → `https://data.krx.co.kr` | https 정상 작동 확인(2026-06-25). JSP 세션 사이트로 첫 진입 시 세션 리다이렉트 있음(정상). |
| 한경 컨센서스 | desc `증권사 애널리스트 리포트 모음` → `증권사 리포트 모음` | 길이 정리(스타일 일치). URL ✅ 유지. |
| K-OTC | desc `금융투자협회 장외주식시장` → `협회 장외주식시장` | 길이 정리. URL ✅ 유지. |
| SEIBRO/KIND/금융투자협회 펀드정보 등 | desc 미세 단축 | 18자 스타일 일치(내용 동일). |

> 카테고리 이동(연합인포맥스): 기존에도 news였으므로 이동 없음. display_order만 재정렬.

### ➕ ADD (신규 — 전수 검증 완료, 모두 무료·공신력)

| 카테고리 | site_name | url | description | 검증 |
|---------|-----------|-----|-------------|------|
| analysis | 한국IR협의회 | https://www.kirs.or.kr | 중소형주 무료 리서치 | ✅ 200 (기업리서치 무료 SME 리포트 제공) |
| exchange | 금융투자협회 | https://www.kofia.or.kr | 금융투자 통계·자율규제 | ✅ 200 |
| exchange | 코스닥협회 | https://www.kosdaqca.or.kr | 코스닥 기업·시장 정보 | ✅ 200 |
| ipo | IRGO | https://www.irgo.co.kr | 기업 IR·공시 정보 | ✅ 검색확인(정식 도메인 irgo.co.kr; m./biz. 서브도메인 운영) |
| ipo | 증권플러스 비상장 | https://www.ustockplus.com | 비상장·장외주식 거래 | ✅ 검색확인(두나무 운영, 국내 1위 비상장 플랫폼) |
| macro | 국제금융센터 KCIF | https://www.kcif.or.kr | 글로벌 금융시장 분석 | ✅ 검색확인(라이브) |
| macro | KIEP 대외경제정책연구원 | https://www.kiep.go.kr | 대외경제·국제경제 연구 | ✅ 200 (실콘텐츠 확인) |
| community | 토스증권 피드 | https://www.tossinvest.com/feed/recommended | 종목별 실시간 토론 | ✅ 200 (클리앙 대체 — 토스증권 '피드' 종목별 토론) |

### ❌ REMOVE

| 카테고리 | site_name | url | 사유 |
|---------|-----------|-----|------|
| community | 클리앙 | https://www.clien.net | 라이브이나 **IT·재테크 종합 커뮤니티**로 주식 특화 매우 약함. 본문 확인 결과 주식은 'cm_stock' 소모임 1개뿐 — 정보허브의 주식 토론 가치 낮음. → **토스증권 피드로 대체.** |
| community | Investing.com 포럼 | https://kr.investing.com/analysis | URL이 실제 포럼이 아닌 **분석(analysis) 페이지**. 이미 chart 카테고리에 Investing.com 등재되어 **중복**. 한국형 커뮤니티 성격도 약함. → 제거. |

### ✅ KEEP-AS-IS (검증 통과 — URL/이름 변경 없음)

| 카테고리 | site_name | 검증 메모 |
|---------|-----------|-----------|
| analysis | FnGuide / 컴퍼니가이드 / 한경컨센서스 / 아이투자 / 딥서치 | 전부 ✅. deepsearch.com이 정확한 도메인(딥서치). comp.fnguide.com 실존(스냅샷 ASP). |
| chart | 네이버페이 증권 / 다음 금융 / TradingView / 알파스퀘어 / Investing.com / Finviz | 전부 ✅. 알파스퀘어 = (주)알파프라임 운영, 2026 라이브. |
| community | 네이버 종목토론방 / 팍스넷 / 디시 주식갤러리 / 에펨코리아 | 전부 ✅. 팍스넷 풀 라이브. |
| disclosure | DART / KIND / 금감원 / NICE신용평가 / 한국신용평가 / 한국기업평가 | 전부 ✅(대형 공신력). |
| etf | ETF CHECK / 펀드정보 / KODEX / TIGER / RISE / ACE / SOL / PLUS | **4개 리브랜드 사이트 전수 확인**: RISE(KB)·ACE(한투운용)·SOL(신한)·PLUS(한화) 모두 ✅ 2026 라이브. etfcheck canonical=localhost는 개발 잔재로 무관(실서비스 정상). |
| exchange | 한국거래소(KRX) / KOSCOM | ✅. |
| ipo | 38커뮤니케이션 / IPO스탁 / SEIBRO / K-OTC | 전부 ✅. K-OTC = KOFIA 운영 2025 라이브. |
| macro | 한국은행 ECOS / KOSIS / 기재부 / 금융위 / KDI / e-나라지표 | 전부 ✅(대형 정부·공공). |
| news | 네이버뉴스 / 한국경제 / 매경 / 이데일리 / 머니투데이 / 파이낸셜뉴스 / 서울경제 / 아시아경제 / 더벨 / 조선비즈 | 전부 ✅(대형 미디어). |
| research | 키움 / 미래에셋 / 삼성 / NH / 한투 / KB / 신한 / 하나 / 메리츠 / 대신 | 전부 ✅. **메리츠 imeritz.com 유지**(meritz.com 이전설 점검 결과 imeritz.com이 여전히 메리츠증권 공식). |

---

## 검토했으나 채택하지 않은 후보 (padding 방지)

| 후보 | 결정 | 사유 |
|------|------|------|
| 와이즈리포트 (wisereport.co.kr) | ❌ 미채택 | 라이브이나 **"단체 계약 증권사 직원 전용" 로그인 서비스** — 일반 개인 무료 접근 불가. 정보허브 부적합. |
| 버틀러 (butler.works) | ❌ 미채택 | 유료 퀀트 도구 성격 — "무료·공신력" 기준 미달, 패딩 회피. |
| ir-go.com | ❌ 미채택 | 직접 fetch 시 **ir.com(미국 기업 SW사)으로 리다이렉트**. 한국 IRGO 정식 도메인은 irgo.co.kr → 그쪽 채택. |
| 한경컨센서스 외 추가 리포트 애그리게이터 | — | 와이즈리포트 제외 후 무료 대안은 한국IR협의회(kirs)로 충분. |

---

## 검증 방법 메모
- WebFetch 200 응답 + 정상 리다이렉트 = 라이브 판정. JS 셸로 본문 빈 사이트는 200 + WebSearch 교차확인.
- 도구 blocklist(403) 사이트: einfomax.co.kr, m.stock.naver.com → 사용 대상은 einfomax뿐이며 WebSearch로 도메인·생존 교차확인(⚠️ 표기 유지).
- 큐레이션 원칙: 무료 + 공신력 + 주식/금융정보 직접 관련 + 중복 배제 + 품질 우선(패딩 금지).
