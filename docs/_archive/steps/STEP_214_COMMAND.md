<!-- 2026-06-07 -->
# STEP 214 — 홈 우측 레일(채팅·관심종목) 폭 확대 (360→400px)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_214_COMMAND.md 파일 내용대로 실행해줘`

## 목표
실시간채팅·관심종목(우측 레일) 가로폭을 **조금 넓히고**, 메인(실시간차트 등) 폭을 그만큼 **줄임**.
- 홈 그리드 우측 컬럼 `360px → 400px`. 왼쪽 `1fr`이 자동으로 그만큼 축소.

## 전제 상태
- HEAD: STEP 213 상태
- 변경: `components/home-v6/HomeClientV6.tsx`(그리드 1곳) 1파일

---

## 작업 1/1 — `HomeClientV6.tsx` 그리드 우측 폭

**찾기:**
```tsx
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
```
**바꾸기:**
```tsx
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/home-v6/HomeClientV6.tsx && git commit -m "feat(v7): 홈 우측 레일(채팅·관심종목) 폭 360→400px, 메인 그만큼 축소 (STEP 214)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 우측 실시간채팅·관심종목이 **조금 더 넓어짐**, 메인(실시간차트 등)은 그만큼 좁아짐
- [ ] 레이아웃 깨짐 없음(랭킹 테이블·미리보기 정상)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 더 넓히고 싶으면 `400px` 숫자만 키우면 됨(420·440…).
- **문서 TODO**(다음 갱신): STEP 212~214.

---
> STEP 214 = 우측 레일 폭 확대. 전제 STEP 213. 문서 묶어 갱신.
