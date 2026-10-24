import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Doctor, LabTest, UserAccount, AppModuleId } from '../../types';
import {
  Settings,
  UserPlus,
  Plus,
  Trash2,
  Building,
  HardDrive,
  RefreshCw,
  Download,
  Upload,
  RotateCcw,
  Save,
  CheckCircle,
  Laptop,
  Smartphone,
  ExternalLink,
  MonitorCheck,
  Globe,
  Users,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Edit3,
  LogIn,
  CheckSquare,
  Square,
  FlaskConical,
  Film,
  Waves,
  Receipt,
  Stethoscope,
  BarChart3,
  Lock,
  Crown,
  Check,
  AlertCircle,
  AlertTriangle,
  X,
  Sparkles,
  Network,
  Search,
  Filter,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from '../PWA/PWAInstallModal';
import { LanNetworkModule } from '../LAN/LanNetworkModule';
import { LicenseSettingsTab } from './LicenseSettingsTab';
import { AutomatedBackupTab } from './AutomatedBackupTab';
import { RestoreModule } from './RestoreModule';

interface ModuleOption {
  id: AppModuleId;
  nameBn: string;
  nameEn: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
}

const AVAILABLE_MODULES: ModuleOption[] = [
  {
    id: 'pathology',
    nameBn: 'ল্যাব ও প্যাথলজি ইনভেস্টিগেশন',
    nameEn: 'Lab & Pathology Investigation',
    icon: FlaskConical,
    color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
    description: 'রক্ত, প্রস্রাব ও বায়োকেমিস্ট্রি টেস্ট রিপোর্ট এন্ট্রি ও প্রিন্ট',
  },
  {
    id: 'xray',
    nameBn: 'ডিজিটাল এক্স-রে (X-Ray)',
    nameEn: 'Digital X-Ray Reporting',
    icon: Film,
    color: 'text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700',
    description: 'চেস্ট, বোন ও জয়েন্ট ডিজিটাল এক্স-রে রিপোর্ট তৈরি ও প্রিন্ট',
  },
  {
    id: 'ultrasound',
    nameBn: 'আল্ট্রাসনোগ্রাফি (USG)',
    nameEn: 'Ultrasound / Sonography',
    icon: Waves,
    color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800',
    description: 'হোল অ্যাবডোমেন, পেলভিস ও প্রেগন্যান্সি আল্ট্রাসাউন্ড রিপোর্ট',
  },
  {
    id: 'ecg',
    nameBn: 'ইসিজি (ECG) রিপোর্ট',
    nameEn: 'ECG Clinical Reporting',
    icon: RefreshCw,
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
    description: 'হার্ট রেট, রিদম ও ১২-লিড ইসিজি পর্যবেক্ষণ রিপোর্ট',
  },
  {
    id: 'billing',
    nameBn: 'ক্যাশ মেমো ও বিলিং রশিদ',
    nameEn: 'Billing & Cash Memo',
    icon: Receipt,
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    description: 'রোগীর টেস্ট বিলিং, ডিসকাউন্ট ও ক্যাশ কাউন্টার রিসিট',
  },
  {
    id: 'doctorVisit',
    nameBn: 'ডাক্তার ভিজিট ও সিরিয়াল (OPD)',
    nameEn: 'Doctor Visit & OPD Queue',
    icon: UserPlus,
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    description: 'চেম্বার অ্যাপয়েন্টমেন্ট ও রোগী সিরিয়াল ম্যানেজমেন্ট',
  },
  {
    id: 'doctorPortal',
    nameBn: 'ডক্টরস প্রেসক্রিপশন পোর্টাল (Rx)',
    nameEn: 'Doctor Rx Portal',
    icon: Stethoscope,
    color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800',
    description: 'রোগীর লক্ষণ, ডায়াগনোসিস ও ডিজিটাল প্রেসক্রিপশন তৈরি',
  },
  {
    id: 'analytics',
    nameBn: 'অ্যানালিটিক্স ও আয়-ব্যয় হিসাব',
    nameEn: 'Analytics & Revenue',
    icon: BarChart3,
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    description: 'দৈনিক আয়, মোট টেস্ট সংখ্যা ও আর্থিক গ্রাফ চার্ট',
  },
  {
    id: 'chat',
    nameBn: 'অভ্যন্তরীণ টিম চ্যাট',
    nameEn: 'Encrypted Staff Chat',
    icon: Lock,
    color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800',
    description: 'হাসপাতালের ডাক্তার, ল্যাব ও রিসেপশনের অভ্যন্তরীণ যোগাযোগ',
  },
  {
    id: 'lanNetwork',
    nameBn: 'লোকাল নেটওয়ার্ক (LAN) ও ওয়ার্কস্টেশন',
    nameEn: 'Hospital LAN & Workstations Hub',
    icon: Network,
    color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800',
    description: '১০টি পিসির ক্যাট-৬ সংযোগ, স্ট্যাটিক আইপি ও লাইভ অডিট ট্র্যাকিং',
  },
  {
    id: 'settings',
    nameBn: 'সিস্টেম সেটিংস ও কন্ট্রোল প্যানেল',
    nameEn: 'System Settings & Control',
    icon: Settings,
    color: 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-950/40 border-fuchsia-200 dark:border-fuchsia-800',
    description: 'ইউজার পারমিশন, ডাক্তার ও টেস্ট কাস্টমাইজেশন (শুধু অ্যাডমিন)',
  },
];

export const SettingsModule: React.FC = () => {
  const {
    doctors,
    addDoctor,
    deleteDoctor,
    labTests,
    addLabTest,
    updateLabTest,
    deleteLabTest,
    resetLabTestsToDefault,
    clinicConfig,
    updateClinicConfig,
    patients,
    invoices,
    triggerManualSync,
    cloudSyncStatus,
    lastSyncTime,
    resetToSampleData,
    users,
    addUser,
    updateUser,
    deleteUser,
    currentUser,
    setCurrentUser,
    setActiveTab,
    lang,
    t,
    licenseInfo,
    exportDatabaseJson,
    exportDatabaseSqlDump,
    restoreDatabaseFromJson,
    autoDailyBackupEnabled,
    setAutoDailyBackupEnabled,
    lastAutoBackupDate,
    backupHistory,
    daysSinceLastBackup,
    isBackupOverdue,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'lan_network' | 'clinic' | 'doctors' | 'tests' | 'backup' | 'restore' | 'pwa' | 'license'>('backup');
  const [showPwaModal, setShowPwaModal] = useState(false);
  const { isInstallable, isInstalled, install, isOnline } = usePWAInstall();

  useEffect(() => {
    const handleOpenBackup = () => setActiveSubTab('backup');
    window.addEventListener('open-smart-backup-panel', handleOpenBackup);
    return () => window.removeEventListener('open-smart-backup-panel', handleOpenBackup);
  }, []);

  // User Management Form state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('+880 17');
  const [newRole, setNewRole] = useState<'Admin' | 'Lab' | 'Xray' | 'Ultrasound' | 'Doctor' | 'Billing' | 'Staff'>('Lab');
  const [newAllowedModules, setNewAllowedModules] = useState<AppModuleId[]>(['pathology']);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Edit User Modal state
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<'Admin' | 'Lab' | 'Xray' | 'Ultrasound' | 'Doctor' | 'Billing' | 'Staff'>('Lab');
  const [editAllowedModules, setEditAllowedModules] = useState<AppModuleId[]>([]);
  const [editIsActive, setEditIsActive] = useState(true);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Password Reveal toggles for table
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Doctor Form
  const [docCode, setDocCode] = useState(`DR0${doctors.length + 1}`);
  const [docName, setDocName] = useState('');
  const [docDegree, setDocDegree] = useState('MBBS, FCPS');
  const [docSpecialty, setDocSpecialty] = useState('Specialist Physician');
  const [docPhone, setDocPhone] = useState('+880 17');
  const [docRoom, setDocRoom] = useState('105');
  const [docFee, setDocFee] = useState(800);

  // Test Form & Dynamic Management State
  const [testCode, setTestCode] = useState('');
  const [testName, setTestName] = useState('');
  const [testCategory, setTestCategory] = useState('Hematology');
  const [testUnit, setTestUnit] = useState('mg/dL');
  const [testNormal, setTestNormal] = useState('0.0 - 0.0');
  const [testPrice, setTestPrice] = useState(300);
  const [testSampleType, setTestSampleType] = useState('Clotted Blood / Serum');

  // Test Filter & Edit Modal State
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [testCategoryFilter, setTestCategoryFilter] = useState('All');
  const [editingTest, setEditingTest] = useState<LabTest | null>(null);
  const [editTestCode, setEditTestCode] = useState('');
  const [editTestName, setEditTestName] = useState('');
  const [editTestCategory, setEditTestCategory] = useState('Hematology');
  const [editTestUnit, setEditTestUnit] = useState('');
  const [editTestNormal, setEditTestNormal] = useState('');
  const [editTestPrice, setEditTestPrice] = useState<number>(300);
  const [editTestSampleType, setEditTestSampleType] = useState('');

  // Clinic Config Form
  const [clinicName, setClinicName] = useState(clinicConfig.clinicName);
  const [clinicNameBn, setClinicNameBn] = useState(clinicConfig.clinicNameBn);
  const [tagline, setTagline] = useState(clinicConfig.tagline);
  const [taglineBn, setTaglineBn] = useState(clinicConfig.taglineBn);
  const [address, setAddress] = useState(clinicConfig.address);
  const [phone, setPhone] = useState(clinicConfig.phone);
  const [email, setEmail] = useState(clinicConfig.email);
  const [regNo, setRegNo] = useState(clinicConfig.regNo);
  const [pathologistName, setPathologistName] = useState(clinicConfig.pathologistName);
  const [pathologistDegree, setPathologistDegree] = useState(clinicConfig.pathologistDegree || 'Senior Consultant & Lab Director');
  const [labInCharge, setLabInCharge] = useState(clinicConfig.labInCharge);
  const [labInChargeDesignation, setLabInChargeDesignation] = useState(
    clinicConfig.labInChargeDesignation || 'Medical Technologist (Lab In-Charge)'
  );

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Toggle module selection for new user
  const toggleNewModule = (modId: AppModuleId) => {
    setNewAllowedModules((prev) =>
      prev.includes(modId) ? prev.filter((m) => m !== modId) : [...prev, modId]
    );
  };

  // Apply Presets to New User
  const applyPreset = (preset: 'lab' | 'xray' | 'usg' | 'doctor' | 'billing' | 'admin') => {
    switch (preset) {
      case 'lab':
        setNewRole('Lab');
        setNewAllowedModules(['pathology']);
        break;
      case 'xray':
        setNewRole('Xray');
        setNewAllowedModules(['xray']);
        break;
      case 'usg':
        setNewRole('Ultrasound');
        setNewAllowedModules(['ultrasound']);
        break;
      case 'doctor':
        setNewRole('Doctor');
        setNewAllowedModules(['doctorVisit', 'doctorPortal']);
        break;
      case 'billing':
        setNewRole('Billing');
        setNewAllowedModules(['billing', 'doctorVisit']);
        break;
      case 'admin':
        setNewRole('Admin');
        setNewAllowedModules(AVAILABLE_MODULES.map((m) => m.id));
        break;
    }
  };

  // Handle Add New User
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      showToast(lang === 'bn' ? 'দয়া করে ইউজার আইডি / ইউজারনেম দিন!' : 'Please enter User ID / Username!');
      return;
    }
    if (!newPassword.trim()) {
      showToast(lang === 'bn' ? 'দয়া করে পাসওয়ার্ড দিন!' : 'Please enter Password!');
      return;
    }

    const cleanUsername = newUsername.trim();
    if (users.some((u) => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
      showToast(
        lang === 'bn'
          ? `ইউজার আইডি "${cleanUsername}" ইতিমধ্যে বিদ্যমান! ভিন্ন একটি আইডি নির্বাচন করুন।`
          : `Username "${cleanUsername}" is already taken! Choose another.`
      );
      return;
    }

    if (newAllowedModules.length === 0 && newRole !== 'Admin') {
      showToast(
        lang === 'bn'
          ? 'অন্তত একটি মডিউলের পারমিশন নির্বাচন করুন (যেমন শুধু ল্যাব বা শুধু এক্স-রে)!'
          : 'Please select at least one module permission!'
      );
      return;
    }

    addUser({
      username: cleanUsername,
      password: newPassword,
      fullName: newFullName.trim() || cleanUsername,
      role: newRole,
      allowedModules: newRole === 'Admin' ? AVAILABLE_MODULES.map((m) => m.id) : newAllowedModules,
      isActive: true,
      phone: newPhone,
    });

    showToast(
      lang === 'bn'
        ? `নতুন ইউজার "${cleanUsername}" সফলভাবে তৈরি হয়েছে!`
        : `User "${cleanUsername}" created successfully!`
    );

    setNewUsername('');
    setNewPassword('');
    setNewFullName('');
    setNewPhone('+880 17');
    setNewAllowedModules(['pathology']);
    setNewRole('Lab');
  };

  // Open Edit User Modal
  const openEditModal = (u: UserAccount) => {
    setEditingUser(u);
    setEditFullName(u.fullName);
    setEditPassword(u.password);
    setEditRole(u.role);
    setEditAllowedModules(u.allowedModules);
    setEditIsActive(u.isActive);
    setShowEditPassword(false);
  };

  // Save Edited User
  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editPassword.trim()) {
      showToast(lang === 'bn' ? 'পাসওয়ার্ড খালি রাখা যাবে না!' : 'Password cannot be empty!');
      return;
    }

    updateUser(editingUser.id, {
      fullName: editFullName.trim() || editingUser.username,
      password: editPassword,
      role: editRole,
      allowedModules: editRole === 'Admin' ? AVAILABLE_MODULES.map((m) => m.id) : editAllowedModules,
      isActive: editIsActive,
    });

    showToast(
      lang === 'bn'
        ? `ইউজার "${editingUser.username}" এর পারমিশন সফলভাবে আপডেট করা হয়েছে!`
        : `Permissions for "${editingUser.username}" updated!`
    );
    setEditingUser(null);
  };

  // Test Login as This User
  const handleTestLoginAsUser = (targetUser: UserAccount) => {
    setCurrentUser(targetUser);
    const firstTab = targetUser.role === 'Admin' ? 'pathology' : targetUser.allowedModules[0] || 'pathology';
    setActiveTab(firstTab);
    showToast(
      lang === 'bn'
        ? `সুইচ করা হয়েছে: ${targetUser.fullName} (@${targetUser.username}) হিসেবে প্রবেশ করেছেন!`
        : `Switched view to @${targetUser.username} (${targetUser.role})!`
    );
  };

  // Doctor Handlers
  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;
    addDoctor({
      code: docCode.trim().toUpperCase(),
      name: docName.trim(),
      degree: docDegree,
      specialty: docSpecialty,
      phone: docPhone,
      roomNo: docRoom,
      fee: docFee,
    });
    showToast(`Doctor ${docName} registered successfully!`);
    setDocName('');
    setDocCode(`DR0${doctors.length + 2}`);
  };

  // Lab Test Handlers
  const handleAddTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) return;
    addLabTest({
      code: testCode.trim().toUpperCase() || 'TEST',
      name: testName.trim(),
      category: testCategory,
      unit: testUnit,
      normalRange: testNormal,
      price: Number(testPrice) || 0,
      sampleType: testSampleType,
    });
    showToast(`Test "${testName}" added successfully!`);
    setTestName('');
    setTestCode('');
    setTestNormal('0.0 - 0.0');
  };

  const openEditTestModal = (test: LabTest) => {
    setEditingTest(test);
    setEditTestCode(test.code || '');
    setEditTestName(test.name);
    setEditTestCategory(test.category || 'Hematology');
    setEditTestUnit(test.unit || '');
    setEditTestNormal(test.normalRange || '');
    setEditTestPrice(test.price || 0);
    setEditTestSampleType(test.sampleType || '');
  };

  const handleSaveEditTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTest || !editTestName.trim()) return;
    updateLabTest(editingTest.id, {
      code: editTestCode.trim().toUpperCase() || editingTest.code,
      name: editTestName.trim(),
      category: editTestCategory,
      unit: editTestUnit.trim(),
      normalRange: editTestNormal.trim(),
      price: Number(editTestPrice) || 0,
      sampleType: editTestSampleType.trim(),
    });
    showToast(`Test "${editTestName}" updated successfully!`);
    setEditingTest(null);
  };

  // Clinic Profile Handler
  const handleSaveClinicProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateClinicConfig({
      clinicName,
      clinicNameBn,
      tagline,
      taglineBn,
      address,
      phone,
      email,
      regNo,
      pathologistName,
      pathologistDegree,
      labInCharge,
      labInChargeDesignation,
    });
    showToast(lang === 'bn' ? 'ক্লিনিকের তথ্য ও প্যাড সফলভাবে আপডেট হয়েছে!' : 'Clinic profile and letterhead updated successfully!');
  };

  // Export JSON Backup
  const exportBackupJson = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      version: '2.6',
      clinicConfig,
      doctors,
      labTests,
      patients,
      invoices,
      users,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adiba_hospital_backup_${Date.now()}.json`;
    a.click();
    showToast(lang === 'bn' ? 'সম্পূর্ণ ডাটাবেস ব্যাকআপ ডাউনলোড হয়েছে!' : 'Database backup exported to JSON!');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="bg-purple-900 text-white px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold flex justify-between items-center shadow-lg border border-purple-700 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-white/80 hover:text-white text-base ml-2 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Main Settings Header */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-xs border border-purple-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 to-pink-600 flex items-center justify-center text-white shadow-md">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-purple-950 dark:text-purple-200">
                {lang === 'bn' ? 'সিস্টেম সেটিংস ও কাস্টমাইজেশন ড্যাশবোর্ড' : 'System Settings & Customization Dashboard'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {lang === 'bn'
                  ? 'ইউজার আইডি ও পারমিশন কন্ট্রোল, ক্লিনিক প্যাড, ডাক্তার তালিকা ও টেস্ট রেট কাস্টমাইজেশন'
                  : 'Manage User Accounts, Module Access Permissions, Letterhead, Doctors, and Diagnostic Rates'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={triggerManualSync}
            className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-purple-100 cursor-pointer transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${cloudSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span>{lang === 'bn' ? 'ক্লাউড সিঙ্ক' : 'Cloud Sync'}</span>
          </button>
          <button
            onClick={() => setActiveSubTab('backup')}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-900 hover:to-indigo-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
          >
            <HardDrive className="w-3.5 h-3.5 text-pink-300" />
            <span>{lang === 'bn' ? 'স্মার্ট ব্যাকআপ ও রিস্টোর প্যানেল' : 'Smart Backup & Restore Panel'}</span>
          </button>
        </div>
      </div>

      {/* 7-Day Overdue Backup Global Alert in Settings */}
      {isBackupOverdue && (
        <div className="bg-gradient-to-r from-rose-500/15 via-red-500/10 to-amber-500/10 border-2 border-rose-500/50 dark:border-rose-700/70 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-pulse-subtle">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-600 text-white rounded-xl shrink-0">
              <AlertTriangle className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <span className="font-black text-rose-700 dark:text-rose-400 uppercase tracking-wide">
                {lang === 'bn' ? 'সতর্কতা: ৭+ দিন ব্যাকআপ ওভারডিউ!' : 'Warning: 7+ Days Backup Overdue!'}
              </span>
              <p className="text-gray-600 dark:text-gray-300 mt-0.5">
                {lang === 'bn'
                  ? `গত ${daysSinceLastBackup} দিনে কোনো স্বয়ংক্রিয় বা এনক্রিপ্টেড ব্যাকআপ সম্পন্ন হয়নি। ক্লিনিক ডাটাবেজ সুরক্ষায় অবিলম্বে ব্যাকআপ নিন।`
                  : `No automated backup has been performed in the last ${daysSinceLastBackup} days. Please export clinical records to encrypted storage.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveSubTab('backup')}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer text-xs shrink-0 transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'ব্যাকআপ মডিউলে যান' : 'Open Backup Tab'}</span>
          </button>
        </div>
      )}

      {/* Sub Tabs Navigation */}
      <div className="flex gap-1.5 sm:gap-2 border-b border-gray-200 dark:border-gray-700 pb-2 text-xs font-bold overflow-x-auto scrollbar-none">
        {[
          {
            id: 'backup',
            label: lang === 'bn' ? 'স্মার্ট ব্যাকআপ প্যানেল' : 'Smart Backup Panel',
            icon: HardDrive,
            badge: isBackupOverdue
              ? lang === 'bn' ? `${daysSinceLastBackup} দিন ওভারডিউ!` : `${daysSinceLastBackup}d Overdue!`
              : 'ZIP + Cloud + Local',
            badgeColor: isBackupOverdue ? 'bg-rose-600 text-white animate-pulse' : 'bg-emerald-600 text-white',
          },
          {
            id: 'restore',
            label: lang === 'bn' ? 'ডাটাবেস রিস্টোর (RestoreModule)' : 'Restore Database (RestoreModule)',
            icon: RotateCcw,
            badge: 'SHA-256 Verified',
            badgeColor: 'bg-indigo-600 text-white',
          },
          { id: 'users', label: lang === 'bn' ? 'ইউজার ও পারমিশন কন্ট্রোল' : 'User IDs & Role Permissions', icon: Users, badge: `${users.length} Users` },
          { id: 'lan_network', label: lang === 'bn' ? 'LAN নেটওয়ার্ক ও ১০টি পিসি' : 'LAN Network & 10 PCs', icon: Network, badge: 'Cat-6 1Gbps' },
          { id: 'clinic', label: lang === 'bn' ? 'ক্লিনিক ও প্যাড কাস্টমাইজেশন' : 'Clinic & Letterhead Profile', icon: Building },
          { id: 'doctors', label: lang === 'bn' ? 'ডাক্তার তালিকা ও চেম্বার' : 'Doctors Directory', icon: UserPlus },
          { id: 'tests', label: lang === 'bn' ? 'ল্যাব টেস্ট ও রেট চার্ট' : 'Lab Tests & Rates', icon: Plus },
          { id: 'pwa', label: lang === 'bn' ? 'পিসি ও মোবাইল অ্যাপ' : 'PC & Mobile App', icon: Laptop },
          {
            id: 'license',
            label: lang === 'bn' ? 'লাইসেন্স ও রিনিউয়াল' : 'License & Subscription',
            icon: KeyRound,
            badge: `${licenseInfo.daysRemaining} দিন`,
          },
        ].map((tab: any) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-purple-900 text-white shadow-md font-black'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-pink-400' : 'text-purple-600 dark:text-purple-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    tab.badgeColor
                      ? tab.badgeColor
                      : isActive
                      ? 'bg-pink-500 text-white'
                      : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* SUBTAB 1: USER ID & ROLE PERMISSIONS DASHBOARD */}
      {/* ======================================================== */}
      {activeSubTab === 'users' && (
        <div className="space-y-6">
          {/* Quick Notice Banner */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-4 rounded-2xl shadow-sm border border-purple-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-pink-500/20 rounded-xl text-pink-400 shrink-0 border border-pink-400/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-sm text-white">
                  {lang === 'bn' ? 'ইউজার-ভিত্তিক নির্দিষ্ট ইন্টারফেস ও নিরাপত্তা নীতি' : 'User-Level Interface Permissions'}
                </h4>
                <p className="text-purple-200 mt-0.5 max-w-2xl leading-relaxed">
                  {lang === 'bn'
                    ? 'এখানে যেকোনো ইউজার আইডি তৈরি করতে পারবেন এবং নির্ধারণ করতে পারবেন সে ঠিক কোন কোন মডিউল দেখতে পাবে। যেমন: কোনো ইউজার শুধু ল্যাব/প্যাথলজি ইন্টারফেস দেখতে পাবে, আবার কোনো ইউজার শুধু এক্স-রে বা শুধু বিলিং কাউন্টার দেখতে পাবে।'
                    : 'Create user IDs and set specific module access. For example, assign Lab-only access to technologists, X-Ray-only to radiology technicians, or give full Super Admin access.'}
                </p>
              </div>
            </div>

            {/* Quick switcher to active user */}
            <div className="shrink-0 bg-purple-950/80 p-2.5 rounded-xl border border-purple-700/60 flex items-center gap-2">
              <div className="text-[11px]">
                <div className="text-purple-300">{lang === 'bn' ? 'বর্তমান লগইনকৃত ইউজার:' : 'Currently Logged in:'}</div>
                <div className="font-bold font-mono text-pink-300">
                  @{currentUser?.username} ({currentUser?.role})
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Add New User Form */}
            <div className="lg:col-span-5 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-xs border border-purple-100 dark:border-gray-700 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-purple-700" />
                  <h3 className="font-black text-sm text-purple-950 dark:text-purple-200">
                    {lang === 'bn' ? 'নতুন ইউজার আইডি তৈরি করুন' : 'Create New User ID'}
                  </h3>
                </div>
                <span className="text-[10px] text-pink-600 bg-pink-50 dark:bg-pink-950/40 px-2 py-0.5 rounded-full font-bold">
                  {lang === 'bn' ? 'রোল নির্ধারণ' : 'Role Assignment'}
                </span>
              </div>

              <form onSubmit={handleAddUser} className="space-y-3.5">
                {/* Username */}
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                    <span>{lang === 'bn' ? 'ইউজার আইডি / ইউজারনেম (Login ID):' : 'User ID / Username:'} *</span>
                    <span className="text-[10px] text-gray-400">e.g. xray2, lab_tech</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. lab_technician, xray_staff"
                    className="w-full bg-purple-50/50 dark:bg-gray-900 border border-purple-300 dark:border-purple-700 p-2.5 rounded-xl font-bold font-mono text-purple-950 dark:text-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    {lang === 'bn' ? 'লগইন পাসওয়ার্ড (Password):' : 'Password:'} *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="e.g. Pass@123"
                      className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 pr-10 rounded-xl font-bold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-purple-700 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Full Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {lang === 'bn' ? 'ব্যবহারকারীর পূর্ণ নাম:' : 'Full Name:'}
                    </label>
                    <input
                      type="text"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="e.g. Md. Rafiqul Islam"
                      className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {lang === 'bn' ? 'মোবাইল নম্বর:' : 'Phone No:'}
                    </label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl font-medium"
                    />
                  </div>
                </div>

                {/* Role Designation */}
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    {lang === 'bn' ? 'পদবি / রোল (Role Type):' : 'Role Type:'}
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => {
                      const r = e.target.value as any;
                      setNewRole(r);
                      if (r === 'Admin') applyPreset('admin');
                      else if (r === 'Lab') applyPreset('lab');
                      else if (r === 'Xray') applyPreset('xray');
                      else if (r === 'Ultrasound') applyPreset('usg');
                      else if (r === 'Doctor') applyPreset('doctor');
                      else if (r === 'Billing') applyPreset('billing');
                    }}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl font-bold cursor-pointer"
                  >
                    <option value="Lab">🔬 Lab Technologist (ল্যাব অপারেটর)</option>
                    <option value="Xray">🩻 X-Ray Technician (এক্স-রে টেকনিশিয়ান)</option>
                    <option value="Ultrasound">🌊 Sonologist (আল্ট্রাসাউন্ড)</option>
                    <option value="Doctor">🩺 Doctor / Consultant (ডাক্তার)</option>
                    <option value="Billing">💵 Billing & Cash Counter (ক্যাশ কাউন্টার)</option>
                    <option value="Staff">👤 General Staff (সাধারণ কর্মী)</option>
                    <option value="Admin">👑 Super Admin (সম্পূর্ণ অ্যাক্সেস)</option>
                  </select>
                </div>

                {/* Quick Presets */}
                <div className="pt-1">
                  <label className="block font-bold text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                    <span>{lang === 'bn' ? 'কুইক প্রিসেট (১-ক্লিকে মডিউল নির্বাচন):' : 'Quick Presets:'}</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyPreset('lab')}
                      className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 dark:bg-purple-950 dark:text-purple-200 rounded-lg text-[11px] font-bold cursor-pointer transition"
                    >
                      🔬 {lang === 'bn' ? 'শুধুমাত্র ল্যাব' : 'Lab Only'}
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('xray')}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:text-slate-200 rounded-lg text-[11px] font-bold cursor-pointer transition"
                    >
                      🩻 {lang === 'bn' ? 'শুধুমাত্র এক্স-রে' : 'X-Ray Only'}
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('usg')}
                      className="px-2.5 py-1 bg-cyan-100 hover:bg-cyan-200 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-200 rounded-lg text-[11px] font-bold cursor-pointer transition"
                    >
                      🌊 {lang === 'bn' ? 'শুধুমাত্র ইউএসজি' : 'USG Only'}
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('billing')}
                      className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 rounded-lg text-[11px] font-bold cursor-pointer transition"
                    >
                      💵 {lang === 'bn' ? 'বিলিং কাউন্টার' : 'Billing Only'}
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('admin')}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950 dark:text-amber-200 rounded-lg text-[11px] font-bold cursor-pointer transition"
                    >
                      👑 {lang === 'bn' ? 'সব মডিউল' : 'All Modules'}
                    </button>
                  </div>
                </div>

                {/* Module Permissions Checkboxes */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <label className="block font-black text-gray-800 dark:text-gray-200 mb-2 flex items-center justify-between">
                    <span>{lang === 'bn' ? 'এই ইউজার কোন কোন মডিউল দেখতে পারবে?' : 'Allowed Modules for this User:'}</span>
                    <span className="text-[10px] text-purple-600 font-bold">
                      {newAllowedModules.length} {lang === 'bn' ? 'টি নির্বাচিত' : 'Selected'}
                    </span>
                  </label>

                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {AVAILABLE_MODULES.map((m) => {
                      const Icon = m.icon;
                      const isChecked = newAllowedModules.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => toggleNewModule(m.id)}
                          className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                            isChecked
                              ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-400 dark:border-purple-600 text-purple-950 dark:text-purple-100'
                              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <div>
                              <div className="font-bold text-xs">{lang === 'bn' ? m.nameBn : m.nameEn}</div>
                              <div className="text-[10px] text-gray-400 truncate max-w-[220px]">{m.description}</div>
                            </div>
                          </div>
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-pink-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-900 hover:to-indigo-900 text-white font-black rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'ইউজার অ্যাকাউন্ট তৈরি ও পারমিশন সংরক্ষণ' : 'Save User & Permissions'}</span>
                </button>
              </form>
            </div>

            {/* Right: Existing Users List & Management */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-xs border border-purple-100 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-gray-100 dark:border-gray-700 mb-4">
                  <div>
                    <h3 className="font-black text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-700" />
                      <span>{lang === 'bn' ? 'সকল ইউজার আইডি ও পারমিশন তালিকা' : 'Active User Accounts & Permissions'}</span>
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {lang === 'bn'
                        ? 'প্রতিটি ইউজারের অনুমোদিত মডিউল দেখুন, পারমিশন পরিবর্তন করুন অথবা সরাসরি টেস্ট লগইন করুন।'
                        : 'Manage access levels, edit modules, view passwords or test login view.'}
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-bold rounded-lg self-start sm:self-auto">
                    {users.length} {lang === 'bn' ? 'জন নিবন্ধিত ইউজার' : 'Registered Users'}
                  </span>
                </div>

                <div className="space-y-3">
                  {users.map((u) => {
                    const isAdibaAdmin = u.username.toLowerCase() === 'adiba';
                    const isCurrent = currentUser?.id === u.id;
                    const isPassRevealed = !!revealedPasswords[u.id];

                    return (
                      <div
                        key={u.id}
                        className={`p-4 rounded-xl border transition ${
                          isCurrent
                            ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600 shadow-xs'
                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          {/* User Info */}
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 to-pink-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                              {u.fullName ? u.fullName.charAt(0) : 'U'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-sm text-gray-900 dark:text-gray-100">{u.fullName}</span>
                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-bold">
                                  @{u.username}
                                </span>
                                {isCurrent && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500 text-white font-bold">
                                    {lang === 'bn' ? 'বর্তমান সক্রিয়' : 'Logged In'}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                                <span className="font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-1">
                                  {u.role === 'Admin' ? <Crown className="w-3.5 h-3.5 text-amber-500" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                  <span>{u.role}</span>
                                </span>
                                {u.phone && <span>📞 {u.phone}</span>}
                                {/* Password reveal */}
                                <div className="flex items-center gap-1 font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                  <KeyRound className="w-3 h-3 text-purple-600" />
                                  <span>{isPassRevealed ? u.password : '••••••••'}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setRevealedPasswords((prev) => ({
                                        ...prev,
                                        [u.id]: !prev[u.id],
                                      }))
                                    }
                                    className="ml-1 text-gray-500 hover:text-purple-700 cursor-pointer"
                                    title="Show/Hide Password"
                                  >
                                    {isPassRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                            {/* Test Login Switcher */}
                            <button
                              type="button"
                              onClick={() => handleTestLoginAsUser(u)}
                              disabled={isCurrent}
                              className="px-2.5 py-1.5 bg-purple-100 dark:bg-purple-950 hover:bg-purple-200 text-purple-900 dark:text-purple-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition disabled:opacity-40"
                              title={lang === 'bn' ? 'এই ইউজারের ইন্টারফেস কেমন তা দেখুন' : 'Switch view to this user'}
                            >
                              <LogIn className="w-3.5 h-3.5 text-purple-600" />
                              <span>{lang === 'bn' ? 'ভিউ টেস্ট' : 'Test View'}</span>
                            </button>

                            {/* Edit Permissions */}
                            <button
                              type="button"
                              onClick={() => openEditModal(u)}
                              className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-purple-50 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition border border-gray-200 dark:border-gray-700"
                              title="Edit user permissions"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-pink-600" />
                              <span>{lang === 'bn' ? 'এডিট' : 'Edit'}</span>
                            </button>

                            {/* Delete Button (Admin RBAC Modal) */}
                            {!isAdibaAdmin && (
                              <button
                                type="button"
                                onClick={() => deleteUser(u.id)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition cursor-pointer"
                                title="Delete User (Admin Only)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Allowed Modules Badges */}
                        <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mr-1">
                            {lang === 'bn' ? 'অনুমোদিত ড্যাশবোর্ড:' : 'Allowed Modules:'}
                          </span>
                          {u.role === 'Admin' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-pink-500 text-white font-bold flex items-center gap-1 shadow-2xs">
                              <Crown className="w-3 h-3" />
                              <span>{lang === 'bn' ? 'সকল মডিউল ও সেটিংস অ্যাক্সেস' : 'Full Access (All Modules)'}</span>
                            </span>
                          ) : u.allowedModules.length === 0 ? (
                            <span className="text-[10px] text-red-500 font-semibold italic">
                              {lang === 'bn' ? 'কোনো মডিউল দেওয়া হয়নি' : 'No modules assigned'}
                            </span>
                          ) : (
                            u.allowedModules.map((modId) => {
                              const modInfo = AVAILABLE_MODULES.find((m) => m.id === modId);
                              if (!modInfo) return null;
                              const Icon = modInfo.icon;
                              return (
                                <span
                                  key={modId}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-semibold flex items-center gap-1"
                                >
                                  <Icon className="w-3 h-3 text-pink-500" />
                                  <span>{lang === 'bn' ? modInfo.nameBn : modInfo.nameEn}</span>
                                </span>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* EDIT USER MODAL */}
          {editingUser && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-purple-200 dark:border-gray-700 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-purple-700" />
                    <div>
                      <h3 className="font-black text-base text-gray-900 dark:text-gray-100">
                        {lang === 'bn' ? 'ইউজার পারমিশন পরিবর্তন করুন' : 'Edit User & Permissions'}
                      </h3>
                      <div className="text-xs text-purple-600 font-mono font-bold">
                        @{editingUser.username}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {lang === 'bn' ? 'ব্যবহারকারীর নাম:' : 'Full Name:'}
                    </label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {lang === 'bn' ? 'লগইন পাসওয়ার্ড:' : 'Password:'}
                    </label>
                    <div className="relative">
                      <input
                        type={showEditPassword ? 'text' : 'password'}
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 pr-10 rounded-xl font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-purple-700 cursor-pointer"
                      >
                        {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {lang === 'bn' ? 'পদবি / রোল:' : 'Role Designation:'}
                    </label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as any)}
                      className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl font-bold cursor-pointer"
                    >
                      <option value="Lab">🔬 Lab Technologist (ল্যাব অপারেটর)</option>
                      <option value="Xray">🩻 X-Ray Technician (এক্স-রে টেকনিশিয়ান)</option>
                      <option value="Ultrasound">🌊 Sonologist (আল্ট্রাসাউন্ড)</option>
                      <option value="Doctor">🩺 Doctor / Consultant (ডাক্তার)</option>
                      <option value="Billing">💵 Billing Counter (ক্যাশ কাউন্টার)</option>
                      <option value="Staff">👤 General Staff (সাধারণ কর্মী)</option>
                      <option value="Admin">👑 Super Admin (সব মডিউল)</option>
                    </select>
                  </div>

                  {/* Modules Checkboxes */}
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                    <label className="block font-bold text-gray-800 dark:text-gray-200 mb-2">
                      {lang === 'bn' ? 'অনুমোদিত মডিউল নির্বাচন করুন:' : 'Check Allowed Modules:'}
                    </label>
                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                      {AVAILABLE_MODULES.map((m) => {
                        const Icon = m.icon;
                        const isChecked = editAllowedModules.includes(m.id);
                        return (
                          <div
                            key={m.id}
                            onClick={() => {
                              setEditAllowedModules((prev) =>
                                prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                              );
                            }}
                            className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                              isChecked
                                ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-400 dark:border-purple-600 text-purple-950 dark:text-purple-100'
                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              <span className="font-bold">{lang === 'bn' ? m.nameBn : m.nameEn}</span>
                            </div>
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-pink-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold cursor-pointer"
                    >
                      {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-900 hover:to-indigo-900 text-white rounded-xl font-bold cursor-pointer shadow-md"
                    >
                      {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB: LAN NETWORK & 10 WORKSTATIONS                    */}
      {/* ======================================================== */}
      {activeSubTab === 'lan_network' && <LanNetworkModule />}

      {/* ======================================================== */}
      {/* SUBTAB 2: CLINIC PROFILE & LETTERHEAD CUSTOMIZATION */}
      {/* ======================================================== */}
      {activeSubTab === 'clinic' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xs border border-purple-100 dark:border-gray-700 space-y-5 text-xs">
          <div className="border-b pb-3 border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
                <Building className="w-5 h-5 text-purple-700" />
                <span>{lang === 'bn' ? 'ক্লিনিক ও হাসপাতাল প্রোফাইল এবং প্যাড কাস্টমাইজেশন' : 'Clinic Profile & Letterhead Customization'}</span>
              </h3>
              <p className="text-gray-500 mt-0.5">
                {lang === 'bn'
                  ? 'এই নাম ও তথ্য প্রতিটি প্যাথলজি, এক্স-রে, আল্ট্রাসাউন্ড রিপোর্ট ও ক্যাশ মেমোর হেডার ও প্যাডে মুদ্রিত হবে।'
                  : 'These details appear on the header, footer, and printable documents of all diagnostic reports and invoices.'}
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 rounded-lg font-bold">
              Letterhead Pro
            </span>
          </div>

          <form onSubmit={handleSaveClinicProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'bn' ? 'প্রতিষ্ঠানের নাম (ইংরেজি):' : 'Hospital Name (English):'} *
                </label>
                <input
                  type="text"
                  required
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'bn' ? 'প্রতিষ্ঠানের নাম (বাংলা):' : 'Hospital Name (Bengali):'} *
                </label>
                <input
                  type="text"
                  required
                  value={clinicNameBn}
                  onChange={(e) => setClinicNameBn(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'bn' ? 'ট্যাগলাইন / স্লোগান (ইংরেজি):' : 'Tagline (English):'}
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'bn' ? 'ট্যাগলাইন / স্লোগান (বাংলা):' : 'Tagline (Bengali):'}
                </label>
                <input
                  type="text"
                  value={taglineBn}
                  onChange={(e) => setTaglineBn(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'bn' ? 'পূর্ণাঙ্গ ঠিকানা:' : 'Full Address:'} *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'bn' ? 'হটলাইন / ফোন নম্বরসমূহ:' : 'Phone / Hotline:'} *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'bn' ? 'ইমেইল এড্রেস:' : 'Email Address:'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'bn' ? 'ডিজিএইচএস রেজিস্ট্রেশন নম্বর:' : 'DGHS Reg No:'}
                </label>
                <input
                  type="text"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'bn' ? 'সিনিয়র প্যাথলজিস্ট / কনসালট্যান্ট নাম:' : 'Pathologist / Consultant Name:'}
                </label>
                <input
                  type="text"
                  value={pathologistName}
                  onChange={(e) => setPathologistName(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'bn' ? 'প্যাথলজিস্ট ডিগ্রি ও পদবি:' : 'Pathologist Degree & Title:'}
                </label>
                <input
                  type="text"
                  value={pathologistDegree}
                  onChange={(e) => setPathologistDegree(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'bn' ? 'ল্যাব ইন-চার্জ / চিফ মেডিকেল টেকনোলজিস্ট:' : 'Lab In-Charge Name:'}
                </label>
                <input
                  type="text"
                  value={labInCharge}
                  onChange={(e) => setLabInCharge(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-900 hover:to-indigo-900 text-white font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition"
              >
                <Save className="w-4 h-4" />
                <span>{lang === 'bn' ? 'ক্লিনিক প্রোফাইল ও প্যাড সংরক্ষণ করুন' : 'Save Clinic Profile & Letterhead'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 3: DOCTORS DIRECTORY */}
      {/* ======================================================== */}
      {activeSubTab === 'doctors' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-xs border border-purple-100 dark:border-gray-700 space-y-3 text-xs">
            <h3 className="font-bold text-sm text-purple-950 dark:text-purple-200 border-b pb-2 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-purple-700" />
              <span>{t.addDoctor}</span>
            </h3>
            <form onSubmit={handleAddDoctor} className="space-y-3">
              <div>
                <label className="block font-bold mb-1">Doctor Code (e.g. DR01):</label>
                <input
                  type="text"
                  value={docCode}
                  onChange={(e) => setDocCode(e.target.value)}
                  className="w-full bg-purple-50 dark:bg-gray-900 border border-purple-300 dark:border-purple-700 p-2.5 rounded-xl font-bold uppercase text-purple-950 dark:text-purple-200"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Doctor Full Name:</label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="Prof. Dr. ..."
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Qualifications:</label>
                  <input
                    type="text"
                    value={docDegree}
                    onChange={(e) => setDocDegree(e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Specialty:</label>
                  <input
                    type="text"
                    value={docSpecialty}
                    onChange={(e) => setDocSpecialty(e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Phone:</label>
                  <input
                    type="text"
                    value={docPhone}
                    onChange={(e) => setDocPhone(e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Chamber / Room No:</label>
                  <input
                    type="text"
                    value={docRoom}
                    onChange={(e) => setDocRoom(e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">Consultation Fee (BDT):</label>
                <input
                  type="number"
                  value={docFee}
                  onChange={(e) => setDocFee(Number(e.target.value))}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl font-bold"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-purple-900 hover:bg-purple-950 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addDoctor}</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-xs border border-purple-100 dark:border-gray-700 text-xs">
            <h3 className="font-bold text-sm text-purple-950 dark:text-purple-200 border-b pb-2 mb-3">
              {t.doctorsManagement} ({doctors.length})
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {doctors.map((d) => (
                <div
                  key={d.id}
                  className="p-3 bg-purple-50/50 dark:bg-gray-900 border border-purple-100 dark:border-gray-700 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 px-2 py-0.5 rounded font-bold">
                        {d.code}
                      </span>
                      <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{d.name}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {d.degree} · <span className="text-purple-700 dark:text-purple-400 font-medium">{d.specialty}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      Chamber: {d.roomNo} · Fee: ৳{d.fee} · {d.phone}
                    </div>
                  </div>
                  {d.code !== 'DR05' && (
                    <button
                      onClick={() => deleteDoctor(d.id)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 4: COMPREHENSIVE LAB TESTS & MASTER PRICING */}
      {/* ======================================================== */}
      {activeSubTab === 'tests' && (() => {
        const testCategories = [
          'All',
          'Hematology',
          'Biochemistry',
          'Hormone',
          'Serology',
          'Urine',
          'Stool',
          'Microbiology',
          'X-Ray',
          'Ultrasound',
          'ECG',
          'General',
        ];

        const filteredLabTests = labTests.filter((tItem) => {
          const matchCat =
            testCategoryFilter === 'All' ||
            tItem.category?.toLowerCase() === testCategoryFilter.toLowerCase();
          const q = testSearchQuery.trim().toLowerCase();
          const matchQuery =
            !q ||
            tItem.name.toLowerCase().includes(q) ||
            tItem.code?.toLowerCase().includes(q) ||
            tItem.category?.toLowerCase().includes(q);
          return matchCat && matchQuery;
        });

        return (
          <div className="space-y-4">
            {/* Top Bar: Search, Category Pills, and Database Reset Action */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xs border border-purple-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md relative">
                <Search className="w-4 h-4 text-purple-600 dark:text-purple-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={testSearchQuery}
                  onChange={(e) => setTestSearchQuery(e.target.value)}
                  placeholder={
                    lang === 'bn'
                      ? 'টেস্টের নাম বা কোড দিয়ে খুঁজুন (যেমন: CBC, RBS, X-Ray, LFT)...'
                      : 'Search test name or code (e.g. CBC, RBS, X-Ray, LFT)...'
                  }
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl font-medium outline-hidden focus:border-purple-600"
                />
                {testSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setTestSearchQuery('')}
                    className="absolute right-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href="/bangladesh_diagnostic_test_catalog.json"
                  download="bangladesh_diagnostic_test_catalog.json"
                  className="px-3 py-2 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Download complete Bangladesh Diagnostic Test & Template JSON Catalog"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />
                  <span>{lang === 'bn' ? 'ক্যাটালগ JSON ডাউনলোড' : 'Download Catalog JSON'}</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    resetLabTestsToDefault();
                  }}
                  className="px-3 py-2 bg-purple-100 dark:bg-purple-950/60 hover:bg-purple-200 dark:hover:bg-purple-900 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-800 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Reload all standard pre-loaded clinical tests with prices"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-purple-600 dark:text-purple-300" />
                  <span>{lang === 'bn' ? 'স্ট্যান্ডার্ড ৮০+ টেস্ট রিস্টোর' : 'Reload 80+ Default Tests'}</span>
                </button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {testCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setTestCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                    testCategoryFilter === cat
                      ? 'bg-purple-800 text-white shadow-xs'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-50'
                  }`}
                >
                  {cat}
                  {cat === 'All' ? ` (${labTests.length})` : ''}
                </button>
              ))}
            </div>

            {/* Main 2-Column Layout: Add Form on Left, Filtered Tests Directory on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Add New Custom Test Form */}
              <div className="lg:col-span-5 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-xs border border-purple-100 dark:border-gray-700 space-y-3 text-xs self-start">
                <h3 className="font-bold text-sm text-purple-950 dark:text-purple-200 border-b pb-2 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-purple-700" />
                  <span>{lang === 'bn' ? 'নতুন কাস্টম টেস্ট যোগ করুন' : 'Add New Custom Test'}</span>
                </h3>

                <form onSubmit={handleAddTest} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                        {lang === 'bn' ? 'টেস্ট কোড:' : 'Test Code:'}
                      </label>
                      <input
                        type="text"
                        value={testCode}
                        onChange={(e) => setTestCode(e.target.value)}
                        placeholder="e.g. CBC, RBS"
                        className="w-full bg-purple-50/50 dark:bg-gray-900 border border-purple-200 dark:border-purple-800 p-2.5 rounded-xl uppercase font-bold text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                        {lang === 'bn' ? 'বিভাগ / ক্যাটাগরি:' : 'Category:'}
                      </label>
                      <select
                        value={testCategory}
                        onChange={(e) => setTestCategory(e.target.value)}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl font-bold cursor-pointer"
                      >
                        <option value="Hematology">Hematology (হেমাটোলজি)</option>
                        <option value="Biochemistry">Biochemistry (বায়োকেমিস্ট্রি)</option>
                        <option value="Hormone">Hormone & Endocrine (হরমোন)</option>
                        <option value="Serology">Serology & Immunology (সেরোলজি)</option>
                        <option value="Urine">Urine Examination (ইউরিন)</option>
                        <option value="Stool">Stool Examination (স্টুল)</option>
                        <option value="Microbiology">Microbiology & Culture (মাইক্রো)</option>
                        <option value="X-Ray">Digital X-Ray (এক্স-রে)</option>
                        <option value="Ultrasound">Ultrasound / USG (আল্ট্রাসনোগ্রাম)</option>
                        <option value="ECG">ECG & Cardiology (ইসিজি)</option>
                        <option value="General">General / Cytology / Biopsy (অন্যান্য)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      {lang === 'bn' ? 'টেস্টের পূর্ণ নাম:' : 'Test Full Name:'}
                    </label>
                    <input
                      type="text"
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      placeholder="e.g. Complete Blood Count, Serum Creatinine"
                      className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl font-bold text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                        {lang === 'bn' ? 'মূল্য / ফি (BDT):' : 'Price / Fee (BDT):'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={testPrice}
                        onChange={(e) => setTestPrice(Number(e.target.value))}
                        className="w-full bg-emerald-50/50 dark:bg-gray-900 border border-emerald-300 dark:border-emerald-800 p-2.5 rounded-xl font-bold text-emerald-800 dark:text-emerald-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                        {lang === 'bn' ? 'পরিমাপ ইউনিট:' : 'Unit:'}
                      </label>
                      <input
                        type="text"
                        value={testUnit}
                        onChange={(e) => setTestUnit(e.target.value)}
                        placeholder="mg/dL, %, Panel"
                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      {lang === 'bn' ? 'নমুনার ধরন (Sample Type):' : 'Sample Type:'}
                    </label>
                    <input
                      type="text"
                      value={testSampleType}
                      onChange={(e) => setTestSampleType(e.target.value)}
                      placeholder="e.g. Clotted Serum, EDTA Whole Blood, Midstream Urine"
                      className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      {lang === 'bn' ? 'স্ট্যান্ডার্ড নরমাল রেফারেন্স রেঞ্জ:' : 'Standard Normal Reference Range:'}
                    </label>
                    <input
                      type="text"
                      value={testNormal}
                      onChange={(e) => setTestNormal(e.target.value)}
                      placeholder="e.g. 0.6 - 1.2 mg/dL or Normal"
                      className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-900 hover:to-indigo-900 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'টেস্ট সংরক্ষণ করুন' : 'Save & Register Test'}</span>
                  </button>
                </form>
              </div>

              {/* Right: Diagnostic Tests Master Directory with Quick Edit */}
              <div className="lg:col-span-7 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-xs border border-purple-100 dark:border-gray-700 text-xs flex flex-col">
                <div className="flex items-center justify-between border-b pb-2 mb-3">
                  <h3 className="font-bold text-sm text-purple-950 dark:text-purple-200">
                    {lang === 'bn' ? 'ডায়াগনস্টিক টেস্ট তালিকা' : 'Diagnostic Tests Directory'} ({filteredLabTests.length} of {labTests.length})
                  </h3>
                  <span className="text-[11px] text-gray-500">
                    {testCategoryFilter !== 'All' ? `Filtered by ${testCategoryFilter}` : 'Showing all tests'}
                  </span>
                </div>

                <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                  {filteredLabTests.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 italic">
                      {lang === 'bn'
                        ? 'কোনো টেস্ট পাওয়া যায়নি। অনুসন্ধান বা ক্যাটাগরি পরিবর্তন করুন।'
                        : 'No tests match your filter criteria.'}
                    </div>
                  ) : (
                    filteredLabTests.map((tItem) => (
                      <div
                        key={tItem.id}
                        className="p-3 bg-purple-50/40 dark:bg-gray-900 border border-purple-100 dark:border-gray-700 rounded-xl flex items-center justify-between gap-3 hover:border-purple-300 dark:hover:border-purple-600 transition"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded text-[11px]">
                              {tItem.code}
                            </span>
                            <span className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                              {tItem.name}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold">
                              {tItem.category}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                            <span>
                              Ref: <strong>{tItem.normalRange || 'N/A'}</strong> {tItem.unit}
                            </span>
                            {tItem.sampleType && (
                              <span className="text-gray-400">· {tItem.sampleType}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-black text-sm text-emerald-700 dark:text-emerald-400 font-mono">
                            ৳{tItem.price}
                          </span>

                          {/* Quick Edit Button */}
                          <button
                            type="button"
                            onClick={() => openEditTestModal(tItem)}
                            className="p-1.5 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-lg cursor-pointer transition"
                            title={lang === 'bn' ? 'টেস্টের তথ্য ও মূল্য সম্পাদন করুন' : 'Edit Test Name, Code & Price'}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => deleteLabTest(tItem.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer transition"
                            title="Delete Test (Admin Only)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* DYNAMIC EDIT TEST MODAL */}
            {editingTest && (
              <div
                className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
                onClick={() => setEditingTest(null)}
              >
                <div
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-5 border border-purple-200 dark:border-purple-800 text-xs space-y-4 animate-in fade-in zoom-in-95"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded-xl">
                        <Edit3 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-gray-900 dark:text-white">
                          {lang === 'bn' ? 'টেস্ট সম্পাদন করুন' : 'Edit Diagnostic Test'}
                        </h3>
                        <p className="text-[11px] text-gray-500">
                          {lang === 'bn'
                            ? 'নাম, মূল্য, কোড বা নরমাল রেঞ্জ পরিবর্তন করুন'
                            : 'Update test parameters, codes and billing pricing'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingTest(null)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveEditTest} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                          {lang === 'bn' ? 'টেস্ট কোড:' : 'Test Code:'}
                        </label>
                        <input
                          type="text"
                          value={editTestCode}
                          onChange={(e) => setEditTestCode(e.target.value)}
                          className="w-full bg-purple-50/50 dark:bg-gray-900 border border-purple-300 dark:border-purple-800 p-2.5 rounded-xl font-bold uppercase"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                          {lang === 'bn' ? 'বিভাগ / ক্যাটাগরি:' : 'Category:'}
                        </label>
                        <select
                          value={editTestCategory}
                          onChange={(e) => setEditTestCategory(e.target.value)}
                          className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl font-bold cursor-pointer"
                        >
                          <option value="Hematology">Hematology</option>
                          <option value="Biochemistry">Biochemistry</option>
                          <option value="Hormone">Hormone</option>
                          <option value="Serology">Serology</option>
                          <option value="Urine">Urine</option>
                          <option value="Stool">Stool</option>
                          <option value="Microbiology">Microbiology</option>
                          <option value="X-Ray">X-Ray</option>
                          <option value="Ultrasound">Ultrasound</option>
                          <option value="ECG">ECG</option>
                          <option value="General">General</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                        {lang === 'bn' ? 'টেস্টের পূর্ণ নাম:' : 'Test Full Name:'}
                      </label>
                      <input
                        type="text"
                        value={editTestName}
                        onChange={(e) => setEditTestName(e.target.value)}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl font-bold"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                          {lang === 'bn' ? 'মূল্য / ফি (BDT):' : 'Price / Rate (BDT):'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editTestPrice}
                          onChange={(e) => setEditTestPrice(Number(e.target.value))}
                          className="w-full bg-emerald-50/50 dark:bg-gray-900 border border-emerald-300 dark:border-emerald-700 p-2.5 rounded-xl font-bold text-emerald-800 dark:text-emerald-300"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                          {lang === 'bn' ? 'পরিমাপ ইউনিট:' : 'Unit:'}
                        </label>
                        <input
                          type="text"
                          value={editTestUnit}
                          onChange={(e) => setEditTestUnit(e.target.value)}
                          className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                        {lang === 'bn' ? 'নমুনার ধরন (Sample Type):' : 'Sample Type:'}
                      </label>
                      <input
                        type="text"
                        value={editTestSampleType}
                        onChange={(e) => setEditTestSampleType(e.target.value)}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                        {lang === 'bn' ? 'স্ট্যান্ডার্ড নরমাল রেফারেন্স রেঞ্জ:' : 'Standard Normal Reference Range:'}
                      </label>
                      <input
                        type="text"
                        value={editTestNormal}
                        onChange={(e) => setEditTestNormal(e.target.value)}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl"
                      />
                    </div>

                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingTest(null)}
                        className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 font-bold cursor-pointer"
                      >
                        {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-900 hover:to-indigo-900 text-white rounded-xl font-bold cursor-pointer shadow-md"
                      >
                        {lang === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ======================================================== */}
      {/* SUBTAB 5: AUTOMATED DAILY BACKUP & DATABASE DUMPS */}
      {/* ======================================================== */}
      {activeSubTab === 'backup' && (
        <div className="space-y-6">
          <AutomatedBackupTab />
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                Cloud Sync: <strong className="text-emerald-600">{cloudSyncStatus.toUpperCase()}</strong> ({lastSyncTime})
              </span>
              <button
                type="button"
                onClick={triggerManualSync}
                className="text-purple-700 hover:text-purple-900 font-bold ml-2 underline cursor-pointer"
              >
                Sync Now
              </button>
            </div>

            <button
              type="button"
              onClick={resetToSampleData}
              className="px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-950/50 text-red-700 dark:text-red-300 font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.resetDefaultData}</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 5B: DEDICATED DATABASE RESTORE MODULE             */}
      {/* ======================================================== */}
      {activeSubTab === 'restore' && (
        <div className="space-y-6">
          <RestoreModule />
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 6: PWA & PC / APK INSTALLER */}
      {/* ======================================================== */}
      {activeSubTab === 'pwa' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xs border border-purple-100 dark:border-gray-700 max-w-4xl space-y-6 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700 pb-4">
            <div>
              <h3 className="font-bold text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
                <Laptop className="w-5 h-5 text-purple-700" />
                <span>পিসি ও মোবাইল APK ইন্সটলার সেন্টার</span>
              </h3>
              <p className="text-gray-500 mt-0.5">
                কম্পিউটারে (Windows / Mac) স্ট্যান্ডঅ্যালোন সফটওয়্যার হিসেবে এবং অ্যান্ড্রয়েডে APK অ্যাপ হিসেবে ইনস্টল করুন।
              </p>
            </div>
            <button
              onClick={() => setShowPwaModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition"
            >
              <Download className="w-4 h-4" />
              <span>ইন্সটলার গাইড ওপেন করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PC Desktop Setup */}
            <div className="border border-purple-200 dark:border-purple-900 rounded-xl p-4 bg-purple-50/40 dark:bg-purple-950/20 space-y-3">
              <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 font-bold text-sm">
                <MonitorCheck className="w-4 h-4 text-purple-700" />
                <span>Windows PC ও ডেস্কটপ সফটওয়্যার</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-xs">
                পিসিতে ব্রাউজার ছাড়া ফুলস্ক্রিন উইন্ডোতে কাজ করবে, ডেস্কটপে আইকন থাকবে এবং সরাসরি প্রিন্ট ও অফলাইন ক্যাশিং কাজ করবে।
              </p>
              <div className="pt-2 flex flex-col gap-2">
                {isInstallable ? (
                  <button
                    onClick={install}
                    className="w-full py-2.5 bg-purple-800 hover:bg-purple-900 text-white font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>১-ক্লিকে পিসিতে ইনস্টল করুন</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowPwaModal(true)}
                    className="w-full py-2.5 bg-purple-800 hover:bg-purple-900 text-white font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <Laptop className="w-4 h-4" />
                    <span>পিসি ইনস্টলেশন নির্দেশিকা</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    const currentUrl = window.location.origin + window.location.pathname;
                    const shortcutContent = `[InternetShortcut]\r\nURL=${currentUrl}\r\nIconIndex=0\r\nIconFile=${window.location.origin}/favicon.ico\r\n`;
                    const blob = new Blob([shortcutContent], { type: 'application/octet-stream' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Adiba_Hospital_PC_App.url`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition text-xs"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ডেস্কটপ শর্টকাট (.URL) ডাউনলোড</span>
                </button>
              </div>
            </div>

            {/* Android APK Setup */}
            <div className="border border-emerald-200 dark:border-emerald-900 rounded-xl p-4 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-sm">
                <Smartphone className="w-4 h-4 text-emerald-700" />
                <span>Android মোবাইল ও APK</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-xs">
                অ্যান্ড্রয়েড ফোনে গুগল প্লে সার্ভিস এর মাধ্যমে স্বয়ংক্রিয়ভাবে একটি WebAPK তৈরি হবে অথবা PWABuilder দিয়ে সরাসরি .apk ফাইল তৈরি করে নিতে পারবেন।
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => setShowPwaModal(true)}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>মোবাইল APK গাইড দেখুন</span>
                </button>
                <a
                  href={`https://www.pwabuilder.com?url=${encodeURIComponent(window.location.origin + window.location.pathname)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 text-xs transition"
                >
                  <span>PWABuilder দিয়ে .APK বানান</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 8: SOFTWARE LICENSING & SUBSCRIPTION SECURITY */}
      {/* ======================================================== */}
      {activeSubTab === 'license' && <LicenseSettingsTab />}

      {showPwaModal && <PWAInstallModal onClose={() => setShowPwaModal(false)} />}
    </div>
  );
};
