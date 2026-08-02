# STEP 864 — DoD 항목 3 최종 소진: **각주 15 추적 · NC 무료 글 · 학술 문헌**

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`

**전제 상태**: STEP 863 커밋 `fac3cd4`(코드 HEAD `95d6862`) 이후 HEAD · 트리 클린

**착수 전 필독**: 🔴 `CLAUDE.md` **🚫 창작 금지**·⓪·⓪-3 · `data/sources/README.md`(863 소진 기록) · `docs/LENS_COMPLETION_STANDARD.md` 역DCF `3) 값 검증`

---

## 0. 성격

🔴 **항목 3만.** 끝나면 멈추고 보고. **다음 항목 제안 금지.**
🔴 코드·화면·DB 변경 0. 플래그 OFF. (신규 원본 저장은 허용)
🔴 **⓪-3 준수.**

**863은 5곳을 소진했으나 이 3곳은 안 봤다.** 여기까지 소진해야 "도메인 상한" 주장이 성립한다.

---

## §1 — 🔴 최우선: 책 **각주 15** 추적

**원본 문장** (Expectations Investing · "How the Market Values Stocks"):
> …historical prices in the stock market suggest a market-implied forecast period of between five and fifteen years.**15**

**이 각주가 5~15년의 출처다. 우리는 각주를 본 적이 없다.**

1. 확보한 책 텍스트(122K자)에 **Notes 절이 포함돼 있는지** 먼저 확인. 있으면 해당 장의 주석 15를 읽는다.
2. 없으면 **정당한 경로**로 Notes만 확보: 출판사/구글북스 미리보기 · 저자 공개 자료 · 인용한 서평·논문.
   🔴 **무단 게시 전문 사본에 의존하지 말 것.**
3. 각주가 가리키는 **원출처(논문·리포트)를 찾아 확보**하고 `data/sources/`에 저장.
4. 🔴 **그 원출처에 종목별·업종별 MIFP 값이 있는지** 확인. 있으면 **§3 대조 대상**이다.

---

## §2 — New Constructs **무료 글**

863은 Mauboussin 리포트와 계산기만 봤다. **NC가 무료로 공개하는 종목 분석 글은 안 봤다.**

- `newconstructs.com/blog` 계열(Danger Zone · Long Idea · 개별 종목 리포트)에서 **"이 주가를 정당화하려면 N년간 X% 성장이 필요하다"** 류 문장을 찾는다.
- 🔴 **최소 3종목**을 목표로 수집. 회사·날짜·주가·그들이 제시한 **GAP 연수 / 함의 성장률**을 표로.
- 🔴 **정의 차이를 반드시 병기**: NC는 자체 회계조정(비공개) 기반 NOPAT·투하자본을 쓴다. **값이 달라도 원인을 우리가 규명할 수 없다.**
- 🔴 스크래핑 금지 · 공개 페이지를 읽는 수준으로만.

---

## §3 — 학술 문헌

- `implied forecast horizon` · `value creation period` · `market-implied competitive advantage period (CAP)` 로 검색.
- 🔑 **CAP(Competitive Advantage Period)** 는 이 개념의 학술 명칭이다. Mauboussin 자신이 CAP 논문을 쓴 적이 있는지 확인.
- 🔴 **종목·업종 단위 수치가 실린 논문**을 찾으면 확보해 `data/sources/`에 저장.

---

## §4 — 대조 실행

§1~§3에서 얻은 값이 있으면:
1. **같은 종목·같은 시점**으로 우리 값을 산출해 나란히 놓는다.
2. 🔴 차이가 나면 **원인 규명**(정의 차이 / 드라이버 차이 / 시점 차이 중 무엇인지).
3. 🔴 **정의가 다르면 "대조 불가"로 기록하고 억지로 맞추지 말 것.**

---

## §5 — 최종 판정

`docs/LENS_COMPLETION_STANDARD.md` 역DCF `3) 값 검증` 갱신:

| 항목 | 결과 |
|---|---|
| 손계산 | ✅ 도미노 오차 0.0000 |
| 분포 수준 독립 대조 | ✅ 원전 관찰 3개 재현 (860) |
| **개별 종목 외부 대조** | 현재 **0건** → 864 결과 ? |

🔴 **판정 ✅/🔶/❌ + 사유.**
🔴 **여전히 0건이면**: 863의 5곳 + 864의 3곳 = **총 8곳 소진**을 근거로 `data/sources/README.md`에 기록하고, **"도메인 상한"으로 볼지 여부는 장은태 판단 사항**으로 남긴다. **Cowork/Claude Code가 임의로 ✅ 처리하지 말 것.**

---

## 검증

1. `npx tsc --noEmit` 0 · `npm run test`
2. 🔴 프로덕션 404 유지 · 코드 무변화
3. §1 **각주 15 내용 또는 "확보 불가 + 시도한 경로"**
4. §2 NC 무료 글 수집 결과 (종목 수 · 값 · 정의 차이)
5. §3 학술 문헌 결과
6. §4 대조 결과 또는 "대조 불가 + 사유"
7. 🔴 §5 **판정 + 사유** (임의 ✅ 금지)
8. 🔴 `[3중 점검]` ⓪ 줄 명시
9. 신규 원본은 `data/sources/`에 저장 + `README.md` 갱신(863 기록 옆에 864 추가)
10. `docs/CHANGELOG.md`·`docs/STATE.md` 오늘 날짜
11. 커밋(main):
    ```bash
    git add docs/ data/sources/
    git commit -m "STEP 864: trace primary-source footnote, New Constructs free articles, and academic CAP literature for external validation of DoD item 3"
    git push && git push origin main:revdcf-preview
    ```

## 완료 보고 → Cowork에게

- 🔴 §1 **각주 15가 가리키는 출처** (찾음/못 찾음)
- §2 NC 무료 글에서 얻은 종목 수와 값
- §3 학술 문헌
- 🔴 §5 **개별 종목 외부 대조 건수** + 판정
- 🔴 못 한 것
- **여기서 멈춘다.**
