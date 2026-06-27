<!-- 2026-06-27 -->
# STEP 434 — [클레임 빌드 3-C] 국세청 사업자 진위확인 자동 검증

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_434_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
인증 신청 시 **국세청 진위확인 API**(data.go.kr odcloud)로 **사업자번호 + 대표명(금감원) + 개업일(입력)**이 국세청 기록과 일치하는지 자동 검증. 명백한 불일치는 신청 단계에서 차단, 일치/확인불가는 통과(관리자 최종 확인). 결과는 `business_claims.nts_valid`에 저장.
- **버킷·컬럼(`nts_valid`·`start_dt`)은 Cowork이 MCP로 이미 생성.**
- 키: `process.env.DATA_GO_KR_KEY`(`.env.local`, 일반 인증키) 참조 — **키 값은 코드/깃에 넣지 않음.**

## 전제
- 최신 main + STEP 432·433분(미커밋). **lib 1 신규 + API 1 교체 + 클라 1 교체.** API 변경 → 클린 재시작. 커밋 보류.

---

## (1) 새 파일 — `lib/nts.ts`
```ts
// 국세청 사업자등록정보 진위확인 (data.go.kr odcloud). serviceKey = DATA_GO_KR_KEY(.env.local, 일반 인증키).
// match=일치 / mismatch=불일치 / unverified=확인불가(키없음·API오류 — 차단하지 않음, 관리자 검토)
export type NtsResult = 'match' | 'mismatch' | 'unverified';

export async function verifyBusiness(b_no: string, start_dt: string, p_nm: string): Promise<NtsResult> {
  const key = process.env.DATA_GO_KR_KEY;
  if (!key || !/^\d{10}$/.test(b_no) || !/^\d{8}$/.test(start_dt) || !p_nm) return 'unverified';
  try {
    const url = `https://api.odcloud.kr/api/nts-businessman/v1/validate?serviceKey=${key}&returnType=JSON`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businesses: [{ b_no, start_dt, p_nm }] }),
      cache: 'no-store',
    });
    if (!res.ok) return 'unverified';
    const j = await res.json();
    const valid = j?.data?.[0]?.valid;
    if (valid === '01') return 'match';
    if (valid === '02') return 'mismatch';
    return 'unverified';
  } catch {
    return 'unverified';
  }
}
```

## (2) `app/api/business/claim/route.ts` — 파일 전체 교체 (+개업일 +진위확인)
```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyBusiness } from "@/lib/nts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 });

  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  const biz_no = String(form.get("biz_no") ?? "").replace(/\D/g, "").slice(0, 10);
  const contact = String(form.get("contact") ?? "").trim().slice(0, 100);
  const start_dt = String(form.get("start_dt") ?? "").replace(/\D/g, "").slice(0, 8);
  const file = form.get("file");

  if (biz_no.length !== 10) return NextResponse.json({ error: "사업자번호가 올바르지 않습니다." }, { status: 400 });
  if (start_dt.length !== 8) return NextResponse.json({ error: "개업일자를 입력해주세요." }, { status: 400 });
  if (!contact) return NextResponse.json({ error: "담당자 연락처를 입력해주세요." }, { status: 400 });
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "사업자등록증 파일을 첨부해주세요." }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "파일은 5MB 이하만 가능합니다." }, { status: 400 });

  const admin = createAdminClient();

  // 금감원 등록 업체만 클레임 가능 (+대표명)
  const { data: biz } = await admin.from("fss_advisors").select("biz_no, representative").eq("biz_no", biz_no).maybeSingle();
  if (!biz) return NextResponse.json({ error: "금감원 등록 명부에 없는 사업자번호입니다." }, { status: 400 });

  // 중복 방지
  const { data: existing } = await admin.from("business_members").select("status").eq("biz_no", biz_no).eq("user_id", user.id).maybeSingle();
  if (existing) return NextResponse.json({ error: "이미 신청했거나 등록된 업체입니다." }, { status: 409 });

  // 국세청 진위확인 (사업자번호 + 대표명[금감원] + 개업일[입력]) — 명백한 불일치만 차단
  const nts = biz.representative ? await verifyBusiness(biz_no, start_dt, biz.representative as string) : 'unverified';
  if (nts === 'mismatch') {
    return NextResponse.json({ error: "국세청 진위확인 불일치 — 개업일자를 확인해주세요. (대표명 변경 등 사유면 contact@onetrillion.app 으로 문의)" }, { status: 400 });
  }

  // 서류 업로드 (비공개 버킷 — service role)
  const ext = ((file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5)) || "bin";
  const path = `${user.id}/${biz_no}_${Date.now()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await admin.storage.from("business-docs").upload(path, buf, { contentType: file.type || "application/octet-stream", upsert: false });
  if (upErr) return NextResponse.json({ error: "파일 업로드 실패: " + upErr.message }, { status: 500 });

  await admin.from("business_members").insert({ biz_no, user_id: user.id, role: "owner", status: "pending" });
  await admin.from("business_claims").insert({ biz_no, user_id: user.id, method: "doc", doc_url: path, contact, start_dt, nts_valid: nts, status: "pending" });
  return NextResponse.json({ ok: true });
}
```

## (3) `components/business/BusinessClaimClient.tsx` — 파일 전체 교체 (+개업일 입력)
```tsx
'use client';

import { useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';

type Biz = { biz_no: string; company_name: string; representative: string | null; valid_from: string | null; valid_to: string | null; address: string | null };

export default function BusinessClaimClient() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Biz[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<Biz | null>(null);
  const [startDt, setStartDt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [contact, setContact] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function search() {
    if (q.trim().length < 2) return;
    setSearching(true); setError(''); setSelected(null);
    try {
      const r = await fetch(`/api/business/search?q=${encodeURIComponent(q.trim())}`);
      const j = await r.json();
      setResults(j.results ?? []); setSearched(true);
    } catch { setError('검색에 실패했어요.'); }
    finally { setSearching(false); }
  }

  function pick(b: Biz) {
    setSelected((cur) => (cur?.biz_no === b.biz_no ? null : b));
    setStartDt(''); setFile(null); setContact(''); setError('');
  }

  async function claim(b: Biz) {
    if (!startDt) { setError('개업일자를 입력해주세요.'); return; }
    if (!file) { setError('사업자등록증 파일을 첨부해주세요.'); return; }
    if (!contact.trim()) { setError('담당자 연락처를 입력해주세요.'); return; }
    setClaiming(true); setError('');
    try {
      const fd = new FormData();
      fd.append('biz_no', b.biz_no);
      fd.append('contact', contact.trim());
      fd.append('start_dt', startDt.replace(/\D/g, ''));
      fd.append('file', file);
      const r = await fetch('/api/business/claim', { method: 'POST', body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error === 'login_required' ? '로그인이 필요합니다.' : (j.error ?? '신청 실패'));
      setDone(true);
    } catch (e) { setError(e instanceof Error ? e.message : '신청 실패'); }
    finally { setClaiming(false); }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-unjong-border bg-unjong-surface p-6 text-center">
        <ShieldCheck className="mx-auto mb-2 text-emerald-600" size={28} />
        <p className="text-sm font-semibold text-unjong-primary">인증 신청이 접수되었습니다.</p>
        <p className="mt-1 text-xs leading-relaxed text-unjong-muted">국세청 진위확인 통과 + 서류 제출 완료. 관리자 최종 확인 후 게재됩니다.<br />보통 영업일 기준 1~2일 내 처리됩니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-unjong-muted" />
        <input
          value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
          placeholder="업체명 또는 사업자등록번호로 검색"
          className="w-full rounded-lg border border-unjong-border bg-unjong-surface py-2.5 pl-9 pr-20 text-sm text-unjong-primary outline-none focus:border-unjong-accent"
        />
        <button type="button" onClick={search} disabled={searching} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-unjong-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
          {searching ? '검색 중…' : '검색'}
        </button>
      </div>

      {error ? <p className="text-xs text-red-500">{error}</p> : null}

      {searched && results.length === 0 ? (
        <p className="rounded-lg border border-unjong-border bg-unjong-background px-3 py-4 text-center text-sm text-unjong-muted">
          금감원 등록 명부에서 못 찾았어요. <strong className="text-unjong-primary">등록된 업체만</strong> 게재할 수 있습니다.
        </p>
      ) : null}

      {results.length > 0 ? (
        <ul className="space-y-2">
          {results.map((b) => {
            const isSel = selected?.biz_no === b.biz_no;
            return (
              <li key={b.biz_no} className={`overflow-hidden rounded-lg border transition-colors ${isSel ? 'border-unjong-accent bg-unjong-accent/5' : 'border-unjong-border hover:bg-unjong-background'}`}>
                <button type="button" onClick={() => pick(b)} className="w-full px-4 py-3 text-left">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="shrink-0 text-emerald-600" />
                    <span className="font-semibold text-unjong-primary">{b.company_name}</span>
                    <span className="text-xs text-unjong-muted">{b.biz_no}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-unjong-muted">대표 {b.representative ?? '—'} · 신고기간 {b.valid_from ?? '—'} ~ {b.valid_to ?? '—'}</p>
                </button>
                {isSel ? (
                  <div className="border-t border-unjong-accent/30 px-4 py-3">
                    <p className="text-sm text-unjong-primary"><b>{b.company_name}</b>의 대표/담당자이신가요?</p>
                    <p className="mt-1 text-xs leading-relaxed text-unjong-muted">개업일자로 <b>국세청 진위확인</b>을 거치고, <b>사업자등록증</b>을 첨부하면 관리자 확인 후 게재됩니다. 허위 신청은 제재될 수 있어요.</p>
                    <div className="mt-3 space-y-2">
                      <label className="block text-xs font-medium text-unjong-muted">개업일자 (사업자등록증 기재)
                        <input type="date" value={startDt} onChange={(e) => setStartDt(e.target.value)}
                          className="mt-1 block w-full rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
                      </label>
                      <label className="block text-xs font-medium text-unjong-muted">사업자등록증 (또는 대표 증빙)
                        <input type="file" accept="image/png,image/jpeg,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                          className="mt-1 block w-full text-xs text-unjong-muted file:mr-3 file:rounded-md file:border-0 file:bg-unjong-background file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-unjong-primary" />
                      </label>
                      <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="담당자 연락처 (전화 또는 이메일)"
                        className="w-full rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
                      <button type="button" onClick={() => claim(b)} disabled={claiming} className="rounded-lg bg-unjong-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                        {claiming ? '확인 중…' : '국세청 확인하고 인증 신청'}
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
```

---

## 빌드 검증 + 클린 재시작 (API·lib 변경)
```bash
pkill -f "next dev" 2>/dev/null; rm -rf .next; npm run build
```
빌드 통과해야 함. **커밋 보류.** + `.env.local`에 `DATA_GO_KR_KEY`가 이 API 일반 인증키인지 확인(없으면 추가).

## 확인 (사용자: `npm run dev`)
- `/business` → 업체 선택 → **개업일자 + 서류 + 연락처** 폼.
- **틀린 개업일**로 신청 → **"국세청 진위확인 불일치"** 에러로 차단되면 = API·키 정상 작동.
- (만약 아무 날짜나 다 통과되면 = 키 미설정으로 'unverified' 통과 중 → `DATA_GO_KR_KEY` 확인.)
- 다음(3-D) = 관리자 화면에 진위확인 결과(✅일치/⚠️확인불가) 표시 + ④ owner 편집.
