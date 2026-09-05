# STEP 890 — DoD 4 전제 확인: 유니버스가 매일 움직인다 · 판정서 제출

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_890_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `d5765b9`(STEP 889 · `main`·`revdcf-preview` 동일) · tsc 0 · test 155/155 · `REVDCF_ENABLED` **OFF** · `revdcf_results` 604×3 · `us_market_cap` 5,887

🔴 **불변 금지선**: `REVDCF_ENABLED` **OFF 유지** · `revdcf_results`·`us_market_cap` **쓰기 금지**(읽기만) · **크론 수동 실행 금지** · 🔴 **`data/us_symbols.json` 수정 금지 · `.github/workflows/refresh-us-symbols.yml` 수정 금지**(둘 다 **관찰 대상**이지 조치 대상이 아니다) · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **커밋 전 `docs/COMMIT_GATES.md` 6개 게이트를 돌린다.**

---

## §0 — 성격

**실측 + 판정서.** 🔴 **DoD 4를 ✅로 올리지 않는다** — 권고안을 만들어 장은태에게 올린다(884 패턴).
🔴 **코드·데이터·워크플로 변경 0.** 바뀌는 것은 `docs/`뿐이다.
🔴 **새 판정을 다른 행에 내리지 않는다.**

### 왜 지금인가

867이 DoD 4에 이렇게 적었다:

> *"866~866D·867로 근거 채움(모집단 = 거래소상장 **N=2,857 확정**…). 🔴 **근거는 갖췄으나 ✅ 상향은 장은태 판단.**"*

🔴 **그런데 그 근거의 밑바탕이 매일 바뀐다.** Cowork이 887의 rebase 사고를 계기로 확인했다.

## §1 — Cowork 사전 실측 (🔴 이미 확인한 것 · 다시 하지 말고 이어서 하라)

**`.github/workflows/refresh-us-symbols.yml`** — 매일 `09:00 UTC` 스케줄. `npx tsx scripts/refresh_us_symbols.ts` 실행 후 **변경 있으면 자동 커밋·푸시 → Vercel 자동배포.** 출처는 `nasdaqtrader symbol directory`.

**심볼 수 드리프트(커밋 이력 실측)**:

| 커밋 | 날짜 | 심볼 수 |
|---|---|---|
| `98f1265` | 2026-08-03 | **6,779** |
| `12e2e99` | 2026-08-01 | 6,783 |
| `e0c6020` | 2026-07-31 | 6,779 |
| `0655d0e` | 2026-07-30 | 6,779 |
| `20c007f` | 2026-07-29 | 6,777 |
| `dcd6e6d` | 2026-07-28 | 6,773 |
| `9f955ca` | 2026-07-27 | 6,771 |
| `bf01660` | 2026-07-25 | 6,775 |

→ 9일 사이 **6,771~6,783**(폭 12·일별 0~4). **최근 10커밋이 전부 이 자동 갱신이다.**

**소비처(grep)**: `lib/lensPrecompute.ts` · `lib/usPerf.ts` · `lib/stockName.ts` · `app/api/yahoo/us-list` · `app/api/search` · `app/api/watchlist/quotes` · `app/sitemap.ts` · 백테스트/프로브 다수.

## §2 — ① 원본 개봉

🔴 **`scripts/refresh_us_symbols.ts`를 직접 연다**(플레이북 #76 — 파일명·grep으로 추정 금지).

확인할 것:
1. **무엇을 받아오는가** — nasdaqtrader의 어느 파일인가. NASDAQ만인가 **다른 거래소(NYSE·AMEX 포함 `otherlisted`)도 받는가**.
2. **무엇을 거르는가** — ETF·테스트이슈·`Financial Status`·클래스주 등 필터가 있는가. **필터가 866의 "거래소 상장" 정의와 같은가.**
3. **출력 형태** — 심볼만인가 메타(거래소·ETF 플래그 등)도 담는가.
4. 🔴 **워크플로 주석의 경고**: *"GitHub는 60일 무커밋 리포의 스케줄 워크플로를 조용히 비활성화한다"* — 실제 위험이 있는지 확인만 하고 **조치하지 말 것**(기록만).

## §3 — ② 전파 사슬 실측 (🔴 읽기만)

**드리프트가 어디까지 전파되는가**를 단계별로 잰다.

```
data/us_symbols.json (6,779·매일)
        ↓  ?
us_market_cap (5,887)
        ↓  ?
866 "거래소 상장 조달 범위" (2,857)
        ↓  ?
866~867 3분류 (산출 364 / 판정불가 1,688 / 입력부족 805)
        ↓  ?
revdcf_results (604 · 🔴 크론 자기참조로 고정)
```

각 화살표마다 **무엇이 왜 줄어드는지**를 코드·DB로 확인하고 숫자를 적는다. 🔴 **추정 금지 — 못 밝히면 "미확인"으로 적는다.**

그리고 **드리프트 영향**을 잰다:
- 최근 8일치 `us_symbols` 스냅샷 각각에 866의 필터를 적용하면 **"거래소 상장 N"이 얼마나 흔들리는가.** (🔴 커밋에서 파일을 꺼내 계산만 한다 — 체크아웃하지 말 것)
- `us_market_cap`의 `as_of`별 행 수 추이(DB 읽기)
- 🔴 **2,857이 재현되는 날짜가 있는가.** 없으면 그 사실을 적는다.

## §4 — ③ 🔴 비대칭 확인

- **역DCF 유니버스**: `app/api/cron/revdcf/route.ts:23~26` — 직전 `as_of`의 CIK 집합. **자기참조라 `us_symbols`가 늘어도 새 종목이 안 들어온다**(878·881 확인).
- **7렌즈 유니버스**: `us_market_cap`이 매일 새로 계산된다 → **움직인다.**

🔴 **866의 "조달 범위 2,857"이 둘 중 어느 기준인가**를 확정한다. 그리고 🔑 **역DCF만 고정되어 있다는 사실이 DoD 4의 "모집단" 서술에 반영돼 있는가**를 확인한다. 없으면 그 사실이 이 STEP의 발견이다.

## §5 — 🔴 "확정" 표현 판정 · §12 B분류

`CLAUDE.md §12 B분류`: **외부·변동 값은 숫자를 적지 않고 배선한다.**
**869 선례**(장은태 직접 지시): `sampleNote`를 *"604개 기준"*이 아니라 `"이 기법이 성립하는 {total}개 기준"`으로 **배선**했다.

🔴 **문서 쪽에 같은 문제가 남아 있는지 판정한다.**

- *"N=2,857 **확정**"*이 **사실인가 스냅샷인가.** 스냅샷이면 정확한 표현은 무엇인가(예: *"2026-08-02 기준 N=2,857"*).
- 🔴 **#80 절차**: `2,857`·`5,887`·`604`가 문서에 박힌 자리를 **grep으로 전수 목록화**하고 각 항목에 **`기준일 표기 필요` / `이력이라 제외` / `이미 정확`**을 붙여 **보고에 싣는다.**
- 🔴 **화면 문구도 확인**한다 — 889가 배선한 것 외에 숫자가 박힌 자리가 남았는가.
- 🔴 **숫자를 고치지 말고 기준일을 붙이는 것이 기본**이다. 배선이 필요한데 이번 범위 밖이면 `SPEC §10`에 등재한다.

## §6 — 🔴 DoD 4 판정서 (`docs/DECISION_890_DOD4.md` 신설)

867이 *"근거는 갖췄으나 ✅ 상향은 장은태 판단"*이라 했다. **판정 가능한 한 장을 만든다.**

> **권고안**: ✅ 상향 / 🔶 유지 / 조건부 — 🔴 **하나만**(플레이북 #79 · 선택지 나열 금지)
> **근거**: 번호. 각 근거는 **§2~§5의 실측**에 걸릴 것
> **🔴 대가** · **🔴 불리한 사실** · **🔴 재검토 조건** · **🔴 결정을 미룰 때의 비용**

🔴 **반드시 다룰 것**:
1. 드리프트가 있는데 ✅를 줄 수 있는가 — **"측정 가능하고 기준일이 명시되면 ✅"**인지, **"밑바탕이 움직이면 ✅ 불가"**인지. 🔑 **7렌즈는 매일 움직이는 유니버스 위에서 전부 ✅를 받았다** — 그 선례가 여기 적용되는지 판정한다.
2. DoD 4 정의는 *"시장별 유도 여부·표본 수·방향 부호(고정값이면 근거)"*다. 🔴 **역DCF는 `lens_cuts` 컷 유도 체계가 아니다**(867: *"verdict 직접 판정 — 다른 구조"*). **다른 구조인데 같은 기준으로 ✅를 주는 게 맞는지** 판정한다.
3. 🔴 **적용하지 말 것.** DoD 현황표는 🔶 그대로 둔다.

## §7 — 문서 · 검증 · 커밋

- `docs/DECISION_890_DOD4.md` **신설**(§6)
- `docs/LENS_COMPLETION_STANDARD.md` DoD 4 항목 — 🔴 **판정 칸 불변**. 각주에 *"890 전제 실측 완료 → 판정서 제출·승인 대기"* + 드리프트 사실
- `docs/REVDCF_SPEC.md` §4(A 적용 범위)에 드리프트 사실 · §10 신규 등재 · §11 실측 원장에 드리프트 표
- `docs/STATE.md` 🔴 142줄 상한 · `docs/CHANGELOG.md`
- 프로브 `scripts/probe_890_universe_drift.ts` + `docs/probe_890_universe_drift.json` — 🔴 **스크립트를 같은 커밋에**(#78)

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/ .github/   # 🔴 출력 없어야 함
git status --porcelain                                                   # 🔴 ?? 0건
```

```bash
git add -A
git reset -- data/ .github/
git status --porcelain
git commit -m "STEP 890: check whether the ground under the population measurement holds still

- a workflow refreshes the US symbol list every morning and commits it, so the list the
  population figure was measured from has moved every few days since
- the chain from that list down to the rows the model actually judges is traced step by step,
  with the number at each step and how far the daily drift reaches
- the reverse DCF universe turns out to be pinned by its own self-reference while the lens
  universe moves daily, and whether the recorded figure describes one or the other is settled
- a count written into a document as settled is treated the same way a count on screen was
  treated earlier: it either carries the date it was taken or it gets wired
- the completion item is not upgraded here; a recommendation goes up for approval instead"
git push && git push origin main:revdcf-preview
```

## §8 — 보고 후 멈춘다

```
§2 refresh_us_symbols.ts 개봉 — 출처·거래소 범위·필터·출력형태 · 866 정의와 같은가 · 60일 경고 확인
§3 전파 사슬 각 단계 숫자와 감소 사유 · 8일치 스냅샷별 "거래소 상장 N" 변동폭
   us_market_cap as_of별 행 수 추이 · 🔴 2,857이 재현되는 날짜 유무
§4 역DCF 고정 vs 7렌즈 이동 — 866의 2,857은 어느 기준인가 · DoD 4 서술에 반영돼 있는가
§5 "확정" 표현 판정 · 🔴 2,857/5,887/604 박힌 자리 전수 목록(각 항목 처리 표시)
§6 DECISION_890 신설 — 권고안 1개 + 근거·대가·불리한사실·재검토조건·미룰때비용
   🔴 7렌즈 선례가 적용되는가 · 🔴 다른 구조인데 같은 기준인가
무변경: lib/app/components/messages/data/.github diff 없음 · DoD 현황표 불변
       REVDCF_ENABLED OFF · 크론 미실행 · revdcf_results 604×3 · us_market_cap 5,887
tsc 0 · test ?/? · push ? · git status ?? 0건 · COMMIT_GATES 6개
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **DoD 4를 올리지 말 것. `us_symbols.json`·워크플로를 고치지 말 것. 다음 STEP을 제안하지 말 것.**
