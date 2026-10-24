import React, { useState } from 'react';
import {
  Bell,
  Clock,
  KeyRound,
  ShieldCheck,
  Phone,
  Copy,
  Check,
  X,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  Calendar,
  MessageCircle,
  HelpCircle,
  RotateCw,
} from 'lucide-react';
import { SUBSCRIPTION_PHONE, MASTER_LICENSE_KEY } from '../../utils/licenseSecurity';
import { LicenseSecurityState } from '../../types';

interface LicenseReminderModalProps {
  licenseInfo: LicenseSecurityState;
  onClose: () => void;
  onRenew: (code: string) => { success: boolean; error?: string; message?: string };
  onSimulateDays?: (days: number) => void;
  lang?: 'bn' | 'en';
}

export const LicenseReminderModal: React.FC<LicenseReminderModalProps> = ({
  licenseInfo,
  onClose,
  onRenew,
  onSimulateDays,
  lang = 'bn',
}) => {
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdminSimulate, setShowAdminSimulate] = useState(false);

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
      // ignore
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!keyInput.trim()) {
      setErrorMsg(
        lang === 'bn'
          ? 'অনুগ্রহ করে লাইসেন্স অ্যাক্টিভেশন কি ইনপুট দিন।'
          : 'Please enter the activation key.'
      );
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = onRenew(keyInput.trim());
      setIsSubmitting(false);

      if (res.success) {
        setSuccessMsg(
          res.message ||
            (lang === 'bn'
              ? 'সফলভাবে ৩ মাসের (৯০ দিন) সাবস্ক্রিপশন নবায়ন সম্পন্ন হয়েছে!'
              : 'Successfully renewed for 90 days!')
        );
        setKeyInput('');
        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        setErrorMsg(
          res.error ||
            (lang === 'bn'
              ? 'ভুল অ্যাক্টিভেশন কি! সঠিক কোড দিন অথবা ০১৭৪৪৪৬৫৫৫৭ নম্বরে যোগাযোগ করুন।'
              : 'Invalid code! Please contact 01744465557.')
        );
      }
    }, 400);
  };

  const formattedExpiry = (() => {
    try {
      return new Date(licenseInfo.expiresAt).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return licenseInfo.expiresAt;
    }
  })();

  const isWarning = licenseInfo.status === 'warning';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-purple-200 dark:border-slate-700 overflow-hidden text-slate-800 dark:text-slate-100 my-auto">
        {/* Top Header */}
        <div
          className={`px-6 py-4 text-white flex items-center justify-between ${
            isWarning
              ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700'
              : 'bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center ring-2 ring-white/20">
              {isWarning ? <Bell className="w-5 h-5 text-white animate-bounce" /> : <ShieldCheck className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {lang === 'bn'
                  ? 'সফটওয়্যার লাইসেন্সিং ও রিনিউয়াল নোটিফিকেশন'
                  : 'Software Subscription & Renewal Notification'}
              </h2>
              <p className="text-xs text-white/80">
                {lang === 'bn'
                  ? `কোয়ার্টারলি মেয়াদ: ${licenseInfo.daysRemaining} দিন অবশিষ্ট`
                  : `Quarterly validity: ${licenseInfo.daysRemaining} days remaining`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Exact Notification Message Box */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 text-amber-950 dark:text-amber-100 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 uppercase">
                    {lang === 'bn' ? 'কোয়ার্টারলি পেমেন্ট রিমাইন্ডার' : 'Quarterly Reminder'}
                  </span>
                  <span className="text-xs text-amber-800 dark:text-amber-300">
                    মেয়াদ শেষ হবে: <strong className="font-bold">{formattedExpiry}</strong>
                  </span>
                </div>

                {/* EXACT MANDATED BANGLA TEXT */}
                <p className="text-sm font-bold leading-relaxed text-red-700 dark:text-red-400 bg-white/70 dark:bg-slate-900/60 p-3 rounded-xl border border-red-200 dark:border-red-900/70">
                  {lang === 'bn' ? (
                    <>
                      &ldquo;দয়া করে সফটওয়্যারের সাবস্ক্রিপশন ফি পরিশোধ করুন। পেমেন্ট পাঠানোর নম্বর:{' '}
                      <strong className="text-slate-900 dark:text-white underline decoration-red-500 font-mono text-base">
                        {SUBSCRIPTION_PHONE}
                      </strong>{' '}
                      (বিকাশ, নগদ ও রকেট)। পেমেন্ট সম্পন্ন করার পর প্রাপ্ত কোডটি নিচে ইনপুট দিন।&rdquo;
                    </>
                  ) : (
                    <>
                      &ldquo;Please pay the software subscription fee. Payment number:{' '}
                      <strong className="text-slate-900 dark:text-white underline font-mono text-base">
                        {SUBSCRIPTION_PHONE}
                      </strong>{' '}
                      (bKash, Nagad & Rocket). Enter the received code below after completing payment.&rdquo;
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Account Cards */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/50">
              <span className="font-bold text-pink-600 dark:text-pink-400 block text-[11px]">bKash (বিকাশ)</span>
              <span className="font-mono font-bold text-xs">{SUBSCRIPTION_PHONE}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50">
              <span className="font-bold text-orange-600 dark:text-orange-400 block text-[11px]">Nagad (নগদ)</span>
              <span className="font-mono font-bold text-xs">{SUBSCRIPTION_PHONE}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50">
              <span className="font-bold text-purple-600 dark:text-purple-400 block text-[11px]">Rocket (রকেট)</span>
              <span className="font-mono font-bold text-xs">{SUBSCRIPTION_PHONE}</span>
            </div>
          </div>

          {/* Quick Copy & Helpline */}
          <div className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span className="font-semibold">{SUBSCRIPTION_PHONE}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyPhone}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 font-bold flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-500" />}
                <span>{copied ? 'কপি হয়েছে' : 'নম্বর কপি'}</span>
              </button>
              <a
                href={`https://wa.me/88${SUBSCRIPTION_PHONE}?text=${encodeURIComponent(
                  'আমি আদিবা হাসপাতাল সফটওয়্যারের ৩ মাসের কোয়ার্টারলি ফি দিয়েছি। অ্যাক্টিভেশন কোডটি দিন।'
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1"
              >
                <MessageCircle className="w-3 h-3" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Key Input Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold flex items-center gap-1 text-slate-800 dark:text-slate-200">
                  <KeyRound className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>
                    {lang === 'bn' ? 'অ্যাক্টিভেশন কোড / লাইসেন্স কি লিখুন:' : 'Enter License Key:'}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handlePasteKey}
                  className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-bold cursor-pointer"
                >
                  {lang === 'bn' ? 'পেস্ট করুন' : 'Paste'}
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
                  placeholder={lang === 'bn' ? 'কোড লিখুন...' : 'Enter key...'}
                  className="w-full px-3.5 py-2.5 pr-20 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 text-sm font-mono tracking-wider outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span>{lang === 'bn' ? 'কোড সাবমিট ও নবায়ন করুন' : 'Submit Key & Renew'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                {lang === 'bn' ? 'পরে মনে করান' : 'Remind Later'}
              </button>
            </div>
          </form>

          {/* Admin Simulation & Testing Tool Accordion */}
          {onSimulateDays && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAdminSimulate(!showAdminSimulate)}
                className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-purple-600 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>
                  {showAdminSimulate
                    ? 'টেস্টিং কন্ট্রোল লুকান (Hide Test Simulation)'
                    : 'অ্যাডমিন সিমুলেটর ও লাইসেন্স টেস্ট কন্ট্রোল (Test Expiry & Lock Screen)'}
                </span>
              </button>

              {showAdminSimulate && (
                <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800/60 space-y-2 text-xs">
                  <p className="text-[11px] text-purple-900 dark:text-purple-200 font-semibold">
                    সফটওয়্যার ডেভেলপার ও অ্যাডমিন টেস্টিং টুল (৩ মাসের মেয়াদ ও লক যাচাই করতে):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSimulateDays(0);
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      🔒 টেস্ট মেয়াদোত্তীর্ণ লক (০ দিন বাকি)
                    </button>
                    <button
                      type="button"
                      onClick={() => onSimulateDays(5)}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      ⚠️ টেস্ট রিমাইন্ডার (৫ দিন বাকি)
                    </button>
                    <button
                      type="button"
                      onClick={() => onSimulateDays(7)}
                      className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      🎁 টেস্ট ৭ দিনের ট্রায়াল (৭ দিন বাকি)
                    </button>
                    <button
                      type="button"
                      onClick={() => onSimulateDays(90)}
                      className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      ✨ রিসেট ৯০ দিন (৩ মাস পূর্ণ মেয়াদ)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
