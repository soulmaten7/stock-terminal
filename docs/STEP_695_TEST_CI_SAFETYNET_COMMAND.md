<!-- 2026-07-11 -->
# STEP 695 — 🧪 개발 안전망 1차: 유닛테스트(vitest) + GitHub Actions CI — 로컬확인·커밋

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**상태:** 코드/설정은 **Cowork(Opus)가 작성·검증 완료**(sandbox에서 `vitest run` **3/3 통과**·`tsc --noEmit` **0에러**). 이 STEP은 **맥에서 install·test·build 재확인 + 커밋/푸시**만.

**배경:** "만드는 도중"에 기계가 자동으로 회귀를 잡아주는 안전망 도입 1차. 순수 계산(`pct`, 기간수익률)을 테스트 가능한 모듈로 빼서 **실제 코드 경로를 테스트가 지키게** 함(§0-3 "엔진=검증 일치"). r1y 교훈(대세 상승장의 큰 수익률=정상, **clamp/가드 금지** — §LENS_DEV #28)을 테스트로 고정.

**바뀐 것(Cowork이 이미 작성):**
- `lib/returns.ts` (신규) — `pct(now, past)` 순수 함수(네트워크·DB 의존 0). 정책 주석: 값 커도 clamp 금지.
- `lib/krSnapshot.ts` — 로컬 `pct` 제거 → `import { pct } from "./returns"`. **크론이 쓰는 실제 계산이 테스트로 보호됨.**
- `lib/returns.test.ts` (신규) — 3케이스: 정상 계산 / 대세상승 큰 수익률 비클램프(삼성 61k→278k≈+355%) / 기준가없음·0 → null(신규상장 '—').
- `package.json` — devDep `vitest` + `scripts.test="vitest run"`·`test:watch`.
- `package-lock.json` — 갱신됨(sandbox `npm install -D vitest`).
- `.github/workflows/ci.yml` (신규) — push/PR마다 `npm ci → tsc → test → lint`. **lint는 비차단**(기존 코드에 lint 이슈 다수라 리포트만; tsc·test가 진짜 게이트).

---

## 1. 로컬(맥) 재확인
```bash
npm install                    # 락파일 동기화 + vitest 맥용 설치
npm test                       # vitest run → "3 passed" 기대
npx tsc --noEmit               # 0 에러 기대
npm run build 2>&1 | tail -6   # 빌드 성공 확인
```
- 셋 다 통과해야 다음. (실패 시 커밋 금지·Cowork에 보고.)

## 2. CHANGELOG (오늘 블록에 추가)
```
- **695**: 🧪 개발 안전망 1차 — 수익률 계산 `pct`를 `lib/returns.ts` 순수모듈로 추출·배선 + vitest 유닛테스트(정상·대세상승 비클램프·null) + GitHub Actions CI(매 푸시 tsc→test→lint[비차단]). 이후 로직 변경 시 회귀를 기계가 자동 검증.
```

## 3. 커밋 → 푸시 (파일 명시 — node_modules 스테이징 방지)
```bash
git add lib/returns.ts lib/returns.test.ts lib/krSnapshot.ts package.json package-lock.json .github/workflows/ci.yml docs/STEP_695_TEST_CI_SAFETYNET_COMMAND.md docs/CHANGELOG.md
git commit -m "chore(ci): 개발 안전망 1차 — pct 순수모듈+vitest 유닛테스트 + GitHub Actions CI(tsc·test·lint)"
git push
```

## 4. 푸시 후 확인 (CI 첫 초록불)
- GitHub 저장소 → **Actions 탭** → 방금 푸시의 **CI** 워크플로우 실행 확인.
- `Typecheck`·`Unit tests` **초록불**이면 성공(=이제 매 푸시마다 자동 검증). `Lint`는 비차단이라 노랑/빨강이어도 무방.

## Cowork에게 보고
- `npm test` 3 passed·`npm run build` 성공 여부 + GitHub Actions 첫 실행 초록불 여부.
