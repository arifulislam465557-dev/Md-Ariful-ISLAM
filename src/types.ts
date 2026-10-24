export type Language = 'bn' | 'en';
export type ThemeMode = 'classic' | 'modern' | 'dark';

export interface Doctor {
  id: string;
  code: string;
  name: string;
  degree: string;
  specialty: string;
  phone: string;
  roomNo: string;
  fee: number;
}

export type ParameterInputType = 'numeric' | 'text' | 'dropdown' | 'posneg';

export interface ReferenceRangeRule {
  sex?: 'Any' | 'Male' | 'Female';
  minAgeYears?: number;
  maxAgeYears?: number;
  pregnancyStatus?: string;
  method?: string;
  unit?: string;
  rangeText: string;
  lowNormal?: number;
  highNormal?: number;
  criticalLow?: number;
  criticalHigh?: number;
}

export interface SubTest {
  name: string;
  unit: string;
  normalRange: string;
  defaultValue?: string;
  inputType?: ParameterInputType;
  options?: string[];
  method?: string;
  maleRange?: string;
  femaleRange?: string;
  childRange?: string;
  pregnancyRange?: string;
  lowNormal?: number;
  highNormal?: number;
  criticalLow?: number;
  criticalHigh?: number;
  rangeVerified?: boolean;
  referenceRanges?: ReferenceRangeRule[];
}

export interface LabTest {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  normalRange: string;
  price: number;
  sampleType?: string;
  method?: string;
  turnaroundTime?: string;
  isActive?: boolean;
  isSensitive?: boolean;
  rangeVerified?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  inputType?: ParameterInputType;
  options?: string[];
  maleRange?: string;
  femaleRange?: string;
  childRange?: string;
  pregnancyRange?: string;
  lowNormal?: number;
  highNormal?: number;
  criticalLow?: number;
  criticalHigh?: number;
  subTests?: SubTest[];
}

export type PathologyFlagStatus = 'Normal' | 'High' | 'Low' | 'Critical' | 'Abnormal' | string;

export interface TestResultItem {
  testName: string;
  result: string;
  unit: string;
  normalRange: string;
  status: PathologyFlagStatus;
  category?: string;
  method?: string;
  sampleType?: string;
  inputType?: ParameterInputType;
  options?: string[];
  parentTestCode?: string;
  parentTestName?: string;
  maleRange?: string;
  femaleRange?: string;
  childRange?: string;
  pregnancyRange?: string;
  lowNormal?: number;
  highNormal?: number;
  criticalLow?: number;
  criticalHigh?: number;
  isSensitive?: boolean;
  rangeVerified?: boolean;
}

export type PathologyWorkflowStatus =
  | 'Pending'
  | 'Sample Collected'
  | 'Processing'
  | 'Result Entered'
  | 'Under Verification'
  | 'Verified'
  | 'Released'
  | 'Cancelled';

export interface PathologyAuditTrailEntry {
  id: string;
  timestamp: string;
  username: string;
  userFullName: string;
  role: string;
  action: string;
  reason?: string;
  changesSummary: string;
}

export interface Patient {
  id: string;
  pId: string;
  accessionNo?: string;
  invoiceNo?: string;
  invDate: string;
  billDate: string;
  patientName: string;
  age: string;
  dob?: string;
  sex: 'Male' | 'Female' | 'Other';
  pregnancyStatus?: 'Not Applicable' | 'Non-Pregnant' | 'Pregnant (1st Trimester)' | 'Pregnant (2nd Trimester)' | 'Pregnant (3rd Trimester)';
  phone?: string;
  address?: string;
  drCode: string;
  drName: string;
  status: 'Printed' | 'Completed' | 'Pending';
  workflowStatus?: PathologyWorkflowStatus;
  department: string;
  sampleType?: string;
  sampleCollectionTime?: string;
  sampleCollectedBy?: string;
  sampleReceivedTime?: string;
  sampleReceivedBy?: string;
  reportDateTime?: string;
  technicallyValidatedBy?: string;
  technicallyValidatedAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  releasedBy?: string;
  releasedAt?: string;
  labDisclaimer?: string;
  hasCriticalResult?: boolean;
  criticalAcknowledgedBy?: string;
  criticalAcknowledgedAt?: string;
  correctionAuditTrail?: PathologyAuditTrailEntry[];
  comments?: string;
  differentialCount?: number;
  autoPrint?: boolean;
  onlyHgb?: boolean;
  testResults: TestResultItem[];
  createdAt?: string;
}

export interface InvoiceItem {
  testId: string;
  testName: string;
  category: string;
  price: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  pId: string;
  patientName: string;
  age: string;
  sex: 'Male' | 'Female' | 'Other';
  phone: string;
  drCode: string;
  drName: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  discountBy?: string;
  netTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  status: 'Paid' | 'Partial' | 'Due';
  createdAt?: string;
}

export interface OpdAppointment {
  id: string;
  tokenNo: number;
  pId?: string;
  patientName: string;
  phone: string;
  age: string;
  sex: 'Male' | 'Female' | 'Other';
  doctorId: string;
  doctorName: string;
  specialty: string;
  roomNo: string;
  fee: number;
  status: 'Waiting' | 'In Consultation' | 'Completed' | 'Cancelled';
  time: string;
  date?: string;
  chiefComplaints?: string;
  diagnosis?: string;
  vitals?: string;
  patientVitals?: PatientVitals;
  priority?: 'Normal' | 'Urgent' | 'Follow-up' | 'Senior';
  waitingAreaNote?: string;
  checkInTime?: string;
  calledAt?: string;
  completedAt?: string;
}

export interface PatientVitals {
  weight?: number; // kg
  height?: number; // cm
  bpSystolic?: number; // mmHg (e.g. 120)
  bpDiastolic?: number; // mmHg (e.g. 80)
  temperature?: number; // °F (e.g. 98.6)
  pulse?: number; // bpm (e.g. 76)
  spO2?: number; // % (e.g. 98)
  respiratoryRate?: number; // breaths/min
  recordedAt?: string;
  recordedDate?: string;
  recordedBy?: string;
  notes?: string;
}

export interface PrescriptionMedicine {
  name: string;
  dosage: string;
  instruction: string;
  duration: string;
}

export interface Prescription {
  id: string;
  pId?: string;
  patientName: string;
  age: string;
  sex: 'Male' | 'Female' | 'Other';
  phone: string;
  doctorId: string;
  doctorName: string;
  chiefComplaints: string;
  clinicalObservations: string;
  diagnosis: string;
  medicines: PrescriptionMedicine[];
  investigations: string[];
  advice: string;
  followUp: string;
  date: string;
}

export interface PatientVisitHistoryItem {
  id: string;
  visitDate: string;
  visitTime?: string;
  pId: string;
  patientName: string;
  phone?: string;
  age?: string;
  sex?: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  department: string;
  tokenNo?: number;
  chiefComplaints: string;
  vitals?: string;
  diagnosis: string;
  clinicalNotes?: string;
  medicines: PrescriptionMedicine[];
  orderedInvestigations: string[];
  advice?: string;
  followUp?: string;
  fee?: number;
}

export type ShiftType = 'Morning' | 'Evening' | 'Night' | 'Emergency / Custom';

export interface PatientHandoverItem {
  id: string;
  pId: string;
  patientName: string;
  age?: string;
  sex?: 'Male' | 'Female' | 'Other';
  bedOrChamber: string; // e.g., 'Observation Bed 1', 'Room 201', 'Emergency Care', 'OPD Waitlist'
  conditionStatus: 'Critical' | 'Guarded' | 'Stable' | 'Discharged / Left';
  criticalChanges: string; // Concise notes on acute changes in vitals, symptoms, or clinical state
  urgentFollowUps: string; // Actionable follow-ups for the next shift doctor/team
  pendingInvestigations?: string[];
  priority: 'Stat' | 'High' | 'Normal';
  resolved?: boolean;
}

export interface ShiftHandoverNote {
  id: string;
  shiftType: ShiftType;
  shiftDate: string; // YYYY-MM-DD or DD/MM/YYYY
  shiftTime: string; // e.g. "02:00 PM - 08:00 PM"
  outgoingDoctorId: string;
  outgoingDoctorName: string;
  incomingDoctorId?: string;
  incomingDoctorName?: string;
  summary: string; // Concise general overview of shift/ward status
  wardStatus?: {
    totalPatientsSeen?: number;
    observationCount?: number;
    criticalCount?: number;
    transferredCount?: number;
  };
  patientHandovers: PatientHandoverItem[];
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  acknowledgementNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EcgReport {
  id: string;
  pId: string;
  patientName: string;
  age: string;
  sex: string;
  drCode: string;
  heartRate: number;
  rhythm: string;
  prInterval: string;
  qrsDuration: string;
  qtInterval: string;
  axis: string;
  stSegment: string;
  impression: string;
  cardiologist: string;
  date: string;
}

export interface XrayReport {
  id: string;
  pId: string;
  patientName: string;
  age: string;
  sex: string;
  drCode: string;
  investigation: string;
  lungFields: string;
  heartSize: string;
  costophrenicAngles: string;
  bonyCage: string;
  impression: string;
  radiologist: string;
  date: string;
}

export interface UsgReport {
  id: string;
  pId: string;
  patientName: string;
  age: string;
  sex: string;
  drCode: string;
  scanType: string;
  liver: string;
  gallBladder: string;
  kidneys: string;
  spleenPancreas: string;
  urinaryBladder: string;
  uterusAdnexa: string;
  impression: string;
  sonologist: string;
  date: string;
}

export interface ClinicConfig {
  clinicName: string;
  clinicNameBn: string;
  tagline: string;
  taglineBn: string;
  address: string;
  phone: string;
  email: string;
  regNo: string;
  vatRegNo?: string;
  currency?: string;
  pathologistName: string;
  pathologistDegree?: string;
  labInCharge: string;
  logoUrl?: string;
  hospitalBackgroundUrl?: string;
}

export interface SystemLog {
  id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  module: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderRole: 'Lab' | 'Doctor' | 'Reception' | 'Admin';
  message: string;
  timestamp: string;
  channel: 'lab' | 'opd' | 'billing' | 'general';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
  timestamp: string;
  read: boolean;
}

export type AppModuleId =
  | 'pathology'
  | 'billing'
  | 'doctorVisit'
  | 'ecg'
  | 'xray'
  | 'ultrasound'
  | 'doctorPortal'
  | 'incomeExpense'
  | 'employees'
  | 'analytics'
  | 'chat'
  | 'settings'
  | 'lanNetwork';

export interface DiagnosticInstitution {
  id: string;
  institutionCode: string; // e.g. INST-01, INST-02
  nameEn: string;
  nameBn: string;
  district: string;
  branchArea: string;
  address: string;
  contactPhone: string;
  directorName: string;
  status: 'active' | 'locked' | 'killed' | 'warning' | 'expired';
  licenseStatus: 'trial' | 'active' | 'warning' | 'expired' | 'locked';
  licenseDaysRemaining: number;
  licenseExpiresAt: string;
  registeredWorkstationsCount: number;
  activeWorkstationsCount: number;
  allowedModules: AppModuleId[];
  isRemoteLocked: boolean;
  remoteLockReason?: string;
  isRemoteKilled: boolean;
  remoteKillReason?: string;
  lastSyncAt: string;
  todayPatientsCount: number;
  todayTotalRevenue: number;
  monthlyRevenue: number;
  isCurrentBranch?: boolean;
}

export interface WorkstationNode {
  id: string;
  terminalCode: string; // e.g. PC-01, PC-02
  name: string;
  nameBn: string;
  ipAddress: string; // Static LAN IP e.g. 192.168.1.101
  macAddress: string;
  department: 'Reception' | 'Billing' | 'Pathology' | 'Xray' | 'Ultrasound' | 'ECG' | 'Doctor' | 'Admin' | 'Accounts';
  assignedUserId: string;
  defaultModule: AppModuleId;
  status: 'Online' | 'Active' | 'Idle' | 'Offline';
  latencyMs: number;
  lastHeartbeat: string;
  cableType: string;
  portNumber: number; // Switch Port 1 to 10
  currentActiveUser?: string;
  notes?: string;
  // Remote Device Management & Mobile Control
  isRemoteLocked?: boolean;
  remoteLockReason?: string;
  remoteLockedAt?: string;
  isRemoteKilled?: boolean; // Emergency remote kill switch - software shut down by admin
  remoteKillReason?: string;
  remoteKilledAt?: string;
  allowedModulesOverride?: AppModuleId[]; // Admin overrides features enabled for this PC
  offlineAuthSecret?: string;
  lastRemoteCommandAt?: string;
}

export interface ActivityAuditLog {
  id: string;
  timestamp: string;
  ipAddress: string;
  workstationCode: string;
  username: string;
  userFullName: string;
  role: string;
  department: string;
  actionType:
    | 'LOGIN'
    | 'LOGOUT'
    | 'INVOICE_CREATE'
    | 'INVOICE_PRINT'
    | 'PAYMENT_RECEIVED'
    | 'PATHOLOGY_REPORT'
    | 'XRAY_REPORT'
    | 'USG_REPORT'
    | 'ECG_REPORT'
    | 'PRESCRIPTION_CREATE'
    | 'PATIENT_SEARCH'
    | 'SETTINGS_UPDATE'
    | 'LAN_SYNC'
    | 'AUTO_SAVE'
    | 'RECORD_CREATE'
    | 'RECORD_UPDATE'
    | 'SOFT_DELETE'
    | 'RESTORE_RECORD'
    | 'PERMANENT_DELETE'
    | 'UNAUTHORIZED_DELETE_ATTEMPT'
    | 'PDF_EXPORT';
  patientId?: string;
  patientName?: string;
  details: string;
  entityType?: string;
  recordId?: string;
}

export interface InvoicePrintLog {
  id: string;
  invoiceId: string;
  invoiceNo: string;
  pId: string;
  patientName: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  printedAt: string;
  printedByUserId: string;
  printedByUserName: string;
  userRole?: string;
  workstationCode: string;
  copies: number;
}

export type BackupType =
  | 'Daily Auto'
  | 'Manual JSON'
  | 'Manual SQL'
  | 'Encrypted JSON'
  | 'Automated Encrypted';

export interface BackupHistoryEntry {
  id: string;
  date: string;
  type: BackupType;
  filename: string;
  recordsCount: number;
  sizeKb: number;
  status: 'Success' | 'Restored';
  isEncrypted?: boolean;
  encryptionAlgorithm?: string;
  checksum?: string;
  scopes?: string[];
  vaultData?: string; // Stored payload (encrypted or plain string) for local quick-restore / download
  summary?: {
    patients?: number;
    invoices?: number;
    labTests?: number;
    prescriptions?: number;
    imaging?: number;
  };
}

export type AutoBackupFrequency = 'hourly' | 'every_6h' | 'every_12h' | 'daily';

export interface AutoBackupScheduleConfig {
  enabled: boolean;
  frequency: AutoBackupFrequency;
  lastRunTimestamp: string | null;
  nextRunTimestamp: string | null;
  autoDownload: boolean; // Trigger browser download prompt automatically
  saveToLocalVault: boolean; // Save encrypted package in local browser vault
  encryptBackups: boolean;
  encryptionPassphrase?: string;
  maxRetainedBackups: number;
  scopes: {
    patients: boolean;
    clinicalReports: boolean;
    billing: boolean;
    mastersAndStaff: boolean;
  };
}

export interface EncryptedBackupPackage {
  header: {
    format: 'ADIBA_SECURE_HOSPITAL_BACKUP';
    version: string;
    cipher: 'AES-256-GCM';
    kdf: 'PBKDF2-SHA-256';
    iterations: number;
    clinicName: string;
    createdAt: string;
    exportedBy: string;
    summary: {
      patientCount: number;
      invoiceCount: number;
      prescriptionCount: number;
      pathologyReportCount: number;
      ecgReportCount: number;
      xrayReportCount: number;
      usgReportCount: number;
      totalRecords: number;
    };
    includedScopes: string[];
    checksum: string; // SHA-256 hash of original unencrypted payload for integrity
  };
  salt: string; // base64
  iv: string; // base64
  ciphertext: string; // base64
}

export interface Employee {
  id: string;
  empId: string;
  name: string;
  fatherName: string;
  motherName: string;
  voterId: string; // NID / Voter ID
  email: string;
  phone: string;
  photoUrl?: string;
  voterCardFrontPhotoUrl?: string; // Voter card front photo
  voterCardBackPhotoUrl?: string; // Voter card back photo
  designation: string;
  department: string;
  joiningDate: string;
  salary: number;
  bloodGroup?: string;
  address?: string;
  emergencyContact?: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  notes?: string;
  createdAt?: string;
}

export interface ExpenseItem {
  id: string;
  voucherNo: string;
  title: string;
  category:
    | 'Salary'
    | 'Reagents & Chemicals'
    | 'Rent'
    | 'Electricity & Utility'
    | 'Maintenance'
    | 'Stationery & Printing'
    | 'Doctor Commission'
    | 'Refreshment'
    | 'Other';
  amount: number;
  date: string;
  vouchedBy: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'bKash/Nagad' | 'Cheque';
  note?: string;
  createdAt?: string;
}

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: 'Admin' | 'Lab' | 'Xray' | 'Ultrasound' | 'Doctor' | 'Billing' | 'Staff';
  allowedModules: AppModuleId[];
  isActive: boolean;
  createdAt: string;
  phone?: string;
  avatarColor?: string;
  assignedWorkstation?: string;
  assignedStaticIp?: string;
}
export interface LicenseRenewalRecord {
  id: string;
  renewedAt: string;
  previousExpiresAt: string;
  newExpiresAt: string;
  workstationCode?: string;
}

export interface LicenseSecurityState {
  isActivated: boolean;
  installedAt: string;
  currentPeriodStart: string;
  expiresAt: string;
  lastCheckedAt: string;
  totalRenewals: number;
  lastRenewedAt?: string;
  status: 'active' | 'warning' | 'expired' | 'tampered' | 'unactivated' | 'trial' | 'trial_expired';
  daysRemaining: number;
  hoursRemaining: number;
  isTrial?: boolean;
  trialExpiresAt?: string;
  trialDaysRemaining?: number;
  trialHoursRemaining?: number;
  subscriptionPhone: string;
  renewalHistory: LicenseRenewalRecord[];
  signature: string;
}

export type AutoSaveStatus =
  | 'idle'
  | 'saving'
  | 'saved'
  | 'error'
  | 'offline_draft'
  | 'conflict_merged';

export type DeletableEntityType =
  | 'patient'
  | 'invoice'
  | 'doctor'
  | 'labTest'
  | 'pathologyReport'
  | 'ecgReport'
  | 'xrayReport'
  | 'usgReport'
  | 'prescription'
  | 'opdAppointment'
  | 'employee'
  | 'expense'
  | 'shiftHandover'
  | 'userAccount'
  | 'backupHistory'
  | 'medicine';

export interface SoftDeletedRecord {
  id: string;
  recordId: string;
  entityType: DeletableEntityType;
  entityLabel: string;
  recordTitle: string;
  recordSubtitle?: string;
  deletedAt: string;
  deletedByUserId: string;
  deletedByUsername: string;
  deletedByFullName: string;
  deletedByRole: string;
  deletionReason: string;
  dependenciesSummary?: string[];
  originalData: any;
}

export interface PrintRecordEntry {
  id: string;
  documentType:
    | 'PATHOLOGY_REPORT'
    | 'BILLING_INVOICE'
    | 'PRESCRIPTION_RX'
    | 'PATIENT_HISTORY'
    | 'ECG_REPORT'
    | 'XRAY_REPORT'
    | 'USG_REPORT'
    | 'FINANCIAL_STATEMENT'
    | 'OTHER_DOCUMENT';
  documentTitle: string;
  documentId: string;
  pId: string;
  patientName: string;
  printedByUserId: string;
  printedByUsername: string;
  printedByFullName: string;
  printedByRole: string;
  workstationCode: string;
  printedAt: string;
  actionType: 'PRINT' | 'PDF_DOWNLOAD' | 'PDF_EXPORT';
  version: number;
  isReprint: boolean;
  snapshotSummary?: string;
}

export interface OpdAppointmentRecord {
  id: string;
  tokenNo: string;
  pId: string;
  patientName: string;
  age: string;
  gender: string;
  phone: string;
  doctorId: string;
  doctorName: string;
  date: string;
  timeSlot: string;
  visitType: 'New Visit' | 'Follow-up' | 'Report Check' | 'Emergency';
  fee: number;
  paymentStatus: 'Paid' | 'Unpaid';
  status: 'Waiting' | 'In Consultation' | 'Completed' | 'Cancelled';
  chiefComplaint?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DeleteRequestPayload {
  entityType: DeletableEntityType;
  entityLabel: string;
  recordId: string;
  recordTitle: string;
  recordSubtitle?: string;
  dependencies?: string[];
  originalData: any;
  onSuccess?: () => void;
}

export interface ActiveModuleDrafts {
  pathologyFormDraft?: Record<string, any>;
  billingFormDraft?: Record<string, any>;
  doctorVisitDraft?: Record<string, any>;
  doctorPortalDraft?: Record<string, any>;
  ecgFormDraft?: Record<string, any>;
  xrayFormDraft?: Record<string, any>;
  usgFormDraft?: Record<string, any>;
  employeeFormDraft?: Record<string, any>;
  expenseFormDraft?: Record<string, any>;
  settingsFormDraft?: Record<string, any>;
  updatedAt?: string;
  updatedBy?: string;
}

