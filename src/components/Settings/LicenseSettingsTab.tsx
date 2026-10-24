import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Calendar,
  Phone,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  WifiOff,
  AlertTriangle,
  History,
  RotateCcw,
  CheckCircle,
  MessageCircle,
  HelpCircle,
} from 'lucide-react';
import { SUBSCRIPTION_PHONE } from '../../utils/licenseSecurity';

export const LicenseSettingsTab: React.FC = () => {
  const {
    licenseInfo,
    renewLicense,
    simulateLicenseDays,
    resetLicenseToInstallState,
    lang,
    currentWorkstation,
  } = useApp();

  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(SUBSCRIPTION_PHONE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard?.readText();
      if (text) setInputKey(text.trim());
    } catch {
      // ignore
    }
  };

  const handleRenewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!inputKey.trim()) {
      setFeedback({
        type: 'error',
        message: lang === 'bn' ? 'দয়া করে অ্যাক্টিভেশন কোড লিখুন।' : 'Please enter the activation key.',
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = renewLicense(inputKey.trim());
      setIsSubmitting(false);

      if (res.success) {
        setFeedback({
          type: 'success',
          message:
            res.message ||
            (lang === 'bn'
              ? 'সফলভাবে ৩ মাসের (৯০ দিন) জন্য লাইসেন্স নবায়ন সম্পন্ন হয়েছে!'
              : 'Successfully renewed for 90 days!'),
        });
        setInputKey('');
      } else {
        setFeedback({
          type: 'error',
          message:
            res.error ||
            (lang === 'bn'
              ? 'ভুল অ্যাক্টিভেশন কি! সঠিক কোড প্রদান করুন অথবা ০১৭৪৪৪৬৫৫৫৭ নম্বরে যোগাযোগ করুন।'
              : 'Invalid activation key! Please enter the correct code or contact 01744465557.'),
        });
      }
    }, 350);
  };

  const formattedStart = (() => {
    try {
      return new Date(licenseInfo.currentPeriodStart).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return licenseInfo.currentPeriodStart;
    }
  })();

  const formattedExpiry = (() => {
    try {
      return new Date(licenseInfo.expiresAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return licenseInfo.expiresAt;
    }
  })();

  const isWarning = licenseInfo.status === 'warning';
  const isExpired = licenseInfo.status === 'expired' || licenseInfo.daysRemaining <= 0;

  return (
    <div className="space-y-6">
      {/* Overview Top Card */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-md border border-purple-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-pink-500/20 text-pink-300 rounded-2xl border border-pink-400/30 ring-4 ring-pink-500/10">
            <KeyRound className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-500 text-white uppercase tracking-wider">
                {lang === 'bn' ? 'কোয়ার্টারলি সাবস্ক্রিপশন (৩ মাস)' : 'Quarterly (3 Months)'}
              </span>
              <span className="flex items-center gap-1 text-[11px] bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
                <WifiOff className="w-3 h-3 text-cyan-300" />
                <span>{lang === 'bn' ? 'অনলাইন ও অফলাইন সুরক্ষিত' : 'Online & Offline Security'}</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1">
              {lang === 'bn'
                ? 'সফটওয়্যার লাইসেন্সিং এবং রিনিউয়াল সিকিউরিটি সিস্টেম'
                : 'Software Licensing & Subscription Security System'}
            </h2>
            <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-2xl leading-relaxed">
              {lang === 'bn'
                ? 'প্রতি ৩ মাস (Quarterly) পর পর সফটওয়্যার নবায়নের জন্য নির্ধারিত ফিক্সড মাস্টার কোডের মাধ্যমে পরিচালিত হয়। মেয়াদ উত্তীর্ণ হলে সঠিক অ্যাক্টিভেশন কি ইনপুট না দেওয়া পর্যন্ত ইন্টারফেসে প্রবেশ করা যায় না।'
                : 'Operated through a strict 3-month cycle. Upon expiry, the software locks until re-activated with the verified activation key.'}
            </p>
          </div>
        </div>

        {/* Big Remaining Days Badge */}
        <div className="shrink-0 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center min-w-[160px]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-200 block">
            {lang === 'bn' ? 'অবশিষ্ট মেয়াদ' : 'Validity Left'}
          </span>
          <div className="text-3xl sm:text-4xl font-black text-amber-300 font-mono mt-1">
            {licenseInfo.daysRemaining}{' '}
            <span className="text-sm font-normal text-white">{lang === 'bn' ? 'দিন' : 'days'}</span>
          </div>
          <span
            className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              isExpired
                ? 'bg-red-500 text-white'
                : isWarning
                ? 'bg-amber-400 text-slate-950 animate-pulse'
                : 'bg-emerald-500 text-white'
            }`}
          >
            {isExpired
              ? (lang === 'bn' ? 'মেয়াদোত্তীর্ণ (Expired)' : 'Expired')
              : isWarning
              ? (lang === 'bn' ? 'রিনিউ প্রয়োজন (Expiring Soon)' : 'Expiring Soon')
              : (lang === 'bn' ? 'সক্রিয় (Active)' : 'Active')}
          </span>
        </div>
      </div>

      {/* Exact Mandated Bengali Notification Box */}
      <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 shadow-sm space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-500 text-white rounded-2xl shrink-0 mt-0.5 shadow-sm">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm sm:text-base font-bold text-amber-950 dark:text-amber-200">
                {lang === 'bn' ? '১. কোয়ার্টারলি সাবস্ক্রিপশন ও নোটিফিকেশন বার্তা:' : '1. Quarterly Billing & Notification Notice:'}
              </h3>
              <span className="text-xs text-amber-800 dark:text-amber-300">
                মেয়াদ শেষ হওয়ার তারিখ: <strong className="font-bold">{formattedExpiry}</strong>
              </span>
            </div>

            {/* EXACT MANDATED BANGLA TEXT */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-amber-200 dark:border-amber-900/60">
              <p className="text-sm sm:text-base font-bold leading-relaxed text-red-700 dark:text-red-400">
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
                    (bKash, Nagad & Rocket). Enter the received code below after completing payment.&rdquo;
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Channels Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
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
            <span className="w-8 h-8 rounded-xl bg-pink-600 text-white font-black text-xs flex items-center justify-center">
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
            <span className="w-8 h-8 rounded-xl bg-orange-600 text-white font-black text-xs flex items-center justify-center">
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
            <span className="w-8 h-8 rounded-xl bg-purple-700 text-white font-black text-xs flex items-center justify-center">
              র
            </span>
          </div>
        </div>

        {/* Copy Helpline Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white/70 dark:bg-slate-900/50 rounded-2xl border border-amber-200 dark:border-amber-800/50 text-xs">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="font-bold text-slate-800 dark:text-slate-200">
              পেমেন্ট কনফার্মেশন ও কোড সংগ্রহের হেল্পলাইন:
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
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'নম্বর কপি হয়েছে!' : 'পেমেন্ট নম্বর কপি করুন'}</span>
            </button>
            <a
              href={`https://wa.me/88${SUBSCRIPTION_PHONE}?text=${encodeURIComponent(
                'আমি সফটওয়্যারের ৩ মাসের কোয়ার্টারলি সাবস্ক্রিপশন ফি পরিশোধ করেছি। অনুগ্রহ করে অ্যাক্টিভেশন কি প্রদান করুন।'
              )}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp চ্যাট</span>
            </a>
          </div>
        </div>
      </div>

      {/* Renewal Input Form */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-gray-700 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>{lang === 'bn' ? 'সফটওয়্যার অ্যাক্টিভেশন কি ও রিনিউয়াল ফর্ম' : 'License Activation & Renewal'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === 'bn'
                ? 'পেমেন্ট সম্পন্ন করার পর প্রাপ্ত কোডটি ইনপুট দিয়ে সফটওয়্যার পরবর্তী ৩ মাসের জন্য রিনিউ করুন।'
                : 'Enter the activation key after payment to renew software access for 90 days.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handlePaste}
            className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline cursor-pointer"
          >
            {lang === 'bn' ? 'ক্লিপবোর্ড থেকে পেস্ট' : 'Paste Key'}
          </button>
        </div>

        <form onSubmit={handleRenewSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value);
                if (feedback) setFeedback(null);
              }}
              placeholder={lang === 'bn' ? 'এখানে লাইসেন্স অ্যাক্টিভেশন কি ইনপুট দিন...' : 'Enter activation key here...'}
              className="w-full px-4 py-3.5 pr-24 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-purple-600 focus:ring-4 focus:ring-purple-500/10 text-sm font-mono tracking-wider outline-hidden transition"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {feedback && (
            <div
              className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-900 text-red-700 dark:text-red-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 hover:from-purple-900 hover:to-indigo-950 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span>
                  {lang === 'bn'
                    ? 'কোড সাবমিট ও ৩ মাসের জন্য লাইসেন্স নবায়ন করুন'
                    : 'Submit Key & Renew Subscription (90 Days)'}
                </span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Security Architecture & Hardcoded Master Key Protection Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strict Access Details */}
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-purple-100 dark:border-gray-700 space-y-3">
          <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>২. অ্যাক্টিভেশন রেস্ট্রিকশন ও অফলাইন সাপোর্ট</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-1.5 shrink-0" />
              <span>
                <strong>কোড ছাড়া লক:</strong> নির্দিষ্ট ৩ মাস মেয়াদ শেষ হওয়ার পর সঠিক লাইসেন্স কোড ছাড়া সফটওয়্যারের মূল ইন্টারফেসে প্রবেশ সম্পূর্ণ নিষিদ্ধ থাকবে।
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-1.5 shrink-0" />
              <span>
                <strong>অনলাইন ও অফলাইন সাপোর্ট:</strong> ইন্টারনেট সংযোগ না থাকলেও অফলাইন মোডে সিকিউরিটি সম্পূর্ণ কার্যকর থাকে।
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-1.5 shrink-0" />
              <span>
                <strong>টাইমস্ট্যাম্প রোলব্যাক প্রোটেকশন:</strong> পিসির ঘড়ির তারিখ পরিবর্তন বা রিওয়াইন্ড প্রতিরোধ করতে ডিজিটাল সিগনেচার সক্রিয়।
              </span>
            </li>
          </ul>
        </div>

        {/* Hardcoded Master Key Security Details */}
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-purple-100 dark:border-gray-700 space-y-3">
          <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-bold text-sm">
            <KeyRound className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>৩. হার্ডকোডেড মাস্টার লাইসেন্স কি প্রোটেকশন</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            সিস্টেমটি একটি ফিক্সড মাস্টার কোডের মাধ্যমে পরিচালিত হয়। সিস্টেমের সাধারণ কোনো অ্যাডমিন আইডি, লোকাল ইউজার বা এক্সটার্নাল কোনো উপায়ে হ্যাক বা বাইপাস (Bypass) করা সম্ভব নয়। নির্ধারিত পেমেন্ট পরিশোধের পরই কেবল এই মাস্টার কি দিয়ে সফটওয়্যার রি-অ্যাক্টিভেট করা যায়।
          </p>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900/60 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">বর্তমান সিকিউরিটি স্ট্যাটাস:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>হার্ডকোডেড সিকিউরিটি সক্রিয়</span>
            </span>
          </div>
        </div>
      </div>

      {/* Admin Simulation & Testing Controls */}
      <div className="p-5 rounded-3xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              {lang === 'bn'
                ? 'অ্যাডমিন ডেমো ও লাইসেন্স টেস্ট কন্ট্রোল (Developer & Admin Testing Hub)'
                : 'License Testing & Demo Simulator'}
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {lang === 'bn' ? 'সিস্টেমের লক স্ক্রিন ও রিমাইন্ডার যাচাই করতে ব্যবহার করুন' : 'Test lockouts & reminders'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => simulateLicenseDays(0)}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>🔒 টেস্ট লক স্ক্রিন (০ দিন বাকি - Expired Lock)</span>
          </button>

          <button
            type="button"
            onClick={() => simulateLicenseDays(5)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>⚠️ টেস্ট রিমাইন্ডার (৫ দিন বাকি - Warning Mode)</span>
          </button>

          <button
            type="button"
            onClick={() => simulateLicenseDays(90)}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>✨ রিসেট ৯০ দিন (পূর্ণ কোয়ার্টারলি মেয়াদ)</span>
          </button>

          <button
            type="button"
            onClick={resetLicenseToInstallState}
            className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <KeyRound className="w-4 h-4" />
            <span>📦 টেস্ট নতুন ইনস্টলেশন লক (First-Time Install Key)</span>
          </button>
        </div>
      </div>

      {/* Renewal Audit History Table */}
      {licenseInfo.renewalHistory && licenseInfo.renewalHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-purple-100 dark:border-gray-700 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <History className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>{lang === 'bn' ? 'লাইসেন্স নবায়ন ও অডিট হিস্টোরি' : 'License Renewal History'}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2.5 px-3">নবায়নের তারিখ</th>
                  <th className="py-2.5 px-3">পূর্বের মেয়াদ</th>
                  <th className="py-2.5 px-3">নতুন ৩ মাসের মেয়াদ</th>
                  <th className="py-2.5 px-3">ওয়ার্কস্টেশন</th>
                  <th className="py-2.5 px-3 text-right">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {licenseInfo.renewalHistory.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(rec.renewedAt).toLocaleString('bn-BD', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(rec.previousExpiresAt).toLocaleDateString('bn-BD')}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-purple-700 dark:text-purple-300">
                      {new Date(rec.newExpiresAt).toLocaleDateString('bn-BD')}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                      {rec.workstationCode || currentWorkstation?.terminalCode || 'PC-TERMINAL'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        সফল
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
