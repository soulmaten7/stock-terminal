<!-- 2026-06-04 -->
# STEP 159 — 전 페이지 풀폭 (디폴트 화면폭 통일)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음 Claude Code 에서: `@docs/STEP_159_COMMAND.md 파일 내용대로 실행해줘`

## 목표
홈만 풀폭이고 다른 페이지는 각자 좁은 캡(1280~1480)에 갇혀 있음. **모든 활성 페이지를 앱 프레임(1984)까지 풀폭으로** = 화면폭을 디폴트로 통일.
- 캡 제거 대상: 마켓·토론·뉴스·상품·리딩방·MY (6곳)
- 유지: `/calendar`(의도된 좁은 안내 페이지), 앱 프레임 `max-w-[1984px]`(초광폭 보호)
> 폭만 바꿈(콘텐츠 디자인 X). 내부 표·그리드는 부모 폭을 따라 자동으로 넓어짐.

## 전제 상태
- HEAD: `1ddd141` (STEP 158, 홈 풀폭) — 빌드 ✓ / git clean
- 변경: 6개 파일의 외곽 컨테이너 className 1줄씩(`max-w-… mx-auto` 제거, 패딩 유지).

---

## 작업 1/6 — `components/market/MarketClient.tsx` (비-embedded 캡 제거)
**찾기:** `embedded ? "" : "max-w-[1480px] mx-auto px-4 py-6"`
**바꾸기:** `embedded ? "" : "px-4 py-6"`

## 작업 2/6 — `app/discussion/page.tsx`
**찾기:** `<div className="max-w-[1480px] mx-auto px-4 py-6">`
**바꾸기:** `<div className="px-4 py-6">`

## 작업 3/6 — `app/news/page.tsx`
**찾기:** `<div className="max-w-[1480px] mx-auto px-4 py-6">`
**바꾸기:** `<div className="px-4 py-6">`

## 작업 4/6 — `components/platform/ProductsClient.tsx`
**찾기:** `<div className="max-w-screen-xl mx-auto px-6 py-6">`
**바꾸기:** `<div className="px-6 py-6">`

## 작업 5/6 — `components/platform/RoomsClient.tsx`
**찾기:** `<div className="max-w-screen-xl mx-auto px-6 py-6">`
**바꾸기:** `<div className="px-6 py-6">`

## 작업 6/6 — `app/mypage/page.tsx`
**찾기:** `<div className="max-w-[1440px] mx-auto px-6 py-8">`
**바꾸기:** `<div className="px-6 py-8">`

> 각 파일에서 위 문자열은 유일함(파일별 1곳). `max-w-… mx-auto` 만 빼고 패딩(px·py)은 유지 → 페이지가 앱 프레임(1984) 폭을 꽉 채움.

---

## 작업 7/7 — 빌드 검증 + 커밋·푸시

```bash
cd ~/stock-terminal && npm run build
```

빌드 ✓ (exit 0) 확인 후:

```bash
cd ~/stock-terminal && git add components/market/MarketClient.tsx app/discussion/page.tsx app/news/page.tsx components/platform/ProductsClient.tsx components/platform/RoomsClient.tsx app/mypage/page.tsx && git commit -m "feat(v7): 전 페이지 풀폭 — 마켓·토론·뉴스·상품·리딩방·MY max-w 캡 제거(앱 프레임 1984) 디폴트 통일 (STEP 159)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 여부
- [ ] 커밋 해시 + `git push` 성공 여부
- [ ] (확인) `npm run dev` → 마켓·토론·상품·리딩방·MY 페이지가 홈처럼 풀폭으로 넓어졌는지 (넓은 창에서)
- ⚠️ **확인 후 박스로 보이면 dev 서버 `.next` 캐시 stale** → `lsof -ti :3333 | xargs kill -9; cd ~/stock-terminal && rm -rf .next && npm run dev` 로 깨끗하게 재시작

## 주의·예상 이슈
- 앱 프레임 `max-w-[1984px]`(app/layout)는 유지 → 초광폭에서 무한정 늘어나진 않음.
- `/calendar`(안내 페이지)·`/kr`·`/us`·종목 페이지는 변경 없음(이미 풀폭이거나 의도된 좁음).
- 폭만 변경 → 기능·데이터 무영향. 표·그리드가 넓어지며 자동 재배치.
- 핫리로드가 안 잡으면 `.next` 캐시 삭제 후 재시작(위 참조).

---
> STEP 159 = 전 페이지 풀폭 디폴트. 전제 `1ddd141` → 다음: 홈 지수 그리드 풍부화(토스식 빽빽) · 상단 티커 정리. 문서는 묶어서 갱신.
