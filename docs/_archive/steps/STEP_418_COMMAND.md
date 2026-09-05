<!-- 2026-06-26 -->
# STEP 418 — 죽은 라우트 삭제 (us-quote · us-performance)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_418_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
호출처 0인 **고아 API 라우트 2개**를 삭제한다. 능동 버그는 없지만(아무도 호출 안 함) 크루프트라 정리.
- `app/api/yahoo/us-quote/route.ts` — STEP 411에서 lazy 제거되며 미사용.
- `app/api/yahoo/us-performance/route.ts` — STEP 408에서 `us-list`로 대체되며 미사용.

> 확인됨(grep): 두 경로 모두 코드 내 호출처 없음. `app/api/sec/route.ts`(옛것)는 `lib/api/sec.ts`(종목상세)가 쓰므로 **유지**.

## 전제
- 최신 main(STEP 417 이후). 배포 X(배치). 삭제만 → 빌드로 무영향 확인.

---

## 1단계 — 삭제 + 빌드 확인

```bash
git rm app/api/yahoo/us-quote/route.ts app/api/yahoo/us-performance/route.ts
# 혹시 남은 빈 디렉토리 정리(있으면)
rmdir app/api/yahoo/us-quote app/api/yahoo/us-performance 2>/dev/null || true
pkill -f "next dev" 2>/dev/null; npm run build
```
빌드가 성공해야 함(둘 다 import/호출처 0이라 타입 에러 없음). 만약 에러 나면 **삭제 취소**(`git checkout -- ...`) 후 보고.

## 2단계 — 커밋 (푸시·배포 X)
```bash
git commit -m "chore(STEP 418): 고아 라우트 삭제 — us-quote·us-performance(호출처 0)"
```

## 확인
- 빌드 통과(미사용이라 무영향). US 종목·상품(종목·ETF)·기간 정렬 등 모든 기능 그대로.
