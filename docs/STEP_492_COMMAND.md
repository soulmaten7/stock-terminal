<!-- 2026-07-01 -->
# STEP 492 — 중국 종목보드(전종목): HKEX 공식목록 + 후강퉁·선강퉁 대상 A주 (하드코딩 폐기)

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_492_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
중국 종목보드를 **큐레이션(~110) 폐기 → 매매가능 전종목**으로. JP(JPX 489)와 동일 방식으로 Claude Code가 공식 파일 다운로드:
- **홍콩(HKEX)**: `ListOfSecurities.xlsx` → 주식 전종목 + ETF + REIT (한국인 직접 매매 가능)
- **상해(후강퉁)**: `SSE_Securities.csv` → 상해 Connect 대상 A주 전종목
- **심천(선강퉁)**: `SZSE_Securities.csv` → 심천 Connect 대상 A주 전종목

이미 Cowork이 생성한 코드/테이블(`lib/cnPerf.ts`, `app/api/yahoo/cn-list/route.ts`, `app/api/cron/cn-perf/route.ts`, `components/toolbox/CnMarketBoard.tsx`, `cn_stock_perf`)은 그대로 사용. **이 STEP = 데이터 전면교체 + 배선 3개 + 빌드 + 크론 시딩 + 커밋.**
- ⚠️ 새 API 라우트 포함 → 클린 재시작 필수.
- ⚠️ 다운로드/파싱 실패 시 백업 복구 + Cowork에 보고(억지로 진행 금지).

---

## 0) 사전 확인
```bash
cd ~/stock-terminal
ls -la data/cn_symbols.json lib/cnPerf.ts app/api/yahoo/cn-list/route.ts app/api/cron/cn-perf/route.ts components/toolbox/CnMarketBoard.tsx
cp data/cn_symbols.json data/cn_symbols.json.bak   # 큐레이션 백업(폴백)
pip install pandas openpyxl --break-system-packages 2>/dev/null || pip3 install pandas openpyxl --break-system-packages
```

## 1) 공식 목록 3종 다운로드
```bash
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
# 홍콩 전종목
curl -sL -A "$UA" -o /tmp/hk_list.xlsx "https://www.hkex.com.hk/eng/services/trading/securities/securitieslists/ListOfSecurities.xlsx"
# 후강퉁(상해) / 선강퉁(심천) Connect 대상
curl -sL -A "$UA" -o /tmp/sse.csv "https://www.hkex.com.hk/-/media/HKEX-Market/Mutual-Market/Stock-Connect/Eligible-Stocks/View-All-Eligible-Securities/SSE_Securities.csv"
curl -sL -A "$UA" -o /tmp/szse.csv "https://www.hkex.com.hk/-/media/HKEX-Market/Mutual-Market/Stock-Connect/Eligible-Stocks/View-All-Eligible-Securities/SZSE_Securities.csv"
for f in /tmp/hk_list.xlsx /tmp/sse.csv /tmp/szse.csv; do echo "== $f =="; file "$f"; ls -la "$f"; done
```
> 3개 중 하나라도 HTML/에러/수KB 미만이면 URL이 바뀐 것 → 아래 폴백으로 실제 링크 탐색 후 재다운로드:
```bash
# HK 목록 폴백
LINK=$(curl -sL -A "$UA" "https://www.hkex.com.hk/Services/Trading/Securities/Securities-Lists?sc_lang=en" | grep -oiE 'https?://[^"]*ListOfSecurities\.xlsx' | head -1)
echo "hk: $LINK"; [ -n "$LINK" ] && curl -sL -A "$UA" -o /tmp/hk_list.xlsx "$LINK"
# Connect 목록 폴백
BASE=$(curl -sL -A "$UA" "https://www.hkex.com.hk/Mutual-Market/Stock-Connect/Eligible-Stocks/View-All-Eligible-Securities?sc_lang=en" | grep -oiE 'https?://[^"]*S[SZ]SE_Securities\.csv')
echo "$BASE"
```

## 2) 파싱·분류·생성 스크립트
아래를 `/tmp/gen_cn.py`로 저장 후 실행. 결과 형식 = `[{ "sym": "0700.HK", "name": "...", "market": "hk|ss|sz|etf" }]`
```python
import pandas as pd, json, os, re
from collections import Counter

out, seen = [], set()

def add(sym, name, market):
    if not sym or sym in seen: return
    seen.add(sym); out.append({"sym": sym, "name": (name or sym).strip(), "market": market})

# ── 홍콩: ListOfSecurities.xlsx (헤더행 자동탐지) ──
raw = pd.read_excel("/tmp/hk_list.xlsx", header=None, dtype=str)
hdr = None
for i in range(min(12, len(raw))):
    cells = [str(x) for x in raw.iloc[i].tolist()]
    if any("Stock Code" in c for c in cells): hdr = i; break
assert hdr is not None, "HK header row not found"
hk = pd.read_excel("/tmp/hk_list.xlsx", header=hdr, dtype=str)
def col(df, *cands):
    for c in df.columns:
        for cand in cands:
            if cand.lower() in str(c).lower(): return c
    return None
c_code = col(hk, "Stock Code"); c_name = col(hk, "Name of Securities", "Name"); c_cat = col(hk, "Category")
assert c_code and c_name and c_cat, f"HK cols? {list(hk.columns)}"
for _, r in hk.iterrows():
    code = re.sub(r"\D", "", str(r[c_code]) or "")
    if not code: continue
    cat = str(r[c_cat] or "")
    if "Equity" in cat or "Real Estate Investment Trust" in cat: market = "hk"
    elif "Exchange Traded" in cat: market = "etf"
    else: continue  # 채권·워런트·牛熊證·구조화상품 제외
    add(code.zfill(4) + ".HK", str(r[c_name] or ""), market)

# ── 상해/심천 Connect CSV (헤더행·인코딩 자동) ──
def load_csv(path):
    for enc in ("utf-8-sig", "utf-8", "gbk", "big5"):
        try:
            raw = pd.read_csv(path, header=None, dtype=str, encoding=enc, on_bad_lines="skip")
            for i in range(min(12, len(raw))):
                cells = [str(x) for x in raw.iloc[i].tolist()]
                if any("Code" in c for c in cells):
                    return pd.read_csv(path, header=i, dtype=str, encoding=enc, on_bad_lines="skip")
        except Exception: continue
    return None

for path, suf, mk in [("/tmp/sse.csv", ".SS", "ss"), ("/tmp/szse.csv", ".SZ", "sz")]:
    df = load_csv(path)
    if df is None: print("WARN load fail", path); continue
    c_code = col(df, "SSE Stock Code", "SZSE Stock Code", "Stock Code", "Code")
    c_name = col(df, "Securities Name", "Name")
    if not c_code: print("WARN code col", path, list(df.columns)); continue
    for _, r in df.iterrows():
        code = re.sub(r"\D", "", str(r[c_code]) or "")
        if len(code) < 6: continue          # A주 코드 6자리
        add(code.zfill(6) + suf, str(r[c_name] or "") if c_name else "", mk)

by = Counter(x["market"] for x in out)
print("total:", len(out), "by_market:", dict(by))
assert len(out) >= 1500 and by.get("hk",0) >= 1000, f"too few — abort ({len(out)})"
with open("data/cn_symbols.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print("written data/cn_symbols.json")
```
실행:
```bash
cd ~/stock-terminal && python3 /tmp/gen_cn.py
```
> `total: 4000+ by_market: {'hk': 2xxx, 'ss': ~5xx~1xxx, 'sz': ~9xx~1xxx, 'etf': ~2xx}` 형태면 성공.
> **assert 실패(파싱 문제)면 중단 → `cp data/cn_symbols.json.bak data/cn_symbols.json` 복구 후 컬럼명/에러를 Cowork에 보고.**

---

## 3) 배선 3개

### 3-1) `lib/currency.ts` — HK·CN 통화
**찾을 것:**
```ts
  JP: { sym: '¥', pos: 'pre', frac: 0, locale: 'ja-JP' },
};
```
**바꿀 것:**
```ts
  JP: { sym: '¥', pos: 'pre', frac: 0, locale: 'ja-JP' },
  HK: { sym: 'HK$', pos: 'pre', frac: 2, locale: 'en-HK' },
  CN: { sym: '¥', pos: 'pre', frac: 2, locale: 'zh-CN' },
};
```

### 3-2) `lib/avatar.ts` (3곳)
**(a) 중화권 도메인맵.** 찾을 것:
```ts
  "8630.T": "sompo-hd.com",
};
```
**바꿀 것:**
```ts
  "8630.T": "sompo-hd.com",
};

// 중화권: 티커.HK/.SS/.SZ → 회사 도메인(주요 종목만, 없으면 아바타 폴백)
const CN_DOMAIN_MAP: Record<string, string> = {
  "0700.HK": "tencent.com", "9988.HK": "alibabagroup.com", "3690.HK": "meituan.com",
  "0941.HK": "chinamobileltd.com", "0005.HK": "hsbc.com", "1299.HK": "aia.com",
  "1810.HK": "mi.com", "1211.HK": "byd.com", "9618.HK": "jd.com",
  "9999.HK": "netease.com", "9888.HK": "baidu.com", "1024.HK": "kuaishou.com",
  "9866.HK": "nio.com", "0388.HK": "hkex.com.hk", "0981.HK": "smics.com",
  "2318.HK": "pingan.cn", "2020.HK": "anta.com", "0175.HK": "geely.com",
  "9626.HK": "bilibili.com", "9633.HK": "nongfuspring.com",
  "600519.SS": "moutaichina.com", "300750.SZ": "catl.com", "002594.SZ": "byd.com",
  "000333.SZ": "midea.com", "000651.SZ": "gree.com", "002415.SZ": "hikvision.com",
  "300059.SZ": "eastmoney.com", "600036.SS": "cmbchina.com", "601318.SS": "pingan.cn",
  "000063.SZ": "zte.com.cn", "002230.SZ": "iflytek.com",
};
```
**(b) logoUrl 분기.** 찾을 것:
```ts
  const jp = JP_DOMAIN_MAP[code];
  if (jp) {
    return LOGODEV_TOKEN
      ? `https://img.logo.dev/${jp}?token=${LOGODEV_TOKEN}&size=128&retina=true`
      : `https://www.google.com/s2/favicons?sz=128&domain=${jp}`;
  }
```
**바꿀 것:**
```ts
  const jp = JP_DOMAIN_MAP[code];
  if (jp) {
    return LOGODEV_TOKEN
      ? `https://img.logo.dev/${jp}?token=${LOGODEV_TOKEN}&size=128&retina=true`
      : `https://www.google.com/s2/favicons?sz=128&domain=${jp}`;
  }
  const cn = CN_DOMAIN_MAP[code];
  if (cn) {
    return LOGODEV_TOKEN
      ? `https://img.logo.dev/${cn}?token=${LOGODEV_TOKEN}&size=128&retina=true`
      : `https://www.google.com/s2/favicons?sz=128&domain=${cn}`;
  }
```
**(c) leverageInfo 중국어 용어.** 찾을 것:
```ts
  const inverse = /인버스|\bINVERSE\b|\bBEAR\b|インバース|ベア/.test(n);
  let mult: string | null = null;
  if (/\b3\s*X\b|3배|3倍/.test(n)) mult = "3x";
  else if (/\b2\s*X\b|2배|2倍|ダブル/.test(n)) mult = "2x";
  else if (/레버리지|\bLEVERAGE\b|\bBULL\b|レバレッジ|ブル/.test(n)) mult = "2x";
```
**바꿀 것:**
```ts
  const inverse = /인버스|\bINVERSE\b|\bBEAR\b|インバース|ベア|反向|看空/.test(n);
  let mult: string | null = null;
  if (/\b3\s*X\b|3배|3倍/.test(n)) mult = "3x";
  else if (/\b2\s*X\b|2배|2倍|ダブル|兩倍|二倍/.test(n)) mult = "2x";
  else if (/레버리지|\bLEVERAGE\b|\bBULL\b|レバレッジ|ブル|槓桿|看多/.test(n)) mult = "2x";
```

### 3-3) `components/toolbox/ToolboxClient.tsx` (2곳)
**(a) import.** 찾을 것:
```tsx
import JpMarketBoard from './JpMarketBoard';
```
**바꿀 것:**
```tsx
import JpMarketBoard from './JpMarketBoard';
import CnMarketBoard from './CnMarketBoard';
```
**(b) 플레이스홀더 → 보드.** 찾을 것:
```tsx
          ) : country === 'JP' ? (
            <JpMarketBoard isLoggedIn={isLoggedIn} />
          ) : (
            <Placeholder emoji="🇨🇳" title="중국·홍콩 종목보드 — 준비 중" desc="곧 제공됩니다" />
          )
```
**바꿀 것:**
```tsx
          ) : country === 'JP' ? (
            <JpMarketBoard isLoggedIn={isLoggedIn} />
          ) : (
            <CnMarketBoard isLoggedIn={isLoggedIn} />
          )
```

---

## 4) 프로덕션 크론 — `vercel.json`
`crons` 배열의 `jp-perf` 항목을 동일 schedule로 복제해 `/api/cron/cn-perf` 추가(없으면 `{ "path": "/api/cron/cn-perf", "schedule": "0 8 * * *" }` 한 줄).

## 5) 빌드 + 클린 재시작
```bash
npm run build
```
> 빌드 에러 시 중단·보고.
```bash
pkill -f "next dev"; rm -rf .next && npm run dev
```

## 6) 크론 시딩 (전종목 1주~6개월 — 야후 chart 호출, 수 분)
```bash
sleep 8
curl -s --max-time 600 -H "Authorization: Bearer $(grep -m1 CRON_SECRET .env.local | cut -d= -f2 | tr -d '\"')" http://localhost:3333/api/cron/cn-perf
```
> `{"ok":true,"computed":수천,...}` 나오면 성공.

## 7) 검증 (localhost:3333)
```bash
for m in hk ss sz etf; do
  echo -n "$m: "; curl -s "http://localhost:3333/api/yahoo/cn-list?market=$m" | python3 -c "import sys,json; d=json.load(sys.stdin).get('items',[]); print(len(d),'종목, r1w채움', sum(1 for x in d if x.get('r1w') is not None))"
done
```
- [ ] 🇨🇳 중국 → 종목·상품: **홍콩(수백~2천+) / 상해A / 심천A / ETF** 4개 서브탭, 각각 다수 종목.
- [ ] 홍콩=HK$, 상해·심천=¥(CNY). 현재가·1일·1년 라이브 + 1주~6개월(크론) 표시.
- [ ] 정렬·검색·페이지네이션·모바일 카드/바텀시트 = JP와 동일.

## 8) 커밋
```bash
rm -f data/cn_symbols.json.bak
git add data/cn_symbols.json lib/cnPerf.ts app/api/yahoo/cn-list/route.ts app/api/cron/cn-perf/route.ts components/toolbox/CnMarketBoard.tsx lib/currency.ts lib/avatar.ts components/toolbox/ToolboxClient.tsx vercel.json && git commit -m "feat(cn): 중국 종목보드 전종목 — HKEX 공식목록 + 후강퉁·선강퉁 A주 (현재가 라이브 + 1주~6개월 크론) (STEP 492)" && git push
```

## ⚠️ 노트
- 매매가능 기준: 홍콩 직접 + Stock Connect(후강퉁·선강퉁) 대상만 = 한국인이 실제 살 수 있는 전종목. B주·채권·워런트·牛熊證 제외.
- 종목명 = 공식목록 원문(홍콩=영문, A주=중문). 티커로 식별. 통화는 서브탭 자동.
- 이 목록은 정적 → 신규상장 반영은 이 STEP 재실행(주기적). 이후 크론화 검토.
