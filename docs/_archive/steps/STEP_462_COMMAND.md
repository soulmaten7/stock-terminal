<!-- 2026-06-30 -->
# STEP 462 — 옛 자가등록 죽은코드 정리 + 약관 카피 갱신

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_462_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
옛 **자가등록(self-registration)** 흐름이 업체 **인증·클레임** 흐름으로 대체되며 남은 **orphan(아무 데서도 import/호출 안 됨)** 4개 삭제 + 약관·개인정보 카피의 옛 용어('자가등록'·'좋아요') 갱신.

## 전제
- 최신 main(HEAD `37d9676`). 사용처 추적 완료:
  - `RoomSubmitModal` = 자기 정의만(렌더·import 0)
  - `/api/rooms/submit` = RoomSubmitModal만 호출(죽음)
  - `AdminSubmissions` = 자기 정의만(import 0, STEP 436에서 admin 섹션 제거됨)
  - `/api/admin/submissions` = AdminSubmissions만 호출(죽음)
- 파일 삭제 4 + 카피 수정 3. **라우트 삭제 → 클린 재시작.**

---

## (1) 죽은 파일 4개 삭제
```bash
cd ~/stock-terminal
rm -f components/toolbox/RoomSubmitModal.tsx
rm -f app/api/rooms/submit/route.ts
rm -f components/admin/AdminSubmissions.tsx
rm -f app/api/admin/submissions/route.ts
# 빈 디렉토리 정리(있으면)
rmdir app/api/rooms/submit 2>/dev/null; rmdir app/api/rooms 2>/dev/null
rmdir app/api/admin/submissions 2>/dev/null
```

---

## (2) `app/terms/page.tsx` — 옛 용어 갱신
찾기:
```tsx
      "리딩방·유사투자자문 검증 디렉토리, 이용자 신고·자가등록·좋아요 등의 기능을 제공합니다.",
```
바꾸기:
```tsx
      "리딩방·유사투자자문 검증 디렉토리, 이용자 신고·업체 인증(게재)·즐겨찾기 등의 기능을 제공합니다.",
```

---

## (3) `app/privacy/page.tsx` — 옛 용어 갱신 (2곳)

(3-1) 찾기:
```tsx
      "서비스 이용 과정에서 생성: 닉네임, 즐겨찾기·좋아요 내역, 리딩방 신고·자가등록 내역, 접속 로그·쿠키.",
```
바꾸기:
```tsx
      "서비스 이용 과정에서 생성: 닉네임, 즐겨찾기 내역, 리딩방 신고·업체 인증 내역, 접속 로그·쿠키.",
```

(3-2) 찾기:
```tsx
      "리딩방 신고·자가등록의 접수·검토·처리 및 부정·악용 방지.",
```
바꾸기:
```tsx
      "리딩방 신고·업체 인증의 접수·검토·처리 및 부정·악용 방지.",
```

---

## 확인 (라우트 삭제 → 클린 재시작)
```bash
pkill -f "next dev"; rm -rf .next; npm run dev
```
- `npm run build` 에러 없음(삭제한 파일 import하던 곳 없으니 깨질 게 없음).
- `/terms`·`/privacy`에 '자가등록'·'좋아요' 문구 사라지고 '업체 인증'·'즐겨찾기'로 바뀜.
- 리딩방·검증/관리자 기능 정상(삭제분은 이미 안 쓰이던 거라 영향 0).

> `room_submissions` 테이블은 코드가 아니라 DB라 여기서 안 건드림 — Cowork이 MCP로 비어있는지 확인 후 별도 정리.

## 빌드·커밋
- 보류. 확인 후 커밋.
