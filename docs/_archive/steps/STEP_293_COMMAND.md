<!-- 2026-06-20 -->
# STEP 293 — [V7 ④-6] 미리보기: 대표를 업체명 바로 밑으로

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_293_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 292(`174be41`). 빌드 ✓.

---

## 🎯 목표

미리보기 패널에서 **대표**를 업체명 바로 아래(부제)로 옮김. (현재는 금감원 뱃지 밑 목록 안) → 이름+대표가 한 묶음으로 자연스럽게.

> `AdvisorDirectory.tsx`의 `PreviewBody` 한 군데만 수정.

---

## 📄 `components/toolbox/AdvisorDirectory.tsx` (PreviewBody)

**찾기:**
```tsx
      <div className="mb-2 flex items-center gap-2">
        {ic ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ic} alt="" width={20} height={20} className="h-5 w-5 rounded" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
        ) : <Globe size={18} className="text-unjong-muted" />}
        <h3 className="min-w-0 flex-1 truncate text-sm font-bold text-unjong-primary">{a.company_name}</h3>
      </div>
      <div className="mb-3 inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
        <ShieldCheck size={12} /> 금감원 등록 · {platformLabel(a.platform)}
      </div>
      <dl className="space-y-1.5 text-xs">
        {[['대표', a.representative], ['주소', a.address], ['신고기간', `${a.valid_from ?? '—'} ~ ${a.valid_to ?? '—'}`], ['연락처', a.phone]].map(([k, v]) => (
```
**바꾸기:**
```tsx
      <div className="mb-1 flex items-center gap-2">
        {ic ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ic} alt="" width={20} height={20} className="h-5 w-5 rounded" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
        ) : <Globe size={18} className="text-unjong-muted" />}
        <h3 className="min-w-0 flex-1 truncate text-sm font-bold text-unjong-primary">{a.company_name}</h3>
      </div>
      <p className="mb-2 text-xs text-unjong-muted">대표 {a.representative ?? '—'}</p>
      <div className="mb-3 inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
        <ShieldCheck size={12} /> 금감원 등록 · {platformLabel(a.platform)}
      </div>
      <dl className="space-y-1.5 text-xs">
        {[['주소', a.address], ['신고기간', `${a.valid_from ?? '—'} ~ ${a.valid_to ?? '—'}`], ['연락처', a.phone]].map(([k, v]) => (
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러.

개발 서버: 리딩방·검증 탭 → 행 클릭 → 미리보기에서 **업체명 바로 밑에 "대표 ○○○"**, 그 아래 금감원 뱃지 → 주소·신고기간·연락처.

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(v7): 리딩방 미리보기 대표를 업체명 바로 밑으로 (STEP 293)" && git push
```

---

> **한 줄 요약**: 미리보기에서 대표를 업체명 바로 아래 부제로 이동 (목록에선 제거).
