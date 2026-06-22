<!-- 2026-06-20 -->
# STEP 331 — [버그] ETF·ETN 1주일·1년 수익률 빈값 수정 (재시도 + 캐시 가드)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_331_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 원인 & 해결
- **원인**: KRX에 1주일·1년 데이터는 실제로 존재(디버그 확인 ETF 1137·991건). 그런데 그 두 스냅샷을 가져올 때 *일시적으로 실패*한 결과가 **30분 캐시에 얼어붙어** 1주일·1년이 전부 null로 굳음.
- **해결**: ① `fetchDay`에 **재시도(2회)** ② **1주일·1년 스냅샷이 비면 캐시 안 함**(다음 요청 재계산). 빌드 시 서버 재시작으로 기존 stale 캐시도 비워져 바로 채워짐.

> 변경: `app/api/krx/etf-performance/route.ts` + `app/api/krx/etn-performance/route.ts` — **두 파일 모두 같은 수정 2곳** (두 파일 코드 동일).

---

## 📄 두 파일 공통 — 수정 2곳씩

> 아래 2개 찾기/바꾸기를 **`etf-performance/route.ts`와 `etn-performance/route.ts` 양쪽 모두**에 적용.

### 1 — `fetchDay`에 재시도 추가

**찾기:**
```ts
async function fetchDay(basDd: string, key: string): Promise<KrxRow[]> {
  try {
    const res = await fetch(`${EP}?basDd=${basDd}`, {
      method: "GET",
      headers: { AUTH_KEY: key, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const j = await res.json();
    return (j.OutBlock_1 ?? j.output ?? []) as KrxRow[];
  } catch {
    return [];
  }
}
```
**바꾸기:**
```ts
async function fetchDay(basDd: string, key: string): Promise<KrxRow[]> {
  // 일시적 실패 대비 2회 시도
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${EP}?basDd=${basDd}`, {
        method: "GET",
        headers: { AUTH_KEY: key, Accept: "application/json" },
        cache: "no-store",
      });
      if (res.ok) {
        const j = await res.json();
        const rows = (j.OutBlock_1 ?? j.output ?? []) as KrxRow[];
        if (rows.length > 0) return rows;
      }
    } catch {
      /* 재시도 */
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 250));
  }
  return [];
}
```

### 2 — 1주일·1년 스냅샷 비면 캐시 안 함

**찾기:**
```ts
  const data = { items };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
```
**바꾸기:**
```ts
  const data = { items };
  // 1주일·1년 스냅샷이 비어 있으면(일시적 실패) 캐시하지 않음 → 다음 요청에 재계산
  if (w.rows.length > 0 && y.rows.length > 0) {
    cache = { at: Date.now(), data };
  }
  return NextResponse.json(data);
```

---

## ✅ 검증
```bash
npm run build
```
- 빌드 무에러.

개발 서버:
1. 종목·상품 → **ETF 탭** → **1주일·1년 컬럼이 채워짐**.
2. **ETN 탭**도 동일하게 1주일·1년 채워짐.
3. (검증용) 브라우저 콘솔에서:
   `fetch('/api/krx/etf-performance').then(r=>r.json()).then(j=>console.log('r1w', j.items.filter(x=>x.r1w!=null).length, 'r1y', j.items.filter(x=>x.r1y!=null).length))`
   → r1w·r1y가 0이 아닌 값.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/api/krx/etf-performance/route.ts app/api/krx/etn-performance/route.ts && git commit -m "fix(market): ETF·ETN 1주일·1년 수익률 빈값 — fetchDay 재시도 + 스냅샷 실패 시 캐시 가드 (STEP 331)" && git push
```

---

> **한 줄 요약**: ETF·ETN의 1주일·1년이 비던 건 일시 실패가 캐시에 굳은 것 → 재시도 + 빈 스냅샷 캐시 금지로 안정적으로 채움.
