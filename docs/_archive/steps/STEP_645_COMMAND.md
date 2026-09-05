<!-- 2026-07-07 -->
# STEP 645 — 매매처 정적→DB 배선 (완전성 룰 청산 ①)

> **문제(정찰 결과)**: 매매처가 정적 `lib/brokers.ts`(KR 20곳)를 6개국 탭 전부가 재사용 → 화면이 DB와 무관하게 정적. **근데 `brokers` 테이블은 이미 존재**하고 KR 20·US 17·JP 13·VN 13·GB 12 = 5개 region 데이터가 들어있음(MCP로 생성돼 마이그레이션엔 없음). **문제는 컴포넌트가 테이블을 안 읽는 '배선 누락'.**
>
> **설계(플레이북 §4-3 재확인)**: 매매처 = **언어권(사용자 지역) 기준.** 한국어 유저는 미국·일본 탭을 봐도 한국 증권사로 매매 → 지금은 한국어 전용이라 **region=KR 고정이 맞음**(일본탭에 한국 증권사 = 버그 아님·의도된 설계). 미완이던 건 "정적→DB 이관/배선"뿐.
>
> **해결(Cowork이 이미 함, tsc EXIT=0)**:
> - `app/api/brokers/route.ts` (신규): `GET ?region=KR` → `brokers` 테이블 조회(admin·하루 캐시).
> - `components/toolbox/BrokerRanking.tsx`: 정적 import → **테이블 조회(region=KR)**로 전환. 정적 `lib/brokers.ts`는 **폴백**(fetch 실패 시). 언어 스위처 생기면 `region` prop만 바꾸면 됨.
>
> **효과**: 화면은 한국 증권사 20곳 그대로(정적→DB). US/JP/VN/GB는 테이블에 대기(언어권 확장 시 사용). CN만 없음(중국어판 만들 때 필요·현재 불필요).
>
> **전제**: STEP 644(`1f0cd41`) 이후. **빌드 + 커밋만.**

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error|/api/brokers" | head -10
```
- ✅ 기대: `Compiled successfully`.

## 1) 변경 확인
```bash
cd ~/stock-terminal && git status --short | grep -E "api/brokers|BrokerRanking"
```
- 기대: `?? app/api/brokers/route.ts` · `M components/toolbox/BrokerRanking.tsx`

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add app/api/brokers/route.ts components/toolbox/BrokerRanking.tsx docs/STEP_645_COMMAND.md && git commit -m "fix(brokers): 매매처 정적→DB 배선 — brokers 테이블 region=KR 조회(정적 폴백)·언어권 기준 설계" && git push
```

## 3) (배포 후) Cowork 라이브 검증
- `/api/brokers?region=KR` → 20곳 JSON · 홈 KR 탭 매매처 = 키움~DB증권 그대로(정적→DB 무결성).

## ✅ 완료 시 → 완전성 룰 청산 ①(매매처) 끝 → 다음 ②: JP/CN/VN/GB 공시 R1(대체 소스).
