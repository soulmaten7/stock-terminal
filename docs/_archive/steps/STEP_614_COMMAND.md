<!-- 2026-07-06 -->
# STEP 614 — 중국탭 R3(뉴스) 확장 · 중국어(zh) 로케일

> **목표**: R3 뉴스를 CN에도. CN(.HK/.SS/.SZ)이면 야후 종목명 + **중국어 로케일(zh-CN) 구글뉴스** → 요약 후처리(한국어 번역·60일 최근성)가 언어·오래된 기사 자동 처리. JP와 동일 패턴, 2파일만.
> **범위**: CN도 **R3(뉴스)까지**(JP와 동일 — 무료 실시간 공시 소스 없음, 뉴스로 대체). R1·R2 공시 미착수.
> **⚠️ 커밋 금지** — 빌드+생성+눈검수. Cowork MCP 검수 후 커밋.
> **전제**: STEP 613(`db7f77d`) 이후.

## Cowork이 바꾼 것 (tsc EXIT=0)
- `lib/stockNews.ts` — locale에 `'zh'` 추가(`hl=zh-CN&gl=CN&ceid=CN:zh-Hans`).
- `app/api/news-brief/route.ts` — CN(.HK/.SS/.SZ)이면 야후 종목명 + zh 뉴스로 분기(KR·JP·US는 그대로). 후처리(번역·최근성)는 공통 적용.

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -10
```

## 1) 🔴 CN 뉴스 생성 — 홍콩·상해·심천 각 1 (+텐센트 3회 일관성)
```bash
cd ~/stock-terminal && (npm run dev >/tmp/cn_r3_dev.log 2>&1 &) ; sleep 14
set -a; source .env.local 2>/dev/null; set +a
D=$(date -u +%F)
echo "=== 텐센트(0700.HK) 3회 (캐시 비우고) ==="
for i in 1 2 3; do
  node -e "const {createClient}=require('@supabase/supabase-js'); const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); sb.from('news_briefs').delete().eq('symbol','0700.HK').eq('as_of','$D').then(()=>process.exit(0)).catch(()=>process.exit(0));"
  echo "--- 0700.HK $i/3 ---"; curl -s "http://localhost:3333/api/news-brief?symbol=0700.HK" | head -c 800; echo; echo
done
echo "=== 귀주모태(600519.SS·상해)·CATL(300750.SZ·심천) 1회씩 ==="
for S in 600519.SS 300750.SZ; do
  echo "--- $S ---"; curl -s "http://localhost:3333/api/news-brief?symbol=$S" | head -c 800; echo; echo
done
# 확인 후: pkill -f "next dev"
```
- [ ] 요약 **한국어**(중국 뉴스를 한국어로), 구체 사건만. 사건 없으면 null.
- [ ] 목표주가·밸류·전망·짜깁기·오래된 연도 없음. 텐센트 3회 대체로 일관.

## 2) 눈검수 — CN 종목 페이지
```bash
cd ~/stock-terminal && open "http://localhost:3333/stock/0700.HK"
```
- [ ] `StockNewsBrief(R3)`가 한국어 중국 뉴스로(또는 사건 없으면 숨김).

## 3) 결과 붙여넣기 → Cowork MCP 검수 대기
- 텐센트 3회 + 귀주모태·CATL 출력 붙여넣기. Cowork가 news_briefs CN 행 확인 후 커밋 STEP.
- **여기서 멈춤(커밋 X).**

## ✅ 통과 시: 중국 R3(뉴스) 완성 → 국가별 AI: US·KR 완전체 / JP·CN = R3. 국가 커버 사실상 완성(추가 여지=베트남 정도).
