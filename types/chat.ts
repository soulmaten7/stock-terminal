// V3: stock_tags 기반 단일 채팅
export interface ChatMessage {
  id: string;
  user_id: string | null;
  content: string;
  stock_tags: string[];
  created_at: string;
  hidden: boolean;
  report_count?: number;
}
