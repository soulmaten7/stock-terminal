<!-- 2026-04-23 -->
# Cross-Reference — Stock Terminal ↔ OTMarketing

> 2026-04-23 분리 시점 기록 (OTMarketing 측 동일 파일과 한 쌍)

## 📍 프로젝트 위치

| 프로젝트 | 위치 | 용도 |
|---|---|---|
| Stock Terminal | `~/stock-terminal/` | 개인 투자자용 한국·글로벌 주식·코인 통합 정보 플랫폼 |
| OTMarketing | `~/OTMarketing/` | B2B + B2C CPA 사업 |

## 🔗 공유 인프라

| 자원 | 누가 관리 | 용도 |
|------|---------|------|
| Vercel 계정 | 공용 | 둘 다 여기서 배포 (프로젝트만 분리) |
| GitHub 계정 (soulmaten7) | 공용 | 저장소만 분리 (`stock-terminal`, `otmarketing-cpa`) |
| Google Drive | 공용 | 자료·시트 저장 |
| Supabase (회원·인증) | Stock Terminal 전용 | OTMarketing 사용 안 함 |
| 구글 스프레드시트 (광고주 DB) | OTMarketing 전용 | Stock Terminal 사용 안 함 |

## 🎁 OTMarketing에서 가져올 수 있는 자산

Stock Terminal이 향후 광고·파트너십·CPA 모델을 도입할 경우 재사용 가능:

1. **제안서 제너레이터** — `~/OTMarketing/templates/proposals/_generator.py`
2. **업종 분류 체계** — 6개 카테고리 표준화 (개인회생·정수기렌탈·인터넷통신·주식리딩·부동산분양·병의원)
3. **랜딩 페이지 패턴** — 자가진단형 폼 + 리드 수집
4. **상담 스크립트 프레임워크** — 1차콜 표준화
5. **CPA 표준 계약서** — 단가·정산 조항

## ⛔ 절대 공유하지 않는 것

- 코드 저장소 (각자 독립 git, cross-commit 금지)
- 배포 파이프라인 (Vercel 프로젝트 분리)
- 도메인
- node_modules

## 📝 분리 히스토리

- 2026-04-23: STEP_01_PROJECT_SEPARATION 실행 → 폴더·저장소 분리
- 2026-04-23: STEP_02_STOCK_TERMINAL_HANDOFF 실행 → 본 프로젝트 측 핸드오프 문서 셋업 (이 파일 생성 시점)
- 분리 이전: `~/OTMarketing/` 한 폴더에 양쪽 코드 혼재
- 분리 이후: 두 프로젝트 완전 독립

## 🆘 분리 롤백이 필요할 때

- 백업: `~/_BACKUP_20260423_191738/` (2026-04-30 이후 수동 삭제)
- git 되돌리기: 본 STEP_02 커밋 1건만 `git reset --hard HEAD~1` (사용자 확인 후)
- 외장하드 아카이브: `_archived_Antigravity_20260423/`
