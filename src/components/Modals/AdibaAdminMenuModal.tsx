import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Crown,
  KeyRound,
  ShieldCheck,
  Network,
  RefreshCw,
  Palette,
  Globe,
  Bell,
  MessageSquareHeart,
  BookOpen,
  DollarSign,
  Users,
  Building2,
  LogOut,
  X,
  Check,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Laptop,
  CheckCircle,
  Clock,
  Shield,
  Smartphone,
  HardDrive,
  Cloud,
} from 'lucide-react';
import { PWAInstallButton } from '../PWA/PWAInstallButton';
import { SUBSCRIPTION_PHONE } from '../../utils/licenseSecurity';

interface AdibaAdminMenuModalProps {
  onClose: () => void;
  onOpenAdminUserModal: () => void;
  onOpen2FA: () => void;
  onOpenSurvey: () => void;
  onOpenDocs: () => void;
  onOpenClinicEdit: () => void;
  onLogout?: () => void;
}

export const AdibaAdminMenuModal: React.FC<AdibaAdminMenuModalProps> = ({
  onClose,
  onOpenAdminUserModal,
  onOpen2FA,
  onOpenSurvey,
  onOpenDocs,
  onOpenClinicEdit,
  onLogout,
}) => {
  const {
    currentUser,
    lang,
    setLang,
    theme,
    setTheme,
    currentWorkstation,
    cloudSyncStatus,
    triggerManualSync,
    is2FAEnabled,
    licenseInfo,
    setOpenLicenseModal,
    setOpenMobileRemoteModal,
    setActiveTab,
    notifications,
    markNotificationsAsRead,
    unreadCount,
    clinicConfig,
  } = useApp();

  // Real-time live countdown for license remaining: Days, Hours, Minutes, Seconds
  const [licenseCountdown, setLicenseCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    formattedText: string;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    formattedText: '',
  });

  useEffect(() => {
    const updateCountdown = () => {
      if (!licenseInfo?.expiresAt) return;
      const expireTime = new Date(licenseInfo.expiresAt).getTime();
      const now = Date.now();
      const diffMs = Math.max(0, expireTime - now);

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const toBnNum = (n: number) => {
        const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        return n
          .toString()
          .split('')
          .map((d) => bnDigits[parseInt(d, 10)] ?? d)
          .join('');
      };

      const formattedText =
        lang === 'bn'
          ? `${toBnNum(days)} দিন ${toBnNum(hours)} ঘণ্টা ${toBnNum(minutes)} মিনিট`
          : `${days}d ${hours}h ${minutes}m`;

      setLicenseCountdown({
        days,
        hours,
        minutes,
        seconds,
        formattedText,
      });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 10000);
    return () => clearInterval(timer);
  }, [licenseInfo?.expiresAt, lang]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-end p-0 sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md h-full sm:h-auto sm:max-h-[92vh] bg-white dark:bg-slate-900 sm:rounded-3xl shadow-2xl border-l sm:border border-purple-200 dark:border-slate-800 flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white p-5 flex items-center justify-between border-b border-purple-800 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md ring-2 ring-white/20">
              <Crown className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base text-white">
                  {lang === 'bn' ? 'আদিবা অ্যাডমিন কন্ট্রোল' : 'Adiba Admin Control'}
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-pink-500 text-white uppercase tracking-wider">
                  {currentUser?.role || 'Admin'}
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5 font-mono">
                @{currentUser?.username} • {currentWorkstation?.terminalCode}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Action Hub */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs divide-y divide-slate-100 dark:divide-slate-800/80">
          {/* SECTION 1: 3-MONTH LICENSE & SUBSCRIPTION (MOVED FROM HEADER TO ADIBA ADMIN) */}
          <div className="pt-1 space-y-2.5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>{lang === 'bn' ? 'সফটওয়্যার লাইসেন্স ও সাবস্ক্রিপশন মেয়াদ' : 'License & Subscription Validity'}</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  licenseInfo.status === 'warning'
                    ? 'bg-amber-400 text-slate-950 animate-pulse'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                {licenseInfo.daysRemaining} {lang === 'bn' ? 'দিন বাকি' : 'days left'}
              </span>
            </div>

            {/* LIVE COUNTDOWN & RENEW CARD (Exact functionality moved from header into Adiba Admin) */}
            <div className="p-3.5 bg-gradient-to-br from-purple-900/90 via-indigo-950/95 to-purple-950 rounded-2xl border border-pink-400/50 shadow-md text-white space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-pink-600 text-white shrink-0 shadow-xs">
                    <Clock className="w-3.5 h-3.5 text-pink-100 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-pink-300 block">
                      {licenseInfo?.status === 'trial'
                        ? (lang === 'bn' ? '৭ দিনের ট্রায়াল মেয়াদ:' : '7-Day Free Trial:')
                        : (lang === 'bn' ? 'লাইসেন্স মেয়াদ:' : 'License Expiry:')}
                    </span>
                    <span className="font-mono font-black text-amber-300 tracking-tight text-xs">
                      {licenseCountdown.formattedText || (lang === 'bn' ? 'হিসাব হচ্ছে...' : 'Calculating...')}
                    </span>
                  </div>
                </div>

                {licenseInfo?.status === 'trial' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400 text-slate-950 shadow-xs">
                    <span>{lang === 'bn' ? 'ফ্রি ট্রায়াল চলছে' : 'Free Trial Active'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-950/80 border border-emerald-500/50 text-emerald-300">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>{lang === 'bn' ? 'অনলাইন / অফলাইন সচল' : 'Online & Offline Ready'}</span>
                  </span>
                )}
              </div>

              <div className="pt-1 border-t border-purple-800/60 flex items-center justify-between gap-2 text-[11px]">
                <div className="text-purple-200">
                  <p className="text-[10px] text-purple-300">
                    {lang === 'bn' ? 'নবায়ন বিকাশ/নগদ নম্বর:' : 'Renewal Payment Phone:'}
                  </p>
                  <strong className="font-mono text-pink-300 font-bold">{SUBSCRIPTION_PHONE}</strong>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenLicenseModal(true);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs transition active:scale-95 border border-pink-400/60"
                  >
                    {lang === 'bn' ? 'রিনিউ কি কোড দিন' : 'Enter License Key'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('settings');
                      onClose();
                    }}
                    className="p-1.5 bg-purple-800 hover:bg-purple-700 text-purple-200 rounded-xl cursor-pointer transition border border-purple-700/60"
                    title={lang === 'bn' ? 'বিস্তারিত সেটিংস' : 'Settings'}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: USER & PASSWORD SECURITY */}
          <div className="pt-3 space-y-2">
            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{lang === 'bn' ? 'ইউজার ও সিকিউরিটি ব্যবস্থাপনা' : 'User Security & Access'}</span>
            </span>

            <div className="grid grid-cols-1 gap-2">
              {/* User Accounts & Passwords Modal */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdminUserModal();
                }}
                className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 flex items-center justify-between transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">
                      {lang === 'bn' ? 'ইউজার আইডি ও পাসওয়ার্ড ব্যবস্থাপনা' : 'User IDs & Password Manager'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {lang === 'bn' ? 'সকল পিসির ইউজার তৈরি ও পাসওয়ার্ড পরিবর্তন' : 'Manage accounts & change passwords'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* 2FA Security */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpen2FA();
                }}
                className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 flex items-center justify-between transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-xl ${
                      is2FAEnabled
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">
                      {lang === 'bn' ? 'টু-ফ্যাক্টর অথেনটিকেশন (2FA)' : 'Two-Factor Authentication (2FA)'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {is2FAEnabled
                        ? (lang === 'bn' ? 'বর্তমানে সক্রিয় রয়েছে 🟢' : 'Active 🟢')
                        : (lang === 'bn' ? 'বর্তমানে নিষ্ক্রিয় রয়েছে' : 'Inactive')}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Mobile Remote Device Controller & Kill Switch */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setOpenMobileRemoteModal(true);
                }}
                className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-cyan-900/30 via-blue-900/30 to-purple-900/30 hover:from-cyan-900/50 hover:to-blue-900/50 border border-cyan-500/50 flex items-center justify-between transition cursor-pointer text-left shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500 text-slate-950 font-black">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">
                      {lang === 'bn' ? 'মোবাইল রিমোট ডিভাইস কন্ট্রোলার ও কিল সুইচ' : 'Mobile Remote Controller & Kill Switch'}
                    </span>
                    <span className="text-[11px] text-cyan-600 dark:text-cyan-300">
                      {lang === 'bn' ? 'সব পিসি লক/আনলক ও ফিচার নিয়ন্ত্রণ' : 'Remote Lock, Unlock & Module Controls'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-cyan-400" />
              </button>
            </div>
          </div>

          {/* SECTION 3: LAN NETWORK & CLOUD SYNC */}
          <div className="pt-3 space-y-2">
            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>{lang === 'bn' ? 'নেটওয়ার্ক ও ক্লাউড ব্যাকআপ' : 'Network & Cloud Backup'}</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* LAN Workstation Hub */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('lanNetwork');
                  onClose();
                }}
                className="p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-900/60 hover:bg-cyan-100 text-left cursor-pointer transition"
              >
                <div className="flex items-center justify-between">
                  <Network className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="font-bold text-slate-900 dark:text-slate-100 mt-1">
                  LAN: {currentWorkstation?.terminalCode}
                </div>
                <div className="text-[10px] font-mono text-cyan-800 dark:text-cyan-300">
                  {currentWorkstation?.ipAddress}
                </div>
              </button>

              {/* Smart Backup & Restore Panel */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('settings');
                  setTimeout(() => window.dispatchEvent(new CustomEvent('open-smart-backup-panel')), 50);
                  onClose();
                }}
                className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 hover:bg-purple-100 text-left cursor-pointer transition"
              >
                <div className="flex items-center justify-between">
                  <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    Google Drive / ZIP
                  </span>
                </div>
                <div className="font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {lang === 'bn' ? 'ব্যাকআপ ও রিস্টোর' : 'Backup & Restore'}
                </div>
                <div className="text-[10px] text-purple-700 dark:text-purple-300">
                  {lang === 'bn' ? 'প্যানেল খুলতে ক্লিক করুন' : 'Open Backup Panel'}
                </div>
              </button>
            </div>
          </div>

          {/* SECTION 4: QUICK MANAGEMENT ACCESS (Accounts, HR, Clinic) */}
          <div className="pt-3 space-y-2">
            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{lang === 'bn' ? 'কুইক ম্যানেজমেন্ট ও একাউন্টস' : 'Quick Management & Accounts'}</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              {/* Income & Expense */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('incomeExpense');
                  onClose();
                }}
                className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 flex items-center gap-2 cursor-pointer transition text-left"
              >
                <DollarSign className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">
                    {lang === 'bn' ? 'আয়-ব্যয় হিসাব' : 'Accounts'}
                  </span>
                  <span className="text-[10px] text-slate-500">ভাউচার ও লেজার</span>
                </div>
              </button>

              {/* Employees */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('employees');
                  onClose();
                }}
                className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 flex items-center gap-2 cursor-pointer transition text-left"
              >
                <Users className="w-4 h-4 text-teal-500 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">
                    {lang === 'bn' ? 'কর্মচারী তালিকা' : 'Staff'}
                  </span>
                  <span className="text-[10px] text-slate-500">স্টাফ ডিরেক্টরি</span>
                </div>
              </button>
            </div>

            {/* Edit Clinic Profile */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenClinicEdit();
              }}
              className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer transition text-left"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-pink-500" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {lang === 'bn' ? 'প্রতিষ্ঠানের নাম, লোগো ও প্যাড ইডিট' : 'Edit Institution & Letterhead'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* SECTION 5: APP PREFERENCES, THEME, LANGUAGE, PWA */}
          <div className="pt-3 space-y-2">
            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>{lang === 'bn' ? 'ডিসপ্লে, ভাষা ও অ্যাপ ইন্সটল' : 'Display, Language & App'}</span>
            </span>

            {/* Language & Theme in 2 columns */}
            <div className="grid grid-cols-2 gap-2">
              {/* Language Switch */}
              <button
                type="button"
                onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
                className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer transition"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-pink-500" />
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {lang === 'bn' ? 'বাংলা' : 'English'}
                  </span>
                </div>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                  {lang === 'bn' ? 'Switch' : 'পরিবর্তন'}
                </span>
              </button>

              {/* Theme Picker */}
              <div className="p-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-1">
                <Palette className="w-4 h-4 text-purple-500 ml-1" />
                <div className="flex gap-1 text-[10px] font-bold">
                  <button
                    onClick={() => setTheme('classic')}
                    className={`px-1.5 py-1 rounded-lg ${
                      theme === 'classic' ? 'bg-purple-800 text-white' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Classic
                  </button>
                  <button
                    onClick={() => setTheme('modern')}
                    className={`px-1.5 py-1 rounded-lg ${
                      theme === 'modern' ? 'bg-purple-800 text-white' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Modern
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`px-1.5 py-1 rounded-lg ${
                      theme === 'dark' ? 'bg-purple-800 text-white' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Dark
                  </button>
                </div>
              </div>
            </div>

            {/* PWA PC / Mobile Install */}
            <div className="p-2.5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">
                    {lang === 'bn' ? 'পিসি ও মোবাইল অ্যাপ ইনস্টল' : 'PC & Mobile App Install'}
                  </span>
                  <span className="text-[10px] text-slate-500">অফলাইন ও ফুলস্ক্রিন অ্যাপ</span>
                </div>
              </div>
              <PWAInstallButton variant="header" />
            </div>
          </div>

          {/* SECTION 6: SUPPORT & DOCS (Notifications, Guide, Feedback) */}
          <div className="pt-3 space-y-2">
            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span>{lang === 'bn' ? 'সহায়িকা ও নোটিফিকেশন' : 'Help & Documentation'}</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              {/* User Guide */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDocs();
                }}
                className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 flex items-center gap-2 cursor-pointer transition text-left"
              >
                <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {lang === 'bn' ? 'ব্যবহার সহায়িকা' : 'User Guide'}
                </span>
              </button>

              {/* Feedback Survey */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSurvey();
                }}
                className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 flex items-center gap-2 cursor-pointer transition text-left"
              >
                <MessageSquareHeart className="w-4 h-4 text-pink-500 shrink-0" />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {lang === 'bn' ? 'ফিডব্যাক মতামত' : 'Feedback'}
                </span>
              </button>
            </div>
          </div>

          {/* SECTION 7 (BOTTOM): SMART BACKUP & RESTORE PANEL */}
          <div className="pt-3 space-y-2">
            <span className="text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{lang === 'bn' ? 'ডাটাবেস ব্যাকআপ ও রিস্টোর সেন্টার' : 'Database Backup & Restore Center'}</span>
            </span>

            <button
              type="button"
              onClick={() => {
                setActiveTab('settings');
                setTimeout(() => window.dispatchEvent(new CustomEvent('open-smart-backup-panel')), 50);
                onClose();
              }}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 hover:from-emerald-500 hover:via-teal-500 hover:to-indigo-600 text-white border border-emerald-400/60 flex items-center justify-between transition cursor-pointer text-left shadow-md active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/20 text-white shrink-0">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-black text-sm text-white block">
                    {lang === 'bn' ? 'স্মার্ট ব্যাকআপ ও রিস্টোর প্যানেল' : 'Smart Backup & Restore Panel'}
                  </span>
                  <span className="text-[11px] text-emerald-100 block mt-0.5">
                    {lang === 'bn'
                      ? 'Google Drive ক্লাউড, C:/D: লোকাল ফোল্ডার, অটো-শিডিউল ও রিস্টোর'
                      : 'Google Drive Cloud, Local C:/D: Drive, Auto-Schedule & Restore'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white shrink-0" />
            </button>
          </div>
        </div>

        {/* Bottom Sticky Bar: Backup Shortcut & Logout Button */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('settings');
              setTimeout(() => window.dispatchEvent(new CustomEvent('open-smart-backup-panel')), 50);
              onClose();
            }}
            className="flex-1 px-3.5 py-2 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition active:scale-95"
          >
            <HardDrive className="w-4 h-4 text-emerald-300" />
            <span>{lang === 'bn' ? 'ব্যাকআপ ও রিস্টোর প্যানেল' : 'Backup & Restore Panel'}</span>
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span>{lang === 'bn' ? 'লগআউট' : 'Log Out'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
