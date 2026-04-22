'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Stock } from '@/types/stock';
import AuthGuard from '@/components/auth/AuthGuard';
import ValueAnalysis from '@/components/analysis/ValueAnalysis';
import TechnicalAnalysis from '@/components/analysis/TechnicalAnalysis';
import QuantAnalysis from '@/components/analysis/QuantAnalysis';
import DividendAnalysis from '@/components/analysis/DividendAnalysis';
import SupplyAnalysis from '@/components/analysis/SupplyAnalysis';
import { ArrowLeft } from 'lucide-react';

const TABS = [
  { key: 'value', label: '가치투자' },
  { key: 'technical', label: '기술적분석' },
  { key: 'quant', label: '퀀트' },
  { key: 'dividend', label: '배당투자' },
  { key: 'supply', label: '수급분석' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function AnalysisPage() {
  const params = useParams();
  const symbol = params.symbol as string;
  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('value');

  useEffect(() => {
    async function loadStock() {
      try {
        const res = await fetch(`/api/stocks/resolve?symbol=${symbol.toUpperCase()}`);
        const json = await res.json();
        if (json.stock) setStock(json.stock as Stock);
      } catch {}
      setLoading(false);
    }
    loadStock();
  }, [symbol]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-dark-900">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-dark-900 text-text-primary">
        <p className="text-xl mb-4">종목을 찾을 수 없습니다</p>
        <Link href="/stocks" className="text-accent hover:underline">
          종목 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  function renderTab() {
    // KIS fallback 종목 — AI 분석 탭 모두 비활성
    if (stock && stock.id === null) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-dark-800 rounded-lg">
          <p className="text-text-primary font-bold mb-2">AI 분석은 확장 데이터 연결 후 이용 가능합니다</p>
          <Link href={`/stocks/${symbol}`} className="text-accent hover:underline text-sm mt-2">
            종목 대시보드로 돌아가기
          </Link>
        </div>
      );
    }

    switch (activeTab) {
      case 'value':
        return <ValueAnalysis stockId={stock!.id!} />;
      case 'technical':
        return <TechnicalAnalysis stockId={stock!.id!} />;
      case 'quant':
        return <QuantAnalysis stockId={stock!.id!} />;
      case 'dividend':
        return <DividendAnalysis stockId={stock!.id!} />;
      case 'supply':
        return <SupplyAnalysis stockId={stock!.id!} />;
      default:
        return null;
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-dark-900 text-text-primary">
        {/* Header */}
        <div className="border-b border-border bg-dark-800 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <Link
              href={`/stocks/${symbol}`}
              className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              종목 대시보드로 돌아가기
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{stock.name_ko || stock.name_en}</h1>
              <span className="text-text-secondary text-sm font-mono-price">{stock.symbol}</span>
              <span className="px-2 py-0.5 text-xs rounded bg-dark-700 border border-border text-text-secondary">
                AI 종합분석
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-border bg-dark-800 px-6 overflow-x-auto">
          <div className="max-w-7xl mx-auto flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          {renderTab()}
        </div>
      </div>
    </AuthGuard>
  );
}
