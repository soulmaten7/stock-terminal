<!-- 2026-07-06 -->
# STEP 618 — CN "진짜 중국어 검색" (A주 시드 실행 + 라이브 검증)

> **배경**: JP처럼 "제대로". 야후가 CN을 영어명으로 줘서 zh 검색이 실은 영어였음.
> **해결**: `cn_names` 테이블 — **HK(.HK)=HKEX 번체목록(繁體, zh-HK 검색)** / **A주(.SS·.SZ)=東方財富 kline `data.name`(简体, zh-CN 검색)**. 없으면 야후 영어 폴백.
> **Cowork이 이미 한 것**: `cn_names` 마이그(MCP) · **HK 3,227행 시드+검증**(騰訊控股·阿里巴巴－Ｗ·匯豐控股…) · HK zh-HK 검색 실측(진짜 홍콩 기사 확인) · 라우트/로케일 배선 · tsc EXIT=0.
> **이 STEP에서 Claude Code가 할 일**: 샌드박스가 못 뚫는 **東方財富(A주)**를 유저 머신(KR·도달됨)에서 시드 + 라이브 재생성. **커밋은 눈검수 후**(아래 5).
> **전제**: STEP 617(`f1ff19a`) 이후. (커밋 안 된 CN 코드: `scripts/seed_cn_names.ts` `lib/cnName.ts` `lib/stockNews.ts` `app/api/news-brief/route.ts` `supabase/migrations/034_cn_names.sql`.)

## 0) 잔여 임시파일 삭제 + 빌드
```bash
cd ~/stock-terminal && rm -f _t_cn.ts && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -10
```
(xlsx 미설치 에러면 `npm i -D xlsx` 후 재빌드 — 보통 이미 설치됨.)

## 1) 🔴 東方財富 도달·필드 프로브 (전체 시드 전 5초 확인 — 貴州茅台 나와야)
```bash
curl -s --max-time 10 "https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=1.600519&fields1=f1,f2&fields2=f51&klt=101&fqt=1&end=20500101&lmt=1" | grep -o '"name":"[^"]*"'
```
- [ ] `"name":"贵州茅台"` 같은 **중국어명** 출력되면 도달 OK → 2)로.
- [ ] 빈 출력/에러면 이 머신에서 東方財富 미도달 → **여기서 멈추고 알려줘**(HK는 이미 완성, A주만 별도 대응).

## 2) 전체 시드 실행 (A주 채움 · HK는 재upsert·무해 · 약 8~12분)
```bash
cd ~/stock-terminal && set -a; source .env.local; set +a; npx tsx scripts/seed_cn_names.ts
```
- 기대 로그: `HK: 3227/3230 매핑` · `A주: 3700~3868/3868 매핑` · `총 ~6900행 upsert 완료`.

## 3) cn_names 검증 (개수 + A주 스팟체크 — 간체명 확인)
```bash
cd ~/stock-terminal && set -a; source .env.local; set +a; node -e "
const {createClient}=require('@supabase/supabase-js');
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
(async()=>{
 const {count}=await sb.from('cn_names').select('*',{count:'exact',head:true});
 console.log('총행:',count);
 for(const s of ['600519.SS','000001.SZ','300750.SZ','601398.SS','000858.SZ']){
   const {data}=await sb.from('cn_names').select('name_zh,market').eq('sym',s).maybeSingle();
   console.log(s,'→',data?data.name_zh+' ('+data.market+')':'❌없음');
 }
})();"
```
- [ ] 600519.SS=贵州茅台, 000001.SZ=平安银行, 300750.SZ=宁德时代 류로 나오면 OK.

## 4) 🔴 CN 브리핑 라이브 재생성 (진짜 중국 기사 기반이어야 — 캐시 비우고 4종목)
```bash
cd ~/stock-terminal && (npm run dev >/tmp/cn_native_dev.log 2>&1 &) ; sleep 14
set -a; source .env.local 2>/dev/null; set +a
D=$(date -u +%F)
for S in 600519.SS 300750.SZ 0700.HK 000001.SZ; do
  node -e "const {createClient}=require('@supabase/supabase-js'); const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); sb.from('news_briefs').delete().eq('symbol','$S').eq('as_of','$D').then(()=>process.exit(0)).catch(()=>process.exit(0));"
  echo "--- $S ---"; curl -s "http://localhost:3333/api/news-brief?symbol=$S" | head -c 700; echo; echo
done
# 확인 후: pkill -f "next dev"
```
- [ ] summary 한국어·구체 사건. A주=중국 본토 뉴스, HK=홍콩 뉴스 기반인지. 목표주가·밸류·전망·짜깁기·오래된 연도 없음.

## 5) 결과 붙여넣기 → Cowork MCP 재확인 → 통과면 커밋 명령
- **여기서 멈춤(커밋 X).** 1)·3)·4) 출력 붙여주면 Cowork이 cn_names 실측 후 STEP 619(커밋) 발행.

## ✅ 통과 시: CN = 진짜 중국어 네이티브(HK 번체+A주 간체) 검색 완성. JP·CN 둘 다 "제대로". 다음 = 국가별 AI 완성 검수 / 베트남 탭.
