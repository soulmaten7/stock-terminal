<!-- 2026-07-06 -->
# STEP 619 — CN 진짜 중국어 뉴스 커밋 (텐센트 우회 · STEP 618 대체)

> **STEP 618 결말**: 東方財富(push2his)이 유저 머신(KR·exit52)·샌드박스(502) 모두 차단 → Vercel만 도달. **텐센트 시세 API(qt.gtimg.cn)로 우회**(다른 인프라·도달됨·GBK 디코딩). Cowork이 샌드박스에서 **HK+A주 전량 시드+검증 완료** → 이 STEP은 **빌드+커밋만**(재시드 불필요).
> **Cowork이 이미 한 것**: `cn_names` 마이그(MCP) · **HK 3,227(HKEX 번체) + A주 3,868(텐센트 간체) = 7,095행 시드** · MCP 실측(騰訊控股/贵州茅台/宁德时代/比亚迪…) · 뉴스 경로 실측(HK=홍콩기사·A주=본토기사) · tsc EXIT=0.
> **전제**: STEP 617(`f1ff19a`) 이후.

## 0) 잔여 임시파일 삭제 + 빌드
```bash
cd ~/stock-terminal && rm -f _t_cn.ts scripts/_probe_cn.ts && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -10
```

## 1) 상태 확인
```bash
cd ~/stock-terminal && git status --short
```
- 예상 커밋 대상: `scripts/seed_cn_names.ts` `lib/cnName.ts`(신규) `lib/stockNews.ts` `app/api/news-brief/route.ts` `supabase/migrations/034_cn_names.sql`(신규) + `docs/STEP_618/619`.
  (`docs/COUNTRY_TAB_PLAYBOOK.md`는 별개 미커밋 — 제외.)

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add "scripts/seed_cn_names.ts" "lib/cnName.ts" "lib/stockNews.ts" "app/api/news-brief/route.ts" "supabase/migrations/034_cn_names.sql" docs/STEP_618_COMMAND.md docs/STEP_619_COMMAND.md && git commit -m "feat(ai-r3): CN 뉴스 진짜 중국어 검색 — cn_names(HK 번체 HKEX + A주 간체 텐센트 qt.gtimg) 7095행 + zh-HK/zh-CN 로케일 분기 (STEP 618~619)" && git push
```

## ✅ 완료 시
- **CN R3 = 제대로**(HK 번체·zh-HK / A주 간체·zh-CN → 진짜 중국 기사). 텐센트로 東方財富 차단 우회.
- 국가별 AI: **US·KR 완전체 / JP·CN = R3 네이티브 완성** (4개국 모두 네이티브 뉴스).
- 다음 후보: ① 세션 문서 매듭(CHANGELOG·SESSION_BOOT 등 STEP 614~619) ② 전 국가탭 AI 완성 검수 ③ 베트남 탭.
