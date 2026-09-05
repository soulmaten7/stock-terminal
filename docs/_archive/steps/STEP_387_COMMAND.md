<!-- 2026-06-24 -->
# STEP 387 — [🔴 보안] 미사용·무인증 리딩방 verify 라우트 삭제

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_387_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표 (보안)
`app/api/rooms/[id]/verify/route.ts` — **인증 게이팅 없이**(`// TODO(auth)` 주석 그대로) **admin 클라이언트(service-role = RLS 우회)**로 리딩방을 '금감원 검증됨'으로 마킹함. 누구나 이 엔드포인트를 직접 호출하면 **가짜 검증을 박을 수 있음** → 신뢰가 핵심인 플랫폼에 치명적. **UI에서 호출 0건(미사용).** → 라우트 삭제(검증 기능은 나중에 만들 때 인증 붙여 새로).

---

## ① 안전 확인 + 삭제
```bash
cd ~/stock-terminal
# verify 엔드포인트를 호출하는 코드가 없는지 (0이어야 안전)
grep -rn "/verify" app components --include=*.ts --include=*.tsx 2>/dev/null | grep -iE "fetch\(|api/rooms" || echo "✅ verify 호출처 0 — 삭제 안전"
# app/api/rooms/[id] 하위엔 verify 라우트뿐 → 통째 삭제
git rm -r "app/api/rooms/[id]"
```

## ② 빌드 + 커밋
```bash
cd ~/stock-terminal && npm run build
```
- ✅ 무에러 → 커밋.
- ❌ `Cannot find module` 등 → 멈추고 알려줘(라우트라 import될 일 없지만 만약 대비).

```bash
cd ~/stock-terminal && git add -A && git commit -m "security: 미사용·무인증 리딩방 verify 라우트 삭제(admin 클라 RLS 우회 차단) (STEP 387)" && git push
```

---

> **한 줄 요약**: 인증 없이 admin 권한으로 '검증됨' 마킹이 가능했던 **미사용 verify 라우트 삭제** → 보안 구멍 차단.
