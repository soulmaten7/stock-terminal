<!-- 2026-07-06 -->
# STEP 615 — CN R3 영어 폴백 재검증

> **배경**: STEP 614 CN 생성 → 전부 null. 원인: 야후가 중국 종목도 **영어명**("TENCENT")으로 반환 → zh-CN 구글뉴스에 영어명 검색 = 중국어 기사 0건.
> **수정**: news-brief에 **영어 폴백** — 로컬(ko/ja/zh) 뉴스가 0건이면 `${name} stock`로 영어 재검색(요약은 후처리가 한국어로 번역). 중국어 종목명 테이블(공수 큼)은 지금 안 함. 이 폴백은 전 국가 공통(로컬 실패 시 영어).
> **⚠️ 커밋 금지** — 재검증까지. Cowork MCP 검수 후 커밋(614~615 통합).
> **전제**: STEP 614 코드(미커밋) 위에.

## Cowork이 바꾼 것 (tsc EXIT=0)
- `app/api/news-brief/route.ts` — 로컬 뉴스 0건이면 영어(`${krName||jpName||cnName} stock`, en)로 재시도.

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -10
```

## 1) 🔴 CN 재생성 (캐시 비우고 · 이제 뉴스 나와야)
```bash
cd ~/stock-terminal && (npm run dev >/tmp/cn_r3b_dev.log 2>&1 &) ; sleep 14
set -a; source .env.local 2>/dev/null; set +a
D=$(date -u +%F)
echo "=== 텐센트(0700.HK) 3회 ==="
for i in 1 2 3; do
  node -e "const {createClient}=require('@supabase/supabase-js'); const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); sb.from('news_briefs').delete().eq('symbol','0700.HK').eq('as_of','$D').then(()=>process.exit(0)).catch(()=>process.exit(0));"
  echo "--- 0700.HK $i/3 ---"; curl -s "http://localhost:3333/api/news-brief?symbol=0700.HK" | head -c 800; echo; echo
done
echo "=== 알리바바(9988.HK)·귀주모태(600519.SS)·CATL(300750.SZ) ==="
for S in 9988.HK 600519.SS 300750.SZ; do
  node -e "const {createClient}=require('@supabase/supabase-js'); const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); sb.from('news_briefs').delete().eq('symbol','$S').eq('as_of','$D').then(()=>process.exit(0)).catch(()=>process.exit(0));"
  echo "--- $S ---"; curl -s "http://localhost:3333/api/news-brief?symbol=$S" | head -c 800; echo; echo
done
# 확인 후: pkill -f "next dev"
```
- [ ] 큰 종목(텐센트·알리바바·CATL)은 **한국어 요약 나옴**(영어 폴백→번역). 텐센트 3회 대체로 일관.
- [ ] 목표주가·밸류·전망·짜깁기·오래된 연도 없음. (귀주모태 등 커버 얇으면 null도 정상.)

## 2) 결과 붙여넣기 → Cowork MCP 검수 → 통과면 614~615 통합 커밋
- **여기서 멈춤(커밋 X).**

## ✅ 통과 시: 중국 R3 완성. 국가별 AI: US·KR 완전체 / JP·CN=R3.
