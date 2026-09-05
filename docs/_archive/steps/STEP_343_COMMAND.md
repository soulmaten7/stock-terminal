<!-- 2026-06-21 -->
# STEP 343 — [수정] 공모주 피드 쓰레기 행 제거 (오버플로 해결)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_343_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
공모주 피드 맨 위에 끼던 **뉴스 티커 행 + 표 컨테이너 행**(페이지 전체 텍스트가 들어가 가로 오버플로) 제거. 종목 상세 링크(`o=v&no=`)가 **정확히 1개인 행만** 파싱 → 깨끗한 종목 행만 남음.

> 변경 1파일: `app/api/ipo/feed/route.ts` 한 군데(행 필터).

---

## 📄 `app/api/ipo/feed/route.ts` — 행 필터 교체

**찾기:**
```ts
    $("tr").each((_, tr) => {
      const $tr = $(tr);
      const a = $tr.find('a[href*="o=v"]').first(); // 종목 상세 링크가 있는 행만
      const name = a.text().replace(/\s+/g, " ").trim();
      if (!a.length || !name) return;
```
**바꾸기:**
```ts
    $("tr").each((_, tr) => {
      const $tr = $(tr);
      // 종목 상세 링크(o=v&no=)가 정확히 1개인 "진짜 데이터 행"만.
      // (뉴스 행=o=v&m=nostock / 표 컨테이너 행=링크 수십 개 → 제외)
      const links = $tr.find('a[href*="o=v&no="]');
      if (links.length !== 1) return;
      const a = links.first();
      const name = a.text().replace(/\s+/g, " ").trim();
      if (!name) return;
```

---

## ✅ 검증
```bash
npm run build
```
빌드 무에러.

개발 서버(라우트 변경 → **재시작** 권장):
```bash
lsof -ti:3333 | xargs kill -9 2>/dev/null; cd ~/stock-terminal && npm run dev
```
1. **공모주·배당 → 공모주** → 맨 위 쓰레기 행 사라지고, 종목명·청약일·공모가·주간사만 깔끔히(화면 안 벗어남).
2. 콘솔: `fetch('/api/ipo/feed').then(r=>r.json()).then(j=>console.log(j.items.map(x=>x.name)))` → 종목명만 깔끔한 배열(공모뉴스·"종목명 공모주일정..." 같은 게 없어야 정상).

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/api/ipo/feed/route.ts && git commit -m "fix(ipo): 뉴스·컨테이너 행 제외(o=v&no= 단일 링크 행만) — 오버플로 해결 (STEP 343)" && git push
```

---

> **한 줄 요약**: 공모주 피드에서 뉴스·표컨테이너 쓰레기 행 제거 → 깨끗한 종목 행만, 가로 오버플로 해결.
