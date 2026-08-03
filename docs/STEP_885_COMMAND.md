# STEP 885 — 🔴 세율 순효과 실측(§10 #50) → driver 3 빈 칸 채우기 · 감사 지적 정리 · 재현 경로 복구

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_885_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `7230c17`(STEP 884 · `main`·`revdcf-preview` 동일) · tsc 0 · test 155/155 · `REVDCF_ENABLED` **OFF** · `revdcf_results` 604×3 · `us_market_cap` 5,887

🔴 **불변 금지선**: `REVDCF_ENABLED` **OFF 유지** · `revdcf_results`·`us_market_cap` **쓰기 금지** · **크론 수동 실행 금지** · `data/us_symbols.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.
🔴 **`docs/DECISION_884_TABLE_STRUCTURE.md`는 승인 대기다. 적용하지 말 것.**

---

## §0 — 🔴 Cowork 자체 정정 (884 §0의 전제가 틀렸다)

884 §0에서 Cowork이 이렇게 단언했다:

> ✅ *"`scripts/probe_883_i_eq_rf.ts`… 스크립트 안에 도미노·rf 재료가 들어 있다."*

🔴 **틀렸다.** 884 실행 결과가 밝혔듯 그 스크립트는 **도미노 GAP 재계산을 담고 있지 않았고**, 들어 있던 건 서술 텍스트뿐이었다. Cowork은 `grep -l "0.65|riskfree|domino|DPZ|1286681"`의 **매칭 하나만 보고 내용을 확인하지 않았다.**

🔑 **플레이북 #76(*"셀을 봐라"*)과 정확히 같은 유형이다** — 표면 신호를 내용으로 착각했다.

### 플레이북 **#82** 신설

> 🔑 **grep 매칭은 존재 증거이지 내용 증거가 아니다.** 매칭된 자리를 **열어서** 그것이 계산인지 서술인지 주석인지 확인한 뒤에 결론을 말한다. `grep -l`만으로 *"들어 있다"*고 적지 않는다.
> **적용 이력**: 884 §0(Cowork) — 실행 측이 재현을 시도해 잡아냈다.

### 플레이북 **#78에 한 줄 더**

884 보고: *"`scripts/probe_883_i_eq_rf.ts` 수정은 STEP의 `git add -A docs/` 범위 밖이었다."* — **878에서도 같은 일이 있었다(`scripts/probe_878_driver5.ts` 누락). 명령어 쪽 결함이 두 번이다.**

> 🔑 **STEP 커밋 블록은 경로를 열거하지 않는다.** `git add -A` 후 **제외할 것만 명시**한다. 경로 열거 방식은 그 STEP이 만들거나 고칠 파일을 미리 다 알고 있다고 가정하는데, 그 가정이 두 번 깨졌다.

## §1 — 🔴 §10 #50 실측: 세율 순효과 (877부터 미측정)

`REVDCF_SPEC.md:1313`이 877 이래 살아 있다:

> *"세율 **16.5%(원전 현금세율) ↔ 25.63%(우리 한계세율)**의 순효과 미측정. NOPAT 감소(GAP↑ 방향)와 WACC 하락(GAP↓ 방향)이 **반대 방향**이라 계산 없이는 순효과를 모른다."*

🔴 **이게 지금 driver 3의 "대가" 칸이 비어 있는 이유다**(884 감사: *"driver3 — 대가·재검토조건 완전 부재"* — 9행 중 유일한 완전 부재).

### 실측 — 515 모집단(884와 동일. 다르면 이유를 적는다) · 🔴 읽기만

881의 5단계 분해와 **같은 형식**으로, 이번엔 **세율만** 격리한다:

| 시나리오 | NOPAT 세율 | WACC 세율 | 재는 것 |
|---|---|---|---|
| 기준(현행) | 0.2563 | 0.2563 | — |
| **A. 양쪽 다 현금세율** | 회사별 T6식 | 회사별 T6식 | 🔴 **원전이 실제로 하는 것**(877 확인: `T7 Inputs!C10=0.165`) |
| B. NOPAT만 현금세율 | 회사별 T6식 | 0.2563 | 방향 분리용 |
| C. WACC만 현금세율 | 0.2563 | 회사별 T6식 | 방향 분리용 |

각 시나리오마다: **커버리지**(현금세율 산출 가능 N — 847은 58%였으나 840·862 이후 재측정 필요) · WACC 분포 · GAP p25/중앙/p75 · `years` 수 · **판정 버킷 이동**(882·883이 쓴 형식) · 🔴 **도미노 앵커**(T8 드라이버로 A를 돌리면 GAP이 어떻게 되는가 — 원전 값 재현 여부).

🔴 **B·C가 반대 방향인지, 그리고 A에서 둘이 얼마나 상쇄되는지**를 숫자로 낸다. 이게 #50이 물은 것이다.
🔴 **현금세율 산출 불가 종목을 한계세율로 채우지 말 것** — 명시 제외(862 원칙).

### 🔴 driver 3 빈 칸 채우기 — 실측 결과로만

진행표 2행 각주에 **대가**·**재검토 조건**을 추가한다. 🔴 **위 실측에 걸린 문장만 쓸 것.** 짐작 금지.

- **대가**: 한계세율 단일 적용이 잃는 것 = (실측 결과로 서술). 예컨대 *"회사별 실제 세부담 차이를 반영하지 못한다 — A 시나리오 대비 GAP 중앙 N년·판정 M사 차이"*.
- **재검토 조건**: 무엇이 확보되면 다시 여는가 — 🔴 **현금세율 커버리지가 실측치를 넘어설 때**처럼 **측정 가능한 조건**으로 쓴다. *"데이터가 좋아지면"* 같은 문장 금지.

🔴 **③판정(현행 유지)은 바꾸지 않는다.** 실측이 판정을 뒤집는 방향으로 나오면 **바꾸지 말고 보고하고 멈춘다**(880 §0과 같은 규칙 — 계산 변경은 3중 검증 전체 재수행 + 장은태 확인이 먼저다).

## §2 — 감사표 지적 정리 (형식만 · 🔴 내용 변경 금지)

884 감사가 낸 목록:

| 행 | 지적 |
|---|---|
| driver 1 · 4 | **대가**가 "남는 사실"에 블렌드 |
| driver 5 | **불리한 사실**이 "대가"에 블렌드 |
| driver 6 | 근거 ③⑦이 스스로 *"못 찾음"*으로 미확정 |

- **블렌드 분리**: 섞여 있는 문장을 **해당 칸으로 옮긴다.** 🔴 **문장을 새로 쓰거나 고치지 말고 옮기기만 한다.** 옮긴 뒤 원래 자리에 남은 게 없으면 그렇게 둔다.
- **driver 6 ③⑦**: 🔴 **한 번 더 검색한다**(현금조정 무차입 베타의 재레버리지 시 현금 재환원 절차 · rf·ERP 갱신주기). 찾으면 근거를 확정하고, **못 찾으면 "원문에서 확인 불가"로 확정**한다. 🔴 *"못 찾음"*을 미확정 상태로 남기지 말 것 — 확인 불가도 결론이다.

## §3 — 재현 경로 복구 · 사실 부기

1. 🔴 **`/tmp/diag881.ts`의 "4갈래 격리조합"**(T8wacc+T7shares 등 교차 조합)이 884 보고에서 **재현 경로 없음**으로 남았다. `scripts/probe_881_wacc.ts`에 **그 조합을 추가**하고 재실행해 881의 서술(*"두 값 중 하나만 바꿔도 7로 바뀐다 — 8은 T8의 정확한 조합에서만"*)이 재현되는지 확인한다. 🔴 재현 안 되면 **서술을 고치지 말고 보고**한다.
2. 🔴 **`LENS_COMPLETION_STANDARD.md:607`의 "행 수 = 22"** — 884 검산이 **인플레 중복**을 확정했다. 재분류는 승인 대기지만 **중복이 있다는 사실 자체는 판정과 무관하다.** `:607`에 부기:
   > 🔴 **검산(884)**: 인플레가 두 칸에 이중 등재돼 **고유 항목은 21**이다. "22"는 그 중복을 포함한 수다. 🔴 **재분류(→20)는 `docs/DECISION_884_TABLE_STRUCTURE.md` 승인 대기 — 이 부기는 사실 표기일 뿐 재분류가 아니다.**

   🔴 **"22행"이 적힌 다른 자리도 #80 절차(grep→목록→표시→보고)로 전수 처리**한다. `CHANGELOG`는 이력이므로 각주만.

## §4 — 문서 · 검증 · 커밋

- `docs/LENS_COMPLETION_STANDARD.md` — 진행표 2행 대가·재검토조건(§1) · 감사표 갱신 · 블렌드 분리(§2) · `:607` 부기(§3-2)
- `docs/REVDCF_SPEC.md` §10 **#50 해소** · 새 미측정 등재
- `lib/revdcf/registry.ts` `taxRate` — 대가·재검토조건 반영
- `docs/LENS_DEV_PLAYBOOK.md` **#82 신설** · **#78 한 줄 추가**(§0)
- `scripts/probe_885_taxrate.ts` + `docs/probe_885_taxrate.json` · `scripts/probe_881_wacc.ts` 보강(§3-1)
- `docs/STATE.md` 🔴 1~2p(미측정 보존) · `docs/CHANGELOG.md`

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- data/ app/ components/ messages/   # 🔴 출력 없어야 함
git status --porcelain                                     # 🔴 ?? 0건
```

🔴 **커밋은 경로 열거 금지**(§0 · #78):

```bash
git add -A
git reset -- data/          # 🔴 data/는 이 STEP에서 안 바꾼다
git status --porcelain
git commit -m "STEP 885: measure the tax effect that was never measured and fill the empty cells it left

- the tax rate difference had sat unmeasured since the day it was found, because the two sides
  push the gap in opposite directions and nobody had run the offset; it is measured three ways
  so the direction of each side is visible and the net is a number rather than a guess
- that measurement fills the only verdict in the audit with no cost and no reopening condition
  recorded against it; the verdict itself does not move
- cells that had blended two different things apart are separated by moving sentences, not
  rewriting them, and one ground that was left as not-found is settled either way
- an isolation experiment that lived only in a scratch file is folded into the committed probe
- playbook 82: a grep match proves a string exists, not that the thing it names is there"
git push && git push origin main:revdcf-preview
```

## §5 — 보고 후 멈춘다

```
§0 플레이북 #82 신설 · #78 한 줄(커밋 경로 열거 금지)
§1 세율 순효과 실측 — 커버리지 재측정 · A/B/C 3시나리오 · 방향 상쇄 크기 · 도미노 앵커
   → driver3 대가·재검토조건 채운 내용(🔴 실측에 걸린 문장만) · ③판정 불변 확인
§2 블렌드 분리(문장 이동만) · driver6 ③⑦ 확정 또는 "확인 불가"로 확정
§3 probe_881에 4갈래 조합 추가·재현 여부 · ":607" 22→고유21 부기 + "22행" 전수 목록
무변경: data/app/components/messages diff 없음 · DECISION_884 미적용 · REVDCF_ENABLED OFF · 크론 미실행 · revdcf_results 604×3
tsc 0 · test ?/? · push ? · git status ?? 0건
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **실측이 driver 3 판정을 뒤집는 방향이면 바꾸지 말고 중단·보고. DECISION_884를 적용하지 말 것.**
