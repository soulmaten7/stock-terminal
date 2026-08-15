<!-- 2026-07-15 -->
# /about 개선 카피 초안 (ko + en) — 검토용

> **목적**: 얇은 소개글을 유료 플랫폼 표준 골격(문제 → 접근 → **방법 투명화** → 비추천 → 신뢰 → 사용법)으로 채운다. 최대 신설 = **TR-AI 렌즈를 여는 섹션**(실제 7렌즈 + 학술 계보 — `lensCopy.ts` 실제 값 기반, 과장 0). 멍거 건조 톤 유지.
> **읽는 법**: 각 섹션 = 새 메시지 키. ko 원본 / en 병행. 승인/수정 주시면 STEP으로 반영(ko.json+en.json+page.tsx). 링크로 표시된 이론가(그레이엄·피오트로스키 등)는 실제 lensCopy 계보라 사실.

---

## 히어로 (유지)
- **title** — ko `트릴리언 소개` / en `About Trillion`
- **slogan** — ko `종목을 보는 눈을, 누구에게나.` / en `An eye for stocks, for everyone.`
- **sub** — ko `모든 시각을 데이터로 — 판단은 당신입니다.` / en `Every angle, as data — the judgment stays yours.`

---

## §1. 문제 (신설) — `problemTitle` / `problemBody`
**ko**
> **왜 트릴리언인가**
> 투자 정보는 흩어져 있고, 시장은 예측과 추천으로 시끄럽습니다. 리딩방은 "오를 종목"을 팔고, 유료 툴은 방법을 블랙박스에 숨깁니다. 그 사이에서 개인은 결국 남의 말에 기대게 됩니다.
> 문제는 정보가 부족한 게 아닙니다. 정보를 **제 눈으로 읽을 도구**가 없다는 것입니다. 누군가 종목을 확신하며 팔 때, 먼저 봐야 할 건 그 확신이 아니라 그의 인센티브입니다.

**en**
> **Why Trillion**
> Investment information is scattered, and the market is loud with predictions and tips. Chat rooms sell you "the stock that will go up"; paid tools hide their method inside a black box. In between, individuals end up leaning on someone else's word.
> The problem isn't too little information. It's the lack of a tool to read it **with your own eyes**. When someone sells you a stock with great confidence, the first thing to look at isn't the confidence — it's their incentive.

---

## §2. 우리 답 = 3기둥 (유지·정제) — `pillar.*`
**ko**
- **무기 — 기관급 분석을 개인 손에.** 기관이 오래 검증해 온 분석의 눈(TR-AI 렌즈)을, 그대로 개인의 손에 쥐어드립니다.
- **직시 — 정직한 1차 재료.** 시세·뉴스·공시를 가공 없이. 데이터가 없으면 지어내지 않고 "데이터 부족"이라 말합니다.
- **자립 — 분석은 우리가, 판단은 당신이.** 사고팔 신호를 대신 내리지 않습니다. 검증된 시각을 나란히 놓아드릴 뿐입니다.

**en**
- **Arm — institutional-grade analysis, in your hands.** The analytical lenses institutions have long relied on (the TR-AI lens), handed to you as they are.
- **See — honest, first-hand material.** Prices, news, and filings, unprocessed. When the data isn't there, we don't invent it — we say "insufficient data."
- **Compete — we do the analysis; you make the call.** We never issue a buy or sell signal for you. We only set proven viewpoints side by side.

---

## §3. TR-AI 렌즈 — 이렇게 봅니다 (⭐ 신설·핵심) — `lensTitle` / `lensIntro` / `lens.*` / `lensClose`
**ko**
> **TR-AI 렌즈 — 어떤 눈으로 읽나**
> 한 종목을, 검증된 기법 여러 개로 각각 읽습니다. 각 렌즈는 딱 한 가지 질문에만 정직하게 답합니다 — 그리고 무슨 지표로, 누구의 이론에 기대 보는지 화면에 그대로 적어둡니다.
>
> - **모멘텀** — 추세가 이어지고 있나. (추세 지속 효과)
> - **밸류(가치)** — 이익·자산 대비 싼가. (벤저민 그레이엄의 가치투자 · 파마-프렌치가 데이터로 밝힌 밸류 프리미엄)
> - **퀄리티** — 자산을 이익으로 잘 바꾸나. (노비-마르크스 2013 · 총이익÷자산)
> - **F-스코어** — 재무가 부실하지 않나. (피오트로스키 2000 · 9점 재무건전성 체크리스트)
> - **저변동성** — 흔들림 대비 꾸준한가. (저변동성 이상현상)
> - **자산성장 · 기술** — 과잉 투자·과열 신호. (RSI — 와일더 1978 · 이동평균)
>
> 숨기지 않습니다. 블랙박스가 아니라, 열어 보이는 렌즈입니다. 렌즈마다 근거 수치를 함께 보여주고, 데이터가 없으면 그 렌즈는 "데이터 부족"이라 말합니다.

**en**
> **The TR-AI lens — how we read a stock**
> We read one stock through several proven methods, each on its own. Every lens answers just one honest question — and writes down, right on the screen, which metrics it uses and whose research it leans on.
>
> - **Momentum** — is the trend持续ing? (trend persistence)
> - **Value** — is it cheap against earnings and assets? (Benjamin Graham's value investing · the value premium Fama & French established in the data)
> - **Quality** — how well does it turn assets into profit? (Novy-Marx 2013 · gross profits ÷ assets)
> - **F-Score** — is the balance sheet weak? (Piotroski 2000 · a 9-point financial-health checklist)
> - **Low Volatility** — steady per unit of risk? (the low-volatility anomaly)
> - **Asset Growth · Technical** — over-investment and overheating signals. (RSI — Wilder 1978 · moving averages)
>
> Nothing is hidden. Not a black box — a lens we open. Each lens shows the numbers behind it, and when the data isn't there, that lens simply says "insufficient data."

> ⚠️ **빌드 시 확인**: 위 7렌즈·계보는 `lib/lensCopy.ts` 실제 값과 대조해 100% 정합시킴(과장·허위 렌즈 금지). "持续ing" 오타는 en 최종본에서 "continuing"으로.

---

## §4. 예측·추천 안 합니다 (⭐ 각주 → 헤드라인 승격) — `noRecTitle` / `noRecBody`
**ko**
> **예측도, 추천도 하지 않습니다.**
> "이 종목 사라"는 신호는 여기 없습니다. 렌즈는 확신이 아니라 근거를, 결론이 아니라 재료를 드립니다. 검증된 시각 여럿을 나란히 놓아드릴 뿐, 사고팔 결정은 온전히 당신 몫입니다.
> 좋은 도구는 대신 판단해 주지 않습니다. 더 나은 판단을 도울 뿐입니다.

**en**
> **We don't predict, and we don't recommend.**
> There is no "buy this stock" signal here. A lens hands you evidence, not certainty; material, not a conclusion. We set several proven viewpoints side by side — the decision to buy or sell is entirely yours.
> A good tool doesn't make the call for you. It only helps you make a better one.

---

## §5. 어디까지 봅니다 (신설·신뢰 신호) — `coverageTitle` / `coverageBody`
🔴 **2026-08-15(STEP1039) 정정 — 아래 "6개 시장" 문구는 2026-08-08 「🇺🇸🔒 전면 US 단독」 규칙 이전에 쓰여 낡았다.** 실제 신규 카피로 쓰기 전 US 기준으로 다시 써야 한다(내용 삭제하지 않고 표시만).
**ko**
> **어디까지 보나**
> 한국 · 미국 · 일본 · 중국 · 베트남 · 영국 — 6개 시장. 각 시장의 시세·뉴스·공시 같은 1차 재료를 공개된 출처에서 받아 그대로 보여줍니다. 우리가 값을 지어내지 않습니다. 받은 그대로가 이상해 보여도, 우리 짐작으로 지우지 않습니다.

**en**
> **How far we look**
> Korea · United States · Japan · China · Vietnam · United Kingdom — six markets. For each, we take first-hand material — prices, news, filings — from public sources and show it as it is. We don't invent values. And when the data looks odd, we don't erase it on a hunch.

---

## §6. 이렇게 씁니다 (유지·심화) — `howTitle` / `step1..3`
**ko**
> **이렇게 씁니다**
> 1. **종목을 고르고, 렌즈를 봅니다.** 한 종목이 모멘텀·밸류·퀄리티·재무건전성 등 여러 렌즈에서 각각 어떻게 읽히는지 한눈에.
> 2. **엇갈림을 읽습니다.** 렌즈끼리 다르게 말할 때가 가장 중요한 신호입니다 — 싸지만 부실한가, 비싸지만 튼튼한가.
> 3. **당신이 판단합니다.** 재료를 모았으니, 결론은 당신 몫입니다. 우리는 대신 눌러주지 않습니다.

**en**
> **How to use it**
> 1. **Pick a stock, read the lenses.** See at a glance how one stock reads through momentum, value, quality, financial health, and more — each on its own.
> 2. **Read the disagreement.** When the lenses disagree is the most important signal — cheap but weak, or pricey but sturdy?
> 3. **You make the call.** The material is gathered; the conclusion is yours. We don't press the button for you.

---

## 인용 + 면책 (유지) — `quote` / `quoteAuthor` / `disclaimer`
- **quote** — ko/en 공통 취지: *"한 인간이 할 수 있는 가장 좋은 일은, 다른 인간이 더 많이 알도록 돕는 것이다."* / *"The best thing a human being can do is to help another human being know more."*
- **quoteAuthor** — `찰리 멍거` / `Charlie Munger`
- **disclaimer** — 기존 유지(투자자문 아님·정보 제공·판단과 책임은 이용자). ko/en 각각.

---

## 새 페이지 순서 (page.tsx)
히어로(title·slogan·sub) → §1 문제 → §2 3기둥(카드) → **§3 렌즈 방법(핵심 블록)** → §4 비추천(강조 블록) → §5 커버리지 → §6 사용법 3스텝 → 멍거 인용 → 면책.
읽기폭 `max-w-3xl` 유지. 멍거 톤·정직·과장 0 원칙 유지.
