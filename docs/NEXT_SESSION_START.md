<!-- 2026-07-08 -->
# Trillion(트릴리언) — 다음 세션 시작 가이드

> 🆕 **2026-07-08 (최신) — STEP 649~654: KR 로고 + JP·GB 공시 R1 완성(공시층+원문요약). 공시 R1 = US·KR·JP·GB 4개국.**
> - **649(`52805ab`)** KR 로고 수집(DART `hm_url`→`kr_logo_domains.json` 3,578 도메인·보드 실로고). **650(`1c3dadd`)** JP 공시층(`/api/jp-events`+EDINET PDF 프록시+`JpEventLayer`·isJP). **651(`e95017f`)** JP R1(EDINET CSV type=5→`fflate`→일본어 본문→gpt-4o-mini 한국어 요약·`filing_summaries`)·**docType 실측 수정**(임시보고서=180·350/360은 大量保有 노이즈였음). 라이브 정확(도요타 주총·자기주식·사업보고서).
> - **653(`7a7f3f6`)** GB 공시층=**Investegate/RNS**(GB엔 EDINET급 공식 무료 종합 API 없음·NSM=정식보고서만·RNS는 LSEG 약관 → 온디맨드+캐시+원문 링크 귀속으로 완화)·`/api/gb-events`(symbol.L→TIDM→HTML 파싱·노이즈 필터 Form 8.x·TR-1·PDMR)+`GbEventLayer`·isGB·**Vercel 도달성 통과**(⚠️Barclays 등 대형 금융=Form 8.x 도배로 빈 층). **654(`fef75ee`)** GB R1(`{source}-announcement` 본문→한국어 요약·`filing_summaries`[`GB`+id]·SSRF 방지)+MATERIAL 확장. 라이브 정확(Shell Q2 아웃룩). **▶ 다음=VN 공시(공시층+R1): `docs/NEXT_SESSION_VN_PLAN.md` 먼저 읽고 착수** (STEP 656 정찰=TCBS API `tcanalysis` 경로 폐기·네트워크 캡처 필요/대안 CafeF·Vietstock 스크랩) **→ CN → 광고(대화 먼저).**

> 🆕 **2026-07-07 — STEP 645~648: 완전성 청산(매매처 DB·JP공시 EDINET) + 헤더 홈 픽스.**
> - **645(`0023fda`)** 매매처 정적→DB(`brokers` 75행·`/api/brokers?region=KR`·언어권 기준·CN만 미보유). **646~647(`0ea7189`·`5d9e90a`)** JP 공시=EDINET(무료 공식·키 env)·`jp_disclosures`+크론 미리계산·**라이브 12,466건·2,148개사·臨時報告書 2,260**·도요타/소니 확인·dedup 픽스로 백필 완결.
> - **648** 헤더 로고→홈(한국탭·종목·상품·주식) 리셋 픽스(resetHome 국가KR+탭market·ToolboxClient n 구독). **⚠️ env 교훈: .env.local≠배포, Vercel 대시보드 등록+재배포 필요.** **▶ 다음=JP STEP 649(JpEventLayer+R1 UI)·완전성 GB(RNS)→VN→CN·광고.**
> - **641·642**: 구글 서치콘솔 + 네이버 서치어드바이저 인증(`layout.tsx verification`) + sitemap 제출(구글 19,983 URL 성공). **643**: 해외종목 한글명(애플·테슬라·도요타·텐센트, `resolveStockName` 오버라이드·영문 병기·META 등 사이트맵 합류). **▶ 다음=한국어 광고 설정.**
> - **635 종목 서버컴포넌트 (`ff7f95d`)**: `generateMetadata`(종목명 유니크 title/desc/canonical/OG)·`lib/stockName.ts`(KR=`kr_stock_snapshot`·해외=번들 JSON)·h1 SSR 이름주입·JSON-LD(Breadcrumb+Corporation). page.tsx→`StockLensClient.tsx`.
> - **636 사이트맵 (`58e89ec`)**: 정적5→**약 21,800 URL**(KR 0.7·해외 0.5). **637 홈 (`0046c2c`)**: Organization+WebSite JSON-LD(SearchAction=종목 검색페이지 생기면).
> - **638 라이브 검증→639 픽스 (`aa525a5`)**: 봇 초기HTML엔 회사명 정상이나 하이드레이션 후 `/api/lens`(야후 영문)가 h1을 "SamsungElec"로 덮음 → **h1 `initialName||data.name`로 네이티브 유지** + US "- Common Stock" 잡음 제거(`cleanUsName`). 재검증 통과(삼성전자·SK하이닉스·トヨタ·Apple Inc.).
> - **교훈**: 클라렌더=봇 빈페이지 → 서버컴포넌트+generateMetadata가 SEO 핵심. 야후 lens명 vs SSR 네이티브명 불일치 → SSR 우선. ▶ **다음=구글 서치콘솔 sitemap 제출 등 SEO 마무리 → 한국어 광고 설정.**

> 🆕 **2026-07-06 — STEP 622~630 (HEAD `3f38f33`): 🇻🇳 베트남 탭 + 🇬🇧 영국 탭 완성(빠짐없이) + 완전성 원칙.**
> - **🇻🇳 VN (623~627)**: 링크49·배관(vi·₫)·보드(HOSE 387·야후 `.VN`·vnstock 유니버스)·**지수바 VN-Index/VN30(VnDirect 대체·야후 미커버)**·매매처13·R3(`vn_names`·vi·3중 검수). 东方財富/HNX 미커버→텐센트/HOSE-only.
> - **🇬🇧 GB (628~630)**: 링크46·배관(en-GB·펜스`p`)·보드(FTSE 350·349·야후 `.L`·Wikipedia 유니버스+영문명)·**지수바 FTSE 100/250**·매매처12·R3(`gb_names`·en-GB·3중 검수).
> - **🔴 완전성 원칙 못박음**(CLAUDE.md+플레이북 §0): 새 탭 착수 전 플레이북 재독·MVP≠축소·**DoD 전 항목(지수바·매매처) 빠짐없이**·소스 막히면 대체.
> - **국가탭: US·KR·JP·CN·VN·GB = 6개국 · R3 전부 네이티브.** ▶ **다음 = 한국어권 마무리(디테일+한국어 SEO+광고→한국어판 MVP) 또는 국가 더(인도·대만).**
>
> 🆕 **2026-07-06 — STEP 612~620 (HEAD `55c94df`): CN R3 + JP·CN 네이티브 종목명(진짜 자국어 검색) + 4개국 R3 3중 검수.**
> - **612~616 CN R3 + JP 네이티브 (`f1ff19a`)**: 야후 영어명 탓에 ja/zh가 실은 영어검색이던 문제 → **JPX `jp_names` 4,014종목(일본어명)** 시드 → ja가 진짜 일본 기사. CN R3 zh + 로컬 0건 시 영어 폴백.
> - **618~619 CN 네이티브 (`6a9cecd`)**: `cn_names` **7,095행 = HK 3,227(HKEX 번체·zh-HK) + A주 3,868(텐센트 qt.gtimg 간체·zh-CN)**. **东方財富 IP 차단→텐센트 우회(GBK)**. HKEX xlsx `!ref` 오류→범위 재계산.
> - **620 3중 검수 수정 (`55c94df`)**: ① KR **NAVER**(영문 상장명→블로그 잠식)=`lib/krName.ts` 별칭(035420→네이버) ② JP/CN **통화**(SoftBank 원←엔)=결정론 후처리(ja→엔·zh→위안·KR 안 탐) ③ 회사명 CJK=한글화 프롬프트.
> - **국가별 AI: US·KR R1·R2·R3 / JP·CN R3 네이티브 완성. 4개국 R3 3중 검수 통과.** ▶ **다음 = 베트남 탭 / 전 국가 추가 검수 / SEO.** (JP·CN 공시 R1·R2=무료 실시간 소스 없어 보류 유지.)
>
> 🆕 **2026-07-06 — STEP 600~611 (HEAD `b2079b7`): 'AI 렌즈' 브랜딩·발견성 + KR AI 확장(R2·R3) + JP R3 뉴스.**
> - **600~603 (`121daae`)**: 옛 'TRAI'→**'AI 렌즈' 박스 배지**("기법별 전망" 제거) · 종목 뒤로=`router.back()`+**시트 URL 복원**(`useSheetSync`·모바일 시트 소실 해결) · **AI 렌즈 발견성 표식**(현재가↔1일전·PC 컬럼/모바일 헤더라벨+행 아이콘·신호 전용). **R4(Q&A) 영구 보류**(어드바이저=포지셔닝 밖+무료 상충).
> - **🎉 KR AI (604~606 · `cf22aba`)**: R2 브리핑 **DART 공시** · R3 뉴스 **한글명+ko 로케일** · **R3 짜깁기 금지**. Cowork MCP 검수 통과. "US 완성형→데이터 교체" KR 실증.
> - **🎉 JP R3 뉴스 (607~611 · `b2079b7`)**: 야후 일본명(`fetchYahooName`)+ja. **결정론 후처리** — 요약 한국어 번역 폴백(영어명 대응)·옛연도(2023) 문장 삭제(구글 재순환 대응)·pubDate 60일 최근성(전 국가). MCP 통과. **교훈=프롬프트 2회 실패→코드 후처리로 확정.**
> - **국가별 AI: US R1·R2·R3 / KR R1·R2·R3 / JP R3(공시=EDINET 대기·무료 키) / CN 미착수.** ▶ **다음 = CN R3 / SEO — JP 공시=보류 확정(무료 실시간 소스 없음·R3 대체). 국가 확장은 사용자 승인 후.**
>
> 🆕 **2026-07-06 — STEP 584~589 마감 (HEAD `3f4b647`) + 🔴 AI 브리핑 레이어 전략·설계 확정.**
> - **584~589**: 페이지명 **AI LENS**+progressive disclosure+이벤트 severity(585) · 한국어 보이스 v1·`VOICE_GUIDE` 신설(586) · 전문가 톤 1차(접힘=판정+수치·디스클레이머 통합)(587) · 판정 보이스 v2(588) · 시간축 스트립 초보 정리(589).
> - **🔴 AI 브리핑 레이어 (마스터 `docs/AI_BRIEFING_SPEC.md`)**: LLM=비정형 텍스트를 사실로만. **R1** 공시 원문 요약 · **R2** 종목 브리핑(핵심 긴장+지켜볼 것) · **R3** 뉴스 요약·토픽태그 · R4 안 함. 배관 있음(`ai-analysis` OpenAI+캐시·`eightK` 원문URL).
> - **🔑 접근/수익 대전환 (BUSINESS_STRATEGY 07-06)**: AI 브리핑 무료·공개(**구독 폐기**)=SEO·글로벌 엔진 · **로그인 게이트=개인화(즐겨찾기·알림)만**(콘텐츠 숨기면 SEO 죽음) · 수익=광고·디렉토리·제휴(트래픽 뒤·배너 맨끝).
> - **리서치**: 뉴스 감성 팩터 기각(사실 브리핑만·토픽태그) · 추정치 변경 렌즈 보류(Yahoo `eps_trend` 라이브 무료 실측·백테스트 이력 유료→참고용).
> - **🎉 AI US 확정 + KR 공시층·R1-KR (591~598·HEAD `24b3438`)**: R1 공시요약·R2 브리핑·R3 뉴스 US 라이브 + KR(DART·EUC-KR·corp 3,922 시드). **US 3라운드 검증+MCP 재검수 통과·R3 밸류 누수 차단.** 🔒 규칙=Claude Code 3회 반복검증+Cowork MCP 실물 재검수. ▶ **다음 = 다른 국가탭(R2-KR·R3-KR·JP/CN)은 사용자 승인 후.**
>
> 🆕 **2026-07-05 (직전) — STEP 579~583 완료 (HEAD `c39117b`). 시간축(단기·중기·장기) 재구성 + 실시간 이벤트(공시) 사실 레이어 (US 완성형).**
> - **시간축(579~580)**: `LensRead.horizon`(모멘텀=중기·기술=단기·재무계열=장기) + 퍼센타일(`lens_percentiles` 029·방향별·lens_scores US 1000, 비US null) → **시간축 스트립**(단기 RSI존·중기 모멘텀 퍼센타일·장기 팩터 "N중 M 우호") + **기법별 best-viz**(퍼센타일 게이지·RSI존·체크리스트) + **단/중/장 그룹핑**. 비US 방향 폴백.
> - **이벤트층(581~583)**: `lib/eightK.ts`(8-K item→렌즈·A⚠️/B📌/general·`flagLens`) + `/api/events`(EDGAR submissions items **결정론 분류**·US) + `EVENT_LAYER_SPEC.md`. "최근 중대 공시·이벤트" 리스트 + 렌즈 카드 ⚠️/📌. 정직화(583): 5.02="임원·이사진 변동"(리스트만)·F-Score 플래그·9.01 제거·A/B 분리. **사실만·예측 없음·판단은 사용자.**
> - **전략(BUSINESS_STRATEGY 07-05)**: **"3개의 시계"**(팩터=하루1회·이벤트=즉시·뉴스=Pro)·**펀더 신선도=추정치 변경**(Zacks)·free/pro=StockTitan 티어·공시 DART+EDGAR 무료. 벤치마크: Stockopedia·StockTitan(8-K AI요약)·Benzinga WIIM·Zacks·AskEdgar.
> - **▶ 다음 = ② AI 원문 실독 요약**(8-K 본문 읽어 정확한 한 줄·무료N/Pro·StockTitan식) → 거래량 맥락(WIIM-lite) → 추정치 렌즈(US) → KR 공시(DART). 세부 문구 미세조정.
>
> 🆕 **2026-07-04 (직전) — STEP 570~577 완료 (HEAD `be86401`). 스크리닝 인프라 + F-Score 실물·표시 헌장 + 🔴 TRAI 정체성 결정 + 6카드 헌장.**
> - **스크리닝 토대(570~573)**: 공용 엔진 `lensCompute`(카드=배치 계산 일치)·value/state → `lens_scores` 테이블 → `lensPrecompute`(시총 상위 1000·flush) → 매일 20:00 UTC 크론. **스크리너 UI는 안 만듦**(사용자: 종목 페이지=본체·스크리너=픽에 가까워 중립 충돌). 미리계산=대기.
> - **F-Score 실물+헌장(574)**: 성적표→부실 위험 체크·이름 크게·이게 뭐예요 박스·9칸 트래커·9항목 3그룹(전문용어+쉬운풀이)·등급 범례. **`docs/LENS_DISPLAY_CHARTER.md` 신설**(7카드 규칙). 유료 대조(GuruFocus·Stockopedia) 구조 표준 일치·우리 쉬운말/정직(t≈0.7) 우위. + 픽스(575).
> - **🔴 TRAI 제거+정체성(576)**: "AI 종합"이 사용자 판단권 침해 → 제거. 리서치(Danelfin·TipRanks) → ④ 재정의(뉴스=투명 사실 렌즈 FinBERT+8-K·결론은 사용자·맨 마지막). **정체성 = "AI가 답 주는 앱" 아니라 "정직한 재료로 사용자가 판단하는 앱".**
> - **6카드 헌장(577)**: 공용 템플릿 1곳 → 6개 동시(이름 크게·이게 뭐예요 박스·접힘 메뉴)+F-Score 일관. 7장 골격 통일·근거수치 노출.
> - **▶ 다음 = 6카드 눈검수 → 렌즈별 문구 다듬기 + 기법별 유료 레퍼런스 대조(헌장 §5) → 조합전략(③) → 뉴스 투명 렌즈(④·맨 마지막).**
>
> 🆕 **2026-07-04 (직전) — STEP 564~568 완료 (HEAD `ebbf3d8`). 카드 패밀리룩 · "이 기법 방향" 층 · 제품 청사진(4층).**
> - **카드 패밀리룩 (564~567)**: 시각 계층(그림자·둥근 모서리·원형 화살표·서랍 틴트) · 정보 순서(설명=이름 밑 서브타이틀·판정→스펙트럼→근거→단기/장기) · **메뉴화**(접힘=깔끔한 "기법 메뉴"·판정은 펼침 안으로 — "판정 늘어놔도 일반인 눈엔 엇갈림 안 잡힌다"에 설득) · **3구간 스펙트럼**(`Spectrum{labels,active,tone}` 공통·활성만 색조·7기법+F-Score·`SPECTRUM_LABELS` ko/en).
> - **"이 기법 방향" 층 (568)**: `LENS_OUTLOOK` ko/en·`outlookOf()`·스펙트럼 밑 "이 기법 방향" 줄. 그 기법 '방법대로'의 방향 — 시간축·유리/불리/중립·정직 꼬리표. **예측 아님**(역사적 base-rate). 저변동=위험·F-Score=건전성·기술=상태 축 유지(억지 X). 사용자가 따로 분석 안 해도 되게.
> - **제품 청사진 (568)**: 4층 = ①원자(7 검증 팩터) → ②방향(outlook) → ③조합전략(가치+모멘텀·QARP=버핏류 등 "~류 근사") → ④TRAI(사실+뉴스=의견·맨 마지막). `BUSINESS_STRATEGY` 결정 로그.
> - **▶ 다음 = 세부 문구 다듬기 · 전 종목 하루 1번 미리 계산(스크리닝 토대) · 검증된 조합 전략(가치+모멘텀 등) · 맨 마지막 TRAI.** (일/중 카피=사용자 게이트 · 수익화·유료 TRAI 계속 뒤로 · 새 기법 추가 일단락.)
>
> 🆕 **2026-07-03 (직전) — STEP 539~562 완료 (HEAD `4237714`). 렌즈 표현·다국어·7기법·직관화 + 3중 교차검증 + UI 편의성.**
> - **표현**: 영문 정식명칭+한글 요약 · "{기법} 알아보기"(개념·유래) · "자세히"(검증) 접기 · 단일 열·홈 너비 통일 · **TRAI**(민트 T) 리브랜딩.
> - **정직화**: 밸류 라벨 verdict 제거(낮음/보통/높음) · **신뢰도 등급 배지**(검증/표본약함/건전성/참고용) · **기법 엇갈림 표시**(모멘텀×밸류 성향).
> - **다국어 카피 (546~547)**: 겉면·개념을 **언어별 맵 `lib/lensCopy.ts`**(ko/en)로 — 이름=영문 앵커, 설명은 각 언어답게. API `?lang`. **TRAI=본체** → 카피 품질=제품. 원본 `docs/LENS_COPY.md`.
> - **6번째 기법 (548~549)**: **Quality(GP/A) 검증·추가** — t≈2.9·FF3 알파 t≈2.5(독립 프리미엄)·저회전. ROE 제외(대형주 편중). 은행 미적용. 인프라 재사용 2 STEP.
> - **제품 정의**: 예측 아님 — 검증된 렌즈들의 읽기 + 신뢰도, 선택은 사용자. 엇갈림=정보. (BUSINESS_STRATEGY 결정 로그) · 종목 데이터 허브=안 만듦 · 마법공식=보류(진짜 ROC 데이터 없음).
> - **3단계 순서**: ①정직화(완료) → ②UI 틀(등급·엇갈림·다국어 완료) → ③새 기법(**퀄리티 완료**·로스터 하나씩 완결). 로스터=`docs/LENS_ROADMAP.md`.
> - **주주환원 탈락 (551)**: FF3 알파 소멸·βHML0.5+ → 가치 재포장. 렌즈 미채용(문서 3종 기록).
> - **자산성장 채용 (553~554)**: βHML0.17 독립 축 → 7번째 렌즈 채용, 등급 "표본 약함"(t1.6). **원칙: 채용=효용(독립성)·등급=유의성.**
> - **카드 직관화 (555)**: 숫자 몰라도 "각 기법이 이 종목을 어떻게 읽는지" — 7기법+F-Score에 **판정 문장+쉬운 해석**(`LENS_READINGS` ko/en) + **정확한 근거 수치 그대로 병기** + **상단 '각 기법 시각·예측 아님' 1회 전제**. 전문가 비교 도구 아님 = 직관 전달이 핵심 가치.
> - **발생액 탈락 (557~558)**: 저−고 롱숏 연 −7.62%(방향 역전)·FF3 알파 음수 → Sloan 미재현. **강력 후보 소진**(무료·소표본 한계).
> - **7렌즈 3중 교차검증 (559~561)**: 초·중·후반 3구간 방향 일관성. 모멘텀·퀄리티 [+,+,+] 시기무관 단단 / 밸류 [+,−,+] 시기의존 / 저변동 raw 취약(방어 별도) / 기술 모멘텀중복. **등급 불변=정직 재확인**. note 반영.
> - **UI 편의성 (562)**: 한 페이지 유지(탭 X) · 카드 압축/펼치기 · **"기법 성향" 종합줄 제거(중립화)** · 모바일 통과.
> - **▶ 다음 = 일본어·중국어 카피 · 배포 안정화.** (새 기법 추가 일단락·강력후보 소진 / 주주환원·발생액=탈락·마법공식=보류 / 수익화·유료 TRAI 계속 뒤로.)
>
> 🆕 **2026-07-02 (직전) — STEP 525~537 완료 (HEAD `5bdf56f`). 🏁 신뢰도 업그레이드 사이클 종료.** 5렌즈에 t값·샤프·FF 팩터알파·거래비용 적용 → 정직한 등급:
> - **모멘텀=검증·유의**(t≈2.5·샤프0.71·비용/FF3 후 유의) · **저변동=위험대비 강**(위험18%·알파유의) · **밸류=정설이나 표본 약함**(βHML0.71·월별 t<2) · **F-Score=수익 신호 아님**(12코호트 t0.70·건전성만) · **기술=참고용·비독립**(RSI 유의 손실·200일선 모멘텀 흡수).
> - **메타교훈**: 유의≠수익수준(생존편향 과대·방향만 신뢰) / 소표본 유의는 노이즈(F t2.24→t0.70) / 렌즈마다 성공지표 다름 / 생존편향=무료데이터 벽.
> - **자산**: `lib/backtest_stats.ts`·`scripts/backtest_*_rigor.ts`·`backtest_momentum_alpha.ts`·Ken French(`data/ff`·gitignore)·플레이북 #18~22.
> - **원칙**: 수익화·유료 AI보기·UX는 계속 뒤로. ▶ **다음 = (a) KR/글로벌 렌즈 확장 · (b) 새 기법(퀄리티·마법공식) · (c·선택) 생존편향 없는 데이터 승격.**
>
> 🆕 **2026-07-02 (직전) — STEP 510~523 (HEAD `64a5d9a`). 무료 AI 렌즈층 5종 판정 완결.** 기법을 "정의→데이터→엣지→백테스트→표현"으로 **하나씩 완전히**(투자가능 $5+ 유니버스):
> - **✅검증 4**: 모멘텀(12-1 +2.4%p/년) · 저변동(저−고 +7.4%/년·위험 25%) · F-Score(재무 건전성 해석·수익예측 무의미) · 밸류(E/P 싼−비쌈 +10.2%p/년·B/M 조건부). **⚪참고용 1**: 기술(RSI 평균회귀 기각·200일선 약한 +3%/년).
> - **메타교훈**: "유니버스가 결과 지배"($5+ 명시 필수) · "같은 데이터·다른 시각"(밸류=은행 포함 유효 / RSI 평균회귀 기각의 원인=모멘텀과 일치).
> - **자산**: `lib/technical.ts`(공유엔진)·`lib/edgar.ts`(+자기자본)·`scripts/backtest_{momentum,lowvol,edgar,value,technical}.ts`·`docs/LENS_DEV_PLAYBOOK.md`(#1~17)·`docs/LENS_STRENGTH_MAP.md`.
> - **원칙**: 수익화·유료 AI보기(STEP 511 보류)·UX는 **전 기법 검증 후로** 미룸. ▶ **다음 = (a) KR/글로벌 렌즈 확장(가격기반 즉시·재무는 DART) · (b) 새 기법(퀄리티·마법공식).**
>
> 🆕 **2026-07-02 (직전) — STEP 508~509 완료 (HEAD `59cb0c1`, push ✓).** 모멘텀 1사이클 완주: `lib/momentum.ts`(12-1) + 야후 深가격 148회 리밸런스 백테스트(**프리미엄 연율 +4.1%**) + 렌즈 canonical 정리.
>
> 🆕 **2026-07-02 (직전) — STEP 500~507 완료 (HEAD `cc3dc99`, push ✓).** F-Score 1사이클 완주: 야후 재무 정찰→`fundamentalsTimeSeries` 전환→9기준 엔진(`lib/fscore.ts`)→렌즈 카드→EDGAR 다년 백테스트(10코호트)→정직 문구. 결론: "대형주에선 점수↔수익 불분명, 소형·가치주에서 유효(정설)". ▶ **다음 = 모멘텀 렌즈(가격만·야후 다년 백테스트 가능·검증 첫 완주 사이클 예상) or US 링크 풀충전 or Phase 2 결제 PG.**
>
> 🆕 **2026-07-02 (직전) — STEP 494~499 완료 (HEAD `628b14d`, push ✓).** JP/CN 이름 우선 표시·로고 자동수집(5,205+2,762) + KR 모바일 글자 수정 + **결정론 렌즈 엔진 MVP**(`/api/lens`, 온디맨드·30분 캐시) + **렌즈 페이지** `/stock/[symbol]` + **AI보기 진입 버튼**(4개 보드 모바일 바텀시트+데스크탑 펼침). KR 6자리→야후 `.KS`/`.KQ` 자동 해석 포함. ▶ **다음 = (1) 재무 렌즈(F-Score·Z) · (2) 유료 AI보기(LLM) · (3) US 링크 풀충전 · (4) Phase 2 결제 PG.**
>
> 🆕 **2026-07-01 (직전) — STEP 492v2 완료.** CN 전종목 확충: 큐레이션 108 → HKEX 공식목록+후강퉁·선강퉁 **7,098종목**(HK 2818/SS 1856/SZ 2012/ETF 412). 크론 2,821 r1w 계산(HK 92% 채움). ⚠️ A주 chart Yahoo 400 — SS/SZ r1w "—", 현재가·1일은 라이브 정상.
> **▶ 다음 = prod 라이브 검증(중국·홍콩 탭) or Phase 2 결제 PG or 인도 탭.**
>
> 🆕 **2026-07-01 — STEP 479~484 완료 (HEAD `44e0aac`, push ✓).** 일본 탭 완성: `JpMarketBoard`(Yahoo `.T` 72종목·¥ 통화·모바일 카드형·바텀시트) + `jp_stock_perf` 크론(08:00 UTC) + 72행 시딩 완료 + Google News 일본(5탭: 뉴스·실적·리포트·ETF·IPO) + 닛케이225+USD/JPY 마키 추가 + `JP_DOMAIN_MAP` 73항목 실로고 + `.T` 접미어 표시 숨김 + 레버리지·인버스 배지 단어경계(`\b`) 오탐 수정.
> **▶ 다음 = prod 라이브 검증(일본 탭·배지 픽스) → 중국/홍콩 or 인도 탭(`COUNTRY_TAB_PLAYBOOK`) or Phase 2 결제 PG.**
>
> 🆕 **2026-07-01 — STEP 473~478 완료 (HEAD `8795c1b`, 배포 ✓).** US 피드 파리티(뉴스 이미지+모아보기 4탭) + KR 종목 딜레이 제거(크론 스냅샷 2,769행 시딩→로딩 즉시) + KR/US 모바일 개편(카드형+바텀시트 스냅+PC식 정렬) + US 링크 67→139. (직전)
>
> 🆕 **2026-06-30 — STEP 469~472, HEAD `b741ead` · 배포 ✓ onetrillion.app.** 광고 슬롯 맨위 제거 + 헤더 코인 팝오버 + 탭 5묶음 재정렬·구분선.
> - **상태**: HEAD `b741ead` = origin/main = 라이브(STEP 422~472 전부 배포 완료). DB="Trillion" `ccbwxcszdoyjxvckedfp`.
> - **469**: 모든 리스트 맨 위 광고 제거(`AdvisorDirectory`·`BrokerRanking`·피드/일반 링크) → 10개마다(이후부터) 통일.
> - **471**: 헤더 코인 탭 클릭 시 "준비 중이에요" 팝오버(항상 뜨던 뱃지 제거, `coinOpen`+`coinRef`+outside-click).
> - **472**: TAB_ORDER `exchange`→`community` 앞, `CLUSTER_START` 상수, 탭바 묶음 구분선, `거래소`→`거래소·기관`.
> - **🔗 링크 풀충전(MCP 직접·git 아님)**: KR `link_hub` 73→**138**(전 카테고리 2배+, 빈 탭 다 채움). US **67**(아직 미충전 → 다음 작업). ⚠️ 마이그레이션 아님.
> - **📱 모바일 패스 완료**: Chrome MCP 라이브 점검 OK → AI·광고 빼면 KR 베타 가능 판단.
> - **▶ 다음**: ① **US 링크 풀충전**(KR 138 수준) · ② Phase 2 결제 PG+빌링+본인인증 · ③ Trillion AI 전망. (모바일=완료.)
> - 상세 **`docs/SESSION_BOOT.md`(최우선)** · `docs/CHANGELOG.md`(2026-06-30) · 정책 **`docs/ROADMAP.md` §3**.
>
> ⬇️ (아래 STEP 466~468 블록은 직전 작업.)

> 🆕 **2026-06-30 — STEP 466~468, HEAD `205c8ef` · 배포 ✓ onetrillion.app.** 종목·상품 수익률 패노라마 + 전 리스트 10개마다 광고 문의. 최신은 이 블록.
> - **상태**: HEAD `205c8ef` = origin/main = 라이브(STEP 422~468 전부 배포 완료). DB="Trillion" `ccbwxcszdoyjxvckedfp`.
> - **466·467**: 종목·상품 표(KR/US) 데스크탑 행 클릭 → 1일~1년 수익률 가로 패노라마(아코디언·모바일은 하단 시트) + 표 10행마다 광고(`slot=broker`).
> - **468**: 유튜브 10개마다 / 피드 링크·커뮤니티·거래소 맨 위+10개마다 광고 + 새 `feed`(콘텐츠 피드) 슬롯(`AdSlotRow`·`AdInquiryForm`·`/advertise`).
> - **▶ 다음**: ① 모바일 패스(리딩방·검증/business/advertise) · ② Phase 2 결제 PG+빌링 테이블+본인인증 · ③ Trillion AI 전망.
> - 상세 **`docs/SESSION_BOOT.md`(최우선)** · `docs/CHANGELOG.md`(2026-06-30) · 정책 **`docs/ROADMAP.md` §3**.
>
> ⬇️ (아래 STEP 462~465 블록은 직전 작업.)

> 🆕 **2026-06-30 — STEP 462~465, HEAD `e770a1b` · 배포 ✓.** 약관 정비·빈 상태 CTA·관리자 UX·모바일 서브탭. (직전 작업)
> - **상태**: 배포 완료(`205c8ef`에 포함). DB="Trillion" `ccbwxcszdoyjxvckedfp`.
> - **462**: 약관 "자가등록"→"업체 인증" 정정 + 구 자가등록 잔재 4파일 삭제(RoomSubmitModal·rooms/submit·AdminSubmissions·admin/submissions).
> - **463**: 리딩방·검증 verified view 빈 상태 → 온보딩 CTA ("무료로 게재" → /business).
> - **464**: /admin 금감원 조회 탭 밖 상시(제목 아래)·처리 큐 탭 3개[클레임·신고·광고 문의]·부제목 제거.
> - **465**: FEED_TABS 7개 모바일 서브탭 [링크 | 모아보기] (데스크탑 `lg:hidden` 그대로, 탭 전환 시 '링크' 리셋, `FEED_SUB_LABEL`).
> - **▶ 다음**: ① 배포(`git push` 422~465)+onetrillion.app 검증+크론 · ② Phase 2 결제 PG+빌링 테이블+본인인증 · ③ Trillion AI 전망.
> - 상세 **`docs/SESSION_BOOT.md`(최우선)** · `docs/CHANGELOG.md`(2026-06-30) · 정책 **`docs/ROADMAP.md` §3**.
>
> ⬇️ (아래 2026-06-30 이전 블록은 직전 작업.)

> 🆕 **2026-06-30 — STEP 456~461, 로컬 HEAD `687263d`(⚠️미배포).** 채널 단위 게재 모델 + /advertise 문의 + /admin 탭·게이트 + 결제·빌링 레일(§3). 최신은 이 블록.
> - **상태**: 로컬 HEAD `687263d`. ⚠️ **origin/main=`939f12b`(=라이브) — STEP 422~461 미배포(26커밋 ahead).** /advertise 등 새 라우트는 라이브에 없음(404 확인). **배포=`git push`(422~461 한 번에).** DB="Trillion" `ccbwxcszdoyjxvckedfp`.
> - **채널 단위(456·459)**: 3뷰 탭(금감원 등록업체/인증 리딩방/관심도순), 채널명=인증한 곳만(✓), 인증 리딩방=채널 단위(독립 행·교차연결X·`expires_at` 만료필터).
> - **/advertise(457·460)**: 공개 문의(슬롯+§3+폼)→`ad_inquiries`, 이메일+전화 필수, 광고 슬롯="광고 문의하기" CTA(맨위+10개마다).
> - **/admin(458)**: 탭형 [클레임|신고|광고 문의|금감원 조회]+광고 문의(연락함=템플릿 mailto)+`/admin/login` 게이트+푸터 관리자.
> - **운영자 UI(461)**: `/business` "게재 채널" 무료 1+추가 ₩5만/월 stub.
> - **§3 결제·빌링 레일**: 리딩방+AI 구독 공용, 빌링키 정기결제→자동 게재/비공개, PG 토스·포트원 후보, 키=사용자·법률자문.
> - **▶ 다음**: ① 배포(`git push` 422~461)+onetrillion.app 검증+크론 · ② Phase 2 결제 PG+빌링 테이블+본인인증 · ③ Trillion AI 전망.
> - 상세 **`docs/SESSION_BOOT.md`(최우선)** · `docs/CHANGELOG.md`(2026-06-30) · 정책 **`docs/ROADMAP.md` §3**.
>
> ⬇️ (아래 2026-06-28 블록은 직전 작업.)

> 🆕 **2026-06-28 — STEP 422~455, HEAD `9d34b3f`. (직전 작업)** 리딩방·검증 MVP 2.0(클레임·인증·광고 + OG 프리뷰 + 표형 디렉토리) + ROADMAP §3 정책 + 관리자·운영자 동선 정리.
> - **상태**: HEAD `9d34b3f`(STEP 455) push 완료 → **배포 반영 확인 필요**(직전 라이브=fac8fb1/421). DB = NEW "Trillion" `ccbwxcszdoyjxvckedfp`(ap-northeast-2). POTAL ref `zyurflkhiregundhisky`는 여전히 절대 금지.
> - **ROADMAP §3 정책 확정(단일 기준)**: 게재=금감원 유사투자자문 신고된 곳만(미신고=게재 X, 검색 경고+신고만). 라벨="유사투자자문 신고"(신고제·금융투자업 아님). 3층 뱃지(① 유사투자자문 신고=자동·무료 ② 운영자 인증=클레임+국세청 진위확인·무료 ③ 광고=신고+인증한 곳만·유료). 사실은 안 판다·노출(순위)만 판다. "신고=입장권" 플라이휠. 광고=순위 부스트+매체 가드레일 3개. ⚠️ 광고비 수취 전 법률자문 필수.
> - **클레임·인증(430~441)**: `/business` 검색→국세청 진위확인→서류→관리자 검토→운영자 인증→마이페이지 '내 업체'→디렉토리. DB `business_*` 4테이블+RLS. 라벨+운영자 인증 뱃지.
> - **디렉토리 폴리시(442~448)**: 플랫폼 탭 제거·리스트 표화(컬럼 헤더 클릭 정렬·행 ⭐만)·OG 링크 프리뷰(`lib/og.ts`+`/api/link-preview`+`/api/admin/crawl-previews` dev 배치+`link_previews`)·채널명 OG 폴백·미리보기 재배치(아이콘=채널명 앞).
> - **관리자·운영자 동선(449~455)**: 관리자 🔎 금감원 조회 검색박스(`AdminFssLookup`) + 클레임 심사 대표·개업일·진위확인 컬럼(449) · 사업자번호·연락처 하이픈 통일(`formatBizNo`/`formatPhone`, 450) · `/business`를 "리딩방 등록·관리" 허브(`BusinessHub` 탭 [업체 인증 | 내 업체 관리]·스마트 기본)로 + 마이페이지 '내 업체' 탭 제거 + 디렉토리 버튼 통일(451~455).
> - **기타(422~429)**: 토론 제거·카카오 제거(구글만)·증권사 광고 슬롯·유튜브 소개·인피드 광고(테스트).
> - **테스트 정리**: 배포 전 테스트 클레임 데이터 전부 삭제(business_links/members/claims=0). `link_previews` 실 OG 유지.
> - **▶ 다음 후보**: ① **배포(422~455) + `fss-advisors` 크론 실작동 확인**(CRON_SECRET·Vercel 로그) · ② 결제 PG+본인인증(Phase 2 후반, 광고 상위노출) · ③ 옛 자가등록 죽은코드 정리 · ④ 금융투자업 등급 지도 확장(투자자문사 탭) · ⑤ (최종) Trillion AI 전망.
> - 상세 **`docs/SESSION_BOOT.md`(최우선)** · `docs/CHANGELOG.md`(2026-06-28) · 정책 **`docs/ROADMAP.md` §3**.
>
> ⬇️ **(아래는 직전 — STEP 421 상태.)**

> 🆕 **2026-06-27 — STEP 421, HEAD `fac8fb1`. 배포 ✓ onetrillion.app 라이브.** 미국 시장을 거시(FRED)·뉴스(Yahoo)·공시(SEC EDGAR)까지 확장해 KR과 동등한 4기둥으로 완성한 세션 + 종목표 정렬 전면 재설계 + 모바일 폴리시. (직전 작업.)
> - **상태**: 배포 = **onetrillion.app 라이브**(STEP 413~421 + 세션 문서). DB = NEW "Trillion" `ccbwxcszdoyjxvckedfp`(ap-northeast-2). POTAL ref `zyurflkhiregundhisky`는 여전히 절대 금지.
> - **US 시장 완전체(413~415, 4기둥 완성)**: 413 피드 국가맵 리팩터(`ToolboxClient` 단일 `country==='KR'` 가드 → `FEED_COUNTRY_SUPPORT` 맵) + **거시(macro) US 노출**(FRED 데이터 이미 완성, 가드만 풀림)+`MacroFeed` `defaultView` prop / 414 **US 뉴스 피드**(`/api/news/feed?market=US` = Yahoo `^GSPC` RSS 키리스 실시간 헤드라인 정규식 파싱+`NewsFeed` `country` prop) / **415(flagship) US 공시 피드**(`/api/sec/feed` = SEC EDGAR `getcurrent` 8-K Atom, UA=`SEC_USER_AGENT` + 새 `SecFeed`[DartFeed 미러] + disclosure US 개방 — **DART의 미국 짝**). → US = 종목·상품 + 거시·뉴스·공시 **4기둥**.
> - **종목표 정렬 재설계(417, KR·US 동일)**: 종목명(가나다/알파벳)·현재가·기간 **헤더 클릭 정렬 + ▲/▼ 항상 표시**, **기본 현재가↓**(탭 전환 시 리셋), `#`=번호만(클릭 X), **거래대금 정렬 제거**. (416 모바일 US 종목명 `truncate` 클램프 선행.)
> - **모바일 폴리시(419·420·421)**: 419 ① 표 아래 증권사 중복 제거(클릭 시트에만) ② `ListRow` ⭐·바로가기 우측정렬(전 링크탭) ③ 종목 클릭 시트에 현재가 + 1일~1년 수익률 / 420 기간 **커스텀 드롭다운**(네이티브 `<select>` 교체 — 모바일 일관 렌더·작은 인라인·바깥클릭 닫힘) / 421 기간 라벨 **"전" 표기**(1일전~1년전, PERIODS+시트 하드코딩) + 드롭다운 버튼·목록 폭 일치.
> - **정리(418)**: 죽은 라우트 `app/api/yahoo/us-quote`·`us-performance` 삭제(호출처 0, -368줄). 옛 `/api/sec`는 `lib/api/sec.ts`가 써서 유지.
> - **🔵 결정**: 거래소 분리(코스피/코스닥, NYSE/나스닥) **안 함** — 검색·정렬로 충분 + US 데이터 태그 없음 → 주식 탭 통합 유지.
> - 커밋: STEP 413~421 + 문서 = **`fac8fb1`**.
> - **데이터**: `us_stock_perf` 상위 200 데모 적재 → **prod 크론 매일 22시 UTC** 전종목 자동(라이브 후 첫 실행 시 1주~6개월 전부 채워짐). ⚠️ KR 데이터값 개발환경 이상(페니주·고가) — 라이브 실데이터 확인 권장.
> - **▶ 다음 후보**: ④ **평가 디렉토리(MVP 2.0 차별화 축) 심화** · **US 1주~6개월 전종목 크론 라이브 채워졌는지 확인** · 추가 모바일 폴리시(실폰 발견 시) · 리포트·실적·ETF·공모주·배당 US 피드 = 보류(키리스 한계/데이터) · (최종) Trillion AI 분석 전망 레이어(`docs/BUSINESS_STRATEGY.md` §3).
> - 상세 **`docs/SESSION_BOOT.md`(최우선)** · `docs/CHANGELOG.md`(2026-06-27).
>
> ⬇️ **(아래는 직전 — STEP 412 상태.)**

> 🆕 **(직전) 2026-06-26 — STEP 412, HEAD `9984804`. 배포 ✓ onetrillion.app 라이브.** 미국 시장을 KR과 동등한 종목 탭으로 끌어올린 세션 + KR 링크허브 재점검 + AI 분석 전망 레이어 전략.
> - **상태**: 배포 = **onetrillion.app 라이브**(이번 세션 첫 배포 — STEP 404~412 + 세션 문서). DB = NEW "Trillion" `ccbwxcszdoyjxvckedfp`(ap-northeast-2). POTAL ref `zyurflkhiregundhisky`는 여전히 절대 금지.
> - **US 종목 탭 KR-parity(405~412)**: 405 US 종목 탭 신설(`app/api/yahoo/us-performance` 193 유니버스 + `UsMarketBoard.tsx`) / 406 KR 구조 통일(하위탭·기간 드롭다운·증권사 사이드바) / 407 US ETF(73, `us-etf-performance`)+하위탭 **`주식 | ETF`**(미국 기준, ETN·리츠 제거) / 408 **US 주식 전종목**(`data/us_symbols.json` 6,936 + `us-list` batch quote + `us-quote` 기간 lazy) / 409 KR 데스크탑 기간 드롭다운 통일 / 410 종목표 UI 리파인(`lib/currency.ts` 통화 현지화·드롭다운 1일부터·자동정렬·화살표·간격·로고) / **411 US 기간 백그라운드 미리계산**(`us_stock_perf` 테이블+`lib/usPerf.ts`+`app/api/cron/us-perf` 매일 22시 UTC `vercel.json`+us-list에 1년·DB조인+lazy 제거→전기간 정렬; 핵심: 1일·1년·거래대금=quote 즉시, 1주~6개월=크론 DB) / 412 **헤더=언어 선택기**(시장과 분리, `Header.tsx` useCountryStore 제거, 한국어/English 준비중).
> - **데이터/전략**: **KR 링크허브 65→71**(MCP 즉시 라이브 — FIX 연합인포맥스·KRX https, 소프트삭제 클리앙·Investing.com 포럼, ADD 8 한국IR협의회·KOFIA·코스닥협회·IRGO·증권플러스비상장·KCIF·KIEP·토스피드, `docs/KR_LINK_HUB_CURATION.md`) · **`us_stock_perf` 상위 200 데모 적재**(전 종목은 prod 크론 자동) · **Trillion AI 분석 로드맵**(`docs/BUSINESS_STRATEGY.md` §3 — 2층 구조: 현=정리/무신고, 최종=전망 유료 구독, 검증 기법 skill화, 매수추천 X·전망 O, 유사투자자문업 신고 추후·법률자문 필수, 투명성=차별점, 데이터+MVP 먼저).
> - 커밋: STEP 405~412 + 문서 = **`9984804`**.
> - ⚠️ **US 1주~6개월 전 종목**은 prod 크론 첫 실행(22시 UTC) 후 완성(현재 상위 200 데모만). KR 데이터값 이상(개발환경) — 라이브 실데이터 확인 권장.
> - **▶ 다음 후보**: ④ **평가 디렉토리(MVP 2.0 차별화 축) 심화** · US 정렬 토글 KR-parity(화살표 일관) · KR 데이터값 라이브 검증 · US ETF/기타상품 확장·증권사 US 연결·다른 시장(일본 등) · (최종) Trillion AI 분석 전망 레이어(`docs/BUSINESS_STRATEGY.md` §3).
> - 상세 **`docs/SESSION_BOOT.md`(최우선)** · `docs/CHANGELOG.md`(2026-06-26).
>
> ⬇️ **(아래는 직전 — STEP 402 상태.)**

> 🆕 **(직전) 2026-06-25 — STEP 402, HEAD `52ebd5f`. 배포 ✓ onetrillion.app 라이브.** 완성도 패스 8개 STEP + 데이터/인프라.
> - **상태**: 배포 = **onetrillion.app 라이브**(도메인 연결 완료, DNS·MX 보존·SSL 자동). DB = NEW "Trillion" 프로젝트 `ccbwxcszdoyjxvckedfp`(ap-northeast-2). POTAL ref `zyurflkhiregundhisky`는 여전히 절대 금지.
> - **완성도 패스(395~402)**: 395 **KR 전종목 기간 수익률**(`app/api/krx/kr-performance` — 커버 종목 46→2,768) / 396 **country-aware 탭**(US 선택 시 KR 전용 탭 숨김) / 397(P0) privacy 대표·연락처·about 한자 제거·헤더 코인 메뉴 제거 / 398 no-op(false positive — Next 16 `proxy.ts`로 세션 갱신 이미 동작) / 399 거시경제 "YYYY.MM 기준" 표시 / 400 유튜브 수집<30 throw+기존 보존 / 401 공모주 빈결과·에러 5분 캐시 / 402(P2) 푸터 "주식·상품" 링크·닉네임 저장 피드백·리딩방 즐겨찾기 비로그인 카드 통일.
> - **데이터/인프라**: 배당 복원(NEW 0건 → OLD에서 top-60+27 MCP 복사, JB금융지주 9.9%·HD현대 9.61%, `exDate` NULL→"—") · US 링크허브 67개/10카테고리(`docs/US_LINK_HUB_CURATION.md`) · Supabase 전용 이전 + onetrillion.app 도메인 연결.
> - 커밋: STEP 395~401 = `e21f2cc`, STEP 397~402 최종 = **`52ebd5f`**.
> - **▶ 다음 후보(보류)**: KR 링크 큐레이션 품질 재점검(US 67개처럼 정밀 검수) · advisors 검색+플랫폼 동시 필터(`else if`라 검색 시 플랫폼 무시 — UI 의도적 either/or라 합치려면 재설계, 보류) · 뉴스 og:image 경량화(6→3)+빈 fallback · admin 페이지네이션(현 limit 300) · 토론/평가 첫 콘텐츠 시딩 · 전체 i18n(현 UI 한국어 유지) · "리포트/차트" 탭 라벨-콘텐츠 불일치 정리.
> - 상세 **`docs/SESSION_BOOT.md`(최우선)** · `docs/CHANGELOG.md`(2026-06-25).
>
> ⬇️ **(아래는 직전 — STEP 394 상태.)**

> 🆕 **(직전) 2026-06-24 — STEP 394, HEAD `e6afa23`, 빌드 ✓. Supabase 전용 프로젝트 이전 + Vercel 배포 + 구글 로그인 LIVE.**
> - **🆕 Supabase = 신규 전용 프로젝트 `ccbwxcszdoyjxvckedfp`("Trillion", ap-northeast-2 서울).** 구 `qxkmwlkchyxfzxbonhtj`("OT-Marketing")=타 데이터 혼재로 폐기 예정. POTAL ref `zyurflkhiregundhisky`는 여전히 절대 금지.
> - **🆕 배포 = `https://stock-terminal-delta.vercel.app`** (env 5개 새값 교체, SERVICE_ROLE_KEY 새 형식 `sb_secret_...`). **🆕 구글 로그인 = 작동**(새 콜백 `https://ccbwxcszdoyjxvckedfp.supabase.co/auth/v1/callback` + Supabase Auth Google + Site URL 새 도메인; 첫 실패는 Client Secret 불일치 → 구글에서 새로 발급해 해결).
> - 인프라(Cowork MCP): pg_dump 차단 → **MCP introspection으로 완전판 스키마 재구성** → 마이그레이션 5개. **37테이블+뷰2+함수9+트리거7(회원가입 트리거 포함)+FK34+RLS61, RLS 구멍 0.** 데이터 link_hub100·products10·youtube100 복사 + fss_advisors 크론 **1,804건**. 문서 `docs/SUPABASE_MIGRATION.md`·`SUPABASE_MIGRATION_HANDOFF.md`.
> - **STEP 393(`64003e1`)** 로그인 후 죽은 `/kr`→홈(`/`) 리다이렉트 · **STEP 394(`e6afa23`)** 종목 검색박스를 하위탭 같은 줄 우측으로 이동(`MarketBoard.tsx`).
> - **⚠️ 남은 선택**: DATABASE_URL 구값(앱 런타임 미사용·무해) · `middleware.ts` 없음(현재 로그인 정상이나 토큰 만료~1h 후 SSR 세션 갱신 안정성 위해 추후 복구 권장, 필수 아님) · OLD "OT-Marketing"은 며칠 안정 후 정리.
> - **▶ 다음 1순위: onetrillion.app 도메인 연결** — 가비아 DNS A/CNAME(이메일 MX 유지) + Vercel 도메인 추가 + Supabase Site URL·구글 OAuth onetrillion.app로 갱신(또는 병행). 그다음 middleware.ts 복구(선택) → 앱스토어.
> - 상세 **`docs/SESSION_BOOT.md`(최우선)** · `docs/CHANGELOG.md`(2026-06-24 이어서).
>
> ⬇️ **(아래는 직전 — STEP 392 코드 상태.)**

> 🆕 **(직전) 2026-06-24 (STEP 392)** — HEAD `8424e9b`, 빌드 ✓. **데스크톱 안정화 + 전면 모바일 반응형 + 종목·상품 고도화 + 종목 표 마무리 + 전면 코드 감사·정리.**
> - **코드 헬스(370·372)** 죽은 라우트·컴포넌트·API 삭제(144→28) · **371** 티커 영어 · **속도(373·374)** 탭 클라이언트 캐시+스켈레톤(재방문 즉시) · **375** UX 디테일 5종 · **376** 마이페이지 즐겨찾기 탭 제거(→/favorites).
> - **📱 모바일(377~381·385)**: 패딩·푸터·게이트웨이 + 표 기간 **드롭다운**(381) + 증권사 표아래(379) + 터치타깃 + 종목클릭→**증권사 시트(모바일 전용)**(385). `MOBILE_BUILD_PLAN.md`·`MOBILE_MORNING_CHECKLIST.md`.
> - **⭐ 관심종목(382)** watchlist+name_ko(Cowork MCP)+`/api/watchlist`+행 ⭐+`/favorites` · **전체+검색(383)** ~2,600종목 50/페이지+검색(1주~1년=야후 45개만).
> - ⚠️ Chrome 마우스 CDP 멈춤 → **JS 실행으로 검증**. STEP 382~385 Claude Code 자율작성→Cowork 교정(돌리기 전 검토 권장).
> - **종목 표 마무리(386·392)** table-fixed 컬럼 고정+숫자 페이지네이션 + 잘린 종목명 툴팁/시트 풀네임. **🔍전면 감사·정리(387~391)** 🔴보안 verify 삭제·죽은코드 27파일·국가상태 통합·색상 토큰·견고성 3종. ⚠️ 감사 오탐 보존(etf/etn/reit·room_likes 사용중).
> - **▶ 다음(순서)**: ① 모바일 실측 미세조정(`MOBILE_MORNING_CHECKLIST.md`) → ② 모바일 마무리 → ③ **배포(Vercel·onetrillion.app)** → ④ 앱스토어. (긴 기간 데이터 확장·카카오 로그인·i18n 별도.)
> - 상세 **`docs/SESSION_BOOT.md`(최우선)** · `docs/CHANGELOG.md`(370~392).
>
> ⬇️ **(아래는 이전 — STEP 369 이하.)**

> 🆕 **(직전) 2026-06-23 (STEP 369)** — HEAD `bb04a13`, 빌드 ✓. **출시 로지스틱스 확정**: 도메인 **onetrillion.app**(가비아) · 이메일 **contact@onetrillion.app**(구글 워크스페이스 DNS 검증완료) · 로고 **T모노그램**(파비콘·앱아이콘·OG·헤더, `docs/LOGO_PROMPT.md`). ⚠️ **미배포(로컬만)** — 배포 한 번에(Vercel). 사업자 대표 장은태·제주 서귀포시 동문로 55 2층.
> - **361~363** 마이페이지 레이스 수정·재구성 / 옛 라우트→홈 / 자가등록 승인제. **364~367** 파비콘·OG·robots·sitemap·404·푸터(이메일·사업자). **368** 종목·상품 랜딩 거래대금순 기본+스켈레톤. **369** T모노그램 로고.
> - **▶ 다음(순서)**: ① 사용자가 본 PC 문제 수정 → ② 모바일 반응형 완성 → ③ 플레이스토어·앱스토어 등록(연결제 준비, 웹앱 래핑). robots/sitemap·SPF/DKIM은 배포 직전.
> - 상세 **`docs/SESSION_BOOT.md`(최우선)** · `docs/CHANGELOG.md`(364~369).
>
> ⬇️ **(아래는 이전 — STEP 360 이하.)**

> 🆕 **2026-06-23 현재 (STEP 360)** — **최신은 이 블록.** HEAD `7e1d7d3`(360), 빌드 ✓. 브랜드 = **Trillion / 트릴리언**(구 운종/UNJONG), 포지셔닝 **"흩어진 금융정보를 한눈에"**.
> - **리브랜드(351~353)**: Trillion/트릴리언, 사업자명 원트릴리언·사업자번호 210-39-33812(`docs/LAUNCH_INFO.md`). 디자인 **미드나잇#0E1116+민트#2DD4BF**(헤더·푸터·지수티커 다크). 코드 `unjong-*`·DB 유지. 언어설정 보류.
> - **즐겨찾기 일원화(348~350·357)**: 헤더 즐겨찾기 + `/favorites`(드래그) + 리딩방 즐겨찾기. 링크 즐겨찾기 비로그인 별 노출+로그인 유도.
> - **모바일(354~355)**: `min-width:1280px` 제거 + 피드 스택 + 헤더 넘침 해소. 활성 surface 이미 반응형. ⚠️ Chrome resize 뷰포트 미반영 → 폰 실측은 사용자 몫.
> - **🔴 리딩방 평가 철회→관심순(356~360, 핵심)**: 별점·후기(356)·신고·관리자숨김(358) 구축했으나 → **off-platform 이용 증빙 불가·악의/명예훼손 리스크** → **359 별점·후기·♥ 전부 제거 → 즐겨찾기 일원화**. **360 관심(누적 즐겨찾기)순 기본 + 가나다↑↓**(뷰 `favorite_count`). 리딩방 = 사실(금감원등록·신고)+즐겨찾기+바로가기.
> - **DB(MCP, git 아님)**: `room_reviews`·`room_review_reports` **dormant 보존**, `advisor_directory` 뷰 `favorite_count`, `room_likes` dormant.
> - **🔑 교훈 유지**: API 라우트 변경/삭제 → `pkill -f "next dev"; rm -rf .next; npm run dev` 클린 재시작 필수.
> - **▶ 다음 후보(보류)**: 마이페이지 '내 즐겨찾기' · 모바일 폰 실측 · 출시 전 데이터 정리(데모·dormant·키 rotate) · 이메일/도메인(trillion.*) · 푸터 대표자·주소 · 언어 i18n.
> - 상세는 **`docs/SESSION_BOOT.md`(최우선)** · `docs/CHANGELOG.md`(STEP 346~360).
>
> ⬇️ **(아래는 이전 이력 — STEP 345 이하.)**

> 🆕 **2026-06-22 현재 (STEP 345)** — **최신은 이 블록 기준.** 게이트웨이 카테고리 탭에 **우측 실시간 피드 8종** 완성 → V7 관문이 실사용 화면이 됨. HEAD `c0b3035`(345), 빌드 ✓. 마스터 비전 `docs/PRODUCT_SPEC_V7.md`.
> - **종목·상품 탭**(게이트웨이 첫 탭): 멀티컬럼 수익률표(주식/ETF/ETN/리츠, 기간 헤더 클릭 정렬) + 우측 증권사 거래대금 순위.
> - **우측 피드 8종**: 뉴스(네이버 API·대표기사 og:image·탭 새로고침유지) / 공시(**DART**) / 거시(**ECOS 100대지표+FRED**, 한국·미국 토글) / 기업재무·리포트·ETF(NewsFeed `?q=` 키워드 뉴스) / 배당(`dividends` DB 고배당 TOP20) / 공모주(**38커뮤니케이션 청약일정 스크래핑** + 공모주/배당 토글). 신규 라우트 5종(`news`·`dart`·`macro`·`dividend`·`ipo` `/feed`).
> - **🔴 로그인 데드락 해소**(319, `AuthProvider` onAuthStateChange 콜백 동기+setTimeout 분리 — **되돌리지 말 것**) · 법정 페이지(`/privacy`·`/terms`·`/about`) · 관리자 '관리자' 링크 + 신고 모더레이션.
> - **🔑 교훈**: Turbopack이 **API 라우트 변경을 자동 갱신 안 함** → **`pkill -f "next dev" && rm -rf .next && npm run dev`** 클린 재시작이 확실(`lsof kill`만으론 옛 서버 안 죽음). 코드/키는 MCP·`?debug=1`로 검증.
> - **env(git 아님)**: `.env.local` `NAVER_CLIENT_ID`/`NAVER_CLIENT_SECRET` 추가, `ECOS_API_KEY` placeholder→실제 키.
> - **▶ 다음 후보(보류)**: IPO cron DB 적재 · 52주 저가 우량주(`db/52w-lows` 실데이터) 패널 · 모바일 반응형 · 테스트/데모 데이터 정리(출시 전) · 키 rotate · 업체명 확정 후 사업자등록.
> - 상세는 **`docs/SESSION_BOOT.md`(최우선 1번)** · `docs/CHANGELOG.md`(STEP 312~345).
>
> ⬇️ **(아래는 이전 이력.)**
> 🆕 (이전) **2026-06-20 (STEP 311)** — V7 게이트웨이+자가등록·관리자 완성 (현재 상태는 위 STEP 345 블록). 아래 STEP 271 단락부터는 V6 히스토리.
> **V7 + 자가등록·관리자 완성**: 운종 = **검증된 중립 관문(게이트웨이) + 리딩방 검증.** 네이버 클론(랭킹·차트·종목상세·`/market`) 폐기. 마스터 비전 `docs/PRODUCT_SPEC_V7.md`. HEAD `84fab0b`(311), 빌드 ✓.
> - **홈** = 헤더(주식/코인) + 한국/미국 토글 + **카테고리 13탭**(뉴스·증권사·유튜브·차트시세·기업재무·리포트·공시신용·ETF펀드·공모주배당·거시경제·거래소·커뮤니티·리딩방검증) + 지수 티커, max-w-7xl. 각 탭 = `link_hub` 큐레이션 링크.
> - **유튜브 Top100**(구독자순, 주간 크론 `youtube_channels`) · **리딩방·검증**(금감원 신고 1,738건 `fss_advisors` + **자가등록**(`room_submissions`, 사업자번호 FSS 자동대조) → 뷰 `advisor_directory` **UNION**, 플랫폼탭/검색/좋아요/신고/분할 미리보기) · **로그인**(카카오+구글, `middleware.ts`로 작동) · **관리자 페이지 `/admin`**(role=admin, 신고·자가등록 표).
> - **▶ 다음 후보(보류·사용자 결정)**: 관리자 편의(헤더 '관리자' 링크 / 신고 알림 메일·텔레그램) · 본인확인(사업자등록 후 유료, 자가등록 ✅등록확인의 전제) · 푸터 V7 정리(개인정보처리방침 필수) · **업체명(운종) 변경 검토 중**(확정 전 사업자등록·도메인·이메일 보류, 기능은 이름 무관 진행 가능).
> - ⚠️ 보안: 유튜브 API키·구글 Client Secret 스크린샷 노출 → rotate 권장(미실행). ⚠️ DB 직접변경(git 아님): youtube_channels·room_reports·room_likes·**room_submissions**·advisor_directory(UNION)·link_hub+8. soulmaten7=admin. ⚠️ 테스트/데모 데이터 출시 전 삭제.
> - 상세는 **`docs/SESSION_BOOT.md`(최우선 1번)** · `docs/CHANGELOG.md`(STEP 272~311).
>
> ⬇️ **(아래 STEP 271 블록부터는 V6 히스토리 — 무효 많음.)**
> 🆕 (옛) **2026-06-18 (STEP 271)** — (아래 옛 단락은 히스토리).
> - **이번 세션(265~271)** = 클릭 QA 버그·UX 정리 + **종목 상세 점검**. 빌드 ✓ (HEAD `8670ba2`). **265~266** 헤더 홈/로고 클릭 시 홈 **완전 리셋**(주식·국내·전체·1일, zustand 리셋 카운터+리마운트) + avatarBg 크래시 가드 · **267~270** 랭킹 표 UI 통일(순위 줄바꿈·ETF/ETN/리츠 ♡·종목명 w-full·미리보기 **hover→행 클릭**) · **271** 종목 상세 **미국 차트** yahoo 연결. **종목 상세 점검 결론: 주식·ETF·ETN·리츠·미국 5종 전부 정상**(미국 호가·체결=카드 미표시, 정보패널=quote-detail). 추가 작업 없음.
> - **홈** = 지수 티커 → **랭킹 탭(상품 타입)**: 주식 · ETF · ETN · 리츠 ｜ 리딩방 리스트 (펀드 제거·STEP 260). 탭 새로고침 유지(URL `?tab=`). 우측 레일 = 실시간채팅 + 관심종목.
> - **성적표** = 단일 '[기간]전 대비' 칼럼 + 기간칩(1일~1년, 기본 1일). **주식·ETF·리츠·미국 = yahoo 실데이터 ✅**. **ETN = KRX 실데이터 ✅**(etp/etn_bydd_trd·380종목·1일 시세·거래대금/등락순). 펀드 = 제거(무료 수익률 소스 없음).
> - **`/market`('상품 리스트')** = **전 타입 통합 디렉토리** — 주식·ETF·리츠·미국·ETN을 한 테이블에 같은 기간 수익률 자로 가로질러(타입 배지·타입 필터·기간칩, `MarketDirectoryClient`). **핵심 차별점 '가로질러 비교' 실현.**
> - **헤더** = 홈 · 상품 리스트(`/market`) · 주식 관련 링크모음.
> - **데이터 소스**: 기간 수익률 = yahoo(`/api/yahoo/{kr,etf,reit,us}-performance`). 주식 1일·시총 = KRX. **ETN = KRX `/api/krx/etn`**(etp/etn_bydd_trd, 'ETN 일별매매정보' 구독 완료). 미리보기 차트 = yahoo 폴백(`/api/yahoo/chart`). **펀드 = 제거**(무료 수익률 API 없음 — data.go.kr·KOFIA 오픈API·예탁결제원 전부 확인 = 유료 데이터 영역).
> - ▶ **다음 후보**(전부 보류·사용자 결정): **리딩방·채널 검증 빌드**(`docs/ROOM_VERIFICATION_SPEC.md` — 플랫폼 완성 후) · **모바일 반응형** · **카카오 OAuth 활성화**(투표 실동작) · **AI 해설 빌드 여부**(`docs/AI_LENS_SPEC.md`) · /market ♡·클릭 미리보기 일관화 · 평가·검증 MVP 2.0 · (펀드 수익률은 유료 데이터 도입 시). **광고는 사용자 지시 시에만.**
> - **정체성**: "흩어진 모든 상품을 중립으로 펼치고, 스스로 판단(읽는 법)을 돕는 곳". 필터="이거 보려고 운종에 올 이유 있나?". 거래 X=정보·허브·소통. 성적표=타입×기간수익률 중립 / AI=해설(추천·단타 X) / 종목 디테일=링크아웃(허브).

> ⬇️ **여기서부터는 과거 이력(보존용)** — 현재 상태는 맨 위 🆕 블록(STEP 271) 기준.
> **(이력) Last updated**: 2026-06-15 (STEP 228~241 — 홈 = 상품 성적표 재편 + 헤더 정리)
> ⭐ **더 디테일한 마스터 인수인계**: `docs/NEXT_SESSION_PLAYBOOK.md`. **마스터 비전**: `docs/PRODUCT_SPEC_V6.md` (정체성 축 = "안 속는 곳").
>
> **(이력) 당시 상태**: STEP 227 까지 완료 — **V7(토스 오마주 + 운종 차별화)**. 빌드 ✓ (HEAD `2a3c895`). 홈 = [지수 티커 고정] → [🔥 인기토론 2열] → [랭킹 탭 6개]: 실시간차트 ｜ 카테고리 2열 ｜ 투자자동향 3열 ｜ 투자상품 랭킹(ETF 거래대금/수익률 + hover 미리보기) ｜ 리딩방 랭킹(텔레/카톡) ｜ 주식 관련 채널 랭킹(유튜브·디스코드·인스타·페북, 팔로워순). **상세 페이지 보강 완료**: 방/채널(`/room/{id}` 로고+투표 👍/👎+조회수+입장) · 종목(`/stock` 색버그 수정·헤더 로고·기본탭 차트·전일대비). **DB**: 023(투표)·024(조회수 RPC `increment_room_view`)·025(팔로워 `follower_count`) 운종 DB 적용. 로고 logo.dev(국내 100·ETF 배지)·등락색 한국식. **헤더 = 홈/마켓/뉴스·시황/주식 관련 링크모음**(MY·토론평가 탭·우측 보유 제거). **✅ 국내 랭킹 100 = KRX 공식 OpenAPI**(`KRX_API_KEY` 일별, 키 발급+이용신청 완료). **주식 관련 링크모음(`/toolbox`)** = 증권사 거래대금 순위 우측 레일(20개) + 카테고리 박스 탭·한 줄 리스트(`link_hub`)·국가 한국/미국·가로 2:1. ⚠️ 새 카테고리(재무·분석/ETF/공모주)는 라벨만·링크 0(큐레이션 후속).
> ▶ 다음: **링크모음 큐레이션 INSERT**(재무·분석/ETF/공모주 + 보강, MCP → 새 탭 등장) · `CategorySection`·옛 `(windows)` 셸 잔재 정리 · 유튜브 팔로워 자동수집(B, 키 대기) · 펀드 소스. **광고는 사용자 지시 시에만(철칙도 그때 사용자가 정함)**.
> **운종 정체성 (V6 — 2026-06-03 확정)**: "투자상품에 속지 않게 돕는 곳" — 정확한 정보 + 솔직한 토론 + 검증된 신뢰 (중심축 = 신뢰). 마스터 비전 `docs/PRODUCT_SPEC_V6.md`.
>
> ✅ **마이그레이션 020·021·022 = 2026-06-04 전부 적용 완료** (운종 DB ref `qxkmwlkchyxfzxbonhtj`, 표시명 "OT-Marketing"). `021` FSS 실데이터 **1,738건 적재 완료** → 리딩방 금감원 신고 검증·뱃지 실동작. 추천/비추천 투표는 **카카오 OAuth 활성화(사용자 작업) 후** 로그인 사용자에게 동작.

---

## 0. (과거 이력) 진행 상태 한눈 (2026-06-06 기준 · HEAD `13067c6` STEP 174 · V7 토스 오마주+UI)

### ✅ STEP 137~153 (V6 정체성 → V7 네이버 복제)

| STEP | 영역 | 결과 |
|------|------|------|
| 137 | FSS 유사투자자문업자 인증 시스템 (lib/fss.ts·cron·검증 API·뱃지) | 금감원 신고 자동 검증 (021 적용·1,738건 적재 완료) |
| 138 | 홈 신뢰 축 재배치 (home-v5) — 검증·평가 최상단 + 금감원 1,738개 히어로 + 뉴스 카테고리 탭 | 신뢰 정체성 정렬 |
| 139 | 종목 페이지 네이버급 디테일 (StockInsightsTab·Orderbook·Execution·InfoPanel·lib/format) | 정보 깊이 ④ |
| 140 | 종목 토론 추천/비추천 (DiscussionItem/Board ThumbsUp/Down + voteMap) | 신뢰 신호 통일 (022) |
| 141 | 종목 공시 탭 (StockDisclosuresTab DART/SEC, 주의공시 레드) | 종목 5탭 완성 |
| 142 | 포털형 홈 전면 재구성 (components/home-v6/HomeClientV6 + 섹션 모듈) | 홈 = HomeClientV6 |
| 143 | 홈 빈 섹션·버그 수정 (브리핑 야후 라이브러리·거래량 실값·업종테마 market 키·레터 아바타) | 홈 데이터 복구 |
| 144 | 홈 지수 카드 스파크라인 (HomeIndexBar inline SVG 30일 추세선 + indices API yf.chart()) | 홈 시각 강화 |
| 145 | 브리핑 overnight 안정화 (누락·0·NaN → "—" 중립, 가짜 초록 "+0.00%" 제거) | 신뢰 정렬 |
| 147 | 종목 메타 보강 (StockInfoPanel 외국인 소진율·상장주식수, KIS 한국 전용) | 정보 깊이 |
| 149 | 홈 빈 섹션 CTA 버튼 (HOT토론·평가 참여 유도) | 신뢰 |
| 150 | 브리핑 간밤 지수 실데이터 복구 (라우트 runtime/dynamic 누락) | 데이터 |
| 151 | 네이버식 상단 6메뉴 + 토론·뉴스 shell | V7 진입 |
| 152 | 마켓 페이지 + 국내 랭킹 테이블 (필터·클릭→종목) | V7 마켓 1차 |
| 153 | 마켓 미국 랭킹 (us-movers 확장·국가 분기) | V7 마켓 국내+미국 |
| 154·157 | 마켓 시총 필터(KIS market-cap) · 랭킹 100 확대(KIS 3종+Yahoo US 100) | 랭킹 깊이 |
| 156 | 홈 = 토스식 시장 대시보드 (지수+랭킹 embedded+관심레일) | **토스 오마주 진입** |
| 158·159(+) | 홈·전 페이지 풀폭 통일 (max-w 캡 제거, 앱 프레임 1984 유지) | 토스 폭 |
| 160 | 홈 지수 그리드 10개 (토글 제거·국내+해외+환율+원자재+코인) | 토스 지수 |
| 161 | 국내 랭킹 100 인프라 (`/api/krx/ranking` + KIS 30 fallback) | 랭킹 100 |
| 162 | KRX 공식 OpenAPI 연동 (`stk/ksq_bydd_trd`, `AUTH_KEY`) | ⏳ **키 승인 대기·미실행** |
| 163 | 상단 티커 KRX KOSPI/KOSDAQ 심볼 제거 | 티커 정리 |
| 164 | 지수 카드 전일대비 금액 + 느낌 태그(급등/조정/급락) | 토스 지수 |
| 165·166 | 코스피·코스닥 수급 (KIS `FHPTJ04040000`, 일별) | 토스 수급 |
| 167·168 | 하단 고정 마퀴 티커(토스식)·상단 제거·금액·투자유의사항 라벨 | 토스 티커 |
| 169·171 | 관심 레일 토스화 (헤더까지 풀하이트·레터아바타·♥·세로 아이콘 탭) | 관심 레일 |
| 170 | 헤더 한 줄 통합 (로고+네비+검색+아이콘, MainNav 행 제거) | 단일 헤더 |
| 172·173 | 종목 실로고 (도메인 favicon + 아바타 폴백, `lib/avatar`·`StockLogo`) | 종목 로고 |
| 174 | 종목 hover 상세 3단 [랭킹｜상세｜관심] (토스 UI 셸·운종 확장영역 placeholder) | hover 상세 |

### ✅ 완료된 STEP (88~135)

| 구간 | 영역 | 결과 |
|------|------|------|
| 88~99 | 운종 V4 골격 + 21개 카드 + 디테일 (Layer 0) | V4 완성 (보존 단계) |
| 100~110 | Layer 1-A~E 실데이터 + 채팅·관심종목 + 마커 청소 | V4 → V5 진입 직전 |
| 111 | 검색 활성화 + ContextNav 제거 + V4 헤더 5개 청소 | V5 헤더 |
| 114 | V5 1차 — 컨테이너 1984px + 3창→2창(한국/미국) + 카드 9개 + 종목상세 2탭 + 채팅 1채널 | V5 골격 |
| 115 | 종목 페이지 + 토론 + 종목별 채팅 | 운종 본질 |
| 116 | V3 잔재 1차 청소 (9 페이지 + API 3 + 컴포넌트 2) | 청소 |
| 117 | 새 홈 + dashboard 처분 + V3 12 페이지 + widgets 청소 | 청소 |
| 118 | Layer 3 인증 코드 (카카오 OAuth) — 활성화 사용자 작업 | 인증 |
| 119 | (STEP 119 명령서 — 시크릿 노출 후 마스킹, push X) | 보류 |
| 120 | 종목 페이지 마무리 (좋아요·신고·차트 inline·미장 quote) | 마무리 |
| 122 | 시장 헤드라인 + 종목별 뉴스 (RSS + Yahoo) | 뉴스 |
| 123 | UI 일관성 (LoadingState·EmptyState·ErrorState) | UI |
| 124 | 토론 댓글 (discussion_comments + UI) | 대화 본질 |
| 125 | 미국 주식 상세 (Yahoo quoteSummary) + 검색 ⭐ Watchlist 통합 | 풍부화 |
| 126 | 종목 페이지 핫픽스 (종목명·시총·52주·차트 4 버그) | 핫픽스 |
| 127 | 가독성 리뉴얼 (Pretendard + html 13→16px + text-xs→sm) | 폰트·스케일 |
| 128 | MVP 2.0 1차 — 상품·리딩방 디렉토리 + 평가 시스템 기반 | MVP 2.0 진입 |
| 129~133 | 전면 디자인 리뉴얼 (디자인 시스템 + 토스 카드 + 종목 페이지 탭 + 새 홈 손성기 + MVP2 통일) | 운종 V5 완성 |
| 134 | 모든 문서·로그 3차 교차검수 갱신 | 문서 |
| 135 | 잔여 문서 V5 정렬 패치 (README·BRAND·SPEC_V4 + .env.example + .gitignore) | 문서 마감 |

### ✅ DB 마이그레이션 — 모두 적용 완료

| 마이그레이션 | 내용 | 적용 |
|------------|------|------|
| 005_chat_v2 | 채팅 기본 | ✅ |
| 014_chat_rooms | room/nickname 컬럼 | ✅ |
| **015_chat_unify** | scalper/longterm/us → general 통합 | ✅ |
| **016_users_v5** | V3 결제 컬럼 제거 + tier/bio/oauth_provider + handle_new_user | ✅ |
| **017_discussions** | discussions/likes/reports + chat_messages.symbol | ✅ |
| **018_discussion_comments** | 댓글 테이블 + comment_count 트리거 | ✅ |
| **019_platform_directory** | products/leading_rooms/platform_discussions + 시드 (ETF 10·리딩방 5) | ✅ |
| **020_dislike_votes** | 상품·리딩방 평가 추천/비추천 (vote + dislike_count + 트리거) | ✅ (06-04) |
| **021_fss_advisors** | 금감원 유사투자자문업자 원장 + leading_rooms 인증 컬럼. **FSS 1,738건 적재 완료** | ✅ (06-04) |
| **022_discussion_dislike** | 종목 토론 추천/비추천 (vote + dislike_count + 트리거) | ✅ (06-04) |

→ Cowork (Supabase MCP) 가 020·021·022 까지 **모두 적용 완료** (운종 DB ref `qxkmwlkchyxfzxbonhtj`, 표시명 "OT-Marketing"). **로컬 동작 정상**.

---

## 1. 사용자 직접 작업 (🔴 미완)

### 🔴 카카오 OAuth 활성화 — STEP 118 잔여
1. **카카오 Developers 콘솔** (https://developers.kakao.com):
   - 앱 "운종" 등록 → Web 플랫폼 + 카카오 로그인 ON
   - Redirect URI: `https://qxkmwlkchyxfzxbonhtj.supabase.co/auth/v1/callback`
   - 동의항목: 닉네임·이메일·프로필 사진
   - REST API 키 복사
2. **Supabase Dashboard** → Auth → Providers → **Kakao ON** + REST API 키 입력

→ 전까지 카카오 로그인 시 OAuth 실패 (단 빌드·페이지·비로그인 사용은 정상).

### 🔴 SUPABASE_ACCESS_TOKEN 폐기 권장 — STEP 119 보안 이슈
- `docs/STEP_119_COMMAND.md` 에 한 차례 노출됐던 PAT (`sbp_aedc6b23...`)
- GitHub Push Protection 으로 외부 노출은 차단됐지만, 로컬 디스크에 평문 잔재
- https://supabase.com/dashboard/account/tokens → Revoke + 새 PAT 발급 → `.env.local` 갱신
- 명령서 시크릿은 이미 마스킹 완료

### 🟢 Vercel 배포 + unjong.com 도메인 — 사용자 결정 후
- 사용자 보류 상태 ("도메인 구매 전이니까 보류")
- 결정 시 STEP 119 (재작성·시크릿 마스킹 버전) 실행

---

## 2. 운종 V5 페이지 구조 (최종)

| 라우트 | 역할 | 상태 |
|--------|------|------|
| `/` | 포털형 홈 = `components/home-v6/HomeClientV6` (지수바·브리핑·랭킹·업종테마·ETF·우측레일 + 검증·평가·HOT토론·뉴스 + placeholder shell) | ✅ |
| `/kr` | 한국주식 카드 5개 (Movers·Volume·NetBuy·단타공시·장타공시) | ✅ |
| `/us` | 미국주식 카드 4개 (Indices·M7·UsMovers·시계+시장상태) | ✅ |
| `/stock/[code]` | 종목 페이지 (좌 sticky 정보+차트 / 중 **탭 5종: 차트·시세 / 토론 / 뉴스 / 공시 / 인사이트** + 댓글 / 우 채팅 + 우측 fixed nav 48px) | ✅ |
| `/products` | 상품 디렉토리 (ETF·펀드·랩·리츠·채권 카테고리 필터) | ✅ |
| `/product/[id]` | 상품 평가 (좌 정보 / 중 평가 토론 PlatformDiscussionBoard) | ✅ |
| `/rooms` | 리딩방 디렉토리 (텔레그램·카카오·디스코드·유튜브 + 인증 마크) | ✅ |
| `/room/[id]` | 리딩방 평가 | ✅ |
| `/calendar` | 경제 캘린더 → Investing.com 외부 링크 안내 (허브 정체성) | ✅ |
| `/auth/login` | 카카오 로그인 UI | 🔴 활성화 사용자 작업 |
| `/auth/callback` | OAuth 콜백 | 🔴 |
| `/mypage` | 마이페이지 (V3 잔재 일부) | 🟡 |
| ~~/screener~~ | (STEP 133 제거 — 정체성 충돌) | — |

---

## 3. 운종 정체성 (V6 — 2026-06-03 확정)

> **운종 = "투자상품에 속지 않게 돕는 곳"** — 정확한 정보 + 솔직한 토론 + 검증된 신뢰
> 구조(네이버 레이아웃 + 토스 카드 + Trustpilot 평가)는 V5 계승, 중심축만 편의 → **신뢰**로 재정렬.

### V6 확정 결정 5개 (LOCK)
- **0 정체성 축**: "동선의 출발점(편의)" → "안 속는 곳(신뢰)"
- **① 평가 방식**: 토론 + 추천/비추천 + 사기의심 신고. 별점(star) ❌ (조작·명예훼손 소송 리스크 회피)
- **② 인증 뱃지**: 금융위(금감원) 신고번호 입력 → 자동 검증 → 뱃지. 운영자 임의 부여 ❌
- **③ 코인**: 제외 — 한국 주식으로 먼저 완성·증명 후 재논의
- **④ 정보 깊이 단계화**: 시세·차트·공시·뉴스 먼저 → 재무지표(ROE·부채비율 등 계산) 2단계 → 정밀 스크리너·분석 도구는 외부 링크

### 4박자 (정보·대화·허브·신뢰 — 신뢰가 중심축)
- **정보**: 본질만 (KIS·DART·Yahoo·RSS 9개 정확 카드 + 종목별 정보 핵심) — 디테일은 외부 (허브)
- **대화**: 정제된 채팅·토론·댓글 (모더레이션 + Tier)
- **허브**: /calendar 외부 링크 · 종목별 뉴스 외부 새 탭 · 운영자가 평가 X (사용자 토론)
- **신뢰**: Tier 1·2·3 시스템 + 신고 5건 자동 hidden + 카카오 OAuth 인증

### 운종이 안 하는 것 (의도된 제외)
- 거래 매매 (증권사 라이센스 X)
- 정밀 스크리너 (네이버·키움·FnGuide 영역)
- 영어판 (국가별 별도)
- 호가창·체결·거래원 동향 (전문가용)
- 컨센서스·목표주가·종목분석·리포트 (FnGuide 영역)

### 운종이 진짜 차별화 — MVP 2.0
- 상품·리딩방 **평가 디렉토리** (Trustpilot 금융 버전)
- Tier 인증 광고 (Sponsored ↔ 평가 명확 분리 — 추후)
- 정제된 종목 채팅·토론 (네이버 종토방 욕설·찌라시 대체)

---

## 4. 다음 STEP 후보 (우선순위 순)

| 순위 | 후보 | 의미 |
|------|------|------|
| — | ~~브리핑 overnight 안정화~~ ✅ STEP 145 · ~~지수 카드 스파크라인~~ ✅ STEP 144 | 완료 |
| ▶ | **V7 마켓 페이지 (STEP 152)** — 국내·미국 통합 + 네이버식 랭킹 테이블 · 상세 `docs/SITE_MAP_V7.md` | 네이버 복제 |
| 후 | 홈 레이아웃 비율 미세조정 (V7 후순위 보류) | 포털 완성도 |
| 2 | **인기글 예시 시드** (HotDiscussions·평가글 0건 → 초기 콘텐츠, '예시' 명확 표기) | 빈 섹션 채우기 |
| — | ~~외국인보유율·상장주식수 메타~~ ✅ STEP 147 완료 (외국인 소진율·상장주식수) | 정보 깊이 |
| 4 | **Sponsored 분리 UI** (광고 ↔ 평가 시각 분리) | MVP 2.0 신뢰 |
| 5 | **카카오 OAuth 활성화** (사용자 직접) | 추천/비추천 투표 실동작 전제 |
| 6 | **Vercel 배포 + unjong.com** (사용자 결정) | FSS cron 활성 + 출시 |

---

## 5. 즉시 확인할 파일

| 우선순위 | 파일 | 용도 |
|---------|------|------|
| 1 | `docs/NEXT_SESSION_START.md` (이 파일) | 가장 최신 |
| 2 | `docs/SESSION_KICKOFF.md` | 새 세션 즉시 시작 가이드 |
| 3 | `docs/PRODUCT_SPEC_V4.md` | 운종 V4 비전 (V5 는 본 파일·CHANGELOG 참조) |
| 4 | `docs/BRAND_IDENTITY.md` | 운종 브랜드 정체성 |
| 5 | `CLAUDE.md` | Cowork ↔ Claude Code 역할 분담 |
| 6 | `session-context.md` | TODO + 누적 결정사항 |
| 7 | `docs/CHANGELOG.md` | 세션별 변경 이력 |

---

## 6. 절대 잊지 말 것 (운종 결정사항)

- **운종 정체성 (V6)** = "투자상품에 속지 않게 돕는 곳" — 정보 + 대화 + 허브 + 신뢰 (중심축 = 신뢰)
- **거래 X** (증권사 라이센스 X)
- **영어판 X** (국가별 별도)
- **호가창·체결 X** (전문가용, 운종 페르소나 X)
- **스크리너 X** (네이버·키움·FnGuide 영역 — STEP 133 제거)
- **경제 캘린더** = 외부 (Investing.com) 링크 (허브 정체성)
- **종목 정보 디테일** = 본질만 (네이버 따라가지 X)
- **MVP 2.0** = 상품·리딩방 평가 (운종 진짜 사업)
- **한자 雲從 표기 X** (UNJONG + 운종 한글만)
- **5섹션 대시보드 → 제거** (STEP 117 dashboard 통째 삭제)
- **도메인**: 사용자 결정 후 (unjong.com 보류 중)

---

## 7. 운종 V5 디자인 시스템

- **폰트**: Pretendard Variable (CDN, 한국어 친화) + Playfair_Display 보조 (UNJONG 로고)
- **루트 폰트**: 16px (Tailwind 표준)
- **색상**:
  - 운종 brand: `#0F1E3D` primary · `#D4AF37` accent (기존 유지)
  - 토스 보조: `#3182F6` blue · `#F04452` red (하락) · `#1AC267` green (상승) · 회색 그라데이션
- **카드**: rounded-2xl + shadow-soft + p-5 + hover shadow 전환
- **컨테이너 max-w**: 1984px (토스 동일)
- **spacing**: gap-5 카드 그리드 · py-3·px-3 종목 행

---

## 8. 새 세션 시작 시 Cowork 액션

1. **이 파일 (NEXT_SESSION_START.md) 읽기** ← 가장 최신
2. `session-context.md` TODO 확인 (가비지 컬렉션)
3. `docs/CHANGELOG.md` 최근 변경 훑기
4. 사용자에게 오늘 할 P0 작업 제안 (Tier 인증·광고 분리·고아 청소·모바일 등)
5. 결정되면 → STEP 명령서 작성 → Claude Code 실행
