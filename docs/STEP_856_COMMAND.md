# STEP 856 — 육안 2차 검증 잔여 3건 (배지 불일치 · 적자 분기 확대 · 로딩)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

**전제 상태**: STEP 855 커밋 `278f58e` 이후 HEAD · `main`·`revdcf-preview` 동일 · 트리 클린

**착수 전 필독**: `CLAUDE.md` **⓪-3(매번 원본 대조)** · `components/RevDcfSection.tsx` · `app/api/revdcf/route.ts`

---

## 0. 성격

🔴 **플래그 계속 OFF.** 프로덕션 노출 금지.
🔴 **⓪-3 준수** — 고치기 전 원본·DB 직접 열고, 보고서 `[3중 점검]` ⓪ 줄에 명시.
🔴 엔진(848 도미노 재현)·DB 스키마 **불변**. 표시 계층만.

**Cowork 사전 대조 결과 (2026-08-01 · DB `revdcf_results` as_of=2026-08-01 · 604행)**

| verdict | 영업이익률 ≤ 0 |
|---|---|
| `value_destroying` | **63** |
| `over_cap` | **11** |
| `years` | **4** |
| **합계** | **78** |

코드: `components/RevDcfSection.tsx` **39행** `lossMaking = v === "value_destroying" && margin <= 0` → **`value_destroying`에만 걸림.**
배지: **68행** `badgeLabel`은 `v`만 보고 `lossMaking`을 **안 봄** → 본문과 다른 말을 함.

---

## §1 — 🔴 적자 분기를 verdict 무관으로 확대

**현상**: 855는 `value_destroying`인 적자만 처리. **`years` 4개·`over_cap` 11개는 그대로 통과** → 적자 회사에 "시장은 N년의 초과성장을 요구합니다"가 뜬다.

**수정**
```ts
const lossMaking = d.operatingMargin != null && d.operatingMargin <= 0;   // verdict 조건 제거
```
- `lossMaking`이면 **verdict와 무관하게** 적자 문구로 대체.
- 🔴 **엔진·DB는 그대로.** 표시 계층에서만 분기(848 재현 테스트 보호).
- 🔴 **적용 후 verdict별 건수를 보고**할 것(위 표와 일치하는지).

---

## §2 — 🔴 배지가 본문과 다른 말을 한다

**현상**: AAL 본문 = "영업적자라 성립하지 않습니다" / 우측 배지 = 빨간 **"가치훼손"**.
**원인**: 68행 `badgeLabel`이 `lossMaking`을 안 봄.

**수정**
- `lossMaking`이면 배지도 **"적용 밖"**(또는 동등한 중립 문구)로. 색은 **위험색(빨강) 금지** — 적자는 우리 판정이 아니라 **적용 범위 밖**이다.
- 🔴 **보드 배지(`RevDcfBadge.tsx`)도 동일 규칙**을 타는지 확인. 종목페이지와 보드가 다른 말을 하면 안 된다.
- ko/en 양쪽.

---

## §3 — 성립하지 않을 때 드라이버를 감춘다

**현상**: AAL이 "성립하지 않습니다"라고 해놓고 **매출성장 33% · 자본집약도 91.8% · 자본비용 6.54%를 그대로 나열**한다.

**수정**
- `lossMaking`(및 `skipped`)일 때 **드라이버 표를 숨긴다.**
- 🔴 단 **완전히 비우지 말 것** — "왜 성립하지 않는지"를 보여주는 최소값(영업이익률)만 남기고, 나머지는 접거나 제거. 어느 쪽인지 판단하고 사유 기재.
- `growthIsHistorical` 문구·기준일·방법론 링크는 **유지**(적용 밖이어도 우리가 무엇을 봤는지는 밝힌다).

---

## §4 — 로딩 체감 (GOOGL 첫 진입 8초+)

**현상**: 종목 페이지 첫 진입 시 "렌즈 읽는 중…"이 오래 뜨고, 역DCF 섹션은 그 아래라 더 늦다.

1. 🔴 **먼저 원인을 재라.** 추측 금지. `/api/revdcf` 자체 응답시간 vs 7렌즈(`/api/lens`) 응답시간을 **각각 측정**해 보고.
2. `/api/revdcf`가 느리면: `route.ts`가 **요청마다 `as_of` 조회 + 표본 count 2회**를 한다(28~33행). 캐시 가능한지 검토.
3. 🔴 **7렌즈가 병목이면 이번 범위 밖**이다. 측정 결과만 보고하고 손대지 말 것(역DCF와 무관한 기존 기능).
4. 역DCF 섹션은 **7렌즈를 기다리지 않고 독립적으로 렌더**되는지 확인.

---

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · 🔴 **`npm run build`** (855에서 생략했음 — 이번엔 반드시. dev 서버는 잠시 내렸다 다시 올려도 됨)
2. 🔴 **플래그 OFF 상태에서 프로덕션 `/revdcf` 404 유지** 확인
3. §1 적용 후 **verdict별 적자 건수**(63/11/4 = 78)와 화면 실측 일치
4. §2 **AAL 본문·배지·보드배지 3곳이 같은 말**을 하는지 (ko/en)
5. §3 AAL 드라이버 표 상태
6. §4 **`/api/revdcf` vs `/api/lens` 응답시간 측정치**
7. 🔴 **`[3중 점검]` ⓪ 줄에 이번에 연 원본·테이블 명시**
8. `docs/REVDCF_SPEC.md` §7 갱신 · `docs/CHANGELOG.md`·`docs/STATE.md` 오늘 날짜
9. 커밋(🔴 **`main`에 커밋** — 855 때 브랜치 혼동 있었음):
   ```bash
   git add app/ components/ messages/ docs/
   git commit -m "STEP 856: extend loss-making branch to all verdicts, align badge with headline, hide drivers when not applicable, measure load time"
   git push
   ```
   푸시 후 `revdcf-preview`도 fast-forward.

## 완료 보고 → Cowork에게

- §1 verdict별 적자 건수 + 화면 일치
- §2 3곳 문구 (ko/en)
- §4 **응답시간 측정치** + 병목이 어디인지
- 🔴 못 한 것과 이유
