import React, { useState } from 'react';
import {
  Lock,
  ShieldAlert,
  KeyRound,
  Phone,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  WifiOff,
  AlertTriangle,
  MessageCircle,
  HelpCircle,
} from 'lucide-react';
import { SUBSCRIPTION_PHONE } from '../../utils/licenseSecurity';

interface LicenseLockModalProps {
  onRenew: (code: string) => { success: boolean; error?: string; message?: string };
  expiresAt: string;
  isTampered?: boolean;
  isUnactivated?: boolean;
  isTrialExpired?: boolean;
  workstationCode?: string;
  lang?: 'bn' | 'en';
}

export const LicenseLockModal: React.FC<LicenseLockModalProps> = ({
  onRenew,
  expiresAt,
  isTampered = false,
  isUnactivated = false,
  isTrialExpired = false,
  workstationCode = 'TERMINAL-PC',
  lang = 'bn',
}) => {
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCopyPhone = () => {
    navigator.clipboard?.writeText(SUBSCRIPTION_PHONE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePasteKey = async () => {
    try {
      const text = await navigator.clipboard?.readText();
      if (text) {
        setKeyInput(text.trim());
      }
    } catch {
      // ignore clipboard permission rejection
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!keyInput.trim()) {
      setErrorMsg(
        lang === 'bn'
          ? 'অনুগ্রহ করে লাইসেন্স অ্যাক্টিভেশন কি (Activation Key) ইনপুট দিন।'
          : 'Please enter the license activation key.'
      );
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = onRenew(keyInput.trim());
      setIsSubmitting(false);

      if (result.success) {
        setSuccessMsg(
          result.message ||
            (lang === 'bn'
              ? 'অভিনন্দন! সফটওয়্যার লাইসেন্স সক্রিয় হয়েছে। মূল ইন্টারফেসে প্রবেশ করা হচ্ছে...'
              : 'Success! License activated. Unlocking application...')
        );
      } else {
        setErrorMsg(
          result.error ||
            (lang === 'bn'
              ? 'ভুল অ্যাক্টিভেশন কি! সঠিক কোড প্রদান করুন অথবা ০১৭৪৪৪৬৫৫৫৭ নম্বরে যোগাযোগ করুন।'
              : 'Invalid activation key! Please enter the correct code or contact 01744465557.')
        );
      }
    }, 400);
  };

  const formattedExpiryDate = (() => {
    try {
      return new Date(expiresAt).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return expiresAt;
    }
  })();

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      style={{ userSelect: 'none' }}
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-red-500/70 overflow-hidden text-slate-800 dark:text-slate-100 my-auto">
        {/* Top Warning/Installation Banner Strip */}
        <div
          className={`text-white px-6 py-4 flex items-center justify-between shadow-inner ${
            isTrialExpired || isUnactivated
              ? 'bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900'
              : 'bg-gradient-to-r from-red-700 via-rose-700 to-red-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30 animate-pulse">
              {isTrialExpired || isUnactivated ? <KeyRound className="w-6 h-6 text-yellow-300" /> : <Lock className="w-6 h-6 text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    isTrialExpired || isUnactivated ? 'bg-amber-400 text-slate-950' : 'bg-white text-red-700'
                  }`}
                >
                  {isTrialExpired
                    ? (lang === 'bn' ? '৭ দিনের ট্রায়াল মেয়াদ সমাপ্ত' : '7-Day Trial Expired')
                    : isUnactivated
                    ? (lang === 'bn' ? 'সফটওয়্যার ইনস্টলেশন সেটআপ' : 'Software Installation Setup')
                    : (lang === 'bn' ? 'অ্যাক্সেস রেস্ট্রিকশন লক' : 'Access Restricted')}
                </span>
                <span className="flex items-center gap-1 text-[11px] bg-black/30 px-2 py-0.5 rounded-full border border-white/20">
                  <WifiOff className="w-3 h-3" />
                  <span>{lang === 'bn' ? 'অফলাইন প্রোটেকশন' : 'Offline Protected'}</span>
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight mt-0.5">
                {isTrialExpired
                  ? (lang === 'bn' ? '৭ দিনের ফ্রি ট্রায়াল শেষ — ৩ মাসের লাইসেন্স কি আবশ্যক' : '7-Day Trial Completed — 3-Month License Key Required')
                  : isUnactivated
                  ? (lang === 'bn' ? 'আদিবা হাসপাতাল সফটওয়্যার ইনস্টলেশন ও অ্যাক্টিভেশন' : 'Adiba Hospital Software Installation & Activation')
                  : (lang === 'bn' ? 'সফটওয়্যার লাইসেন্সিং ও রিনিউয়াল সিকিউরিটি সিস্টেম' : 'Software Licensing & Security Lock')}
              </h1>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end text-xs opacity-90">
            <span className="font-mono font-bold text-amber-200">Terminal: {workstationCode}</span>
            <span className="text-[11px] opacity-75">
              {isTrialExpired ? '7-Day Trial Finished' : isUnactivated ? 'Initial Setup' : '3-Month Quarterly Cycle'}
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-8 space-y-6">
          {/* Strict Notice Box - Exactly matching user prompt */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600/70 text-amber-950 dark:text-amber-100 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5 shadow-sm">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm sm:text-base font-bold text-amber-900 dark:text-amber-200">
                  {isTrialExpired
                    ? (lang === 'bn' ? 'ইনস্টলেশনের ৭ দিনের প্রাথমিক ফ্রি ট্রায়াল মেয়াদ শেষ হয়েছে!' : 'The 7-Day Initial Free Trial Period Has Ended!')
                    : isUnactivated
                    ? (lang === 'bn' ? 'সফটওয়্যার ইনস্টল করার জন্য সিকিউরিটি কোড প্রদান আবশ্যক' : 'Activation Key Required During Software Installation')
                    : isTampered
                    ? (lang === 'bn' ? 'সিস্টেম নিরাপত্তা লঙ্ঘন বা মেয়াদোত্তীর্ণ সতর্কতা!' : 'System Security or Expiration Notice!')
                    : (lang === 'bn' ? 'কোয়ার্টারলি (৩ মাস) সাবস্ক্রিপশন মেয়াদ সমাপ্ত হয়েছে' : 'Quarterly (3-Month) Subscription Expired')}
                </h3>
                {/* EXACT MANDATED BANGLA TEXT */}
                <p className="text-sm sm:text-base font-bold leading-relaxed text-red-700 dark:text-red-400 bg-white/70 dark:bg-slate-900/60 p-3 rounded-xl border border-red-300 dark:border-red-900/80">
                  {lang === 'bn' ? (
                    <>
                      &ldquo;দয়া করে সফটওয়্যারের সাবস্ক্রিপশন ফি পরিশোধ করুন। পেমেন্ট পাঠানোর নম্বর:{' '}
                      <strong className="text-slate-950 dark:text-white underline decoration-red-500 font-mono text-lg">
                        {SUBSCRIPTION_PHONE}
                      </strong>{' '}
                      (বিকাশ, নগদ ও রকেট)। পেমেন্ট সম্পন্ন করার পর প্রাপ্ত কোডটি নিচে ইনপুট দিন।&rdquo;
                    </>
                  ) : (
                    <>
                      &ldquo;Please pay the software subscription fee. Payment number:{' '}
                      <strong className="text-slate-950 dark:text-white underline font-mono text-lg">
                        {SUBSCRIPTION_PHONE}
                      </strong>{' '}
                      (bKash, Nagad & Rocket). Enter the received activation key below after completing payment.&rdquo;
                    </>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-amber-800 dark:text-amber-300 pt-1">
                  {isTrialExpired ? (
                    <span>⏳ সফটওয়্যার ইনস্টল হওয়ার পর ৭ দিনের ফ্রি ট্রায়াল সম্পন্ন হয়েছে। এখন পরবর্তী ৩ মাসের (৯০ দিন) নিয়মিত লাইসেন্স কি প্রবেশ করিয়ে আনলক করুন।</span>
                  ) : isUnactivated ? (
                    <span>📦 নতুন ইনস্টলেশনের পর প্রথমবার সফটওয়্যার চালু করতে লাইসেন্স কি প্রবেশ করান। কোড সাবমিট করলে আগামী ৩ মাসের জন্য সক্রিয় হবে।</span>
                  ) : (
                    <>
                      <span>📅 সর্বশেষ মেয়াদের তারিখ: <strong className="font-semibold">{formattedExpiryDate}</strong></span>
                      <span>•</span>
                      <span>🔒 কোড ছাড়া সফটওয়্যারের মূল ইন্টারফেসে প্রবেশ সম্পূর্ণ নিষিদ্ধ</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods & Quick Copy Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* bKash */}
            <div className="p-3.5 rounded-2xl bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider block">
                  bKash (বিকাশ)
                </span>
                <span className="font-mono font-bold text-sm text-pink-950 dark:text-pink-100">
                  {SUBSCRIPTION_PHONE}
                </span>
              </div>
              <span className="w-8 h-8 rounded-xl bg-pink-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                ব
              </span>
            </div>

            {/* Nagad */}
            <div className="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider block">
                  Nagad (নগদ)
                </span>
                <span className="font-mono font-bold text-sm text-orange-950 dark:text-orange-100">
                  {SUBSCRIPTION_PHONE}
                </span>
              </div>
              <span className="w-8 h-8 rounded-xl bg-orange-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                ন
              </span>
            </div>

            {/* Rocket */}
            <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                  Rocket (রকেট)
                </span>
                <span className="font-mono font-bold text-sm text-purple-950 dark:text-purple-100">
                  {SUBSCRIPTION_PHONE}
                </span>
              </div>
              <span className="w-8 h-8 rounded-xl bg-purple-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                র
              </span>
            </div>
          </div>

          {/* Quick Contact & Copy Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-semibold">
                {lang === 'bn' ? 'পেমেন্ট হেল্পলাইন / কোড সংগ্রহ:' : 'Payment Support Helpline:'}
              </span>
              <a
                href={`tel:${SUBSCRIPTION_PHONE}`}
                className="font-mono font-bold text-sm text-purple-700 dark:text-purple-300 hover:underline"
              >
                {SUBSCRIPTION_PHONE}
              </a>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyPhone}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>কপি হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>নম্বর কপি করুন</span>
                  </>
                )}
              </button>

              <a
                href={`https://wa.me/88${SUBSCRIPTION_PHONE}?text=${encodeURIComponent(
                  'আমি আদিবা হাসপাতাল ম্যানেজমেন্ট সফটওয়্যারের ৩ মাসের কোয়ার্টারলি সাবস্ক্রিপশন ফি পরিশোধ করেছি। অনুগ্রহ করে অ্যাক্টিভেশন কি দিন।'
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Activation Key Submission Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>
                    {lang === 'bn'
                      ? 'প্রাপ্ত ৩ মাসের সিকিউরিটি অ্যাক্টিভেশন কি (Activation Key) ইনপুট দিন:'
                      : 'Enter 3-Month License Activation Key:'}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handlePasteKey}
                  className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-bold cursor-pointer"
                >
                  {lang === 'bn' ? 'ক্লিপবোর্ড থেকে পেস্ট করুন' : 'Paste from Clipboard'}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={keyInput}
                  onChange={(e) => {
                    setKeyInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder={lang === 'bn' ? 'এখানে লাইসেন্স কোডটি লিখুন...' : 'Enter activation key here...'}
                  autoFocus
                  autoComplete="off"
                  className="w-full px-4 py-3.5 pr-24 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 focus:border-purple-600 dark:focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 text-sm sm:text-base font-mono tracking-wider outline-hidden transition"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                    title={showKey ? 'Hide Code' : 'Show Code'}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-900 text-red-700 dark:text-red-300 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-shake">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center gap-2.5">
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Submit / Reactivate Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 hover:from-purple-900 hover:to-indigo-950 text-white font-bold text-sm sm:text-base shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                  <span>
                    {isUnactivated
                      ? (lang === 'bn'
                          ? 'সফটওয়্যার সক্রিয় ও ইনস্টলেশন সম্পন্ন করুন'
                          : 'Activate Software & Complete Installation')
                      : (lang === 'bn'
                          ? 'সফটওয়্যার আনলক ও ৩ মাসের জন্য রি-অ্যাক্টিভেট করুন'
                          : 'Unlock & Re-activate Software (90 Days)')}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Footer security badge & instructions */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>
                {lang === 'bn'
                  ? 'হার্ডকোডেড মাস্টার সিকিউরিটি ভ্যালিডেশন মেকানিজম'
                  : 'Hardcoded Master Security Validation'}
              </span>
            </span>
            <span>
              {lang === 'bn'
                ? 'পেমেন্ট সংক্রান্ত কোনো সহায়তার জন্য কল করুন: ০১৭৪৪৪৬৫৫৫৭'
                : 'Helpline: 01744465557'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
