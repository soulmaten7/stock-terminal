# STEP 854 — 🔴 역DCF 노출 즉시 차단(피처 플래그) + 잔여 마감을 플래그 뒤에서

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus` 🔴 **Opus 권장**(밀집 컴포넌트 안전 수정)

**전제 상태**: STEP 853 커밋 `306365d` 이후 HEAD · 트리 클린

**착수 전 필독**: `CLAUDE.md` **절대 규칙 1번(2026-08-01 신설)** · `docs/REVDCF_SPEC.md` §7

---

## 0. 왜 이 STEP인가

🔴 **853에서 Cowork이 장은태 승인 없이 프로덕션 화면을 바꿨다.** 육안 검증도 없었다.
🔴 **이 STEP의 1순위는 노출 차단이다.** 코드는 지우지 않는다(검증은 통과했으므로). **노출만 멈춘다.**
🔴 이후 잔여 작업은 **전부 플래그 뒤에서** 만든다. **켜는 것은 장은태가 육안 확인 후 결정한다.**

---

## §1 — 🔴 최우선: 피처 플래그 (기본 OFF)

1. 환경변수 **`REVDCF_ENABLED`** 신설. 🔴 **`NEXT_PUBLIC_` 접두어를 쓰지 말 것.**
   - 근거: `CLAUDE.md` 기록된 함정 — *Vercel에서 env를 늦게 추가하면 빌드 캐시 재사용으로 `NEXT_PUBLIC_*`이 인라인되지 않아 무동작*. 서버 사이드 플래그가 안전하다.
2. **기본값 = OFF.** 환경변수가 없으면 꺼진 것으로 취급(`REVDCF_ENABLED === 'true'` 일 때만 노출).
3. 가려야 할 것:
   - 종목 페이지의 **역DCF 섹션** (서버 컴포넌트에서 분기 — 클라이언트로 내려보내지 말 것)
   - **`/revdcf` 방법론 페이지** (ko/en) → 플래그 OFF면 **404**
   - (§2에서 만들 보드 배지도 동일 플래그)
4. 🔴 **`/api/revdcf`는 유지**한다(데이터 배선·크론은 계속 돌아야 함). 화면만 가린다.
5. **즉시 배포하고 라이브에서 사라졌는지 확인**한 뒤 §2로 넘어갈 것.
   - 확인: US 종목 페이지(ko/en)에 섹션 없음 · `/revdcf` 404 · 기존 7렌즈 정상.

---

## §2 — 보드 배지 (853에서 보류된 것 · **플래그 뒤에서**)

853 보류 사유: `components/UsMarketBoard.tsx`가 **634줄 밀집 컴포넌트**라 컬럼 추가가 레이아웃·모바일을 깨뜨릴 위험.

🔴 **밀집 컴포넌트를 직접 뜯지 말 것.** 다음 순서로:
1. 배지를 **독립 컴포넌트**로 분리(`components/RevDcfBadge.tsx`) — verdict → 배지 1개 반환하는 순수 표시 컴포넌트.
2. `UsMarketBoard.tsx`에는 **최소 침습**으로 주입. 플래그 OFF면 **컬럼 자체가 렌더되지 않아야** 한다(빈 칸도 남기지 말 것).
3. 배지 문구(851 설계): `years` → "**14년**" · `value_destroying` → "가치훼손" · `below_one` → "무성장 설명" · `over_cap` → "설명 불가" · `skipped` → 회색 "—"
4. 🔴 **정렬·필터는 이번에 넣지 않는다.** ("연수 짧다 = 싸다" 오해 문제가 미해결 — 851 §4)
5. 🔴 **모바일에서 컬럼이 넘치지 않는지** 반드시 확인. 좁으면 배지를 숨기는 브레이크포인트를 둘 것.

---

## §3 — 다계열 주식수 회수 (852·853 잔여)

V·STZ·FWONA 등: 주식수가 **dimension 분할**이라 flat 태그로 안 잡혀 `MISSING_TAG` 잔존.
- `companyfacts`에서 클래스별 값을 합산할 수 있는지 확인. 안 되면 `dei:EntityCommonStockSharesOutstanding` 폴백.
- 🔴 **합산이 위험한 경우**(클래스별 권리·주가가 다름) 억지로 합치지 말고 사유 코드를 유지하고 **건수를 보고**할 것.

---

## §4 — 🔴 장은태 육안 검증 준비

플래그가 OFF이므로 **켜서 볼 수 있는 경로**를 만든다.

1. **Vercel 프리뷰 배포**에서만 `REVDCF_ENABLED=true`로 설정(프로덕션은 OFF 유지). 프리뷰 URL을 보고할 것.
2. 🔴 **확인용 종목 목록을 정리**해 보고: 각 verdict 1개씩 + 극단 밴드 1개 + method-dependent 1개 (853 검증에 쓴 GOOGL·DPZ·AAL·LNG·ABT·UHAL-B·APD 재사용).
3. ko/en · 데스크톱/모바일 URL을 **표로** 제시.

---

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build`
2. 🔴 **프로덕션 라이브에서 역DCF가 사라졌는지** — US 종목페이지(ko/en) 섹션 없음 · `/revdcf` 404
3. 🔴 **기존 화면 무손상** — 7렌즈·6개국 보드·관심목록 정상 · KR 종목페이지 불변
4. §2 배지: 플래그 OFF에서 **컬럼 미렌더** · ON(프리뷰)에서 정상 · **모바일 안 깨짐**
5. §3 회수 건수
6. §4 **프리뷰 URL + 확인용 종목 표**
7. 🔴 **3중 점검 블록**
8. `docs/REVDCF_SPEC.md` §7에 **플래그 상태(OFF)와 켜는 조건(장은태 육안 승인)** 명시
9. `docs/SYSTEM_MAP.md`에 `REVDCF_ENABLED` 추가
10. `docs/CHANGELOG.md`·`docs/STATE.md` 오늘 날짜 · 🔴 **STATE에 "역DCF = 플래그 OFF · 장은태 육안 검증 대기"를 명시**
11. 커밋:
    ```bash
    git add app/ components/ lib/ docs/ messages/
    git commit -m "STEP 854: gate reverse-DCF behind server-side feature flag (default OFF) pending visual approval, add board badge and multi-class share recovery behind the flag"
    git push
    ```

## 완료 보고 → Cowork에게

- 🔴 **프로덕션에서 사라진 것 확인** (URL 근거)
- 기존 화면 무손상 증거
- §4 **프리뷰 URL + 확인용 종목 표** ← 장은태가 볼 것
- §2 모바일 확인 결과
- 🔴 못 한 것과 이유
