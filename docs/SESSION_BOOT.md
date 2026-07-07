<!-- 2026-07-07 -->
# Trillion(트릴리언) — 새 세션 부트(BOOT) 파일 🚀

> ⭐ **새 세션은 `docs/NEW_SESSION_HANDOFF.md`(단일 자급형 핸드오프)를 먼저 읽으세요** — 정체성·현재상태·아키텍처·워크플로우·DB·다음 작업이 한 파일에 정리됨. 이 BOOT 파일은 누적 히스토리(상세 보강용).

> 🗺️ **마스터 로드맵 = `docs/ROADMAP.md`** (무엇을/어떤 순서로의 단일 기준). **현재 Phase 2(한국 수익화 토대) 진행 중** — 광고·채널 수익 인프라 **무료 티어 + 관리자/운영자 동선 완성**, **결제 PG·본인인증(Phase 2 후반)만 남음**. 새 세션은 이 BOOT 다음으로 **ROADMAP §3(광고·게재 정책 + 결제·빌링 레일)** 을 본다.

> 🟢 **2026-07-07 (최신) · STEP 635~639 완료 (HEAD `aa525a5`) — 🔍 한국어 SEO 1차: 종목페이지 SSR·사이트맵·구조화데이터.**
> - **635 종목 서버컴포넌트 (`ff7f95d`)**: 봇 실측 진단(클라렌더→봇엔 코드만·회사명 없음·메타 루트공통·JSON-LD 0·sitemap 정적5) → `generateMetadata`(종목명 유니크 title/desc/canonical/OG) + `lib/stockName.ts`(KR=`kr_stock_snapshot`·해외=번들 JSON) + h1 SSR 이름주입 + JSON-LD(Breadcrumb+Corporation). page.tsx→`StockLensClient.tsx`.
> - **636 사이트맵 (`58e89ec`)**: 정적5→**약 21,800 URL**(KR 0.7·해외 19,038 0.5·revalidate 1d). **637 홈 (`0046c2c`)**: Organization+WebSite JSON-LD(SearchAction=종목 검색페이지 생기면).
> - **638 라이브 검증→639 픽스 (`aa525a5`)**: 봇 초기HTML엔 회사명 정상이나 하이드레이션 후 `/api/lens`(야후 영문)가 h1을 "SamsungElec"로 덮음 → **h1 `initialName||data.name`(SSR 네이티브 유지)** + US "- Common Stock" 잡음 제거(`cleanUsName`). 재검증 통과(삼성전자·SK하이닉스·トヨタ自動車·Apple Inc.).
> - **교훈**: 클라렌더=봇 빈페이지 → 서버컴포넌트+generateMetadata가 SEO 핵심. 야후 lens명 vs SSR 네이티브명 불일치 → SSR 우선. **▶ 다음=구글 서치콘솔 sitemap 제출 등 SEO 마무리 → 한국어 광고 설정.**
>
> 🟢 **2026-07-06 · STEP 622~630 완료 (HEAD `3f38f33`) — 🇻🇳 베트남 탭 + 🇬🇧 영국 탭 완성(빠짐없이) + 완전성 원칙.**
> - **🇻🇳 VN (623~627)**: 링크49·배관(vi·₫)·종목보드(HOSE 387·야후 `.VN`·`vn_stock_perf` 크론·vnstock으로 유니버스+베트남어명)·**지수바 VN-Index/VN30(야후 미커버→VnDirect dchart 대체)**·매매처(brokers VN 13)·R3(`vn_names`·vi·통화 동·3중 검수). ⚠️ 东方財富·HNX 야후 미커버→텐센트/HOSE-only 대응.
> - **🇬🇧 GB (628~630)**: 링크46·배관(en-GB·펜스`p`)·종목보드(FTSE 350·349·야후 `.L`·`gb_stock_perf`·Wikipedia FTSE 100/250 헤더파싱 유니버스+클린 영문명)·**지수바 FTSE 100/250·USD/GBP**·매매처(brokers GB 12)·R3(`gb_names`·en-GB·통화 파운드·3중 검수). 영어권=이름 클린화만·번역 불필요.
> - **🔴 완전성 원칙 못박음**(VN-Index·매매처를 '후속'으로 뺀 실수 교정): `CLAUDE.md` 절대규칙 + 플레이북 §0/배너 = "새 탭·언어권 착수 전 플레이북 재독" + "MVP=축소 아님·DoD 전 항목(지수바·매매처 포함) 빠짐없이·소스 막히면 대체 찾아서라도".
> - **국가탭: US·KR·JP·CN·VN·GB = 6개국 · R3 전부 네이티브.** 마이그 033~038. **▶ 다음**: 한국어권 마무리(디테일+한국어 SEO+광고→한국어판 MVP) 또는 국가 더(인도·대만·EU).
>
> 🟢 **2026-07-06 · STEP 612~620 완료 (HEAD `55c94df`) — CN R3 + JP·CN 네이티브 종목명(진짜 자국어 검색) + 4개국 R3 3중 검수.**
> - **612~616 CN R3 + JP 네이티브 (`f1ff19a`)**: 야후가 JP/CN을 영어명으로 줘 ja/zh가 실은 영어검색이던 문제 → **JPX 東証上場銘柄一覧(data_j.xls) → `jp_names` 4,014종목(일본어명)** 시드 → ja가 진짜 일본 기사(도요타 아쿠아·GR SPORT·엔화가). CN R3 zh + 로컬 0건 시 영어 폴백. 야후 영어명=폴백.
> - **618~619 CN 네이티브 (`6a9cecd`)**: `cn_names` **7,095행 = HK 3,227(HKEX 번체목록 ListOfSecurities_c.xlsx·zh-HK) + A주 3,868(텐센트 qt.gtimg.cn 간체·zh-CN)**. **东方財富(push2his)이 KR·샌드박스 IP 차단(exit52/502) → 텐센트 우회**(응답 GBK → `TextDecoder('gbk')`). HKEX xlsx `!ref`=A1:R8 오류 → 실제 셀에서 범위 재계산 필수. `lib/cnName.ts`·`scripts/seed_cn_names.ts`·마이그 `jp_names`/`cn_names`(MCP).
> - **620 3중 검수 수정 (`55c94df`)**: JP·CN·KR을 실제 종목 **3회씩 독립생성** 검수 → ① KR **NAVER 빈 요약**(공식 상장명 영문 "NAVER"→검색이 '네이버' 블로그에 잠식) = `lib/krName.ts` 별칭(035420→네이버·플랫폼충돌만; S-Oil·HMM·LG 등은 정상이라 미등록) ② JP/CN **통화 오표기**(소프트뱅크 "원"←엔) = **결정론 후처리**(ja 원→엔·zh 원→위안·숫자+단위 뒤만·KR 경로 안 탐) ③ 회사명 CJK 잔존(任天堂 등) = 한글화 프롬프트. 재검증 통과.
> - **국가별 AI: US·KR = R1·R2·R3 완전체 / JP·CN = R3 네이티브 완성**(공시 R1·R2=무료 실시간 소스 없어 보류). **4개국 R3 3중 검수 통과.**
> - **▶ 다음**: 베트남 탭(새 국가) / 전 국가 추가 검수 / SEO. 잔여(경미): A주 일부 사건없음=빈 요약(정직)·CJK 회사명 드물게 잔존.
>
> 🟢 **2026-07-06 · STEP 600~611 완료 (HEAD `b2079b7`) — 'AI 렌즈' 브랜딩·발견성 + KR AI 확장 + JP R3 뉴스.**
> - **브랜딩·UX (600~603 · `121daae`)**: 옛 'TRAI' → **'AI 렌즈' 어두운 박스 배지**("기법별 전망" 제거·언어별 렌즈) · 종목 뒤로가기 = `router.back()` + **시트 URL 동기화**(`lib/useSheetSync.ts` — 홈=보드라 그냥 back하면 모바일 시트 소실 → `?s=심볼` history push로 **뒤로 시 시트 복원**) · 시트 현재가 중복 제거 · **AI 렌즈 발견성 표식**(현재가↔1일전 사이 · PC 전용 컬럼/모바일 상단 라벨+행 민트 렌즈 아이콘 · 신호 전용·탭→시트→'보기').
> - **R4 영구 보류** (`AI_BRIEFING_SPEC`): Q&A=사실상 어드바이저 → 정보 허브 포지셔닝 밖 + 무료 모델 상충 → 안 만듦·미래 자산. **R1~R3 = AI 층 완결 범위.**
> - **🎉 KR AI 확장 (604~606 · `cf22aba`)**: R2 브리핑에 **DART 공시** · R3 뉴스 **한글명(`dart_corp_codes.corp_name`)+ko 로케일** · **R3 짜깁기 금지** 가드레일. Cowork MCP 검수(삼성·SK하이닉스·NAVER) 통과. **"US 완성형→데이터 교체" KR 실증.**
> - **🎉 JP R3 뉴스 (607~611 · `b2079b7`)**: 야후 일본명(`fetchYahooName`)+ja 로케일. **결정론 후처리로 2건 해결** — ① 야후 영어 상호→영어 기사→LLM 영어 출력 → **요약 한국어 아니면 번역 폴백**. ② 구글 RSS 옛기사 최근-pubDate 재순환(프롬프트·날짜필터 무력) → **작년 이전 연도(2023) 언급 문장 정규식 삭제**. +pubDate 60일 최근성(전 국가). MCP 검수(도요타·소니·소프트뱅크) 통과. **교훈: LLM 프롬프트 설득 2회 실패 → 코드 후처리로 확정.**
> - **국가별 AI 현황**: **US R1·R2·R3 / KR R1·R2·R3 / JP R3**(공시 R1·R2=EDINET 대기·무료 키) **/ CN 미착수.** (591~598 상세 = CHANGELOG.)
> - **▶ 다음**: CN R3 / SEO — **JP 공시(R1·R2)=보류 확정**(EDINET/TDnet 무료 실시간 소스 없음 → R3 뉴스로 대체, 상세=`AI_BRIEFING_SPEC`). 국가 확장은 사용자 승인 후.
>
> 🟢 **2026-07-06 · STEP 584~589 완료 (HEAD `3f4b647`) + 🔴 AI 브리핑 레이어 전략·설계 확정.** 종목 페이지를 "AI LENS"로 명명·전문가 톤·정직 보이스로 마감(584~589) + **AI(LLM) 브리핑 레이어 R1~R3 + 접근/수익 모델 대전환**:
> - **STEP 584~589 (코드·문서 마감)**: 584 문서매듭 · **585 페이지명 "AI LENS"** + '이 화면 읽는 법'(progressive disclosure) + 이벤트 severity 재구성(중대=노출·루틴=접힘) · **586 한국어 보이스 v1**(원어민 전문가 톤: 표본약함→약한 신호·건전성→재무 건전성·근거주의→자료 갱신 · `VOICE_GUIDE.md` 신설) · **587 전문가 톤 1차**(접힘 카드=판정+수치 선언형·디스클레이머 통합[상단1줄·법적=전역푸터]) · **588 판정 보이스 v2**(구어 제거) · **589 시간축 스트립 초보 정리**(장기 칸 합의도 단어·암호 꼬리표 제거).
> - **🔴 AI 브리핑 레이어 확정 (마스터 = `docs/AI_BRIEFING_SPEC.md`)**: LLM = **비정형 텍스트를 사실로 읽는 것만**(점수·예측·판정 X). **R1**=공시 원문 요약 · **R2**=종목 브리핑(핵심 긴장+지켜볼 것·최고 애널리스트식) · **R3**=뉴스 요약·토픽태그 · R4(Q&A)=안 함. 배관 이미 있음(`ai-analysis` OpenAI gpt-4o-mini+`ai_analysis` 캐시 · `eightK` 원문URL).
> - **🔑 접근/수익 대전환 (BUSINESS_STRATEGY 07-06)**: **AI 브리핑 = 완전 무료·공개**(구독 폐기) → **SEO·글로벌 트래픽 엔진**. **로그인 게이트 = 콘텐츠 아님·개인화(즐겨찾기·알림)에만**(콘텐츠 숨기면 SEO 죽음). 수익 = **광고·디렉토리·브로커 제휴**(트래픽 뒤·저거부감부터·배너 맨끝). AI=언어불문 보편가치 → 무료+다국어+SEO=전세계 플랫폼.
> - **리서치 정정**: 뉴스 감성 **팩터로 안 함**(대형주 예측력 약·LM 상업 유료·가짜정밀도 → 사실 브리핑만·토픽태그). 추정치 변경 렌즈 = 진짜 신선 후보이나 **백테스트 이력 유료 → 참고용·보류**(Yahoo `eps_trend` 라이브 무료 실측 완료·삼성/도요타 커버).
> - **🎉 AI US 완성형 빌드 완료 (STEP 591~593 라이브)**: R1(8-K 원문 요약·`e0d033d`)·R2(종목 브리핑·`3b51efe`)·R3(뉴스 요약·`28cc508`) US 라이브 — 전부 무료·지연생성+캐시·예측 0. 마이그 030·031·032(MCP). 라이브 검증 통과(NVDA 5.02 요약·엇갈림 브리핑·뉴스 토픽).
> - **🎉 US(R1+R2+R3) 확정 (595~598·HEAD `24b3438`)** + **KR 공시층·R1-KR 완료**(DART·EUC-KR·corp_code 3,922 시드). 3라운드 검증+Cowork MCP 독립 재검수 통과·**R3 밸류 의견 누수 차단**(과대평가·목표주가 → 구체 사건만/숨김).
> - **🔒 검증 규칙**: STEP 명령서는 Claude Code **동일 검증 3회 반복** 후 보고 + Cowork **MCP로 캐시 실물 재검수**.
> - **▶ 다음**: 다른 국가탭 확장(R2-KR·R3-KR·JP/CN)은 **사용자 승인 후에만**. 그다음 SEO.
>
> 🟢 **2026-07-05 (직전) · STEP 579~583 완료 (HEAD `c39117b`) — 시간축(단기·중기·장기) 재구성 + 실시간 이벤트(공시) 사실 레이어 (US 완성형).** 종목 페이지를 시간축 중심으로 재편 + 유료급 공시 이벤트 층:
> - **시간축 (579~580)**: `LensRead.horizon`(모멘텀=중기·기술=단기·재무계열=장기) + `/api/lens` **퍼센타일**(DB함수 `lens_percentiles` 029·방향별·lens_scores US 1000 대비, 비US null). 페이지 = **시간축 스트립**(단기 RSI존·중기 모멘텀 퍼센타일·장기 팩터 "N중 M 우호") + **기법별 best-viz**(퍼센타일 게이지·RSI존·체크리스트) + **단/중/장 그룹핑**. `HorizonStrip`·`PctGauge`·`RsiZone`.
> - **이벤트 층 (581~583)**: `lib/eightK.ts`(8-K item→렌즈·A 근거흔듦⚠️/B 새맥락📌/general·**flagLens**) + `/api/events`(EDGAR submissions items **결정론 분류**·NLP 없이·US) + `EVENT_LAYER_SPEC.md`. 페이지 "최근 중대 공시·이벤트" 리스트 + 렌즈 ⚠️/📌 플래그. **정직화(583)**: 5.02="임원·이사진 변동"(과장 제거·리스트만)·F-Score 플래그·9.01 제거·A/B 분리. **사실만·예측 없음·판단은 사용자.** 오너리스크(5.02)·실적(2.02) 실데이터 검증.
> - **전략 (BUSINESS_STRATEGY 07-05)**: **"3개의 시계"**(팩터=하루1회·이벤트=즉시·뉴스=Pro) · **펀더 신선도=추정치 변경**(Zacks·매일=진짜 staleness 해법) · free/pro=StockTitan 티어 · 공시=DART+EDGAR 무료. 유료 벤치마크: Stockopedia·StockTitan(8-K AI요약)·Benzinga WIIM·Zacks·AskEdgar.
> - **▶ 다음**: ② **AI 원문 실독 요약**(8-K 본문 읽어 정확한 한 줄·무료N/Pro — StockTitan식) → 거래량 맥락(WIIM-lite) → 추정치 렌즈(US) → KR 공시(DART). 세부 문구 미세조정.
>
> 🟢 **2026-07-04 (직전) · STEP 570~577 완료 (HEAD `be86401`) — 스크리닝 인프라 + F-Score 실물·표시 헌장 + 🔴 TRAI 정체성 결정 + 6카드 헌장.** 오늘 = 뒷단 스크리닝 완성 + F-Score를 유료 표준급 정직 카드로 실물화 + 규칙을 헌장으로 + TRAI(AI 결론) 폐기·정체성 재정립 + 6카드 헌장 확산:
> - **스크리닝 토대(570~573)**: 공용 엔진 `lensCompute`(카드=배치 계산 일치)·`value/state` → `lens_scores` 테이블 → `lensPrecompute`(시총 상위 **1000**·100행 flush) → **매일 20:00 UTC 크론**. 공용엔진→DB→무인 갱신. **단 스크리너 UI는 안 만듦**(사용자: 종목 페이지=본체·스크리너=픽에 가까워 중립과 충돌). 미리계산=대기(나중 보드 힌트).
> - **F-Score 실물 + 표시 헌장(574)**: 성적표→**부실 위험 체크**·이름 크게·**이게 뭐예요 박스**·**9칸 트래커**·**9항목 3그룹**(수익성·재무·효율, 전문용어+쉬운풀이)·상단 **신뢰도 등급 범례**. **`docs/LENS_DISPLAY_CHARTER.md` 신설**(7카드 표시 규칙·F-Score 기준 템플릿). 유료 대조(GuruFocus·Stockopedia)=구조가 표준 일치, 우리 쉬운말·정직 검증(t≈0.7) 우위. + 이익의 질 노트 픽스(575).
> - **🔴 TRAI 스텁 제거 + 정체성 결정(576)**: "AI 종합 분석"(5렌즈 요약)이 **사용자 판단권 침해** → 제거(page.tsx·ai-view). 리서치(Danelfin·TipRanks·Cortex: 뉴스+팩터 결합은 표준·위반은 마지막 Buy/Sell뿐) → **④ TRAI 재정의**: 뉴스=**투명 사실 렌즈**(FinBERT 무료 오픈소스+8-K 이벤트·헤드라인)·블랙박스/권유 아님·**결론은 영원히 사용자**·맨 마지막 층. **제품 정체성 = "AI가 답 주는 앱"이 아니라 "정직한 재료로 사용자가 판단하는 앱".** (BUSINESS_STRATEGY 로그·헌장 §0 원칙5.)
> - **6카드 헌장(577)**: 공용 카드 템플릿 1곳 → **6개 동시**(이름 크게·이게 뭐예요 박스·접힘=메뉴) + F-Score 접힘 일관. **7장 골격 통일**·근거수치 그대로 노출.
> - **▶ 다음**: 6카드 눈검수 → 렌즈별 "이게 뭐예요?" 문구 다듬기 + **기법별 유료 레퍼런스 대조**(헌장 §5) → 조합전략(③) → 뉴스 투명 렌즈(④·맨 마지막). (일본어·중국어 카피·수익화 계속 뒤로.)
>
> 🟢 **2026-07-04 (직전) · STEP 539~568 완료 (HEAD `ebbf3d8`) — 렌즈 표현·다국어·7기법 + 직관화 + 3중 교차검증 + UI 편의성 + 카드 패밀리룩 + "이 기법 방향"(방향 층) + 제품 청사진(4층).** 검증된 렌즈들을 정직하게·언어답게·직관적으로·중립적으로 보여주는 UI:
> - **표현 개편**: 영문 정식명칭(앵커)+한글 요약 · **"{기법} 알아보기"**(개념·유래: 제가디시1993·피오트로스키2000 등) · **"자세히"**(검증·한계) 접기 · 단일 열·홈 너비 통일 · **TRAI**(민트 T) 리브랜딩.
> - **정직화**: 밸류 라벨 "저평가/고평가"(verdict) → "낮음/보통/높음"(사실) · **신뢰도 등급 배지 겉면 노출**(검증/표본약함/건전성/참고용) · **기법 엇갈림 표시**(모멘텀×밸류 성향 = 성장/가치/정렬/중립).
> - **다국어 카피 (STEP 546~547)**: 겉면·개념 설명을 **언어별 맵 `lib/lensCopy.ts`**(ko/en)로 분리 — 이름=영문 앵커, 설명은 각 언어답게(직역 아님). 렌즈 함수·API가 `?lang`로 읽음. **TRAI=본체**라 카피 품질이 곧 제품. 원본=`docs/LENS_COPY.md`.
> - **6번째 기법 퀄리티 (STEP 548~549)**: **Quality(GP/A·Novy-Marx) 검증·추가** — 롱숏 t≈2.9·FF3 알파 t≈2.5(시장·규모·가치 넘는 독립 프리미엄)·저회전. ROE는 t=1.0 유의미달(대형주 편중) **제외**. 은행=매출총이익 없어 GP/A "—". 인프라 재사용으로 **2 STEP** 만에 붙음.
> - **제품 정의(포지셔닝) 확정**: "미래 예측 아님 — **검증된 프로 렌즈들이 이 종목을 각각 어떻게 읽는지 + 얼마나 믿을 만한지**를 한자리에, 선택은 사용자. 엇갈림=정보. 개인이 못 하는 걸 대신." (`docs/BUSINESS_STRATEGY.md` 결정 로그)
> - **결정**: 종목 종합 데이터 허브 = **안 만듦**(commodity·해자 아님). 마법공식 = **보류**(EDGAR로 진짜 ROC 못 뽑음→근사·밸류+퀄리티 중복). 대신 "렌즈가 쓴 근거만 얇게" + 넓은 맥락은 TRAI 온디맨드.
> - **진행 순서(3단계)**: ① 정직화(완료) → ② UI 틀(등급·엇갈림·다국어 완료) → ③ 새 기법(**퀄리티 완료** · 다음=주주환원 등 로스터 하나씩 완결). 로스터·로드맵 = `docs/LENS_ROADMAP.md`.
> - **주주환원 탈락 (STEP 551)**: (배당+자사주)/시총 롱숏 총 t0.85·순 t1.09·**FF3 알파 소멸**·βHML0.5+ → 가치 재포장(독립성 없음). 렌즈 미채용, 문서 3종 기록. **탈락도 완결** 후 다음으로.
> - **자산성장 채용 (STEP 553~554)**: (배당·자사주와 달리) βHML0.17로 밸류와 **독립 축**이라 효용 有 → **7번째 렌즈로 채용, 등급은 정직히 "표본 약함"**(t1.6 유의미달). **원칙 확립: 채용=효용(독립성+해석) / 등급=유의성** (겹치면 탈락·독립이면 표본약함으로라도 채용). 라벨=공격적/보통/보수적.
> - **카드 직관화 (STEP 555)**: 제품 핵심 가치 = "숫자 몰라도 각 기법이 이 종목을 어떻게 읽는지"를 전달. 7기법+F-Score에 **판정 문장+쉬운 해석**(`LENS_READINGS` ko/en·상태별) 노출 · **정확한 근거 수치는 그대로 병기**(숫자로 보는 사용자 배려·축소 X) · **"각 기법 시각·예측 아님"은 상단 1회** 공통 전제 · 색조 은근(민트=우호·앰버=주의). 전문가 0.1% 비교 도구 아님 = 직관 전달이 우리 가치.
> - **발생액 탈락 (STEP 557~558)**: (순이익−영업현금)/총자산 저−고 롱숏 **연 −7.62%(방향 역전)**·t−1.36·FF3 알파 음수 → Sloan 이례현상 우리 표본 미재현(1996 후 감쇠). 렌즈 미채용. **강력 후보 소진**(퀄리티·자산성장 채용 / 주주환원·발생액 탈락 / 마법공식 보류) — 무료·소표본 한계.
> - **7렌즈 3중 교차검증 (STEP 559~561)**: 롱숏을 초·중·후반 3구간 나눠 방향 일관성. **모멘텀 [+,+,+] t3.6 · 퀄리티 [+,+,+] t3.2 = 시기 무관 단단(검증 확정)** / 자산성장 [+,+,+] 방향일관·유의미달(표본약함 유지) / 밸류 [+,−,+] 시기의존(가치 부진기 역전) / 저변동 raw 취약(방어는 별도) / 기술 모멘텀 중복. **등급 변경 없음 = 우리 그레이딩이 이미 정직**. 플레이북 #27.
> - **UI 편의성 Phase 2 (STEP 562)**: **한 페이지 유지**(탭 X — 엇갈림이 핵심) · 카드 **압축(판정+등급+근거수치)/누르면 펼침(상세)** · F-Score 동일 · **"기법 성향" 종합줄 제거**(우리가 결론 권유 → 중립화). 모바일 스캔 편의 ↑. 눈검수 통과(접힘·펼침·390px).
> - **카드 패밀리룩 재편 (STEP 564~567)**: 사용자 피드백 반복 수용. **564 시각 계층**(그림자 `shadow-sm`·`rounded-2xl`·원형 화살표 rotate-180·서랍 배경 틴트) · **565 정보 순서**(설명을 이름 밑 서브타이틀로·판정→스펙트럼→근거→단기/장기 순) · **566 메뉴화**(접힘=깔끔한 "기법 메뉴"[이름+배지+설명]·판정 문장은 펼침 안으로 — "판정 죽 늘어놔도 일반인 눈엔 엇갈림 안 잡힌다"에 설득, 내 논리 약함 인정) · **567 3구간 스펙트럼**(`Spectrum{labels,active,tone}` 공통 컴포넌트·활성 구간만 색조[민트/앰버/중립]·7기법+F-Score 패밀리룩·`SPECTRUM_LABELS` ko/en).
> - **"이 기법 방향" 층 (STEP 568)**: 카드가 측정에서 멈추지 않고 **그 기법 '방법대로'의 방향**까지 — [시간축 단기/장기 · 유리/불리/중립 · 정직 꼬리표]. **예측 아님**(역사적 base-rate 경향·보장 아님). 모든 기법이 수익 방향은 아님 — **저변동=위험 관점·F-Score=건전성·기술=상태 축** 유지(억지 "오른다" 금지). `LENS_OUTLOOK` ko/en·`outlookOf()`·스펙트럼 밑 "이 기법 방향" 줄. 눈검수 통과(Technical="단기 상태: 추세 위 — 참고용, 모멘텀 겹침"). 사용자가 따로 분석 안 해도 되게.
> - **제품 청사진 확정 (STEP 568)**: 4층 = **①원자(7 검증 팩터 ✅) → ②방향(기법별 outlook ✅) → ③조합전략**(가치+모멘텀·방어형 퀄리티·QARP=버핏류·피오트로스키 가치·마법공식 보류 — "~류 근사" 정직 꼬리표) **→ ④TRAI**(사실+뉴스 종합 = 의견·맨 마지막). `BUSINESS_STRATEGY` 결정 로그. 정직 원칙: 렌즈=현재 사실·앞은 TRAI(의견) / 안 되는 기법 억지 X / 조합은 "~류 근사" 표기.
> - **▶ 다음**: 세부 문구 다듬기(계속) · **전 종목 하루 1번 미리 계산**(스크리닝 토대) · **검증된 조합 전략**(가치+모멘텀 등 유명 조합·"~류 근사") · 맨 마지막 TRAI. (일본어·중국어 카피=사용자 게이트[완료 선언 전 보류] · 수익화·유료 TRAI 계속 뒤로 · 새 기법 추가는 강력 후보 소진으로 일단락.)
>
> 🟢 **2026-07-02 (직전) · STEP 525~537 완료 (HEAD `5bdf56f`) — 🏁 신뢰도 업그레이드 사이클 종료.** 5렌즈 전부에 논문급 *방법론*(월별 롱숏 **t값·샤프·Fama-French 팩터알파·거래비용**) 적용 → "다 검증"을 정직한 등급으로 재정렬:
> - **모멘텀=검증·유의**(t≈2.5·샤프0.71·비용30bps·FF3 후에도 유의; 방향 견고·수익수준은 과대) · **저변동=위험대비 강**(위험 18%·CAPM/FF3 알파 유의·저회전; 수익 우위 단정X) · **밸류=정설이나 표본 약함**(βHML0.71 재현·우리 표본 월별 t<2·최근 가치 부진) · **F-Score=수익 신호 아님**(12코호트 t0.70·FF3α0.28; 건전성 해석만) · **기술=참고용·비독립**(RSI 침체매수 유의 손실 CAPMα t−2.0·200일선은 모멘텀 흡수).
> - **핵심 메타교훈**: ①**유의≠수익수준** — 생존편향·동일가중으로 수익 '수준'은 과대(FF4/FF3 알파 미소멸=편향 신호), 방향·유의만 신뢰. ②**소표본 유의는 노이즈** — F-Score t2.24(5코호트)가 데이터 보강(12코호트) 후 t0.70으로 붕괴(데이터-우선이 가짜 유의 차단). ③**렌즈마다 성공지표 다름**(모멘텀=raw유의/저변동=위험조정알파/밸류=팩터정체성). ④**생존편향=무료데이터 벽**(방법론은 논문급, CRSP급 데이터는 아님·항상 명시).
> - **신규 자산**: `lib/backtest_stats.ts`(t·샤프·Newey-West·OLS알파), `scripts/backtest_{momentum_alpha,lowvol_rigor,value_rigor,fscore_rigor,technical_rigor}.ts`, Ken French 무료 팩터(`data/ff`·gitignore), 플레이북 **#18~22**. 커밋 STEP 525~537.
> - **원칙 유지**: 예측 아닌 정직한 방향성. 수익화·유료 AI보기(STEP 511 보류)·표시 UX는 계속 뒤로.
> - **▶ 다음 후보**: (a) KR/글로벌 렌즈 확장 · (b) 새 기법(퀄리티·마법공식) · (c·선택) 생존편향 없는 데이터로 승격(유료 CRSP or 재구성).
>
> 🟢 **2026-07-02 (직전·무료 렌즈 완결) · STEP 510~523 (HEAD `64a5d9a`) — 무료 AI 렌즈층 5종 판정 완결.** 기법을 "정의→데이터→엣지→백테스트→표현" 5단계로 **하나씩 완전히** 검증(투자가능 **$5+** 유니버스 기준):
> - **모멘텀(12-1) ✅검증** +2.4%p/년($5+·페니 포함 시 역전) · **저변동성 ✅검증** 저−고 +7.4%/년·위험 25%($5+) · **F-Score ✅검증** 재무 건전성 해석(수익예측 무의미·넓은표본 spread −36%) · **밸류(E/P) ✅검증** 싼−비쌈 +10.2%p/년(13중 11코호트)·B/M +5.5% 조건부 · **기술(RSI·MA) ⚪참고용** RSI 평균회귀 기각(과열이 오히려 우위=모멘텀 압도)·200일선 약한 +3%/년.
> - **핵심 메타교훈**: "**유니버스가 결과를 지배**"(같은 기법도 페니 포함/대형주/투자가능에 따라 부호 뒤집힘 → $5+ 투자가능 유니버스 명시 필수) · "**같은 데이터·다른 시각**"(밸류는 F-Score와 달리 은행 포함 유효 / RSI를 평균회귀로 보면 기각이나 원인은 모멘텀 검증과 일치).
> - **신규/변경**: `lib/edgar.ts`(+자기자본), `lib/technical.ts`(RSI·MA 공유엔진·렌즈=백테스트 일치), `lib/lenses.ts`(5렌즈 정직 note), `scripts/backtest_{momentum,lowvol,edgar,value,technical}.ts`, 살아있는 문서 `docs/LENS_DEV_PLAYBOOK.md`(#1~17)·`docs/LENS_STRENGTH_MAP.md`. 커밋 STEP 508~523.
> - **원칙 유지**: 예측 아닌 정직한 방향성(나침반). **수익화·유료 AI보기(STEP 511·보류)·표시 UX = 전 기법 검증 후로 미룸**(사용자 지침).
> - **▶ 다음 후보**: (a) **KR/글로벌 렌즈 확장**(가격기반 모멘텀·저변동·기술=즉시, 재무기반 F·밸류=DART 필요) · (b) **새 기법**(퀄리티 ROE·마진, 마법공식 등 — 플레이북 틀 반복). (수익화·UX는 뒤로.)
>
> 🟢 **2026-07-02 (직전) · STEP 508~509 완료 (HEAD `59cb0c1`, push ✓)** — 모멘텀 1사이클: 12-1 백테스트(**프리미엄 +4.1%/년**, n=3,670) + 렌즈 canonical 정리. "정의→검증→표현" 방법론 2기법 확립.
>
> 🟢 **2026-07-02 · STEP 500~507 완료 (HEAD `cc3dc99`, push ✓)** — F-Score 1사이클 완주. `lib/fscore.ts`(9기준) + `lib/edgar.ts`(EDGAR 어댑터) + EDGAR 다년 백테스트(2014~2023 10코호트 76종목). 결론: 대형주에서 점수↔수익 불분명, 카드 정직 문구 확정. ▶ **다음 = 모멘텀 렌즈 or US 링크 풀충전 or Phase 2 결제 PG.**
>
> 🟢 **2026-07-02 · STEP 494~499 완료 (HEAD `628b14d`, push ✓)** — JP/CN 이름 우선·로고 자동수집 + KR 모바일 글자 수정 + **결정론 렌즈 엔진**(`/api/lens`) + **렌즈 페이지** `/stock/[symbol]` + **AI보기 진입 버튼**(4개 보드). KR 6자리→`.KS`/`.KQ` 자동해석. ▶ **다음 = 재무 렌즈(F-Score·Z) · 유료 AI보기(LLM) · US 링크 풀충전 · Phase 2 결제 PG.**
>
> 🟢 **2026-07-01 · STEP 479~484 완료 (HEAD `44e0aac`, push ✓) — 일본 탭 완성(JpMarketBoard·jp_stock_perf 72행 시딩·Google News 일본·닛케이225+USD/JPY 마키·도메인 로고 73) + 레버리지 배지 오탐 수정(`\b` 단어경계). ▶ 다음 = prod 라이브 검증(일본 탭·배지) → 중국/홍콩 or 인도 탭 or Phase 2 결제 PG — 최신은 이 배너.**
>
> 🟢 **2026-07-01 · STEP 473~478 완료 (HEAD `8795c1b`, 배포 ✓) — US 피드 파리티(뉴스 이미지+모아보기 4탭) + KR 종목 딜레이 제거(크론 스냅샷 `kr_stock_snapshot` 2,769행 시딩→로딩 즉시) + KR/US 모바일 개편(카드형+바텀시트 스냅+PC식 정렬) + US 링크 67→139. (직전 배너)**
>
> 🟢 **2026-06-30 · 광고 슬롯 맨위 제거 + 헤더 코인 팝오버 + 탭 5묶음 재정렬·구분선 (STEP 469~472, HEAD `b741ead`, 배포 ✓ onetrillion.app).**
> **한 줄: 전 리스트 맨 위 광고 제거(10개 이후만) + 헤더 코인 탭 클릭 시 팝오버(준비중 뱃지 제거) + 탭 5묶음 재정렬·거래소→거래소·기관·세로 구분선.**
> - **🆕 최신 STEP = 472. HEAD = `b741ead`. 배포 = `onetrillion.app` 라이브**(STEP 422~472 전부 push·배포 완료, origin/main 최신). DB = "Trillion" `ccbwxcszdoyjxvckedfp`.
> - **STEP 469 — 광고 슬롯 맨위 제거**: `AdvisorDirectory`·`BrokerRanking`·피드/일반 링크 탭 맨 위 광고 제거 → **10개마다(이후부터)** 통일. `i > 0 &&` 가드 / `BROKERS.map()` 앞 `<AdSlotRow>` 제거.
> - **STEP 471 — 헤더 코인 팝오버**: 항상 뜨던 "준비중" 뱃지 제거 → 코인 클릭 시만 "준비 중이에요" 팝오버. `coinOpen` state + `coinRef` + outside-click handler → `Header.tsx`. (STEP 470은 471로 대체됨.)
> - **STEP 472 — 탭 5묶음 재정렬 + 구분선**: `TAB_ORDER`에서 `exchange`를 `community` 앞으로. `CLUSTER_START = new Set(['news', 'etf', 'exchange', 'community'])`. 탭바에 `Fragment`+`<span aria-hidden ...>` 묶음 구분선(뉴스·ETF·거래소·기관·커뮤니티 앞). `app/page.tsx` `거래소`→`거래소·기관`.
> - **🔗 링크 허브 풀충전 (MCP 직접 — git/마이그레이션 아님!)**: KR `link_hub` **73→138개**(전 10개 카테고리 2배+, 빈 탭 다 채움·도메인 웹검색 검증). ⚠️ **DB 직접 입력이라 코드/마이그레이션엔 없음.** **US는 67개(아직 미충전 → 다음 작업).** 원칙="추리지 말고 다 넣는다(허브=수집)".
> - **📱 모바일 패스 완료**: Chrome MCP 라이브 점검(종목·푸터·피드·리딩방·링크) 깨짐 없음 → AI·광고 빼면 **KR 탭 베타 출시 가능 수준**.
> - **▶ 다음**: ① **US 링크 풀충전**(KR 수준 138개로) · ② Phase 2 결제 PG + 빌링 테이블(도메스틱 PG/글로벌 MoR) + 본인인증 · ③ Trillion AI 전망(Phase 5). (모바일 패스=완료.) ※ 결제 UI는 stub, 기능은 Phase 2a.
>
> ⬇️ **(아래 🟢 STEP 466~468 배너는 직전 세션 상태.)**

> 🟢 **2026-06-30 · 종목·상품 수익률 패노라마 + 전 리스트 10개마다 광고 문의 (STEP 466~468, HEAD `205c8ef`, 배포 ✓ onetrillion.app) — 직전 세션 상태.**
> **한 줄: 종목·상품 표(KR/US) 데스크탑 행 클릭 → 1일~1년 수익률 가로 패노라마(모바일은 하단 시트) + 표 10행마다 광고 문의 행. 유튜브·피드·커뮤니티·거래소 리스트에도 광고 문의 슬롯 + 새 'feed'(콘텐츠 피드) 슬롯 신설.**
> - **🆕 최신 STEP = 468. HEAD = `205c8ef`. 배포 = `onetrillion.app` 라이브**(STEP 422~468 전부 push·배포 완료, origin/main 최신). DB = "Trillion" `ccbwxcszdoyjxvckedfp`.
> - **STEP 466·467 — 수익률 패노라마 + 표 광고**: KR·US 종목·상품 표 데스크탑 행 클릭 → 1일~1년 수익률 가로 펼침(아코디언·재클릭 닫힘·`hidden lg:table-row`·`Fragment`), 모바일은 기존 하단 시트. 표 10행마다 `AdSlotRow slot="broker"`(페이지 마지막 행 뒤 생략).
> - **STEP 468 — 다른 탭 광고 + 'feed' 슬롯**: 유튜브 10개마다 / 피드 링크·커뮤니티·거래소 맨 위+10개마다. 새 `feed`(콘텐츠 피드) 슬롯 — `AdSlotRow` 타입·`AdInquiryForm` 옵션·`/advertise` 카드 3번째·URL 화이트리스트.
> - **라이브 검증(Chrome MCP)**: KR 효성중공업 `+267.45%`·US BRK-A 패노라마, 표 10행마다 광고 4개/페이지, 유튜브 10~90위(100 뒤 생략)·뉴스 맨 위 광고 — 정상.
> - **▶ 다음**: ① 모바일 패스(리딩방·검증/business/advertise 눈으로) · ② Phase 2 결제 PG + 빌링 테이블(도메스틱 PG/글로벌 MoR) + 본인인증 · ③ Trillion AI 전망(Phase 5). ※ 결제 UI는 stub, 기능은 Phase 2a.
>
> ⬇️ **(아래 🟢 STEP 462~465 배너는 직전 세션 상태.)**

> 🟢 **2026-06-30 · 약관 정비·빈 상태 CTA·관리자 UX·모바일 서브탭 (STEP 462~465, 배포 ✓ onetrillion.app) — 직전 세션 상태.**
> **한 줄: 구 자가등록 잔재 완전 삭제 + 약관 문구 정정, verified view 빈 상태 온보딩 CTA, /admin FSS 조회 상시화·탭 3개 정리, FEED_TABS 모바일 서브탭 [링크 | 모아보기] 추가(데스크탑 2단 그대로).**
> - **🆕 최신 STEP = 465. 배포 = `onetrillion.app` 라이브** (STEP 422~465 전부 push·배포 완료, origin/main 최신). 매 묶음 `git push` 시 Vercel 자동 빌드. DB = "Trillion" `ccbwxcszdoyjxvckedfp`.
> - **STEP 462 — 약관 정비 + 고아 파일 삭제**: 약관/개인정보 "자가등록"→"업체 인증(게재)" 정정. 구 자가등록 플로우 파일 4개 완전 삭제(RoomSubmitModal·rooms/submit·AdminSubmissions·admin/submissions).
> - **STEP 463 — verified view 온보딩 CTA**: 인증 리딩방 탭 빈 상태 → "무료로 게재" 온보딩 카드 + "지금 등록하기" → /business.
> - **STEP 464 — /admin 레이아웃 정리**: 금감원 조회를 탭 밖 상시 검색으로(제목 아래). 처리 큐 탭 3개[클레임·신고·광고 문의] — 금감원 탭 제거 + 부제목 제거.
> - **STEP 465 — FEED_TABS 모바일 서브탭**: 뉴스·공시·거시·분석·리포트·ETF·공모주 7개 탭에 `lg:hidden` 서브탭 [링크 | {FEED_SUB_LABEL}] 추가. 탭 전환 시 '링크' 자동 리셋.
> - **▶ 다음**: ① **모바일 패스 마저**(리딩방·검증/business/advertise) + onetrillion.app 462~465 반영 검증 · ② **Phase 2 결제 PG + 빌링 테이블(provider 무관: 도메스틱 PG/글로벌 MoR) + 본인인증** · ③ Trillion AI 전망(Phase 5). ※ 토스페이먼츠 빌링 가입 = 가입비 22만+연관리비 11만(나중에 결제), 결제 UI는 stub로 먼저.
>
> ⬇️ **(아래 🟢 STEP 456~461 배너는 직전 세션 상태.)**

> 🟢 **2026-06-30 · 광고·채널 수익 인프라(무료 티어) + /advertise 문의 + /admin 탭·게이트 (STEP 456~461, 로컬 HEAD `687263d`) — 직전 작업 상태.**
> **한 줄: 리딩방·검증을 '채널 단위 게재' 모델로 완성한 세션 — 인증 리딩방=채널 단위(무료 1채널 + 추가 ₩5만/월, 독립 행), /advertise 공개 문의 페이지, /admin 탭형+전용 로그인 게이트, 결제·빌링 레일(리딩방+AI 구독 공용)을 ROADMAP §3에 확정. 무료 티어는 풀로 작동, 결제 PG만 Phase 2.**
> - **🆕 최신 STEP = 461. 로컬 HEAD = `687263d`.**
> - **채널 단위 디렉토리(STEP 456·459)**: 리딩방·검증 = 3뷰 탭 [금감원 등록업체 | 인증 리딩방 | 관심도순](각 ↕). **채널명 = 운영자 '인증'한 곳만**(✓UserCheck 뱃지). **인증 리딩방 뷰 = 채널 단위** — 활성 `business_links` 1개 = 독립 행(같은 업체명·다른 채널명, **교차연결 안 함** = 독립이 추가 결제 동기). `expires_at` 만료 필터(미결제→자동 비공개 절반 이미 구현). `api/advisors` verified 브랜치 채널 단위 + `AdvisorDirectory` `channel_*`·`rowKey`.
> - **/advertise 광고 문의(STEP 457·460)**: 공개 페이지(2단: 슬롯[증권사/리딩방]+§3 정책 / 문의 폼) → `ad_inquiries` 저장(테이블 MCP 생성, RLS 서비스롤). 폼=이메일+전화 **둘 다 필수**. 광고 슬롯(증권사 `BrokerRanking`·리딩방 `AdvisorDirectory`)을 가짜 광고주 → **"광고 문의하기" CTA**(`AdSlotRow` /advertise?slot=) 맨위+10개마다. 진입점=슬롯·헤더 드롭다운·푸터.
> - **/admin 탭형 + 게이트(STEP 458)**: `/admin`=탭 [업체 클레임 | 신고 | 광고 문의 | 금감원 조회](`AdminTabs`). 광고 문의 탭(`AdminAdInquiries`)=접수 목록+상태(신규/연락함/종료), **"연락함" 클릭=위치별 템플릿 mailto**(`api/admin/ad-inquiries` PATCH). **`/admin/login` 전용 게이트**(구글→`?next=/admin`→role 체크) + 헤더 드롭다운 관리자 제거 + 푸터 © 작은 관리자 링크.
> - **운영자 채널 UI(STEP 461)**: `/business` > 내 업체 관리 = **"게재 채널"** 섹션(링크→채널 용어), 채널명 우선 입력, 무료 1채널 + 추가="채널당 월 5만원·결제하면 자동 게재/미결제 자동 비공개"(Phase 2 stub). 유료 뱃지 '광고'→'유료'(추가 채널=게재지 광고 아님).
> - **🗺️ ROADMAP §3 추가 — 게재 가격 모델 + 결제·빌링 레일**: 신고·인증=무료, **게재(노출)만 유료**. 무료 1채널/추가 ₩5만·**채널 단위**. **결제=공용 빌링 레일**(리딩방 게재 + **AI 구독** 공용, "한 번 만들어 두 번 씀"). 빌링키 정기결제→성공 webhook=`expires_at` 연장/active, 실패=자동 비공개. PG 후보 토스페이먼츠 빌링·포트원. ⚠️ **PG 키는 사용자(.env), 수취 전 법률자문+통신판매업 신고+정기결제 약관+환불·세금.** 단계: 지금 무료 / Phase 2 PG / Phase 5 AI 구독.
> - **DB(MCP·git 아님)**: **`ad_inquiries` 테이블 신규**(id·slot·company·contact·email·phone·message·status·created_by, RLS 서비스롤). **테스트 데이터 전부 정리**(business_members/links/claims·ad_inquiries=0; link_previews 999·fss_advisors 1804 실데이터 유지). soulmaten7 role=admin.
> - **▶ 다음 후보**: ① **배포(`git push` 422~461) + onetrillion.app 검증**(/advertise·3탭·/admin·/admin/login) + fss-advisors 크론 확인 · ② **Phase 2 결제 PG + 빌링 테이블 + 본인인증**(리딩방 추가 채널 유료 활성화 → AI 구독 공용 레일) · ③ 옛 자가등록 죽은코드 정리 · ④ Trillion AI 전망(Phase 5).
>
> ⬇️ **(아래 🟢 STEP 422~455 배너는 직전 작업 상태.)**

> 🟢 **2026-06-28 · 리딩방·검증 MVP 2.0 + 관리자·운영자 동선 정리 (STEP 422~455, HEAD `9d34b3f`) — 직전 작업 상태.**
> **한 줄: 리딩방·검증 탭을 '업체 클레임·인증·광고' 시스템 + OG 링크 프리뷰 + 표형 디렉토리로 완성하고, ROADMAP §3에 게재·광고 정책을 확정한 세션. 금감원 유사투자자문 신고 데이터를 주체로, 인증한 업체가 채널 링크를 관리(1무료+추가유료), 광고는 노출(순위)만 판다. + 토론 제거·카카오 제거·수익≠retention 정리.**
> - **🆕 최신 STEP = 455. HEAD = `9d34b3f`** (push 완료 → 배포 반영 확인 필요. 직전 라이브 = `fac8fb1`/421). 주요 커밋: 클레임빌드~448(`6596ccb`) → 관리자(`dfcfe41`/449)·하이픈(`acdd27e`/450) → 운영자 동선 451~455(`9d34b3f`). DB = NEW "Trillion" `ccbwxcszdoyjxvckedfp`.
> - **🗺️ ROADMAP §3 정책 확정(단일 기준)**: 게재 = **금감원 유사투자자문 신고된 곳만**(미신고=게재 X, 검색 경고+신고만). 라벨 = **"유사투자자문 신고"**(등록 아님 — 신고제, 금융투자업 아님). **3층 뱃지**: ① 유사투자자문 신고(규제 사실·자동·무료) ② 운영자 인증(클레임+국세청 진위확인·무료) ③ 광고(신고+인증한 곳만·유료). **원칙: 사실은 안 판다(무료·자동), 파는 건 노출(순위)뿐**(X 블루체크 반면교사). "신고=입장권" 플라이휠(미신고는 금감원 신고부터→fss 갱신→클레임). 광고=순위 부스트일 뿐(배너 X)+매체 가드레일 3개(콘텐츠 가이드·신고 임계치 제한·"광고" 라벨). ⚠️ 광고비 수취 전 법률자문 필수.
> - **업체 클레임·인증 파이프라인(STEP 430~441)**: `/business` 검색→**국세청 진위확인**(`lib/nts.ts`, data.go.kr)→서류 업로드(`business-docs` 버킷)→관리자 검토(`/admin`)→운영자 인증→마이페이지 **'내 업체'**(검증사실 미리보기·소개·무료링크1+추가유료스텁·관리자공유 1명)→디렉토리 노출. DB `business_members/claims/links/listing`(+RLS). 라벨 "유사투자자문 신고"+"운영자 인증" 뱃지(441).
> - **디렉토리 폴리시(STEP 442~448)**: 플랫폼 탭 제거(전부 한 번에) · **리스트 표화**(`#·등록업체명·채널명` 컬럼 헤더 클릭 정렬, 행은 ⭐만) · **OG 링크 프리뷰**(카톡식 카드) = `lib/og.ts`(fetchOg+EUC-KR 디코딩)+`/api/link-preview`(lazy 캐시)+`/api/admin/crawl-previews`(dev 배치 전체 1회 크롤)+`link_previews` 테이블 · **채널명 = info_name 없으면 OG 제목 폴백** · 미리보기 재배치(헤더=업체명, 채널명+신고 한 줄, 플랫폼 아이콘=채널명 앞, OG 카드+연결링크 바로가기).
> - **관리자·운영자 동선(STEP 449~455)**: 관리자 페이지 — **🔎 금감원 조회 검색박스**(사업자번호→`fss_advisors`) + 클레임 심사에 **대표·개업일·진위확인(✓/✗) 컬럼**(449) · 사업자번호·연락처 **하이픈 표시 통일**(`lib/utils/format.ts` `formatBizNo`·`formatPhone`, 450) · **운영자 동선 통합** = `/business`를 **"리딩방 등록·관리" 허브**(`BusinessHub` 탭 [업체 인증 | 내 업체 관리]·스마트 기본탭) + **마이페이지 '내 업체' 탭 제거** + 디렉토리 버튼 "리딩방 등록·관리"(451~455). 네비=리딩방 / 뱃지·내용=정확한 용어 원칙 유지.
> - **기타 결정(STEP 422~429)**: 모바일 시트 UX · 토론 전면 제거 · 카카오 로그인 제거(구글만) · 수익≠retention(광고=생존/AI=프리미엄) · 종목 상세=Trillion AI 자리(비워둠) · 증권사 광고 슬롯·유튜브 채널 소개 한 줄·리딩방 인피드 광고(테스트 프리뷰).
> - **DB(MCP·git 아님)**: business_* 4테이블+RLS, `business-docs` 버킷, `link_previews` 테이블(OG 캐시), soulmaten7 role=admin. **배포 전 테스트 클레임 데이터 전부 삭제**(business_links/members/claims=0, link_previews 실 OG 유지).
> - **▶ 다음 후보**: ① **배포(422~455 반영) + `fss-advisors` 크론 실작동 확인**(CRON_SECRET·Vercel 로그 — 디스클레이머 "매일 갱신" 근거) · ② 결제 PG + 본인인증(Phase 2 후반, 광고 상위노출 활성화) · ③ 옛 자가등록 죽은코드 정리(`RoomSubmitModal`·`room_submissions`·`/api/rooms/submit` 등 orphan) · ④ 금융투자업 등급 지도 확장(투자자문사 탭) · ⑤ (최종) Trillion AI 전망.
>
> ⬇️ **(아래 🟢 STEP 421 배너는 직전 작업 상태.)**

> 🟢 **2026-06-27 · US 시장 완전체(거시·뉴스·공시 4기둥) STEP 413~421 + 종목표 정렬 재설계 + 모바일 폴리시 (HEAD `fac8fb1`) — 배포 ✓ onetrillion.app 라이브 — 직전 작업 상태.**
> **한 줄: 미국 시장을 종목·상품에 이어 거시(FRED)·뉴스(Yahoo)·공시(SEC EDGAR)까지 확장해 KR과 동등한 4기둥으로 완성한 세션 — 피드 국가맵 리팩터+거시 US→US 뉴스(Yahoo RSS)→US 공시(SEC EDGAR 8-K, DART의 미국 짝)→종목표 정렬 전면 재설계(헤더 클릭·▲/▼)→모바일 폴리시(증권사 중복 제거·우측정렬·종목 시트 수익률)→기간 커스텀 드롭다운·"전" 라벨. onetrillion.app 라이브.**
> - **🆕 배포 = `https://onetrillion.app` 라이브**(STEP 413~421 + 세션 문서). 이전 `stock-terminal-delta.vercel.app`도 유효.
> - **🆕 DB = NEW 전용 프로젝트 `ccbwxcszdoyjxvckedfp`("Trillion", ap-northeast-2 서울).** `us_stock_perf`(symbol/r1w/r1m/r3m/r6m, RLS public read — 상위 200 데모 적재, 전 종목은 **prod 크론 매일 22시 UTC** 자동; 라이브 후 첫 실행 시 1주~6개월 전부 채워짐). KR `link_hub` 71 큐레이션. (구 `qxkmwlkchyxfzxbonhtj`/"OT-Marketing"=폐기 예정. POTAL ref `zyurflkhiregundhisky`는 여전히 절대 금지.)
> - **🆕 최신 STEP = 421.** 커밋: STEP 413~421 + 문서 = **`fac8fb1`** → onetrillion.app 반영 완료.
> - **US 시장 완전체 — 거시·뉴스·공시 4기둥(413~415)**: **413** 피드 국가맵 리팩터 — `components/toolbox/ToolboxClient.tsx`의 단일 `country==='KR'` 가드를 **`FEED_COUNTRY_SUPPORT` 맵**으로 교체 + **거시(macro) US 노출**(FRED 데이터 이미 완성, 가드만 풀림) + `MacroFeed` `defaultView` prop / **414** US 뉴스 피드 — `/api/news/feed?market=US` = Yahoo `^GSPC` RSS(키리스 실시간 증시 헤드라인) 정규식 파싱 + `NewsFeed` `country` prop / **415 (flagship)** US 공시 피드 — `/api/sec/feed`(SEC EDGAR `getcurrent` 8-K Atom, UA=`SEC_USER_AGENT`) + 새 `components/toolbox/SecFeed.tsx`(DartFeed 미러) + disclosure US 개방 = **DART의 미국 짝**. → **US = 종목·상품(전종목+ETF) + 거시(FRED) + 뉴스(Yahoo) + 공시(SEC EDGAR) 4기둥. KR↔US UI 통일.**
> - **종목표 정렬 재설계(417, KR·US 동일)**: 종목명(가나다/알파벳)·현재가·기간 **헤더 클릭 정렬 + ▲/▼ 항상 표시**, **기본 현재가↓**(탭 전환 시 리셋), `#`=번호만(클릭 X), **거래대금 정렬 제거**. (416 모바일 US 종목명 셀 `truncate` 클램프 선행 — 긴 이름 오버플로 방지.)
> - **모바일 폴리시(419·420·421)**: **419** ① 표 아래 **증권사 중복 제거**(클릭 시트에만) ② `ListRow` ⭐·바로가기 **우측정렬**(전 링크탭 적용) ③ **종목 클릭 시트에 현재가 + 1일~1년 수익률** 추가 / **420** 기간 선택 **커스텀 드롭다운**(네이티브 `<select>` 교체 — 모바일 일관 렌더·작은 인라인·바깥클릭 닫힘) / **421** 기간 라벨 **"전" 표기**(1일전·1주일전·1개월전·3개월전·6개월전·1년전, PERIODS 배열+시트 하드코딩 둘 다) + 드롭다운 **버튼·목록 폭 일치**.
> - **정리(418)**: 죽은 라우트 삭제 — `app/api/yahoo/us-quote`·`us-performance`(호출처 0, -368줄). ⚠️ 옛 `/api/sec`는 `lib/api/sec.ts`가 써서 **유지**(SEC 신규 라우트는 `/api/sec/feed`).
> - **🔵 결정**: 거래소 분리(코스피/코스닥, NYSE/나스닥) **안 함** — 검색·정렬로 충분 + US는 데이터 태그 없음 → 주식 탭 통합 유지.
> - ⚠️ **US 1주~6개월 전 종목**은 prod 크론 첫 실행(22시 UTC) 후 완성(현재 상위 200 데모만). **KR 데이터값 이상(개발환경 페니주·고가)** — 라이브 실데이터 확인 권장.
> - **▶ 다음 후보**: ① **평가 디렉토리(MVP 2.0 차별화 축) 심화** · ② **US 1주~6개월 전종목 크론 라이브 채워졌는지 확인** · ③ 추가 모바일 폴리시(실폰 발견 시) · ④ 리포트·실적·ETF·공모주·배당 US 피드 = 보류(키리스 한계/데이터) · ⑤ (최종) Trillion AI 분석 전망 레이어(`docs/BUSINESS_STRATEGY.md` §3).
>
> ⬇️ **(아래 🟢 STEP 412 배너는 직전 작업 상태.)**

> 🟢 **2026-06-26 · US 종목 탭 KR-parity STEP 405~412 + KR 링크허브 71 + AI 로드맵 (HEAD `9984804`) — 배포 ✓ onetrillion.app 라이브 — 직전 작업 상태.**
> **한 줄: 미국 시장을 KR과 동등한 종목 탭으로 끌어올린 세션 — US 종목 탭 신설→KR 구조 통일→ETF→전종목 lazy→종목표 UI 리파인→US 기간 백그라운드 미리계산(크론+DB)→헤더 언어 선택기. + KR 링크허브 65→71 재점검 + Trillion AI 분석 전망 레이어 전략 기록. onetrillion.app 라이브.**
> - **🆕 배포 = `https://onetrillion.app` 라이브**(이번 세션 첫 배포 — STEP 404~412 + 세션 문서). 이전 `stock-terminal-delta.vercel.app`도 유효.
> - **🆕 DB = NEW 전용 프로젝트 `ccbwxcszdoyjxvckedfp`("Trillion", ap-northeast-2 서울).** **신규 테이블 `us_stock_perf`**(symbol/r1w/r1m/r3m/r6m, RLS public read — 상위 200 데모 적재, 전 종목은 prod 크론 22시 UTC 자동). KR `link_hub` **71 큐레이션**. (구 `qxkmwlkchyxfzxbonhtj`/"OT-Marketing"=폐기 예정. POTAL ref `zyurflkhiregundhisky`는 여전히 절대 금지.)
> - **🆕 최신 STEP = 412.** 커밋: STEP 405~412 + 문서 = **`9984804`** → onetrillion.app 반영 완료.
> - **US 종목 탭 KR-parity(405~412)**: **405** US 종목 탭 신설 — `app/api/yahoo/us-performance`(193 유니버스) + 새 `components/toolbox/UsMarketBoard.tsx` + `ToolboxClient` US 종목·상품 탭 / **406** US 표를 KR 구조로 통일(하위탭 주식/ETF/ETN/리츠 + 기간 드롭다운 + 증권사 사이드바, `BrokerRanking` 미러) / **407** US ETF 데이터(73, `app/api/yahoo/us-etf-performance`) + 하위탭을 미국 기준 **`주식 | ETF`**로 정리(ETN·리츠 제거 — 미국 시장 특성) / **408** US 주식 **전종목 lazy** — `data/us_symbols.json`(6,936=주식6,121+ETF815, NYSE/나스닥/AMEX 공식 심볼) + `app/api/yahoo/us-list`(전 종목 batch quote, 거래대금순) + `app/api/yahoo/us-quote`(기간 lazy) / **409** KR 표 데스크탑도 기간 드롭다운 통일(`MarketBoard.tsx`, KR↔US 동일 — 모바일은 이미 드롭다운) / **410** 종목표 UI 리파인 — `lib/currency.ts`(통화 현지화 KR 원/US $)·드롭다운 1일부터(고정 1일 컬럼 흡수)·드롭다운 선택 시 자동 정렬·정렬 화살표 lucide 18px·컬럼 간격·로고 키움·증권사 리스트 높이 정렬(KR·US 양쪽) / **411 US 기간 백그라운드 미리계산(option C)** — `us_stock_perf` 테이블 + `lib/usPerf.ts`(전 종목 chart→메모리계산→일괄 upsert) + `app/api/cron/us-perf`(매일 22시 UTC, `vercel.json` 등록, CRON_SECRET, maxDuration 300) + us-list에 **1년**(quote `fiftyTwoWeekChangePercent` 무료)+DB 조인 + UsMarketBoard **lazy 제거→전 기간 정렬**+화살표. **핵심: 1일·1년·거래대금=quote 즉시, 1주~6개월=크론 DB.** / **412** 헤더를 **언어 선택기**로(시장과 분리) — `Header.tsx` useCountryStore 제거, 한국어🇰🇷/English🇺🇸(준비중). 시장은 페이지 한국/미국 토글이 담당.
> - **데이터/전략(MCP·git 아님)**: **KR 링크허브 재점검** 65→71(FIX 연합인포맥스→einfomax.co.kr·KRX 정보데이터시스템 http→https, 소프트삭제 클리앙·Investing.com 포럼, ADD 8 한국IR협의회·KOFIA·코스닥협회·IRGO·증권플러스비상장·KCIF·KIEP·토스증권피드, display_order 재정렬, `docs/KR_LINK_HUB_CURATION.md`) · `us_stock_perf` 상위 200 데모 적재 · **Trillion AI 분석 — 최종 단계 로드맵(전망 레이어)** `docs/BUSINESS_STRATEGY.md` §3 추가 — 2층 구조(현 핵심=정리/무신고, 최종=전망 유료 구독), 검증 기법 skill화→구독, 매수추천 X·전망 O, 기법 국가불문→데이터 기반=해자, **유사투자자문업 신고**(자본시장법) 추후·각국 규제 상이·법률자문 필수, 투명성(신고·방법론·트랙레코드)=차별점, 우선순위는 데이터+MVP 먼저(참조 AI Berkshire, MIT).
> - ⚠️ **US 1주~6개월 전 종목**은 prod 크론 첫 실행(22시 UTC) 후 완성(현재 상위 200 데모만). **KR 데이터값 이상(개발환경)** — 라이브 실데이터 확인 권장.
> - **▶ 다음 후보**: ① **평가 디렉토리(MVP 2.0 차별화 축) 심화** · ② US 정렬 토글 KR-parity(화살표 일관) · ③ KR 데이터값 라이브 검증 · ④ US ETF/기타상품 확장·증권사 US 연결·다른 시장(일본 등) · ⑤ (최종) Trillion AI 분석 전망 레이어(`docs/BUSINESS_STRATEGY.md` §3).
>
> ⬇️ **(아래 🟢 STEP 402 배너는 직전 작업 상태.)**

> 🟢 **2026-06-25 · 완성도 패스 STEP 395~402 + 데이터/인프라 (HEAD `52ebd5f`) — 배포 ✓ onetrillion.app 라이브 — 직전 작업 상태.**
> **한 줄: 흩어진 디테일을 메우는 완성도 패스 8개 STEP(전종목 수익률·country-aware·신선도 가드·P2 묶음) + 배당 복원 + US 링크허브 + 인프라(Supabase 전용 이전·도메인 연결). onetrillion.app 라이브.**
> - **🆕 배포 = `https://onetrillion.app` 라이브** (도메인 연결 완료 — DNS 라이브, 이메일 MX 보존, SSL 자동). 이전 `stock-terminal-delta.vercel.app`도 유효.
> - **🆕 DB = NEW 전용 프로젝트 `ccbwxcszdoyjxvckedfp`("Trillion", ap-northeast-2 서울).** (구 `qxkmwlkchyxfzxbonhtj`/"OT-Marketing"=폐기 예정. POTAL ref `zyurflkhiregundhisky`는 여전히 절대 금지.)
> - **🆕 최신 STEP = 402.** 커밋: STEP 395~401 = `e21f2cc`, STEP 397~402 최종 = **`52ebd5f`** → onetrillion.app 반영 완료.
> - **완성도 패스(395~402)**: **395 KR 전종목 기간 수익률** — 신규 `app/api/krx/kr-performance/route.ts`(KRX `bydd_trd` 기준일 + 5개 과거날짜 오프셋 7/30/91/182/365일, 휴장일 백워크), `MarketBoard`가 symbol로 r1w~r1y 병합 → **커버 종목 46 → 2,768**(긴 기간 "—" 대폭 해소) / **396 country-aware 탭**(`ToolboxClient` US 선택 시 KR 전용 탭[종목·상품/유튜브/리딩방·검증] 숨김) / **397(P0)** privacy 대표·연락처(장은태 / contact@onetrillion.app)·about 한자 雲從 제거·Header 코인 메뉴 제거(주식만) / **398 no-op(false positive)** — Next 16은 `middleware.ts` 대신 `proxy.ts`를 쓰고 세션 갱신 이미 동작 중(교훈: audit 발견은 코드로 검증 후 STEP화) / **399** 거시경제 "YYYY.MM 기준" 표시(`MacroFeed` `fmtDate`, 신선도 신뢰) / **400** 유튜브 주간 갱신 수집<30이면 throw+기존 보존(`lib/youtube.ts`, 빈 테이블 사고 방지) / **401** 공모주 피드 빈결과·에러 5분 캐시(`app/api/ipo/feed`) / **402(P2 묶음)** 푸터 "주식·상품"(`/`) 링크·마이페이지 닉네임 저장 인라인 피드백·`RoomFavoritesClient` 비로그인 카드 분기 통일.
> - **데이터/인프라(MCP·git 아님)**: **배당 복원** NEW `dividends` 0건 → OLD(`qxkmwlkchyxfzxbonhtj`)에서 top-60 고배당+참조 27종목 복사(공유 DB라 즉시 반영, JB금융지주 9.9%·HD현대 9.61%, `exDate` NULL→"—") · **US 링크허브** 67개/10카테고리(`docs/US_LINK_HUB_CURATION.md`, 2차 레드팀 검수 dead URL 제거) · **Supabase 전용 이전**(OLD→NEW "Trillion") + **onetrillion.app 도메인 연결**.
> - **▶ 다음 후보(보류)**: ① KR 링크 큐레이션 품질 재점검(US 67개처럼 정밀 검수) · ② advisors 검색+플랫폼 동시 필터(`app/api/advisors/route.ts` `else if`라 검색 시 플랫폼 무시 — `AdvisorDirectory` UI가 의도적 either/or[플랫폼 클릭=검색 해제, `!searching` 게이트]라 합치려면 UI 재설계 필요 → 보류) · ③ 뉴스 og:image 스크래핑 경량화(6→3)+빈 fallback · ④ admin 페이지네이션(현 limit 300) · ⑤ 토론/평가 첫 콘텐츠 시딩 · ⑥ 전체 i18n(현 UI 한국어 유지, 추후 언어권별 세팅) · ⑦ "리포트/차트" 탭 라벨-콘텐츠 불일치 정리.
>
> ⬇️ **(아래 🟢 STEP 394 배너는 직전 작업 상태.)**

> 🟢 **2026-06-24 · Supabase 전용 프로젝트 이전 + 배포 + 구글 로그인 LIVE (STEP 394, HEAD `e6afa23`, 빌드 ✓) — 직전 작업 상태.**
> **한 줄: Trillion 데이터를 전용 Supabase로 이사 → Vercel 배포 → 구글 로그인 작동. 새 세션은 아래 식별자부터 외울 것.**
> - **🆕 Supabase = 신규 전용 프로젝트 `ccbwxcszdoyjxvckedfp`("Trillion", ap-northeast-2 서울).** (구 `qxkmwlkchyxfzxbonhtj`/"OT-Marketing"=타 데이터와 섞여 있어 폐기 예정. POTAL ref `zyurflkhiregundhisky`는 여전히 절대 금지.)
> - **🆕 배포 URL = `https://stock-terminal-delta.vercel.app`** (env 5개 새 프로젝트값 교체, SERVICE_ROLE_KEY는 새 형식 `sb_secret_...`=supabase-js 2.101 정식 지원).
> - **🆕 구글 로그인 = LIVE.** Google OAuth 새 콜백 `https://ccbwxcszdoyjxvckedfp.supabase.co/auth/v1/callback` 추가 + Supabase Auth Google 활성화 + Site URL `stock-terminal-delta.vercel.app`. (첫 실패 "Unable to exchange external code"=Client Secret 불일치 → 구글에서 secret 새로 발급해 해결.)
> - **인프라 작업(Cowork MCP 직접)**: pg_dump 직결 차단(IPv6·풀러) → **Supabase MCP introspection으로 완전판 스키마 재구성** 후 NEW에 마이그레이션 5개 적용(`trillion_01_tables`→`02_fk_and_indexes`→`03_rls_policies`→`04_functions_triggers`→`05_views`). 결과 **37테이블+뷰2(advisor_directory·stock_snapshot_v)+함수9+트리거7(회원가입 on_auth_user_created→handle_new_user 포함)+FK34+RLS정책61, RLS 구멍 0**(OLD의 무방비 banner_clicks·chat_reports 제거로 더 안전). 데이터 link_hub100·products10·youtube100 MCP 복사(행수·URL 검증), fss_advisors는 크론 재적재 **1,804건**. 시드더미·테스트행은 의도 제외. 문서 `docs/SUPABASE_MIGRATION.md`·`SUPABASE_MIGRATION_HANDOFF.md`.
> - **STEP 393(`64003e1`)** 로그인 후 죽은 `/kr`→홈(`/`) 리다이렉트 수정(`app/auth/callback/route.ts` `next` 기본값·`app/auth/login/page.tsx` 링크). **STEP 394(`e6afa23`)** 종목 검색박스를 `주식 ETF ETN 리츠` 하위탭과 **같은 줄 우측**으로 이동(`MarketBoard.tsx`, 모바일 w-32/sm+ w-48).
> - **⚠️ 남은 선택**: ① DATABASE_URL 구값(앱 런타임 미사용·무해, `lib/supabase/admin.ts`가 SERVICE_ROLE_KEY만 씀 — 로컬 DB작업 시에만 교체) · ② `middleware.ts` 없음(현재 로그인 정상이나 토큰 만료~1h 후 SSR 세션 갱신 안정성 위해 추후 복구 권장, 필수 아님) · ③ OLD "OT-Marketing"은 며칠 안정 후 정리 판단.
> **▶ 다음 1순위: onetrillion.app 도메인 연결** — 가비아 DNS A/CNAME(이메일 MX 유지) + Vercel 도메인 추가 + Supabase Site URL·구글 OAuth를 onetrillion.app로 갱신(또는 병행).
>
> ⬇️ **(아래 🟢 STEP 392 배너는 직전 작업 상태.)**

> 🟢 **2026-06-24 · 현재 상태 (STEP 392, HEAD `8424e9b`, 빌드 ✓) — 직전 코드 상태.**
> **이번 세션(370~392) = 코드 헬스 → 캐시 → UX → 모바일 반응형 → 종목·상품 고도화(관심종목·페이지네이션·검색·증권사 시트) → 종목 표 마무리 + 전면 코드 감사·정리.**
> - **코드 헬스(370·372)**: 죽은 legacy 라우트 11+컴포넌트 27(370) + 죽은 API 라우트 ~55(372) 삭제(빌드 페이지 144→28, 크론·활성 보존). **371** 지수 티커 영어화.
> - **속도(373·374)**: 탭 데이터 **클라이언트 캐시(stale-while-revalidate, `lib/clientCache.ts`)** + 피드 스켈레톤 → 모든 탭(피드·종목표·리딩방) **재방문 즉시**. 컴포넌트만(새 라우트 아님).
> - **UX 디테일(375)**: 리딩방 미리보기 ⭐ + 링크행 "바로가기🔗" 항상표시(ListRow 한 곳=증권사·뉴스·유튜브 전부) + 유튜브 "N월 N주차 기준"(week_label) + 마이페이지 즐겨찾기 카테고리 섹션 + 푸터 카카오톡 제거.
> - **즐겨찾기 일원화(376)**: 마이페이지 '내 즐겨찾기' 탭 **제거** → 헤더 ⭐ → `/favorites` 단일(중복 해소). 마이페이지 = 프로필+내신고.
> - **📱 모바일 반응형(377~381·385)**: 페이지 패딩 `px-4 sm:px-6`·푸터·게이트웨이(377) / **MarketBoard 표** 모바일 = 기간 6컬럼→**드롭다운 1칸**(381, select 1일~1년) + `#`간격 축소 + min-w 320 / 증권사 바로가기 모바일 **표 아래** 노출(379) / 터치타깃(380) / 종목 클릭 → **증권사 바로가기 시트(모바일 전용 `lg:hidden`)**(385). 마스터 `docs/MOBILE_BUILD_PLAN.md` · 아침 체크리스트 `docs/MOBILE_MORNING_CHECKLIST.md`. ⚠️ 이 환경 Chrome **마우스 CDP 멈춤·resize 미반영** → 검증은 **JavaScript 실행**으로(클릭·API). 실측은 사용자 폰.
> - **⭐ 관심종목 watchlist(382)**: 기존 **`watchlist` 테이블 재사용**(구 죽은코드 잔재) + **`name_ko TEXT` 컬럼을 Cowork이 Supabase MCP로 추가**(RLS·정책 "Users can manage own watchlist" 기존). `/api/watchlist` GET/POST(upsert onConflict user_id,symbol,market) + MarketBoard 행 **맨 오른쪽 ⭐**(stopPropagation) + `/favorites` 관심종목 섹션(`WatchlistClient`). **JS 종단검증 OK**(별→DB저장→/favorites표시→해제).
> - **전체 종목+검색(383)**: KRX ranking cap **200→3000**, MarketBoard 전 종목(~2,600) 로드 → **50/페이지**(이전/다음, 행번호 절대순위 `page*50+i+1`) + **검색**(종목명·코드 전 종목 필터). ⚠️ **현재가·1일=전 종목(KRX), 1주~1년=야후 UNIVERSE 45개만**("—") → 긴 기간 확장은 후속(야후 on-demand/UNIVERSE 확대).
> - **🔑 워크플로우 메모**: STEP 382~385는 **Claude Code(Sonnet)가 자율 작성** → Cowork이 **검토·교정**(별 위치 좌→우, 행번호 절대순위, DB컬럼 추가, 시트 내용 정보링크→증권사). 자율작성은 빠르나 **돌리기 전 Cowork 검토** 권장.
> - **📐 종목 표 마무리(386·392)**: `table-fixed`+칸별 고정폭(정렬·데이터 변해도 컬럼 위치 고정) + **숫자 페이지네이션**(`← 1 2 3 … 52 →`, 리딩방 `pageNumbers()`와 통일). 392: 잘린 종목명 **데스크탑 hover 툴팁 + 모바일 시트 풀네임** + toggleWatch 실패 revert.
> - **🔍 전면 코드 감사·정리(387~391, 3-에이전트 감사)**: **🔴보안 387** 미사용·무인증 `rooms/[id]/verify`(admin 클라 RLS 우회) 삭제 · **🧹388** 죽은 코드 27파일 삭제(미사용 스토어7·컴포넌트7[TopNav·TickerBar 등]·lib8·타입4 + `/api/likes`; `lib/watchlist.ts`=없는 테이블 `watchlists` 조회한 깨진 코드) · **389** 국가 상태 `useCountryStore`로 통합+persist(헤더 플래그↔게이트웨이 동기화) · **390** 등락 색 토큰화(`unjong-up`#F04452/`unjong-down`#3182F6) · **391** non-null 방어·관심종목 effect 가드·로그아웃 캐시 클리어. ⚠️ **감사 오탐 보존**: etf/etn/reit-performance 라우트·room_likes 테이블은 **사용 중**(동적 fetch라 grep 오탐).
> **▶ 다음(사용자 지정 순서)**: ① 모바일 실측 미세조정(`MOBILE_MORNING_CHECKLIST.md`) → ② 모바일 마무리 → ③ **배포(Vercel·onetrillion.app)** → ④ 앱스토어. (긴 기간 데이터 확장·카카오 로그인·i18n은 별도 후속.)
>
> ⬇️ **(아래 🔵 369 배너는 직전 작업.)**

> 🔵 **2026-06-23 · (직전) STEP 369, HEAD `bb04a13`, 빌드 ✓.**
> **출시 로지스틱스 확정**: 도메인 **onetrillion.app**(가비아·.app HTTPS강제) · 이메일 **contact@onetrillion.app**(구글 워크스페이스 Business Starter, 가비아 DNS TXT+MX `1 smtp.google.com.` 검증완료) · 로고 **T 모노그램**(미드나잇#0E1116+민트#2DD4BF, 파비콘·앱아이콘·OG·헤더 적용 STEP369, 프롬프트 `docs/LOGO_PROMPT.md`). ⚠️ **아직 미배포(로컬만)** — 배포는 모든 작업 후 한 번에(Vercel). 사이트주소=`https://onetrillion.app`(metadataBase). 사업자: 원트릴리언·210-39-33812·대표 **장은태**·**제주 서귀포시 동문로 55 2층**.
> **364~369**: 364 파비콘·OG·metadataBase / 365 푸터 이메일 / 366 robots(+admin·mypage·auth 색인차단)·sitemap·404 / 367 푸터 사업자표시 / **368 종목·상품 랜딩 안정화(거래대금순 기본+스켈레톤 — 빈 컬럼"—"·느린 첫인상 해소)** / 369 T모노그램 로고.
> **▶ 다음(사용자 지정 순서)**: ① 사용자가 본 PC 문제 정리→수정 → ② 모바일 반응형 완성 → ③ 플레이스토어·앱스토어 등록(연결제 준비됨, 웹앱 래핑 필요). robots/sitemap·SPF/DKIM은 배포 직전.
>
> ⬇️ **(아래 🔵 346~360 배너는 직전 작업.)**

> 🔵 **(직전) 2026-06-23 · STEP 360까지 (HEAD `7e1d7d3`)**
> **브랜드 = Trillion / 트릴리언**(구 운종/UNJONG · 리브랜드 351). 사업자명 **원트릴리언**, 사업자번호 **210-39-33812**(`docs/LAUNCH_INFO.md`). 포지셔닝 = **"흩어진 금융정보를 한눈에"**(정보 허브). ⚠️ 아래 §1 '운종 정체성'은 이 배너로 갱신됨(브랜드·포지셔닝 우선).
> **이번 세션(346~360) 한 것:**
> - **디자인(352~353)**: **미드나잇 `#0E1116` + 민트 `#2DD4BF`** — 헤더·푸터·지수티커 다크화. 토큰 `--color-accent:#2DD4BF`. 코드 식별자 `unjong-*`·DB명은 대소문자 달라 **유지(안전)**.
> - **즐겨찾기 일원화(348~350·357)**: 헤더 알림→**즐겨찾기**, `/favorites`(HTML5 드래그 순서)+리딩방 즐겨찾기(`room_favorites`). 357 링크 즐겨찾기(`LinkCard`)도 비로그인 별 노출+클릭시 로그인 유도. 서버 전 동작 `401`+RLS.
> - **모바일(354~355)**: `body{min-width:1280px}` **제거**(데스크톱 강제폭 = 모바일 가로스크롤 주범) + 게이트웨이 피드 스택 + 헤더 작은폰 넘침 해소 + 푸터 패딩. 활성 surface 전수 점검 = **이미 반응형**(피드 카드형·표 overflow·리딩방 하단시트). 비반응형 그리드는 legacy 미라우팅. ⚠️ **이 환경 Chrome resize_window는 렌더 뷰포트 미반영**(`innerWidth` 1920 고정) → 모바일 실측은 **사용자 폰**으로.
> - **🔴 리딩방 신뢰 재정비 — 평가 구축→철회→관심순(356~360, 핵심 결정)**: 356 별점·후기(`room_reviews`)+358 신고·관리자숨김 구축·검증했으나 → **사용자 결정**: 리딩방은 텔레그램·카톡 **off-platform = 이용 증빙 불가** → 거짓·악의 리뷰 못 막고 **명예훼손 리스크** → "안 속는 곳"과 충돌. **359 별점·후기·좋아요(♥) 전부 제거 → 즐겨찾기로 일원화.** **360 정렬 = 관심(누적 즐겨찾기)순 기본 + 가나다↑↓**(뷰 `advisor_directory.favorite_count`, `/api/advisors sort=interest`, 행에 관심 수·토글 ±1). 리딩방 = **사실(금감원 등록·신고) + 즐겨찾기 + 바로가기**만.
> - **DB(MCP 직접, git 아님)**: `room_reviews`·`room_review_reports` 테이블 **생성 후 dormant 보존**(앱 미사용·되살리기용) · `advisor_directory` 뷰 **`favorite_count`** 추가(room_favorites 집계, 카운트만 노출) · `room_favorites` position · `room_likes` dormant.
> - **🔑 교훈 유지**: Turbopack은 **API 라우트 변경/삭제를 자동 갱신 안 함** → `pkill -f "next dev"; rm -rf .next; npm run dev` 클린 재시작 필수. 컴포넌트만 = HMR.
> - **▶ 다음 후보(보류·사용자 결정)**: 마이페이지 '내 즐겨찾기' 정비 · 모바일 폰 실측 정밀 · 출시 전 데이터 정리(데모행 sub:1·dormant 테이블·키 rotate) · 이메일/도메인(trillion.* 변형) · 푸터 대표자·주소 채우기 · 언어 i18n(한국판 완성 후).
>
> ⬇️ **(아래 🔴 배너는 이전 이력 — STEP 312~345.)**

> 🔴 **2026-06-22 · 게이트웨이 완성 — 카테고리 탭에 우측 실시간 피드 8종.** 운종 = **검증된 중립 관문(게이트웨이) + 리딩방 검증.** **새 세션은 `docs/PRODUCT_SPEC_V7.md`를 먼저 읽을 것.**
>
> **마지막 코드 = STEP 345 (`c0b3035`), 빌드 ✓.**
> **이번 세션(312~345) 완성한 것:**
> - **종목·상품 탭(게이트웨이 첫 탭)**: 멀티컬럼 수익률 정렬표(주식/ETF/ETN/리츠 하위탭, 현재가·1일~1년, 기간 헤더 클릭 정렬) + 우측 증권사 거래대금 순위(`MarketBoard`·`BrokerRanking`). (323~331, 레이아웃 다회 조정)
> - **🟢 우측 피드 8종** — 각 카테고리 탭 우측에 실시간 콘텐츠:
>   - **뉴스**(334~336): 네이버 뉴스 검색 API, 최신 20개, **대표 기사 og:image**(헤더 위장+네이버 폴백+referrerPolicy), 탭 새로고침 유지(localStorage), `?debug=1`. `/api/news/feed`·`NewsFeed.tsx`.
>   - **공시·신용**(337): 금감원 **DART** API 상장사 최신 전자공시 20건. `/api/dart/feed`·`DartFeed.tsx`.
>   - **거시경제**(338~339): 한국은행 **ECOS 100대 지표** + 미국 **FRED**, 한국/미국 토글 박스. `/api/macro/summary`·`MacroFeed.tsx`.
>   - **기업재무·리포트·ETF**(340): NewsFeed 일반화(`?q=` 쿼리별 캐시) 주제별 뉴스.
>   - **배당**(341): Supabase `dividends` 고배당 TOP20. `/api/dividend/feed`·`DividendFeed.tsx`.
>   - **공모주**(342~345): **38커뮤니케이션 청약일정 스크래핑**(EUC-KR) + 공모주/배당 토글(`OfferingsFeed`). `/api/ipo/feed`·`IpoFeed.tsx`.
> - **🔴 로그인 데드락 해소**(319): `onAuthStateChange` 콜백 안 `await supabase.from()` = auth 락 데드락 → 로그인 상태가 화면에 안 뜸. **콜백 동기 유지 + DB조회 setTimeout(0) 분리**(`AuthProvider.tsx`). **되돌리지 말 것.**
> - **법정 페이지**(322): `/privacy`·`/terms`·`/about` + 푸터 V7 정리. **관리자**(312) 헤더 '관리자' 링크 + **신고 모더레이션**(315~317: 로그인필수·중복방지·대기→검토후공개·admin 확인/기각·마이페이지 '내 신고'+철회). **게이트웨이 정리**(332~333): 증권사 탭 흡수+중복 헤더 제거.
> - **🔑 교훈 — Turbopack이 API 라우트 변경을 자동 갱신 안 함**: dev 서버가 옛 라우트 모듈+모듈레벨 캐시를 물고 안 바뀜(피드 빈값/옛값의 단골 원인). `lsof kill`만으론 옛 서버가 안 죽기도 함 → **`pkill -f "next dev" && rm -rf .next && npm run dev`** 클린 재시작이 확실한 cure. 코드/키는 가정 말고 **MCP(Chrome)·`?debug=1`로 검증**(ECOS placeholder 키도 그렇게 발견).
>
> *(이전 세션 272~311 = V7 대전환·게이트웨이 13탭·유튜브 Top100·리딩방 검증 1,738건·카카오/구글 로그인·자가등록·관리자 `/admin`. 상세 = `docs/CHANGELOG.md`.)*
> **▶ 다음 후보**(보류·사용자 결정):
> - **IPO 안정화**: 38 청약일정을 **cron으로 DB 적재** → UI는 DB 읽기(라이브 스크랩 실패 리스크 제거).
> - **52주 저가 우량주 패널**: `/api/db/52w-lows` 실데이터 있음(삼바·셀트리온·NAVER·기아·KB금융) → '주목 종목' 패널 후보.
> - **본인확인**(휴대폰 실명인증, **사업자등록 후 유료** ~40원/건) → 자가등록 ✅금감원등록확인(대표명==인증자명)의 전제.
> - **모바일 반응형**(현재 데스크톱 폭) · **업체명(운종) 변경 검토 중**(확정 전 사업자등록·도메인·이메일·푸터 법정보 보류 — 기능은 이름 무관 진행 가능). 푸터 V7·개인정보처리방침은 322에서 **완료**.
> ⚠️ **보안**: 유튜브 API키·구글 Client Secret이 스크린샷으로 노출됨 → rotate 권장(미실행). 사용자가 API키 제한은 보류 결정.
> ⚠️ **DB 직접변경(git 아님)**: youtube_channels·room_reports·room_likes·**room_submissions** 테이블, **advisor_directory 뷰(fss∪submissions UNION, platform·info_name·source·intro·valid_to필터)**, link_hub +8. fss_advisors는 기존(매일 크론). **soulmaten7 = role 'admin'**.
> ⚠️ **테스트/데모 데이터 정리 필요(출시 전)**: room_reports 테스트신고('LW주식공부'), room_submissions 데모행('운종 데모 리딩방(테스트)', sub:1).
> ⚠️ 아래 §3~§8은 **V6/STEP271 히스토리(무효 많음)**. 워크플로우(§2)·env(§6)·명령어(§7)는 유효.

---

## ⏱️ 0. 새 세션을 시작하는 법 (복붙 3단계)

1. **Cowork 새 대화**를 연다.
2. 첫 메시지로 아래 한 줄을 붙여넣는다:
   > 운종 프로젝트 이어서 할게. `docs/SESSION_BOOT.md` 읽고 현재 상태·작업 방식 파악한 뒤 오늘 할 일 P0를 제안해줘.
3. Cowork가 이 파일(+필요시 PLAYBOOK)을 읽고 상태를 요약 → 오늘 할 일을 제안 → 결정되면 **STEP 명령서**를 만들어 준다. 너는 그걸 **Claude Code 터미널**에 붙여넣어 실행한다.

> 💡 멈춤(freeze)·"모델 사용 불가" 같은 게 뜨면 새 세션 시작이 제일 빠르다. 코드·문서는 git에 있으니 안전하다.

---

## 🧭 1. 운종이 뭐냐 (정체성 — LOCK, 안 바뀜)

> **운종 = "투자상품에 속지 않게 돕는 곳"** — 정확한 정보 + 솔직한 토론 + 검증된 신뢰. **중심축 = 신뢰.**

- 구조 = 네이버 증권 레이아웃 + 토스 증권 카드 + Trustpilot 평가 모델. 마스터 비전 = `docs/PRODUCT_SPEC_V6.md`.
- **거래 X** (증권사 라이선스 없음 — 정보·대화·허브·신뢰만), **영어판 X**, **코인 X**, **정밀 스크리너 X**, **별점 X**(추천/비추천+신고로 대체).
- 한자 雲從 코드 표기 X — **UNJONG + 운종 한글만**.
- **수익 모델**: MVP 1.0(정보+채팅·토론) → **MVP 2.0(상품·리딩방 평가 디렉토리 = 진짜 차별화)** → Tier 인증 광고(추후, Sponsored↔평가 분리). **광고는 사용자가 지시할 때만.**

---

## 🤝 2. 작업 방식 (가장 중요 — 절대 혼용 금지)

| 역할 | 누구 | 하는 일 |
|------|------|---------|
| **두뇌** | **Cowork (이 챗)** | 대화로 무엇을 만들지 결정, 리서치, 설계, 문서 갱신, **STEP 명령서 작성**. **실행은 안 함.** |
| **손** | **Claude Code (터미널 CLI)** | Cowork가 만든 명령서/코드를 **실제로 실행** — 파일 수정·`npm run build`·git commit/push. |

- 흐름: ① 사용자가 Cowork에 원하는 것 말함 → ② Cowork가 STEP 명령서 작성 → ③ 사용자가 Claude Code에 붙여넣어 실행 → ④ 결과를 Cowork에 공유 → 다음 단계.
- **Claude Code 실행 명령** (기본 = Sonnet, 빠르고 저렴):
  ```bash
  cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
  ```
  그다음 터미널에: `@docs/STEP_N_COMMAND.md 파일 내용대로 실행해줘`
- **Opus는 Cowork가 🔴 표시한 경우만** (원인불명 디버깅·대형 리팩토링): `--model opus`
- 명령서 전달: 3단계+/빌드+커밋 포함 → **파일 방식**(`docs/STEP_N_COMMAND.md`). 1~2파일·디버깅 → **인라인**.
- 사용자는 **코딩 초보자** → 기술 설명 간결하게, 명령어는 복붙 가능하게.

---

## 📍 3. (⚠️ 과거 이력 — 현재 상태는 맨 위 배너 STEP 345 기준) STEP 271 시점

- **(과거 시점) 당시 마지막 코드 = STEP 271 (`8670ba2`).** *(⚠️ 현재는 STEP 345 `c0b3035` — 맨 위 배너 기준.)*
- **이번 세션(265~271)** = 사용자 클릭 QA로 발견한 UX·버그 정리 + **종목 상세 점검**:
  - 265~266 헤더 홈/로고 클릭 시 홈 **완전 리셋**(주식·국내·전체·1일, zustand 리셋 카운터+리마운트) + avatarBg 크래시 가드.
  - 267~270 랭킹 표 UI 통일(순위 줄바꿈·ETF/ETN/리츠 ♡ 추가·종목명 `w-full`로 현재가·대비 우측 고정·미리보기 **hover→행 클릭**).
  - 271 종목 상세 **미국 차트** yahoo 연결(placeholder 제거).
- **종목 상세 점검 결론**: 주식·ETF·ETN·리츠·미국 **5종 전부 정상**. (미국 호가·체결은 국내전용 KIS라 카드 미표시 = 정상 / 미국 정보패널은 `/api/yahoo/quote-detail`로 동작.)
- **데이터 현황**: 주식·ETF·ETN·리츠·미국 = 기간 수익률(1일~1년) ✅. **펀드 = 제거**(무료 수익률 소스 없음 = 유료 데이터 영역).

---

## 🗺️ 4. 페이지·아키텍처

**홈(`/`)** = 지수 티커 → **랭킹 탭** 5개: `stock`(주식)·`etf`·`etn`·`reit`(리츠) ｜ `room`(리딩방 리스트). 탭은 URL `?tab=`로 새로고침 유지. 행 **클릭** 시 우측 미리보기 표시(hover 아님), 미리보기 안 '종목 상세·토론 보기 →'로 상세 이동. 우측 레일 = 실시간채팅 + 관심종목(♡).

**페이지 라우트**:

| 라우트 | 역할 |
|--------|------|
| `/` | 포털형 홈 (`components/home-v6/HomeClientV6`) |
| `/market` | **상품 리스트 = 전 타입 통합 디렉토리**(주식·ETF·리츠·미국·ETN 한 표에서 같은 기간 수익률로 비교, `MarketDirectoryClient`) |
| `/stock/[code]` | 종목 상세 — 좌 `StockInfoPanel`+증권사링크 / 중 탭5(차트·시세/토론/뉴스/공시/인사이트) / 우 실시간채팅. 국내=KIS, 미국=yahoo |
| `/toolbox` | 주식 관련 링크모음(증권사 거래대금 순위 + 카테고리 링크) |
| `/rooms`·`/room/[id]` | 리딩방·채널 디렉토리/평가 |
| `/products`·`/product/[id]` | 상품 디렉토리/평가 |
| `/discussion`·`/news`·`/calendar`·`/global`·`/mypage`·`/auth/login` | 토론·뉴스·캘린더(외부링크)·글로벌·마이·로그인 |
| `/(windows)/kr`·`/us` | (레거시 — `/market`으로 리다이렉트) |

**헤더 메뉴** = 홈 · 상품 리스트(`/market`) · 주식 관련 링크모음(`/toolbox`).

---

## 🔌 5. 데이터 소스 / 주요 API 라우트 (`app/api/...`)

- **KRX 공식 OpenAPI** (`data-dbg.krx.co.kr`, `AUTH_KEY` 헤더, env `KRX_API_KEY`): 국내 랭킹 100·일별.
  - `krx/ranking`(주식 100, 5분 캐시) · `krx/etn`(ETN 1일, 엔드포인트 `/etp/etn_bydd_trd`) · `krx/etn-performance`(ETN 기간 수익률 — 6개 날짜 종가 비교)
- **Yahoo** (`yahoo-finance2`): `yahoo/chart`(차트 일봉) · `yahoo/kr|etf|reit|us-performance`(기간 수익률) · `yahoo/quote-detail`(미국 종목 상세) · `yahoo/indices`·`m7`·`us-movers` 등
- **KIS (국내 전용)**: `kis/price`·`chart`·`orderbook`·`execution`·`investor`·`market-cap` 등 — **미국 종목엔 안 씀**(미국은 yahoo).
- **DART**(국내 공시)·**SEC**(미국 공시)·**RSS 뉴스**(`news/*`)·**ECOS/FRED**(거시).
- **Supabase**: 채팅·토론·평가·관심종목·FSS 신고 원장(1,738건 적재).

---

## 🔐 6. 환경변수 · 보안 (절대 규칙)

- `.env.local` **변수 이름만** (값은 절대 채팅/문서에 평문으로 X): `KRX_API_KEY`, `KIS_APP_KEY`/`KIS_APP_SECRET`/`KIS_*`, `DART_API_KEY`, `SEC_USER_AGENT`, `ECOS_API_KEY`/`FRED_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_ACCESS_TOKEN`/`SUPABASE_PROJECT_REF`/`DATABASE_URL`, `NEXT_PUBLIC_LOGODEV_TOKEN`, `OPENAI_API_KEY`, `KAKAO_CLIENT_ID`/`KAKAO_CLIENT_SECRET`, `DATA_GO_KR_KEY`, `TOSS_*`.
- **`.env.local` 커밋 절대 금지** (현재 git 미추적 = 정상).
- **Supabase 프로젝트**: 운종 전용 ref **`qxkmwlkchyxfzxbonhtj`** (대시보드 표시명 "OT-Marketing"). ⚠️ POTAL ref **`zyurflkhiregundhisky`**는 **절대 사용 금지**(혼동 주의).
- 키 값이 화면/스크린샷에 노출되면 재발급 권장. Cowork는 키 값을 직접 다루지 않는다(이름만).

---

## 🧰 7. 자주 쓰는 명령어 (복붙용)

```bash
# 개발 서버 (포트 3333)
cd ~/stock-terminal && npm run dev

# 빌드 검증
cd ~/stock-terminal && npm run build

# Claude Code 실행 (STEP 명령서 돌릴 때)
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
#  → 그다음: @docs/STEP_N_COMMAND.md 파일 내용대로 실행해줘

# 커밋·푸시 (작업/문서 저장)
cd ~/stock-terminal && git add -A && git commit -m "메시지" && git push

# 현재 상태 확인
cd ~/stock-terminal && git log --oneline -5 && git status -sb
```

---

## ▶️ 8. 다음 할 일 후보 (전부 보류 — 사용자 결정 필요)

- **리딩방·채널 검증 빌드** — 설계 = `docs/ROOM_VERIFICATION_SPEC.md`. (전체 리스트화 + 신고 **사실** 라벨 + 신고/광고 상위·분리. 데이터 확보·구현은 **플랫폼 완성 후**.)
- **모바일 반응형** (현재 데스크톱 폭 기준).
- **카카오 OAuth 활성화** (사용자 작업) — 추천/비추천 투표 실동작 전제.
- **AI 해설 빌드 여부** — 설계 = `docs/AI_LENS_SPEC.md` (해설만, 추천·단타 X).
- `/market`에 ♡·클릭 미리보기 일관화(홈과 동일하게).
- 평가·검증 MVP 2.0 / (펀드 수익률은 유료 데이터 도입 시) / **광고는 사용자 지시 시에만.**

> ⚖️ 새 기능 판단 필터: **"이거 보려고 운종에 올 이유가 있나?"** 없으면 안 만든다. 리딩방·채널 검증이 진짜 차별점.

---

## ✅ 9. 세션 종료 체크리스트 (Cowork이 매 코드 세션마다)

1. **4개 문서 헤더 날짜를 오늘로**: `CLAUDE.md` · `docs/CHANGELOG.md` · `session-context.md` · `docs/NEXT_SESSION_START.md`.
2. `CHANGELOG.md`에 이번 세션 변경 + 커밋 해시 추가.
3. `session-context.md`에 완료 블록 추가(+ TODO 가비지 컬렉션).
4. `docs/NEXT_SESSION_START.md`·`docs/NEXT_SESSION_PLAYBOOK.md`·`docs/SESSION_KICKOFF.md`·**이 BOOT 파일** 최신화(HEAD·STEP·다음 후보).
5. **교차검증**: ①6개 문서 날짜 동일 ②STEP 번호·커밋 해시 git log와 일치 ③옛 상태가 '현재'로 오인될 표기 없는지.
6. Claude Code용 `git add -A && git commit && git push` 명령 제공 → 사용자 실행.
7. 빌드 에러 없는지(`npm run build`).

---

## 📚 10. 더 깊은 문서 (필요할 때만)

| 파일 | 용도 |
|------|------|
| `docs/NEXT_SESSION_PLAYBOOK.md` | 심화 인수인계 — 디자인 시스템·페이지별 컴포넌트 매핑·STEP 이력 |
| `docs/CHANGELOG.md` | 세션별 전체 변경 이력(STEP별 커밋 해시) |
| `session-context.md` | 누적 결정사항 + STEP 블록 + TODO |
| `CLAUDE.md` | Cowork↔Claude Code 워크플로우 원본(절대 규칙) |
| `docs/PRODUCT_SPEC_V6.md` | 운종 마스터 비전(정체성 축 = "안 속는 곳") |
| `docs/ROOM_VERIFICATION_SPEC.md` | 리딩방 검증 설계(법지형 포함) |
| `docs/AI_LENS_SPEC.md` | AI 해설 설계 |

---

> **한 줄 요약**: 운종 = "안 속는 곳". Cowork=설계, Claude Code=실행. 지금 **STEP 345(`c0b3035`)** 빌드 ✓ — 게이트웨이 + 종목·상품 탭 + 우측 피드 8종(뉴스·공시·거시·기업재무·리포트·ETF·배당·공모주). 다음은 사용자가 고른다.
