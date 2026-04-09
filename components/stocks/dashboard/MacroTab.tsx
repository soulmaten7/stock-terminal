'use client';

import { useState, useEffect } from 'react';
import { formatDate, formatPercent } from '@/lib/utils/format';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';

interface FredIndicator {
  series_id: string;
  label: string;
  unit: string;
  value: number | null;
  previous_value: number | null;
  date: string | null;
  change: number | null;
}

interface FredObservation {
  date: string;
  value: number;
}

const INDICATOR_COLORS: Record<string, string> = {
  GDP: '#34C759',
  CPIAUCSL: '#AF52DE',
  FEDFUNDS: '#FF3B30',
  UNRATE: '#FF9500',
  DGS10: '#0ABAB5',
};

export default function MacroTab() {
  const [indicators, setIndicators] = useState<FredIndicator[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<Record<string, FredObservation[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/fred?mode=summary');
        const data = await res.json();
        if (data.indicators) {
          setIndicators(data.indicators);
        }
      } catch {
        // API 실패 시 빈 배열 유지
      }
      setLoading(false);
    }
    load();
  }, []);

  async function toggleExpand(seriesId: string) {
    if (expanded === seriesId) {
      setExpanded(null);
      return;
    }

    if (!historyData[seriesId]) {
      try {
        const res = await fetch(`/api/fred?series_id=${seriesId}&limit=60`);
        const data = await res.json();
        if (data.observations) {
          setHistoryData((prev) => ({
            ...prev,
            [seriesId]: data.observations.reverse(),
          }));
        }
      } catch {
        // 히스토리 로드 실패 시 빈 배열
        setHistoryData((prev) => ({ ...prev, [seriesId]: [] }));
      }
    }

    setExpanded(seriesId);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-dark-700 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (indicators.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <TrendingUp className="w-10 h-10 text-text-secondary/30 mb-3" />
        <p className="text-text-secondary text-sm">거시경제 데이터를 불러올 수 없습니다</p>
        <p className="text-text-secondary/60 text-xs mt-1">FRED API 키를 확인해주세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {indicators.map((ind) => {
        const color = INDICATOR_COLORS[ind.series_id] || '#0ABAB5';
        const isExpanded = expanded === ind.series_id;
        const history = historyData[ind.series_id] || [];

        return (
          <div key={ind.series_id} className="bg-dark-700 rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => toggleExpand(ind.series_id)}
              className="w-full p-4 flex items-center justify-between hover:bg-dark-800/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <div className="text-left">
                  <p className="text-text-primary font-medium text-sm">{ind.label}</p>
                  {ind.date && (
                    <p className="text-text-secondary text-xs mt-0.5">
                      {formatDate(ind.date)} 기준
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {ind.value != null ? (
                  <div className="text-right">
                    <p className="text-text-primary font-bold font-mono-price">
                      {ind.value.toLocaleString()} {ind.unit}
                    </p>
                    {ind.change != null && (
                      <div className="flex items-center justify-end gap-1">
                        {ind.change >= 0 ? (
                          <TrendingUp className="w-3 h-3 text-up" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-down" />
                        )}
                        <p className={`text-xs font-mono-price ${ind.change >= 0 ? 'text-up' : 'text-down'}`}>
                          {ind.change >= 0 ? '+' : ''}{ind.change.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-text-secondary text-sm">데이터 없음</p>
                )}
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-text-secondary" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-text-secondary" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-border p-4">
                {history.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#999', fontSize: 11 }}
                        tickFormatter={(v) => v.slice(5)}
                      />
                      <YAxis tick={{ fill: '#999', fontSize: 11 }} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        name={ind.label}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-text-secondary text-sm text-center py-8">
                    차트 데이터를 불러오는 중...
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
