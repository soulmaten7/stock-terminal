import type { AnalysisType } from '@/lib/constants/analysisTypes';

export async function generateAnalysis(
  stockId: number,
  analysisType: AnalysisType,
  data: Record<string, unknown>
): Promise<string> {
  const res = await fetch('/api/ai-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stockId, analysisType, data }),
  });

  const result = await res.json();
  return result.content || '';
}
