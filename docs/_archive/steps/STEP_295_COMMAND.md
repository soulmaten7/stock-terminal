<!-- 2026-06-20 -->
# STEP 295 — [V7 ④-8] 미리보기 정보란 정리 (등록업체 항상 표시·대표 정보란·연락처 삭제)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_295_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 294. 빌드 ✓.

---

## 🎯 목표

미리보기 정보란을 **모든 카드가 일관되게**:
1. **등록업체 항상 표시** (= 업체명. 리딩방명 없는 61%는 제목과 동일하게 한 번 더).
2. **대표를 등록업체 바로 밑** 같은 정보란으로 (이름 밑 부제 제거).
3. **연락처 삭제** (개인 휴대폰 번호 = 개인정보).

> `AdvisorDirectory.tsx`의 `PreviewBody` 한 블록만 교체.

---

## 📄 `components/toolbox/AdvisorDirectory.tsx` (PreviewBody)

**찾기:**
```tsx
  const ic = faviconFor(a.platform, a.homepage);
  const roomName = roomNameOf(a);
  const showCompany = !!(a.info_name && a.info_name.trim() && a.info_name.trim() !== a.company_name);
  const rows: [string, string | null][] = [
    ...(showCompany ? [['등록업체', a.company_name] as [string, string | null]] : []),
    ['주소', a.address],
    ['신고기간', `${a.valid_from ?? '—'} ~ ${a.valid_to ?? '—'}`],
    ['연락처', a.phone],
  ];
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        {ic ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ic} alt="" width={20} height={20} className="h-5 w-5 rounded" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
        ) : <Globe size={18} className="text-unjong-muted" />}
        <h3 className="min-w-0 flex-1 truncate text-sm font-bold text-unjong-primary">{roomName}</h3>
      </div>
      <p className="mb-2 text-xs text-unjong-muted">대표 {a.representative ?? '—'}</p>
      <div className="mb-3 inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
        <ShieldCheck size={12} /> 금감원 등록 · {platformLabel(a.platform)}
      </div>
      <dl className="space-y-1.5 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <dt className="w-12 shrink-0 text-unjong-muted">{k}</dt>
            <dd className="min-w-0 flex-1 text-unjong-primary">{v || '—'}</dd>
          </div>
        ))}
      </dl>
```
**바꾸기:**
```tsx
  const ic = faviconFor(a.platform, a.homepage);
  const roomName = roomNameOf(a);
  const rows: [string, string | null][] = [
    ['등록업체', a.company_name],
    ['대표', a.representative],
    ['주소', a.address],
    ['신고기간', `${a.valid_from ?? '—'} ~ ${a.valid_to ?? '—'}`],
  ];
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        {ic ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ic} alt="" width={20} height={20} className="h-5 w-5 rounded" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
        ) : <Globe size={18} className="text-unjong-muted" />}
        <h3 className="min-w-0 flex-1 truncate text-sm font-bold text-unjong-primary">{roomName}</h3>
      </div>
      <div className="mb-3 inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
        <ShieldCheck size={12} /> 금감원 등록 · {platformLabel(a.platform)}
      </div>
      <dl className="space-y-1.5 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <dt className="w-14 shrink-0 text-unjong-muted">{k}</dt>
            <dd className="min-w-0 flex-1 text-unjong-primary">{v || '—'}</dd>
          </div>
        ))}
      </dl>
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러.

개발 서버: 리딩방·검증 탭 → 행 클릭 → 미리보기 정보란이 **등록업체 → 대표 → 주소 → 신고기간** 순서로 항상 4줄. **연락처 없음.** 리딩방명 없는 곳도 등록업체에 업체명이 동일하게 채워짐.

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(v7): 리딩방 미리보기 정보란 정리 - 등록업체 항상표시+대표 정보란이동+연락처 삭제 (STEP 295)" && git push
```

---

> **한 줄 요약**: 미리보기 정보란을 등록업체·대표·주소·신고기간 4줄로 항상 일관되게, 연락처(개인정보) 삭제.
