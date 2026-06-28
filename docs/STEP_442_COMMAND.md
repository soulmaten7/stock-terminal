<!-- 2026-06-28 -->
# STEP 442 — [리딩방 디렉토리 A] 플랫폼 탭 제거 + 등록업체명 우선(리딩방명 부제)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_442_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
1. **플랫폼 탭(전체/텔레그램/카카오톡/네이버/기타) 제거** → 전부 한 번에 표시.
2. **리스트 행**: 등록업체명(company_name) **메인** + 리딩방명(info_name) **작은 부제**.
3. **미리보기**: 헤더 = **등록업체명** + 리딩방명 부제, 중복되는 '등록업체' 행 제거(대표부터).

> 계층: 등록업체(주체) = 메인 / 리딩방명 = 부제 / 링크 = 부수. (OG 링크 프리뷰는 STEP B 별도.)

## 전제
- 최신 main (STEP 441까지). **`components/toolbox/AdvisorDirectory.tsx` 1파일**. 클라이언트 컴포넌트 → **HMR(재시작 불필요).** 커밋 보류.

---

## (1) PLATFORMS 상수 제거
**찾기:**
```ts
const PAGE_SIZE = 100;
const PLATFORMS = [['all', '전체'], ['telegram', '텔레그램'], ['kakao', '카카오톡'], ['naver', '네이버'], ['etc', '기타']] as const;
type PlatformKey = 'all' | 'telegram' | 'kakao' | 'naver' | 'etc';
```
**바꾸기:**
```ts
const PAGE_SIZE = 100;
type PlatformKey = 'all' | 'telegram' | 'kakao' | 'naver' | 'etc';
```

## (2) platform 상태 — setter 제거(항상 'all')
**찾기:**
```tsx
  const [platform, setPlatform] = useState<PlatformKey>('all');
```
**바꾸기:**
```tsx
  const [platform] = useState<PlatformKey>('all');
```

## (3) 플랫폼 탭 UI 제거 (정렬은 오른쪽 유지)
**찾기:**
```tsx
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1 overflow-x-auto">
            {PLATFORMS.map(([p, label]) => (
              <button
                key={p}
                type="button"
                onClick={() => { setQ(''); setPlatform(p); }}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                  platform === p && !searching ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
```
**바꾸기:**
```tsx
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
          <div className="flex shrink-0 items-center gap-2">
```

## (4) 리스트 행 — 등록업체명 메인 + 리딩방명 부제
**찾기:**
```tsx
                      <span className="truncate text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{roomNameOf(a)}</span>
                      {a.source === 'fss' ? <ShieldCheck size={13} className="shrink-0 text-emerald-600" aria-label="유사투자자문 신고" /> : null}
```
**바꾸기:**
```tsx
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{a.company_name}</span>
                          {a.source === 'fss' ? <ShieldCheck size={13} className="shrink-0 text-emerald-600" aria-label="유사투자자문 신고" /> : null}
                        </span>
                        {a.info_name && a.info_name.trim() && a.info_name !== a.company_name ? (
                          <span className="truncate text-[11px] text-unjong-muted">{a.info_name}</span>
                        ) : null}
                      </span>
```

## (5) 미리보기 rows — '등록업체' 행 제거
**찾기:**
```tsx
  const rows: [string, string | null][] = isFss
    ? [
        ['등록업체', a.company_name],
        ['대표', a.representative],
        ['주소', a.address],
        ['신고기간', `${a.valid_from ?? '—'} ~ ${a.valid_to ?? '—'}`],
      ]
```
**바꾸기:**
```tsx
  const rows: [string, string | null][] = isFss
    ? [
        ['대표', a.representative],
        ['주소', a.address],
        ['신고기간', `${a.valid_from ?? '—'} ~ ${a.valid_to ?? '—'}`],
      ]
```

## (6) 미리보기 헤더 — 등록업체명 + 리딩방명 부제
**찾기:**
```tsx
      <div className="mb-2 flex items-center gap-2">
        {ic ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ic} alt="" width={20} height={20} className="h-5 w-5 rounded" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
        ) : <Globe size={18} className="text-unjong-muted" />}
        <h3 className="min-w-0 flex-1 truncate text-sm font-bold text-unjong-primary">{roomName}</h3>
        <button
          type="button"
          onClick={onToggleFav}
          aria-label={isFav ? '즐겨찾기 해제' : '즐겨찾기'}
          className={`shrink-0 transition-colors ${isFav ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
        >
          <Star size={18} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>
```
**바꾸기:**
```tsx
      <div className="mb-2 flex items-start gap-2">
        {ic ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ic} alt="" width={20} height={20} className="mt-0.5 h-5 w-5 rounded" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
        ) : <Globe size={18} className="mt-0.5 text-unjong-muted" />}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-unjong-primary">{isFss ? a.company_name : roomName}</h3>
          {isFss && a.info_name && a.info_name.trim() && a.info_name !== a.company_name ? (
            <p className="truncate text-[11px] text-unjong-muted">{a.info_name}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onToggleFav}
          aria-label={isFav ? '즐겨찾기 해제' : '즐겨찾기'}
          className={`mt-0.5 shrink-0 transition-colors ${isFav ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
        >
          <Star size={18} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>
```

## (7) 빈 목록 문구 — '플랫폼' 표현 제거
**찾기:**
```tsx
              {searching ? '검색 결과가 없습니다. 신고되지 않은 업체일 수 있으니 주의하세요.' : '이 플랫폼에 등록된 곳이 없습니다.'}
```
**바꾸기:**
```tsx
              {searching ? '검색 결과가 없습니다. 신고되지 않은 업체일 수 있으니 주의하세요.' : '등록된 곳이 없습니다.'}
```

---

## 확인 (localhost, HMR)
- 리딩방·검증 탭: **플랫폼 탭 사라짐** → 검색창 + 정렬(관심순/가나다)만, 전부 한 번에.
- 리스트 행: **등록업체명 굵게(메인)** + 그 아래 **리딩방명 작은 회색(부제)**. 예: **"(LW)에듀케이션"** / 작게 "LW주식공부". (info_name == company_name이면 부제 없음.)
- 미리보기: 헤더 = **등록업체명** + 리딩방명 부제, 정보란은 **대표·주소·신고기간**(중복 '등록업체' 행 사라짐), 뱃지·바로가기·업체제공 링크 그대로.
- 빌드 에러 없음 (PLATFORMS·setPlatform 참조 모두 제거됨, roomNameOf는 비-fss 헤더에서 계속 사용).

## 빌드·커밋
- 보류. 확인 후 STEP B(OG 프리뷰)까지 묶거나 단독 커밋. push·배포는 사용자 지시 시.
