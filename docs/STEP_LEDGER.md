<!-- 2026-08-07 · STEP 원장 신설 (CLAUDE.md 「STEP 기록 규칙」 ⓐ) -->

# STEP 원장 — 성공·부분·실패·미실행 전부

> **규칙 출처**: `CLAUDE.md` 「🔴 STEP 기록 규칙」 ⓐ (2026-08-07 장은태 확정)
> **목적**: `CHANGELOG.md`(847KB)를 읽지 않고 **전체 진행 상태를 한눈에** 본다.
> **요약이지 대체가 아니다** — 상세 = `CHANGELOG.md` · 교훈 = `LENS_DEV_PLAYBOOK.md`(#1~#106).

## 기록 규칙 (요약)
- **STEP 하나당 한 줄.** 성공했든 실패했든 **아예 실행 안 했든** 남긴다.
- 🔴 **"성공이라 적을 게 없다"는 사유가 되지 않는다.**
- 🔴 **몰아서 적지 않는다** — STEP 결과를 보는 그 자리에서.
- 표기: `✅ 성공` · `🟡 부분` · `🔴 실패` · `⬜ 미실행`

---

## 🔴 이 원장의 현재 한계 — 반드시 함께 읽을 것

아래 「결과」 칸은 **대부분 "CHANGELOG에 기록이 있는가"이지 "작업이 성공했는가"가 아니다.**
원장이 규칙보다 늦게 생겨 소급 판정을 할 수 없었다. **837만 이번에 실측으로 확정했다.**

| 표기 | 뜻 |
|---|---|
| ✅ 기록됨 | CHANGELOG에 그 STEP **전용 엔트리**가 있음 — 🔴 **성공을 뜻하지 않는다** |
| 🟡 범위압축 | `808~828` catch-up처럼 **범위 한 줄**에 묶임 — 개별 성공/실패가 안 보임 |
| 🟡 언급만 | 본문 언급뿐 |
| 🔴 기록없음 | CHANGELOG 언급 0건 — **실행 여부 자체가 미확인** |
| ⬜ 미실행 | 실측으로 미실행 확정 |

### 판정 방법 (재현 가능)
1. `docs/STEP_*_COMMAND.md`에서 STEP 번호 수집
2. CHANGELOG 헤딩(`## … STEP N`)에 있으면 ✅
3. 없으면 **범위 표기(`808~828`)를 펼쳐** 대조 → 있으면 🟡 범위압축
4. 그래도 없으면 본문 단순 언급 확인 → 🟡 언급만
5. 전부 아니면 🔴 기록없음

🔴 **1차 판정에서 3번(범위 펼치기)을 빠뜨려 「기록없음」이 29건으로 과다 집계됐다. 재판정 후 7건.** 이 오류 자체를 남긴다 — 원장의 숫자도 검산 대상이다.

🔴 **소급 채움 미착수**: 800 이전 726개 STEP은 미등재. 범위·방법은 장은태 판정.

---

## 비번호 작업 (STEP 외 · 대화 산출)

🔴 **규칙 ⓐ는 STEP 단위지만, 저장소를 바꾼 작업은 번호가 없어도 남긴다.**

| 날짜 | 작업 | 결과 | 사유 | 커밋 |
|---|---|---|---|---|
| 2026-08-07 | STEP 기록 규칙 개정 + `STEP_LEDGER` 신설 + INDEX 로그범위 정정 | ✅ 성공 | 규칙이 "문제 생겼을 때"만 남기게 돼 있어 성공·미실행이 구조적으로 누락됨 | `048b8f5` |
| 2026-08-07 | STEP 871 정본 복원 + 조사·감사 문서 5건 커밋 | ✅ 성공 | 871(driver1 정본 189줄)이 덮여 있었음. 보존 후 복구 | `c4c0a4a` |
| 2026-08-07 | 모델 재조사 3차(`MODEL_UNIVERSE_63` 외 3건) | ✅ 성공 | 07-30 선정 근거가 저장소에 없어 재조사. 63개 × 재현 비용 실측 | 미커밋 |
| 2026-08-07 | 렌즈 전수감사 ①밸류(6건)·②모멘텀(5건) | 🟡 부분 | 7렌즈 중 2개만 완료 — 나머지 5개 미착수 | 밸류=`c4c0a4a` · 모멘텀 미커밋 |
| 2026-08-07 | `link_hub` US 139건 출처 활용성 검토 | ✅ 성공 | 결론: 새 데이터 출처 불필요(SEC로 충분) · analysis/research 28건은 전부 경쟁사 | 문서 없음 |
| 2026-08-07 | 문서 일괄 갱신(STATE·CHANGELOG·SYSTEM_MAP·INDEX·PLAYBOOK·LEDGER) | ✅ 성공 | 장은태 지시 "모든 문서에 싹 다 업데이트" | 미커밋 |
| 2026-08-07 | 경쟁자·유니버스 3건 검증(New Constructs·KR 플랫폼·604 자기참조) | ✅ 성공 | 🔴 **해자 주장 "분포 주는 곳 없다" 철회** · 604 6일 무증감 확정 · `SPEC §10 #76·#77` 등재 | 미커밋 |
| 2026-08-08 | 🔴 **CLAUDE.md 전문 감사·정비 10건** | ✅ 성공 | 오늘 확정과 **충돌 3건 정정**(안 고치면 Q2 착수가 규칙 위반) · 「원전 없는 항목」 규칙 신설 · **명령어 4×3 규칙 신설** · 인용 정정 이관 · 591→621줄 | 미커밋 |
| 2026-08-08 | 🗂️ **문서 정리**(폐기 9 아카이브·동결배너 7·INDEX 전면갱신) | ✅ 성공 | 깨진 참조 **0**(기존 깨짐 10건도 수정) · 삭제 0 · 코드 diff 0 · 비-STEP 106→97 | 미커밋 |
| 2026-08-08 | ✅ **ⓐ 질문 확정**(Q0~Q5+요약층·형태까지) | ✅ 성공 | 장은태 승인. Q0=카드에 녹임＋섹터분류 · Q5=카드＋피드 둘 다. 섹터 802/1,021 · `lens_state_changes` 754종목 18일치 실측 | 미커밋 |
| 2026-08-08 | 🔑 **사용자 질문 정본 신설**(`USER_QUESTIONS_2026-08-08.md`) | ✅ 성공 | 「모델보다 질문이 먼저」로 순서 역전 · 3소스 원문 · **Cowork 철회 4건** · 역DCF=Q1의 축 · 「N년」 3.4%만 유의미 | 미커밋 |
| 2026-08-08 | 🇺🇸🔒 전면 US 단독 규칙 확정 — 한국 관련 전부 동결 | ✅ 성공 | 장은태 확정. `CLAUDE.md:25`("KR+US 정책 그대로") 폐기·확대. 동결이지 제거 아님 | 미커밋 |
| 2026-08-08 | STEP 937 관측 등재(명령서 작성) | ✅ 성공 | `recovered=0` 직접 관측 확정 · 재시도 예외 0건인데 `marketCap` 필드 부재 400건 · 판정 불변 140칸 전수 확인 | 미커밋 |
| 2026-08-07 | STEP 837 처리 | ⬜ **미실행** | 명령서 9,321B 존재 · 실행·기록 전무 · **역DCF 방향 전환 지점** — 닫을지 실행할지 판정 대기 | — |

---

## 800~940 구간

| STEP | 결과 | 사유 |
|---|---|---|
| 800 | 🔴 기록없음 | CHANGELOG 언급 0건 — 🔴 실행 여부 미확인 |
| 801 | 🔴 기록없음 | CHANGELOG 언급 0건 — 🔴 실행 여부 미확인 |
| 802 | 🔴 기록없음 | CHANGELOG 언급 0건 — 🔴 실행 여부 미확인 |
| 803 | 🔴 기록없음 | CHANGELOG 언급 0건 — 🔴 실행 여부 미확인 |
| 804 | 🔴 기록없음 | CHANGELOG 언급 0건 — 🔴 실행 여부 미확인 |
| 805 | 🔴 기록없음 | CHANGELOG 언급 0건 — 🔴 실행 여부 미확인 |
| 806 | 🟡 언급만 | 본문 언급뿐 — 개별 결과 미확인 |
| 807 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 808 | 🟡 범위압축 | `808~828` catch-up 등 **범위 한 줄**에 묶임 — 개별 성공/실패 안 보임 |
| 809 | 🟡 범위압축 | `808~828` catch-up 등 **범위 한 줄**에 묶임 — 개별 성공/실패 안 보임 |
| 810 | 🟡 범위압축 | `808~828` catch-up 등 **범위 한 줄**에 묶임 — 개별 성공/실패 안 보임 |
| 811 | 🟡 범위압축 | `808~828` catch-up 등 **범위 한 줄**에 묶임 — 개별 성공/실패 안 보임 |
| 812 | 🟡 범위압축 | `808~828` catch-up 등 **범위 한 줄**에 묶임 — 개별 성공/실패 안 보임 |
| 813 | 🟡 범위압축 | `808~828` catch-up 등 **범위 한 줄**에 묶임 — 개별 성공/실패 안 보임 |
| 814 | 🟡 범위압축 | `808~828` catch-up 등 **범위 한 줄**에 묶임 — 개별 성공/실패 안 보임 |
| 815 | 🟡 범위압축 | `808~828` catch-up 등 **범위 한 줄**에 묶임 — 개별 성공/실패 안 보임 |
| 816 | 🟡 범위압축 | `808~828` catch-up 등 **범위 한 줄**에 묶임 — 개별 성공/실패 안 보임 |
| 817 | 🟡 범위압축 | `808~828` catch-up 등 **범위 한 줄**에 묶임 — 개별 성공/실패 안 보임 |
| 818 | 🟡 범위압축 | `808~828` catch-up 등 **범위 한 줄**에 묶임 — 개별 성공/실패 안 보임 |
| 819 | 🟡 범위압축 | `808~828` catch-up 등 **범위 한 줄**에 묶임 — 개별 성공/실패 안 보임 |
| 820 | 🟡 범위압축 | `808~828` catch-up 등 **범위 한 줄**에 묶임 — 개별 성공/실패 안 보임 |
| 821 | 🟡 범위압축 | `808~828` catch-up 등 **범위 한 줄**에 묶임 — 개별 성공/실패 안 보임 |
| 822 | 🟡 범위압축 | `808~828` catch-up 등 **범위 한 줄**에 묶임 — 개별 성공/실패 안 보임 |
| 823 | 🟡 범위압축 | `808~828` catch-up 등 **범위 한 줄**에 묶임 — 개별 성공/실패 안 보임 |
| 824 | 🟡 범위압축 | `808~828` catch-up 등 **범위 한 줄**에 묶임 — 개별 성공/실패 안 보임 |
| 825 | 🟡 범위압축 | `808~828` catch-up 등 **범위 한 줄**에 묶임 — 개별 성공/실패 안 보임 |
| 826 | 🟡 범위압축 | `808~828` catch-up 등 **범위 한 줄**에 묶임 — 개별 성공/실패 안 보임 |
| 827 | 🟡 범위압축 | `808~828` catch-up 등 **범위 한 줄**에 묶임 — 개별 성공/실패 안 보임 |
| 828 | 🟡 범위압축 | `808~828` catch-up 등 **범위 한 줄**에 묶임 — 개별 성공/실패 안 보임 |
| 829 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 830 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 831 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 832 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 833 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 834 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 835 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 836 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 837 | ⬜ 미실행 | 명령서 9,321B 작성(07-30 13:11) · 실행·커밋·기록 전무. 다음 날 838이 역DCF 프로브로 시작 — **방향 전환 지점** |
| 838 | 🟡 범위압축 | `808~828` catch-up 등 **범위 한 줄**에 묶임 — 개별 성공/실패 안 보임 |
| 839 | 🟡 범위압축 | `808~828` catch-up 등 **범위 한 줄**에 묶임 — 개별 성공/실패 안 보임 |
| 840 | 🟡 범위압축 | `808~828` catch-up 등 **범위 한 줄**에 묶임 — 개별 성공/실패 안 보임 |
| 846 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 847 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 848 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 849 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 850 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 851 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 852 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 853 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 854 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 855 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 856 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 857 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 858 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 859 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 860 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 861 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 862 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 863 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 864 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 865 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 866 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 867 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 868 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 869 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 870 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 871 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 872 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 873 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 874 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 875 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 876 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 877 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 878 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 879 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 880 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 881 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 882 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 883 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 884 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 885 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 886 | 🔴 기록없음 | CHANGELOG 언급 0건 — 🔴 실행 여부 미확인 |
| 887 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 888 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 889 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 890 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 891 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 892 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 893 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 894 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 895 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 896 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 897 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 898 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 899 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 900 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 901 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 902 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 903 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 904 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 905 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 906 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 907 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 908 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 909 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 910 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 911 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 912 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 913 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 914 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 915 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 916 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 917 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 918 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 919 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 920 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 921 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 922 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 923 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 924 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 925 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 926 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 927 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 928 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 929 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 930 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 931 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 932 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 933 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 934 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 935 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 936 | ✅ 기록됨 | CHANGELOG 전용 엔트리 |
| 937 | ✅ 성공 | 계측 ②차 관측 등재 — `recovered=0` 직접 관측 확정·판정 0·DB 쓰기 0·크론 미실행. CHANGELOG (85) |
| 938 | ✅ 성공 | Q0 구현 ①단계 — `lib/sector.ts` 신설·운영 경로 2곳 교체(순수 리팩터·동작 diff 0)·유닛테스트 185/185. 용도 분리(industryGroup vs primary_sector) 발견·「13곳」 실제 운영경로 2곳으로 정정. CHANGELOG (94) |
| 939 | ✅ 성공 | Q0 구현 ③-1단계 — 나스닥·SPDR 원본 Storage 업로드·`registry.ts` 좌표 등재·GICS 정답지 대조 실측(Damodaran vs SPDR 일치율 99.6%, 겹침·일치 수는 Cowork 사전보고와 +4 차이·비율·불일치2건·미매핑10건은 동일). ⓪-5-B(link_hub 병행조회) 중 SPDR 정답지 발견. CHANGELOG (95) |
| 940 | ✅ 성공 | Q0 구현 ③-2+①-2단계 — `us_sector_nasdaq`·`us_sector_gics` 테이블 신설·적재(원본과 정확히 일치, 7,127/503) · `lib/sector.ts`에 `resolveSector`(0~4순위) 신설. 🔴 자체 실측 중 형제매칭 오매칭 결함 발견·수정(ASML→ASMB 등 무관 회사 오매칭 35건→5건, 회귀테스트 고정). 채점: 1순위 99.6%·2·3순위 100%(표본작음)·커버리지 93.1%. 테스트 196/196. CHANGELOG (97) |
| 941 | ✅ 성공 | Q0 구현 ③-3단계 — 야후 `assetProfile`을 3번째 출처로 취득·적재(`us_sector_yahoo`, 성공 1,020/1,021=99.9%). 🔴 조합 채점 스크립트 초안에서 버그 2건 발견·수정(나스닥 원문↔GICS 미번역·채점 범위가 대상 유니버스 아닌 원자료 전체) — 수정 후 야후 단독 95.8%·나스닥∩SIC(현행) 95.3%·미분류70건 야후로 70/70 회수 가능. `lib/sector.ts` 미수정(합의규칙 변경은 942 판정 대기). CHANGELOG (98) |
| 942 | ✅ 성공 | Q0 구현 ③ 마감 — `resolveSector` 3순위를 나스닥∩SIC 합의에서 야후 단독으로 교체(장은태 A안), `crossCheck:{nasdaq,sic,yahoo,disagree}` 신설(사실만 기록·판정 안 함). 실측: 0/1/2순위 941과 정확히 일치(498/311/5)·3순위(야후) 207·미분류 0·커버리지 100%. `ASML`→정답(Information Technology)·`ARCC`→Financials로 해소 확인. `industryGroup` 모드·0~2순위 로직 diff 0. 테스트 200/200. CHANGELOG (100) |
| 943 | ✅ 성공 | Q0 구현 ④단계 — `sector_cuts` 신설(78개 섹터×지표 컷 산출·skip10건), 부트스트랩 안정성 실측(시드943·1,000회, Utilities IQR대비 0.15~1.58), **시장 전체 컷 대비 판정 변경 종목수(결함⑤ 크기) 최초 실측**(momentum20.1%~quality33.8%). `lens_cuts` 쓰기 0(읽기도 안 함)·기존 렌즈 판정 로직·`sector.ts` diff 0. 리포트에 판정 문장 0(숫자만). 테스트 207/207. CHANGELOG (102) |
| 944 | ✅ 성공 | Q0 구현 ⑤ 준비 — `us_sector_resolved`(resolveSector 캐시) 신설·`sector_cuts`에 `applied`/`exclude_reason`/`width_over_iqr` 추가(IQR1.0 초과 7건 제외·71/78 적용, 943과 정확 일치). `scripts/refresh_sector.ts`(수동·크론 미등록, 2회 실행 재현성 확인). 검증: 영속화 1,021종목 불일치 0건·「업종대비 표시불가」320/6,560(4.9%) 최초 산출. 화면·렌즈·`lens_cuts` diff 0. 테스트 215/215. CHANGELOG (105) |
| 945 | 🟡 부분 | Q0 구현 ⑤단계(리스트 쪽만) — **라이브 화면 변경**(장은태 승인). `lib/sectorLabel.ts` 신설(야후·GICS·KR 3어휘 통일, 신규 messages 키 0개) → `EtfLensClient.tsx` 전환·`/api/sector/us` 신규·`ExploreClient.tsx` US 거래대금 리스트에 섹터 필터+라벨+출처안내(신규 키 1개, 덧붙이기만·KR·기존 API diff 0). 테스트 269/269. **배포됨·장은태 Preview 육안 확인 대기 — 「각 카드에 업종 대비」(Q1~Q4)는 범위 밖이라 미완**. CHANGELOG (107) |
| 946 | 🟡 부분 | Q0 마감 — **라이브 화면 변경**(요약화면 섹터 라벨, 장은태 승인) ＋ **DoD 9항목·§10 4축 전수 재대조**. `amountRankingParts`를 `ExploreClient.tsx`에서 `lib/sectorLabel.ts`로 이전(Vitest가 `'use client'` 컴포넌트의 next-intl navigation import그래프를 못 읽는 결함 발견·해소) → 요약화면 5줄에 전체목록과 동일 함수로 섹터 라벨 확장(새 키 0, `sectorSourceNote` 재사용). DoD 재대조: `us_sector_resolved`(1,021·소스breakdown)·`sector_cuts`(78·71적용/7제외) Supabase 직접 재조회, grep으로 화면소비처 정확히 2곳(ETF상세·Explore) 확인 → 5(경계)·7(화면일관성)·8(테스트) ✅ 상향·4(컷분포) 🟡·9(라이브)는 US전용 구조충돌로 판정보류(929 선례). 🔴 명령서(`STEP_946_COMMAND.md:31`)의 §10 인용 오류(:194-206→실제 :212/218-221) 발견·정정. 산출물 `docs/probe_946_q0_dod.json` 신규. 테스트 273/273. **배포됨·장은태 육안확인 대기 — 「완료」 선언 안 함(9항목 중 4·6은 여전히 🟡, 1도 🟡, 9는 판정보류)**. CHANGELOG (108) |
| 947 | ✅ 성공 | Q1 ①단계 — 밸류에이션 4축(PER·PBR·PSR·EV/EBITDA) 재료 확보. **화면 무변경**(`git diff --stat` 확인). 0단계 CIK 매칭 5,497/5,509(99.78%·미매칭12 전수공개) → `us_cik_map`(10,432 적재)·`drivers.ts` fundamentals 선수집(5년게이트 전부보다 앞, skip경로 포함 — 조건식·skipReason diff 0, 기존8+신규7=15/15)·`us_fundamentals`(unavailable_reason 컬럼 포함)·`route.ts` 유니버스 확장(역DCF 604 불변+나머지 fetched_at순 자동순환) · `lib/valuation.ts`(순수함수·VALUATION_SPEC 유일출처, 원문보다 조건 1개 추가·이유공개)+손계산 4케이스+경계6건=11/11 · `docs/VALUATION_SPEC.md`(원전없음 실측 재검증·미해결3건·미매칭12종목 공개). 🐞 기존 route 테스트 목이 신규 `fundamentals` 계약을 안 지켜 skip_reason이 전부 "EX"로 뒤바뀌는 회귀 발견·수정(9/9 복구). 테스트 291/291·tsc 클린·build 클린·`revdcf_results` 29컬럼 불변·크론 미등록/미실행. **못 한 것**: CIK 12종목 원인·Damodaran PDF 원문 미저장·PSR 원문·다중클래스 합산·실제종목 손계산(크론 미실행)·라이브실측(코드만 존재). CHANGELOG (111) |
| 948 | 🔴 실패 | revdcf 크론 1회 수동 실행(장은태 승인) — **401(unauthorized)로 즉시 실패, 지시대로 재시도 안 함.** 배포 확인은 성공(Vercel MCP 403이라 로컬 `vercel` CLI로 대체 — `inspect --logs`가 `Commit: fb2c5c6`·`Release: fb2c5c649c06a157d3c39cf07c47d62be9f7e1b1` 완전 일치 확인. `REVDCF_ENABLED` Production 미설정=OFF 동치 확인만, 무변경). 실행 전 스냅샷 기록(revdcf_results 604×3·fundamentals/valuation 0·cik_map 10,432). 크론 호출 1.4초만에 401 — 진단(재호출 없이): `.env.local`의 `CRON_SECRET`이 큰따옴표로 감싸져 있는데 `cut` 추출이 안 벗겨 헤더에 따옴표가 섞였을 가능성(값 비노출) — Production 크론 자체 결함 증거는 아님. 3~5단계(찬 행수·손계산·야후대비) **전부 미실시**(데이터 0행 그대로). `docs/probe_948_live.json` 신규·`VALUATION_SPEC.md` 검증절 갱신(허위 "해소" 기재 없음). **재실행 = 별도 승인 필요.** CHANGELOG (112) |
| 948(재시도) | ✅ 성공 | 장은태 승인 하 **마지막 1회** 재시도. 호출 없이 401 원인 확정(vercel env pull 임시파일→즉시삭제, local vs prod 시크릿 sha256 앞8자리만 대조 — 완전 일치, 원인=Production 불일치 아니라 947의 `cut` 추출이 `.env.local` 따옴표를 안 벗긴 셸버그로 확정. **명령서 결함 1건째**: 원 STEP 948의 2-1이 파싱법 미지정). node로 파싱 교체 후 재호출 → **200**, 280.3초, `finished:false`(BUDGET_MS 소진, 정상). `us_fundamentals` 1,003행·`us_valuation` 1,003행 적재. **비지배지분 혼입 실측 48건(5.64%)** — 947 "추적만"을 숫자로 채움. `MISSING_MARKET_DATA`(947 추가조건) 실전 131건 확인. `revdcf_results` 08-08=604(불변, 안 깨짐). 손계산 4종목(A·AAL·ABNB·AIRI, 조건별 사전순 결정적 선정) 전부 bit-for-bit 일치(python 독립 재계산) + `A`의 SEC `companyfacts` 원문 5개 태그 직접 대조 전부 일치. 🔴 **§5(야후 상대차) 미실시 — 명령서 결함 2건째**: `lens_scores`에 야후 원시 PER/PBR이 있다는 전제가 거짓(파생점수만 저장, 원시값은 DB 어디에도 없음 — grep 전수 확인) → 승인 범위(크론 1회) 밖의 대량 라이브 호출이 필요해 임의로 안 함. `docs/probe_948_live.json` 전면 갱신·`VALUATION_SPEC.md` 검증절·미해결② 실측치 반영. 코드·화면·`REVDCF_ENABLED`·배포 전부 무변경(push 안 함). CHANGELOG (113) |
| 948(후속) | ✅ 성공 | Cowork 교차검증 결과 기록. 보고 수치 전량 일치 재확인(Supabase 직접) + 신규 2건 독립 재검증(유니버스 as_of 필터 누락·`us_market_cap` 대형주 07-30 정지 — 둘 다 직접 조인·조회로 확인). `docs/probe_948_live.json`(`cowork_crosscheck`)·`VALUATION_SPEC.md`·`STATE.md`(00-1b) 갱신. 코드 diff 0. push는 별도 지시로 이후 완료(`ae6bd42`, main·revdcf-preview HEAD 확인). CHANGELOG 없음(문서 갱신만, 번호 미부여) |
| 949 | ✅ 성공 | `us_market_cap` 결측 465건(STALE 380+ABSENT 85) 원인 진단 — **고치지 않음**(대전제 그대로 준수, `lib/lensPrecompute.ts` diff 0·DB 쓰기 0·크론 미호출). 0단계: 5,974=5,509(OK)+380(STALE, 전부 07-30 단일일자)+85(ABSENT), 배경 "예상"치(394/71)와 분해 다름(원인 미확정, 사실만 기록). 1단계 핵심: `scripts/probe_949_yahoo_probe.ts` 신규(lensPrecompute와 동일 배치100·동시성6→재시도동시성6)로 465+대조군100 전수 야후 직접 조회(5.1초, DB쓰기 0). 2단계 분류: **A(배치실패단건성공)0·B(응답하나 marketCap없음)82·C(완전무응답)0·D(배치바로성공)383**, 대조군 100=전부D, 지명5종목(AZO·BBY·BDX·ADI·APA) 전부D. 3단계: `us_market_cap`(08-07)·`lens_scores`(08-07 갱신 중)·`lens_cuts`(07-30 정지)·`lens_state_changes`(렌즈별 07-28~08-07 혼재) 타임라인 사실만 기록, 인과 미단정. 죽은 가설 2개 폐기 확정(배치방식 문제·심볼부재) 추가. 처방 후보 미결정(장은태 판정 대기). `docs/probe_949_mcap_gap.json` 신규(465+100건 전수)·`STATE.md` 00-1c·CHANGELOG (114) |
| 949(보강) | ✅ 성공 | `LENS_COMPLETION_STANDARD.md`에 Q1 밸류에이션 4축 행 신설(❌🟡❌❌🟡❌❌🟡❌, ✅ 0건) — Q0와 같은 "언제 마감되나" 방지턱 표 동반(1·6·7=카드 생길 때·3=외부대조 수단 설계 후·4=②단계 착수 시·2=5,497 전량적재 후·8=실데이터 픽스처 교체 시·5=화면문구 확정 시·9=Q0와 동일 구조충돌로 판정보류). DoD3(외부독립출처 3종목) 미충족 근거 명시. `STATE.md` 다음할일에 "Q1 ①단계만 완료·커버리지18.2%" 한 줄 추가. 코드 diff 0. CHANGELOG 없음(문서갱신만, 번호 미부여) |
| 950 | ✅ 성공 | `lib/revdcf/drivers.ts:12`의 YS=[2020..2024] 하드코딩 결함 영향범위 실측 — **고치지 않음**(대전제 준수, drivers.ts diff 0·DB 쓰기 0·크론 미호출). §0: SEC 원문 직접확인(AAPL·NVDA·MSFT) — MSFT는 FYE6월이라 2년 누락 신규발견. §1: 1,003종목 스캔(성공861) — 누락연수 0/1/2년=19/831/11, 종료월×누락연수 교차표(6월FYE가 2년누락 집중). 🔴 **명령서 결함 인정**: 1,003 전수조회가 SEC 429 유발(후반부 40건 HTTP_NOT_OK 클러스터로 확인) — 장은태 지적 수용, 재시도 없이 기존결과 그대로 사용. §2: Q1 4축 상대차 중앙값 7~9%·│>20%│비율 21~51%(842건 재계산). §3: 표본20종목(사전순 결정적) 중 재계산가능 14 중 **6종목(42.9%) verdict변동**(before/after 전부 기록). §4: Explore 에이전트로 유사리터럴 스캔 — US1(YS)+KR2(ecos·dart, 동결·미접촉)+미사용1(dart.ts, 호출자0). SEC 429 발생 시 백그라운드 폴링으로 쿨다운 대기 후 재개(60초 간격, 반복 두드리지 않음). 처방후보 4개 대가와 함께 기록·미채택. `docs/probe_950_ys_window.json` 신규·`VALUATION_SPEC.md`(미해결 0번)·`REVDCF_SPEC.md`(§10·§11)·`STATE.md`(다음할일 최우선)·`LENS_COMPLETION_STANDARD.md`(Q1 항목3) 갱신. CHANGELOG (115) |
| 950(보강) | ✅ 성공 | 왜곡 분포 재집계(SEC 추가요청 0건, 이미 계산된 배열 재사용) — signed median(PER 6.8%)과 absolute median(20.6%) 3배 차이 발견·병기, "중앙값 작은데 >20%가 50.9%"가 실은 부호상쇄 때문이었음을 규명. 표본 한계 명시(20종목 전부 'A'로 시작, 대표성 없음, 일반화 금지). 계측 결함 3건 등재 — 그중 `us_valuation.fundamentals_age_days` 전행 −1(Supabase 직접 확인, `Date.parse` 부호 오류) 신규발견. `probe_950_ys_window.json`·`REVDCF_SPEC.md`·`STATE.md`·`LENS_COMPLETION_STANDARD.md`(역DCF DoD3 각주) 갱신. 코드 diff 0. CHANGELOG 없음(문서갱신만, 번호 미부여) |
| 951 | ✅ 성공 | **950 진단의 실제 처방 적용(장은태 판정) — `lib/revdcf/drivers.ts`의 YS=[2020..2024] 하드코딩을 `resolveYearWindow()`(종목별 실재 최신 5개 연도)로 전환.** 모듈레벨 가변상태 0(창은 전부 함수인자) — 헬퍼 3개 개명·시그니처변경(`has5→hasAll`·`latestYear`·`sumMaps`, 기본값 없음). `computeDrivers()` 재구성: 함수진입 직후 창계산 → fundamentals(947)는 `latestAvailable` 단일앵커로 부분수집 유지 → 창실패시 기존 skipReason 그대로+`flags.windowReason` → `WINDOW_MISMATCH` 방어점검 → 파이프라인 YS→years 8곳 교체 → 성공시 `flags.yearWindow`/`windowSize`/`latestAvailable` 필수(적용전/후 구분선). 테스트 301/301(기존 픽스처 무수정 — 우연히 이미 연속5개였음), `resolveYearWindow` 신규유닛 6케이스+창게이트 배선2건+병렬격리2건 전부 통과. 검증(SEC 30건·429 0건, companyfacts 캐시 신설·gitignore) — **NVDA·AAPL fiscalYear PASS**(SEC 원문과 정확일치), 30/30 창 해소(초기 표시버그 발견·수정, 계산자체는 처음부터 정확), ~~verdict비교가능 18종목 중 4건(22.2%) 변동~~ **951 보강에서 무효 판정, 아래 참조**. `docs/REVDCF_SPEC.md`(§10-A 신설)·`VALUATION_SPEC.md`(미해결0번 해소)·`STATE.md`(진단→수정적용)·`LENS_COMPLETION_STANDARD.md`(Q1항목3·역DCF DoD3 각주, 판정은 불변) 갱신. **화면 무변경·REVDCF_ENABLED OFF·크론 미호출·KR 미접촉.** push는 별도 승인. CHANGELOG (116) |
| 951(보강) | ✅ 성공 | **verdict 변동 비교 정정 — 950(42.9%)·951(22.2%) 둘 다 무효 판정 근거로 못 씀, 정본 38.9%(7/18).** 원인 확정: `probe_951_verify.ts`의 before가 DB 저장값과 불일치(AA·ABT·AKAM 확인) — `computeOldWindow()`가 startingMargin 근사·fixedCapitalRate/workingCapitalRate를 새창값으로 대체한 결함(옛창 재현 불충분, 후보③). fb2c5c6 로직 복제 재현으로 DB와 소수점까지 일치 확인(후보①②배제). 950도 재점검 — 14종목 중 13종목 실제코드와 일치, `ADM` 1종목만 불일치(verdict는 우연히 동일결론, 42.9%는 폐기 아닌 "반쪽측정" 표시). 정정 방법: before=DB 저장값 그대로 읽기(재계산 안 함)·after=새코드+DB의 wacc/tax_rate/debt/non_operating_assets/shares/share_price 재사용(창 이외 입력 고정, 창 효과만 격리). `scripts/probe_951b_verify.ts` 신규(SEC 신규요청 0, 캐시 30종목 전부 재사용) → `docs/probe_951b_verify.json`: 비교가능18중 **7건(38.9%) 변동**. `docs/probe_950_ys_window.json`·`docs/probe_951_verify.json`에 각각 `correction` 필드 추가(원본 보존)·`REVDCF_SPEC.md`(§10 두 문단 정정+§11 신규행)·`STATE.md`·`LENS_COMPLETION_STANDARD.md` 갱신. push 판정 재료만 제시(방향·되돌리기비용·유지비용), 판정 안 함. 코드·DB 무변경. CHANGELOG (117) |
| 951(보강②) | ✅ 성공 | **미비교 12종목(skipped 7 + DB없음 5) 확인 + 30종목 통합 상태 전이표 + 변동률 3종.** skipped 7건 재확인: STALE_MARKETCAP 4(ACM·ADI·AIT·BBY)·NO_MARGINAL_CAPEX 3(ABNB·ADP·AEP) — route.ts 파이프라인 그대로 재현(참고값, DB 미기록)해도 7건 전부 새 창에서도 skip 유지. STALE_MARKETCAP은 us_market_cap 10일 경과(TTL 7일)로 막힘 — 창과 무관(949와 같은 뿌리, 독립 확인). NO_MARGINAL_CAPEX는 새 invYears로도 capex/dna 결측이 그대로 따라옴(ABNB capex 2022만·ADP 4개년 전부 없음·AEP 2022만 없음, 원자료 태그 문제). DB없음 5건(AMST·ANF·AVAH·ACRS·ACT)은 revdcf_results 전체 8개 as_of(2026-08-01~08-08) 어디에도 없음을 직접 확인(count=0) — route.ts 유니버스가 자기참조("직전 as_of CIK 집합" 매일 이어받음) 구조라 편입 경로 없음. 🔴 **정정(STEP 951 검수): 이 건은 신규 발견이 아니라 STATE.md 00-3(2026-08-07)에 이미 등재된 문제였다** — 951 검수에서 중복 등재로 판명, 새 항목 대신 00-3에 증거만 추가. 30종목 통합 상태 전이표(7×7 카테고리) 작성. 변동률 3종(N=25): ⓐ라벨만 7/25=28.0%·ⓑ+gap_years만(ADBE·NVDA·MSFT·BR) 11/25=44.0%·ⓒ+skip전환 +0건 11/25=44.0%. gap_years │상대차│ 중앙값 35.0%(ADBE −50%·NVDA −20%·MSFT −17.6%·BR −80%). 방향 집계는 라벨전이 건수만(강도해석 제거, §11 기존 951보강 행의 강도해석 문구도 제거). `scripts/probe_951c_verify.ts` 신규(route.ts 재현, SEC 0건)·`docs/probe_951_verify.json`에 `step951b2_stateTransition` 필드 추가(기존 correction 보존)·`REVDCF_SPEC.md`(§10 신규 문단)·`STATE.md`(신규항목 후보 2건, 판정 없음). 코드·DB 무변경, push 없음. CHANGELOG (118) |
| 951(적용) | ✅ 성공 | **push 실행 — main·revdcf-preview 두 브랜치를 `e39595d`로 갱신, Vercel Production 배포 성공 확인(`dpl_46AxibgmWDyxLfeqji25N6wAtB1A`, commit e39595d와 GitHub status 일치).** 부수적으로 `revdcf-preview` 브랜치 push가 별도 Preview 환경 배포를 자동 트리거(정상 동작, 별도 승인·촉진 없음). 크론 수동 실행·`REVDCF_ENABLED` 변경·추가 배포 승인 전부 안 함. 문서 반영(별도 커밋 `de70d54`, 코드 diff 0): `docs/STATE.md`에 "STEP 951 적용 직후 확인" 블록 신설(6항목+`us_fundamentals` upsert 위험 경고) · `docs/REVDCF_SPEC.md`·`docs/VALUATION_SPEC.md`에 적용 경계 한 줄 못박기(`flags.yearWindow` 유무=신/구 창 구분선). `de70d54`도 이어서 push(HEAD 재확인). CHANGELOG 없음(문서갱신만, 번호 미부여 — 이 STEP은 push 확인이 핵심이라 별도 서술형 CHANGELOG 없이 진행) |
| 951(부속) | ✅ 성공 | **`us_fundamentals_snapshot`(tag=`pre_step951`) 신설·복사 — 익일 크론의 symbol PK upsert로 사라지기 전 옛 창 원시 재무 보존.** 마이그레이션(`20260809_us_fundamentals_snapshot.sql`) — 날짜를 테이블명에 안 박고 `snapshot_tag` 컬럼으로 시점 구분(규칙 5-2). RLS를 `us_fundamentals`와 직접 대조해 동일 확인(RLS on·정책 0·`anon`/`authenticated` 권한 0). `INSERT...SELECT`로 전 컬럼 복사(`source_tags`·`unavailable_reason` 포함) — 검증 3항목 전부 통과: 행수 1,127=1,127(🔴 사용자가 언급한 "1,003"과 실측 불일치 — **정정(같은 날): 유니버스 확장 아니라 정규 크론 1회분.** `fetched_at` 시간대 집계 = 12시대 404행(948 수동실행, "1,003"의 출처)+22시대 723행(정규크론 22:45 UTC). 22시대 723행 중 669행(92.5%)이 `fiscal_year=2024` — 이 크론이 951 배포(익일 06:34 UTC)보다 먼저 돌아 **옛 코드로 실행**됐다는 증거. 스냅샷은 유효(전부 951 이전 산출물), 재확보 불필요) · symbol 집합 차집합 0 · 결정적 5종목(A·AA·AAL·AAPL·ABBV) 전 필드 완전 일치. `docs/STATE.md`(확보 완료 표시+확인항목 ⑦ 추가)·`docs/VALUATION_SPEC.md`(스냅샷 목적 한 줄) 갱신. 기존 `us_fundamentals`·`revdcf_results`·`us_market_cap`·`lens_scores`·`lens_cuts` 전부 무수정(읽기만). 코드 무변경·크론 미호출. CHANGELOG (119) |
| 951(부속·정정) | ✅ 성공 | **push(`c895917`, 두 브랜치 HEAD 일치 확인) + 정정 4건.** DB 재확인(Cowork 조회를 독립 재검증) — `fetched_at` 12시대 404행+22시대 723행 · 22시대 669/723(92.5%)이 `fiscal_year=2024` · `revdcf_results as_of=2026-08-08` 604행 `flags.yearWindow` 0건 · `as_of=2026-08-09` 0행 · `vercel.json` 크론 `"45 22 * * *"`. **정정①** 스냅샷 원인 = 유니버스확장 아니라 정규크론 1회분(CHANGELOG 119·STEP_LEDGER 951부속 행 갱신). **정정②** 새 창 첫 실행일 = `2026-08-09 22:45 UTC`(=`2026-08-10 07:45 KST`), `as_of='2026-08-09'`로 쓰임 — `2026-08-09 07:45 KST` 크론은 배포 전이라 옛코드 실행 확정(STATE.md·REVDCF_SPEC.md·VALUATION_SPEC.md 3곳 갱신). **정정③** 「3일 순환」 철회 지시받아 실측 기록(하루 증가 약 124건, 5,497 전량까지 약 35일 추정, VALUATION_SPEC.md에 추가) — 🔴 **당시 "4개 문서 전수 grep 결과 문구 자체가 존재하지 않았다"고 적었으나 이 판정 자체가 오류였다**(다음 STEP 951 검수 정정에서 `LENS_COMPLETION_STANDARD.md:104`에 실재함이 발견됨 — grep 범위를 4개로 좁힌 게 결함, "전수"가 아니었다). 처방 후보 2개는 판정 없이 기록만(격일/주간 전환·크론예산 여유 확인). 코드·DB 무변경. CHANGELOG (120) |
| 951(검수정정) | ✅ 성공 | **Cowork 3중 검수 6건 반영, 그중 2건은 이전 STEP 자체의 오류로 확인.** ① `LENS_COMPLETION_STANDARD.md:104`에 "3일 순환 완료 후" 실재 확인 — 951부속(120)의 "4개 문서 전수 grep, 문구 없음" 판정이 틀렸다(grep 범위를 미리 좁혀놓고 "전수"라 부름). 해당 줄 정정 + VALUATION_SPEC·CHANGELOG(120)·STEP_LEDGER 951부속 행에 재정정 삽입(원 서술 보존, 정정만 추가). ② CHANGELOG(118)의 강도해석 문구를 라벨전이 건수(들어옴5/나감1)로 교체 — docs/*.md 전체 재grep, 해당 강도해석 문구 잔존 0건. ③ STATE.md "6개→8개" 수정, ⑧(순증 실측 갱신) 추가. ④ 유니버스 자기참조 중복등재 정리 — 951보강②(118)가 "신규 발견"으로 올린 게 실은 STATE 00-3(2026-08-07) 기존 문제, 새 항목 삭제하고 00-3에 증거만 추가(CHANGELOG 118·STEP_LEDGER 951보강② 행도 정정) + 교훈 1줄(규칙⓪-5 문서판). ⑤ STATE 00-d 신설 — 정규크론 응답 미저장이 예산 미측정의 근본원인(판정 없음, 처방후보 3개). ⑥ 로컬 `revdcf-preview`(278f58e, 원격보다 165커밋 뒤)를 `git fetch`+`git branch -f`로 원격(`aad9416`) 정렬 — main 체크아웃·작업트리 무변경. 원인 = main에서 원격 revdcf-preview로 직접 push하고 로컬 브랜치는 갱신 안 한 패턴 반복. ⑦ NVDA 회계연도 라벨(fiscal_year=2025 vs NVDA 자체 FY2026, 표시문구 판정대기)을 VALUATION_SPEC 미해결6번·STATE에도 등재(기존 LENS_COMPLETION_STANDARD 한 곳뿐이었음). 코드·DB 무변경. CHANGELOG (121) |
| 952 | ✅ 성공 | **Q1 ②단계 준비 — 섹터 커버리지 확장(us_valuation 1,127종목) + 「업종 대비」 정의 고정(장은태 판정).** §1 `resolveSector()`(무수정) 재호출 실측: spdr402·damodaran601·sibling5·yahoo29·미분류90(Q0 1,021기준 498/311/5/207/0과 대비) — 🔴 야후 tier는 us_sector_yahoo 사전테이블 조회이지 라이브 API 아님, resolveSector 외부호출 0건 확인(1,4 중단조건 해당없음 확정). §2 `us_sector_wide` 신규(마이그레이션·RLS=us_sector_resolved와 동일 확인)·`toResolvedRows()`(무수정) 재사용해 1,127행 적재 — 행수 일치·미분류90·us_sector_resolved 교차대조 640종목 불일치 0건. 🔴 두 유니버스는 부분집합 아님(파이프라인이 다름, 원인 미조사). §3 `lib/sectorRelative.ts` 신설(순수함수) — `SECTOR_RELATIVE_SPEC`(정의 유일출처)·백분위=count(v<target)/n_valid. 🔴 `pctile()` 그대로 재사용 안 함(값→백분위·백분위→값은 수학적 역함수라 분모가 다름 — 재사용하면 정의문장과 동작이 어긋남, 의도적 이탈 명시). `sectorRelative.test.ts` 손계산 4케이스(동점·표본1개·전부결측·음수혼재) 전부 통과. §3-3 업종11×축4 유효표본표 산출(최소=Real Estate EV/EBITDA 4건), Q0선례(sector_cuts 78중7제외) 병기 — minSample 숫자는 고르지 않음, 판정대기. §4 VALUATION_SPEC.md("범위밖"절→"정의공개표"절 전환)·STATE.md 갱신. §5 검증: test 305/305(신규4)·tscclean·build clean·화면경로 diff 0·us_sector_resolved 1,021 불변 재확인. **화면 무변경·크론 미호출·KR 미접촉.** CHANGELOG (122) |
| 952(보강) | ✅ 성공 | **미분류 90건 원인 실측 — Cowork 수치를 독립 재검증해 정정.** damodaran_industry 매칭 "53건(58.9%)"→재검증 **29건(32.2%)**(원인=ticker_norm 중복매핑으로 raw JOIN행수 54가 부풀려짐, 서로 다른 심볼 기준 29). is_us_listed=true 행 보유는 1건뿐(RAYA)인데 그조차 여전히 미분류 — resolveSector tier-1 원인 미규명. us_sector_nasdaq "88건(97.8%)"→재검증 **원시존재90(100%)·GICS매핑가능79(87.8%)**, 둘 다 원수치와 다름. us_cik_map 90건(100%)은 일치. 90종목 모집단·사전순표본20은 재현 확인(신뢰 근거). `docs/probe_952b_unclassified.json` 신규(원보고·재검증값 병기). STATE.md 판정후보 2건(ⓐdamodaran tier조사 — Q0 100%커버리지 주장 재검토 필요성 포함·ⓑ나스닥5순위, ⓐ먼저) 등재, 판정 없음. 🔴 명령서 결함 1건 기록(오늘 세번째) — §3-2 "pctile 재사용" 지시가 값→백분위·백분위→값 역함수 관계라 수학적으로 불가능, 952 본STEP의 이탈이 옳았음을 재확인. 코드·DB 무변경. CHANGELOG (123) |
| 952b | ✅ 성공 | **damodaran tier 누락 원인 규명 — 원래 가설(ticker_norm 중복=RAYA형) 틀렸고 더 큰 버그(fetchAll 페이지네이션 비결정성) 발견.** §1 RAYA damodaran_industry 3행 전수(TSX RAY.A false·NasdaqCM RAYA **true**·CASE RAYA false) — us_sector_wide/us_valuation/us_cik_map 전부 심볼 'RAYA' 정확 저장, 정규화 문제 없음. §2 `resolveSector(sb,['RAYA'])` 단독은 항상 성공하나 `resolveSector(sb,[전체1127])` 재호출 시 두 연속 실행에서 RAYA가 한번은 미분류·한번은 분류로 갈림 — **동일 코드·동일 인자인데 결과가 다르다.** 원인 특정: `lib/sector.ts:64`(및:21) `fetchAll()`이 `.order()` 없이 `.range()`만 씀 — PostgreSQL이 ORDER BY 없는 쿼리 행순서 미보장. 결정적 실측: 5회 연속 `resolveSector()` 동일호출 — damodaran_industry(is_us_listed=true) COUNT(*)는 매번 6937(고정)인데 full.size는 1038/1038/**1032**/1038/1038로 흔들림(미분류 89/89/95/89/89), RAYA는 5회 전부 성공(RAYA 고유문제 아니라 매실행 무작위 6개 안팎이 빠지는 일반버그). §3 29건 = F(페이지네이션비결정성)1 + B(is_us_listed=false·설계대로제외)28 + C/D/E=0. §4 🔴 Q0 1,021의 source=yahoo 207건 중 5건(PTGX·TEAM·TIGO·WMS·WTRG)이 damodaran tier가 잡았어야 정상인데 yahoo로 내려간 흔적 — SPDR 494종목 정답지엔 없어 99.6%(492/494) 수치 영향여부 확인도반증도안됨. "미분류0·커버리지100%" 숫자는 오늘 재확인해도 참이나 tier배정 결정론성은 보장안됨 — **결론없음, Q0 마감 판정은 안건드림.** `docs/probe_952b_damodaran_tier.json` 신규(처방후보3개 판정없음·미측정4건)·`scripts/probe_952b_raya_trace.ts`·`probe_952b_raya_flaky.ts` 신규(DB읽기전용)·VALUATION_SPEC/STATE/LENS_COMPLETION_STANDARD(Q0행 각주, 판정불변) 갱신. 🔴 Cowork 조인중복 미차단(53→29, COUNT(*) vs COUNT(DISTINCT)) 실측결함 기록 — **오늘 네번째 측정오류.** lib/sector.ts 무수정·코드·DB 무변경·크론 미호출. CHANGELOG (124) |
| 953 | ✅ 성공 | **ORDER 없는 페이지네이션 31곳(재확인 30곳) 전수조사 — 실제로 흔들린 건 damodaran_industry 읽는 2곳뿐.** Cowork "31곳" 재검증(오늘 다섯번째 측정오류) — 실제 30곳(revdcf 8·search 1·lens-top 1·Perf.ts 5, 각각 원 카운트와 다름). 등급: A(유니버스선정)6·B(집계통계)6·C(화면목록)6·D(단일페이지)8·order있어제외5. 10회 반복실측 9곳 — **damodaran_industry 읽는 `lib/sector.ts:21·64`만 흔들림**(6937→6819 1회·1038→1029 1회), 같은 A등급 revdcf 3곳+search(us_cik_map 10,432행 포함)·B등급 4곳은 10회 전부 안정 — "모든 order-less가 위험" 가정 기각. EXPLAIN 확인 — Index Scan(파라렐/시퀀셜 아님), 정확한 메커니즘은 미확정(인과 단정 안 함). §3 기존 미해결 3건 검증: STEP949(us_market_cap 380건, 00-c)=**설명안됨**(STOCK_SYMS는 data/us_symbols.json 파일기반, DB무관 확인) · STEP952b(revdcf 5종목 미편입, 00-3)=**설명안됨**(그 읽기 자체 604<1000 단일페이지, 8일치 CIK집합 완전무변동 재확인) · STATE00(lens_cuts US정지)=**알수없음**(lensPrecompute 직접경로엔 관련읽기 없음, 933~937 전체체인은 미재검증). 처방후보4개 판정없음(고르지 않음), KR계열 전부 동결. `docs/probe_953_pagination.json` 신규·`scripts/probe_953_pagination_repeat.ts` 신규(DB읽기전용)·STATE.md(00-e신설+00-c·00-3·00번 교차참조)·SYSTEM_MAP.md(§10 함정 등재) 갱신. 코드·DB 무변경, 크론 미호출, 처방 미결정. CHANGELOG (125) |
| 954 | ✅ 성공 | **페이지네이션 비결정성 처방 적용(장은태 위임→Cowork 선택: ②공용헬퍼+③실측지점만) — fetchAllRows 신설, lib/sector.ts 2곳만 이관.** §1 `lib/supabasePaging.ts` 신설 — `fetchAllRows(build,orderBy,pageSize=1000)`, orderBy 필수인자(기본값없음)·빈배열 즉시throw·에러 미삼킴·재시도없음. 테스트 5건 통과. §2 `fetchSectorMap` 직접루프 + 옛 로컬 `fetchAll()`(완전삭제, 내부호출부 4개 전부 이관: damodaran/nasdaq/yahoo/gics). 정렬키 — damodaran_industry: UNIQUE(as_of,exchange,ticker) 확인(Cowork 확정사실 재확인) → (exchange,ticker)(as_of는 현재단일값, 늘면 고유전순서 아님을 명시). nasdaq/yahoo/gics: UNIQUE(as_of,symbol) **이 STEP에서 신규확인** → 각 fetch가 이미 as_of필터라 symbol 하나로 충분. 🔴 판정로직(tier순서·형제매칭·crossCheck) diff=0 직접확인. §3 검증 — damodaran_industry(fetchAllRows) **20회반복 20/20 정확히 6937**(처방성공) · resolveSector() **5회반복 미분류 89/89/89/89/89 완전고정**(953의 89/89/95/89/89 흔들림 해소) · **재현가능 최종 미분류=89**(952의 "90"은 흔들리는 값 중 하나였음). §4 잔여28곳 대장(`docs/probe_954_paging_backlog.json`, 우선순위없음) — 🔴 advisor_directory에 PK·UNIQUE 전혀없음(별도 무결성 문제로 등재, 처방없음), 라이브화면경로 10곳·KR동결 5곳·이미안전 1곳(lensPrecompute:277). §5 SYSTEM_MAP.md(아키텍처원칙 신설)·STATE.md(00-e "조사완료"→"처방적용+대장작성") 갱신. 🔴 damodaran이 왜 유독 불안정했는지는 여전히 미확정(증상만 제거) 명시. test 310/310(신규5)·tsc clean·build clean·화면diff 0(app/components/messages/vercel.json/.github/data 전부)·us_sector_resolved 1,021·us_sector_wide 1,127 불변재확인. **화면 무변경·DB쓰기 0·크론 미호출·KR 미접촉.** CHANGELOG (126) |

## 이 구간 집계

- ✅ 기록됨 — **99건**
- ✅ 성공 — **8건**
- 🟡 부분 — **1건**
- ⬜ 미실행 — **1건**
- 🔴 기록없음 — **7건**
- 🟡 범위압축 — **24건**
- 🟡 언급만 — **1건**
- 합계 — **141건**

### 🔴 즉시 눈에 띄는 것
- **837 ⬜ 미실행** — 명령서를 다 써놓고 실행하지 않았고, 하필 그 자리가 **역DCF 방향 전환 지점**이라 경위 복원이 불가능하다. 이 사례가 규칙 ⓐ의 "미실행도 결과다"를 만든 근거다.
- **🟡 범위압축 24건** — 전부 808~828 구간. `CHANGELOG.md:2868`이 *"STATE·CHANGELOG가 807에 멈춰 있던 것"*이라 자백한 그 공백이다. 규칙 ⓒ "몰아서 하지 말 것"이 여기서 깨졌다.
- **🔴 기록없음 7건 (800~805 · 886)** — 실행됐는지조차 확인 안 됨. 🔴 **886은 `docs/COMMIT_GATES.md`를 신설했다고 플레이북이 인용하므로 실행은 된 것으로 보이나, CHANGELOG 엔트리가 없다.** 확정 필요.
