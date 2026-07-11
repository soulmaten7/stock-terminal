<!-- 2026-07-09 -->
# STEP 675 — 🔗 리딩방 공개채널: 플랫폼 아이콘 + 미리보기 바로가기 복원

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** STEP 674 후(공개 채널 링크 추가). 채널명이 일반 외부링크 아이콘 하나 + "홈페이지/텔레그램" 라벨. **미리보기 "바로가기" 버튼이 공개 채널엔 안 뜸**(154행 `a.verified_owner &&` 게이트 탓).
**목표:** ① 채널명에 **플랫폼별 아이콘**(텔레그램/유튜브/홈페이지) ② **미리보기 바로가기 복원** — 공개 homepage도 OG 카드 + 바로가기(단 "공개·미인증"으로 인증 채널과 스타일 구분). "깔끔함 유지 + 잃은 정보/기능 복원 + 신뢰 구분."
**대상:** `components/toolbox/AdvisorDirectory.tsx`.

---

## 1. 플랫폼 아이콘 헬퍼
lucide-react에 브랜드 로고는 없으니 플랫폼별 근접 아이콘으로 구분:
```tsx
import { Send, Youtube, Globe, MessageCircle, ExternalLink, UserCheck } from 'lucide-react'; // 기존 import에 Send·Youtube·Globe·MessageCircle 추가
function PlatformIcon({ p, className }: { p?: string | null; className?: string }) {
  if (p === 'telegram') return <Send size={12} className={className} />;
  if (p === 'youtube') return <Youtube size={12} className={className} />;
  if (p === 'kakao') return <MessageCircle size={12} className={className} />;
  return <Globe size={12} className={className} />; // etc/홈페이지
}
```

## 2. 채널명 셀 — 플랫폼 아이콘 적용 (STEP 674에서 넣은 pub 분기)
```tsx
) : pub ? (
  <a href={pub.url} target="_blank" rel="noopener noreferrer nofollow" onClick={(e)=>e.stopPropagation()}
     className="flex min-w-0 items-center gap-1 text-unjong-muted hover:text-unjong-accent">
    <PlatformIcon p={a.platform} className="shrink-0" />
    <span className="truncate">{pub.label}</span>
  </a>
) : (
```
> 일반 `ExternalLink` → `PlatformIcon`(플랫폼별). 회색 톤 유지(공개·미인증 구분).

## 3. 미리보기 바로가기 — 공개 homepage에도 복원
현 154행: `{a.verified_owner && linkUrl ? ( ...OG카드 + "연결링크 바로가기" solid 버튼... ) : null}`
→ **인증(verified_owner)과 공개(homepage) 둘 다** 처리하되 스타일·라벨 구분:
```tsx
{linkUrl ? (
  <div className="mt-3">
    {ogLoading ? (
      <div className="mb-2 h-24 animate-pulse rounded-lg bg-unjong-background" />
    ) : og && og.status === 'ok' && (og.image || og.title) ? (
      <a href={linkUrl} target="_blank" rel="noopener noreferrer nofollow" className="mb-2 block overflow-hidden rounded-lg border border-unjong-border transition-colors hover:border-unjong-accent">
        {/* 기존 OG 카드 그대로 */}
      </a>
    ) : null}
    {a.verified_owner ? (
      // 인증 채널 — solid(강조)
      <a href={linkUrl} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center justify-center gap-1 rounded-lg bg-unjong-primary py-2 text-sm font-semibold text-white">
        연결링크 바로가기 <ExternalLink size={13} />
      </a>
    ) : (
      // 공개 채널(금감원) — outline(중립) + 미인증 표시
      <>
        <a href={linkUrl} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center justify-center gap-1 rounded-lg border border-unjong-border py-2 text-sm font-semibold text-unjong-primary hover:border-unjong-accent hover:text-unjong-accent">
          <PlatformIcon p={a.platform} /> {platformLabel(a.platform)} 바로가기 <ExternalLink size={12} />
        </a>
        <p className="mt-1 text-center text-[10px] text-unjong-muted">금감원 신고 시 제출된 공개 링크 · 미인증</p>
      </>
    )}
  </div>
) : null}
```
> 핵심: **게이트 `a.verified_owner &&` → `linkUrl` 존재로 완화** + 버튼을 인증(solid)/공개(outline) 분기. `linkUrl = a.channel_url || a.homepage`(기존)라 공개 업체는 homepage로 바로가기.
> ⚠️ OG 프리뷰 fetch(`ogLoading`/`og`)가 `verified_owner`나 특정 조건에서만 도는지 확인 — 공개 homepage도 OG를 가져오게(이미 `linkUrl` 기반이면 OK).

## 4. 검증 → 커밋
```bash
npx tsc --noEmit
pkill -f "next dev"; rm -rf .next && npm run dev
```
- 리딩방 → 금감원 등록업체: 채널명에 **플랫폼별 아이콘**(텔레그램=Send·유튜브·홈페이지=Globe). 업체 클릭 → 미리보기에 **OG 카드 + "○○ 바로가기" outline 버튼 + "공개·미인증" 문구**. 인증 업체(있으면)는 solid 버튼 유지.
- console.log 금지.
```bash
git add components/toolbox/AdvisorDirectory.tsx
git commit -m "feat(rooms): 공개채널 플랫폼 아이콘 + 미리보기 바로가기 복원(공개=outline·미인증 표시, 인증=solid 구분)"
git push
```

## Cowork에게 보고
- 채널명 플랫폼 아이콘 구분 + 미리보기 바로가기 복원 확인.
→ 이걸로 예전 풍부함(아이콘·바로가기) + 깔끔함 + 신뢰 구분 다 충족.
