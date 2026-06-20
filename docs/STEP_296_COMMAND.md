<!-- 2026-06-20 -->
# STEP 296 — [V7 ④-9] 만료 자동숨김 + 검색 문구 정리

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_296_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 295. 빌드 ✓.
- **사전 작업(완료, DB 직접)**: `advisor_directory` 뷰에 `valid_to >= 오늘` 필터 추가 → **신고 만료 업체는 목록·카운트에서 자동 제외**. (코드 변경 없음, 자동 적용)

---

## 🎯 목표

검색창 placeholder에서 **"(등록 여부 확인)"** 제거. 앞으로 자가등록으로 **미등록 방도 올라올** 예정이라, "등록 여부 확인"이라는 문구가 안 맞음.

> `AdvisorDirectory.tsx` 검색 input 1줄.

---

## 📄 `components/toolbox/AdvisorDirectory.tsx`

**찾기:**
```tsx
          placeholder="리딩방명·업체명·대표자 전체 검색 (등록 여부 확인)"
```
**바꾸기:**
```tsx
          placeholder="리딩방명·업체명·대표자 전체 검색"
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러.

개발 서버: 리딩방·검증 탭 검색창 placeholder가 **"리딩방명·업체명·대표자 전체 검색"** (괄호 문구 사라짐).

> 만료 숨김은 DB 뷰에서 이미 적용됨 — 지금은 만료 0건이라 화면 동일, 추후 만료되면 자동으로 빠짐.

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(v7): 리딩방 만료 자동숨김(뷰 valid_to 필터) + 검색문구 '(등록여부 확인)' 제거 (STEP 296)" && git push
```

---

> **한 줄 요약**: 신고 만료 업체 자동 숨김(DB 뷰 필터 완료), 검색 placeholder에서 '(등록 여부 확인)' 제거.
