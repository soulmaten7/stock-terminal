<!-- 2026-07-01 -->
# STEP 493 — A주(상해·심천) 1주~6개월 수익률 채우기 (東方財富 kline, Yahoo 차단 대체)

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_493_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
STEP 492 결과: A주(.SS/.SZ)는 Yahoo가 과거시세(chart)를 400으로 막아 1주~6개월이 "—". → **A주만 東方財富(Eastmoney) 무료 kline으로 대체**해 홍콩처럼 채운다.
- **`lib/cnPerf.ts`는 Cowork이 이미 수정함**(홍콩=Yahoo 유지, .SS/.SZ=東方財富 분기 추가). 이 STEP = **API 실제 응답 검증 → 재빌드 → 크론 재시딩 → 커밋**.
- ⚠️ 東方財富가 로컬에서 안 열리면(응답 없음) 중단하고 Cowork에 보고(텐센트/시나 폴백으로 전환).

---

## 1) 東方財富 API 실제 응답 검증 (먼저!)
```bash
echo "== 상해 600519(茅台) =="
curl -s -A "Mozilla/5.0" -e "https://quote.eastmoney.com/" "https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=1.600519&fields1=f1&fields2=f51,f53&klt=101&fqt=1&end=20500101&lmt=5" | head -c 400
echo; echo "== 심천 000001(平安銀行) =="
curl -s -A "Mozilla/5.0" -e "https://quote.eastmoney.com/" "https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=0.000001&fields1=f1&fields2=f51,f53&klt=101&fqt=1&end=20500101&lmt=5" | head -c 400
echo
```
> **판단**: 두 응답 모두 `"klines":["2026-..-..,숫자", ...]` 배열이 있으면 성공 → 2단계로.
> `klines`가 비었거나(`[]`) 응답이 없으면 → **중단**. `data/cn_symbols.json`·코드는 그대로 두고 Cowork에 "東方財富 응답 실패(로컬)" 보고. (내가 텐센트 `web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=sh600519,day,,,180,qfq` 폴백 STEP으로 바꿔줌.)

## 2) 재빌드 + 클린 재시작
```bash
npm run build
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev
```

## 3) 크론 재시딩 (A주 포함 전종목 — 東方財富 호출 추가되어 수 분)
```bash
sleep 8
curl -s --max-time 900 -H "Authorization: Bearer $(grep -m1 CRON_SECRET .env.local | cut -d= -f2 | tr -d '\"')" http://localhost:3333/api/cron/cn-perf
```
> `{"ok":true,"computed":수천,...}` — 이전(2,821)보다 크게 늘어야 함(A주 대부분 채워짐).

## 4) 검증 (localhost:3333)
```bash
for m in hk ss sz etf; do
  echo -n "$m: "; curl -s "http://localhost:3333/api/yahoo/cn-list?market=$m" | python3 -c "import sys,json; d=json.load(sys.stdin).get('items',[]); print(len(d),'종목, r1w채움', sum(1 for x in d if x.get('r1w') is not None))"
done
```
- [ ] **상해(ss)·심천(sz) r1w채움이 0 → 대부분**으로 증가(이게 핵심).
- [ ] 홍콩(hk)·ETF는 기존대로 유지(회귀 없음).
- [ ] 🇨🇳 상해A·심천A 탭에서 종목 클릭 → 1주~6개월 값 표시(더 이상 "—" 아님).

## 5) 커밋
```bash
git add lib/cnPerf.ts && git commit -m "fix(cn): A주(상해·심천) 1주~6개월을 東方財富 kline으로 — Yahoo A주 chart 차단 대체 (STEP 493)" && git push
```

## ⚠️ 노트
- 홍콩·ETF = Yahoo chart 유지(정상). A주만 東方財富(secid 1.=상해 / 0.=심천).
- A주 1년(r1y)은 여전히 quote 기반(있으면 표시). 이 STEP은 1주~6개월 대상.
- 東方財富 kline은 전복권(fqt=1) 종가 — 수익률 계산용으로 적합.
- 프로덕션 크론(Vercel)에서 東方財富 접근이 막히면 daily 갱신만 실패(로컬 시딩분은 DB에 유지). 필요 시 프록시/대체소스 추후.
