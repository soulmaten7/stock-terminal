import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Row {
  [key: string]: string | number;
}

interface WidgetDetailStubProps {
  title: string;
  description: string;
  columns: string[];
  rows: Row[];
}

export default function WidgetDetailStub({ title, description, columns, rows }: WidgetDetailStubProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-black mb-4">
          <ArrowLeft className="w-4 h-4" />
          홈으로
        </Link>
        <h1 className="text-2xl font-bold text-black mb-1">{title}</h1>
        <p className="text-sm text-[#666]">{description}</p>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F0F0F0] flex items-center justify-between">
          <span className="text-sm font-bold text-black">{title}</span>
          <span className="text-[10px] font-bold text-[#0ABAB5] bg-[#0ABAB5]/10 px-2 py-0.5 rounded">
            실데이터 연결 예정
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#F0F0F0] bg-[#F8F9FA]">
                {columns.map((col) => (
                  <th key={col} className="px-4 py-2.5 text-left font-bold text-[#666]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-[#F0F0F0] hover:bg-[#F8F9FA]">
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-2 text-[#333]">
                      {String(row[col] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
