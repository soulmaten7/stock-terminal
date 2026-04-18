// 2026-04-18 세션 #15 (E) — /admin/partners 최소 CRUD 페이지
// 리스트 + 파트너 추가 폼 (Phase 1 scope: 추가만, 편집/삭제는 Phase 2)
'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Plus, RefreshCw, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

type Slot = { slot_key: string; partner_id: string; position: number | null; is_active: boolean | null };
type Partner = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  country: string | null;
  description: string | null;
  logo_url: string | null;
  cta_text: string | null;
  cta_url: string | null;
  priority: number | null;
  is_active: boolean | null;
  features: unknown;
  created_at?: string;
  slots: Slot[];
};

const SLOT_KEYS = [
  '', // none
  'home-row3-left',
  'home-sidebar-bottom',
  'toolbox-sidebar',
  'stock-detail-sidebar',
];

const DEFAULT_FEATURES = `[
  {"title":"예: 수수료 0원","desc":"추가 설명"},
  {"title":"예: 24/7 고객지원","desc":"추가 설명"}
]`;

function PartnersAdminInner() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('KR');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [ctaText, setCtaText] = useState('자세히 보기');
  const [ctaUrl, setCtaUrl] = useState('');
  const [priority, setPriority] = useState(50);
  const [isActive, setIsActive] = useState(true);
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [slotKey, setSlotKey] = useState('');
  const [slotPosition, setSlotPosition] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/partners');
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'load failed');
      setPartners(json.partners || []);
    } catch (e) {
      setFormError(String(e instanceof Error ? e.message : e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setSlug('');
    setName('');
    setCategory('');
    setCountry('KR');
    setDescription('');
    setLogoUrl('');
    setCtaText('자세히 보기');
    setCtaUrl('');
    setPriority(50);
    setIsActive(true);
    setFeatures(DEFAULT_FEATURES);
    setSlotKey('');
    setSlotPosition(1);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);
    try {
      const body = {
        slug,
        name,
        category: category || null,
        country,
        description: description || null,
        logo_url: logoUrl || null,
        cta_text: ctaText,
        cta_url: ctaUrl || null,
        priority,
        is_active: isActive,
        features, // 서버에서 JSON 파싱
        slot_key: slotKey || null,
        slot_position: slotPosition,
      };
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'create failed');

      const warn = json?.slot_warning ? ` (${json.slot_warning})` : '';
      setFormSuccess(`파트너 '${name}' 생성 완료${warn}`);
      resetForm();
      setShowForm(false);
      await load();
    } catch (e) {
      setFormError(String(e instanceof Error ? e.message : e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-xs text-[#0ABAB5] hover:underline">← 관리자 대시보드</Link>
          <h1 className="text-2xl font-bold mt-1">파트너 관리</h1>
          <p className="text-xs text-[#999999] mt-1">Partner-Agnostic 리드젠 슬롯 운영. 신규 파트너 등록 시 SQL 없이 폼으로 추가.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="px-3 py-2 text-xs border border-[#E5E7EB] rounded flex items-center gap-1.5 hover:bg-[#F5F7FA]"
          >
            <RefreshCw className="w-3.5 h-3.5" /> 새로고침
          </button>
          <button
            onClick={() => {
              setShowForm((v) => !v);
              setFormError(null);
              setFormSuccess(null);
            }}
            className="px-3 py-2 text-xs bg-[#0ABAB5] text-white rounded flex items-center gap-1.5 hover:bg-[#09a6a1]"
          >
            <Plus className="w-3.5 h-3.5" /> {showForm ? '폼 닫기' : '파트너 추가'}
          </button>
        </div>
      </div>

      {formSuccess && (
        <div className="mb-4 p-3 bg-[#0ABAB5]/10 border border-[#0ABAB5]/30 rounded flex items-start gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 text-[#0ABAB5] shrink-0 mt-0.5" />
          <span className="text-[#0ABAB5]">{formSuccess}</span>
        </div>
      )}
      {formError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2 text-sm">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="text-red-700">{formError}</span>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={onSubmit}
          className="mb-8 p-5 bg-white border border-[#E5E7EB] rounded-lg space-y-4"
        >
          <h2 className="font-bold text-sm mb-1">신규 파트너 등록</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="slug (URL id, 영소문자/숫자/하이픈)" required>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="test-broker"
                className="input"
                required
              />
            </Field>
            <Field label="이름" required>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="테스트 증권" className="input" required />
            </Field>
            <Field label="카테고리">
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="증권사" className="input" />
            </Field>
            <Field label="국가 (ISO, 기본 KR)">
              <input value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} maxLength={2} className="input" />
            </Field>
            <Field label="설명 (한 줄)">
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="MTS/HTS 통합 플랫폼 + 해외주식 지원" className="input" />
            </Field>
            <Field label="로고 URL">
              <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." className="input" />
            </Field>
            <Field label="CTA 버튼 문구">
              <input value={ctaText} onChange={(e) => setCtaText(e.target.value)} className="input" />
            </Field>
            <Field label="CTA URL (비워두면 내부 리드폼)">
              <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="(빈 값 = /partner/[slug] 리드폼)" className="input" />
            </Field>
            <Field label="priority (높을수록 상단)">
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value) || 0)}
                className="input"
              />
            </Field>
            <Field label="활성 여부">
              <label className="flex items-center gap-2 h-9 text-sm">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                is_active
              </label>
            </Field>
          </div>

          <Field label="features (JSON 배열)">
            <textarea
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              rows={5}
              className="input font-mono text-xs"
            />
          </Field>

          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-[#F0F0F0]">
            <Field label="슬롯 (선택)">
              <select value={slotKey} onChange={(e) => setSlotKey(e.target.value)} className="input">
                {SLOT_KEYS.map((k) => (
                  <option key={k || 'none'} value={k}>
                    {k || '— 선택 안 함 —'}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="슬롯 position">
              <input
                type="number"
                value={slotPosition}
                onChange={(e) => setSlotPosition(Number(e.target.value) || 1)}
                className="input"
                disabled={!slotKey}
              />
            </Field>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-4 py-2 bg-[#0ABAB5] text-white text-sm rounded disabled:opacity-50"
              >
                {submitting ? '저장 중…' : '저장'}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F7FA] text-xs text-[#666666]">
            <tr>
              <th className="text-left px-4 py-3">slug</th>
              <th className="text-left px-4 py-3">이름</th>
              <th className="text-left px-4 py-3">카테고리</th>
              <th className="text-left px-4 py-3">국가</th>
              <th className="text-right px-4 py-3">priority</th>
              <th className="text-left px-4 py-3">상태</th>
              <th className="text-left px-4 py-3">슬롯</th>
              <th className="text-left px-4 py-3">바로가기</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-[#999999]">로딩 중…</td>
              </tr>
            ) : partners.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-[#999999]">등록된 파트너가 없습니다</td>
              </tr>
            ) : (
              partners.map((p) => (
                <tr key={p.id} className="border-t border-[#F0F0F0] hover:bg-[#FAFBFC]">
                  <td className="px-4 py-2.5 font-mono text-xs">{p.slug}</td>
                  <td className="px-4 py-2.5 font-medium">{p.name}</td>
                  <td className="px-4 py-2.5 text-[#666666]">{p.category || '-'}</td>
                  <td className="px-4 py-2.5 text-[#666666]">{p.country || '-'}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{p.priority ?? 0}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded ${p.is_active ? 'bg-[#0ABAB5]/10 text-[#0ABAB5]' : 'bg-[#F0F0F0] text-[#999999]'}`}>
                      {p.is_active ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    {p.slots.length === 0 ? (
                      <span className="text-[#999999]">—</span>
                    ) : (
                      p.slots.map((s) => (
                        <span key={s.slot_key} className="inline-block mr-1 mb-1 px-1.5 py-0.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded">
                          {s.slot_key}
                          {s.position != null ? `#${s.position}` : ''}
                        </span>
                      ))
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/partner/${p.slug}`}
                      target="_blank"
                      className="text-[#0ABAB5] text-xs flex items-center gap-1 hover:underline"
                    >
                      열기 <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-[#999999]">
        Phase 1 scope: 추가만. 편집·삭제·슬롯 재매핑은 Phase 2에서 추가 예정. 급한 경우 Supabase SQL Editor로 처리.
      </p>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          height: 36px;
          padding: 0 10px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 13px;
          background: #fff;
          outline: none;
        }
        :global(textarea.input) {
          height: auto;
          padding: 8px 10px;
          line-height: 1.5;
        }
        :global(.input:focus) {
          border-color: #0abab5;
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-[#666666] mb-1">
        {label}
        {required && <span className="text-[#FF9500] ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}

export default function PartnersAdminPage() {
  return (
    <AuthGuard minPlan="admin">
      <PartnersAdminInner />
    </AuthGuard>
  );
}
