<!-- 2026-08-08 · Cowork 작성 · Claude Code 실행용 -->

# STEP 944 — Q0 구현 ⑤ 준비: **해석 결과 영속화 ＋ 컷 적용/제외 확정 ＋ 갱신 경로**

> **범위**: `resolveSector` 결과를 테이블로 **저장**하고, `sector_cuts`에 **적용/제외를 명시**하고, **갱신 스크립트**를 만든다.
> 🔴 **화면 코드는 이 STEP에서도 diff 0.** 🔴 **기존 렌즈 판정 로직도 건드리지 않는다.** 🔴 **크론 등록도 하지 않는다**(별도 승인).

---

## 🔴 확정된 판정 (2026-08-08 장은태)

**A 유지 — 업종 대비 판정을 한다.** §2의 형태 확정(각 카드에 「업종 대비」로 녹임)을 그대로 간다.
근거 실측 = 시장 전체 컷 → 섹터 컷 전환 시 **판정 변경 퀄리티 33.8% · 저변동 33.6% · 밸류 33.0% · 모멘텀 20.1% · 자산성장 15.8%.**

**ⓚ 확정 — 「IQR 대비 1.0 초과 조합만 제외」.** 78개 중 **7개 제외 · 71개(91%) 적용.**
🔑 **1.0의 근거**: *"컷의 불확실성 폭이 그 섹터 데이터의 산포(IQR)보다 커지는 지점"* — 그 위에서는 **컷이 데이터보다 노이즈가 크다.**

**제외 7건 (전건)**

| 섹터 | 지표 | n | IQR 대비 |
|---|---|:--:|:--:|
| Real Estate | valuation | 47 | 1.99 |
| Utilities | lowvol | 43 | 1.58 |
| Real Estate | assetgrowth | 48 | 1.46 |
| Utilities | quality | 43 | 1.27 |
| Communication Services | valuation | 42 | 1.16 |
| Communication Services | assetgrowth | 50 | 1.16 |
| Real Estate | quality | 47 | 1.01 |

🔑 **「섹터 크기」가 기준이 아니었다** — Real Estate(n=47~48)가 Utilities(43)보다 큰데 더 불안정하다. **분포 형태의 문제**다.

---

## 🔴 제외 조합의 처리 — **기존 원칙의 적용이지 새 규칙이 아니다**

§Q Q0에서 이미 확정한 원칙이 있다.

> **「미분류」 화면 처리 — 「업종 대비」 줄만 비운다.** 카드와 지표 숫자는 그대로 뜨고 업종 비교 문장만 대체한다.
> 🔴 **시장 전체 컷으로 대체하지 않는다** — 그것이 정확히 **밸류 렌즈 결함 ⑤**다.

**제외 7조합도 같게 처리한다.** 사유만 다르다.

| 경우 | 사유 문구(예시 · 최종 문구는 ⑤에서 확정) |
|---|---|
| 업종 미분류 | *"업종 정보가 없어 업종 비교는 표시하지 않습니다"* |
| **제외 조합** | *"이 업종에서는 이 지표의 비교 기준이 불안정해 표시하지 않습니다"* |

🔴 **시장 전체 컷 폴백은 금지다.** 결함 ⑤를 되살리는 것이다.

---

## ⓪-4 4×3 기록

### ③ 자체 데이터 확인 (Cowork)

| # | 열어본 것 | 결과 |
|:--:|---|---|
| 1 | `docs/probe_943_sector_cuts.json` | 78개 조합 · 부트스트랩 IQR 대비 · 제외 7건 확정 |
| 2 | `lib/sector.ts` | `resolveSector`가 **호출마다 DB에서 맵 4개를 로드** — 🔴 종목 페이지에서 매번 돌리면 비싸다 |
| 3 | `sector_cuts` 스키마 | `market`·`sector`·`metric_key`·`lo`·`hi`·`n`·`method`·`as_of` — 🔴 **적용/제외를 표시할 칸이 없다** |
| 4 | `docs/probe_942_final_resolve.json` | 출처별 건수 · `disagree` 266건 |

### ① 3번 검색 ＋ ⓪-5-B

```
필요한 데이터 : 없음 — 기존 저장값을 영속화·표기하는 STEP
link_hub 후보 : 해당 없음
실제 조회     : 미실시
직접 웹검색   : 미실시
```
🔴 **못 한 축으로 명시.**

### ② 3번 검증

1. **영속화 정합** — 저장된 테이블이 `resolveSector` 실시간 결과와 **전 종목 일치**해야 한다
2. **제외 표기 정합** — `sector_cuts`의 제외 표시가 943 리포트의 7건과 **정확히 일치**해야 한다
3. **회귀** — `industryGroup` 모드·역DCF 경로·기존 렌즈 판정 **전부 불변**

### ④ 3번 검수 (자기 공격)

1. 🔴 **영속화 테이블이 진실의 원천이 되면 안 된다.** `resolveSector`가 정본이고 테이블은 **캐시**다. 갱신 스크립트로 언제든 재생성 가능해야 한다.
2. 🔴 **제외 조합을 「삭제」하지 말 것.** 행은 남기고 **플래그로 표시**한다 — 왜 제외됐는지가 보여야 하고, 임계가 바뀌면 되살릴 수 있어야 한다.
3. 🔴 **크론을 등록하지 말 것.** 스크립트만 만든다. 자동 실행은 별도 승인 사항이다.

---

## 실행 지시

### 1. `sector_cuts`에 적용/제외 표기 추가

```
컬럼 추가 (기존 행 삭제·수정 없이)
  applied        boolean   -- 실제 판정에 쓸 것인가
  exclude_reason text|null -- 제외 사유. 예: "bootstrap_width_over_iqr=1.99 > 1.0"
  width_over_iqr double|null -- 943에서 잰 값(p30·p70 중 큰 쪽)

🔴 임계 1.0은 코드에 상수로 박지 말고 스크립트 인자·상수 한 곳에 두고 그 값을 exclude_reason에 문자열로 남길 것
   (규칙 5-2 — 값이 아니라 식. 임계가 바뀌면 재계산만 하면 되게)
```

### 2. `us_sector_resolved` 테이블 신설 ＋ 적재

```
us_sector_resolved
  as_of(date) · symbol(text) · sector(text|null) · source(text|null)
  · cross_nasdaq · cross_sic · cross_yahoo (각 text|null)
  · disagree(boolean)
  PK (as_of, symbol) · 🔴 RLS는 us_sector_nasdaq과 동일 패턴

🔴 이 테이블은 캐시다. resolveSector가 정본.
🔴 적재는 resolveSector를 그대로 호출해 만든다(로직 복제 금지 — 규칙 5-2 ①).
```

### 3. 갱신 스크립트

`scripts/refresh_sector.ts` — 아래를 순서대로 수행하고 **각 단계 건수를 출력**:

```
① us_sector_resolved 재생성 (resolveSector 호출 → upsert)
② sector_cuts 재계산 (943의 lib/sectorCuts.ts 재사용 — 로직 복제 금지)
③ 부트스트랩 재실행 → width_over_iqr 갱신 → applied/exclude_reason 갱신
   🔴 고정 시드 유지(943과 같은 값을 쓰고, 시드를 출력에 남길 것)

🔴 크론 등록 금지. 실행은 수동(npx tsx scripts/refresh_sector.ts).
🔴 재실행 안전(같은 as_of면 upsert).
```

### 4. 검증 리포트 (`docs/probe_944_persist.json`)

1. **영속화 정합** — `us_sector_resolved` vs `resolveSector` 실시간 결과: **전 종목 일치 여부**(불일치가 있으면 전건 목록)
2. **제외 표기 정합** — `applied=false` 행이 943의 7건과 일치하는지
3. **적용 요약** — `applied=true` 조합 수 · 섹터별·지표별 분포
4. 🔑 **「업종 대비를 표시할 수 없는」 (종목 × 지표) 조합 수** — 미분류 종목 ＋ 제외 조합에 속한 종목. **⑤ 화면 설계의 직접 입력**
5. 갱신 스크립트 실행 소요 시간(초) — 나중에 크론 주기를 정할 재료

**Cowork 사전 추정** — 🔴 **없음.** 4번은 처음 재는 값이다.

### 5. 테스트

1. 영속화 테이블과 `resolveSector` 결과가 같은 종목 표본에서 일치
2. 🔴 `applied=false` 조합은 컷 조회 시 **null을 반환**(시장 전체 컷으로 폴백하지 **않음**)
3. 임계값을 바꾸면 `applied` 집합이 바뀐다(상수 한 곳에서 제어됨을 증명)
4. 🔴 **회귀**: 기존 테스트 전부 통과 · `lens_cuts` 읽기 경로·역DCF 경로 불변

### 6. 문서

- `docs/CHANGELOG.md` **(105) STEP 944** — 정합 결과 · 적용/제외 건수 · **「업종 대비 표시 불가」 조합 수**를 수치 그대로
- `docs/STATE.md` ▶다음 0번 — **④단계 ✅ 완료 · ⑤(화면)가 다음임을 명시** · 🔴 **⑤ 착수 전 판정 필요: ⓕ(어휘 충돌) · ⓛ(disagree 표시 규칙) · 그리고 「기존 7렌즈를 수리할지 Q1~Q4 카드를 새로 만들지」**
- `lib/revdcf/registry.ts` — `us_sector_resolved` 등재
- `docs/STEP_LEDGER.md` 등재

🔴 **`CLAUDE.md` · `docs/USER_QUESTIONS_2026-08-08.md` · `docs/LENS_COMPLETION_STANDARD.md`는 고치지 않는다.**

---

## 🔴 금지 (전부 불변)

- 🔴 **화면·UI 코드 — 손대지 않는다**
- 🔴 **기존 렌즈 판정 로직(`lib/lenses.ts`·`lensCompute.ts`·`lensPrecompute.ts`) 수정 금지**
- 🔴 **`lens_cuts` 쓰기 금지** (읽기만)
- 🔴 **크론 등록 금지**
- 🔴 **`sector_cuts` 기존 행 삭제 금지** — 컬럼 추가와 플래그 갱신만
- 🔴 **시장 전체 컷 폴백 구현 금지** — 결함 ⑤ 재현
- `revdcf_results` · `us_market_cap` · `lens_scores` — **쓰기 금지**
- `REVDCF_ENABLED` · `data/us_symbols.json` · `.github/workflows/**` · `vercel.json` — 불변
- `probe_*` 기존 파일 — 불변
- KR 관련(`ACTIVE_MARKETS` · KR 크론 3개 · `messages/ko.json` · `messages.test.ts` 패리티) — **끄지 않는다**
- 🔴 **API 키·비밀번호를 어떤 필드에도 입력하지 않는다**

## 성공 기준

1. `us_sector_resolved` 적재 · **`resolveSector` 실시간 결과와 전 종목 일치**
2. `sector_cuts`에 `applied`·`exclude_reason`·`width_over_iqr` 추가 · **제외 7건이 943과 일치**
3. `scripts/refresh_sector.ts` 동작 · 재실행 안전 · **크론 미등록**
4. 🔑 **「업종 대비 표시 불가」 조합 수 산출**(⑤ 입력)
5. `npm test` · `npx tsc --noEmit` 통과 · **화면·렌즈·역DCF 경로 diff 0**

## 🔴 막히면

**추측해서 진행하지 말고 멈추고 보고할 것.** 특히 ① 영속화와 실시간 결과 불일치 ② 제외 7건이 943과 다름 ③ 부트스트랩 재실행 결과가 943과 다름(시드 고정이 깨진 신호) — 이 셋은 **반드시 멈춘다.**
