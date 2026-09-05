<!-- 2026-06-21 -->
# STEP 345 — [수정] 공모주 빈값 진짜 원인: 행당 링크 2개 (필터 완화)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_345_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
38 표는 **각 종목 행에 링크가 2개**(종목명 칸 + 분석 칸, 같은 `no=`). 그래서 STEP 343/344의 `links.length !== 1`이 **깨끗한 행을 전부 제외** → 빈값.
→ `=== 0`(링크 없는 행만 제외)으로 완화. 컨테이너 행은 STEP 344에서 넣은 `sub.length > 30` 가드가 처리.

> 변경 1파일: `app/api/ipo/feed/route.ts` 한 줄.

---

## 📄 `app/api/ipo/feed/route.ts` — 링크 개수 조건 완화

**찾기:**
```ts
      if (links.length !== 1) return; // 1개=진짜 데이터 행 / 0·다수=뉴스·컨테이너 행
```
**바꾸기:**
```ts
      if (links.length === 0) return; // 종목 링크 없는 행만 제외 (각 행에 종목명+분석 2개 링크 → 컨테이너는 아래 sub 길이 가드로 제외)
```

---

## ✅ 검증
```bash
npm run build
```
빌드 무에러.

### ⚠️ 깨끗한 재시작 (이번엔 .next 캐시까지 비움 — 라우트 갱신 확실히)
```bash
lsof -ti:3333 | xargs kill -9 2>/dev/null; cd ~/stock-terminal && rm -rf .next && npm run dev
```
그다음 브라우저 하드 새로고침(Cmd+Shift+R).

### 확인
1. **공모주·배당 → 공모주** → 인제니아테라퓨틱스·에이치엘지노믹스·레메디·레몬헬스케어·매드업… 깨끗하게 13~15개.
2. 콘솔: `fetch('/api/ipo/feed').then(r=>r.json()).then(j=>console.log(j.items.length, j.items.map(x=>x.name)))` → 종목명만 깔끔한 배열.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/api/ipo/feed/route.ts && git commit -m "fix(ipo): 행당 링크 2개(종목명+분석) → 필터 !==1 → ===0 완화, 빈값 해결 (STEP 345)" && git push
```

---

> **한 줄 요약**: 38 행당 링크가 2개라 `!==1` 필터가 다 걸러 빈값 → `===0`으로 완화. 날짜 길이 가드가 컨테이너 제외.
