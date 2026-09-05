<!-- 2026-07-06 -->
# STEP 597 — US 확신 검증 (3라운드 중복검수 · 다종목 · 실적 8-K 경로)

> **목표**: R1/R2/R3가 **정말** 되는지 **3라운드로 중복 검증**. 라운드마다 **다른 종목**(캐시 아닌 새 생성 = 진짜 재검증) + **2.02 실적 공시(EX-99.1 첨부 경로·미실행)** 실증. **3라운드 전부 PASS여야 "US 확실히 됨".** 코드 변경 없음·검증만.
> **전제**: STEP 596(`a246b81`) 이후.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_597_COMMAND.md 파일 내용대로 실행해줘
```

## 1) 🔴 3라운드 중복검수 (dev)
```bash
cd ~/stock-terminal && (npm run dev >/tmp/us_verify.log 2>&1 &) ; sleep 15
node -e '
(async()=>{
  const base="http://localhost:3333";
  const rounds=[ ["AAPL","MSFT","NVDA"], ["JPM","AMD","ETSY","KO"], ["TSLA","BAC","PFE","INTC"] ];
  const bad=/사세요|파세요|사라|팔아라|목표가|매수|매도|오를 ?것|내릴 ?것|하락할|상승할|급등|급락|기회입니다|추천/;
  let anyEarn=false, grand=0;
  for(let r=0;r<rounds.length;r++){
    console.log(`\n############ ROUND ${r+1} (${rounds[r].join(",")}) ############`);
    let err=0, pred=0;
    for(const t of rounds[r]){
      try{
        const ev=await (await fetch(base+"/api/events?symbol="+t)).json();
        const evs=ev.events||[];
        const earn=evs.find(e=>(e.items||[]).includes("2.02")); if(earn) anyEarn=true;
        const targets=[earn,evs[0]].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).slice(0,2);
        for(const g of targets){
          const q=new URLSearchParams({symbol:t,link:g.link,items:(g.items||[]).join(",")});
          const s=await (await fetch(base+"/api/events/summary?"+q)).json();
          if(!s.summary) err++; if(s.summary&&bad.test(s.summary)) pred++;
          console.log(`  ${t} R1[${(g.items||[]).join(",")}]${earn&&g===earn?" ★실적":""}:`, (s.summary||("ERR:"+JSON.stringify(s))).slice(0,200));
        }
        const b=await (await fetch(base+"/api/brief?symbol="+t)).json();
        if(!b.brief) err++; if(b.brief&&bad.test(b.brief)) pred++;
        console.log(`  ${t} R2:`, (b.brief||("ERR:"+JSON.stringify(b))).slice(0,180));
        const n=await (await fetch(base+"/api/news-brief?symbol="+t)).json();
        if(n.summary&&bad.test(n.summary)) pred++;
        console.log(`  ${t} R3:`, (n.summary||"(뉴스없음)").slice(0,140),"| tags:",JSON.stringify(n.tags||[]));
      }catch(e){ err++; console.log(`  ${t} ERR`,String(e)); }
    }
    grand+=err+pred;
    console.log(`--- ROUND ${r+1}: 에러 ${err} · 예측의심 ${pred} → ${err===0&&pred===0?"PASS ✅":"FAIL ❌"}`);
  }
  console.log(`\n======== 종합: 실적(2.02) 경로 실행=${anyEarn?"O ✅":"X(실적시즌 아닐 수 있음)"} · 3라운드 결함합계 ${grand} → ${grand===0?"전체 PASS 🎉":"재점검 필요 ❌"} ========`);
})();
'
# 확인 후: pkill -f "next dev"
```
**판정 기준 (전부 충족해야 US 확정):**
- [ ] **ROUND 1·2·3 모두 PASS** (각 라운드 에러 0 · 예측의심 0).
- [ ] **실적(2.02) 경로 실행=O** 이고, 그 R1 요약에 **실제 실적 내용**(매출·이익 숫자)이 담김. (X면 = 최근 실적 시즌 아님 → 별도로 최근 실적 낸 종목 1개 수동 확인 권장.)
- [ ] 눈으로도 R1·R2·R3 문장이 **사실·긴장·촉매만**(어떤 종목도 예측·권유 없음).

## 2) 프로덕션 확인
- [ ] Vercel env에 `OPENAI_API_KEY`·`SEC_USER_AGENT`·`DART_API_KEY` 있는지 확인(없으면 prod에서 AI 500 → 사용자가 Vercel에 추가, 키는 사용자 직접).
- [ ] 배포본 `https://onetrillion.app/stock/NVDA` 열어 브리핑·공시 AI 요약 뜨는지 1회.

## 3) 결과 보고 → 사용자 판단
- 3라운드 결과 + 실적경로 + prod를 **Cowork에 공유**. 
- **전체 PASS면**: Cowork이 "US 확실히 됨" 선언 + **사용자에게 다음(다른 국가탭 확장) 진행 여부를 물어봄** (마음대로 확장 금지).
- **FAIL 있으면**: 어느 라운드·종목·기능인지 공유 → 픽스 STEP.

## ✅ 3라운드 다 PASS = "US 확실히 됨". 그 전엔 US 완성 선언 안 하고, 다른 국가로도 안 넘어감.
