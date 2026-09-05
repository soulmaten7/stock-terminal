<!-- 2026-06-06 -->
# STEP 190 — 헤더 우측 아이콘(언어·알림·로그인) 오른쪽 정렬

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_190_COMMAND.md 파일 내용대로 실행해줘`

## 목표
헤더에서 언어(🇰🇷)·알림(🔔)·로그인(👤) 아이콘이 **검색창 바로 뒤(가운데쯤)** 멈춰 오른쪽이 비어 있음 → **맨 오른쪽 정렬**.
- 원인: 검색창 div에 `max-w-2xl`(672px) 캡 → 검색창이 더 안 커져 우측 여백 발생, 아이콘이 그 뒤에 붙음
- 해결: 캡 제거 → 검색창이 남은 폭을 채움 → 아이콘 3개가 맨 오른쪽으로(아이콘 div는 이미 `shrink-0`)

## 전제 상태
- HEAD: STEP 189 적용된 상태
- 변경: `components/layout/Header.tsx`(검색 div className 1곳) 1파일

---

## 작업 1/1 — 검색 div 의 `max-w-2xl` 제거

**찾기:**
```tsx
        {/* ── 검색 (남은 폭) ── */}
        <div className="flex-1 min-w-0 max-w-2xl">
          <HeaderSearch />
        </div>
```

**바꾸기:**
```tsx
        {/* ── 검색 (남은 폭 전부 채움 → 우측 아이콘 오른쪽 정렬) ── */}
        <div className="flex-1 min-w-0">
          <HeaderSearch />
        </div>
```

> 검색창이 `flex-1`로 남은 폭을 전부 채우면, 그 뒤 `shrink-0` 아이콘 묶음이 자연히 헤더 맨 오른쪽(px-6 여백)에 붙음.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/layout/Header.tsx && git commit -m "fix(v7): 헤더 우측 아이콘 오른쪽 정렬 — 검색 max-w 캡 제거(남은 폭 채움) (STEP 190)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 언어·알림·로그인 아이콘이 **헤더 맨 오른쪽 끝**에 붙는지(우측 빈 공간 사라짐)
- [ ] 검색창이 로고·탭과 아이콘 사이 폭을 채우는지
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 검색창이 넓어지는 게 너무 길게 느껴지면, 다시 `max-w-3xl`/`max-w-4xl` 정도로 캡 + 아이콘 `ml-auto` 조합으로 조정 가능(말해주면 변경).
- 아이콘 묶음은 이미 `shrink-0 gap-3`라 간격은 유지됨.

---
> STEP 190 = 헤더 아이콘 우측 정렬. 전제 STEP 189. 다음: 카테고리 2열 등. 문서 묶어 갱신.
