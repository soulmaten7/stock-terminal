<!-- 2026-07-06 -->
# STEP 595B — dart_corp_codes 시드 → KR 공시 층 재검증 + 커밋

> **왜**: STEP 595 검증에서 `dart_corp_codes` 테이블이 **행 0개**(KR 티커→고유번호 매핑 미시드) → `getDartCorpCode`가 null → 공시 빈 배열. **코드는 정상, 데이터만 없음.** 이 STEP = 시드 채우고 재검증 후 커밋.
> **전제**: STEP 594(`8f57512`) 이후 + STEP 595 코드(Cowork 작성·미커밋).

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_595B_COMMAND.md 파일 내용대로 실행해줘
```

## Cowork이 이미 한 것
- STEP 595 코드(`lib/dartEvents.ts`·`app/api/kr-events/route.ts`·`page.tsx` KrEventLayer·isKR) — tsc EXIT=0.
- **신규 `scripts/seed_dart_corp_codes.ts`** — DART `corpCode.xml`(전체 법인코드 zip) → 상장사(6자리 stock_code)만 추출 → `dart_corp_codes` 채움(delete+insert·idempotent). `fflate`로 압축 해제.

## 0) fflate 설치
```bash
cd ~/stock-terminal && npm install fflate
```

## 1) 🔴 시드 실행 (DART 법인코드 → 테이블)
```bash
cd ~/stock-terminal && set -a; source .env.local; set +a; npx tsx scripts/seed_dart_corp_codes.ts
```
- [ ] `삼성전자(005930): { corp_code: '00126380', ... }` + `총 3000~4000행. 완료.` 나옴.
- ⚠️ `상장사 수가 비정상`/`xml 없음` → DART 키 문제(응답이 xml 아님) → `.env.local`의 `DART_API_KEY` 확인 후 Cowork에 공유.
- (env가 `source`로 안 실리면: `node --env-file=.env.local` 방식이나 export로 수동 로드.)

## 2) 🔴 KR 공시 재검증 (이제 나와야 함)
```bash
cd ~/stock-terminal && (npm run dev >/tmp/kr2dev.log 2>&1 &) ; sleep 15
node -e '(async()=>{for(const sym of ["005930","000660","035420"]){try{const s=await (await fetch("http://localhost:3333/api/kr-events?symbol="+sym)).json();console.log(sym,":",JSON.stringify(s).slice(0,500));if((s.events||[]).length)return;}catch(e){console.log(sym,"err",String(e));}}})();'
# 확인 후: pkill -f "next dev"
```
- [ ] 이제 `events:[{date,report_nm,url}]` **채워짐**(삼성/SK하이닉스/NAVER 중 하나 이상). report_nm=한국어 공시명·url=DART.

## 3) 빌드 + 커밋
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS" | head -5
cd ~/stock-terminal && git add lib/dartEvents.ts "app/api/kr-events/route.ts" "app/stock/[symbol]/page.tsx" scripts/seed_dart_corp_codes.ts package.json package-lock.json docs/STEP_595_COMMAND.md docs/STEP_595B_COMMAND.md && git commit -m "feat(ai): KR 공시 이벤트 층(DART) + dart_corp_codes 시드(corpCode.xml·상장사 ~3.9k) — corp_code→list.json 중대 공시 카드 (STEP 595)" && git push
```

## ✅ 여기까지 = KR 공시 이벤트 층 라이브(데이터 시드 완료). 다음 = **STEP 596 R1-KR 요약**(DART 원문 zip→텍스트→gpt-4o-mini).
> ⚠️ 2단계에서 여전히 비면 커밋 전 멈추고 시드 로그(1단계 총 행수) + kr2dev.log 공유.
