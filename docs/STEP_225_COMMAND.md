<!-- 2026-06-07 -->
# STEP 225 — 링크모음 그리드 비율 링크2 : 증권사1 (레일 넓힘)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_225_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 지시)
증권사 거래대금 순위 레일이 340px로 좁아 note·바로가기 버튼 등 세부가 다 안 보임 → **링크모음 : 거래대금순위 = 2 : 1** 비율로 넓힘.

## 전제 상태
- HEAD: STEP 224 상태
- 변경 1파일: `app/toolbox/page.tsx`(그리드 1곳)
- DB 변경 0

---

## 작업 1/1 — `app/toolbox/page.tsx` 그리드 비율

**찾기:**
```tsx
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
```
**바꾸기:**
```tsx
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
```

> 좌(링크) 2 : 우(증권사 레일) 1. 레일이 넓어져 note·바로가기 버튼 전부 보임.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add app/toolbox/page.tsx && git commit -m "feat(v7): 링크모음 그리드 비율 링크2:증권사1 (레일 넓혀 세부 표시) (STEP 225)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] `/toolbox` 우측 증권사 레일이 **넓어짐**(전체 폭의 1/3), note·% ·바로가기 버튼 다 보임
- [ ] 좌측 링크 디렉토리 : 우측 증권사 = **2 : 1**
- ⚠️ 서버 컴포넌트 변경 → 하드 새로고침(`Cmd+Shift+R`). 그래도 그대로면 dev 서버 재시작.

## 주의·예상 이슈
- 레일이 꽤 넓어지면(약 600px+) 단일열 행에 여백이 생길 수 있음 — 너무 비면 추후 2열 또는 비율 `[2.5fr_1fr]` 등으로 조정 가능.
- **문서 TODO**(다음 갱신): STEP 162·215~225.

---
> STEP 225 = 링크모음 그리드 2:1. 전제 STEP 224. 문서 묶어 갱신.
