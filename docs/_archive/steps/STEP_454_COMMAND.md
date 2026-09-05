<!-- 2026-06-28 -->
# STEP 454 — 네비 용어 통일: "리딩방 등록·관리" (제목·탭)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_454_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
디렉토리 버튼("리딩방 등록·관리")과 통일:
- `/business` 제목 **"업체 인증·관리" → "리딩방 등록·관리"**
- 탭 **"업체 인증 → 리딩방 등록"**, **"내 업체 관리 → 내 리딩방 관리"**
- (업체·유사투자자문 신고 등 정확한 용어는 카드 안쪽 내용에 그대로 — 네비=리딩방 / 내용=정확한 용어)

## 전제
- 최신 main(STEP 453). 파일 3개, 클라이언트/서버 페이지 → **HMR/Fast Refresh**.

---

## (1) `app/business/page.tsx` — 제목 2곳
### (1-a) metadata
**찾기:**
```tsx
export const metadata = { title: "업체 인증·관리 — 트릴리언" };
```
**바꾸기:**
```tsx
export const metadata = { title: "리딩방 등록·관리 — 트릴리언" };
```
### (1-b) h1
**찾기:**
```tsx
      <h1 className="mb-1 text-xl font-bold text-unjong-primary">업체 인증·관리</h1>
```
**바꾸기:**
```tsx
      <h1 className="mb-1 text-xl font-bold text-unjong-primary">리딩방 등록·관리</h1>
```

---

## (2) `components/business/BusinessHub.tsx` — 탭 라벨 2곳
**찾기:**
```tsx
    { key: 'claim', label: '업체 인증', icon: <ShieldCheck size={16} /> },
    { key: 'manage', label: '내 업체 관리', icon: <Store size={16} /> },
```
**바꾸기:**
```tsx
    { key: 'claim', label: '리딩방 등록', icon: <ShieldCheck size={16} /> },
    { key: 'manage', label: '내 리딩방 관리', icon: <Store size={16} /> },
```

---

## (3) `components/business/MyBusinessClient.tsx` — 빈 상태 안내
**찾기:**
```tsx
        <p className="text-sm text-unjong-muted">아직 인증한 업체가 없어요. 위 <b className="text-unjong-primary">업체 인증</b> 탭에서 본인 업체를 찾아 인증하세요.</p>
```
**바꾸기:**
```tsx
        <p className="text-sm text-unjong-muted">아직 인증한 업체가 없어요. 위 <b className="text-unjong-primary">리딩방 등록</b> 탭에서 본인 업체를 찾아 인증하세요.</p>
```

---

## 확인 (localhost, HMR — 새로고침)
- 디렉토리 버튼 **"리딩방 등록·관리"** → 클릭 → `/business` 제목도 **"리딩방 등록·관리"** (일치).
- 탭 = **[리딩방 등록 | 내 리딩방 관리]**.
- 카드 안쪽은 "유사투자자문 신고·등록업체·대표·사업자번호" 등 정확한 용어 그대로.
- 빌드 에러 없음.

## 빌드·커밋
- 보류. 확인 후 STEP 451~454 묶어 커밋(또는 단독).
