<!-- 2026-06-27 -->
# STEP 436 — /admin에서 죽은 '자가등록' 섹션 제거 (새 클레임으로 대체됨)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_436_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
'+리딩방 등록' 입구가 /business(새 클레임)로 바뀌면서 **옛 자가등록(`room_submissions`)은 더 이상 안 쓰임.** /admin의 '📝 자가등록' 섹션 제거 — '🛡 업체 인증 신청'이 대체. (옛 스택 `RoomSubmitModal`·`room_submissions`·`/api/rooms/submit`·`/api/admin/submissions`·`AdminSubmissions.tsx`는 추후 일괄 정리 STEP에서 삭제 — 지금은 admin 화면만 정리.)

## 전제
- 최신 main. **`app/admin/page.tsx` 1파일**. 서버 컴포넌트 → Fast Refresh. 커밋 보류.

---

## `app/admin/page.tsx` — 5곳

### (1) AdminSubmissions import 제거
**찾기:**
```tsx
import AdminSubmissions from '@/components/admin/AdminSubmissions';
import AdminBusinessClaims from '@/components/admin/AdminBusinessClaims';
```
**바꾸기:**
```tsx
import AdminBusinessClaims from '@/components/admin/AdminBusinessClaims';
```

### (2) Submission 타입 제거
**찾기:**
```tsx
type Submission = { id: number; room_name: string; company_name: string | null; platform: string; homepage: string; fss_matched: boolean; status: string; created_at: string };
```
**바꾸기:** (이 줄 삭제 — 빈 줄로)
```tsx

```

### (3) subs fetch 제거
**찾기:**
```tsx
  const { data: subsData } = await admin.from('room_submissions').select('*').order('created_at', { ascending: false }).limit(1000);
  const reports = (reportsData ?? []) as Report[];
  const subs = (subsData ?? []) as Submission[];
```
**바꾸기:**
```tsx
  const reports = (reportsData ?? []) as Report[];
```

### (4) 부제목 문구 정리
**찾기:**
```tsx
      <p className="mb-8 mt-1 text-sm text-unjong-muted">신고·자가등록 접수 현황 · 최신순</p>
```
**바꾸기:**
```tsx
      <p className="mb-8 mt-1 text-sm text-unjong-muted">신고·업체 인증 신청 현황 · 최신순</p>
```

### (5) 자가등록 섹션 제거
**찾기:**
```tsx
      {/* 자가등록 */}
      <section className="mb-12">
        <h2 className="mb-3 text-base font-bold text-unjong-primary">📝 자가등록 ({subs.length}) · 대기는 승인해야 공개</h2>
        <AdminSubmissions initial={subs} />
      </section>

      {/* 업체 인증 신청(클레임) */}
```
**바꾸기:**
```tsx
      {/* 업체 인증 신청(클레임) */}
```

---

## 확인
- `/admin` → 섹션이 **🚨 신고 / 🛡 업체 인증 신청** 둘만(자가등록 사라짐).
- 빌드 에러 없음(Submission·subs·AdminSubmissions 참조 모두 제거됨).
- 커밋 보류 — 클레임 빌드 묶음에 같이.
