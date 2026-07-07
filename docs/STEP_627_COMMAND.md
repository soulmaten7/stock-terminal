<!-- 2026-07-06 -->
# STEP 627 — VN 지수바 + 매매처 + 완전성 원칙 (베트남 빠짐없이 마감)

> **배경**: "MVP=축소"로 흐른 것 바로잡음. **완전성 원칙**을 CLAUDE.md 절대규칙 + 플레이북 §0에 못박고, 베트남 잔여(지수바·매매처) 채움.
> **Cowork이 이미 한 것**:
> - **VN-Index·VN30 지수바** — 야후가 VN 지수 미커버(^VNINDEX 등 값 없음) → **VnDirect dchart(공개 EOD)로 대체** 통합(`app/api/yahoo/indices/route.ts`). 라이브 확인: VN-Index 1843.5(-1.00%).
> - **VN 매매처 13개**(brokers region='VN': VPS·SSI·VNDirect·TCBS·HSC·Vietcap·MBS·미래에셋VN·KIS·SHS·FPTS·BSC·VCBS) MCP 저장 — DB 완료(코드 아님). (VN 보드엔 언어기준상 KR 증권사가 이미 표시 = 설계대로.)
> - **완전성 원칙 못박음**: `CLAUDE.md`(새 탭/언어권 착수 전 플레이북 재독 + MVP≠축소) · `docs/COUNTRY_TAB_PLAYBOOK.md`(§0 대원칙 0번 + 상단 배너).
> **커밋 대상(코드/문서)**: `app/api/yahoo/indices/route.ts` · `CLAUDE.md` · `docs/COUNTRY_TAB_PLAYBOOK.md`.
> **전제**: STEP 626(`41b7989`) 이후. tsc EXIT=0.

## 1) 빌드 + 지수바 확인
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -8
```
- (선택) 지수바 라이브 확인:
```bash
cd ~/stock-terminal && (npm run dev >/tmp/idx.log 2>&1 &) ; sleep 14
curl -s "http://localhost:3333/api/yahoo/indices" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('지수:', (j.items||[]).map(x=>x.name).join(', '));})"
# 확인: 목록에 VN-Index, VN30 있어야. 이후: pkill -f "next dev"
```
- [ ] 상단 지수 마퀴에 **VN-Index·VN30** 노출(USD/CNY 뒤).

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add app/api/yahoo/indices/route.ts CLAUDE.md docs/COUNTRY_TAB_PLAYBOOK.md docs/STEP_627_COMMAND.md && git commit -m "feat(vn): VN-Index/VN30 지수바(VnDirect 대체·야후 미커버) + 완전성 원칙 못박음(CLAUDE·플레이북) + VN 매매처 13(DB)" && git push
```

## ✅ 완료 시 — 🎉 **베트남 탭 완성(빠짐없이)**:
- 배관 · 종목보드(HOSE 387) · link_hub 49 · 모아보기(vi) · **지수바(VN-Index·VN30)** · 통화 ₫ · **매매처(VN 13 + 보드에 KR 증권사)** · AI R3(네이티브·3중 검수).
- 국가별 AI R3: US·KR·JP·CN·VN 5개국 네이티브.
- 다음(로드맵): **영국 탭**(플레이북 재독 후 착수 — DoD 전 항목 빠짐없이). 그다음 한국어판 디테일·SEO·광고.
