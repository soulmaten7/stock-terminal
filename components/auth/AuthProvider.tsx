'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      setUser(data);
    };

    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    };

    loadUser();

    // ⚠️ onAuthStateChange 콜백은 반드시 "동기"로 유지하고, supabase 호출은
    // setTimeout으로 콜백 밖(=auth 락 해제 후)에서 실행한다.
    // 콜백 안에서 await supabase.* 를 호출하면 auth 락 데드락이 발생해
    // getSession()이 영원히 멈춘다(= 로그인 상태가 화면에 안 뜸).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const uid = session.user.id;
        setTimeout(() => { fetchProfile(uid); }, 0);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  return <>{children}</>;
}
