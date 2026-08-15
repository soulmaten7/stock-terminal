<!-- STEP 1032 — 프루닝을 켠다 (🔴 되돌릴 수 없는 삭제 · 장은태 승인 완료) + 기록·정정 3건 -->
# probe_1032 — 프루닝 활성화 + 삭제 상한 신설

## 전환 내용 한 줄

`lib/lensPrecompute.ts`의 `computeLensScores`(US) 호출부에서 `pruneEnabled: false`(1031이 하루 껐던 것)를 **`true`로 되돌렸다.** 동시에 `canPrune`(STEP833 4중 게이트)에 **5번째 게이트 — 삭제 상한(`PRUNE_MAX_ROWS=100`)**을 신설해, 게이트를 전부 통과해도 지울 행 수가 100을 넘으면 전량 중단하도록 했다. KR은 `pruneEnabled`(원래부터 `true`)는 무전달로 완전 불변, 상한(`pruneDecision`)만 공용으로 적용된다(실측상 KR엔 사실상 영향 없음 — §1-5).

**배포 시각 vs 21:30 UTC**: 아래 "배포 시각 대조" 절 참조.

---

## ⓪-1b 기존 답 확인

- `docs/KNOWN_ANSWERS.md`에 "프루닝"·"삭제 상한"·"좀비 행" 검색 — "프루닝은 지금 켜져 있는가" 1건만 존재(1031이 US를 껐다는 내용, 이 STEP이 다시 켜며 갱신 대상). "삭제 상한"·"좀비 행" 단독 항목 없음(신설 대상).
- **STEP833 `canPrune` 원 근거**(코드 주석, `lib/lensPrecompute.ts`) 재확인:
  - STEP806 §3: *"저장 성공률이 낮으면(부분 실행) 프루닝이 정상 행을 대량 삭제할 수 있음 → 성공률 ≥80%일 때만."*
  - STEP828 §2/§2-1: *"성공률 + 유니버스 하한(직전 실행 대비 70% 미만이면 붕괴) + pass2 성공을 모두 통과해야 프루닝."*
  - STEP833 §2: *"취득 게이트(cutGateOk)까지 4중 게이트를 모두 통과해야 프루닝(편향 유니버스로 정상 행 삭제 방지)."*
  - 🔑 **네 게이트 전부 "이번 계산이 잘 됐는가"만 본다.** "몇 행을 지우는가"라는 절대량 축은 원래 없었다 — 이 STEP이 그 빈 자리를 메운다. 5번째 게이트를 더하는 것이 기존 취지(편향/부분 실행으로부터 정상 행을 보호)와 어긋나지 않는다 — 오히려 같은 취지의 다른 실패 모드(유니버스 파일 자체가 잘못돼 4중 게이트를 전부 통과하며 대량 삭제되는 경우)를 막는다.
- **STEP1026("100행 이하" 기준) 원문 확인**(`docs/step_orders/STEP1026.md:58-63`): *"통과=≤100행 → 게이트 전환과 프루닝을 같이 켜도 위험이 작다. >100행 → 분리해야 한다."* 근거 = *"코드에 이미 `churnDecision` 임계 10%가 있고(유니버스 1,000→100종목), 어젯밤 실제 churn은 6.3%였다."* 🔴 **STEP1026 자신이 명시**: *"이 기준은 판단 보조일 뿐 판정이 아니다."* — 즉 100이라는 숫자는 다른 곳에서 이미 쓰던 10% 임계를 유니버스 규모에 대입한 유비추론이지, 프루닝 자체를 위해 도출된 통계값이 아니다.

---

## 1-1. 🔴 삭제 대상 76행 전수 백업 (삭제 전, 예외 없이)

**대조군 쿼리 — 프로덕션과 동일 조건**: 프로덕션 DELETE는 `sb.from("lens_scores").delete().eq("market","US").lt("updated_at", at)`(`at` = 이번 실행이 새로 쓴 행들의 공통 `updated_at`). 08-14 21:37:06.131 UTC 실행에서 963행이 이 값을 공유했고, 그보다 오래된 76행이 삭제 대상이었다(`select count(*) from lens_scores where market='US' and updated_at < '2026-08-14 21:37:06.131+00'` = 76, `wouldPruneRows` heartbeat 값과 정확히 일치).

**분류 기준**: 삭제 대상 76개 심볼을 현재 유니버스(`us_market_cap` 시총 상위 1,000, `pruneImpact()`가 쓰는 것과 동일한 판별 로직)와 대조 — 유니버스에 있으면 "계산실패(유니버스잔류)", 없으면 "유니버스이탈".

**요약**: 유니버스이탈 27건 · 계산실패(유니버스잔류) 49건 = 총 76건.

| # | symbol | name | price | momentum | lowvol | valuation | quality | assetgrowth | technical | fscore | updated_at (UTC) | 사유 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | ACM | AECOM | 73.57 | down | mid | cheap | low | conservative | down | strong | 2026-07-30 08:15:13 | 유니버스이탈 |
| 2 | AMG | Affiliated Managers Group, Inc. | 360.07 | up | mid | cheap | low | mid | up | strong | 2026-07-30 08:15:13 | 계산실패(유니버스잔류) |
| 3 | ARE | Alexandria Real Estate Equities | 53.77 | down | jumpy | na | low | conservative | up | mid | 2026-07-30 08:15:13 | 유니버스이탈 |
| 4 | BRKR | Bruker Corporation | 61.74 | up | jumpy | na | mid | mid | up | mid | 2026-07-30 08:15:13 | 유니버스이탈 |
| 5 | EDU | New Oriental Education & Techno | 58.58 | flat | mid | mid | high | mid | up | strong | 2026-07-30 08:15:13 | 계산실패(유니버스잔류) |
| 6 | GME | GameStop Corporation | 21.84 | flat | mid | cheap | low | aggressive | down | mid | 2026-07-30 08:15:13 | 유니버스이탈 |
| 7 | HLI | Houlihan Lokey, Inc. | 139.08 | down | mid | mid | mid | aggressive | down | na | 2026-07-30 08:15:13 | 유니버스이탈 |
| 8 | HMY | Harmony Gold Mining Company Lim | 15.53 | flat | jumpy | cheap | na | na | down | na | 2026-07-30 08:15:13 | 계산실패(유니버스잔류) |
| 9 | LAD | Lithia Motors, Inc. | 427.48 | flat | mid | cheap | mid | mid | up | weak | 2026-07-30 08:15:13 | 유니버스이탈 |
| 10 | NCLH | Norwegian Cruise Line Holdings | 20.75 | down | jumpy | cheap | mid | aggressive | up | mid | 2026-07-30 08:15:13 | 유니버스이탈 |
| 11 | NNN | NNN REIT, Inc. | 48.85 | flat | calm | mid | low | mid | up | mid | 2026-07-30 08:15:13 | 유니버스이탈 |
| 12 | TX | Ternium S.A. Ternium S.A. | 48.06 | up | mid | cheap | low | conservative | up | mid | 2026-07-30 08:15:13 | 유니버스이탈 |
| 13 | CIFR | Cipher Digital Inc. | 24.16 | up | jumpy | na | low | aggressive | up | na | 2026-08-03 22:05:04 | 유니버스이탈 |
| 14 | DCI | DCI | 96.02 | flat | mid | mid | high | conservative | up | mid | 2026-08-03 22:05:04 | 계산실패(유니버스잔류) |
| 15 | VIRT | VIRT | 58.87 | up | mid | cheap | low | aggressive | up | strong | 2026-08-03 22:05:04 | 유니버스이탈 |
| 16 | EA | Electronic Arts Inc. | 209.7 | flat | calm | rich | high | mid | up | strong | 2026-08-04 22:18:26 | 계산실패(유니버스잔류) |
| 17 | ADI | ADI | 377.31 | up | mid | rich | mid | conservative | up | strong | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 18 | AIT | Applied Industrial Technologies | 358.91 | flat | calm | mid | high | mid | up | mid | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 19 | AMH | American Homes 4 Rent | 34.55 | flat | calm | mid | low | conservative | up | strong | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 20 | AS | AS | 36.11 | down | jumpy | rich | high | aggressive | up | strong | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 21 | AXIA | AXIA Energia | 10.22 | up | jumpy | cheap | low | conservative | down | mid | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 22 | AZO | AZO | 3069.62 | down | mid | mid | high | aggressive | down | mid | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 23 | BBY | BBY | 80.02 | flat | mid | cheap | high | conservative | up | strong | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 24 | COO | COO | 73.32 | flat | mid | rich | mid | conservative | up | mid | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 25 | CRM | CRM | 186.77 | down | jumpy | mid | mid | mid | down | strong | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 26 | CX | CX | 11.3 | up | mid | rich | mid | mid | down | strong | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 27 | DAL | DAL | 91.98 | up | mid | cheap | mid | mid | up | strong | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 28 | DY | DY | 399.57 | up | jumpy | rich | mid | aggressive | up | mid | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 29 | EL | EL | 85.49 | down | jumpy | na | high | conservative | down | weak | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 30 | FN | Fabrinet | 543.95 | up | jumpy | rich | mid | aggressive | up | na | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 31 | GFI | Gold Fields Limited | 37.34 | flat | jumpy | cheap | high | aggressive | down | strong | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 32 | HD | HD | 349.52 | down | calm | mid | high | mid | up | mid | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 33 | HEI | Heico Corporation | 363.29 | flat | mid | rich | mid | mid | up | strong | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 34 | HPQ | HP Inc. | 28.18 | flat | jumpy | cheap | mid | mid | up | mid | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 35 | HRL | Hormel Foods Corporation | 25.09 | down | mid | mid | mid | conservative | up | mid | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 36 | IBN | ICICI Bank Limited | 30.48 | down | calm | mid | na | mid | up | na | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 37 | IMO | Imperial Oil Limited | 126.29 | up | mid | mid | low | conservative | up | mid | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 38 | IOT | Samsara Inc. | 38.22 | flat | jumpy | rich | high | aggressive | up | na | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 39 | ITT | ITT Inc. | 214.41 | flat | mid | rich | mid | aggressive | up | mid | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 40 | JD | JD | 32.81 | down | mid | mid | mid | conservative | up | mid | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 41 | KOF | Coca Cola Femsa S.A.B. de C.V. | 109.26 | flat | calm | cheap | high | conservative | up | mid | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 42 | KR | Kroger Company (The) | 57.32 | down | mid | mid | high | conservative | down | mid | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 43 | LOW | LOW | 218.4 | down | mid | mid | high | aggressive | down | mid | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 44 | LTM | LATAM Airlines Group S.A. | 57.45 | flat | jumpy | cheap | mid | aggressive | up | na | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 45 | MDT | Medtronic plc. | 85.92 | down | calm | mid | mid | conservative | down | strong | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 46 | MU | MU | 881.47 | up | jumpy | mid | mid | aggressive | up | strong | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 47 | NIO | NIO Inc. | 4.6 | flat | jumpy | na | low | aggressive | down | mid | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 48 | NOK | Nokia Corporation Sponsored | 9.43 | up | jumpy | rich | mid | conservative | up | mid | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 49 | P | P | 87.26 | up | jumpy | rich | high | aggressive | up | na | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 50 | PHM | PHM | 129.55 | flat | mid | cheap | mid | mid | up | mid | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 51 | PPL | PPL Corporation | 34.62 | flat | calm | mid | low | mid | down | strong | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 52 | QH | Quhuo Limited | 4.53 | down | jumpy | na | low | conservative | up | na | 2026-08-06 22:03:47 | 유니버스이탈 |
| 53 | SE | Sea Limited | 111 | down | jumpy | rich | high | aggressive | up | strong | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 54 | SNX | TD SYNNEX Corporation | 259.21 | up | mid | mid | low | aggressive | up | strong | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 55 | TGT | Target Corporation | 147.08 | flat | mid | mid | high | mid | up | mid | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 56 | TOL | TOL | 151.33 | flat | mid | cheap | mid | mid | up | mid | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 57 | TRP | TC Energy Corporation | 63.9 | up | calm | mid | low | conservative | up | mid | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 58 | TS | Tenaris S.A. | 53.4 | up | mid | cheap | mid | conservative | up | mid | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 59 | VIV | Telefonica Brasil S.A. | 12.08 | flat | mid | cheap | mid | mid | down | strong | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 60 | WDC | Western Digital Corporation | 451.52 | up | jumpy | mid | mid | conservative | up | mid | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 61 | WDS | Woodside Energy Group Limited | 22.7 | flat | mid | cheap | low | mid | up | mid | 2026-08-06 22:03:47 | 계산실패(유니버스잔류) |
| 62 | BROS | Dutch Bros Inc. | 53.01 | down | jumpy | rich | mid | aggressive | down | mid | 2026-08-07 21:37:39 | 유니버스이탈 |
| 63 | LEVI | Levi Strauss & Co | 24.41 | flat | mid | cheap | high | mid | up | strong | 2026-08-07 21:37:39 | 유니버스이탈 |
| 64 | SYRE | SYRE | 104.91 | up | jumpy | na | na | na | up | na | 2026-08-07 21:37:39 | 유니버스이탈 |
| 65 | KNTK | Kinetik Holdings Inc. | 51.27 | flat | mid | cheap | low | mid | up | mid | 2026-08-10 22:28:34 | 유니버스이탈 |
| 66 | PJT | PJT Partners Inc. | 169.36 | down | mid | mid | mid | aggressive | up | na | 2026-08-10 22:28:34 | 유니버스이탈 |
| 67 | BRX | BRX | (null) | flat | calm | na | na | na | up | na | 2026-08-11 22:00:53 | 유니버스이탈 |
| 68 | CHWY | CHWY | 22.47 | down | jumpy | rich | high | mid | down | na | 2026-08-11 22:00:53 | 유니버스이탈 |
| 69 | CTRE | CTRE | 38.68 | flat | calm | mid | na | na | up | na | 2026-08-11 22:00:53 | 유니버스이탈 |
| 70 | MAAS | Maase Inc. | 20.89 | up | jumpy | na | na | na | up | na | 2026-08-11 22:00:53 | 유니버스이탈 |
| 71 | SARO | SARO | 28.2 | down | mid | mid | low | mid | up | strong | 2026-08-11 22:00:53 | 유니버스이탈 |
| 72 | SFD | SFD | 23.88 | flat | calm | cheap | mid | mid | down | strong | 2026-08-11 22:00:53 | 유니버스이탈 |
| 73 | SNAP | Snap Inc. | 5.51 | down | jumpy | na | high | conservative | down | mid | 2026-08-11 22:00:53 | 유니버스이탈 |
| 74 | AVTR | AVTR | (null) | down | jumpy | na | na | na | up | na | 2026-08-12 21:56:34 | 유니버스이탈 |
| 75 | GGB | Gerdau S.A. | 4.83 | up | mid | mid | low | conservative | up | mid | 2026-08-12 21:56:34 | 유니버스이탈 |
| 76 | YMM | Full Truck Alliance Co. Ltd. | 9.27 | down | mid | cheap | mid | mid | down | na | 2026-08-12 21:56:34 | 유니버스이탈 |

🔴 **삭제 후에는 이 표가 유일한 원본이다.** DB 조회로 미리 뽑아 문서에 박아둔다 — 위 76행이 그 전부(요약 아님).

---

## 1-2. 프루닝 활성화 (`lib/lensPrecompute.ts`)

`computeLensScores`(US) 호출부: `pruneEnabled: false` → `pruneEnabled: true`. 파라미터 구조(opt-in, 기본 `true`)는 1031이 만든 그대로 남긴다 — 되돌릴 땐 다시 `false`만 넣으면 된다. 1031이 남긴 차단 주석은 지우지 않고 "STEP1032에서 해제됨"으로 갱신, `pruneBlockedByFlag` 관측 필드는 그대로 둔다(이제 `false`가 정상값).

## 1-2b. 삭제 상한 신설 — 순수 함수 `pruneDecision`

STEP833의 판정 함수들(`capGateDecision`·`churnDecision`)과 같은 패턴으로, 프루닝 판정도 순수 함수로 분리했다(값 잠금 테스트 대상):

```ts
export function pruneDecision(opts: {
  pruneEnabled: boolean; successRate: number; universeOk: boolean; pass2Ok: boolean; cutGateOk: boolean;
  rowsToPrune: number; maxRows?: number;
}): { shouldPrune: boolean; aborted: boolean; gate4: boolean } {
  const maxRows = opts.maxRows ?? 100;
  const gate4 = opts.successRate >= 0.8 && opts.universeOk && opts.pass2Ok && opts.cutGateOk; // STEP833 4중 게이트, 한 글자도 안 바꿈
  const eligible = opts.pruneEnabled && gate4;
  const aborted = eligible && opts.rowsToPrune > maxRows;
  const shouldPrune = eligible && !aborted;
  return { shouldPrune, aborted, gate4 };
}
```

`computeLensScoresFor`는 `pruneEnabled && gate4`일 때만 지울 행수를 COUNT 쿼리로 조회(다른 사유로 이미 차단이면 쿼리 자체를 안 함)하고, 그 값을 `pruneDecision()`에 넘겨 최종 판정을 받는다. **기존 4개 조건은 함수 안에서 한 글자도 안 바꿨다** — `gate4` 계산식이 STEP833 원문(`successRate>=0.8 && universeOk && pass2Ok && cutGateOk`) 그대로다. 상한에 걸리면(`aborted`) 일부만 지우지 않고 전량 중단하며, `[lens-prune-abort]` Sentry error를 낸다(833의 게이트 실패와 같은 급). heartbeat(`lens-scores`, US)에 `pruneAborted`·`pruneRowsAttempted` 신규 필드 배선.

**PRUNE_MAX_ROWS=100의 근거 — 2일 관측뿐임을 명시**: 08-13 실측 63행, 08-14 실측 76행(하루 만에 +20.6%). 🔴 **76이 상한이라는 근거는 없다.** 이 상한(100)은 STEP1026이 세운 기준을 그대로 가져온 것이고, STEP1026 자신이 이미 *"판단 보조일 뿐 판정이 아니다"*라고 명시했다(⓪-1b 인용). 표본이 늘어나면(며칠 더 관측) 재검토가 필요할 수 있다.

**US·KR 공용으로 설계한 이유**: `pruneEnabled`(1031, 시장별 opt-in)와 달리 이 상한은 `canPrune`의 4중 게이트와 같은 함수(`computeLensScoresFor`) 안에 있고, 그 4중 게이트 자체가 이미 US·KR 공용이다. "유니버스 파일이 잘못 바뀌어 대량 삭제되는" 위험은 시장을 가리지 않는다는 판단으로 공용 적용했다 — 아래 §1-5에서 KR 실측 프루닝 대상이 항상 0행임을 확인, 상한이 KR에서 실질적으로 걸릴 일이 없음을 근거로 남긴다.

## 1-3. 테스트 — 보존 + 확장

`lib/lensUniverseGate.test.ts`: **STEP833의 11개 + STEP1031의 6개, 총 17개 `it()` 전부 보존**(구조·문자열 무수정). 새 `describe("§4 pruneDecision...")` 블록에 6개 추가:
- 상한 경계(정확히 100 → 지운다 / 101 → 중단)
- `maxRows` 오버라이드(10으로 낮추면 11도 중단)
- `pruneEnabled=false`면 상한과 무관하게 차단(`aborted`는 `false` — "명시적 차단"과 "상한 초과"는 사유가 다르다는 것을 필드로도 구분)
- 4중 게이트(STEP833) 실패 시 상한과 무관하게 차단 — `cutGateOk=false` 단독 케이스
- 4중 게이트 실패 시 상한과 무관하게 차단 — `universeOk`·`pass2Ok`·`successRate<0.8` 각각
- `maxRows` 미지정 시 기본값 100(프로덕션과 동일 상수) 확인

tsc 0 · vitest **384/384**(378+6신규, 기존 378개 전부 무수정 재확인 통과 — STEP1032는 `capGateDecision`·`churnDecision`을 손대지 않았다).

## 1-4. 정정·기록 3건

1. **`docs/STATE.md:62`** — Q1 재료 현황을 실측(PER 2,067·PBR 3,279·PSR 3,554·EV/EBITDA 1,451, `as_of=2026-08-14`·5,820행)으로 교체. `docs/STATE.md:210`의 "Q1 착수 준비" 목록에서 "EV/EBITDA·PSR SEC 태그 조립" 제거(이미 완료). 47번 항목(`lens_cuts` 정지 진단)에 "정지 자체가 해소됐다" 갱신 문단 추가.
2. **`docs/probe_1031_gate_activation.md`** — "63행(6.08%)" → 실측 **76행(7.3%)** 정정 + §0-A 성공 표를 문서 상단에 그대로 추가(취소선 방식이 아니라 정정 블록을 위에 새로 얹음 — 원문은 그대로 보존).
3. **W4 괴리 기록**(`docs/REVDCF_SPEC.md` §10-J) — 예측 11.3% vs 실측 6.2%, 검산(08-13 컷정지 106건/08-14 컷재유도 169건, 차분 63÷1,039=6.1%로 heartbeat `churn` 0.062와 부합), **상쇄 가설은 미검증으로 명시**, 장은태 판정("기록만, 규명 안 함")을 함께 기록.

## 1-5. 값 불변 확인 + KR 무영향

배포 직전(프루닝 실행 전) 확인:

| 대상 | 값 |
|---|---|
| `lens_scores` US | 1,039행 |
| `lens_cuts` US `as_of` | 2026-08-14 |
| `revdcf_results`·`us_valuation`·`us_sector_relative` | 08-14 (전 STEP과 동일) |
| `lens_cuts` KR `as_of` | 2026-08-13(정상, US 전환이 안 건드림) |
| 보호 파일 diff | `app/api/cron/revdcf/route.ts`·`data/us_symbols.json`·`vercel.json` 전부 0 |

**KR 무영향 실측**: `lens_scores` market='KR' 978행 전부가 **단일 `updated_at`**(`2026-08-13 10:40:46.517+00`)을 공유 — 즉 KR의 오늘자 "지울 행 수"는 **0행**이다. `pruneEnabled`는 KR 호출부가 여전히 무전달(기본 `true`, 1031·1032 둘 다 안 건드림)이고, 신설된 상한(100)도 0행이라 애초에 걸릴 여지가 없다. **KR 경로 코드 diff**: `computeKrLensScores`·`topKrByMarketCap` 어느 줄도 이 STEP에서 수정하지 않았다(`git diff` 확인 — 변경은 `capGateDecision`·`churnDecision` 다음에 신설한 `pruneDecision`과 `computeLensScoresFor`/`computeLensScores`(US) 뿐).

## 1-6. 배포 시각 대조

(커밋·push·Vercel Ready 확인 후 기록 — 아래 채움)

---

## ⓪-4 반증 조건 매트릭스(오늘 밤 21:30 UTC 이후 확인 — 그대로 인용)

| 관측 | 결론 | 다음 축 |
|---|---|---|
| `pruned=true`·`pruneBlockedByFlag=false`·`lens_scores` US **1,039 → 960~970행** | 🔑 정상. 좀비 정리 완료 | Q1으로 |
| 🔴 삭제 행이 100을 넘어 상한에 걸림(`pruneAborted=true`) | 🔑 상한이 제 일을 했다. 사고를 막은 것 | 왜 늘었는지 규명 |
| 🔴 100을 넘었는데 그대로 지워졌다 | 🔴 상한 배선 실패. 즉시 크게 보고 | 복구 + 재설계 |
| `pruned=false`인데 이유 불명 | 배선이 실행 경로를 안 탐 | 배선 재확인 |
| 🔴 컷이 다시 정지(`cutGateOk=false`) | 1031과 별개 축 — 커버리지가 그날 나빴다는 뜻 | 게이트 재검토 |

---

## 3중 규칙

- **못 한 축**: 오늘 밤 21:30 UTC 실제 프루닝 실행 결과 — 아직 미도래(이 STEP은 코드·상한·백업까지). `pruneAborted`가 실제로 걸리는 경우를 관측한 적은 아직 없다(항상 76 이하였다).
- **철회·정정**: `docs/probe_1031_gate_activation.md`의 "63행"·"11.3%"를 이 STEP에서 정정(§1-4 참조) — 원문은 지우지 않고 정정 블록을 얹었다.
- **미측정**: 오늘 밤 실행 후 실제 `pruned`·`lens_scores` 행수 변화·`pruneAborted` 값 — ⓪-4 매트릭스 전부 미도래. W4 괴리(11.3% vs 6.2%)의 진짜 원인 — 장은태 판정으로 규명 자체를 안 함(의도적 미측정).

## 판정 요청(다음, 장은태)

🔴 **다음은 Q1이다** — 「기존 7렌즈를 수리할지 Q1~Q4 카드를 신설할지」 판정 자료가 다음 대상이다. 이 STEP은 곁가지 STEP을 새로 만들지 않는다.
