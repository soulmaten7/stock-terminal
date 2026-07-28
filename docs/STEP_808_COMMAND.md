# STEP 808 — 🔴 806/807 회귀 마감 (데이터 손상 · 치명 실패 · 표시 모순 · 게이트 누락)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus` 🔴 **Opus 권장**

**전제 상태**: STEP 807 커밋 `5879ca4` + 문서 `9cdb44c` 이후 HEAD · 트리 클린

**배경(Cowork 재검수 07-28)**: 806/807 적용 후 재감사에서 **베타 차단 7건 + 승격 2건** 발견. §1은 매일 데이터를 손상시키고 있으므로 최우선.

---

## 수정

### 1) 🔴 pass2 upsert가 안 바뀐 렌즈 상태를 NULL로 덮어씀 (데이터 손상 · 최우선)

- `lib/lensPrecompute.ts`의 `pass2RemapAndDiff` — `patch`가 **그 종목에서 바뀐 상태 컬럼만** 담아 행마다 키 집합이 다르다. PostgREST upsert는 기본 `defaultToNull=true`라 배열 전체 키의 합집합을 `?columns=`로 지정하고, **키가 없는 행엔 NULL을 채워** 기존 값을 덮어쓴다.
- 결과: 매 크론마다 상태가 하나라도 바뀐 종목의 **나머지 렌즈 상태가 NULL** → 도트 소실, `lens-top`의 `MIN_COMPUTED>=4` 필터에서 탈락, 다음 날 `fromTone=null`로 **변화 누락**. 24h 뒤 pass1이 자가복구하지만 그날 화면은 틀림.
- 조치: **patch에 7개 상태를 전부 `finalState`로 채워 키를 균일화**(권장) 또는 `upsert(..., { onConflict:'symbol', defaultToNull:false })`. 어느 쪽을 택했는지와 이유를 보고에 기재.
- 🔴 **검증 필수**: 크론 1회 실행 후 `lens_scores`에서 **상태 컬럼이 NULL인 행 수**를 실행 전/후로 비교(0이어야 함).

### 2) 🔴 `loadCuts` 실패가 페이지·크론을 통째로 죽임

- 806에서 `lib/lensCompute.ts`가 `loadCuts`를 catch 없이 await하도록 바뀌어, DB 일시 오류 시 `/api/lens`가 `{error}`를 반환 → 화면이 **범용 "데이터를 불러오지 못했어요"**(가격·종목명·기술 렌즈·F-Score·브리핑까지 전부 소실). `lib/lensPrecompute.ts`도 무방비라 **크론이 통째로 500**(그날 선계산 0).
- 806이 약속한 "pending과 구분되는 **일시 오류** UI"는 실제로 존재하지 않는다(전용 문구 키 없음).
- 조치: ① 컷 조회 실패를 **치명 실패로 만들지 말 것** — 컷 없이도 계산 가능한 렌즈(기술·F-스코어)와 가격·이름은 정상 렌더 ② 분포 컷이 필요한 5개 렌즈만 **"기준을 불러오지 못했어요"**(pending과 다른 신규 문구·ko/en)로 표시 ③ Sentry 캡처 유지 ④ 크론은 컷 조회 실패 시 **pass2만 건너뛰고 pass1 결과는 저장**.

### 3) 🔴 F-스코어 max 가변화가 문구·임계값과 어긋남

- 806 §7에서 분할 의심 시 `no_dilute`를 제외해 `max`가 8이 될 수 있는데, 소비처는 전부 9·7 하드코딩: `messages/{ko,en}.json`의 "9개 중 {score}개"·"9개 항목"·"7점↑ 양호"·`narrativeStockFscore`, `StockLensClient`의 `band = score >= 7`, 헤더·닫는카드·`WatchlistClient`·`lensPrecompute`의 `>=7 / <=3`.
- 증상: 카드에 **"6 / 8"**과 **"9개 중 6개 양호"**가 나란히. `lens_scores.fscore_value`에 max가 없어 6/8과 7/9가 같은 축에서 비교됨.
- 조치(택1·근거 기재): (a) **max를 항상 9로 유지**하고 분할 의심 항목은 "판정 불가"로 두되 점수 계산에서만 제외하지 않기 — 즉 806 §7의 보수화를 되돌리고 다른 방식으로 오탐 방지 (b) max 가변을 유지하되 **문구·임계값·저장 스키마를 전부 max 비례로** 정합.
  - 🔴 (b)를 택하면 `lens_scores`에 `fscore_max` 추가가 필요하고 비교 축이 흔들린다 → **(a)가 단순하고 안전**하다는 점을 감안해 판단할 것.

### 4) 🔴 스펙트럼·레벨 라벨이 새 상대 문구와 모순

- 806 §1의 sanity 가드가 **verdict에만** 적용되고 `SPECTRUM_LABELS`·`LEVEL_LABELS`는 절대 표현("강세"/"약세")이 그대로다. `lib/lenses.ts`가 이들을 `mState` 기준으로 그리므로, **같은 카드에 "내렸지만 상위권"(verdict) + 스펙트럼 "강세" 점등**이 동시에 뜬다.
- 조치: 스펙트럼·레벨 라벨도 **상대 표현으로 정합**(예: "하위권 / 중간 / 상위권"). ko/en. 특성화 테스트가 `LEVEL_LABELS`를 바이트 고정하고 있으므로 **의도된 변경으로 갱신**.
- `LENS_OUTLOOK`이 `calmHigh`를 모르고 `lvState`로 조회해 "위험: 낮은 편"을 내는 문제도 함께 정합.

### 5) 🔴 `pending` 집계 누수 2곳 (806 §2 미완)

- **시간축(HorizonStrip)**: `verdict?.tone ?? 'flat'`이라 pending이 "중립/보통"으로 들어가고 `lStrong` 분모에도 포함 → 헤더는 "5개는 기준 준비 중"인데 시간축은 "중기 중립".
- **관심목록**: `WatchlistClient`의 온디맨드 톤 추출이 pending을 flat 도트로 카운트 → 같은 종목이 관심목록(도트 7)과 탐색 보드(도트 2)에서 다르게 보임(선계산 `toneForKey`는 pending을 null로 제외).
- 조치: 두 곳 모두 **pending 제외**. 806에서 만든 처리와 동일하게.

### 6) 🔴 KR 랭킹 API가 결측을 0으로 날조 (804 §1 미적용 경로)

- `app/api/krx/ranking/route.ts`의 `price/changePercent/tradeAmount/marketCap`에 `Number(...) || 0`. 탐색 KR "오늘 거래가 많았던 종목"의 원료라, 결측 시 **"+0.00%"라는 틀린 값**이 표시된다.
- 조치: `|| 0` 제거 → null 유지(표시층은 이미 null을 `—`로 처리). 정렬은 null 뒤로.
- 🔴 `|| 0`·`?? 0` 패턴을 **전 라우트·lib에서 다시 grep**해 수치 표시 필드의 0 폴백 잔여를 마감(카운트 등 0이 의미 있는 곳은 유지·사유 기재).

### 7) 🔴 `/api/news-brief` 활성 시장 게이트 누락 (806 §6 미완)

- `isActiveSymbol` 게이트가 `/api/brief`·`/api/lens`에만 들어가고 news-brief는 빠져, 파킹 시장 심볼로 **유료 LLM 생성**이 가능하다.
- 조치: 동일 게이트 추가(캐시 조회 앞). `docs/PARKED_FIELD_SURFACES.md` 진입점 표에 반영.

### 8) 🟠 `/api/lens` 보호 부재 + 캐시 무한 증가

- 인증·레이트리밋 없이 캐시 미스마다 야후 3콜 + Supabase 2쿼리. 사이트맵에 KR·US 심볼이 공개돼 있어 크롤러가 훑으면 **야후 레이트리밋을 유발해 크론까지 망가질 수 있다**.
- 인메모리 `cache` Map에 상한·만료 스윕이 없어 무한 증가.
- 조치: `lib/rateLimit.ts`의 봇 차단·상한을 `/api/lens`에도 적용(단 **캐시 히트는 통과** — 제품 가치). 캐시에 하드 상한 + 주기 스윕.

### 9) 🟠 `adjclose` 원소 단위 폴백 → 계열 단위로 (관찰 → 승격)

- `lib/lensCompute.ts`가 봉마다 `adj ?? close`로 채운다. 모멘텀은 `closes[len-252]`와 `closes[len-21]` **두 봉만** 쓰므로, 둘 중 하나만 adjclose 결측이면 배당·분할 누적계수만큼 **모멘텀이 통째로 틀리고** verdict·백분위·변화 피드까지 조용히 전파된다.
- 조치: **계열 전체가 유효할 때만 adjclose 사용, 아니면 raw 계열**. 어느 쪽을 썼는지 데이터에 표시(정직 표기용).

### 10) 정리 2건

- `app/api/vci-probe/route.ts` — 인증 없이 매 요청 외부 API로 POST하는 디버그 라우트. VN은 파킹이라 소비처 0 → **삭제**.
- 807의 `narrativeScopeVerifiedUs`("이 백테스트가 바로 미국 유니버스") — 백테스트 표본($5+·13코호트)과 현재 컷 유니버스(시총 상위 1000)가 **동일 집단이 아니다**. "자체검증됨" 단정을 **범위를 밝히는 표현**으로 완화.

### 11) 실측 1건 (수정 아님 · 보고만)

- `lib/lensPrecompute.ts`의 프루닝 임계(`saved/universe ≥ 0.8`)가 실제로 충족되는지 **KR·US 각각 실측**해 보고(정상 계산 불가 종목이 20%를 넘으면 프루닝이 매일 조용히 건너뛰어짐).

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build`
2. **§1 실증(최우선)**: 크론 실행 전/후 `lens_scores`의 상태 컬럼 NULL 행 수(0 유지).
3. **§2**: 컷 조회를 강제 실패시켜 상세 페이지가 **가격·기술·F-스코어까지 정상 렌더**되고 5개 렌즈만 "기준을 불러오지 못했어요"인지. 크론도 pass1은 저장되는지.
4. **§3**: 선택한 방식으로 카드에 "N / 9"와 문구가 일치하는지(분할 의심 종목 실사례).
5. **§4**: 12-1<0·상위30% 종목에서 verdict·스펙트럼·레벨 라벨이 **서로 모순 없는지** 화면 기준.
6. **§5**: pending이 있는 종목에서 시간축·관심목록이 pending을 세지 않는지.
7. **§6·§7**: KR 랭킹에 "+0.00%" 0건 · `/api/news-brief?symbol=7203.T` → 400.
8. **§9**: adjclose 일부 결측 종목에서 계열 폴백이 작동하는지.
9. KR·US 각 1종목 라이브 전수 확인(회귀 0).
10. 커밋:
    ```bash
    git add app/ components/ lib/ messages/ docs/
    git commit -m "STEP 808: fix pass2 null overwrite, non-fatal cuts failure, fscore max consistency, spectrum wording alignment, pending leaks, kr zero fabrication, news-brief gate"
    git push
    ```

## 완료 보고 → Cowork에게: §1 NULL 행 수 전후 + §3 선택 방식과 이유 + §4 모순 해소 사례 + §11 프루닝 비율 실측 + 커밋 해시.
