<!-- 2026-06-27 -->
# STEP 440 — [클레임 빌드 ⑤] 리딩방 디렉토리에 '업체 제공 링크' 노출

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_440_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
인증 업체가 등록한 **업체 제공 링크(`business_links`)를 리딩방 디렉토리 미리보기에 노출**한다.
- 미리보기 카드: [금감원 검증 사실 + 바로가기] 아래에 **"업체 제공" 블록** 추가 — 업체가 등록한 링크 표시.
- **유료 링크는 "광고" 라벨** (게재≠추천 구분 / 표시광고법).
- `PreviewBody`는 데스크탑·모바일 시트 공용이라 **한 번만 고치면 양쪽 다 적용.**

> RLS 확인 완료: `business_links`는 `public` SELECT(status='active') → 로그아웃 사용자도 읽힘. anon 클라이언트로 OK.

## 전제
- 최신 main + 클레임 빌드(미커밋, STEP 430~439). 커밋 보류.
- 파일 2개: `app/api/business/...` 아님 — **`app/api/advisors/route.ts`** + **`components/toolbox/AdvisorDirectory.tsx`**.
- **API 라우트 변경 → 클린 재시작 필요.**

---

## (1) `app/api/advisors/route.ts` — biz_links 붙이기
liked 매핑 직후, return 직전에 블록 추가.

**찾기:**
```ts
  } else {
    rows = rows.map((r) => ({ ...r, liked: false }));
  }

  return NextResponse.json({ results: rows, total: count ?? 0, page, pageSize: PAGE_SIZE, platform, sort, searching: !!q, loggedIn: !!user });
```
**바꾸기:**
```ts
  } else {
    rows = rows.map((r) => ({ ...r, liked: false }));
  }

  // 업체 제공 링크(공개 active) 붙이기 — RLS: business_links public-read active
  if (rows.length) {
    const ids = rows.map((r) => r.biz_no);
    const { data: bizLinks } = await supabase
      .from("business_links").select("biz_no, type, url, label, is_paid").in("biz_no", ids).eq("status", "active");
    const linkMap: Record<string, { type: string; url: string; label: string | null; is_paid: boolean }[]> = {};
    for (const l of (bizLinks ?? []) as { biz_no: string; type: string; url: string; label: string | null; is_paid: boolean }[]) {
      (linkMap[l.biz_no] ??= []).push({ type: l.type, url: l.url, label: l.label, is_paid: l.is_paid });
    }
    rows = rows.map((r) => ({ ...r, biz_links: linkMap[r.biz_no] ?? [] }));
  }

  return NextResponse.json({ results: rows, total: count ?? 0, page, pageSize: PAGE_SIZE, platform, sort, searching: !!q, loggedIn: !!user });
```

---

## (2) `components/toolbox/AdvisorDirectory.tsx` — 3곳

### (2-a) Advisor 타입에 biz_links 추가
**찾기:**
```ts
  source: string;
  intro: string | null;
};
```
**바꾸기:**
```ts
  source: string;
  intro: string | null;
  biz_links?: { type: string; url: string; label: string | null; is_paid: boolean }[];
};
```

### (2-b) 링크 종류 라벨 상수 추가
**찾기:**
```ts
function platformLabel(p: string): string {
  return p === 'telegram' ? '텔레그램' : p === 'kakao' ? '카카오톡' : p === 'naver' ? '네이버' : '기타';
}
```
**바꾸기:**
```ts
function platformLabel(p: string): string {
  return p === 'telegram' ? '텔레그램' : p === 'kakao' ? '카카오톡' : p === 'naver' ? '네이버' : '기타';
}
const LINK_TYPE_LABEL: Record<string, string> = { room: '리딩방', youtube: '유튜브', site: '사이트' };
```

### (2-c) PreviewBody 끝에 '업체 제공' 블록 추가 (바로가기 아래)
**찾기:**
```tsx
      {a.homepage ? (
        <a href={a.homepage} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-unjong-primary py-2 text-sm font-semibold text-white">
          바로가기 <ExternalLink size={13} />
        </a>
      ) : null}
    </div>
  );
}
```
**바꾸기:**
```tsx
      {a.homepage ? (
        <a href={a.homepage} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-unjong-primary py-2 text-sm font-semibold text-white">
          바로가기 <ExternalLink size={13} />
        </a>
      ) : null}
      {a.biz_links && a.biz_links.length > 0 ? (
        <div className="mt-3 border-t border-unjong-border pt-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-unjong-muted">
            업체 제공 <span className="rounded bg-unjong-background px-1 py-0.5 text-[10px] font-normal">업체가 직접 등록</span>
          </div>
          <div className="space-y-1.5">
            {a.biz_links.map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-2 rounded-lg border border-unjong-border px-3 py-2 text-xs transition-colors hover:border-unjong-accent">
                <span className="shrink-0 rounded bg-unjong-background px-1.5 py-0.5 text-[10px] font-medium text-unjong-muted">{LINK_TYPE_LABEL[l.type] ?? l.type}</span>
                {l.is_paid ? <span className="shrink-0 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">광고</span> : null}
                <span className="min-w-0 flex-1 truncate text-unjong-primary">{l.label || l.url}</span>
                <ExternalLink size={12} className="shrink-0 text-unjong-muted" />
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
```

---

## 클린 재시작 (API 라우트 변경)
```bash
pkill -f "next dev"; rm -rf .next; npm run dev
```

## 확인 (localhost)
- 리딩방·검증 탭 → **주식회사 이머니** 검색 → 행 클릭 → 미리보기.
- [금감원 검증 사실 + 바로가기] 아래에 **"업체 제공"** 블록 → "리딩방 · 테스트" 링크가 뜸(유료였다면 옆에 "광고" 칩).
- 모바일(좁은 화면)에서도 시트 미리보기에 동일하게 노출(같은 PreviewBody).
- 링크 없는 업체는 '업체 제공' 블록 자체가 안 보임.

## 빌드·커밋
- 보류. 확인 후 **클레임 빌드 전체(STEP 430~440) 한 번에 커밋** 예정. push·배포는 사용자 지시 시.
