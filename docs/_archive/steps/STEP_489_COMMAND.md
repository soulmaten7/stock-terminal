<!-- 2026-07-01 -->
# STEP 489 — 일본 전종목 확충: JPX 공식 상장목록 → jp_symbols.json (72 → ~3,900+)

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_489_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
일본을 한국처럼 **전 종목**으로. JPX가 공개하는 「東証上場銘柄一覧」(`data_j.xls`)를 Claude Code가 로컬에서 다운로드·파싱 → `data/jp_symbols.json`을 **주식·ETF·REIT 전체**(~3,900+)로 재생성.
- **코드 변경 없음** — 심볼 목록(JSON)만 교체. 라우트·크론은 이미 전 타입 처리(STEP 486). 파일이 커지므로 클린 재시작 + 크론 재시딩만.
- ⚠️ 실패해도 기존 jp_symbols.json 백업본으로 복구 가능(1단계에서 백업).

---

## 1) 기존 파일 백업
```bash
cd ~/stock-terminal
cp data/jp_symbols.json data/jp_symbols.json.bak
```

## 2) JPX 공식 상장목록 다운로드
```bash
# 직접 URL 시도
curl -sL -A "Mozilla/5.0" -o /tmp/data_j.xls "https://www.jpx.co.jp/markets/statistics-equities/misc/tvdivq0000001vg2-att/data_j.xls"
file /tmp/data_j.xls; ls -la /tmp/data_j.xls
```
> 위 파일이 HTML/에러거나 크기가 작으면(수십 KB 미만) 링크가 바뀐 것 → 아래 폴백으로 실제 링크를 찾아 재다운로드:
```bash
LINK=$(curl -sL -A "Mozilla/5.0" "https://www.jpx.co.jp/markets/statistics-equities/misc/01.html" | grep -oE '/markets/statistics-equities/misc/[^"]*data_j\.xls' | head -1)
echo "found: $LINK"
curl -sL -A "Mozilla/5.0" -o /tmp/data_j.xls "https://www.jpx.co.jp${LINK}"
file /tmp/data_j.xls; ls -la /tmp/data_j.xls
```

## 3) 파싱 라이브러리 설치
```bash
pip install pandas xlrd openpyxl --break-system-packages 2>/dev/null || pip3 install pandas xlrd openpyxl --break-system-packages
```

## 4) 파싱·분류·생성 스크립트
아래를 `/tmp/gen_jp.py`로 저장 후 실행:
```python
import pandas as pd, json, os, sys
from collections import Counter

SRC = "/tmp/data_j.xls"
# .xls → xlrd, .xlsx → openpyxl. 자동 감지 실패 시 엔진 지정 재시도.
try:
    df = pd.read_excel(SRC, dtype=str)
except Exception:
    try:
        df = pd.read_excel(SRC, dtype=str, engine="xlrd")
    except Exception:
        df = pd.read_excel(SRC, dtype=str, engine="openpyxl")

def col(*cands):
    for c in df.columns:
        for cand in cands:
            if cand in str(c):
                return c
    return None

c_code = col("コード")
c_name = col("銘柄名")
c_seg  = col("市場・商品区分", "区分")
assert c_code and c_name and c_seg, f"columns not found: {list(df.columns)}"

def classify(s):
    s = str(s)
    if "ETF" in s or "ETN" in s: return "etf"
    if "REIT" in s or "ファンド" in s: return "reit"   # REIT·인프라·벤처·컨트리 펀드
    if "株式" in s: return "stock"                      # 프라임/스탠다드/그로스/외국주식/PRO
    return None

out, seen = [], set()
for _, r in df.iterrows():
    code = str(r[c_code]).strip()
    if code.endswith(".0"): code = code[:-2]
    name = str(r[c_name]).strip()
    typ = classify(r[c_seg])
    if not typ or not code or code.lower() == "nan" or code in seen:
        continue
    seen.add(code)
    out.append({"sym": code + ".T", "name": name, "type": typ})

os.makedirs("data", exist_ok=True)
with open("data/jp_symbols.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)

print("total:", len(out), "by_type:", dict(Counter(x["type"] for x in out)))
```
실행:
```bash
cd ~/stock-terminal && python3 /tmp/gen_jp.py
```
> 결과가 `total: 3900+ by_type: {'stock': 38xx, 'etf': 3xx, 'reit': 5x}` 형태면 성공. **stock이 3,000 미만이거나 파싱 에러면 중단하고 백업 복구**: `cp data/jp_symbols.json.bak data/jp_symbols.json` 후 Cowork에게 컬럼명/에러 알림.

## 5) 빌드 + 클린 재시작
```bash
npm run build
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev
```

## 6) 크론 재시딩 (전종목 perf — 야후 호출 많아 2~4분 소요)
```bash
curl -s --max-time 300 -H "Authorization: Bearer $(grep -m1 CRON_SECRET .env.local | cut -d= -f2 | tr -d '\"')" http://localhost:3333/api/cron/jp-perf
```
> `computed`가 수천으로 나오면 성공(야후에 데이터 없는 종목은 자동 스킵되어 실제 표시 수는 그보다 적을 수 있음 — 정상).

## 7) 검증 (localhost:3333)
```bash
# 타입별 개수 확인
for t in stock etf reit; do
  echo -n "$t: "; curl -s "http://localhost:3333/api/yahoo/jp-list?type=$t" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('items',[])))"
done
```
- [ ] 🇯🇵 일본 종목 탭: 수천 종목(도요타~중소형까지) 검색·정렬·페이지네이션 정상.
- [ ] ETF/리츠 탭도 전체(레버리지·인버스 포함) 표시, 배지 정상.
- [ ] 종목명 = JPX 공식 일본어명, 티커로 식별.

## 8) 커밋
```bash
rm -f data/jp_symbols.json.bak
git add data/jp_symbols.json && git commit -m "feat(jp): 일본 전종목 확충 — JPX 공식 상장목록으로 주식·ETF·REIT 전체(72→~3,900+) (STEP 489)" && git push
```

## ⚠️ 노트
- JPX 목록은 코드·명칭·시장구분만 있음 → 시세/수익률은 기존대로 Yahoo(`.T`) + jp_stock_perf 크론이 채움.
- 야후가 없는 소형·신규 코드는 표시에서 자동 제외(price>0 필터). 데이터 있는 것만 노출.
- 이후: 미국 ETF/리츠도 "전체"로 확대할지 별도 판단(현재 미국 주식 ~6,081은 거의 전부, ETF 75/REIT 27은 상위 큐레이션).
- 이 목록은 정적이라 신규 상장 반영하려면 주기적으로 이 STEP 재실행(또는 나중에 크론화).
