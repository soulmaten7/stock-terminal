<!-- 2026-06-07 -->
# STEP 226 — 링크모음 2:1 가로 비율 수정 (임의값 → 표준 grid-cols-3)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_226_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (버그 수정)
STEP 225의 `lg:grid-cols-[2fr_1fr]` 임의값이 Tailwind에서 CSS 규칙으로 생성되지 않아 → 기본 `grid-cols-1`로 떨어져 **세로로 쌓임**. 표준 클래스 `grid-cols-3` + 좌측 `col-span-2`로 교체해 **확실히 가로 2:1**(좌 링크 2 : 우 증권사 1).

## 전제 상태
- HEAD: STEP 225 상태 (현재 `app/toolbox/page.tsx` 그리드 = `lg:grid-cols-[2fr_1fr]`)
- 변경 1파일: `app/toolbox/page.tsx`(그리드 + 좌측 div 2곳)
- DB 변경 0

---

## 작업 1/2 — 그리드를 표준 3열로

**찾기:**
```tsx
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
```
**바꾸기:**
```tsx
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
```

## 작업 2/2 — 좌측(링크) 컬럼을 2칸 차지

**찾기:**
```tsx
        {/* 좌: 링크 디렉토리 */}
        <div className="min-w-0">
```
**바꾸기:**
```tsx
        {/* 좌: 링크 디렉토리 (2칸) */}
        <div className="min-w-0 lg:col-span-2">
```

> `grid-cols-3`(3등분) + 좌측 `col-span-2`(2칸) = 좌:우 = 2:1. 우측 증권사 div는 그대로 1칸. 표준 클래스라 안정적으로 생성됨.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add app/toolbox/page.tsx && git commit -m "fix(v7): 링크모음 가로 2:1 — 임의값 대신 grid-cols-3+col-span-2 (STEP 226)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] ⚠️ **dev 서버 재시작 권장** — Tailwind CSS 재생성 확실히(임의값 잔재 정리): `Ctrl+C` → `npm run dev`, 그 후 하드 새로고침
- [ ] `/toolbox`가 **가로 2:1**(좌 링크 디렉토리 넓게 : 우 증권사 레일), 더 이상 세로로 안 쌓임
- [ ] 증권사 레일에서 note·% ·바로가기 버튼 다 보임

## 주의·예상 이슈
- 원인: Tailwind 임의값 `[2fr_1fr]`이 (dev CSS 미생성/캐시로) 규칙 없음 → `grid-cols-1` 폴백 → 세로 스택. 표준 `grid-cols-3`/`col-span-2`는 안정.
- 그래도 세로면 **dev 서버 완전 재시작**(CSS 전체 재빌드)이 필요.
- 레일이 1/3이라 단일열 행 여백 생기면 추후 비율·2열 조정.
- **문서 TODO**(다음 갱신): STEP 162·215~226.

---
> STEP 226 = 가로 2:1 버그 수정(표준 grid). 전제 STEP 225. 문서 묶어 갱신.
