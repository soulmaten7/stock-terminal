<!-- 2026-06-23 -->
# STEP 362 — [정리] 옛 legacy 라우트 → 홈 리다이렉트 (옛 브랜드 페이지 노출 차단)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_362_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
현재 게이트웨이에서 **안 쓰는 옛 버전 라우트**(`/market`·`/stock`·`/room`·`/rooms`·`/news`·`/products`·`/product`·`/discussion`·`/calendar`·`/global`)는 고립된 legacy(옛 디자인 토큰·옛 '운종' 브랜드)라, 누가 URL로 들어가면 깨진 옛 페이지가 보임. **홈(`/`)으로 리다이렉트**해 차단.
- 덤: 기존 `/scalper`·`/longterm` → `/kr` 리다이렉트가 **`/kr`이 없어 깨져 있음** → `/`로 수정.
- 코드는 지우지 않음(의존성 리스크) — 리다이렉트로 도달만 막음. 실제 삭제는 출시 전 정리에서.

> 변경 1파일: `next.config.ts`(redirects 함수). ⚠️ **next.config 변경 → 풀 재시작 필수**(`pkill -f "next dev"; rm -rf .next; npm run dev`).

---

## 📄 `next.config.ts` — redirects 교체

**찾기:**
```ts
  async redirects() {
    return [
      { source: "/scalper", destination: "/kr", permanent: true },
      { source: "/scalper/:path*", destination: "/kr/:path*", permanent: true },
      { source: "/longterm", destination: "/kr", permanent: true },
      { source: "/longterm/:path*", destination: "/kr/:path*", permanent: true },
    ];
  },
```
**바꾸기:**
```ts
  async redirects() {
    // 옛 버전 잔재 라우트 → 홈 (현재 게이트웨이 미사용 · 옛 디자인/브랜드 노출 차단)
    const legacy = [
      "/scalper", "/longterm",
      "/market", "/stock", "/room", "/rooms",
      "/news", "/products", "/product",
      "/discussion", "/calendar", "/global",
    ];
    return legacy.flatMap((p) => [
      { source: p, destination: "/", permanent: false },
      { source: `${p}/:path*`, destination: "/", permanent: false },
    ]);
  },
```

---

## ✅ 검증 (next.config 변경 → 풀 재시작 필수)
```bash
npm run build
```
빌드 무에러.

dev 서버 **풀 재시작**:
```bash
pkill -f "next dev"; rm -rf .next; npm run dev
```
브라우저:
1. 주소창에 `localhost:3333/market`·`/stock/005930`·`/room/1`·`/discussion` 등 직접 입력 → **전부 홈(`/`)으로 이동**.
2. 현재 제품 경로(`/`·`/coin`·`/favorites`·`/mypage`·`/admin`·`/about`·`/terms`·`/privacy`·`/auth/login`)는 **정상**(리다이렉트 안 됨).
3. 게이트웨이 '뉴스'·'종목·상품' 등 **탭**(URL은 `/`)은 그대로 동작 — `/news`·`/market` "라우트"만 막힌 거지 탭과 무관.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add next.config.ts && git commit -m "chore(cleanup): 옛 legacy 라우트(/market·/stock·/room 등) → 홈 리다이렉트 + 깨진 /scalper·/longterm 수정 (STEP 362)" && git push
```

---

> **한 줄 요약**: 안 쓰는 옛 라우트 12종을 홈으로 리다이렉트 → 옛 운종 디자인·브랜드 페이지 노출 차단. 코드 삭제는 출시 전. next.config 변경이라 **풀 재시작 필수**.
