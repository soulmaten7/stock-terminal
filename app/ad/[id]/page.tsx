'use client';

import { useParams } from 'next/navigation';
import { BadgeCheck, ExternalLink, Phone, Mail, Clock, Tag } from 'lucide-react';
import Link from 'next/link';

interface AdPageData {
  company_name: string;
  description: string;
  logo_url: string | null;
  images: string[];
  links: { label: string; url: string }[];
  contact_phone: string | null;
  contact_email: string | null;
  business_hours: string | null;
  tags: string[];
  is_verified: boolean;
}

const DUMMY: Record<string, AdPageData> = {
  demo: {
    company_name: '프리미엄 리서치',
    description: `## 소개\n\n프리미엄 리서치는 전문 애널리스트가 운영하는 투자 리서치 그룹입니다.\n\n### 제공 서비스\n- 매일 아침 시장 브리핑\n- 주간 종목 리포트\n- 실시간 매매 시그널\n- 1:1 투자 상담\n\n### 실적\n- 2025년 수익률: +42.3%\n- 회원 수: 3,200명\n- 운영 기간: 3년`,
    logo_url: null,
    images: [],
    links: [
      { label: '카카오톡 오픈채팅', url: 'https://open.kakao.com/example' },
      { label: '텔레그램 채널', url: 'https://t.me/example' },
      { label: '공식 홈페이지', url: 'https://example.com' },
    ],
    contact_phone: '02-1234-5678',
    contact_email: 'info@premiumresearch.com',
    business_hours: '평일 08:30 ~ 16:00 (장중)',
    tags: ['리딩방', '종목추천', '실시간시그널', '교육'],
    is_verified: true,
  },
};

function renderMarkdown(md: string) {
  return md.split('\n').map((line, i) => {
    if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-black mt-6 mb-3">{line.slice(3)}</h2>;
    if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-black mt-4 mb-2">{line.slice(4)}</h3>;
    if (line.startsWith('- ')) return <li key={i} className="text-black text-sm ml-4 list-disc">{line.slice(2)}</li>;
    if (line.trim() === '') return <br key={i} />;
    return <p key={i} className="text-black text-sm leading-relaxed">{line}</p>;
  });
}

export default function AdPage() {
  const params = useParams();
  const id = params.id as string;
  const data = DUMMY[id] || DUMMY['demo'];
  const borderColor = data.is_verified ? 'border-[#C9A96E]' : 'border-[#D1D5DB]';

  return (
    <div className="max-w-[800px] mx-auto px-4 py-8">
      {/* Header Card */}
      <div className={`bg-white border-[3px] ${borderColor} p-8 mb-6`}>
        <div className="flex items-start gap-6">
          {/* Logo */}
          <div className={`w-20 h-20 shrink-0 bg-[#F5F5F5] flex items-center justify-center border ${borderColor}`}>
            {data.logo_url ? (
              <img src={data.logo_url} alt={data.company_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-[#0ABAB5]">{data.company_name.charAt(0)}</span>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-black">{data.company_name}</h1>
              {data.is_verified && (
                <span className="flex items-center gap-1 text-xs font-bold text-[#C9A96E] border border-[#C9A96E] px-2 py-0.5">
                  <BadgeCheck className="w-3.5 h-3.5" /> 인증
                </span>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {data.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 text-xs font-bold text-[#0ABAB5] bg-[#0ABAB5]/10 px-2 py-1">
                  <Tag className="w-3 h-3" /> {tag}
                </span>
              ))}
            </div>

            {/* Contact Info */}
            <div className="flex flex-wrap gap-4 text-sm">
              {data.contact_phone && (
                <span className="flex items-center gap-1 text-black"><Phone className="w-3.5 h-3.5 text-[#999999]" /> {data.contact_phone}</span>
              )}
              {data.contact_email && (
                <a href={`mailto:${data.contact_email}`} className="flex items-center gap-1 text-black hover:text-[#0ABAB5]">
                  <Mail className="w-3.5 h-3.5 text-[#999999]" /> {data.contact_email}
                </a>
              )}
              {data.business_hours && (
                <span className="flex items-center gap-1 text-black"><Clock className="w-3.5 h-3.5 text-[#999999]" /> {data.business_hours}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Links */}
      {data.links.length > 0 && (
        <div className="bg-white border-[3px] border-[#0ABAB5] p-6 mb-6">
          <h2 className="text-lg font-bold text-black mb-4">링크</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.links.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 bg-[#F5F5F5] hover:bg-[#E5E7EB] transition-colors">
                <span className="text-black font-bold text-sm">{link.label}</span>
                <ExternalLink className="w-4 h-4 text-[#999999]" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="bg-white border-[3px] border-[#0ABAB5] p-6 mb-6">
        <h2 className="text-lg font-bold text-black mb-4">소개</h2>
        <div>{renderMarkdown(data.description)}</div>
      </div>

      {/* Images */}
      {data.images.length > 0 && (
        <div className="bg-white border-[3px] border-[#0ABAB5] p-6 mb-6">
          <h2 className="text-lg font-bold text-black mb-4">갤러리</h2>
          <div className="grid grid-cols-2 gap-3">
            {data.images.map((img, i) => (
              <img key={i} src={img} alt={`${data.company_name} ${i + 1}`} className="w-full h-48 object-cover" />
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[#999999] text-xs text-center mt-8">
        본 페이지는 광고주가 직접 작성한 내용이며, StockTerminal은 이에 대한 책임을 지지 않습니다.
      </p>

      <div className="text-center mt-4">
        <Link href="/" className="text-[#0ABAB5] text-sm font-bold hover:underline">홈으로 돌아가기</Link>
      </div>
    </div>
  );
}
