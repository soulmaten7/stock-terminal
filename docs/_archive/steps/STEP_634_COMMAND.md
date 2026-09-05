<!-- 2026-07-06 -->
# STEP 634 — 디테일 폴리시 ③ (VN 종목명 트림 + GB 펜스 소수 제거)

> **폴리시**: 눈검수 잔여 2건.
> - **VN 종목명 CTCP 트림**: "Tập đoàn VINGROUP - CTCP"→"Tập đoàn VINGROUP" · "CTCP Sữa Việt Nam"→"Sữa Việt Nam" (법인접두/접미 제거·은행명 유지). `data/vn_symbols.json` 347/387 정리(보드 표시용). R3 검색용 `vn_names` 테이블은 풀네임 유지(영향 없음).
> - **GB 펜스 소수 제거**: `20,740.00p`→`20,740p` (`lib/currency.ts` GB frac 2→0).
> **Cowork이 이미 함**: 위 2파일 수정. tsc EXIT=0.
> **전제**: STEP 633(`efeab37`) 이후. **빌드+커밋만.**

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -8
```

## 1) 커밋 + push
```bash
cd ~/stock-terminal && git add data/vn_symbols.json lib/currency.ts docs/STEP_634_COMMAND.md && git commit -m "polish(vn·gb): VN 종목명 CTCP 접두/접미 트림(347) + GB 펜스 소수 제거(20,740p)" && git push
```

## ✅ 완료 시 — 🎉 **디테일 폴리시 1바퀴 완료**:
- ① VN 1일전 0% 버그 픽스(r1d) · ② VN·GB 로고 · ③ VN 종목명 트림 + GB 펜스.
- 6개국 탭 = 국기제거·보드·로고·1일전·지수바·통화·매매처·R3 전부 정리됨.
- 다음: **한국어 SEO**(따로 논의 예정) → 광고. (또는 추가 국가 인도·대만.)
