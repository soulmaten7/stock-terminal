# STEP 782 — 렌즈 계산 3단 공개 ① 파일럿: 모멘텀 렌즈 (요약→근거→계산 서사)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)
**⚠️ STEP 781 완료 후 실행**

**전제 상태**: STEP 781 커밋 이후 HEAD · 트리 클린

**결정(07-22 · 장은태 승인)**: R4 착수 = ① 렌즈 계산 3단 공개 ② 이메일 모닝 브리핑(784). 3단 공개는 **LENS_DEV_PLAYBOOK "하나씩 완전히" 원칙대로 모멘텀 렌즈 파일럿 먼저** — 구조 검증 후 783에서 6렌즈 확산. 근거 = Danelfin "Explainable AI·Scores Explanation"이 신뢰 장치의 업계 실증 + NN/g 단계적 공개(아코디언) 표준. **LLM 사용 금지 — 전부 결정론(값 + 템플릿).**

**착수 전 필독**: `docs/LENS_DEV_PLAYBOOK.md` §0 + 문제해결 로그(같은 함정 회피).

---

## 수정

### 1) 3단 구조 정의 (종목 상세 모멘텀 렌즈 카드)

- **1단 요약** = 현행 판정 라벨·스펙트럼 — **byte 불변**(이번 스코프는 추가만).
- **2단 근거** = 판정을 만든 실제 수치 목록: 12-1 수익률 값 · 시장 내 백분위 · 판정 컷 위치. **이미 계산되는 값 재사용**(`lenses.ts` detail 키·백분위) — 새 계산 발명 금지. API 응답에 없으면 기존 렌즈 응답 확장(새 API 금지).
- **3단 계산 서사** = 결정론 템플릿 문단(3~5문장 상한):
  - 방법 정의: "12-1 모멘텀은 최근 1개월을 제외한 12개월 수익률로 시장 전체를 줄 세웁니다" + 학술 계보(기존 `lensCopy.ts`·/about 문구와 용어 정합 — 새 표현 발명 금지).
  - 이 종목 대입: "이 종목은 상위 N%로 '<현행 판정 라벨>'에 해당합니다" — 값 삽입 템플릿.
  - 예측·추천 뉘앙스 절대 금지(멍거 톤 유지). 마무리는 기존 "판단은 당신" 문법.

### 2) UI — 단계적 공개(아코디언)

- 카드 내 트리거: "왜 이 판정인가 ▸"(44px 터치 타깃·기존 상세의 펼침 패턴 있으면 그 컴포넌트 재사용). 펼치면 2단(수치 리스트) + 3단(서사 문단) 순.
- 접힘 기본값 = 닫힘(1단만 노출 — 기존 화면 밀도 불변). 모바일·PC 동일 구조.
- 값 결측 시 정직 결측: "데이터 부족" 현행 문법·서사 생략.

### 3) i18n

- ko/en 패리티(서사 템플릿 양 언어 작성 — en은 기존 en lensCopy 어휘 재사용·ICU 아포스트로피 함정 주의). messages 패리티 테스트 통과.

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build`
2. 라이브: 삼성전자·US 종목(예: AAPL) 상세 모멘텀 카드 — 접힘 기본·펼침 시 근거 수치+서사·값이 화면 다른 곳(백분위 등)과 일치 · 다른 6렌즈 카드 byte 불변 · `/en` 영어 서사.
3. **LENS_DEV_PLAYBOOK 로그**: 이 STEP에서 문제·교훈 생기면 즉시 한 행 추가(몰아서 금지).
4. 커밋:
   ```bash
   git add app/ components/ lib/ messages/ docs/STEP_782_COMMAND.md
   git commit -m "STEP 782: lens 3-tier explanation pilot on momentum - deterministic evidence + method narrative, accordion"
   git push
   ```

## 완료 보고 → Cowork에게: 펼침 상태 스크린 기준 확인 + 커밋 해시. (장은태 톤 판정 후 783 확산.)
