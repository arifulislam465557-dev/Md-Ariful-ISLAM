import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Activity,
  Bell,
  Pencil,
  LogOut,
  Crown,
  KeyRound,
  ChevronDown,
  ShieldCheck,
  Smartphone,
  Search,
  Globe,
  Laptop,
  HardDrive,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { EditClinicModal } from './Modals/EditClinicModal';
import { AdibaAdminMenuModal } from './Modals/AdibaAdminMenuModal';
import { GlobalSearchModal } from './Modals/GlobalSearchModal';

interface HeaderProps {
  onOpen2FA: () => void;
  onOpenSurvey: () => void;
  onOpenDocs: () => void;
  onLogout?: () => void;
  onOpenAdminModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpen2FA,
  onOpenSurvey,
  onOpenDocs,
  onLogout,
  onOpenAdminModal,
}) => {
  const {
    lang,
    setLang,
    clinicConfig,
    notifications,
    markNotificationsAsRead,
    unreadCount,
    currentUser,
    licenseInfo,
    isOnline,
    setOpenMobileRemoteModal,
    currentWorkstation,
    showGlobalSearch,
    setShowGlobalSearch,
    setActiveTab,
    t,
    autoSaveStatus,
    lastAutoSavedAt,
    dbVersion,
    retryOfflineMutations,
    trashRecords,
    setOpenRecycleBinModal,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showEditClinic, setShowEditClinic] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  // Live online/offline state synced with browser events and AppContext
  const [onlineState, setOnlineState] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setOnlineState(true);
    const handleOffline = () => setOnlineState(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (typeof isOnline === 'boolean') {
      setOnlineState(isOnline);
    }
  }, [isOnline]);



  const bgImage = clinicConfig.hospitalBackgroundUrl || '/hospital-bg.jpg';

  return (
    <header className="sticky top-0 z-30 shadow-md border-b border-purple-900 select-none">
      {/* ======================================================== */}
      {/* MAIN BRANDING BANNER - SLEEK, CLEAN & UNCLUTTERED */}
      {/* ======================================================== */}
      <div
        className="relative bg-cover bg-center overflow-hidden"
        style={{
          backgroundImage: bgImage ? `url(${bgImage})` : undefined,
          backgroundColor: '#2e1065',
        }}
      >
        {/* Semi-transparent high-contrast glass & gradient overlay */}
        <div className="bg-gradient-to-r from-purple-950/95 via-purple-950/90 to-indigo-950/92 backdrop-blur-[2px] px-3 sm:px-6 py-2.5 sm:py-3.5 text-white">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            {/* Left: Prominent Hospital Logo & Institution Name */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              {/* Prominent Logo */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/95 p-1 shadow-lg border-2 border-pink-400/50 flex items-center justify-center shrink-0 overflow-hidden">
                {clinicConfig.logoUrl ? (
                  <img
                    src={clinicConfig.logoUrl}
                    alt="Hospital Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as any).src = '/icon.svg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-gradient-to-tr from-purple-700 via-pink-600 to-indigo-600 flex items-center justify-center text-white shadow-inner">
                    <Activity className="w-7 h-7 text-white" />
                  </div>
                )}
              </div>

              {/* Institution Details */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-black text-sm sm:text-lg tracking-tight leading-tight text-white drop-shadow-md">
                    <span>{lang === 'bn' ? clinicConfig.clinicNameBn : clinicConfig.clinicName}</span>
                  </h1>

                  {/* Institution Name & Logo Edit Button */}
                  <button
                    type="button"
                    onClick={() => setShowEditClinic(true)}
                    className="flex items-center gap-1 px-2 py-0.5 bg-pink-600/40 hover:bg-pink-600 text-pink-100 hover:text-white rounded-md text-[11px] font-bold border border-pink-400/60 transition cursor-pointer active:scale-95 shadow-xs"
                    title={lang === 'bn' ? 'প্রতিষ্ঠানের নাম ও লোগো পরিবর্তন করুন' : 'Edit Institution Name & Logo'}
                  >
                    <Pencil className="w-3 h-3 text-pink-200" />
                    <span>{lang === 'bn' ? 'ইডিট' : 'Edit'}</span>
                  </button>

                  <span className="hidden md:inline-block px-2 py-0.5 bg-purple-900/80 border border-purple-700/60 text-[10px] font-bold rounded-full text-purple-200">
                    PRO v2.6
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-purple-200/90 font-medium truncate">
                  <span className="font-semibold text-pink-300 uppercase tracking-wide text-[10px]">
                    {clinicConfig.clinicName}
                  </span>
                  <span className="hidden sm:inline text-purple-400">·</span>
                  <span className="hidden sm:inline text-purple-300">
                    {lang === 'bn' ? clinicConfig.taglineBn : clinicConfig.tagline}
                  </span>
                </div>
              </div>
            </div>

            {/* Middle: Prominent Global Search Bar (Patients, Bills, Module Shortcuts) */}
            <div className="flex-1 max-w-md mx-2 hidden md:block">
              <button
                type="button"
                onClick={() => setShowGlobalSearch(true)}
                className="w-full flex items-center justify-between gap-2.5 px-3.5 py-1.5 rounded-xl bg-purple-900/70 hover:bg-purple-900/95 border border-purple-700/80 hover:border-pink-400/80 text-purple-200 transition cursor-pointer shadow-inner group text-left"
                title={lang === 'bn' ? 'গ্লোবাল সার্চ (Ctrl+K)' : 'Global Search (Ctrl+K)'}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Search className="w-4 h-4 text-pink-300 group-hover:text-pink-200 shrink-0" />
                  <span className="text-xs text-purple-200/90 group-hover:text-white truncate">
                    {lang === 'bn'
                      ? 'রোগী, ইনভয়েস বা মডিউল খুঁজুন...'
                      : 'Search patients, bills, modules...'}
                  </span>
                </div>
                <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-bold bg-purple-950/80 border border-purple-700/80 rounded-md text-pink-300 shadow-2xs">
                  <span className="text-[11px]">⌘</span>K
                </kbd>
              </button>
            </div>

            {/* Right: Notifications Bell, Search icon (mobile), "আদিবা অ্যাডমিন" Control Center, and Logout */}
            <div className="flex items-center gap-2 shrink-0 self-center">
              {/* Mobile Quick Search Button */}
              <button
                type="button"
                onClick={() => setShowGlobalSearch(true)}
                className="md:hidden p-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-700/80 transition cursor-pointer relative"
                title={lang === 'bn' ? 'অনুসন্ধান করুন (Ctrl+K)' : 'Quick Search (Ctrl+K)'}
              >
                <Search className="w-4 h-4 text-pink-300" />
              </button>

              {/* Quick Language Toggle (English <-> বাংলা) */}
              <button
                type="button"
                onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-100 hover:text-white border border-purple-700/80 transition cursor-pointer text-xs font-bold shadow-xs active:scale-95"
                title={lang === 'en' ? 'Switch to বাংলা (Bengali)' : 'Switch to English'}
              >
                <Globe className="w-3.5 h-3.5 text-pink-300" />
                <span className="font-semibold">{lang === 'en' ? 'বাংলা' : 'English'}</span>
              </button>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) markNotificationsAsRead();
                  }}
                  className="p-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-700/80 transition cursor-pointer relative"
                  title={t.notifications}
                >
                  <Bell className="w-4 h-4 text-purple-200" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-76 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 text-xs">
                    <div className="p-3 bg-purple-900 text-white font-bold flex justify-between items-center text-xs">
                      <span>{t.notifications}</span>
                      <button
                        onClick={markNotificationsAsRead}
                        className="text-[10px] text-purple-200 hover:underline cursor-pointer"
                      >
                        {t.markAllRead}
                      </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 italic">{t.noNotifications}</div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="p-2.5 hover:bg-purple-50/50 dark:hover:bg-gray-750">
                            <div className="flex justify-between font-bold text-purple-950 dark:text-purple-300">
                              <span>{n.title}</span>
                              <span className="text-[10px] text-gray-400 font-normal">{n.timestamp}</span>
                            </div>
                            <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Adiba Admin Control Center Button (Holds all tools, license, sync, 2FA, accounts, LAN) */}
              {currentUser && (
                <button
                  type="button"
                  onClick={() => setShowAdminMenu(true)}
                  className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl border text-white cursor-pointer transition active:scale-95 shadow-md bg-gradient-to-r from-purple-800 via-pink-700 to-indigo-800 hover:from-purple-700 hover:via-pink-600 border-pink-400/80 ring-1 ring-pink-400/40"
                  title={
                    lang === 'bn'
                      ? 'আদিবা অ্যাডমিন - ক্লিক করে লাইসেন্স, ইউজার, সিকিউরিটি ও সেটিংস দেখুন'
                      : 'Adiba Admin - Click to access full admin control center'
                  }
                >
                  <div className="w-6 h-6 rounded-lg bg-pink-500 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs">
                    <Crown className="w-3.5 h-3.5 text-amber-200" />
                  </div>
                  <div className="text-left leading-tight hidden xs:block">
                    <div className="font-black text-xs text-white flex items-center gap-1">
                      <span>{lang === 'bn' ? 'আদিবা অ্যাডমিন' : 'Adiba Admin'}</span>
                    </div>
                    <div className="text-[10px] text-pink-200 font-mono flex items-center gap-1">
                      <span>@{currentUser.username}</span>
                      <KeyRound className="w-2.5 h-2.5 text-amber-300" />
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-pink-200 shrink-0" />
                </button>
              )}

              {/* Logout Button */}
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-black border border-red-400/60 transition cursor-pointer shadow-md active:scale-95"
                  title={lang === 'bn' ? 'সফটওয়্যার থেকে লগআউট করুন' : 'Log out from software'}
                >
                  <LogOut className="w-3.5 h-3.5 text-white" />
                  <span className="hidden sm:inline">{lang === 'bn' ? 'লগআউট' : 'Logout'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUB-HEADER: LIVE LICENSE REMAINING & USER SESSION STATUS */}
      {/* Matches target: header > div:nth-of-type(2) */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-purple-950 border-t border-purple-800/70 text-purple-100 text-xs py-1.5 px-3 sm:px-6 shadow-inner">
        {/* div:nth-of-type(1) - Container */}
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          {/* Left: Workstation Terminal / System Status (License countdown moved to Adiba Admin) */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-[11px] sm:text-xs">
            {currentWorkstation && (
              <div className="flex items-center gap-1.5 text-[11px] text-purple-200 font-mono bg-purple-900/80 px-2.5 py-1 rounded-lg border border-purple-800/80 shadow-xs">
                <Laptop className="w-3.5 h-3.5 text-pink-300 shrink-0" />
                <span className="text-purple-300 font-sans font-medium">
                  {lang === 'bn' ? 'টার্মিনাল:' : 'Terminal:'}
                </span>
                <span className="text-pink-200 font-bold">{currentWorkstation.terminalCode}</span>
                <span className="text-purple-400 hidden sm:inline">({lang === 'bn' ? currentWorkstation.nameBn : currentWorkstation.name})</span>
              </div>
            )}
            {/* Live Auto-Save Status Badge */}
            <div
              onClick={() => {
                if (autoSaveStatus === 'error' || autoSaveStatus === 'offline_draft') {
                  retryOfflineMutations();
                } else {
                  setOpenRecycleBinModal(true);
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition ${
                autoSaveStatus === 'saving'
                  ? 'bg-indigo-900/90 border-indigo-400/60 text-indigo-200'
                  : autoSaveStatus === 'error'
                  ? 'bg-rose-950/90 border-rose-500/80 text-rose-200'
                  : autoSaveStatus === 'offline_draft'
                  ? 'bg-amber-950/90 border-amber-500/80 text-amber-200'
                  : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200 hover:bg-emerald-900/80'
              }`}
              title={`Permanent Database Auto-Save (DB v${dbVersion}) · Last Saved: ${lastAutoSavedAt}`}
            >
              {autoSaveStatus === 'saving' ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin text-indigo-300 shrink-0" />
                  <span>Saving...</span>
                </>
              ) : autoSaveStatus === 'error' ? (
                <>
                  <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                  <span>Save Failed (Retry)</span>
                </>
              ) : autoSaveStatus === 'offline_draft' ? (
                <>
                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Draft Queued (Offline)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Saved</span>
                  <span className="hidden md:inline text-[10px] text-emerald-300/80 font-mono">
                    ({lastAutoSavedAt})
                  </span>
                </>
              )}
            </div>
          </div>

          {/* div:nth-of-type(2) - Right: Recycle Bin, Direct Backup & Restore Launcher, User session display & Live Online status */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => setOpenRecycleBinModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-900/90 hover:bg-purple-800 border border-purple-600/70 text-purple-100 font-bold text-[11px] shadow-xs transition cursor-pointer active:scale-95"
              title="রিসাইকেল বিন (Trash), প্রিন্ট ভার্সন ও অপরিবর্তনীয় অডিট সেন্টার খুলুন"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-300 shrink-0" />
              <span className="hidden sm:inline">
                {lang === 'bn' ? 'রিসাইকেল বিন ও অডিট' : 'Trash & Audit'}
              </span>
              {trashRecords.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-extrabold">
                  {trashRecords.length}
                </span>
              )}
            </button>

            {currentUser?.role === 'Admin' && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('settings');
                  setTimeout(() => window.dispatchEvent(new CustomEvent('open-smart-backup-panel')), 50);
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 hover:from-emerald-500 hover:to-indigo-600 border border-emerald-400/70 text-white font-black text-[11px] shadow-sm transition cursor-pointer active:scale-95"
                title={lang === 'bn' ? 'স্মার্ট ব্যাকআপ ও রিস্টোর প্যানেল খুলুন' : 'Open Smart Backup & Restore Panel'}
              >
                <HardDrive className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                <span>{lang === 'bn' ? 'ব্যাকআপ ও রিস্টোর' : 'Backup & Restore'}</span>
              </button>
            )}

            {/* div:nth-of-type(1) - User session display box */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-purple-900/85 hover:bg-purple-900 border border-purple-700/80 text-white shadow-xs transition">
              {/* div:nth-of-type(1) - Inner wrapper */}
              <div className="flex items-center gap-2">
                {/* span:nth-of-type(1) - User Session Info */}
                <span className="flex items-center gap-1.5 text-white font-medium text-xs">
                  <span className="w-2 h-2 rounded-full bg-pink-400 shrink-0"></span>
                  <span className="font-mono font-bold text-pink-100">
                    @{currentUser?.username || 'user'}
                  </span>
                  <span className="text-[10px] text-purple-200 bg-purple-950/90 px-1.5 py-0.2 rounded border border-purple-700/60 font-semibold uppercase">
                    {currentUser?.role || 'Staff'}
                  </span>
                </span>

                {/* span:nth-of-type(2) - LIVE ONLINE STATUS INDICATOR WITH SUBTLE PULSING ANIMATION */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide transition-all shadow-xs ${
                    onlineState
                      ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/60'
                      : 'bg-amber-950/90 text-amber-300 border border-amber-500/60'
                  }`}
                  title={
                    onlineState
                      ? (lang === 'bn' ? 'সিস্টেম সক্রিয় এবং অনলাইন সংযোগ চালু' : 'System Live & Online Sync Active')
                      : (lang === 'bn' ? 'অফলাইন মোড সক্রিয় - লোকাল ডাটাবেজে স্বয়ংক্রিয় সংরক্ষণ হচ্ছে' : 'Offline Mode Active - Saved locally')
                  }
                >
                  <span className="relative flex h-2 w-2">
                    {onlineState && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        onlineState ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    ></span>
                  </span>
                  <span className="font-semibold uppercase tracking-wider text-[9.5px]">
                    {onlineState
                      ? (lang === 'bn' ? 'অনলাইন' : 'Online')
                      : (lang === 'bn' ? 'অফলাইন' : 'Offline')}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEditClinic && <EditClinicModal onClose={() => setShowEditClinic(false)} />}

      {/* Adiba Admin Control Center Modal (Contains all 11 utility and admin controls) */}
      {showAdminMenu && (
        <AdibaAdminMenuModal
          onClose={() => setShowAdminMenu(false)}
          onOpenAdminUserModal={() => {
            setShowAdminMenu(false);
            if (onOpenAdminModal) onOpenAdminModal();
          }}
          onOpen2FA={onOpen2FA}
          onOpenSurvey={onOpenSurvey}
          onOpenDocs={onOpenDocs}
          onOpenClinicEdit={() => setShowEditClinic(true)}
          onLogout={onLogout}
        />
      )}

      {/* Global Search & Command Palette Modal */}
      <GlobalSearchModal
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
      />
    </header>
  );
};
