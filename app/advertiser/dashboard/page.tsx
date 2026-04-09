'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { formatNumber, formatDate } from '@/lib/utils/format';
import { checkBannerContent } from '@/lib/chat/moderation';
import { Plus, Image as ImageIcon, ExternalLink, BarChart3 } from 'lucide-react';
import type { Advertiser, Banner } from '@/types/advertiser';

export default function AdvertiserDashboard() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Registration form state
  const [advType, setAdvType] = useState<'verified' | 'general'>('general');
  const [companyName, setCompanyName] = useState('');
  const [bizNumber, setBizNumber] = useState('');
  const [repName, setRepName] = useState('');
  const [phone, setPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // Banner form state
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerLink, setBannerLink] = useState('');
  const [bannerDesc, setBannerDesc] = useState('');
  const [productType, setProductType] = useState('other');
  const [bannerPeriod, setBannerPeriod] = useState(20);
  const [bannerError, setBannerError] = useState('');
  const [agreements, setAgreements] = useState([false, false, false]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push('/auth/login'); return; }

    const load = async () => {
      const supabase = createClient();
      const { data: adv } = await supabase
        .from('advertisers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (adv) {
        setAdvertiser(adv);
        const { data: bans } = await supabase
          .from('banners')
          .select('*')
          .eq('advertiser_id', adv.id)
          .order('created_at', { ascending: false });
        setBanners(bans || []);
      }
      setLoading(false);
    };
    load();
  }, [user, isLoading, router]);

  const handleRegister = async () => {
    if (!user) return;
    const supabase = createClient();
    const { data, error } = await supabase.from('advertisers').insert({
      user_id: user.id,
      advertiser_type: advType,
      company_name: companyName || null,
      business_registration_number: bizNumber || null,
      representative_name: repName || null,
      contact_phone: phone || null,
      contact_email: contactEmail || null,
      is_approved: advType === 'general', // general auto-approved
    }).select().single();

    if (data) setAdvertiser(data);
  };

  const handleCreateBanner = async () => {
    if (!advertiser) return;
    setBannerError('');

    const check = checkBannerContent(bannerTitle + ' ' + bannerDesc);
    if (!check.valid) {
      setBannerError(`다음 표현은 사용할 수 없습니다: ${check.foundWords.join(', ')}`);
      return;
    }

    if (!agreements.every(Boolean)) {
      setBannerError('모든 항목에 동의해주세요');
      return;
    }

    const basePrice = advertiser.advertiser_type === 'verified' ? 50000 : 30000;
    const discount = bannerPeriod === 40 ? 0.9 : bannerPeriod === 60 ? 0.85 : 1;
    const amount = Math.round(basePrice * (bannerPeriod / 20) * discount);

    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + bannerPeriod * 86400000).toISOString().split('T')[0];

    const supabase = createClient();
    const { data } = await supabase.from('banners').insert({
      advertiser_id: advertiser.id,
      title: bannerTitle,
      link_url: bannerLink,
      description: bannerDesc || null,
      product_type: productType,
      banner_tier: advertiser.advertiser_type === 'verified' ? 'premium' : 'standard',
      start_date: startDate,
      end_date: endDate,
      is_active: advertiser.advertiser_type === 'general',
      payment_status: 'pending',
      payment_amount: amount,
    }).select().single();

    if (data) {
      setBanners([data, ...banners]);
      setShowForm(false);
      setBannerTitle('');
      setBannerLink('');
      setBannerDesc('');
    }
  };

  if (isLoading || loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" /></div>;
  }

  // Registration form
  if (!advertiser) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-6">광고주 등록</h1>
        <div className="bg-dark-700 rounded-xl border border-border p-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">광고주 유형</label>
            <div className="flex gap-3">
              <button onClick={() => setAdvType('verified')} className={`flex-1 py-3 rounded-lg text-sm font-medium border ${advType === 'verified' ? 'border-accent bg-accent/10 text-accent' : 'border-border'}`}>인증업체</button>
              <button onClick={() => setAdvType('general')} className={`flex-1 py-3 rounded-lg text-sm font-medium border ${advType === 'general' ? 'border-accent bg-accent/10 text-accent' : 'border-border'}`}>일반</button>
            </div>
          </div>

          {advType === 'verified' && (
            <>
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="회사명" className="w-full px-4 py-3 bg-dark-800 border border-border rounded-lg text-sm" />
              <input value={bizNumber} onChange={(e) => setBizNumber(e.target.value)} placeholder="사업자등록번호" className="w-full px-4 py-3 bg-dark-800 border border-border rounded-lg text-sm" />
              <input value={repName} onChange={(e) => setRepName(e.target.value)} placeholder="대표자명" className="w-full px-4 py-3 bg-dark-800 border border-border rounded-lg text-sm" />
            </>
          )}

          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="연락처" className="w-full px-4 py-3 bg-dark-800 border border-border rounded-lg text-sm" />
          <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="이메일" className="w-full px-4 py-3 bg-dark-800 border border-border rounded-lg text-sm" />

          <button onClick={handleRegister} className="w-full py-3 bg-accent text-white rounded-lg font-medium">등록하기</button>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">광고주 대시보드</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm">
          <Plus className="w-4 h-4" /> 새 배너 등록
        </button>
      </div>

      {/* Banner Form */}
      {showForm && (
        <div className="bg-dark-700 rounded-xl border border-border p-6 mb-8 space-y-4">
          <h3 className="font-bold">새 배너 등록</h3>
          {bannerError && <p className="text-up text-sm">{bannerError}</p>}

          <div>
            <label className="text-xs text-text-secondary mb-1 block">제목 ({bannerTitle.length}/30)</label>
            <input value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value.slice(0, 30))} placeholder="배너 제목" className="w-full px-4 py-2.5 bg-dark-800 border border-border rounded-lg text-sm" />
          </div>

          <input value={bannerLink} onChange={(e) => setBannerLink(e.target.value)} placeholder="링크 URL" className="w-full px-4 py-2.5 bg-dark-800 border border-border rounded-lg text-sm" />

          <div>
            <label className="text-xs text-text-secondary mb-1 block">상세 설명 ({bannerDesc.length}/500)</label>
            <textarea value={bannerDesc} onChange={(e) => setBannerDesc(e.target.value.slice(0, 500))} placeholder="상세 설명" rows={3} className="w-full px-4 py-2.5 bg-dark-800 border border-border rounded-lg text-sm resize-none" />
          </div>

          <select value={productType} onChange={(e) => setProductType(e.target.value)} className="w-full px-4 py-2.5 bg-dark-800 border border-border rounded-lg text-sm">
            <option value="investment_product">투자상품</option>
            <option value="reading_room">리딩방</option>
            <option value="education">교육</option>
            <option value="other">기타</option>
          </select>

          <div>
            <label className="text-xs text-text-secondary mb-1 block">기간</label>
            <div className="flex gap-3">
              {[{ d: 20, label: '20일' }, { d: 40, label: '40일 (-10%)' }, { d: 60, label: '60일 (-15%)' }].map((opt) => (
                <button key={opt.d} onClick={() => setBannerPeriod(opt.d)} className={`flex-1 py-2 rounded-lg text-sm border ${bannerPeriod === opt.d ? 'border-accent bg-accent/10' : 'border-border'}`}>{opt.label}</button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {['투자 수익을 보장하는 표현을 사용하지 않겠습니다', '허위/과장 광고를 하지 않겠습니다', '광고 게재 약관에 동의합니다'].map((text, i) => (
              <label key={i} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={agreements[i]} onChange={() => { const a = [...agreements]; a[i] = !a[i]; setAgreements(a); }} className="rounded" />
                {text}
              </label>
            ))}
          </div>

          <button onClick={handleCreateBanner} className="w-full py-3 bg-accent text-white rounded-lg font-medium">배너 등록 및 결제</button>
        </div>
      )}

      {/* Banner List */}
      <div className="bg-dark-700 rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-dark-800 text-text-secondary text-xs">
              <th className="text-left px-4 py-3 font-normal">제목</th>
              <th className="text-left px-4 py-3 font-normal">유형</th>
              <th className="text-left px-4 py-3 font-normal">기간</th>
              <th className="text-left px-4 py-3 font-normal">상태</th>
              <th className="text-right px-4 py-3 font-normal">클릭수</th>
              <th className="text-right px-4 py-3 font-normal">금액</th>
            </tr>
          </thead>
          <tbody>
            {banners.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-text-secondary text-sm">등록된 배너가 없습니다</td></tr>
            ) : banners.map((b) => (
              <tr key={b.id} className="border-t border-border/50 hover:bg-dark-600/30">
                <td className="px-4 py-3 text-sm">{b.title}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded ${b.banner_tier === 'premium' ? 'bg-accent/20 text-accent' : 'bg-dark-600 text-text-secondary'}`}>{b.banner_tier === 'premium' ? '인증' : '일반'}</span></td>
                <td className="px-4 py-3 text-xs text-text-secondary">{formatDate(b.start_date)} ~ {formatDate(b.end_date)}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded ${b.is_active ? 'bg-success/20 text-success' : 'bg-dark-600 text-text-secondary'}`}>{b.is_active ? '진행중' : '비활성'}</span></td>
                <td className="px-4 py-3 text-right text-sm font-mono-price">{formatNumber(b.click_count)}</td>
                <td className="px-4 py-3 text-right text-sm font-mono-price">{b.payment_amount ? formatNumber(b.payment_amount) + '원' : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
