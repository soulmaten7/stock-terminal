# STEP 751 — CN A주 일봉 소스 교체: 东方财富 → 텐센트 ifzq kline (폴백 유지)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet — 1파일)

**전제 상태**: 코드 HEAD `54d3821`(STEP 750b) · 트리 클린

**근거(07-18 실측)**: 750b로 cn-perf가 완주되기 시작했으나 분포가 **HK 3,203 성공 vs A주 232 성공(~90% 실패)** — 东方财富 push2his가 **Vercel IP를 소프트차단**(hang → 5초 타임아웃 소진) 확정. 전례 = `LOCALE_SOURCE_PLAYBOOK §8 #7`(东方财富 데이터센터 IP 차단 → R3는 텐센트 우회 성공). **텐센트 ifzq kline은 Cowork이 프로브 검증 완료**(JSON·0.34초·구조 확인). 단, Vercel IP에서의 도달성은 이번 배포 후 수동 실행이 첫 실측(G2) — 실패 시 폴백이 받친다.

---

## 수정 — `lib/cnPerf.ts` 1파일

### 1) `eastmoneyBars` 함수 아래에 텐센트 함수 추가

```ts
// A주 일봉 1차 소스 — 텐센트(web.ifzq.gtimg.cn) fqkline (STEP 751).
// 东方財富(push2his)가 Vercel IP를 소프트차단(07-18 실측: A주 ~90% 실패·hang)해 교체. 东方财富는 폴백으로 유지.
// 응답: data[<sh|sz+code>].qfqday(수정주가·우선) 또는 .day = [[date, open, close, high, low, volume(手)], ...]
// amount는 텐센트 kline에 成交额이 없어 근사(종가 × volume(手) × 100주) — HK 경로(price×volume)와 같은 급의 근사.
async function tencentBars(sym: string): Promise<{ closes: number[]; lastAmount: number | null }> {
  try {
    const code = sym.replace(/\.(SS|SZ)$/, "");
    const t = (sym.endsWith(".SS") ? "sh" : "sz") + code;
    const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${t},day,,,320,qfq`; // 320행 ≈ 252거래일(r1y)+버퍼
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { closes: [], lastAmount: null };
    const j = (await res.json()) as { data?: Record<string, { qfqday?: string[][]; day?: string[][] }> };
    const rows = j.data?.[t]?.qfqday ?? j.data?.[t]?.day ?? [];
    const closes = rows.map((r) => parseFloat(r[2])).filter((c) => isFinite(c) && c > 0);
    const last = rows[rows.length - 1];
    const lastClose = closes[closes.length - 1];
    const vol = last ? parseFloat(last[5]) : NaN; // 단위 = 手(100주)
    return {
      closes,
      lastAmount: isFinite(vol) && vol > 0 && lastClose ? lastClose * vol * 100 : null,
    };
  } catch {
    return { closes: [], lastAmount: null };
  }
}
```

### 2) A주 분기 교체

기존:
```ts
      } else {
        // 상해(.SS)·심천(.SZ) A주 → 東方財富 kline (Yahoo 차단 대체)
        const code = sym.replace(/\.(SS|SZ)$/, "");
        const secid = (sym.endsWith(".SS") ? "1." : "0.") + code;
        const res = await eastmoneyBars(secid);
        closes = res.closes;
        eastAmt = res.lastAmount;
      }
```
→
```ts
      } else {
        // 상해(.SS)·심천(.SZ) A주 → 1차 텐센트 ifzq(STEP 751), 부실 시 東方財富 폴백
        let res = await tencentBars(sym);
        if (res.closes.length < 6) {
          const code = sym.replace(/\.(SS|SZ)$/, "");
          const secid = (sym.endsWith(".SS") ? "1." : "0.") + code;
          res = await eastmoneyBars(secid);
        }
        closes = res.closes;
        eastAmt = res.lastAmount;
      }
```

---

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` 통과 · `npm run build` 성공
2. push → **배포 반영 확인**(라이브 sentry-release = 이 커밋) 후 수동 실행:
   ```bash
   set -a && source .env.local && set +a && time curl -s -m 290 -H "Authorization: Bearer $CRON_SECRET" https://onetrillion.app/api/cron/cn-perf
   ```
   기대: `ok:true` · 300초 내 · `computed`가 attempted에 근접(A주 포함). **A주가 여전히 전멸이면 텐센트도 Vercel 차단**일 수 있음 — 그 경우 결과만 보고(다음 판단은 Cowork·§11 보류 프로토콜 후보).
3. 보고 후 Cowork이 DB로 A주 fresh 급증 + 값 샘플(마오타이 600519.SS 가격대) 검증.

## 커밋

```bash
git add lib/cnPerf.ts docs/STEP_751_COMMAND.md
git commit -m "STEP 751: switch CN A-share bars to Tencent ifzq kline (eastmoney soft-blocks Vercel IPs), keep eastmoney fallback"
git push
```

## 완료 보고 → Cowork에게
- 수동 실행 JSON 전문 + 소요 시간 + 커밋 해시.
