<!-- 2026-06-21 -->
# STEP 344 — [수정] 공모주 필터 셀렉터 버그 (빈값 → 정상)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_344_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
STEP 343의 셀렉터 `a[href*="o=v&no="]`가 cheerio에서 `&`를 매칭 못 해 **모든 행 제외 → 빈값**이 된 버그 수정.
→ `o=v` 셀렉터로 찾고 **JS에서 디코딩된 href 필터**(`no=` 있고 `nostock` 아님). 추가로 날짜 셀 길이 가드.

> 변경 1파일: `app/api/ipo/feed/route.ts` 2군데.

---

## 📄 `app/api/ipo/feed/route.ts`

### 1 — 행 필터(셀렉터 → JS 필터)
**찾기:**
```ts
      const links = $tr.find('a[href*="o=v&no="]');
      if (links.length !== 1) return;
      const a = links.first();
```
**바꾸기:**
```ts
      // o=v 셀렉터(&는 cheerio 셀렉터에서 매칭 불가)로 찾고, 디코딩된 href로 필터
      const links = $tr.find('a[href*="o=v"]').filter((_, el) => {
        const h = $(el).attr("href") || "";
        return /[?&]no=\d+/.test(h) && !h.includes("nostock"); // 종목 상세(no=) O, 뉴스(nostock) X
      });
      if (links.length !== 1) return; // 1개=진짜 데이터 행 / 0·다수=뉴스·컨테이너 행
      const a = links.first();
```

### 2 — 날짜 셀 길이 가드(컨테이너 행 2차 방어)
**찾기:**
```ts
      if (dateIdx < 0) return;

      const sub = cells[dateIdx] || "";
```
**바꾸기:**
```ts
      if (dateIdx < 0) return;

      const sub = cells[dateIdx] || "";
      if (sub.length > 30) return; // 깨끗한 날짜 셀("2026.07.23~07.24")만 — 컨테이너 행 방어
```

---

## ✅ 검증
```bash
npm run build
```
빌드 무에러.

### ⚠️ dev 서버 완전 재시작 (라우트 캐시)
```bash
lsof -ti:3333 | xargs kill -9 2>/dev/null; cd ~/stock-terminal && npm run dev
```
그다음 브라우저 하드 새로고침(Cmd+Shift+R).

### 확인
1. **공모주·배당 → 공모주** → 인제니아테라퓨틱스·에이치엘지노믹스·레메디… 깨끗하게(쓰레기·오버플로 없음).
2. 콘솔: `fetch('/api/ipo/feed').then(r=>r.json()).then(j=>console.log(j.items.length, j.items.map(x=>x.name)))` → 13~15개, 종목명만 깔끔.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/api/ipo/feed/route.ts && git commit -m "fix(ipo): 셀렉터 & 매칭 버그 → o=v + JS href 필터, 날짜셀 가드 (STEP 344)" && git push
```

---

> **한 줄 요약**: STEP 343 셀렉터의 `&` 매칭 실패로 빈값 → JS href 필터로 교체. 깨끗한 종목 행만.
