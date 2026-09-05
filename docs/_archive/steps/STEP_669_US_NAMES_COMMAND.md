<!-- 2026-07-09 -->
# STEP 669 — 🇺🇸 US 종목명 SEC 실명 보강 (placeholder 4,231 → 실명)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** STEP 668B 이후. US 보드가 스냅샷 서빙인데 **`us_symbols.json`의 4,231종목(61%) 이름이 티커 placeholder** → 보드에 회사명 대신 티커 표시.
**목표:** SEC `company_tickers.json`(공식·무료·전 종목)으로 placeholder를 실명으로 보강 → 보드 실명 복구. 정적 1회 보강(라이브 페치 없음).
**대상:** `data/us_symbols.json`(+ meta 갱신). 코드 변경 없음(NAME_MAP이 자동 반영).

> 검수 발견: us_symbols_meta.json이 "Yahoo가 quote 때 실명 준다" 전제로 placeholder를 뒀으나, `us-list`의 `NAME_MAP.get(sym) || sym`에서 placeholder(티커)가 truthy라 실명 경로가 안 탐. 다른 5개국은 실명 정상(교차확인 완료).

---

## 1. 보강 스크립트 (`scripts/enrich_us_names.mjs` 임시)

```js
// SEC company_tickers.json → us_symbols.json placeholder 실명 보강. node scripts/enrich_us_names.mjs
import fs from "node:fs";

const UA = "Trillion/1.0 (contact@onetrillion.app)"; // ⚠️ SEC는 UA 없으면 차단
const res = await fetch("https://www.sec.gov/files/company_tickers.json", { headers: { "User-Agent": UA } });
if (!res.ok) { console.error("SEC fetch failed", res.status); process.exit(1); }
const sec = await res.json(); // { "0": {cik_str, ticker, title}, ... }

// 티커→title 맵(대문자). SEC 티커는 클래스주에 '-' 사용(예: BRK-B). 변형도 등록.
const map = new Map();
for (const k in sec) {
  const t = String(sec[k].ticker || "").toUpperCase().trim();
  const title = String(sec[k].title || "").trim();
  if (!t || !title) continue;
  map.set(t, title);
  map.set(t.replace(/-/g, "."), title);   // BRK-B ↔ BRK.B
  map.set(t.replace(/[-.]/g, ""), title);  // BRKB
}

// 타이틀케이스(SEC는 전부 대문자) — 간단 변환, 약어(&·JR·II 등)는 대충 유지.
function titleCase(s) {
  return s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\b(Inc|Corp|Ltd|Llc|Plc|Co|Sa|Nv|Ag)\b/g, (m) => m); // 유지
}

const path = "data/us_symbols.json";
const arr = JSON.parse(fs.readFileSync(path, "utf8"));
let fixed = 0, still = 0;
for (const s of arr) {
  if (s.type !== "stock") continue;
  const code = String(s.sym).split(".")[0].toUpperCase();
  const isPlaceholder = !s.name || s.name.trim().toUpperCase() === code || s.name.trim().toUpperCase() === String(s.sym).toUpperCase();
  if (!isPlaceholder) continue;
  const hit = map.get(code) || map.get(code.replace(/-/g, ".")) || map.get(code.replace(/[-.]/g, ""));
  if (hit) { s.name = titleCase(hit); fixed++; } else { still++; }
}
fs.writeFileSync(path, JSON.stringify(arr, null, 0));
console.log(`보강 ${fixed}, 여전히 placeholder ${still}`);
```

```bash
node scripts/enrich_us_names.mjs
```
> **SEC UA 필수**(없으면 403). 실패 시 UA를 실제 연락 이메일 형태로. SEC company_tickers.json = 약 10,000개 커버 → 대다수 해결, 남는 소수(외국 ADR·SEC 미등록)는 티커 유지(수용).

## 2. 검증 (3번 생각)
```bash
python3 -c "
import json
d=json.load(open('data/us_symbols.json'))
st=[s for s in d if s['type']=='stock']
ph=sum(1 for s in st if not s['name'] or s['name'].strip().upper()==s['sym'].split('.')[0].upper())
print('stock', len(st), 'placeholder 남음', ph, f'({ph*100//len(st)}%)')
# 샘플 확인: 유명 티커 실명
m={s['sym']:s['name'] for s in d}
for t in ['NVDA','TSLA','BRK-B','ZUMZ','PLTR','SOFI']:
    print(t, '→', m.get(t))
"
```
- **placeholder가 61%→한 자릿수%**로 급감하면 성공. 유명 티커(NVDA·BRK-B 등) 실명 정상.
- 타이틀케이스 어색한 것(예: 'Iii'·'Ii') 있으면 보정 or SEC 대문자 그대로 둘지 판단(가독성 우선).

## 3. 커밋
```bash
rm -f scripts/enrich_us_names.mjs   # 임시면 제거(또는 재실행용 보존 — 판단)
git add data/us_symbols.json data/us_symbols_meta.json
git commit -m "fix(us): 종목명 SEC company_tickers.json으로 실명 보강(placeholder 4,231→최소화) — 보드 회사명 표시 복구"
git push
```
> us-list는 15분 인메모리 캐시라 배포 후 다음 캐시 미스에 반영. meta의 `placeholder_names`도 갱신하면 좋음.

## Cowork에게 보고
1. 보강 후 placeholder 잔여 %(한 자릿수 목표) + 유명 티커 실명 정상.
2. 타이틀케이스 품질(어색한 것 비율).
→ 다음 검수 = **CN ETF 오태깅(#3)** — ss/sz 태그 ETF가 주식 탭에 섞이는지 보드 필터 확인 → 그다음 VN HNX·CN A주 완전성(사용자 결정).
