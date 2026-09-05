<!-- 2026-06-07 -->
# STEP 217 — 헤더 개편 1차: MY 탭·토론·평가 탭 제거 + 뉴스·시황 추가 + 우측 레일 '보유' 제거

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_217_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 합의)
헤더 메뉴를 운종 정체성에 맞게 정리. **새 페이지가 필요 없는 구조 변경만** 이번에.
- 헤더 탭: `홈 / 마켓 / 토론·평가 / MY` → **`홈 / 마켓 / 뉴스·시황`**
  - **MY 탭 제거** — 오른쪽 프로필 아이콘이 로그인·마이페이지·로그아웃 다 함(중복). 계정/마이페이지는 유지.
  - **토론·평가 탭 제거** — 리딩방·평가·토론은 홈(랭킹 탭·인기토론)에서 접근. **평가·검증 톱레벨 승격은 UI 완성 후 결정**(보류).
  - **뉴스·시황 추가** → `/news`.
- 우측 레일 아이콘: 알림/관심/**보유**/최근 → **'보유' 제거**(운종은 거래 X → 포지션 개념 없음). 관심·알림·최근만.
- ⏭️ **"주식 관련 링크모음"은 다음 STEP** — 페이지부터 만들어 탭으로 붙임(이번 범위 아님).

## 전제 상태
- HEAD: STEP 216 상태
- 변경 2파일: `components/layout/Header.tsx`(MENU) · `components/home-v6/HomeRightRail.tsx`(nav + import)
- DB 변경 0

---

## 작업 1/2 — `Header.tsx` MENU 정리

**찾기:**
```tsx
// 토스식 상단 4탭 (운종). 뉴스는 종목 안+홈으로, 평가·검증은 토론·평가로 통합. 거래·코인 제외.
const MENU = [
  { href: '/', label: '홈', match: (p: string) => p === '/' },
  { href: '/market', label: '마켓', match: (p: string) => /^\/(market|kr|us|stock)/.test(p) },
  { href: '/discussion', label: '토론·평가', match: (p: string) => /^\/(discussion|product|room|reviews)/.test(p) },
  { href: '/mypage', label: 'MY', match: (p: string) => p.startsWith('/mypage') },
] as const;
```
**바꾸기:**
```tsx
// 운종 상단 탭. 토론·평가는 홈(랭킹·인기토론)으로 접근(평가·검증 톱레벨 승격은 UI 완성 후 결정).
// MY는 우측 프로필 아이콘으로. '주식 관련 링크모음'은 페이지 생성 후 추가 예정. 거래·코인 제외.
const MENU = [
  { href: '/', label: '홈', match: (p: string) => p === '/' },
  { href: '/market', label: '마켓', match: (p: string) => /^\/(market|kr|us|stock)/.test(p) },
  { href: '/news', label: '뉴스·시황', match: (p: string) => /^\/news/.test(p) },
] as const;
```

> MY·토론·평가 탭만 빠짐. 오른쪽 국가·알림·프로필 아이콘 영역은 그대로(변경 없음).

---

## 작업 2/2 — `HomeRightRail.tsx` 우측 레일 '보유' 제거

**찾기 (import):**
```tsx
import { Bell, Star, Briefcase, Clock } from "lucide-react";
```
**바꾸기:**
```tsx
import { Bell, Star, Clock } from "lucide-react";
```

**찾기 (nav 배열):**
```tsx
  const nav = [
    { icon: Bell, label: "알림", href: "/mypage" },
    { icon: Star, label: "관심", href: "/" },
    { icon: Briefcase, label: "보유", href: "/mypage" },
    { icon: Clock, label: "최근", href: "/" },
  ];
```
**바꾸기:**
```tsx
  const nav = [
    { icon: Bell, label: "알림", href: "/mypage" },
    { icon: Star, label: "관심", href: "/" },
    { icon: Clock, label: "최근", href: "/" },
  ];
```

> `Briefcase` 는 nav에서만 쓰였으므로 import도 같이 제거(미사용 경고/빌드 에러 방지).

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/layout/Header.tsx components/home-v6/HomeRightRail.tsx && git commit -m "feat(v7): 헤더 개편 1차 — MY·토론·평가 탭 제거+뉴스·시황 추가, 우측 레일 보유 제거 (STEP 217)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 헤더 탭이 **홈 / 마켓 / 뉴스·시황** 3개로 줄고, MY·토론·평가 사라짐
- [ ] '뉴스·시황' 클릭 시 `/news` 로 이동·활성 표시
- [ ] 오른쪽 **프로필 아이콘으로 로그인/마이페이지/로그아웃** 여전히 됨(중복 제거 OK)
- [ ] 홈 우측 레일 세로 아이콘이 **알림/관심/최근 3개**(보유 사라짐)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 토론·평가 탭이 빠져 `/discussion`·`/rooms`·`/products` 는 헤더 직접 진입은 없어짐(홈에서 접근). 의도된 보류 — 평가·검증 톱레벨은 UI 완성 후.
- `/mypage` 페이지 자체는 유지(프로필 아이콘·알림/최근 아이콘이 가리킴). mypage 내부 '보유' 류 섹션 정리는 후속.
- 다음 STEP: **주식 관련 링크모음 페이지**(예: 네이버페이증권·키움·FnGuide·Investing.com·DART·KRX) 생성 → 헤더 탭 추가.
- **문서 TODO**(다음 갱신): STEP 215~217.

---
> STEP 217 = 헤더 개편 1차(MY·토론평가 탭 제거+뉴스시황, 보유 제거). 전제 STEP 216. 문서 묶어 갱신.
