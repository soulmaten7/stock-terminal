<!-- 2026-07-01 -->
# STEP 495 — 중국·일본 종목 로고 자동 수집 (야후 프로필 → 도메인 → logo.dev)

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_495_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
홍콩·중국·일본은 티커가 숫자라 로고 자동매칭이 안 됨(손매핑 ~30·73개만 실로고). → **야후 `assetProfile.website`로 각 종목 홈페이지 도메인을 한 번 긁어** `data/cn_logo_domains.json`·`data/jp_logo_domains.json`에 저장 → `logoUrl`이 자동 매칭.
- **`lib/avatar.ts`는 Cowork이 이미 수정함**(자동맵 import + 손매핑 다음 우선순위). 빈 JSON 2개도 생성됨. 이 STEP = **수집 스크립트 실행 → 압축 → 빌드 → 커밋**.
- 재실행 가능(이미 받은 심볼 스킵) → 10분 bash 제한 안전. 실패(429)는 마킹 안 해 다음 실행 때 재시도.
- 커버리지는 부분적(중형+는 대부분, 소형주 일부 누락) — 정상. 누락은 기존처럼 글자 아바타.

---

## 1) 수집 스크립트 생성 — `scripts/gen_logo_domains.mjs`
```js
import YahooFinance from "yahoo-finance2";
import fs from "fs";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const TARGETS = [
  { syms: "data/cn_symbols.json", out: "data/cn_logo_domains.json" },
  { syms: "data/jp_symbols.json", out: "data/jp_logo_domains.json" },
];

function domainOf(website) {
  try {
    const u = new URL(String(website).startsWith("http") ? website : "https://" + website);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch { return null; }
}

async function mapLimit(arr, limit, fn) {
  let idx = 0;
  async function worker() { while (idx < arr.length) { const cur = idx++; await fn(arr[cur]); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, () => worker()));
}

for (const t of TARGETS) {
  const syms = JSON.parse(fs.readFileSync(t.syms, "utf8")).map((s) => s.sym);
  const map = fs.existsSync(t.out) ? JSON.parse(fs.readFileSync(t.out, "utf8")) : {};
  const todo = syms.filter((s) => !(s in map));
  console.log(`${t.out}: ${syms.length} syms · ${Object.keys(map).length} done · ${todo.length} todo`);
  let n = 0;
  await mapLimit(todo, 10, async (sym) => {
    try {
      const r = await yf.quoteSummary(sym, { modules: ["assetProfile"] });
      const w = r && r.assetProfile && r.assetProfile.website;
      map[sym] = (w ? domainOf(w) : null) || ""; // 성공: 도메인 or "" (확정, 재시도 방지)
    } catch {
      /* 실패(429/타임아웃)는 마킹 안 함 → 다음 실행 때 재시도 */
    }
    if (++n % 200 === 0) fs.writeFileSync(t.out, JSON.stringify(map));
  });
  fs.writeFileSync(t.out, JSON.stringify(map));
  const withDomain = Object.values(map).filter((v) => v).length;
  console.log(`${t.out}: 완료 — 도메인 ${withDomain} / 시도 ${Object.keys(map).length}`);
}
```

## 2) 실행 (재실행 가능 — todo가 거의 0 될 때까지 2~4회 반복)
```bash
cd ~/stock-terminal
node scripts/gen_logo_domains.mjs        # 모듈 에러 시: npx tsx scripts/gen_logo_domains.mjs
```
> 매 실행이 이전 결과를 이어감(스킵). 출력의 `todo`가 회차마다 줄어듦. **`todo`가 수백 이하로 안 줄면 그만** (남은 건 홈페이지 없는/상장폐지 종목). 각 실행이 10분 넘어 끊겨도 200개마다 저장돼 안전 — 그냥 다시 실행.

## 3) 압축 — 빈("") 항목 제거(번들 축소, 실도메인만 남김)
```bash
node -e 'for(const f of ["data/cn_logo_domains.json","data/jp_logo_domains.json"]){const fs=require("fs");const m=JSON.parse(fs.readFileSync(f));const o={};for(const k in m)if(m[k])o[k]=m[k];fs.writeFileSync(f,JSON.stringify(o));console.log(f, Object.keys(o).length, "domains")}'
```

## 4) 빌드
```bash
npm run build
```
> `avatar.ts`가 두 JSON을 import함(Cowork이 이미 연결). 빌드 통과 확인.

## 5) 검증 (localhost:3333)
```bash
# 도메인 몇 개 스팟체크
node -e 'const c=require("./data/cn_logo_domains.json");console.log("CN 예:",Object.entries(c).slice(0,5)); const j=require("./data/jp_logo_domains.json");console.log("JP 예:",Object.entries(j).slice(0,5));'
```
- [ ] 🇨🇳 중국 / 🇯🇵 일본 종목보드: 예전보다 **실로고가 크게 늘어남**(중형+ 대부분). 없는 건 글자 아바타 유지.
- [ ] 🇰🇷🇺🇸 회귀 없음.

## 6) 커밋
```bash
git add data/cn_logo_domains.json data/jp_logo_domains.json lib/avatar.ts scripts/gen_logo_domains.mjs && git commit -m "feat(jp,cn): 종목 로고 자동수집 — 야후 프로필 도메인 → logo.dev (STEP 495)" && git push
```

## ⚠️ 노트
- 손매핑(CN_DOMAIN_MAP·JP_DOMAIN_MAP)이 자동보다 우선 — 유명주 품질 보장. 자동은 롱테일 보강.
- 정적 데이터라 신규상장·홈페이지변경 반영은 이 STEP 재실행(가끔).
- 야후에 홈페이지 없는 종목은 자동으로 아바타 — 정상.
