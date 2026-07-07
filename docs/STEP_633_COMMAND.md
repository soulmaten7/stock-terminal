<!-- 2026-07-06 -->
# STEP 633 — VN·GB 종목 로고 (디테일 폴리시 ②)

> **폴리시**: 눈검수에서 VN·GB 보드가 로고 없이 이니셜 폴백만 뜸(JP/CN·US는 로고 있음). → **JP/CN과 동일하게 야후 프로필 website로 도메인 수집 → logo.dev/파비콘**.
> **Cowork이 이미 함**: 야후 `assetProfile.website`로 도메인 수집 → `data/vn_logo_domains.json`(387·도메인 386) · `data/gb_logo_domains.json`(349·도메인 347) · `lib/avatar.ts` `AUTO_DOMAINS`에 import·spread 추가. tsc EXIT=0.
> (VIC.VN→vingroup.net · HSBA.L→hsbc.com · SHEL.L→shell.com 확인.)
> **전제**: STEP 632(`d344064`) 이후. 이 STEP은 **빌드+커밋만**.

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -8
```

## 1) 상태 확인
```bash
cd ~/stock-terminal && git status --short | grep -E "avatar|logo_domains"
```
- 예상: `lib/avatar.ts`(M) · `data/vn_logo_domains.json`·`data/gb_logo_domains.json`(신규).

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add lib/avatar.ts data/vn_logo_domains.json data/gb_logo_domains.json docs/STEP_633_COMMAND.md && git commit -m "feat(polish): VN·GB 종목 로고 — 야후 프로필 도메인 733개→logo.dev (JP/CN과 동일)" && git push
```

## 3) (배포 후) 눈검수
- [ ] 베트남·영국 탭 새로고침 → 종목에 **실로고**(Vingroup·HSBC·Shell·AstraZeneca 등). 없는 소수만 이니셜 폴백.

## ✅ 완료 시 → 다음 디테일 폴리시 ③: 펜스 소수 정리 + VN 종목명 "- CTCP" 트림.
