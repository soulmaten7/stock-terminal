# STEP 806 — 🔴 상대 컷과 문구 정합 + pending 누수 · 프루닝 안전 · 쿠키 마이그레이션

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus` 🔴 **Opus 권장**(판정 문구 체계 · 데이터 안전)

**전제 상태**: STEP 805 커밋 `68b9052` 이후 HEAD · 트리 클린

**배경(Cowork 재검수 07-28)**: 799~805 적용 후 재감사에서 **베타 차단 5건** 발견. 그중 §1은 STEP 802 설계(분포 유도 컷)의 부작용으로, **Cowork 지시의 결함**이다.

---

## 수정

### 1) 🔴 상대 컷 + 절대 문구 충돌 (최우선 · 거짓 진술)

**문제**: p30/p70은 **항상** 시장의 30%를 `up`/`cheap`/`calm`으로 만든다. 그런데 판정 문구는 절대 표현이다.
- 하락장에서 12-1 = **−25%**인 종목이 상위 30%에 들면 → verdict **"강한 상승 추세 · 최근 꾸준히 오르고 있어요"**, 바로 위 headline은 `12-1 -25%`. **명백한 거짓**.
- 고변동 국면에서 연변동성 **55%**가 "낮은 변동성"이 된다.
- `LENS_OUTLOOK`의 "유리한 편"도 그대로 붙는다.

**조치 — 문구를 기법의 실제 성격(횡단면 순위)에 맞춘다**:
- 분포 유도 컷을 쓰는 5개 렌즈(모멘텀·밸류·퀄리티·자산성장·저변동)의 verdict 문구를 **상대 표현**으로 재작성: 예 "시장 상위권 · 모멘텀", "시장에서 싼 편", "변동이 적은 편(시장 대비)". **절대 방향 단정("오르고 있어요") 금지.**
- 추가로 **절대 sanity 가드**: 방향을 함의하는 렌즈는 절대값과 모순되면 그 문구를 쓰지 않는다 — 모멘텀 12-1 < 0이면 `up` 계열 문구 금지(대신 "하락 폭이 시장에서 작은 편" 계열 또는 중립 처리). 저변동성도 절대 수준이 극단이면 상대 표현에 그 사실을 병기.
- `LENS_OUTLOOK`(이 기법 방향) 문장도 같은 원칙으로 점검·수정.
- headline(절대값)과 verdict(상대 위치)가 **한 화면에서 서로 모순되지 않는지** 렌즈별로 눈으로 확인하고 보고에 사례 기재.
- 서사의 컷 출처 표기(`KR 분포 하위/상위 30% 기준`)는 유지 — 상대 표현과 함께 있어야 의미가 산다.
- ko/en 패리티. 브랜드 톤(건조·해요체) 유지.

### 2) 🔴 `pending`이 집계에서 "보통"으로 샘

- `lib/lenses.ts`의 `pendingRead` tone이 `'flat'`이라, `StockLensClient`의 헤더 도트·"강점 N · 주의 N · 보통 N"·788 종합 카드·`byHorizon` 시간축이 **판정한 것처럼** 센다. 카드 본문은 "기준 준비 중"인데 요약은 "보통 5" → 자기모순. 5개가 pending이면 `closingInsufficient` 가드도 뚫린다.
- 조치: `na`와 동일하게 **집계에서 제외**하고 별도 카운트("N개는 기준 준비 중")로 표기. `naCount` 옆에 `pendingCount` 신설.
- 🔴 **테스트 추가**: `lenses.charac.test.ts`는 컷이 항상 주입된 경로만 커버해 이 버그를 못 잡았다 → **컷 미주입(pending) 경로 테스트**를 신설.

### 3) 🔴 신선도 프루닝 대량 삭제 위험

- `lib/lensPrecompute.ts`의 `delete().lt(updated_at, at)`에 성공률 가드가 없다. 크론이 200종목만 저장하고 중단되면 **나머지 800행이 삭제**된다(종목별 실패는 조용히 스킵).
- 조치: **`saved / universe.length ≥ 0.8`일 때만 프루닝**. 미달 시 프루닝 건너뛰고 **Sentry 경고**(조용히 넘어가지 말 것).

### 4) 🔴 `loadCuts` 실패와 "컷 없음"을 구분

- `lib/lensCuts.ts`가 `error`를 검사하지 않아 DB 오류 시 빈 맵 → 전부 `pending`. 이때 `lens_scores`엔 정상 상태가 있으므로 **같은 종목이 탐색에선 "강점 3", 상세에선 "기준 준비 중"**으로 갈린다. Sentry에도 안 잡힘.
- 조치: `error` 검사 + Sentry 캡처. 실패는 `pending`이 아니라 **"일시 오류"**로 구분해 화면 문구도 다르게(정직 표기).
- 성능: 컷은 하루 1회만 바뀌므로 **모듈 레벨 TTL 캐시(10분)** 추가(현재 요청마다 DB 1회 + admin 클라이언트 신규 생성).

### 5) 🔴 레거시 `NEXT_LOCALE=en` 쿠키 잔류

- STEP 800 이전에는 next-intl이 URL 방문마다 쿠키를 덮어썼다. 그때 `/en`을 한 번이라도 밟은 한국 사용자는 **쿠키가 en으로 남아, 배포 후 모든 프리픽스 없는 경로가 영구히 `/en`으로 리다이렉트**된다. "명시 선택만 쿠키를 바꾼다"는 새 전제가 레거시 쿠키엔 성립하지 않는다.
- 조치: **쿠키 키를 갈아탄다** — 새 키(예: `locale_choice`)를 쓰고 레거시 `NEXT_LOCALE`은 **읽지 않음**(있으면 삭제). 새 키가 없으면 기본 ko. 언어 버튼이 새 키를 심는다.
- 🔴 `/auth/callback`·`post_login_locale` 왕복(795)과 충돌하지 않는지 확인. **`redirectTo` byte 불변**(710D).

### 6) 🔴 `/api/brief`·`/api/lens` 활성 시장 게이트

- `/api/brief`는 심볼 정규식만 검사해 파킹 시장 심볼(`7203.T`)로 **LLM 생성까지 진행**된다(`blockLLM`은 레이트리밋일 뿐 시장 게이트 아님). 게다가 pending verdict가 "검증된 기법 판정"으로 프롬프트에 들어간다.
- 조치: 두 라우트에 `isActiveSymbol` 게이트 추가(비활성 → 400). `docs/PARKED_FIELD_SURFACES.md §7` 진입점 표에 두 API 추가.
- `vercel.json`의 `jp-disclosures` 크론도 소비처 0이므로 **스케줄 제거**(라우트·데이터는 보존).

### 7) 관찰 항목 중 함께 처리(저비용)

- `lib/lensPrecompute.ts`의 `remapStatesFromCuts` 페이지네이션에 `.order()` 추가 + `error` 검사.
- `lens_state_changes` diff를 **pass2 이후**로 이동(컷 이동일에 변화 피드와 보드 도트가 어긋나는 문제).
- `/api/lens` 30분 인메모리 캐시가 `pending` 응답까지 캐싱 → **pending은 캐시하지 않음**(크론 직후 즉시 정상화되게).
- `us-list` 등 정렬의 `(b.amount ?? -Infinity) - (a.amount ?? -Infinity)` NaN 가능성 정리.
- `lib/fscore.ts` 분할 감지가 **100% 유상증자(비율 정확히 2.00)를 액면분할로 오판**할 수 있음 → 분할 이벤트 정보를 쓰거나, 정수배여도 **판정 불가**로 두는 쪽으로 보수화(택1·근거 기재).

## 검증

1. `npx tsc --noEmit` 0 · `npm run test`(pending 경로 테스트 포함) · `npm run build`
2. **§1 실증(핵심)**: 12-1이 음수인데 상위 30%인 KR 종목을 찾아 **verdict 문구와 headline이 모순되지 않는지** 화면 기준으로 확인(전/후 문구 기재). 저변동성도 절대값이 높은 종목에서 확인.
3. **§2**: 컷을 일부러 비운 상태에서 상세 화면의 "강점/주의/보통" 카운트가 pending을 세지 않는지.
4. **§3**: 저장 성공률을 강제로 낮춘 조건에서 프루닝이 **건너뛰어지고** Sentry 경고가 나는지.
5. **§4**: 컷 조회 실패를 강제해 탐색·상세가 **같은 메시지**를 보이는지(갈리지 않는지).
6. **§5**: `NEXT_LOCALE=en` 쿠키를 수동으로 심은 뒤 접속 → **한국어로 정상 표시**되는지. 언어 전환·로그인 왕복 회귀 0(실제 구글 로그인).
7. **§6**: `/api/brief?symbol=7203.T` → 400(LLM 호출 0).
8. 커밋:
   ```bash
   git add app/ components/ lib/ messages/ vercel.json docs/
   git commit -m "STEP 806: relative-cut wording alignment with absolute sanity guards, pending aggregation fix, prune safety, cuts error handling, locale cookie migration, market gates"
   git push
   ```

## 완료 보고 → Cowork에게: §1 전후 문구 사례 + §2~§7 실증 + 커밋 해시. (직후 문서 마감 → US 확장 검증.)
