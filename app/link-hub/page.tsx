'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCountryStore } from '@/stores/countryStore';
import { LINK_CATEGORIES } from '@/lib/constants/linkHub';
import { COUNTRY_MAP } from '@/lib/constants/countries';
import { ExternalLink, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import type { LinkHub } from '@/types/api';

export default function LinkHubPage() {
  const { country } = useCountryStore();
  const [links, setLinks] = useState<Record<string, LinkHub[]>>({});
  const [activeCategory, setActiveCategory] = useState<string>(LINK_CATEGORIES[0].key);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [sortByPopular, setSortByPopular] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from('link_hub')
        .select('*')
        .eq('country', country)
        .eq('is_active', true)
        .order('display_order');

      if (data) {
        const grouped: Record<string, LinkHub[]> = {};
        data.forEach((item: LinkHub) => {
          if (!grouped[item.category]) grouped[item.category] = [];
          grouped[item.category].push(item);
        });
        setLinks(grouped);
      }
      setLoading(false);
    };
    load();
  }, [country]);

  const scrollToSection = (key: string) => {
    setActiveCategory(key);
    sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLinkClick = async (link: LinkHub) => {
    try {
      const supabase = createClient();
      await supabase.from('link_hub').update({ click_count: (link.click_count || 0) + 1 }).eq('id', link.id);
    } catch {}
  };

  const getSortedLinks = (items: LinkHub[]) => {
    if (!sortByPopular) return items;
    return [...items].sort((a, b) => (b.click_count || 0) - (a.click_count || 0));
  };

  const countryInfo = COUNTRY_MAP[country];

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2 text-black">투자 정보 허브</h1>
        <p className="text-[#999999] text-sm">주식 투자에 필요한 모든 사이트를 카테고리별로 정리했습니다</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <Globe className="w-4 h-4 text-[#0ABAB5]" />
          <span className="text-sm text-[#0ABAB5] font-bold">{countryInfo?.flag} {countryInfo?.name} 기준</span>
        </div>
      </div>

      <div className="sticky top-0 z-30 bg-white border-b border-[#E5E7EB] py-2 mb-8">
        <div className="flex items-center gap-1 overflow-x-auto">
          {LINK_CATEGORIES.map((cat) => (
            <button key={cat.key} onClick={() => scrollToSection(cat.key)}
              className={`px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors ${
                activeCategory === cat.key ? 'bg-[#0ABAB5] text-white' : 'text-black hover:text-[#0ABAB5]'
              }`}>{cat.label}</button>
          ))}
          <div className="ml-auto shrink-0">
            <button onClick={() => setSortByPopular(!sortByPopular)}
              className={`px-3 py-1.5 text-xs font-bold ${sortByPopular ? 'text-[#0ABAB5]' : 'text-[#999999]'}`}>
              {sortByPopular ? '인기순' : '기본순'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (<div key={i} className="h-32 bg-[#F0F0F0] animate-pulse" />))}
        </div>
      ) : (
        <div className="space-y-10">
          {LINK_CATEGORIES.map((cat) => {
            const isCollapsed = collapsed[cat.key];
            const items = getSortedLinks(links[cat.key] || []);
            return (
              <section key={cat.key} ref={(el) => { sectionRefs.current[cat.key] = el; }} className="scroll-mt-20">
                <button onClick={() => toggleCollapse(cat.key)}
                  className="w-full flex items-center justify-between mb-4 group">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-black">
                    <div className="w-1 h-5 bg-[#0ABAB5]" />
                    {cat.label}
                    <span className="text-sm text-[#999999] font-medium">({items.length})</span>
                  </h2>
                  {isCollapsed ? <ChevronDown className="w-5 h-5 text-[#999999]" /> : <ChevronUp className="w-5 h-5 text-[#999999]" />}
                </button>
                {!isCollapsed && (
                  <div className="grid grid-cols-3 gap-4">
                    {items.map((link) => (
                      <a key={link.id} href={link.site_url} target="_blank" rel="noopener noreferrer"
                        onClick={() => handleLinkClick(link)}
                        className="bg-white border-[3px] border-[#0ABAB5] p-5 hover:border-black transition-colors group">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-sm text-black group-hover:text-[#0ABAB5] transition-colors">{link.site_name}</h3>
                            {link.description && (<p className="text-xs text-[#999999] mt-1.5 line-clamp-2">{link.description}</p>)}
                          </div>
                          <ExternalLink className="w-4 h-4 text-[#999999] shrink-0 mt-0.5 group-hover:text-[#0ABAB5]" />
                        </div>
                      </a>
                    ))}
                    {items.length === 0 && (
                      <p className="col-span-3 text-center text-[#999999] text-sm py-8 font-medium">등록된 링크가 없습니다</p>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
