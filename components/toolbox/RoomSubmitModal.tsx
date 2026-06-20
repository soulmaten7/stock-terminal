'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import SelectDropdown from './SelectDropdown';

const PLATFORMS = [['telegram', '텔레그램'], ['kakao', '카카오톡'], ['naver', '네이버'], ['etc', '기타']] as const;
const inputCls = 'w-full rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent';

export default function RoomSubmitModal({ onClose }: { onClose: (submitted: boolean) => void }) {
  const [roomName, setRoomName] = useState('');
  const [platform, setPlatform] = useState('telegram');
  const [homepage, setHomepage] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [bizNo, setBizNo] = useState('');
  const [intro, setIntro] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!roomName.trim() || !/^https?:\/\//.test(homepage.trim())) {
      setError('리딩방 이름과 링크(http로 시작)를 확인해주세요.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const r = await fetch('/api/rooms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_name: roomName, platform, homepage, company_name: companyName, biz_no: bizNo, intro }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error === 'login_required' ? '로그인이 필요합니다.' : (j.error ?? '제출 실패'));
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '제출 실패');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-unjong-border bg-unjong-surface p-4 shadow-xl">
        <div className="mb-3 flex items-start justify-between">
          <h3 className="text-sm font-bold text-unjong-primary">내 리딩방 등록</h3>
          <button type="button" onClick={() => onClose(false)} aria-label="닫기" className="text-unjong-muted hover:text-unjong-primary">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-unjong-primary">등록이 접수되었습니다.</p>
            <p className="mt-1 text-xs leading-relaxed text-unjong-muted">목록에 표시됩니다. (금감원 등록 확인 배지는 본인확인 도입 후 부여)</p>
            <button type="button" onClick={() => onClose(true)} className="mt-4 rounded-lg bg-unjong-primary px-4 py-2 text-sm font-semibold text-white">닫기</button>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-unjong-muted">리딩방 이름 *</span>
              <input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="예: 신혼테크" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-unjong-muted">플랫폼</span>
              <SelectDropdown value={platform} onChange={setPlatform} options={PLATFORMS.map(([v, l]) => ({ value: v, label: l }))} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-unjong-muted">링크(입장 URL) *</span>
              <input value={homepage} onChange={(e) => setHomepage(e.target.value)} placeholder="https://t.me/..." className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-unjong-muted">운영 업체명 (선택)</span>
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-unjong-muted">사업자등록번호 (선택)</span>
              <input value={bizNo} onChange={(e) => setBizNo(e.target.value)} placeholder="10자리 숫자" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-unjong-muted">한줄소개 (선택)</span>
              <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
            </label>

            <p className="text-[11px] leading-relaxed text-unjong-muted">
              제출 시 입력한 사업자번호·업체명을 금감원 신고 명부와 자동 대조합니다. 허위 등록은 신고될 수 있습니다.
            </p>
            {error ? <p className="text-xs text-red-500">{error}</p> : null}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => onClose(false)} className="flex-1 rounded-lg border border-unjong-border py-2 text-sm font-medium text-unjong-muted hover:bg-unjong-background">취소</button>
              <button type="button" onClick={submit} disabled={submitting} className="flex-1 rounded-lg bg-unjong-primary py-2 text-sm font-semibold text-white disabled:opacity-50">{submitting ? '제출 중…' : '등록하기'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
