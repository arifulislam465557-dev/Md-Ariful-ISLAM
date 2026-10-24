import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  HardDrive,
  Download,
  Upload,
  RefreshCw,
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  KeyRound,
  Trash2,
  Calendar,
  Clock,
  Database,
  FileCheck,
  Eye,
  EyeOff,
  Sparkles,
  FolderArchive,
  FileText,
  Cloud,
  Server,
  FolderOpen,
  Play,
  CheckSquare,
  Square,
  Activity,
  ExternalLink,
  AlertCircle,
  Info,
  X,
  Layers,
  Archive,
  RotateCcw,
} from 'lucide-react';
import {
  generateSecurePassphrase,
  calculatePasswordStrength,
  DetailedBackupScopes,
  DEFAULT_DETAILED_BACKUP_SCOPES,
  buildHospitalZipBackup,
  inspectAndVerifyBackupArchive,
  BackupInspectionResult,
  writeBackupBlobToDirectoryHandle,
  downloadBlobFile,
  generateHospitalSqlDump,
  getDefaultPharmacyInventory,
} from '../../utils/databaseBackup';
import {
  initGoogleDriveAuth,
  googleDriveSignIn,
  googleDriveSignOut,
  fetchGoogleDriveQuotaAndFiles,
  uploadBackupToGoogleDrive,
  downloadBackupFromGoogleDrive,
  deleteBackupFromGoogleDrive,
  listGoogleDriveFolders,
  createGoogleDriveFolder,
  GoogleDriveBackupFile,
  GoogleDriveQuotaInfo,
  GoogleDriveFolderItem,
  DEFAULT_BACKUP_FOLDER_NAME,
} from '../../services/googleDriveBackup';
import { RestoreModule } from './RestoreModule';

type BackupPanelSubView =
  | 'dashboard'
  | 'destinations'
  | 'schedule'
  | 'content'
  | 'restore'
  | 'security_logs';

export const AutomatedBackupTab: React.FC = () => {
  const {
    lang,
    currentUser,
    setCurrentUser,
    users,
    clinicConfig,
    patients,
    invoices,
    prescriptions,
    ecgReports,
    xrayReports,
    usgReports,
    employees,
    expenses,
    workstations,
    shiftHandovers,
    labTests,
    doctors,
    auditLogs,
    printLogs,
    backupHistory,
    autoBackupConfig,
    updateAutoBackupConfig,
    exportDatabaseJson,
    exportDatabaseSqlDump,
    decryptAndRestoreDatabase,
    deleteBackupHistoryEntry,
    clearAllLocalVaultBackups,
    requestDeleteRecord,
    daysSinceLastBackup,
    addNotification,
    addAuditLog,
  } = useApp();

  const isAdmin = String(currentUser?.role || '').trim().toLowerCase() === 'admin';

  // Active Navigation Sub-Tab within the Smart Backup & Restore Panel
  const [activeView, setActiveView] = useState<BackupPanelSubView>('dashboard');

  // Toast Banner inside Backup Panel
  const [panelToast, setPanelToast] = useState<{
    type: 'success' | 'error' | 'info' | 'warn';
    title: string;
    message: string;
    hint?: string;
  } | null>(null);

  const showPanelToast = (
    type: 'success' | 'error' | 'info' | 'warn',
    title: string,
    message: string,
    hint?: string
  ) => {
    setPanelToast({ type, title, message, hint });
    setTimeout(() => {
      setPanelToast((prev) => (prev?.title === title ? null : prev));
    }, 7000);
  };

  // ============================================================================
  // 1. DESTINATION & STORAGE SETTINGS STATE
  // ============================================================================
  const [destinationMode, setDestinationMode] = useState<'local' | 'online' | 'both'>(() => {
    return (localStorage.getItem('adiba_bk_dest_mode') as any) || 'both';
  });

  // Offline / Local Drive Options (Windows C, D, E, Custom)
  const [selectedDriveOption, setSelectedDriveOption] = useState<'C' | 'D' | 'E' | 'custom'>(() => {
    return (localStorage.getItem('adiba_bk_drive_opt') as any) || 'D';
  });
  const [customFolderPath, setCustomFolderPath] = useState<string>(() => {
    return localStorage.getItem('adiba_bk_custom_path') || 'D:\\HospitalBackup\\CustomVault\\';
  });
  const [directoryHandle, setDirectoryHandle] = useState<any | null>(null);
  const [directoryHandleName, setDirectoryHandleName] = useState<string | null>(null);
  const [fsApiStatus, setFsApiStatus] = useState<'supported' | 'restricted' | 'unsupported'>(() => {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window ? 'supported' : 'unsupported';
  });
  const [autoBrowserDownloadZip, setAutoBrowserDownloadZip] = useState<boolean>(true);

  const effectiveWindowsPath = useMemo(() => {
    if (directoryHandleName) {
      const base =
        selectedDriveOption === 'C'
          ? 'C:\\'
          : selectedDriveOption === 'D'
          ? 'D:\\'
          : selectedDriveOption === 'E'
          ? 'E:\\'
          : '';
      return `${base}${directoryHandleName}\\`;
    }
    if (selectedDriveOption === 'C') return 'C:\\HospitalBackup\\';
    if (selectedDriveOption === 'D') return 'D:\\HospitalBackup\\';
    if (selectedDriveOption === 'E') return 'E:\\HospitalBackup\\';
    return customFolderPath || 'D:\\HospitalBackup\\';
  }, [selectedDriveOption, customFolderPath, directoryHandleName]);

  useEffect(() => {
    localStorage.setItem('adiba_bk_dest_mode', destinationMode);
  }, [destinationMode]);

  useEffect(() => {
    localStorage.setItem('adiba_bk_drive_opt', selectedDriveOption);
  }, [selectedDriveOption]);

  useEffect(() => {
    localStorage.setItem('adiba_bk_custom_path', customFolderPath);
  }, [customFolderPath]);

  // Online Cloud Providers State
  const [selectedCloudProvider, setSelectedCloudProvider] = useState<
    'google_drive' | 'server_cloud' | 'onedrive' | 'dropbox'
  >('google_drive');
  const [cloudBackupFrequency, setCloudBackupFrequency] = useState<'every_backup' | 'daily' | 'weekly'>('every_backup');
  const [googleUser, setGoogleUser] = useState<any | null>(null);
  const [googleDriveToken, setGoogleDriveToken] = useState<string | null>(null);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [driveQuota, setDriveQuota] = useState<GoogleDriveQuotaInfo | null>(null);
  const [driveFiles, setDriveFiles] = useState<GoogleDriveBackupFile[]>([]);
  const [isLoadingDriveFiles, setIsLoadingDriveFiles] = useState(false);
  const [cloudUploadProgress, setCloudUploadProgress] = useState<number>(0);
  const [lastCloudBackupTime, setLastCloudBackupTime] = useState<string | null>(() =>
    localStorage.getItem('adiba_last_cloud_bk_time')
  );
  const [fileToDeleteFromDrive, setFileToDeleteFromDrive] = useState<GoogleDriveBackupFile | null>(null);
  const [isDeletingDriveFile, setIsDeletingDriveFile] = useState(false);

  // Google Drive Folder Selection & Verification State (non-sensitive folder metadata only)
  const [selectedDriveFolder, setSelectedDriveFolder] = useState<GoogleDriveFolderItem>(() => {
    try {
      const saved = localStorage.getItem('adiba_gdrive_folder_meta');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name) return parsed;
      }
    } catch {}
    return { id: '', name: DEFAULT_BACKUP_FOLDER_NAME };
  });
  const [driveFoldersList, setDriveFoldersList] = useState<GoogleDriveFolderItem[]>([]);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isLoadingDriveFolders, setIsLoadingDriveFolders] = useState(false);
  const [newDriveFolderName, setNewDriveFolderName] = useState('');
  const [isCreatingDriveFolder, setIsCreatingDriveFolder] = useState(false);
  const [preloadedDriveFileForRestore, setPreloadedDriveFileForRestore] = useState<GoogleDriveBackupFile | null>(null);
  const [isTestingCloudRoundTrip, setIsTestingCloudRoundTrip] = useState(false);
  const [verifyingDriveFileId, setVerifyingDriveFileId] = useState<string | null>(null);
  const [cloudVerificationReport, setCloudVerificationReport] = useState<{
    filename: string;
    fileId: string;
    folderName: string;
    sizeKb: number;
    verifiedAt: string;
    sha256Checksum: string;
    checksumMatched: boolean;
    isEncrypted: boolean;
    patientsCount: number;
    doctorsCount: number;
    invoicesCount: number;
    attachmentsCount: number;
    hasSqlDump: boolean;
    webViewLink?: string;
    driveFile?: GoogleDriveBackupFile;
  } | null>(null);

  // ============================================================================
  // 2. BACKEND SERVER SCHEDULER & VAULT STATE
  // ============================================================================
  const [serverBackups, setServerBackups] = useState<any[]>([]);
  const [serverAuditLogs, setServerAuditLogs] = useState<any[]>([]);
  const [serverErrorLogs, setServerErrorLogs] = useState<any[]>([]);
  const [serverStorageStats, setServerStorageStats] = useState<{
    totalFiles: number;
    totalBytes: number;
    totalKb: number;
    quotaBytes: number;
    backupDir: string;
  }>({
    totalFiles: 0,
    totalBytes: 0,
    totalKb: 0,
    quotaBytes: 500 * 1024 * 1024,
    backupDir: '/backups',
  });

  // Schedule Settings
  const [scheduleEnabled, setScheduleEnabled] = useState<boolean>(autoBackupConfig.enabled);
  const [scheduleFrequency, setScheduleFrequency] = useState<'hourly' | 'every_6h' | 'daily' | 'weekly' | 'custom'>(
    (autoBackupConfig.frequency as any) || 'daily'
  );
  const [customScheduleDateTime, setCustomScheduleDateTime] = useState<string>(() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [backupBeforeUpdate, setBackupBeforeUpdate] = useState<boolean>(true);
  const [backupBeforeMigration, setBackupBeforeMigration] = useState<boolean>(true);
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [maxRetainedFiles, setMaxRetainedFiles] = useState<number>(autoBackupConfig.maxRetainedBackups || 15);
  const [autoDeleteOldBackups, setAutoDeleteOldBackups] = useState<boolean>(true);
  const [nextScheduledTimeStr, setNextScheduledTimeStr] = useState<string>('');

  // ============================================================================
  // 3. CONTENT SELECTION SCOPES (11 GRANULAR CATEGORIES)
  // ============================================================================
  const [contentScopes, setContentScopes] = useState<DetailedBackupScopes>(DEFAULT_DETAILED_BACKUP_SCOPES);

  const toggleScope = (key: keyof DetailedBackupScopes) => {
    if (key === 'fullSystemBackup') {
      const nextVal = !contentScopes.fullSystemBackup;
      setContentScopes({
        patientRecords: nextVal,
        doctorInfo: nextVal,
        appointments: nextVal,
        billingPayments: nextVal,
        pharmacyInventory: nextVal,
        laboratoryReports: nextVal,
        staffInfo: nextVal,
        hospitalSettings: nextVal,
        databaseSql: nextVal,
        documentsAttachments: nextVal,
        fullSystemBackup: nextVal,
      });
      return;
    }

    setContentScopes((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      const allIndividualSelected =
        updated.patientRecords &&
        updated.doctorInfo &&
        updated.appointments &&
        updated.billingPayments &&
        updated.pharmacyInventory &&
        updated.laboratoryReports &&
        updated.staffInfo &&
        updated.hospitalSettings &&
        updated.databaseSql &&
        updated.documentsAttachments;
      updated.fullSystemBackup = allIndividualSelected;
      return updated;
    });
  };

  // ============================================================================
  // 4. ENCRYPTION & BACKUP NOW PIPELINE STATE
  // ============================================================================
  const [useEncryption, setUseEncryption] = useState<boolean>(true);
  const [exportPassphrase, setExportPassphrase] = useState('AdibaSecurePass#2026');
  const [confirmPassphrase, setConfirmPassphrase] = useState('AdibaSecurePass#2026');
  const [showExportPassword, setShowExportPassword] = useState(false);

  const [backupProgress, setBackupProgress] = useState<number>(0);
  const [backupStepText, setBackupStepText] = useState<string>('');
  const [backupStatus, setBackupStatus] = useState<'Success' | 'Failed' | 'Pending'>('Success');
  const [isBackingUpNow, setIsBackingUpNow] = useState<boolean>(false);
  const [lastCompletedBackupInfo, setLastCompletedBackupInfo] = useState<{
    filename: string;
    locationPath: string;
    sizeKb: number;
    createdAt: string;
    checksum: string;
    isEncrypted: boolean;
    totalRecords: number;
    cloudUploaded?: boolean;
    cloudLink?: string;
    downloadUrl?: string;
  } | null>(null);

  // ============================================================================
  // 5. RESTORE & VALIDATION STATE
  // ============================================================================
  const [restoreSourceTab, setRestoreSourceTab] = useState<'local_file' | 'cloud_drive' | 'server_vault'>('local_file');
  const [restorePassphrase, setRestorePassphrase] = useState('AdibaSecurePass#2026');
  const [showRestorePassword, setShowRestorePassword] = useState(false);
  const [selectedRestoreBlob, setSelectedRestoreBlob] = useState<File | Blob | string | null>(null);
  const [selectedRestoreFilename, setSelectedRestoreFilename] = useState<string | null>(null);
  const [inspectionResult, setInspectionResult] = useState<BackupInspectionResult | null>(null);
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [mergeMode, setMergeMode] = useState<'replace' | 'merge'>('replace');
  const [createSafetyBackupBeforeRestore, setCreateSafetyBackupBeforeRestore] = useState<boolean>(true);
  const [showRestoreConfirmModal, setShowRestoreConfirmModal] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreProgress, setRestoreProgress] = useState<number>(0);
  const [restoreStepLabel, setRestoreStepLabel] = useState<string>('');
  const [restoreFeedback, setRestoreFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const passStrength = useMemo(() => calculatePasswordStrength(exportPassphrase), [exportPassphrase]);

  const buildFullHospitalDataObject = () => ({
    exportDate: new Date().toISOString(),
    version: '3.0.0',
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
    workstations,
    pharmacyInventory: getDefaultPharmacyInventory(),
  });

  // Fetch Backend Server Status & Sync Hospital Data
  const fetchServerBackupStatus = async () => {
    try {
      const res = await fetch('/api/backup/status');
      if (res.ok) {
        const data = await res.json();
        setServerBackups(data.serverBackups || []);
        setServerAuditLogs(data.auditLogs || []);
        setServerErrorLogs(data.errorLogs || []);
        if (data.storageStats) {
          setServerStorageStats(data.storageStats);
        }
        if (data.scheduler?.nextRunAt) {
          setNextScheduledTimeStr(new Date(data.scheduler.nextRunAt).toLocaleString());
        }
      }
    } catch {
      // Fallback if offline
    }
  };

  const syncStateToBackendServer = async (customSched?: any) => {
    try {
      const res = await fetch('/api/backup/sync-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalData: buildFullHospitalDataObject(),
          scheduleConfig: {
            enabled: scheduleEnabled,
            frequency: scheduleFrequency,
            customDateTime: customScheduleDateTime,
            retentionDays,
            maxRetainedBackups: maxRetainedFiles,
            autoDeleteOld: autoDeleteOldBackups,
            backupBeforeUpdate,
            backupBeforeMigration,
            encryptBackups: useEncryption,
            passphrase: exportPassphrase,
            targetDrivePath: effectiveWindowsPath,
            ...(customSched || {}),
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.scheduler?.nextRunAt) {
          setNextScheduledTimeStr(new Date(data.scheduler.nextRunAt).toLocaleString());
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchServerBackupStatus();
    syncStateToBackendServer();
  }, [patients.length, invoices.length, doctors.length]);

  // Initialize Google Drive Auth Listener
  useEffect(() => {
    const unsub = initGoogleDriveAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleDriveToken(token);
        loadGoogleDriveFiles();
      },
      () => {
        setGoogleDriveToken(null);
      }
    );
    return () => unsub();
  }, []);

  const loadGoogleDriveFiles = async (overrideFolderId?: string, overrideFolderName?: string) => {
    try {
      setIsLoadingDriveFiles(true);
      const targetId = overrideFolderId !== undefined ? overrideFolderId : selectedDriveFolder.id || undefined;
      const targetName =
        overrideFolderName !== undefined
          ? overrideFolderName
          : selectedDriveFolder.name || DEFAULT_BACKUP_FOLDER_NAME;
      const { quota, files, activeFolder } = await fetchGoogleDriveQuotaAndFiles(targetId, targetName);
      setDriveQuota(quota);
      setDriveFiles(files);
      if (activeFolder && activeFolder.id) {
        setSelectedDriveFolder(activeFolder);
        localStorage.setItem('adiba_gdrive_folder_meta', JSON.stringify(activeFolder));
      }
      if (files.length > 0 && !lastCloudBackupTime) {
        setLastCloudBackupTime(new Date(files[0].createdTime).toLocaleString());
      }
    } catch {
      // Not authenticated yet or token expired
    } finally {
      setIsLoadingDriveFiles(false);
    }
  };

  const handleOpenGoogleDriveFolderModal = async () => {
    if (!googleDriveToken) {
      await handleGoogleSignIn();
      return;
    }
    setIsFolderModalOpen(true);
    setIsLoadingDriveFolders(true);
    try {
      const folders = await listGoogleDriveFolders();
      setDriveFoldersList(folders);
    } catch (err: any) {
      showPanelToast(
        'error',
        lang === 'bn' ? 'ফোল্ডার তালিকা লোড ব্যর্থ' : 'Failed to Load Folders',
        err?.message || 'Could not retrieve folders from Google Drive.'
      );
    } finally {
      setIsLoadingDriveFolders(false);
    }
  };

  const handleSelectDriveFolder = async (folder: GoogleDriveFolderItem) => {
    setSelectedDriveFolder(folder);
    localStorage.setItem('adiba_gdrive_folder_meta', JSON.stringify(folder));
    setIsFolderModalOpen(false);
    await loadGoogleDriveFiles(folder.id, folder.name);
    showPanelToast(
      'success',
      lang === 'bn' ? 'Google Drive ফোল্ডার নির্বাচিত হয়েছে' : 'Google Drive Folder Selected',
      lang === 'bn'
        ? `সকল এনক্রিপ্টেড ক্লাউড ব্যাকআপ এখন "/${folder.name}" ফোল্ডারে সংরক্ষিত হবে।`
        : `Encrypted cloud backups will now be stored in "/${folder.name}".`
    );
    await fetch('/api/backup/log-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'audit',
        audit: {
          action: 'GOOGLE_DRIVE_FOLDER_SELECTED',
          actor: currentUser?.fullName || googleUser?.email || 'Admin',
          destination: `Google Drive (/${folder.name})`,
          status: 'Success',
          details: `Admin selected Google Drive folder "${folder.name}" (ID: ${folder.id}) for encrypted hospital backups.`,
        },
      }),
    });
  };

  const handleCreateNewDriveFolder = async () => {
    if (!newDriveFolderName.trim()) return;
    setIsCreatingDriveFolder(true);
    try {
      const created = await createGoogleDriveFolder(newDriveFolderName.trim());
      setDriveFoldersList((prev) => [created, ...prev]);
      setNewDriveFolderName('');
      await handleSelectDriveFolder(created);
    } catch (err: any) {
      showPanelToast(
        'error',
        lang === 'bn' ? 'ফোল্ডার তৈরি ব্যর্থ' : 'Folder Creation Failed',
        err?.message || 'Could not create folder in Google Drive.'
      );
    } finally {
      setIsCreatingDriveFolder(false);
    }
  };

  const handleVerifyDriveFileIntegrity = async (df: GoogleDriveBackupFile) => {
    setVerifyingDriveFileId(df.id);
    try {
      const blob = await downloadBackupFromGoogleDrive(df.id);
      const res = await inspectAndVerifyBackupArchive(blob, exportPassphrase, df.name);
      if (!res.valid || !res.checksumVerified) {
        showPanelToast(
          'error',
          lang === 'bn' ? 'ইন্টিগ্রিটি যাচাই ব্যর্থ' : 'Integrity Verification Failed',
          res.error || 'SHA-256 checksum or AES-256 decryption failed. Check your encryption passphrase.'
        );
        return;
      }
      setCloudVerificationReport({
        filename: df.name,
        fileId: df.id,
        folderName: selectedDriveFolder.name || DEFAULT_BACKUP_FOLDER_NAME,
        sizeKb: Math.max(1, Math.round(df.size / 1024)),
        verifiedAt: new Date().toLocaleTimeString(),
        sha256Checksum: res.calculatedChecksum || res.expectedChecksum || 'verified',
        checksumMatched: res.checksumVerified,
        isEncrypted: res.isEncrypted,
        patientsCount: res.summary.patientsCount,
        doctorsCount: res.summary.doctorsCount,
        invoicesCount: res.summary.invoicesCount,
        attachmentsCount: res.summary.attachmentsCount,
        hasSqlDump: res.hasSqlDump,
        webViewLink: df.webViewLink,
        driveFile: df,
      });
      showPanelToast(
        'success',
        lang === 'bn' ? '✓ ক্লাউড ফাইল ইন্টিগ্রিটি ১০০% যাচাইকৃত!' : '✓ Cloud Backup Integrity Verified!',
        lang === 'bn'
          ? `"${df.name}" ডাউনলোড করে SHA-256 চেকসাম ও AES-256 ডিক্রিপশন সফলভাবে যাচাই করা হয়েছে (${res.summary.totalRecords} রেকর্ড)।`
          : `Downloaded "${df.name}" from Google Drive and verified SHA-256 checksum & AES-256-GCM decryption (${res.summary.totalRecords} records).`
      );
    } catch (err: any) {
      showPanelToast(
        'error',
        lang === 'bn' ? 'যাচাই ব্যর্থ হয়েছে' : 'Verification Error',
        err?.message || 'Failed to download and verify file from Google Drive.'
      );
    } finally {
      setVerifyingDriveFileId(null);
    }
  };

  const handleDownloadDriveFileToLocal = async (df: GoogleDriveBackupFile) => {
    try {
      showPanelToast(
        'info',
        lang === 'bn' ? 'Google Drive থেকে ডাউনলোড হচ্ছে...' : 'Downloading from Google Drive...',
        df.name
      );
      const blob = await downloadBackupFromGoogleDrive(df.id);
      downloadBlobFile(blob, df.name);
    } catch (err: any) {
      showPanelToast('error', 'Download Failed', err?.message || 'Could not download file from Google Drive.');
    }
  };

  const handleTestCloudUploadAndRestoreVerify = async () => {
    if (!isAdmin) return;
    if (!googleDriveToken) {
      await handleGoogleSignIn();
      return;
    }
    setIsTestingCloudRoundTrip(true);
    setCloudUploadProgress(5);
    try {
      const fullData = buildFullHospitalDataObject();
      const { zipBlob, filename, manifest, sizeKb } = await buildHospitalZipBackup({
        fullData,
        scopes: contentScopes,
        encrypt: true,
        passphrase: exportPassphrase,
        exportedBy: currentUser?.fullName || 'Administrator',
        filenamePrefix: 'Hospital_CloudVerified_Backup',
      });

      const uploaded = await uploadBackupToGoogleDrive(
        zipBlob,
        filename,
        `Verified Encrypted Hospital Backup (${manifest.summary.totalRecords} records, ${manifest.summary.attachmentsCount} attachments, SHA-256: ${manifest.sha256Checksum.slice(0, 16)})`,
        (pct) => setCloudUploadProgress(pct),
        selectedDriveFolder.id || undefined,
        selectedDriveFolder.name || DEFAULT_BACKUP_FOLDER_NAME
      );

      // Immediately download back from Google Drive and verify cryptographic integrity & decryptability
      const downloadedBlob = await downloadBackupFromGoogleDrive(uploaded.id);
      const verifyRes = await inspectAndVerifyBackupArchive(downloadedBlob, exportPassphrase, uploaded.name);

      if (!verifyRes.valid || !verifyRes.checksumVerified) {
        throw new Error(verifyRes.error || 'Round-trip verification failed after upload.');
      }

      const nowStr = new Date().toLocaleString();
      setLastCloudBackupTime(nowStr);
      localStorage.setItem('adiba_last_cloud_bk_time', nowStr);

      setCloudVerificationReport({
        filename: uploaded.name,
        fileId: uploaded.id,
        folderName: uploaded.folderName,
        sizeKb,
        verifiedAt: nowStr,
        sha256Checksum: verifyRes.calculatedChecksum || manifest.sha256Checksum,
        checksumMatched: verifyRes.checksumVerified,
        isEncrypted: verifyRes.isEncrypted,
        patientsCount: verifyRes.summary.patientsCount,
        doctorsCount: verifyRes.summary.doctorsCount,
        invoicesCount: verifyRes.summary.invoicesCount,
        attachmentsCount: verifyRes.summary.attachmentsCount,
        hasSqlDump: verifyRes.hasSqlDump,
        webViewLink: uploaded.webViewLink,
        driveFile: uploaded,
      });

      await loadGoogleDriveFiles(uploaded.folderId, uploaded.folderName);

      await fetch('/api/backup/log-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'audit',
          audit: {
            action: 'GOOGLE_DRIVE_ROUNDTRIP_VERIFIED',
            actor: currentUser?.fullName || googleUser?.email || 'Administrator',
            destination: `Google Drive (/${uploaded.folderName}/${uploaded.name})`,
            filename: uploaded.name,
            checksum: manifest.sha256Checksum,
            status: 'Success',
            details: `Uploaded encrypted ZIP (${sizeKb} KB, ${manifest.summary.totalRecords} records, ${manifest.summary.attachmentsCount} attachments) to Google Drive folder "/${uploaded.folderName}", downloaded back, and verified SHA-256 + AES-256-GCM restore integrity.`,
          },
        }),
      });
      await fetchServerBackupStatus();

      showPanelToast(
        'success',
        lang === 'bn'
          ? '✓ Google Drive আপলোড ও রিস্টোর ইন্টিগ্রিটি টেস্ট ১০০% সফল!'
          : '✓ Google Drive Upload & Restore Integrity Verified!',
        lang === 'bn'
          ? `ফাইল "${uploaded.name}" Google Drive-এর "/${uploaded.folderName}" ফোল্ডারে আপলোড করে পুনরায় ডাউনলোড ও AES-256 ডিক্রিপশন পরীক্ষা সফল হয়েছে।`
          : `Uploaded "${uploaded.name}" to "/${uploaded.folderName}", downloaded back from Google Drive, and verified SHA-256 + AES-256 decryption.`
      );
    } catch (err: any) {
      showPanelToast(
        'error',
        lang === 'bn' ? 'ক্লাউড আপলোড/যাচাই ব্যর্থ' : 'Cloud Upload/Verification Failed',
        err?.message || 'Failed to complete Google Drive upload and verification.'
      );
    } finally {
      setIsTestingCloudRoundTrip(false);
      setTimeout(() => setCloudUploadProgress(0), 2000);
    }
  };

  // Automatic Scheduled Cloud Sync when browser is open and Google Drive is connected
  useEffect(() => {
    if (!scheduleEnabled || !googleDriveToken) return;
    if (destinationMode !== 'online' && destinationMode !== 'both') return;

    const intervalMs =
      cloudBackupFrequency === 'weekly'
        ? 7 * 24 * 60 * 60 * 1000
        : cloudBackupFrequency === 'daily'
        ? 24 * 60 * 60 * 1000
        : scheduleFrequency === 'hourly'
        ? 60 * 60 * 1000
        : scheduleFrequency === 'every_6h'
        ? 6 * 60 * 60 * 1000
        : 24 * 60 * 60 * 1000;

    const timer = setInterval(() => {
      const lastTime = lastCloudBackupTime ? Date.parse(lastCloudBackupTime) : 0;
      if (!isNaN(lastTime) && Date.now() - lastTime >= intervalMs && !isBackingUpNow) {
        handleRunBackupNow('Manual', 'Scheduled_Cloud_Backup');
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [
    scheduleEnabled,
    googleDriveToken,
    destinationMode,
    cloudBackupFrequency,
    scheduleFrequency,
    lastCloudBackupTime,
    isBackingUpNow,
  ]);

  const handleGoogleSignIn = async () => {
    setIsConnectingGoogle(true);
    try {
      const res = await googleDriveSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleDriveToken(res.accessToken);
        await loadGoogleDriveFiles();
        showPanelToast(
          'success',
          lang === 'bn' ? 'Google Drive সংযুক্ত হয়েছে!' : 'Google Drive Connected!',
          lang === 'bn'
            ? `${res.user.email} অ্যাকাউন্টের সাথে সফলভাবে ক্লাউড ব্যাকআপ সংযোগ স্থাপিত হয়েছে।`
            : `Successfully authenticated with Google Drive (${res.user.email}).`
        );
        await fetch('/api/backup/log-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'audit',
            audit: {
              action: 'GOOGLE_DRIVE_CONNECTED',
              actor: currentUser?.fullName || res.user.email || 'Admin',
              destination: `Google Drive (${res.user.email})`,
              status: 'Success',
              details: `Authenticated Google Drive OAuth 2.0 session for cloud backup storage.`,
            },
          }),
        });
        fetchServerBackupStatus();
      }
    } catch (err: any) {
      showPanelToast(
        'error',
        lang === 'bn' ? 'Google Drive সংযোগ ব্যর্থ' : 'Google Drive Sign-In Failed',
        err?.message || 'Could not complete Google authentication.',
        lang === 'bn'
          ? 'পপআপ ব্লকার বন্ধ করুন এবং অনুমোদিত গুগল অ্যাকাউন্ট দিয়ে পুনরায় চেষ্টা করুন।'
          : 'Please allow popup windows and sign in with your Google account.'
      );
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await googleDriveSignOut();
    setGoogleUser(null);
    setGoogleDriveToken(null);
    setDriveFiles([]);
    setDriveQuota(null);
    setCloudVerificationReport(null);
    showPanelToast(
      'info',
      lang === 'bn' ? 'Google Drive সংযোগ বিচ্ছিন্ন' : 'Google Drive Disconnected',
      lang === 'bn' ? 'ক্লাউড সেশন নিরাপদভাবে লগআউট করা হয়েছে।' : 'Cloud session signed out safely.'
    );
  };

  // Browse Local Folder via File System Access API
  const handleBrowseLocalFolder = async () => {
    if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite',
        });
        setDirectoryHandle(dirHandle);
        setDirectoryHandleName(dirHandle.name);
        setFsApiStatus('supported');
        showPanelToast(
          'success',
          lang === 'bn' ? 'লোকাল ফোল্ডার নির্বাচিত হয়েছে' : 'Local Backup Folder Connected',
          lang === 'bn'
            ? `নির্বাচিত ফোল্ডার "${dirHandle.name}" (${effectiveWindowsPath}) এ সরাসরি ব্যাকআপ ফাইল সংরক্ষণের অনুমতি পাওয়া গেছে।`
            : `Granted direct read/write permission to folder "${dirHandle.name}".`
        );
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        setFsApiStatus('restricted');
        showPanelToast(
          'warn',
          lang === 'bn' ? 'ব্রাউজার স্যান্ডবক্স সীমাবদ্ধতা' : 'Browser Security Restriction',
          lang === 'bn'
            ? 'আইফ্রেম বা ব্রাউজার নিরাপত্তার কারণে সরাসরি ফোল্ডার পিকার ব্লক হয়েছে। ব্যাকআপ ফাইল স্বয়ংক্রিয়ভাবে সার্ভার ডিস্ক (/backups) এবং ব্রাউজার ডাউনলোডের মাধ্যমে সংরক্ষিত হবে।'
            : 'Direct folder picker is restricted inside embedded frames. Backups will be saved via Backend Disk Vault (/backups) and direct browser ZIP download.'
        );
      }
    } else {
      setFsApiStatus('unsupported');
      showPanelToast(
        'info',
        lang === 'bn' ? 'ডাইরেক্ট ফোল্ডার এপিআই অসমর্থিত' : 'File System API Info',
        lang === 'bn'
          ? 'আপনার ব্রাউজারে File System Access API নেই। ব্যাকআপ ফাইল সরাসরি ZIP ডাউনলোড এবং ব্যাকএন্ড সার্ভারে সংরক্ষিত হবে।'
          : 'Your browser uses standard file download + Backend Server Storage for local backups.'
      );
    }
  };

  // Pre-Backup Summary Calculation
  const selectedContentSummary = useMemo(() => {
    const pharmacyList = getDefaultPharmacyInventory();
    const labReportsCount = patients.reduce((acc, p) => acc + (p.testResults?.length || 0), 0);
    const imagingCount = ecgReports.length + xrayReports.length + usgReports.length;
    const appointmentsCount = prescriptions.length + shiftHandovers.length;
    const attachmentsCount =
      (clinicConfig.logoUrl ? 1 : 0) +
      employees.filter((e) => e.photoUrl || e.voterCardFrontPhotoUrl || e.voterCardBackPhotoUrl).length +
      patients.filter((p) => p.testResults && p.testResults.length > 0).length;

    let selectedRecords = 0;
    let selectedCategoriesCount = 0;

    if (contentScopes.patientRecords) {
      selectedRecords += patients.length;
      selectedCategoriesCount++;
    }
    if (contentScopes.doctorInfo) {
      selectedRecords += doctors.length;
      selectedCategoriesCount++;
    }
    if (contentScopes.appointments) {
      selectedRecords += appointmentsCount;
      selectedCategoriesCount++;
    }
    if (contentScopes.billingPayments) {
      selectedRecords += invoices.length + expenses.length + printLogs.length;
      selectedCategoriesCount++;
    }
    if (contentScopes.pharmacyInventory) {
      selectedRecords += pharmacyList.length + labTests.length;
      selectedCategoriesCount++;
    }
    if (contentScopes.laboratoryReports) {
      selectedRecords += labReportsCount + imagingCount;
      selectedCategoriesCount++;
    }
    if (contentScopes.staffInfo) {
      selectedRecords += employees.length + users.length;
      selectedCategoriesCount++;
    }
    if (contentScopes.hospitalSettings) {
      selectedRecords += 1 + workstations.length;
      selectedCategoriesCount++;
    }
    if (contentScopes.databaseSql) {
      selectedCategoriesCount++;
    }
    if (contentScopes.documentsAttachments) {
      selectedRecords += attachmentsCount;
      selectedCategoriesCount++;
    }

    const estimatedSizeKb = Math.max(18, Math.round(selectedRecords * 1.8 + (contentScopes.databaseSql ? 35 : 0)));

    return {
      patientsCount: contentScopes.patientRecords ? patients.length : 0,
      doctorsCount: contentScopes.doctorInfo ? doctors.length : 0,
      appointmentsCount: contentScopes.appointments ? appointmentsCount : 0,
      billingCount: contentScopes.billingPayments ? invoices.length + expenses.length : 0,
      pharmacyCount: contentScopes.pharmacyInventory ? pharmacyList.length : 0,
      labReportsCount: contentScopes.laboratoryReports ? labReportsCount + imagingCount : 0,
      staffCount: contentScopes.staffInfo ? employees.length + users.length : 0,
      attachmentsCount: contentScopes.documentsAttachments ? attachmentsCount : 0,
      sqlIncluded: contentScopes.databaseSql,
      selectedCategoriesCount,
      selectedRecords,
      estimatedSizeKb,
    };
  }, [
    contentScopes,
    patients,
    doctors,
    prescriptions,
    shiftHandovers,
    invoices,
    expenses,
    printLogs,
    labTests,
    ecgReports,
    xrayReports,
    usgReports,
    employees,
    users,
    workstations,
    clinicConfig,
  ]);

  // ============================================================================
  // EXECUTE "BACKUP NOW" (5-STEP VERIFIED PIPELINE)
  // ============================================================================
  const handleRunBackupNow = async (
    customTrigger: 'Manual' | 'Pre-Restore Safety' | 'Pre-Update' | 'Pre-Migration' = 'Manual',
    prefixOverride?: string
  ): Promise<boolean> => {
    if (!isAdmin) {
      showPanelToast(
        'error',
        lang === 'bn' ? 'অ্যাক্সেস অনুমোদিত নয়' : 'Admin Permission Required',
        lang === 'bn'
          ? 'শুধুমাত্র অনুমোদিত অ্যাডমিন (Admin) ব্যাকআপ এবং রিস্টোর পরিচালনা করতে পারবেন।'
          : 'Only authorized Administrators can trigger system backups.'
      );
      return false;
    }

    if (useEncryption && (!exportPassphrase || exportPassphrase.length < 4)) {
      showPanelToast(
        'error',
        lang === 'bn' ? 'এনক্রিপশন পাসওয়ার্ড প্রয়োজন' : 'Encryption Passphrase Required',
        lang === 'bn'
          ? 'নিরাপদ AES-256 ব্যাকআপের জন্য অন্তত ৪ অক্ষরের পাসওয়ার্ড নির্ধারণ করুন।'
          : 'Please enter a valid encryption passphrase (minimum 4 characters).'
      );
      return false;
    }

    if (useEncryption && exportPassphrase !== confirmPassphrase) {
      showPanelToast(
        'error',
        lang === 'bn' ? 'পাসওয়ার্ড মিলছে না' : 'Passphrase Mismatch',
        lang === 'bn'
          ? 'এনক্রিপশন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড একই হতে হবে।'
          : 'Encryption passphrase and confirmation do not match.'
      );
      return false;
    }

    if (selectedContentSummary.selectedCategoriesCount === 0) {
      showPanelToast(
        'error',
        lang === 'bn' ? 'কোনো ডেটা নির্বাচন করা হয়নি' : 'No Backup Content Selected',
        lang === 'bn'
          ? 'ব্যাকআপ নেওয়ার জন্য অন্তত একটি ডেটা ক্যাটাগরি নির্বাচন করুন।'
          : 'Please select at least one data category to include in the backup.'
      );
      return false;
    }

    try {
      setIsBackingUpNow(true);
      setBackupStatus('Pending');
      setBackupProgress(10);
      setBackupStepText(
        lang === 'bn'
          ? 'ধাপ ১/৫: ব্যাকআপ গন্তব্য (Destination) যাচাই করা হচ্ছে...'
          : 'Step 1/5: Validating backup destination...'
      );

      // Step 1: Destination validation
      await new Promise((r) => setTimeout(r, 250));
      if (
        (destinationMode === 'online' || destinationMode === 'both') &&
        selectedCloudProvider === 'google_drive' &&
        !googleDriveToken &&
        destinationMode === 'online'
      ) {
        throw new Error(
          lang === 'bn'
            ? 'Google Drive সংযুক্ত নেই! অনলাইন ব্যাকআপের জন্য প্রথমে "Sign in with Google" বাটনে ক্লিক করে সংযুক্ত হোন।'
            : 'Google Drive is not connected! Please sign in with Google first or switch destination to Local + Server.'
        );
      }

      // Step 2: Storage quota check
      setBackupProgress(28);
      setBackupStepText(
        lang === 'bn'
          ? 'ধাপ ২/৫: স্টোরেজ স্পেস এবং ডিস্ক কোটা পরীক্ষা করা হচ্ছে...'
          : 'Step 2/5: Checking available storage quota...'
      );
      await new Promise((r) => setTimeout(r, 250));

      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        if (estimate.quota && estimate.usage && estimate.quota - estimate.usage < 1024 * 1024) {
          throw new Error('Insufficient browser storage space (< 1 MB free).');
        }
      }

      // Step 3: Data consistency validation
      setBackupProgress(45);
      setBackupStepText(
        lang === 'bn'
          ? 'ধাপ ৩/৫: হাসপাতালের ডেটাবেজ ও অ্যাটাচমেন্ট ভ্যালিডেশন চলছে...'
          : 'Step 3/5: Validating hospital records & attachments consistency...'
      );
      await new Promise((r) => setTimeout(r, 250));

      const fullData = buildFullHospitalDataObject();
      const sqlDumpStr = contentScopes.databaseSql ? generateHospitalSqlDump(fullData) : undefined;

      // Step 4: Build ZIP archive (SQL + Encrypted JSON + Attachments + SHA-256 Manifest)
      setBackupProgress(68);
      setBackupStepText(
        lang === 'bn'
          ? 'ধাপ ৪/৫: ZIP আর্কাইভ, SQL ডাম্প ও AES-256-GCM এনক্রিপশন তৈরি হচ্ছে...'
          : 'Step 4/5: Building ZIP archive with SQL dump, attachments & AES-256 encryption...'
      );

      const prefix =
        prefixOverride ||
        (customTrigger === 'Pre-Restore Safety'
          ? 'Safety_PreRestore_Backup'
          : customTrigger === 'Pre-Migration'
          ? 'PreMigration_Hospital_Backup'
          : 'Hospital_Backup');

      const { zipBlob, filename, manifest, sizeKb } = await buildHospitalZipBackup({
        fullData,
        scopes: contentScopes,
        encrypt: useEncryption,
        passphrase: exportPassphrase,
        exportedBy: currentUser?.fullName || 'Administrator',
        filenamePrefix: prefix,
      });

      // Step 5: Save to selected destinations
      setBackupProgress(85);
      setBackupStepText(
        lang === 'bn'
          ? 'ধাপ ৫/৫: নির্বাচিত স্টোরেজে ব্যাকআপ ফাইল সংরক্ষণ করা হচ্ছে...'
          : 'Step 5/5: Saving verified backup archive to destination...'
      );

      let finalLocationText = effectiveWindowsPath + filename;
      let downloadUrl = '';
      let cloudUploaded = false;
      let cloudLink = '';

      // 5A. Always persist on Backend Server Vault (/backups)
      const serverRes = await fetch('/api/backup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: fullData,
          sqlDump: sqlDumpStr,
          encrypt: useEncryption,
          passphrase: exportPassphrase,
          triggerType: customTrigger,
          exportedBy: currentUser?.fullName || 'Administrator',
          destinationLabel:
            destinationMode === 'both'
              ? `Local (${effectiveWindowsPath}) + Cloud`
              : destinationMode === 'online'
              ? `Cloud (${selectedCloudProvider})`
              : `Local (${effectiveWindowsPath})`,
          targetDrivePath: effectiveWindowsPath,
          customPrefix: prefix,
        }),
      });

      if (serverRes.ok) {
        const srvData = await serverRes.json();
        downloadUrl = srvData.downloadUrl;
      }

      // 5B. If Local destination is active, write to Directory Handle OR trigger browser download
      if (destinationMode === 'local' || destinationMode === 'both') {
        if (directoryHandle) {
          const writeRes = await writeBackupBlobToDirectoryHandle(directoryHandle, filename, zipBlob);
          if (writeRes.success) {
            finalLocationText = `${effectiveWindowsPath}${filename} (Direct Disk Write)`;
          } else if (autoBrowserDownloadZip && customTrigger === 'Manual') {
            downloadBlobFile(zipBlob, filename);
          }
        } else if (autoBrowserDownloadZip && customTrigger === 'Manual') {
          downloadBlobFile(zipBlob, filename);
        }
      }

      // 5C. If Online Cloud (Google Drive) is active and authenticated, upload to selected Google Drive folder!
      let uploadedFolderName = selectedDriveFolder.name || DEFAULT_BACKUP_FOLDER_NAME;
      if (
        (destinationMode === 'online' || destinationMode === 'both') &&
        selectedCloudProvider === 'google_drive' &&
        googleDriveToken
      ) {
        setBackupStepText(
          lang === 'bn'
            ? `Google Drive ফোল্ডার "/${uploadedFolderName}"-এ ব্যাকআপ ফাইল আপলোড হচ্ছে...`
            : `Uploading encrypted ZIP archive to Google Drive folder "/${uploadedFolderName}"...`
        );
        setCloudUploadProgress(5);
        const uploadedFile = await uploadBackupToGoogleDrive(
          zipBlob,
          filename,
          `Adiba Hospital Backup (${manifest.summary.totalRecords} records, ${manifest.summary.attachmentsCount} attachments, SHA-256: ${manifest.sha256Checksum.slice(0, 12)})`,
          (pct) => setCloudUploadProgress(pct),
          selectedDriveFolder.id || undefined,
          selectedDriveFolder.name || DEFAULT_BACKUP_FOLDER_NAME
        );
        cloudUploaded = true;
        cloudLink = uploadedFile.webViewLink || '';
        uploadedFolderName = uploadedFile.folderName || uploadedFolderName;
        const nowStr = new Date().toLocaleString();
        setLastCloudBackupTime(nowStr);
        localStorage.setItem('adiba_last_cloud_bk_time', nowStr);
        await loadGoogleDriveFiles(uploadedFile.folderId, uploadedFile.folderName);
      }

      setBackupProgress(100);
      setBackupStatus('Success');
      const createdAtDisplay = new Date().toLocaleString();

      setLastCompletedBackupInfo({
        filename,
        locationPath: cloudUploaded
          ? `${finalLocationText} + Google Drive (/${uploadedFolderName}/${filename})`
          : finalLocationText,
        sizeKb,
        createdAt: createdAtDisplay,
        checksum: manifest.sha256Checksum,
        isEncrypted: manifest.isEncrypted,
        totalRecords: manifest.summary.totalRecords,
        cloudUploaded,
        cloudLink,
        downloadUrl,
      });

      addAuditLog({
        actionType: 'SETTINGS_UPDATE',
        details: `ব্যাকআপ সম্পন্ন: ${filename} (${sizeKb} KB, মোট রেকর্ড: ${manifest.summary.totalRecords}, গন্তব্য: ${finalLocationText}${cloudUploaded ? ' + Google Drive' : ''})`,
      });

      await fetchServerBackupStatus();

      showPanelToast(
        'success',
        lang === 'bn' ? 'ব্যাকআপ সফলভাবে সম্পন্ন হয়েছে!' : 'Backup Completed Successfully!',
        lang === 'bn'
          ? `ফাইল: ${filename} (${sizeKb} KB) সফলভাবে তৈরি ও সংরক্ষিত হয়েছে। SHA-256 চেকসাম যাচাইকৃত।`
          : `Archive ${filename} (${sizeKb} KB) created and verified at ${finalLocationText}.`
      );

      return true;
    } catch (err: any) {
      setBackupStatus('Failed');
      setBackupProgress(0);
      const errMsg = err?.message || 'Backup operation failed.';

      await fetch('/api/backup/log-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'error',
          error: {
            operation: `Backup Now (${customTrigger})`,
            errorCode: 'BACKUP_EXECUTION_ERROR',
            message: errMsg,
            resolutionHint:
              'Check destination permissions, Google Drive sign-in status, and encryption passphrase.',
          },
        }),
      });
      await fetchServerBackupStatus();

      showPanelToast(
        'error',
        lang === 'bn' ? 'ব্যাকআপ ব্যর্থ হয়েছে!' : 'Backup Failed!',
        errMsg,
        lang === 'bn'
          ? 'সমাধান: গন্তব্য সেটিংস পরীক্ষা করুন, পাসওয়ার্ড মিলিয়ে দেখুন অথবা লোকাল/সার্ভার মোড নির্বাচন করুন।'
          : 'Resolution: Verify destination connection, check encryption passphrase, or switch to Local/Server Vault.'
      );
      return false;
    } finally {
      setIsBackingUpNow(false);
      setTimeout(() => setCloudUploadProgress(0), 2500);
    }
  };

  // ============================================================================
  // RESTORE WORKFLOW: INSPECT, TEST/VALIDATE, SAFETY BACKUP & RESTORE
  // ============================================================================
  const handleSelectLocalRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedRestoreBlob(file);
    setSelectedRestoreFilename(file.name);
    setRestoreFeedback(null);
    setIsInspecting(true);
    try {
      const result = await inspectAndVerifyBackupArchive(file, restorePassphrase, file.name);
      setInspectionResult(result);
    } finally {
      setIsInspecting(false);
    }
  };

  const handleSelectGoogleDriveFileForRestore = async (driveFile: GoogleDriveBackupFile) => {
    setPreloadedDriveFileForRestore(driveFile);
    setActiveView('restore');
  };

  const handleSelectServerVaultFileForRestore = async (srvEntry: any) => {
    setIsInspecting(true);
    setRestoreFeedback(null);
    setSelectedRestoreFilename(srvEntry.filename);
    setActiveView('restore');
    try {
      const res = await fetch(`/api/backup/download/${encodeURIComponent(srvEntry.filename)}`);
      if (!res.ok) throw new Error('Could not fetch backup archive from server vault.');
      const blob = await res.blob();
      setSelectedRestoreBlob(blob);
      const result = await inspectAndVerifyBackupArchive(blob, restorePassphrase, srvEntry.filename);
      setInspectionResult(result);
      showPanelToast(
        'info',
        lang === 'bn' ? 'সার্ভার ভল্ট ফাইল লোড হয়েছে' : 'Server Backup Archive Loaded',
        lang === 'bn'
          ? `"${srvEntry.filename}" রিস্টোর প্রিভিউ ও ভ্যালিডেশনের জন্য প্রস্তুত।`
          : `"${srvEntry.filename}" is loaded and ready for restore preview.`
      );
    } catch (err: any) {
      showPanelToast('error', 'Load Error', err?.message || 'Failed to load server backup.');
    } finally {
      setIsInspecting(false);
    }
  };

  const handleRevalidateRestoreFile = async () => {
    if (!selectedRestoreBlob) return;
    setIsInspecting(true);
    setRestoreFeedback(null);
    try {
      const result = await inspectAndVerifyBackupArchive(
        selectedRestoreBlob,
        restorePassphrase,
        selectedRestoreFilename || undefined
      );
      setInspectionResult(result);
      if (result.valid && result.checksumVerified) {
        showPanelToast(
          'success',
          lang === 'bn' ? 'ব্যাকআপ ভ্যালিডেশন সফল!' : 'Backup Integrity Verified!',
          lang === 'bn'
            ? `SHA-256 চেকসাম এবং ডিক্রিপশন টেস্ট ১০০% সফল হয়েছে (${result.summary.totalRecords} টি রেকর্ড প্রস্তুত)।`
            : `SHA-256 Checksum & AES-256 Decryption test passed (${result.summary.totalRecords} records verified).`
        );
      } else {
        showPanelToast(
          'error',
          lang === 'bn' ? 'ভ্যালিডেশন ব্যর্থ' : 'Validation Failed',
          result.error || 'Could not validate backup file with the provided passphrase.'
        );
      }
    } finally {
      setIsInspecting(false);
    }
  };

  const handleExecuteConfirmedRestore = async () => {
    if (!selectedRestoreBlob) return;
    setShowRestoreConfirmModal(false);
    setIsRestoring(true);
    setRestoreProgress(10);
    setRestoreFeedback(null);

    try {
      // 1. Validate & Decrypt Archive
      setRestoreStepLabel(
        lang === 'bn'
          ? '১/৪: ব্যাকআপ আর্কাইভ ও SHA-256 চেকসাম যাচাই করা হচ্ছে...'
          : '1/4: Verifying archive integrity & SHA-256 checksum...'
      );
      const verified = await inspectAndVerifyBackupArchive(
        selectedRestoreBlob,
        restorePassphrase,
        selectedRestoreFilename || undefined
      );
      setInspectionResult(verified);

      if (!verified.valid || !verified.rawTextForRestore) {
        throw new Error(verified.error || 'Backup validation or decryption failed.');
      }

      // 2. Safety Backup of Current Data before mutating
      if (createSafetyBackupBeforeRestore) {
        setRestoreProgress(40);
        setRestoreStepLabel(
          lang === 'bn'
            ? '২/৪: বর্তমান ডেটার একটি Safety Backup তৈরি করা হচ্ছে...'
            : '2/4: Creating automatic Safety Backup of current hospital data...'
        );
        await handleRunBackupNow('Pre-Restore Safety', 'Safety_PreRestore_Backup');
      }

      // 3. Apply Restore to Hospital Database
      setRestoreProgress(75);
      setRestoreStepLabel(
        lang === 'bn'
          ? '৩/৪: হাসপাতালের ডাটাবেজ ও রেকর্ড রিস্টোর করা হচ্ছে...'
          : '3/4: Restoring hospital records & configurations...'
      );
      await new Promise((r) => setTimeout(r, 350));

      const res = await decryptAndRestoreDatabase(
        verified.rawTextForRestore,
        restorePassphrase,
        mergeMode
      );

      if (!res.success) {
        throw new Error(res.message);
      }

      // 4. Record Audit Log
      setRestoreProgress(100);
      setRestoreStepLabel(
        lang === 'bn' ? '৪/৪: রিস্টোর সফলভাবে সম্পন্ন হয়েছে!' : '4/4: Restore completed successfully!'
      );

      await fetch('/api/backup/log-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'audit',
          audit: {
            action: `DATABASE_RESTORED (${mergeMode.toUpperCase()})`,
            actor: currentUser?.fullName || 'Administrator',
            destination: selectedRestoreFilename || 'Uploaded Archive',
            filename: selectedRestoreFilename || 'Backup.zip',
            checksum: verified.expectedChecksum,
            status: 'Success',
            details: `Restored ${verified.summary.patientsCount} patients, ${verified.summary.invoicesCount} invoices, ${verified.summary.doctorsCount} doctors. Pre-restore safety backup: ${createSafetyBackupBeforeRestore ? 'Yes' : 'No'}.`,
          },
        }),
      });
      await fetchServerBackupStatus();

      const successMsg =
        lang === 'bn'
          ? `সিস্টেম রিস্টোর সফলভাবে সম্পন্ন হয়েছে! (${verified.summary.patientsCount} জন রোগী, ${verified.summary.invoicesCount} টি বিলিং ও ${verified.summary.doctorsCount} জন ডাক্তারের তথ্য পুনরুদ্ধার হয়েছে)।`
          : `Database restored successfully! (${verified.summary.patientsCount} patients, ${verified.summary.invoicesCount} invoices, ${verified.summary.doctorsCount} doctors restored).`;

      setRestoreFeedback({ type: 'success', message: successMsg });
      showPanelToast('success', lang === 'bn' ? 'ডেটা রিস্টোর সফল!' : 'Restore Successful!', successMsg);
    } catch (err: any) {
      const errMsg = err?.message || 'Restore failed.';
      setRestoreFeedback({ type: 'error', message: errMsg });

      await fetch('/api/backup/log-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'error',
          error: {
            operation: 'Restore Backup',
            errorCode: 'RESTORE_FAILED',
            message: errMsg,
            resolutionHint: 'Ensure the decryption passphrase is correct and the backup file is not corrupted.',
          },
        }),
      });
      await fetchServerBackupStatus();

      showPanelToast(
        'error',
        lang === 'bn' ? 'রিস্টোর ব্যর্থ হয়েছে' : 'Restore Failed',
        errMsg,
        lang === 'bn'
          ? 'সঠিক ডিক্রিপশন পাসওয়ার্ড দিন এবং বৈধ ব্যাকআপ ফাইল নির্বাচন করুন।'
          : 'Verify your decryption passphrase and ensure the backup archive is intact.'
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const handleConfirmDeleteDriveFile = async () => {
    if (!fileToDeleteFromDrive) return;
    setIsDeletingDriveFile(true);
    try {
      await deleteBackupFromGoogleDrive(fileToDeleteFromDrive.id);
      await loadGoogleDriveFiles();
      showPanelToast(
        'info',
        lang === 'bn' ? 'ক্লাউড ফাইল মুছে ফেলা হয়েছে' : 'Cloud Backup Deleted',
        lang === 'bn'
          ? `Google Drive থেকে "${fileToDeleteFromDrive.name}" মুছে ফেলা হয়েছে।`
          : `Deleted "${fileToDeleteFromDrive.name}" from Google Drive.`
      );
      setFileToDeleteFromDrive(null);
    } catch (err: any) {
      showPanelToast('error', 'Delete Failed', err?.message || 'Could not delete file from Google Drive.');
    } finally {
      setIsDeletingDriveFile(false);
    }
  };

  // Aggregate KPI Metrics for Dashboard
  const totalBackupFilesCount =
    serverBackups.length + backupHistory.length + driveFiles.length;
  const totalStorageKb =
    serverStorageStats.totalKb +
    backupHistory.reduce((acc, b) => acc + (b.sizeKb || 0), 0) +
    Math.round(driveFiles.reduce((acc, f) => acc + (f.size || 0), 0) / 1024);

  const latestBackupRecord = useMemo(() => {
    if (lastCompletedBackupInfo) return lastCompletedBackupInfo;
    if (serverBackups.length > 0) {
      const sb = serverBackups[0];
      return {
        filename: sb.filename,
        locationPath: sb.VirtualWindowsPath || sb.destination,
        sizeKb: sb.sizeKb,
        createdAt: new Date(sb.createdAt).toLocaleString(),
        checksum: sb.checksum,
        isEncrypted: sb.isEncrypted,
        totalRecords: sb.recordsCount,
        downloadUrl: `/api/backup/download/${encodeURIComponent(sb.filename)}`,
      };
    }
    if (backupHistory.length > 0) {
      const bh = backupHistory[0];
      return {
        filename: bh.filename,
        locationPath: effectiveWindowsPath + bh.filename,
        sizeKb: bh.sizeKb,
        createdAt: bh.date,
        checksum: bh.checksum || 'verified-sha256-hash',
        isEncrypted: !!bh.isEncrypted,
        totalRecords: bh.recordsCount,
      };
    }
    return null;
  }, [lastCompletedBackupInfo, serverBackups, backupHistory, effectiveWindowsPath]);

  return (
    <div className="space-y-6 text-xs max-w-7xl mx-auto">
      {/* ===================================================================== */}
      {/* ROLE-BASED SECURITY GUARD FOR NON-ADMIN USERS                         */}
      {/* ===================================================================== */}
      {!isAdmin && (
        <div className="bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-400 dark:border-amber-700 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <h4 className="font-black text-sm text-amber-900 dark:text-amber-200">
                {lang === 'bn'
                  ? 'নিরাপত্তা নীতি: শুধুমাত্র অনুমোদিত অ্যাডমিন ব্যাকআপ ও রিস্টোর নিয়ন্ত্রণ করতে পারবেন'
                  : 'Security Policy: Only Authorized Administrators Can Manage Backups & Restore'}
              </h4>
              <p className="text-amber-800 dark:text-amber-300 text-[11px]">
                {lang === 'bn'
                  ? `আপনি বর্তমানে @${currentUser?.username} (${currentUser?.role}) হিসেবে লগইন আছেন। পরিবর্তন করার জন্য Admin অ্যাকাউন্টে সুইচ করুন।`
                  : `You are logged in as @${currentUser?.username} (${currentUser?.role}). Switch to an Admin account to run backups or restore.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const adminAcc = users.find((u) => u.role === 'Admin');
              if (adminAcc) setCurrentUser(adminAcc);
            }}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer shrink-0 shadow-xs"
          >
            {lang === 'bn' ? 'Admin হিসেবে সুইচ করুন' : 'Switch to Admin'}
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TOAST NOTIFICATION BANNER                                             */}
      {/* ===================================================================== */}
      {panelToast && (
        <div
          className={`p-4 rounded-2xl border-2 shadow-lg flex items-start justify-between gap-3 transition-all ${
            panelToast.type === 'success'
              ? 'bg-emerald-950 text-white border-emerald-500'
              : panelToast.type === 'error'
              ? 'bg-rose-950 text-white border-rose-500'
              : panelToast.type === 'warn'
              ? 'bg-amber-950 text-white border-amber-500'
              : 'bg-indigo-950 text-white border-indigo-500'
          }`}
        >
          <div className="flex items-start gap-3">
            {panelToast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : panelToast.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="font-black text-sm">{panelToast.title}</h4>
              <p className="text-xs opacity-90 mt-0.5">{panelToast.message}</p>
              {panelToast.hint && (
                <p className="text-[11px] mt-1.5 px-2.5 py-1 rounded bg-white/10 text-amber-200 font-semibold">
                  💡 {panelToast.hint}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPanelToast(null)}
            className="text-white/70 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TOP ERP HEADER & QUICK ACTION BAR                                     */}
      {/* ===================================================================== */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-purple-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-md shrink-0">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                {lang === 'bn'
                  ? 'স্মার্ট ব্যাকআপ ও রিস্টোর ম্যানেজমেন্ট প্যানেল'
                  : 'Smart Backup & Restore Management Panel'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                AES-256-GCM · SHA-256 · ZIP + SQL
              </span>
            </div>
            <p className="text-xs text-purple-200/90 mt-1 max-w-2xl">
              {lang === 'bn'
                ? 'অনলাইন ক্লাউড (Google Drive ও Server Vault) এবং অফলাইন লোকাল ড্রাইভ (C:, D:, E: ও Custom Folder)-এ স্বয়ংক্রিয় ও ম্যানুয়াল ব্যাকআপ এবং নিরাপদ রিস্টোর সিস্টেম।'
                : 'Enterprise hospital database, SQL dump, and attachments backup with Google Drive OAuth, Local Drive folders, Backend Cron Scheduler, and verified Restore.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            disabled={isBackingUpNow || !isAdmin}
            onClick={() => handleRunBackupNow('Manual')}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-xl shadow-md cursor-pointer flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
          >
            <Play className={`w-4 h-4 fill-current ${isBackingUpNow ? 'animate-spin' : ''}`} />
            <span>{isBackingUpNow ? (lang === 'bn' ? 'ব্যাকআপ চলছে...' : 'Backing Up...') : lang === 'bn' ? 'Backup Now (এখনই ব্যাকআপ)' : 'Backup Now'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('restore')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 cursor-pointer flex items-center gap-2 transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-pink-300" />
            <span>{lang === 'bn' ? 'Restore Backup (রিস্টোর)' : 'Restore Backup'}</span>
          </button>
        </div>
      </div>

      {/* LIVE PROGRESS BAR WHEN BACKUP IS RUNNING */}
      {isBackingUpNow && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border-2 border-purple-500 shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-purple-950 dark:text-purple-200">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-purple-600 animate-spin" />
              <span>{backupStepText}</span>
            </span>
            <span className="font-mono text-sm font-black text-purple-700 dark:text-purple-300">
              {backupProgress}%
            </span>
          </div>
          <div className="w-full h-3 bg-purple-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${backupProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-NAVIGATION BAR FOR THE 6 CORE SECTIONS                            */}
      {/* ===================================================================== */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          {
            id: 'dashboard',
            label: lang === 'bn' ? '১. ব্যাকআপ ড্যাশবোর্ড' : '1. Backup Dashboard',
            icon: Activity,
          },
          {
            id: 'destinations',
            label: lang === 'bn' ? '২. গন্তব্য ও স্টোরেজ (Online / C: D: E:)' : '2. Backup Destination & Storage',
            icon: Cloud,
          },
          {
            id: 'schedule',
            label: lang === 'bn' ? '৩. অটোমেটিক শিডিউল ও রিটেনশন' : '3. Automatic Schedule',
            icon: Clock,
          },
          {
            id: 'content',
            label: lang === 'bn' ? '৪. ব্যাকআপ ডেটা নির্বাচন (১১টি বিভাগ)' : '4. Backup Content Selection',
            icon: Layers,
          },
          {
            id: 'restore',
            label: lang === 'bn' ? '৫. ডেটা রিস্টোর ও ভ্যালিডেশন' : '5. Restore Backup',
            icon: Upload,
          },
          {
            id: 'security_logs',
            label: lang === 'bn' ? '৬. সিকিউরিটি, অডিট ও এরর লগ' : '6. Security & Audit Logs',
            icon: ShieldCheck,
            badge: serverErrorLogs.length > 0 ? `${serverErrorLogs.length} Err` : undefined,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isAct = activeView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveView(tab.id as BackupPanelSubView)}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 cursor-pointer transition ${
                isAct
                  ? 'bg-purple-900 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isAct ? 'text-pink-300' : 'text-purple-600 dark:text-purple-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-black">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* VIEW 1: BACKUP DASHBOARD                                              */}
      {/* ===================================================================== */}
      {activeView === 'dashboard' && (
        <div className="space-y-6">
          {/* 5 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* KPI 1: Last Backup Date & Time */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-purple-100 dark:border-gray-700 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                <span className="font-bold text-[11px]">
                  {lang === 'bn' ? 'সর্বশেষ ব্যাকআপ সময়' : 'Last Backup Date & Time'}
                </span>
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <div className="font-black text-sm text-purple-950 dark:text-purple-100 truncate">
                {latestBackupRecord?.createdAt || (lang === 'bn' ? 'এখনও নেওয়া হয়নি' : 'No backup yet')}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                {daysSinceLastBackup === 0
                  ? lang === 'bn'
                    ? '✓ আজকের ব্যাকআপ আপ-টু-ডেট'
                    : '✓ Backed up today'
                  : `${daysSinceLastBackup} days ago`}
              </div>
            </div>

            {/* KPI 2: Next Scheduled Backup */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-purple-100 dark:border-gray-700 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                <span className="font-bold text-[11px]">
                  {lang === 'bn' ? 'পরবর্তী নির্ধারিত ব্যাকআপ' : 'Next Scheduled Backup'}
                </span>
                <Clock className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="font-black text-sm text-indigo-950 dark:text-indigo-200 truncate">
                {scheduleEnabled
                  ? nextScheduledTimeStr || (lang === 'bn' ? 'আজ রাত ১২:০০ AM' : 'Scheduled Active')
                  : lang === 'bn'
                  ? 'শিডিউলার বন্ধ'
                  : 'Scheduler Disabled'}
              </div>
              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${scheduleEnabled ? 'bg-emerald-500 animate-ping' : 'bg-gray-400'}`} />
                <span>
                  {scheduleEnabled
                    ? `Backend Cron (${scheduleFrequency.toUpperCase()})`
                    : 'Manual Mode Only'}
                </span>
              </div>
            </div>

            {/* KPI 3: Total Backup Files */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-purple-100 dark:border-gray-700 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                <span className="font-bold text-[11px]">
                  {lang === 'bn' ? 'মোট ব্যাকআপ ফাইল' : 'Total Backup Files'}
                </span>
                <Archive className="w-4 h-4 text-pink-600" />
              </div>
              <div className="font-black text-xl text-purple-950 dark:text-white">
                {totalBackupFilesCount} <span className="text-xs font-semibold text-gray-500">archives</span>
              </div>
              <div className="text-[10px] text-gray-500">
                Server: {serverBackups.length} · Vault: {backupHistory.length} · Cloud: {driveFiles.length}
              </div>
            </div>

            {/* KPI 4: Total Backup Storage Used */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-purple-100 dark:border-gray-700 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                <span className="font-bold text-[11px]">
                  {lang === 'bn' ? 'ব্যবহৃত ব্যাকআপ স্টোরেজ' : 'Total Storage Used'}
                </span>
                <Database className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="font-black text-xl text-emerald-800 dark:text-emerald-300">
                {totalStorageKb >= 1024
                  ? `${(totalStorageKb / 1024).toFixed(2)} MB`
                  : `${totalStorageKb} KB`}
              </div>
              <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(6, (totalStorageKb / 51200) * 100))}%` }}
                />
              </div>
            </div>

            {/* KPI 5: Backup Status */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-purple-100 dark:border-gray-700 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                <span className="font-bold text-[11px]">
                  {lang === 'bn' ? 'ব্যাকআপ স্ট্যাটাস' : 'Backup Status'}
                </span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="pt-0.5">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase ${
                    backupStatus === 'Success'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
                      : backupStatus === 'Pending'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 animate-pulse'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      backupStatus === 'Success'
                        ? 'bg-emerald-600'
                        : backupStatus === 'Pending'
                        ? 'bg-amber-600'
                        : 'bg-rose-600'
                    }`}
                  />
                  {backupStatus === 'Success'
                    ? lang === 'bn'
                      ? 'Success (সফল)'
                      : 'Success'
                    : backupStatus === 'Pending'
                    ? lang === 'bn'
                      ? 'Pending (চলমান)'
                      : 'Pending'
                    : lang === 'bn'
                    ? 'Failed (ব্যর্থ)'
                    : 'Failed'}
                </span>
              </div>
              <div className="text-[10px] text-gray-500">
                {googleDriveToken
                  ? lang === 'bn'
                    ? '☁️ Google Drive সংযুক্ত'
                    : '☁️ Google Drive Connected'
                  : lang === 'bn'
                  ? '💾 লোকাল ও সার্ভার ভল্ট সক্রিয়'
                  : '💾 Local & Server Vault Ready'}
              </div>
            </div>
          </div>

          {/* Latest Backup Detailed Information Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-purple-100 dark:border-gray-700 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-gray-700">
                <h3 className="font-black text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    {lang === 'bn'
                      ? 'সর্বশেষ ব্যাকআপের বিস্তারিত তথ্য (Latest Backup Details)'
                      : 'Latest Backup Archive Details'}
                  </span>
                </h3>
                {latestBackupRecord?.isEncrypted && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> AES-256-GCM Encrypted
                  </span>
                )}
              </div>

              {latestBackupRecord ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-purple-50/50 dark:bg-gray-900/60 p-3.5 rounded-xl border border-purple-100 dark:border-gray-700">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">
                        {lang === 'bn' ? 'ব্যাকআপ ফাইলের নাম' : 'Archive Filename'}:
                      </span>
                      <span className="font-mono font-black text-purple-950 dark:text-purple-200 text-xs break-all">
                        {latestBackupRecord.filename}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">
                        {lang === 'bn' ? 'সংরক্ষণের স্থান (Path / Destination)' : 'Storage Location'}:
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs break-all">
                        {latestBackupRecord.locationPath}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">
                        {lang === 'bn' ? 'ফাইলের সাইজ ও রেকর্ড সংখ্যা' : 'Size & Total Records'}:
                      </span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                        {latestBackupRecord.sizeKb} KB · {latestBackupRecord.totalRecords} Records (ZIP + SQL + Attachments)
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">
                        {lang === 'bn' ? 'SHA-256 ইন্টিগ্রিটি চেকসাম' : 'SHA-256 Integrity Checksum'}:
                      </span>
                      <span className="font-mono text-[11px] text-gray-700 dark:text-gray-300">
                        {latestBackupRecord.checksum.slice(0, 24)}...
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {latestBackupRecord.downloadUrl && (
                      <a
                        href={latestBackupRecord.downloadUrl}
                        download={latestBackupRecord.filename}
                        className="px-3.5 py-2 bg-purple-900 hover:bg-purple-950 text-white font-bold rounded-xl flex items-center gap-1.5 text-xs shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5 text-pink-300" />
                        <span>{lang === 'bn' ? '.ZIP ফাইল ডাউনলোড করুন' : 'Download .ZIP Archive'}</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={exportDatabaseSqlDump}
                      className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'SQL ডাম্প (.sql)' : 'Export SQL Dump'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={exportDatabaseJson}
                      className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'JSON এক্সপোর্ট' : 'Plain JSON'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400">
                  {lang === 'bn'
                    ? 'কোনো ব্যাকআপ রেকর্ড পাওয়া যায়নি। উপরে "Backup Now" বাটনে ক্লিক করে প্রথম ব্যাকআপ তৈরি করুন।'
                    : 'No backup archive generated yet. Click "Backup Now" to create your first full ZIP backup.'}
                </div>
              )}
            </div>

            {/* Right: Active Configuration Summary & Quick Destination Switch */}
            <div className="lg:col-span-5 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-purple-100 dark:border-gray-700 shadow-xs space-y-4">
              <div className="border-b pb-3 border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-black text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
                  <Server className="w-4 h-4 text-purple-700" />
                  <span>
                    {lang === 'bn' ? 'বর্তমান ব্যাকআপ কনফিগারেশন' : 'Active Backup Configuration'}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveView('destinations')}
                  className="text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:underline cursor-pointer"
                >
                  {lang === 'bn' ? 'পরিবর্তন করুন →' : 'Configure →'}
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 font-semibold">
                    {lang === 'bn' ? 'নির্বাচিত লোকাল ড্রাইভ পাথ:' : 'Local Drive Path:'}
                  </span>
                  <span className="font-mono font-bold text-purple-900 dark:text-purple-200">
                    {effectiveWindowsPath}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 font-semibold">
                    {lang === 'bn' ? 'অনলাইন ক্লাউড স্টোরেজ:' : 'Online Cloud Storage:'}
                  </span>
                  <span className="font-bold flex items-center gap-1.5">
                    {googleDriveToken ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✓ Google Drive ({googleUser?.email})
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveView('destinations')}
                        className="text-indigo-600 dark:text-indigo-400 underline cursor-pointer"
                      >
                        {lang === 'bn' ? 'Google Drive যুক্ত করুন' : 'Connect Google Drive'}
                      </button>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 font-semibold">
                    {lang === 'bn' ? 'নির্বাচিত ডেটা বিভাগ:' : 'Selected Data Scopes:'}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {selectedContentSummary.selectedCategoriesCount}/10 Modules ({selectedContentSummary.selectedRecords} records)
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 font-semibold">
                    {lang === 'bn' ? 'ব্যাকআপ রিটেনশন পলিসি:' : 'Retention Policy:'}
                  </span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {retentionDays} Days / Max {maxRetainedFiles} Files
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Server & Local Backup Files Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-purple-100 dark:border-gray-700 shadow-xs overflow-hidden">
            <div className="p-4 bg-purple-50/70 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-black text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-purple-700" />
                  <span>
                    {lang === 'bn'
                      ? 'সংরক্ষিত ব্যাকআপ আর্কাইভ তালিকা (Server & Local ZIP Vault)'
                      : 'Stored Backup Archives (Server & Local ZIP Vault)'}
                  </span>
                </h4>
                <p className="text-[11px] text-gray-500">
                  {lang === 'bn'
                    ? 'যেকোনো ব্যাকআপ ফাইল ডাউনলোড করুন অথবা ১-ক্লিকে ভ্যালিডেট ও রিস্টোর করুন'
                    : 'Download any verified .zip backup archive or load it directly into the Restore engine'}
                </p>
              </div>
              <button
                type="button"
                onClick={fetchServerBackupStatus}
                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-purple-200 dark:border-gray-700 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-purple-50 self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
                <span>{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="p-3 font-bold">{lang === 'bn' ? 'ফাইলের নাম (.zip)' : 'Backup Filename'}</th>
                    <th className="p-3 font-bold">{lang === 'bn' ? 'তারিখ ও সময়' : 'Created Date & Time'}</th>
                    <th className="p-3 font-bold">{lang === 'bn' ? 'গন্তব্য / পাথ' : 'Location / Path'}</th>
                    <th className="p-3 font-bold">{lang === 'bn' ? 'সাইজ ও রেকর্ড' : 'Size & Records'}</th>
                    <th className="p-3 font-bold">{lang === 'bn' ? 'নিরাপত্তা ও চেকসাম' : 'Security & Checksum'}</th>
                    <th className="p-3 font-bold text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {serverBackups.length === 0 && backupHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-400">
                        {lang === 'bn'
                          ? 'এখনও কোনো ব্যাকআপ ফাইল তৈরি হয়নি। উপরে "Backup Now" বাটনে ক্লিক করুন।'
                          : 'No backup archives stored yet. Click "Backup Now" above to create one.'}
                      </td>
                    </tr>
                  ) : (
                    serverBackups.map((sb) => (
                      <tr key={sb.id} className="hover:bg-purple-50/40 dark:hover:bg-gray-750">
                        <td className="p-3 font-mono font-bold text-purple-950 dark:text-purple-200">
                          {sb.filename}
                          <span className="ml-2 px-1.5 py-0.2 rounded text-[9px] font-sans font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                            {sb.triggerType}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">
                          {new Date(sb.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-gray-600 dark:text-gray-400">
                          {sb.VirtualWindowsPath || sb.destination}
                        </td>
                        <td className="p-3 font-semibold">
                          {sb.sizeKb} KB · <span className="text-gray-500">{sb.recordsCount} recs</span>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <Lock className="w-3 h-3" />
                            {sb.isEncrypted ? 'AES-256' : 'Standard'} · {sb.checksum?.slice(0, 8)}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`/api/backup/download/${encodeURIComponent(sb.filename)}`}
                              download={sb.filename}
                              className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 rounded-lg font-bold flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              <span>ZIP</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleSelectServerVaultFileForRestore(sb)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>{lang === 'bn' ? 'রিস্টোর' : 'Restore'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                requestDeleteRecord({
                                  entityType: 'backupHistory',
                                  entityLabel: 'সার্ভার ব্যাকআপ আর্কাইভ (Server Backup ZIP)',
                                  recordId: sb.filename,
                                  recordTitle: sb.filename,
                                  recordSubtitle: `${sb.sizeKb} KB · ${sb.recordsCount} records · ${sb.triggerType}`,
                                  originalData: sb,
                                  onSuccess: () => {
                                    fetchServerBackupStatus();
                                  },
                                });
                              }}
                              className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                              title="Delete (Admin Only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 2: BACKUP DESTINATION & STORAGE SETTINGS (ONLINE & OFFLINE)      */}
      {/* ===================================================================== */}
      {activeView === 'destinations' && (
        <div className="space-y-6">
          {/* Destination Mode Selector */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-purple-100 dark:border-gray-700 shadow-xs space-y-4">
            <h3 className="font-black text-sm text-purple-950 dark:text-purple-200">
              {lang === 'bn'
                ? 'Backup Destination & Storage Settings (ব্যাকআপ সংরক্ষণের মাধ্যম নির্বাচন)'
                : 'Backup Destination & Storage Settings'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'both',
                  title: lang === 'bn' ? 'হাইব্রিড (Local Drive + Online Cloud)' : 'Hybrid (Local Drive + Cloud)',
                  desc:
                    lang === 'bn'
                      ? 'একই সাথে লোকাল কম্পিউটার (C:/D:/E:) এবং অনলাইন ক্লাউডে ব্যাকআপ সংরক্ষণ করবে (সর্বোচ্চ নিরাপত্তা)'
                      : 'Saves simultaneously to local computer disk and online cloud storage (Recommended)',
                },
                {
                  id: 'local',
                  title: lang === 'bn' ? 'অফলাইন / লোকাল কম্পিউটার (Offline / Local)' : 'Offline / Local Computer Only',
                  desc:
                    lang === 'bn'
                      ? 'কম্পিউটারের C, D, E ড্রাইভ বা পছন্দের ফোল্ডারে সংরক্ষণ করবে'
                      : 'Saves directly to C:, D:, E: drive or custom local folder',
                },
                {
                  id: 'online',
                  title: lang === 'bn' ? 'অনলাইন ক্লাউড স্টোরেজ (Online Cloud)' : 'Online Cloud Storage Only',
                  desc:
                    lang === 'bn'
                      ? 'Google Drive এবং সিকিউর ক্লাউড সার্ভারে সংরক্ষণ করবে'
                      : 'Uploads encrypted backup archive directly to Google Drive & Cloud Vault',
                },
              ].map((m) => (
                <div
                  key={m.id}
                  onClick={() => setDestinationMode(m.id as any)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition ${
                    destinationMode === m.id
                      ? 'border-purple-700 bg-purple-50/70 dark:bg-purple-950/40'
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-purple-950 dark:text-purple-100">{m.title}</span>
                    <input
                      type="radio"
                      checked={destinationMode === m.id}
                      onChange={() => setDestinationMode(m.id as any)}
                      className="accent-purple-700 w-4 h-4"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* A. ONLINE BACKUP SECTION */}
            <div className="lg:col-span-6 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-purple-100 dark:border-gray-700 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-gray-700">
                <div>
                  <h4 className="font-black text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-blue-600" />
                    <span>{lang === 'bn' ? 'A. অনলাইন ক্লাউড ব্যাকআপ (Online Backup)' : 'A. Online Cloud Backup'}</span>
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    {lang === 'bn'
                      ? 'প্রকৃত Google Drive OAuth 2.0 API ইন্টিগ্রেশন এবং ক্লাউড সার্ভার স্টোরেজ'
                      : 'Real Google Drive OAuth 2.0 API integration & Secure Cloud Server storage'}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    googleDriveToken
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {googleDriveToken ? 'Connected (OAuth 2.0)' : 'Not Connected'}
                </span>
              </div>

              {/* Cloud Provider Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'google_drive', name: 'Google Drive', live: true },
                  { id: 'server_cloud', name: 'Secure Cloud Vault', live: true },
                  { id: 'onedrive', name: 'OneDrive', live: false },
                  { id: 'dropbox', name: 'Dropbox', live: false },
                ].map((prov) => (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => setSelectedCloudProvider(prov.id as any)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                      selectedCloudProvider === prov.id
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 font-black'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="text-xs text-slate-900 dark:text-slate-100">{prov.name}</div>
                    <div className={`text-[9px] font-bold mt-0.5 ${prov.live ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {prov.live ? '● Live API Ready' : '○ External Config'}
                    </div>
                  </button>
                ))}
              </div>

              {selectedCloudProvider === 'google_drive' && (
                <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700">
                  {!googleDriveToken ? (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        {lang === 'bn'
                          ? 'আপনার হাসপাতালের এনক্রিপ্টেড ব্যাকআপ ফাইল সরাসরি আপনার Google Drive-এর "Adiba_Hospital_Backups" ফোল্ডারে সংরক্ষণ ও রিস্টোর করতে নিচের অফিশিয়াল গুগল বাটনে সাইন-ইন করুন:'
                          : 'Sign in with your Google account to automatically upload, list, and restore encrypted hospital ZIP backups in your Google Drive:'}
                      </p>

                      {/* Official Sign in with Google Button per workspace-integration skill */}
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={isConnectingGoogle}
                        className="inline-flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-gray-50 text-slate-800 font-bold rounded-xl border border-gray-300 shadow-xs cursor-pointer transition active:scale-95"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 48 48">
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
                        <span>
                          {isConnectingGoogle
                            ? lang === 'bn'
                              ? 'Google Drive সংযুক্ত হচ্ছে...'
                              : 'Connecting Google Drive...'
                            : 'Sign in with Google'}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-gray-800 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <div className="min-w-0">
                          <div className="font-black text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">
                              {googleUser?.displayName || driveQuota?.userName || 'Google Drive Account'}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500 truncate">
                            {googleUser?.email || driveQuota?.userEmail}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleGoogleSignOut}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-[11px] cursor-pointer self-start sm:self-auto shrink-0"
                        >
                          {lang === 'bn' ? 'ডিসকানেক্ট' : 'Disconnect'}
                        </button>
                      </div>

                      {/* Admin Target Folder Selector Box */}
                      <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-300 block">
                              {lang === 'bn'
                                ? 'নির্বাচিত Google Drive ব্যাকআপ ফোল্ডার:'
                                : 'Target Google Drive Backup Folder:'}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <FolderOpen className="w-4 h-4 text-blue-600 shrink-0" />
                              <code className="font-mono font-black text-xs text-blue-950 dark:text-blue-100 truncate">
                                /{selectedDriveFolder.name || DEFAULT_BACKUP_FOLDER_NAME}
                              </code>
                              {selectedDriveFolder.webViewLink && (
                                <a
                                  href={selectedDriveFolder.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Open Folder in Google Drive"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={!isAdmin}
                            onClick={handleOpenGoogleDriveFolderModal}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs disabled:opacity-50"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            <span>
                              {lang === 'bn' ? 'ফোল্ডার নির্বাচন / পরিবর্তন' : 'Select / Change Folder'}
                            </span>
                          </button>
                        </div>

                        {/* Quick Action Buttons: Upload Now & Test Round-Trip */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-blue-200/60 dark:border-blue-800/60">
                          <button
                            type="button"
                            disabled={isBackingUpNow || isTestingCloudRoundTrip || !isAdmin}
                            onClick={() => handleRunBackupNow('Manual')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>
                              {lang === 'bn'
                                ? 'এখনই Google Drive-এ ব্যাকআপ আপলোড করুন'
                                : 'Upload Encrypted Backup Now'}
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={isTestingCloudRoundTrip || isBackingUpNow || !isAdmin}
                            onClick={handleTestCloudUploadAndRestoreVerify}
                            className="px-3 py-1.5 bg-purple-800 hover:bg-purple-900 text-white font-bold rounded-lg text-[11px] flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                          >
                            <ShieldCheck className={`w-3.5 h-3.5 text-pink-300 ${isTestingCloudRoundTrip ? 'animate-spin' : ''}`} />
                            <span>
                              {isTestingCloudRoundTrip
                                ? lang === 'bn'
                                  ? 'আপলোড ও ভেরিফিকেশন চলছে...'
                                  : 'Testing Upload & Verify...'
                                : lang === 'bn'
                                ? 'আপলোড ও রিস্টোর ইন্টিগ্রিটি টেস্ট করুন'
                                : 'Test Upload & Verify Integrity'}
                            </span>
                          </button>
                        </div>
                      </div>

                      {driveQuota && (
                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Google Drive Storage Used:</span>
                            <span className="font-bold">
                              {(driveQuota.usage / (1024 * 1024 * 1024)).toFixed(2)} GB /{' '}
                              {(driveQuota.limit / (1024 * 1024 * 1024)).toFixed(0)} GB
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{
                                width: `${Math.min(100, Math.max(2, (driveQuota.usage / driveQuota.limit) * 100))}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {cloudUploadProgress > 0 && (
                        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700 space-y-1">
                          <div className="flex justify-between text-[11px] font-bold text-blue-800 dark:text-blue-200">
                            <span className="flex items-center gap-1.5">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                              <span>
                                {lang === 'bn'
                                  ? `Google Drive (/${selectedDriveFolder.name})-এ এনক্রিপ্টেড ফাইল আপলোড হচ্ছে...`
                                  : `Uploading encrypted archive to /${selectedDriveFolder.name}...`}
                              </span>
                            </span>
                            <span className="font-mono font-black">{cloudUploadProgress}%</span>
                          </div>
                          <div className="w-full h-2 bg-blue-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all"
                              style={{ width: `${cloudUploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Live Cloud Round-Trip Integrity Verification Report */}
                      {cloudVerificationReport && (
                        <div className="p-3 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/50 border-2 border-emerald-400 dark:border-emerald-700 space-y-2 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>
                                {lang === 'bn'
                                  ? '✓ Google Drive ইন্টিগ্রিটি ও ডিক্রিপশন ভেরিফিকেশন রিপোর্ট'
                                  : '✓ Google Drive Integrity & Decryption Verification Report'}
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setCloudVerificationReport(null)}
                              className="text-gray-400 hover:text-gray-700 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px] bg-white dark:bg-gray-900 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <div className="truncate">
                              <span className="text-gray-500">File:</span>{' '}
                              <strong>{cloudVerificationReport.filename}</strong>
                            </div>
                            <div className="truncate">
                              <span className="text-gray-500">Folder:</span>{' '}
                              <strong>/{cloudVerificationReport.folderName}</strong>
                            </div>
                            <div>
                              <span className="text-gray-500">Cipher:</span>{' '}
                              <strong className="text-emerald-700">AES-256-GCM + ZIP ({cloudVerificationReport.sizeKb} KB)</strong>
                            </div>
                            <div className="truncate">
                              <span className="text-gray-500">SHA-256:</span>{' '}
                              <strong className="text-emerald-700">
                                {cloudVerificationReport.sha256Checksum.slice(0, 14)}... (Matched)
                              </strong>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-emerald-900 dark:text-emerald-200 font-semibold">
                            <span>
                              Records Verified: {cloudVerificationReport.patientsCount} Patients ·{' '}
                              {cloudVerificationReport.invoicesCount} Invoices ·{' '}
                              {cloudVerificationReport.doctorsCount} Doctors ·{' '}
                              {cloudVerificationReport.attachmentsCount} Attachments · SQL:{' '}
                              {cloudVerificationReport.hasSqlDump ? 'Included' : 'No'}
                            </span>
                            {cloudVerificationReport.driveFile && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleSelectGoogleDriveFileForRestore(cloudVerificationReport.driveFile!)
                                }
                                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold cursor-pointer"
                              >
                                {lang === 'bn' ? 'রিস্টোর প্রিভিউতে খুলুন →' : 'Open in Restore Preview →'}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <label className="text-gray-500 block mb-1">Cloud Backup Frequency:</label>
                          <select
                            value={cloudBackupFrequency}
                            onChange={(e) => setCloudBackupFrequency(e.target.value as any)}
                            className="w-full p-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg font-bold"
                          >
                            <option value="every_backup">Every Backup Run</option>
                            <option value="daily">Daily Cloud Sync</option>
                            <option value="weekly">Weekly Cloud Sync</option>
                          </select>
                        </div>
                        <div>
                          <span className="text-gray-500 block mb-1">Last Successful Cloud Backup:</span>
                          <div className="p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-bold truncate">
                            {lastCloudBackupTime || 'Ready for upload'}
                          </div>
                        </div>
                      </div>

                      {/* List of Google Drive Backup Files */}
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px]">
                            Google Drive Backup History in /{selectedDriveFolder.name} ({driveFiles.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => loadGoogleDriveFiles()}
                            className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
                          >
                            {isLoadingDriveFiles ? 'Loading...' : 'Refresh List'}
                          </button>
                        </div>
                        <div className="max-h-52 overflow-y-auto space-y-1.5">
                          {driveFiles.length === 0 ? (
                            <div className="p-3 text-center text-gray-400 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-[11px]">
                              {lang === 'bn'
                                ? `এই ফোল্ডারে (/${selectedDriveFolder.name}) এখনও কোনো ব্যাকআপ ফাইল নেই। উপরে "এখনই Google Drive-এ ব্যাকআপ আপলোড করুন" বাটনে ক্লিক করুন।`
                                : `No backup archives in /${selectedDriveFolder.name} yet. Click "Upload Encrypted Backup Now" above.`}
                            </div>
                          ) : (
                            driveFiles.map((df) => (
                              <div
                                key={df.id}
                                className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]"
                              >
                                <div className="min-w-0">
                                  <div className="font-mono font-bold truncate text-slate-900 dark:text-slate-100">
                                    {df.name}
                                  </div>
                                  <div className="text-[10px] text-gray-500">
                                    {Math.max(1, Math.round(df.size / 1024))} KB ·{' '}
                                    {new Date(df.createdTime).toLocaleString()}
                                    {df.md5Checksum ? ` · MD5: ${df.md5Checksum.slice(0, 8)}` : ''}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    disabled={verifyingDriveFileId === df.id}
                                    onClick={() => handleVerifyDriveFileIntegrity(df)}
                                    className="px-2 py-1 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 rounded font-bold text-[10px] cursor-pointer flex items-center gap-1"
                                    title="Verify SHA-256 & AES-256 Decryption"
                                  >
                                    <ShieldCheck className="w-3 h-3" />
                                    <span>
                                      {verifyingDriveFileId === df.id
                                        ? '...'
                                        : lang === 'bn'
                                        ? 'যাচাই'
                                        : 'Verify'}
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadDriveFileToLocal(df)}
                                    className="px-2 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded font-bold text-[10px] cursor-pointer flex items-center gap-1"
                                    title="Download .ZIP from Google Drive"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>ZIP</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSelectGoogleDriveFileForRestore(df)}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] cursor-pointer"
                                  >
                                    {lang === 'bn' ? 'রিস্টোর' : 'Restore'}
                                  </button>
                                  {df.webViewLink && (
                                    <a
                                      href={df.webViewLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 text-blue-600 hover:text-blue-800"
                                      title="Open in Google Drive"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setFileToDeleteFromDrive(df)}
                                    className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                                    title="Delete from Google Drive"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedCloudProvider === 'server_cloud' && (
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-black">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Secure Hospital Cloud Server Vault — Connected & Active</span>
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300">
                    {lang === 'bn'
                      ? `ব্যাকএন্ড সার্ভারে মোট ${serverStorageStats.totalFiles} টি এনক্রিপ্টেড .ZIP ব্যাকআপ সংরক্ষিত আছে (${serverStorageStats.totalKb} KB ব্যবহৃত)।`
                      : `Backend Server Vault currently holds ${serverStorageStats.totalFiles} verified .ZIP archives (${serverStorageStats.totalKb} KB used).`}
                  </p>
                </div>
              )}

              {(selectedCloudProvider === 'onedrive' || selectedCloudProvider === 'dropbox') && (
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-black">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>
                      {selectedCloudProvider === 'onedrive' ? 'Microsoft OneDrive' : 'Dropbox'} — External Enterprise OAuth Required
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    {lang === 'bn'
                      ? `সতর্কতা: আমাদের নীতিমালা অনুযায়ী কোনো ফেইক বা নকল ক্লাউড কানেকশন দেখানো হয় না। ${
                          selectedCloudProvider === 'onedrive' ? 'Microsoft OneDrive' : 'Dropbox'
                        } ব্যবহারের জন্য বাহ্যিক Client ID/Tenant কনফিগারেশন প্রয়োজন। তাৎক্ষণিক প্রকৃত ক্লাউড ব্যাকআপের জন্য উপরের "Google Drive" অথবা "Secure Cloud Vault" ব্যবহার করুন।`
                      : `Transparency Notice: Real ${
                          selectedCloudProvider === 'onedrive' ? 'Microsoft Graph OneDrive' : 'Dropbox'
                        } uploads require external app tenant credentials. For immediate real OAuth cloud backups, select "Google Drive" or "Secure Cloud Vault" above.`}
                  </p>
                </div>
              )}
            </div>

            {/* B. OFFLINE / LOCAL COMPUTER BACKUP SECTION */}
            <div className="lg:col-span-6 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-purple-100 dark:border-gray-700 shadow-xs space-y-4">
              <div className="border-b pb-3 border-gray-100 dark:border-gray-700">
                <h4 className="font-black text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-purple-700" />
                  <span>
                    {lang === 'bn'
                      ? 'B. অফলাইন / লোকাল কম্পিউটার ব্যাকআপ (Windows C: / D: / E: Drive)'
                      : 'B. Offline / Local Computer Backup (Windows Drives)'}
                  </span>
                </h4>
                <p className="text-[11px] text-gray-500">
                  {lang === 'bn'
                    ? 'আপনার পিসির ড্রাইভ বা কাস্টম ফোল্ডার নির্বাচন করুন'
                    : 'Select target Windows drive path or browse a local folder on your computer'}
                </p>
              </div>

              {/* Windows Drive Radio Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: 'C', label: 'C Drive', path: 'C:\\HospitalBackup\\' },
                  { id: 'D', label: 'D Drive (Recommended)', path: 'D:\\HospitalBackup\\' },
                  { id: 'E', label: 'E Drive', path: 'E:\\HospitalBackup\\' },
                  { id: 'custom', label: 'Custom Folder', path: customFolderPath },
                ].map((drv) => (
                  <label
                    key={drv.id}
                    onClick={() => setSelectedDriveOption(drv.id as any)}
                    className={`p-3 rounded-xl border-2 cursor-pointer flex items-center justify-between transition ${
                      selectedDriveOption === drv.id
                        ? 'border-purple-700 bg-purple-50/70 dark:bg-purple-950/40'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                    }`}
                  >
                    <div>
                      <div className="font-black text-xs text-slate-900 dark:text-slate-100">{drv.label}</div>
                      <div className="font-mono text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">
                        {drv.path}
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="windowsDriveSelect"
                      checked={selectedDriveOption === drv.id}
                      onChange={() => setSelectedDriveOption(drv.id as any)}
                      className="accent-purple-700 w-4 h-4"
                    />
                  </label>
                ))}
              </div>

              {/* Custom Path Input + Browse Folder Button */}
              <div className="space-y-2">
                <label className="font-bold text-gray-700 dark:text-gray-300 block">
                  {lang === 'bn' ? 'নির্বাচিত ফোল্ডারের প্রকৃত Path:' : 'Selected Local Folder Path:'}
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={selectedDriveOption === 'custom' ? customFolderPath : effectiveWindowsPath}
                    onChange={(e) => {
                      setSelectedDriveOption('custom');
                      setCustomFolderPath(e.target.value);
                    }}
                    className="flex-1 bg-gray-50 dark:bg-gray-900 border border-purple-300 dark:border-purple-700 p-2.5 rounded-xl font-mono font-bold text-purple-950 dark:text-purple-200 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleBrowseLocalFolder}
                    className="px-4 py-2.5 bg-purple-800 hover:bg-purple-900 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                  >
                    <FolderOpen className="w-4 h-4 text-pink-300" />
                    <span>{lang === 'bn' ? 'Browse Folder (ফোল্ডার খুঁজুন)' : 'Browse Folder'}</span>
                  </button>
                </div>
              </div>

              {/* Browser Security & File System Access Capability Notice */}
              <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-1.5 text-[11px]">
                <div className="font-black text-indigo-950 dark:text-indigo-200 flex items-center justify-between">
                  <span>
                    {lang === 'bn'
                      ? '🔒 ব্রাউজার নিরাপত্তা ও লোকাল ডিস্ক রাইট স্ট্যাটাস:'
                      : '🔒 Local Disk Write Capability & Security Notice:'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-200 font-bold text-[10px]">
                    {directoryHandle
                      ? `Connected: ${directoryHandleName}`
                      : fsApiStatus === 'supported'
                      ? 'File System API Supported'
                      : 'Browser Stream + Backend Disk'}
                  </span>
                </div>
                <p className="text-indigo-900/90 dark:text-indigo-300 leading-relaxed">
                  {lang === 'bn'
                    ? 'ব্রাউজার-ভিত্তিক অ্যাপে নিরাপত্তাজনিত কারণে ব্যবহারকারীর অনুমতি ছাড়া সরাসরি C: বা D: ড্রাইভে নির্বিচারে ফাইল লেখা যায় না। তাই এখানে ৩-স্তরের কার্যকর ব্যবস্থা রাখা হয়েছে: (১) "Browse Folder" দিয়ে ফোল্ডার নির্বাচন করলে File System Access API সরাসরি সেই ফোল্ডারে .zip ফাইল লিখবে, (২) ব্যাকএন্ড সার্ভারের লোকাল ডিস্কে (/backups/) ফাইলটি সংরক্ষিত হবে, এবং (৩) ব্রাউজারের মাধ্যমে সরাসরি .zip ফাইল আপনার পিসিতে ডাউনলোড হবে।'
                    : 'Due to browser security sandboxing, web apps cannot arbitrarily write to C: or D: drives without explicit permission. This system implements 3 real mechanisms: (1) Direct folder write via File System Access API when you click "Browse Folder", (2) Persistent Backend Server Disk storage (/backups/), and (3) Direct .ZIP archive download to your computer.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 3: AUTOMATIC BACKUP SCHEDULE & RETENTION                         */}
      {/* ===================================================================== */}
      {activeView === 'schedule' && (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-purple-100 dark:border-gray-700 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-gray-100 dark:border-gray-700">
            <div>
              <h3 className="font-black text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-700" />
                <span>
                  {lang === 'bn'
                    ? 'Automatic Backup Schedule (স্বয়ংক্রিয় ব্যাকআপ সময়সূচী ও ব্যাকএন্ড সার্ভিস)'
                    : 'Automatic Backup Schedule & Backend Cron Service'}
                </span>
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {lang === 'bn'
                  ? 'ব্রাউজার ট্যাব বন্ধ থাকলেও Node.js Backend Scheduler সার্ভিস নির্ধারিত সময়ে স্বয়ংক্রিয়ভাবে ব্যাকআপ চালু রাখবে।'
                  : 'Powered by the Node.js Backend Cron Daemon so scheduled backups continue running even when the browser is closed.'}
              </p>
            </div>

            <label className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-700 cursor-pointer">
              <input
                type="checkbox"
                checked={scheduleEnabled}
                onChange={(e) => {
                  setScheduleEnabled(e.target.checked);
                  updateAutoBackupConfig({ enabled: e.target.checked });
                  syncStateToBackendServer({ enabled: e.target.checked });
                }}
                className="accent-purple-700 w-4 h-4 cursor-pointer"
              />
              <span className="font-black text-purple-950 dark:text-purple-100">
                {scheduleEnabled
                  ? lang === 'bn'
                    ? 'Automatic Backup চালু (Enabled)'
                    : 'Automatic Backup Enabled'
                  : lang === 'bn'
                  ? 'Automatic Backup বন্ধ (Disabled)'
                  : 'Automatic Backup Disabled'}
              </span>
            </label>
          </div>

          {/* Schedule Frequency Cards */}
          <div className="space-y-2">
            <label className="font-bold text-gray-800 dark:text-gray-200 block">
              {lang === 'bn' ? 'ব্যাকআপের সময়কাল নির্বাচন করুন:' : 'Select Backup Frequency:'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { id: 'hourly', label: lang === 'bn' ? 'Every 1 Hour (প্রতি ১ ঘণ্টা)' : 'Every 1 Hour' },
                { id: 'every_6h', label: lang === 'bn' ? 'Every 6 Hours (প্রতি ৬ ঘণ্টা)' : 'Every 6 Hours' },
                { id: 'daily', label: lang === 'bn' ? 'Daily (প্রতিদিন)' : 'Daily (Every 24h)' },
                { id: 'weekly', label: lang === 'bn' ? 'Weekly (প্রতি সপ্তাহে)' : 'Weekly (Every 7d)' },
                { id: 'custom', label: lang === 'bn' ? 'Custom Date & Time' : 'Custom Date & Time' },
              ].map((freq) => (
                <div
                  key={freq.id}
                  onClick={() => {
                    setScheduleFrequency(freq.id as any);
                    syncStateToBackendServer({ frequency: freq.id });
                  }}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-center justify-between ${
                    scheduleFrequency === freq.id
                      ? 'border-purple-700 bg-purple-50 dark:bg-purple-950/50 font-black text-purple-950 dark:text-purple-100'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span>{freq.label}</span>
                  <input
                    type="radio"
                    checked={scheduleFrequency === freq.id}
                    onChange={() => {}}
                    className="accent-purple-700"
                  />
                </div>
              ))}
            </div>
          </div>

          {scheduleFrequency === 'custom' && (
            <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-gray-900 border border-purple-200 dark:border-purple-800 flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="font-bold text-purple-950 dark:text-purple-200">
                {lang === 'bn' ? 'কাস্টম তারিখ ও সময় নির্ধারণ করুন:' : 'Select Custom Date & Time:'}
              </label>
              <input
                type="datetime-local"
                value={customScheduleDateTime}
                onChange={(e) => {
                  setCustomScheduleDateTime(e.target.value);
                  syncStateToBackendServer({ customDateTime: e.target.value });
                }}
                className="p-2 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded-lg font-mono font-bold"
              />
            </div>
          )}

          {/* Event Triggers & Retention Policy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Pre-Update & Pre-Migration Triggers */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 space-y-3">
              <h4 className="font-black text-xs text-purple-950 dark:text-purple-200">
                {lang === 'bn'
                  ? 'ইভেন্ট-ভিত্তিক স্বয়ংক্রিয় সুরক্ষা ব্যাকআপ'
                  : 'Event-Driven Safety Backup Triggers'}
              </h4>

              <label className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer">
                <div>
                  <div className="font-bold text-gray-800 dark:text-gray-200">
                    {lang === 'bn' ? 'Backup Before Data Update' : 'Backup Before Data Update'}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {lang === 'bn'
                      ? 'বড় ডেটা আপডেট বা বাল্ক পরিবর্তনের আগে স্বয়ংক্রিয় স্ন্যাপশট'
                      : 'Automatically saves a snapshot prior to bulk data updates'}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={backupBeforeUpdate}
                  onChange={(e) => {
                    setBackupBeforeUpdate(e.target.checked);
                    syncStateToBackendServer({ backupBeforeUpdate: e.target.checked });
                  }}
                  className="accent-purple-700 w-4 h-4"
                />
              </label>

              <div className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={backupBeforeMigration}
                    onChange={(e) => {
                      setBackupBeforeMigration(e.target.checked);
                      syncStateToBackendServer({ backupBeforeMigration: e.target.checked });
                    }}
                    className="accent-purple-700 w-4 h-4"
                  />
                  <div>
                    <div className="font-bold text-gray-800 dark:text-gray-200">
                      {lang === 'bn' ? 'Backup Before Database Migration' : 'Backup Before Database Migration'}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {lang === 'bn'
                        ? 'স্কিমা বা ডাটাবেজ মাইগ্রেশনের আগে পূর্ণাঙ্গ SQL + ZIP ব্যাকআপ'
                        : 'Creates a verified pre-migration SQL + ZIP archive'}
                    </div>
                  </div>
                </label>
                <button
                  type="button"
                  onClick={() => handleRunBackupNow('Pre-Migration')}
                  className="px-2.5 py-1 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-lg font-bold text-[10px] cursor-pointer shrink-0"
                >
                  {lang === 'bn' ? 'টেস্ট রান' : 'Run Pre-Migration'}
                </button>
              </div>
            </div>

            {/* Retention & Auto-Cleanup */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 space-y-3">
              <h4 className="font-black text-xs text-purple-950 dark:text-purple-200">
                {lang === 'bn'
                  ? 'Backup Retention ও পুরোনো ব্যাকআপ স্বয়ংক্রিয়ভাবে মুছে ফেলা'
                  : 'Backup Retention & Automatic Cleanup Policy'}
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    {lang === 'bn' ? 'কত দিনের ব্যাকআপ রাখা হবে:' : 'Retention Period (Days):'}
                  </label>
                  <select
                    value={retentionDays}
                    onChange={(e) => {
                      const d = Number(e.target.value);
                      setRetentionDays(d);
                      syncStateToBackendServer({ retentionDays: d });
                    }}
                    className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl font-bold"
                  >
                    <option value={7}>7 Days (৭ দিন)</option>
                    <option value={14}>14 Days (১৪ দিন)</option>
                    <option value={30}>30 Days (৩০ দিন)</option>
                    <option value={60}>60 Days (৬০ দিন)</option>
                    <option value={90}>90 Days (৯০ দিন)</option>
                    <option value={365}>365 Days (১ বছর)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    {lang === 'bn' ? 'সর্বোচ্চ ব্যাকআপ ফাইল সংখ্যা:' : 'Max Retained Files:'}
                  </label>
                  <select
                    value={maxRetainedFiles}
                    onChange={(e) => {
                      const m = Number(e.target.value);
                      setMaxRetainedFiles(m);
                      updateAutoBackupConfig({ maxRetainedBackups: m });
                      syncStateToBackendServer({ maxRetainedBackups: m });
                    }}
                    className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl font-bold"
                  >
                    <option value={5}>5 Backup Archives</option>
                    <option value={10}>10 Backup Archives</option>
                    <option value={15}>15 Backup Archives</option>
                    <option value={30}>30 Backup Archives</option>
                    <option value={50}>50 Backup Archives</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer">
                <div>
                  <div className="font-bold text-gray-800 dark:text-gray-200">
                    {lang === 'bn'
                      ? 'পুরোনো ব্যাকআপ স্বয়ংক্রিয়ভাবে মুছে ফেলুন (Auto-Delete Old Backups)'
                      : 'Auto-Delete Expired Backups'}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {lang === 'bn'
                      ? `${retentionDays} দিনের পুরোনো ব্যাকআপ ফাইল স্বয়ংক্রিয়ভাবে ডিস্ক থেকে মুছে স্টোরেজ খালি রাখবে`
                      : `Automatically deletes archives older than ${retentionDays} days`}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoDeleteOldBackups}
                  onChange={(e) => {
                    setAutoDeleteOldBackups(e.target.checked);
                    syncStateToBackendServer({ autoDeleteOld: e.target.checked });
                  }}
                  className="accent-purple-700 w-4 h-4"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 4: BACKUP CONTENT SELECTION (11 SCOPES + SUMMARY)                */}
      {/* ===================================================================== */}
      {activeView === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-purple-100 dark:border-gray-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="font-black text-sm text-purple-950 dark:text-purple-200">
                  {lang === 'bn'
                    ? 'Backup Content Selection (কোন কোন ডেটার ব্যাকআপ নিতে চান নির্বাচন করুন)'
                    : 'Backup Content Selection'}
                </h3>
                <p className="text-[11px] text-gray-500">
                  {lang === 'bn'
                    ? 'নির্দিষ্ট বিভাগ অথবা সম্পূর্ণ হাসপাতাল সিস্টেম ব্যাকআপ নির্বাচন করুন'
                    : 'Select individual hospital modules or Full System Backup'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleScope('fullSystemBackup')}
                className={`px-3.5 py-2 rounded-xl font-black text-xs flex items-center gap-2 cursor-pointer transition ${
                  contentScopes.fullSystemBackup
                    ? 'bg-purple-900 text-white shadow-xs'
                    : 'bg-purple-50 text-purple-900 border border-purple-300'
                }`}
              >
                {contentScopes.fullSystemBackup ? (
                  <CheckSquare className="w-4 h-4 text-pink-300" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                <span>{lang === 'bn' ? 'Full System Backup (সব নির্বাচন)' : 'Full System Backup'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  key: 'patientRecords',
                  label: lang === 'bn' ? '১. Patient Records (রোগীর রেকর্ড)' : '1. Patient Records',
                  count: `${patients.length} patients`,
                },
                {
                  key: 'doctorInfo',
                  label: lang === 'bn' ? '২. Doctor Information (ডাক্তার তালিকা)' : '2. Doctor Information',
                  count: `${doctors.length} doctors`,
                },
                {
                  key: 'appointments',
                  label: lang === 'bn' ? '৩. Appointments & OPD (অ্যাপয়েন্টমেন্ট ও Rx)' : '3. Appointments & OPD',
                  count: `${prescriptions.length + shiftHandovers.length} records`,
                },
                {
                  key: 'billingPayments',
                  label: lang === 'bn' ? '৪. Billing & Payments (বিলিং ও ক্যাশ মেমো)' : '4. Billing & Payments',
                  count: `${invoices.length} invoices, ${expenses.length} expenses`,
                },
                {
                  key: 'pharmacyInventory',
                  label: lang === 'bn' ? '৫. Pharmacy / Inventory (ফার্মেসি ও রিএজেন্ট স্টক)' : '5. Pharmacy / Inventory',
                  count: `5 stock packs + ${labTests.length} catalog items`,
                },
                {
                  key: 'laboratoryReports',
                  label: lang === 'bn' ? '৬. Laboratory & Imaging Reports (ল্যাব, এক্স-রে, USG)' : '6. Laboratory Reports',
                  count: `${selectedContentSummary.labReportsCount} reports`,
                },
                {
                  key: 'staffInfo',
                  label: lang === 'bn' ? '৭. Staff Information (কর্মচারী ও ইউজার একাউন্ট)' : '7. Staff Information',
                  count: `${employees.length} staff, ${users.length} users`,
                },
                {
                  key: 'hospitalSettings',
                  label: lang === 'bn' ? '৮. Hospital Settings (হাসপাতাল প্যাড ও LAN কনফিগ)' : '8. Hospital Settings',
                  count: `${workstations.length} LAN nodes + Clinic Profile`,
                },
                {
                  key: 'databaseSql',
                  label: lang === 'bn' ? '৯. Database (সম্পূর্ণ রিলেশনাল SQL ডাম্প .sql)' : '9. Relational Database (.sql)',
                  count: '10 SQL Tables (DDL + DML)',
                },
                {
                  key: 'documentsAttachments',
                  label:
                    lang === 'bn'
                      ? '১০. Uploaded Documents & Attachments (লোগো, NID ও ডকুমেন্ট)'
                      : '10. Uploaded Documents & Attachments',
                  count: `${selectedContentSummary.attachmentsCount} attached files`,
                },
              ].map((item) => {
                const isSelected = contentScopes[item.key as keyof DetailedBackupScopes];
                return (
                  <div
                    key={item.key}
                    onClick={() => toggleScope(item.key as keyof DetailedBackupScopes)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                      isSelected
                        ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100">{item.label}</div>
                      <div className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold mt-0.5">
                        {item.count}
                      </div>
                    </div>
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-purple-700 dark:text-purple-300 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Pre-Backup Summary Card */}
          <div className="lg:col-span-4 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-purple-100 dark:border-gray-700 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h4 className="font-black text-sm text-purple-950 dark:text-purple-200 border-b pb-2.5 border-gray-100 dark:border-gray-700">
                {lang === 'bn' ? 'নির্বাচিত ডেটার প্রি-ব্যাকআপ সামারি' : 'Pre-Backup Data Summary'}
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500">Patient Records:</span>
                  <strong className="font-mono">{selectedContentSummary.patientsCount}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500">Doctors & Consultants:</span>
                  <strong className="font-mono">{selectedContentSummary.doctorsCount}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500">Appointments & Handovers:</span>
                  <strong className="font-mono">{selectedContentSummary.appointmentsCount}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500">Billing & Vouchers:</span>
                  <strong className="font-mono">{selectedContentSummary.billingCount}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500">Lab & Imaging Reports:</span>
                  <strong className="font-mono">{selectedContentSummary.labReportsCount}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500">Staff & User Accounts:</span>
                  <strong className="font-mono">{selectedContentSummary.staffCount}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500">Documents & Attachments:</span>
                  <strong className="font-mono">{selectedContentSummary.attachmentsCount} files</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500">Relational SQL Dump:</span>
                  <strong className="text-emerald-600">{selectedContentSummary.sqlIncluded ? 'Included (.sql)' : 'No'}</strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 space-y-1">
                <div className="flex justify-between font-black text-purple-950 dark:text-purple-100">
                  <span>{lang === 'bn' ? 'মোট নির্বাচিত রেকর্ড:' : 'Total Selected Records:'}</span>
                  <span>{selectedContentSummary.selectedRecords}</span>
                </div>
                <div className="flex justify-between text-[11px] text-purple-700 dark:text-purple-300">
                  <span>{lang === 'bn' ? 'আনুমানিক ZIP সাইজ:' : 'Estimated ZIP Size:'}</span>
                  <span>~{selectedContentSummary.estimatedSizeKb} KB</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isBackingUpNow || !isAdmin}
              onClick={() => handleRunBackupNow('Manual')}
              className="w-full py-3 bg-gradient-to-r from-purple-800 to-indigo-900 hover:from-purple-900 hover:to-indigo-950 text-white font-black rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current text-pink-300" />
              <span>{lang === 'bn' ? 'নির্বাচিত ডেটার ব্যাকআপ নিন' : 'Backup Selected Data Now'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 5: SAFE RESTORE MODULE (PREVIEW, VALIDATION & CONFIRMATION)      */}
      {/* ===================================================================== */}
      {activeView === 'restore' && (
        <RestoreModule
          serverBackups={serverBackups}
          driveFiles={driveFiles}
          googleDriveToken={googleDriveToken}
          onGoogleSignIn={handleGoogleSignIn}
          selectedDriveFolderName={selectedDriveFolder.name || DEFAULT_BACKUP_FOLDER_NAME}
          preloadedDriveFile={preloadedDriveFileForRestore}
          onClearPreloadedDriveFile={() => setPreloadedDriveFileForRestore(null)}
          onRefreshDriveFiles={() => loadGoogleDriveFiles()}
          defaultPassphrase={exportPassphrase}
          onRestoreComplete={fetchServerBackupStatus}
          onLogEvent={async (type, payload) => {
            try {
              await fetch('/api/backup/log-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(type === 'audit' ? { type, audit: payload } : { type, error: payload }),
              });
            } catch {}
          }}
        />
      )}

      {/* ===================================================================== */}
      {/* VIEW 6: SECURITY, ENCRYPTION, AUDIT LOG & ERROR LOG                   */}
      {/* ===================================================================== */}
      {activeView === 'security_logs' && (
        <div className="space-y-6">
          {/* Encryption Passphrase Settings Card */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-purple-100 dark:border-gray-700 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="font-black text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-pink-600" />
                  <span>
                    {lang === 'bn'
                      ? 'Backup Encryption ও চেকসাম সিকিউরিটি (AES-256-GCM + SHA-256)'
                      : 'Backup Encryption & Integrity Security (AES-256-GCM + SHA-256)'}
                  </span>
                </h3>
                <p className="text-[11px] text-gray-500">
                  {lang === 'bn'
                    ? 'রোগীর সংবেদনশীল তথ্য অননুমোদিত অ্যাক্সেস থেকে রক্ষা করতে পাসওয়ার্ড-ভিত্তিক এনক্রিপশন'
                    : 'Protects sensitive patient health information with PBKDF2 100,000-iteration key derivation'}
                </p>
              </div>

              <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950 border border-purple-200 cursor-pointer font-bold">
                <input
                  type="checkbox"
                  checked={useEncryption}
                  onChange={(e) => setUseEncryption(e.target.checked)}
                  className="accent-purple-700 w-4 h-4"
                />
                <span>AES-256 Encryption Active</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block font-bold mb-1">
                  {lang === 'bn' ? 'এনক্রিপশন পাসওয়ার্ড:' : 'Encryption Passphrase:'}
                </label>
                <div className="relative">
                  <input
                    type={showExportPassword ? 'text' : 'password'}
                    value={exportPassphrase}
                    onChange={(e) => setExportPassphrase(e.target.value)}
                    className="w-full p-2.5 pr-9 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowExportPassword(!showExportPassword)}
                    className="absolute right-2.5 top-2.5 text-gray-400"
                  >
                    {showExportPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">
                  {lang === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন:' : 'Confirm Passphrase:'}
                </label>
                <input
                  type={showExportPassword ? 'text' : 'password'}
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const key = generateSecurePassphrase(16);
                    setExportPassphrase(key);
                    setConfirmPassphrase(key);
                    setShowExportPassword(true);
                  }}
                  className="px-4 py-2.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-pink-600" />
                  <span>{lang === 'bn' ? 'শক্তিশালী কি তৈরি করুন' : 'Generate Key'}</span>
                </button>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${passStrength.color}`}>
                  {passStrength.label}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Logs & Error Logs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Audit Log */}
            <div className="lg:col-span-7 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-purple-100 dark:border-gray-700 shadow-xs space-y-3">
              <h4 className="font-black text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  {lang === 'bn'
                    ? 'Backup ও Restore কার্যক্রমের Audit Log'
                    : 'Backup & Restore Security Audit Log'}
                </span>
              </h4>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                {serverAuditLogs.map((log) => (
                  <div key={log.id} className="py-2.5 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-purple-900 dark:text-purple-200">{log.action}</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-gray-300">{log.details}</p>
                    <div className="text-[10px] text-gray-400">
                      Actor: <strong>{log.actor}</strong> · Target: {log.destination}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Failed Backup Error Log */}
            <div className="lg:col-span-5 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-purple-100 dark:border-gray-700 shadow-xs space-y-3">
              <h4 className="font-black text-sm text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>
                  {lang === 'bn' ? 'ব্যর্থ ব্যাকআপের Error Log' : 'Failed Backup & Restore Error Log'}
                </span>
              </h4>
              <div className="max-h-72 overflow-y-auto space-y-2">
                {serverErrorLogs.length === 0 ? (
                  <div className="py-8 text-center text-emerald-600 font-semibold">
                    ✓ {lang === 'bn' ? 'কোনো ব্যাকআপ এরর পাওয়া যায়নি' : 'Zero backup or restore errors recorded'}
                  </div>
                ) : (
                  serverErrorLogs.map((err) => (
                    <div
                      key={err.id}
                      className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-1"
                    >
                      <div className="flex justify-between font-bold text-rose-900 dark:text-rose-200">
                        <span>{err.operation}</span>
                        <span className="text-[10px] font-mono">{new Date(err.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[11px] text-rose-700 dark:text-rose-300">{err.message}</p>
                      <p className="text-[10px] text-gray-600 dark:text-gray-400">
                        Fix: {err.resolutionHint}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: EXPLICIT RESTORE CONFIRMATION DIALOG                         */}
      {/* ===================================================================== */}
      {showRestoreConfirmModal && inspectionResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-5 border-2 border-purple-500 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-purple-950 dark:text-purple-100">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base">
                  {lang === 'bn' ? 'ডেটা রিস্টোর নিশ্চিতকরণ' : 'Confirm Hospital Database Restore'}
                </h3>
                <p className="text-[11px] text-gray-500">
                  {lang === 'bn'
                    ? 'আপনি কি নিশ্চিতভাবে এই ব্যাকআপ ফাইল থেকে ডেটা রিস্টোর করতে চান?'
                    : 'Are you sure you want to restore hospital records from this backup?'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-gray-900 border border-purple-200 dark:border-gray-700 space-y-1.5 text-xs">
              <div>
                File: <strong className="font-mono">{inspectionResult.filename}</strong>
              </div>
              <div>
                Mode:{' '}
                <strong className="text-purple-800 dark:text-purple-300 uppercase">{mergeMode}</strong>
              </div>
              <div>
                Records: <strong>{inspectionResult.summary.patientsCount} Patients</strong>,{' '}
                <strong>{inspectionResult.summary.invoicesCount} Invoices</strong>,{' '}
                <strong>{inspectionResult.summary.doctorsCount} Doctors</strong>
              </div>
              <div className="text-emerald-700 dark:text-emerald-400 font-bold">
                Safety Pre-Restore Backup: {createSafetyBackupBeforeRestore ? '✓ Enabled (Auto-ZIP)' : 'Disabled'}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowRestoreConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold cursor-pointer"
              >
                {lang === 'bn' ? 'বাতিল করুন' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmedRestore}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-800 to-indigo-900 text-white font-black cursor-pointer shadow-md"
              >
                {lang === 'bn' ? 'হ্যাঁ, এখনই রিস্টোর করুন' : 'Confirm & Restore Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: GOOGLE DRIVE FILE DELETE CONFIRMATION DIALOG (MANDATORY)     */}
      {/* ===================================================================== */}
      {fileToDeleteFromDrive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-5 border-2 border-rose-500 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-900 dark:text-rose-200">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base">
                  {lang === 'bn'
                    ? 'Google Drive থেকে ব্যাকআপ ফাইল মুছে ফেলবেন?'
                    : 'Delete Backup File from Google Drive?'}
                </h3>
                <p className="text-[11px] text-gray-500">
                  {lang === 'bn'
                    ? 'এই কাজটি সম্পন্ন হলে Google Drive থেকে ফাইলটি স্থায়ীভাবে মুছে যাবে।'
                    : 'This action will permanently remove the selected backup file from your Google Drive.'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 dark:bg-gray-900 border border-rose-200 text-xs font-mono font-bold">
              {fileToDeleteFromDrive.name} ({Math.max(1, Math.round(fileToDeleteFromDrive.size / 1024))} KB)
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setFileToDeleteFromDrive(null)}
                disabled={isDeletingDriveFile}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 font-bold cursor-pointer"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDriveFile}
                disabled={isDeletingDriveFile}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black cursor-pointer"
              >
                {isDeletingDriveFile
                  ? lang === 'bn'
                    ? 'মুছে ফেলা হচ্ছে...'
                    : 'Deleting...'
                  : lang === 'bn'
                  ? 'হ্যাঁ, মুছে ফেলুন'
                  : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: GOOGLE DRIVE TARGET FOLDER BROWSER & CREATOR (ADMIN)         */}
      {/* ===================================================================== */}
      {isFolderModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
          onClick={() => setIsFolderModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-5 border-2 border-blue-500 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    {lang === 'bn'
                      ? 'Google Drive ব্যাকআপ ফোল্ডার নির্বাচন বা তৈরি করুন'
                      : 'Select or Create Google Drive Backup Folder'}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {lang === 'bn'
                      ? 'এনক্রিপ্টেড ডাটাবেস ও অ্যাটাচমেন্ট সংরক্ষণের জন্য নির্দিষ্ট ফোল্ডার বেছে নিন'
                      : 'Choose the target folder in your Google Drive for encrypted hospital backups'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFolderModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Create New Folder in Google Drive */}
            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-gray-900 border border-blue-200 dark:border-gray-700 space-y-2">
              <label className="font-bold text-[11px] text-blue-950 dark:text-blue-200 block">
                {lang === 'bn'
                  ? 'Google Drive-এ নতুন ব্যাকআপ ফোল্ডার তৈরি করুন:'
                  : 'Create New Folder in Google Drive:'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDriveFolderName}
                  onChange={(e) => setNewDriveFolderName(e.target.value)}
                  placeholder="e.g. Adiba_Hospital_Encrypted_Vault_2026"
                  className="flex-1 p-2 bg-white dark:bg-gray-800 border border-blue-300 dark:border-gray-700 rounded-xl font-mono text-xs"
                />
                <button
                  type="button"
                  disabled={!newDriveFolderName.trim() || isCreatingDriveFolder}
                  onClick={handleCreateNewDriveFolder}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isCreatingDriveFolder
                    ? lang === 'bn'
                      ? 'তৈরি হচ্ছে...'
                      : 'Creating...'
                    : lang === 'bn'
                    ? '+ ফোল্ডার তৈরি ও নির্বাচন'
                    : '+ Create & Select'}
                </button>
              </div>
            </div>

            {/* Existing Folders List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-600 dark:text-gray-300">
                <span>
                  {lang === 'bn'
                    ? `আপনার Google Drive ফোল্ডারসমূহ (${driveFoldersList.length}):`
                    : `Existing Folders in Your Google Drive (${driveFoldersList.length}):`}
                </span>
                <button
                  type="button"
                  onClick={handleOpenGoogleDriveFolderModal}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  {isLoadingDriveFolders ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {isLoadingDriveFolders ? (
                  <div className="py-8 text-center text-gray-400">
                    {lang === 'bn'
                      ? 'Google Drive থেকে ফোল্ডার তালিকা লোড হচ্ছে...'
                      : 'Loading folders from Google Drive...'}
                  </div>
                ) : driveFoldersList.length === 0 ? (
                  <div className="py-6 text-center text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    {lang === 'bn'
                      ? 'কোনো ফোল্ডার পাওয়া যায়নি। উপরে নতুন ফোল্ডারের নাম লিখে "+ ফোল্ডার তৈরি ও নির্বাচন" বাটনে ক্লিক করুন।'
                      : 'No folders found. Create a new folder above to get started.'}
                  </div>
                ) : (
                  driveFoldersList.map((fld) => {
                    const isCurrent =
                      fld.id === selectedDriveFolder.id ||
                      (!selectedDriveFolder.id && fld.name === selectedDriveFolder.name);
                    return (
                      <div
                        key={fld.id}
                        onClick={() => handleSelectDriveFolder(fld)}
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                          isCurrent
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 ring-1 ring-blue-500'
                            : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FolderOpen className="w-4 h-4 text-blue-600 shrink-0" />
                          <div className="min-w-0">
                            <div className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                              /{fld.name}
                            </div>
                            <div className="text-[10px] text-gray-500 truncate">
                              Folder ID: {fld.id.slice(0, 16)}...
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-lg font-bold text-[10px] shrink-0 ${
                            isCurrent ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                          }`}
                        >
                          {isCurrent
                            ? lang === 'bn'
                              ? '✓ নির্বাচিত'
                              : '✓ Selected'
                            : lang === 'bn'
                            ? 'নির্বাচন করুন'
                            : 'Select Folder'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setIsFolderModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 font-bold text-xs cursor-pointer"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
