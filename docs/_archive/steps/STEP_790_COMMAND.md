# STEP 790 — 종목명 ADR/중복 토큰 정리 + 상단 안내 4→1 통합

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)

**전제 상태**: STEP 789 커밋 `4b77d2e` + 문서 커밋 `48b3a38` 이후 HEAD · 트리 클린

**배경(07-22 · 폰 실물)**: 종목 상세 첫 화면이 과밀. 원인 2가지 — ① 종목명이 원본 그대로("RELX PLC **PLC American Depositary Shares (Each representing One Ordinary Share)**")라 제목이 3줄 점유(776 `cleanUsName`이 title-case·꼬리 트림만 하고 ADR 수식어·중복 토큰 미처리) ② 본문 전에 **"추천 안 함" 메시지가 4번** 반복(배지 부제 · "종합 매수·매도 점수는 없습니다·판단은 당신" · "사고팔 신호가 아니라…" · 브리핑 푸터) → 정체성이 소음이 되고 데이터가 스크롤 밖으로 밀림.

---

## 수정

### 1) `lib/usNameFormat.ts` — ADR/주식종류 수식어 제거 + 중복 토큰 정리

- **수식어 절단**: 이름 뒤에 붙는 주식종류/예탁증서 수식어를 제거. 대상 패턴(대소문자 무시, **해당 구절부터 끝까지 절단**):
  `American Depositary Share(s)` · `American Depository Share(s)` · `Each representing …`(괄호 포함) · `Ordinary Share(s)` · `Common Stock` · `Class A/B/C Common Stock` · `Depositary Share(s)` · `Represent(ing|s) …` · `New York Registry Share(s)` · `Series [A-Z] Preferred …`
  - ⚠️ **선행 조건**: 절단 후 남는 이름이 **비어 있거나 2자 미만이면 절단하지 않음**(원본 유지 — 이름 증발 방지).
  - 괄호 블록 `(...)`이 수식어만 담고 있으면 통째 제거.
- **중복 토큰 정리**: 연속 중복 법인형 토큰 축약(`PLC PLC` → `PLC`, `Inc. Inc.` → `Inc.`) — **연속(인접)일 때만**. 비인접 중복은 손대지 않음(고유명사 오손 방지).
- 기존 규칙(title-case·`KEEP` 약어 보존·꼬리 대시 트림·mixed-case 무영향)은 **불변**.
- **🔴 754b 교훈 준수 — 제거 목록 눈 감사 필수**: 스크립트로 `data/us_symbols.json`(또는 us 유니버스) 전체에 새 규칙을 적용해 **변경되는 이름 전부를 before→after 목록으로 출력**하고, 그중 **잘못 잘린 사례가 없는지 육안 확인 후 진행**(보고에 샘플 20건 + 총 변경 건수 기재). 이름이 사라지거나 회사가 식별 불가해지는 케이스가 하나라도 있으면 규칙을 좁힐 것.
- 유닛 테스트 추가(`lib/usNameFormat.test.ts`): RELX 케이스 · `Class A Common Stock` · 괄호 수식어 · 절단 후 빈 문자열 방지 · 기존 케이스 회귀(IBM·3M·eBay·JPMorgan) 통과.

### 2) 종목 상세 상단 안내 4→1 통합

`app/[locale]/stock/[symbol]/StockLensClient.tsx` 헤더 영역:

- **남길 1줄**: `사고팔 신호가 아니라, 스스로 판단할 재료입니다.` + 같은 줄 끝에 **`읽는 법 ▾`**(기존 "이 화면 읽는 법 · 신뢰도 등급" 펼침을 이 링크로 통합 — 내용은 불변).
- **제거**: ① 배지 옆 부제(`headerNote` "검증된 기법으로 이 종목을 읽는 여러 관점") ② `종합 매수·매도 점수는 없습니다 · 판단은 당신` 줄 ③ 브리핑 카드 푸터의 `방향 판단은 하지 않아요` 문구(브리핑 카드의 `TR-AI · 사실만` 배지는 유지 — 출처 표기이므로).
  - ⚠️ **"판단은 당신"이라는 핵심 문구는 완전히 사라지면 안 됨** — 남기는 1줄이 그 역할을 하고, 788 닫는 카드 푸터(`사실만 정리했습니다 · 판단은 당신`)도 그대로 유지되므로 페이지 상·하단에 각 1회 배치되는 구조.
- 미사용이 된 i18n 키는 messages ko/en **동시** 정리(패리티 테스트). `/about`·법무 문구는 **손대지 말 것**.
- 종목명 `<h1>`은 정리된 이름이 짧아지므로 현행 스타일 유지(별도 조정 불필요 — 3줄 → 1줄 자연 해소 확인).

## 검증

1. `npx tsc --noEmit` 0 · `npm run test`(신규 이름 테스트 + 패리티) · `npm run build`
2. **이름 감사 산출물**: 변경 총 건수 + 샘플 20건 before→after(보고에 기재). 오절단 0 확인.
3. 라이브: RELX 상세 — 제목 `RELX PLC` 1줄 · 오늘/탐색/검색 리스트에서도 같은 이름 · 기존 정상 종목명(Apple Inc.·JPMorgan Chase & Co. 등) 불변.
4. 라이브 모바일 375px: 상단 안내 1줄만 · `읽는 법 ▾` 펼침 정상 · 브리핑 카드가 첫 화면에서 더 일찍 보임 · 하단 788 카드 푸터 "판단은 당신" 유지.
5. `/en` 확인(영어 문구도 1줄 통합).
6. 커밋:
   ```bash
   git add app/ components/ lib/ messages/ docs/STEP_790_COMMAND.md
   git commit -m "STEP 790: strip ADR/share-class suffixes and duplicate tokens from US names, consolidate stock header notices"
   git push
   ```

## 완료 보고 → Cowork에게: 이름 변경 건수 + 샘플 20건 + 라이브 확인 + 커밋 해시.
