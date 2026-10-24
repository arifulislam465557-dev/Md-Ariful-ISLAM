import React, { useState } from 'react';
import {
  Download,
  Monitor,
  Smartphone,
  CheckCircle2,
  X,
  ExternalLink,
  Laptop,
  Layers,
  Wifi,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useApp } from '../../context/AppContext';

interface PWAInstallModalProps {
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, isWindows, install, isOnline } = usePWAInstall();
  const { clinicConfig } = useApp();
  const [activeTab, setActiveTab] = useState<'pc' | 'android' | 'features'>('pc');
  const [copiedLink, setCopiedLink] = useState(false);

  // Generate and download a standard Windows Desktop URL Shortcut
  const handleDownloadWindowsShortcut = () => {
    const currentUrl = window.location.origin + window.location.pathname;
    const shortcutContent = `[InternetShortcut]\r\nURL=${currentUrl}\r\nIconIndex=0\r\nIconFile=${window.location.origin}/favicon.ico\r\n`;
    const blob = new Blob([shortcutContent], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clinicConfig.clinicName.replace(/\s+/g, '_')}_PC_App.url`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyLink = () => {
    const currentUrl = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const pwaBuilderUrl = `https://www.pwabuilder.com?url=${encodeURIComponent(
    window.location.origin + window.location.pathname
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-purple-200 dark:border-purple-800/50 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
              <Laptop className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight flex items-center gap-2">
                <span>পিসি ও মোবাইল APK ইন্সটলার</span>
                <span className="text-[10px] bg-purple-700/80 text-purple-200 px-2 py-0.5 rounded-full uppercase font-mono tracking-wider">
                  PWA / Desktop / APK
                </span>
              </h2>
              <p className="text-xs text-purple-200/90">
                {clinicConfig.clinicNameBn} — কম্পিউটার ও মোবাইলে অ্যাপ হিসেবে ইনস্টল করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-purple-100 hover:text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="bg-purple-50 dark:bg-gray-800/80 px-5 py-2.5 border-b border-purple-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{isOnline ? 'অনলাইন ও অফলাইন রেডি' : 'অফলাইন মোড অ্যাক্টিভ'}</span>
            </div>
            {isInstalled && (
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> ইনস্টলড (Standalone App)
              </span>
            )}
          </div>

          {/* Quick Direct 1-Click Install Button if supported */}
          {isInstallable && !isInstalled && (
            <button
              onClick={install}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold rounded-lg shadow-sm text-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>১-ক্লিকে ইনস্টল করুন</span>
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-850 px-4 pt-2">
          <button
            onClick={() => setActiveTab('pc')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'pc'
                ? 'border-purple-600 text-purple-700 dark:text-purple-400 bg-white dark:bg-gray-900 rounded-t-lg'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-purple-600'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>কম্পিউটার / PC App</span>
          </button>
          <button
            onClick={() => setActiveTab('android')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'android'
                ? 'border-purple-600 text-purple-700 dark:text-purple-400 bg-white dark:bg-gray-900 rounded-t-lg'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-purple-600'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>মোবাইল / Android APK</span>
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'features'
                ? 'border-purple-600 text-purple-700 dark:text-purple-400 bg-white dark:bg-gray-900 rounded-t-lg'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-purple-600'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>অ্যাপের সুবিধাসমূহ</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-slate-800 dark:text-slate-200 text-sm">
          {/* TAB 1: PC Installation */}
          {activeTab === 'pc' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-600 text-white">
                  <Monitor className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-purple-950 dark:text-purple-300 text-sm">
                    Windows PC ও ল্যাপটপে ইনস্টল করার পদ্ধতি
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    ব্রাউজার ছাড়াই আসল সফটওয়্যার হিসেবে আপনার পিসির ডেস্কটপ (Desktop) এবং স্টার্ট মেনু (Start Menu) তে রান করবে।
                  </p>
                </div>
              </div>

              {/* Methods */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Method 1: Chrome/Edge PWA Install */}
                <div className="border border-slate-200 dark:border-gray-800 rounded-xl p-4 bg-white dark:bg-gray-850 hover:border-purple-300 transition">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                      পদ্ধতি ১: ব্রাউজার ইনস্টল
                    </span>
                    <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300 px-2 py-0.5 rounded-full font-semibold">
                      সবচেয়ে সেরা
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm mb-1">অফিসিয়াল PC অ্যাপ ইনস্টল</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                    Chrome বা Edge ব্রাউজারের অ্যাড্রেস বারের ডানপাশে <strong className="text-purple-700 dark:text-purple-400">Install আইকন</strong> অথবা নিচের বাটনে চাপ দিন।
                  </p>

                  {isInstallable ? (
                    <button
                      onClick={install}
                      className="w-full py-2 px-3 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>পিসিতে ইনস্টল করুন (Install on PC)</span>
                    </button>
                  ) : (
                    <div className="p-2.5 bg-slate-100 dark:bg-gray-800 rounded-lg text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>ক্রোম/এজ ব্রাউজারের ৩ ডট মেনু &gt; Save &amp; Share &gt; Install App এ চাপুন।</span>
                    </div>
                  )}
                </div>

                {/* Method 2: Windows Desktop Shortcut (.url file) */}
                <div className="border border-slate-200 dark:border-gray-800 rounded-xl p-4 bg-white dark:bg-gray-850 hover:border-purple-300 transition">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">
                      পদ্ধতি ২: ডেস্কটপ শর্টকাট
                    </span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 px-2 py-0.5 rounded-full font-semibold">
                      ডাউনলোড ফাইল
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm mb-1">পিসি ডেস্কটপ লঞ্চার (.url)</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                    ডাউনলোড করা ফাইলটি আপনার কম্পিউটারের ডেস্কটপে রাখুন। ডাবল-ক্লিক করলেই দ্রুত ওপেন হবে।
                  </p>
                  <button
                    onClick={handleDownloadWindowsShortcut}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>ডেস্কটপ শর্টকাট ডাউনলোড (.url)</span>
                  </button>
                </div>
              </div>

              {/* PC Key Instructions */}
              <div className="rounded-xl border border-slate-200 dark:border-gray-800 p-4 bg-slate-50 dark:bg-gray-850/60">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>পিসিতে ব্যবহারের বিশেষ সুবিধা:</span>
                </h4>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside">
                  <li>সম্পূর্ণ স্ক্রিনে কোনো বাড়তি ব্রাউজার ট্যাব বা অ্যাড্রেস বার ছাড়া ক্লিন ভিউ।</li>
                  <li>প্রেসক্রিপশন ও প্যাথলজি রিপোর্ট সরাসরি যেকোনো প্রিন্টারে প্রিন্ট বা PDF ডাউনলোড।</li>
                  <li>ক্লিনিকের ইন্টারনেট সাময়িক চলে গেলেও অফলাইনে ডাটা দেখা ও কাজ করার সুবিধা।</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: Android APK Installation */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-600 text-white">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-emerald-950 dark:text-emerald-300 text-sm">
                    Android মোবাইলে সরাসরি APK হিসেবে ইনস্টল
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    মোবাইলের হোমস্ক্রিনে অ্যাপ আইকন তৈরি হবে এবং যেকোনো অ্যান্ড্রয়েড অ্যাপের মতো ফুলস্ক্রিন চলবে।
                  </p>
                </div>
              </div>

              {/* 2 Ways for Android */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Option 1: Native WebAPK */}
                <div className="border border-slate-200 dark:border-gray-800 rounded-xl p-4 bg-white dark:bg-gray-850">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                      ১-ক্লিকে ইনস্টল (WebAPK)
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                      সহজ ও দ্রুত
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm mb-1">ফোনে অ্যাপ যোগ করুন</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                    অ্যান্ড্রয়েড ফোনের Chrome ব্রাউজারের উপরে ৩-ডট মেনুতে চাপুন এবং <strong>"Install app"</strong> বা <strong>"Add to Home screen"</strong> বাটনে ক্লিক করুন।
                  </p>
                  {isInstallable ? (
                    <button
                      onClick={install}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>মোবাইলে ইনস্টল করুন</span>
                    </button>
                  ) : (
                    <div className="text-xs text-slate-500 dark:text-slate-400 p-2 bg-slate-50 dark:bg-gray-800 rounded-lg">
                      অ্যান্ড্রয়েড ক্রোম থেকে সরাসরি ব্রাউজারে ৩-ডট মেনু &gt; Install App দিন।
                    </div>
                  )}
                </div>

                {/* Option 2: PWABuilder / Standalone APK */}
                <div className="border border-slate-200 dark:border-gray-800 rounded-xl p-4 bg-white dark:bg-gray-850">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                      স্ট্যান্ডঅ্যালোন .APK প্যাকেজ
                    </span>
                    <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 px-2 py-0.5 rounded-full font-semibold">
                      PWABuilder
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm mb-1">Play Store / Raw .APK তৈরি</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                    আপনি যদি গুগল প্লে স্টোরের জন্য বা নিজের ব্যবহারের জন্য সরাসরি সাইন করা <code className="text-purple-600 font-mono">.apk</code> চান, তবে PWABuilder দিয়ে তৈরি করতে পারেন।
                  </p>
                  <a
                    href={pwaBuilderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <span>PWABuilder এ APK জেনারেট করুন</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Mobile Link Sharing */}
              <div className="p-3 bg-slate-100 dark:bg-gray-800 rounded-xl flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-600 dark:text-slate-400 truncate">
                  মোবাইল থেকে ওপেন করতে লিংক কপি করুন:
                </span>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-md font-semibold shrink-0 cursor-pointer transition"
                >
                  {copiedLink ? '✓ কপি হয়েছে!' : 'লিংক কপি করুন'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Features */}
          {activeTab === 'features' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-850">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-2">
                    <Wifi className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100">অফলাইন ক্যাশিং সাপোর্ট</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    সার্ভিস ওয়ার্কারের সাহায্যে নেটওয়ার্ক ড্রপ করলেও অ্যাপটি দ্রুত ওপেন হবে এবং কাজ চালানো যাবে।
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-850">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-2">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100">ফুলস্ক্রিন ডেস্কটপ ও মোবাইল ভিউ</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    ব্রাউজারের অ্যাড্রেস বার ও বাড়তি বাটন ছাড়া আসল সফটওয়্যারের মতো মসৃণ ও দ্রুত লোডিং।
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-850">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center mb-2">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100">স্বয়ংক্রিয় ব্যাকগ্রাউন্ড আপডেট</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    সফটওয়্যারে নতুন কোনো আপডেট আসলে কোনো ঝামেলা ছাড়াই স্বয়ংক্রিয়ভাবে আপডেট হয়ে যাবে।
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-850">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center mb-2">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100">নিরাপদ ও নির্ভরযোগ্য</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    এনক্রিপ্টেড ও সম্পূর্ণ সুরক্ষিত আর্কিটেকচার যা ক্লিনিক্যাল ডাটা নিরাপদে সংরক্ষণ করে।
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 dark:bg-gray-850 px-5 py-3 border-t border-slate-200 dark:border-gray-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            সমর্থিত প্ল্যাটফর্ম: Windows, Mac, Android, iOS
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-800 dark:text-slate-200 font-semibold rounded-lg transition cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
