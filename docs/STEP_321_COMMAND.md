<!-- 2026-06-20 -->
# STEP 321 — [정리] 페이지 너비 V7 표준 통일 (max-w-7xl)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_321_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표 — 전체 페이지 너비 감사 결과

**V7 표준 = `mx-auto max-w-7xl px-6`** (헤더·홈·마이페이지 동일).

도달 가능한(헤더 네비 `/`·`/coin` + 프로필 메뉴 `/mypage`·`/admin`·`/auth/login`) 페이지:

| 페이지 | 현재 | 처리 |
|---|---|---|
| `/` 홈 | `max-w-7xl` | ✅ 그대로 |
| `/mypage` | `max-w-7xl` | ✅ 그대로 (STEP 320) |
| `/auth/login` | 좁은 중앙 카드 | ✅ 그대로(의도) |
| **`/admin`** | `max-w-5xl` | 🔧 `max-w-7xl`로 |
| **`/coin`** | max-w 없음 | 🔧 `max-w-7xl`로 |

> 변경 2파일.

---

## 📄 파일 1 — `app/admin/page.tsx`

**찾기:**
```tsx
    <div className="mx-auto max-w-5xl px-6 py-8">
```
**바꾸기:**
```tsx
    <div className="mx-auto max-w-7xl px-6 py-8">
```

> (위쪽 '접근 권한이 없습니다' 메시지의 `max-w-3xl`은 짧은 안내문이라 그대로 둠.)

---

## 📄 파일 2 — `app/coin/page.tsx`

**찾기:**
```tsx
    <div className="px-6 py-20 text-center">
```
**바꾸기:**
```tsx
    <div className="mx-auto max-w-7xl px-6 py-20 text-center">
```

---

## ✅ 검증
```bash
npm run build
```
- 빌드 무에러.

개발 서버: `/admin`·`/coin`이 홈·마이페이지와 **동일한 1280px 중앙정렬** 폭으로 보이면 성공. 헤더부터 콘텐츠까지 모든 화면 좌우 여백이 일치.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/admin/page.tsx app/coin/page.tsx && git commit -m "style(layout): 페이지 너비 V7 표준 통일 — admin·coin max-w-7xl (STEP 321)" && git push
```

---

## 📌 참고 — 레거시(orphan) 페이지 13개 (이번엔 안 건드림)

헤더/푸터 어디에도 링크 안 된 옛 StockTerminal 잔재 (URL 직접 입력으로만 도달):
`app/(windows)/kr|us`, `app/toolbox`, `app/products`, `app/product/[id]`, `app/rooms`, `app/room/[id]`, `app/stock/[code]`, `app/news`, `app/market`, `app/global`, `app/discussion`, `app/calendar`

→ **권장**: 너비 맞추기보다 **삭제(정리)** 가 맞음. V7에서 안 쓰는 화면이라 유지보수 부담만 됨. 삭제 여부는 별도 STEP에서 결정.

---

> **한 줄 요약**: 도달 가능한 모든 페이지를 max-w-7xl로 통일(admin·coin 수정). 레거시 13개는 삭제 권장(후속).
