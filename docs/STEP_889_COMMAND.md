# STEP 889 — 역DCF 표면 교정: 888 감사 결과 처리 · DoD 6 판정 (🔴 계산 diff 0)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_889_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `f0e1548`(STEP 888 · `main`·`revdcf-preview` 동일) · tsc 0 · test 155/155 · `REVDCF_ENABLED` **OFF** · `revdcf_results` 604×3 · `us_market_cap` 5,887

🔴 **불변 금지선**: `REVDCF_ENABLED` **OFF 유지**(교정은 노출 없이 이뤄진다) · `revdcf_results`·`us_market_cap` **쓰기 금지** · **크론 수동 실행 금지** · `data/us_symbols.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 성격

- 🔴 **계산 diff 0**: `lib/revdcf/**`(engine·drivers·compute·flag)와 `app/api/**` **로직 무변경**. 값이 하나도 안 바뀌어야 한다.
- 허용 변경: `messages/ko.json`·`messages/en.json` · `components/RevDcfSection.tsx`·`RevDcfBadge.tsx`·`UsMarketBoard.tsx` · `/revdcf` 방법론 페이지 · `docs/`
- 🔴 **새 측정 없음.** 화면에 넣을 숫자는 **이미 실측된 것**만 쓴다(출처를 각주로).
- 🔴 **DoD 7(화면 일관성)은 건드리지 않는다** — 플래그 OFF라 실제 렌더 검증이 불가능하다. 이 STEP은 **DoD 6(주장 정합)**만 닫는다.

## §1 — 기준: 888이 추출한 원칙 (🔴 이것으로만 교정한다)

888 §2가 822·824·825·826에서 추출한 원칙:

> **"화면 문구는 절대적 판단어가 아니라 상대적·서술적 표현('~한 편')으로 쓴다. 계산 불가 사유는 뭉뚱그리지 않고 실제 원인별로 정확히 분기한다. 확인 안 된 구체적 원인은 단정하지 않는다. 임의 상수·기준은 그 사실 자체를 화면에 밝힌다."**

🔴 **`docs/AUDIT_888_REVDCF_SURFACE.md`가 처리 대상의 정본이다.** 이 명령서에 목록을 다시 적지 않는다(886 정본 원칙). 🔴 **감사표의 "위반" 행을 하나도 빠뜨리지 말 것** — 처리 후 감사표 각 행에 **처리 결과를 적는다.**

🔴 **교정할 때마다 "원칙의 어느 조항을 적용했는지" 한 줄로 밝힌다.** 취향으로 고치지 말 것.

## §2 — 위반 5건 교정 (🔴 유형별 지침)

### 2-1. 판단어 → 서술어

배지가 **회사의 속성**처럼 읽히면 §6 🔒 위반이다. 🔑 **headline이 이미 정확한 서술을 갖고 있다** — 배지는 그 압축이어야 한다.

- 예: `headline.valueDestroying` = *"지금 이익률로는 성장할수록 가치가 줄어듭니다"* ← **조건이 붙은 서술**. 배지가 이 조건을 버리면 안 된다.
- 🔴 **ko와 en을 같은 원칙으로 동시에** 고친다. 🔴 en은 `BRAND_IDENTITY §5` *"축약형(don't·you're) 금지"*를 지킨다.
- 🔴 배지는 길이 제약이 있다(목록 셀). **짧으면서 서술적**이어야 한다 — 못 맞추면 **못 맞춘다고 보고**하고 대안(툴팁·헤드라인 의존)을 적는다.

### 2-2. 색상

- `value_destroying` = `unjong-danger`(빨강). 🔑 **문구를 고쳐도 색이 남으면 판단은 그대로다.** §4 *"과장·확신하지 않는다"* 적용 대상인지 판정하고, 맞으면 **판정 성격에 맞는 토큰으로** 바꾼다.
- 🔴 **기준**: 이 배지들은 **좋고 나쁨이 아니라 서로 다른 상태**다(기대 해독 / 무성장 설명 / 설명 불가 / 성장이 역효과). 색이 **서열**을 만들면 안 된다.
- 888이 찾은 `below_one` 배지(muted) ↔ 헤드라인(primary) **불일치**도 함께 처리한다. 🔴 888은 이걸 *"가드레일 무관·순수 UI"*로 분류했는데 **재검토 여지가 있다고 스스로 적었다** — 889가 **판정한다**(가드레일 사안인지 UI 사안인지). 어느 쪽이든 **불일치는 고친다.**
- 🔴 **`app/globals.css` 토큰 정의는 건드리지 말 것.** 사용처의 토큰 선택만 바꾼다(다른 렌즈에 영향 금지).

### 2-3. 박힌 숫자 → 배선

`CLAUDE.md §12 B분류`: **외부·변동 값은 숫자를 적지 않고 배선한다.**
**869 선례**: `sampleNote`를 *"604개 기준"*이 아니라 `"이 기법이 성립하는 {total}개 기준"`으로 바꿔 값을 주입했다.

- `RevDcfMethod.row.tax`의 *"커버 58%·이상값 16.2%"* 같은 자리가 대상이다(**885 재측정 77.4%**).
- 🔴 **숫자를 최신값으로 바꾸는 게 아니라 배선하는 게 정답이다.** 배선이 이번 STEP에서 불가능하면(데이터 경로 없음) **숫자를 지우고 정성 표현으로** 바꾸고, *"배선 미구현"*을 `SPEC §10`에 등재한다.
- 🔴 **어느 쪽을 택했는지와 이유를 보고한다.**

### 2-4. 기준 미표기

`RevDcfMethod.repro`의 *"8년"*은 **T8 기준이라 값 자체는 정확**하다(882 확정). 문제는 **어느 기준인지 화면에 없다**는 것.
- 🔴 **원칙의 *"임의 상수·기준은 그 사실 자체를 화면에 밝힌다"*를 적용**한다.
- 🔴 **T7=7 / T8=8을 둘 다 쓸지, 기준만 밝힐지**는 889가 정한다. **정하고 이유를 적는다.**

## §3 — 🔴 판단 보류 3건: 판정한다

888이 3건을 보류했고, 그중 `row.tax`·`row.term`의 **887 재분류를 화면에 어떻게 반영할지**를 889 몫으로 넘겼다.

🔴 **보류로 두지 말 것**(플레이북 #79). 각 건에 대해 **하나로 판정**하고 근거를 적는다.

**참고 사실**(887): driver3·driver6·인플레는 **"동일 식·값만 차이"**로 재분류됐다. 🔑 화면 원장 표의 *"사유"* 열이 지금 *"원전과 다른 이유"*를 적는데, **재분류 후에는 "무엇이 다른가"의 성격 자체가 달라졌다** — 방법이 아니라 값의 빈티지다. 그 사실이 사용자에게 전달되어야 하는지 판정한다.

## §4 — 🔴 888이 새로 찾은 것 (최대 발견 포함)

### 4-1. driver 6 / WACC 원장 행 부재 — 🔴 최우선

888: *"881이 확정한 **GAP에 가장 크게 기여하는 항목**이 '그대로 공개'를 표방하는 페이지에서 빠져 있다."*

🔴 이건 이미 알려진 결함이다 — `LENS_COMPLETION_STANDARD.md`의 *"잔여 불일치 1건: driver 6(WACC 조립) 행 부재"*가 그것이다. **888이 화면 쪽에서 같은 것을 재발견했다.**

- `RevDcfMethod.row`에 **자본비용 행을 추가**한다. 원전 = 회사별 실제 YTM·베타 1, 우리 = 업종 스프레드·업종 무차입 베타 재레버리지.
- 🔴 **881 실측을 그대로 쓴다**: 도미노 원전 WACC **5.354%** vs 우리 **7.19%**, 차이의 절대다수가 **방법이 아니라 시점(rf 2020 0.65% → 2026 3.95%)**. 🔑 **이게 사용자에게 가장 중요한 사실이다** — GAP이 회사가 아니라 금리에 크게 좌우된다는 것.
- 🔴 **미측정도 적는다**: 업종 평균 근사의 편향은 **515사 미측정**(881).
- 🔴 `notInvestmentAdvice`·`betaCaveat`와 **중복되지 않게** 한다.

### 4-2. en의 "해독" 프레이밍 손실

888: en `"Expectations"` 계열이 ko의 *"해독"* 뉘앙스를 잃었다.
- 🔴 **ko를 en으로 번역하는 게 아니라, 같은 원칙을 en에서 다시 적용**한다(710B 선례: 브랜드 보이스 잠금).
- 🔴 `messages.test.ts` **패리티 테스트를 통과**해야 한다.

## §5 — 검증

```bash
npx tsc --noEmit && npm run test          # 🔴 ko/en 패리티 테스트 포함
git diff --stat HEAD -- lib/ app/api/     # 🔴 출력 없어야 함 (계산 불변)
git diff --stat HEAD -- data/ scripts/    # 🔴 출력 없어야 함
git status --porcelain                    # 🔴 ?? 0건
```

🔴 **추가 검증**: `messages/ko.json`·`en.json`의 **키 개수와 차집합**을 전후로 대조한다(869 선례). 🔴 **키를 지우거나 새로 만들면 그 사실을 보고한다.**
🔴 **`components/` 변경이 다른 렌즈에 닿지 않았는지** 확인한다(색상 토큰 사용처 grep).

## §6 — 🔴 DoD 6(주장 정합) 판정

교정이 끝나면 **판정한다.** 정의: *"검증 범위·실패 모드·적용 조건이 §1 표와 무모순."*

> **③판정**: ✅ 또는 🔶 유지 — **하나만**
> **근거**: 번호. 각 근거는 **감사표 행 또는 실측**에 걸릴 것
> **🔴 대가** · **🔴 불리한 사실** · **🔴 재검토 조건**

🔴 **알려진 한계를 반드시 불리한 사실에 적는다**: 888의 통과 판정 10건은 *"판단어 없음/사유 명시됨"* 기준이지 **실제 노출해 사용자 반응을 본 것이 아니다**(플래그 OFF·라이브 검증 불가). 🔴 **DoD 7·9가 이 한계를 안고 있다는 것도 함께 적는다.**

## §7 — 문서 · 커밋

- `messages/ko.json`·`en.json` · `components/` · `/revdcf` 페이지
- `docs/AUDIT_888_REVDCF_SURFACE.md` — 🔴 **각 행에 처리 결과 추가**(감사표를 정본으로 유지)
- `docs/LENS_COMPLETION_STANDARD.md` — DoD 6 판정 · *"잔여 불일치: driver6 행 부재"* **해소 표시**
- `docs/REVDCF_SPEC.md` §10 — 신규(배선 미구현 등) 등재 · 해소분 표시
- `docs/BRAND_IDENTITY.md` — 🔴 **수정 금지**(정본이자 기준)
- `docs/STATE.md` 🔴 142줄 상한 · `docs/CHANGELOG.md`

```bash
git add -A
git reset -- data/
git status --porcelain
git commit -m "STEP 889: bring the reverse DCF surface in line with the identity it was built under

- the brand document has said since July that we do not predict or recommend, and the seven
  lenses were rewritten to match; this applies the same rule to the one model that never got it
- wording moves from judging a company to describing what was read out of its price, using the
  principle extracted from those earlier rewrites rather than taste
- colour is corrected too, because the danger token judged before any word did, and these
  verdicts are different states rather than a ranking
- a figure frozen into the methodology page had gone stale since it was measured again; it is
  wired rather than refreshed
- the cost of capital row was missing from a page that claims to publish every difference, and
  it is the input that moves the result most, so it is added with what the decomposition showed
- calculations are untouched and the flag stays off"
git push && git push origin main:revdcf-preview
```

## §8 — 보고 후 멈춘다

```
§2 위반 5건 처리 — 각 건에 적용한 원칙 조항 · 배지 길이 제약 충족 여부
   2-2 색상: below_one 불일치를 가드레일/UI 중 무엇으로 판정했는가
   2-3 숫자: 배선했는가 정성표현으로 바꿨는가 · 이유
   2-4 기준 표기: T7=7/T8=8 둘 다인가 기준만인가 · 이유
§3 판단 보류 3건 판정 결과(🔴 보류 0건이어야 함)
§4 driver6/WACC 원장 행 추가 내용(도미노 5.354% vs 7.19% · 시점 지배 · 515사 미측정)
   en 프레이밍 재적용
§5 ko/en 키 개수·차집합 전후 · lib/app/api diff 0 확인 · 다른 렌즈 영향 0
§6 🔴 DoD 6 판정 + 근거·대가·불리한사실·재검토조건
무변경: lib/app/api/data/scripts diff 없음 · REVDCF_ENABLED OFF · 크론 미실행 · revdcf_results 604×3
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **계산에 손대지 말 것. 플래그를 켜지 말 것. DoD 7·9를 판정하지 말 것. 다음 STEP을 제안하지 말 것.**
