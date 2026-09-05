<!-- 2026-07-09 -->
# STEP 671 — 🇻🇳 VN HNX(하노이) 추가 (299종목)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** STEP 670 이후. VN = HOSE 387만. 사용자 결정 = **HNX 추가**(완전성).
**목표:** HNX 상장 주식 299개(베트남어명 포함)를 VN 유니버스에 추가 → 보드에 노출.
**대상:** `data/vn_symbols.json` (+ `lib/vnPerf.ts` 주석) · 가격은 기존 파이프라인(크론)이 처리.
**준비됨:** `data/_hnx_add.json` = HNX 299종목(Cowork가 vnstock `symbols_by_exchange()`로 생성·`{sym:'XXX.VN', name:베트남어, market:'hnx'}`).

---

## 🔴 0단계 — Yahoo `.VN` HNX 커버리지 게이트 (추가 전 필수)
HNX 심볼이 야후 `.VN`로 가격이 잡혀야 크론이 계산함. **먼저 실측**:
```bash
node --input-type=module -e '
import YahooFinance from "yahoo-finance2";
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const test = ["SHS.VN","PVS.VN","CEO.VN","IDC.VN","CLH.VN","WSS.VN","DST.VN"]; // HNX 대표+신규
let ok=0;
for (const s of test) {
  try { const c = await yf.chart(s, { period1: new Date(Date.now()-60*864e5), interval:"1d" });
    const n=(c.quotes||[]).filter(q=>q.close>0).length; console.log(s, n>5?"OK("+n+")":"빈약("+n+")"); if(n>5)ok++; }
  catch(e){ console.log(s,"FAIL",e.message?.slice(0,40)); }
}
console.log("커버:", ok, "/", test.length);
'
```
**판정:**
- **대다수 OK** → 야후가 HNX 커버 → 1단계 진행(추가만 하면 크론이 자동 계산).
- **대부분 FAIL/빈약** → 야후가 HNX 미커버 → **STOP, Cowork 보고.** 대안 = VN 가격 소스를 vnstock으로 전환(더 큰 작업·별도 STEP). 무리해서 추가하지 말 것(가격 없이 유령 종목 됨).

## 1단계 — vn_symbols.json 병합 (게이트 통과 시)
```bash
python3 -c "
import json
cur=json.load(open('data/vn_symbols.json'))
add=json.load(open('data/_hnx_add.json'))
seen={s['sym'] for s in cur}
merged=cur+[a for a in add if a['sym'] not in seen]
json.dump(merged, open('data/vn_symbols.json','w'), ensure_ascii=False)
print('HOSE', sum(1 for s in merged if s.get('market')=='hose'), '+ HNX', sum(1 for s in merged if s.get('market')=='hnx'), '= 총', len(merged))
"
rm -f data/_hnx_add.json
```
- `lib/vnPerf.ts` 상단 주석 "HOSE+HNX ~654" → 실제 수치로 정정(HOSE 387 + HNX 299 ≈ 686).

## 2단계 — 크론 재실행(HNX 가격·수익률 채우기)
```bash
export CRON_SECRET=$(grep -E '^CRON_SECRET=' ~/stock-terminal/.env.local | cut -d= -f2- | tr -d '"')
# 로컬 rate-limit 우려 → 배포 후 prod 권장
curl -s -H "Authorization: Bearer $CRON_SECRET" "https://onetrillion.app/api/cron/vn-perf" | head -c 150; echo
```
> 배포(git push)로 vn_symbols가 prod에 올라간 뒤 크론 실행해야 HNX가 유니버스에 포함됨.

## 3단계 — 검증 → 커밋
```bash
npx tsc --noEmit
# vn-list에 HNX 종목 뜨는지(가격 有)
curl -s "https://onetrillion.app/api/yahoo/vn-list" | python3 -c "import sys,json;d=json.load(sys.stdin)['items'];print('VN 총',len(d))"
```
- HOSE 387 + HNX 신규가 합쳐진 수(가격 붙은 것만) 확인. 베트남어명 정상. 거래대금순 정렬.
```bash
git add data/vn_symbols.json lib/vnPerf.ts
git commit -m "feat(vn): HNX(하노이) 299종목 추가 — VN 유니버스 HOSE+HNX (Yahoo .VN 커버 확인 후)"
git push
```
> 순서: 병합→커밋→push→prod 배포→prod 크론 재실행→검증.

## Cowork에게 보고
1. **0단계 게이트 결과**(야후 HNX 커버 여부) — 이게 제일 중요.
2. 추가 후 VN 총 종목 수(가격 붙은 것) + HNX 베트남어명 정상.
→ 남은 완전성 결정: **HOSE도 서브셋(387 vs vnstock 686)·UPCOM 821** 추가 여부 + **#2 CN A주 ~1,600 확장** → 은태님 판단. 그 후 Round 2(Chrome 라이브)·Round 3(교차).
