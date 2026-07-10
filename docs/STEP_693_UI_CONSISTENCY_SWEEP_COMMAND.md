<!-- 2026-07-10 -->
# STEP 693 — 🔍 앱 전체 UI 일관성 3중 감사 + 2건 수정 — 빌드·커밋만

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**상태:** 코드는 **Cowork(Opus)가 직접 작성·`tsc`=0.** 이 STEP은 **빌드 + 눈 검증 + 커밋/푸시**만.

**배경:** STEP 692에서 사용자 신고로 3건(ETF 너비·뒤로가기·검증탭 행클릭)을 고친 뒤, **같은 부류의 버그를 앱 전체에서 미리 잡으려고 3라운드 중복검수**(서브에이전트 감사)를 돌림. 3패턴을 훑음: ① 상세/서브 페이지 임의 너비(디폴트 max-w-7xl 불일치), ② "뒤로가기"가 `router.back()` 아니라 홈 고정(`href="/"`·`push('/')`), ③ 리스트 행에서 일부 요소만 클릭되는 것(행 전체 아님).
**결과: 앱은 대체로 깨끗.** 실제 손볼 건 2건뿐 → 아래 수정.

**바뀐 것(Cowork이 이미 코드 작성 완료):**
- `components/favorites/WatchlistClient.tsx` — 🐞 **관심종목 행이 클릭 불가**였음(로고+이름+티커에 링크/onClick 없음). 앱의 핵심 동선은 "종목 클릭 → 렌즈"인데 관심종목만 못 눌렀음(형제 `FavoritesClient`·`RoomFavoritesClient`는 행이 링크). → 로고·이름·티커를 **`<Link href="/stock/${symbol}">`**로 감싸 종목 상세로. 해제(X)는 링크 밖 형제 버튼(그대로). 심볼은 raw(`005930`·`AAPL`) — `/stock/[symbol]`·LensPreview "자세히 보기"와 동일 포맷.
- `app/auth/login/page.tsx` — "← 돌아가기"가 **`<Link href="/">`(홈 고정)**였음(사용자가 싫어한 바로 그 패턴). → **`router.back()`**(히스토리 없으면 홈) 버튼으로. 종목/ETF 상세와 동일 동작.

**감사에서 정상 확인(수정 불필요):**
- 페이지 너비: 전 라우트 페이지(`app/page`·about·business·advertise·terms·privacy·favorites·mypage·coin·admin 본문·EtfLensClient)가 이미 `mx-auto max-w-7xl … sm:px-6`. 좁은 중앙은 404·admin 접근거부 게이트·로그인/관리자 폼뿐(의도).
- 행 클릭: 6개 보드(MarketBoard/Us/Gb/Cn/Jp/Vn) `<tr onClick>`+모바일 `<div onClick>`, AdvisorDirectory `<li onClick>` — 모두 행 전체 클릭 + 별/액션만 `stopPropagation`.
- 피드(News/Dart/Sec/Ipo)는 행 전체 외부링크(의도), Dividend/Macro는 읽기전용 표(의도), LensPreview는 정상 미리보기 패널.

---

## 1. 빌드 → 눈 확인
```bash
npx tsc --noEmit
pkill -f "next dev"; rm -rf .next && (npm run dev &) ; sleep 7 ; echo "확인"
```
- **관심종목 모아보기**(로그인 후 관심 목록): 행 아무 곳(로고·이름·티커) 클릭 → **종목 상세로 이동**. **X(해제)만** 누르면 삭제(이동 안 함). PC·모바일 동일.
- **로그인 페이지**(`/auth/login`): "← 돌아가기" → **직전 화면**으로(홈 아님). 직접 진입(히스토리 없음) 시엔 홈으로.
- 회귀 없음. console.log 없음. tsc 0.

## 2. CHANGELOG (오늘 블록에 추가)
```
- **693**: 🔍 앱 전체 UI 일관성 **3중 감사** + 2건 수정 — 관심종목 행 **전체 클릭→종목 상세**(링크 없던 것 복구), 로그인 "돌아가기" **router.back()**(홈 고정 제거). 나머지(페이지 너비·6개 보드 행클릭·피드)는 정상 확인.
```

## 3. 커밋 → 푸시
```bash
git add components/favorites/WatchlistClient.tsx app/auth/login/page.tsx docs/CHANGELOG.md docs/STEP_693_UI_CONSISTENCY_SWEEP_COMMAND.md
git commit -m "fix(ui): 관심종목 행 전체 클릭→상세 + 로그인 뒤로가기 router.back() (전체 일관성 감사)"
git push
```

## Cowork에게 보고
- 관심종목 행 클릭 이동 + X 분리 정상, 로그인 뒤로가기 직전 화면 이동 확인.
