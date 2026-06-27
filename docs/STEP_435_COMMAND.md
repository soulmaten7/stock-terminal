<!-- 2026-06-27 -->
# STEP 435 — [클레임 빌드] 입구 연결: '+리딩방 등록' → /business (옛 모달 제거)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_435_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
리딩방·검증 탭의 **'+리딩방 등록' 버튼**을 옛 모달(`RoomSubmitModal`) 대신 **새 `/business` 페이지로 이동**시킨다. 옛 모달 사용 제거(파일 자체는 남겨둠).

## 전제
- 최신 main + 클레임 빌드(미커밋). **`components/toolbox/AdvisorDirectory.tsx` 1파일**. 클라이언트 컴포넌트 → **HMR(재시작 불필요).** 커밋 보류.

---

## `components/toolbox/AdvisorDirectory.tsx` — 4곳

### (1) import 교체 (RoomSubmitModal → useRouter)
**찾기:**
```tsx
import RoomSubmitModal from './RoomSubmitModal';
```
**바꾸기:**
```tsx
import { useRouter } from 'next/navigation';
```

### (2) 상태 교체 (registering → router)
**찾기:**
```tsx
  const [registering, setRegistering] = useState(false);
```
**바꾸기:**
```tsx
  const router = useRouter();
```

### (3) 버튼 onClick — 2곳 모두 /business로 (동일 문자열이라 **둘 다** 교체)
**찾기 (2번 등장 — 모두 바꿔):**
```tsx
() => { if (!isLoggedIn) { setLoginNotice(true); return; } setRegistering(true); }
```
**바꾸기:**
```tsx
() => { if (!isLoggedIn) { setLoginNotice(true); return; } router.push('/business'); }
```

### (4) 옛 모달 렌더 제거
**찾기:**
```tsx
      {/* 내 리딩방 등록 모달 */}
      {registering ? <RoomSubmitModal onClose={() => setRegistering(false)} /> : null}
```
**바꾸기:** (빈 줄 — 위 두 줄 삭제)
```tsx

```

---

## 확인 (localhost, HMR)
- 리딩방·검증 탭 **'+리딩방 등록'** 클릭 → 옛 모달 X, **`/business` 페이지로 이동**(로그인 안 했으면 로그인 안내).
- `/business`에서 검색→인증 신청 정상.
- `RoomSubmitModal.tsx` 파일은 남아있어도 됨(미사용, 추후 정리).

## 빌드·커밋
- 보류. 확인 후 **클레임 빌드 전체(STEP 430~435 + 폴리시) 한 번에 커밋** 예정.
