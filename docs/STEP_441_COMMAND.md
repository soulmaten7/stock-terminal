<!-- 2026-06-28 -->
# STEP 441 — 라벨 "유사투자자문 신고" 교체 + "운영자 인증" 뱃지

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_441_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
ROADMAP §3 정책 반영:
1. **"금감원 등록" → "유사투자자문 신고"** 라벨 교체 (등록 아니라 신고가 정확).
2. **"운영자 인증" 뱃지** — 클레임+국세청 진위확인 통과한 곳에 디렉토리 미리보기에서 표시.
3. 디스클레이머(292줄 "'신고'는 안전 보증·인증이 아닙니다")는 **이미 일치 → 손 안 댐.**

> 3층 뱃지: ① "유사투자자문 신고"(규제 사실·자동) ② "운영자 인증"(우리 확인) ③ "광고"(유료·추후).

## 전제
- 최신 main (a2c0b5f = STEP 430~440 + ROADMAP). 커밋 보류.
- 파일 5개. **`/api/advisors` 라우트 변경 → 클린 재시작 필요.**

---

## (1) `app/api/advisors/route.ts` — verified_owner 플래그 추가

### (1-a) admin client import 추가
**찾기:**
```ts
import { createClient } from "@/lib/supabase/server";
```
**바꾸기:**
```ts
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
```

### (1-b) biz_links 블록 뒤, return 앞에 verified_owner 블록 추가
**찾기:**
```ts
    rows = rows.map((r) => ({ ...r, biz_links: linkMap[r.biz_no] ?? [] }));
  }

  return NextResponse.json({ results: rows, total: count ?? 0, page, pageSize: PAGE_SIZE, platform, sort, searching: !!q, loggedIn: !!user });
```
**바꾸기:**
```ts
    rows = rows.map((r) => ({ ...r, biz_links: linkMap[r.biz_no] ?? [] }));
  }

  // 운영자 인증(클레임+진위확인 통과) 플래그 — 서버(admin)에서만, 공개 boolean
  if (rows.length) {
    const ids = rows.map((r) => r.biz_no);
    const admin = createAdminClient();
    const { data: vmembers } = await admin
      .from("business_members").select("biz_no").eq("status", "verified").in("biz_no", ids);
    const verifiedSet = new Set((vmembers ?? []).map((m: { biz_no: string }) => m.biz_no));
    rows = rows.map((r) => ({ ...r, verified_owner: verifiedSet.has(r.biz_no) }));
  }

  return NextResponse.json({ results: rows, total: count ?? 0, page, pageSize: PAGE_SIZE, platform, sort, searching: !!q, loggedIn: !!user });
```

---

## (2) `components/toolbox/AdvisorDirectory.tsx` — 4곳

### (2-a) lucide import에 UserCheck 추가
**찾기:**
```tsx
import { ExternalLink, Search, Siren, X, ChevronLeft, ChevronRight, ShieldCheck, Star, Globe, ArrowUp, ArrowDown } from 'lucide-react';
```
**바꾸기:**
```tsx
import { ExternalLink, Search, Siren, X, ChevronLeft, ChevronRight, ShieldCheck, Star, Globe, ArrowUp, ArrowDown, UserCheck } from 'lucide-react';
```

### (2-b) Advisor 타입에 verified_owner 추가
**찾기:**
```ts
  biz_links?: { type: string; url: string; label: string | null; is_paid: boolean }[];
};
```
**바꾸기:**
```ts
  biz_links?: { type: string; url: string; label: string | null; is_paid: boolean }[];
  verified_owner?: boolean;
};
```

### (2-c) PreviewBody 뱃지 블록 — 라벨 교체 + 운영자 인증 뱃지
**찾기:**
```tsx
      {isFss ? (
        <div className="mb-3 inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
          <ShieldCheck size={12} /> 금감원 등록 · {platformLabel(a.platform)}
        </div>
      ) : (
        <div className="mb-3 inline-flex items-center gap-1 rounded border border-unjong-border bg-unjong-background px-2 py-0.5 text-[11px] font-medium text-unjong-muted">
          이용자 등록 · {platformLabel(a.platform)}
        </div>
      )}
```
**바꾸기:**
```tsx
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {isFss ? (
          <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
            <ShieldCheck size={12} /> 유사투자자문 신고 · {platformLabel(a.platform)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded border border-unjong-border bg-unjong-background px-2 py-0.5 text-[11px] font-medium text-unjong-muted">
            이용자 등록 · {platformLabel(a.platform)}
          </span>
        )}
        {a.verified_owner ? (
          <span className="inline-flex items-center gap-1 rounded border border-unjong-accent/40 bg-unjong-accent/10 px-2 py-0.5 text-[11px] font-medium text-unjong-accent">
            <UserCheck size={12} /> 운영자 인증
          </span>
        ) : null}
      </div>
```

### (2-d) aria-label 2곳 교체 (SponsoredRoomRow + 리스트 행)
**찾기 (2번 등장 — 모두):**
```tsx
aria-label="금감원 등록"
```
**바꾸기:**
```tsx
aria-label="유사투자자문 신고"
```

---

## (3) `components/business/MyBusinessClient.tsx` — 3곳

### (3-a) 안내 문구
**찾기:**
```tsx
      <p className="text-sm text-unjong-muted">금감원 등록 정보는 자동 표시되며 수정할 수 없어요. 소개·링크·관리자만 관리할 수 있어요.</p>
```
**바꾸기:**
```tsx
      <p className="text-sm text-unjong-muted">금감원 신고 정보는 자동 표시되며 수정할 수 없어요. 소개·링크·관리자만 관리할 수 있어요.</p>
```

### (3-b) 검증 사실 뱃지
**찾기:**
```tsx
          <ShieldCheck size={12} /> 금감원 검증 사실 · 자동 표시
```
**바꾸기:**
```tsx
          <ShieldCheck size={12} /> 유사투자자문 신고 · 자동 표시
```

### (3-c) 하단 안내
**찾기:**
```tsx
        <p className="mt-2 text-[11px] leading-relaxed text-unjong-muted">위 정보는 금감원 등록 데이터라 수정할 수 없어요. 사용자에게 이 모습 그대로 표시됩니다.</p>
```
**바꾸기:**
```tsx
        <p className="mt-2 text-[11px] leading-relaxed text-unjong-muted">위 정보는 금감원 신고 데이터라 수정할 수 없어요. 사용자에게 이 모습 그대로 표시됩니다.</p>
```

---

## (4) `app/business/page.tsx` — 안내 문구
**찾기:**
```tsx
        금감원 등록 업체만 게재할 수 있어요. 본인 업체를 찾아 인증을 신청하면, 관리자 확인 후 직접 리딩방·채널 링크를 관리할 수 있습니다.
```
**바꾸기:**
```tsx
        금감원에 유사투자자문 신고된 업체만 게재할 수 있어요. 본인 업체를 찾아 인증을 신청하면, 관리자 확인 후 직접 리딩방·채널 링크를 관리할 수 있습니다.
```

---

## (5) `components/business/BusinessClaimClient.tsx` — 미발견 안내
**찾기:**
```tsx
          금감원 등록 명부에서 못 찾았어요. <strong className="text-unjong-primary">등록된 업체만</strong> 게재할 수 있습니다.
```
**바꾸기:**
```tsx
          금감원 신고 명부에서 못 찾았어요. <strong className="text-unjong-primary">신고된 업체만</strong> 게재할 수 있습니다.
```

---

## 클린 재시작 (API 라우트 변경)
```bash
pkill -f "next dev"; rm -rf .next; npm run dev
```

## 확인 (localhost)
- 리딩방·검증 → "주식회사 이머니"(또는 엑스원) 검색 → 미리보기:
  - 뱃지가 **"유사투자자문 신고 · 기타"** 로 바뀜 (옛 "금감원 등록" X)
  - 그 옆에 **"운영자 인증"** 뱃지(민트색)가 뜸 (이 업체는 클레임+진위확인 통과한 테스트 업체라서)
- 클레임 안 한 다른 업체 검색 → "유사투자자문 신고"만 뜨고 "운영자 인증"은 없음
- 마이페이지 '내 업체' 카드 뱃지도 "유사투자자문 신고 · 자동 표시"로
- `/business`·클레임 안내 문구도 "신고"로
- 디스클레이머(검색창 아래)는 그대로

## 빌드·커밋
- 보류. 확인 후 **STEP 441 단독 커밋** (또는 다음 묶음과 함께). push·배포는 사용자 지시 시.
