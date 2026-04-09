'use client';

import Link from 'next/link';
import { BadgeCheck, Users, BarChart3, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const FAQ = [
  { q: '광고 게재 기간은 어떻게 되나요?', a: '기본 20일이며, 40일(-10% 할인), 60일(-15% 할인) 옵션을 선택할 수 있습니다.' },
  { q: '인증업체와 일반 배너의 차이는?', a: '인증업체는 사업자등록증 확인 후 프리미엄 영역(상단, 큰 사이즈)에 노출되며 "인증업체" 마크가 부여됩니다. 일반 배너는 하단 영역에 노출됩니다.' },
  { q: '결제 방법은?', a: '카드, 카카오페이, 네이버페이, 토스페이 결제를 지원합니다.' },
  { q: '배너 수정이 가능한가요?', a: '게재 중인 배너의 이미지와 링크는 광고주 대시보드에서 수정 가능합니다.' },
  { q: '환불 정책은?', a: '게재 시작 후 3일 이내 클릭 0건인 경우 전액 환불이 가능합니다. 자세한 내용은 광고 게재 약관을 확인해주세요.' },
];

export default function AdvertiserPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-3xl font-bold mb-4">투자에 관심 있는 사용자에게<br />직접 다가가세요</h1>
        <p className="text-text-secondary text-lg mb-8">월 3만원부터 시작하는 타겟 광고</p>
        <Link
          href="/advertiser/dashboard"
          className="inline-flex items-center gap-2 px-8 py-3 bg-accent text-white rounded-xl font-bold text-lg hover:bg-accent/90"
        >
          광고 시작하기
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-16">
        <div className="bg-dark-700 rounded-xl p-6 text-center border border-border">
          <Users className="w-8 h-8 text-accent mx-auto mb-3" />
          <p className="text-2xl font-bold">10,000+</p>
          <p className="text-text-secondary text-sm">월간 활성 사용자</p>
        </div>
        <div className="bg-dark-700 rounded-xl p-6 text-center border border-border">
          <BarChart3 className="w-8 h-8 text-accent mx-auto mb-3" />
          <p className="text-2xl font-bold">50,000+</p>
          <p className="text-text-secondary text-sm">월간 페이지뷰</p>
        </div>
        <div className="bg-dark-700 rounded-xl p-6 text-center border border-border">
          <Shield className="w-8 h-8 text-accent mx-auto mb-3" />
          <p className="text-2xl font-bold">95%</p>
          <p className="text-text-secondary text-sm">투자 관심 사용자 비율</p>
        </div>
      </div>

      {/* Products */}
      <h2 className="text-xl font-bold text-center mb-8">광고 상품</h2>
      <div className="grid grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
        {/* Verified */}
        <div className="bg-dark-700 rounded-2xl border-2 border-accent p-8 relative">
          <div className="absolute -top-3 left-6 bg-accent text-white px-3 py-1 rounded-full text-xs font-bold">추천</div>
          <div className="flex items-center gap-2 mb-4">
            <BadgeCheck className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-bold">인증업체 배너</h3>
          </div>
          <p className="text-3xl font-bold mb-1">50,000원<span className="text-sm text-text-secondary font-normal"> / 20일</span></p>
          <ul className="space-y-2 mt-6 text-sm">
            <li className="flex items-center gap-2"><span className="text-success">✓</span> 프리미엄 상단 영역 노출</li>
            <li className="flex items-center gap-2"><span className="text-success">✓</span> 큰 사이즈 배너 (300x250)</li>
            <li className="flex items-center gap-2"><span className="text-success">✓</span> "인증업체" 마크 부여</li>
            <li className="flex items-center gap-2"><span className="text-success">✓</span> 클릭 통계 제공</li>
            <li className="flex items-center gap-2 text-text-secondary"><span>📋</span> 사업자등록증 제출 필요</li>
          </ul>
        </div>

        {/* General */}
        <div className="bg-dark-700 rounded-2xl border border-border p-8">
          <h3 className="text-lg font-bold mb-4">일반 배너</h3>
          <p className="text-3xl font-bold mb-1">30,000원<span className="text-sm text-text-secondary font-normal"> / 20일</span></p>
          <ul className="space-y-2 mt-6 text-sm">
            <li className="flex items-center gap-2"><span className="text-success">✓</span> 하단 일반 영역 노출</li>
            <li className="flex items-center gap-2"><span className="text-success">✓</span> 텍스트 또는 작은 배너</li>
            <li className="flex items-center gap-2"><span className="text-success">✓</span> 클릭 통계 제공</li>
            <li className="flex items-center gap-2"><span className="text-success">✓</span> 별도 인증 불필요</li>
          </ul>
        </div>
      </div>

      {/* Discounts */}
      <div className="bg-dark-800 rounded-xl p-6 text-center mb-16 max-w-2xl mx-auto">
        <h3 className="font-bold mb-3">장기 할인</h3>
        <div className="flex justify-center gap-8 text-sm">
          <span>40일 <span className="text-premium font-bold">-10%</span></span>
          <span>60일 <span className="text-premium font-bold">-15%</span></span>
        </div>
      </div>

      {/* FAQ */}
      <h2 className="text-xl font-bold text-center mb-8">자주 묻는 질문</h2>
      <div className="max-w-2xl mx-auto space-y-2">
        {FAQ.map((item, idx) => (
          <div key={idx} className="bg-dark-700 rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium hover:bg-dark-600"
            >
              {item.q}
              {openFaq === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {openFaq === idx && (
              <div className="px-5 pb-4 text-sm text-text-secondary">{item.a}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
