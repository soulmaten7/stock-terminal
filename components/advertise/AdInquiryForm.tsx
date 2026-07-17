'use client';

import { useState } from 'react';
import SelectDropdown from '@/components/toolbox/SelectDropdown';
import { useTranslations, useLocale } from 'next-intl';

const SLOT_OPTIONS = [
  // value = 서버로 전송되는 값(번역 금지) · label = 표시용 ko.json 키
  { value: 'broker', label: 'optBroker' },
  { value: 'room', label: 'optRoom' },
  { value: 'feed', label: 'optFeed' },
  { value: 'other', label: 'optOther' },
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
  const t = useTranslations('Advertise');
  const locale = useLocale();
  const slotOptions = locale === 'en' ? SLOT_OPTIONS.filter((o) => o.value !== 'room') : SLOT_OPTIONS;
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
    if (!company.trim()) { setError(t('errCompany')); return; }
    if (!email.trim()) { setError(t('errEmail')); return; }
    if (!phone.trim()) { setError(t('errPhone')); return; }
    setSubmitting(true);
    try {
      const r = await fetch('/api/advertise/inquiry', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot, company, contact_name: contactName, email, phone, message }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? t('submitFail'));
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('submitFail'));
    } finally { setSubmitting(false); }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-unjong-border bg-unjong-surface p-6 text-center">
        <p className="text-sm font-bold text-unjong-primary">{t('doneTitle')}</p>
        <p className="mt-1 text-xs text-unjong-muted">{t('doneDesc')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-unjong-border bg-unjong-surface p-5">
      <div>
        <label className="mb-1 block text-xs font-medium text-unjong-muted">{t('fieldSlot')}</label>
        <SelectDropdown value={slot} onChange={setSlot} options={slotOptions.map((o) => ({ value: o.value, label: t(o.label) }))} />
      </div>
      <Field label={t('fieldCompany')} value={company} onChange={setCompany} placeholder={t('phCompany')} />
      <Field label={t('fieldContact')} value={contactName} onChange={setContactName} placeholder={t('phContact')} />
      <Field label={t('fieldEmail')} value={email} onChange={setEmail} placeholder="you@company.com" type="email" />
      <Field label={t('fieldPhone')} value={phone} onChange={setPhone} placeholder="010-0000-0000" />
      <div>
        <label className="mb-1 block text-xs font-medium text-unjong-muted">{t('fieldMessage')}</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder={t('phMessage')} className="w-full resize-none rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
      </div>
      <p className="text-[11px] leading-relaxed text-unjong-muted">{t('note')}</p>
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
      <button type="submit" disabled={submitting} className="w-full rounded-lg bg-unjong-accent py-2.5 text-sm font-semibold text-white disabled:opacity-50">
        {submitting ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
