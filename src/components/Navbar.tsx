import React from 'react';
import { useApp } from '../context/AppContext';
import {
  FlaskConical,
  Receipt,
  UserCheck,
  Activity,
  Film,
  Waves,
  Stethoscope,
  BarChart3,
  Lock,
  Settings,
  ShieldCheck,
  DollarSign,
  Users,
  Network,
  Keyboard,
  HardDrive,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    t,
    lang,
    hasAccessToModule,
    currentUser,
    setShowShortcutsModal,
    isBackupOverdue,
    daysSinceLastBackup,
  } = useApp();

  const allTabs = [
    {
      id: 'pathology',
      label: t.pathology,
      icon: FlaskConical,
      badge: 'Main',
      color: 'from-purple-700 to-indigo-800',
    },
    {
      id: 'billing',
      label: t.billing,
      icon: Receipt,
      color: 'from-emerald-700 to-teal-800',
    },
    {
      id: 'doctorVisit',
      label: t.doctorVisit,
      icon: UserCheck,
      color: 'from-blue-700 to-indigo-800',
    },
    {
      id: 'ecg',
      label: t.ecg,
      icon: Activity,
      color: 'from-rose-700 to-red-800',
    },
    {
      id: 'xray',
      label: t.xray,
      icon: Film,
      color: 'from-slate-700 to-gray-800',
    },
    {
      id: 'ultrasound',
      label: t.ultrasound,
      icon: Waves,
      color: 'from-cyan-700 to-blue-800',
    },
    {
      id: 'doctorPortal',
      label: t.doctorPortal,
      icon: Stethoscope,
      badge: 'Rx',
      color: 'from-violet-700 to-purple-800',
    },
    {
      id: 'incomeExpense',
      label: t.incomeExpense || 'আয়-ব্যয় ও হিসাব',
      icon: DollarSign,
      badge: 'Accounts',
      color: 'from-amber-600 to-rose-700',
    },
    {
      id: 'employees',
      label: t.employees || 'এমপ্লয়ি লিস্ট',
      icon: Users,
      badge: 'Staff',
      color: 'from-teal-600 to-indigo-700',
    },
    {
      id: 'analytics',
      label: t.analytics,
      icon: BarChart3,
      color: 'from-amber-700 to-orange-800',
    },
    {
      id: 'lanNetwork',
      label: t.lanNetwork || 'LAN নেটওয়ার্ক',
      icon: Network,
      badge: '10 PCs',
      color: 'from-cyan-700 to-indigo-800',
    },
    {
      id: 'settings',
      label: lang === 'bn' ? 'ব্যাকআপ ও সেটিংস' : 'Backup & Settings',
      icon: Settings,
      color: 'from-fuchsia-700 to-purple-800',
      badge: isBackupOverdue ? (lang === 'bn' ? 'ব্যাকআপ সতর্কতা' : 'Backup Overdue') : 'Cloud/ZIP',
      badgeColor: isBackupOverdue ? 'bg-rose-600 text-white animate-pulse' : 'bg-emerald-600 text-white',
    },
  ];

  // Only show tabs the current user has permission to see!
  const visibleTabs = allTabs.filter((tab) => hasAccessToModule(tab.id));

  return (
    <nav className="w-full h-auto bg-white dark:bg-gray-850 border-b border-purple-200 dark:border-gray-700 shadow-xs px-2 sm:px-4 py-1.5 select-none">
      <div className="w-full min-w-0 flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer relative shrink-0 whitespace-nowrap ${
                isActive
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-xs`
                  : 'text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-800 hover:text-purple-900'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`} />
              <span className="whitespace-nowrap">{tab.label}</span>
              {tab.badge && (
                <span
                  className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 whitespace-nowrap ${
                    tab.badgeColor
                      ? tab.badgeColor
                      : isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}

        {visibleTabs.length === 0 && (
          <div className="text-xs text-amber-600 p-2 font-medium">
            No modules assigned to this user ID. Please contact administrator.
          </div>
        )}

        {/* Right Controls: Direct Backup Button, Hotkeys Quick Launcher & User Badge */}
        <div className="ml-auto flex flex-wrap items-center gap-2 pl-2 sm:pl-3 py-0.5 text-xs shrink-0 border-l border-gray-200 dark:border-gray-700">
          {hasAccessToModule('settings') && (
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold cursor-pointer transition active:scale-95 shadow-xs shrink-0 whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white ring-2 ring-emerald-300'
                  : 'bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white'
              }`}
              title={lang === 'bn' ? 'স্মার্ট ব্যাকআপ ও রিস্টোর প্যানেল খুলুন' : 'Open Smart Backup & Restore Panel'}
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span className="whitespace-nowrap">{lang === 'bn' ? 'ব্যাকআপ প্যানেল' : 'Backup Panel'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowShortcutsModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800 text-[11px] font-bold cursor-pointer transition active:scale-95 shadow-2xs shrink-0 whitespace-nowrap"
            title={lang === 'bn' ? 'কীবোর্ড শর্টকাট তালিকা (F1 বা Alt + /)' : 'Keyboard Shortcuts (F1 or Alt + /)'}
          >
            <Keyboard className="w-3.5 h-3.5 text-purple-700 dark:text-purple-300 shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">{lang === 'bn' ? 'হটকি' : 'Hotkeys'}</span>
            <kbd className="hidden md:inline-block font-mono text-[9px] bg-white dark:bg-gray-800 px-1 py-0.2 rounded border border-purple-300 dark:border-gray-700 text-purple-900 dark:text-purple-200 font-bold">
              Ctrl+B/P
            </kbd>
          </button>

          {currentUser && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-200 shrink-0 whitespace-nowrap">
              <ShieldCheck className="w-3.5 h-3.5 text-pink-500 shrink-0" />
              <span className="font-bold font-mono">@{currentUser.username}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 font-semibold">
                {currentUser.role}
              </span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
