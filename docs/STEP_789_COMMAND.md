# STEP 789 — 787/788 마감 검수 3건 (PC 중복 제거 · "이 기법 방향" 흡수 · F-스코어 헤더 정리)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)

**전제 상태**: STEP 788 커밋 `9c43b94` 이후 HEAD · 트리 클린

**배경(07-22 · Cowork 코드 3차 검수)**: 787/788 적용 후 코드 리뷰에서 3건 발견. ①은 실제 중복 버그(폰으로만 봐서 미발견), ②③은 접힘 제거 후 도드라진 과밀.

---

## 수정

### 1) 🔴 PC 펼침 카드 질문 중복 제거 (필수)

- 현상: `StockLensClient.tsx` 카드 헤더(L1115 `lensQuestion` + L1117 `{L.name} · {L.nameEn}` + L1122 등급 배지)는 **항상 렌더**되는데, 787에서 추가한 lg 전용 좌측 리캡(L1154~1158)이 **같은 3가지를 다시 표시** → PC(1280px)에서 카드 펼치면 질문·학술명·등급이 두 번 보임.
- 조치: **좌측 리캡(L1154~1158) 제거**하고, lg 2단 그리드는 유지하되 좌우 배분을 재정의:
  - 좌(약 1fr): **판정 문구 + 게이지/스펙트럼**(시각 요약)
  - 우(약 1.5fr): **서사 + 근거 한 줄 + 한계(note)**(읽는 텍스트)
  - 이유: 헤더가 이미 "무엇을 보는 렌즈인가"를 말하므로, 펼침 본문은 "결과(좌)와 설명(우)"으로 나누는 게 정보 위계에 맞음.
- 모바일·태블릿(lg 미만) 렌더는 **현행 그대로**(세로 1단·786 구조 불변).

### 2) "이 기법 방향"(outlook) → 서사에 흡수

- 현상: 펼침 본문에 `lensDirection`("이 기법 방향" + `L.outlook`)과 `LensNarrative` 서사가 나란히 놓여 **같은 성격의 설명이 2번**(접힘 제거로 드러남).
- 조치: **카드 펼침에서 `lensDirection` 블록 제거**(L1168~1173). 단 `L.verdict.plain` 폴백 경로(outlook 없을 때 표시)는 **유지** — 서사가 없는 렌즈/결측 케이스의 안전망.
  - ⚠️ `LENS_OUTLOOK` 데이터·`lensDirection` i18n 키는 **삭제하지 말 것**(다른 소비처 확인 후 미사용이면 그때 정리 — 이번 STEP은 표시만 제거).
  - 서사가 `null`을 반환하는 렌즈(결측)에서는 본문이 비지 않도록 폴백이 실제로 뜨는지 확인.

### 3) F-스코어 카드 헤더 정리

- 현상: 다른 6장은 "질문 + `{name} · {nameEn}`" 2줄인데 F-스코어는 질문 + `Piotroski F-Score` + 배지 + 태그라인 + `fscore.subtitle`("F-스코어 · 재무 건전성")로 5겹.
- 조치: 다른 카드와 **동일한 2줄 문법**으로 축약 — 질문(`lensQuestion(locale,'fscore')`) + `F-스코어 · Piotroski F-Score` 한 줄. 배지(`fscore.badge`)는 다른 카드의 등급 배지와 같은 위치(우측)로, **태그라인·subtitle은 헤더에서 제거**(펼침 본문에 이미 설명 있음 — 없으면 본문 상단으로 이동).
- 미지원 종목 분기(L312~317)도 같은 2줄 문법으로 통일.
- 미사용이 된 i18n 키는 messages ko/en **동시** 정리(패리티 테스트).

## 검증

1. `npx tsc --noEmit` 0 · `npm run test`(패리티 포함) · `npm run build`
2. 라이브 **PC 1280px**: 카드 펼침 시 질문·학술명·등급이 **각 1회만** · 좌=판정/게이지, 우=서사/근거/한계 2단 · "이 기법 방향" 블록 소멸(중복 없음).
3. 라이브 **모바일 375px**: 786/787 대비 렌더 변화 없음(세로 1단 유지) · 서사 정상 · 결측 렌즈(예 KB금융 퀄리티 `na`)에서 본문 비어 보이지 않음.
4. F-스코어 카드가 다른 6장과 같은 헤더 리듬인지 KR·US 각 1종목 확인 · 미지원 종목(F-Score unsupported) 화면도 확인.
5. `/en` 양쪽 폭 스팟 확인.
6. 커밋:
   ```bash
   git add app/ components/ lib/ messages/ docs/STEP_789_COMMAND.md
   git commit -m "STEP 789: remove pc header duplication, fold outlook into narrative, tidy f-score card header"
   git push
   ```

## 완료 보고 → Cowork에게: PC/모바일 확인 결과 + 제거한 i18n 키 목록 + 커밋 해시.
