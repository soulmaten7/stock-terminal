# STEP 783 — 렌즈 계산 3단 공개 ② 확산: 나머지 6렌즈

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)
**⚠️ STEP 782 완료 + 장은태 파일럿 톤 승인 후 실행** (승인 전 착수 금지)

**전제 상태**: STEP 782 커밋 이후 HEAD · 트리 클린

---

## 수정

### 1) 782 구조를 6렌즈로 확산 (컴포넌트·문법 재사용 — 새 UI 발명 금지)

대상: **저변동성 · 밸류(가치) · 퀄리티 · 자산성장 · 기술(RSI) · F-스코어**. 각각:

- **2단 근거** = 해당 렌즈의 실제 판정 입력값(`lenses.ts` detail 키/백분위/스코어 구성요소) — 렌즈마다 무엇이 판정을 만들었는지 코드에서 확인 후 매핑(추측 금지).
- **3단 서사** = 방법 정의 + 학술 계보(기존 lensCopy·/about 문구 정합: 그레이엄·파마-프렌치·노비-마르크스 2013·피오트로스키 2000·와일더 1978) + 이 종목 대입. 3~5문장 상한·예측/추천 금지.
- F-스코어는 9항목 구성이 이미 화면에 있으면 중복 노출 금지 — 서사만 추가하고 근거는 기존 표시를 가리키는 형태로(과적재 금지).

### 2) 스코프 제외

- ETF 뷰("상품 구성")는 제외 — 주식 렌즈 카드만.
- 1단(기존 판정·스펙트럼) byte 불변 원칙 유지.

### 3) i18n — 6렌즈 × ko/en 전부 패리티. 용어는 기존 en lensCopy 재사용.

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build`
2. 라이브: KR·US 종목 각 1개에서 7렌즈 전부 펼침 확인(값 정합·서사 렌더·결측 렌즈는 정직 결측) · `/en` 스팟 3렌즈.
3. **LENS_DEV_PLAYBOOK 로그** — 렌즈별 함정 발견 시 그 자리에서 기록(조건부 서술).
4. 커밋:
   ```bash
   git add app/ components/ lib/ messages/ docs/STEP_783_COMMAND.md
   git commit -m "STEP 783: lens 3-tier explanation rollout to remaining six lenses"
   git push
   ```

## 완료 보고 → Cowork에게: 렌즈별 근거 값 매핑 요약 + 커밋 해시.
