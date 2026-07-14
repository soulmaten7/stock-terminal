<!-- 2026-07-14 -->
# STEP 710B — i18n 3/3단계 (b: 영어 로케일 + en.json)

**실행:** 🔴 **Opus 권장** — `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`
(영어 브랜드 보이스 + **영어 아포스트로피 ICU 함정** + 키 패리티 — 판단 필요. `/clear` 후 시작.)
**목표:** `'en'` 로케일을 켜고 `messages/en.json`(ko.json 전 키의 영어판) 추가 → **`/en/…` 직접 방문 시 영어 렌더**, `/`(ko)는 그대로. **링크 스왑·스위처·시장 디폴트는 710C**(이번 X).
**전제:** STEP 710A 완료(`70328e8`).

---

## 작업 범위
1. `i18n/routing.ts`: `locales: ['ko','en']` (defaultLocale `'ko'`·localePrefix `'as-needed'` 유지 → ko는 프리픽스 없음, en은 `/en` 프리픽스).
2. `messages/en.json` 신규 — **ko.json의 모든 키를 1:1로**(키 구조·개수 완전 동일), 값만 영어.
3. 검증: `/en`·`/en/about`·`/en/advertise`·`/en/coin` 등 영어 렌더 / `/`·`/about` 한국어 그대로 / 양쪽 `IntlError`·MISSING 0.

## ⚠️ 함정 1 — 키 패리티 (MISSING 방지)
`en.json` 키 집합이 `ko.json`과 **완전히 동일**해야 함(누락 시 `/en`에서 MISSING_MESSAGE, 초과 시 죽은 키). **프로그램으로 키 diff** 떠서 0 확인(중첩 키까지). 순서는 무관, 집합이 같아야.

## ⚠️ 함정 2 — 영어 아포스트로피 = ICU 함정 (이게 이번 최대 위험)
ICU에서 작은따옴표(`'`)는 escape 문자. **영어는 아포스트로피 천지**(don't·you're·we'll·everyone's) → 그대로 넣으면 렌더가 깨지거나 글자가 사라짐.
- **원칙: 축약형 쓰지 말 것**(do not / we do not / it is). 건조한 멍거 톤과도 맞고 함정도 피함. ← 기본 전략.
- 소유격 등 불가피한 `'`가 남으면 `createTranslator`로 **렌더 출력에 `'`가 살아있는지** 반드시 확인(709C에서 하던 방식).

## ⚠️ 함정 3 — 플레이스홀더·리치태그·역방향 라벨 보존
- `{n}`·`{src}`·`{v}` 등 플레이스홀더, `<br>` 등 리치태그 **그대로**(영어 문장 안에서 위치만 자연스럽게).
- 709D의 의도적 역방향 aria 라벨(오름/내림)은 **로직이 코드에 있음** → en.json은 두 라벨만 영어로("Ascending"/"Descending"), 매핑 건드리지 말 것.
- DB로 가는 값(709E·709F 신고 사유·intent·slot)은 애초에 ko.json에 **label 키만** 있음 → 그 label만 영어. value 상수는 코드에 남아 무관.

## 🔒 브랜드 보이스 잠금 (아래 영어를 그대로 — 이 문자열들은 Cowork이 확정)
멍거 톤 = **건조·직설·과장 없음.** 마케팅 형용사 금지.
- 슬로건 `종목을 보는 눈을, 누구에게나.` → **"An eye for stocks — for everyone."**
- 서브 `모든 시각을 데이터로 — 판단은 당신입니다.` → **"Every lens, as data — the judgment is yours."**
- 멍거 각인(한국어는 번역, 영어는 **원문 그대로**) → **"The best thing a human being can do is to help another human being know more."**
- 3기둥: `기관급 분석`→**"Institutional-grade analysis"** · `정직한 데이터`→**"Honest data"** · `당신의 판단`→**"Your judgment"**
- 기둥 설명(about):
  - `기관이 쓰는 분석의 눈을 개인 손에. TR-AI 렌즈가 모멘텀·밸류·퀄리티 등 검증된 기법으로 종목을 읽어드려요.` → **"The analytical eye institutions use, in individual hands. The TR-AI Lens reads stocks through proven methods — momentum, value, quality, and more."**
  - `시세·뉴스·공시를 1차 재료 그대로. 데이터가 없으면 지어내지 않고 "데이터 부족"이라 말합니다.` → **"Prices, news, and filings as primary material. When data is missing, we do not invent it — we say \"insufficient data.\""**
  - `사고팔 신호는 없습니다. 검증된 시각을 나란히 놓아드릴 뿐, 결정은 당신 몫이에요.` → **"No buy or sell signals. We lay proven lenses side by side; the decision is yours."**
- 엔진: `TR-AI 렌즈`→**"TR-AI Lens"** · `AI 렌즈`→**"AI Lens"** (브랜드명 유지)
- 정직 표시: `데이터 부족`→**"Insufficient data"** · `재무 데이터 없음`→**"No financial data"** · `사고팔 신호가 아니라, 스스로 판단할 재료예요`→**"Not a buy or sell signal — material for you to judge for yourself."**
- 탭/분류: `종목`→**"Stocks"** · `정보`→**"Info"** · `검증`(구)→ n/a · `유사투자자문사`→**"Investment advisory firms"** · `증권사`→**"Brokerages"**
- 섹션(종목 상세): `시간축으로 한눈에`→**"At a glance, over time"** · `최근 중대 공시`→**"Recent material filings"** · `이 종목 브리핑`→**"Briefing"** · `상품 구성`→**"Holdings"** · `상품 정보`→**"Product info"** · `이렇게 봅니다`→**"How we read it"**
- 배지: `참고`→**"Reference"** · `재무·팩터`→**"Financials · factors"** · `AI 분석 아님`→**"Not AI analysis"** · `원문 기반`→**"Source-based"**
- 보드 컬럼/기간: `종목명`→**"Name"** · `현재가`→**"Price"** · `등락`→**"Change"** · `거래대금`→**"Turnover"** · 기간 `1일전/1주일전/1개월전/3개월전/6개월전/1년전`→**"1D / 1W / 1M / 3M / 6M / 1Y"** · 세그먼트 `전체/코스피/코스닥`→**"All / KOSPI / KOSDAQ"** · `상한/하한`→**"Limit up / Limit down"**
- 공통 버튼: `이전/다음`→**"Prev / Next"** · `저장/취소`→**"Save / Cancel"** · `검색`→**"Search"** · `로그인`→**"Sign in"** · `관심종목 추가/해제`→**"Add to watchlist / Remove from watchlist"**

**그 외 기계적 문자열**(폼 라벨·안내·에러 등)은 위 보이스와 **금융 표준 영어** 관례로 자연스럽게. 확신 안 서는 브랜드성 문구는 임의 창작 말고 위 톤에 맞춰 보수적으로.

## 작업 순서
1. `/clear` 후 시작. ko.json 전체 구조 파악.
2. routing.ts에 `'en'` 추가.
3. en.json 작성 — 키 1:1, 위 잠금 문자열 그대로, 나머지 표준 영어, 축약형 회피(아포스트로피 함정), 플레이스홀더/리치태그 보존.
4. **키 패리티 스크립트**로 ko↔en 키 diff 0 확인. `createTranslator`로 아포스트로피 든 영어 문자열 렌더 확인.
5. `npm run build` + tsc 0 + vitest. dev(3333): `/en`·`/en/about`·`/en/advertise`·`/en/coin`·`/en/mypage` **영어 렌더**, `/`·`/about` **한국어 그대로**, 양쪽 `IntlError`·MISSING **0**, 플레이스홀더 raw 노출({n} 등) 없음.
6. 커밋:
```bash
git add -A && git commit -m "i18n(3/3b): 'en' 로케일 + messages/en.json (키 1:1·브랜드 보이스 잠금·아포스트로피 회피·ko 무변경)" && git push
```

## 다음
- **710C:** 헤더 언어 스위처 + 내부 링크를 `i18n/navigation`으로 스왑(로케일 유지) + **en→US 시장 디폴트 정렬** + `generateMetadata`(709F에서 넘긴 title·JSON-LD 로컬라이즈). ← 영어를 "쓸 수 있게" 만드는 마지막 UX 조각.
