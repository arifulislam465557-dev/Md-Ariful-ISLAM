import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Patient, Invoice, AppModuleId } from '../../types';
import { CashMemoModal } from '../Billing/CashMemoModal';
import {
  Search,
  X,
  User,
  Receipt,
  FlaskConical,
  UserCheck,
  Activity,
  Film,
  Waves,
  Stethoscope,
  DollarSign,
  Users,
  BarChart3,
  Network,
  Settings,
  ArrowRight,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  CornerDownLeft,
  ChevronRight,
  Sparkles,
  Command,
  ExternalLink,
  Lock,
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchCategory = 'all' | 'patients' | 'invoices' | 'modules';

interface ModuleItem {
  id: AppModuleId;
  nameEn: string;
  nameBn: string;
  category: string;
  shortcut: string;
  icon: React.ElementType;
  gradient: string;
  badge?: string;
  descriptionEn: string;
  descriptionBn: string;
  keywords: string[];
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const {
    patients,
    invoices,
    setActiveTab,
    hasAccessToModule,
    lang,
    openPatientOverviewModal,
    setSelectedPatientForReport,
    addNotification,
  } = useApp();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedInvoiceForMemo, setSelectedInvoiceForMemo] = useState<Invoice | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultContainerRef = useRef<HTMLDivElement>(null);

  // Focus input automatically on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setCategory('all');
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // System Modules Registry for navigation shortcuts
  const systemModules: ModuleItem[] = useMemo(
    () => [
      {
        id: 'pathology',
        nameEn: 'Pathology Lab & Reports',
        nameBn: 'প্যাথলজি ল্যাব ও টেস্ট রিপোর্ট',
        category: 'Diagnostic',
        shortcut: 'Ctrl+P',
        icon: FlaskConical,
        gradient: 'from-purple-600 to-indigo-700',
        badge: 'Main Lab',
        descriptionEn: 'Enter test results, generate pathology reports, biochemistry & hematology',
        descriptionBn: 'টেস্ট রেজাল্ট এন্ট্রি, প্যাথলজি রিপোর্ট ও বায়োকেমিস্ট্রি পরীক্ষা',
        keywords: ['pathology', 'lab', 'test', 'blood', 'cbc', 'lipid', 'urine', 'প্যাথলজি', 'ল্যাব', 'রক্ত', 'টেস্ট', 'রিপোর্ট'],
      },
      {
        id: 'billing',
        nameEn: 'Billing & Cash Memo',
        nameBn: 'বিলিং ও ক্যাশ মেমো',
        category: 'Front Desk',
        shortcut: 'Ctrl+B',
        icon: Receipt,
        gradient: 'from-emerald-600 to-teal-700',
        badge: 'Cashier',
        descriptionEn: 'Create patient bills, discount, payment receipts, print cash memo',
        descriptionBn: 'নতুন রসিদ তৈরি, ছাড়, নগদ টাকা গ্রহণ ও ক্যাশ মেমো প্রিন্ট',
        keywords: ['billing', 'bill', 'invoice', 'money', 'cash', 'memo', 'payment', 'due', 'বিলিং', 'বিল', 'ক্যাশ', 'মেমো', 'টাকা', 'পেমেন্ট', 'বকেয়া'],
      },
      {
        id: 'doctorVisit',
        nameEn: 'Doctor Visit & OPD Serial',
        nameBn: 'ডাক্তার ভিজিট ও ওপিডি সিরিয়াল',
        category: 'Clinical',
        shortcut: 'Ctrl+D',
        icon: UserCheck,
        gradient: 'from-blue-600 to-indigo-700',
        badge: 'OPD Queue',
        descriptionEn: 'Doctor appointment tokens, patient queues, consultation chamber fees',
        descriptionBn: 'ডাক্তার অ্যাপয়েন্টমেন্ট টোকেন, রোগী সিরিয়াল ও ভিজিট ফি',
        keywords: ['opd', 'doctor', 'visit', 'serial', 'appointment', 'token', 'chamber', 'ডাক্তার', 'ভিজিট', 'সিরিয়াল', 'টোকেন', 'ওপিডি', 'চেম্বার'],
      },
      {
        id: 'doctorPortal',
        nameEn: 'Digital Prescription (Rx) Studio',
        nameBn: 'ডিজিটাল প্রেসক্রিপশন পোর্টাল (Rx)',
        category: 'Clinical',
        shortcut: 'Ctrl+R',
        icon: Stethoscope,
        gradient: 'from-violet-600 to-purple-800',
        badge: 'Rx Studio',
        descriptionEn: 'Write digital prescription, medicine dosages, advice & clinical history',
        descriptionBn: 'ডিজিটাল প্রেসক্রিপশন তৈরি, ওষুধের মাত্রা, নিয়ম ও ক্লিনিক্যাল হিস্ট্রি',
        keywords: ['prescription', 'rx', 'medicine', 'dr', 'portal', 'প্রেসক্রিপশন', 'ওষুধ', 'আরএক্স', 'ডাক্তার'],
      },
      {
        id: 'ecg',
        nameEn: 'ECG Reporting Module',
        nameBn: 'ইসিজি (ECG) রিপোর্ট মডিউল',
        category: 'Imaging',
        shortcut: 'Ctrl+E',
        icon: Activity,
        gradient: 'from-rose-600 to-red-700',
        badge: 'Cardio',
        descriptionEn: 'Record rhythm, heart rate, axis, interval and generate ECG reports',
        descriptionBn: 'হৃৎস্পন্দন, রিদম, পি-ওয়েভ ও ডিজিটাল ইসিজি পর্যবেক্ষণ ও প্রিন্ট',
        keywords: ['ecg', 'heart', 'cardiac', 'pulse', 'cardio', 'ইসিজি', 'হার্ট', 'হৃৎপিণ্ড', 'রিপোর্ট'],
      },
      {
        id: 'xray',
        nameEn: 'Digital X-Ray Reporting',
        nameBn: 'ডিজিটাল এক্স-রে (X-Ray) রিপোর্ট',
        category: 'Imaging',
        shortcut: 'Ctrl+X',
        icon: Film,
        gradient: 'from-slate-700 to-zinc-800',
        badge: 'Radiology',
        descriptionEn: 'Chest, bone, extremities findings, radiological impressions & printing',
        descriptionBn: 'চেস্ট পিএ ভিউ, অস্থি ফ্র্যাকচার ও ডিজিটাল রেডিওলজি রিপোর্ট',
        keywords: ['xray', 'x-ray', 'radiology', 'chest', 'bone', 'এক্সরে', 'এক্স-রে', 'রেডিওলজি'],
      },
      {
        id: 'ultrasound',
        nameEn: 'Ultrasound (USG) Module',
        nameBn: 'আল্ট্রাসনোগ্রাফি (USG) রিপোর্ট',
        category: 'Imaging',
        shortcut: 'Ctrl+U',
        icon: Waves,
        gradient: 'from-cyan-600 to-blue-700',
        badge: 'Sonography',
        descriptionEn: 'Whole abdomen, KUB, pregnancy pelvic ultrasonography reporting',
        descriptionBn: 'হোল অ্যাবডোমেন, কেইউবি, প্রেগন্যান্সি ও ইউএসজি পর্যবেক্ষণ',
        keywords: ['ultrasound', 'usg', 'sonogram', 'abdomen', 'pelvis', 'আল্ট্রাসাউন্ড', 'ইউএসজি', 'সোনোগ্রাম'],
      },
      {
        id: 'incomeExpense',
        nameEn: 'Income, Expense & Accounts',
        nameBn: 'আয়-ব্যয়, ভাউচার ও হিসাবরক্ষণ',
        category: 'Finance',
        shortcut: 'Ctrl+I',
        icon: DollarSign,
        gradient: 'from-amber-600 to-rose-700',
        badge: 'Accounts',
        descriptionEn: 'Daily expenses, net revenue, cash register, expense vouchers & ledger',
        descriptionBn: 'প্রতিদিনের খরচ, লাভ-ক্ষতি হিসাব, ভাউচার ও অর্থনৈতিক ব্যালেন্স শিট',
        keywords: ['expense', 'income', 'accounts', 'money', 'voucher', 'finance', 'আয়', 'ব্যয়', 'হিসাব', 'ভাউচার', 'খরচ', 'টাকা'],
      },
      {
        id: 'employees',
        nameEn: 'Staff & Employee Directory',
        nameBn: 'স্টাফ ও এমপ্লয়ি ডিরেক্টরি',
        category: 'HRM',
        shortcut: 'Ctrl+M',
        icon: Users,
        gradient: 'from-teal-600 to-indigo-700',
        badge: 'Staff',
        descriptionEn: 'Staff member directory, roles, shifts, phone contacts & designations',
        descriptionBn: 'হাসপাতালের কর্মী ও স্টাফদের পদবি, শিফট, ফোন নম্বর ও তথ্য',
        keywords: ['employee', 'staff', 'salary', 'technologist', 'worker', 'কর্মী', 'কর্মচারী', 'স্টাফ', 'এমপ্লয়ি'],
      },
      {
        id: 'analytics',
        nameEn: 'Analytics, Logs & Reports',
        nameBn: 'অ্যানালিটিক্স, হিসেব ও অডিট লগ',
        category: 'Management',
        shortcut: 'Ctrl+A',
        icon: BarChart3,
        gradient: 'from-amber-700 to-orange-800',
        badge: 'Insights',
        descriptionEn: 'Departmental statistics, revenue charts, test volume & activity audit',
        descriptionBn: 'বিভাগভিত্তিক পরিসংখ্যান, আয়ের গ্রাফ, টেস্ট ভলিউম ও অডিট লগ',
        keywords: ['analytics', 'chart', 'report', 'audit', 'logs', 'statistics', 'অ্যানালিটিক্স', 'গ্রাফ', 'পরিসংখ্যান', 'লগ'],
      },
      {
        id: 'lanNetwork',
        nameEn: 'LAN Terminals & Real-Time Sync',
        nameBn: 'ল্যান নেটওয়ার্ক ও টার্মিনাল সিঙ্ক',
        category: 'Network',
        shortcut: 'Ctrl+L',
        icon: Network,
        gradient: 'from-cyan-700 to-indigo-800',
        badge: 'LAN Nodes',
        descriptionEn: 'Multi-PC local network sync, workstation IP control & remote commands',
        descriptionBn: 'একাধিক পিসির লোকাল ডাটা সিঙ্ক, আইপি সংযোগ ও টার্মিনাল স্ট্যাটাস',
        keywords: ['lan', 'network', 'ip', 'workstation', 'sync', 'pc', 'ল্যান', 'নেটওয়ার্ক', 'আইপি', 'টার্মিনাল'],
      },
      {
        id: 'settings',
        nameEn: 'Settings & Master Data',
        nameBn: 'সফটওয়্যার সেটিংস ও ডাটাবেজ ব্যাকআপ',
        category: 'Admin',
        shortcut: 'Alt+S',
        icon: Settings,
        gradient: 'from-purple-800 to-indigo-900',
        badge: 'Config',
        descriptionEn: 'Clinic header configuration, test pricing, automated backup, license renewal',
        descriptionBn: 'হাসপাতালের নাম ও হেডার, টেস্ট ফি, ব্যাকআপ সিঙ্ক ও লাইসেন্স রিনিউ',
        keywords: ['settings', 'config', 'backup', 'license', 'clinic', 'doctor', 'সেটিংস', 'ব্যাকআপ', 'লাইসেন্স', 'হেডার'],
      },
    ],
    []
  );

  // Filtered Patients
  const filteredPatients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // If empty query, show 5 most recent patients
      return [...patients].reverse().slice(0, 6);
    }
    return patients
      .filter((p) => {
        const matchName = p.patientName?.toLowerCase().includes(q);
        const matchPid = p.pId?.toLowerCase().includes(q) || `pid:${p.pId}`.toLowerCase().includes(q);
        const matchPhone = p.phone?.toLowerCase().includes(q);
        const matchDoctor = p.drName?.toLowerCase().includes(q) || p.drCode?.toLowerCase().includes(q);
        const matchDept = p.department?.toLowerCase().includes(q);
        return matchName || matchPid || matchPhone || matchDoctor || matchDept;
      })
      .slice(0, 10);
  }, [patients, query]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // If empty query, show 5 most recent invoices
      return [...invoices].reverse().slice(0, 6);
    }
    return invoices
      .filter((inv) => {
        const matchNo = inv.invoiceNo?.toLowerCase().includes(q);
        const matchPid = inv.pId?.toLowerCase().includes(q);
        const matchName = inv.patientName?.toLowerCase().includes(q);
        const matchPhone = inv.phone?.toLowerCase().includes(q);
        const matchItems = inv.items?.some((item) =>
          item.testName.toLowerCase().includes(q)
        );
        const matchStatus = inv.status?.toLowerCase().includes(q);
        return matchNo || matchPid || matchName || matchPhone || matchItems || matchStatus;
      })
      .slice(0, 10);
  }, [invoices, query]);

  // Filtered Modules
  const filteredModules = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return systemModules.slice(0, 8);
    return systemModules.filter((m) => {
      const matchEn = m.nameEn.toLowerCase().includes(q);
      const matchBn = m.nameBn.toLowerCase().includes(q);
      const matchId = m.id.toLowerCase().includes(q);
      const matchDesc = m.descriptionEn.toLowerCase().includes(q) || m.descriptionBn.toLowerCase().includes(q);
      const matchKw = m.keywords.some((kw) => kw.toLowerCase().includes(q));
      const matchShortcut = m.shortcut.toLowerCase().includes(q);
      return matchEn || matchBn || matchId || matchDesc || matchKw || matchShortcut;
    });
  }, [systemModules, query]);

  // Counts for tabs
  const patientCount = query.trim() ? filteredPatients.length : patients.length;
  const invoiceCount = query.trim() ? filteredInvoices.length : invoices.length;
  const moduleCount = query.trim() ? filteredModules.length : systemModules.length;

  // Aggregate results based on active category
  interface SearchResultItem {
    type: 'module' | 'patient' | 'invoice';
    id: string;
    data: any;
  }

  const allVisibleItems: SearchResultItem[] = useMemo(() => {
    const items: SearchResultItem[] = [];

    if (category === 'all' || category === 'modules') {
      filteredModules.forEach((m) => items.push({ type: 'module', id: m.id, data: m }));
    }
    if (category === 'all' || category === 'patients') {
      filteredPatients.forEach((p) => items.push({ type: 'patient', id: p.id, data: p }));
    }
    if (category === 'all' || category === 'invoices') {
      filteredInvoices.forEach((inv) => items.push({ type: 'invoice', id: inv.id, data: inv }));
    }

    return items;
  }, [category, filteredModules, filteredPatients, filteredInvoices]);

  // Keep selected index in bound
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, category]);

  // Handle keyboard navigation: ArrowUp, ArrowDown, Enter, Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          allVisibleItems.length > 0 ? (prev + 1) % allVisibleItems.length : 0
        );
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          allVisibleItems.length > 0
            ? (prev - 1 + allVisibleItems.length) % allVisibleItems.length
            : 0
        );
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (allVisibleItems[selectedIndex]) {
          executeSelection(allVisibleItems[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, allVisibleItems]);

  const executeSelection = (item: SearchResultItem) => {
    if (item.type === 'module') {
      const mod = item.data as ModuleItem;
      if (!hasAccessToModule(mod.id)) {
        addNotification(
          lang === 'bn' ? 'অনুমতি নেই' : 'Access Restricted',
          lang === 'bn'
            ? 'আপনার ইউজার অ্যাকাউন্টের এই মডিউলে প্রবেশের অনুমতি নেই।'
            : 'Your account is not permitted to access this module.',
          'warn'
        );
        return;
      }
      setActiveTab(mod.id);
      onClose();
    } else if (item.type === 'patient') {
      const pat = item.data as Patient;
      openPatientOverviewModal(pat);
      onClose();
    } else if (item.type === 'invoice') {
      const inv = item.data as Invoice;
      setSelectedInvoiceForMemo(inv);
    }
  };

  const handleOpenPatientLabReport = (e: React.MouseEvent, pat: Patient) => {
    e.stopPropagation();
    setSelectedPatientForReport(pat);
    setActiveTab('pathology');
    onClose();
  };

  const handleOpenPatientOverview = (e: React.MouseEvent, pat: Patient) => {
    e.stopPropagation();
    openPatientOverviewModal(pat);
    onClose();
  };

  const handleOpenInvoiceMemo = (e: React.MouseEvent, inv: Invoice) => {
    e.stopPropagation();
    setSelectedInvoiceForMemo(inv);
  };

  const handleNavigateToBilling = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveTab('billing');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Background Dim Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-start justify-center pt-6 sm:pt-14 p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
        onClick={onClose}
      >
        {/* Main Search Modal Box */}
        <div
          className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-purple-200/50 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh] text-slate-800 dark:text-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header & Search Input Box */}
          <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-purple-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-850 dark:to-purple-950/30">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-purple-600 dark:text-pink-400 absolute left-3.5 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  lang === 'bn'
                    ? 'রোগীর নাম, আইডি, ফোন, ইনভয়েস নম্বর বা মডিউল খুঁজুন...'
                    : 'Search patient name, ID, phone, invoice no, or system module...'
                }
                className="w-full pl-11 pr-20 py-2.5 sm:py-3 bg-white dark:bg-slate-950 border-2 border-purple-300 dark:border-purple-900 focus:border-purple-600 dark:focus:border-pink-500 rounded-xl text-sm sm:text-base font-medium outline-hidden shadow-inner text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              <div className="absolute right-2.5 flex items-center gap-1">
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      inputRef.current?.focus();
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md transition cursor-pointer"
                    title={lang === 'bn' ? 'মুছে ফেলুন' : 'Clear search'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-500 dark:text-slate-400 shadow-2xs">
                  ESC
                </kbd>
              </div>
            </div>

            {/* Quick Filter Category Pills */}
            <div className="flex items-center gap-1.5 sm:gap-2 mt-3 overflow-x-auto pb-0.5 no-scrollbar">
              <button
                type="button"
                onClick={() => setCategory('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  category === 'all'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-slate-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'সকল ফলাফল' : 'All Results'}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                  {allVisibleItems.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('patients')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  category === 'patients'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-slate-700'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'রোগী তালিকা' : 'Patients'}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 font-bold">
                  {patientCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('invoices')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  category === 'invoices'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-slate-700'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'বিলিং ও ক্যাশ মেমো' : 'Billing & Invoices'}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                  {invoiceCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('modules')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  category === 'modules'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-slate-700'
                }`}
              >
                <Command className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'মডিউল নেভিগেশন' : 'Modules'}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold">
                  {moduleCount}
                </span>
              </button>
            </div>
          </div>

          {/* Results List Area */}
          <div
            ref={resultContainerRef}
            className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-slate-100 dark:divide-slate-800/80 space-y-4"
          >
            {allVisibleItems.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-pink-400">
                  <Search className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                  {lang === 'bn' ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No Results Found'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  {lang === 'bn'
                    ? `"${query}" এর সাথে মিলে এমন কোনো রোগী, ইনভয়েস বা মডিউল পাওয়া যায়নি। বানান চেক করুন।`
                    : `Could not find any patients, invoices, or modules matching "${query}".`}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setCategory('all');
                    }}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition cursor-pointer"
                  >
                    {lang === 'bn' ? 'সব দেখুন' : 'Show All'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 1. MODULE SHORTCUTS SECTION */}
                {(category === 'all' || category === 'modules') && filteredModules.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1 pt-1">
                      <span className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
                        <Command className="w-3.5 h-3.5" />
                        {lang === 'bn' ? 'মডিউল দ্রুত নেভিগেশন' : 'Module Navigation'}
                      </span>
                      <span className="text-[11px] font-normal text-slate-400">
                        {filteredModules.length} {lang === 'bn' ? 'টি' : 'found'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filteredModules.map((mod) => {
                        const Icon = mod.icon;
                        const isAccessible = hasAccessToModule(mod.id);
                        const isCurSelected =
                          allVisibleItems[selectedIndex]?.type === 'module' &&
                          allVisibleItems[selectedIndex]?.id === mod.id;

                        return (
                          <div
                            key={mod.id}
                            onClick={() => executeSelection({ type: 'module', id: mod.id, data: mod })}
                            className={`group p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                              isCurSelected
                                ? 'bg-purple-100/90 dark:bg-purple-950/70 border-purple-500 shadow-sm'
                                : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${mod.gradient} flex items-center justify-center text-white shrink-0 shadow-xs`}
                              >
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                                    {lang === 'bn' ? mod.nameBn : mod.nameEn}
                                  </h4>
                                  {!isAccessible && (
                                    <span className="px-1.5 py-0.2 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 text-[10px] rounded-sm font-bold flex items-center gap-0.5">
                                      <Lock className="w-2.5 h-2.5" />
                                      {lang === 'bn' ? 'সীমাবদ্ধ' : 'Restricted'}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  {lang === 'bn' ? mod.descriptionBn : mod.descriptionEn}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-purple-700 dark:text-pink-300 rounded-md shadow-2xs">
                                {mod.shortcut}
                              </kbd>
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. PATIENTS SECTION */}
                {(category === 'all' || category === 'patients') && filteredPatients.length > 0 && (
                  <div className="space-y-2 pt-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                      <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                        <User className="w-3.5 h-3.5" />
                        {lang === 'bn' ? 'রোগী ও টেস্ট হিস্ট্রি' : 'Patients & Records'}
                      </span>
                      <span className="text-[11px] font-normal text-slate-400">
                        {filteredPatients.length} {lang === 'bn' ? 'জন' : 'found'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {filteredPatients.map((pat) => {
                        const isCurSelected =
                          allVisibleItems[selectedIndex]?.type === 'patient' &&
                          allVisibleItems[selectedIndex]?.id === pat.id;

                        const statusBg =
                          pat.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : pat.status === 'Printed'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';

                        return (
                          <div
                            key={pat.id}
                            onClick={() => executeSelection({ type: 'patient', id: pat.id, data: pat })}
                            className={`group p-3 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                              isCurSelected
                                ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-400 shadow-sm'
                                : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                            }`}
                          >
                            <div className="flex items-start sm:items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs">
                                {pat.patientName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                    {pat.patientName}
                                  </h4>
                                  <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 font-mono text-[11px] font-bold">
                                    PID: {pat.pId}
                                  </span>
                                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                    {pat.age}y / {pat.sex}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBg}`}
                                  >
                                    {pat.status}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                                  {pat.phone && (
                                    <span className="flex items-center gap-1 font-mono">
                                      <Phone className="w-3 h-3 text-slate-400" />
                                      {pat.phone}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Stethoscope className="w-3 h-3 text-slate-400" />
                                    {pat.drName || pat.drCode}
                                  </span>
                                  {pat.invDate && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-slate-400" />
                                      {pat.invDate}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions Right */}
                            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                              <button
                                type="button"
                                onClick={(e) => handleOpenPatientOverview(e, pat)}
                                className="px-2.5 py-1 text-xs font-bold bg-white dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg transition cursor-pointer shadow-2xs"
                                title={lang === 'bn' ? 'পুরো প্রোফাইল ও হিস্ট্রি দেখুন' : 'View full patient profile'}
                              >
                                {lang === 'bn' ? 'ফাইল দেখুন' : 'Overview'}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleOpenPatientLabReport(e, pat)}
                                className="px-2.5 py-1 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition cursor-pointer shadow-xs flex items-center gap-1"
                                title={lang === 'bn' ? 'প্যাথলজি টেস্ট রিপোর্ট খুলুন' : 'Open Pathology Lab Report'}
                              >
                                <FlaskConical className="w-3 h-3" />
                                <span>{lang === 'bn' ? 'ল্যাব রিপোর্ট' : 'Report'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. INVOICES & BILLING SECTION */}
                {(category === 'all' || category === 'invoices') && filteredInvoices.length > 0 && (
                  <div className="space-y-2 pt-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                      <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                        <Receipt className="w-3.5 h-3.5" />
                        {lang === 'bn' ? 'বিলিং রসিদ ও ইনভয়েস' : 'Billing & Cash Memos'}
                      </span>
                      <span className="text-[11px] font-normal text-slate-400">
                        {filteredInvoices.length} {lang === 'bn' ? 'টি' : 'found'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {filteredInvoices.map((inv) => {
                        const isCurSelected =
                          allVisibleItems[selectedIndex]?.type === 'invoice' &&
                          allVisibleItems[selectedIndex]?.id === inv.id;

                        const isPaid = inv.status === 'Paid' || inv.dueAmount <= 0;

                        return (
                          <div
                            key={inv.id}
                            onClick={() => executeSelection({ type: 'invoice', id: inv.id, data: inv })}
                            className={`group p-3 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                              isCurSelected
                                ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-400 shadow-sm'
                                : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700'
                            }`}
                          >
                            <div className="flex items-start sm:items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white shrink-0 shadow-xs">
                                <Receipt className="w-5 h-5 text-white" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                    {inv.patientName}
                                  </h4>
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 font-mono text-[11px] font-bold">
                                    #{inv.invoiceNo}
                                  </span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                    PID: {inv.pId}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      isPaid
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                    }`}
                                  >
                                    {isPaid
                                      ? lang === 'bn'
                                        ? 'পরিশোধিত'
                                        : 'Paid'
                                      : `${lang === 'bn' ? 'বকেয়া' : 'Due'}: ৳${inv.dueAmount}`}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                                  <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">
                                    ৳{inv.netTotal}
                                  </span>
                                  {inv.date && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      {inv.date}
                                    </span>
                                  )}
                                  {inv.items && inv.items.length > 0 && (
                                    <span className="truncate max-w-xs text-slate-400 text-[11px]">
                                      ({inv.items.map((i) => i.testName).join(', ')})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions Right */}
                            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                              <button
                                type="button"
                                onClick={(e) => handleOpenInvoiceMemo(e, inv)}
                                className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition cursor-pointer shadow-xs flex items-center gap-1"
                                title={lang === 'bn' ? 'ক্যাশ মেমো দেখুন ও প্রিন্ট করুন' : 'View & Print Cash Memo'}
                              >
                                <Receipt className="w-3 h-3" />
                                <span>{lang === 'bn' ? 'ক্যাশ মেমো' : 'Cash Memo'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleNavigateToBilling}
                                className="px-2.5 py-1 text-xs font-bold bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg transition cursor-pointer shadow-2xs"
                              >
                                {lang === 'bn' ? 'বিলিং মডিউল' : 'Billing'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Shortcuts Guide */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] shadow-2xs">
                  ↑
                </kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] shadow-2xs">
                  ↓
                </kbd>
                <span className="ml-0.5">{lang === 'bn' ? 'নেভিগেট' : 'Navigate'}</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] shadow-2xs">
                  Enter
                </kbd>
                <span className="ml-0.5">{lang === 'bn' ? 'নির্বাচন' : 'Select'}</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] shadow-2xs">
                  Esc
                </kbd>
                <span className="ml-0.5">{lang === 'bn' ? 'বন্ধ করুন' : 'Close'}</span>
              </span>
            </div>

            <div className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">
              <span>Adiba Hospital Global Search</span>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Cash Memo Modal when clicking View Cash Memo */}
      {selectedInvoiceForMemo && (
        <CashMemoModal
          invoice={selectedInvoiceForMemo}
          onClose={() => setSelectedInvoiceForMemo(null)}
        />
      )}
    </>
  );
};
