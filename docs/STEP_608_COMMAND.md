<!-- 2026-07-06 -->
# STEP 608 — R3 수정 재검증: summary 한국어 강제 + 60일 최근성 필터

> **배경**: STEP 607 JP 생성 후 Cowork MCP 검수 → 도요타 요약이 **영어로 출력**(야후가 영어 상호 반환 → 영어 기사 → LLM이 영어로 씀), 소프트뱅크가 **2023년 3분기(오래된 기사)**를 최근 뉴스로 표시. 둘 다 신뢰 훼손 → 수정.
> **수정 2개**: ① news-brief 프롬프트에 "summary 반드시 한국어(영어·일본어 헤드라인도 한국어로)" ② `fetchStockNews`에 **pubDate 60일 최근성 필터**(오래된 기사 스킵, 전 국가 공통).
> **⚠️ 커밋 금지** — 재생성+확인까지. **Cowork MCP 검수 후** 커밋(STEP 607+608 통합).
> **전제**: STEP 607 코드(미커밋) 위에.

## Cowork이 바꾼 것 (tsc EXIT=0)
- `app/api/news-brief/route.ts` — SYSTEM에 "summary 반드시 한국어" 추가.
- `lib/stockNews.ts` — pubDate 파싱해 60일 넘은 기사 스킵.

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -10
```

## 1) 🔴 JP 재생성 — 캐시 비우고 (도요타 3회 + 소니·소프트뱅크)
```bash
cd ~/stock-terminal && (npm run dev >/tmp/jp_r3b_dev.log 2>&1 &) ; sleep 14
set -a; source .env.local 2>/dev/null; set +a
D=$(date -u +%F)
echo "=== 도요타(7203.T) 3회 — 한국어로 나와야 ==="
for i in 1 2 3; do
  node -e "const {createClient}=require('@supabase/supabase-js'); const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); sb.from('news_briefs').delete().eq('symbol','7203.T').eq('as_of','$D').then(()=>process.exit(0)).catch(()=>process.exit(0));"
  echo "--- 7203.T $i/3 ---"; curl -s "http://localhost:3333/api/news-brief?symbol=7203.T" | head -c 800; echo; echo
done
echo "=== 소니(6758.T)·소프트뱅크(9984.T) 재생성 (소프트뱅크는 2023 사라져야) ==="
for S in 6758.T 9984.T; do
  node -e "const {createClient}=require('@supabase/supabase-js'); const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); sb.from('news_briefs').delete().eq('symbol','$S').eq('as_of','$D').then(()=>process.exit(0)).catch(()=>process.exit(0));"
  echo "--- $S ---"; curl -s "http://localhost:3333/api/news-brief?symbol=$S" | head -c 800; echo; echo
done
# 확인 후: pkill -f "next dev"
```
- [ ] 도요타 3회 모두 **한국어** 요약(영어 X). 3회 대체로 일관.
- [ ] 소프트뱅크에 **2023년 등 1년 이상 지난 분기 언급 없음**(최근 사건만).
- [ ] 셋 다 목표주가·밸류·전망·짜깁기 없음. 사건 없으면 null.

## 2) 결과 붙여넣기 → Cowork MCP 검수 대기
- 도요타 3회 + 소니·소프트뱅크 출력을 붙여넣기. **Cowork가 news_briefs 최종 행 재확인**(한국어·최근성·무밸류·무전망) 후, 통과면 **STEP 607+608 통합 커밋** 명령.
- **여기서 멈춤(커밋 X).**

## ✅ 통과 시: 일본 R3(뉴스) 완성 + 뉴스 최근성 필터는 전 국가 개선.
