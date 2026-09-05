<!-- 2026-07-09 -->
# STEP 674 — 🔗 리딩방 "채널명"에 금감원 공개 채널 연결 (미인증·공개)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** 리딩방·검증 탭 "금감원 등록업체" 뷰의 **채널명 컬럼이 전부 "—"**.
**진단(Cowork DB 실측):** `business_links`(인증 채널)=0이라 인증 채널명이 없음. **그런데 `advisor_directory`의 1,557개 전부 `homepage`(공개 채널) 보유**(텔레그램 144·기타 976). 채널명 셀이 **인증 채널만** 표시하고 공개 홈페이지를 안 씀 → 다 "—".
**목표:** 인증 채널이 없을 때 **금감원 공개 홈페이지/채널을 채널명 자리에 링크로 표시**(플랫폼 라벨·미인증·공개). → 1,557개 등록업체가 자기 채널과 연결됨. **인증 리딩방(business_links)과는 시각·의미 구분 유지**(신뢰 원칙).
**대상:** `components/toolbox/AdvisorDirectory.tsx` (표시 로직만·데이터는 이미 API가 반환).

> 신뢰 구분: 초록 `ShieldCheck`=금감원 신고·`UserCheck`(민트)=운영자 인증. 공개 홈페이지는 **둘 다 아님** → 중립(회색 globe/외부링크)·"공개" 뉘앙스로. 상단 면책("신고=안전 보증 아님")이 이미 커버.

---

## 1. 공개 채널 헬퍼 추가 (`channelOf` 옆)
```ts
// 플랫폼 라벨(금감원 공개 채널)
function platformLabel(p?: string | null): string {
  if (p === 'telegram') return '텔레그램';
  if (p === 'kakao') return '카카오';
  if (p === 'youtube') return '유튜브';
  return '홈페이지';
}
// 인증 채널이 없을 때 보여줄 공개 채널(금감원 homepage). 있으면 {label, url}.
function publicChannelOf(a: Advisor): { label: string; url: string } | null {
  if (a.channel_id || a.verified_owner) return null;       // 인증 경로는 channelOf가 담당
  if (!a.homepage || !a.homepage.trim()) return null;
  return { label: platformLabel(a.platform), url: a.homepage.trim() };
}
```
> `Advisor` 타입에 `homepage`·`platform`이 없으면 추가(API는 이미 반환·`a.homepage`는 이미 미리보기서 씀).

## 2. 채널명 셀 렌더 수정 (현 435~441행 근처)
```tsx
<div className="flex min-w-0 items-center gap-1 text-left text-xs">
  {ch ? (
    // (기존) 인증 채널 — 민트 UserCheck + 채널명
    <><UserCheck size={12} className="shrink-0 text-unjong-accent" aria-label="운영자 인증" /><span className="truncate text-unjong-primary">{ch}</span></>
  ) : pub ? (
    // (신규) 금감원 공개 채널 — 중립 외부링크, 미인증
    <a href={pub.url} target="_blank" rel="noopener noreferrer nofollow" onClick={(e)=>e.stopPropagation()}
       className="flex min-w-0 items-center gap-1 text-unjong-muted hover:text-unjong-accent">
      <ExternalLink size={12} className="shrink-0" />
      <span className="truncate">{pub.label}</span>
    </a>
  ) : (
    <span className="text-unjong-muted">—</span>
  )}
</div>
```
- `const ch = channelOf(a);` 아래에 `const pub = publicChannelOf(a);` 추가.
- `onClick stopPropagation` — 링크 클릭이 행 선택(setSelected)과 안 겹치게.
- **모바일 카드 렌더에도 동일**(같은 파일 내 모바일 뷰 있으면 채널명 부분 동일 처리).

> 헤더 컬럼명 "채널명"은 유지. 필요 시 "채널/공개"로 바꿔도 됨(선택).

## 3. 검증 → 커밋
```bash
npx tsc --noEmit
pkill -f "next dev"; rm -rf .next && npm run dev
```
- 리딩방·검증 → **금감원 등록업체** 뷰: 채널명 컬럼에 **"텔레그램"·"홈페이지" 링크가 대다수 행에** 뜸(더 이상 "—" 아님). 클릭 시 그 업체 홈페이지/채널로(새 탭). 초록 신고배지는 그대로.
- **인증 리딩방** 뷰: 여전히 인증 채널(민트 UserCheck)만(현재 0개라 비어있음 — 정상).
- console.log 금지.
```bash
git add components/toolbox/AdvisorDirectory.tsx
git commit -m "feat(rooms): 리딩방 채널명에 금감원 공개 채널(homepage) 연결 — 미인증·공개 링크로 1,557 등록업체 채널 노출(인증 채널과 구분)"
git push
```

## Cowork에게 보고
- 채널명 컬럼에 공개 채널(텔레그램/홈페이지) 뜨는 비율(대다수) + 인증 채널과 시각 구분.
→ 이걸로 "금감원 등록업체↔채널 연결" 완료(공개 정보 기준). 인증 리딩방(유료)은 업체 자율 등록 시 채워짐.
