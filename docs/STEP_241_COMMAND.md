<!-- 2026-06-14 -->
# STEP 241 — 헤더 정리: 뉴스·시황 제거 + 마켓 → 상품 리스트

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_241_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 확정)
- 헤더 메뉴에서 **'뉴스·시황' 제거** (뉴스는 어디나 더 잘함 → '올 이유' 통과 못 함).
- **'마켓' → '상품 리스트'** 라벨 변경 (우리는 거래소가 아니라 정보·허브 → '마켓'은 의미가 어긋남).
- 라우트 `/market`·match 규칙은 **그대로 유지**(라벨만 변경).
- 결과 메뉴: **홈 · 상품 리스트 · 주식 관련 링크모음** (3개).

## 전제 상태
- 현재 HEAD: STEP 240 상태
- 변경 **1파일**: `components/layout/Header.tsx` (`MENU` 배열 1곳 find/replace)
- DB·API·라우트 변경 0 (`/news` 페이지 파일은 남겨둠 — 메뉴에서만 빠짐, 무해)

---

## 작업 1/1 — `components/layout/Header.tsx` (`MENU` 배열 교체)

**찾기:**
```tsx
const MENU = [
  { href: '/', label: '홈', match: (p: string) => p === '/' },
  { href: '/market', label: '마켓', match: (p: string) => /^\/(market|kr|us|stock)/.test(p) },
  { href: '/news', label: '뉴스·시황', match: (p: string) => /^\/news/.test(p) },
  { href: '/toolbox', label: '주식 관련 링크모음', match: (p: string) => /^\/toolbox/.test(p) },
] as const;
```
**바꾸기:**
```tsx
const MENU = [
  { href: '/', label: '홈', match: (p: string) => p === '/' },
  { href: '/market', label: '상품 리스트', match: (p: string) => /^\/(market|kr|us|stock)/.test(p) },
  { href: '/toolbox', label: '주식 관련 링크모음', match: (p: string) => /^\/toolbox/.test(p) },
] as const;
```

> `/news` 항목만 빠지고, `/market` 라벨이 '상품 리스트'로. 라우트·match 정규식은 그대로라 링크/활성표시 안전.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add components/layout/Header.tsx && git commit -m "feat(v7): 헤더 정리 — 뉴스·시황 제거+마켓→상품 리스트 (STEP 241)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 헤더 메뉴 = **홈 · 상품 리스트 · 주식 관련 링크모음** (뉴스·시황 사라짐)
- [ ] '상품 리스트' 클릭 시 `/market`로 이동, 마켓·종목 페이지에서 활성표시 그대로
- ⚠️ 하드 새로고침(Cmd+Shift+R).

## 주의·예상 이슈
- `/news` 페이지 파일은 안 지움(메뉴에서만 제거). 추후 정리 원하면 별도.
- '상품 리스트' 페이지(`/market`)는 아직 주식 풀테이블 — ETF/펀드/ETN/리츠 통합 디렉토리화는 추후 STEP(현재는 홈 탭에서 타입별 접근).
- **문서 TODO**(다음 갱신): STEP 228~241.

---
> STEP 241 = 헤더 뉴스·시황 제거 + 마켓→상품 리스트. 전제 STEP 240.
