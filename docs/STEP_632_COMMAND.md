<!-- 2026-07-06 -->
# STEP 632 — VN "1일전" 0.00% 버그 픽스 (차트 기반 r1d)

> **버그**: 베트남 보드 '1일전'이 전 종목 +0.00%. 원인 = **야후가 VN 종목의 `regularMarketPrice`와 `regularMarketPreviousClose`를 똑같이 줌**(VIC 220300=220300) → quote의 `regularMarketChangePercent`=0. 야후 VN 커버리지 한계(일중 변동 미반영).
> **해결**: 크론(`vnPerf`)이 이미 야후 **차트**(일봉 종가·서로 다름)를 받으니 → **마지막 2일 종가로 1일 변동(r1d) 계산 → `vn_stock_perf.r1d` 저장 → vn-list가 그걸 '1일전'으로 표시**(quote의 0 무시). (VnDirect per-stock 387콜보다 가벼움 — 기존 크론 재사용.)
> **Cowork이 이미 함**: `vn_stock_perf`에 `r1d` 컬럼 추가(MCP)·마이그 036 갱신.
> **전제**: STEP 631(`2d89e94`) 이후.
> 🔴 실행: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

## 편집 (2파일)

### 1) `lib/vnPerf.ts` — PerfRow에 r1d 추가
```
찾기:
type PerfRow = { symbol: string; r1w: number | null; r1m: number | null; r3m: number | null; r6m: number | null };
바꾸기:
type PerfRow = { symbol: string; r1d: number | null; r1w: number | null; r1m: number | null; r3m: number | null; r6m: number | null };
```
```
찾기:
      return {
        symbol: sym,
        r1w: ret(closes, 5),
바꾸기:
      return {
        symbol: sym,
        r1d: ret(closes, 1),
        r1w: ret(closes, 5),
```

### 2) `app/api/yahoo/vn-list/route.ts` — 조인에 r1d 추가 + changePercent 오버라이드
```
찾기:
    type P = { symbol: string; r1w: number | null; r1m: number | null; r3m: number | null; r6m: number | null };
바꾸기:
    type P = { symbol: string; r1d: number | null; r1w: number | null; r1m: number | null; r3m: number | null; r6m: number | null };
```
```
찾기:
      const { data } = await sb.from("vn_stock_perf").select("symbol,r1w,r1m,r3m,r6m").range(from, from + 999);
바꾸기:
      const { data } = await sb.from("vn_stock_perf").select("symbol,r1d,r1w,r1m,r3m,r6m").range(from, from + 999);
```
```
찾기:
        if (p) { it.r1w = p.r1w; it.r1m = p.r1m; it.r3m = p.r3m; it.r6m = p.r6m; }
바꾸기:
        if (p) { it.r1w = p.r1w; it.r1m = p.r1m; it.r3m = p.r3m; it.r6m = p.r6m; if (p.r1d != null) it.changePercent = p.r1d; }
```

## 빌드 + r1d 채우기(크론 재실행) + 확인
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -8
```
```bash
cd ~/stock-terminal && (npm run dev >/tmp/vn632.log 2>&1 &) ; sleep 14
set -a; source .env.local 2>/dev/null; set +a
curl -s -H "authorization: Bearer $CRON_SECRET" "http://localhost:3333/api/cron/vn-perf" | head -c 150; echo
# r1d 채워졌나 확인 (0 아닌 값 나와야):
node -e "const {createClient}=require('@supabase/supabase-js');const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);(async()=>{const {data}=await sb.from('vn_stock_perf').select('symbol,r1d').in('symbol',['VIC.VN','VNM.VN','HPG.VN']);console.log(data);})();"
# 확인 후: pkill -f "next dev"
```
- [ ] r1d가 VIC/VNM/HPG에 0 아닌 값(예: -1.2, +0.8)으로 뜸.
- [ ] (선택) 베트남 탭 새로고침 → '1일전'이 더 이상 전부 0.00%가 아님.

## 커밋
```bash
cd ~/stock-terminal && git add lib/vnPerf.ts app/api/yahoo/vn-list/route.ts supabase/migrations/036_vn_stock_perf.sql docs/STEP_632_COMMAND.md && git commit -m "fix(vn): 보드 1일전 = 차트 기반 r1d (야후 VN quote가 price=prevClose로 0 주는 것 우회)" && git push
```

## ✅ 완료 시 → 다음 디테일 폴리시: ② VN·GB 로고 수집 → ③ 펜스 소수·VN 종목명 트림.
