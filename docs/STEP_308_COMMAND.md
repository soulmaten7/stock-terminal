<!-- 2026-06-20 -->
# STEP 308 — [V7 ④-11] 자가등록 목록 합류 (UNION 표시)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_308_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 307. 빌드 ✓.
- **사전 작업(완료, DB 직접)**: `advisor_directory` 뷰를 **fss_advisors ∪ room_submissions** 로 UNION + `source`('fss'/'user')·`intro` 컬럼 추가. (현재 fss 1,738 / user 0)

---

## 🎯 목표

자가등록(`room_submissions`) 리딩방을 디렉토리 목록에 **같이 표시**.
- 검색·플랫폼탭·정렬·좋아요·신고·미리보기 = 뷰 UNION 덕분에 **자동 포함**.
- **금감원 등록 ✅ 배지는 source='fss'에만.** 자가등록(source='user')은 **중립 "이용자 등록" 표시**(✅도 ⚠️도 아님 — 낙인 X). 미리보기엔 운영 업체·소개.

> 파일 2곳: `/api/advisors`(source·intro 추가) + `AdvisorDirectory`(배지 조건부 + 미리보기 분기).

---

## 📄 파일 1 — `app/api/advisors/route.ts` (select에 source·intro)

**찾기:**
```tsx
    .select("biz_no, company_name, info_name, representative, valid_from, valid_to, homepage, phone, address, like_count, report_count, platform", { count: "exact" });
```
**바꾸기:**
```tsx
    .select("biz_no, company_name, info_name, representative, valid_from, valid_to, homepage, phone, address, like_count, report_count, platform, source, intro", { count: "exact" });
```

---

## 📄 파일 2 — `components/toolbox/AdvisorDirectory.tsx` (3곳)

### (2-A) Advisor 타입에 source·intro
**찾기:**
```tsx
  like_count: number;
  report_count: number;
  platform: string;
  liked: boolean;
};
```
**바꾸기:**
```tsx
  like_count: number;
  report_count: number;
  platform: string;
  source: string;
  intro: string | null;
  liked: boolean;
};
```

### (2-B) PreviewBody — source 분기(배지·정보란)
**찾기:**
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
```
**바꾸기:**
```tsx
  const ic = faviconFor(a.platform, a.homepage);
  const roomName = roomNameOf(a);
  const isFss = a.source === 'fss';
  const rows: [string, string | null][] = isFss
    ? [
        ['등록업체', a.company_name],
        ['대표', a.representative],
        ['주소', a.address],
        ['신고기간', `${a.valid_from ?? '—'} ~ ${a.valid_to ?? '—'}`],
      ]
    : [
        ['운영 업체', a.company_name],
        ['소개', a.intro],
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
      {isFss ? (
        <div className="mb-3 inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
          <ShieldCheck size={12} /> 금감원 등록 · {platformLabel(a.platform)}
        </div>
      ) : (
        <div className="mb-3 inline-flex items-center gap-1 rounded border border-unjong-border bg-unjong-background px-2 py-0.5 text-[11px] font-medium text-unjong-muted">
          이용자 등록 · {platformLabel(a.platform)}
        </div>
      )}
      <dl className="space-y-1.5 text-xs">
```

### (2-C) 카드 행 — ✅ 배지는 source='fss'만
**찾기:**
```tsx
                      <ShieldCheck size={13} className="shrink-0 text-emerald-600" aria-label="금감원 등록" />
```
**바꾸기:**
```tsx
                      {a.source === 'fss' ? <ShieldCheck size={13} className="shrink-0 text-emerald-600" aria-label="금감원 등록" /> : null}
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러.

개발 서버(`npm run dev`, 포트 3333):
1. **로그인 후 "+ 리딩방 등록"** → 이름·플랫폼·링크 넣고 등록 → "접수되었습니다".
2. (등록 직후 새로고침 또는 탭 재진입) → 목록에 **그 리딩방이 합류**(플랫폼 탭/검색/정렬에 포함).
3. 자가등록 방 클릭 → 미리보기에 **"이용자 등록 · 플랫폼"**(✅ 없음) + 운영 업체·소개.
4. 금감원 신고 방은 그대로 **✅ 금감원 등록** 유지.

> 등록·좋아요·신고 다 실제로 눌러봐 — 내가 `room_submissions`·`room_likes`·`room_reports`에서 한 번에 확인해줄게.

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(v7): 자가등록 리딩방 디렉토리 합류(UNION 뷰 source/intro), 이용자 등록 중립 표시 (V7 ④-11, STEP 308)" && git push
```

---

> **한 줄 요약**: room_submissions를 advisor_directory 뷰에 UNION → 자가등록 방이 검색·정렬·좋아요·신고와 함께 목록에 합류. ✅금감원등록은 fss만, 자가등록은 '이용자 등록' 중립 표시.
