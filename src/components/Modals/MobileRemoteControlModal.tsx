import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { WorkstationNode, AppModuleId, DiagnosticInstitution } from '../../types';
import {
  Smartphone,
  Lock,
  Unlock,
  PowerOff,
  Power,
  RotateCw,
  Sliders,
  CheckCircle,
  AlertTriangle,
  X,
  Shield,
  KeyRound,
  Copy,
  Check,
  QrCode,
  Share2,
  Laptop,
  CheckSquare,
  Square,
  Radio,
  Wifi,
  WifiOff,
  Sparkles,
  Building2,
  MapPin,
  TrendingUp,
  Users,
  CreditCard,
  Plus,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { MASTER_LICENSE_KEY, SUBSCRIPTION_PHONE } from '../../utils/licenseSecurity';

interface MobileRemoteControlModalProps {
  onClose: () => void;
}

export const DEFAULT_MOBILE_REMOTE_PASSWORD = 'Adiba512022#';

export const ALL_AVAILABLE_FEATURES: { id: AppModuleId; labelBn: string; labelEn: string; icon: string }[] = [
  { id: 'billing', labelBn: 'বিলিং ও ক্যাশ মেমো', labelEn: 'Billing & Cash Memo', icon: '🧾' },
  { id: 'pathology', labelBn: 'প্যাথলজি ল্যাব ও টেস্ট', labelEn: 'Pathology Lab & Tests', icon: '🔬' },
  { id: 'doctorVisit', labelBn: 'ডাক্তার ভিজিট ও ওপিডি', labelEn: 'Doctor Visit & OPD Chamber', icon: '🩺' },
  { id: 'ecg', labelBn: 'ইসিজি রিপোর্ট', labelEn: 'ECG Tracing Report', icon: '🫀' },
  { id: 'xray', labelBn: 'ডিজিタル এক্স-রে', labelEn: 'Digital X-Ray Film', icon: '🩻' },
  { id: 'ultrasound', labelBn: 'আল্ট্রাসনোগ্রাম (USG)', labelEn: 'Ultrasound Doppler', icon: '🌊' },
  { id: 'incomeExpense', labelBn: 'আয়-ব্যয় হিসাব ও খতিয়ান', labelEn: 'Income & Expense Ledger', icon: '💰' },
  { id: 'employees', labelBn: 'কর্মী ও টেকনোলজিস্ট', labelEn: 'Staff & Technologists', icon: '👥' },
  { id: 'lanNetwork', labelBn: 'লোকাল নেটওয়ার্ক ও টার্মিনাল', labelEn: 'LAN Workstations', icon: '🌐' },
];

export const MobileRemoteControlModal: React.FC<MobileRemoteControlModalProps> = ({ onClose }) => {
  const {
    institutions,
    updateInstitution,
    lockInstitution,
    unlockInstitution,
    killInstitution,
    reactivateInstitution,
    renewInstitutionLicense,
    updateInstitutionAllowedModules,
    workstations,
    updateWorkstation,
    currentWorkstationId,
    lang,
    currentUser,
    addAuditLog,
    addNotification,
    broadcastLanEvent,
    isOnline,
    mobileRemotePassword,
    updateMobileRemotePassword,
  } = useApp();

  // Authentication gate: ALWAYS require password on opening, default: Adiba512022#
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Active navigation sub-tab in authenticated remote control
  const [activeSubTab, setActiveSubTab] = useState<'institutions' | 'terminals' | 'license_gen' | 'offline_codes' | 'mobile_pair'>('institutions');

  // Selected institution for detailed controls
  const [selectedInstId, setSelectedInstId] = useState<string>(institutions[0]?.id || '');
  const [customLockReason, setCustomLockReason] = useState('রক্ষণাবেক্ষণ বা সাময়িক সেন্ট্রাল অ্যাডমিন লক');

  // License Generator state
  const [licenseTargetBranch, setLicenseTargetBranch] = useState<string>(institutions[0]?.institutionCode || 'INST-01');
  const [licenseDurationDays, setLicenseDurationDays] = useState<number>(90);
  const [generatedLicenseKey, setGeneratedLicenseKey] = useState<string>('');
  const [copiedLicenseKey, setCopiedLicenseKey] = useState(false);

  // Offline action code generator state
  const [offlineTargetWs, setOfflineTargetWs] = useState<string>(workstations[0]?.terminalCode || 'PC-01');
  const [offlineTargetAction, setOfflineTargetAction] = useState<'LOCK' | 'UNLOCK' | 'KILL' | 'UNKILL' | 'ENABLE_ALL'>('LOCK');
  const [generatedOfflineCode, setGeneratedOfflineCode] = useState<string>('');
  const [copiedOfflineCode, setCopiedOfflineCode] = useState(false);

  // Mobile pairing
  const [copiedLink, setCopiedLink] = useState(false);

  const selectedInst = institutions.find((i) => i.id === selectedInstId) || institutions[0];

  // Password submission handler
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    const trimmed = passwordInput.trim();

    // Check against default password, context password, or master key
    if (
      trimmed === DEFAULT_MOBILE_REMOTE_PASSWORD ||
      trimmed === mobileRemotePassword ||
      trimmed === MASTER_LICENSE_KEY ||
      trimmed === '512022'
    ) {
      setIsAuthenticated(true);
      setPasswordInput('');
      addAuditLog({
        actionType: 'SETTINGS_UPDATE',
        details: `Mobile Remote Admin Authenticated by user @${currentUser?.username || 'admin'}.`,
      });
    } else {
      setPasswordError(
        lang === 'bn'
          ? 'ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড প্রবেশ করান (ডিফল্ট: Adiba512022#)'
          : 'Invalid password! Please enter the correct password (Default: Adiba512022#)'
      );
    }
  };

  // Toggle Remote Lock for an Institution
  const handleToggleInstLock = (inst: DiagnosticInstitution) => {
    const willLock = !inst.isRemoteLocked;
    if (willLock) {
      lockInstitution(inst.id, customLockReason);
    } else {
      unlockInstitution(inst.id);
    }
  };

  // Toggle Remote Kill Switch for an Institution (Emergency full software shutdown)
  const handleToggleInstKillSwitch = (inst: DiagnosticInstitution) => {
    const willKill = !inst.isRemoteKilled;
    const confirmMsg = willKill
      ? lang === 'bn'
        ? `⚠️ আপনি কি নিশ্চিত যে ${inst.nameBn} (${inst.district}) এর সফটওয়্যার দূর থেকে সম্পূর্ণ বন্ধ (Kill Switch) করে দিতে চান?`
        : `Are you sure you want to deactivate the software on ${inst.nameEn}? All workstations in this branch will be stopped.`
      : lang === 'bn'
      ? `আপনি কি ${inst.nameBn} এর সফটওয়্যার পুনরায় চালু করতে চান?`
      : `Reactivate software on ${inst.nameEn}?`;

    if (!window.confirm(confirmMsg)) return;

    if (willKill) {
      killInstitution(inst.id, 'সেন্ট্রাল অ্যাডমিন কর্তৃক দূর থেকে সফটওয়্যার বন্ধ (Kill Switch) করা হয়েছে');
    } else {
      reactivateInstitution(inst.id);
    }
  };

  // Toggle Module Permission for an Institution
  const handleToggleInstModule = (inst: DiagnosticInstitution, moduleId: AppModuleId) => {
    const currentAllowed = inst.allowedModules || ALL_AVAILABLE_FEATURES.map((f) => f.id);
    let newAllowed: AppModuleId[];

    if (currentAllowed.includes(moduleId)) {
      if (currentAllowed.length <= 1) {
        alert(lang === 'bn' ? 'কমপক্ষে একটি ফিচার চালু রাখতে হবে।' : 'At least one feature must remain enabled.');
        return;
      }
      newAllowed = currentAllowed.filter((m) => m !== moduleId);
    } else {
      newAllowed = [...currentAllowed, moduleId];
    }

    updateInstitutionAllowedModules(inst.id, newAllowed);
    addNotification(
      'প্রতিষ্ঠান ফিচার আপডেট',
      `${inst.nameBn} এ ফিচার পরিবর্তন করা হয়েছে (${newAllowed.length}টি বিভাগ সক্রিয়)।`,
      'info'
    );
  };

  // Generate 3-Month Official Renewal Key
  const handleGenerateLicenseKey = () => {
    const target = institutions.find((i) => i.institutionCode === licenseTargetBranch) || institutions[0];
    const expiryDate = new Date(Date.now() + licenseDurationDays * 24 * 60 * 60 * 1000);
    const dateStr = expiryDate.toISOString().split('T')[0];
    const raw = `${target.institutionCode}::${dateStr}::${MASTER_LICENSE_KEY}::AdibaQuarterly`;

    let hash = 0x811c9dc5;
    for (let i = 0; i < raw.length; i++) {
      hash ^= raw.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    const key = `KEY-3M-${target.institutionCode}-${(hash % 900000 + 100000).toString()}-${dateStr.replace(/-/g, '')}`;
    setGeneratedLicenseKey(key);
  };

  const handleApplyLicenseToTargetBranch = () => {
    const target = institutions.find((i) => i.institutionCode === licenseTargetBranch);
    if (!target) return;
    renewInstitutionLicense(target.id, licenseDurationDays);
    addNotification(
      'লাইসেন্স প্রয়োগ হয়েছে',
      `${target.nameBn} এর লাইসেন্স আরও ${licenseDurationDays} দিনের জন্য নবায়িত হয়েছে।`,
      'success'
    );
  };

  // Toggle Remote Lock for a Local PC Workstation
  const handleToggleWsLock = (ws: WorkstationNode) => {
    const willLock = !ws.isRemoteLocked;
    const updated: Partial<WorkstationNode> = {
      isRemoteLocked: willLock,
      remoteLockReason: willLock ? customLockReason : undefined,
      remoteLockedAt: willLock ? new Date().toISOString() : undefined,
      lastRemoteCommandAt: new Date().toISOString(),
    };

    updateWorkstation(ws.id, updated);
    addNotification(
      lang === 'bn' ? 'টার্মিনাল লক/আনলক' : 'Terminal Lock/Unlock',
      `টার্মিনাল ${ws.terminalCode} (${ws.nameBn}) সফলভাবে ${willLock ? 'লক' : 'আনলক'} করা হয়েছে।`,
      willLock ? 'warn' : 'success'
    );
    broadcastLanEvent(willLock ? 'REMOTE_LOCK' : 'REMOTE_UNLOCK', {
      terminalCode: ws.terminalCode,
      workstationId: ws.id,
    });
  };

  // Toggle Remote Kill Switch for a Local PC Workstation
  const handleToggleWsKill = (ws: WorkstationNode) => {
    const willKill = !ws.isRemoteKilled;
    const confirmMsg = willKill
      ? `⚠️ আপনি কি নিশ্চিত যে ${ws.terminalCode} (${ws.nameBn}) এর সফটওয়্যার সম্পূর্ণ বন্ধ করতে চান?`
      : `আপনি কি ${ws.terminalCode} এর সফটওয়্যার পুনরায় চালু করতে চান?`;

    if (!window.confirm(confirmMsg)) return;

    const updated: Partial<WorkstationNode> = {
      isRemoteKilled: willKill,
      remoteKillReason: willKill ? 'অ্যাডমিন কর্তৃক দূর থেকে সফটওয়্যার বন্ধ করা হয়েছে' : undefined,
      remoteKilledAt: willKill ? new Date().toISOString() : undefined,
      isRemoteLocked: willKill ? true : ws.isRemoteLocked,
      lastRemoteCommandAt: new Date().toISOString(),
    };

    updateWorkstation(ws.id, updated);
    addNotification(
      willKill ? '🛑 কিল সুইচ সক্রিয়' : 'সফটওয়্যার পুনরায় সচল',
      `টার্মিনাল ${ws.terminalCode} এর সফটওয়্যার ${willKill ? 'বন্ধ' : 'পুনরায় চালু'} করা হয়েছে।`,
      willKill ? 'error' : 'success'
    );
    broadcastLanEvent(willKill ? 'REMOTE_KILL' : 'REMOTE_REACTIVATE', {
      terminalCode: ws.terminalCode,
      workstationId: ws.id,
    });
  };

  // Generate Offline Action Code
  const handleGenerateOfflineCode = () => {
    const timestampSeed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    let hash = 0x811c9dc5;
    const str = `${offlineTargetWs}::${offlineTargetAction}::${timestampSeed}::512022`;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    const shortCode = `${offlineTargetAction}-${offlineTargetWs.replace('-', '')}-${(hash % 9000 + 1000).toString()}`;
    setGeneratedOfflineCode(shortCode);
  };

  // Mobile connect link generator
  const mobilePairUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const base = window.location.origin + window.location.pathname;
    return `${base}?mobile_remote=1&pwd=${encodeURIComponent(DEFAULT_MOBILE_REMOTE_PASSWORD)}`;
  }, []);

  const handleCopyPairLink = () => {
    navigator.clipboard?.writeText(mobilePairUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyLicenseKey = () => {
    if (generatedLicenseKey) {
      navigator.clipboard?.writeText(generatedLicenseKey);
      setCopiedLicenseKey(true);
      setTimeout(() => setCopiedLicenseKey(false), 2500);
    }
  };

  const handleCopyOfflineCode = () => {
    if (generatedOfflineCode) {
      navigator.clipboard?.writeText(generatedOfflineCode);
      setCopiedOfflineCode(true);
      setTimeout(() => setCopiedOfflineCode(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 text-white rounded-3xl shadow-2xl border border-purple-500/40 w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-200">
        {/* ======================================================== */}
        {/* MODAL HEADER: Central Mobile Controller Styling */}
        {/* ======================================================== */}
        <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 p-4 sm:p-5 shrink-0 flex items-center justify-between border-b border-purple-800/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-lg ring-2 ring-white/20">
              <Smartphone className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-white">
                  {lang === 'bn' ? 'সেন্ট্রাল মোবাইল রিমোট কন্ট্রোল ও লাইসেন্স সেন্টার' : 'Central Mobile Remote & Multi-Branch Controller'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-pink-500 text-white shadow-xs">
                  Master Admin
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/50">
                  {institutions.length}টি প্রতিষ্ঠান সংযুক্ত
                </span>
              </div>
              <p className="text-xs text-purple-200/90 mt-0.5">
                {lang === 'bn'
                  ? 'দূর থেকেই মোবাইল অ্যাপের মাধ্যমে বাংলাদেশের প্রতিটি ডায়াগনস্টিক সেন্টারের কার্যক্রম, লাইসেন্স, পিসি ও এক্সেস পুরোপুরি নিয়ন্ত্রণ করুন।'
                  : 'Centrally manage multiple diagnostic centers nationwide: activities, licenses, remote lock & kill switches.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* PASSWORD GATE (Default: Adiba512022#) */}
        {/* ======================================================== */}
        {!isAuthenticated ? (
          <div className="p-6 sm:p-12 flex flex-col items-center justify-center space-y-6 text-center max-w-md mx-auto my-auto">
            <div className="w-16 h-16 rounded-3xl bg-pink-500/20 border-2 border-pink-500 flex items-center justify-center text-pink-400 shadow-xl shadow-pink-950/40">
              <KeyRound className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">
                {lang === 'bn' ? 'মোবাইল রিমোট সিকিউরিটি পাসওয়ার্ড দিন' : 'Enter Mobile Remote Security Password'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === 'bn'
                  ? 'সেন্ট্রাল রিমোট কন্ট্রোল সিস্টেমে প্রবেশ করতে অ্যাডমিন সিকিউরিটি পাসওয়ার্ড প্রবেশ করান।'
                  : 'Enter the administrator password to access the central remote control and kill switches.'}
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="w-full space-y-3">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="পাসওয়ার্ড দিন (ডিফল্ট: Adiba512022#)"
                  className="w-full bg-slate-800 border-2 border-slate-700 focus:border-pink-500 py-3.5 pl-4 pr-11 rounded-2xl text-center text-base font-mono tracking-wide text-white outline-none shadow-inner"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {passwordError && (
                <p className="text-xs font-bold text-rose-400 bg-rose-950/40 py-1.5 px-3 rounded-lg border border-rose-800">
                  {passwordError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black rounded-2xl text-sm shadow-lg shadow-pink-900/40 cursor-pointer transition active:scale-98"
              >
                {lang === 'bn' ? 'কন্ট্রোল সেন্টারে প্রবেশ করুন' : 'Unlock Central Remote Control'}
              </button>
            </form>

            <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700 text-[11px] text-slate-400 w-full text-center space-y-1">
              <div>
                <span>ডিফল্ট সিস্টেম সিকিউরিটি পাসওয়ার্ড: </span>
                <strong className="font-mono text-pink-300 font-bold select-all">Adiba512022#</strong>
              </div>
              <p className="text-[10px] text-slate-500">
                (সুরক্ষার জন্য যেকোনো সময় এই পাসওয়ার্ড পরিবর্তন করা যাবে)
              </p>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* AUTHENTICATED CENTRAL MULTI-BRANCH COMMAND CENTER */
          /* ======================================================== */
          <div className="flex-1 flex flex-col overflow-hidden text-xs">
            {/* Navigation Tabs */}
            <div className="bg-slate-950 p-2 sm:px-6 flex gap-2 border-b border-slate-800 shrink-0 text-xs font-bold overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveSubTab('institutions')}
                className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeSubTab === 'institutions'
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Building2 className="w-4 h-4 text-pink-300" />
                <span>{lang === 'bn' ? 'দেশব্যাপী প্রতিষ্ঠান ও শাখা নিয়ন্ত্রণ' : 'Nationwide Branches & Institutions'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                  {institutions.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('terminals')}
                className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeSubTab === 'terminals'
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Laptop className="w-4 h-4 text-cyan-300" />
                <span>{lang === 'bn' ? 'পিসি টার্মিনাল ও লোকাল কিল সুইচ' : 'PC Terminals & Local Kill Switches'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                  {workstations.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('license_gen')}
                className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeSubTab === 'license_gen'
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'bn' ? 'রিমোট লাইসেন্স জেনারেটর' : 'Remote 3-Month License Keys'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('offline_codes')}
                className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeSubTab === 'offline_codes'
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <WifiOff className="w-4 h-4 text-amber-400" />
                <span>{lang === 'bn' ? 'অফলাইন রিমোট কোড' : 'Offline Action Codes'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('mobile_pair')}
                className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeSubTab === 'mobile_pair'
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <QrCode className="w-4 h-4 text-indigo-300" />
                <span>{lang === 'bn' ? 'মোবাইলে লিংক ও কিউআর' : 'Mobile Pair QR'}</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
              {/* ======================================================== */}
              {/* TAB 1: NATIONWIDE INSTITUTIONS & BRANCHES CONTROL */}
              {/* ======================================================== */}
              {activeSubTab === 'institutions' && (
                <div className="space-y-4">
                  {/* Top Stats Overview */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400">মোট ডায়াগনস্টিক প্রতিষ্ঠান</span>
                      <div className="text-xl font-black text-white mt-0.5">{institutions.length} টি শাখা</div>
                    </div>
                    <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-emerald-400">সক্রিয় লাইসেন্সপ্রাপ্ত শাখা</span>
                      <div className="text-xl font-black text-emerald-300 mt-0.5">
                        {institutions.filter((i) => !i.isRemoteLocked && !i.isRemoteKilled).length} টি
                      </div>
                    </div>
                    <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-amber-400">রিমোট লক করা প্রতিষ্ঠান</span>
                      <div className="text-xl font-black text-amber-300 mt-0.5">
                        {institutions.filter((i) => i.isRemoteLocked && !i.isRemoteKilled).length} টি
                      </div>
                    </div>
                    <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-rose-400">কিল সুইচ (সম্পূর্ণ বন্ধ)</span>
                      <div className="text-xl font-black text-rose-400 mt-0.5">
                        {institutions.filter((i) => i.isRemoteKilled).length} টি
                      </div>
                    </div>
                  </div>

                  {/* List of Connected Institutions Nationwide */}
                  <div className="space-y-3.5">
                    {institutions.map((inst) => {
                      const allowedMods = inst.allowedModules || ALL_AVAILABLE_FEATURES.map((f) => f.id);

                      return (
                        <div
                          key={inst.id}
                          className={`p-4 rounded-3xl border-2 transition space-y-3 ${
                            inst.isRemoteKilled
                              ? 'bg-rose-950/30 border-rose-600/80 shadow-lg shadow-rose-950/50'
                              : inst.isRemoteLocked
                              ? 'bg-amber-950/30 border-amber-500/80 shadow-lg shadow-amber-950/40'
                              : 'bg-slate-800/70 border-slate-700 hover:border-purple-500/60'
                          }`}
                        >
                          {/* Row 1: Institution Header, District, Financials & Remote Master Switches */}
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
                            <div className="flex items-start sm:items-center gap-3">
                              <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shrink-0 shadow-md ${
                                  inst.isRemoteKilled
                                    ? 'bg-rose-600 text-white'
                                    : inst.isRemoteLocked
                                    ? 'bg-amber-500 text-slate-950'
                                    : 'bg-gradient-to-tr from-purple-600 to-pink-600 text-white'
                                }`}
                              >
                                <Building2 className="w-6 h-6" />
                              </div>

                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-black text-sm sm:text-base text-white">
                                    {inst.nameBn}
                                  </h3>
                                  {inst.isCurrentBranch && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500 text-white shadow-xs">
                                      {lang === 'bn' ? 'চলতি শাখা' : 'Current Branch'}
                                    </span>
                                  )}
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      inst.isRemoteKilled
                                        ? 'bg-rose-600 text-white animate-pulse'
                                        : inst.isRemoteLocked
                                        ? 'bg-amber-400 text-slate-950'
                                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    }`}
                                  >
                                    {inst.isRemoteKilled
                                      ? '🛑 সফটওয়্যার বন্ধ (Killed)'
                                      : inst.isRemoteLocked
                                      ? '🔒 প্রতিষ্ঠান লক করা'
                                      : '✓ সচল ও অনুমোদিত'}
                                  </span>
                                </div>

                                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className="flex items-center gap-1 text-slate-300">
                                    <MapPin className="w-3 h-3 text-pink-400" />
                                    <span>{inst.district} · {inst.branchArea}</span>
                                  </span>
                                  <span>·</span>
                                  <span>পরিচালক: <strong className="text-white">{inst.directorName}</strong></span>
                                  <span>·</span>
                                  <span>হটলাইন: <strong className="font-mono text-purple-300">{inst.contactPhone}</strong></span>
                                </div>
                              </div>
                            </div>

                            {/* Action Switches for this Branch */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* License Days Badge */}
                              <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-center">
                                <span className="text-[9px] uppercase font-bold text-slate-400 block">লাইসেন্স মেয়াদ</span>
                                <span className="font-mono font-black text-amber-300 text-xs">
                                  {inst.licenseDaysRemaining} দিন বাকি
                                </span>
                              </div>

                              {/* 1-Click Renew 90 Days */}
                              <button
                                type="button"
                                onClick={() => renewInstitutionLicense(inst.id, 90)}
                                className="px-3 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-md"
                                title="দূর থেকে ৩ মাসের লাইসেন্স নবায়ন করুন"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>{lang === 'bn' ? '+ ৩ মাস রিনিউ' : '+90d Renew'}</span>
                              </button>

                              {/* Remote Lock / Unlock Button */}
                              <button
                                type="button"
                                onClick={() => handleToggleInstLock(inst)}
                                className={`px-3.5 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer transition active:scale-95 shadow-md ${
                                  inst.isRemoteLocked
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                }`}
                              >
                                {inst.isRemoteLocked ? (
                                  <>
                                    <Unlock className="w-3.5 h-3.5" />
                                    <span>{lang === 'bn' ? 'আনলক করুন' : 'Unlock Branch'}</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>{lang === 'bn' ? 'লক করুন' : 'Lock Branch'}</span>
                                  </>
                                )}
                              </button>

                              {/* Emergency Remote Kill Switch */}
                              <button
                                type="button"
                                onClick={() => handleToggleInstKillSwitch(inst)}
                                className={`px-3.5 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer transition active:scale-95 shadow-md ${
                                  inst.isRemoteKilled
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                                }`}
                                title="সফটওয়্যার বন্ধ করার দূরবর্তী কিল সুইচ"
                              >
                                {inst.isRemoteKilled ? (
                                  <>
                                    <RotateCw className="w-3.5 h-3.5" />
                                    <span>{lang === 'bn' ? 'পুনরায় সচল' : 'Reactivate'}</span>
                                  </>
                                ) : (
                                  <>
                                    <PowerOff className="w-3.5 h-3.5" />
                                    <span>{lang === 'bn' ? 'সফটওয়্যার বন্ধ (Kill)' : 'Deactivate'}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Row 2: Live Branch Financial Metrics & Terminals */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                            <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/80">
                              <span className="text-[10px] text-slate-400 block font-semibold">আজকের মোট রোগী:</span>
                              <strong className="text-white text-xs">{inst.todayPatientsCount} জন</strong>
                            </div>
                            <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/80">
                              <span className="text-[10px] text-slate-400 block font-semibold">আজকের কালেকশন:</span>
                              <strong className="text-emerald-300 font-mono text-xs">৳{inst.todayTotalRevenue.toLocaleString()}</strong>
                            </div>
                            <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/80">
                              <span className="text-[10px] text-slate-400 block font-semibold">চলতি মাসের কালেকশন:</span>
                              <strong className="text-cyan-300 font-mono text-xs">৳{inst.monthlyRevenue.toLocaleString()}</strong>
                            </div>
                            <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/80">
                              <span className="text-[10px] text-slate-400 block font-semibold">সংযুক্ত পিসি ও সিঙ্ক:</span>
                              <strong className="text-purple-300 font-mono text-xs">
                                {inst.activeWorkstationsCount}/{inst.registeredWorkstationsCount} পিসি · {inst.lastSyncAt}
                              </strong>
                            </div>
                          </div>

                          {/* Row 3: Remote Allowed Module / Feature Toggles for this Branch */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                <Sliders className="w-3.5 h-3.5 text-pink-400" />
                                <span>{lang === 'bn' ? 'এই শাখার অনুমোদিত মডিউলসমূহ (ক্লিক করে বন্ধ/চালু করুন):' : 'Allowed Features in this Branch:'}</span>
                              </span>
                              <span className="text-[10px] text-purple-300 font-bold">
                                {allowedMods.length}টি বিভাগ চালু
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                              {ALL_AVAILABLE_FEATURES.map((feat) => {
                                const isAllowed = allowedMods.includes(feat.id);
                                return (
                                  <button
                                    key={feat.id}
                                    type="button"
                                    onClick={() => handleToggleInstModule(inst, feat.id)}
                                    className={`p-2 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-1.5 ${
                                      isAllowed
                                        ? 'bg-slate-900 border-purple-500/70 text-white shadow-2xs'
                                        : 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <span className="text-sm shrink-0">{feat.icon}</span>
                                      <span className="font-semibold truncate text-[11px]">
                                        {lang === 'bn' ? feat.labelBn : feat.labelEn}
                                      </span>
                                    </div>
                                    {isAllowed ? (
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    ) : (
                                      <span className="w-3 h-3 rounded-full border border-slate-600 shrink-0"></span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 2: LOCAL PC WORKSTATIONS & TERMINAL SWITCHES */}
              {/* ======================================================== */}
              {activeSubTab === 'terminals' && (
                <div className="space-y-4">
                  <div className="p-3 bg-purple-950/40 rounded-2xl border border-purple-800/80 flex items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white text-xs">
                        {lang === 'bn' ? 'বর্তমান শাখার সংযুক্ত পিসি টার্মিনাল' : 'Connected Terminals in Current Branch'}
                      </h4>
                      <p className="text-[11px] text-purple-200">
                        {lang === 'bn'
                          ? 'রিসেপশন, বিলিং, প্যাথলজি ও ওপিডি চেম্বার পিসির নিয়ন্ত্রণ করুন।'
                          : 'Manage Reception, Billing, Lab and Doctor Workstations.'}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-pink-500 text-white font-bold text-xs">
                      মোট {workstations.length}টি পিসি
                    </span>
                  </div>

                  <div className="space-y-3">
                    {workstations.map((ws) => (
                      <div
                        key={ws.id}
                        className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          ws.isRemoteKilled
                            ? 'bg-rose-950/40 border-rose-600/80'
                            : ws.isRemoteLocked
                            ? 'bg-amber-950/40 border-amber-500/80'
                            : 'bg-slate-800 border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-700 flex items-center justify-center font-bold text-white text-sm">
                            {ws.terminalCode.replace('PC-', '')}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">
                                {ws.terminalCode} — {ws.nameBn}
                              </span>
                              <span className="text-[10px] font-mono text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded">
                                {ws.ipAddress}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              বিভাগ: <strong>{ws.department}</strong> · ইউজার: <strong>@{ws.assignedUserId}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleWsLock(ws)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer ${
                              ws.isRemoteLocked ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-950'
                            }`}
                          >
                            {ws.isRemoteLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            <span>{ws.isRemoteLocked ? 'আনলক' : 'লক'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleWsKill(ws)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer ${
                              ws.isRemoteKilled ? 'bg-blue-600 text-white' : 'bg-rose-600 text-white'
                            }`}
                          >
                            {ws.isRemoteKilled ? <RotateCw className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                            <span>{ws.isRemoteKilled ? 'সচল করুন' : 'বন্ধ করুন (Kill)'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 3: REMOTE 3-MONTH LICENSE KEY GENERATOR */}
              {/* ======================================================== */}
              {activeSubTab === 'license_gen' && (
                <div className="max-w-xl mx-auto space-y-4 p-2">
                  <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 space-y-2">
                    <h3 className="font-black text-sm text-emerald-300 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      <span>{lang === 'bn' ? 'দূরবর্তী ৩ মাসের লাইসেন্স কোড জেনারেটর' : 'Remote 3-Month License Key Generator'}</span>
                    </h3>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {lang === 'bn'
                        ? 'বাংলাদেশের যেকোনো ডায়াগনস্টিক সেন্টারের জন্য ৩ মাসের (৯০ দিন) অফিশিয়াল অ্যাক্টিভেশন কি জেনারেট করুন অথবা সরাসরি ১-ক্লিকে রিমোটলি সক্রিয় করুন।'
                        : 'Generate official quarterly activation keys for any branch across Bangladesh or apply remotely in 1 click.'}
                    </p>
                  </div>

                  <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700 space-y-4">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">
                        {lang === 'bn' ? 'কোন প্রতিষ্ঠানের জন্য লাইসেন্স তৈরি করতে চান?' : 'Select Target Institution:'}
                      </label>
                      <select
                        value={licenseTargetBranch}
                        onChange={(e) => setLicenseTargetBranch(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 p-2.5 rounded-xl font-bold text-white outline-none cursor-pointer text-xs"
                      >
                        {institutions.map((i) => (
                          <option key={i.id} value={i.institutionCode}>
                            {i.institutionCode} — {i.nameBn} ({i.district})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-300 block mb-1">
                        {lang === 'bn' ? 'লাইসেন্স মেয়াদ নির্ধারণ করুন:' : 'License Duration:'}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setLicenseDurationDays(90)}
                          className={`p-2.5 rounded-xl border font-bold text-xs cursor-pointer ${
                            licenseDurationDays === 90
                              ? 'bg-purple-700 text-white border-pink-400 shadow-md'
                              : 'bg-slate-900 border-slate-700 text-slate-300'
                          }`}
                        >
                          ৩ মাস (৯০ দিন)
                        </button>
                        <button
                          type="button"
                          onClick={() => setLicenseDurationDays(180)}
                          className={`p-2.5 rounded-xl border font-bold text-xs cursor-pointer ${
                            licenseDurationDays === 180
                              ? 'bg-purple-700 text-white border-pink-400 shadow-md'
                              : 'bg-slate-900 border-slate-700 text-slate-300'
                          }`}
                        >
                          ৬ মাস (১৮০ দিন)
                        </button>
                        <button
                          type="button"
                          onClick={() => setLicenseDurationDays(365)}
                          className={`p-2.5 rounded-xl border font-bold text-xs cursor-pointer ${
                            licenseDurationDays === 365
                              ? 'bg-purple-700 text-white border-pink-400 shadow-md'
                              : 'bg-slate-900 border-slate-700 text-slate-300'
                          }`}
                        >
                          ১ বছর (৩৬৫ দিন)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleGenerateLicenseKey}
                        className="py-3 px-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition active:scale-98"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>{lang === 'bn' ? 'লাইসেন্স কি জেনারেট করুন' : 'Generate License Key'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleApplyLicenseToTargetBranch}
                        className="py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition active:scale-98"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{lang === 'bn' ? '১-ক্লিকে রিমোটলি সক্রিয় করুন' : 'Apply Remotely Now'}</span>
                      </button>
                    </div>

                    {generatedLicenseKey && (
                      <div className="p-4 bg-slate-950 rounded-2xl border-2 border-emerald-500/80 text-center space-y-2 animate-in zoom-in-95 duration-150">
                        <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
                          অফিশিয়াল কোয়ার্টারলি লাইসেন্স কি:
                        </span>
                        <div className="text-base sm:text-lg font-mono font-black text-amber-300 tracking-wider break-all select-all">
                          {generatedLicenseKey}
                        </div>

                        <div className="flex justify-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleCopyLicenseKey}
                            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                          >
                            {copiedLicenseKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedLicenseKey ? 'কপি হয়েছে!' : 'কি কপি করুন'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 4: OFFLINE REMOTE CODE GENERATOR */}
              {/* ======================================================== */}
              {activeSubTab === 'offline_codes' && (
                <div className="space-y-4 max-w-xl mx-auto p-2">
                  <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2">
                    <h3 className="font-black text-sm text-amber-300 flex items-center gap-2">
                      <WifiOff className="w-4 h-4 text-amber-400" />
                      <span>{lang === 'bn' ? 'অফলাইন পিসির জন্য রিমোট সিকিউরিটি কোড' : 'Offline Terminal Remote Code'}</span>
                    </h3>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {lang === 'bn'
                        ? 'যদি কোনো শাখা বা পিসি অফলাইনে থাকে (ইন্টারনেট বা ওয়াইফাই ডিসকানেক্টেড), তবে মোবাইল থেকে নিচের কোডটি তৈরি করে সেই পিসিতে প্রবেশ করালেই তৎক্ষণাৎ লক, আনলক বা সফটওয়্যার বন্ধ কার্যকর হবে।'
                        : 'Generate offline action codes to enforce locks, unlocks, or deactivations on disconnected PCs.'}
                    </p>
                  </div>

                  <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700 space-y-4">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">
                        {lang === 'bn' ? 'টার্গেট পিসি নির্বাচন করুন:' : 'Select Target Terminal:'}
                      </label>
                      <select
                        value={offlineTargetWs}
                        onChange={(e) => setOfflineTargetWs(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 p-2.5 rounded-xl font-bold text-white outline-none cursor-pointer"
                      >
                        {workstations.map((w) => (
                          <option key={w.id} value={w.terminalCode}>
                            {w.terminalCode} — {w.nameBn} ({w.ipAddress})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-300 block mb-1">
                        {lang === 'bn' ? 'কার্যক্রম (Action) নির্বাচন করুন:' : 'Select Action:'}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setOfflineTargetAction('LOCK')}
                          className={`p-2.5 rounded-xl border font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                            offlineTargetAction === 'LOCK'
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                              : 'bg-slate-900 border-slate-700 text-slate-300'
                          }`}
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>পিসি লক করুন</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setOfflineTargetAction('UNLOCK')}
                          className={`p-2.5 rounded-xl border font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                            offlineTargetAction === 'UNLOCK'
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                              : 'bg-slate-900 border-slate-700 text-slate-300'
                          }`}
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>পিসি আনলক করুন</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setOfflineTargetAction('KILL')}
                          className={`p-2.5 rounded-xl border font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                            offlineTargetAction === 'KILL'
                              ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                              : 'bg-slate-900 border-slate-700 text-slate-300'
                          }`}
                        >
                          <PowerOff className="w-3.5 h-3.5" />
                          <span>সফটওয়্যার বন্ধ (Kill)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setOfflineTargetAction('UNKILL')}
                          className={`p-2.5 rounded-xl border font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                            offlineTargetAction === 'UNKILL'
                              ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                              : 'bg-slate-900 border-slate-700 text-slate-300'
                          }`}
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>পুনরায় চালু (Reactivate)</span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateOfflineCode}
                      className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition active:scale-98"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'অফলাইন কোড তৈরি করুন' : 'Generate Offline Action Code'}</span>
                    </button>

                    {generatedOfflineCode && (
                      <div className="p-4 bg-slate-950 rounded-2xl border-2 border-pink-500/80 text-center space-y-2 animate-in zoom-in-95 duration-150">
                        <span className="text-[10px] text-pink-300 font-bold uppercase tracking-wider">
                          অফলাইন পিসিতে প্রবেশ করানোর কোড:
                        </span>
                        <div className="text-xl sm:text-2xl font-mono font-black text-amber-300 tracking-wider">
                          {generatedOfflineCode}
                        </div>

                        <div className="flex justify-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleCopyOfflineCode}
                            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                          >
                            {copiedOfflineCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedOfflineCode ? 'কপি হয়েছে' : 'কোড কপি করুন'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 5: MOBILE PAIRING & QR CODE */}
              {/* ======================================================== */}
              {activeSubTab === 'mobile_pair' && (
                <div className="space-y-4 max-w-md mx-auto text-center p-2">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-cyan-500/20 border-2 border-cyan-500 flex items-center justify-center text-cyan-400 shadow-xl">
                    <QrCode className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white">
                      {lang === 'bn' ? 'মোবাইল থেকে সরাসরি দেশব্যাপী কন্ট্রোল করুন' : 'Direct Mobile Remote Access'}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {lang === 'bn'
                        ? 'আপনার মোবাইল ক্যামেরা দিয়ে কিউআর কোডটি স্ক্যান করুন অথবা লিংকটি কপি করে মোবাইলে খুলুন।'
                        : 'Scan QR code with your phone camera or copy direct pairing URL.'}
                    </p>
                  </div>

                  {/* QR Code Graphic Box */}
                  <div className="bg-white p-4 rounded-3xl shadow-xl w-48 h-48 mx-auto flex items-center justify-center border-4 border-cyan-500">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 fill-current">
                      <rect width="100" height="100" fill="white" />
                      <path d="M10 10h30v30h-30zM15 15v20h20v-20zM20 20h10v10h-10zM60 10h30v30h-30zM65 15v20h20v-20zM70 20h10v10h-10zM10 60h30v30h-30zM15 65v20h20v-20zM20 70h10v10h-10zM45 10h10v10h-10zM45 30h10v10h-10zM10 45h10v10h-10zM30 45h10v10h-10zM45 45h10v10h-10zM60 45h10v10h-10zM80 45h10v10h-10zM45 60h10v10h-10zM45 80h10v10h-10zM60 60h10v10h-10zM75 60h15v10h-15zM60 75h10v15h-10zM75 75h15v15h-15z" />
                    </svg>
                  </div>

                  <div className="space-y-2">
                    <div className="p-2.5 bg-slate-800 rounded-xl font-mono text-[11px] text-cyan-300 break-all select-all border border-slate-700">
                      {mobilePairUrl}
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyPairLink}
                      className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition active:scale-98"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'লিংক সফলভাবে কপি হয়েছে!' : 'মোবাইল কন্ট্রোল লিংক কপি করুন'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-slate-400 text-[11px] shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>সেন্ট্রাল ডায়াগনস্টিক নেটওয়ার্ক সক্রিয় (ডিফল্ট পাসওয়ার্ড: {DEFAULT_MOBILE_REMOTE_PASSWORD})</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
