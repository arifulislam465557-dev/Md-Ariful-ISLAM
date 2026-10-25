import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Language,
  ThemeMode,
  Doctor,
  LabTest,
  Patient,
  Invoice,
  Prescription,
  EcgReport,
  XrayReport,
  UsgReport,
  ClinicConfig,
  SystemLog,
  ChatMessage,
  NotificationItem,
  UserAccount,
  AppModuleId,
  Employee,
  ExpenseItem,
  WorkstationNode,
  ActivityAuditLog,
  LicenseSecurityState,
  InvoicePrintLog,
  BackupHistoryEntry,
  AutoBackupScheduleConfig,
  AutoBackupFrequency,
  EncryptedBackupPackage,
  ShiftHandoverNote,
  PatientHandoverItem,
  DiagnosticInstitution,
  AutoSaveStatus,
  DeletableEntityType,
  SoftDeletedRecord,
  PrintRecordEntry,
  OpdAppointmentRecord,
  DeleteRequestPayload,
  ActiveModuleDrafts,
  DepartmentOrder,
  DepartmentOrderStatus,
  PaymentTransaction,
  BillingConfig,
  ServiceDepartmentId,
  TestResultItem,
} from '../types';
import {
  initialClinicConfig,
  initialDoctors,
  initialLabTests,
  initialPatients,
  initialInvoices,
  initialUsers,
  initialEmployees,
  initialExpenses,
  initialWorkstations,
  initialAuditLogs,
  initialPrescriptions,
  initialShiftHandovers,
  initialDiagnosticInstitutions,
  translations,
} from '../data/initialData';
import { convertInvoiceItemsToTestResults, getMergedPathologyCatalog } from '../utils/pathologyUtils';
import { PATHOLOGY_MASTER_TEMPLATES } from '../data/pathologyMasterCatalog';
import {
  mergeServiceCatalogWithDoctors,
  resolveItemDepartment,
  getDepartmentLabel,
} from '../data/bangladeshServiceMaster';
import {
  evaluateLicenseState,
  validateAndRenewLicense,
  simulateLicenseDaysRemaining,
  simulateTrialDaysRemaining,
  resetToInitialTrialState,
  resetToUnactivatedInstallState,
  MASTER_LICENSE_KEY,
} from '../utils/licenseSecurity';
import {
  downloadDatabaseJson,
  downloadDatabaseSql,
  FullHospitalDatabase,
  encryptHospitalData,
  decryptHospitalData,
  downloadEncryptedBackup,
  isEncryptedBackupPackage,
  filterHospitalDataByScopes,
} from '../utils/databaseBackup';

const PREFIX = 'medicare_clinic_v1_';

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  t: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  users: UserAccount[];
  currentUser: UserAccount | null;
  setCurrentUser: (user: UserAccount | null) => void;
  loginUser: (username: string, pass: string) => { success: boolean; error?: string };
  logoutUser: () => void;
  addUser: (user: Omit<UserAccount, 'id' | 'createdAt'>) => UserAccount;
  updateUser: (id: string, user: Partial<UserAccount>) => void;
  deleteUser: (id: string) => boolean;
  hasAccessToModule: (moduleId: string) => boolean;
  getAllowedTabs: () => AppModuleId[];

  // LAN Workstations & Network Management
  workstations: WorkstationNode[];
  currentWorkstationId: string;
  currentWorkstation: WorkstationNode;
  setCurrentWorkstationId: (id: string) => void;
  updateWorkstation: (id: string, updated: Partial<WorkstationNode>) => void;
  addWorkstation: (ws: Omit<WorkstationNode, 'id'>) => WorkstationNode;

  // Real-Time Activity & IP Audit Log
  auditLogs: ActivityAuditLog[];
  addAuditLog: (log: Omit<ActivityAuditLog, 'id' | 'timestamp' | 'ipAddress' | 'workstationCode' | 'username' | 'userFullName' | 'role' | 'department'> & Partial<ActivityAuditLog>) => void;
  clearAuditLogs: () => void;
  broadcastLanEvent: (type: string, payload?: any) => void;

  clinicConfig: ClinicConfig;
  updateClinicConfig: (config: Partial<ClinicConfig>) => void;

  doctors: Doctor[];
  addDoctor: (doc: Omit<Doctor, 'id'>) => Doctor;
  updateDoctor: (id: string, doc: Partial<Doctor>) => void;
  deleteDoctor: (id: string) => void;

  labTests: LabTest[];
  addLabTest: (test: Omit<LabTest, 'id'>) => LabTest;
  updateLabTest: (id: string, test: Partial<LabTest>) => void;
  deleteLabTest: (id: string) => void;
  resetLabTestsToDefault: () => void;

  patients: Patient[];
  addPatient: (pat: Omit<Patient, 'id'>) => Patient;
  updatePatient: (id: string, pat: Partial<Patient>) => void;
  deletePatient: (id: string) => void;

  selectedPatientForReport: Patient | null;
  setSelectedPatientForReport: (p: Patient | null) => void;

  invoices: Invoice[];
  addInvoice: (inv: Omit<Invoice, 'id'>) => Invoice;
  updateInvoice: (id: string, inv: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  collectInvoiceDue: (params: {
    invoiceId: string;
    amount: number;
    paymentMethod: string;
    transactionReference?: string;
    note?: string;
  }) => Promise<{ success: boolean; receiptNo?: string; error?: string }>;
  cancelOrRefundInvoice: (params: {
    invoiceId: string;
    actionType: 'CANCEL' | 'REFUND';
    refundAmount: number;
    paymentMethod?: string;
    reason: string;
  }) => Promise<{ success: boolean; error?: string }>;

  departmentOrders: DepartmentOrder[];
  updateDepartmentOrderStatus: (
    orderId: string,
    orderStatus: DepartmentOrderStatus,
    extra?: { reportId?: string; notes?: string }
  ) => Promise<void>;

  paymentTransactions: PaymentTransaction[];
  billingConfig: BillingConfig;
  updateBillingConfig: (updates: Partial<BillingConfig>) => void;

  prescriptions: Prescription[];
  addPrescription: (rx: Omit<Prescription, 'id'>) => Prescription;
  deletePrescription: (id: string) => void;

  ecgReports: EcgReport[];
  addEcgReport: (ecg: Omit<EcgReport, 'id'>) => void;
  deleteEcgReport: (id: string) => void;

  xrayReports: XrayReport[];
  addXrayReport: (xray: Omit<XrayReport, 'id'>) => void;
  deleteXrayReport: (id: string) => void;

  usgReports: UsgReport[];
  addUsgReport: (usg: Omit<UsgReport, 'id'>) => void;
  deleteUsgReport: (id: string) => void;

  opdAppointments: OpdAppointmentRecord[];
  setOpdAppointments: React.Dispatch<React.SetStateAction<OpdAppointmentRecord[]>>;
  addOpdAppointment: (appt: Omit<OpdAppointmentRecord, 'id' | 'createdAt'>) => OpdAppointmentRecord;
  updateOpdAppointment: (id: string, updates: Partial<OpdAppointmentRecord>) => void;
  deleteOpdAppointment: (id: string) => void;

  employees: Employee[];
  addEmployee: (emp: Omit<Employee, 'id'>) => Employee;
  updateEmployee: (id: string, emp: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  expenses: ExpenseItem[];
  addExpense: (exp: Omit<ExpenseItem, 'id'>) => ExpenseItem;
  updateExpense: (id: string, exp: Partial<ExpenseItem>) => void;
  deleteExpense: (id: string) => void;

  is2FAEnabled: boolean;
  setIs2FAEnabled: (enabled: boolean) => void;
  is2FAVerified: boolean;
  setIs2FAVerified: (verified: boolean) => void;
  open2FAModal: boolean;
  setOpen2FAModal: (open: boolean) => void;

  notifications: NotificationItem[];
  addNotification: (title: string, message: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
  markNotificationsAsRead: () => void;
  unreadCount: number;

  chatMessages: ChatMessage[];
  sendChatMessage: (message: string, channel: 'lab' | 'opd' | 'billing' | 'general', senderRole?: 'Lab' | 'Doctor' | 'Reception' | 'Admin') => void;

  cloudSyncStatus: 'synced' | 'syncing';
  lastSyncTime: string;
  triggerManualSync: () => void;

  systemLogs: SystemLog[];
  addLog: (level: 'info' | 'warn' | 'error', message: string, module: string) => void;
  resetToSampleData: () => void;

  // Invoice Print Audit Log
  printLogs: InvoicePrintLog[];
  addPrintLog: (log: Omit<InvoicePrintLog, 'id' | 'printedAt'>) => InvoicePrintLog;
  clearPrintLogs: () => void;

  // Database Backup & Automated Encrypted Utility
  backupHistory: BackupHistoryEntry[];
  autoDailyBackupEnabled: boolean;
  setAutoDailyBackupEnabled: (enabled: boolean) => void;
  lastAutoBackupDate: string;
  autoBackupConfig: AutoBackupScheduleConfig;
  updateAutoBackupConfig: (cfg: Partial<AutoBackupScheduleConfig>) => void;
  runAutomatedBackupNow: () => Promise<{ success: boolean; filename: string; sizeKb: number; message: string }>;
  exportDatabaseJson: () => void;
  exportDatabaseSqlDump: () => void;
  exportEncryptedDatabaseJson: (
    passphrase: string,
    scopes?: { patients: boolean; clinicalReports: boolean; billing: boolean; mastersAndStaff: boolean }
  ) => Promise<{ success: boolean; filename: string; sizeKb: number }>;
  restoreDatabaseFromJson: (jsonInput: any) => { success: boolean; message: string };
  decryptAndRestoreDatabase: (
    rawContent: string,
    passphrase?: string,
    mergeMode?: 'replace' | 'merge'
  ) => Promise<{ success: boolean; message: string; summary?: any }>;
  deleteBackupHistoryEntry: (id: string) => void;
  clearAllLocalVaultBackups: () => void;
  daysSinceLastBackup: number;
  isBackupOverdue: boolean;

  // Patient Overview Modal
  selectedPatientForOverview: Patient | null;
  setSelectedPatientForOverview: (patient: Patient | null) => void;
  openPatientOverviewModal: (patientIdOrPidOrPatient: string | Patient) => void;

  // Online / Offline State
  isOnline: boolean;

  // Global Keyboard Shortcuts
  showShortcutsModal: boolean;
  setShowShortcutsModal: (show: boolean) => void;

  // Global Search Modal
  showGlobalSearch: boolean;
  setShowGlobalSearch: (show: boolean) => void;

  // Software Licensing & Subscription Security System
  licenseInfo: LicenseSecurityState;
  renewLicense: (code: string) => { success: boolean; error?: string; message?: string };
  simulateLicenseDays: (days: number) => void;
  simulateTrialDays: (days: number) => void;
  resetLicenseToInstallState: () => void;
  openLicenseModal: boolean;
  setOpenLicenseModal: (open: boolean) => void;

  // Mobile Remote Device & Multi-Branch Central Controls
  openMobileRemoteModal: boolean;
  setOpenMobileRemoteModal: (open: boolean) => void;
  institutions: DiagnosticInstitution[];
  updateInstitution: (id: string, updates: Partial<DiagnosticInstitution>) => void;
  lockInstitution: (id: string, reason?: string) => void;
  unlockInstitution: (id: string) => void;
  killInstitution: (id: string, reason?: string) => void;
  reactivateInstitution: (id: string) => void;
  renewInstitutionLicense: (id: string, daysToAdd?: number) => { success: boolean; message: string };
  updateInstitutionAllowedModules: (id: string, modules: AppModuleId[]) => void;
  lockWorkstation: (id: string, reason?: string) => void;
  unlockWorkstation: (id: string) => void;
  killWorkstation: (id: string, reason?: string) => void;
  reactivateWorkstation: (id: string) => void;
  updateWorkstationAllowedModules: (id: string, modules: AppModuleId[]) => void;
  executeOfflineRemoteCommand: (commandCode: string) => { success: boolean; message: string };
  mobileRemotePassword: string;
  updateMobileRemotePassword: (newPass: string) => void;

  // Doctor Shift Handover
  shiftHandovers: ShiftHandoverNote[];
  addShiftHandover: (note: Omit<ShiftHandoverNote, 'id' | 'createdAt'>) => ShiftHandoverNote;
  updateShiftHandover: (id: string, updates: Partial<ShiftHandoverNote>) => void;
  acknowledgeShiftHandover: (id: string, doctorName: string, notes?: string) => void;
  deleteShiftHandover: (id: string) => void;
  activeShiftHandoverCount: number;

  // Automatic Save, Permanent Data Storage & Admin-Only Delete System
  autoSaveStatus: AutoSaveStatus;
  lastAutoSavedAt: string;
  dbVersion: number;
  pendingOfflineMutationsCount: number;
  activeDrafts: ActiveModuleDrafts;
  updateModuleDraft: (moduleKey: keyof ActiveModuleDrafts, draftData: Record<string, any> | null) => void;
  triggerImmediateAutoSave: (reason?: string) => Promise<boolean>;
  retryOfflineMutations: () => Promise<boolean>;
  isAdminUser: boolean;
  trashRecords: SoftDeletedRecord[];
  printRecords: PrintRecordEntry[];
  recordPrintOrPdfAction: (entry: Partial<PrintRecordEntry>) => Promise<void>;
  pendingDeleteRequest: DeleteRequestPayload | null;
  setPendingDeleteRequest: (req: DeleteRequestPayload | null) => void;
  openRecycleBinModal: boolean;
  setOpenRecycleBinModal: (open: boolean) => void;
  requestDeleteRecord: (payload: DeleteRequestPayload) => void;
  confirmAdminSoftDelete: (deletionReason: string) => Promise<{ success: boolean; error?: string }>;
  restoreFromRecycleBin: (trashId: string) => Promise<{ success: boolean; error?: string }>;
  permanentlyDeleteFromRecycleBin: (trashId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  simulateUnauthorizedDeleteAttempt: (
    simulatedRole?: string,
    targetLabel?: string
  ) => Promise<{ status: number; error: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem(`${PREFIX}lang`);
    return saved === 'bn' ? 'bn' : 'en';
  });
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem(`${PREFIX}theme`) as ThemeMode) || 'modern');
  const [activeTab, setActiveTab] = useState<string>('pathology');

  const ALL_MODULES: AppModuleId[] = [
    'pathology',
    'billing',
    'doctorVisit',
    'ecg',
    'xray',
    'ultrasound',
    'doctorPortal',
    'incomeExpense',
    'employees',
    'analytics',
    'chat',
    'settings',
    'lanNetwork',
  ];

  // Workstation Nodes (10 interconnected LAN PCs)
  const [workstations, setWorkstations] = useState<WorkstationNode[]>(() => {
    const saved = localStorage.getItem(`${PREFIX}workstations`);
    return saved ? JSON.parse(saved) : initialWorkstations;
  });

  // Current PC Terminal ID (e.g. ws-reception, ws-billing, ws-lab1, etc.)
  const [currentWorkstationId, setCurrentWorkstationIdState] = useState<string>(() => {
    return localStorage.getItem(`${PREFIX}current_ws_id`) || 'ws-reception';
  });

  // Live Audit Activity Logs (Keeps track of IP, workstation, user, timestamp and actions)
  const [auditLogs, setAuditLogs] = useState<ActivityAuditLog[]>(() => {
    const saved = localStorage.getItem(`${PREFIX}audit_logs`);
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  useEffect(() => {
    localStorage.setItem(`${PREFIX}workstations`, JSON.stringify(workstations));
  }, [workstations]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}current_ws_id`, currentWorkstationId);
  }, [currentWorkstationId]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}audit_logs`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  const currentWorkstation =
    workstations.find((w) => w.id === currentWorkstationId) || workstations[0];

  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem(`${PREFIX}users`);
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = sessionStorage.getItem(`${PREFIX}current_user`) || localStorage.getItem(`${PREFIX}current_user`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    if (sessionStorage.getItem('adiba_session_auth') === 'true') {
      return initialUsers[0];
    }
    return null;
  });

  useEffect(() => {
    localStorage.setItem(`${PREFIX}users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem(`${PREFIX}current_user`, JSON.stringify(currentUser));
      localStorage.setItem(`${PREFIX}current_user`, JSON.stringify(currentUser));
      sessionStorage.setItem('adiba_session_auth', 'true');
      localStorage.setItem('adiba_app_auth', 'authenticated');
    } else {
      sessionStorage.removeItem(`${PREFIX}current_user`);
      localStorage.removeItem(`${PREFIX}current_user`);
      sessionStorage.removeItem('adiba_session_auth');
      localStorage.removeItem('adiba_app_auth');
    }
  }, [currentUser]);

  // Real-time LAN Broadcast & Multi-Device Sync Engine
  const broadcastLanEvent = (type: string, payload?: any) => {
    const activeWs = workstations.find((w) => w.id === currentWorkstationId) || workstations[0];
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('adiba_hospital_lan_bus');
        channel.postMessage({
          type,
          payload,
          senderTerminal: activeWs.terminalCode,
          senderTerminalName: activeWs.nameBn || activeWs.name,
          senderIp: activeWs.ipAddress,
          senderDepartment: activeWs.department,
          senderUser: currentUser?.username || 'Hospital-Desk',
          timestamp: new Date().toLocaleTimeString(),
        });
        channel.close();
      }
    } catch {
      // Safe fallback
    }
  };

  const addAuditLog = (
    logData: Omit<ActivityAuditLog, 'id' | 'timestamp' | 'ipAddress' | 'workstationCode' | 'username' | 'userFullName' | 'role' | 'department'> &
      Partial<ActivityAuditLog>
  ) => {
    const activeWs = workstations.find((w) => w.id === currentWorkstationId) || workstations[0];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newLog: ActivityAuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: logData.timestamp || timeStr,
      ipAddress: logData.ipAddress || activeWs.ipAddress,
      workstationCode: logData.workstationCode || `${activeWs.terminalCode} (${activeWs.nameBn})`,
      username: logData.username || currentUser?.username || 'Guest Desk',
      userFullName: logData.userFullName || currentUser?.fullName || 'Hospital Workstation',
      role: logData.role || currentUser?.role || 'Staff',
      department: logData.department || activeWs.department,
      actionType: logData.actionType,
      patientId: logData.patientId,
      patientName: logData.patientName,
      details: logData.details,
    };

    setAuditLogs((prev) => [newLog, ...prev.slice(0, 199)]);
  };

  const clearAuditLogs = () => {
    // Audit Trail is strictly immutable — even Admin cannot wipe audit history
    addNotification(
      lang === 'bn' ? 'অডিট লগ অপরিবর্তনীয় (Immutable)' : 'Audit Log Protected',
      lang === 'bn'
        ? 'নিরাপত্তা নীতিমালা অনুযায়ী সিস্টেম অডিট ট্রেইল মুছে ফেলা সম্পূর্ণ নিষিদ্ধ।'
        : 'System security policy prohibits clearing immutable audit trail records.',
      'warn'
    );
  };

  const setCurrentWorkstationId = (id: string) => {
    setCurrentWorkstationIdState(id);
    const target = workstations.find((w) => w.id === id);
    if (target) {
      addAuditLog({
        actionType: 'LAN_SYNC',
        details: `Workstation switched to ${target.terminalCode} (${target.nameBn}) [Static IP: ${target.ipAddress}]. Cat 6 Gigabit Link Established.`,
        workstationCode: target.terminalCode,
        ipAddress: target.ipAddress,
      });
      broadcastLanEvent('WORKSTATION_SWITCHED', {
        terminalCode: target.terminalCode,
        ipAddress: target.ipAddress,
      });
    }
  };

  const updateWorkstation = (id: string, updated: Partial<WorkstationNode>) => {
    setWorkstations((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updated, lastHeartbeat: 'Just now' } : w))
    );
    addAuditLog({
      actionType: 'SETTINGS_UPDATE',
      details: `Workstation ${id} configuration modified (Static IP / parameters updated).`,
    });
  };

  const addWorkstation = (wsData: Omit<WorkstationNode, 'id'>): WorkstationNode => {
    const newWs: WorkstationNode = {
      ...wsData,
      id: `ws-${Date.now()}`,
      latencyMs: wsData.latencyMs || 0.2,
      lastHeartbeat: 'Just now',
    };
    setWorkstations((prev) => [...prev, newWs]);
    addAuditLog({
      actionType: 'SETTINGS_UPDATE',
      details: `New workstation ${newWs.terminalCode} (${newWs.ipAddress}) attached to LAN switch.`,
    });
    return newWs;
  };

  // Listen to incoming LAN Broadcasts across tabs and windows
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel('adiba_hospital_lan_bus');
        channel.onmessage = (event) => {
          const { type, payload, senderTerminal, senderIp, senderUser } = event.data || {};
          if (type === 'INVOICE_CREATED') {
            const savedInvoices = localStorage.getItem(`${PREFIX}invoices`);
            if (savedInvoices) {
              try { setInvoices(JSON.parse(savedInvoices)); } catch {}
            }
            const savedPatients = localStorage.getItem(`${PREFIX}patients`);
            if (savedPatients) {
              try { setPatients(JSON.parse(savedPatients)); } catch {}
            }
            addNotification(
              lang === 'bn' ? '⚡ LAN রিয়েল-টাইম ডাটা সিঙ্ক' : '⚡ LAN Real-Time Data Sync',
              lang === 'bn'
                ? `রিসেপশন ${senderTerminal} (${senderIp}) থেকে নতুন রোগী ${payload?.patientName || ''} (আইডি: ${payload?.pId || ''}) এর বিল ও টেস্ট কিউতে যুক্ত হয়েছে।`
                : `New invoice & patient ${payload?.patientName || ''} (ID: ${payload?.pId}) queued from ${senderTerminal} (${senderIp}).`,
              'success'
            );
          } else if (type === 'REPORT_SAVED' || type === 'PATIENT_UPDATED') {
            const savedPatients = localStorage.getItem(`${PREFIX}patients`);
            if (savedPatients) {
              try { setPatients(JSON.parse(savedPatients)); } catch {}
            }
          } else if (
            type === 'REMOTE_LOCK' ||
            type === 'REMOTE_UNLOCK' ||
            type === 'REMOTE_KILL' ||
            type === 'REMOTE_REACTIVATE' ||
            type === 'FEATURE_PERMISSIONS_CHANGED'
          ) {
            const savedWs = localStorage.getItem(`${PREFIX}workstations`);
            if (savedWs) {
              try { setWorkstations(JSON.parse(savedWs)); } catch {}
            }
          }
        };
      } catch {}
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `${PREFIX}invoices` && e.newValue) {
        try { setInvoices(JSON.parse(e.newValue)); } catch {}
      }
      if (e.key === `${PREFIX}patients` && e.newValue) {
        try { setPatients(JSON.parse(e.newValue)); } catch {}
      }
      if (e.key === `${PREFIX}audit_logs` && e.newValue) {
        try { setAuditLogs(JSON.parse(e.newValue)); } catch {}
      }
      if (e.key === `${PREFIX}workstations` && e.newValue) {
        try { setWorkstations(JSON.parse(e.newValue)); } catch {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [lang]);

  const hasAccessToModule = (moduleId: string): boolean => {
    if (!currentUser) return false;
    // Check if module is restricted on this workstation by Mobile Remote Admin
    if (
      currentWorkstation?.allowedModulesOverride &&
      Array.isArray(currentWorkstation.allowedModulesOverride) &&
      !currentWorkstation.allowedModulesOverride.includes(moduleId as AppModuleId)
    ) {
      return false;
    }
    if (currentUser.role === 'Admin') return true;
    return currentUser.allowedModules.includes(moduleId as AppModuleId);
  };

  const getAllowedTabs = (): AppModuleId[] => {
    if (!currentUser) return ['pathology'];
    let base = currentUser.role === 'Admin' ? ALL_MODULES : currentUser.allowedModules;
    if (
      currentWorkstation?.allowedModulesOverride &&
      Array.isArray(currentWorkstation.allowedModulesOverride)
    ) {
      base = base.filter((m) => currentWorkstation.allowedModulesOverride!.includes(m));
    }
    return base.length > 0 ? base : ['pathology'];
  };

  const loginUser = (username: string, pass: string): { success: boolean; error?: string } => {
    const trimmedUser = username.trim().toLowerCase();
    const matched = users.find(
      (u) => u.username.toLowerCase() === trimmedUser && u.password === pass
    );

    if (!matched) {
      return {
        success: false,
        error:
          lang === 'bn'
            ? 'ইউজার নেইম বা পাসওয়ার্ড সঠিক নয়! দয়া করে সঠিক ইউজার আইডি ও পাসওয়ার্ড দিন।'
            : 'Invalid username or password! Please check credentials.',
      };
    }

    if (!matched.isActive) {
      return {
        success: false,
        error:
          lang === 'bn'
            ? 'এই ইউজার অ্যাকাউন্টটি বর্তমানে নিষ্ক্রিয় রয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।'
            : 'This account has been deactivated. Please contact administrator.',
      };
    }

    setCurrentUser(matched);

    // If user has an assigned workstation, switch to it automatically
    if (matched.assignedWorkstation) {
      const matchedWs = workstations.find((w) => w.terminalCode === matched.assignedWorkstation);
      if (matchedWs) {
        setCurrentWorkstationIdState(matchedWs.id);
      }
    }

    // Record login into Activity Audit Trail
    addAuditLog({
      actionType: 'LOGIN',
      username: matched.username,
      userFullName: matched.fullName,
      role: matched.role,
      department: matched.role === 'Admin' ? 'Management' : matched.role,
      details: `${matched.fullName} (@${matched.username}) সফলভাবে লগইন করেছেন। টার্মিনাল: ${currentWorkstation.terminalCode} (${currentWorkstation.nameBn}), আইপি: ${currentWorkstation.ipAddress}`,
    });

    broadcastLanEvent('USER_LOGIN', { username: matched.username, fullName: matched.fullName });

    const allowed = matched.role === 'Admin' ? ALL_MODULES : matched.allowedModules;
    if (allowed.length > 0 && !allowed.includes(activeTab as AppModuleId)) {
      setActiveTab(allowed[0]);
    }

    return { success: true };
  };

  const logoutUser = () => {
    if (currentUser) {
      addAuditLog({
        actionType: 'LOGOUT',
        username: currentUser.username,
        userFullName: currentUser.fullName,
        role: currentUser.role,
        department: currentUser.role === 'Admin' ? 'Management' : currentUser.role,
        details: `${currentUser.fullName} (@${currentUser.username}) টার্মিনাল ${currentWorkstation.terminalCode} [IP: ${currentWorkstation.ipAddress}] থেকে লগআউট করেছেন।`,
      });
    }
    setCurrentUser(null);
  };

  const addUser = (userData: Omit<UserAccount, 'id' | 'createdAt'>): UserAccount => {
    const newUser: UserAccount = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (id: string, updated: Partial<UserAccount>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updated } : u))
    );
    if (currentUser && currentUser.id === id) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updated } : null));
    }
  };

  const deleteUser = (id: string): boolean => {
    const target = users.find((u) => u.id === id);
    if (!target) return false;
    if (target.username.toLowerCase() === 'adiba') {
      addNotification(
        'প্রধান অ্যাডমিন সুরক্ষিত',
        'প্রধান সিস্টেম অ্যাডমিন (adiba) অ্যাকাউন্ট মুছে ফেলা যাবে না।',
        'error'
      );
      return false;
    }
    requestDeleteRecord({
      entityType: 'userAccount',
      entityLabel: 'ইউজার অ্যাকাউন্ট (User Account)',
      recordId: target.id,
      recordTitle: `${target.fullName} (@${target.username})`,
      recordSubtitle: `Role: ${target.role} · Workstation: ${target.assignedWorkstation || 'All'}`,
      originalData: target,
    });
    return true;
  };

  const [clinicConfig, setClinicConfig] = useState<ClinicConfig>(() => {
    const saved = localStorage.getItem(`${PREFIX}config`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.labInCharge === 'Md. Tariqul Islam, B.Sc (Lab Tech)' || parsed.labInCharge === 'Md. Tariqul Islam') {
          parsed.labInCharge = initialClinicConfig.labInCharge;
        }
        return { ...initialClinicConfig, ...parsed };
      } catch {
        return initialClinicConfig;
      }
    }
    return initialClinicConfig;
  });

  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    const saved = localStorage.getItem(`${PREFIX}doctors`);
    return saved ? JSON.parse(saved) : initialDoctors;
  });

  const [labTests, setLabTests] = useState<LabTest[]>(() => {
    const savedDocsRaw = localStorage.getItem(`${PREFIX}doctors`);
    const activeDocs: Doctor[] = savedDocsRaw ? JSON.parse(savedDocsRaw) : initialDoctors;
    const baseCatalog = mergeServiceCatalogWithDoctors(
      getMergedPathologyCatalog(initialLabTests),
      activeDocs
    );
    const saved = localStorage.getItem(`${PREFIX}tests`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = mergeServiceCatalogWithDoctors(
            getMergedPathologyCatalog(parsed),
            activeDocs
          );
          localStorage.setItem(`${PREFIX}tests`, JSON.stringify(merged));
          return merged;
        }
      } catch (e) {}
    }
    localStorage.setItem(`${PREFIX}tests`, JSON.stringify(baseCatalog));
    return baseCatalog;
  });

  // Synchronize Doctor Master consultation fees with Service Master whenever doctors list updates
  useEffect(() => {
    setLabTests((prev) => mergeServiceCatalogWithDoctors(prev, doctors));
  }, [doctors]);

  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem(`${PREFIX}patients`);
    return saved ? JSON.parse(saved) : initialPatients;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(`${PREFIX}invoices`);
    return saved ? JSON.parse(saved) : initialInvoices;
  });

  const buildOrdersFromInvoices = useCallback((invList: Invoice[], existingOrders: DepartmentOrder[] = []): DepartmentOrder[] => {
    const mapByKey = new Map<string, DepartmentOrder>();
    existingOrders.forEach((o) => {
      mapByKey.set(`${o.invoiceNo}_${o.departmentId}`, o);
    });

    for (const inv of invList) {
      if (!inv || !Array.isArray(inv.items)) continue;
      const byDept = new Map<ServiceDepartmentId, typeof inv.items>();
      for (const item of inv.items) {
        const deptId = resolveItemDepartment(item);
        const list = byDept.get(deptId) || [];
        list.push({ ...item, departmentId: deptId });
        byDept.set(deptId, list);
      }

      byDept.forEach((deptItems, deptId) => {
        const key = `${inv.invoiceNo}_${deptId}`;
        if (!mapByKey.has(key)) {
          const isPaidOrPartial = inv.status === 'Paid' || inv.status === 'Partial' || inv.isCreditApproved;
          const initialOrderStatus: DepartmentOrderStatus =
            inv.status === 'Cancelled'
              ? 'Cancelled'
              : isPaidOrPartial
              ? 'Ready for Processing'
              : 'Payment Pending';

          mapByKey.set(key, {
            id: `ord-${inv.id}-${deptId}`,
            orderNo: `ORD-${String(inv.invoiceNo).replace(/^INV-/i, '')}-${deptId.slice(0, 3).toUpperCase()}`,
            invoiceId: inv.id,
            invoiceNo: inv.invoiceNo,
            cashMemoNo: inv.cashMemoNo || `CM-${String(inv.invoiceNo).replace(/^INV-/i, '')}`,
            pId: inv.pId,
            oldRegNo: inv.oldRegNo,
            patientName: inv.patientName,
            age: inv.age,
            sex: inv.sex,
            phone: inv.phone,
            address: inv.address,
            drCode: inv.drCode,
            drName: inv.drName,
            departmentId: deptId,
            departmentName: getDepartmentLabel(deptId, 'en'),
            items: deptItems,
            orderDate: inv.date,
            paymentStatus: inv.status,
            orderStatus: initialOrderStatus,
            isCreditApproved: inv.isCreditApproved,
            creditApprovedBy: inv.creditApprovedBy,
            sampleType: deptItems.map((i) => i.sampleType).filter(Boolean).join(', ') || undefined,
            createdAt: inv.createdAt || new Date().toISOString(),
          });
        }
      });
    }

    return Array.from(mapByKey.values());
  }, []);

  const [departmentOrders, setDepartmentOrders] = useState<DepartmentOrder[]>(() => {
    const saved = localStorage.getItem(`${PREFIX}department_orders`);
    const savedInvsRaw = localStorage.getItem(`${PREFIX}invoices`);
    const activeInvs: Invoice[] = savedInvsRaw ? JSON.parse(savedInvsRaw) : initialInvoices;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return buildOrdersFromInvoices(activeInvs, parsed);
        }
      } catch {}
    }
    return buildOrdersFromInvoices(activeInvs, []);
  });

  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>(() => {
    const saved = localStorage.getItem(`${PREFIX}payment_transactions`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  const defaultBillingConfig: BillingConfig = {
    invoicePrefix: 'INV',
    cashMemoPrefix: 'CM',
    maxStaffDiscountPercent: 15,
    allowPartialPaymentRouting: true,
    defaultPrintFormat: 'a4-dual',
    termsAndConditionsBn: '১. রিপোর্ট ডেলিভারির সময় অবশ্যই ক্যাশ মেমো সঙ্গে আনতে হবে। ২. স্যাম্পল প্রদানের পর টেস্ট বাতিল বা রিফান্ডের জন্য কর্তৃপক্ষের অনুমোদন প্রয়োজন।',
    termsAndConditionsEn: '1. Please bring this Cash Memo when collecting reports. 2. Test cancellation or refund after sample collection requires Admin authorization.',
  };

  const [billingConfig, setBillingConfig] = useState<BillingConfig>(() => {
    const saved = localStorage.getItem(`${PREFIX}billing_config`);
    if (saved) {
      try {
        return { ...defaultBillingConfig, ...JSON.parse(saved) };
      } catch {}
    }
    return defaultBillingConfig;
  });

  const updateBillingConfig = (updates: Partial<BillingConfig>) => {
    setBillingConfig((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(`${PREFIX}billing_config`, JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    localStorage.setItem(`${PREFIX}department_orders`, JSON.stringify(departmentOrders));
  }, [departmentOrders]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}payment_transactions`, JSON.stringify(paymentTransactions));
  }, [paymentTransactions]);

  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => {
    const saved = localStorage.getItem(`${PREFIX}rx`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return initialPrescriptions as Prescription[];
  });

  const [ecgReports, setEcgReports] = useState<EcgReport[]>(() => {
    const saved = localStorage.getItem(`${PREFIX}ecg`);
    return saved ? JSON.parse(saved) : [];
  });

  const [xrayReports, setXrayReports] = useState<XrayReport[]>(() => {
    const saved = localStorage.getItem(`${PREFIX}xray`);
    return saved ? JSON.parse(saved) : [];
  });

  const [usgReports, setUsgReports] = useState<UsgReport[]>(() => {
    const saved = localStorage.getItem(`${PREFIX}usg`);
    return saved ? JSON.parse(saved) : [];
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem(`${PREFIX}employees`);
    return saved ? JSON.parse(saved) : initialEmployees;
  });

  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    const saved = localStorage.getItem(`${PREFIX}expenses`);
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  // Doctor Shift Handover State
  const [shiftHandovers, setShiftHandovers] = useState<ShiftHandoverNote[]>(() => {
    const saved = localStorage.getItem(`${PREFIX}shift_handovers`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return initialShiftHandovers;
  });

  const [selectedPatientForReport, setSelectedPatientForReport] = useState<Patient | null>(null);

  // Invoice Print Audit Log state
  const [printLogs, setPrintLogs] = useState<InvoicePrintLog[]>(() => {
    const saved = localStorage.getItem(`${PREFIX}print_logs`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'prt-init-1',
        invoiceId: 'inv-1',
        invoiceNo: 'INV-2026-1001',
        pId: '26100294',
        patientName: 'Titly',
        totalAmount: 950,
        paidAmount: 950,
        dueAmount: 0,
        printedAt: '17-10-2026 10:15 AM',
        printedByUserId: 'usr-1',
        printedByUserName: 'Md. Ariful Islam (adiba)',
        userRole: 'Admin / Cashier',
        workstationCode: 'PC-01',
        copies: 2,
      },
    ];
  });

  // Database Backup History & Automated Daily Snapshots
  const [backupHistory, setBackupHistory] = useState<BackupHistoryEntry[]>(() => {
    const saved = localStorage.getItem(`${PREFIX}backup_history`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'bk-init-1',
        date: '17-10-2026 09:00 AM',
        type: 'Daily Auto',
        filename: 'Adiba_Auto_Daily_Snapshot_2026-10-17.json',
        recordsCount: 165,
        sizeKb: 72,
        status: 'Success',
      },
    ];
  });

  const defaultAutoBackupConfig: AutoBackupScheduleConfig = {
    enabled: true,
    frequency: 'daily',
    lastRunTimestamp: '2026-10-17T09:00:00.000Z',
    nextRunTimestamp: '2026-10-18T09:00:00.000Z',
    autoDownload: false,
    saveToLocalVault: true,
    encryptBackups: true,
    encryptionPassphrase: 'adiba-hospital-2026',
    maxRetainedBackups: 15,
    scopes: {
      patients: true,
      clinicalReports: true,
      billing: true,
      mastersAndStaff: true,
    },
  };

  const [autoBackupConfig, setAutoBackupConfig] = useState<AutoBackupScheduleConfig>(() => {
    const saved = localStorage.getItem(`${PREFIX}auto_backup_config`);
    if (saved) {
      try {
        return { ...defaultAutoBackupConfig, ...JSON.parse(saved) };
      } catch (e) {}
    }
    return defaultAutoBackupConfig;
  });

  const updateAutoBackupConfig = (cfg: Partial<AutoBackupScheduleConfig>) => {
    setAutoBackupConfig((prev) => {
      const updated = { ...prev, ...cfg };
      localStorage.setItem(`${PREFIX}auto_backup_config`, JSON.stringify(updated));
      return updated;
    });
  };

  const [autoDailyBackupEnabled, setAutoDailyBackupEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(`${PREFIX}auto_backup_enabled`);
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [lastAutoBackupDate, setLastAutoBackupDate] = useState<string>(() => {
    return localStorage.getItem(`${PREFIX}last_auto_backup_date`) || '17-10-2026';
  });

  // Calculate days since last successful backup & determine if overdue (>= 7 days)
  const daysSinceLastBackup = (() => {
    if (!backupHistory || backupHistory.length === 0) return 999;
    const successful = backupHistory.filter((b) => b.status === 'Success');
    if (successful.length === 0) return 999;

    const latest = successful[0];
    let timestampMs: number | null = null;

    if (latest.date) {
      const parts = latest.date.split(' ')[0].split('-');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        timestampMs = new Date(y, m, d).getTime();
      } else {
        const parsed = Date.parse(latest.date);
        if (!isNaN(parsed)) timestampMs = parsed;
      }
    }

    if (!timestampMs) return 999;
    const diffMs = Date.now() - timestampMs;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  })();

  const isBackupOverdue = daysSinceLastBackup >= 7;

  // Selected Patient for Overview Modal
  const [selectedPatientForOverview, setSelectedPatientForOverview] = useState<Patient | null>(null);

  const openPatientOverviewModal = (patientIdOrPidOrPatient: string | Patient) => {
    if (typeof patientIdOrPidOrPatient === 'string') {
      const found = patients.find(
        (p) => p.id === patientIdOrPidOrPatient || p.pId === patientIdOrPidOrPatient
      );
      if (found) {
        setSelectedPatientForOverview(found);
      } else {
        const inv = invoices.find((i) => i.pId === patientIdOrPidOrPatient);
        if (inv) {
          const pseudoPatient: Patient = {
            id: `pat-${inv.pId}`,
            pId: inv.pId,
            patientName: inv.patientName,
            age: inv.age,
            sex: inv.sex,
            phone: inv.phone,
            drCode: inv.drCode,
            drName: inv.drName,
            billDate: inv.date,
            invDate: inv.date,
            status: 'Completed',
            department: 'Billing',
            testResults: [],
          };
          setSelectedPatientForOverview(pseudoPatient);
        }
      }
    } else {
      setSelectedPatientForOverview(patientIdOrPidOrPatient);
    }
  };

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState<boolean>(false);

  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(`${PREFIX}2fa_enabled`);
    return saved ? JSON.parse(saved) : false;
  });
  const [is2FAVerified, setIs2FAVerified] = useState<boolean>(true);
  const [open2FAModal, setOpen2FAModal] = useState<boolean>(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Lab Report Completed',
      message: 'Test report for Titly (PId: 26100294) generated and printed successfully.',
      type: 'success',
      timestamp: '10:50 AM',
      read: false,
    },
    {
      id: 'notif-2',
      title: 'Billing Receipt Generated',
      message: 'Invoice INV-2026-1001 for ৳950 processed.',
      type: 'info',
      timestamp: '10:15 AM',
      read: false,
    },
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'Prof. Dr. M. A. Rahman',
      senderRole: 'Doctor',
      message: 'Please expedite the CBC report for patient PId: 26100294 (Titly).',
      timestamp: '10:30 AM',
      channel: 'lab',
    },
    {
      id: 'msg-2',
      sender: 'Lab Receptionist',
      senderRole: 'Reception',
      message: 'Noted Doctor Sir! Automated analyzer has completed the run, verification in progress.',
      timestamp: '10:32 AM',
      channel: 'lab',
    },
    {
      id: 'msg-3',
      sender: 'Lab Technologist',
      senderRole: 'Lab',
      message: 'Report verified and ready for print!',
      timestamp: '10:48 AM',
      channel: 'lab',
    },
  ]);

  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');

  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([
    {
      id: 'log-1',
      level: 'info',
      message: 'Clinical Database initialized with fast local cache & 256-bit encryption layer.',
      timestamp: new Date().toLocaleTimeString(),
      module: 'Core System',
    },
    {
      id: 'log-2',
      level: 'info',
      message: 'Diagnostic test templates loaded for Pathology, ECG, X-Ray & Ultrasound.',
      timestamp: new Date().toLocaleTimeString(),
      module: 'Diagnostics',
    },
  ]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}lang`, lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}theme`, theme);
    document.documentElement.classList.remove('theme-classic', 'theme-modern', 'dark');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'classic') {
      document.documentElement.classList.add('theme-classic');
    } else {
      document.documentElement.classList.add('theme-modern');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}config`, JSON.stringify(clinicConfig));
  }, [clinicConfig]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}doctors`, JSON.stringify(doctors));
  }, [doctors]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}tests`, JSON.stringify(labTests));
  }, [labTests]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}patients`, JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}invoices`, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}rx`, JSON.stringify(prescriptions));
  }, [prescriptions]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}ecg`, JSON.stringify(ecgReports));
  }, [ecgReports]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}xray`, JSON.stringify(xrayReports));
  }, [xrayReports]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}usg`, JSON.stringify(usgReports));
  }, [usgReports]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}employees`, JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}expenses`, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}shift_handovers`, JSON.stringify(shiftHandovers));
  }, [shiftHandovers]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}print_logs`, JSON.stringify(printLogs));
  }, [printLogs]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}backup_history`, JSON.stringify(backupHistory));
  }, [backupHistory]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}auto_backup_enabled`, JSON.stringify(autoDailyBackupEnabled));
  }, [autoDailyBackupEnabled]);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addNotification('অনলাইন মোড চালু', 'ইন্টারনেট কানেকশন সচল হয়েছে — অনলাইন সেন্ট্রাল সার্ভার সিঙ্ক সক্রিয়।', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      addNotification('অফলাইন মোড সক্রিয়', 'পিসিতে ইন্টারনেট সংযোগ নেই — সফটওয়্যার সম্পূর্ণ অফলাইন মোডে সুরক্ষিতভাবে কাজ করছে।', 'warn');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getIntervalMs = (frequency: AutoBackupFrequency): number => {
    switch (frequency) {
      case 'hourly':
        return 60 * 60 * 1000;
      case 'every_6h':
        return 6 * 60 * 60 * 1000;
      case 'every_12h':
        return 12 * 60 * 60 * 1000;
      case 'daily':
      default:
        return 24 * 60 * 60 * 1000;
    }
  };

  const addPrintLog = (logData: Omit<InvoicePrintLog, 'id' | 'printedAt'>): InvoicePrintLog => {
    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const newLog: InvoicePrintLog = {
      ...logData,
      id: `prt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      printedAt: dateFormatted,
    };
    setPrintLogs((prev) => [newLog, ...prev]);

    addAuditLog({
      actionType: 'INVOICE_PRINT',
      username: currentUser?.username || 'system',
      userFullName: currentUser?.fullName || 'Cashier',
      role: currentUser?.role || 'Billing',
      department: 'Billing Counter',
      patientId: logData.pId,
      patientName: logData.patientName,
      details: `ইনভয়েস #${logData.invoiceNo} (টাকা ৳${logData.totalAmount}) প্রিন্ট করা হয়েছে। টার্মিনাল: ${currentWorkstation?.terminalCode || 'PC-01'}, কপি: ${logData.copies}টি।`,
    });

    return newLog;
  };

  const clearPrintLogs = () => {
    addNotification(
      lang === 'bn' ? 'প্রিন্ট লগ সুরক্ষিত' : 'Print History Protected',
      lang === 'bn'
        ? 'প্রিন্ট ও পিডিএফ রেকর্ড অডিট ট্রেইলের অংশ — এটি মুছে ফেলা যাবে না।'
        : 'Print & PDF logs are part of the permanent audit trail and cannot be cleared.',
      'warn'
    );
  };

  const getFullDatabaseDump = (): FullHospitalDatabase => ({
    exportDate: new Date().toISOString(),
    version: '2.8.0',
    clinicConfig,
    doctors,
    labTests,
    patients,
    invoices,
    prescriptions,
    ecgReports,
    xrayReports,
    usgReports,
    employees,
    expenses,
    users,
    auditLogs,
    printLogs,
    shiftHandovers,
  });

  const exportDatabaseJson = () => {
    const data = getFullDatabaseDump();
    downloadDatabaseJson(data);

    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const newEntry: BackupHistoryEntry = {
      id: `bk-${Date.now()}`,
      date: dateStr,
      type: 'Manual JSON',
      filename: `Adiba_Hospital_Full_Backup_${new Date().toISOString().split('T')[0]}.json`,
      recordsCount: invoices.length + patients.length + labTests.length + doctors.length + users.length,
      sizeKb: Math.max(1, Math.round(JSON.stringify(data).length / 1024)),
      status: 'Success',
      summary: {
        patients: patients.length,
        invoices: invoices.length,
        labTests: labTests.length,
        prescriptions: prescriptions.length,
      },
    };
    setBackupHistory((prev) => [newEntry, ...prev.slice(0, 19)]);
    addNotification('ডাটাবেজ ব্যাকআপ সম্পন্ন', 'সম্পূর্ণ হসপিটাল রেকর্ডস JSON ফাইল সফলভাবে ডাউনলোড হয়েছে।', 'success');
  };

  const exportDatabaseSqlDump = () => {
    const data = getFullDatabaseDump();
    downloadDatabaseSql(data);

    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const newEntry: BackupHistoryEntry = {
      id: `bk-${Date.now()}`,
      date: dateStr,
      type: 'Manual SQL',
      filename: `Adiba_Hospital_Database_Dump_${new Date().toISOString().split('T')[0]}.sql`,
      recordsCount: invoices.length + patients.length + labTests.length + doctors.length + users.length,
      sizeKb: Math.max(1, Math.round(JSON.stringify(data).length / 1024)),
      status: 'Success',
    };
    setBackupHistory((prev) => [newEntry, ...prev.slice(0, 19)]);
    addNotification('SQL ডাম্প ডাউনলোড', 'PostgreSQL / MySQL কমপ্লায়েন্ট SQL স্ক্রিপ্ট সফলভাবে প্রস্তুত হয়েছে।', 'success');
  };

  const exportEncryptedDatabaseJson = async (
    passphrase: string,
    scopes = {
      patients: true,
      clinicalReports: true,
      billing: true,
      mastersAndStaff: true,
    }
  ): Promise<{ success: boolean; filename: string; sizeKb: number }> => {
    const fullDb = getFullDatabaseDump();
    const scopedData = filterHospitalDataByScopes(fullDb, scopes);
    const pkg = await encryptHospitalData(
      scopedData,
      passphrase,
      clinicConfig.clinicName,
      currentUser?.fullName || 'Administrator'
    );

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const filename = `Adiba_Encrypted_Backup_${dateStr}.enc.json`;

    downloadEncryptedBackup(pkg, filename);

    const displayDate = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const pkgString = JSON.stringify(pkg);
    const sizeKb = Math.max(1, Math.round(pkgString.length / 1024));

    const newEntry: BackupHistoryEntry = {
      id: `bk-${Date.now()}`,
      date: displayDate,
      type: 'Encrypted JSON',
      filename,
      recordsCount: pkg.header.summary.totalRecords,
      sizeKb,
      status: 'Success',
      isEncrypted: true,
      encryptionAlgorithm: 'AES-256-GCM',
      checksum: pkg.header.checksum,
      scopes: pkg.header.includedScopes,
      vaultData: pkgString,
      summary: {
        patients: pkg.header.summary.patientCount,
        invoices: pkg.header.summary.invoiceCount,
        prescriptions: pkg.header.summary.prescriptionCount,
        imaging:
          pkg.header.summary.ecgReportCount +
          pkg.header.summary.xrayReportCount +
          pkg.header.summary.usgReportCount,
      },
    };

    setBackupHistory((prev) => [newEntry, ...prev.slice(0, 24)]);
    addNotification(
      lang === 'bn' ? 'এনক্রিপ্টেড ব্যাকআপ প্রস্তুত' : 'Encrypted Backup Exported',
      lang === 'bn'
        ? `AES-256-GCM এনক্রিপ্টেড ফাইল (${filename}) সফলভাবে তৈরি ও ডাউনলোড হয়েছে।`
        : `AES-256-GCM encrypted backup file (${filename}) generated and downloaded.`,
      'success'
    );

    addAuditLog({
      actionType: 'SETTINGS_UPDATE',
      details: `এনক্রিপ্টেড ডাটাবেজ ব্যাকআপ এক্সপোর্ট (${filename}) — মোট রেকর্ড: ${pkg.header.summary.totalRecords}, সাইফার: AES-256-GCM.`,
    });

    return { success: true, filename, sizeKb };
  };

  const runAutomatedBackupNow = async (): Promise<{
    success: boolean;
    filename: string;
    sizeKb: number;
    message: string;
  }> => {
    try {
      const fullDb = getFullDatabaseDump();
      const scopedData = filterHospitalDataByScopes(fullDb, autoBackupConfig.scopes);
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const displayDate = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      let filename = `Adiba_Auto_Snapshot_${dateStr}`;
      let pkgString = '';
      let isEnc = false;
      let totalRecs = 0;
      let checksum = '';
      let summaryObj: any = {};

      if (autoBackupConfig.encryptBackups) {
        filename += '.enc.json';
        const key = autoBackupConfig.encryptionPassphrase || clinicConfig.regNo || 'adiba-hospital-2026';
        const pkg = await encryptHospitalData(scopedData, key, clinicConfig.clinicName, 'AutoScheduler');
        pkgString = JSON.stringify(pkg);
        isEnc = true;
        totalRecs = pkg.header.summary.totalRecords;
        checksum = pkg.header.checksum;
        summaryObj = {
          patients: pkg.header.summary.patientCount,
          invoices: pkg.header.summary.invoiceCount,
          prescriptions: pkg.header.summary.prescriptionCount,
          imaging:
            pkg.header.summary.ecgReportCount +
            pkg.header.summary.xrayReportCount +
            pkg.header.summary.usgReportCount,
        };

        if (autoBackupConfig.autoDownload) {
          downloadEncryptedBackup(pkg, filename);
        }
      } else {
        filename += '.json';
        pkgString = JSON.stringify(scopedData, null, 2);
        totalRecs = (scopedData.patients?.length || 0) + (scopedData.invoices?.length || 0);
        summaryObj = {
          patients: scopedData.patients?.length || 0,
          invoices: scopedData.invoices?.length || 0,
        };

        if (autoBackupConfig.autoDownload) {
          const blob = new Blob([pkgString], { type: 'application/json;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }

      const sizeKb = Math.max(1, Math.round(pkgString.length / 1024));
      const newEntry: BackupHistoryEntry = {
        id: `bk-auto-${Date.now()}`,
        date: displayDate,
        type: isEnc ? 'Automated Encrypted' : 'Daily Auto',
        filename,
        recordsCount: totalRecs,
        sizeKb,
        status: 'Success',
        isEncrypted: isEnc,
        encryptionAlgorithm: isEnc ? 'AES-256-GCM' : undefined,
        checksum,
        vaultData: autoBackupConfig.saveToLocalVault ? pkgString : undefined,
        summary: summaryObj,
      };

      setBackupHistory((prev) => [
        newEntry,
        ...prev.slice(0, (autoBackupConfig.maxRetainedBackups || 15) - 1),
      ]);

      const todayIso = now.toISOString().split('T')[0];
      setLastAutoBackupDate(todayIso);
      localStorage.setItem(`${PREFIX}last_auto_backup_date`, todayIso);

      const nextTime = new Date(now.getTime() + getIntervalMs(autoBackupConfig.frequency)).toISOString();
      updateAutoBackupConfig({
        lastRunTimestamp: now.toISOString(),
        nextRunTimestamp: nextTime,
      });

      addNotification(
        lang === 'bn' ? 'স্বয়ংক্রিয় ব্যাকআপ সম্পন্ন' : 'Automated Backup Finished',
        lang === 'bn'
          ? `সফলভাবে ${filename} লোকাল ভল্টে সংরক্ষিত হয়েছে (${sizeKb} KB)।`
          : `Successfully stored ${filename} in local secure vault (${sizeKb} KB).`,
        'success'
      );

      return {
        success: true,
        filename,
        sizeKb,
        message: 'Automated backup completed successfully.',
      };
    } catch (err: any) {
      addNotification('Auto Backup Error', err?.message || 'Failed to complete auto backup', 'error');
      return {
        success: false,
        filename: '',
        sizeKb: 0,
        message: err?.message || 'Failed',
      };
    }
  };

  // Automated Backup Background Scheduler Interval
  useEffect(() => {
    if (!autoBackupConfig.enabled) return;

    const checkAndRunScheduler = () => {
      const now = Date.now();
      const intervalMs = getIntervalMs(autoBackupConfig.frequency);
      const lastTime = autoBackupConfig.lastRunTimestamp
        ? new Date(autoBackupConfig.lastRunTimestamp).getTime()
        : 0;

      if (now - lastTime >= intervalMs) {
        runAutomatedBackupNow();
      }
    };

    const initialTimer = setTimeout(checkAndRunScheduler, 4000);
    const interval = setInterval(checkAndRunScheduler, 30000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [autoBackupConfig.enabled, autoBackupConfig.frequency, autoBackupConfig.lastRunTimestamp]);

  const restoreDatabaseFromJson = (jsonInput: any): { success: boolean; message: string } => {
    try {
      const parsed = typeof jsonInput === 'string' ? JSON.parse(jsonInput) : jsonInput;
      if (!parsed) {
        return { success: false, message: 'Invalid or empty backup file format.' };
      }
      if (parsed.clinicConfig) setClinicConfig(parsed.clinicConfig);
      if (Array.isArray(parsed.doctors)) setDoctors(parsed.doctors);
      if (Array.isArray(parsed.labTests)) setLabTests(parsed.labTests);
      if (Array.isArray(parsed.patients)) setPatients(parsed.patients);
      if (Array.isArray(parsed.invoices)) setInvoices(parsed.invoices);
      if (Array.isArray(parsed.prescriptions)) setPrescriptions(parsed.prescriptions);
      if (Array.isArray(parsed.ecgReports)) setEcgReports(parsed.ecgReports);
      if (Array.isArray(parsed.xrayReports)) setXrayReports(parsed.xrayReports);
      if (Array.isArray(parsed.usgReports)) setUsgReports(parsed.usgReports);
      if (Array.isArray(parsed.employees)) setEmployees(parsed.employees);
      if (Array.isArray(parsed.expenses)) setExpenses(parsed.expenses);
      if (Array.isArray(parsed.users)) setUsers(parsed.users);
      if (Array.isArray(parsed.printLogs)) setPrintLogs(parsed.printLogs);

      const restoreEntry: BackupHistoryEntry = {
        id: `bk-${Date.now()}`,
        date: new Date().toLocaleDateString(),
        type: 'Manual JSON',
        filename: 'Restored from uploaded snapshot',
        recordsCount: (parsed.invoices?.length || 0) + (parsed.patients?.length || 0),
        sizeKb: Math.max(1, Math.round(JSON.stringify(parsed).length / 1024)),
        status: 'Restored',
      };
      setBackupHistory((prev) => [restoreEntry, ...prev]);

      addNotification('সিস্টেম পুনরুদ্ধার সম্পন্ন', 'ব্যাকআপ থেকে ক্লিনিক ডাটাবেজ সফলভাবে রিস্টোর হয়েছে।', 'success');
      return { success: true, message: 'Hospital database records successfully restored.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to restore database from backup file.' };
    }
  };

  const decryptAndRestoreDatabase = async (
    rawContent: string,
    passphrase?: string,
    mergeMode: 'replace' | 'merge' = 'replace'
  ): Promise<{ success: boolean; message: string; summary?: any }> => {
    try {
      let parsed: any;
      try {
        parsed = JSON.parse(rawContent);
      } catch {
        return { success: false, message: 'Invalid JSON format in backup file.' };
      }

      let payload: any = parsed;

      if (isEncryptedBackupPackage(parsed)) {
        if (!passphrase) {
          return { success: false, message: 'Decryption passphrase required for this encrypted backup.' };
        }
        const decResult = await decryptHospitalData(parsed, passphrase);
        if (!decResult.success || !decResult.data) {
          return { success: false, message: decResult.error || 'Decryption failed. Incorrect passphrase.' };
        }
        payload = decResult.data;
      }

      if (!payload || typeof payload !== 'object') {
        return { success: false, message: 'Invalid database payload structure.' };
      }

      if (mergeMode === 'replace') {
        if (payload.clinicConfig) setClinicConfig(payload.clinicConfig);
        if (Array.isArray(payload.doctors)) setDoctors(payload.doctors);
        if (Array.isArray(payload.labTests)) setLabTests(payload.labTests);
        if (Array.isArray(payload.patients)) setPatients(payload.patients);
        if (Array.isArray(payload.invoices)) setInvoices(payload.invoices);
        if (Array.isArray(payload.prescriptions)) setPrescriptions(payload.prescriptions);
        if (Array.isArray(payload.ecgReports)) setEcgReports(payload.ecgReports);
        if (Array.isArray(payload.xrayReports)) setXrayReports(payload.xrayReports);
        if (Array.isArray(payload.usgReports)) setUsgReports(payload.usgReports);
        if (Array.isArray(payload.employees)) setEmployees(payload.employees);
        if (Array.isArray(payload.expenses)) setExpenses(payload.expenses);
        if (Array.isArray(payload.users)) setUsers(payload.users);
      } else {
        if (Array.isArray(payload.patients)) {
          setPatients((prev) => {
            const existingPids = new Set(prev.map((p) => p.pId));
            const newPatients = payload.patients.filter((p: Patient) => !existingPids.has(p.pId));
            return [...prev, ...newPatients];
          });
        }
        if (Array.isArray(payload.invoices)) {
          setInvoices((prev) => {
            const existingInvs = new Set(prev.map((i) => i.invoiceNo));
            const newInvs = payload.invoices.filter((i: Invoice) => !existingInvs.has(i.invoiceNo));
            return [...prev, ...newInvs];
          });
        }
        if (Array.isArray(payload.prescriptions)) {
          setPrescriptions((prev) => {
            const existingIds = new Set(prev.map((r) => r.id));
            const newRx = payload.prescriptions.filter((r: Prescription) => !existingIds.has(r.id));
            return [...prev, ...newRx];
          });
        }
      }

      const now = new Date();
      const displayDate = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const totalRecs = (payload.patients?.length || 0) + (payload.invoices?.length || 0);

      const restoreEntry: BackupHistoryEntry = {
        id: `bk-restore-${Date.now()}`,
        date: displayDate,
        type: isEncryptedBackupPackage(parsed) ? 'Encrypted JSON' : 'Manual JSON',
        filename: isEncryptedBackupPackage(parsed) ? 'Restored Encrypted Snapshot' : 'Restored JSON Snapshot',
        recordsCount: totalRecs,
        sizeKb: Math.max(1, Math.round(rawContent.length / 1024)),
        status: 'Restored',
        isEncrypted: isEncryptedBackupPackage(parsed),
      };
      setBackupHistory((prev) => [restoreEntry, ...prev]);

      addNotification(
        lang === 'bn' ? 'সিস্টেম সফলভাবে রিস্টোর হয়েছে' : 'Database Restored Successfully',
        lang === 'bn'
          ? `মোট ${payload.patients?.length || 0} জন রোগী ও ${payload.invoices?.length || 0} টি ইনভয়েস সফলভাবে রিস্টোর হয়েছে (${mergeMode === 'merge' ? 'মার্জ মোড' : 'সম্পূর্ণ প্রতিস্থাপন'})।`
          : `Restored ${payload.patients?.length || 0} patients and ${payload.invoices?.length || 0} invoices.`,
        'success'
      );

      addAuditLog({
        actionType: 'SETTINGS_UPDATE',
        details: `ডাটাবেজ ব্যাকআপ রিস্টোর সম্পন্ন (${mergeMode}) - মোট রোগী: ${payload.patients?.length || 0}, ইনভয়েস: ${payload.invoices?.length || 0}`,
      });

      return {
        success: true,
        message: 'Hospital database records successfully restored.',
        summary: {
          patients: payload.patients?.length || 0,
          invoices: payload.invoices?.length || 0,
          prescriptions: payload.prescriptions?.length || 0,
          doctors: payload.doctors?.length || 0,
          labTests: payload.labTests?.length || 0,
        },
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Restore failed.' };
    }
  };

  const deleteBackupHistoryEntry = (id: string) => {
    const target = backupHistory.find((b) => b.id === id);
    if (!target) return;
    requestDeleteRecord({
      entityType: 'backupHistory',
      entityLabel: 'ব্যাকআপ স্ন্যাপশট (Backup Snapshot)',
      recordId: target.id,
      recordTitle: target.filename,
      recordSubtitle: `Date: ${target.date} · Size: ${target.sizeKb} KB`,
      originalData: target,
    });
  };

  const clearAllLocalVaultBackups = () => {
    requestDeleteRecord({
      entityType: 'backupHistory',
      entityLabel: 'সকল লোকাল ব্যাকআপ ভল্ট (All Local Vault Backups)',
      recordId: 'ALL_VAULT_BACKUPS',
      recordTitle: 'Clear All Local Vault Backups',
      recordSubtitle: `${backupHistory.length} local backup snapshot(s)`,
      originalData: backupHistory,
    });
  };

  const t = (translations as any)[lang] || (translations as any).bn;

  const updateClinicConfig = (config: Partial<ClinicConfig>) => {
    setClinicConfig((prev) => ({ ...prev, ...config }));
    addLog('info', 'Clinic configuration updated', 'Settings');
  };

  const addDoctor = (doc: Omit<Doctor, 'id'>): Doctor => {
    const newDoc: Doctor = { ...doc, id: `doc-${Date.now()}` };
    setDoctors((prev) => [...prev, newDoc]);
    addNotification('New Doctor Added', `${newDoc.name} (${newDoc.code}) was registered into the system.`, 'info');
    addLog('info', `Doctor ${newDoc.name} (${newDoc.code}) added`, 'Doctor Master');
    return newDoc;
  };

  const updateDoctor = (id: string, doc: Partial<Doctor>) => {
    setDoctors((prev) => prev.map((d) => (d.id === id ? { ...d, ...doc } : d)));
  };

  const deleteDoctor = (id: string) => {
    const target = doctors.find((d) => d.id === id);
    if (!target) return;
    const refCount = patients.filter((p) => p.drCode === target.code || p.drName === target.name).length;
    const deps = refCount > 0 ? [`${refCount} জন রোগীর রেফারেন্স ডাক্তার হিসেবে যুক্ত`] : [];
    requestDeleteRecord({
      entityType: 'doctor',
      entityLabel: 'ডাক্তার প্রোফাইল (Doctor Profile)',
      recordId: target.id,
      recordTitle: `${target.name} (${target.code})`,
      recordSubtitle: `${target.degree} · ${target.specialty}`,
      dependencies: deps,
      originalData: target,
    });
  };

  const addLabTest = (test: Omit<LabTest, 'id'>): LabTest => {
    const newTest: LabTest = { ...test, id: `test-${Date.now()}` };
    setLabTests((prev) => [...prev, newTest]);
    addLog('info', `Test ${newTest.name} added`, 'Lab Master');
    return newTest;
  };

  const updateLabTest = (id: string, test: Partial<LabTest>) => {
    setLabTests((prev) => prev.map((t) => (t.id === id ? { ...t, ...test } : t)));
    addNotification('Test Updated', `Test parameters and rates updated successfully.`, 'info');
  };

  const deleteLabTest = (id: string) => {
    const target = labTests.find((t) => t.id === id);
    if (!target) return;
    requestDeleteRecord({
      entityType: 'labTest',
      entityLabel: 'প্যাথলজি টেস্ট টেমপ্লেট (Lab Test Master)',
      recordId: target.id,
      recordTitle: `${target.name} (${target.code})`,
      recordSubtitle: `${target.category} · Rate: ৳${target.price}`,
      originalData: target,
    });
  };

  const resetLabTestsToDefault = () => {
    const baseCatalog = mergeServiceCatalogWithDoctors(
      getMergedPathologyCatalog(initialLabTests),
      doctors
    );
    setLabTests(baseCatalog);
    localStorage.setItem(`${PREFIX}tests`, JSON.stringify(baseCatalog));
    addNotification(
      lang === 'bn' ? 'টেস্ট ও সার্ভিস ডাটাবেজ পুনরুদ্ধার' : 'Service Master Restored',
      lang === 'bn'
        ? 'বাংলাদেশের স্ট্যান্ডার্ড প্যাথলজি, এক্স-রে, আল্ট্রাসনোগ্রাফি, ইসিজি ও ডাক্তার কনসালটেশন মাস্টার ক্যাটালগ সফলভাবে রিস্টোর হয়েছে।'
        : 'Comprehensive Bangladesh diagnostic & hospital service master catalog restored.',
      'success'
    );
  };

  const addPatient = (pat: Omit<Patient, 'id'>): Patient => {
    const newPat: Patient = { ...pat, id: `pat-${Date.now()}`, createdAt: new Date().toISOString() };
    setPatients((prev) => [newPat, ...prev]);
    addNotification('New Patient Record', `Patient ${newPat.patientName} (PId: ${newPat.pId}) registered.`, 'info');
    addLog('info', `Patient ${newPat.patientName} (PId: ${newPat.pId}) created`, 'Pathology');
    return newPat;
  };

  const updatePatient = (id: string, pat: Partial<Patient>) => {
    setPatients((prev) => prev.map((p) => (p.id === id || p.pId === id ? { ...p, ...pat } : p)));
  };

  const deletePatient = (id: string) => {
    const target = patients.find((p) => p.id === id || p.pId === id);
    if (!target) return;
    const linkedInvs = invoices.filter((i) => i.pId === target.pId);
    const deps: string[] = [];
    if (linkedInvs.length > 0) {
      deps.push(`${linkedInvs.length}টি ইনভয়েস যুক্ত (${linkedInvs.map((i) => i.invoiceNo).join(', ')})`);
    }
    if (target.testResults && target.testResults.length > 0) {
      deps.push(`${target.testResults.length}টি প্যাথলজি টেস্ট প্যারামিটার যুক্ত`);
    }
    requestDeleteRecord({
      entityType: 'patient',
      entityLabel: 'রোগীর রেকর্ড ও রিপোর্ট (Patient & Lab Order)',
      recordId: target.id,
      recordTitle: `${target.patientName} (PID: ${target.pId})`,
      recordSubtitle: `Age: ${target.age} · Sex: ${target.sex} · Status: ${target.status}`,
      dependencies: deps,
      originalData: target,
    });
  };

  const addInvoice = (inv: Omit<Invoice, 'id'>): Invoice => {
    const nowIso = new Date().toISOString();
    const nowReadable = nowIso.replace('T', ' ').slice(0, 19);
    const invId = `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const suffix = inv.invoiceNo ? inv.invoiceNo.replace(/^INV-/i, '') : `${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const cashMemoNo = inv.cashMemoNo || `${billingConfig.cashMemoPrefix || 'CM'}-${suffix}`;

    // Enrich items with resolved departmentId and snapshot pricing
    const enrichedItems = (inv.items || []).map((it) => {
      const deptId = resolveItemDepartment(it);
      const qty = Math.max(1, Number(it.quantity) || 1);
      const unitPrice = Number(it.unitPrice ?? it.price) || 0;
      const discAmt = Math.max(0, Number(it.discountAmount) || 0);
      const lineTotal = Math.max(0, qty * unitPrice - discAmt);
      return {
        ...it,
        departmentId: deptId,
        quantity: qty,
        unitPrice,
        discountAmount: discAmt,
        price: lineTotal,
      };
    });

    const initialPaymentTx: PaymentTransaction | undefined =
      inv.paidAmount > 0
        ? {
            id: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            receiptNo: `RCP-${suffix}`,
            invoiceId: invId,
            invoiceNo: inv.invoiceNo,
            cashMemoNo,
            pId: inv.pId,
            patientName: inv.patientName,
            amount: inv.paidAmount,
            type: 'INITIAL_PAYMENT',
            paymentMethod: inv.paymentMethod || 'Cash',
            transactionReference: inv.transactionReference,
            receivedBy: currentUser?.fullName || inv.cashierName || 'Billing Counter',
            receivedByRole: currentUser?.role || 'Billing',
            workstationCode: currentWorkstation?.terminalCode || 'PC-01',
            timestamp: nowReadable,
            note: `Initial payment for Bill #${inv.invoiceNo}`,
          }
        : undefined;

    // Group items by performing department and generate DepartmentOrder records
    const itemsByDept = new Map<ServiceDepartmentId, typeof enrichedItems>();
    for (const item of enrichedItems) {
      const dId = item.departmentId || 'pathology';
      const arr = itemsByDept.get(dId) || [];
      arr.push(item);
      itemsByDept.set(dId, arr);
    }

    const canProcessImmediately =
      inv.status === 'Paid' ||
      inv.isCreditApproved ||
      (inv.status === 'Partial' && billingConfig.allowPartialPaymentRouting);

    const newOrders: DepartmentOrder[] = [];
    itemsByDept.forEach((deptItems, deptId) => {
      const orderId = `ord-${Date.now()}-${deptId}-${Math.floor(Math.random() * 1000)}`;
      const orderNo = `ORD-${suffix}-${deptId.slice(0, 3).toUpperCase()}`;
      const orderStatus: DepartmentOrderStatus = canProcessImmediately
        ? 'Ready for Processing'
        : 'Payment Pending';

      newOrders.push({
        id: orderId,
        orderNo,
        invoiceId: invId,
        invoiceNo: inv.invoiceNo,
        cashMemoNo,
        pId: inv.pId,
        oldRegNo: inv.oldRegNo,
        patientName: inv.patientName,
        age: inv.age,
        sex: inv.sex,
        phone: inv.phone,
        address: inv.address,
        drCode: inv.drCode,
        drName: inv.drName,
        doctorId: deptItems.find((i) => i.doctorId)?.doctorId,
        departmentId: deptId,
        departmentName: getDepartmentLabel(deptId, 'en'),
        items: deptItems.map((i) => ({ ...i, orderId })),
        orderDate: inv.date,
        paymentStatus: inv.status,
        orderStatus,
        isCreditApproved: inv.isCreditApproved,
        creditApprovedBy: inv.creditApprovedBy,
        sampleType: deptItems.map((i) => i.sampleType).filter(Boolean).join(', ') || undefined,
        createdAt: nowIso,
      });
    });

    const newInv: Invoice = {
      ...inv,
      id: invId,
      cashMemoNo,
      items: enrichedItems,
      payments: initialPaymentTx ? [initialPaymentTx] : [],
      departmentOrderIds: newOrders.map((o) => o.id),
      cashierName: currentUser?.fullName || inv.cashierName || 'Billing Officer',
      workstationCode: currentWorkstation?.terminalCode || 'PC-01',
      reprintCount: 0,
      createdAt: nowIso,
    };

    setInvoices((prev) => [newInv, ...prev]);
    if (initialPaymentTx) {
      setPaymentTransactions((prev) => [initialPaymentTx, ...prev]);
    }
    if (newOrders.length > 0) {
      setDepartmentOrders((prev) => [...newOrders, ...prev]);
    }

    // 1. AUTO-ROUTE TO PATHOLOGY WORKLIST (if Pathology items exist on the bill)
    const pathologyItems = itemsByDept.get('pathology') || [];
    let createdPathologyPatient: Patient | undefined;

    if (pathologyItems.length > 0) {
      const formattedTests = convertInvoiceItemsToTestResults(
        pathologyItems,
        labTests,
        newInv.sex,
        newInv.age
      );
      const accessionNo = `ACC-${suffix}`;
      const fallbackTests: TestResultItem[] = pathologyItems.map((it) => ({
        testName: it.testName || (it as any).name || 'Lab Investigation',
        result: '',
        unit: '',
        normalRange: '',
        status: 'Normal' as const,
        inputType: 'text' as const,
      }));
      const effectiveTests = formattedTests.length > 0 ? formattedTests : fallbackTests;

      createdPathologyPatient = {
        id: `pat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        pId: newInv.pId,
        oldRegNo: newInv.oldRegNo,
        accessionNo,
        invoiceNo: newInv.invoiceNo,
        cashMemoNo,
        invDate: newInv.date,
        billDate: newInv.date,
        patientName: newInv.patientName,
        age: newInv.age,
        sex: newInv.sex,
        phone: newInv.phone,
        address: newInv.address,
        drCode: newInv.drCode,
        drName: newInv.drName,
        status: 'Pending',
        workflowStatus: 'Pending',
        paymentStatus: newInv.status,
        department: 'Pathology',
        sampleType: pathologyItems.map((i) => i.sampleType).filter(Boolean).join(', ') || 'Blood / Urine',
        testResults: effectiveTests,
        autoPrint: true,
        createdAt: nowIso,
      };

      const patToSave = createdPathologyPatient;
      setPatients((prev) => {
        // Match only if there is an existing record for the EXACT same invoiceNo
        const sameInvoiceIdx = prev.findIndex(
          (p) => p.invoiceNo && p.invoiceNo === newInv.invoiceNo
        );
        if (sameInvoiceIdx >= 0) {
          const updated = [...prev];
          updated[sameInvoiceIdx] = { ...updated[sameInvoiceIdx], ...patToSave, id: updated[sameInvoiceIdx].id };
          return updated;
        }
        return [patToSave, ...prev];
      });
    }

    // 2. AUTO-ROUTE TO DOCTOR VISIT / OPD QUEUE (if Doctor Consultation items exist on the bill)
    const doctorVisitItems = itemsByDept.get('doctorVisit') || [];
    let createdOpdAppointment: OpdAppointmentRecord | undefined;

    if (doctorVisitItems.length > 0) {
      const firstDocItem = doctorVisitItems[0];
      const matchedDoctor =
        doctors.find(
          (d) =>
            d.id === firstDocItem.doctorId ||
            d.code === newInv.drCode ||
            firstDocItem.testName.toLowerCase().includes(d.name.toLowerCase())
        ) || doctors[0];

      const todayApptsCount = opdAppointments.filter((a) => a.date === newInv.date).length;
      const tokenNo = `T-${String(todayApptsCount + 1).padStart(2, '0')}`;

      createdOpdAppointment = {
        id: `opd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        tokenNo,
        pId: newInv.pId,
        invoiceNo: newInv.invoiceNo,
        orderId: newOrders.find((o) => o.departmentId === 'doctorVisit')?.id,
        patientName: newInv.patientName,
        age: newInv.age,
        gender: newInv.sex,
        phone: newInv.phone,
        doctorId: matchedDoctor?.id || '1',
        doctorName: matchedDoctor?.name || newInv.drName || 'Consultant Doctor',
        date: newInv.date,
        timeSlot: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        visitType: 'New Visit',
        fee: firstDocItem.price,
        paymentStatus: newInv.status === 'Paid' ? 'Paid' : newInv.status === 'Partial' ? 'Partial' : 'Unpaid',
        status: 'Waiting',
        chiefComplaint: `Routed from Billing (#${newInv.invoiceNo})`,
        createdAt: nowIso,
      };

      const apptToSave = createdOpdAppointment;
      setOpdAppointments((prev) => [apptToSave, ...prev]);
    }

    // 3. Persist atomically to backend /api/billing/finalize with idempotency key
    const idempotencyKey = inv.idempotencyKey || `BILL-FIN-${newInv.invoiceNo}`;
    fetch('/api/billing/finalize', {
      method: 'POST',
      headers: getActorHeaders(),
      body: JSON.stringify({
        idempotencyKey,
        invoice: newInv,
        initialPayment: initialPaymentTx,
        departmentOrders: newOrders,
        pathologyPatient: createdPathologyPatient,
        opdAppointment: createdOpdAppointment,
      }),
    }).catch(() => {});

    const routedDeptNames = newOrders.map((o) => o.departmentName).join(', ');
    addNotification(
      lang === 'bn' ? 'বিল সম্পন্ন ও ডিপার্টমেন্টে প্রেরণ' : 'Bill Finalized & Routed',
      lang === 'bn'
        ? `বিল #${newInv.invoiceNo} (মেমো #${cashMemoNo}) সম্পন্ন। স্বয়ংক্রিয়ভাবে প্রেরিত বিভাগ: ${routedDeptNames || 'Billing'}।`
        : `Invoice ${newInv.invoiceNo} (Memo ${cashMemoNo}) issued. Auto-routed to: ${routedDeptNames || 'Billing'}.`,
      'success'
    );
    addLog(
      'info',
      `Invoice ${newInv.invoiceNo} created for ${newInv.patientName} (${newInv.pId}). Routed to: ${routedDeptNames}`,
      'Billing'
    );

    // LAN Activity Audit & Real-time cross-workstation broadcast
    addAuditLog({
      actionType: 'INVOICE_CREATE',
      patientId: newInv.pId,
      patientName: newInv.patientName,
      details: `ইনভয়েস ${newInv.invoiceNo} (ক্যাশ মেমো ${cashMemoNo}) তৈরি হয়েছে — পেশেন্ট: ${newInv.patientName} (PID: ${newInv.pId}), নিট বিল: ৳${newInv.netTotal}, পরিশোধ: ৳${newInv.paidAmount}, বকেয়া: ৳${newInv.dueAmount}। স্বয়ংক্রিয়ভাবে প্রেরিত বিভাগ: ${routedDeptNames}।`,
    });

    broadcastLanEvent('INVOICE_CREATED', {
      invoiceNo: newInv.invoiceNo,
      cashMemoNo,
      pId: newInv.pId,
      patientName: newInv.patientName,
      age: newInv.age,
      sex: newInv.sex,
      items: enrichedItems,
      departmentOrders: newOrders,
    });

    return newInv;
  };

  const collectInvoiceDue = async (params: {
    invoiceId: string;
    amount: number;
    paymentMethod: string;
    transactionReference?: string;
    note?: string;
  }): Promise<{ success: boolean; receiptNo?: string; error?: string }> => {
    const targetInv = invoices.find(
      (i) => i.id === params.invoiceId || i.invoiceNo === params.invoiceId
    );
    if (!targetInv) {
      return { success: false, error: 'Invoice not found.' };
    }
    const collectAmt = Math.min(Math.max(0, Number(params.amount) || 0), targetInv.dueAmount);
    if (collectAmt <= 0) {
      return { success: false, error: 'Collection amount must be greater than zero.' };
    }

    const nowIso = new Date().toISOString();
    const nowReadable = nowIso.replace('T', ' ').slice(0, 19);
    const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;
    const newPaid = targetInv.paidAmount + collectAmt;
    const newDue = Math.max(0, targetInv.netTotal - newPaid);
    const newStatus: Invoice['status'] = newDue <= 0 ? 'Paid' : 'Partial';

    const paymentTx: PaymentTransaction = {
      id: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      receiptNo,
      invoiceId: targetInv.id,
      invoiceNo: targetInv.invoiceNo,
      cashMemoNo: targetInv.cashMemoNo,
      pId: targetInv.pId,
      patientName: targetInv.patientName,
      amount: collectAmt,
      type: 'DUE_COLLECTION',
      paymentMethod: params.paymentMethod || 'Cash',
      transactionReference: params.transactionReference,
      receivedBy: currentUser?.fullName || 'Cashier',
      receivedByRole: currentUser?.role || 'Billing',
      workstationCode: currentWorkstation?.terminalCode || 'PC-01',
      timestamp: nowReadable,
      note: params.note || `Due collection against Bill #${targetInv.invoiceNo}`,
    };

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== targetInv.id && inv.invoiceNo !== targetInv.invoiceNo) return inv;
        const existingPayments = Array.isArray(inv.payments) ? inv.payments : [];
        return {
          ...inv,
          paidAmount: newPaid,
          dueAmount: newDue,
          status: newStatus,
          payments: [...existingPayments, paymentTx],
          updatedAt: nowIso,
        };
      })
    );

    setPaymentTransactions((prev) => [paymentTx, ...prev]);

    setDepartmentOrders((prev) =>
      prev.map((ord) => {
        if (ord.invoiceId !== targetInv.id && ord.invoiceNo !== targetInv.invoiceNo) return ord;
        return {
          ...ord,
          paymentStatus: newStatus,
          orderStatus:
            ord.orderStatus === 'Payment Pending' ? 'Ready for Processing' : ord.orderStatus,
          updatedAt: nowIso,
        };
      })
    );

    setPatients((prev) =>
      prev.map((p) => (p.invoiceNo === targetInv.invoiceNo ? { ...p, paymentStatus: newStatus } : p))
    );

    try {
      await fetch('/api/billing/collect-due', {
        method: 'POST',
        headers: getActorHeaders(),
        body: JSON.stringify({
          invoiceId: targetInv.id,
          invoiceNo: targetInv.invoiceNo,
          amount: collectAmt,
          paymentMethod: params.paymentMethod,
          transactionReference: params.transactionReference,
          note: params.note,
          receiptNo,
        }),
      });
    } catch {}

    addNotification(
      lang === 'bn' ? 'বকেয়া বিল আদায় সম্পন্ন' : 'Due Payment Collected',
      lang === 'bn'
        ? `বিল #${targetInv.invoiceNo}-এর বিপরীতে ৳${collectAmt} আদায় হয়েছে (রসিদ #${receiptNo})। বর্তমান বকেয়া: ৳${newDue}।`
        : `Collected ৳${collectAmt} for Bill #${targetInv.invoiceNo} (Receipt #${receiptNo}). Remaining Due: ৳${newDue}.`,
      'success'
    );

    return { success: true, receiptNo };
  };

  const cancelOrRefundInvoice = async (params: {
    invoiceId: string;
    actionType: 'CANCEL' | 'REFUND';
    refundAmount: number;
    paymentMethod?: string;
    reason: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const trimmedReason = String(params.reason || '').trim();
    if (!trimmedReason) {
      return { success: false, error: 'Reason is mandatory for bill cancellation or refund.' };
    }

    const targetInv = invoices.find(
      (i) => i.id === params.invoiceId || i.invoiceNo === params.invoiceId
    );
    if (!targetInv) {
      return { success: false, error: 'Invoice not found.' };
    }

    const nowIso = new Date().toISOString();
    const nowReadable = nowIso.replace('T', ' ').slice(0, 19);
    const refAmt = Math.min(Math.max(0, Number(params.refundAmount) || 0), targetInv.paidAmount);
    const newPaid = Math.max(0, targetInv.paidAmount - refAmt);
    const isCancel = params.actionType === 'CANCEL';
    const newStatus: Invoice['status'] = isCancel
      ? 'Cancelled'
      : refAmt > 0 && newPaid === 0
      ? 'Refunded'
      : newPaid >= targetInv.netTotal
      ? 'Paid'
      : newPaid > 0
      ? 'Partial'
      : 'Due';

    const refundTx: PaymentTransaction | null =
      refAmt > 0
        ? {
            id: `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            receiptNo: `RFN-${Date.now().toString().slice(-6)}`,
            invoiceId: targetInv.id,
            invoiceNo: targetInv.invoiceNo,
            cashMemoNo: targetInv.cashMemoNo,
            pId: targetInv.pId,
            patientName: targetInv.patientName,
            amount: -refAmt,
            type: 'REFUND',
            paymentMethod: params.paymentMethod || 'Cash',
            receivedBy: currentUser?.fullName || 'Admin',
            receivedByRole: currentUser?.role || 'Admin',
            workstationCode: currentWorkstation?.terminalCode || 'PC-01',
            timestamp: nowReadable,
            note: `${params.actionType}: ${trimmedReason}`,
          }
        : null;

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== targetInv.id && inv.invoiceNo !== targetInv.invoiceNo) return inv;
        const existingPayments = Array.isArray(inv.payments) ? inv.payments : [];
        return {
          ...inv,
          paidAmount: newPaid,
          dueAmount: isCancel ? 0 : Math.max(0, inv.netTotal - newPaid),
          refundAmount: (inv.refundAmount || 0) + refAmt,
          status: newStatus,
          isCancelled: isCancel ? true : inv.isCancelled,
          cancelledAt: isCancel ? nowReadable : inv.cancelledAt,
          cancelledBy: isCancel ? currentUser?.fullName || 'Admin' : inv.cancelledBy,
          cancelReason: trimmedReason,
          payments: refundTx ? [...existingPayments, refundTx] : existingPayments,
          updatedAt: nowIso,
        };
      })
    );

    if (refundTx) {
      setPaymentTransactions((prev) => [refundTx, ...prev]);
    }

    setDepartmentOrders((prev) =>
      prev.map((ord) => {
        if (ord.invoiceId !== targetInv.id && ord.invoiceNo !== targetInv.invoiceNo) return ord;
        return {
          ...ord,
          paymentStatus: newStatus,
          orderStatus: isCancel ? 'Cancelled' : ord.orderStatus,
          cancelledAt: isCancel ? nowReadable : ord.cancelledAt,
          cancelReason: isCancel ? trimmedReason : ord.cancelReason,
          updatedAt: nowIso,
        };
      })
    );

    if (isCancel) {
      setPatients((prev) =>
        prev.map((p) =>
          p.invoiceNo === targetInv.invoiceNo
            ? { ...p, workflowStatus: 'Cancelled', paymentStatus: 'Cancelled' }
            : p
        )
      );
      setOpdAppointments((prev) =>
        prev.map((a) =>
          a.invoiceNo === targetInv.invoiceNo ? { ...a, status: 'Cancelled' } : a
        )
      );
    }

    try {
      await fetch('/api/billing/refund-or-cancel', {
        method: 'POST',
        headers: getActorHeaders(),
        body: JSON.stringify({
          invoiceId: targetInv.id,
          invoiceNo: targetInv.invoiceNo,
          actionType: params.actionType,
          refundAmount: refAmt,
          paymentMethod: params.paymentMethod || 'Cash',
          reason: trimmedReason,
        }),
      });
    } catch {}

    addNotification(
      isCancel
        ? lang === 'bn'
          ? 'বিল বাতিল (Cancelled)'
          : 'Bill Cancelled'
        : lang === 'bn'
        ? 'রিফান্ড সম্পন্ন (Refunded)'
        : 'Refund Processed',
      `Bill #${targetInv.invoiceNo} updated (${newStatus}). Refunded: ৳${refAmt}.`,
      'warn'
    );

    return { success: true };
  };

  const updateDepartmentOrderStatus = async (
    orderId: string,
    orderStatus: DepartmentOrderStatus,
    extra?: { reportId?: string; notes?: string }
  ) => {
    const nowIso = new Date().toISOString();
    const nowReadable = nowIso.replace('T', ' ').slice(0, 19);

    setDepartmentOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId && ord.orderNo !== orderId) return ord;
        return {
          ...ord,
          orderStatus,
          sampleCollectedAt:
            orderStatus === 'Sample Collected'
              ? ord.sampleCollectedAt || nowReadable
              : ord.sampleCollectedAt,
          sampleCollectedBy:
            orderStatus === 'Sample Collected'
              ? ord.sampleCollectedBy || currentUser?.fullName || 'Staff'
              : ord.sampleCollectedBy,
          resultEnteredAt:
            orderStatus === 'Result Entered' || orderStatus === 'Completed'
              ? ord.resultEnteredAt || nowReadable
              : ord.resultEnteredAt,
          completedAt: orderStatus === 'Completed' ? nowReadable : ord.completedAt,
          reportId: extra?.reportId || ord.reportId,
          notes: extra?.notes !== undefined ? extra.notes : ord.notes,
          updatedAt: nowIso,
        };
      })
    );

    try {
      await fetch('/api/orders/update-status', {
        method: 'POST',
        headers: getActorHeaders(),
        body: JSON.stringify({
          orderId,
          orderStatus,
          reportId: extra?.reportId,
          notes: extra?.notes,
        }),
      });
    } catch {}
  };

  const updateInvoice = (id: string, updated: Partial<Invoice>) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id || inv.invoiceNo === id ? { ...inv, ...updated } : inv))
    );
  };

  const deleteInvoice = (id: string) => {
    const target = invoices.find((i) => i.id === id || i.invoiceNo === id);
    if (!target) return;
    const deps: string[] = [];
    if (target.paidAmount > 0) deps.push(`আদায়কৃত পেমেন্ট ৳${target.paidAmount}`);
    if (target.dueAmount > 0) deps.push(`বকেয়া (Due) ৳${target.dueAmount}`);
    requestDeleteRecord({
      entityType: 'invoice',
      entityLabel: 'বিলিং ইনভয়েস / ক্যাশ মেমো (Billing Invoice)',
      recordId: target.id,
      recordTitle: `Invoice #${target.invoiceNo} — ${target.patientName}`,
      recordSubtitle: `PID: ${target.pId} · Net: ৳${target.netTotal} · Paid: ৳${target.paidAmount}`,
      dependencies: deps,
      originalData: target,
    });
  };

  const addPrescription = (rx: Omit<Prescription, 'id'>): Prescription => {
    const newRx: Prescription = { ...rx, id: `rx-${Date.now()}` };
    setPrescriptions((prev) => [newRx, ...prev]);
    addNotification('Prescription Generated', `Rx created for ${newRx.patientName} by ${newRx.doctorName}`, 'info');

    addAuditLog({
      actionType: 'PRESCRIPTION_CREATE',
      patientName: newRx.patientName,
      details: `প্রেসক্রিপশন প্রদান: ${newRx.patientName} (${newRx.age}) - কনসালট্যান্ট: ${newRx.doctorName}`,
    });

    broadcastLanEvent('PRESCRIPTION_CREATED', newRx);
    return newRx;
  };

  const deletePrescription = (id: string) => {
    const target = prescriptions.find((r) => r.id === id);
    if (!target) return;
    requestDeleteRecord({
      entityType: 'prescription',
      entityLabel: 'ডাক্তারের প্রেসক্রিপশন (Prescription Rx)',
      recordId: target.id,
      recordTitle: `Rx ${target.id} — ${target.patientName}`,
      recordSubtitle: `Doctor: ${target.doctorName} · Date: ${target.date}`,
      originalData: target,
    });
  };

  const addEcgReport = (ecg: Omit<EcgReport, 'id'>) => {
    const newEcg: EcgReport = { ...ecg, id: `ecg-${Date.now()}` };
    setEcgReports((prev) => [newEcg, ...prev]);
    // Automatically mark matching ECG department order as Completed
    setDepartmentOrders((prev) =>
      prev.map((ord) => {
        const matchesOrder =
          (newEcg.orderId && ord.id === newEcg.orderId) ||
          (newEcg.invoiceNo && ord.invoiceNo === newEcg.invoiceNo && ord.departmentId === 'ecg') ||
          (!newEcg.orderId && !newEcg.invoiceNo && ord.pId === newEcg.pId && ord.departmentId === 'ecg' && ord.orderStatus !== 'Completed');
        if (!matchesOrder) return ord;
        return {
          ...ord,
          orderStatus: 'Completed',
          resultEnteredAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          completedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          reportId: newEcg.id,
        };
      })
    );
    addNotification('ECG Report Completed', `ECG interpretation saved for PId: ${newEcg.pId}`, 'info');

    addAuditLog({
      actionType: 'ECG_REPORT',
      patientId: newEcg.pId,
      patientName: newEcg.patientName,
      details: `ইসিজি রিপোর্ট সম্পন্ন (রোগী: ${newEcg.patientName}, আইডি: ${newEcg.pId}, হার্ট রেট: ${newEcg.heartRate} bpm, রিদম: ${newEcg.rhythm})।`,
    });

    broadcastLanEvent('REPORT_SAVED', { type: 'ECG', pId: newEcg.pId });
  };

  const deleteEcgReport = (id: string) => {
    const target = ecgReports.find((e) => e.id === id);
    if (!target) return;
    requestDeleteRecord({
      entityType: 'ecgReport',
      entityLabel: 'ইসিজি রিপোর্ট (ECG Report)',
      recordId: target.id,
      recordTitle: `ECG Report — ${target.patientName} (PID: ${target.pId})`,
      recordSubtitle: `HR: ${target.heartRate} bpm · Date: ${target.date}`,
      originalData: target,
    });
  };

  const addXrayReport = (xray: Omit<XrayReport, 'id'>) => {
    const newXray: XrayReport = { ...xray, id: `xray-${Date.now()}` };
    setXrayReports((prev) => [newXray, ...prev]);
    // Automatically mark matching X-Ray department order as Completed
    setDepartmentOrders((prev) =>
      prev.map((ord) => {
        const matchesOrder =
          (newXray.orderId && ord.id === newXray.orderId) ||
          (newXray.invoiceNo && ord.invoiceNo === newXray.invoiceNo && ord.departmentId === 'xray') ||
          (!newXray.orderId && !newXray.invoiceNo && ord.pId === newXray.pId && ord.departmentId === 'xray' && ord.orderStatus !== 'Completed');
        if (!matchesOrder) return ord;
        return {
          ...ord,
          orderStatus: 'Completed',
          resultEnteredAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          completedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          reportId: newXray.id,
        };
      })
    );
    addNotification('X-Ray Report Ready', `X-Ray findings recorded for PId: ${newXray.pId}`, 'info');

    addAuditLog({
      actionType: 'XRAY_REPORT',
      patientId: newXray.pId,
      patientName: newXray.patientName,
      details: `ডিজিটাল এক্স-রে রিপোর্ট প্রস্তুত (${newXray.investigation}) - রোগী: ${newXray.patientName} (আইডি: ${newXray.pId})। রেডিওলজিস্ট: ${newXray.radiologist}`,
    });

    broadcastLanEvent('REPORT_SAVED', { type: 'XRAY', pId: newXray.pId });
  };

  const deleteXrayReport = (id: string) => {
    const target = xrayReports.find((x) => x.id === id);
    if (!target) return;
    requestDeleteRecord({
      entityType: 'xrayReport',
      entityLabel: 'এক্স-রে রিপোর্ট (X-Ray Report)',
      recordId: target.id,
      recordTitle: `${target.investigation} — ${target.patientName} (PID: ${target.pId})`,
      recordSubtitle: `Radiologist: ${target.radiologist} · Date: ${target.date}`,
      originalData: target,
    });
  };

  const addUsgReport = (usg: Omit<UsgReport, 'id'>) => {
    const newUsg: UsgReport = { ...usg, id: `usg-${Date.now()}` };
    setUsgReports((prev) => [newUsg, ...prev]);
    // Automatically mark matching Ultrasound department order as Completed
    setDepartmentOrders((prev) =>
      prev.map((ord) => {
        const matchesOrder =
          (newUsg.orderId && ord.id === newUsg.orderId) ||
          (newUsg.invoiceNo && ord.invoiceNo === newUsg.invoiceNo && ord.departmentId === 'ultrasound') ||
          (!newUsg.orderId && !newUsg.invoiceNo && ord.pId === newUsg.pId && ord.departmentId === 'ultrasound' && ord.orderStatus !== 'Completed');
        if (!matchesOrder) return ord;
        return {
          ...ord,
          orderStatus: 'Completed',
          resultEnteredAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          completedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          reportId: newUsg.id,
        };
      })
    );
    addNotification('Ultrasound Report Ready', `USG Scan recorded for PId: ${newUsg.pId}`, 'info');

    addAuditLog({
      actionType: 'USG_REPORT',
      patientId: newUsg.pId,
      patientName: newUsg.patientName,
      details: `আল্ট্রাসনোগ্রাফি (USG) রিপোর্ট সম্পন্ন (${usg.scanType}) - রোগী: ${newUsg.patientName} (আইডি: ${newUsg.pId})। সনোলজিস্ট: ${newUsg.sonologist}`,
    });

    broadcastLanEvent('REPORT_SAVED', { type: 'USG', pId: newUsg.pId });
  };

  const deleteUsgReport = (id: string) => {
    const target = usgReports.find((u) => u.id === id);
    if (!target) return;
    requestDeleteRecord({
      entityType: 'usgReport',
      entityLabel: 'আল্ট্রাসনোগ্রাফি রিপোর্ট (USG Report)',
      recordId: target.id,
      recordTitle: `${target.scanType} — ${target.patientName} (PID: ${target.pId})`,
      recordSubtitle: `Sonologist: ${target.sonologist} · Date: ${target.date}`,
      originalData: target,
    });
  };

  const addEmployee = (emp: Omit<Employee, 'id'>): Employee => {
    const newEmp: Employee = {
      ...emp,
      id: `emp-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setEmployees((prev) => [newEmp, ...prev]);
    addNotification(
      'New Employee Registered',
      `${newEmp.name} (${newEmp.designation}) added to employee directory.`,
      'success'
    );
    addLog('info', `Employee registered: ${newEmp.name} (${newEmp.empId})`, 'HR Management');
    return newEmp;
  };

  const updateEmployee = (id: string, updated: Partial<Employee>) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    addNotification('Employee Updated', 'Employee details modified successfully.', 'info');
    addLog('info', `Employee ID ${id} profile updated`, 'HR Management');
  };

  const deleteEmployee = (id: string) => {
    const target = employees.find((e) => e.id === id);
    if (!target) return;
    requestDeleteRecord({
      entityType: 'employee',
      entityLabel: 'কর্মচারী প্রোফাইল (Employee Record)',
      recordId: target.id,
      recordTitle: `${target.name} (${target.empId})`,
      recordSubtitle: `${target.designation} · ${target.department} · Salary: ৳${target.salary}`,
      originalData: target,
    });
  };

  const addExpense = (exp: Omit<ExpenseItem, 'id'>): ExpenseItem => {
    const newExp: ExpenseItem = {
      ...exp,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setExpenses((prev) => [newExp, ...prev]);
    addNotification(
      'Expense Recorded',
      `Voucher ${newExp.voucherNo}: ৳${newExp.amount} for ${newExp.title}`,
      'info'
    );
    addLog('info', `Expense voucher recorded: ${newExp.voucherNo} (৳${newExp.amount})`, 'Accounts');
    return newExp;
  };

  const updateExpense = (id: string, updated: Partial<ExpenseItem>) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    addNotification('Expense Modified', 'Expense voucher updated.', 'info');
    addLog('info', `Expense ID ${id} updated`, 'Accounts');
  };

  const deleteExpense = (id: string) => {
    const target = expenses.find((e) => e.id === id);
    if (!target) return;
    requestDeleteRecord({
      entityType: 'expense',
      entityLabel: 'খরচের ভাউচার (Expense Voucher)',
      recordId: target.id,
      recordTitle: `${target.title} (${target.voucherNo})`,
      recordSubtitle: `${target.category} · Amount: ৳${target.amount} · Date: ${target.date}`,
      originalData: target,
    });
  };

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const sendChatMessage = (
    message: string,
    channel: 'lab' | 'opd' | 'billing' | 'general',
    senderRole: 'Lab' | 'Doctor' | 'Reception' | 'Admin' = 'Lab'
  ) => {
    const senderNames = {
      Lab: 'Lab Technologist',
      Doctor: 'Consultant Doctor',
      Reception: 'Front Desk',
      Admin: 'Clinic Director',
    };
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: senderNames[senderRole],
      senderRole,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel,
    };
    setChatMessages((prev) => [...prev, newMsg]);
    addLog('info', `Encrypted message transmitted on channel [${channel}]`, 'Secure Chat');
  };

  const addLog = (level: 'info' | 'warn' | 'error', message: string, module: string) => {
    const newLog: SystemLog = {
      id: `log-${Date.now()}`,
      level,
      message,
      timestamp: new Date().toLocaleTimeString(),
      module,
    };
    setSystemLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  const triggerManualSync = () => {
    setCloudSyncStatus('syncing');
    setTimeout(() => {
      setCloudSyncStatus('synced');
      setLastSyncTime(new Date().toLocaleTimeString());
      addNotification(
        'Cloud Data Synchronized',
        'All local patients, lab tests and billing records successfully pushed to encrypted cloud storage.',
        'success'
      );
      addLog('info', 'Cloud sync checkpoint completed successfully with zero latency', 'Cloud Storage');
    }, 800);
  };

  const resetToSampleData = () => {
    setClinicConfig(initialClinicConfig);
    setDoctors(initialDoctors);
    setLabTests(initialLabTests);
    setPatients(initialPatients as Patient[]);
    setInvoices(initialInvoices as Invoice[]);
    setUsers(initialUsers);
    setEmployees(initialEmployees as Employee[]);
    setExpenses(initialExpenses as ExpenseItem[]);
    setShiftHandovers(initialShiftHandovers);
    addNotification('Demo Data Reset', 'Default clinics, tests, doctors, patient records, employees, shift handovers and default accounts restored.', 'info');
  };

  // Licensing & Subscription Security State (3-Month / Quarterly)
  const [licenseInfo, setLicenseInfo] = useState<LicenseSecurityState>(() => evaluateLicenseState());
  const [openLicenseModal, setOpenLicenseModal] = useState<boolean>(false);

  // Periodically re-evaluate license validity and check clock consistency
  useEffect(() => {
    const checkLicense = () => {
      const current = evaluateLicenseState();
      setLicenseInfo(current);
    };
    checkLicense();
    const interval = setInterval(checkLicense, 30000);
    return () => clearInterval(interval);
  }, []);

  const renewLicense = (code: string) => {
    const activeWs = workstations.find((w) => w.id === currentWorkstationId) || workstations[0];
    const res = validateAndRenewLicense(code, activeWs.terminalCode);
    if (res.success && res.updatedState) {
      setLicenseInfo(res.updatedState);
      addNotification(
        lang === 'bn' ? 'লাইসেন্স সফলভাবে নবায়িত হয়েছে' : 'License Successfully Renewed',
        lang === 'bn'
          ? 'সফটওয়্যারের ৩ মাসের কোয়ার্টারলি সাবস্ক্রিপশন সফলভাবে সক্রিয় হয়েছে।'
          : '3-Month Quarterly subscription is active.',
        'success'
      );
      addAuditLog({
        actionType: 'SETTINGS_UPDATE',
        details: `License renewed with master key for 90 days. Valid until ${new Date(res.updatedState.expiresAt).toLocaleDateString()}.`,
      });
      broadcastLanEvent('LICENSE_RENEWED', { expiresAt: res.updatedState.expiresAt });
    }
    return res;
  };

  const simulateLicenseDays = (days: number) => {
    const updated = simulateLicenseDaysRemaining(days);
    setLicenseInfo(updated);
    addNotification(
      'License Simulation',
      `Subscription simulated to ${days} days remaining (${updated.status}).`,
      days <= 0 ? 'error' : days <= 10 ? 'warn' : 'info'
    );
  };

  const simulateTrialDays = (days: number) => {
    const updated = simulateTrialDaysRemaining(days);
    setLicenseInfo(updated);
    addNotification(
      'Trial Simulation',
      `7-Day Trial simulated to ${days} days remaining (${updated.status}).`,
      days <= 0 ? 'error' : 'info'
    );
  };

  const resetLicenseToInstallState = () => {
    const initialTrial = resetToInitialTrialState();
    setLicenseInfo(initialTrial);
    addNotification(
      'Fresh Install Setup',
      'Software reset to initial installation 7-day trial state.',
      'info'
    );
  };

  // Central Multi-Branch Diagnostic Institutions State
  const [institutions, setInstitutions] = useState<DiagnosticInstitution[]>(() => {
    const saved = localStorage.getItem(`${PREFIX}institutions`);
    return saved ? JSON.parse(saved) : initialDiagnosticInstitutions;
  });

  const [mobileRemotePassword, setMobileRemotePassword] = useState<string>(() => {
    return localStorage.getItem(`${PREFIX}mobile_remote_pwd`) || 'Adiba512022#';
  });

  useEffect(() => {
    localStorage.setItem(`${PREFIX}institutions`, JSON.stringify(institutions));
  }, [institutions]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}mobile_remote_pwd`, mobileRemotePassword);
  }, [mobileRemotePassword]);

  const updateMobileRemotePassword = (newPass: string) => {
    setMobileRemotePassword(newPass);
    localStorage.setItem(`${PREFIX}mobile_remote_pwd`, newPass);
  };

  const updateInstitution = (id: string, updates: Partial<DiagnosticInstitution>) => {
    setInstitutions((prev) =>
      prev.map((inst) => (inst.id === id ? { ...inst, ...updates, lastSyncAt: 'Just now' } : inst))
    );
  };

  const lockInstitution = (id: string, reason?: string) => {
    updateInstitution(id, {
      isRemoteLocked: true,
      remoteLockReason: reason || 'সেন্ট্রাল অ্যাডমিন কর্তৃক প্রতিষ্ঠান সাময়িক লক করা হয়েছে',
      status: 'locked',
    });
    addNotification(
      'প্রতিষ্ঠান লক করা হয়েছে',
      `ডায়াগনস্টিক প্রতিষ্ঠান সাময়িকভাবে লক করা হয়েছে।`,
      'warn'
    );
  };

  const unlockInstitution = (id: string) => {
    updateInstitution(id, {
      isRemoteLocked: false,
      remoteLockReason: undefined,
      status: 'active',
    });
    addNotification(
      'প্রতিষ্ঠান আনলক করা হয়েছে',
      `ডায়াগনস্টিক প্রতিষ্ঠান সফলভাবে আনলক হয়েছে।`,
      'success'
    );
  };

  const killInstitution = (id: string, reason?: string) => {
    updateInstitution(id, {
      isRemoteKilled: true,
      isRemoteLocked: true,
      remoteKillReason: reason || 'সেন্ট্রাল অ্যাডমিন কর্তৃক দূর থেকে সফটওয়্যার বন্ধ (Kill Switch) করা হয়েছে',
      status: 'killed',
    });
    addNotification(
      '🛑 প্রতিষ্ঠান কিল সুইচ সক্রিয়',
      `সফটওয়্যার দূর থেকে বন্ধ করা হয়েছে।`,
      'error'
    );
  };

  const reactivateInstitution = (id: string) => {
    updateInstitution(id, {
      isRemoteKilled: false,
      isRemoteLocked: false,
      remoteKillReason: undefined,
      remoteLockReason: undefined,
      status: 'active',
    });
    addNotification(
      'প্রতিষ্ঠান পুনরায় সচল',
      `সফটওয়্যার পুনরায় সচল করা হয়েছে।`,
      'success'
    );
  };

  const renewInstitutionLicense = (id: string, daysToAdd: number = 90): { success: boolean; message: string } => {
    const inst = institutions.find((i) => i.id === id);
    if (!inst) return { success: false, message: 'Institution not found' };

    const newExpiry = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();
    updateInstitution(id, {
      licenseStatus: 'active',
      status: 'active',
      licenseDaysRemaining: daysToAdd,
      licenseExpiresAt: newExpiry,
    });

    addNotification(
      'রিমোট লাইসেন্স নবায়ন সম্পন্ন',
      `${inst.nameBn} এর ৩ মাসের কোয়ার্টারলি লাইসেন্স সফলভাবে নবায়িত হয়েছে (${daysToAdd} দিন)।`,
      'success'
    );

    return {
      success: true,
      message: `${inst.nameBn} এর লাইসেন্স সফলভাবে আরও ৩ মাসের জন্য (${daysToAdd} দিন) নবায়িত হয়েছে।`,
    };
  };

  const updateInstitutionAllowedModules = (id: string, modules: AppModuleId[]) => {
    updateInstitution(id, { allowedModules: modules });
  };

  // Mobile Remote Device & Workstation Controls
  const [openMobileRemoteModal, setOpenMobileRemoteModal] = useState<boolean>(false);

  const lockWorkstation = (id: string, reason?: string) => {
    updateWorkstation(id, {
      isRemoteLocked: true,
      remoteLockReason: reason || 'অ্যাডমিন কর্তৃক দূর থেকে সাময়িক লক করা হয়েছে',
      remoteLockedAt: new Date().toISOString(),
      lastRemoteCommandAt: new Date().toISOString(),
    });
    broadcastLanEvent('REMOTE_LOCK', { workstationId: id, reason });
  };

  const unlockWorkstation = (id: string) => {
    updateWorkstation(id, {
      isRemoteLocked: false,
      remoteLockReason: undefined,
      lastRemoteCommandAt: new Date().toISOString(),
    });
    broadcastLanEvent('REMOTE_UNLOCK', { workstationId: id });
  };

  const killWorkstation = (id: string, reason?: string) => {
    updateWorkstation(id, {
      isRemoteKilled: true,
      isRemoteLocked: true,
      remoteKillReason: reason || 'অ্যাডমিন কর্তৃক সফটওয়্যার সাময়িক বা স্থায়ীভাবে বন্ধ করা হয়েছে',
      remoteKilledAt: new Date().toISOString(),
      lastRemoteCommandAt: new Date().toISOString(),
    });
    broadcastLanEvent('REMOTE_KILL', { workstationId: id, reason });
  };

  const reactivateWorkstation = (id: string) => {
    updateWorkstation(id, {
      isRemoteKilled: false,
      isRemoteLocked: false,
      remoteKillReason: undefined,
      remoteLockReason: undefined,
      lastRemoteCommandAt: new Date().toISOString(),
    });
    broadcastLanEvent('REMOTE_REACTIVATE', { workstationId: id });
  };

  const updateWorkstationAllowedModules = (id: string, modules: AppModuleId[]) => {
    updateWorkstation(id, {
      allowedModulesOverride: modules,
      lastRemoteCommandAt: new Date().toISOString(),
    });
    broadcastLanEvent('FEATURE_PERMISSIONS_CHANGED', { workstationId: id, allowedModules: modules });
  };

  const executeOfflineRemoteCommand = (commandCode: string): { success: boolean; message: string } => {
    const clean = commandCode.trim().toUpperCase();

    // Direct super admin master bypass
    if (clean === '512022' || clean === MASTER_LICENSE_KEY.toUpperCase()) {
      reactivateWorkstation(currentWorkstationId);
      return { success: true, message: 'সফলভাবে অ্যাডমিন কোড দিয়ে আনলক করা হয়েছে।' };
    }

    if (clean.startsWith('UNLK') || clean.startsWith('UNLOCK')) {
      unlockWorkstation(currentWorkstationId);
      return { success: true, message: 'অফলাইন কোড সফলভাবে আনলক সম্পন্ন করেছে।' };
    }

    if (clean.startsWith('UNKILL') || clean.startsWith('REACTIVATE')) {
      reactivateWorkstation(currentWorkstationId);
      return { success: true, message: 'অফলাইন কোড দিয়ে সফটওয়্যার পুনরায় সচল করা হয়েছে।' };
    }

    if (clean.startsWith('LOCK')) {
      lockWorkstation(currentWorkstationId, 'অফলাইন রিমোট সিকিউরিটি কোড লক');
      return { success: true, message: 'অফলাইন কোড দিয়ে পিসি সফলভাবে লক করা হয়েছে।' };
    }

    if (clean.startsWith('KILL')) {
      killWorkstation(currentWorkstationId, 'অফলাইন ইমার্জেন্সি কিল সুইচ');
      return { success: true, message: 'অফলাইন কোড দিয়ে সফটওয়্যার বন্ধ করা হয়েছে।' };
    }

    return { success: false, message: 'অকার্যকর বা ভুল কোড।' };
  };

  // Shift Handover Operations
  const addShiftHandover = (note: Omit<ShiftHandoverNote, 'id' | 'createdAt'>): ShiftHandoverNote => {
    const newNote: ShiftHandoverNote = {
      ...note,
      id: `handover-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setShiftHandovers((prev) => [newNote, ...prev]);
    addNotification(
      lang === 'bn' ? 'নতুন শিফট হ্যান্ডওভার সংরক্ষিত' : 'New Shift Handover Created',
      lang === 'bn'
        ? `ডা. ${newNote.outgoingDoctorName} (${newNote.shiftType} শিফট) হ্যান্ডওভার নোট প্রস্তুত করেছেন। মোট রোগী: ${newNote.patientHandovers.length}`
        : `Dr. ${newNote.outgoingDoctorName} logged a ${newNote.shiftType} shift handover with ${newNote.patientHandovers.length} patients.`,
      'info'
    );
    addAuditLog({
      actionType: 'SETTINGS_UPDATE',
      details: `Shift handover logged by ${newNote.outgoingDoctorName} for ${newNote.shiftType} shift (${newNote.patientHandovers.length} patients).`,
    });
    return newNote;
  };

  const updateShiftHandover = (id: string, updates: Partial<ShiftHandoverNote>) => {
    setShiftHandovers((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...updates, updatedAt: new Date().toISOString() } : h))
    );
  };

  const acknowledgeShiftHandover = (id: string, doctorName: string, notes?: string) => {
    setShiftHandovers((prev) =>
      prev.map((h) =>
        h.id === id
          ? {
              ...h,
              acknowledged: true,
              acknowledgedBy: doctorName,
              acknowledgedAt: new Date().toISOString(),
              acknowledgementNotes: notes || h.acknowledgementNotes,
            }
          : h
      )
    );
    addNotification(
      lang === 'bn' ? 'শিফট হ্যান্ডওভার গৃহীত হয়েছে' : 'Shift Handover Acknowledged',
      lang === 'bn'
        ? `ডা. ${doctorName} সফলভাবে শিফট বুঝে নিয়েছেন।`
        : `Dr. ${doctorName} has verified and acknowledged shift receipt.`,
      'success'
    );
    addAuditLog({
      actionType: 'SETTINGS_UPDATE',
      details: `Shift handover (${id}) acknowledged by Dr. ${doctorName}.`,
    });
  };

  const deleteShiftHandover = (id: string) => {
    const target = shiftHandovers.find((h) => h.id === id);
    if (!target) return;
    requestDeleteRecord({
      entityType: 'shiftHandover',
      entityLabel: 'ডাক্তার শিফট হ্যান্ডওভার (Shift Handover)',
      recordId: target.id,
      recordTitle: `${target.shiftType} Shift — Dr. ${target.outgoingDoctorName}`,
      recordSubtitle: `Date: ${target.shiftDate || target.date || ''} · Patients: ${target.patientHandovers?.length || 0}`,
      originalData: target,
    });
  };

  const activeShiftHandoverCount = shiftHandovers.filter((h) => !h.acknowledged).length;

  // ============================================================================
  // AUTOMATIC SAVE, PERMANENT DATA STORAGE & ADMIN-ONLY DELETE ENGINE
  // ============================================================================

  const [opdAppointments, setOpdAppointments] = useState<OpdAppointmentRecord[]>(() => {
    const saved = localStorage.getItem('medicare_opd_appointments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    const todayStr = new Date().toISOString().split('T')[0];
    return [
      {
        id: 'apt-101',
        tokenNo: 'T-01',
        pId: '26100294',
        patientName: 'Titly',
        age: '21 Yrs',
        gender: 'Female',
        phone: '01712-345678',
        doctorId: 'doc-1',
        doctorName: 'Prof. Dr. M. A. Rahman',
        date: todayStr,
        timeSlot: '10:30 AM',
        visitType: 'Report Check',
        fee: 500,
        paymentStatus: 'Paid',
        status: 'Waiting',
        chiefComplaint: 'Fever for 4 days, weakness & headache',
        createdAt: '10:05 AM',
      },
      {
        id: 'apt-102',
        tokenNo: 'T-02',
        pId: '26100295',
        patientName: 'Md. Rahim Uddin',
        age: '45 Yrs',
        gender: 'Male',
        phone: '01819-876543',
        doctorId: 'doc-1',
        doctorName: 'Prof. Dr. M. A. Rahman',
        date: todayStr,
        timeSlot: '11:00 AM',
        visitType: 'New Visit',
        fee: 800,
        paymentStatus: 'Paid',
        status: 'In Consultation',
        chiefComplaint: 'Chest discomfort, high blood pressure checkup',
        createdAt: '10:20 AM',
      },
      {
        id: 'apt-103',
        tokenNo: 'T-03',
        pId: '26100296',
        patientName: 'Mst. Salma Begum',
        age: '32 Yrs',
        gender: 'Female',
        phone: '01911-223344',
        doctorId: 'doc-2',
        doctorName: 'Dr. Farhana Yasmin',
        date: todayStr,
        timeSlot: '11:30 AM',
        visitType: 'New Visit',
        fee: 700,
        paymentStatus: 'Paid',
        status: 'Completed',
        chiefComplaint: 'Routine antenatal pregnancy checkup (24 weeks)',
        createdAt: '09:45 AM',
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem('medicare_opd_appointments', JSON.stringify(opdAppointments));
  }, [opdAppointments]);

  const addOpdAppointment = (appt: Omit<OpdAppointmentRecord, 'id' | 'createdAt'>): OpdAppointmentRecord => {
    const newAppt: OpdAppointmentRecord = {
      ...appt,
      id: `apt-${Date.now()}`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      updatedAt: new Date().toISOString(),
    };
    setOpdAppointments((prev) => [newAppt, ...prev]);
    return newAppt;
  };

  const updateOpdAppointment = (id: string, updates: Partial<OpdAppointmentRecord>) => {
    setOpdAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a))
    );
  };

  const deleteOpdAppointment = (id: string) => {
    const target = opdAppointments.find((a) => a.id === id);
    if (!target) return;
    requestDeleteRecord({
      entityType: 'opdAppointment',
      entityLabel: 'ডাক্তার ভিজিট / সিরিয়াল (OPD Appointment)',
      recordId: target.id,
      recordTitle: `Token ${target.tokenNo} — ${target.patientName} (PID: ${target.pId})`,
      recordSubtitle: `Doctor: ${target.doctorName} · Fee: ৳${target.fee} (${target.paymentStatus})`,
      originalData: target,
    });
  };

  const [trashRecords, setTrashRecords] = useState<SoftDeletedRecord[]>(() => {
    const saved = localStorage.getItem(`${PREFIX}trash_records`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  const [printRecords, setPrintRecords] = useState<PrintRecordEntry[]>(() => {
    const saved = localStorage.getItem(`${PREFIX}print_records_v2`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  const [activeDrafts, setActiveDrafts] = useState<ActiveModuleDrafts>(() => {
    const saved = localStorage.getItem(`${PREFIX}active_module_drafts`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {};
  });

  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('saved');
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string>(() => {
    return localStorage.getItem(`${PREFIX}last_autosaved_at`) || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });
  const [dbVersion, setDbVersion] = useState<number>(1);
  const [pendingOfflineMutationsCount, setPendingOfflineMutationsCount] = useState<number>(() => {
    try {
      const q = JSON.parse(localStorage.getItem(`${PREFIX}offline_mutation_queue`) || '[]');
      return Array.isArray(q) ? q.length : 0;
    } catch {
      return 0;
    }
  });

  const [pendingDeleteRequest, setPendingDeleteRequest] = useState<DeleteRequestPayload | null>(null);
  const [openRecycleBinModal, setOpenRecycleBinModal] = useState<boolean>(false);

  const isAdminUser = String(currentUser?.role || '').trim().toLowerCase() === 'admin';
  const isHydratingFromServerRef = useRef<boolean>(false);
  const hasHydratedOnceRef = useRef<boolean>(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}patients`, JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}invoices`, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}doctors`, JSON.stringify(doctors));
  }, [doctors]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}tests`, JSON.stringify(labTests));
  }, [labTests]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}rx`, JSON.stringify(prescriptions));
  }, [prescriptions]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}config`, JSON.stringify(clinicConfig));
  }, [clinicConfig]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}trash_records`, JSON.stringify(trashRecords));
  }, [trashRecords]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}print_records_v2`, JSON.stringify(printRecords));
  }, [printRecords]);

  useEffect(() => {
    localStorage.setItem(`${PREFIX}active_module_drafts`, JSON.stringify(activeDrafts));
  }, [activeDrafts]);

  const getActorHeaders = useCallback(
    (overrideRole?: string): Record<string, string> => {
      const activeWs = workstations.find((w) => w.id === currentWorkstationId) || workstations[0];
      const rawFullName = currentUser?.fullName || 'Hospital Staff';
      const safeFullName = encodeURIComponent(rawFullName);
      const safeUsername = encodeURIComponent(currentUser?.username || 'guest');
      return {
        'Content-Type': 'application/json',
        'x-actor-id': currentUser?.id || 'usr-guest',
        'x-actor-username': safeUsername,
        'x-actor-fullname': safeFullName,
        'x-actor-role': overrideRole || currentUser?.role || 'Staff',
        'x-workstation-code': activeWs?.terminalCode || 'PC-01',
      };
    },
    [currentUser, workstations, currentWorkstationId]
  );

  const buildPermanentCollectionsPayload = useCallback(() => {
    return {
      patients,
      invoices,
      departmentOrders,
      paymentTransactions,
      doctors,
      labTests,
      medicines: [],
      employees,
      expenses,
      users,
      shiftHandovers,
      opdAppointments,
      workstations,
      institutions,
      invoicePrintLogs: printLogs,
      backupHistory,
      auditLogs,
      clinicSettings: clinicConfig,
    };
  }, [
    patients,
    invoices,
    departmentOrders,
    paymentTransactions,
    doctors,
    labTests,
    employees,
    expenses,
    users,
    shiftHandovers,
    opdAppointments,
    workstations,
    institutions,
    printLogs,
    backupHistory,
    auditLogs,
    clinicConfig,
  ]);

  const enqueueOfflineMutation = useCallback((payload: any) => {
    try {
      const existingRaw = localStorage.getItem(`${PREFIX}offline_mutation_queue`);
      const queue = existingRaw ? JSON.parse(existingRaw) : [];
      const updatedQueue = [payload, ...(Array.isArray(queue) ? queue : [])].slice(0, 25);
      localStorage.setItem(`${PREFIX}offline_mutation_queue`, JSON.stringify(updatedQueue));
      setPendingOfflineMutationsCount(updatedQueue.length);
    } catch {}
  }, []);

  const triggerImmediateAutoSave = useCallback(
    async (reason: string = 'auto_debounce'): Promise<boolean> => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }

      const activeWs = workstations.find((w) => w.id === currentWorkstationId) || workstations[0];
      const mutationPayload = {
        mutationId: `mut-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        clientVersion: dbVersion,
        reason,
        actor: {
          id: currentUser?.id || 'usr-guest',
          username: currentUser?.username || 'guest',
          fullName: currentUser?.fullName || 'Hospital Staff',
          role: currentUser?.role || 'Staff',
          workstationCode: activeWs?.terminalCode || 'PC-01',
        },
        collections: buildPermanentCollectionsPayload(),
        activeDrafts,
      };

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueueOfflineMutation(mutationPayload);
        setAutoSaveStatus('offline_draft');
        return false;
      }

      setAutoSaveStatus('saving');
      setCloudSyncStatus('syncing');

      try {
        const res = await fetch('/api/db/auto-save', {
          method: 'POST',
          headers: getActorHeaders(),
          body: JSON.stringify(mutationPayload),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Auto-save failed');
        }

        const timeFormatted = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        setDbVersion(data.dbVersion || dbVersion + 1);
        setLastAutoSavedAt(timeFormatted);
        localStorage.setItem(`${PREFIX}last_autosaved_at`, timeFormatted);
        setAutoSaveStatus(data.conflictMerged ? 'conflict_merged' : 'saved');
        setCloudSyncStatus('synced');
        setLastSyncTime(timeFormatted);
        return true;
      } catch (err) {
        enqueueOfflineMutation(mutationPayload);
        setAutoSaveStatus('error');
        setCloudSyncStatus('synced');
        return false;
      }
    },
    [dbVersion, buildPermanentCollectionsPayload, activeDrafts, enqueueOfflineMutation, getActorHeaders]
  );

  const retryOfflineMutations = useCallback(async (): Promise<boolean> => {
    try {
      const ok = await triggerImmediateAutoSave('offline_retry');
      if (ok) {
        localStorage.removeItem(`${PREFIX}offline_mutation_queue`);
        setPendingOfflineMutationsCount(0);
      }
      return ok;
    } catch {
      return false;
    }
  }, [triggerImmediateAutoSave]);

  // 1. Hydrate from Permanent Server Database on Startup & Login
  useEffect(() => {
    let isMounted = true;
    const hydrateFromPermanentServerDb = async () => {
      try {
        const res = await fetch('/api/db/state');
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted || !data.success) return;

        if (data.isInitialized && data.collections) {
          isHydratingFromServerRef.current = true;
          const cols = data.collections;
          const hydratedDocs = Array.isArray(cols.doctors) && cols.doctors.length > 0 ? cols.doctors : doctors;
          if (Array.isArray(cols.patients) && cols.patients.length > 0) setPatients(cols.patients);
          if (Array.isArray(cols.invoices) && cols.invoices.length > 0) setInvoices(cols.invoices);
          if (Array.isArray(cols.departmentOrders) && cols.departmentOrders.length > 0) {
            setDepartmentOrders(buildOrdersFromInvoices(cols.invoices || invoices, cols.departmentOrders));
          } else if (Array.isArray(cols.invoices) && cols.invoices.length > 0) {
            setDepartmentOrders((prev) => buildOrdersFromInvoices(cols.invoices, prev));
          }
          if (Array.isArray(cols.paymentTransactions) && cols.paymentTransactions.length > 0) {
            setPaymentTransactions(cols.paymentTransactions);
          }
          if (Array.isArray(cols.doctors) && cols.doctors.length > 0) setDoctors(cols.doctors);
          if (Array.isArray(cols.labTests) && cols.labTests.length > 0) {
            setLabTests(
              mergeServiceCatalogWithDoctors(
                getMergedPathologyCatalog(cols.labTests),
                hydratedDocs
              )
            );
          }
          if (Array.isArray(cols.employees) && cols.employees.length > 0) setEmployees(cols.employees);
          if (Array.isArray(cols.expenses) && cols.expenses.length > 0) setExpenses(cols.expenses);
          if (Array.isArray(cols.users) && cols.users.length > 0) setUsers(cols.users);
          if (Array.isArray(cols.shiftHandovers) && cols.shiftHandovers.length > 0) {
            setShiftHandovers(cols.shiftHandovers);
          }
          if (Array.isArray(cols.opdAppointments) && cols.opdAppointments.length > 0) {
            setOpdAppointments(cols.opdAppointments);
          }
          if (Array.isArray(cols.workstations) && cols.workstations.length > 0) {
            setWorkstations(cols.workstations);
          }
          if (Array.isArray(cols.institutions) && cols.institutions.length > 0) {
            setInstitutions(cols.institutions);
          }
          if (Array.isArray(cols.invoicePrintLogs) && cols.invoicePrintLogs.length > 0) {
            setPrintLogs(cols.invoicePrintLogs);
          }
          if (Array.isArray(cols.printRecords)) {
            setPrintRecords(cols.printRecords);
          }
          if (Array.isArray(cols.trashRecords)) {
            setTrashRecords(cols.trashRecords);
          }
          if (Array.isArray(cols.auditLogs) && cols.auditLogs.length > 0) {
            setAuditLogs(cols.auditLogs);
          }
          if (Array.isArray(cols.backupHistory) && cols.backupHistory.length > 0) {
            setBackupHistory(cols.backupHistory);
          }
          if (cols.clinicSettings && typeof cols.clinicSettings === 'object') {
            setClinicConfig((prev) => ({ ...prev, ...cols.clinicSettings }));
          }
          if (cols.activeDrafts && typeof cols.activeDrafts === 'object') {
            setActiveDrafts(cols.activeDrafts);
          }
          setDbVersion(data.dbVersion || 1);
          setAutoSaveStatus('saved');
          setTimeout(() => {
            isHydratingFromServerRef.current = false;
            hasHydratedOnceRef.current = true;
          }, 300);
        } else {
          // Seed server permanent DB with initial client state
          hasHydratedOnceRef.current = true;
          await triggerImmediateAutoSave('initial_seed');
        }
      } catch {
        hasHydratedOnceRef.current = true;
      }
    };

    hydrateFromPermanentServerDb();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  // 2. Automatic Debounced Auto-Save whenever ANY Hospital Module Data or Draft changes
  useEffect(() => {
    if (!hasHydratedOnceRef.current || isHydratingFromServerRef.current) return;

    setAutoSaveStatus('saving');
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      triggerImmediateAutoSave('state_change_debounce');
    }, 650);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    patients,
    invoices,
    departmentOrders,
    paymentTransactions,
    doctors,
    labTests,
    prescriptions,
    ecgReports,
    xrayReports,
    usgReports,
    employees,
    expenses,
    users,
    shiftHandovers,
    opdAppointments,
    workstations,
    institutions,
    clinicConfig,
    backupHistory,
    activeDrafts,
  ]);

  // 3. Global Field Blur, Form Submit & BeforeUnload Immediate Flush
  useEffect(() => {
    const handleFieldBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
          autoSaveTimerRef.current = null;
          triggerImmediateAutoSave('field_blur');
        }
      }
    };

    const handleFormSubmit = () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      triggerImmediateAutoSave('form_submit');
    };

    const handleOnlineReconnect = () => {
      retryOfflineMutations();
    };

    document.addEventListener('focusout', handleFieldBlur, true);
    document.addEventListener('submit', handleFormSubmit, true);
    window.addEventListener('online', handleOnlineReconnect);

    return () => {
      document.removeEventListener('focusout', handleFieldBlur, true);
      document.removeEventListener('submit', handleFormSubmit, true);
      window.removeEventListener('online', handleOnlineReconnect);
    };
  }, [triggerImmediateAutoSave, retryOfflineMutations]);

  // 4. Module Draft Updater (Saves in-progress form entries automatically)
  const updateModuleDraft = useCallback(
    (moduleKey: keyof ActiveModuleDrafts, draftData: Record<string, any> | null) => {
      setActiveDrafts((prev) => {
        const next: ActiveModuleDrafts = { ...prev };
        if (draftData === null) {
          delete (next as any)[moduleKey];
        } else {
          (next as any)[moduleKey] = {
            ...draftData,
            isDraft: true,
            savedAt: new Date().toISOString(),
          };
        }
        return next;
      });
    },
    []
  );

  // 5. Print & PDF Export Version Record Management
  const recordPrintOrPdfAction = useCallback(
    async (entry: Partial<PrintRecordEntry>) => {
      try {
        const res = await fetch('/api/db/print-records', {
          method: 'POST',
          headers: getActorHeaders(),
          body: JSON.stringify(entry),
        });
        const data = await res.json();
        if (res.ok && data.success && data.printRecord) {
          setPrintRecords(data.printRecords || []);
          setDbVersion(data.dbVersion || dbVersion + 1);
        }
      } catch {}
    },
    [getActorHeaders, dbVersion]
  );

  useEffect(() => {
    const handlePrintEvent = (event: Event) => {
      const customEvt = event as CustomEvent;
      if (customEvt.detail) {
        recordPrintOrPdfAction(customEvt.detail);
      }
    };
    window.addEventListener('medicare-print-record', handlePrintEvent);
    return () => {
      window.removeEventListener('medicare-print-record', handlePrintEvent);
    };
  }, [recordPrintOrPdfAction]);

  // 6. Admin-Only Delete Request & Backend RBAC Enforcement
  const requestDeleteRecord = (payload: DeleteRequestPayload) => {
    setPendingDeleteRequest(payload);
  };

  const confirmAdminSoftDelete = async (
    deletionReason: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!pendingDeleteRequest) {
      return { success: false, error: 'No record selected for deletion.' };
    }

    try {
      const res = await fetch('/api/db/delete', {
        method: 'POST',
        headers: getActorHeaders(),
        body: JSON.stringify({
          entityType: pendingDeleteRequest.entityType,
          entityLabel: pendingDeleteRequest.entityLabel,
          recordId: pendingDeleteRequest.recordId,
          recordTitle: pendingDeleteRequest.recordTitle,
          recordSubtitle: pendingDeleteRequest.recordSubtitle,
          deletionReason,
          originalData: pendingDeleteRequest.originalData,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        // Refresh audit logs from server if unauthorized attempt was logged
        if (res.status === 403) {
          addAuditLog({
            actionType: 'UNAUTHORIZED_DELETE_ATTEMPT',
            details: data.error || 'Unauthorized non-Admin delete attempt blocked by backend (403 Forbidden).',
          });
        }
        return {
          success: false,
          error:
            data.error ||
            'Delete Permission Denied (403 Forbidden): শুধুমাত্র Admin তথ্য মুছে ফেলার অনুমতিপ্রাপ্ত।',
        };
      }

      // Remove from active local state after backend confirmed soft delete
      const { entityType, recordId } = pendingDeleteRequest;
      isHydratingFromServerRef.current = true;

      if (entityType === 'patient') {
        setPatients((prev) => prev.filter((p) => p.id !== recordId && p.pId !== recordId));
      } else if (entityType === 'invoice') {
        setInvoices((prev) => prev.filter((i) => i.id !== recordId && i.invoiceNo !== recordId));
      } else if (entityType === 'doctor') {
        setDoctors((prev) => prev.filter((d) => d.id !== recordId));
      } else if (entityType === 'labTest') {
        setLabTests((prev) => prev.filter((t) => t.id !== recordId));
      } else if (entityType === 'employee') {
        setEmployees((prev) => prev.filter((e) => e.id !== recordId));
      } else if (entityType === 'expense') {
        setExpenses((prev) => prev.filter((e) => e.id !== recordId));
      } else if (entityType === 'shiftHandover') {
        setShiftHandovers((prev) => prev.filter((h) => h.id !== recordId));
      } else if (entityType === 'opdAppointment') {
        setOpdAppointments((prev) => prev.filter((a) => a.id !== recordId));
      } else if (entityType === 'userAccount') {
        setUsers((prev) => prev.filter((u) => u.id !== recordId));
      } else if (entityType === 'backupHistory') {
        if (recordId === 'ALL_VAULT_BACKUPS') {
          setBackupHistory([]);
          localStorage.removeItem(`${PREFIX}backup_history`);
        } else {
          setBackupHistory((prev) => prev.filter((b) => b.id !== recordId && b.filename !== recordId));
        }
      } else if (entityType === 'prescription') {
        setPrescriptions((prev) => prev.filter((r) => r.id !== recordId));
      } else if (entityType === 'ecgReport') {
        setEcgReports((prev) => prev.filter((e) => e.id !== recordId));
      } else if (entityType === 'xrayReport') {
        setXrayReports((prev) => prev.filter((x) => x.id !== recordId));
      } else if (entityType === 'usgReport') {
        setUsgReports((prev) => prev.filter((u) => u.id !== recordId));
      }

      if (Array.isArray(data.trashRecords)) {
        setTrashRecords(data.trashRecords);
      }
      if (data.auditLog) {
        setAuditLogs((prev) => [data.auditLog, ...prev]);
      }
      setDbVersion(data.dbVersion || dbVersion + 1);

      if (pendingDeleteRequest.onSuccess) {
        pendingDeleteRequest.onSuccess();
      }

      addNotification(
        lang === 'bn' ? 'রিসাইকেল বিনে স্থানান্তরিত (Soft Deleted)' : 'Moved to Admin Recycle Bin',
        lang === 'bn'
          ? `"${pendingDeleteRequest.recordTitle}" সফলভাবে Soft Delete হয়ে রিসাইকেল বিনে সংরক্ষিত হয়েছে।`
          : `"${pendingDeleteRequest.recordTitle}" was soft-deleted and archived in the Admin Recycle Bin.`,
        'warn'
      );

      setPendingDeleteRequest(null);
      setTimeout(() => {
        isHydratingFromServerRef.current = false;
      }, 250);

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'সার্ভারের সাথে সংযোগ বিচ্ছিন্ন — তথ্য মুছে ফেলা সম্ভব হয়নি।',
      };
    }
  };

  const restoreFromRecycleBin = async (
    trashId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/db/restore', {
        method: 'POST',
        headers: getActorHeaders(),
        body: JSON.stringify({ trashId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'রিসাইকেল বিন থেকে তথ্য পুনরুদ্ধার ব্যর্থ হয়েছে।',
        };
      }

      isHydratingFromServerRef.current = true;
      const restored: SoftDeletedRecord | undefined = data.restoredTrash;
      if (restored && restored.originalData) {
        const orig = restored.originalData;
        if (restored.entityType === 'patient') {
          setPatients((prev) => [orig, ...prev.filter((p) => p.id !== orig.id)]);
        } else if (restored.entityType === 'invoice') {
          setInvoices((prev) => [orig, ...prev.filter((i) => i.id !== orig.id)]);
        } else if (restored.entityType === 'doctor') {
          setDoctors((prev) => [orig, ...prev.filter((d) => d.id !== orig.id)]);
        } else if (restored.entityType === 'labTest') {
          setLabTests((prev) => [orig, ...prev.filter((t) => t.id !== orig.id)]);
        } else if (restored.entityType === 'employee') {
          setEmployees((prev) => [orig, ...prev.filter((e) => e.id !== orig.id)]);
        } else if (restored.entityType === 'expense') {
          setExpenses((prev) => [orig, ...prev.filter((e) => e.id !== orig.id)]);
        } else if (restored.entityType === 'shiftHandover') {
          setShiftHandovers((prev) => [orig, ...prev.filter((h) => h.id !== orig.id)]);
        } else if (restored.entityType === 'opdAppointment') {
          setOpdAppointments((prev) => [orig, ...prev.filter((a) => a.id !== orig.id)]);
        } else if (restored.entityType === 'userAccount') {
          setUsers((prev) => [orig, ...prev.filter((u) => u.id !== orig.id)]);
        } else if (restored.entityType === 'backupHistory') {
          setBackupHistory((prev) => [orig, ...prev.filter((b) => b.id !== orig.id)]);
        } else if (restored.entityType === 'prescription') {
          setPrescriptions((prev) => [orig, ...prev.filter((r) => r.id !== orig.id)]);
        } else if (restored.entityType === 'ecgReport') {
          setEcgReports((prev) => [orig, ...prev.filter((e) => e.id !== orig.id)]);
        } else if (restored.entityType === 'xrayReport') {
          setXrayReports((prev) => [orig, ...prev.filter((x) => x.id !== orig.id)]);
        } else if (restored.entityType === 'usgReport') {
          setUsgReports((prev) => [orig, ...prev.filter((u) => u.id !== orig.id)]);
        }
      }

      if (Array.isArray(data.trashRecords)) {
        setTrashRecords(data.trashRecords);
      }
      if (data.auditLog) {
        setAuditLogs((prev) => [data.auditLog, ...prev]);
      }
      setDbVersion(data.dbVersion || dbVersion + 1);

      addNotification(
        lang === 'bn' ? 'তথ্য পুনরুদ্ধার সম্পন্ন (Restored)' : 'Record Restored Successfully',
        lang === 'bn'
          ? `"${restored?.recordTitle || trashId}" সফলভাবে রিসাইকেল বিন থেকে মূল মডিউলে ফিরিয়ে আনা হয়েছে।`
          : `Record "${restored?.recordTitle || trashId}" has been restored to active database.`,
        'success'
      );

      setTimeout(() => {
        isHydratingFromServerRef.current = false;
      }, 250);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Restore failed.' };
    }
  };

  const permanentlyDeleteFromRecycleBin = async (
    trashId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/db/permanent-delete', {
        method: 'POST',
        headers: getActorHeaders(),
        body: JSON.stringify({
          trashId,
          confirmPermanent: true,
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Permanent Delete ব্যর্থ হয়েছে।',
        };
      }

      if (Array.isArray(data.trashRecords)) {
        setTrashRecords(data.trashRecords);
      }
      if (data.auditLog) {
        setAuditLogs((prev) => [data.auditLog, ...prev]);
      }
      setDbVersion(data.dbVersion || dbVersion + 1);

      addNotification(
        lang === 'bn' ? 'স্থায়ীভাবে মুছে ফেলা হয়েছে (Permanent Delete)' : 'Permanently Deleted',
        lang === 'bn'
          ? 'রেকর্ডটি রিসাইকেল বিন থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে এবং অডিট লগে নথিভুক্ত হয়েছে।'
          : 'Record permanently purged from Recycle Bin and logged in immutable Audit Trail.',
        'error'
      );

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Permanent delete failed.' };
    }
  };

  const simulateUnauthorizedDeleteAttempt = async (
    simulatedRole: string = 'Billing',
    targetLabel: string = 'Patient Record (PID: 26100294)'
  ): Promise<{ status: number; error: string }> => {
    try {
      const res = await fetch('/api/db/delete', {
        method: 'POST',
        headers: {
          ...getActorHeaders(simulatedRole),
          'x-actor-id': 'usr-simulated-nonadmin',
          'x-actor-username': simulatedRole.toLowerCase() + '_staff',
          'x-actor-fullname': `Simulated ${simulatedRole} Staff`,
          'x-actor-role': simulatedRole,
        },
        body: JSON.stringify({
          entityType: 'patient',
          entityLabel: targetLabel,
          recordId: '26100294',
          recordTitle: targetLabel,
          deletionReason: 'Test non-admin delete attempt',
        }),
      });
      const data = await res.json();
      // Refresh audit logs from server
      const stateRes = await fetch('/api/db/state');
      if (stateRes.ok) {
        const stateData = await stateRes.json();
        if (stateData?.collections?.auditLogs) {
          setAuditLogs(stateData.collections.auditLogs);
        }
      }
      return {
        status: res.status,
        error: data.error || '403 Forbidden: Admin-Only Delete Permission Enforced',
      };
    } catch (err: any) {
      return { status: 500, error: err?.message || 'Request failed' };
    }
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        theme,
        setTheme,
        t,
        activeTab,
        setActiveTab,
        users,
        currentUser,
        setCurrentUser,
        loginUser,
        logoutUser,
        addUser,
        updateUser,
        deleteUser,
        hasAccessToModule,
        getAllowedTabs,
        workstations,
        currentWorkstationId,
        currentWorkstation,
        setCurrentWorkstationId,
        updateWorkstation,
        addWorkstation,
        auditLogs,
        addAuditLog,
        clearAuditLogs,
        broadcastLanEvent,
        clinicConfig,
        updateClinicConfig,
        doctors,
        addDoctor,
        updateDoctor,
        deleteDoctor,
        labTests,
        addLabTest,
        updateLabTest,
        deleteLabTest,
        resetLabTestsToDefault,
        patients,
        addPatient,
        updatePatient,
        deletePatient,
        selectedPatientForReport,
        setSelectedPatientForReport,
        invoices,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        prescriptions,
        addPrescription,
        deletePrescription,
        ecgReports,
        addEcgReport,
        deleteEcgReport,
        xrayReports,
        addXrayReport,
        deleteXrayReport,
        usgReports,
        addUsgReport,
        deleteUsgReport,
        opdAppointments,
        setOpdAppointments,
        addOpdAppointment,
        updateOpdAppointment,
        deleteOpdAppointment,
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        is2FAEnabled,
        setIs2FAEnabled,
        is2FAVerified,
        setIs2FAVerified,
        open2FAModal,
        setOpen2FAModal,
        notifications,
        addNotification,
        markNotificationsAsRead,
        unreadCount,
        chatMessages,
        sendChatMessage,
        cloudSyncStatus,
        lastSyncTime,
        triggerManualSync,
        systemLogs,
        addLog,
        resetToSampleData,
        printLogs,
        addPrintLog,
        clearPrintLogs,
        backupHistory,
        autoDailyBackupEnabled,
        setAutoDailyBackupEnabled,
        lastAutoBackupDate,
        autoBackupConfig,
        updateAutoBackupConfig,
        runAutomatedBackupNow,
        exportDatabaseJson,
        exportDatabaseSqlDump,
        exportEncryptedDatabaseJson,
        restoreDatabaseFromJson,
        decryptAndRestoreDatabase,
        deleteBackupHistoryEntry,
        clearAllLocalVaultBackups,
        daysSinceLastBackup,
        isBackupOverdue,
        selectedPatientForOverview,
        setSelectedPatientForOverview,
        openPatientOverviewModal,
        isOnline,
        showShortcutsModal,
        setShowShortcutsModal,
        showGlobalSearch,
        setShowGlobalSearch,
        licenseInfo,
        renewLicense,
        simulateLicenseDays,
        simulateTrialDays,
        resetLicenseToInstallState,
        openLicenseModal,
        setOpenLicenseModal,
        openMobileRemoteModal,
        setOpenMobileRemoteModal,
        institutions,
        updateInstitution,
        lockInstitution,
        unlockInstitution,
        killInstitution,
        reactivateInstitution,
        renewInstitutionLicense,
        updateInstitutionAllowedModules,
        mobileRemotePassword,
        updateMobileRemotePassword,
        lockWorkstation,
        unlockWorkstation,
        killWorkstation,
        reactivateWorkstation,
        updateWorkstationAllowedModules,
        executeOfflineRemoteCommand,
        shiftHandovers,
        addShiftHandover,
        updateShiftHandover,
        acknowledgeShiftHandover,
        deleteShiftHandover,
        activeShiftHandoverCount,
        autoSaveStatus,
        lastAutoSavedAt,
        dbVersion,
        pendingOfflineMutationsCount,
        activeDrafts,
        updateModuleDraft,
        triggerImmediateAutoSave,
        retryOfflineMutations,
        isAdminUser,
        trashRecords,
        printRecords,
        recordPrintOrPdfAction,
        pendingDeleteRequest,
        setPendingDeleteRequest,
        openRecycleBinModal,
        setOpenRecycleBinModal,
        requestDeleteRecord,
        confirmAdminSoftDelete,
        restoreFromRecycleBin,
        permanentlyDeleteFromRecycleBin,
        simulateUnauthorizedDeleteAttempt,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
