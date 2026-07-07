<!-- 2026-07-06 -->
# STEP 630 — R3 영국 뉴스 커밋 (getGbName·en-GB) + 영국 탭 완성

> **완성**: 영국 R3 = `.L` → **클린 영문명(gb_names·Wikipedia FTSE) → en-GB 검색 → 영국 기사 → 한국어 요약**. US 패턴(영어)이라 이름테이블만 클린화·번역 불필요. 통화(원→파운드) 후처리.
> **Cowork 3중 검수 통과**(실 라우트 동일 파이프라인): HSBC·Shell·AstraZeneca·Vodafone 각 3회 →
> - Shell "Na Kika 자산 17억달러 매각" · AstraZeneca "CSPC 17억달러 신약계약 + 텍사스 3,400만달러 합의" · Vodafone "Safaricom 완료 + 獨 CEO 연장" — 전부 **FT·Reuters·The Times 등 영국/금융 소스** · 한국어 · 구체사건 · 무목표가/무전망 · 통화 정확 · 3회 일관. (HSBC는 헤드라인 소프트→빈 요약=정직.)
> **Cowork 변경(커밋 대상)**: `lib/gbName.ts`(신규) · `lib/stockNews.ts`(en-gb 로케일) · `app/api/news-brief/route.ts`(GB 분기+통화 파운드) · `app/stock/[symbol]/page.tsx`(티커 `.L` strip).
> **UK 매매처 12**(brokers region='GB': HL·AJ Bell·II·Trading212·Freetrade·IG·Fidelity·Vanguard·IBKR·Halifax·Barclays·Charles Stanley) MCP 저장 — DB 완료.
> **전제**: STEP 629(`359cc83`) 이후. tsc EXIT=0.

## 0) 임시파일 삭제 + 빌드
```bash
cd ~/stock-terminal && rm -f scripts/_v3gb.ts && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -10
```

## 1) 상태 확인
```bash
cd ~/stock-terminal && git status --short | grep -E "gbName|stockNews|news-brief|stock/\[symbol\]"
```

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add lib/gbName.ts lib/stockNews.ts app/api/news-brief/route.ts "app/stock/[symbol]/page.tsx" docs/STEP_630_COMMAND.md && git commit -m "feat(gb): R3 영국 뉴스 — getGbName(gb_names)·en-GB·통화(원→파운드)·티커 .L strip (3중 검수 통과) + UK 매매처 12(DB)" && git push
```

## ✅ 완료 시 — 🎉 **영국 탭 완성(빠짐없이)**:
- 링크46 · 배관 · 종목보드(FTSE 350·야후 .L·펜스) · 모아보기(en-GB) · **지수바(FTSE 100·250)** · 통화 펜스 · **매매처(GB 12)** · R3(영어·3중 검수).
- 국가탭: **US·KR·JP·CN·VN·GB = 6개국** · R3 전부 네이티브.
- 다음(로드맵): 한국어권 **디테일 폴리시 + SEO(한국어) + 한국어 광고 세팅** → 한국어판 MVP 확정. (또는 로드맵상 국가 더: 인도·대만 등.)
