import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Keyboard,
  X,
  Receipt,
  FlaskConical,
  UserPlus,
  Stethoscope,
  Film,
  Waves,
  RefreshCw,
  Wallet,
  Users,
  Network,
  Settings,
  Sparkles,
  Search,
} from 'lucide-react';

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ onClose }) => {
  const { lang, setActiveTab, hasAccessToModule, setShowGlobalSearch } = useApp();

  const shortcuts = [
    {
      key: 'Ctrl + K / ⌘K',
      moduleId: 'globalSearch',
      nameBn: 'গ্লোবাল সার্চ (রোগী, বিল, মডিউল)',
      nameEn: 'Global Search (Patients, Bills)',
      icon: Search,
      color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800',
    },
    {
      key: 'Ctrl + B / Alt + B',
      moduleId: 'billing',
      nameBn: 'ক্যাশ মেমো ও বিলিং মডিউল',
      nameEn: 'Billing & Cash Memo',
      icon: Receipt,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    },
    {
      key: 'Ctrl + P / Alt + P',
      moduleId: 'pathology',
      nameBn: 'প্যাথলজি ও ল্যাব ইনভেস্টিগেশন',
      nameEn: 'Pathology & Lab Tests',
      icon: FlaskConical,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
    },
    {
      key: 'Ctrl + D / Alt + D',
      moduleId: 'doctorVisit',
      nameBn: 'ডাক্তার ভিজিট ও OPD সিরিয়াল',
      nameEn: 'Doctor OPD Visits & Queue',
      icon: UserPlus,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    },
    {
      key: 'Ctrl + R / Alt + R',
      moduleId: 'doctorPortal',
      nameBn: 'ডক্টরস প্রেসক্রিপশন পোর্টাল (Rx)',
      nameEn: 'Doctor Rx Portal',
      icon: Stethoscope,
      color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800',
    },
    {
      key: 'Ctrl + X / Alt + X',
      moduleId: 'xray',
      nameBn: 'ডিজিটাল এক্স-রে (X-Ray)',
      nameEn: 'Digital X-Ray Reporting',
      icon: Film,
      color: 'text-slate-700 bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700',
    },
    {
      key: 'Ctrl + U / Alt + U',
      moduleId: 'ultrasound',
      nameBn: 'আল্ট্রাসনোগ্রাফি (USG)',
      nameEn: 'Ultrasound / Sonography',
      icon: Waves,
      color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800',
    },
    {
      key: 'Ctrl + E / Alt + E',
      moduleId: 'ecg',
      nameBn: 'ইসিজি (ECG) রিপোর্ট',
      nameEn: 'ECG Clinical Reporting',
      icon: RefreshCw,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
    },
    {
      key: 'Ctrl + I / Alt + I',
      moduleId: 'incomeExpense',
      nameBn: 'আয়-ব্যয় ও অ্যাকাউন্টস',
      nameEn: 'Income & Expense Accounts',
      icon: Wallet,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    },
    {
      key: 'Ctrl + M / Alt + M',
      moduleId: 'employees',
      nameBn: 'কর্মচারী ও স্টাফ ডিরেক্টরি',
      nameEn: 'Hospital Staff Directory',
      icon: Users,
      color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800',
    },
    {
      key: 'Ctrl + L / Alt + L',
      moduleId: 'lanNetwork',
      nameBn: 'লোকাল নেটওয়ার্ক (LAN) ও পিসি হাব',
      nameEn: 'Hospital LAN Workstations',
      icon: Network,
      color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800',
    },
    {
      key: 'Ctrl + S / Alt + S',
      moduleId: 'settings',
      nameBn: 'সিস্টেম সেটিংস ও ডাটাবেজ ব্যাকআপ',
      nameEn: 'System Settings & Backup',
      icon: Settings,
      color: 'text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-950/40 border-fuchsia-200 dark:border-fuchsia-800',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-xl w-full p-5 border-2 border-purple-400 dark:border-purple-700 text-xs space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded-xl">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-purple-950 dark:text-purple-100 flex items-center gap-1.5">
                <span>{lang === 'bn' ? 'গ্লোবাল কীবোর্ড হটকি শর্টকাট' : 'Global Keyboard Hotkey Shortcuts'}</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-[11px] text-gray-500">
                {lang === 'bn'
                  ? 'দ্রুত মডিউল পরিবর্তন করতে সরাসরি কীবোর্ডের বাটন চাপুন'
                  : 'Fast module switching for rapid hospital reception and lab workflow'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {shortcuts.map((sc) => {
            const Icon = sc.icon;
            const isPermitted =
              sc.moduleId === 'globalSearch' ? true : hasAccessToModule(sc.moduleId);
            return (
              <div
                key={sc.moduleId}
                onClick={() => {
                  if (sc.moduleId === 'globalSearch') {
                    setShowGlobalSearch(true);
                    onClose();
                  } else if (isPermitted) {
                    setActiveTab(sc.moduleId);
                    onClose();
                  }
                }}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition ${sc.color} ${
                  isPermitted
                    ? 'cursor-pointer hover:shadow-sm active:scale-98'
                    : 'opacity-40 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">
                      {lang === 'bn' ? sc.nameBn : sc.nameEn}
                    </span>
                    {!isPermitted && (
                      <span className="text-[9px] text-red-500 font-bold">অনুমতি নেই</span>
                    )}
                  </div>
                </div>

                <kbd className="font-mono font-bold text-[10px] px-2 py-1 rounded bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 shadow-2xs text-purple-950 dark:text-purple-200 shrink-0">
                  {sc.key}
                </kbd>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-[11px] text-gray-500">
          <span>
            টিপস: যেকোনো সময় <strong>Alt + /</strong> বা <strong>F1</strong> চেপে এই তালিকা খুলতে পারবেন।
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-purple-900 hover:bg-purple-950 text-white rounded-lg font-bold cursor-pointer transition shadow-2xs"
          >
            ঠিক আছে
          </button>
        </div>
      </div>
    </div>
  );
};
