import React, { useState } from 'react';
import { Lock, ShieldAlert, KeyRound, Wifi, WifiOff, Phone, CheckCircle, AlertTriangle } from 'lucide-react';
import { SUBSCRIPTION_PHONE, MASTER_LICENSE_KEY } from '../../utils/licenseSecurity';

interface RemoteLockScreenProps {
  terminalCode: string;
  terminalName: string;
  lockReason?: string;
  onUnlock: (passcodeOrCode: string) => boolean;
  lang?: 'bn' | 'en';
}

export const RemoteLockScreen: React.FC<RemoteLockScreenProps> = ({
  terminalCode,
  terminalName,
  lockReason,
  onUnlock,
  lang = 'bn',
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!code.trim()) {
      setError(lang === 'bn' ? 'দয়া করে আনলক কোড বা অ্যাডমিন পিন দিন।' : 'Please enter unlock code or PIN.');
      return;
    }

    const success = onUnlock(code.trim());
    if (!success) {
      setError(
        lang === 'bn'
          ? 'ভুল আনলক কোড! সঠিক অ্যাডমিন পিন বা মোবাইল থেকে তৈরি করা অফলাইন কোড দিন।'
          : 'Invalid unlock code or admin PIN.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="max-w-lg w-full bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-6 sm:p-8 text-white shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-amber-400 shadow-lg animate-pulse">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
            {lang === 'bn' ? 'অ্যাডমিন রিমোট লক' : 'Admin Remote Lock'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {lang === 'bn' ? 'এই পিসিটি দূর থেকে লক করা হয়েছে' : 'This PC is Remotely Locked'}
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Terminal: <strong className="text-amber-300 font-bold">{terminalCode}</strong> ({terminalName})
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-700/60 text-xs text-amber-200 leading-relaxed text-left">
          <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{lang === 'bn' ? 'লক হওয়ার কারণ / নোটিশ:' : 'Lock Reason:'}</span>
          </div>
          <p className="text-amber-100">
            {lockReason ||
              (lang === 'bn'
                ? 'সুপার অ্যাডমিন কর্তৃক মোবাইল রিমোট কন্ট্রোল দিয়ে এই পিসিটি সাময়িকভাবে লক করা হয়েছে।'
                : 'This terminal has been temporarily locked by the administrator.')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <label className="text-xs font-bold text-slate-300 block text-left">
            {lang === 'bn' ? 'অ্যাডমিন পাসকোড বা অফলাইন আনলক কোড দিন:' : 'Enter Admin Passcode or Offline Unlock Code:'}
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. 512022 or UNLK-PC..."
              className="flex-1 bg-slate-800 border-2 border-slate-700 focus:border-amber-500 p-3 rounded-xl text-sm font-mono text-center tracking-widest text-white outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs cursor-pointer transition active:scale-95 shadow-md"
            >
              {lang === 'bn' ? 'আনলক' : 'Unlock'}
            </button>
          </div>
          {error && <p className="text-xs font-bold text-rose-400 text-left">{error}</p>}
        </form>

        <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>জরুরি যোগাযোগ: <strong className="font-mono text-amber-300">{SUBSCRIPTION_PHONE}</strong></span>
          <span className="flex items-center gap-1 text-slate-400">
            <WifiOff className="w-3 h-3" />
            <span>অফলাইনেও কার্যকর</span>
          </span>
        </div>
      </div>
    </div>
  );
};
