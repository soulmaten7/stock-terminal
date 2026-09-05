<!-- 2026-06-28 -->
# STEP 448 — 미리보기 플랫폼 아이콘 위치 이동 (헤더 → 채널명 앞)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_448_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
미리보기에서 플랫폼 파비콘 아이콘(유튜브·텔레그램 등)을 **등록업체명(법인) 앞** → **채널명 앞**으로 이동. 법인이 아니라 채널의 속성이므로.

## 전제
- 최신 main + STEP 447. **`components/toolbox/AdvisorDirectory.tsx`(PreviewBody) 1파일**. 클라이언트 컴포넌트 → **HMR(재시작 불필요).**

---

## (1) 헤더 — 아이콘 제거 (등록업체명만)
**찾기:**
```tsx
      <div className="mb-2 flex items-center gap-2">
        {ic ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ic} alt="" width={20} height={20} className="h-5 w-5 rounded" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
        ) : <Globe size={18} className="text-unjong-muted" />}
        <h3 className="min-w-0 flex-1 truncate text-sm font-bold text-unjong-primary">{isFss ? a.company_name : roomName}</h3>
```
**바꾸기:**
```tsx
      <div className="mb-2 flex items-center gap-2">
        <h3 className="min-w-0 flex-1 truncate text-sm font-bold text-unjong-primary">{isFss ? a.company_name : roomName}</h3>
```

## (2) 채널명 줄 — 아이콘 앞에 추가
**찾기:**
```tsx
        {isFss && channelOf(a) ? (
          <span className="min-w-0 truncate text-unjong-muted">{channelOf(a)}</span>
        ) : <span />}
```
**바꾸기:**
```tsx
        {isFss && channelOf(a) ? (
          <span className="flex min-w-0 items-center gap-1.5 text-unjong-muted">
            {ic ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ic} alt="" width={16} height={16} className="h-4 w-4 shrink-0 rounded" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
            ) : <Globe size={14} className="shrink-0 text-unjong-muted" />}
            <span className="truncate">{channelOf(a)}</span>
          </span>
        ) : <span />}
```

---

## 확인 (localhost, HMR)
- 미리보기 헤더: **등록업체명만**(앞 아이콘 없음) + ⭐.
- 채널명 줄: **[플랫폼 아이콘] 채널명 ……… 🚨 신고 N** (아이콘이 채널명 앞으로).
- 예: "주식의원리 파트너스" 헤더엔 아이콘 X, 아래 "확률높은 관심종목" 앞에 유튜브 아이콘.
- 빌드 에러 없음(ic는 채널명 줄에서 계속 사용).

## 빌드·커밋
- 보류. 확인 후 STEP 444~448 묶어 커밋.
