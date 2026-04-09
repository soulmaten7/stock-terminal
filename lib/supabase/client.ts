import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isValidUrl = supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://');

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!isValidUrl) {
    throw new Error(
      'Supabase URL이 설정되지 않았습니다. .env.local에 NEXT_PUBLIC_SUPABASE_URL을 올바르게 설정하세요.'
    );
  }
  if (!_client) {
    _client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return _client;
}
