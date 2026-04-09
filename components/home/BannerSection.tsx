'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { BadgeCheck, ExternalLink } from 'lucide-react';
import type { Banner } from '@/types/advertiser';
import Link from 'next/link';

export default function BannerSection() {
  const [premiumBanners, setPremiumBanners] = useState<Banner[]>([]);
  const [standardBanners, setStandardBanners] = useState<Banner[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const today = new Date().toISOString().split('T')[0];

      const { data } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .eq('payment_status', 'paid')
        .lte('start_date', today)
        .gte('end_date', today)
        .order('position_priority', { ascending: false });

      if (data) {
        setPremiumBanners(data.filter((b: Banner) => b.banner_tier === 'premium'));
        setStandardBanners(data.filter((b: Banner) => b.banner_tier === 'standard'));
      }
    };
    load();
  }, []);

  const handleClick = async (banner: Banner) => {
    const supabase = createClient();
    // 클릭 로그
    await supabase.from('banner_clicks').insert({
      banner_id: banner.id,
      user_id: user?.id || null,
      page_location: 'home',
    });
    // 클릭수 업데이트
    await supabase.from('banners').update({ click_count: banner.click_count + 1 }).eq('id', banner.id);
    window.open(banner.link_url, '_blank');
  };

  return (
    <section className="space-y-6">
      {/* Premium Banners */}
      {premiumBanners.length > 0 && (
        <div>
          <h3 className="text-sm font-bold mb-3 text-black">인증업체</h3>
          <div className="grid grid-cols-2 gap-4">
            {premiumBanners.map((banner) => (
              <button
                key={banner.id}
                onClick={() => handleClick(banner)}
                className="bg-white border-[3px] border-[#0ABAB5] p-4 hover:border-black transition-colors text-left"
              >
                <div className="flex items-center gap-2 mb-2">
                  <BadgeCheck className="w-4 h-4 text-[#0ABAB5]" />
                  <span className="text-xs text-[#0ABAB5] font-bold">인증업체</span>
                </div>
                {banner.banner_image_url && (
                  <img src={banner.banner_image_url} alt={banner.title} className="w-full h-32 object-cover mb-3" />
                )}
                <h4 className="font-bold text-sm text-black">{banner.title}</h4>
                {banner.description && (
                  <p className="text-xs text-[#999999] mt-1 line-clamp-2">{banner.description}</p>
                )}
                <div className="flex items-center gap-1 mt-2 text-xs text-black font-bold">
                  <ExternalLink className="w-3 h-3" /> 자세히 보기
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Standard Banners */}
      {standardBanners.length > 0 && (
        <div>
          <p className="text-xs text-[#999999] bg-[#F5F5F5] px-3 py-2 mb-3 border border-[#E5E7EB]">
            아래 단톡방은 사업자인증을 한 것이 아니니 참고용으로만 이용해주세요
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {standardBanners.map((banner) => (
              <button
                key={banner.id}
                onClick={() => handleClick(banner)}
                className="shrink-0 w-64 bg-white border border-[#E5E7EB] p-3 hover:border-[#0ABAB5] transition-colors text-left"
              >
                <h4 className="text-sm font-bold text-black truncate">{banner.title}</h4>
                {banner.description && (
                  <p className="text-xs text-[#999999] mt-1 truncate">{banner.description}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {premiumBanners.length === 0 && standardBanners.length === 0 && (
        <div className="bg-white border-[3px] border-[#0ABAB5] p-8 text-center">
          <BadgeCheck className="w-8 h-8 text-[#0ABAB5] mx-auto mb-3" />
          <p className="text-black text-sm mb-1 font-bold">광고 파트너를 모집합니다</p>
          <p className="text-[#999999] text-xs mb-3">인증업체 및 단톡방 광고를 등록해보세요</p>
          <Link href="/advertiser" className="inline-block px-4 py-2 bg-[#0ABAB5] text-white text-sm font-bold hover:bg-[#088F8C] transition-colors">
            광고주 신청하기
          </Link>
        </div>
      )}
    </section>
  );
}
