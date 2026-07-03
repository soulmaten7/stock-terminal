<!-- 2026-07-03 -->
# 렌즈 겉면 카피 (언어별 원본)

> **원칙**: 기법 *이름* = 영문 정식명칭(만국 공통 앵커). 그 아래 "이게 뭔데?" 설명은 **각 언어답게(직역 아님)** · 짧고 구체적 · 관용구/말장난 금지(번역 안전) · "처음 듣는 사람이 읽어도 이해되나?" 통과.
> TRAI가 본체가 되므로 이 카피 = 제품의 얼굴. 자동번역 금지, 언어별 큐레이션 품질.
> 코드 반영: `lib/lensCopy.ts`(언어 맵) → `lib/lenses.ts`·`app/stock/[symbol]/page.tsx`가 locale로 읽음. 기본 `ko`, `?lang=en` 지원. 다음 언어 = 일본어·중국어(시장 순서).

## Momentum (12-1) · 검증
- **ko**: 요즘 강하게 오른 종목이 계속 갈지 보는 방법 — 오르는 흐름이 이어지는 장에 잘 맞아요.
- **en**: Whether a stock that's been climbing keeps climbing — best when trends hold.

## Low Volatility (BAB) · 검증(방어)
- **ko**: 덜 출렁이는 안정적인 종목인지 보는 방법 — 하락장에서 방어적으로 유용해요.
- **en**: How steady (rather than jumpy) a stock is — handy for playing defense in down markets.

## Value (E/P · B/M) · 표본 약함
- **ko**: 버는 돈·가진 자산에 비해 주가가 싼지 보는 방법 — 길게 보는 투자에 잘 맞아요.
- **en**: Whether the price looks cheap next to a company's earnings and assets — suited to the long game.

## Piotroski F-Score · 건전성 해석
- **ko (what)**: 회사 재무가 튼튼한지 9가지로 점수 매기는 방법 — 부실한 회사를 거르는 용도예요(수익 예측은 아님).
- **en (what)**: Scores a company's financial health across 9 checks — a filter to weed out weak balance sheets (not a return forecast).
- **ko (미적용)**: 이 종목은 은행·보험이라 점수를 낼 수 없어요 — 그런 회사는 재무 구조가 보통 기업과 달라서요.
- **en (n/a)**: Can't be scored here — banks and insurers are built differently, so these checks don't apply.

## Technical (RSI · MA) · 참고용
- **ko**: 차트로 지금 과열인지·흐름이 위인지 보는 방법 — 현재 상태를 빠르게 훑는 참고용이에요.
- **en**: Reads the chart for overheating and which way the trend leans — a quick gut-check, for reference only.

---
## 알아보기(개념·유래)
> "알아보기" 접이식 개념 카피 **ko/en도 `lib/lensCopy.ts`의 `about`에 추가됨**(STEP 547). 편집·번역은 거기서(원문 길어 여기선 생략). 5개 기법(제가디시·티트만1993 / 저변동 이례현상 / 그레이엄·파마·프렌치 / 와일더1978 RSI / 피오트로스키2000) 모두 ko+en 완비.

---
> **다음 단계**: 남은 "자세히=검증" 텍스트도 언어별 맵으로(제일 깊음·후순위). 일본어·중국어는 이 틀에 열 추가.
