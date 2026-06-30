'use client';

import { useState } from 'react';
import SelectDropdown from '@/components/toolbox/SelectDropdown';

const SLOT_OPTIONS = [
  { value: 'broker', label: '증권사 슬롯 (종목·상품)' },
  { value: 'room', label: '리딩방 슬롯 (리딩방·검증)' },
  { value: 'feed', label: '콘텐츠 피드 (뉴스·리포트·유튜브 등)' },
  { value: 'other', label: '기타 · 일반 문의' },
];

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-unjong-muted">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
    </div>
  );
}

export default function AdInquiryForm({ defaultSlot = 'other' }: { defaultSlot?: string }) {
  const [slot, setSlot] = useState(defaultSlot);
  const [company, setCompany] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!company.trim()) { setError('회사명을 입력해 주세요'); return; }
    if (!email.trim()) { setError('이메일을 입력해 주세요'); return; }
    if (!phone.trim()) { setError('연락처를 입력해 주세요'); return; }
    setSubmitting(true);
    try {
      const r = await fetch('/api/advertise/inquiry', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot, company, contact_name: contactName, email, phone, message }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? '제출 실패');
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '제출 실패');
    } finally { setSubmitting(false); }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-unjong-border bg-unjong-surface p-6 text-center">
        <p className="text-sm font-bold text-unjong-primary">문의가 접수되었습니다.</p>
        <p className="mt-1 text-xs text-unjong-muted">담당자가 확인 후 입력하신 연락처로 회신드립니다.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-unjong-border bg-unjong-surface p-5">
      <div>
        <label className="mb-1 block text-xs font-medium text-unjong-muted">관심 광고 위치</label>
        <SelectDropdown value={slot} onChange={setSlot} options={SLOT_OPTIONS} placeholder="선택하세요" />
      </div>
      <Field label="회사명 *" value={company} onChange={setCompany} placeholder="예: ○○증권 / ○○리딩방" />
      <Field label="담당자" value={contactName} onChange={setContactName} placeholder="이름 (선택)" />
      <Field label="이메일 *" value={email} onChange={setEmail} placeholder="you@company.com" type="email" />
      <Field label="연락처 *" value={phone} onChange={setPhone} placeholder="010-0000-0000" />
      <div>
        <label className="mb-1 block text-xs font-medium text-unjong-muted">문의 내용</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="노출 희망 위치·예산·기간 등 자유롭게 적어주세요." className="w-full resize-none rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
      </div>
      <p className="text-[11px] leading-relaxed text-unjong-muted">※ 광고는 노출(순위)일 뿐 사실·수익 보증이 아니며, 모든 광고엔 '광고' 라벨이 붙습니다. 유사투자자문 신고 + 운영자 인증을 마친 곳만 게재할 수 있습니다.</p>
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
      <button type="submit" disabled={submitting} className="w-full rounded-lg bg-unjong-accent py-2.5 text-sm font-semibold text-white disabled:opacity-50">
        {submitting ? '제출 중…' : '광고 문의 보내기'}
      </button>
    </form>
  );
}
