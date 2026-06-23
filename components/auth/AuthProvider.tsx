'use client';

import { useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    const fetchProfile = async (userId: string) => {
      try {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        setUser(data);
      } finally {
        setLoading(false); // 프로필 로드 완료 후에만 로딩 해제 (레이스 방지)
      }
    };

    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchProfile(session.user.id); // setLoading(false)는 fetchProfile이 담당
      } else {
        setLoading(false);
      }
    };

    loadUser();

    // ⚠️ onAuthStateChange 콜백은 반드시 "동기"로 유지(STEP 319, auth 락 데드락 방지)
    //    → supabase 호출은 setTimeout으로 콜백 밖에서 실행.
    // 🔑 세션이 있으면 여기서 setLoading(false) 하지 말 것 — user가 아직 null인
    //    찰나에 보호 페이지(마이페이지)가 로그인으로 튕긴다(레이스). fetchProfile 완료로 미룬다.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: unknown, session: Session | null) => {
      if (session?.user) {
        const uid = session.user.id;
        setTimeout(() => { fetchProfile(uid); }, 0);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  return <>{children}</>;
}
