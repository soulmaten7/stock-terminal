<!-- 2026-07-06 -->
# STEP 598 — R3 뉴스 프롬프트 강화(밸류 의견 누수 차단) + 3라운드 재검증

> **왜**: Cowork이 MCP로 캐시된 실제 생성물을 직접 검수 → **R1·R2는 견고, R3만 밸류 의견 누수**(BAC "과대평가된 것으로 보인다"·INTC "목표주가 200달러"·JPM "공정가치 상승"). "매도" regex는 오탐이었지만 그 카드가 가리킨 R3는 진짜 선을 넘고 있었음. → R3 프롬프트를 **"구체 사건만·밸류판단/목표주가/투자의견 금지"**로 강화. R2엔 "예정" 방지 1줄.
> **전제**: STEP 596(`a246b81`) 이후. **Cowork이 프롬프트 수정 + news_briefs·stock_briefings 캐시 비움(재생성).** → Claude Code는 **빌드 + 재검증 + 커밋**.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_598_COMMAND.md 파일 내용대로 실행해줘
```

## Cowork이 이미 한 것
- `app/api/news-brief/route.ts`(R3) — 프롬프트 강화: **구체 사건(실적·신제품·계약·인사·소송·규제)만** · **밸류에이션 판단·목표주가·투자의견·전망·분석가의견 엄격 금지** · 사건 없으면 summary 빈 문자열. 태그도 사건 토픽만.
- `app/api/brief/route.ts`(R2) — "최근 공시=이미 접수된 과거 사실, '예정'이라 쓰지 말 것" 추가.
- MCP로 **news_briefs·stock_briefings 전체 삭제**(새 프롬프트로 재생성되게). R1(filing_summaries)은 이미 검증 통과 → 유지.

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS" | head -5
```

## 1) 🔴 3라운드 재검증 (개선 regex — 진짜 누수를 잡음)
```bash
cd ~/stock-terminal && (npm run dev >/tmp/us_verify2.log 2>&1 &) ; sleep 15
node -e '
(async()=>{
  const base="http://localhost:3333";
  const rounds=[ ["AAPL","MSFT","NVDA"], ["JPM","AMD","ETSY","KO"], ["TSLA","BAC","PFE","INTC"] ];
  const bad=/사세요|파세요|목표주가|과대평가|저평가|공정가치|투자의견|매수 ?추천|매도 ?추천|비중 ?확대|비중 ?축소|오를 ?것|내릴 ?것|상승할 것|하락할 것|급등 ?임박|지금이 ?기회|강력 ?추천/;
  let grand=0;
  for(let r=0;r<rounds.length;r++){
    console.log(`\n####### ROUND ${r+1} (${rounds[r].join(",")}) #######`);
    let leak=0;
    for(const t of rounds[r]){
      const b=await (await fetch(base+"/api/brief?symbol="+t)).json();
      if(b.brief&&bad.test(b.brief)){leak++;console.log(`  ⚠️ ${t} R2 누수:`,b.brief.match(bad)[0]);}
      console.log(`  ${t} R2:`, (b.brief||"ERR").slice(0,150));
      const n=await (await fetch(base+"/api/news-brief?symbol="+t)).json();
      if(n.summary&&bad.test(n.summary)){leak++;console.log(`  ⚠️ ${t} R3 누수:`,n.summary.match(bad)[0]);}
      console.log(`  ${t} R3:`, (n.summary||"(없음)").slice(0,150),"|",JSON.stringify(n.tags||[]));
    }
    grand+=leak;
    console.log(`--- ROUND ${r+1}: 누수 ${leak} → ${leak===0?"PASS ✅":"FAIL ❌"}`);
  }
  console.log(`\n======== 3라운드 누수합계 ${grand} → ${grand===0?"전체 PASS 🎉":"아직 누수 ❌"} ========`);
})();
'
# 확인 후: pkill -f "next dev"
```
- [ ] **3라운드 전부 누수 0** (특히 이전에 샜던 BAC·INTC·JPM이 이제 밸류 의견·목표주가 없이 구체 사건만).
- [ ] 눈으로도 R3에 "과대평가·목표주가·전망" 사라짐. (구체 사건 없는 종목은 R3가 "(없음)"=숨김 — 정상.)

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add "app/api/news-brief/route.ts" "app/api/brief/route.ts" docs/STEP_598_COMMAND.md && git commit -m "fix(ai): R3 뉴스 프롬프트 강화(밸류판단·목표주가·투자의견 금지·구체 사건만) + R2 '예정' 방지 — MCP 검수서 발견한 밸류 의견 누수 차단 (STEP 598)" && git push
```

## ✅ 3라운드 누수 0 = R1·R2·R3 다 정직 = **"US 확실히 됨".** 
> 통과 결과 Cowork에 공유 → Cowork이 US 완성 선언 + **사용자에게 "다른 국가탭 진행할까요?" 물어봄**(마음대로 확장 안 함).
> ⚠️ 아직 누수 나오면 어느 종목·문장인지 공유 → 프롬프트 재강화.
