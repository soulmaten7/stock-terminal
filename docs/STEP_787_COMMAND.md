# STEP 787 — 렌즈 카드 초보 우선 재설계 (질문형 제목 `question` 신설 · 서사 상시 노출 · 접힘 제거)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)

**전제 상태**: STEP 786 커밋 `a447099` 이후 HEAD · 트리 클린

**배경(07-22 · 장은태 · 목업 승인)**: 타겟 실측 = 개인투자자 1,456만 중 4050이 45%, 20대 14% → **초보 = 전 연령 비전문가**(무료 제공이라 유입 다수). 경쟁 조사(Simply Wall St 스노우플레이크·Stockopedia 신호등·토스증권 "어려운 용어를 바꾸고 정보를 줄이고") + 핀테크 UX 표준("전문 용어를 평이한 말로, 정의를 붙여라") → 현행 카드는 학술 용어가 제목이라 비전문가에게 벽이고, 핵심(왜 이 판정인가)이 3중 접힘 뒤에 숨어 있음.

🔑 **아키텍처 결정(코드 전수 감사 결과)**: 렌즈 `name`("모멘텀")은 **6곳에서 문장·pill·프롬프트에 삽입**됨 — `Today.lensChangeLine`("{lensName} {from} → {to}")·`StockLens.learnMore`·`HorizonStrip` pill(폭 제약)·`LensPreview` 3열(truncate)·`ExploreClient` PosRankingBasis·**`app/api/brief/route.ts` LLM 프롬프트 팩트라인**. 따라서 **`name`을 바꾸지 말고 `question` 필드를 신설**해 카드 제목에서만 사용한다(문장 붕괴 6건 전부 회피).

**착수 전 필독**: `docs/LENS_DEV_PLAYBOOK.md` §0 + 문제해결 로그.

---

## 수정

### 1) `question` 필드 신설 (초보용 질문형 제목)

- `lib/lensCopy.ts`: `LensText`에 `question` 추가, **ko/en 7렌즈 전부** 작성(fscore 포함). `lensQuestion(loc, key)` 헬퍼 export(기존 `lensDisplayName` 옆).
- 문구(ko — 확정안, 그대로 사용):
  - momentum: `최근 오름세가 강한가?`
  - technical: `지금 흐름이 위인가, 아래인가?`
  - valuation: `버는 것에 비해 싼가?`
  - quality: `돈을 잘 버는 회사인가?`
  - assetgrowth: `몸집을 무리하게 불리지 않았나?`
  - lowvol: `가격이 많이 출렁이나?`
  - fscore: `재무가 튼튼한가?`
- en(패리티·질문형 유지·기존 en 어휘 톤과 정합):
  - `Is the recent uptrend strong?` / `Is the current trend up or down?` / `Is it cheap for what it earns?` / `Does it earn well?` / `Did it expand too fast?` / `Does the price swing a lot?` / `Are the financials solid?`
- **`name`·`nameEn`·`verdict.phrase`·`summary`는 byte 불변**(다른 화면 보호).

### 2) 카드 헤더 — 질문 우선, 학술명은 앵커로

`app/[locale]/stock/[symbol]/StockLensClient.tsx` L1120~1144(786에서 만든 모바일 2행 구조 유지):

- 1행 좌측: **`question`**(15px·font-medium·primary, 786 구조 그대로 줄바꿈 허용) / 그 아래 작은 줄(11px·muted): **`{name} · {nameEn}`**(예 `모멘텀 · Momentum (12-1)`) — 학술 앵커 보존(전문가 신뢰·브랜드 정체성).
- 1행 우측: 등급 배지 + 화살표(현행).
- 접힘 상태 2행(판정 문구 + headline)은 786 구조 유지.

### 3) 펼침 본문 — 질문에 답하는 순서로 재구성 + **접힘 전부 제거**

현행 펼침 순서(이게 뭐예요? → 판정 → 스펙트럼 → 이 기법 방향 → [접힘]알아보기 → 근거수치 → [접힘]자세히 → [접힘]왜 이 판정인가)를 아래로 **재배열**:

1. **판정 한 줄**(17px·tone 색) — 질문에 답하는 형태로 읽히도록 위치만 최상단(문구 자체는 기존 `verdict.phrase` 그대로).
2. **스펙트럼/게이지** + 하단 한 줄에 백분위(`시장 상위 N%`) — 현행 컴포넌트 재사용.
3. **서사(782/783 `LensNarrative`) 상시 노출** — `<details>` 제거, 본문에 그대로. 14px·leading 1.7.
4. **근거 한 줄**(11px muted): 수치 · 판정 컷 · 학술 계보 — 기존 `evidence` 목록 + `cutoffs` + 계보를 **한 문단으로 압축**.
5. **`about`(기법 일반 설명)·`note`(한계) 접힘 제거** → `about`은 서사에 흡수돼 중복이면 **표시 생략**, `note`(한계·각주)는 4번 아래 11px muted 한 줄로 상시 노출.
- 결과: **카드 내부 `<details>` 0개**. `StockLens.learnMore` 키는 미사용이 되면 제거(messages ko/en 동시 — 패리티 테스트).
- `L.summary`("이게 뭐예요?")는 질문형 제목과 역할이 겹치므로 **제거**(제목이 그 역할을 대신함). `LENS_COPY.what` 자체는 다른 소비처(LensPreview 등) 때문에 유지.

### 4) PC 2단 레이아웃 (lg+)

- 펼침 본문을 lg 이상에서 좌우 2단: 좌(질문·학술명·등급) / 우(판정·게이지·서사·근거). 모바일·태블릿은 세로 1단(786 구조).
- 구현은 `lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]` 등 기존 패턴 범위 내에서. **sm 이하 렌더 변화 최소**.

### 5) F-스코어 카드 동기화

- `FScoreCard`도 제목을 `question`(fscore)으로, 서사(783에서 넣은 `narrativeMethodFscore`) 상시 노출. 9항목 표시는 현행 유지(중복 노출 금지 원칙).

## 검증

1. `npx tsc --noEmit` 0 · `npm run test`
   - ⚠️ `lib/lenses.charac.test.ts` 인라인 스냅샷이 `question` 추가로 깨짐 → **의도된 변경**이므로 `vitest -u`로 갱신하고, 갱신 후 diff에서 **`name`/`nameEn`/`verdict.phrase`가 변하지 않았는지 눈으로 확인**(이게 이번 STEP의 안전 증거).
   - `i18n/messages.test.ts` ko/en 패리티 통과.
2. `npm run build`
3. 라이브(모바일 375px·PC 1280px): KR·US 종목 상세 — 7카드 제목이 질문형·아래 학술명 병기 · 펼치면 접힘 0(서사·한계까지 상시) · PC 2단 · `/en` 질문형 영어.
4. **회귀 확인(핵심)**: 오늘 화면 전환 문장(`{lensName} {from} → {to}`)·탐색 랭킹 근거 줄·시간축 pill·LensPreview 3열·AI 브리핑 문장이 **전부 기존 그대로**(= `name` 불변 증거).
5. `docs/LENS_DEV_PLAYBOOK.md` 문제해결 로그에 이번 교훈 1행 추가(“표시명은 소비처가 문장/pill/프롬프트까지 걸쳐 있으므로 rename 대신 용도별 필드 신설”).
6. 커밋:
   ```bash
   git add app/ components/ lib/ messages/ docs/
   git commit -m "STEP 787: beginner-first lens cards - question titles (new field), always-visible narrative, zero accordions, pc two-column"
   git push
   ```

## 완료 보고 → Cowork에게: 스냅샷 diff 요약(무엇이 바뀌고 무엇이 불변인지) + 라이브 확인 + 커밋 해시. (직후 788.)
