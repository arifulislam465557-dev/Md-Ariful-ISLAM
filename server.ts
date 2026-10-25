import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import JSZip from 'jszip';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const STATE_FILE = path.join(BACKUP_DIR, 'server-backup-state.json');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

interface ServerScheduleConfig {
  enabled: boolean;
  frequency: 'hourly' | 'every_6h' | 'daily' | 'weekly' | 'custom';
  customDateTime?: string;
  retentionDays: number;
  maxRetainedBackups: number;
  autoDeleteOld: boolean;
  backupBeforeUpdate: boolean;
  backupBeforeMigration: boolean;
  encryptBackups: boolean;
  passphrase?: string;
  targetDrivePath: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

interface ServerBackupFileEntry {
  id: string;
  filename: string;
  filePath: string;
  VirtualWindowsPath: string;
  createdAt: string;
  sizeBytes: number;
  sizeKb: number;
  checksum: string;
  isEncrypted: boolean;
  triggerType: 'Manual' | 'Scheduled' | 'Pre-Restore Safety' | 'Pre-Update' | 'Pre-Migration';
  status: 'Success' | 'Failed';
  recordsCount: number;
  exportedBy: string;
  destination: string;
}

interface ServerAuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  destination: string;
  filename?: string;
  checksum?: string;
  status: 'Success' | 'Warning' | 'Error';
  details: string;
}

interface ServerErrorEntry {
  id: string;
  timestamp: string;
  operation: string;
  errorCode: string;
  message: string;
  resolutionHint: string;
}

interface ServerBackupState {
  scheduleConfig: ServerScheduleConfig;
  serverBackups: ServerBackupFileEntry[];
  auditLogs: ServerAuditEntry[];
  errorLogs: ServerErrorEntry[];
  latestHospitalData: any | null;
}

const getIntervalMs = (freq: ServerScheduleConfig['frequency']): number => {
  switch (freq) {
    case 'hourly':
      return 60 * 60 * 1000;
    case 'every_6h':
      return 6 * 60 * 60 * 1000;
    case 'weekly':
      return 7 * 24 * 60 * 60 * 1000;
    case 'daily':
    default:
      return 24 * 60 * 60 * 1000;
  }
};

const defaultState: ServerBackupState = {
  scheduleConfig: {
    enabled: true,
    frequency: 'daily',
    retentionDays: 30,
    maxRetainedBackups: 15,
    autoDeleteOld: true,
    backupBeforeUpdate: true,
    backupBeforeMigration: true,
    encryptBackups: true,
    passphrase: 'AdibaSecurePass#2026',
    targetDrivePath: 'D:\\HospitalBackup\\',
    lastRunAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    nextRunAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
  },
  serverBackups: [],
  auditLogs: [
    {
      id: `aud-init-1`,
      timestamp: new Date().toISOString(),
      action: 'BACKEND_SCHEDULER_STARTED',
      actor: 'System Daemon',
      destination: 'Local Server Vault (/backups)',
      status: 'Success',
      details: 'Node.js Backend Automatic Backup Scheduler & Integrity Verifier initialized on port 3000.',
    },
  ],
  errorLogs: [],
  latestHospitalData: null,
};

const loadState = (): ServerBackupState => {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        ...defaultState,
        ...parsed,
        scheduleConfig: { ...defaultState.scheduleConfig, ...(parsed.scheduleConfig || {}) },
      };
    }
  } catch (e) {
    console.error('Error loading server backup state:', e);
  }
  return defaultState;
};

let serverState: ServerBackupState = loadState();

const saveState = () => {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(serverState, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving server backup state:', e);
  }
};

const formatZipFilename = (prefix = 'Hospital_Backup', d = new Date()): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${prefix}_${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}.zip`;
};

const encryptPayloadNode = (payload: any, passphrase: string, clinicName: string, exportedBy: string) => {
  const jsonStr = JSON.stringify(payload);
  const checksum = crypto.createHash('sha256').update(jsonStr, 'utf8').digest('hex');
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(jsonStr, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const combinedCiphertext = Buffer.concat([encrypted, authTag]);

  const patients = Array.isArray(payload.patients) ? payload.patients : [];
  const invoices = Array.isArray(payload.invoices) ? payload.invoices : [];
  const prescriptions = Array.isArray(payload.prescriptions) ? payload.prescriptions : [];
  const ecgReports = Array.isArray(payload.ecgReports) ? payload.ecgReports : [];
  const xrayReports = Array.isArray(payload.xrayReports) ? payload.xrayReports : [];
  const usgReports = Array.isArray(payload.usgReports) ? payload.usgReports : [];
  const doctors = Array.isArray(payload.doctors) ? payload.doctors : [];
  const labTests = Array.isArray(payload.labTests) ? payload.labTests : [];

  const pathologyCount = patients.reduce(
    (acc: number, p: any) => acc + (Array.isArray(p.testResults) ? p.testResults.length : 0),
    0
  );

  return {
    pkg: {
      header: {
        format: 'ADIBA_SECURE_HOSPITAL_BACKUP',
        version: '3.0.0',
        cipher: 'AES-256-GCM',
        kdf: 'PBKDF2-SHA-256',
        iterations: 100000,
        clinicName: clinicName || 'Adiba Hospital',
        createdAt: new Date().toISOString(),
        exportedBy,
        summary: {
          patientCount: patients.length,
          invoiceCount: invoices.length,
          prescriptionCount: prescriptions.length,
          pathologyReportCount: pathologyCount,
          ecgReportCount: ecgReports.length,
          xrayReportCount: xrayReports.length,
          usgReportCount: usgReports.length,
          totalRecords:
            patients.length +
            invoices.length +
            prescriptions.length +
            ecgReports.length +
            xrayReports.length +
            usgReports.length +
            doctors.length +
            labTests.length,
        },
        includedScopes: Object.keys(payload),
        checksum,
      },
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      ciphertext: combinedCiphertext.toString('base64'),
    },
    checksum,
  };
};

const enforceRetentionPolicy = () => {
  if (!serverState.scheduleConfig.autoDeleteOld) return;

  const retentionMs = (serverState.scheduleConfig.retentionDays || 30) * 24 * 60 * 60 * 1000;
  const maxCount = serverState.scheduleConfig.maxRetainedBackups || 15;
  const now = Date.now();

  const kept: ServerBackupFileEntry[] = [];
  const removed: ServerBackupFileEntry[] = [];

  serverState.serverBackups.forEach((entry, index) => {
    const ageMs = now - new Date(entry.createdAt).getTime();
    if (ageMs > retentionMs || index >= maxCount) {
      removed.push(entry);
    } else {
      kept.push(entry);
    }
  });

  if (removed.length > 0) {
    removed.forEach((rm) => {
      try {
        if (fs.existsSync(rm.filePath)) {
          fs.unlinkSync(rm.filePath);
        }
      } catch {}
    });

    serverState.serverBackups = kept;
    serverState.auditLogs.unshift({
      id: `aud-ret-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'AUTO_RETENTION_CLEANUP',
      actor: 'Backend Retention Engine',
      destination: 'Local Server Vault',
      status: 'Success',
      details: `Automatically purged ${removed.length} expired backup file(s) older than ${serverState.scheduleConfig.retentionDays} days or exceeding ${maxCount} max snapshots.`,
    });
  }
};

const createServerBackupArchive = async (options: {
  payload: any;
  sqlDump?: string;
  encrypt: boolean;
  passphrase?: string;
  triggerType: ServerBackupFileEntry['triggerType'];
  exportedBy: string;
  destinationLabel: string;
  targetDrivePath?: string;
  customPrefix?: string;
}): Promise<ServerBackupFileEntry> => {
  const filename = formatZipFilename(options.customPrefix || 'Hospital_Backup', new Date());
  const filePath = path.join(BACKUP_DIR, filename);
  const zip = new JSZip();

  const rawJson = JSON.stringify(options.payload, null, 2);
  const sha256Checksum = crypto.createHash('sha256').update(rawJson, 'utf8').digest('hex');

  if (options.encrypt && options.passphrase) {
    const { pkg } = encryptPayloadNode(
      options.payload,
      options.passphrase,
      options.payload?.clinicConfig?.clinicName || 'Adiba Hospital',
      options.exportedBy
    );
    zip.file('database/hospital_database.enc.json', JSON.stringify(pkg, null, 2));
  } else {
    zip.file('database/hospital_database.json', rawJson);
  }

  if (options.sqlDump) {
    zip.file('database/hospital_database_dump.sql', options.sqlDump);
  }

  // Attachments
  const employees = Array.isArray(options.payload?.employees) ? options.payload.employees : [];
  let attachmentsCount = 0;
  employees.forEach((emp: any) => {
    if (emp.photoUrl || emp.voterCardFrontPhotoUrl || emp.voterCardBackPhotoUrl) {
      zip.file(
        `attachments/staff_documents/${emp.empId || emp.id}.json`,
        JSON.stringify(
          {
            empId: emp.empId,
            name: emp.name,
            voterId: emp.voterId,
            photoUrl: emp.photoUrl,
            voterCardFrontPhotoUrl: emp.voterCardFrontPhotoUrl,
            voterCardBackPhotoUrl: emp.voterCardBackPhotoUrl,
          },
          null,
          2
        )
      );
      attachmentsCount++;
    }
  });

  const totalRecords =
    (options.payload?.patients?.length || 0) +
    (options.payload?.doctors?.length || 0) +
    (options.payload?.invoices?.length || 0) +
    (options.payload?.prescriptions?.length || 0) +
    (options.payload?.employees?.length || 0) +
    (options.payload?.labTests?.length || 0);

  const manifest = {
    format: 'ADIBA_HOSPITAL_ZIP_ARCHIVE',
    version: '3.0.0',
    archiveFilename: filename,
    createdAt: new Date().toISOString(),
    exportedBy: options.exportedBy,
    clinicName: options.payload?.clinicConfig?.clinicName || 'Adiba Hospital',
    clinicRegNo: options.payload?.clinicConfig?.regNo || 'REG-2026',
    isEncrypted: !!(options.encrypt && options.passphrase),
    cipher: options.encrypt && options.passphrase ? 'AES-256-GCM' : undefined,
    sha256Checksum,
    summary: {
      patientsCount: options.payload?.patients?.length || 0,
      doctorsCount: options.payload?.doctors?.length || 0,
      appointmentsCount: (options.payload?.prescriptions?.length || 0) + (options.payload?.shiftHandovers?.length || 0),
      invoicesCount: options.payload?.invoices?.length || 0,
      pharmacyItemsCount: options.payload?.pharmacyInventory?.length || 5,
      labReportsCount: (options.payload?.patients || []).reduce(
        (acc: number, p: any) => acc + (p.testResults?.length || 0),
        0
      ),
      staffCount: employees.length,
      attachmentsCount,
      totalRecords,
    },
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  fs.writeFileSync(filePath, zipBuffer);

  const drivePrefix = options.targetDrivePath || serverState.scheduleConfig.targetDrivePath || 'D:\\HospitalBackup\\';
  const normalizedPrefix = drivePrefix.endsWith('\\') || drivePrefix.endsWith('/') ? drivePrefix : `${drivePrefix}\\`;

  const entry: ServerBackupFileEntry = {
    id: `srv-bk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    filename,
    filePath,
    VirtualWindowsPath: `${normalizedPrefix}${filename}`,
    createdAt: new Date().toISOString(),
    sizeBytes: zipBuffer.length,
    sizeKb: Math.max(1, Math.round(zipBuffer.length / 1024)),
    checksum: sha256Checksum,
    isEncrypted: !!(options.encrypt && options.passphrase),
    triggerType: options.triggerType,
    status: 'Success',
    recordsCount: totalRecords,
    exportedBy: options.exportedBy,
    destination: options.destinationLabel,
  };

  serverState.serverBackups.unshift(entry);
  serverState.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    timestamp: entry.createdAt,
    action: `BACKUP_CREATED (${options.triggerType.toUpperCase()})`,
    actor: options.exportedBy,
    destination: options.destinationLabel,
    filename: entry.filename,
    checksum: entry.checksum,
    status: 'Success',
    details: `Created verified ZIP archive ${entry.filename} (${entry.sizeKb} KB, ${entry.recordsCount} records, SHA-256: ${entry.checksum.slice(0, 12)}...).`,
  });

  enforceRetentionPolicy();
  saveState();

  return entry;
};

// Backend Automatic Scheduler Daemon (runs even when browser is closed)
setInterval(async () => {
  try {
    const cfg = serverState.scheduleConfig;
    if (!cfg.enabled || !serverState.latestHospitalData) return;

    const now = Date.now();
    let shouldRun = false;

    if (cfg.frequency === 'custom' && cfg.customDateTime) {
      const targetTime = new Date(cfg.customDateTime).getTime();
      const lastRun = cfg.lastRunAt ? new Date(cfg.lastRunAt).getTime() : 0;
      if (now >= targetTime && lastRun < targetTime) {
        shouldRun = true;
      }
    } else {
      const intervalMs = getIntervalMs(cfg.frequency);
      const lastRun = cfg.lastRunAt ? new Date(cfg.lastRunAt).getTime() : 0;
      if (now - lastRun >= intervalMs) {
        shouldRun = true;
      }
    }

    if (shouldRun) {
      await createServerBackupArchive({
        payload: serverState.latestHospitalData,
        encrypt: cfg.encryptBackups,
        passphrase: cfg.passphrase || 'AdibaSecurePass#2026',
        triggerType: 'Scheduled',
        exportedBy: 'Backend Cron Scheduler',
        destinationLabel: `Server Vault & ${cfg.targetDrivePath}`,
        targetDrivePath: cfg.targetDrivePath,
      });

      const nextInterval = getIntervalMs(cfg.frequency);
      serverState.scheduleConfig.lastRunAt = new Date(now).toISOString();
      serverState.scheduleConfig.nextRunAt = new Date(now + nextInterval).toISOString();
      saveState();
    }
  } catch (err: any) {
    serverState.errorLogs.unshift({
      id: `err-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operation: 'Scheduled Backend Backup',
      errorCode: 'SCHEDULER_WRITE_ERR',
      message: err?.message || 'Background scheduled backup failed',
      resolutionHint: 'Verify server disk space and encryption passphrase configuration.',
    });
    saveState();
  }
}, 30000);

// API Routes
app.get('/api/backup/status', (_req, res) => {
  const existingFiles = serverState.serverBackups.filter((b) => fs.existsSync(b.filePath));
  if (existingFiles.length !== serverState.serverBackups.length) {
    serverState.serverBackups = existingFiles;
    saveState();
  }

  const totalBytes = existingFiles.reduce((acc, b) => acc + (b.sizeBytes || 0), 0);

  res.json({
    scheduler: serverState.scheduleConfig,
    storageStats: {
      totalFiles: existingFiles.length,
      totalBytes,
      totalKb: Math.round(totalBytes / 1024),
      quotaBytes: 500 * 1024 * 1024, // 500 MB dedicated backup vault quota
      backupDir: BACKUP_DIR,
    },
    serverBackups: existingFiles,
    auditLogs: serverState.auditLogs.slice(0, 100),
    errorLogs: serverState.errorLogs.slice(0, 50),
  });
});

app.post('/api/backup/sync-state', (req, res) => {
  const { hospitalData, scheduleConfig } = req.body || {};
  if (hospitalData) {
    serverState.latestHospitalData = hospitalData;
  }
  if (scheduleConfig) {
    const prevFreq = serverState.scheduleConfig.frequency;
    serverState.scheduleConfig = {
      ...serverState.scheduleConfig,
      ...scheduleConfig,
    };
    if (scheduleConfig.frequency && scheduleConfig.frequency !== prevFreq) {
      const nextMs = getIntervalMs(serverState.scheduleConfig.frequency);
      serverState.scheduleConfig.nextRunAt = new Date(Date.now() + nextMs).toISOString();
    }
  }
  saveState();
  res.json({ success: true, scheduler: serverState.scheduleConfig });
});

app.post('/api/backup/create', async (req, res) => {
  try {
    const {
      payload,
      sqlDump,
      encrypt = true,
      passphrase = 'AdibaSecurePass#2026',
      triggerType = 'Manual',
      exportedBy = 'Administrator',
      destinationLabel = 'Local Server & Disk',
      targetDrivePath = 'D:\\HospitalBackup\\',
      customPrefix = 'Hospital_Backup',
    } = req.body || {};

    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid or empty hospital database payload.');
    }

    serverState.latestHospitalData = payload;

    const entry = await createServerBackupArchive({
      payload,
      sqlDump,
      encrypt,
      passphrase,
      triggerType,
      exportedBy,
      destinationLabel,
      targetDrivePath,
      customPrefix,
    });

    const now = new Date();
    serverState.scheduleConfig.lastRunAt = now.toISOString();
    serverState.scheduleConfig.nextRunAt = new Date(
      now.getTime() + getIntervalMs(serverState.scheduleConfig.frequency)
    ).toISOString();
    saveState();

    res.json({
      success: true,
      backup: entry,
      downloadUrl: `/api/backup/download/${encodeURIComponent(entry.filename)}`,
    });
  } catch (err: any) {
    const errEntry: ServerErrorEntry = {
      id: `err-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operation: 'Create Backup Archive',
      errorCode: 'BACKUP_CREATE_FAILED',
      message: err?.message || 'Failed to generate backup archive on server.',
      resolutionHint: 'Ensure database records are valid and sufficient disk storage is available.',
    };
    serverState.errorLogs.unshift(errEntry);
    saveState();
    res.status(500).json({ success: false, error: errEntry.message, errorEntry: errEntry });
  }
});

app.get('/api/backup/download/:filename', (req, res) => {
  const safeName = path.basename(req.params.filename);
  const targetPath = path.join(BACKUP_DIR, safeName);
  if (!fs.existsSync(targetPath)) {
    res.status(404).json({ error: 'Backup file not found on server.' });
    return;
  }
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
  fs.createReadStream(targetPath).pipe(res);
});

app.delete('/api/backup/files/:filename', (req, res) => {
  const adminCheck = verifyAdminActor(req, `Backup File Delete (${req.params.filename})`);
  if (!adminCheck.authorized) {
    res.status(403).json({
      success: false,
      code: 'FORBIDDEN_ADMIN_ONLY',
      error: adminCheck.reason,
    });
    return;
  }

  const deletionReason = String(
    req.body?.deletionReason || req.query?.reason || 'Admin deleted backup archive from server vault'
  ).trim();

  const safeName = path.basename(req.params.filename);
  const targetPath = path.join(BACKUP_DIR, safeName);
  try {
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
    serverState.serverBackups = serverState.serverBackups.filter((b) => b.filename !== safeName);
    const nowIso = new Date().toISOString();
    serverState.auditLogs.unshift({
      id: `aud-del-${Date.now()}`,
      timestamp: nowIso,
      action: 'BACKUP_FILE_DELETED',
      actor: adminCheck.actor.fullName || (req.query.actor as string) || 'Administrator',
      destination: 'Server Vault',
      filename: safeName,
      status: 'Warning',
      details: `Backup archive ${safeName} deleted from server storage by Admin (${adminCheck.actor.username}). Reason: "${deletionReason}"`,
    });
    hospitalDb.collections.auditLogs.unshift({
      id: `AUD-BKDEL-${Date.now()}`,
      timestamp: nowIso.replace('T', ' ').slice(0, 19),
      ipAddress: adminCheck.actor.ipAddress,
      workstationCode: adminCheck.actor.workstationCode,
      username: adminCheck.actor.username,
      userFullName: adminCheck.actor.fullName,
      role: adminCheck.actor.role,
      department: 'Administration',
      actionType: 'SOFT_DELETE',
      entityType: 'backupHistory',
      recordId: safeName,
      targetTitle: safeName,
      deletionReason,
      details: `[BACKUP ARCHIVE DELETE] "${safeName}" deleted by Admin ${adminCheck.actor.fullName}. Reason: "${deletionReason}"`,
    });
    savePermanentDb();
    saveState();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to delete backup file.' });
  }
});

app.post('/api/backup/log-event', (req, res) => {
  const { type, audit, error } = req.body || {};
  if (type === 'audit' && audit) {
    serverState.auditLogs.unshift({
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...audit,
    });
  } else if (type === 'error' && error) {
    serverState.errorLogs.unshift({
      id: `err-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...error,
    });
  }
  saveState();
  res.json({ success: true });
});

// ============================================================================
// PERMANENT HOSPITAL DATABASE, AUTO-SAVE ENGINE & ADMIN-ONLY DELETE RBAC
// ============================================================================

const PERMANENT_DB_FILE = path.join(BACKUP_DIR, 'hospital-permanent-db.json');

interface PermanentHospitalDatabase {
  dbVersion: number;
  isInitialized: boolean;
  lastSavedAt: string;
  lastSavedBy: string;
  processedMutationIds: string[];
  collections: {
    patients: any[];
    invoices: any[];
    departmentOrders: any[];
    pathologyOrders: any[];
    paymentTransactions: any[];
    doctors: any[];
    labTests: any[];
    medicines: any[];
    employees: any[];
    expenses: any[];
    users: any[];
    shiftHandovers: any[];
    opdAppointments: any[];
    workstations: any[];
    institutions: any[];
    invoicePrintLogs: any[];
    printRecords: any[];
    trashRecords: any[];
    auditLogs: any[];
    backupHistory: any[];
    clinicSettings: any;
    activeDrafts: Record<string, any>;
  };
}

function createDefaultPermanentDb(): PermanentHospitalDatabase {
  const seed = serverState.latestHospitalData || {};
  const hasSeedPatients = Array.isArray(seed.patients) && seed.patients.length > 0;
  return {
    dbVersion: 1,
    isInitialized: hasSeedPatients,
    lastSavedAt: new Date().toISOString(),
    lastSavedBy: 'System Init',
    processedMutationIds: [],
    collections: {
      patients: Array.isArray(seed.patients) ? seed.patients : [],
      invoices: Array.isArray(seed.invoices) ? seed.invoices : [],
      departmentOrders: Array.isArray(seed.departmentOrders) ? seed.departmentOrders : [],
      pathologyOrders: Array.isArray(seed.pathologyOrders) ? seed.pathologyOrders : [],
      paymentTransactions: Array.isArray(seed.paymentTransactions) ? seed.paymentTransactions : [],
      doctors: Array.isArray(seed.doctors) ? seed.doctors : [],
      labTests: Array.isArray(seed.labTests) ? seed.labTests : [],
      medicines: Array.isArray(seed.medicines) ? seed.medicines : [],
      employees: Array.isArray(seed.employees) ? seed.employees : [],
      expenses: Array.isArray(seed.expenses) ? seed.expenses : [],
      users: Array.isArray(seed.users) ? seed.users : [],
      shiftHandovers: Array.isArray(seed.shiftHandovers) ? seed.shiftHandovers : [],
      opdAppointments: Array.isArray(seed.opdAppointments) ? seed.opdAppointments : [],
      workstations: Array.isArray(seed.workstations) ? seed.workstations : [],
      institutions: Array.isArray(seed.institutions) ? seed.institutions : [],
      invoicePrintLogs: Array.isArray(seed.invoicePrintLogs) ? seed.invoicePrintLogs : [],
      printRecords: Array.isArray(seed.printRecords) ? seed.printRecords : [],
      trashRecords: Array.isArray(seed.trashRecords) ? seed.trashRecords : [],
      auditLogs: Array.isArray(seed.auditLogs) ? seed.auditLogs : [],
      backupHistory: Array.isArray(seed.backupHistory) ? seed.backupHistory : [],
      clinicSettings: seed.clinicSettings || null,
      activeDrafts: seed.activeDrafts || {},
    },
  };
}

function loadPermanentDb(): PermanentHospitalDatabase {
  try {
    if (fs.existsSync(PERMANENT_DB_FILE)) {
      const raw = fs.readFileSync(PERMANENT_DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      const defaults = createDefaultPermanentDb();
      return {
        ...defaults,
        ...parsed,
        collections: {
          ...defaults.collections,
          ...(parsed.collections || {}),
          pathologyOrders: Array.isArray(parsed.collections?.pathologyOrders)
            ? parsed.collections.pathologyOrders
            : [],
        },
      };
    }
  } catch (err) {
    console.error('Failed to load hospital-permanent-db.json, initializing safely:', err);
  }
  return createDefaultPermanentDb();
}

let hospitalDb: PermanentHospitalDatabase = loadPermanentDb();

function savePermanentDb() {
  try {
    hospitalDb.processedMutationIds = (hospitalDb.processedMutationIds || []).slice(0, 400);
    hospitalDb.collections.auditLogs = (hospitalDb.collections.auditLogs || []).slice(0, 1500);
    hospitalDb.collections.printRecords = (hospitalDb.collections.printRecords || []).slice(0, 1500);
    const tmpFile = `${PERMANENT_DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(hospitalDb, null, 2), 'utf-8');
    fs.renameSync(tmpFile, PERMANENT_DB_FILE);

    // Keep serverState.latestHospitalData synchronized for Automated & Cloud Backups
    serverState.latestHospitalData = {
      ...hospitalDb.collections,
      dbVersion: hospitalDb.dbVersion,
      lastSavedAt: hospitalDb.lastSavedAt,
    };
  } catch (err) {
    console.error('Failed to persist hospital-permanent-db.json:', err);
  }
}

function classifyDepartment(item: any): string {
  if (item?.departmentId) {
    const d = String(item.departmentId).trim().toLowerCase();
    if (['pathology', 'xray', 'ultrasound', 'ecg', 'doctorvisit', 'pharmacy', 'other'].includes(d)) {
      return d === 'doctorvisit' ? 'doctorVisit' : d;
    }
  }

  const cat = String(item?.category || '').toLowerCase();
  const sub = String(item?.subcategory || '').toLowerCase();
  const code = String(item?.code || item?.testId || '').toLowerCase();
  const name = String(item?.name || item?.testName || '').toLowerCase();

  // 1. Digital X-Ray & Radiology
  if (
    cat.includes('x-ray') ||
    cat.includes('xray') ||
    cat === 'radiology' ||
    sub.includes('x-ray') ||
    sub.includes('radiology') ||
    code.startsWith('xr-') ||
    code.startsWith('xr_') ||
    name.includes('x-ray') ||
    name.includes('xray')
  ) {
    return 'xray';
  }

  // 2. Ultrasound & Doppler
  if (
    cat.includes('ultrasound') ||
    cat.includes('usg') ||
    cat.includes('doppler') ||
    sub.includes('usg') ||
    sub.includes('doppler') ||
    code.startsWith('usg-') ||
    code.startsWith('usg_') ||
    code.startsWith('dop-') ||
    name.includes('ultrasound') ||
    name.includes('usg') ||
    name.includes('doppler')
  ) {
    return 'ultrasound';
  }

  // 3. ECG & Cardiology Diagnostics
  if (
    cat.includes('ecg') ||
    cat.includes('cardiology') ||
    cat === 'cardiology diagnostics' ||
    cat === 'cardiac' ||
    sub.includes('ecg') ||
    code.startsWith('ecg-') ||
    code.startsWith('ecg_') ||
    name.includes('electrocardiogram') ||
    name.includes('ecg') ||
    name.includes('echocardiogram') ||
    name.includes('echo')
  ) {
    return 'ecg';
  }

  // 4. Doctor Visit / OPD Consultation
  if (
    cat.includes('doctor visit') ||
    cat.includes('consultation') ||
    cat.includes('opd consultation') ||
    cat.includes('doctor fee') ||
    cat.includes('opd') ||
    sub.includes('consultation') ||
    code.startsWith('doc-') ||
    code.startsWith('drv-') ||
    code.startsWith('opd-') ||
    name.includes('doctor visit') ||
    name.includes('consultation') ||
    name.includes('opd ticket')
  ) {
    return 'doctorVisit';
  }

  // 5. Pharmacy & Medicine
  if (
    cat.includes('pharmacy') ||
    cat.includes('medicine') ||
    cat.includes('drug') ||
    cat.includes('injection') ||
    sub.includes('tablet') ||
    sub.includes('syrup') ||
    code.startsWith('med-') ||
    code.startsWith('phr-')
  ) {
    return 'pharmacy';
  }

  // 6. Pathology Laboratory Investigations
  const pathologyKeywords = [
    'hematology',
    'haematology',
    'biochemistry',
    'clinical pathology',
    'microbiology',
    'serology',
    'immunology',
    'hormone',
    'endocrinology',
    'histopathology',
    'cytopathology',
    'stool',
    'urine',
    'blood',
    'pathology',
    'lipid',
    'electrolyte',
    'coagulation',
    'culture',
  ];

  if (
    pathologyKeywords.some(
      (kw) => cat.includes(kw) || sub.includes(kw) || name.includes(kw)
    )
  ) {
    return 'pathology';
  }

  const commonPathologyCodes = [
    'cbc', 'creatinine', 'fbs', 'rbs', 'hba1c', 'wbc', 'esr', 'urea', 'sgpt', 'sgot',
    'alt', 'ast', 'bilirubin', 'crp', 'tsh', 'ft4', 'ft3', 'lipid', 'urine', 'stool',
    'pt', 'inr', 'aptt', 'vdrl', 'hbsag', 'widal', 'dengue', 'troponin', 'calcium',
    'sodium', 'potassium', 'cholesterol', 'triglyceride', 'hdl', 'ldl', 'uric', 'afb', 'gram',
  ];

  if (commonPathologyCodes.some((codeKw) => code.includes(codeKw) || name.includes(codeKw))) {
    return 'pathology';
  }

  return 'pathology';
}

function reconcileMissingPathologyOrders(): {
  recoveredCount: number;
  invoicesProcessed: number;
  totalPathologyOrders: number;
} {
  if (!Array.isArray(hospitalDb.collections.pathologyOrders)) {
    hospitalDb.collections.pathologyOrders = [];
  }
  if (!Array.isArray(hospitalDb.collections.departmentOrders)) {
    hospitalDb.collections.departmentOrders = [];
  }
  if (!Array.isArray(hospitalDb.collections.patients)) {
    hospitalDb.collections.patients = [];
  }

  const existingOrders = hospitalDb.collections.pathologyOrders;
  const existingOrderMap = new Map<string, any>();
  for (const o of existingOrders) {
    if (o && o.id) existingOrderMap.set(String(o.id), o);
  }

  const existingPatients = hospitalDb.collections.patients;
  const patientByInvoiceNo = new Map<string, any>();
  const patientByPid = new Map<string, any>();
  for (const p of existingPatients) {
    if (p.invoiceNo) patientByInvoiceNo.set(String(p.invoiceNo).toLowerCase(), p);
    if (p.pId) patientByPid.set(String(p.pId), p);
  }

  const existingDeptOrders = hospitalDb.collections.departmentOrders;
  const deptOrderByInvAndDept = new Set<string>();
  for (const d of existingDeptOrders) {
    if (d && d.invoiceNo && d.departmentId) {
      deptOrderByInvAndDept.add(`${String(d.invoiceNo).toLowerCase()}:${d.departmentId}`);
    }
  }

  const invoices = hospitalDb.collections.invoices || [];
  let recoveredCount = 0;
  let changed = false;

  for (const inv of invoices) {
    if (!inv || !inv.invoiceNo) continue;
    const invNo = String(inv.invoiceNo);
    const suffix = invNo.replace(/^INV-/i, '');
    const cashMemoNo = inv.cashMemoNo || `CM-${suffix}`;
    const receiptNo = inv.receiptNo || `RCP-${suffix}`;
    const pId = inv.pId || `P-${suffix}`;
    const patientName = inv.patientName || 'Unknown Patient';
    const items = Array.isArray(inv.items) ? inv.items : [];
    const date = inv.date || new Date().toISOString().slice(0, 10);
    const timestamp = inv.createdAt || `${date}T09:00:00.000Z`;
    const paymentStatus = inv.status || 'Paid';

    const itemsByDept: Record<string, any[]> = {};
    const pathologyItems: Array<{ item: any; idx: number }> = [];

    items.forEach((item: any, idx: number) => {
      const dept = classifyDepartment(item);
      if (!itemsByDept[dept]) itemsByDept[dept] = [];
      itemsByDept[dept].push(item);

      if (dept === 'pathology') {
        pathologyItems.push({ item, idx });
      }
    });

    // 1. Process individual pathology test orders
    for (const { item, idx } of pathologyItems) {
      const rawCode = item.code || item.testId || item.testName || `t-${idx}`;
      const safeCode = String(rawCode).replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      const orderId = `ord-path-${invNo.toLowerCase()}-${safeCode}-${idx}`;

      if (!existingOrderMap.has(orderId)) {
        const newOrder = {
          id: orderId,
          orderNo: `ORD-PATH-${suffix}-${idx + 1}`,
          invoiceId: inv.id || `inv-${invNo}`,
          invoiceNo: invNo,
          cashMemoNo,
          receiptNo,
          pId,
          patientId: pId,
          patientName,
          age: inv.age || 'N/A',
          sex: inv.sex || 'Other',
          phone: inv.phone || '',
          address: inv.address || '',
          drCode: inv.drCode || 'DR01',
          drName: inv.drName || 'Self / Hospital',
          testId: item.testId || item.code || `t-${idx}`,
          testCode: item.code || item.testId || `TC-${idx + 1}`,
          testName: item.testName || item.name || 'Pathology Test',
          nameBn: item.nameBn || '',
          category: item.category || 'Pathology',
          price: Number(item.price) || 0,
          orderDate: date,
          orderTimestamp: timestamp,
          paymentStatus,
          sampleType: item.sampleType || 'Blood',
          sampleStatus: 'Pending',
          reportStatus: 'Pending',
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        existingOrders.unshift(newOrder);
        existingOrderMap.set(orderId, newOrder);
        recoveredCount++;
        changed = true;
      }
    }

    // 2. Ensure consolidated Patient record exists for Pathology Worklist
    if (pathologyItems.length > 0) {
      let patient = patientByInvoiceNo.get(invNo.toLowerCase()) || patientByPid.get(String(pId));
      if (!patient) {
        patient = {
          id: `pat-${invNo.toLowerCase()}`,
          pId,
          accessionNo: `ACC-${suffix}`,
          invoiceNo: invNo,
          cashMemoNo,
          invDate: date,
          billDate: date,
          patientName,
          age: inv.age || 'N/A',
          sex: inv.sex || 'Other',
          phone: inv.phone || '',
          address: inv.address || '',
          drCode: inv.drCode || 'DR01',
          drName: inv.drName || 'Self / Hospital',
          status: 'Pending',
          workflowStatus: 'Pending',
          paymentStatus,
          department: 'Pathology',
          testResults: pathologyItems.map(({ item }) => ({
            testName: item.testName || item.name,
            result: '',
            unit: item.unit || '',
            normalRange: item.normalRange || '',
            status: 'Normal',
            category: item.category || 'Pathology',
          })),
          createdAt: timestamp,
        };
        existingPatients.unshift(patient);
        patientByInvoiceNo.set(invNo.toLowerCase(), patient);
        patientByPid.set(String(pId), patient);
        changed = true;
      } else {
        const existingResults = Array.isArray(patient.testResults) ? patient.testResults : [];
        const existingNames = new Set(existingResults.map((r: any) => String(r.testName || '').trim().toLowerCase()));
        let resultsAppended = false;

        for (const { item } of pathologyItems) {
          const tName = String(item.testName || item.name || '').trim();
          if (tName && !existingNames.has(tName.toLowerCase())) {
            existingResults.push({
              testName: tName,
              result: '',
              unit: item.unit || '',
              normalRange: item.normalRange || '',
              status: 'Normal',
              category: item.category || 'Pathology',
            });
            existingNames.add(tName.toLowerCase());
            resultsAppended = true;
          }
        }

        if (resultsAppended) {
          patient.testResults = existingResults;
          if (!patient.invoiceNo) patient.invoiceNo = invNo;
          if (!patient.cashMemoNo) patient.cashMemoNo = cashMemoNo;
          changed = true;
        }
      }
    }

    // 3. Ensure departmentOrders entry for each department on the invoice
    for (const [deptId, deptItems] of Object.entries(itemsByDept)) {
      const key = `${invNo.toLowerCase()}:${deptId}`;
      if (!deptOrderByInvAndDept.has(key)) {
        const deptNames: Record<string, string> = {
          pathology: 'Pathology Laboratory',
          xray: 'Digital X-Ray & Radiology',
          ultrasound: 'Ultrasound (USG) & Doppler',
          ecg: 'ECG & Cardiology Diagnostics',
          doctorVisit: 'Doctor Visit / OPD Consultation',
          pharmacy: 'Pharmacy & Medicine',
          other: 'Other Hospital Services',
        };
        const newDeptOrder = {
          id: `ord-dept-${invNo.toLowerCase()}-${deptId}`,
          orderNo: `ORD-${deptId.toUpperCase().slice(0, 4)}-${suffix}`,
          invoiceId: inv.id || `inv-${invNo}`,
          invoiceNo: invNo,
          cashMemoNo,
          pId,
          patientName,
          age: inv.age || 'N/A',
          sex: inv.sex || 'Other',
          phone: inv.phone || '',
          address: inv.address || '',
          drCode: inv.drCode || 'DR01',
          drName: inv.drName || 'Self / Hospital',
          departmentId: deptId,
          departmentName: deptNames[deptId] || deptId,
          items: deptItems,
          orderDate: date,
          paymentStatus,
          orderStatus: 'Ordered',
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        existingDeptOrders.unshift(newDeptOrder);
        deptOrderByInvAndDept.add(key);
        changed = true;
      }
    }
  }

  if (changed) {
    hospitalDb.dbVersion += 1;
    hospitalDb.lastSavedAt = new Date().toISOString();
    hospitalDb.lastSavedBy = 'Pathology Reconciliation Engine';
    savePermanentDb();
  }

  return {
    recoveredCount,
    invoicesProcessed: invoices.length,
    totalPathologyOrders: existingOrders.length,
  };
}

// Initial automatic reconciliation on server boot
try {
  const initSync = reconcileMissingPathologyOrders();
  console.log(`[Pathology Engine] Boot reconciliation complete: ${initSync.recoveredCount} missing orders recovered, total orders: ${initSync.totalPathologyOrders}`);
} catch (err) {
  console.error('[Pathology Engine] Boot reconciliation error:', err);
}

interface ActorIdentity {
  id: string;
  username: string;
  fullName: string;
  role: string;
  workstationCode: string;
  ipAddress: string;
}

function safeDecodeHeader(val: string | string[] | undefined): string | undefined {
  if (!val) return undefined;
  const str = Array.isArray(val) ? val[0] : val;
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

function extractActorFromRequest(req: express.Request): ActorIdentity {
  const bodyActor = req.body?.actor || {};
  const id = String(req.headers['x-actor-id'] || bodyActor.id || 'unknown');
  const decodedUser = safeDecodeHeader(req.headers['x-actor-username']);
  const username = String(bodyActor.username || decodedUser || 'unknown');
  const decodedFull = safeDecodeHeader(req.headers['x-actor-fullname']);
  const fullName = String(bodyActor.fullName || decodedFull || username || 'Unknown User');
  const role = String(req.headers['x-actor-role'] || bodyActor.role || 'Staff');
  const workstationCode = String(req.headers['x-workstation-code'] || bodyActor.workstationCode || 'PC-01');
  const ipAddress = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '192.168.1.101');
  return { id, username, fullName, role, workstationCode, ipAddress };
}

function verifyAdminActor(
  req: express.Request,
  attemptedActionLabel: string
): { authorized: boolean; actor: ActorIdentity; reason?: string } {
  const actor = extractActorFromRequest(req);

  // Check against known users in permanent DB if populated
  const dbUsers = hospitalDb.collections.users || [];
  const matchedUser = dbUsers.find(
    (u: any) =>
      (actor.id && u.id === actor.id) ||
      (actor.username && String(u.username).toLowerCase() === actor.username.toLowerCase())
  );

  const effectiveRole = matchedUser ? matchedUser.role : actor.role;
  const isUserActive = matchedUser ? matchedUser.isActive !== false : true;
  const isEffectiveAdmin = String(effectiveRole || '').trim().toLowerCase() === 'admin';
  const isHeaderAdmin = String(actor.role || '').trim().toLowerCase() === 'admin';

  if (!isEffectiveAdmin || !isUserActive || !isHeaderAdmin) {
    const unauthorizedAudit = {
      id: `AUD-UNAUTH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      ipAddress: actor.ipAddress,
      workstationCode: actor.workstationCode,
      username: actor.username,
      userFullName: actor.fullName,
      role: effectiveRole || actor.role,
      department: effectiveRole || 'Staff',
      actionType: 'UNAUTHORIZED_DELETE_ATTEMPT',
      details: `[SECURITY BLOCK 403] Non-Admin user "${actor.fullName}" (@${actor.username}, Role: ${effectiveRole}) attempted restricted action: ${attemptedActionLabel}`,
    };

    hospitalDb.collections.auditLogs.unshift(unauthorizedAudit);
    serverState.auditLogs.unshift({
      id: unauthorizedAudit.id,
      timestamp: new Date().toISOString(),
      action: 'UNAUTHORIZED_DELETE_ATTEMPT',
      actor: `${actor.fullName} (${effectiveRole})`,
      destination: 'Hospital Permanent DB',
      status: 'Warning',
      details: unauthorizedAudit.details,
    });
    savePermanentDb();
    saveState();

    return {
      authorized: false,
      actor: { ...actor, role: effectiveRole },
      reason: `Access Denied (403 Forbidden): শুধুমাত্র Admin কোনো তথ্য Delete বা Restore করার অনুমতিপ্রাপ্ত। আপনার বর্তমান রোল (${effectiveRole}) দিয়ে এই কাজটি করা সম্ভব নয়।`,
    };
  }

  return {
    authorized: true,
    actor: {
      ...actor,
      role: 'Admin',
      fullName: matchedUser?.fullName || actor.fullName,
    },
  };
}

function getCollectionKeyForEntity(entityType: string): keyof PermanentHospitalDatabase['collections'] | null {
  switch (entityType) {
    case 'patient':
      return 'patients';
    case 'invoice':
      return 'invoices';
    case 'receipt':
    case 'paymentTransaction':
      return 'paymentTransactions';
    case 'pathologyOrder':
    case 'pathologyOrders':
      return 'pathologyOrders';
    case 'doctor':
      return 'doctors';
    case 'labTest':
      return 'labTests';
    case 'medicine':
      return 'medicines';
    case 'employee':
      return 'employees';
    case 'expense':
      return 'expenses';
    case 'shiftHandover':
      return 'shiftHandovers';
    case 'opdAppointment':
      return 'opdAppointments';
    case 'userAccount':
      return 'users';
    case 'backupHistory':
      return 'backupHistory';
    default:
      return null;
  }
}

function getRecordUniqueKey(item: any, collectionKey: string): string {
  if (!item || typeof item !== 'object') return String(item);
  if (collectionKey === 'invoices') {
    return String(item.invoiceNo || item.id || '');
  }
  if (collectionKey === 'paymentTransactions') {
    return String(item.receiptNo || item.id || '');
  }
  if (collectionKey === 'patients') {
    return String(item.pId || item.id || '');
  }
  if (collectionKey === 'departmentOrders') {
    return String(item.orderNo || item.id || '');
  }
  if (collectionKey === 'pathologyOrders') {
    return String(item.id || item.orderNo || '');
  }
  if (collectionKey === 'users') {
    return String(item.username || item.id || '');
  }
  if (collectionKey === 'workstations') {
    return String(item.terminalCode || item.id || '');
  }
  return String(item.id ?? item.code ?? item.filename ?? JSON.stringify(item));
}

function computeRecordDependencies(entityType: string, recordId: string): string[] {
  const deps: string[] = [];
  const cols = hospitalDb.collections;

  if (entityType === 'patient') {
    const patient = (cols.patients || []).find((p: any) => p.id === recordId || p.pId === recordId);
    const pId = patient?.pId || recordId;
    const linkedInvoices = (cols.invoices || []).filter((inv: any) => inv.pId === pId || inv.patientId === recordId);
    if (linkedInvoices.length > 0) {
      deps.push(`${linkedInvoices.length}টি Billing Invoice / Cash Memo (${linkedInvoices.map((i: any) => i.invoiceNo).slice(0, 3).join(', ')})`);
    }
    if (patient?.results && Object.keys(patient.results).length > 0) {
      deps.push(`Pathology Test Results (${Object.keys(patient.results).length}টি প্যারামিটার)`);
    }
    if (patient?.rx) {
      deps.push('Doctor Prescription (Rx Record)');
    }
    if (patient?.ecgReport || patient?.xrayReport || patient?.usgReport) {
      deps.push('Imaging Reports (ECG / X-Ray / USG)');
    }
  } else if (entityType === 'doctor') {
    const doc = (cols.doctors || []).find((d: any) => d.id === recordId);
    if (doc) {
      const refPatients = (cols.patients || []).filter((p: any) => p.refDoctor === doc.name || p.refDoctor === doc.code);
      if (refPatients.length > 0) {
        deps.push(`${refPatients.length} জন রোগীর রেফারেন্স ডাক্তার হিসেবে যুক্ত`);
      }
      const appointments = (cols.opdAppointments || []).filter((a: any) => a.doctorId === recordId || a.doctorName === doc.name);
      if (appointments.length > 0) {
        deps.push(`${appointments.length}টি OPD Appointment-এ যুক্ত`);
      }
    }
  } else if (entityType === 'invoice') {
    const inv = (cols.invoices || []).find((i: any) => i.id === recordId || i.invoiceNo === recordId);
    if (inv) {
      if (Number(inv.paidAmount) > 0) {
        deps.push(`আদায়কৃত পেমেন্ট ৳${inv.paidAmount} (মোট বিল ৳${inv.netTotal || inv.totalAmount || 0})`);
      }
      if (Number(inv.dueAmount) > 0) {
        deps.push(`বকেয়া (Due) ৳${inv.dueAmount}`);
      }
      const linkedPays = (cols.paymentTransactions || []).filter((p: any) => p.invoiceId === inv.id || p.invoiceNo === inv.invoiceNo);
      if (linkedPays.length > 0) {
        deps.push(`${linkedPays.length}টি Payment Receipt Voucher (${linkedPays.map((p: any) => p.receiptNo).slice(0, 3).join(', ')})`);
      }
    }
  } else if (entityType === 'receipt') {
    const pay = (cols.paymentTransactions || []).find((p: any) => p.id === recordId || p.receiptNo === recordId);
    if (pay) {
      deps.push(`Receipt #${pay.receiptNo} — Amount: ৳${pay.amount} (${pay.paymentMethod})`);
      deps.push(`সংশ্লিষ্ট বিল #${pay.invoiceNo || 'N/A'} (PID: ${pay.pId || 'N/A'})`);
    }
  }

  return deps;
}

// 1. GET Permanent Database State
app.get('/api/db/state', (_req, res) => {
  res.json({
    success: true,
    isInitialized: hospitalDb.isInitialized,
    dbVersion: hospitalDb.dbVersion,
    lastSavedAt: hospitalDb.lastSavedAt,
    lastSavedBy: hospitalDb.lastSavedBy,
    collections: hospitalDb.collections,
  });
});

// 2. POST Auto-Save (Debounced Input Save, Field Blur, Form Submit & Draft Sync)
app.post('/api/db/auto-save', (req, res) => {
  try {
    const {
      mutationId,
      clientVersion,
      collections,
      activeDrafts,
      auditEntry,
    } = req.body || {};
    const actor = extractActorFromRequest(req);

    // Idempotency protection: avoid duplicate mutations on network retry or double-click
    if (mutationId && hospitalDb.processedMutationIds.includes(mutationId)) {
      res.json({
        success: true,
        deduplicated: true,
        status: 'saved',
        dbVersion: hospitalDb.dbVersion,
        lastSavedAt: hospitalDb.lastSavedAt,
        lastSavedBy: hospitalDb.lastSavedBy,
      });
      return;
    }

    let conflictMerged = false;
    if (
      hospitalDb.isInitialized &&
      typeof clientVersion === 'number' &&
      clientVersion > 0 &&
      clientVersion < hospitalDb.dbVersion
    ) {
      conflictMerged = true;
    }

    // Build set of soft-deleted record IDs per entityType so stale client auto-save never resurrects deleted items
    const deletedIdsByCollection = new Map<string, Set<string>>();
    for (const trash of hospitalDb.collections.trashRecords || []) {
      const colKey = getCollectionKeyForEntity(trash.entityType);
      if (colKey) {
        if (!deletedIdsByCollection.has(colKey)) {
          deletedIdsByCollection.set(colKey, new Set());
        }
        deletedIdsByCollection.get(colKey)!.add(String(trash.recordId));
      }
    }

    if (collections && typeof collections === 'object') {
      const arrayKeys: Array<keyof PermanentHospitalDatabase['collections']> = [
        'patients',
        'invoices',
        'departmentOrders',
        'pathologyOrders',
        'paymentTransactions',
        'doctors',
        'labTests',
        'medicines',
        'employees',
        'expenses',
        'users',
        'shiftHandovers',
        'opdAppointments',
        'workstations',
        'institutions',
        'invoicePrintLogs',
        'backupHistory',
      ];

      for (const key of arrayKeys) {
        if (Array.isArray(collections[key])) {
          const incomingArr = collections[key];
          const deletedSet = deletedIdsByCollection.get(key);

          // Filter out any record that is currently in the Recycle Bin / Trash
          const filteredIncoming = deletedSet
            ? incomingArr.filter((item: any) => {
                const itemId = String(item?.id ?? item?.pId ?? item?.invoiceNo ?? '');
                return !deletedSet.has(itemId);
              })
            : incomingArr;

          const isProtectedFinancialCollection = [
            'invoices',
            'paymentTransactions',
            'patients',
            'departmentOrders',
            'pathologyOrders',
            'auditLogs',
            'users',
          ].includes(key);

          if ((conflictMerged || isProtectedFinancialCollection) && Array.isArray(hospitalDb.collections[key])) {
            // Safe conflict merge: merge by record ID, preferring newer updatedAt/createdAt or incoming edits while keeping server-only records
            const existingArr = hospitalDb.collections[key] as any[];
            const mergedMap = new Map<string, any>();
            for (const existingItem of existingArr) {
              const idKey = getRecordUniqueKey(existingItem, key);
              if (!deletedSet || !deletedSet.has(idKey)) {
                mergedMap.set(idKey, existingItem);
              }
            }
            for (const incItem of filteredIncoming) {
              const idKey = getRecordUniqueKey(incItem, key);
              const prevItem = mergedMap.get(idKey);
              if (!prevItem) {
                mergedMap.set(idKey, incItem);
              } else {
                if (key === 'invoices') {
                  const mergedPayments = Array.isArray(incItem.payments) && incItem.payments.length > 0
                    ? incItem.payments
                    : Array.isArray(prevItem.payments) ? prevItem.payments : [];
                  const prevTime = prevItem.updatedAt ? new Date(prevItem.updatedAt).getTime() : 0;
                  const incTime = incItem.updatedAt ? new Date(incItem.updatedAt).getTime() : Date.now();
                  const newerObj = incTime >= prevTime ? { ...prevItem, ...incItem } : { ...incItem, ...prevItem };
                  mergedMap.set(idKey, { ...newerObj, payments: mergedPayments });
                } else {
                  const prevTime = prevItem.updatedAt ? new Date(prevItem.updatedAt).getTime() : 0;
                  const incTime = incItem.updatedAt ? new Date(incItem.updatedAt).getTime() : Date.now();
                  mergedMap.set(idKey, incTime >= prevTime ? { ...prevItem, ...incItem } : { ...incItem, ...prevItem });
                }
              }
            }
            (hospitalDb.collections as any)[key] = Array.from(mergedMap.values());
          } else {
            (hospitalDb.collections as any)[key] = filteredIncoming;
          }
        }
      }

      if (collections.clinicSettings && typeof collections.clinicSettings === 'object') {
        hospitalDb.collections.clinicSettings = {
          ...(hospitalDb.collections.clinicSettings || {}),
          ...collections.clinicSettings,
        };
      }

      // Merge immutable auditLogs without ever allowing client to shrink or clear existing server auditLogs
      if (Array.isArray(collections.auditLogs)) {
        const existingIds = new Set((hospitalDb.collections.auditLogs || []).map((a: any) => a.id));
        const newLogs = collections.auditLogs.filter((a: any) => a && a.id && !existingIds.has(a.id));
        if (newLogs.length > 0) {
          hospitalDb.collections.auditLogs = [...newLogs, ...(hospitalDb.collections.auditLogs || [])].slice(0, 1500);
        }
      }
    }

    if (activeDrafts && typeof activeDrafts === 'object') {
      hospitalDb.collections.activeDrafts = {
        ...(hospitalDb.collections.activeDrafts || {}),
        ...activeDrafts,
        updatedAt: new Date().toISOString(),
        updatedBy: actor.fullName || actor.username,
      };
    }

    if (auditEntry && typeof auditEntry === 'object') {
      hospitalDb.collections.auditLogs.unshift({
        id: auditEntry.id || `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        ipAddress: actor.ipAddress,
        workstationCode: actor.workstationCode,
        username: actor.username,
        userFullName: actor.fullName,
        role: actor.role,
        department: actor.role,
        ...auditEntry,
      });
    }

    if (mutationId) {
      hospitalDb.processedMutationIds.unshift(mutationId);
    }

    hospitalDb.isInitialized = true;
    hospitalDb.dbVersion += 1;
    hospitalDb.lastSavedAt = new Date().toISOString();
    hospitalDb.lastSavedBy = `${actor.fullName} (${actor.role})`;

    savePermanentDb();

    res.json({
      success: true,
      status: conflictMerged ? 'conflict_merged' : 'saved',
      conflictMerged,
      dbVersion: hospitalDb.dbVersion,
      lastSavedAt: hospitalDb.lastSavedAt,
      lastSavedBy: hospitalDb.lastSavedBy,
      trashCount: (hospitalDb.collections.trashRecords || []).length,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      status: 'error',
      error: err?.message || 'Auto-save to permanent database failed.',
    });
  }
});

// 3. POST Soft Delete Record (Strictly Admin-Only on Backend)
app.post('/api/db/delete', (req, res) => {
  const {
    entityType,
    entityLabel,
    recordId,
    recordTitle,
    recordSubtitle,
    deletionReason,
    originalData,
  } = req.body || {};

  const actionLabel = `Delete ${entityLabel || entityType || 'Record'} (${recordTitle || recordId || ''})`;
  const adminCheck = verifyAdminActor(req, actionLabel);
  if (!adminCheck.authorized) {
    res.status(403).json({
      success: false,
      code: 'FORBIDDEN_ADMIN_ONLY',
      error: adminCheck.reason,
    });
    return;
  }

  const trimmedReason = String(deletionReason || '').trim();
  if (!trimmedReason) {
    res.status(400).json({
      success: false,
      code: 'REASON_REQUIRED',
      error: 'তথ্য মুছে ফেলার কারণ (Deletion Reason) উল্লেখ করা বাধ্যতামূলক।',
    });
    return;
  }

  if (!entityType || !recordId) {
    res.status(400).json({
      success: false,
      error: 'Missing entityType or recordId for deletion.',
    });
    return;
  }

  // Prevent deleting the primary Admin account
  if (entityType === 'userAccount') {
    const targetUser = (hospitalDb.collections.users || []).find((u: any) => u.id === recordId);
    if (targetUser && (targetUser.username === 'adiba' || targetUser.id === 'usr-admin-1')) {
      res.status(400).json({
        success: false,
        error: 'প্রধান সিস্টেম অ্যাডমিন (Super Admin) অ্যাকাউন্ট মুছে ফেলা যাবে না।',
      });
      return;
    }
  }

  const dependencies = computeRecordDependencies(entityType, String(recordId));
  let capturedOriginal = originalData || null;

  const colKey = getCollectionKeyForEntity(entityType);
  if (colKey) {
    const list = (hospitalDb.collections[colKey] as any[]) || [];
    const found = list.find(
      (item: any) =>
        String(item?.id) === String(recordId) ||
        String(item?.pId) === String(recordId) ||
        String(item?.invoiceNo) === String(recordId)
    );
    if (found && !capturedOriginal) {
      capturedOriginal = found;
    }
    if (entityType === 'backupHistory' && recordId === 'ALL_VAULT_BACKUPS') {
      (hospitalDb.collections as any)[colKey] = [];
    } else {
      (hospitalDb.collections as any)[colKey] = list.filter(
        (item: any) =>
          String(item?.id) !== String(recordId) &&
          String(item?.pId) !== String(recordId) &&
          String(item?.invoiceNo) !== String(recordId) &&
          String(item?.filename) !== String(recordId)
      );
    }
    if (entityType === 'invoice') {
      const invId = String(recordId);
      // Clean linked paymentTransactions from active list
      const linkedPayments = (hospitalDb.collections.paymentTransactions || []).filter(
        (p: any) => p.invoiceId === invId || p.invoiceNo === invId
      );
      if (linkedPayments.length > 0) {
        hospitalDb.collections.paymentTransactions = (hospitalDb.collections.paymentTransactions || []).filter(
          (p: any) => p.invoiceId !== invId && p.invoiceNo !== invId
        );
      }
      // Cancel linked department orders
      hospitalDb.collections.departmentOrders = (hospitalDb.collections.departmentOrders || []).map((ord: any) => {
        if (ord.invoiceId === invId || ord.invoiceNo === invId) {
          return { ...ord, orderStatus: 'Cancelled', cancelReason: `Invoice deleted: ${trimmedReason}` };
        }
        return ord;
      });
    } else if (entityType === 'receipt') {
      const payId = String(recordId);
      const targetPay = (hospitalDb.collections.paymentTransactions || []).find(
        (p: any) => p.id === payId || p.receiptNo === payId
      );
      if (targetPay) {
        capturedOriginal = targetPay;
        hospitalDb.collections.paymentTransactions = (hospitalDb.collections.paymentTransactions || []).filter(
          (p: any) => p.id !== payId && p.receiptNo !== payId
        );
        // Adjust corresponding invoice paidAmount and dueAmount
        if (targetPay.invoiceNo || targetPay.invoiceId) {
          hospitalDb.collections.invoices = (hospitalDb.collections.invoices || []).map((inv: any) => {
            if (inv.id === targetPay.invoiceId || inv.invoiceNo === targetPay.invoiceNo) {
              const currentPaid = Math.max(0, Number(inv.paidAmount) || 0);
              const deduct = Math.max(0, Number(targetPay.amount) || 0);
              const newPaid = Math.max(0, currentPaid - deduct);
              const newDue = Math.max(0, (Number(inv.netTotal) || 0) - newPaid);
              const newStatus = newDue <= 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Due';
              const updatedPayments = (inv.payments || []).filter(
                (p: any) => p.id !== payId && p.receiptNo !== payId
              );
              return {
                ...inv,
                paidAmount: newPaid,
                dueAmount: newDue,
                status: newStatus,
                payments: updatedPayments,
              };
            }
            return inv;
          });
        }
      }
    }
    if (entityType === 'backupHistory') {
      const candidateFilename = path.basename(String(originalData?.filename || recordId || ''));
      if (candidateFilename && candidateFilename.endsWith('.zip')) {
        const targetZipPath = path.join(BACKUP_DIR, candidateFilename);
        if (fs.existsSync(targetZipPath)) {
          try {
            fs.unlinkSync(targetZipPath);
          } catch {}
        }
        serverState.serverBackups = serverState.serverBackups.filter(
          (b) => b.filename !== candidateFilename && b.id !== String(recordId)
        );
        saveState();
      }
    }
  } else if (
    entityType === 'pathologyReport' ||
    entityType === 'ecgReport' ||
    entityType === 'xrayReport' ||
    entityType === 'usgReport' ||
    entityType === 'prescription'
  ) {
    // Nested clinical report inside a patient record
    const patients = hospitalDb.collections.patients || [];
    hospitalDb.collections.patients = patients.map((p: any) => {
      if (String(p.id) !== String(recordId) && String(p.pId) !== String(recordId)) {
        return p;
      }
      if (!capturedOriginal) {
        capturedOriginal = {
          patientId: p.id,
          pId: p.pId,
          patientName: p.name,
          results: p.results,
          remarks: p.remarks,
          verifiedInfo: p.verifiedInfo,
          ecgReport: p.ecgReport,
          xrayReport: p.xrayReport,
          usgReport: p.usgReport,
          rx: p.rx,
        };
      }
      const updated = { ...p, updatedAt: new Date().toISOString() };
      if (entityType === 'pathologyReport') {
        updated.results = {};
        updated.remarks = {};
        updated.verifiedInfo = {};
        updated.status = 'Pending';
      } else if (entityType === 'ecgReport') {
        delete updated.ecgReport;
      } else if (entityType === 'xrayReport') {
        delete updated.xrayReport;
      } else if (entityType === 'usgReport') {
        delete updated.usgReport;
      } else if (entityType === 'prescription') {
        delete updated.rx;
      }
      return updated;
    });
  }

  const nowIso = new Date().toISOString();
  const softDeletedRecord = {
    id: `TRASH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    recordId: String(recordId),
    entityType,
    entityLabel: entityLabel || entityType,
    recordTitle: recordTitle || String(recordId),
    recordSubtitle: recordSubtitle || '',
    deletedAt: nowIso,
    deletedByUserId: adminCheck.actor.id,
    deletedByUsername: adminCheck.actor.username,
    deletedByFullName: adminCheck.actor.fullName,
    deletedByRole: adminCheck.actor.role,
    deletionReason: trimmedReason,
    dependenciesSummary: dependencies,
    originalData: capturedOriginal,
  };

  hospitalDb.collections.trashRecords.unshift(softDeletedRecord);

  const auditEntry = {
    id: `AUD-DEL-${Date.now()}`,
    timestamp: nowIso.replace('T', ' ').slice(0, 19),
    ipAddress: adminCheck.actor.ipAddress,
    workstationCode: adminCheck.actor.workstationCode,
    username: adminCheck.actor.username,
    userFullName: adminCheck.actor.fullName,
    role: adminCheck.actor.role,
    department: 'Administration',
    actionType: 'SOFT_DELETE',
    entityType,
    recordId: String(recordId),
    targetTitle: recordTitle || String(recordId),
    deletionReason: trimmedReason,
    details: `[SOFT DELETE -> RECYCLE BIN] ${entityLabel || entityType}: "${recordTitle || recordId}" deleted by Admin ${adminCheck.actor.fullName}. Reason: "${trimmedReason}"`,
  };

  hospitalDb.collections.auditLogs.unshift(auditEntry);
  hospitalDb.dbVersion += 1;
  hospitalDb.lastSavedAt = nowIso;
  hospitalDb.lastSavedBy = `${adminCheck.actor.fullName} (Admin)`;
  savePermanentDb();

  res.json({
    success: true,
    dbVersion: hospitalDb.dbVersion,
    trashRecord: softDeletedRecord,
    trashRecords: hospitalDb.collections.trashRecords,
    auditLog: auditEntry,
  });
});

// 4. POST Restore Soft-Deleted Record from Recycle Bin (Strictly Admin-Only)
app.post('/api/db/restore', (req, res) => {
  const { trashId } = req.body || {};
  const adminCheck = verifyAdminActor(req, `Restore Record from Trash (${trashId})`);
  if (!adminCheck.authorized) {
    res.status(403).json({
      success: false,
      code: 'FORBIDDEN_ADMIN_ONLY',
      error: adminCheck.reason,
    });
    return;
  }

  const trashList = hospitalDb.collections.trashRecords || [];
  const targetTrash = trashList.find((t: any) => t.id === trashId || t.recordId === trashId);
  if (!targetTrash) {
    res.status(404).json({
      success: false,
      error: 'রিসাইকেল বিনে এই রেকর্ডটি পাওয়া যায়নি।',
    });
    return;
  }

  const { entityType, recordId, originalData } = targetTrash;
  const colKey = getCollectionKeyForEntity(entityType);

  if (colKey && originalData) {
    const list = (hospitalDb.collections[colKey] as any[]) || [];
    const exists = list.some(
      (item: any) =>
        String(item?.id) === String(recordId) ||
        String(item?.pId) === String(recordId) ||
        String(item?.invoiceNo) === String(recordId) ||
        String(item?.receiptNo) === String(recordId)
    );
    if (!exists) {
      (hospitalDb.collections as any)[colKey] = [originalData, ...list];
    }
    if (entityType === 'invoice' && Array.isArray(originalData.payments)) {
      const existingPayIds = new Set((hospitalDb.collections.paymentTransactions || []).map((p: any) => p.id));
      const toRestore = originalData.payments.filter((p: any) => !existingPayIds.has(p.id));
      if (toRestore.length > 0) {
        hospitalDb.collections.paymentTransactions = [
          ...toRestore,
          ...(hospitalDb.collections.paymentTransactions || []),
        ];
      }
    } else if (entityType === 'receipt') {
      if (originalData.invoiceNo || originalData.invoiceId) {
        hospitalDb.collections.invoices = (hospitalDb.collections.invoices || []).map((inv: any) => {
          if (inv.id === originalData.invoiceId || inv.invoiceNo === originalData.invoiceNo) {
            const currentPaid = Math.max(0, Number(inv.paidAmount) || 0);
            const addBack = Math.max(0, Number(originalData.amount) || 0);
            const newPaid = currentPaid + addBack;
            const newDue = Math.max(0, (Number(inv.netTotal) || 0) - newPaid);
            const newStatus = newDue <= 0 ? 'Paid' : 'Partial';
            const existingPayments = Array.isArray(inv.payments) ? inv.payments : [];
            const hasP = existingPayments.some((p: any) => p.id === originalData.id);
            return {
              ...inv,
              paidAmount: newPaid,
              dueAmount: newDue,
              status: newStatus,
              payments: hasP ? existingPayments : [...existingPayments, originalData],
            };
          }
          return inv;
        });
      }
    }
  } else if (
    originalData &&
    (entityType === 'pathologyReport' ||
      entityType === 'ecgReport' ||
      entityType === 'xrayReport' ||
      entityType === 'usgReport' ||
      entityType === 'prescription')
  ) {
    hospitalDb.collections.patients = (hospitalDb.collections.patients || []).map((p: any) => {
      if (String(p.id) !== String(recordId) && String(p.pId) !== String(recordId)) {
        return p;
      }
      const restored = { ...p, updatedAt: new Date().toISOString() };
      if (entityType === 'pathologyReport') {
        restored.results = originalData.results || {};
        restored.remarks = originalData.remarks || {};
        restored.verifiedInfo = originalData.verifiedInfo || {};
      } else if (entityType === 'ecgReport' && originalData.ecgReport) {
        restored.ecgReport = originalData.ecgReport;
      } else if (entityType === 'xrayReport' && originalData.xrayReport) {
        restored.xrayReport = originalData.xrayReport;
      } else if (entityType === 'usgReport' && originalData.usgReport) {
        restored.usgReport = originalData.usgReport;
      } else if (entityType === 'prescription' && originalData.rx) {
        restored.rx = originalData.rx;
      }
      return restored;
    });
  }

  hospitalDb.collections.trashRecords = trashList.filter((t: any) => t.id !== targetTrash.id);

  const nowIso = new Date().toISOString();
  const auditEntry = {
    id: `AUD-RES-${Date.now()}`,
    timestamp: nowIso.replace('T', ' ').slice(0, 19),
    ipAddress: adminCheck.actor.ipAddress,
    workstationCode: adminCheck.actor.workstationCode,
    username: adminCheck.actor.username,
    userFullName: adminCheck.actor.fullName,
    role: adminCheck.actor.role,
    department: 'Administration',
    actionType: 'RESTORE_RECORD',
    entityType,
    recordId: String(recordId),
    details: `[RESTORED FROM RECYCLE BIN] ${targetTrash.entityLabel}: "${targetTrash.recordTitle}" restored by Admin ${adminCheck.actor.fullName}.`,
  };

  hospitalDb.collections.auditLogs.unshift(auditEntry);
  hospitalDb.dbVersion += 1;
  hospitalDb.lastSavedAt = nowIso;
  hospitalDb.lastSavedBy = `${adminCheck.actor.fullName} (Admin)`;
  savePermanentDb();

  res.json({
    success: true,
    dbVersion: hospitalDb.dbVersion,
    restoredTrash: targetTrash,
    trashRecords: hospitalDb.collections.trashRecords,
    collections: hospitalDb.collections,
    auditLog: auditEntry,
  });
});

// 5. POST Permanent Delete from Recycle Bin (Strictly Admin-Only)
app.post('/api/db/permanent-delete', (req, res) => {
  const { trashId, confirmPermanent, reason } = req.body || {};
  const adminCheck = verifyAdminActor(req, `Permanent Delete from Trash (${trashId})`);
  if (!adminCheck.authorized) {
    res.status(403).json({
      success: false,
      code: 'FORBIDDEN_ADMIN_ONLY',
      error: adminCheck.reason,
    });
    return;
  }

  if (!confirmPermanent) {
    res.status(400).json({
      success: false,
      error: 'Permanent Delete নিশ্চিত করা হয়নি।',
    });
    return;
  }

  const trashList = hospitalDb.collections.trashRecords || [];
  const targetTrash = trashList.find((t: any) => t.id === trashId);
  if (!targetTrash) {
    res.status(404).json({
      success: false,
      error: 'রিসাইকেল বিনে এই রেকর্ডটি পাওয়া যায়নি।',
    });
    return;
  }

  hospitalDb.collections.trashRecords = trashList.filter((t: any) => t.id !== trashId);

  const nowIso = new Date().toISOString();
  const finalPermReason = String(reason || targetTrash.deletionReason || 'Permanent deletion confirmed by Admin').trim();
  const auditEntry = {
    id: `AUD-PERM-${Date.now()}`,
    timestamp: nowIso.replace('T', ' ').slice(0, 19),
    ipAddress: adminCheck.actor.ipAddress,
    workstationCode: adminCheck.actor.workstationCode,
    username: adminCheck.actor.username,
    userFullName: adminCheck.actor.fullName,
    role: adminCheck.actor.role,
    department: 'Administration',
    actionType: 'PERMANENT_DELETE',
    entityType: targetTrash.entityType,
    recordId: String(targetTrash.recordId),
    targetTitle: targetTrash.recordTitle,
    deletionReason: finalPermReason,
    details: `[PERMANENT DELETE] ${targetTrash.entityLabel}: "${targetTrash.recordTitle}" permanently purged from Recycle Bin by Admin ${adminCheck.actor.fullName}. Reason: "${finalPermReason}"`,
  };

  hospitalDb.collections.auditLogs.unshift(auditEntry);
  hospitalDb.dbVersion += 1;
  hospitalDb.lastSavedAt = nowIso;
  hospitalDb.lastSavedBy = `${adminCheck.actor.fullName} (Admin)`;
  savePermanentDb();

  res.json({
    success: true,
    dbVersion: hospitalDb.dbVersion,
    trashRecords: hospitalDb.collections.trashRecords,
    auditLog: auditEntry,
  });
});

// 6. POST Print / PDF Export Record Management (Tracks Original Print vs Reprint & Version History)
app.post('/api/db/print-records', (req, res) => {
  try {
    const {
      documentType = 'OTHER_DOCUMENT',
      documentTitle = 'Clinical Document',
      documentId = 'DOC-001',
      pId = 'N/A',
      patientName = 'Hospital Patient',
      actionType = 'PRINT',
      snapshotSummary = '',
    } = req.body || {};

    const actor = extractActorFromRequest(req);
    const existingForDoc = (hospitalDb.collections.printRecords || []).filter(
      (r: any) => r.documentType === documentType && String(r.documentId) === String(documentId)
    );
    const version = existingForDoc.length + 1;
    const isReprint = version > 1;
    const nowIso = new Date().toISOString();

    const printEntry = {
      id: `PRN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      documentType,
      documentTitle,
      documentId: String(documentId),
      pId: String(pId),
      patientName: String(patientName),
      printedByUserId: actor.id,
      printedByUsername: actor.username,
      printedByFullName: actor.fullName,
      printedByRole: actor.role,
      workstationCode: actor.workstationCode,
      printedAt: nowIso.replace('T', ' ').slice(0, 19),
      actionType,
      version,
      isReprint,
      snapshotSummary: snapshotSummary || `${documentTitle} (${isReprint ? `Reprint v${version}` : 'Original Print v1'})`,
    };

    hospitalDb.collections.printRecords.unshift(printEntry);

    const auditEntry = {
      id: `AUD-PRN-${Date.now()}`,
      timestamp: printEntry.printedAt,
      ipAddress: actor.ipAddress,
      workstationCode: actor.workstationCode,
      username: actor.username,
      userFullName: actor.fullName,
      role: actor.role,
      department: actor.role,
      actionType: 'PDF_EXPORT',
      patientId: String(pId),
      patientName: String(patientName),
      details: `[${actionType} v${version}${isReprint ? ' REPRINT' : ''}] ${documentTitle} (#${documentId}) for ${patientName} (${pId}) by ${actor.fullName}`,
    };

    hospitalDb.collections.auditLogs.unshift(auditEntry);
    hospitalDb.dbVersion += 1;
    hospitalDb.lastSavedAt = nowIso;
    savePermanentDb();

    res.json({
      success: true,
      printRecord: printEntry,
      printRecords: hospitalDb.collections.printRecords,
      dbVersion: hospitalDb.dbVersion,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to record print/PDF history.',
    });
  }
});

// ============================================================================
// 7. ATOMIC BILLING, PAYMENT PROCESSING & AUTOMATIC DEPARTMENT ROUTING API
// ============================================================================

app.post('/api/billing/finalize', (req, res) => {
  try {
    const {
      idempotencyKey,
      invoice,
      initialPayment,
      departmentOrders = [],
      pathologyPatient,
      opdAppointment,
    } = req.body || {};

    if (!invoice || !invoice.invoiceNo || !invoice.pId) {
      res.status(400).json({
        success: false,
        error: 'Invalid invoice payload: invoiceNo and pId are required.',
      });
      return;
    }

    const actor = extractActorFromRequest(req);
    const dedupKey = idempotencyKey || `BILL-FIN-${invoice.invoiceNo}`;

    // Idempotency protection: prevent duplicate bills/orders on network retry or double-click
    if (
      hospitalDb.processedMutationIds.includes(dedupKey) ||
      (hospitalDb.collections.invoices || []).some((inv: any) => inv.invoiceNo === invoice.invoiceNo)
    ) {
      const existingInv = (hospitalDb.collections.invoices || []).find(
        (inv: any) => inv.invoiceNo === invoice.invoiceNo
      );
      res.json({
        success: true,
        deduplicated: true,
        invoice: existingInv || invoice,
        dbVersion: hospitalDb.dbVersion,
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const suffix = invoice.invoiceNo
      ? String(invoice.invoiceNo).replace(/^INV-/i, '')
      : `${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const cashMemoNo = invoice.cashMemoNo || `CM-${suffix}`;
    const receiptNo = invoice.receiptNo || (initialPayment?.receiptNo) || `RCP-${suffix}`;
    invoice.cashMemoNo = cashMemoNo;
    invoice.receiptNo = receiptNo;

    let savedPaymentTx = initialPayment;
    if (initialPayment && Number(initialPayment.amount) > 0) {
      savedPaymentTx = {
        ...initialPayment,
        receiptNo: initialPayment.receiptNo || receiptNo,
        cashMemoNo: initialPayment.cashMemoNo || cashMemoNo,
        phone: initialPayment.phone || invoice.phone,
        pId: initialPayment.pId || invoice.pId,
        patientName: initialPayment.patientName || invoice.patientName,
        date: initialPayment.date || invoice.date,
        invoiceNo: invoice.invoiceNo,
        invoiceId: invoice.id,
      };
      invoice.payments = [savedPaymentTx];
    } else {
      invoice.payments = Array.isArray(invoice.payments) ? invoice.payments : [];
    }

    // 1. Save Invoice (prepend or update)
    hospitalDb.collections.invoices = [
      invoice,
      ...(hospitalDb.collections.invoices || []).filter(
        (i: any) => i.id !== invoice.id && i.invoiceNo !== invoice.invoiceNo
      ),
    ];

    // 2. Save Initial Payment Transaction
    if (savedPaymentTx && Number(savedPaymentTx.amount) > 0) {
      hospitalDb.collections.paymentTransactions = [
        savedPaymentTx,
        ...(hospitalDb.collections.paymentTransactions || []).filter(
          (p: any) => p.id !== savedPaymentTx.id && p.receiptNo !== savedPaymentTx.receiptNo
        ),
      ];
    }

    // 3. Save Routed Department Orders (Pathology, X-Ray, USG, ECG, OPD, Pharmacy, Other)
    if (Array.isArray(departmentOrders) && departmentOrders.length > 0) {
      hospitalDb.collections.departmentOrders = [
        ...departmentOrders,
        ...(hospitalDb.collections.departmentOrders || []).filter(
          (o: any) => !departmentOrders.some((no: any) => no.id === o.id || no.orderNo === o.orderNo)
        ),
      ];
    }

    // 4. Save Pathology Worklist Record if routed to Pathology
    if (pathologyPatient && pathologyPatient.id) {
      hospitalDb.collections.patients = [
        pathologyPatient,
        ...(hospitalDb.collections.patients || []).filter(
          (p: any) => p.id !== pathologyPatient.id && p.invoiceNo !== invoice.invoiceNo
        ),
      ];
    }

    // 5. Save OPD Appointment Record if routed to Doctor Visit
    if (opdAppointment && opdAppointment.id) {
      hospitalDb.collections.opdAppointments = [
        opdAppointment,
        ...(hospitalDb.collections.opdAppointments || []).filter(
          (a: any) => a.id !== opdAppointment.id && a.invoiceNo !== invoice.invoiceNo
        ),
      ];
    }

    // 6. Immutable Audit Log
    const routedDeptsSummary = (departmentOrders || [])
      .map((o: any) => `${o.departmentName} (${(o.items || []).length})`)
      .join(', ');

    const auditEntry = {
      id: `AUD-BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: nowIso.replace('T', ' ').slice(0, 19),
      ipAddress: actor.ipAddress,
      workstationCode: actor.workstationCode,
      username: actor.username,
      userFullName: actor.fullName,
      role: actor.role,
      department: 'Billing',
      actionType: 'INVOICE_CREATE',
      patientId: invoice.pId,
      patientName: invoice.patientName,
      entityType: 'invoice',
      recordId: invoice.id,
      details: `[BILL FINALIZED & ROUTED] Bill #${invoice.invoiceNo} (Receipt #${receiptNo}, Memo #${cashMemoNo}) for ${invoice.patientName} (${invoice.pId}) — Net: ৳${invoice.netTotal}, Paid: ৳${invoice.paidAmount}, Due: ৳${invoice.dueAmount} (${invoice.paymentMethod}). Auto-routed to: ${routedDeptsSummary || 'General Billing'}.`,
    };

    hospitalDb.collections.auditLogs.unshift(auditEntry);
    hospitalDb.processedMutationIds.unshift(dedupKey);
    hospitalDb.isInitialized = true;
    hospitalDb.dbVersion += 1;
    hospitalDb.lastSavedAt = nowIso;
    hospitalDb.lastSavedBy = `${actor.fullName} (${actor.role})`;

    savePermanentDb();

    res.json({
      success: true,
      dbVersion: hospitalDb.dbVersion,
      invoice,
      paymentTransaction: savedPaymentTx || null,
      departmentOrders,
      auditLog: auditEntry,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to finalize bill and route department orders.',
    });
  }
});

// ============================================================================
// 8. UNIFIED SEARCH & QUERY API FOR RECEIPTS, CASH MEMOS & INVOICES
// ============================================================================

app.get('/api/billing/receipts/search', (req, res) => {
  try {
    const rawQ = String(req.query.q || req.query.query || '').trim();
    const q = rawQ.toLowerCase();
    const startDate = String(req.query.startDate || req.query.from || '').trim();
    const endDate = String(req.query.endDate || req.query.to || '').trim();
    const statusFilter = String(req.query.status || 'all').trim();
    const paymentMethodFilter = String(req.query.paymentMethod || 'all').trim();
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || '25'), 10) || 25));

    const invoices = hospitalDb.collections.invoices || [];
    const paymentTransactions = hospitalDb.collections.paymentTransactions || [];

    const invoiceByNo = new Map<string, any>();
    const invoiceById = new Map<string, any>();
    for (const inv of invoices) {
      if (inv.invoiceNo) invoiceByNo.set(String(inv.invoiceNo).toLowerCase(), inv);
      if (inv.id) invoiceById.set(String(inv.id), inv);
    }

    const cleanPhone = (ph: string | undefined): string => {
      if (!ph) return '';
      return String(ph).replace(/[^0-9]/g, '');
    };

    const qCleanPhone = cleanPhone(q);
    const unifiedReceipts: any[] = [];
    const seenPaymentIds = new Set<string>();

    for (const pt of paymentTransactions) {
      if (!pt) continue;
      const linkedInv =
        (pt.invoiceId && invoiceById.get(String(pt.invoiceId))) ||
        (pt.invoiceNo && invoiceByNo.get(String(pt.invoiceNo).toLowerCase())) ||
        null;

      const pId = pt.pId || linkedInv?.pId || '';
      const patientName = pt.patientName || linkedInv?.patientName || 'Unknown Patient';
      const phone = pt.phone || linkedInv?.phone || '';
      const invoiceNo = pt.invoiceNo || linkedInv?.invoiceNo || '';
      const cashMemoNo =
        pt.cashMemoNo || linkedInv?.cashMemoNo || (invoiceNo ? `CM-${invoiceNo.replace(/^INV-/i, '')}` : '');
      const receiptNo = pt.receiptNo || `RCP-${pt.id ? pt.id.slice(-6) : '000000'}`;
      const amount = Number(pt.amount) || 0;
      const date = pt.date || linkedInv?.date || (pt.timestamp ? pt.timestamp.slice(0, 10) : '');
      const paymentMethod = pt.paymentMethod || linkedInv?.paymentMethod || 'Cash';
      const status = linkedInv?.status || (amount > 0 ? 'Paid' : 'Due');

      seenPaymentIds.add(String(pt.id));

      unifiedReceipts.push({
        id: pt.id,
        receiptNo,
        cashMemoNo,
        invoiceNo,
        invoiceId: pt.invoiceId || linkedInv?.id || '',
        pId,
        patientName,
        phone,
        date,
        timestamp: pt.timestamp || linkedInv?.createdAt || '',
        amount,
        type: pt.type || 'PAYMENT',
        paymentMethod,
        transactionReference: pt.transactionReference || '',
        receivedBy: pt.receivedBy || 'Cashier',
        receivedByRole: pt.receivedByRole || 'Billing',
        workstationCode: pt.workstationCode || 'PC-01',
        note: pt.note || '',
        status,
        netTotal: linkedInv?.netTotal ?? amount,
        paidAmount: linkedInv?.paidAmount ?? amount,
        dueAmount: linkedInv?.dueAmount ?? 0,
        invoice: linkedInv,
      });
    }

    // Include invoices that don't have separate payment transactions (e.g. Due/Credit cash memos)
    for (const inv of invoices) {
      if (!inv) continue;
      const hasPt = paymentTransactions.some(
        (pt: any) => pt.invoiceId === inv.id || pt.invoiceNo === inv.invoiceNo
      );
      if (!hasPt) {
        const invoiceNo = inv.invoiceNo || '';
        const suffix = invoiceNo ? invoiceNo.replace(/^INV-/i, '') : String(inv.id).slice(-6);
        const cashMemoNo = inv.cashMemoNo || `CM-${suffix}`;
        const receiptNo = inv.receiptNo || `RCP-${suffix}`;
        unifiedReceipts.push({
          id: `memo-${inv.id}`,
          receiptNo,
          cashMemoNo,
          invoiceNo,
          invoiceId: inv.id,
          pId: inv.pId,
          patientName: inv.patientName,
          phone: inv.phone,
          date: inv.date,
          timestamp: inv.createdAt || inv.date,
          amount: Number(inv.paidAmount) || 0,
          type: (Number(inv.paidAmount) || 0) > 0 ? 'INITIAL_PAYMENT' : 'DUE_BILL',
          paymentMethod: inv.paymentMethod || 'Cash',
          transactionReference: inv.transactionReference || '',
          receivedBy: inv.cashierName || 'Billing',
          receivedByRole: 'Billing',
          workstationCode: inv.workstationCode || 'PC-01',
          note: `Cash Memo / Bill #${invoiceNo}`,
          status: inv.status || 'Due',
          netTotal: Number(inv.netTotal) || 0,
          paidAmount: Number(inv.paidAmount) || 0,
          dueAmount: Number(inv.dueAmount) || 0,
          invoice: inv,
        });
      }
    }

    const filtered = unifiedReceipts.filter((item) => {
      if (q) {
        const itemPhoneClean = cleanPhone(item.phone);
        const matchReceiptNo = item.receiptNo && item.receiptNo.toLowerCase().includes(q);
        const matchMemoNo = item.cashMemoNo && item.cashMemoNo.toLowerCase().includes(q);
        const matchInvoiceNo = item.invoiceNo && item.invoiceNo.toLowerCase().includes(q);
        const matchPid = item.pId && (item.pId.toLowerCase().includes(q) || `pid:${item.pId}`.toLowerCase().includes(q));
        const matchName = item.patientName && item.patientName.toLowerCase().includes(q);
        const matchPhone = item.phone && item.phone.toLowerCase().includes(q);
        const matchCleanPhone = qCleanPhone && itemPhoneClean && itemPhoneClean.includes(qCleanPhone);
        const matchTxId = item.id && item.id.toLowerCase().includes(q);
        const matchRef = item.transactionReference && item.transactionReference.toLowerCase().includes(q);

        if (
          !matchReceiptNo &&
          !matchMemoNo &&
          !matchInvoiceNo &&
          !matchPid &&
          !matchName &&
          !matchPhone &&
          !matchCleanPhone &&
          !matchTxId &&
          !matchRef
        ) {
          return false;
        }
      }

      if (statusFilter && statusFilter !== 'all') {
        const itemStatus = String(item.status || '').toLowerCase();
        if (itemStatus !== statusFilter.toLowerCase()) {
          return false;
        }
      }

      if (paymentMethodFilter && paymentMethodFilter !== 'all') {
        const itemMethod = String(item.paymentMethod || '').toLowerCase();
        if (itemMethod !== paymentMethodFilter.toLowerCase()) {
          return false;
        }
      }

      if (startDate) {
        const itemDate = item.date || item.timestamp?.slice(0, 10) || '';
        if (itemDate && itemDate < startDate) return false;
      }
      if (endDate) {
        const itemDate = item.date || item.timestamp?.slice(0, 10) || '';
        if (itemDate && itemDate > endDate) return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      const timeA = new Date(a.timestamp || a.date || 0).getTime();
      const timeB = new Date(b.timestamp || b.date || 0).getTime();
      return timeB - timeA;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    const matchedInvoicesMap = new Map<string, any>();
    for (const r of filtered) {
      if (r.invoice && !matchedInvoicesMap.has(r.invoice.id)) {
        matchedInvoicesMap.set(r.invoice.id, r.invoice);
      }
    }

    res.json({
      success: true,
      total,
      page,
      limit,
      totalPages,
      receipts: paginated,
      invoices: Array.from(matchedInvoicesMap.values()).slice((page - 1) * limit, page * limit),
      dbVersion: hospitalDb.dbVersion,
      lastSavedAt: hospitalDb.lastSavedAt,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Receipt search failed.',
    });
  }
});

app.post('/api/billing/collect-due', (req, res) => {
  try {
    const {
      invoiceId,
      invoiceNo,
      amount,
      paymentMethod = 'Cash',
      transactionReference = '',
      note = '',
      receiptNo,
    } = req.body || {};

    const collectAmt = Number(amount);
    if ((!invoiceId && !invoiceNo) || !Number.isFinite(collectAmt) || collectAmt <= 0) {
      res.status(400).json({
        success: false,
        error: 'Valid invoice identifier and positive collection amount are required.',
      });
      return;
    }

    const actor = extractActorFromRequest(req);
    const nowIso = new Date().toISOString();
    const targetInv = (hospitalDb.collections.invoices || []).find(
      (i: any) => i.id === invoiceId || i.invoiceNo === invoiceNo
    );

    if (!targetInv) {
      res.status(404).json({
        success: false,
        error: 'Invoice not found in permanent database.',
      });
      return;
    }

    const currentDue = Math.max(0, Number(targetInv.dueAmount) || 0);
    const actualCollected = Math.min(collectAmt, currentDue);
    const newPaid = (Number(targetInv.paidAmount) || 0) + actualCollected;
    const newDue = Math.max(0, (Number(targetInv.netTotal) || 0) - newPaid);
    const newStatus: 'Paid' | 'Partial' | 'Due' =
      newDue <= 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Due';

    const paymentTx = {
      id: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      receiptNo: receiptNo || `RCP-${Date.now().toString().slice(-6)}`,
      invoiceId: targetInv.id,
      invoiceNo: targetInv.invoiceNo,
      cashMemoNo: targetInv.cashMemoNo,
      pId: targetInv.pId,
      patientName: targetInv.patientName,
      amount: actualCollected,
      type: 'DUE_COLLECTION',
      paymentMethod,
      transactionReference,
      receivedBy: actor.fullName,
      receivedByRole: actor.role,
      workstationCode: actor.workstationCode,
      timestamp: nowIso.replace('T', ' ').slice(0, 19),
      note: note || `Due collection against Bill #${targetInv.invoiceNo}`,
    };

    hospitalDb.collections.invoices = (hospitalDb.collections.invoices || []).map((inv: any) => {
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
    });

    hospitalDb.collections.paymentTransactions = [
      paymentTx,
      ...(hospitalDb.collections.paymentTransactions || []),
    ];

    // Update linked Department Orders paymentStatus & promote 'Payment Pending' orders to 'Ready for Processing'
    hospitalDb.collections.departmentOrders = (hospitalDb.collections.departmentOrders || []).map(
      (ord: any) => {
        if (ord.invoiceId !== targetInv.id && ord.invoiceNo !== targetInv.invoiceNo) return ord;
        const promotedOrderStatus =
          ord.orderStatus === 'Payment Pending' && (newStatus === 'Paid' || newStatus === 'Partial')
            ? 'Ready for Processing'
            : ord.orderStatus;
        return {
          ...ord,
          paymentStatus: newStatus,
          orderStatus: promotedOrderStatus,
          updatedAt: nowIso,
        };
      }
    );

    // Update Pathology Patient paymentStatus if matched
    hospitalDb.collections.patients = (hospitalDb.collections.patients || []).map((p: any) => {
      if (p.invoiceNo !== targetInv.invoiceNo) return p;
      return { ...p, paymentStatus: newStatus };
    });

    // Update OPD Appointment paymentStatus if matched
    hospitalDb.collections.opdAppointments = (hospitalDb.collections.opdAppointments || []).map(
      (apt: any) => {
        if (apt.invoiceNo !== targetInv.invoiceNo) return apt;
        return { ...apt, paymentStatus: newStatus === 'Paid' ? 'Paid' : 'Partial' };
      }
    );

    const auditEntry = {
      id: `AUD-DUE-${Date.now()}`,
      timestamp: nowIso.replace('T', ' ').slice(0, 19),
      ipAddress: actor.ipAddress,
      workstationCode: actor.workstationCode,
      username: actor.username,
      userFullName: actor.fullName,
      role: actor.role,
      department: 'Billing',
      actionType: 'PAYMENT_RECEIVED',
      patientId: targetInv.pId,
      patientName: targetInv.patientName,
      entityType: 'invoice',
      recordId: targetInv.id,
      details: `[DUE COLLECTION] Received ৳${actualCollected} via ${paymentMethod} for Bill #${targetInv.invoiceNo} (Receipt #${paymentTx.receiptNo}). Remaining Due: ৳${newDue}.`,
    };

    hospitalDb.collections.auditLogs.unshift(auditEntry);
    hospitalDb.dbVersion += 1;
    hospitalDb.lastSavedAt = nowIso;
    hospitalDb.lastSavedBy = `${actor.fullName} (${actor.role})`;
    savePermanentDb();

    res.json({
      success: true,
      dbVersion: hospitalDb.dbVersion,
      paymentTransaction: paymentTx,
      paidAmount: newPaid,
      dueAmount: newDue,
      status: newStatus,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to collect due payment.',
    });
  }
});

app.post('/api/billing/refund-or-cancel', (req, res) => {
  try {
    const {
      invoiceId,
      invoiceNo,
      actionType = 'CANCEL', // 'CANCEL' | 'REFUND'
      refundAmount = 0,
      paymentMethod = 'Cash',
      reason = '',
    } = req.body || {};

    const trimmedReason = String(reason || '').trim();
    if (!trimmedReason) {
      res.status(400).json({
        success: false,
        error: 'Cancellation or refund reason is mandatory.',
      });
      return;
    }

    const actor = extractActorFromRequest(req);
    const nowIso = new Date().toISOString();
    const targetInv = (hospitalDb.collections.invoices || []).find(
      (i: any) => i.id === invoiceId || i.invoiceNo === invoiceNo
    );

    if (!targetInv) {
      res.status(404).json({
        success: false,
        error: 'Invoice not found.',
      });
      return;
    }

    const refAmt = Math.min(Math.max(0, Number(refundAmount) || 0), Number(targetInv.paidAmount) || 0);
    const newPaid = Math.max(0, (Number(targetInv.paidAmount) || 0) - refAmt);
    const isCancel = actionType === 'CANCEL';
    const newStatus: 'Cancelled' | 'Refunded' | 'Paid' | 'Partial' | 'Due' = isCancel
      ? 'Cancelled'
      : refAmt > 0 && newPaid === 0
      ? 'Refunded'
      : newPaid >= targetInv.netTotal
      ? 'Paid'
      : newPaid > 0
      ? 'Partial'
      : 'Due';

    const refundTx =
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
            paymentMethod,
            receivedBy: actor.fullName,
            receivedByRole: actor.role,
            workstationCode: actor.workstationCode,
            timestamp: nowIso.replace('T', ' ').slice(0, 19),
            note: `${actionType}: ${trimmedReason}`,
          }
        : null;

    hospitalDb.collections.invoices = (hospitalDb.collections.invoices || []).map((inv: any) => {
      if (inv.id !== targetInv.id && inv.invoiceNo !== targetInv.invoiceNo) return inv;
      const existingPayments = Array.isArray(inv.payments) ? inv.payments : [];
      return {
        ...inv,
        paidAmount: newPaid,
        dueAmount: isCancel ? 0 : Math.max(0, (Number(inv.netTotal) || 0) - newPaid),
        refundAmount: (Number(inv.refundAmount) || 0) + refAmt,
        status: newStatus,
        isCancelled: isCancel ? true : inv.isCancelled,
        cancelledAt: isCancel ? nowIso.replace('T', ' ').slice(0, 19) : inv.cancelledAt,
        cancelledBy: isCancel ? actor.fullName : inv.cancelledBy,
        cancelReason: trimmedReason,
        payments: refundTx ? [...existingPayments, refundTx] : existingPayments,
        updatedAt: nowIso,
      };
    });

    if (refundTx) {
      hospitalDb.collections.paymentTransactions = [
        refundTx,
        ...(hospitalDb.collections.paymentTransactions || []),
      ];
    }

    // Update linked Department Orders so cancelled bills never silently vanish—they show as Cancelled
    hospitalDb.collections.departmentOrders = (hospitalDb.collections.departmentOrders || []).map(
      (ord: any) => {
        if (ord.invoiceId !== targetInv.id && ord.invoiceNo !== targetInv.invoiceNo) return ord;
        return {
          ...ord,
          paymentStatus: newStatus,
          orderStatus: isCancel ? 'Cancelled' : ord.orderStatus,
          cancelledAt: isCancel ? nowIso.replace('T', ' ').slice(0, 19) : ord.cancelledAt,
          cancelReason: isCancel ? trimmedReason : ord.cancelReason,
          updatedAt: nowIso,
        };
      }
    );

    if (isCancel) {
      hospitalDb.collections.patients = (hospitalDb.collections.patients || []).map((p: any) => {
        if (p.invoiceNo !== targetInv.invoiceNo) return p;
        return {
          ...p,
          workflowStatus: 'Cancelled',
          paymentStatus: 'Cancelled',
          comments: `${p.comments ? p.comments + ' | ' : ''}[Bill Cancelled: ${trimmedReason}]`,
        };
      });

      hospitalDb.collections.opdAppointments = (
        hospitalDb.collections.opdAppointments || []
      ).map((apt: any) => {
        if (apt.invoiceNo !== targetInv.invoiceNo) return apt;
        return { ...apt, status: 'Cancelled', updatedAt: nowIso };
      });
    }

    const auditEntry = {
      id: `AUD-REF-${Date.now()}`,
      timestamp: nowIso.replace('T', ' ').slice(0, 19),
      ipAddress: actor.ipAddress,
      workstationCode: actor.workstationCode,
      username: actor.username,
      userFullName: actor.fullName,
      role: actor.role,
      department: 'Billing',
      actionType: 'RECORD_UPDATE',
      patientId: targetInv.pId,
      patientName: targetInv.patientName,
      entityType: 'invoice',
      recordId: targetInv.id,
      details: `[BILL ${actionType}] Bill #${targetInv.invoiceNo} (${targetInv.patientName}, ${targetInv.pId}) — Refunded: ৳${refAmt}. Reason: "${trimmedReason}" by ${actor.fullName}.`,
    };

    hospitalDb.collections.auditLogs.unshift(auditEntry);
    hospitalDb.dbVersion += 1;
    hospitalDb.lastSavedAt = nowIso;
    hospitalDb.lastSavedBy = `${actor.fullName} (${actor.role})`;
    savePermanentDb();

    res.json({
      success: true,
      dbVersion: hospitalDb.dbVersion,
      status: newStatus,
      paidAmount: newPaid,
      refundAmount: refAmt,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to process refund or cancellation.',
    });
  }
});

app.post('/api/orders/update-status', (req, res) => {
  try {
    const { orderId, orderNo, orderStatus, reportId, notes } = req.body || {};
    if ((!orderId && !orderNo) || !orderStatus) {
      res.status(400).json({
        success: false,
        error: 'orderId/orderNo and orderStatus are required.',
      });
      return;
    }

    const actor = extractActorFromRequest(req);
    const nowIso = new Date().toISOString();
    const nowReadable = nowIso.replace('T', ' ').slice(0, 19);

    hospitalDb.collections.departmentOrders = (hospitalDb.collections.departmentOrders || []).map(
      (ord: any) => {
        if (ord.id !== orderId && ord.orderNo !== orderNo) return ord;
        return {
          ...ord,
          orderStatus,
          sampleCollectedAt:
            orderStatus === 'Sample Collected'
              ? ord.sampleCollectedAt || nowReadable
              : ord.sampleCollectedAt,
          sampleCollectedBy:
            orderStatus === 'Sample Collected'
              ? ord.sampleCollectedBy || actor.fullName
              : ord.sampleCollectedBy,
          resultEnteredAt:
            orderStatus === 'Result Entered' || orderStatus === 'Completed'
              ? ord.resultEnteredAt || nowReadable
              : ord.resultEnteredAt,
          completedAt: orderStatus === 'Completed' ? nowReadable : ord.completedAt,
          reportId: reportId || ord.reportId,
          notes: notes !== undefined ? notes : ord.notes,
          updatedAt: nowIso,
        };
      }
    );

    hospitalDb.dbVersion += 1;
    hospitalDb.lastSavedAt = nowIso;
    savePermanentDb();

    res.json({
      success: true,
      dbVersion: hospitalDb.dbVersion,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to update department order status.',
    });
  }
});


async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });

    // Serve a WebSocket-free Vite client shim in middleware mode so CSS injection
    // and React Fast Refresh hooks work without attempting blocked WebSocket connections.
    app.get('/@vite/client', (_req, res) => {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.send(`import "/@vite/env";
const sheetsMap = new Map();
const linkSheetsMap = new Map();
if ("document" in globalThis) {
  document.querySelectorAll("style[data-vite-dev-id]").forEach((el) => {
    sheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
  });
  document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id]').forEach((el) => {
    linkSheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
  });
}
let lastInsertedStyle;
function updateStyle(id, content) {
  if (linkSheetsMap.has(id)) return;
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.setAttribute("data-vite-dev-id", id);
    style.textContent = content;
    if (!lastInsertedStyle) {
      document.head.appendChild(style);
      setTimeout(() => { lastInsertedStyle = undefined; }, 0);
    } else {
      lastInsertedStyle.insertAdjacentElement("afterend", style);
    }
    lastInsertedStyle = style;
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}
function removeStyle(id) {
  if (linkSheetsMap.has(id)) {
    document.querySelectorAll(\`link[rel="stylesheet"][data-vite-dev-id="\${CSS.escape(id)}"]\`).forEach((el) => el.remove());
    linkSheetsMap.delete(id);
  }
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
    sheetsMap.delete(id);
  }
}
const dataMap = new Map();
function createHotContext(ownerPath) {
  if (!dataMap.has(ownerPath)) dataMap.set(ownerPath, {});
  return {
    get data() { return dataMap.get(ownerPath); },
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    decline() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}
function injectQuery(url, queryToInject) {
  if (url[0] !== "." && url[0] !== "/") return url;
  const pathname = url.replace(/[?#].*$/, "");
  const { search, hash } = new URL(url, "http://vite.dev");
  return \`\${pathname}?\${queryToInject}\${search ? "&" + search.slice(1) : ""}\${hash || ""}\`;
}
const { HTMLElement = class {} } = globalThis;
class ErrorOverlay extends HTMLElement { close() {} }
export { ErrorOverlay, createHotContext, injectQuery, removeStyle, updateStyle };
`);
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Adiba Hospital Server & Backup Daemon running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
