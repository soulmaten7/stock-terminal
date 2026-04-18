'use client';

import { useState } from 'react';

type Feature = { title: string; description: string };
type Partner = {
  slug: string;
  name: string;
  logo_url?: string | null;
  hero_image_url?: string | null;
  description?: string | null;
  category?: string | null;
  cta_text?: string | null;
  cta_url?: string | null;
  features?: Feature[] | null;
};

export default function PartnerLandingClient({
  partner,
  utm,
}: {
  partner: Partner;
  utm: { source: string; medium: string; campaign: string };
}) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', consent: false });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  const [errMsg, setErrMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setStatus('idle'); setErrMsg('');
    try {
      const r = await fetch('/api/partners/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email, phone: form.phone, message: form.message,
          consentMarketing: form.consent,
          sourceSlug: partner.slug,
          utmSource: utm.source, utmMedium: utm.medium, utmCampaign: utm.campaign,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      setStatus('ok');
      setForm({ name: '', email: '', phone: '', message: '', consent: false });
    } catch (e: any) {
      setStatus('err'); setErrMsg(e?.message || '전송 실패');
    } finally {
      setLoading(false);
    }
  };

  const features = Array.isArray(partner.features) ? partner.features : [];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-4">
          {partner.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={partner.logo_url} alt={partner.name} className="h-14 w-auto object-contain" />
          )}
          {partner.category && (
            <span className="text-xs font-bold text-[#0ABAB5] bg-[#0ABAB5]/10 px-2 py-1 rounded">
              {partner.category}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-black mb-3">{partner.name}</h1>
        {partner.description && (
          <p className="text-base text-[#555555] leading-relaxed max-w-2xl">{partner.description}</p>
        )}
      </section>

      {/* Features */}
      {features.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 py-8 border-t border-[#E5E7EB]">
          <h2 className="text-lg font-bold text-black mb-6">핵심 혜택</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div key={i} className="border border-[#E5E7EB] rounded-xl p-5 bg-white">
                <h3 className="text-sm font-bold text-[#0ABAB5] mb-2">{f.title}</h3>
                <p className="text-sm text-[#555555] leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lead Form */}
      <section className="max-w-2xl mx-auto px-4 py-12 border-t border-[#E5E7EB]">
        <h2 className="text-xl font-bold text-black mb-2">{partner.cta_text || '상담 신청'}</h2>
        <p className="text-sm text-[#666666] mb-6">
          아래 정보를 남겨주시면 {partner.name} 담당자가 영업일 기준 1~2일 이내 연락드립니다.
        </p>

        {status === 'ok' ? (
          <div className="border border-[#0ABAB5] bg-[#0ABAB5]/10 rounded-lg p-6 text-center">
            <p className="text-base font-bold text-[#0ABAB5] mb-1">신청 완료</p>
            <p className="text-sm text-[#555555]">담당자가 곧 연락드립니다. 감사합니다.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-black mb-1">이름 *</label>
              <input
                type="text" required maxLength={80}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-[#0ABAB5]"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-black mb-1">이메일</label>
                <input
                  type="email" maxLength={120}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-[#0ABAB5]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-1">전화</label>
                <input
                  type="tel" maxLength={20}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="010-1234-5678"
                  className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-[#0ABAB5]"
                />
              </div>
            </div>
            <p className="text-xs text-[#999999]">이메일 또는 전화 중 하나 이상 입력</p>
            <div>
              <label className="block text-sm font-bold text-black mb-1">문의 내용</label>
              <textarea
                maxLength={1000} rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-[#0ABAB5] resize-none"
              />
            </div>
            <label className="flex items-start gap-2 text-xs text-[#666666]">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                className="mt-0.5"
              />
              <span>개인정보 수집·이용 및 마케팅 정보 수신에 동의합니다. (선택 사항이나, 상담 진행을 위해 필요)</span>
            </label>
            {status === 'err' && (
              <p className="text-sm text-[#FF3B30]">{errMsg}</p>
            )}
            <button
              type="submit" disabled={loading}
              className="w-full bg-[#0ABAB5] hover:bg-[#099b96] disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors"
            >
              {loading ? '전송 중...' : (partner.cta_text || '상담 신청')}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
