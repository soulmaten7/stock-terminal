# STEP 754 — US 유니버스 프레시니스: Nasdaq 공식 심볼 디렉토리 월간 재생성 (GitHub Action)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet — 신규 스크립트 1 + 워크플로 1)

**전제 상태**: 코드 HEAD `c8d7125`(STEP 753) · 트리 클린

**배경**: US 유니버스가 정적 시드(`data/us_symbols.json` 6,936)라 **신규 상장이 자동 편입 안 됨**(마지막 구조 갭·STATE). 시드는 빌드 번들 → 재생성 = 커밋+배포 필요 → Vercel 크론 불가 → **GitHub Action 월 1회**(스크립트 → 변경 시 자동 커밋 → Vercel 자동배포).

**소스(07-18 프로브 검증)**: Nasdaq Trader 공식 심볼 디렉토리(무키·매일 밤 갱신·파이프 구분)
- `https://www.nasdaqtrader.com/dynamic/symdir/nasdaqlisted.txt` (5,567행 · `Symbol|Security Name|…|Test Issue|…|ETF|NextShares`)
- `https://www.nasdaqtrader.com/dynamic/symdir/otherlisted.txt` (7,494행 · `ACT Symbol|Security Name|Exchange|…|ETF|…|Test Issue|…`)

**정책(보수적)**: **주식(stock)만 재생성** — 신규 편입 목적은 신규 상장(주식). 기존 `type:'etf'` 815항목은 **그대로 보존**(ETF 유니버스는 큐레이션 성격·디렉토리 전체 ETF ~4천개로 부풀리지 않음). 시드에서 사라진 상폐 주식은 제거.

---

## 파일 1 — 신규 `scripts/refresh_us_symbols.ts`

```ts
// US 유니버스 월간 재생성 — Nasdaq Trader 공식 심볼 디렉토리 → data/us_symbols.json (STEP 754).
// 정책: 주식만 재생성(신규상장 편입·상폐 제거) · 기존 etf 항목은 보존(큐레이션 성격).
// 실행: npx tsx scripts/refresh_us_symbols.ts   (GitHub Action 월 1회 + workflow_dispatch)
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "data", "us_symbols.json");
type Row = { sym: string; name: string; type: string };

// 파생·비보통주 제외(보통주/클래스주/ADR만 유니버스에)
const EXCLUDE_NAME = /(warrant|right(s)?\b|unit(s)?\b|preferred|depositary shs|notes? due|when[- ]issued)/i;

async function fetchTxt(url: string): Promise<string[]> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return (await res.text()).split(/\r?\n/);
}

function parseStocks(lines: string[], cols: { sym: number; name: number; etf: number; test: number }): Row[] {
  const out: Row[] = [];
  for (const line of lines.slice(1)) {
    const f = line.split("|");
    if (f.length < 5) continue; // 푸터("File Creation Time…")·빈 줄
    const rawSym = (f[cols.sym] ?? "").trim();
    const name = (f[cols.name] ?? "").trim();
    if (!rawSym || !name) continue;
    if ((f[cols.test] ?? "").trim() === "Y") continue;         // 테스트 종목 제외
    if ((f[cols.etf] ?? "").trim() === "Y") continue;          // ETF 제외(기존 etf 목록 보존 정책)
    if (/[$^=~]/.test(rawSym)) continue;                        // 우선주·특수 심볼 제외
    if (EXCLUDE_NAME.test(name)) continue;                      // 워런트·라이트·유닛 등 제외
    const sym = rawSym.replace(/\./g, "-").toUpperCase();       // 야후 표기(BRK.B → BRK-B)
    out.push({ sym, name, type: "stock" });
  }
  return out;
}

(async () => {
  // nasdaqlisted: 0 Symbol · 1 Security Name · 3 Test Issue · 6 ETF
  const nasdaq = parseStocks(await fetchTxt("https://www.nasdaqtrader.com/dynamic/symdir/nasdaqlisted.txt"), { sym: 0, name: 1, test: 3, etf: 6 });
  // otherlisted: 0 ACT Symbol · 1 Security Name · 4 ETF · 6 Test Issue
  const other = parseStocks(await fetchTxt("https://www.nasdaqtrader.com/dynamic/symdir/otherlisted.txt"), { sym: 0, name: 1, test: 6, etf: 4 });

  const bySym = new Map<string, Row>();
  for (const r of [...nasdaq, ...other]) if (!bySym.has(r.sym)) bySym.set(r.sym, r);
  const stocks = [...bySym.values()].sort((a, b) => a.sym.localeCompare(b.sym));

  // ⛔ 안전 가드 — 부분 응답/포맷 변경으로 유니버스가 반토막 나는 것 방지(조용한 축소 금지)
  if (stocks.length < 4000) throw new Error(`too few stocks: ${stocks.length} (source partial/format changed?)`);

  const prev = JSON.parse(fs.readFileSync(OUT, "utf8")) as Row[];
  const prevStocks = prev.filter((r) => r.type === "stock");
  const etfs = prev.filter((r) => r.type !== "stock"); // etf 등 비주식 항목 전부 보존

  const prevSet = new Set(prevStocks.map((r) => r.sym));
  const nextSet = new Set(stocks.map((r) => r.sym));
  const added = stocks.filter((r) => !prevSet.has(r.sym)).map((r) => r.sym);
  const removed = prevStocks.filter((r) => !nextSet.has(r.sym)).map((r) => r.sym);

  const next = [...stocks, ...etfs];
  fs.writeFileSync(OUT, JSON.stringify(next));
  console.log(`stocks ${prevStocks.length} -> ${stocks.length} (+${added.length} / -${removed.length}) · etf 보존 ${etfs.length}`);
  if (added.length) console.log("added:", added.slice(0, 30).join(","), added.length > 30 ? "…" : "");
  if (removed.length) console.log("removed:", removed.slice(0, 30).join(","), removed.length > 30 ? "…" : "");
})();
```

⚠️ 주의: 기존 `us_symbols.json`이 minified면 출력도 `JSON.stringify(next)`(무들여쓰기)로 diff 최소화 — 파일 첫 부분을 보고 기존이 pretty면 `JSON.stringify(next, null, 1)`류로 기존 스타일에 맞출 것.

## 파일 2 — 신규 `.github/workflows/refresh-us-symbols.yml`

```yaml
# US 유니버스 월간 재생성(STEP 754) — 변경 있으면 자동 커밋 → Vercel 자동배포.
name: refresh-us-symbols
on:
  schedule:
    - cron: "0 2 1 * *" # 매월 1일 02:00 UTC
  workflow_dispatch: {}
permissions:
  contents: write
jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx tsx scripts/refresh_us_symbols.ts
      - name: commit if changed
        run: |
          if ! git diff --quiet data/us_symbols.json; then
            git config user.name "github-actions[bot]"
            git config user.email "github-actions[bot]@users.noreply.github.com"
            git add data/us_symbols.json
            git commit -m "chore: monthly US universe refresh (nasdaqtrader symbol directory)"
            git push
          else
            echo "no changes"
          fi
```

---

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build`
2. **로컬 1회 실행**: `npx tsx scripts/refresh_us_symbols.ts` → 로그의 `stocks 6121 -> N (+a/-b)` 보고. 상식 체크: N이 5,500~7,000 범위 · added/removed 각각 수십~수백 수준(수천이면 필터 오류 — 중단하고 보고). `git diff --stat data/us_symbols.json` 첨부.
3. 스팟 체크: `python3 - <<'EOF'` 등으로 AAPL·NVDA·BRK-A·BRK-B 존재 + etf 815 보존 확인.
4. 결과가 정상 범위면 커밋(us_symbols.json 변경 포함 — 이번 실행이 첫 백필 겸):
   ```bash
   git add scripts/refresh_us_symbols.ts .github/workflows/refresh-us-symbols.yml data/us_symbols.json docs/STEP_754_COMMAND.md
   git commit -m "STEP 754: monthly US universe refresh via GitHub Action (nasdaqtrader symbol directory)"
   git push
   ```
5. push 후 GitHub → Actions 탭에서 `refresh-us-symbols` **workflow_dispatch 수동 1회 실행** — GitHub Actions IP에서 nasdaqtrader 도달성 검증(G2 게이트·VCI 전례). "no changes"(방금 백필했으므로)면 성공.

## 완료 보고 → Cowork에게
- 로컬 실행 로그(±카운트·diff stat) · 스팟 체크 결과 · 커밋 해시 · Actions 수동 실행 성공 여부.
