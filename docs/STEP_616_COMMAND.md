<!-- 2026-07-06 -->
# STEP 616 — JP R3 "진짜 일본어 검색" (JPX 일본어명) + CN R3 라이브 재검증

> **배경**: "국가확장 속도보다 제대로가 먼저" → 일본으로 회귀. 야후가 JP·CN 종목을 영어명으로 줘서, ja/zh 검색이 실은 영어 검색이던 문제.
> **JP 해결(제대로)**: **JPX 東証上場銘柄一覧(data_j.xls) → `jp_names` 테이블(4,014종목·일본어 銘柄名)** 시드 → 라우트가 **일본어명("トヨタ自動車")으로 ja 검색** → 진짜 일본 기사. 야후 영어명은 폴백.
> **CN**: 지금은 영어 폴백 유지(중국어명=东方財富는 다음 "제대로" 차례). 
> **Cowork이 이미 한 것**: `jp_names` 마이그레이션(MCP)·시드 실행(4,014행)·`npm i -D xlsx`·데이터 검증(トヨタ自動車 등)·tsc EXIT=0. → **이 STEP은 라이브 재생성 확인 + 커밋만.**
> **⚠️ 커밋은 눈검수 후** — 아래 1) 출력 붙여주면 Cowork MCP 재확인 후 커밋 명령(2).
> **전제**: STEP 613(`db7f77d`) 이후. (STEP 614·615 CN 코드 + 이번 JP 네이티브가 미커밋 상태로 함께 감.)

## Cowork이 바꾼 파일 (커밋 대상)
- 신규: `lib/jpName.ts`(getJpName·jp_names 조회) · `scripts/seed_jp_names.ts`(JPX 시드) · `package.json`/`package-lock.json`(xlsx devDep)
- 수정: `app/api/news-brief/route.ts`(JP=일본어명 우선·CN 분기·영어 폴백) · `lib/stockNews.ts`(ja·zh 로케일·60일 최근성)

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -10
```
(xlsx 미설치 에러 뜨면 `npm i -D xlsx` 후 재빌드 — 보통 이미 설치됨.)

## 1) 🔴 JP 재생성 — 이제 일본 기사 기반이어야 (캐시 비우고 도요타 3회 + 소니·소프트뱅크·닌텐도)
```bash
cd ~/stock-terminal && (npm run dev >/tmp/jp_native_dev.log 2>&1 &) ; sleep 14
set -a; source .env.local 2>/dev/null; set +a
D=$(date -u +%F)
for i in 1 2 3; do
  node -e "const {createClient}=require('@supabase/supabase-js'); const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); sb.from('news_briefs').delete().eq('symbol','7203.T').eq('as_of','$D').then(()=>process.exit(0)).catch(()=>process.exit(0));"
  echo "--- 도요타 7203.T $i/3 ---"; curl -s "http://localhost:3333/api/news-brief?symbol=7203.T" | head -c 800; echo; echo
done
for S in 6758.T 9984.T 7974.T; do
  node -e "const {createClient}=require('@supabase/supabase-js'); const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); sb.from('news_briefs').delete().eq('symbol','$S').eq('as_of','$D').then(()=>process.exit(0)).catch(()=>process.exit(0));"
  echo "--- $S ---"; curl -s "http://localhost:3333/api/news-brief?symbol=$S" | head -c 800; echo; echo
done
# 확인 후: pkill -f "next dev"
```
- [ ] 요약 한국어·구체 사건. 도요타가 **일본 내 사건**(일본 시장 뉴스) 중심으로 바뀌었는지(이전 영어=미국 조립라인 위주였음 → 이제 일본 기사 반영).
- [ ] 목표주가·밸류·전망·짜깁기·오래된 연도 없음.

## 2) 결과 붙여넣기 → Cowork MCP 재확인 → 통과면 커밋 명령
- **여기서 멈춤(커밋 X).**

## ✅ 통과 시: JP = 진짜 일본어 네이티브 뉴스 검색(제대로). "속도보다 제대로" 첫 적용. 다음 = CN 네이티브(东方財富 중국어명).
