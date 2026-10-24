import React, { useState } from 'react';
import { ShieldAlert, PowerOff, KeyRound, Phone, AlertOctagon, RotateCw, WifiOff } from 'lucide-react';
import { SUBSCRIPTION_PHONE, MASTER_LICENSE_KEY } from '../../utils/licenseSecurity';

interface RemoteKillScreenProps {
  terminalCode: string;
  terminalName: string;
  killReason?: string;
  onReactivate: (passcodeOrKey: string) => boolean;
  lang?: 'bn' | 'en';
}

export const RemoteKillScreen: React.FC<RemoteKillScreenProps> = ({
  terminalCode,
  terminalName,
  killReason,
  onReactivate,
  lang = 'bn',
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!code.trim()) {
      setError(lang === 'bn' ? 'সুপার অ্যাডমিন কোড প্রদান করুন।' : 'Please enter reactivation code.');
      return;
    }

    const success = onReactivate(code.trim());
    if (!success) {
      setError(
        lang === 'bn'
          ? 'ভুল রিয়্যাক্টিভেশন কোড! সঠিক মাস্টার কি অথবা মোবাইল রিমোট আনকিল কোড প্রদান করুন।'
          : 'Invalid reactivation code.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-red-950/98 backdrop-blur-lg flex items-center justify-center p-4 select-none">
      <div className="max-w-lg w-full bg-slate-950 border-2 border-red-600 rounded-3xl p-6 sm:p-8 text-white shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-red-600/20 border-2 border-red-500 flex items-center justify-center text-red-500 shadow-xl shadow-red-900/50 animate-pulse">
          <PowerOff className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-600 text-white shadow-md">
            {lang === 'bn' ? 'ইমার্জেন্সি রিমোট কিল সুইচ' : 'Emergency Remote Kill Switch'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {lang === 'bn' ? 'এই পিসির সফটওয়্যার বন্ধ করা হয়েছে' : 'Software Deactivated on this PC'}
          </h2>
          <p className="text-xs text-red-300 font-mono">
            Terminal: <strong className="text-white font-bold">{terminalCode}</strong> ({terminalName})
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-red-950/70 border border-red-800 text-xs text-red-200 leading-relaxed text-left space-y-2">
          <div className="font-bold flex items-center gap-1.5 text-red-300 text-sm">
            <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
            <span>{lang === 'bn' ? 'জরুরি নোটিশ:' : 'Emergency Notice:'}</span>
          </div>
          <p className="text-white font-semibold">
            {killReason ||
              (lang === 'bn'
                ? 'হাসপাতাল মালিক বা সুপার অ্যাডমিন মোবাইল রিমোট কন্ট্রোল দিয়ে এই পিসির সফটওয়্যার কার্যক্রম বন্ধ বা স্থগিত করে দিয়েছেন।'
                : 'Hospital Authority has deactivated software access on this workstation via Remote Kill Switch.')}
          </p>
          <p className="text-red-300 text-[11px]">
            পুনরায় চালু করতে হাসপাতাল সুপার অ্যাডমিনের অনুমতি বা রিয়্যাক্টিভেশন মাস্টার কোড প্রয়োজন।
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <label className="text-xs font-bold text-slate-300 block text-left">
            {lang === 'bn' ? 'সুপার অ্যাডমিন রিয়্যাক্টিভেশন কোড:' : 'Super Admin Reactivation Code:'}
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. raidaraha... or UNKILL-PC..."
              className="flex-1 bg-slate-900 border-2 border-red-800 focus:border-red-500 p-3 rounded-xl text-sm font-mono text-center tracking-widest text-white outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="px-5 py-3 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black rounded-xl text-xs cursor-pointer transition active:scale-95 shadow-md flex items-center gap-1.5 shrink-0"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'চালু করুন' : 'Reactivate'}</span>
            </button>
          </div>
          {error && <p className="text-xs font-bold text-rose-400 text-left">{error}</p>}
        </form>

        <div className="pt-3 border-t border-slate-900 text-[11px] text-slate-400 flex items-center justify-between">
          <span>হেল্পলাইন: <strong className="font-mono text-amber-300">{SUBSCRIPTION_PHONE}</strong></span>
          <span className="flex items-center gap-1 text-slate-400">
            <WifiOff className="w-3 h-3" />
            <span>অফলাইন প্রটেক্টেড</span>
          </span>
        </div>
      </div>
    </div>
  );
};
