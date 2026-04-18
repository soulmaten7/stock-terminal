// 2026-04-18 세션 #15 (I) — /admin/partners CRUD 페이지 (편집·삭제·슬롯 재매핑 포함)
// Phase 1: 추가
// Phase 2: 편집 (PATCH) + 삭제 (DELETE) + 슬롯 추가/제거 (POST/DELETE /[id]/slots)
'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  Plus,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  ListOrdered,
  MousePointerClick,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

type Slot = { slot_key: string; partner_id: number; position: number | null; is_active: boolean | null };
type Partner = {
  id: number;
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
  'stock-detail-bottom', // 2026-04-18 세션 #15 (G): 종목 상세 하단
  'screener-bottom', // 2026-04-18 세션 #15 (G): 스크리너 하단
  'chat-sidebar-bottom', // 2026-04-18 세션 #15 (J): 채팅 패널 최하단 (ChatSidebar + FloatingChat 공용)
];

const DEFAULT_FEATURES = `[
  {"title":"예: 수수료 0원","desc":"추가 설명"},
  {"title":"예: 24/7 고객지원","desc":"추가 설명"}
]`;

function PartnersAdminInner() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null); // null=신규, number=편집
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

  // 행별 인라인 슬롯 추가 UI 상태
  const [addingSlotForPartner, setAddingSlotForPartner] = useState<number | null>(null);
  const [newSlotKey, setNewSlotKey] = useState('');
  const [newSlotPosition, setNewSlotPosition] = useState(1);
  const [rowActionError, setRowActionError] = useState<string | null>(null);

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
    setEditingId(null);
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

  const startEdit = (p: Partner) => {
    setEditingId(p.id);
    setSlug(p.slug);
    setName(p.name);
    setCategory(p.category ?? '');
    setCountry(p.country ?? 'KR');
    setDescription(p.description ?? '');
    setLogoUrl(p.logo_url ?? '');
    setCtaText(p.cta_text ?? '자세히 보기');
    setCtaUrl(p.cta_url ?? '');
    setPriority(p.priority ?? 50);
    setIsActive(p.is_active !== false);
    setFeatures(
      p.features == null
        ? '[]'
        : typeof p.features === 'string'
          ? p.features
          : JSON.stringify(p.features, null, 2),
    );
    setSlotKey('');
    setSlotPosition(1);
    setShowForm(true);
    setFormError(null);
    setFormSuccess(null);
    // 스크롤 이동
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);
    try {
      if (editingId != null) {
        // PATCH
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
        };
        const res = await fetch(`/api/admin/partners/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'update failed');
        setFormSuccess(`파트너 '${name}' 수정 완료`);
        resetForm();
        setShowForm(false);
        await load();
      } else {
        // POST
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
          features,
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
      }
    } catch (e) {
      setFormError(String(e instanceof Error ? e.message : e));
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (p: Partner) => {
    setRowActionError(null);
    const ok = typeof window !== 'undefined'
      ? window.confirm(`파트너 '${p.name}' (${p.slug}) 를 삭제합니다.\n연결된 슬롯/클릭 로그도 함께 제거됩니다. (리드는 partner_id=null로 보존)\n계속할까요?`)
      : false;
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/partners/${p.id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: string })?.error || 'delete failed');
      setFormSuccess(`파트너 '${p.name}' 삭제 완료`);
      await load();
    } catch (e) {
      setRowActionError(String(e instanceof Error ? e.message : e));
    }
  };

  const onRemoveSlot = async (p: Partner, sKey: string) => {
    setRowActionError(null);
    const ok = typeof window !== 'undefined'
      ? window.confirm(`'${p.slug}' 에서 슬롯 '${sKey}' 를 제거합니다. 계속할까요?`)
      : false;
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/partners/${p.id}/slots?slot_key=${encodeURIComponent(sKey)}`, {
        method: 'DELETE',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: string })?.error || 'slot remove failed');
      await load();
    } catch (e) {
      setRowActionError(String(e instanceof Error ? e.message : e));
    }
  };

  const onAddSlot = async (p: Partner) => {
    setRowActionError(null);
    if (!newSlotKey) {
      setRowActionError('슬롯 선택 필요');
      return;
    }
    try {
      const res = await fetch(`/api/admin/partners/${p.id}/slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_key: newSlotKey, position: newSlotPosition, is_active: true }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: string })?.error || 'slot add failed');
      setAddingSlotForPartner(null);
      setNewSlotKey('');
      setNewSlotPosition(1);
      await load();
    } catch (e) {
      setRowActionError(String(e instanceof Error ? e.message : e));
    }
  };

  const formTitle = editingId != null ? '파트너 편집' : '신규 파트너 등록';
  const submitLabel = editingId != null
    ? (submitting ? '수정 중…' : '수정 저장')
    : (submitting ? '저장 중…' : '저장');

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-xs text-[#0ABAB5] hover:underline">← 관리자 대시보드</Link>
          <h1 className="text-2xl font-bold mt-1">파트너 관리</h1>
          <p className="text-xs text-[#999999] mt-1">Partner-Agnostic 리드젠 슬롯 운영. SQL 없이 폼으로 추가·편집·삭제·슬롯 재매핑.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/partners/leads"
            className="px-3 py-2 text-xs border border-[#E5E7EB] rounded flex items-center gap-1.5 hover:bg-[#F5F7FA]"
          >
            <ListOrdered className="w-3.5 h-3.5" /> 리드 대시보드
          </Link>
          <Link
            href="/admin/partners/clicks"
            className="px-3 py-2 text-xs border border-[#E5E7EB] rounded flex items-center gap-1.5 hover:bg-[#F5F7FA]"
          >
            <MousePointerClick className="w-3.5 h-3.5" /> 클릭 대시보드
          </Link>
          <button
            onClick={load}
            className="px-3 py-2 text-xs border border-[#E5E7EB] rounded flex items-center gap-1.5 hover:bg-[#F5F7FA]"
          >
            <RefreshCw className="w-3.5 h-3.5" /> 새로고침
          </button>
          <button
            onClick={() => {
              if (showForm && editingId != null) resetForm();
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
      {rowActionError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2 text-sm">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="text-red-700">{rowActionError}</span>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={onSubmit}
          className="mb-8 p-5 bg-white border border-[#E5E7EB] rounded-lg space-y-4"
        >
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-sm">
              {formTitle}
              {editingId != null && (
                <span className="ml-2 text-xs text-[#999999] font-normal">(id: {editingId})</span>
              )}
            </h2>
            {editingId != null && (
              <button
                type="button"
                onClick={() => { resetForm(); setShowForm(false); }}
                className="text-xs text-[#666666] hover:underline"
              >
                편집 취소
              </button>
            )}
          </div>
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

          {editingId == null && (
            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-[#F0F0F0]">
              <Field label="슬롯 (선택, 생성 시만)">
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
                  {submitLabel}
                </button>
              </div>
            </div>
          )}
          {editingId != null && (
            <div className="flex justify-end pt-2 border-t border-[#F0F0F0]">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-[#0ABAB5] text-white text-sm rounded disabled:opacity-50"
              >
                {submitLabel}
              </button>
            </div>
          )}
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
              <th className="text-center px-4 py-3">액션</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-[#999999]">로딩 중…</td>
              </tr>
            ) : partners.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-[#999999]">등록된 파트너가 없습니다</td>
              </tr>
            ) : (
              partners.map((p) => (
                <tr key={p.id} className="border-t border-[#F0F0F0] hover:bg-[#FAFBFC] align-top">
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
                        <span key={s.slot_key} className="inline-flex items-center mr-1 mb-1 px-1.5 py-0.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded">
                          <span className="font-mono">{s.slot_key}</span>
                          {s.position != null ? <span className="text-[#999999] ml-1">#{s.position}</span> : null}
                          <button
                            type="button"
                            onClick={() => onRemoveSlot(p, s.slot_key)}
                            className="ml-1.5 text-[#999999] hover:text-red-600"
                            aria-label={`${s.slot_key} 슬롯 제거`}
                            title="슬롯 제거"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                    {addingSlotForPartner === p.id ? (
                      <div className="mt-1 flex items-center gap-1">
                        <select
                          value={newSlotKey}
                          onChange={(e) => setNewSlotKey(e.target.value)}
                          className="text-xs border border-[#E5E7EB] rounded px-1 py-0.5"
                        >
                          <option value="">— 슬롯 선택 —</option>
                          {SLOT_KEYS.filter(Boolean).map((k) => (
                            <option key={k} value={k}>{k}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={newSlotPosition}
                          onChange={(e) => setNewSlotPosition(Number(e.target.value) || 1)}
                          className="text-xs border border-[#E5E7EB] rounded px-1 py-0.5 w-12"
                          title="position"
                        />
                        <button
                          type="button"
                          onClick={() => onAddSlot(p)}
                          className="text-xs px-2 py-0.5 bg-[#0ABAB5] text-white rounded"
                        >
                          추가
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAddingSlotForPartner(null); setNewSlotKey(''); }}
                          className="text-xs px-1.5 py-0.5 text-[#666666] hover:underline"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAddingSlotForPartner(p.id);
                          setNewSlotKey('');
                          setNewSlotPosition(1);
                        }}
                        className="inline-flex items-center gap-0.5 text-[11px] text-[#0ABAB5] hover:underline ml-1"
                      >
                        <Plus className="w-3 h-3" /> 슬롯
                      </button>
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
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        className="p-1.5 text-[#666666] hover:text-[#0ABAB5] hover:bg-[#F5F7FA] rounded"
                        title="편집"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(p)}
                        className="p-1.5 text-[#666666] hover:text-red-600 hover:bg-red-50 rounded"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-[#999999]">
        Phase 2: 편집·삭제·슬롯 재매핑 지원. 슬롯 삭제 시 즉시 반영. 파트너 삭제 시 slots/clicks 는 CASCADE 로 제거, leads 는 partner_id=null 로 보존.
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
