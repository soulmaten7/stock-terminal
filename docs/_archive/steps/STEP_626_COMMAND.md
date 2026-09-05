<!-- 2026-07-06 -->
# STEP 626 — R3 베트남 뉴스 커밋 (getVnName·vi·통화 동)

> **완성**: 베트남 R3 뉴스 = `.VN` → **베트남어 종목명(vn_names·vnstock HOSE) → vi 검색 → 진짜 베트남 기사 → 한국어 요약**. CN/JP과 동일 패턴 + 통화(원→동) 후처리.
> **Cowork 3중 검수 통과**(샌드박스 tsx·실 라우트 동일 파이프라인): VIC·VNM·HPG·FPT 각 3회 독립생성 →
> - VNM: "Vinamilk 2025 잔여배당 3,800억 **동** + 주주명부" · HPG: "Hòa Phát 철강 생산·HRC 신기록 + 600억동 해상풍력" · FPT: "100% 현금배당" — 전부 **CafeF·Vietstock·Mekong ASEAN 등 베트남 소스** · 한국어 · 구체사건 · 무목표가/무전망/무밸류 · 동(VND) 정확 · 3회 일관.
> - (경미: VIC는 지주사라 자회사 Vinhomes 뉴스가 잡힘 — 관련성 有 / FPT tag에 회사명 낌.)
> **Cowork 변경(커밋 대상)**: `lib/vnName.ts`(신규·getVnName) · `lib/stockNews.ts`(vi 로케일) · `app/api/news-brief/route.ts`(VN 분기+통화 동) · `app/stock/[symbol]/page.tsx`(티커 `.VN` strip).
> **전제**: STEP 625 이후(HOSE 정리 `5523711` 포함). tsc EXIT=0.

## 0) 임시파일 삭제 + 빌드
```bash
cd ~/stock-terminal && rm -f scripts/_v3vn.ts && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -10
```

## 1) 상태 확인
```bash
cd ~/stock-terminal && git status --short | grep -E "vnName|stockNews|news-brief|stock/\[symbol\]"
```

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add lib/vnName.ts lib/stockNews.ts app/api/news-brief/route.ts "app/stock/[symbol]/page.tsx" docs/STEP_626_COMMAND.md && git commit -m "feat(vn): R3 베트남 뉴스 — getVnName(vn_names)·vi 로케일·통화(원→동)·티커 .VN strip (3중 검수 통과)" && git push
```

## ✅ 완료 시 — 🎉 **베트남 탭 MVP 완성** (플레이북 5블록):
- ① link_hub 49 · ② 배관(토글·피드 vi·₫) · ③ 종목보드(HOSE 387·야후 .VN) · ⑤ **R3 뉴스(베트남어 네이티브·3중 검수)**.
- 국가별 AI R3: **US·KR·JP·CN·VN = 5개국 전부 네이티브.**
- 다음(로드맵): **영국 탭**(다음 국가) → 그다음 한국어판 디테일·SEO·광고. (VN 매매처 brokers·VN-Index 지수바·HNX는 후속 선택.)
