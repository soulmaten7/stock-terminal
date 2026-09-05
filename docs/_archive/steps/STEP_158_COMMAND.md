<!-- 2026-06-04 -->
# STEP 158 — 홈 풀폭 (토스처럼 넓게) · 홈만

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음 Claude Code 에서: `@docs/STEP_158_COMMAND.md 파일 내용대로 실행해줘`

## 목표
홈 화면을 **토스처럼 화면 폭에 꽉 차게**. 현재 홈은 `max-w-[1480px]` 박스에 갇혀 양옆 여백이 큼.
**홈 한 파일(`HomeClientV6.tsx`)만** 수정. 다른 페이지·네비·전역 레이아웃은 안 건드림.

## 전제 상태
- HEAD: `a8a03cf` (STEP 157) — 빌드 ✓ / git clean
- 변경: `components/home-v6/HomeClientV6.tsx` 1줄 (외곽 컨테이너 max-w 제거).

## 원리
- 앱 전역 프레임(`app/layout.tsx`)이 이미 `max-w-[1984px] mx-auto` 로 감싸고 있음.
- 홈이 자체적으로 `max-w-[1480px]` 를 한 번 더 걸어 1480에 가둠 → **이 캡만 제거**하면 앱 프레임(1984)까지 꽉 참. 사용자 화면(≈1900px)에선 사실상 풀폭.
- 전역 1984 캡은 유지(초광폭 모니터 보호) → 전역은 안 건드림 = 홈만.

---

## 작업 1/1 — `components/home-v6/HomeClientV6.tsx` (외곽 div 1줄 교체)

**찾기:**
```tsx
    <div className="max-w-[1480px] mx-auto px-6 py-5">
```
**바꾸기:**
```tsx
    <div className="px-6 py-5">
```

> `max-w-[1480px] mx-auto` 제거 → 홈이 앱 프레임(1984) 폭을 꽉 채움. `px-6 py-5`(좌우 여백·상하 패딩)는 유지. 내부 지수 그리드·랭킹·관심 레일은 부모 폭을 따라 자동으로 넓어짐.

---

## 작업 2/2 — 빌드 검증 + 커밋·푸시

```bash
cd ~/stock-terminal && npm run build
```

빌드 ✓ (exit 0) 확인 후:

```bash
cd ~/stock-terminal && git add components/home-v6/HomeClientV6.tsx && git commit -m "feat(v7): 홈 풀폭 — max-w-1480 캡 제거(앱 프레임 1984까지) 토스처럼 넓게 (STEP 158)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 여부
- [ ] 커밋 해시 + `git push` 성공 여부
- [ ] (확인) `npm run dev` → 홈(`/`)이 화면 폭에 꽉 차게 넓어졌는지. `/market` 등 다른 페이지는 그대로인지

## 주의·예상 이슈
- 전역 `max-w-[1984px]`(app/layout)는 유지 → 초광폭에서 무한정 늘어나진 않음(정상).
- 홈만 변경 → /market·종목·토론 등 무영향.
- 다음 홈 반복(별도): ② 지수 그리드 풍부화(코스피·코스닥 실값·수급) · ③ 랭킹 종목 미리보기 패널 · (전역) 상단 티커 정리.

---
> STEP 158 = 홈 풀폭(토스 폭). 전제 `a8a03cf` → 보고 나서 홈 다음 반복. 문서는 묶어서 갱신.
