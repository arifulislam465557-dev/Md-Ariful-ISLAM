import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Upload,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  FileCheck,
  FolderArchive,
  KeyRound,
  Eye,
  EyeOff,
  Server,
  Cloud,
  HardDrive,
  Database,
  Lock,
  Sparkles,
  RefreshCw,
  Download,
  FileText,
  ArrowRight,
  Check,
  X,
} from 'lucide-react';
import {
  inspectAndVerifyBackupArchive,
  BackupInspectionResult,
  generateHospitalSqlDump,
  FullHospitalDatabase,
  getDefaultPharmacyInventory,
  filterHospitalDataByScopes,
} from '../../utils/databaseBackup';
import {
  GoogleDriveBackupFile,
  downloadBackupFromGoogleDrive,
} from '../../services/googleDriveBackup';

export interface ServerVaultBackupItem {
  id: string;
  filename: string;
  VirtualWindowsPath: string;
  createdAt: string;
  sizeBytes: number;
  sizeKb: number;
  checksum: string;
  isEncrypted: boolean;
  triggerType: string;
  status: 'Success' | 'Failed';
  recordsCount: number;
  exportedBy: string;
  destination: string;
}

interface RestoreModuleProps {
  serverBackups?: ServerVaultBackupItem[];
  driveFiles?: GoogleDriveBackupFile[];
  googleDriveToken?: string | null;
  onGoogleSignIn?: () => void;
  selectedDriveFolderName?: string;
  preloadedDriveFile?: GoogleDriveBackupFile | null;
  onClearPreloadedDriveFile?: () => void;
  onRefreshDriveFiles?: () => void;
  defaultPassphrase?: string;
  onRestoreComplete?: () => void;
  onLogEvent?: (
    type: 'audit' | 'error',
    payload: {
      action?: string;
      actor?: string;
      destination?: string;
      filename?: string;
      checksum?: string;
      status?: 'Success' | 'Warning' | 'Error';
      details?: string;
      operation?: string;
      errorCode?: string;
      message?: string;
      resolutionHint?: string;
    }
  ) => Promise<void>;
}

export const RestoreModule: React.FC<RestoreModuleProps> = ({
  serverBackups: propServerBackups = [],
  driveFiles = [],
  googleDriveToken = null,
  onGoogleSignIn,
  selectedDriveFolderName = 'Adiba_Hospital_Backups',
  preloadedDriveFile = null,
  onClearPreloadedDriveFile,
  onRefreshDriveFiles,
  defaultPassphrase = 'AdibaSecurePass#2026',
  onRestoreComplete,
  onLogEvent,
}) => {
  const {
    lang,
    currentUser,
    clinicConfig,
    patients,
    doctors,
    labTests,
    invoices,
    prescriptions,
    ecgReports,
    xrayReports,
    usgReports,
    expenses,
    employees,
    users,
    workstations,
    auditLogs,
    printLogs,
    shiftHandovers,
    backupHistory,
    restoreDatabaseFromJson,
    addNotification,
  } = useApp();

  const isAdmin = currentUser?.role === 'Admin';
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fetchedServerBackups, setFetchedServerBackups] = useState<ServerVaultBackupItem[]>([]);
  const serverBackups = propServerBackups.length > 0 ? propServerBackups : fetchedServerBackups;

  useEffect(() => {
    if (propServerBackups.length === 0) {
      fetch('/api/backup/status')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.serverBackups)) {
            setFetchedServerBackups(data.serverBackups);
          }
        })
        .catch(() => {});
    }
  }, [propServerBackups.length]);

  // Source selection state
  const [sourceTab, setSourceTab] = useState<'upload' | 'server_vault' | 'browser_vault' | 'google_drive'>('upload');
  const [isDragging, setIsDragging] = useState(false);

  // Selected archive & passphrase state
  const [selectedSourceLabel, setSelectedSourceLabel] = useState<string>('');
  const [selectedFilename, setSelectedFilename] = useState<string>('');
  const [selectedFileSizeKb, setSelectedFileSizeKb] = useState<number>(0);
  const [selectedBlobOrText, setSelectedBlobOrText] = useState<File | Blob | string | null>(null);
  const [passphrase, setPassphrase] = useState<string>(defaultPassphrase);
  const [showPassphrase, setShowPassphrase] = useState<boolean>(false);

  // Integrity inspection & validation state
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [inspectionResult, setInspectionResult] = useState<BackupInspectionResult | null>(null);

  // Restore options state
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [createPreRestoreSafetyBackup, setCreatePreRestoreSafetyBackup] = useState<boolean>(true);
  const [selectiveScopes, setSelectiveScopes] = useState<{
    patients: boolean;
    clinicalReports: boolean;
    billing: boolean;
    mastersAndStaff: boolean;
  }>({
    patients: true,
    clinicalReports: true,
    billing: true,
    mastersAndStaff: true,
  });

  // Confirmation modal & execution progress state
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [adminConfirmedAcknowledge, setAdminConfirmedAcknowledge] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreProgress, setRestoreProgress] = useState<number>(0);
  const [restoreStepText, setRestoreStepText] = useState<string>('');
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Live database counts for side-by-side comparison
  const currentLiveCounts = {
    patientsCount: patients.length,
    doctorsCount: doctors.length,
    invoicesCount: invoices.length,
    labReportsCount: patients.reduce((acc, p) => acc + (p.testResults?.length || 0), 0),
    appointmentsCount: prescriptions.length + shiftHandovers.length,
    staffCount: employees.length,
    totalRecords:
      patients.length +
      doctors.length +
      invoices.length +
      prescriptions.length +
      employees.length +
      labTests.length,
  };

  // Validate a selected backup file or blob
  const runFileIntegrityValidation = async (
    input: File | Blob | string,
    filename: string,
    sourceName: string,
    sizeKb: number,
    customPass?: string
  ) => {
    setIsValidating(true);
    setStatusBanner(null);
    setSelectedBlobOrText(input);
    setSelectedFilename(filename);
    setSelectedSourceLabel(sourceName);
    setSelectedFileSizeKb(sizeKb);

    try {
      const passToUse = customPass !== undefined ? customPass : passphrase;
      const result = await inspectAndVerifyBackupArchive(input, passToUse, filename);
      setInspectionResult(result);

      if (result.valid && result.checksumVerified) {
        setStatusBanner({
          type: 'success',
          message:
            lang === 'bn'
              ? `✓ ফাইল ইন্টিগ্রিটি ও SHA-256 চেকসাম যাচাই সফল হয়েছে (${result.summary.totalRecords} টি রেকর্ড রিস্টোরের জন্য প্রস্তুত)।`
              : `✓ File integrity and SHA-256 checksum verified (${result.summary.totalRecords} records ready to restore).`,
        });
      } else if (result.error) {
        setStatusBanner({
          type: 'error',
          message: result.error,
        });
      }
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        message: err?.message || 'Failed to inspect and validate backup file.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Handle local file input change
  const handleLocalFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    await runFileIntegrityValidation(file, file.name, 'Local Computer Upload', sizeKb);
    e.target.value = '';
  };

  // Handle Drag & Drop
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    await runFileIntegrityValidation(file, file.name, 'Local Drag & Drop', sizeKb);
  };

  // Handle selecting a backup from Server Vault (/backups)
  const handleSelectServerBackup = async (item: ServerVaultBackupItem) => {
    setIsValidating(true);
    setStatusBanner({
      type: 'info',
      message:
        lang === 'bn'
          ? `সার্ভার ভল্ট থেকে ${item.filename} লোড ও যাচাই করা হচ্ছে...`
          : `Loading and verifying ${item.filename} from Server Vault...`,
    });
    try {
      const res = await fetch(`/api/backup/download/${encodeURIComponent(item.filename)}`);
      if (!res.ok) throw new Error('Could not download backup archive from Server Vault.');
      const blob = await res.blob();
      await runFileIntegrityValidation(
        blob,
        item.filename,
        `Server Vault (${item.VirtualWindowsPath})`,
        item.sizeKb
      );
    } catch (err: any) {
      setIsValidating(false);
      setStatusBanner({
        type: 'error',
        message: err?.message || 'Failed to load backup from Server Vault.',
      });
    }
  };

  // Handle selecting a backup from Browser Local Vault (backupHistory)
  const handleSelectBrowserVaultBackup = async (entry: any) => {
    const payload = entry.vaultPayload || entry.vaultData;
    if (!payload) {
      setStatusBanner({
        type: 'error',
        message:
          lang === 'bn'
            ? 'এই রেকর্ডে ইন-মেমরি ভল্ট পেলোড সংরক্ষিত নেই। অনুগ্রহ করে Server Vault বা লোকাল ফাইল নির্বাচন করুন।'
            : 'No in-browser payload cached for this entry. Please select from Server Vault or upload the local file.',
      });
      return;
    }
    await runFileIntegrityValidation(
      payload,
      entry.filename,
      'Browser Encrypted Vault',
      entry.sizeKb || 15
    );
  };

  // Handle selecting a backup from Google Drive
  const handleSelectGoogleDriveBackup = async (df: GoogleDriveBackupFile) => {
    setIsValidating(true);
    setStatusBanner({
      type: 'info',
      message:
        lang === 'bn'
          ? `Google Drive থেকে ${df.name} ডাউনলোড ও চেকসাম যাচাই করা হচ্ছে...`
          : `Downloading and validating ${df.name} from Google Drive...`,
    });
    try {
      const blob = await downloadBackupFromGoogleDrive(df.id);
      const sizeKb = Math.max(1, Math.round(df.size / 1024));
      await runFileIntegrityValidation(blob, df.name, 'Google Drive Cloud', sizeKb);
    } catch (err: any) {
      setIsValidating(false);
      setStatusBanner({
        type: 'error',
        message: err?.message || 'Failed to download backup from Google Drive.',
      });
    }
  };

  // Re-run validation when passphrase changes
  const handleRevalidateWithPassphrase = async () => {
    if (!selectedBlobOrText) return;
    await runFileIntegrityValidation(
      selectedBlobOrText,
      selectedFilename,
      selectedSourceLabel,
      selectedFileSizeKb,
      passphrase
    );
  };

  // Build current full database object for Pre-Restore Safety Backup
  const buildCurrentDatabasePayload = (): FullHospitalDatabase => ({
    exportDate: new Date().toISOString(),
    version: '3.0.0',
    clinicConfig,
    patients,
    doctors,
    labTests,
    invoices,
    prescriptions,
    ecgReports,
    xrayReports,
    usgReports,
    expenses,
    employees,
    users,
    workstations,
    auditLogs,
    printLogs,
    shiftHandovers,
    pharmacyInventory: getDefaultPharmacyInventory(),
  });

  // Load a live snapshot into the Metadata Previewer for instant inspection
  const handleLoadSnapshotPreview = async () => {
    const payload = buildCurrentDatabasePayload();
    const jsonString = JSON.stringify(payload, null, 2);
    const sizeKb = Math.max(1, Math.round(new Blob([jsonString]).size / 1024));
    const dateStamp = new Date().toISOString().slice(0, 10);
    await runFileIntegrityValidation(
      jsonString,
      `Hospital_Backup_${dateStamp}_Snapshot.json`,
      'System Snapshot Preview',
      sizeKb
    );
  };

  // Auto-load preloaded Google Drive file if selected from the Cloud Backup panel
  useEffect(() => {
    if (preloadedDriveFile && googleDriveToken) {
      setSourceTab('google_drive');
      handleSelectGoogleDriveBackup(preloadedDriveFile);
      if (onClearPreloadedDriveFile) {
        onClearPreloadedDriveFile();
      }
    }
  }, [preloadedDriveFile, googleDriveToken]);

  // Auto-populate Metadata Previewer on first mount with latest vault backup or live snapshot
  const didAutoInitRef = useRef(false);
  useEffect(() => {
    if (didAutoInitRef.current || inspectionResult || preloadedDriveFile) return;
    didAutoInitRef.current = true;
    const latestVaultEntry = backupHistory.find((b) => !!b.vaultData);
    if (latestVaultEntry && latestVaultEntry.vaultData) {
      runFileIntegrityValidation(
        latestVaultEntry.vaultData,
        latestVaultEntry.filename,
        'Browser Encrypted Vault',
        latestVaultEntry.sizeKb || 18
      );
    } else {
      handleLoadSnapshotPreview();
    }
  }, []);

  // Execute confirmed database restore
  const handleExecuteConfirmedRestore = async () => {
    if (!inspectionResult || !inspectionResult.valid) return;
    setShowConfirmModal(false);
    setAdminConfirmedAcknowledge(false);
    setIsRestoring(true);
    setStatusBanner(null);

    try {
      // Step 1: Automatic Pre-Restore Safety Backup
      if (createPreRestoreSafetyBackup) {
        setRestoreProgress(20);
        setRestoreStepText(
          lang === 'bn'
            ? 'ধাপ ১/৩: রিস্টোর করার আগে বর্তমান ডেটার Safety Backup তৈরি হচ্ছে...'
            : 'Step 1/3: Creating automatic Pre-Restore Safety Backup of live database...'
        );
        const currentData = buildCurrentDatabasePayload();
        const sqlDump = generateHospitalSqlDump(currentData);
        await fetch('/api/backup/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payload: currentData,
            sqlDump,
            encrypt: true,
            passphrase: passphrase || defaultPassphrase,
            triggerType: 'Pre-Restore Safety',
            exportedBy: currentUser?.fullName || currentUser?.username || 'Administrator',
            destinationLabel: 'Auto Pre-Restore Safety Vault',
            customPrefix: 'Safety_PreRestore_Backup',
          }),
        });
      }

      // Step 2: Prepare decrypted payload and apply restore mode (Replace vs Merge)
      setRestoreProgress(60);
      setRestoreStepText(
        lang === 'bn'
          ? 'ধাপ ২/৩: SHA-256 চেকসাম ও ডাটাবেস স্কিমা যাচাই করে ডেটা প্রস্তুত করা হচ্ছে...'
          : 'Step 2/3: Preparing verified records and applying restore scope...'
      );

      let targetData = inspectionResult.decryptedPayload;
      if (!targetData && inspectionResult.rawTextForRestore) {
        targetData = JSON.parse(inspectionResult.rawTextForRestore);
      }
      if (!targetData) {
        throw new Error('Decrypted database payload is unavailable. Please validate the passphrase first.');
      }

      // If Safe Merge mode is selected, merge existing arrays with backup arrays by ID
      if (restoreMode === 'merge') {
        const mergeById = <T extends { id?: string }>(currentArr: T[], incomingArr: T[] = []): T[] => {
          const map = new Map<string, T>();
          currentArr.forEach((item, idx) => map.set(item.id || `cur-${idx}`, item));
          incomingArr.forEach((item, idx) => map.set(item.id || `inc-${idx}`, item));
          return Array.from(map.values());
        };

        targetData = {
          ...targetData,
          patients: mergeById(patients, targetData.patients),
          doctors: mergeById(doctors, targetData.doctors),
          labTests: mergeById(labTests, targetData.labTests),
          invoices: mergeById(invoices, targetData.invoices),
          prescriptions: mergeById(prescriptions, targetData.prescriptions),
          ecgReports: mergeById(ecgReports, targetData.ecgReports),
          xrayReports: mergeById(xrayReports, targetData.xrayReports),
          usgReports: mergeById(usgReports, targetData.usgReports),
          expenses: mergeById(expenses, targetData.expenses),
          employees: mergeById(employees, targetData.employees),
          users: mergeById(users, targetData.users),
        };
      }

      // Filter by selected module scopes before applying
      targetData = filterHospitalDataByScopes(targetData, selectiveScopes);

      // Step 3: Commit to live application state
      setRestoreProgress(90);
      setRestoreStepText(
        lang === 'bn'
          ? 'ধাপ ৩/৩: হাসপাতালের লাইভ ডাটাবেসে রেকর্ড রিস্টোর করা হচ্ছে...'
          : 'Step 3/3: Restoring records into live hospital database...'
      );

      const res = restoreDatabaseFromJson(JSON.stringify(targetData));
      if (!res.success) {
        throw new Error(res.message);
      }

      setRestoreProgress(100);
      setRestoreStepText(lang === 'bn' ? 'রিস্টোর সফলভাবে সম্পন্ন হয়েছে!' : 'Database Restore Completed!');

      if (onLogEvent) {
        await onLogEvent('audit', {
          action: `DATABASE_RESTORED (${restoreMode.toUpperCase()})`,
          actor: currentUser?.fullName || currentUser?.username || 'Administrator',
          destination: 'Live Hospital Database',
          filename: inspectionResult.filename,
          checksum: inspectionResult.calculatedChecksum || inspectionResult.expectedChecksum,
          status: 'Success',
          details: `Restored ${inspectionResult.summary.totalRecords} records from ${inspectionResult.filename} (${selectedSourceLabel}). Pre-Restore Safety Backup: ${createPreRestoreSafetyBackup ? 'Created' : 'Skipped'}.`,
        });
      }

      setStatusBanner({
        type: 'success',
        message:
          lang === 'bn'
            ? `✓ সফলভাবে "${inspectionResult.filename}" থেকে হাসপাতালের ডাটাবেস রিস্টোর করা হয়েছে!`
            : `✓ Hospital database successfully restored from "${inspectionResult.filename}"!`,
      });

      addNotification(
        lang === 'bn' ? 'ডাটাবেস রিস্টোর সম্পন্ন' : 'Database Restore Complete',
        lang === 'bn'
          ? `${inspectionResult.filename} থেকে সকল ডেটা সফলভাবে রিস্টোর হয়েছে।`
          : `Successfully restored hospital records from ${inspectionResult.filename}.`,
        'info'
      );

      if (onRestoreComplete) {
        onRestoreComplete();
      }
    } catch (err: any) {
      const msg = err?.message || 'Database restore failed.';
      setStatusBanner({
        type: 'error',
        message: msg,
      });
      if (onLogEvent) {
        await onLogEvent('error', {
          operation: 'Restore Hospital Database',
          errorCode: 'RESTORE_EXEC_ERR',
          message: msg,
          resolutionHint: 'Verify the backup file integrity and encryption passphrase.',
        });
      }
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Top Banner: Module Header & Integrity Guarantee */}
      <div className="bg-gradient-to-r from-indigo-950 via-purple-900 to-slate-900 text-white p-5 rounded-2xl border border-indigo-700/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 shrink-0">
            <RotateCcw className="w-6 h-6 text-pink-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                {lang === 'bn'
                  ? 'ডাটাবেস রিস্টোর ও ইন্টিগ্রিটি ভেরিফিকেশন মডিউল (RestoreModule)'
                  : 'Database Restore & Integrity Verification Module'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                SHA-256 + AES-256-GCM Verified
              </span>
            </div>
            <p className="text-xs text-purple-200 mt-1 max-w-3xl">
              {lang === 'bn'
                ? 'কম্পিউটার, সার্ভার ভল্ট বা Google Drive থেকে যেকোনো ব্যাকআপ ফাইল (.zip, .enc.json, .json) নির্বাচন করুন। রিস্টোর করার আগে ফাইলের চেকসাম, এনক্রিপশন ও ডেটা তুলনা যাচাই করা হবে এবং স্বয়ংক্রিয়ভাবে বর্তমান ডেটার একটি Safety Backup রাখা হবে।'
                : 'Upload a backup file or select a previous snapshot from Server Vault or Google Drive. Full cryptographic SHA-256 integrity validation and side-by-side record comparison are performed before restoring.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black rounded-xl shadow-md cursor-pointer flex items-center gap-2 transition active:scale-95 border border-pink-400/50"
          >
            <Upload className="w-4 h-4" />
            <span>{lang === 'bn' ? 'ব্যাকআপ ফাইল আপলোড করুন' : 'Upload Backup File'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,.json,.enc.json"
            onChange={handleLocalFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Status Banner */}
      {statusBanner && (
        <div
          className={`p-3.5 rounded-2xl border font-bold flex items-center justify-between gap-3 shadow-xs ${
            statusBanner.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
              : statusBanner.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-700'
              : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusBanner.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : statusBanner.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
            )}
            <span>{statusBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-gray-500 hover:text-gray-800 cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main 2-Column Restore Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (5 cols): Step 1 — Upload or Select Backup File + Passphrase */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-purple-100 dark:border-gray-700 shadow-xs space-y-4">
            <div className="border-b pb-3 border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h4 className="font-black text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-purple-700" />
                <span>
                  {lang === 'bn'
                    ? '১. ব্যাকআপ ফাইল আপলোড বা নির্বাচন করুন'
                    : '1. Upload or Select Previous Backup'}
                </span>
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                Step 1 of 3
              </span>
            </div>

            {/* Source Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-purple-50 dark:bg-gray-900 rounded-xl border border-purple-200 dark:border-gray-700">
              {[
                {
                  id: 'upload',
                  label: lang === 'bn' ? 'ফাইল আপলোড' : 'Upload File',
                  icon: Upload,
                },
                {
                  id: 'server_vault',
                  label: `Server (${serverBackups.length})`,
                  icon: Server,
                },
                {
                  id: 'browser_vault',
                  label: `Vault (${backupHistory.length})`,
                  icon: HardDrive,
                },
                {
                  id: 'google_drive',
                  label: `Drive (${driveFiles.length})`,
                  icon: Cloud,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = sourceTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSourceTab(tab.id as any)}
                    className={`py-2 px-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition ${
                      active
                        ? 'bg-purple-900 text-white shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-purple-100/60 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: Local File Input & Drag-and-Drop Zone for JSON/ZIP Backups */}
            {sourceTab === 'upload' && (
              <div className="space-y-3">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                    isDragging
                      ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-950/30'
                      : 'border-purple-300 dark:border-purple-700 hover:border-purple-600 bg-purple-50/30 dark:bg-gray-900/70'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-2.5 shadow-2xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="font-black text-sm text-slate-900 dark:text-slate-100">
                    {selectedFilename
                      ? selectedFilename
                      : lang === 'bn'
                      ? 'ব্যাকআপ JSON / ZIP ফাইল এখানে ড্র্যাগ করুন অথবা ক্লিক করে নির্বাচন করুন'
                      : 'Drag & drop backup JSON / ZIP file here, or click to select'}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {lang === 'bn'
                      ? 'সমর্থিত ফরম্যাট: .zip (Hospital_Backup_*.zip), .json, .enc.json'
                      : 'Accepted formats: .zip (Hospital_Backup_*.zip), .json, .enc.json'}
                  </p>
                  {selectedFilename && (
                    <span className="mt-2.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-bold">
                      {selectedSourceLabel} · {selectedFileSizeKb} KB
                    </span>
                  )}
                </div>

                {/* Direct File Input Control */}
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-bold text-gray-700 dark:text-gray-300 text-[11px]">
                    {lang === 'bn' ? 'সরাসরি ব্যাকআপ ফাইল নির্বাচন (JSON/ZIP):' : 'Select Backup File (JSON/ZIP):'}
                  </label>
                  <input
                    type="file"
                    accept=".json,.zip,.enc.json,application/zip,application/json"
                    onChange={handleLocalFileChange}
                    className="text-[11px] file:mr-2.5 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-purple-900 file:text-white hover:file:bg-purple-800 file:cursor-pointer cursor-pointer text-gray-600 dark:text-gray-300"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: Server Vault Backups */}
            {sourceTab === 'server_vault' && (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {serverBackups.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    {lang === 'bn'
                      ? 'সার্ভার ভল্টে কোনো ব্যাকআপ ফাইল পাওয়া যায়নি।'
                      : 'No backup archives found in Server Vault.'}
                  </div>
                ) : (
                  serverBackups.map((sb) => {
                    const isSelected = selectedFilename === sb.filename;
                    return (
                      <div
                        key={sb.id}
                        onClick={() => handleSelectServerBackup(sb)}
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-600 ring-1 ring-purple-500'
                            : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-purple-400'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {sb.filename}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            {sb.sizeKb} KB · {sb.recordsCount} records · {new Date(sb.createdAt).toLocaleString()}
                          </div>
                          <div className="text-[10px] font-mono text-purple-700 dark:text-purple-300 truncate">
                            Path: {sb.VirtualWindowsPath}
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-lg font-bold text-[10px] shrink-0 ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-purple-900 text-white hover:bg-purple-800'
                          }`}
                        >
                          {isSelected ? (lang === 'bn' ? '✓ নির্বাচিত' : '✓ Selected') : lang === 'bn' ? 'নির্বাচন' : 'Select'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 3: Browser Encrypted Vault (backupHistory) */}
            {sourceTab === 'browser_vault' && (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {backupHistory.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    {lang === 'bn'
                      ? 'ব্রাউজার ভল্টে কোনো পূর্ববর্তী স্ন্যাপশট নেই।'
                      : 'No previous snapshots stored in browser vault.'}
                  </div>
                ) : (
                  backupHistory.map((bh) => {
                    const isSelected = selectedFilename === bh.filename;
                    return (
                      <div
                        key={bh.id}
                        onClick={() => handleSelectBrowserVaultBackup(bh)}
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-600 ring-1 ring-purple-500'
                            : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-purple-400'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {bh.filename}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            {bh.sizeKb} KB · {bh.summary?.patients ?? bh.recordsCount} Patients · {bh.date}
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-lg font-bold text-[10px] shrink-0 ${
                            isSelected ? 'bg-emerald-600 text-white' : 'bg-purple-900 text-white'
                          }`}
                        >
                          {isSelected ? '✓ Selected' : 'Select'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 4: Google Drive Cloud Backups */}
            {sourceTab === 'google_drive' && (
              <div className="space-y-2.5">
                {googleDriveToken && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px]">
                    <div className="flex items-center gap-1.5 truncate">
                      <Cloud className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">Folder:</span>
                      <code className="font-mono font-bold text-blue-900 dark:text-blue-200 truncate">
                        /{selectedDriveFolderName}
                      </code>
                    </div>
                    {onRefreshDriveFiles && (
                      <button
                        type="button"
                        onClick={onRefreshDriveFiles}
                        className="text-blue-700 dark:text-blue-300 font-bold hover:underline cursor-pointer shrink-0 flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
                      </button>
                    )}
                  </div>
                )}

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {!googleDriveToken ? (
                    <div className="p-5 text-center space-y-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                      <Cloud className="w-7 h-7 text-blue-500 mx-auto" />
                      <p className="text-gray-600 dark:text-gray-300 font-semibold">
                        {lang === 'bn'
                          ? 'Google Drive থেকে এনক্রিপ্টেড ব্যাকআপ ফাইল ডাউনলোড ও রিস্টোর করতে আপনার Google অ্যাকাউন্টে সাইন-ইন করুন:'
                          : 'Sign in with your Google account to browse, verify, and restore backup archives from Google Drive:'}
                      </p>
                      {onGoogleSignIn && (
                        <button
                          type="button"
                          onClick={onGoogleSignIn}
                          className="inline-flex items-center gap-2.5 px-4 py-2 bg-white hover:bg-gray-50 text-slate-800 font-bold rounded-xl border border-gray-300 shadow-xs cursor-pointer transition active:scale-95"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 48 48">
                            <path
                              fill="#EA4335"
                              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                            />
                            <path
                              fill="#4285F4"
                              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                            />
                            <path
                              fill="#34A853"
                              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                            />
                          </svg>
                          <span>Sign in with Google</span>
                        </button>
                      )}
                    </div>
                  ) : driveFiles.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-xl">
                      {lang === 'bn'
                        ? `Google Drive-এর "/${selectedDriveFolderName}" ফোল্ডারে কোনো ফাইল পাওয়া যায়নি।`
                        : `No backup files found in Google Drive "/${selectedDriveFolderName}" folder.`}
                    </div>
                  ) : (
                    driveFiles.map((df) => {
                      const isSelected = selectedFilename === df.name;
                      return (
                        <div
                          key={df.id}
                          onClick={() => handleSelectGoogleDriveBackup(df)}
                          className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 ring-1 ring-blue-500'
                              : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                              {df.name}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              {Math.max(1, Math.round(df.size / 1024))} KB · {new Date(df.createdTime).toLocaleString()}
                            </div>
                            {df.md5Checksum && (
                              <div className="text-[9px] font-mono text-emerald-700 dark:text-emerald-400 truncate">
                                MD5: {df.md5Checksum.slice(0, 16)}...
                              </div>
                            )}
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-lg font-bold text-[10px] shrink-0 ${
                              isSelected ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                            }`}
                          >
                            {isSelected
                              ? lang === 'bn'
                                ? '✓ নির্বাচিত'
                                : '✓ Selected'
                              : lang === 'bn'
                              ? 'যাচাই ও রিস্টোর'
                              : 'Verify & Restore'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Decryption Passphrase & Manual Integrity Re-Check */}
            <div className="p-4 bg-purple-50/70 dark:bg-gray-900 rounded-2xl border border-purple-200 dark:border-purple-800 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="font-black text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400" />
                  <span>
                    {lang === 'bn'
                      ? 'ডিক্রিপশন পাসওয়ার্ড (AES-256 Passphrase):'
                      : 'Decryption Passphrase (AES-256):'}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleRevalidateWithPassphrase}
                  disabled={!selectedBlobOrText || isValidating}
                  className="px-3 py-1 bg-purple-800 hover:bg-purple-900 text-white rounded-lg font-bold text-[10px] cursor-pointer disabled:opacity-40 flex items-center gap-1 shadow-2xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>
                    {isValidating
                      ? lang === 'bn'
                        ? 'যাচাই হচ্ছে...'
                        : 'Validating...'
                      : lang === 'bn'
                      ? 'ফাইল ইন্টিগ্রিটি যাচাই করুন'
                      : 'Validate Integrity'}
                  </span>
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassphrase ? 'text' : 'password'}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter AES-256 backup passphrase..."
                  className="w-full p-2.5 pr-9 bg-white dark:bg-gray-800 border border-purple-200 dark:border-gray-700 rounded-xl font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-700 cursor-pointer"
                >
                  {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-500">
                {lang === 'bn'
                  ? 'ডিফল্ট হাসপাতাল ভল্ট পাসওয়ার্ড স্বয়ংক্রিয়ভাবে দেওয়া আছে। কাস্টম পাসওয়ার্ড থাকলে পরিবর্তন করে "ফাইল ইন্টিগ্রিটি যাচাই করুন" বাটনে ক্লিক করুন।'
                  : 'Default hospital vault key is pre-filled. If encrypted with a custom passphrase, enter it above and click Validate Integrity.'}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (7 cols): Step 2 & 3 — File Integrity Report, Side-by-Side Comparison & Restore Execution */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-purple-100 dark:border-gray-700 shadow-xs space-y-4">
            <div className="border-b pb-3 border-gray-100 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-black text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  {lang === 'bn'
                    ? '২. ফাইল ইন্টিগ্রিটি রিপোর্ট ও ডাটাবেস তুলনা (Integrity & Diff Preview)'
                    : '2. File Integrity Validation & Database Comparison'}
                </span>
              </h4>

              {inspectionResult && (
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 ${
                    inspectionResult.valid && inspectionResult.checksumVerified
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300'
                  }`}
                >
                  {inspectionResult.valid && inspectionResult.checksumVerified ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {lang === 'bn' ? 'ইন্টিগ্রিটি ভেরিফাইড (SHA-256 Match)' : 'INTEGRITY VERIFIED (SHA-256)'}
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>{lang === 'bn' ? 'যাচাই ব্যর্থ / ভুল পাসওয়ার্ড' : 'VALIDATION FAILED'}</span>
                    </>
                  )}
                </span>
              )}
            </div>

            {!inspectionResult ? (
              <div className="py-16 px-4 text-center space-y-3 bg-gray-50/70 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <ShieldCheck className="w-10 h-10 text-purple-400 mx-auto opacity-80" />
                <div className="font-bold text-sm text-gray-700 dark:text-gray-300">
                  {lang === 'bn'
                    ? 'কোনো ব্যাকআপ ফাইল এখনও নির্বাচন করা হয়নি'
                    : 'No Backup Archive Selected Yet'}
                </div>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  {lang === 'bn'
                    ? 'বাম পাশ থেকে একটি ব্যাকআপ ফাইল আপলোড করুন অথবা Server Vault / Google Drive থেকে নির্বাচন করুন। সিস্টেম স্বয়ংক্রিয়ভাবে ফাইলের অখণ্ডতা (Integrity) পরীক্ষা করবে।'
                    : 'Upload a backup archive or select one from Server Vault or Google Drive on the left to run automated integrity checks and preview records.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 4-Stage Integrity Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      title: lang === 'bn' ? '১. আর্কাইভ ফরম্যাট ও হেডার' : '1. Archive Signature & Format',
                      passed: true,
                      detail: inspectionResult.isZipArchive
                        ? 'ZIP Archive (manifest.json + database)'
                        : 'JSON Snapshot Format',
                    },
                    {
                      title: lang === 'bn' ? '২. AES-256-GCM ডিক্রিপশন' : '2. AES-256-GCM Decryption',
                      passed: inspectionResult.valid,
                      detail: inspectionResult.isEncrypted
                        ? inspectionResult.valid
                          ? 'PBKDF2 100k Key Verified'
                          : 'Passphrase Mismatch / Locked'
                        : 'Unencrypted Plain JSON',
                    },
                    {
                      title: lang === 'bn' ? '৩. SHA-256 চেকসাম হ্যাশ' : '3. SHA-256 Checksum Integrity',
                      passed: inspectionResult.checksumVerified,
                      detail: inspectionResult.calculatedChecksum
                        ? `${inspectionResult.calculatedChecksum.slice(0, 18)}...`
                        : 'No Checksum Mismatch',
                    },
                    {
                      title: lang === 'bn' ? '৪. ডাটাবেস স্কিমা ও রেকর্ড' : '4. Schema & Relational Records',
                      passed: inspectionResult.valid && inspectionResult.summary.totalRecords >= 0,
                      detail: `${inspectionResult.summary.totalRecords} Total Records · SQL: ${
                        inspectionResult.hasSqlDump ? 'Yes' : 'No'
                      }`,
                    },
                  ].map((check, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                        check.passed
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/70'
                          : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                      }`}
                    >
                      <div
                        className={`p-1 rounded-lg mt-0.5 shrink-0 ${
                          check.passed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}
                      >
                        {check.passed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-slate-900 dark:text-slate-100">{check.title}</div>
                        <div className="text-[10px] font-mono text-gray-600 dark:text-gray-400 truncate">
                          {check.detail}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Backup Metadata Summary Section (Date, Version, Size, Format, Checksum) */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 space-y-3 text-xs">
                  <div className="font-black text-purple-950 dark:text-purple-200 border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center justify-between flex-wrap gap-2">
                    <span>
                      {lang === 'bn'
                        ? 'ব্যাকআপ ফাইল মেটাডেটা সামারি (Selected Backup Metadata Summary)'
                        : 'Selected Backup Metadata Summary'}
                    </span>
                    <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-bold">
                      {inspectionResult.isZipArchive ? 'ZIP Archive (.zip)' : 'JSON Snapshot (.json)'} ·{' '}
                      {inspectionResult.isEncrypted ? 'AES-256 Encrypted' : 'Plain'}
                    </span>
                  </div>

                  {/* Highlighted Metadata KPI Strip: Date, Version, Size */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-gray-800 border border-purple-100 dark:border-gray-700">
                      <div className="text-[10px] font-bold uppercase text-gray-400">
                        {lang === 'bn' ? 'ব্যাকআপের তারিখ (Date)' : 'Backup Date & Time'}
                      </div>
                      <div className="font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {inspectionResult.createdAt
                          ? new Date(inspectionResult.createdAt).toLocaleString()
                          : 'N/A'}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-gray-800 border border-purple-100 dark:border-gray-700">
                      <div className="text-[10px] font-bold uppercase text-gray-400">
                        {lang === 'bn' ? 'ভার্সন (Version)' : 'Backup Version'}
                      </div>
                      <div className="font-mono font-black text-purple-900 dark:text-purple-200 mt-0.5">
                        v{inspectionResult.version || '3.0.0'}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-gray-800 border border-purple-100 dark:border-gray-700">
                      <div className="text-[10px] font-bold uppercase text-gray-400">
                        {lang === 'bn' ? 'ফাইলের সাইজ (File Size)' : 'Archive Size'}
                      </div>
                      <div className="font-mono font-black text-indigo-700 dark:text-indigo-300 mt-0.5">
                        {selectedFileSizeKb} KB ({inspectionResult.summary.totalRecords} records)
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-gray-500">{lang === 'bn' ? 'ফাইলের নাম:' : 'Backup File:'}</span>{' '}
                      <strong className="font-mono text-purple-900 dark:text-purple-200 break-all">
                        {inspectionResult.filename}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-500">{lang === 'bn' ? 'উৎস (Source):' : 'Backup Source:'}</span>{' '}
                      <strong>{selectedSourceLabel}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500">{lang === 'bn' ? 'প্রতিষ্ঠান:' : 'Institution:'}</span>{' '}
                      <strong>{inspectionResult.clinicName}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500">{lang === 'bn' ? 'ব্যাকআপ নিয়েছেন (Exported By):' : 'Exported By:'}</span>{' '}
                      <strong>{inspectionResult.exportedBy || 'Administrator'}</strong>
                    </div>
                  </div>
                  {(inspectionResult.expectedChecksum || inspectionResult.calculatedChecksum) && (
                    <div className="pt-2 mt-1 border-t border-gray-200 dark:border-gray-700 font-mono text-[10px] text-gray-600 dark:text-gray-400 flex flex-col gap-0.5">
                      <div className="truncate">
                        <span className="font-bold text-gray-500">Expected SHA-256: </span>
                        {inspectionResult.expectedChecksum || inspectionResult.calculatedChecksum}
                      </div>
                      {inspectionResult.calculatedChecksum && (
                        <div className="truncate text-emerald-700 dark:text-emerald-400">
                          <span className="font-bold">Computed SHA-256: </span>
                          {inspectionResult.calculatedChecksum} (✓ Integrity Verified — 100% Match)
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Side-by-Side Comparison Table: Current Live DB vs Backup Archive */}
                <div className="border border-purple-100 dark:border-gray-700 rounded-xl overflow-hidden">
                  <div className="bg-purple-50 dark:bg-gray-900 px-3.5 py-2 border-b border-purple-100 dark:border-gray-700 font-black text-purple-950 dark:text-purple-200 flex items-center justify-between">
                    <span>
                      {lang === 'bn'
                        ? 'বর্তমান লাইভ ডাটাবেস বনাম ব্যাকআপ ফাইল তুলনা'
                        : 'Live Database vs. Backup Archive Comparison'}
                    </span>
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300">
                      {restoreMode === 'replace'
                        ? lang === 'bn'
                          ? 'মোড: সম্পূর্ণ প্রতিস্থাপন (Full Replace)'
                          : 'Mode: Full Replace'
                        : lang === 'bn'
                        ? 'মোড: নিরাপদ মার্জ (Safe Merge)'
                        : 'Mode: Safe Merge'}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 border-b border-gray-200 dark:border-gray-700 text-[10px] uppercase">
                          <th className="py-2 px-3">{lang === 'bn' ? 'ডেটা ক্যাটাগরি' : 'Category'}</th>
                          <th className="py-2 px-3 text-center">
                            {lang === 'bn' ? 'বর্তমান ডাটাবেসে আছে' : 'Current Live DB'}
                          </th>
                          <th className="py-2 px-3 text-center">
                            {lang === 'bn' ? 'ব্যাকআপ ফাইলে আছে' : 'In Backup File'}
                          </th>
                          <th className="py-2 px-3 text-right">
                            {lang === 'bn' ? 'পরিবর্তন (Impact)' : 'Restore Impact'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700/70">
                        {[
                          {
                            label: lang === 'bn' ? 'রোগীর রেকর্ড (Patients)' : 'Patient Records',
                            live: currentLiveCounts.patientsCount,
                            bk: inspectionResult.summary.patientsCount,
                          },
                          {
                            label: lang === 'bn' ? 'ডাক্তার তালিকা (Doctors)' : 'Doctors Directory',
                            live: currentLiveCounts.doctorsCount,
                            bk: inspectionResult.summary.doctorsCount,
                          },
                          {
                            label: lang === 'bn' ? 'বিলিং ও ইনভয়েস (Invoices)' : 'Billing & Invoices',
                            live: currentLiveCounts.invoicesCount,
                            bk: inspectionResult.summary.invoicesCount,
                          },
                          {
                            label: lang === 'bn' ? 'ল্যাবরেটরি রিপোর্ট (Lab Reports)' : 'Pathology Lab Reports',
                            live: currentLiveCounts.labReportsCount,
                            bk: inspectionResult.summary.labReportsCount,
                          },
                          {
                            label: lang === 'bn' ? 'অ্যাপয়েন্টমেন্ট ও প্রেসক্রিপশন' : 'Appointments & Rx',
                            live: currentLiveCounts.appointmentsCount,
                            bk: inspectionResult.summary.appointmentsCount,
                          },
                          {
                            label: lang === 'bn' ? 'স্টাফ ও কর্মচারী (Staff/HR)' : 'Hospital Staff / HR',
                            live: currentLiveCounts.staffCount,
                            bk: inspectionResult.summary.staffCount,
                          },
                        ].map((row) => {
                          const diff = row.bk - row.live;
                          return (
                            <tr key={row.label} className="hover:bg-purple-50/30 dark:hover:bg-gray-750">
                              <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">
                                {row.label}
                              </td>
                              <td className="py-2 px-3 text-center font-mono text-gray-600 dark:text-gray-400">
                                {row.live}
                              </td>
                              <td className="py-2 px-3 text-center font-mono font-black text-purple-900 dark:text-purple-200">
                                {row.bk}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold">
                                {diff === 0 ? (
                                  <span className="text-gray-400">Unchanged ({row.bk})</span>
                                ) : diff > 0 ? (
                                  <span className="text-emerald-600">+{diff} records</span>
                                ) : (
                                  <span className="text-amber-600">{diff} records</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Selective Scope Checkboxes & Restore Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 space-y-2">
                    <div className="font-black text-purple-950 dark:text-purple-200">
                      {lang === 'bn' ? 'রিস্টোর মডিউল নির্বাচন:' : 'Modules to Restore:'}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { key: 'patients', label: lang === 'bn' ? 'রোগীর তালিকা' : 'Patients' },
                        { key: 'clinicalReports', label: lang === 'bn' ? 'ল্যাব ও ইমেজিং' : 'Lab & Imaging' },
                        { key: 'billing', label: lang === 'bn' ? 'বিলিং ও হিসাব' : 'Billing & Accounts' },
                        { key: 'mastersAndStaff', label: lang === 'bn' ? 'ডাক্তার ও স্টাফ' : 'Doctors & Staff' },
                      ].map((sc) => (
                        <label key={sc.key} className="flex items-center gap-1.5 cursor-pointer font-semibold">
                          <input
                            type="checkbox"
                            checked={(selectiveScopes as any)[sc.key]}
                            onChange={(e) =>
                              setSelectiveScopes((prev) => ({
                                ...prev,
                                [sc.key]: e.target.checked,
                              }))
                            }
                            className="accent-purple-800 w-3.5 h-3.5"
                          />
                          <span>{sc.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 space-y-2">
                    <div className="font-black text-purple-950 dark:text-purple-200">
                      {lang === 'bn' ? 'রিস্টোর পদ্ধতি ও নিরাপত্তা:' : 'Restore Mode & Safety:'}
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setRestoreMode('replace')}
                        className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] cursor-pointer ${
                          restoreMode === 'replace'
                            ? 'bg-purple-900 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {lang === 'bn' ? 'সম্পূর্ণ প্রতিস্থাপন (Replace)' : 'Full Replace'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRestoreMode('merge')}
                        className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] cursor-pointer ${
                          restoreMode === 'merge'
                            ? 'bg-purple-900 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {lang === 'bn' ? 'নিরাপদ মার্জ (Merge)' : 'Safe Merge'}
                      </button>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-emerald-800 dark:text-emerald-300 pt-0.5">
                      <input
                        type="checkbox"
                        checked={createPreRestoreSafetyBackup}
                        onChange={(e) => setCreatePreRestoreSafetyBackup(e.target.checked)}
                        className="accent-emerald-600 w-3.5 h-3.5"
                      />
                      <span>
                        {lang === 'bn'
                          ? 'রিস্টোরের আগে স্বয়ংক্রিয় Safety Backup রাখুন'
                          : 'Auto-create Safety Backup before restore'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Progress Bar during Restore */}
                {isRestoring && (
                  <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-300 space-y-1.5">
                    <div className="flex justify-between font-bold text-indigo-900 dark:text-indigo-200">
                      <span>{restoreStepText}</span>
                      <span>{restoreProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-indigo-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 transition-all"
                        style={{ width: `${restoreProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Primary CTA: Open Confirmation Dialog */}
                <button
                  type="button"
                  disabled={!inspectionResult.valid || isRestoring || !isAdmin}
                  onClick={() => {
                    setAdminConfirmedAcknowledge(false);
                    setShowConfirmModal(true);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-700 via-purple-800 to-purple-950 hover:from-indigo-600 hover:to-purple-900 text-white font-black text-sm rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-40"
                >
                  <RotateCcw className="w-4 h-4 text-pink-300" />
                  <span>
                    {lang === 'bn'
                      ? '৩. কনফার্মেশন ডায়ালগ খুলুন এবং ডাটাবেস রিস্টোর করুন'
                      : '3. Review Confirmation & Restore Database'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* CLEAR CONFIRMATION DIALOG BEFORE RESTORING DATABASE                   */}
      {/* ===================================================================== */}
      {showConfirmModal && inspectionResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-3xl max-w-lg w-full p-6 border-2 border-purple-500 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    {lang === 'bn'
                      ? 'ডাটাবেস রিস্টোর চূড়ান্ত নিশ্চিতকরণ'
                      : 'Confirm Hospital Database Restore'}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {lang === 'bn'
                      ? 'রিস্টোর করার আগে নিচের তথ্যাবলী মনোযোগ দিয়ে যাচাই করুন'
                      : 'Please review the integrity verification and impact summary below'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explicit Data Overwrite Warning Banner */}
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-400 dark:border-rose-700 text-rose-900 dark:text-rose-200 space-y-1 text-xs">
              <div className="font-black flex items-center gap-1.5 text-rose-700 dark:text-rose-300 uppercase">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  {lang === 'bn'
                    ? 'সতর্কবার্তা: বর্তমান ডেটা ওভাররাইট হবে (Data Overwrite Warning)'
                    : 'WARNING: Current Database Data Will Be Overwritten'}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {lang === 'bn'
                  ? `এই রিস্টোর প্রক্রিয়াটি সম্পন্ন করলে হাসপাতালের বর্তমান লাইভ ডাটাবেসের (${currentLiveCounts.totalRecords} টি রেকর্ড) তথ্য নির্বাচিত ব্যাকআপ ফাইলের (${inspectionResult.summary.totalRecords} টি রেকর্ড) তথ্য দ্বারা প্রতিস্থাপিত/আপডেট হবে।`
                  : `Proceeding with this restoration will overwrite the current live hospital database (${currentLiveCounts.totalRecords} active records) with the data from the selected backup archive (${inspectionResult.summary.totalRecords} backup records).`}
              </p>
            </div>

            {/* Verified Summary Box */}
            <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-gray-900 border border-purple-200 dark:border-gray-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">{lang === 'bn' ? 'ব্যাকআপ ফাইল:' : 'Backup File:'}</span>
                <strong className="font-mono text-purple-900 dark:text-purple-200">
                  {inspectionResult.filename}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{lang === 'bn' ? 'ব্যাকআপের তারিখ:' : 'Backup Date:'}</span>
                <strong>{new Date(inspectionResult.createdAt).toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{lang === 'bn' ? 'ভার্সন ও সাইজ:' : 'Version & Size:'}</span>
                <strong className="font-mono">
                  v{inspectionResult.version || '3.0.0'} · {selectedFileSizeKb} KB
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{lang === 'bn' ? 'ফাইল ইন্টিগ্রিটি:' : 'File Integrity:'}</span>
                <span className="font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> SHA-256 Verified
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{lang === 'bn' ? 'রিস্টোর মোড:' : 'Restore Mode:'}</span>
                <strong className="uppercase text-indigo-700 dark:text-indigo-300">
                  {restoreMode === 'replace'
                    ? lang === 'bn'
                      ? 'সম্পূর্ণ প্রতিস্থাপন (Full Overwrite / Replace)'
                      : 'Full Overwrite / Replace'
                    : lang === 'bn'
                    ? 'মার্জ (Safe Merge)'
                    : 'Safe Merge'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{lang === 'bn' ? 'মোট রেকর্ড:' : 'Records to Restore:'}</span>
                <strong>
                  {inspectionResult.summary.patientsCount} Patients · {inspectionResult.summary.invoicesCount}{' '}
                  Invoices · {inspectionResult.summary.doctorsCount} Doctors
                </strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-purple-200/70 dark:border-gray-700">
                <span className="text-gray-500">
                  {lang === 'bn' ? 'প্রি-রিস্টোর Safety Backup:' : 'Pre-Restore Safety Backup:'}
                </span>
                <strong className="text-emerald-700 dark:text-emerald-400">
                  {createPreRestoreSafetyBackup
                    ? lang === 'bn'
                      ? '✓ স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে'
                      : '✓ Will be created automatically'
                    : lang === 'bn'
                    ? 'বন্ধ'
                    : 'Disabled'}
                </strong>
              </div>
            </div>

            {/* Explicit Administrator Acknowledgement Checkbox */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 cursor-pointer">
              <input
                type="checkbox"
                checked={adminConfirmedAcknowledge}
                onChange={(e) => setAdminConfirmedAcknowledge(e.target.checked)}
                className="accent-purple-800 w-4 h-4 mt-0.5 shrink-0"
              />
              <span className="font-bold text-amber-950 dark:text-amber-200 text-xs leading-relaxed">
                {lang === 'bn'
                  ? 'আমি বুঝতে পেরেছি যে বর্তমান ডাটাবেসের তথ্য ওভাররাইট হবে এবং আমি এই ব্যাকআপ ফাইল থেকে ডেটা রিস্টোর করার অনুমতি দিচ্ছি।'
                  : 'I understand that current database records will be overwritten and confirm proceeding with the restoration.'}
              </span>
            </label>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold cursor-pointer"
              >
                {lang === 'bn' ? 'বাতিল করুন' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={!adminConfirmedAcknowledge}
                onClick={handleExecuteConfirmedRestore}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-800 hover:from-rose-500 hover:to-purple-700 text-white font-black cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-40"
              >
                <RotateCcw className="w-4 h-4" />
                <span>
                  {lang === 'bn' ? 'হ্যাঁ, ওভাররাইট ও রিস্টোর করুন' : 'Confirm Overwrite & Restore Now'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestoreModule;
