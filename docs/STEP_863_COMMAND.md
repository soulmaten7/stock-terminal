# STEP 863 — DoD **항목 3을 ✅로**: 원전 사례를 끝까지 찾는다

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`

**전제 상태**: STEP 862 커밋 `702a86c`(코드 HEAD `39ced5f`) 이후 HEAD · 트리 클린

**착수 전 필독**: 🔴 `CLAUDE.md` **🚫 창작 금지**·⓪·⓪-3 · `docs/LENS_COMPLETION_STANDARD.md` 역DCF `3) 값 검증` · `data/sources/`

---

## 0. 성격

🔴 **항목 3만.** ✅가 될 때까지 다음 항목 금지. 끝나면 멈추고 보고.
🔴 코드·화면·DB 변경 0(신규 원본 저장은 허용). 플래그 OFF.
🔴 **⓪-3 준수.**

**860의 판정 오류**: *"아직 못 찾은 게 아니라 원리적으로 어렵다"* 라고 결론냈으나 —
🔴 **근거가 부족했다.** 확보한 책 텍스트(122K자)는 **서문~4장 수준**이고, **5장(How to Estimate Price-Implied Expectations)·6·7장(기회 식별·매매 판단)이 빠져 있다.** 도미노 언급이 2회(서문·1장)뿐이고 사례 챕터를 못 봤다.
→ **원전에 추가 워크드 예제가 있는지 확인하지 않은 채 "원리적 한계"라 단정했다.**

**기준 원문**: *"3. 값 검증 — 손계산 + **외부 독립 출처** 대조(최소 3종목·자릿수 아니라 값). 차이 나면 원인 규명."*

---

## §1 — 🔴 원전 사례 전수 탐색 (최우선)

목표: **도미노 외에 MIFP·PIE 수치가 제시된 사례**를 찾는다. 찾으면 그게 곧 대조 종목이다.

**탐색처 (전부 시도하고 각각 결과 기재)**
1. **이미 가진 원본** — `data/sources/expectations-investing/T9.xlsx`(M&A)·`T10.xlsx`(실물옵션)에 **입력값이 든 사례**가 있다. 회사명·수치 확인.
2. **저장된 원문 8페이지** 재수색 — 튜토리얼 본문에 도미노 외 언급이 있는지.
3. **책 나머지 챕터** — 5·6·7장. 🔴 **정당한 경로만**: 출판사/구글북스 미리보기·저자 공개 자료·서평·강의자료. **무단 게시 전문 사본에 의존하지 말 것.** 얻으면 `data/sources/text/`에 저장.
4. **저자 공개물** — Mauboussin의 Morgan Stanley/Consilient Observer 리포트. 🔴 **PIE·MIFP를 적용한 개별 종목 수치**가 있는지. 있으면 원본 PDF를 `data/sources/`에 저장.
5. 원전 사이트의 **Special Site Extras**(`expectationsinvesting.com/the-book#SSE`) — 미확인. 추가 자료가 있는지.

🔴 **찾은 사례마다**: 회사·시점·입력 드라이버·원전이 제시한 결과(MIFP 등)를 표로.

---

## §2 — 대조 실행

§1에서 사례를 찾으면:
1. **원전 입력값을 그대로** 우리 엔진에 넣어 결과가 재현되는지(도미노 방식과 동일).
2. 🔴 **우리 파이프라인 산출값**으로도 돌려 원전 값과 비교(조달 검증). 차이 나면 **어느 드라이버에서** 갈리는지 규명.
3. 오차 명시.

🔴 **사례를 못 찾으면** — 그 사실과 **탐색한 곳 전부**를 기록한다. 그때 비로소 "원리적 한계"라 말할 수 있다.

---

## §3 — 외부 계산기 대조 (부차)

- 무료로 **implied growth 또는 forecast period**를 공개하는 계산기(GuruFocus·StockInvestorIQ·TIKR 등)를 **사람이 읽는 수준으로** 확인.
- 🔴 **스크래핑 금지.** 접근 불가면 "불가"로 기록.
- 🔴 정의가 다르면(우리=기간, 그들=성장률) **직접 대조 불가**임을 명시하고 무리하게 맞추지 말 것.

---

## §4 — 재판정

`docs/LENS_COMPLETION_STANDARD.md` 역DCF `3) 값 검증` 갱신:
- 대조 종목 수 (현재 **1건**: 도미노)
- 🔴 **항목 3 재판정** ✅/🔶/❌ + 사유
- 🔶면 **정확히 무엇이 남았고 어디를 더 뒤져야 하는지** 한 줄.
- 🔴 **"원리적 한계"라고 쓰려면 §1의 5개 탐색처를 전부 소진했음을 근거로 제시**할 것.

---

## 검증

1. `npx tsc --noEmit` 0 · `npm run test`
2. 🔴 프로덕션 404 유지 · 코드 무변화
3. §1 **탐색처 5곳 각각의 결과** (찾음/못 찾음 + 근거)
4. §2 대조 결과 또는 "사례 없음"
5. §3 외부 계산기 결과
6. 🔴 §4 **판정 + 사유**
7. 🔴 `[3중 점검]` ⓪ 줄 명시
8. 신규 확보 원본은 `data/sources/`에 저장 + `README.md` 갱신
9. `docs/CHANGELOG.md`·`docs/STATE.md` 오늘 날짜
10. 커밋(main):
    ```bash
    git add docs/ data/sources/ scripts/
    git commit -m "STEP 863: exhaustively search primary source for additional worked cases, re-judge DoD item 3"
    git push && git push origin main:revdcf-preview
    ```

## 완료 보고 → Cowork에게

- 🔴 §1 **탐색처 5곳 결과** · 찾은 사례 수
- §2 대조 결과
- 🔴 §4 **판정과 사유**
- 🔴 못 한 것
- **여기서 멈춘다.**
