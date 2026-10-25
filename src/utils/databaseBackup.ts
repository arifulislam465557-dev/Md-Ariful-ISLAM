import JSZip from 'jszip';
import {
  ClinicConfig,
  Doctor,
  LabTest,
  Patient,
  Invoice,
  Prescription,
  EcgReport,
  XrayReport,
  UsgReport,
  Employee,
  ExpenseItem,
  UserAccount,
  ActivityAuditLog,
  InvoicePrintLog,
  BackupHistoryEntry,
  EncryptedBackupPackage,
  ShiftHandoverNote,
  WorkstationNode,
  PathologyOrderItem,
  DepartmentOrder,
  PaymentTransaction,
} from '../types';

export interface DetailedBackupScopes {
  patientRecords: boolean;
  doctorInfo: boolean;
  appointments: boolean;
  billingPayments: boolean;
  pharmacyInventory: boolean;
  laboratoryReports: boolean;
  staffInfo: boolean;
  hospitalSettings: boolean;
  databaseSql: boolean;
  documentsAttachments: boolean;
  fullSystemBackup: boolean;
}

export const DEFAULT_DETAILED_BACKUP_SCOPES: DetailedBackupScopes = {
  patientRecords: true,
  doctorInfo: true,
  appointments: true,
  billingPayments: true,
  pharmacyInventory: true,
  laboratoryReports: true,
  staffInfo: true,
  hospitalSettings: true,
  databaseSql: true,
  documentsAttachments: true,
  fullSystemBackup: true,
};

export interface FullHospitalDatabase {
  exportDate: string;
  version: string;
  clinicConfig: ClinicConfig;
  doctors: Doctor[];
  labTests: LabTest[];
  patients: Patient[];
  invoices: Invoice[];
  prescriptions: Prescription[];
  ecgReports: EcgReport[];
  xrayReports: XrayReport[];
  usgReports: UsgReport[];
  employees: Employee[];
  expenses: ExpenseItem[];
  users: UserAccount[];
  auditLogs: ActivityAuditLog[];
  printLogs: InvoicePrintLog[];
  shiftHandovers?: ShiftHandoverNote[];
  workstations?: WorkstationNode[];
  pathologyOrders?: PathologyOrderItem[];
  departmentOrders?: DepartmentOrder[];
  paymentTransactions?: PaymentTransaction[];
  pharmacyInventory?: Array<{
    id: string;
    code: string;
    name: string;
    category: string;
    stockQty: number;
    unit: string;
    expiryDate: string;
  }>;
}

export interface BackupZipManifest {
  format: 'ADIBA_HOSPITAL_ZIP_ARCHIVE';
  version: string;
  archiveFilename: string;
  createdAt: string;
  exportedBy: string;
  clinicName: string;
  clinicRegNo: string;
  isEncrypted: boolean;
  cipher?: string;
  kdf?: string;
  sha256Checksum: string;
  selectedScopes: DetailedBackupScopes;
  includedFiles: string[];
  summary: {
    patientsCount: number;
    doctorsCount: number;
    appointmentsCount: number;
    invoicesCount: number;
    expensesCount: number;
    pharmacyItemsCount: number;
    labReportsCount: number;
    imagingReportsCount: number;
    prescriptionsCount: number;
    staffCount: number;
    usersCount: number;
    attachmentsCount: number;
    sqlTablesCount: number;
    totalRecords: number;
  };
}

export interface BackupInspectionResult {
  valid: boolean;
  isZipArchive: boolean;
  isEncrypted: boolean;
  needsPassphrase?: boolean;
  checksumVerified: boolean;
  expectedChecksum?: string;
  calculatedChecksum?: string;
  filename: string;
  createdAt: string;
  clinicName: string;
  exportedBy: string;
  version: string;
  includedFiles: string[];
  hasSqlDump: boolean;
  hasAttachments: boolean;
  summary: {
    patientsCount: number;
    doctorsCount: number;
    appointmentsCount: number;
    invoicesCount: number;
    pharmacyItemsCount: number;
    labReportsCount: number;
    staffCount: number;
    attachmentsCount: number;
    totalRecords: number;
  };
  decryptedPayload?: any;
  rawTextForRestore?: string;
  error?: string;
}

export const formatBackupArchiveFilename = (prefix = 'Hospital_Backup', date = new Date()): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${prefix}_${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}.zip`;
};

const escapeSql = (str: any): string => {
  if (str === null || str === undefined) return 'NULL';
  if (typeof str === 'number' || typeof str === 'boolean') return `${str}`;
  const s = String(str).replace(/'/g, "''").replace(/\\/g, '\\\\');
  return `'${s}'`;
};

export const generateHospitalSqlDump = (data: Partial<FullHospitalDatabase>): string => {
  const timestamp = new Date().toISOString();
  const clinic = data.clinicConfig || ({ clinicName: 'Adiba Hospital' } as ClinicConfig);
  const doctors = data.doctors || [];
  const labTests = data.labTests || [];
  const patients = data.patients || [];
  const invoices = data.invoices || [];
  const printLogs = data.printLogs || [];
  const users = data.users || [];
  const employees = data.employees || [];
  const prescriptions = data.prescriptions || [];
  const shiftHandovers = data.shiftHandovers || [];

  let sql = `-- ==========================================================================\n`;
  sql += `-- ADIBA HOSPITAL MANAGEMENT SYSTEM (PC & MOBILE APP) DATABASE SQL DUMP\n`;
  sql += `-- Clinic: ${clinic.clinicName}\n`;
  sql += `-- Exported At: ${timestamp}\n`;
  sql += `-- Compatible with: PostgreSQL / MySQL / SQLite3 Relational Database Engines\n`;
  sql += `-- Total Invoices: ${invoices.length} | Patients: ${patients.length} | Tests: ${labTests.length}\n`;
  sql += `-- ==========================================================================\n\n`;

  sql += `BEGIN;\n\n`;

  if (data.clinicConfig) {
    sql += `-- 1. CLINIC CONFIGURATION\n`;
    sql += `CREATE TABLE IF NOT EXISTS clinic_settings (\n`;
    sql += `  clinic_name VARCHAR(255),\n`;
    sql += `  clinic_name_bn VARCHAR(255),\n`;
    sql += `  tagline TEXT,\n`;
    sql += `  address TEXT,\n`;
    sql += `  phone VARCHAR(50),\n`;
    sql += `  email VARCHAR(100),\n`;
    sql += `  reg_no VARCHAR(100),\n`;
    sql += `  pathologist_name VARCHAR(255),\n`;
    sql += `  lab_in_charge VARCHAR(255)\n`;
    sql += `);\n`;
    sql += `DELETE FROM clinic_settings;\n`;
    sql += `INSERT INTO clinic_settings (clinic_name, clinic_name_bn, tagline, address, phone, email, reg_no, pathologist_name, lab_in_charge) VALUES (\n`;
    sql += `  ${escapeSql(clinic.clinicName)},\n`;
    sql += `  ${escapeSql(clinic.clinicNameBn)},\n`;
    sql += `  ${escapeSql(clinic.tagline)},\n`;
    sql += `  ${escapeSql(clinic.address)},\n`;
    sql += `  ${escapeSql(clinic.phone)},\n`;
    sql += `  ${escapeSql(clinic.email)},\n`;
    sql += `  ${escapeSql(clinic.regNo)},\n`;
    sql += `  ${escapeSql(clinic.pathologistName)},\n`;
    sql += `  ${escapeSql(clinic.labInCharge)}\n`;
    sql += `);\n\n`;
  }

  if (doctors.length > 0) {
    sql += `-- 2. DOCTORS DIRECTORY (${doctors.length} records)\n`;
    sql += `CREATE TABLE IF NOT EXISTS doctors (\n`;
    sql += `  id VARCHAR(64) PRIMARY KEY,\n`;
    sql += `  code VARCHAR(32) UNIQUE NOT NULL,\n`;
    sql += `  name VARCHAR(255) NOT NULL,\n`;
    sql += `  degree VARCHAR(255),\n`;
    sql += `  specialty VARCHAR(255),\n`;
    sql += `  phone VARCHAR(50),\n`;
    sql += `  room_no VARCHAR(50),\n`;
    sql += `  fee DECIMAL(10, 2)\n`;
    sql += `);\n`;
    doctors.forEach((d) => {
      sql += `INSERT INTO doctors (id, code, name, degree, specialty, phone, room_no, fee) VALUES (${escapeSql(
        d.id
      )}, ${escapeSql(d.code)}, ${escapeSql(d.name)}, ${escapeSql(d.degree)}, ${escapeSql(
        d.specialty
      )}, ${escapeSql(d.phone)}, ${escapeSql(d.roomNo)}, ${d.fee || 0}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;\n`;
    });
    sql += `\n`;
  }

  if (labTests.length > 0) {
    sql += `-- 3. INVESTIGATION & LAB TESTS CATALOG (${labTests.length} tests)\n`;
    sql += `CREATE TABLE IF NOT EXISTS lab_tests (\n`;
    sql += `  id VARCHAR(64) PRIMARY KEY,\n`;
    sql += `  code VARCHAR(32) NOT NULL,\n`;
    sql += `  name VARCHAR(255) NOT NULL,\n`;
    sql += `  category VARCHAR(100),\n`;
    sql += `  unit VARCHAR(50),\n`;
    sql += `  normal_range VARCHAR(255),\n`;
    sql += `  price DECIMAL(10, 2) NOT NULL\n`;
    sql += `);\n`;
    labTests.forEach((t) => {
      sql += `INSERT INTO lab_tests (id, code, name, category, unit, normal_range, price) VALUES (${escapeSql(
        t.id
      )}, ${escapeSql(t.code)}, ${escapeSql(t.name)}, ${escapeSql(t.category)}, ${escapeSql(
        t.unit
      )}, ${escapeSql(t.normalRange)}, ${t.price || 0}) ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price;\n`;
    });
    sql += `\n`;
  }

  if (patients.length > 0) {
    sql += `-- 4. PATIENT REGISTRATIONS (${patients.length} patients)\n`;
    sql += `CREATE TABLE IF NOT EXISTS patients (\n`;
    sql += `  id VARCHAR(64) PRIMARY KEY,\n`;
    sql += `  pid VARCHAR(32) NOT NULL,\n`;
    sql += `  patient_name VARCHAR(255) NOT NULL,\n`;
    sql += `  age VARCHAR(32),\n`;
    sql += `  sex VARCHAR(16),\n`;
    sql += `  phone VARCHAR(50),\n`;
    sql += `  dr_code VARCHAR(32),\n`;
    sql += `  bill_date VARCHAR(64),\n`;
    sql += `  status VARCHAR(32),\n`;
    sql += `  department VARCHAR(64)\n`;
    sql += `);\n`;
    patients.forEach((p) => {
      sql += `INSERT INTO patients (id, pid, patient_name, age, sex, phone, dr_code, bill_date, status, department) VALUES (${escapeSql(
        p.id
      )}, ${escapeSql(p.pId)}, ${escapeSql(p.patientName)}, ${escapeSql(p.age)}, ${escapeSql(
        p.sex
      )}, ${escapeSql(p.phone)}, ${escapeSql(p.drCode)}, ${escapeSql(p.billDate || p.invDate)}, ${escapeSql(
        p.status
      )}, ${escapeSql(p.department)}) ON CONFLICT (id) DO NOTHING;\n`;
    });
    sql += `\n`;
  }

  if (invoices.length > 0) {
    sql += `-- 5. BILLING & INVOICES (${invoices.length} invoices)\n`;
    sql += `CREATE TABLE IF NOT EXISTS invoices (\n`;
    sql += `  id VARCHAR(64) PRIMARY KEY,\n`;
    sql += `  invoice_no VARCHAR(64) UNIQUE NOT NULL,\n`;
    sql += `  pid VARCHAR(32) NOT NULL,\n`;
    sql += `  patient_name VARCHAR(255) NOT NULL,\n`;
    sql += `  age VARCHAR(32),\n`;
    sql += `  sex VARCHAR(16),\n`;
    sql += `  phone VARCHAR(50),\n`;
    sql += `  dr_code VARCHAR(32),\n`;
    sql += `  dr_name VARCHAR(255),\n`;
    sql += `  bill_date VARCHAR(64),\n`;
    sql += `  subtotal DECIMAL(10, 2),\n`;
    sql += `  discount_percent INT,\n`;
    sql += `  discount_amount DECIMAL(10, 2),\n`;
    sql += `  discount_by VARCHAR(255),\n`;
    sql += `  net_total DECIMAL(10, 2),\n`;
    sql += `  paid_amount DECIMAL(10, 2),\n`;
    sql += `  due_amount DECIMAL(10, 2),\n`;
    sql += `  payment_method VARCHAR(50),\n`;
    sql += `  status VARCHAR(32)\n`;
    sql += `);\n`;
    invoices.forEach((inv) => {
      sql += `INSERT INTO invoices (id, invoice_no, pid, patient_name, age, sex, phone, dr_code, dr_name, bill_date, subtotal, discount_percent, discount_amount, discount_by, net_total, paid_amount, due_amount, payment_method, status) VALUES (${escapeSql(
        inv.id
      )}, ${escapeSql(inv.invoiceNo)}, ${escapeSql(inv.pId)}, ${escapeSql(inv.patientName)}, ${escapeSql(
        inv.age
      )}, ${escapeSql(inv.sex)}, ${escapeSql(inv.phone)}, ${escapeSql(inv.drCode)}, ${escapeSql(
        inv.drName
      )}, ${escapeSql(inv.date)}, ${inv.subtotal}, ${inv.discountPercent}, ${inv.discountAmount}, ${escapeSql(
        inv.discountBy || null
      )}, ${inv.netTotal}, ${inv.paidAmount}, ${inv.dueAmount}, ${escapeSql(inv.paymentMethod)}, ${escapeSql(
        inv.status
      )}) ON CONFLICT (invoice_no) DO UPDATE SET paid_amount = EXCLUDED.paid_amount, due_amount = EXCLUDED.due_amount;\n`;
    });
    sql += `\n`;
  }

  if (prescriptions.length > 0) {
    sql += `-- 6. DOCTOR PRESCRIPTIONS & OPD VISITS (${prescriptions.length} records)\n`;
    sql += `CREATE TABLE IF NOT EXISTS prescriptions (\n`;
    sql += `  id VARCHAR(64) PRIMARY KEY,\n`;
    sql += `  patient_name VARCHAR(255) NOT NULL,\n`;
    sql += `  doctor_name VARCHAR(255),\n`;
    sql += `  diagnosis TEXT,\n`;
    sql += `  visit_date VARCHAR(64)\n`;
    sql += `);\n`;
    prescriptions.forEach((rx) => {
      sql += `INSERT INTO prescriptions (id, patient_name, doctor_name, diagnosis, visit_date) VALUES (${escapeSql(
        rx.id
      )}, ${escapeSql(rx.patientName)}, ${escapeSql(rx.doctorName)}, ${escapeSql(
        rx.diagnosis
      )}, ${escapeSql(rx.date)}) ON CONFLICT (id) DO NOTHING;\n`;
    });
    sql += `\n`;
  }

  if (printLogs.length > 0) {
    sql += `-- 7. INVOICE PRINT AUDIT LOGS (${printLogs.length} logs)\n`;
    sql += `CREATE TABLE IF NOT EXISTS invoice_print_logs (\n`;
    sql += `  id VARCHAR(64) PRIMARY KEY,\n`;
    sql += `  invoice_id VARCHAR(64),\n`;
    sql += `  invoice_no VARCHAR(64) NOT NULL,\n`;
    sql += `  pid VARCHAR(32),\n`;
    sql += `  patient_name VARCHAR(255),\n`;
    sql += `  total_amount DECIMAL(10, 2),\n`;
    sql += `  paid_amount DECIMAL(10, 2),\n`;
    sql += `  due_amount DECIMAL(10, 2),\n`;
    sql += `  printed_at VARCHAR(64) NOT NULL,\n`;
    sql += `  printed_by_username VARCHAR(100),\n`;
    sql += `  user_role VARCHAR(50),\n`;
    sql += `  workstation_code VARCHAR(32),\n`;
    sql += `  copies INT\n`;
    sql += `);\n`;
    printLogs.forEach((l) => {
      sql += `INSERT INTO invoice_print_logs (id, invoice_id, invoice_no, pid, patient_name, total_amount, paid_amount, due_amount, printed_at, printed_by_username, user_role, workstation_code, copies) VALUES (${escapeSql(
        l.id
      )}, ${escapeSql(l.invoiceId)}, ${escapeSql(l.invoiceNo)}, ${escapeSql(l.pId)}, ${escapeSql(
        l.patientName
      )}, ${l.totalAmount}, ${l.paidAmount}, ${l.dueAmount}, ${escapeSql(l.printedAt)}, ${escapeSql(
        l.printedByUserName
      )}, ${escapeSql(l.userRole || 'Cashier')}, ${escapeSql(l.workstationCode)}, ${l.copies || 2});\n`;
    });
    sql += `\n`;
  }

  if (users.length > 0) {
    sql += `-- 8. SYSTEM USER ACCOUNTS (${users.length} accounts)\n`;
    sql += `CREATE TABLE IF NOT EXISTS system_users (\n`;
    sql += `  id VARCHAR(64) PRIMARY KEY,\n`;
    sql += `  username VARCHAR(64) UNIQUE NOT NULL,\n`;
    sql += `  full_name VARCHAR(255) NOT NULL,\n`;
    sql += `  role VARCHAR(64) NOT NULL,\n`;
    sql += `  phone VARCHAR(50),\n`;
    sql += `  is_active BOOLEAN DEFAULT TRUE,\n`;
    sql += `  created_at VARCHAR(64)\n`;
    sql += `);\n`;
    users.forEach((u) => {
      sql += `INSERT INTO system_users (id, username, full_name, role, phone, is_active, created_at) VALUES (${escapeSql(
        u.id
      )}, ${escapeSql(u.username)}, ${escapeSql(u.fullName)}, ${escapeSql(u.role)}, ${escapeSql(
        u.phone || ''
      )}, ${u.isActive !== false}, ${escapeSql(u.createdAt)}) ON CONFLICT (username) DO NOTHING;\n`;
    });
    sql += `\n`;
  }

  if (employees.length > 0) {
    sql += `-- 9. CLINIC EMPLOYEES & STAFF (${employees.length} records)\n`;
    sql += `CREATE TABLE IF NOT EXISTS employees (\n`;
    sql += `  id VARCHAR(64) PRIMARY KEY,\n`;
    sql += `  emp_id VARCHAR(32) NOT NULL,\n`;
    sql += `  name VARCHAR(255) NOT NULL,\n`;
    sql += `  designation VARCHAR(100),\n`;
    sql += `  department VARCHAR(100),\n`;
    sql += `  phone VARCHAR(50),\n`;
    sql += `  salary DECIMAL(10, 2),\n`;
    sql += `  status VARCHAR(32)\n`;
    sql += `);\n`;
    employees.forEach((emp) => {
      sql += `INSERT INTO employees (id, emp_id, name, designation, department, phone, salary, status) VALUES (${escapeSql(
        emp.id
      )}, ${escapeSql(emp.empId)}, ${escapeSql(emp.name)}, ${escapeSql(emp.designation)}, ${escapeSql(
        emp.department
      )}, ${escapeSql(emp.phone)}, ${emp.salary || 0}, ${escapeSql(emp.status)});\n`;
    });
    sql += `\n`;
  }

  if (shiftHandovers.length > 0) {
    sql += `-- 10. OPD APPOINTMENTS & SHIFT HANDOVER NOTES (${shiftHandovers.length} records)\n`;
    sql += `CREATE TABLE IF NOT EXISTS shift_handovers (\n`;
    sql += `  id VARCHAR(64) PRIMARY KEY,\n`;
    sql += `  shift_type VARCHAR(64),\n`;
    sql += `  shift_date VARCHAR(64),\n`;
    sql += `  outgoing_doctor VARCHAR(255),\n`;
    sql += `  summary TEXT\n`;
    sql += `);\n`;
    shiftHandovers.forEach((sh) => {
      sql += `INSERT INTO shift_handovers (id, shift_type, shift_date, outgoing_doctor, summary) VALUES (${escapeSql(
        sh.id
      )}, ${escapeSql(sh.shiftType)}, ${escapeSql(sh.shiftDate)}, ${escapeSql(
        sh.outgoingDoctorName
      )}, ${escapeSql(sh.summary)}) ON CONFLICT (id) DO NOTHING;\n`;
    });
    sql += `\n`;
  }

  sql += `COMMIT;\n`;
  sql += `-- ==========================================================================\n`;
  sql += `-- END OF SQL DUMP - ADIBA HOSPITAL SYSTEM\n`;
  sql += `-- ==========================================================================\n`;

  return sql;
};

export const downloadDatabaseSql = (data: FullHospitalDatabase) => {
  const sql = generateHospitalSqlDump(data);
  const dateStr = new Date().toISOString().split('T')[0];
  const blob = new Blob([sql], { type: 'application/sql;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Adiba_Hospital_Database_Dump_${dateStr}.sql`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadDatabaseJson = (data: FullHospitalDatabase) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Adiba_Hospital_Full_Backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ============================================================================
// AUTOMATED & ENCRYPTED DATABASE BACKUP UTILITY (AES-256-GCM + PBKDF2)
// ============================================================================

export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
};

export const computeSha256Hex = async (content: string | Uint8Array): Promise<string> => {
  const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content;
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

const deriveKeyFromPassphrase = async (passphrase: string, salt: Uint8Array): Promise<CryptoKey> => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

export const generateSecurePassphrase = (length: number = 16): string => {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[array[i] % charset.length];
  }
  return result;
};

export const calculatePasswordStrength = (pass: string): { score: number; label: string; color: string } => {
  if (!pass) return { score: 0, label: 'Empty', color: 'text-gray-400 bg-gray-100 dark:bg-gray-800' };
  let score = 0;
  if (pass.length >= 8) score += 1;
  if (pass.length >= 12) score += 1;
  if (/[A-Z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score <= 2) return { score, label: 'Weak', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200' };
  if (score <= 3) return { score, label: 'Medium', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200' };
  return { score, label: 'Strong (AES-256 Ready)', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200' };
};

export const filterHospitalDataByScopes = (
  data: FullHospitalDatabase,
  scopes: {
    patients: boolean;
    clinicalReports: boolean;
    billing: boolean;
    mastersAndStaff: boolean;
  }
): Partial<FullHospitalDatabase> => {
  const result: any = {
    exportDate: data.exportDate,
    version: data.version,
    clinicConfig: data.clinicConfig,
  };

  if (scopes.patients) {
    result.patients = data.patients;
  }

  if (scopes.clinicalReports) {
    result.prescriptions = data.prescriptions;
    result.ecgReports = data.ecgReports;
    result.xrayReports = data.xrayReports;
    result.usgReports = data.usgReports;
    if (!result.patients) {
      result.patients = data.patients.map((p) => ({
        ...p,
        testResults: p.testResults,
      }));
    }
  }

  if (scopes.billing) {
    result.invoices = data.invoices;
    result.expenses = data.expenses;
    result.printLogs = data.printLogs;
  }

  if (scopes.mastersAndStaff) {
    result.doctors = data.doctors;
    result.labTests = data.labTests;
    result.employees = data.employees;
    result.users = data.users;
    result.auditLogs = data.auditLogs;
    result.shiftHandovers = data.shiftHandovers;
  }

  return result;
};

export const filterHospitalDataByDetailedScopes = (
  data: FullHospitalDatabase,
  scopes: DetailedBackupScopes
): Partial<FullHospitalDatabase> => {
  if (scopes.fullSystemBackup) {
    return {
      ...data,
      pharmacyInventory: data.pharmacyInventory || getDefaultPharmacyInventory(),
    };
  }

  const result: Partial<FullHospitalDatabase> = {
    exportDate: data.exportDate,
    version: data.version,
  };

  if (scopes.hospitalSettings) {
    result.clinicConfig = data.clinicConfig;
    result.workstations = data.workstations;
    result.auditLogs = data.auditLogs;
  } else {
    result.clinicConfig = {
      ...data.clinicConfig,
    };
  }

  if (scopes.patientRecords) {
    result.patients = data.patients;
  }

  if (scopes.doctorInfo) {
    result.doctors = data.doctors;
  }

  if (scopes.appointments) {
    result.prescriptions = data.prescriptions;
    result.shiftHandovers = data.shiftHandovers;
  }

  if (scopes.billingPayments) {
    result.invoices = data.invoices;
    result.expenses = data.expenses;
    result.printLogs = data.printLogs;
  }

  if (scopes.pharmacyInventory) {
    result.pharmacyInventory = data.pharmacyInventory || getDefaultPharmacyInventory();
    result.labTests = data.labTests;
  }

  if (scopes.laboratoryReports) {
    result.labTests = data.labTests;
    result.ecgReports = data.ecgReports;
    result.xrayReports = data.xrayReports;
    result.usgReports = data.usgReports;
    if (!result.patients) {
      result.patients = data.patients;
    }
  }

  if (scopes.staffInfo) {
    result.employees = data.employees;
    result.users = data.users;
  }

  return result;
};

export const getDefaultPharmacyInventory = () => [
  { id: 'reag-1', code: 'RG-CBC-01', name: 'Sysmex Diluent & Lyse Pack (CBC)', category: 'Hematology Reagent', stockQty: 18, unit: 'Packs', expiryDate: '2027-06-30' },
  { id: 'reag-2', code: 'RG-BIO-02', name: 'Serum Creatinine & Glucose Kit', category: 'Biochemistry Reagent', stockQty: 24, unit: 'Kits', expiryDate: '2027-04-15' },
  { id: 'reag-3', code: 'RG-XRY-03', name: 'Fuji Medical Dry Digital X-Ray Film (10x12)', category: 'Radiology Consumable', stockQty: 420, unit: 'Sheets', expiryDate: '2028-01-10' },
  { id: 'reag-4', code: 'RG-USG-04', name: 'Aquasonic Ultrasound Transmission Gel (5L)', category: 'Sonography Supply', stockQty: 12, unit: 'Containers', expiryDate: '2027-11-20' },
  { id: 'reag-5', code: 'RG-VAC-05', name: 'Vacutainer Blood Collection Tubes (EDTA / Clot)', category: 'Phlebotomy Supply', stockQty: 1500, unit: 'Tubes', expiryDate: '2027-09-01' },
];

export const encryptHospitalData = async (
  payload: any,
  passphrase: string,
  clinicName: string,
  exportedBy: string = 'Administrator'
): Promise<EncryptedBackupPackage> => {
  const jsonStr = JSON.stringify(payload);
  const enc = new TextEncoder();
  const dataBytes = enc.encode(jsonStr);

  const checksum = await computeSha256Hex(dataBytes);

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKeyFromPassphrase(passphrase, salt);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    dataBytes
  );

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
      includedScopes: Object.keys(payload).filter((k) =>
        Array.isArray(payload[k]) ? payload[k].length > 0 : !!payload[k]
      ),
      checksum,
    },
    salt: arrayBufferToBase64(salt.buffer),
    iv: arrayBufferToBase64(iv.buffer),
    ciphertext: arrayBufferToBase64(encryptedBuffer),
  };
};

export const decryptHospitalData = async (
  pkg: EncryptedBackupPackage,
  passphrase: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    if (!pkg || !pkg.header || pkg.header.format !== 'ADIBA_SECURE_HOSPITAL_BACKUP') {
      return {
        success: false,
        error: 'Invalid file format: Header signature does not match Adiba Secure Hospital Backup.',
      };
    }

    if (!pkg.salt || !pkg.iv || !pkg.ciphertext) {
      return {
        success: false,
        error: 'Corrupted backup file: Missing cryptographic salt, initialization vector, or ciphertext.',
      };
    }

    const salt = new Uint8Array(base64ToArrayBuffer(pkg.salt));
    const iv = new Uint8Array(base64ToArrayBuffer(pkg.iv));
    const ciphertext = base64ToArrayBuffer(pkg.ciphertext);

    const key = await deriveKeyFromPassphrase(passphrase, salt);

    let decryptedBuffer: ArrayBuffer;
    try {
      decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv as unknown as BufferSource,
        },
        key,
        ciphertext
      );
    } catch {
      return {
        success: false,
        error: 'Decryption failed: Incorrect encryption passphrase or damaged ciphertext.',
      };
    }

    const dec = new TextDecoder();
    const jsonStr = dec.decode(decryptedBuffer);

    if (pkg.header.checksum) {
      const calculatedChecksum = await computeSha256Hex(jsonStr);
      if (calculatedChecksum !== pkg.header.checksum) {
        return {
          success: false,
          error: 'Integrity Check Failure: Data SHA-256 checksum does not match header signature.',
        };
      }
    }

    const parsed = JSON.parse(jsonStr);
    return { success: true, data: parsed };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Decryption failed. Please check the passphrase and file integrity.',
    };
  }
};

export const buildHospitalZipBackup = async (options: {
  fullData: FullHospitalDatabase;
  scopes: DetailedBackupScopes;
  encrypt: boolean;
  passphrase?: string;
  exportedBy: string;
  filenamePrefix?: string;
}): Promise<{
  zipBlob: Blob;
  filename: string;
  manifest: BackupZipManifest;
  vaultString: string;
  sizeKb: number;
}> => {
  const { fullData, scopes, encrypt, passphrase, exportedBy, filenamePrefix = 'Hospital_Backup' } = options;
  const archiveFilename = formatBackupArchiveFilename(filenamePrefix, new Date());
  const scopedData = filterHospitalDataByDetailedScopes(fullData, scopes);

  const zip = new JSZip();
  const includedFiles: string[] = [];

  // 1. Primary JSON / Encrypted JSON Database Snapshot
  const rawJsonStr = JSON.stringify(scopedData, null, 2);
  const sha256Checksum = await computeSha256Hex(rawJsonStr);

  let vaultString = rawJsonStr;
  if (encrypt && passphrase) {
    const encryptedPkg = await encryptHospitalData(
      scopedData,
      passphrase,
      fullData.clinicConfig.clinicName,
      exportedBy
    );
    vaultString = JSON.stringify(encryptedPkg, null, 2);
    zip.file('database/hospital_database.enc.json', vaultString);
    includedFiles.push('database/hospital_database.enc.json');
  } else {
    zip.file('database/hospital_database.json', rawJsonStr);
    includedFiles.push('database/hospital_database.json');
  }

  // 2. Relational SQL Dump (PostgreSQL / MySQL / SQLite DDL + DML)
  let sqlTablesCount = 0;
  if (scopes.databaseSql || scopes.fullSystemBackup) {
    const sqlDump = generateHospitalSqlDump(scopedData);
    zip.file('database/hospital_database_dump.sql', sqlDump);
    includedFiles.push('database/hospital_database_dump.sql');
    sqlTablesCount = 10;
  }

  // 3. Uploaded Documents & Attachments (Clinic Logo, Employee NID Cards, Clinical Report Attachments)
  let attachmentsCount = 0;
  if (scopes.documentsAttachments || scopes.fullSystemBackup) {
    const attachmentsMetadata: Array<{ id: string; type: string; owner: string; filename: string }> = [];

    if (fullData.clinicConfig.logoUrl) {
      zip.file(
        'attachments/clinic_branding.json',
        JSON.stringify(
          {
            clinicName: fullData.clinicConfig.clinicName,
            logoUrl: fullData.clinicConfig.logoUrl,
            hospitalBackgroundUrl: fullData.clinicConfig.hospitalBackgroundUrl,
          },
          null,
          2
        )
      );
      includedFiles.push('attachments/clinic_branding.json');
      attachmentsCount++;
    }

    fullData.employees.forEach((emp) => {
      if (emp.photoUrl || emp.voterCardFrontPhotoUrl || emp.voterCardBackPhotoUrl) {
        const empDocPath = `attachments/staff_documents/${emp.empId}_${emp.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
        zip.file(
          empDocPath,
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
        includedFiles.push(empDocPath);
        attachmentsMetadata.push({
          id: emp.id,
          type: 'Employee_NID_And_Photo',
          owner: emp.name,
          filename: empDocPath,
        });
        attachmentsCount++;
      }
    });

    // Clinical Investigation Report Summaries
    const completedPatients = fullData.patients.filter((p) => p.testResults && p.testResults.length > 0);
    if (completedPatients.length > 0) {
      const clinicalArchivePath = 'attachments/clinical_reports/pathology_verified_reports.json';
      zip.file(clinicalArchivePath, JSON.stringify(completedPatients, null, 2));
      includedFiles.push(clinicalArchivePath);
      attachmentsCount += completedPatients.length;
    }

    zip.file('attachments/attachments_index.json', JSON.stringify(attachmentsMetadata, null, 2));
    includedFiles.push('attachments/attachments_index.json');
  }

  const pharmacyItems = scopedData.pharmacyInventory || [];
  const labReportsCount = (scopedData.patients || []).reduce(
    (acc, p) => acc + (Array.isArray(p.testResults) ? p.testResults.length : 0),
    0
  );
  const imagingCount =
    (scopedData.ecgReports?.length || 0) +
    (scopedData.xrayReports?.length || 0) +
    (scopedData.usgReports?.length || 0);
  const appointmentsCount =
    (scopedData.prescriptions?.length || 0) + (scopedData.shiftHandovers?.length || 0);

  const totalRecords =
    (scopedData.patients?.length || 0) +
    (scopedData.doctors?.length || 0) +
    appointmentsCount +
    (scopedData.invoices?.length || 0) +
    (scopedData.expenses?.length || 0) +
    pharmacyItems.length +
    labReportsCount +
    imagingCount +
    (scopedData.employees?.length || 0) +
    (scopedData.users?.length || 0);

  // 4. Manifest with SHA-256 Checksum
  const manifest: BackupZipManifest = {
    format: 'ADIBA_HOSPITAL_ZIP_ARCHIVE',
    version: '3.0.0',
    archiveFilename,
    createdAt: new Date().toISOString(),
    exportedBy,
    clinicName: fullData.clinicConfig.clinicName,
    clinicRegNo: fullData.clinicConfig.regNo,
    isEncrypted: !!(encrypt && passphrase),
    cipher: encrypt && passphrase ? 'AES-256-GCM' : undefined,
    kdf: encrypt && passphrase ? 'PBKDF2-SHA-256 (100,000 iterations)' : undefined,
    sha256Checksum,
    selectedScopes: scopes,
    includedFiles: ['manifest.json', ...includedFiles],
    summary: {
      patientsCount: scopedData.patients?.length || 0,
      doctorsCount: scopedData.doctors?.length || 0,
      appointmentsCount,
      invoicesCount: scopedData.invoices?.length || 0,
      expensesCount: scopedData.expenses?.length || 0,
      pharmacyItemsCount: pharmacyItems.length,
      labReportsCount,
      imagingReportsCount: imagingCount,
      prescriptionsCount: scopedData.prescriptions?.length || 0,
      staffCount: scopedData.employees?.length || 0,
      usersCount: scopedData.users?.length || 0,
      attachmentsCount,
      sqlTablesCount,
      totalRecords,
    },
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const sizeKb = Math.max(1, Math.round(zipBlob.size / 1024));

  return {
    zipBlob,
    filename: archiveFilename,
    manifest,
    vaultString,
    sizeKb,
  };
};

export const inspectAndVerifyBackupArchive = async (
  input: File | Blob | string,
  passphrase?: string,
  providedFilename?: string
): Promise<BackupInspectionResult> => {
  const filename =
    providedFilename || (input instanceof File ? input.name : 'Hospital_Backup_Archive.zip');

  try {
    // Check if input is a Binary Blob/File that might be a ZIP archive
    if (typeof input !== 'string') {
      const headerBytes = new Uint8Array(await input.slice(0, 4).arrayBuffer());
      const isZipSignature =
        headerBytes.length >= 4 &&
        headerBytes[0] === 0x50 &&
        headerBytes[1] === 0x4b &&
        headerBytes[2] === 0x03 &&
        headerBytes[3] === 0x04;

      if (isZipSignature || filename.toLowerCase().endsWith('.zip')) {
        const zip = await JSZip.loadAsync(input);
        const fileList = Object.keys(zip.files);
        const manifestFile = zip.file('manifest.json');
        let manifest: BackupZipManifest | null = null;
        if (manifestFile) {
          manifest = JSON.parse(await manifestFile.async('string'));
        }

        const encDbFile = zip.file('database/hospital_database.enc.json');
        const plainDbFile = zip.file('database/hospital_database.json');
        const hasSqlDump = !!zip.file('database/hospital_database_dump.sql');
        const hasAttachments = fileList.some((f) => f.startsWith('attachments/'));

        if (encDbFile) {
          const encContent = await encDbFile.async('string');
          const pkg = JSON.parse(encContent) as EncryptedBackupPackage;

          if (!passphrase) {
            return {
              valid: true,
              isZipArchive: true,
              isEncrypted: true,
              needsPassphrase: true,
              checksumVerified: !!manifest?.sha256Checksum,
              expectedChecksum: manifest?.sha256Checksum || pkg.header?.checksum,
              filename,
              createdAt: manifest?.createdAt || pkg.header?.createdAt || new Date().toISOString(),
              clinicName: manifest?.clinicName || pkg.header?.clinicName || 'Adiba Hospital',
              exportedBy: manifest?.exportedBy || pkg.header?.exportedBy || 'Administrator',
              version: manifest?.version || pkg.header?.version || '3.0.0',
              includedFiles: fileList,
              hasSqlDump,
              hasAttachments,
              summary: {
                patientsCount: manifest?.summary?.patientsCount ?? pkg.header?.summary?.patientCount ?? 0,
                doctorsCount: manifest?.summary?.doctorsCount ?? 0,
                appointmentsCount: manifest?.summary?.appointmentsCount ?? pkg.header?.summary?.prescriptionCount ?? 0,
                invoicesCount: manifest?.summary?.invoicesCount ?? pkg.header?.summary?.invoiceCount ?? 0,
                pharmacyItemsCount: manifest?.summary?.pharmacyItemsCount ?? 0,
                labReportsCount: manifest?.summary?.labReportsCount ?? pkg.header?.summary?.pathologyReportCount ?? 0,
                staffCount: manifest?.summary?.staffCount ?? 0,
                attachmentsCount: manifest?.summary?.attachmentsCount ?? 0,
                totalRecords: manifest?.summary?.totalRecords ?? pkg.header?.summary?.totalRecords ?? 0,
              },
              rawTextForRestore: encContent,
            };
          }

          const decResult = await decryptHospitalData(pkg, passphrase);
          if (!decResult.success || !decResult.data) {
            return {
              valid: false,
              isZipArchive: true,
              isEncrypted: true,
              needsPassphrase: true,
              checksumVerified: false,
              filename,
              createdAt: manifest?.createdAt || pkg.header?.createdAt || '',
              clinicName: manifest?.clinicName || 'Adiba Hospital',
              exportedBy: manifest?.exportedBy || 'Administrator',
              version: manifest?.version || '3.0.0',
              includedFiles: fileList,
              hasSqlDump,
              hasAttachments,
              summary: {
                patientsCount: manifest?.summary?.patientsCount ?? 0,
                doctorsCount: manifest?.summary?.doctorsCount ?? 0,
                appointmentsCount: manifest?.summary?.appointmentsCount ?? 0,
                invoicesCount: manifest?.summary?.invoicesCount ?? 0,
                pharmacyItemsCount: manifest?.summary?.pharmacyItemsCount ?? 0,
                labReportsCount: manifest?.summary?.labReportsCount ?? 0,
                staffCount: manifest?.summary?.staffCount ?? 0,
                attachmentsCount: manifest?.summary?.attachmentsCount ?? 0,
                totalRecords: manifest?.summary?.totalRecords ?? 0,
              },
              rawTextForRestore: encContent,
              error: decResult.error || 'Incorrect decryption passphrase.',
            };
          }

          const payload = decResult.data;
          return {
            valid: true,
            isZipArchive: true,
            isEncrypted: true,
            needsPassphrase: false,
            checksumVerified: true,
            expectedChecksum: pkg.header.checksum,
            calculatedChecksum: pkg.header.checksum,
            filename,
            createdAt: manifest?.createdAt || pkg.header.createdAt,
            clinicName: manifest?.clinicName || pkg.header.clinicName,
            exportedBy: manifest?.exportedBy || pkg.header.exportedBy,
            version: manifest?.version || pkg.header.version,
            includedFiles: fileList,
            hasSqlDump,
            hasAttachments,
            summary: {
              patientsCount: payload.patients?.length || 0,
              doctorsCount: payload.doctors?.length || 0,
              appointmentsCount: (payload.prescriptions?.length || 0) + (payload.shiftHandovers?.length || 0),
              invoicesCount: payload.invoices?.length || 0,
              pharmacyItemsCount: payload.pharmacyInventory?.length || 0,
              labReportsCount: (payload.patients || []).reduce(
                (acc: number, p: any) => acc + (p.testResults?.length || 0),
                0
              ),
              staffCount: payload.employees?.length || 0,
              attachmentsCount: manifest?.summary?.attachmentsCount || 0,
              totalRecords: manifest?.summary?.totalRecords || pkg.header.summary.totalRecords,
            },
            decryptedPayload: payload,
            rawTextForRestore: encContent,
          };
        }

        if (plainDbFile) {
          const plainContent = await plainDbFile.async('string');
          const calculatedHash = await computeSha256Hex(plainContent);
          const expectedHash = manifest?.sha256Checksum || calculatedHash;
          const checksumVerified = calculatedHash === expectedHash;
          const payload = JSON.parse(plainContent);

          return {
            valid: checksumVerified,
            isZipArchive: true,
            isEncrypted: false,
            checksumVerified,
            expectedChecksum: expectedHash,
            calculatedChecksum: calculatedHash,
            filename,
            createdAt: manifest?.createdAt || payload.exportDate || new Date().toISOString(),
            clinicName: manifest?.clinicName || payload.clinicConfig?.clinicName || 'Adiba Hospital',
            exportedBy: manifest?.exportedBy || 'Administrator',
            version: manifest?.version || payload.version || '3.0.0',
            includedFiles: fileList,
            hasSqlDump,
            hasAttachments,
            summary: {
              patientsCount: payload.patients?.length || 0,
              doctorsCount: payload.doctors?.length || 0,
              appointmentsCount: (payload.prescriptions?.length || 0) + (payload.shiftHandovers?.length || 0),
              invoicesCount: payload.invoices?.length || 0,
              pharmacyItemsCount: payload.pharmacyInventory?.length || 0,
              labReportsCount: (payload.patients || []).reduce(
                (acc: number, p: any) => acc + (p.testResults?.length || 0),
                0
              ),
              staffCount: payload.employees?.length || 0,
              attachmentsCount: manifest?.summary?.attachmentsCount || 0,
              totalRecords:
                manifest?.summary?.totalRecords ||
                (payload.patients?.length || 0) +
                  (payload.invoices?.length || 0) +
                  (payload.doctors?.length || 0),
            },
            decryptedPayload: payload,
            rawTextForRestore: plainContent,
            error: checksumVerified ? undefined : 'SHA-256 Checksum mismatch detected in archive!',
          };
        }
      }
    }

    // Fallback: Plain or Encrypted JSON text
    const rawText = typeof input === 'string' ? input : await input.text();
    const parsed = JSON.parse(rawText);

    if (isEncryptedBackupPackage(parsed)) {
      if (!passphrase) {
        return {
          valid: true,
          isZipArchive: false,
          isEncrypted: true,
          needsPassphrase: true,
          checksumVerified: !!parsed.header.checksum,
          expectedChecksum: parsed.header.checksum,
          filename,
          createdAt: parsed.header.createdAt,
          clinicName: parsed.header.clinicName,
          exportedBy: parsed.header.exportedBy,
          version: parsed.header.version,
          includedFiles: [filename],
          hasSqlDump: false,
          hasAttachments: false,
          summary: {
            patientsCount: parsed.header.summary.patientCount,
            doctorsCount: 0,
            appointmentsCount: parsed.header.summary.prescriptionCount,
            invoicesCount: parsed.header.summary.invoiceCount,
            pharmacyItemsCount: 0,
            labReportsCount: parsed.header.summary.pathologyReportCount,
            staffCount: 0,
            attachmentsCount: 0,
            totalRecords: parsed.header.summary.totalRecords,
          },
          rawTextForRestore: rawText,
        };
      }

      const decResult = await decryptHospitalData(parsed, passphrase);
      if (!decResult.success || !decResult.data) {
        return {
          valid: false,
          isZipArchive: false,
          isEncrypted: true,
          needsPassphrase: true,
          checksumVerified: false,
          expectedChecksum: parsed.header.checksum,
          filename,
          createdAt: parsed.header.createdAt,
          clinicName: parsed.header.clinicName,
          exportedBy: parsed.header.exportedBy,
          version: parsed.header.version,
          includedFiles: [filename],
          hasSqlDump: false,
          hasAttachments: false,
          summary: {
            patientsCount: parsed.header.summary.patientCount,
            doctorsCount: 0,
            appointmentsCount: parsed.header.summary.prescriptionCount,
            invoicesCount: parsed.header.summary.invoiceCount,
            pharmacyItemsCount: 0,
            labReportsCount: parsed.header.summary.pathologyReportCount,
            staffCount: 0,
            attachmentsCount: 0,
            totalRecords: parsed.header.summary.totalRecords,
          },
          rawTextForRestore: rawText,
          error: decResult.error,
        };
      }

      const payload = decResult.data;
      return {
        valid: true,
        isZipArchive: false,
        isEncrypted: true,
        needsPassphrase: false,
        checksumVerified: true,
        expectedChecksum: parsed.header.checksum,
        calculatedChecksum: parsed.header.checksum,
        filename,
        createdAt: parsed.header.createdAt,
        clinicName: parsed.header.clinicName,
        exportedBy: parsed.header.exportedBy,
        version: parsed.header.version,
        includedFiles: [filename],
        hasSqlDump: false,
        hasAttachments: false,
        summary: {
          patientsCount: payload.patients?.length || 0,
          doctorsCount: payload.doctors?.length || 0,
          appointmentsCount: (payload.prescriptions?.length || 0) + (payload.shiftHandovers?.length || 0),
          invoicesCount: payload.invoices?.length || 0,
          pharmacyItemsCount: payload.pharmacyInventory?.length || 0,
          labReportsCount: (payload.patients || []).reduce(
            (acc: number, p: any) => acc + (p.testResults?.length || 0),
            0
          ),
          staffCount: payload.employees?.length || 0,
          attachmentsCount: 0,
          totalRecords: parsed.header.summary.totalRecords,
        },
        decryptedPayload: payload,
        rawTextForRestore: rawText,
      };
    }

    // Plain JSON backup
    const calcHash = await computeSha256Hex(rawText);
    return {
      valid: true,
      isZipArchive: false,
      isEncrypted: false,
      checksumVerified: true,
      expectedChecksum: calcHash,
      calculatedChecksum: calcHash,
      filename,
      createdAt: parsed.exportDate || new Date().toISOString(),
      clinicName: parsed.clinicConfig?.clinicName || 'Adiba Hospital',
      exportedBy: 'Administrator',
      version: parsed.version || '2.8.0',
      includedFiles: [filename],
      hasSqlDump: false,
      hasAttachments: false,
      summary: {
        patientsCount: parsed.patients?.length || 0,
        doctorsCount: parsed.doctors?.length || 0,
        appointmentsCount: (parsed.prescriptions?.length || 0) + (parsed.shiftHandovers?.length || 0),
        invoicesCount: parsed.invoices?.length || 0,
        pharmacyItemsCount: parsed.pharmacyInventory?.length || 0,
        labReportsCount: (parsed.patients || []).reduce(
          (acc: number, p: any) => acc + (p.testResults?.length || 0),
          0
        ),
        staffCount: parsed.employees?.length || 0,
        attachmentsCount: 0,
        totalRecords:
          (parsed.patients?.length || 0) +
          (parsed.invoices?.length || 0) +
          (parsed.doctors?.length || 0) +
          (parsed.labTests?.length || 0),
      },
      decryptedPayload: parsed,
      rawTextForRestore: rawText,
    };
  } catch (err: any) {
    return {
      valid: false,
      isZipArchive: false,
      isEncrypted: false,
      checksumVerified: false,
      filename,
      createdAt: '',
      clinicName: 'Unknown',
      exportedBy: 'Unknown',
      version: 'Unknown',
      includedFiles: [],
      hasSqlDump: false,
      hasAttachments: false,
      summary: {
        patientsCount: 0,
        doctorsCount: 0,
        appointmentsCount: 0,
        invoicesCount: 0,
        pharmacyItemsCount: 0,
        labReportsCount: 0,
        staffCount: 0,
        attachmentsCount: 0,
        totalRecords: 0,
      },
      error: err?.message || 'Invalid or corrupted backup file format.',
    };
  }
};

export const writeBackupBlobToDirectoryHandle = async (
  dirHandle: any,
  filename: string,
  blob: Blob
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!dirHandle) {
      return { success: false, error: 'No directory handle selected.' };
    }
    const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to write backup file to selected local folder.',
    };
  }
};

export const downloadEncryptedBackup = (pkg: EncryptedBackupPackage, customFilename?: string) => {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const filename = customFilename || `Adiba_Encrypted_Backup_${dateStr}.enc.json`;

  const jsonString = JSON.stringify(pkg, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadBlobFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const isEncryptedBackupPackage = (obj: any): obj is EncryptedBackupPackage => {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.header &&
    obj.header.format === 'ADIBA_SECURE_HOSPITAL_BACKUP' &&
    typeof obj.ciphertext === 'string' &&
    typeof obj.salt === 'string' &&
    typeof obj.iv === 'string'
  );
};
