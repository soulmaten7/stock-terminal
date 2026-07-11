<!-- 2026-07-09 -->
# STEP 672D — 🇻🇳 VN Yahoo HOSE 403 복구 (VCI 롤백)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** 672C 후 VN 보드 **빈 상태**(VCI가 Vercel·GH Actions 클라우드 IP 지속요청 차단). 즉시 복구 필요.
**목표:** VN을 **Yahoo HOSE(403·야후 커버)로 복구** → 보드 즉시 정상. HNX는 "VCI 클라우드 IP 차단" 사유로 보류(문서화).
**대상:** `data/vn_symbols.json`(702→HOSE 403) · `vercel.json`(vn-perf 크론 복원) · `scripts/vn_perf_cron.mjs`·`.github/workflows/vn_perf.yml` 삭제. `lib/vnPerf.ts`는 **Yahoo 그대로**(672C가 안 건드림) — 변경 없음.

> 배경: 로컬 맥만 VCI 됨(거주지 IP). Vercel·GH Actions(Azure) = 지속요청 시 `[]`. 소형 시장에 거주지-IP 인프라(VPS/프록시)는 후순위 → Yahoo HOSE로 복구.

---

## 1. vn_symbols.json → HOSE 403만
```bash
python3 -c "
import json
d=json.load(open('data/vn_symbols.json'))
hose=[s for s in d if s.get('market')=='hose']
json.dump(hose, open('data/vn_symbols.json','w'), ensure_ascii=False)
print('HOSE', len(hose))
"
```
> 현재 702(HOSE403+HNX299)에서 HOSE만 남김 → 403. (Yahoo `.VN`가 HOSE 커버.)

## 2. vercel.json — vn-perf 크론 복원
`crons` 배열에 다시 추가(672C가 제거했음):
```json
{ "path": "/api/cron/vn-perf", "schedule": "0 8 * * *" }
```
> `lib/vnPerf.ts`(Yahoo yf.chart·400일 룩백·price/amount/r1y 저장)는 그대로라 이 크론이 HOSE 403을 채움.

## 3. VCI/GH Actions 잔재 제거
```bash
git rm scripts/vn_perf_cron.mjs .github/workflows/vn_perf.yml
```
> (원하면 `scripts/vn_perf_cron.mjs`는 "로컬 맥/VPS용"으로 보존 가능 — 하지만 지금은 정리 권장. VCI 요청 형태는 플레이북에 기록됨.)

## 4. 커밋 → 배포 → prod 크론 재실행 → 검증
```bash
npx tsc --noEmit
git add data/vn_symbols.json vercel.json
git commit -m "revert(vn): VCI→Yahoo HOSE 403 복구 — VCI가 클라우드 IP(Vercel·GH Actions) 지속요청 차단. HNX는 거주지-IP 인프라 필요로 보류"
git push
# 배포 후 prod 크론(Yahoo는 Vercel서 정상)
export CRON_SECRET=$(...)   # (앞서 쓰던 값·Vercel 등록값과 동일)
curl -s -H "Authorization: Bearer $CRON_SECRET" "https://onetrillion.app/api/cron/vn-perf" | head -c 150; echo
# 검증
curl -s "https://onetrillion.app/api/yahoo/vn-list" | python3 -c "import sys,json;d=json.load(sys.stdin)['items'];print('VN',len(d),'| 상위3',[(x['symbol'],x['price']) for x in d[:3]])"
```
- VN ≈ 400 종목(HOSE)·가격 정상·베트남어명·거래대금순. **보드 복구 확인.**

## Cowork에게 보고
- VN 보드 복구(종목 수·가격 정상).
→ HNX 보류 사유는 플레이북 §8-11에 정정 기록됨(GH Actions도 VCI 미통과·거주지 IP 필요). VN 완전성은 **HOSE 403**으로 확정. 남은 검수 = **CN #2(소형주 ~1,600)** — 이건 cninfo가 공식이라 IP차단 없이 될 가능성 → 확인 후 · Round 2(Chrome 라이브)·Round 3.
