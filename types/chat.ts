export interface ChatMessage {
  id: number;
  user_id: string;
  nickname: string;
  room: string;
  content: string;
  is_deleted: boolean;
  created_at: string;
}

export interface ChatPenalty {
  id: number;
  user_id: string;
  penalty_type: 'warning' | 'mute_30min' | 'mute_1month';
  reason: string | null;
  warning_count: number;
  muted_until: string | null;
  created_at: string;
}

export type ChatRoom = 'general' | 'kospi' | 'nasdaq' | 'free';
