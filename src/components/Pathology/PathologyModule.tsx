import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Patient,
  TestResultItem,
  LabTest,
  PathologyWorkflowStatus,
  PathologyAuditTrailEntry,
} from '../../types';
import { PathologyReportModal } from './PathologyReportModal';
import { AddCustomTestModal } from './AddCustomTestModal';
import { AdminTestMasterPanel } from './AdminTestMasterPanel';
import {
  RotateCcw,
  Search,
  Plus,
  Eye,
  Trash2,
  Printer,
  Save,
  UserPlus,
  FileText,
  CheckCircle,
  FlaskConical,
  Layers,
  Clock,
  ArrowDownToLine,
  CheckCheck,
  Settings2,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Unlock,
  History,
  CheckCircle2,
  Sparkles,
  FileCheck2,
  Activity,
} from 'lucide-react';
import {
  classifyTestItem,
  PATHOLOGY_DEPARTMENTS,
  convertInvoiceItemsToTestResults,
  expandLabTestToResultItems,
  resolveDynamicReferenceRange,
  evaluateResultFlag,
} from '../../utils/pathologyUtils';
import { DEFAULT_LAB_CATEGORIES } from '../../utils/pathologyCategories';
import { getTodayDateStr } from '../../utils/dateUtils';

const WORKFLOW_STEPS: {
  status: PathologyWorkflowStatus;
  labelEn: string;
  labelBn: string;
  color: string;
}[] = [
  { status: 'Pending', labelEn: '1. Pending', labelBn: '১. পেন্ডিং', color: 'bg-slate-600' },
  { status: 'Sample Collected', labelEn: '2. Sample Collected', labelBn: '২. নমুনা সংগৃহীত', color: 'bg-blue-600' },
  { status: 'Processing', labelEn: '3. In Analyzer / Processing', labelBn: '৩. প্রসেসিং চলছে', color: 'bg-indigo-600' },
  { status: 'Result Entered', labelEn: '4. Result Entered', labelBn: '৪. ফলাফল এন্ট্রি সম্পন্ন', color: 'bg-amber-600' },
  { status: 'Under Verification', labelEn: '5. Technical Validation', labelBn: '৫. টেকনিক্যাল ভ্যালিডেশন', color: 'bg-purple-600' },
  { status: 'Verified', labelEn: '6. Pathologist Verified', labelBn: '৬. ভেরিফাইড', color: 'bg-emerald-600' },
  { status: 'Released', labelEn: '7. Final Released', labelBn: '৭. চূড়ান্ত রিলিজড', color: 'bg-teal-700' },
];

const DEFAULT_DISCLAIMER =
  'Laboratory investigations should be clinically correlated with patient history. Automated analyzer results verified by internal QC.';

export const PathologyModule: React.FC = () => {
  const {
    patients,
    addPatient,
    updatePatient,
    deletePatient,
    doctors,
    addDoctor,
    labTests,
    addLabTest,
    invoices,
    t,
    lang,
    theme,
    currentWorkstation,
    currentUser,
    clinicConfig,
    addAuditLog,
    broadcastLanEvent,
    activeDrafts,
    updateModuleDraft,
    isAdminUser,
    requestDeleteRecord,
  } = useApp();

  // Top-level view mode: Lab Worklist & Report Entry vs Admin Test Master & Template Designer
  const [moduleMode, setModuleMode] = useState<'worklist' | 'testMaster'>('worklist');

  // Active patient record tracking (supports multiple reports/accessions per PID)
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [accessionNo, setAccessionNo] = useState<string>(() => `ACC-${Date.now().toString().slice(-6)}`);
  const [invoiceNo, setInvoiceNo] = useState<string>('');
  const [billDate, setBillDate] = useState<string>(() => getTodayDateStr(false));
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState<'Male' | 'Female' | 'Other' | ''>('');
  const [pregnancyStatus, setPregnancyStatus] = useState<
    'Not Applicable' | 'Non-Pregnant' | 'Pregnant (1st Trimester)' | 'Pregnant (2nd Trimester)' | 'Pregnant (3rd Trimester)'
  >('Non-Pregnant');
  const [drCode, setDrCode] = useState('');
  const [sampleType, setSampleType] = useState('EDTA Whole Blood / Serum');
  const [sampleCollectionTime, setSampleCollectionTime] = useState<string>('');
  const [sampleReceivedTime, setSampleReceivedTime] = useState<string>('');
  const [reportDateTime, setReportDateTime] = useState<string>('');
  const [workflowStatus, setWorkflowStatus] = useState<PathologyWorkflowStatus>('Pending');
  const [technicallyValidatedBy, setTechnicallyValidatedBy] = useState<string>('');
  const [verifiedBy, setVerifiedBy] = useState<string>('');
  const [releasedBy, setReleasedBy] = useState<string>('');
  const [labDisclaimer, setLabDisclaimer] = useState<string>(DEFAULT_DISCLAIMER);
  const [comments, setComments] = useState('');
  const [autoPrint, setAutoPrint] = useState(true);
  const [testResults, setTestResults] = useState<TestResultItem[]>([]);

  // Clinical Safety & Audit Trail state
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionAuditTrail, setCorrectionAuditTrail] = useState<PathologyAuditTrailEntry[]>([]);
  const [criticalNotifiedTo, setCriticalNotifiedTo] = useState('');
  const [sensitiveUnlocked, setSensitiveUnlocked] = useState(false);

  // Filters & Modals
  const [testSearchInput, setTestSearchInput] = useState('');
  const [quickCategoryFilter, setQuickCategoryFilter] = useState<string>('ALL');
  const [patientSearchInput, setPatientSearchInput] = useState('');
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [showCustomTestModal, setShowCustomTestModal] = useState(false);
  const [selectedPatientForReport, setSelectedPatientForReport] = useState<Patient | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sidebar tab
  const [sidebarTab, setSidebarTab] = useState<'receptionQueue' | 'savedReports'>('receptionQueue');

  // New Doctor form state for modal
  const [newDocCode, setNewDocCode] = useState(`DR0${doctors.length + 1}`);
  const [newDocName, setNewDocName] = useState('');
  const [newDocDegree, setNewDocDegree] = useState('MBBS, FCPS');
  const [newDocSpecialty, setNewDocSpecialty] = useState('Specialist Physician');
  const [newDocPhone, setNewDocPhone] = useState('+880 17');
  const [newDocRoom, setNewDocRoom] = useState('201');
  const [newDocFee, setNewDocFee] = useState(800);

  const matchedDoctor = doctors.find(
    (d) => d.code.toUpperCase() === drCode.trim().toUpperCase()
  );

  const activeLabTests = useMemo(
    () => labTests.filter((t) => t.isActive !== false),
    [labTests]
  );

  // Role-based access check for Sensitive Tests (HIV, HBsAg, Anti-HCV, VDRL) and Report Verification
  const isAuthorizedRole = useMemo(() => {
    const role = (currentUser?.role || 'admin').toLowerCase();
    return (
      role.includes('admin') ||
      role.includes('doctor') ||
      role.includes('pathologist') ||
      role.includes('lab') ||
      sensitiveUnlocked
    );
  }, [currentUser, sensitiveUnlocked]);

  const hasSensitiveTests = useMemo(
    () =>
      testResults.some(
        (tr) =>
          tr.isSensitive ||
          ['hiv', 'hbsag', 'anti-hcv', 'hcv', 'vdrl', 'rpr'].some((kw) =>
            (tr.testName || '').toLowerCase().includes(kw)
          )
      ),
    [testResults]
  );

  const criticalItems = useMemo(
    () => testResults.filter((tr) => tr.status === 'Critical' && tr.result.trim() !== ''),
    [testResults]
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const capitalize = (str: string) => str.replace(/\b\w/g, (c) => c.toUpperCase());

  const handlePatientNameChange = (val: string) => {
    setPatientName(capitalize(val));
  };

  // Re-evaluate reference ranges and flags whenever patient Sex, Age, or Pregnancy Status changes
  useEffect(() => {
    if (testResults.length === 0) return;
    setTestResults((prev) =>
      prev.map((item) => {
        const updatedRange = resolveDynamicReferenceRange(
          item,
          sex,
          age,
          pregnancyStatus
        );
        const updatedStatus = evaluateResultFlag(
          item.result,
          { ...item, normalRange: updatedRange },
          sex,
          age,
          pregnancyStatus
        );
        return {
          ...item,
          normalRange: updatedRange || item.normalRange,
          status: updatedStatus,
        };
      })
    );
  }, [sex, age, pregnancyStatus]);

  // Auto-Save active Pathology Report & Form Draft on any input change
  useEffect(() => {
    const hasContent =
      patientName.trim() !== '' ||
      patientId.trim() !== '' ||
      testResults.length > 0 ||
      comments.trim() !== '';
    if (!hasContent) return;

    const timer = setTimeout(() => {
      updateModuleDraft('pathologyFormDraft', {
        activeRecordId,
        accessionNo,
        invoiceNo,
        billDate,
        patientId,
        patientName,
        age,
        dob,
        sex,
        pregnancyStatus,
        drCode,
        sampleType,
        workflowStatus,
        comments,
        testResults,
      });

      // If an existing patient record is loaded, auto-save changes directly into permanent patient record
      if (activeRecordId) {
        const safeSex: 'Male' | 'Female' | 'Other' = (sex as any) || 'Other';
        updatePatient(activeRecordId, {
          pId: patientId.trim() || 'N/A',
          accessionNo,
          invoiceNo: invoiceNo || undefined,
          billDate,
          patientName: patientName.trim() || 'Patient',
          age: age || 'N/A',
          dob: dob || undefined,
          sex: safeSex,
          pregnancyStatus,
          drCode: drCode || 'N/A',
          drName: matchedDoctor?.name || drCode || 'N/A',
          sampleType,
          workflowStatus,
          technicallyValidatedBy: technicallyValidatedBy || clinicConfig.labInCharge,
          verifiedBy: verifiedBy || undefined,
          releasedBy: releasedBy || undefined,
          labDisclaimer,
          comments,
          testResults,
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    activeRecordId,
    accessionNo,
    invoiceNo,
    billDate,
    patientId,
    patientName,
    age,
    dob,
    sex,
    pregnancyStatus,
    drCode,
    sampleType,
    workflowStatus,
    technicallyValidatedBy,
    verifiedBy,
    releasedBy,
    labDisclaimer,
    comments,
    testResults,
  ]);

  /**
   * Intelligently merges formatted test panels generated from an invoice
   * with any existing values the technologist had already entered.
   */
  const mergeInvoiceTestsWithExisting = (
    invItems: any[],
    existingResults: TestResultItem[],
    pSex?: string,
    pAge?: string,
    pPreg?: string
  ): TestResultItem[] => {
    const formattedFromInvoice = convertInvoiceItemsToTestResults(
      invItems,
      labTests,
      pSex,
      pAge,
      pPreg
    );
    if (!existingResults || existingResults.length === 0) return formattedFromInvoice;

    const existingMap = new Map<string, string>();
    existingResults.forEach((r) => {
      if (r.result && r.result.trim()) {
        existingMap.set(r.testName.toLowerCase().trim(), r.result);
      }
    });

    return formattedFromInvoice.map((item) => {
      const matchVal = existingMap.get(item.testName.toLowerCase().trim());
      if (matchVal !== undefined) {
        const status = evaluateResultFlag(matchVal, item, pSex, pAge, pPreg);
        return { ...item, result: matchVal, status };
      }
      return item;
    });
  };

  /**
   * Lookup by Patient ID, Invoice No, or Accession No.
   */
  const lookupAndFillPatient = (targetQuery: string, silent: boolean = false, targetInvoiceNo?: string) => {
    const cleanQuery = targetQuery.trim();
    if (!cleanQuery) return false;

    const foundInvoice = targetInvoiceNo
      ? invoices.find((i) => i.invoiceNo.toLowerCase() === targetInvoiceNo.toLowerCase())
      : invoices.find(
          (i) =>
            i.pId.toLowerCase() === cleanQuery.toLowerCase() ||
            i.invoiceNo.toLowerCase() === cleanQuery.toLowerCase()
        );

    const foundPatient = targetInvoiceNo
      ? patients.find((p) => p.invoiceNo?.toLowerCase() === targetInvoiceNo.toLowerCase())
      : patients.find(
          (p) =>
            p.pId.toLowerCase() === cleanQuery.toLowerCase() ||
            (p.accessionNo && p.accessionNo.toLowerCase() === cleanQuery.toLowerCase())
        );

    if (foundInvoice) {
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setActiveRecordId(foundPatient?.id || null);
      setAccessionNo(foundPatient?.accessionNo || `ACC-${foundInvoice.invoiceNo.replace(/\D/g, '').slice(-6) || Date.now().toString().slice(-6)}`);
      setInvoiceNo(foundInvoice.invoiceNo);
      setPatientId(foundInvoice.pId);
      setPatientName(foundInvoice.patientName);
      const nextAge = foundInvoice.age || foundPatient?.age || '';
      const nextSex = (foundInvoice.sex as any) || (foundPatient?.sex as any) || '';
      setAge(nextAge);
      setSex(nextSex);
      setDrCode(foundInvoice.drCode || foundPatient?.drCode || '');
      setBillDate(foundInvoice.date || foundPatient?.billDate || getTodayDateStr(false));
      setSampleCollectionTime(foundPatient?.sampleCollectionTime || `${getTodayDateStr(false)} ${nowTime}`);
      setSampleReceivedTime(foundPatient?.sampleReceivedTime || `${getTodayDateStr(false)} ${nowTime}`);
      setReportDateTime(foundPatient?.reportDateTime || `${getTodayDateStr(false)} ${nowTime}`);
      setWorkflowStatus(foundPatient?.workflowStatus || 'Sample Collected');
      setTechnicallyValidatedBy(foundPatient?.technicallyValidatedBy || '');
      setVerifiedBy(foundPatient?.verifiedBy || '');
      setReleasedBy(foundPatient?.releasedBy || '');
      setCorrectionAuditTrail(foundPatient?.correctionAuditTrail || []);
      if (foundPatient?.comments) setComments(foundPatient.comments);
      if (foundPatient?.autoPrint !== undefined) setAutoPrint(foundPatient.autoPrint);

      const formatted = mergeInvoiceTestsWithExisting(
        foundInvoice.items,
        foundPatient?.testResults || [],
        nextSex,
        nextAge,
        pregnancyStatus
      );
      setTestResults(formatted);

      if (!silent) {
        showToast(
          lang === 'bn'
            ? `✓ রসিদ #${foundInvoice.invoiceNo} থেকে ${foundInvoice.patientName} এর সকল (${formatted.length}টি) টেস্ট টেমপ্লেট লোড হয়েছে!`
            : `✓ Loaded all ${formatted.length} test parameters from invoice #${foundInvoice.invoiceNo} for ${foundInvoice.patientName}!`
        );
      }
      return true;
    }

    if (foundPatient) {
      loadPatient(foundPatient);
      return true;
    }

    if (!silent) {
      showToast(
        lang === 'bn'
          ? `পেশেন্ট আইডি ${cleanQuery} পাওয়া যায়নি। নতুন তথ্য পূরণ করুন।`
          : `Patient ID ${cleanQuery} not found. Please enter details.`
      );
    }
    return false;
  };

  const handlePatientIdChange = (val: string) => {
    setPatientId(val);
    const trimmed = val.trim();
    if (trimmed.length >= 3) {
      const matchP = patients.find((p) => p.pId.toLowerCase() === trimmed.toLowerCase());
      const matchI = invoices.find((i) => i.pId.toLowerCase() === trimmed.toLowerCase());
      if (matchP || matchI) {
        lookupAndFillPatient(trimmed, false);
      }
    }
  };

  useEffect(() => {
    const today = getTodayDateStr(false);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setBillDate(today);
    setSampleCollectionTime(`${today} ${nowTime}`);
    setSampleReceivedTime(`${today} ${nowTime}`);
    setReportDateTime(`${today} ${nowTime}`);
  }, []);

  const generateNewPatient = () => {
    const today = getTodayDateStr(false);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setActiveRecordId(null);
    setAccessionNo(`ACC-${Date.now().toString().slice(-6)}`);
    setInvoiceNo('');
    setPatientId('');
    setPatientName('');
    setAge('');
    setDob('');
    setSex('');
    setPregnancyStatus('Non-Pregnant');
    setDrCode('');
    setComments('');
    setBillDate(today);
    setSampleCollectionTime(`${today} ${nowTime}`);
    setSampleReceivedTime(`${today} ${nowTime}`);
    setReportDateTime(`${today} ${nowTime}`);
    setWorkflowStatus('Pending');
    setTechnicallyValidatedBy('');
    setVerifiedBy('');
    setReleasedBy('');
    setCorrectionReason('');
    setCorrectionAuditTrail([]);
    setCriticalNotifiedTo('');
    setTestResults([]);
    setTestSearchInput('');
    showToast(
      lang === 'bn'
        ? `ফর্ম ক্লিয়ার হয়েছে এবং নতুন অ্যাকসেশন নম্বর সেট হয়েছে`
        : `Form cleared and new Accession No generated`
    );
  };

  const loadPatient = (pat: Patient) => {
    const today = getTodayDateStr(false);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setActiveRecordId(pat.id);
    setAccessionNo(pat.accessionNo || `ACC-${pat.pId}`);
    setInvoiceNo(pat.invoiceNo || '');
    setPatientId(pat.pId);
    setPatientName(pat.patientName);
    setAge(pat.age);
    setDob(pat.dob || '');
    setSex(pat.sex as any);
    setPregnancyStatus(pat.pregnancyStatus || 'Non-Pregnant');
    setDrCode(pat.drCode);
    setBillDate(pat.billDate || pat.invDate || today);
    setSampleType(pat.sampleType || 'EDTA Whole Blood / Serum');
    setSampleCollectionTime(pat.sampleCollectionTime || `${pat.billDate || today} 09:00 AM`);
    setSampleReceivedTime(pat.sampleReceivedTime || `${pat.billDate || today} 09:30 AM`);
    setReportDateTime(pat.reportDateTime || `${today} ${nowTime}`);
    setWorkflowStatus(
      pat.workflowStatus || (pat.status === 'Printed' ? 'Released' : pat.status === 'Completed' ? 'Verified' : 'Result Entered')
    );
    setTechnicallyValidatedBy(pat.technicallyValidatedBy || clinicConfig.labInCharge || '');
    setVerifiedBy(pat.verifiedBy || (pat.status === 'Completed' || pat.status === 'Printed' ? clinicConfig.pathologistName : ''));
    setReleasedBy(pat.releasedBy || '');
    setLabDisclaimer(pat.labDisclaimer || DEFAULT_DISCLAIMER);
    setCorrectionAuditTrail(pat.correctionAuditTrail || []);
    setCorrectionReason('');
    setComments(pat.comments || '');
    if (pat.autoPrint !== undefined) setAutoPrint(pat.autoPrint);

    const inv = pat.invoiceNo
      ? invoices.find((i) => i.invoiceNo === pat.invoiceNo)
      : invoices.find((i) => i.pId.toLowerCase() === pat.pId.toLowerCase());

    if (inv && inv.items.length > 0 && (!pat.testResults || pat.testResults.length === 0)) {
      const formatted = mergeInvoiceTestsWithExisting(
        inv.items,
        pat.testResults || [],
        pat.sex,
        pat.age,
        pat.pregnancyStatus
      );
      setTestResults(formatted);
    } else {
      setTestResults(pat.testResults || []);
    }
    showToast(
      lang === 'bn'
        ? `✓ ${pat.patientName} (${pat.accessionNo || pat.pId}) এর ল্যাব রিপোর্ট লোড হয়েছে`
        : `✓ Loaded lab report for ${pat.patientName} (${pat.accessionNo || pat.pId})`
    );
  };

  const handleAddTestFromSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = testSearchInput.trim();
    if (!query) {
      setShowAddTestModal(true);
      return;
    }
    const match = activeLabTests.find(
      (t) =>
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.code.toLowerCase() === query.toLowerCase()
    );

    if (match) {
      addTestToResults(match);
    } else {
      setShowAddTestModal(true);
    }
    setTestSearchInput('');
  };

  /**
   * Expands a Ready-Made Template into the Report Entry Table with strictly EMPTY results ('')
   * so no fake or imaginary values are ever pre-populated.
   */
  const addTestToResults = (test: LabTest) => {
    const newItems = expandLabTestToResultItems(test, sex, age, pregnancyStatus);
    if (test.sampleType && (!sampleType || sampleType === 'EDTA Whole Blood / Serum')) {
      setSampleType(test.sampleType);
    }
    setTestResults((prev) => [...prev, ...newItems]);
    if (workflowStatus === 'Pending') {
      setWorkflowStatus('Sample Collected');
      const nowStr = `${getTodayDateStr(false)} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      if (!sampleCollectionTime) setSampleCollectionTime(nowStr);
      if (!sampleReceivedTime) setSampleReceivedTime(nowStr);
    }
    showToast(
      lang === 'bn'
        ? `✓ ${test.name} টেমপ্লেট (${newItems.length}টি প্যারামিটার) যুক্ত হয়েছে — ফলাফল এন্ট্রির জন্য প্রস্তুত`
        : `✓ Added ${test.name} template (${newItems.length} parameters) ready for result entry`
    );
  };

  const addRbsAndUrineCombo = () => {
    const rbsTest = activeLabTests.find((t) => t.code === 'RBS');
    const urineTest = activeLabTests.find((t) => t.code === 'U_RE');

    const newItems: TestResultItem[] = [];
    if (rbsTest) {
      newItems.push(...expandLabTestToResultItems(rbsTest, sex, age, pregnancyStatus));
    }
    if (urineTest) {
      newItems.push(...expandLabTestToResultItems(urineTest, sex, age, pregnancyStatus));
    }

    setTestResults((prev) => [...prev, ...newItems]);
    showToast(
      lang === 'bn'
        ? 'আরবিএস (বায়োকেমিস্ট্রি) ও ইউরিন রুটিন টেমপ্লেট যুক্ত হয়েছে (আলাদা আলাদা পেইজে প্রিন্ট হবে)'
        : 'Added RBS (Biochemistry) & Urine R/E templates (configured for separate pages)'
    );
  };

  const addEmptyRow = () => {
    setTestResults((prev) => [
      ...prev,
      {
        testName: '',
        result: '',
        unit: '',
        normalRange: '',
        status: 'Normal',
        inputType: 'text',
      },
    ]);
  };

  const handleAddCustomTest = (
    item: TestResultItem,
    saveToCatalog: boolean,
    catalogDetails?: { category: string; price: number }
  ) => {
    // Ensure custom added template never pre-fills fake result unless explicitly entered for this patient
    setTestResults((prev) => [...prev, { ...item }]);
    if (saveToCatalog) {
      addLabTest({
        code: `CUST_${Date.now().toString().slice(-4)}`,
        name: item.testName,
        unit: item.unit,
        normalRange: item.normalRange,
        category: catalogDetails?.category || 'Biochemistry',
        price: catalogDetails?.price || 300,
        method: item.method || 'Standard Clinical Assay',
        sampleType: item.sampleType || 'Serum / Blood',
        isActive: true,
      });
      showToast(
        lang === 'bn'
          ? `${item.testName} টেস্ট ও মাস্টার ক্যাটালগে যুক্ত হয়েছে!`
          : `Added ${item.testName} to report & test catalog!`
      );
    } else {
      showToast(
        lang === 'bn'
          ? `${item.testName} টেস্ট যোগ করা হয়েছে!`
          : `Added ${item.testName} to report!`
      );
    }
  };

  const removeRow = (index: number) => {
    const targetRow = testResults[index];
    if (!isAdminUser && (workflowStatus === 'Verified' || workflowStatus === 'Released')) {
      requestDeleteRecord({
        entityType: 'pathologyReport',
        entityLabel: 'ভেরিফাইড প্যাথলজি প্যারামিটার সারি (Verified Lab Row)',
        recordId: activeRecordId || accessionNo,
        recordTitle: `${targetRow?.testName || 'Parameter Row'} — ${patientName || patientId}`,
        recordSubtitle: `Status: ${workflowStatus} (Only Admin can delete from Verified/Released reports)`,
        originalData: targetRow,
      });
      return;
    }
    setTestResults((prev) => prev.filter((_, i) => i !== index));
    showToast(lang === 'bn' ? 'টেস্ট সারি মুছে ফেলা হয়েছে' : 'Test parameter row removed');
  };

  const updateRow = (index: number, field: keyof TestResultItem, value: string) => {
    const updated = [...testResults];
    const prevVal = updated[index][field] as string;
    updated[index] = { ...updated[index], [field]: value };

    // Automatic Low / Normal / High / Critical evaluation
    if (field === 'result') {
      updated[index].status = evaluateResultFlag(
        value,
        updated[index],
        sex,
        age,
        pregnancyStatus
      );

      // Advance workflow status to 'Result Entered' when results are typed
      if (
        value.trim() &&
        (workflowStatus === 'Pending' ||
          workflowStatus === 'Sample Collected' ||
          workflowStatus === 'Processing')
      ) {
        setWorkflowStatus('Result Entered');
      }

      // If report was already Verified or Released, log to Correction Audit Trail
      if (
        (workflowStatus === 'Verified' || workflowStatus === 'Released') &&
        prevVal !== value
      ) {
        const auditEntry: PathologyAuditTrailEntry = {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          username: currentUser?.username || 'lab_tech',
          userFullName: currentUser?.fullName || clinicConfig.labInCharge || 'Lab Technologist',
          role: currentUser?.role || 'Lab',
          action: 'CORRECTED_VERIFIED_RESULT',
          reason: correctionReason.trim() || 'Analytical re-check / Post-verification amendment',
          changesSummary: `${updated[index].testName}: ${prevVal || '(empty)'} → ${value}`,
        };
        setCorrectionAuditTrail((prev) => [auditEntry, ...prev]);
      }
    } else if (field === 'normalRange') {
      updated[index].status = evaluateResultFlag(
        updated[index].result,
        updated[index],
        sex,
        age,
        pregnancyStatus
      );
    }

    setTestResults(updated);
  };

  /**
   * Technical Validation & Authorized Pathologist Verification handlers
   */
  const handleTechnicalValidation = () => {
    const enteredCount = testResults.filter((r) => r.result.trim() !== '').length;
    if (enteredCount === 0) {
      showToast(
        lang === 'bn'
          ? 'টেকনিক্যাল ভ্যালিডেশনের আগে অন্তত একটি টেস্টের ফলাফল লিখুন।'
          : 'Please enter test results before Technical Validation.'
      );
      return;
    }
    const validator = clinicConfig.labInCharge || currentUser?.fullName || 'Senior Medical Technologist';
    setTechnicallyValidatedBy(validator);
    setWorkflowStatus('Under Verification');
    showToast(
      lang === 'bn'
        ? `✓ টেকনিক্যাল ভ্যালিডেশন সম্পন্ন (${validator})`
        : `✓ Technical Validation completed by ${validator}`
    );
  };

  const handleAuthorizeVerification = () => {
    const enteredCount = testResults.filter((r) => r.result.trim() !== '').length;
    if (enteredCount === 0) {
      showToast(
        lang === 'bn'
          ? 'ভেরিফিকেশনের আগে টেস্টের ফলাফল এন্ট্রি করুন।'
          : 'Cannot verify an empty report. Please enter test results first.'
      );
      return;
    }
    if (criticalItems.length > 0 && !criticalNotifiedTo.trim()) {
      showToast(
        lang === 'bn'
          ? '⚠️ ক্রিটিক্যাল ফলাফল পাওয়া গেছে! ভেরিফাই করার আগে ডাক্তার/ওয়ার্ডকে অবহিতকরণের নোট লিখুন।'
          : '⚠️ Critical Result detected! Please log physician/ward notification before verifying.'
      );
      return;
    }
    const verifier = clinicConfig.pathologistName || currentUser?.fullName || 'Consultant Pathologist';
    const nowStr = `${getTodayDateStr(false)} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (!technicallyValidatedBy) {
      setTechnicallyValidatedBy(clinicConfig.labInCharge || 'Medical Technologist');
    }
    setVerifiedBy(verifier);
    setReportDateTime(nowStr);
    setWorkflowStatus('Verified');
    showToast(
      lang === 'bn'
        ? `✓ রিপোর্ট অনুমোদিত ও ভেরিফাইড হয়েছে (${verifier})`
        : `✓ Report Verified & Authorized by ${verifier}`
    );
  };

  const savePatientReport = (isPrintOrRelease: boolean = false) => {
    if (testResults.length === 0) {
      showToast(
        lang === 'bn'
          ? 'কোন টেস্ট ফরম্যাট যোগ করা হয়নি। দয়া করে প্রথমে টেস্ট যোগ করুন।'
          : 'No test format added yet. Please add tests first.'
      );
      return;
    }


    const effectivePid = patientId.trim() || `P${Date.now().toString().slice(-6)}`;
    const name =
      patientName.trim() || (lang === 'bn' ? `রোগী-${effectivePid}` : `Patient-${effectivePid}`);
    if (!patientName.trim()) setPatientName(name);
    if (!patientId.trim()) setPatientId(effectivePid);

    const safeSex: 'Male' | 'Female' | 'Other' = (sex as any) || 'Other';
    const nowStr = `${getTodayDateStr(false)} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const nextWorkflow: PathologyWorkflowStatus = isPrintOrRelease
      ? 'Released'
      : workflowStatus === 'Pending'
      ? 'Result Entered'
      : workflowStatus;

    if (isPrintOrRelease) {
      setWorkflowStatus('Released');
      setReleasedBy(currentUser?.fullName || clinicConfig.labInCharge || 'Lab Desk');
      setReportDateTime(nowStr);
    }

    // Match by activeRecordId or accessionNo so multiple reports for the same patient ID never overwrite each other
    const existingIndex = patients.findIndex(
      (p) =>
        (activeRecordId && p.id === activeRecordId) ||
        (accessionNo && p.accessionNo === accessionNo) ||
        (!activeRecordId && !p.accessionNo && p.pId === effectivePid)
    );

    const payload: Omit<Patient, 'id'> = {
      pId: effectivePid,
      accessionNo: accessionNo || `ACC-${Date.now().toString().slice(-6)}`,
      invoiceNo: invoiceNo || undefined,
      invDate: billDate || getTodayDateStr(false),
      billDate: billDate || getTodayDateStr(false),
      patientName: name,
      age: age || 'N/A',
      dob: dob || undefined,
      sex: safeSex,
      pregnancyStatus,
      drCode: drCode || 'N/A',
      drName: matchedDoctor?.name || drCode || 'N/A',
      status: isPrintOrRelease
        ? 'Printed'
        : nextWorkflow === 'Verified' || nextWorkflow === 'Released'
        ? 'Completed'
        : 'Pending',
      workflowStatus: nextWorkflow,
      department: 'Pathology',
      sampleType,
      sampleCollectionTime: sampleCollectionTime || `${billDate} 09:00 AM`,
      sampleReceivedTime: sampleReceivedTime || `${billDate} 09:30 AM`,
      reportDateTime: reportDateTime || nowStr,
      technicallyValidatedBy: technicallyValidatedBy || clinicConfig.labInCharge,
      verifiedBy: verifiedBy || (isPrintOrRelease ? clinicConfig.pathologistName : undefined),
      releasedBy: isPrintOrRelease ? currentUser?.fullName || clinicConfig.labInCharge : releasedBy,
      labDisclaimer,
      hasCriticalResult: criticalItems.length > 0,
      criticalAcknowledgedBy: criticalNotifiedTo || undefined,
      criticalAcknowledgedAt: criticalItems.length > 0 ? nowStr : undefined,
      correctionAuditTrail,
      comments,
      autoPrint,
      testResults,
    };

    let targetPatient: Patient;

    if (existingIndex >= 0) {
      updatePatient(patients[existingIndex].id, payload);
      targetPatient = {
        ...patients[existingIndex],
        ...payload,
      };
      setActiveRecordId(targetPatient.id);
      showToast(
        lang === 'bn'
          ? `✓ রোগী ${name} (${payload.accessionNo}) এর রিপোর্ট সংরক্ষণ হয়েছে`
          : `✓ Saved report for ${name} (${payload.accessionNo})`
      );
    } else {
      targetPatient = addPatient(payload);
      setActiveRecordId(targetPatient.id);
      showToast(
        lang === 'bn'
          ? `✓ নতুন ল্যাব রিপোর্ট (${payload.accessionNo}) সংরক্ষিত হয়েছে`
          : `✓ Created new lab report (${payload.accessionNo}) for ${name}`
      );
    }

    addAuditLog({
      actionType: 'PATHOLOGY_REPORT',
      patientId: effectivePid,
      patientName: name,
      details: `প্যাথলজি রিপোর্ট [${nextWorkflow}] (${testResults.length}টি প্যারামিটার, Acc: ${payload.accessionNo}) - রোগী: ${name}`,
    });
    broadcastLanEvent('REPORT_SAVED', {
      type: 'PATHOLOGY',
      pId: effectivePid,
      accessionNo: payload.accessionNo,
      patientName: name,
    });

    if (isPrintOrRelease) {
      setSelectedPatientForReport(targetPatient);
    }
  };

  const previewReport = () => {
    if (testResults.length === 0) {
      showToast(
        lang === 'bn'
          ? 'কোন টেস্ট ফরম্যাট যোগ করা হয়নি। দয়া করে প্রথমে টেস্ট যোগ করুন।'
          : 'No test format added yet. Please add tests first.'
      );
      return;
    }
    const effectivePid = patientId.trim() || `P${Date.now().toString().slice(-6)}`;
    const name =
      patientName.trim() || (lang === 'bn' ? `রোগী-${effectivePid}` : `Patient-${effectivePid}`);
    const safeSex: 'Male' | 'Female' | 'Other' = (sex as any) || 'Other';
    const nowStr = `${getTodayDateStr(false)} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const previewData: Patient = {
      id: activeRecordId || `preview-${Date.now()}`,
      pId: effectivePid,
      accessionNo,
      invoiceNo,
      invDate: billDate || getTodayDateStr(false),
      billDate: billDate || getTodayDateStr(false),
      patientName: name,
      age: age || 'N/A',
      dob,
      sex: safeSex,
      pregnancyStatus,
      drCode: drCode || 'N/A',
      drName: matchedDoctor?.name || drCode || 'N/A',
      status: workflowStatus === 'Released' ? 'Printed' : 'Completed',
      workflowStatus,
      department: 'Pathology',
      sampleType,
      sampleCollectionTime: sampleCollectionTime || `${billDate} 09:00 AM`,
      sampleReceivedTime: sampleReceivedTime || `${billDate} 09:30 AM`,
      reportDateTime: reportDateTime || nowStr,
      technicallyValidatedBy: technicallyValidatedBy || clinicConfig.labInCharge,
      verifiedBy: verifiedBy || clinicConfig.pathologistName,
      labDisclaimer,
      hasCriticalResult: criticalItems.length > 0,
      comments,
      autoPrint,
      testResults,
    };
    setSelectedPatientForReport(previewData);
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.pId.toLowerCase().includes(patientSearchInput.toLowerCase()) ||
      p.patientName.toLowerCase().includes(patientSearchInput.toLowerCase()) ||
      (p.accessionNo && p.accessionNo.toLowerCase().includes(patientSearchInput.toLowerCase()))
  );

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.pId.toLowerCase().includes(patientSearchInput.toLowerCase()) ||
      inv.patientName.toLowerCase().includes(patientSearchInput.toLowerCase()) ||
      inv.invoiceNo.toLowerCase().includes(patientSearchInput.toLowerCase()) ||
      inv.items.some((i) => i.testName.toLowerCase().includes(patientSearchInput.toLowerCase()))
  );

  const filteredTests = activeLabTests.filter(
    (t) =>
      testSearchInput.trim() !== '' &&
      (t.name.toLowerCase().includes(testSearchInput.toLowerCase()) ||
        t.code.toLowerCase().includes(testSearchInput.toLowerCase()) ||
        t.category.toLowerCase().includes(testSearchInput.toLowerCase()))
  );

  const quickCategoryTemplates = useMemo(() => {
    if (quickCategoryFilter === 'ALL') {
      return activeLabTests.slice(0, 12);
    }
    return activeLabTests.filter(
      (t) => t.category.toLowerCase() === quickCategoryFilter.toLowerCase()
    );
  }, [activeLabTests, quickCategoryFilter]);

  const isClassic = theme === 'classic';
  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-full p-2.5 sm:p-4 transition-colors ${
        isDark
          ? 'bg-slate-950 text-slate-100'
          : isClassic
          ? 'bg-[#e4d3e8] text-slate-950'
          : 'bg-slate-100 text-slate-950'
      }`}
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div className="mb-3 bg-purple-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm font-bold flex items-center justify-between border-2 border-purple-400">
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white hover:text-red-300 ml-4 font-bold text-lg cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Top Module Switcher Bar: Worklist & Result Entry vs Admin Test Master & Ready-Made Templates */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white p-2.5 rounded-xl border border-purple-700 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-pink-500/20 rounded-lg border border-pink-400/30 text-pink-300">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
              <span>
                {lang === 'bn'
                  ? 'প্যাথলজি ল্যাব ও রেডি-মেড রিপোর্ট টেমপ্লেট সিস্টেম'
                  : 'Pathology Lab & Ready-Made Report Template System'}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-md">
                {activeLabTests.length} Ready Templates
              </span>
            </h2>
            <p className="text-[11px] text-purple-200">
              {lang === 'bn'
                ? '৭টি বিভাগ (হেমাটোলজি, বায়োকেমিস্ট্রি, হরমোন, সেরোলজি, ক্লিনিক্যাল প্যাথলজি, মাইক্রোবায়োলজি ও স্পেশাল টেস্ট) • বয়স ও লিঙ্গভিত্তিক রেফারেন্স রেঞ্জ'
                : '7 Standard Departments • Age/Sex/Pregnancy Dynamic Reference Ranges • 10-Step Verification & Release Workflow'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-purple-800">
          <button
            type="button"
            onClick={() => setModuleMode('worklist')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
              moduleMode === 'worklist'
                ? 'bg-gradient-to-r from-pink-600 to-purple-700 text-white shadow-sm'
                : 'text-purple-200 hover:bg-white/10'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>
              {lang === 'bn' ? 'ল্যাব ওয়ার্কলিস্ট ও রিপোর্ট এন্ট্রি' : 'Lab Worklist & Report Entry'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setModuleMode('testMaster')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
              moduleMode === 'testMaster'
                ? 'bg-gradient-to-r from-pink-600 to-purple-700 text-white shadow-sm'
                : 'text-purple-200 hover:bg-white/10'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>
              {lang === 'bn'
                ? `অ্যাডমিন টেস্ট মাস্টার ও টেমপ্লেট (${labTests.length})`
                : `Admin Test Master & Templates (${labTests.length})`}
            </span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODE 2: ADMIN TEST MASTER & TEMPLATE DESIGNER                         */}
      {/* ===================================================================== */}
      {moduleMode === 'testMaster' ? (
        <AdminTestMasterPanel
          onPreviewTemplate={(previewPat) => setSelectedPatientForReport(previewPat)}
          onLoadTemplateIntoWorkspace={(tmpl) => {
            setModuleMode('worklist');
            addTestToResults(tmpl);
          }}
        />
      ) : (
        /* ===================================================================== */
        /* MODE 1: LAB WORKLIST & 10-STEP REPORT ENTRY WORKFLOW                  */
        /* ===================================================================== */
        <div
          className={`border-2 rounded-xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0 ${
            isDark
              ? 'bg-slate-900 border-slate-700'
              : isClassic
              ? 'bg-[#edddec] border-[#9f81a7]'
              : 'bg-white border-slate-300'
          }`}
        >
          {/* LEFT COLUMN: Data Entry Form & Test Table (8 COLS) */}
          <div
            className={`lg:col-span-8 p-3 sm:p-4 flex flex-col justify-between border-b lg:border-b-0 lg:border-r ${
              isDark ? 'border-slate-800' : 'border-[#9f81a7]'
            }`}
          >
            <div>

              {/* Critical Result SOP Alert Banner */}
              {criticalItems.length > 0 && (
                <div className="mb-3 p-3 rounded-xl bg-red-950 text-white border-2 border-red-400 shadow-lg animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-red-300 shrink-0 mt-0.5 animate-bounce" />
                      <div>
                        <h4 className="font-black text-xs sm:text-sm text-red-200 uppercase tracking-wide">
                          {lang === 'bn'
                            ? `🚨 ক্রিটিক্যাল ফলাফল সতর্কবার্তা (PANIC / CRITICAL VALUE ALERT - ${criticalItems.length})`
                            : `🚨 CRITICAL VALUE SOP ALERT (${criticalItems.length} Parameter${criticalItems.length > 1 ? 's' : ''})`}
                        </h4>
                        <p className="text-[11px] text-red-100 mt-0.5">
                          {criticalItems.map((c) => `${c.testName}: ${c.result} ${c.unit}`).join('  |  ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={criticalNotifiedTo}
                        onChange={(e) => setCriticalNotifiedTo(e.target.value)}
                        placeholder={
                          lang === 'bn'
                            ? 'অবহিতকৃত ডাক্তার/ওয়ার্ডের নাম লিখুন...'
                            : 'Physician / Ward notified (SOP required)...'
                        }
                        className="px-2.5 py-1 rounded bg-white text-slate-950 text-xs font-bold border border-red-300 w-56"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sensitive Test RBAC Protection Banner */}
              {hasSensitiveTests && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-amber-950/90 text-amber-100 border border-amber-500/60 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      {lang === 'bn'
                        ? 'গোপনীয় ও সংবেদনশীল পরীক্ষা (HIV / HBsAg / Anti-HCV / VDRL) অন্তর্ভুক্ত — শুধুমাত্র অনুমোদিত কর্মী ফলাফল দেখতে ও ভেরিফাই করতে পারবেন।'
                        : 'Confidential / Sensitive Screening (HIV / HBsAg / Anti-HCV / VDRL) — Role-Based Access Control active.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSensitiveUnlocked((prev) => !prev)}
                    className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {isAuthorizedRole ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    <span>{isAuthorizedRole ? 'Authorized' : 'Unlock RBAC'}</span>
                  </button>
                </div>
              )}

              {/* Top Form Group: Bill Date, Patient ID, Accession, Sample Timestamps */}
              <div
                className={`p-3 rounded-lg border-2 mb-3 ${
                  isDark
                    ? 'bg-slate-850 border-purple-900 text-slate-100'
                    : isClassic
                    ? 'bg-[#f7eff6] border-[#9f81a7] text-slate-950 shadow-xs'
                    : 'bg-white border-slate-300 text-slate-900 shadow-2xs'
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center mb-2">
                  <div className="sm:col-span-2 font-bold text-xs uppercase tracking-wide text-slate-800 dark:text-slate-200">
                    {t.billDate}
                  </div>
                  <div className="sm:col-span-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={billDate}
                        onChange={(e) => setBillDate(e.target.value)}
                        placeholder="DD-MM-YYYY"
                        className="w-full bg-white dark:bg-slate-800 border-2 border-slate-400 dark:border-slate-600 pl-3 pr-8 py-1.5 rounded-md text-xs font-bold text-slate-950 dark:text-slate-100 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setBillDate(getTodayDateStr(false));
                          showToast(lang === 'bn' ? 'বিল তারিখ আজকের লাইভ তারিখে আপডেট হয়েছে' : 'Updated to today date');
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-pink-600 hover:text-purple-800 cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="sm:col-span-2 font-bold text-xs uppercase tracking-wide text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>{t.patientId} *</span>
                  </div>
                  <div className="sm:col-span-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={patientId}
                        onChange={(e) => handlePatientIdChange(e.target.value)}
                        onBlur={() => {
                          if (patientId.trim()) {
                            lookupAndFillPatient(patientId, true);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (patientId.trim()) {
                              lookupAndFillPatient(patientId, false);
                            }
                          }
                        }}
                        placeholder={lang === 'bn' ? 'রোগী আইডি (যেমন: P2601)' : 'e.g. P2601'}
                        className="w-full bg-yellow-100 dark:bg-yellow-400/20 text-slate-950 dark:text-slate-100 font-black text-center text-sm tracking-wider border-2 border-slate-500 pl-3 pr-14 py-1.5 rounded-md shadow-inner focus:ring-2 focus:ring-purple-600 focus:outline-none placeholder:text-slate-400 placeholder:text-xs placeholder:font-normal"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (patientId.trim()) {
                            lookupAndFillPatient(patientId, false);
                          } else {
                            showToast(lang === 'bn' ? 'অনুসন্ধান করতে রোগী আইডি লিখুন' : 'Enter Patient ID to search');
                          }
                        }}
                        className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-purple-900 hover:bg-purple-800 text-white rounded text-[10px] font-bold transition cursor-pointer shadow-2xs"
                      >
                        {lang === 'bn' ? 'খুঁজুন' : 'Load'}
                      </button>
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={generateNewPatient}
                      className="w-full px-3 py-2 bg-[#b50f75] hover:bg-[#970c62] text-white font-black rounded-md shadow-md text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{t.refresh}</span>
                    </button>
                  </div>
                </div>

                {/* Quick Select from Billing Invoices */}
                {invoices.length > 0 && (
                  <div className="mb-2.5 px-2.5 py-1.5 bg-purple-100/70 dark:bg-purple-950/40 rounded-md border border-purple-300 dark:border-purple-800 flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-purple-950 dark:text-purple-300 text-[11px] flex items-center gap-1 shrink-0">
                        <ArrowDownToLine className="w-3.5 h-3.5 text-pink-600" />
                        <span>{lang === 'bn' ? 'বিলিং থেকে সরাসরি লোড:' : 'Quick Load from Billing:'}</span>
                      </span>
                      {invoices.slice(0, 5).map((inv) => (
                        <button
                          key={inv.id}
                          type="button"
                          onClick={() => lookupAndFillPatient(inv.pId, false, inv.invoiceNo)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                            invoiceNo === inv.invoiceNo || (patientId === inv.pId && !invoiceNo)
                              ? 'bg-purple-900 text-white border-purple-950 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-purple-950 dark:text-purple-200 border-purple-300 hover:bg-purple-200/80'
                          }`}
                          title={`${inv.patientName} (${inv.items.map((i) => i.testName).join(', ')})`}
                        >
                          <span className="font-mono">#{inv.pId}</span>
                          <span>{inv.patientName}</span>
                          <span className="text-[9px] opacity-75">({inv.items.length} টেস্ট)</span>
                        </button>
                      ))}
                    </div>
                    {patientName && (
                      <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1">
                        <CheckCheck className="w-3 h-3 text-emerald-600" />
                        <span>
                          {lang === 'bn'
                            ? `রোগী: ${patientName} (${testResults.length}টি প্যারামিটার)`
                            : `Loaded: ${patientName} (${testResults.length} params)`}
                        </span>
                      </span>
                    )}
                  </div>
                )}

                {/* Row 2: Patient Name, Age, Sex, Pregnancy Status */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center mb-2.5">
                  <div className="sm:col-span-2 font-bold text-xs uppercase tracking-wide text-slate-800 dark:text-slate-200">
                    {t.ptName} *
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => handlePatientNameChange(e.target.value)}
                      placeholder={lang === 'bn' ? 'রোগীর নাম লিখুন...' : 'Enter Patient Name...'}
                      className="w-full bg-white dark:bg-slate-800 border-2 border-slate-400 dark:border-slate-600 px-3 py-1.5 rounded-md text-xs font-black text-slate-950 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder={lang === 'bn' ? 'বয়স (যেমন: 28 Y / 6 M)' : 'Age (e.g. 28 Y / 6 M)'}
                      title="Patient Age (auto-selects Adult or Pediatric reference range)"
                      className="w-full bg-white dark:bg-slate-800 border-2 border-slate-400 dark:border-slate-600 px-2.5 py-1.5 rounded-md text-xs font-bold text-slate-950 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <select
                      value={sex}
                      onChange={(e) => setSex(e.target.value as any)}
                      title="Patient Sex (auto-selects Male/Female reference range)"
                      className="w-full bg-white dark:bg-slate-800 border-2 border-slate-400 dark:border-slate-600 px-2 py-1.5 rounded-md text-xs font-bold text-slate-950 dark:text-slate-100 focus:ring-2 focus:ring-purple-600 focus:outline-none cursor-pointer"
                    >
                      <option value="">{lang === 'bn' ? '-- লিঙ্গ --' : '-- Sex --'}</option>
                      <option value="Female">{lang === 'bn' ? 'মহিলা (Female)' : 'Female'}</option>
                      <option value="Male">{lang === 'bn' ? 'পুরুষ (Male)' : 'Male'}</option>
                      <option value="Other">{lang === 'bn' ? 'অন্যান্য' : 'Other'}</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <select
                      value={pregnancyStatus}
                      onChange={(e) => setPregnancyStatus(e.target.value as any)}
                      disabled={sex === 'Male'}
                      title="Pregnancy Status (adjusts hormone/thyroid/Hb reference ranges)"
                      className="w-full bg-white dark:bg-slate-800 border-2 border-slate-400 dark:border-slate-600 px-2 py-1.5 rounded-md text-[11px] font-bold text-slate-950 dark:text-slate-100 focus:ring-2 focus:ring-purple-600 focus:outline-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="Non-Pregnant">{lang === 'bn' ? 'গর্ভবতী নয়' : 'Non-Pregnant'}</option>
                      <option value="Pregnant (1st Trimester)">Pregnant (1st Trimester)</option>
                      <option value="Pregnant (2nd Trimester)">Pregnant (2nd Trimester)</option>
                      <option value="Pregnant (3rd Trimester)">Pregnant (3rd Trimester)</option>
                      <option value="Not Applicable">Not Applicable</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: Sample Type, Collection Time, Received Time, Accession No */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center mb-2.5 text-xs">
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                      {lang === 'bn' ? 'অ্যাকসেশন / রিপোর্ট আইডি' : 'Accession / Report ID'}
                    </label>
                    <input
                      type="text"
                      value={accessionNo}
                      onChange={(e) => setAccessionNo(e.target.value)}
                      className="w-full bg-purple-50 dark:bg-slate-800 border border-purple-300 dark:border-purple-700 px-2.5 py-1 rounded font-mono font-bold text-purple-950 dark:text-purple-200 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                      {lang === 'bn' ? 'নমুনার ধরন (Sample Type)' : 'Sample Type'}
                    </label>
                    <input
                      type="text"
                      value={sampleType}
                      onChange={(e) => setSampleType(e.target.value)}
                      placeholder="EDTA Whole Blood / Serum"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded font-bold text-xs"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                      {lang === 'bn' ? 'নমুনা সংগ্রহের সময়' : 'Sample Collection Time'}
                    </label>
                    <input
                      type="text"
                      value={sampleCollectionTime}
                      onChange={(e) => setSampleCollectionTime(e.target.value)}
                      placeholder="DD-MM-YYYY HH:MM"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded font-mono text-[11px]"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                      {lang === 'bn' ? 'ল্যাবে নমুনা গ্রহণের সময়' : 'Sample Received Time'}
                    </label>
                    <input
                      type="text"
                      value={sampleReceivedTime}
                      onChange={(e) => setSampleReceivedTime(e.target.value)}
                      placeholder="DD-MM-YYYY HH:MM"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded font-mono text-[11px]"
                    />
                  </div>
                </div>

                {/* Row 4: Dr. Code, Doctor Name, New Doctor Register */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                  <div className="sm:col-span-2 font-bold text-xs uppercase tracking-wide text-slate-800 dark:text-slate-200">
                    {t.drCode}
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={drCode}
                      onChange={(e) => setDrCode(e.target.value)}
                      placeholder={lang === 'bn' ? 'যেমন: DR01' : 'e.g. DR01'}
                      className="w-full bg-purple-50 dark:bg-slate-800 border-2 border-purple-400 dark:border-purple-600 px-3 py-1.5 rounded-md text-xs font-black uppercase text-purple-950 dark:text-purple-300 placeholder-slate-400 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-6">
                    <div className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-400 dark:border-slate-600 px-3 py-1.5 rounded-md text-xs font-bold text-slate-950 dark:text-slate-100 flex items-center justify-between min-h-[34px]">
                      <span
                        className={`truncate ${
                          matchedDoctor ? 'text-slate-950 dark:text-slate-100 font-black' : 'text-slate-400 font-medium'
                        }`}
                      >
                        {matchedDoctor
                          ? `${matchedDoctor.name} (${matchedDoctor.specialty})`
                          : drCode.trim()
                          ? lang === 'bn'
                            ? `ডাক্তার কোড: ${drCode}`
                            : `Doctor Code: ${drCode}`
                          : lang === 'bn'
                          ? 'ডাক্তার কোড লিখুন বা পাশের বাটনে যোগ করুন'
                          : 'Doctor name will appear here...'}
                      </span>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => setShowDoctorModal(true)}
                      className="w-full px-2 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-md text-xs font-black flex items-center justify-center gap-1 transition cursor-pointer shadow-sm active:scale-95"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{t.addDoctorBtn}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Test Selection & Ready-Made Category Browser */}
              <div
                className={`p-3 rounded-lg border-2 mb-3.5 ${
                  isDark ? 'bg-slate-850 border-purple-900' : 'bg-white border-purple-300 shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-purple-600 dark:text-purple-400" />
                    <input
                      type="text"
                      value={testSearchInput}
                      onChange={(e) => setTestSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTestFromSearch();
                        }
                      }}
                      placeholder={
                        lang === 'bn'
                          ? '৮৫+ রেডি-মেড টেস্ট টেমপ্লেট খুঁজুন (যেমন: CBC, LFT, Lipid, TSH, Urine, Widal, Culture)...'
                          : 'Search 85+ Ready-Made Templates (e.g. CBC, LFT, Lipid, TSH, Urine, Widal, Culture)...'
                      }
                      className="w-full pl-9 pr-3 py-2 bg-purple-50/60 dark:bg-slate-900 border-2 border-purple-400 dark:border-purple-600 rounded-lg text-xs font-bold text-slate-950 dark:text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />

                    {/* Dropdown Suggestions */}
                    {filteredTests.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border-2 border-purple-400 rounded-lg shadow-xl z-30 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 text-xs">
                        {filteredTests.map((test) => (
                          <div
                            key={test.id}
                            onClick={() => {
                              addTestToResults(test);
                              setTestSearchInput('');
                            }}
                            className="p-2.5 hover:bg-purple-100 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center"
                          >
                            <div>
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 font-bold mr-2">
                                {test.code}
                              </span>
                              <span className="font-black text-purple-950 dark:text-purple-200">
                                {test.name}
                              </span>
                              <span className="text-[11px] text-slate-500 ml-2">
                                ({test.category} · {test.subTests?.length || 1} params)
                              </span>
                            </div>
                            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400">
                              + {lang === 'bn' ? 'টেমপ্লেট লোড' : 'Load Template'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowAddTestModal(true)}
                      className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-black rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t.addTestButton}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomTestModal(true)}
                      className="px-3 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t.addTestRow}</span>
                    </button>
                    <button
                      type="button"
                      onClick={previewReport}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition cursor-pointer shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'প্রিভিউ' : 'Preview'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Verified Report Post-Verification Amendment Reason Banner */}
              {(workflowStatus === 'Verified' || workflowStatus === 'Released') && (
                <div className="mb-2.5 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-400 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
                    <History className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {lang === 'bn'
                        ? 'ভেরিফাইড রিপোর্ট সংশোধন মোড (Audit Trail লগ সক্রিয়):'
                        : 'Verified Report Correction Mode (All edits logged to Audit Trail):'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder={
                      lang === 'bn'
                        ? 'সংশোধনের কারণ লিখুন (যেমন: Re-run verification)...'
                        : 'Enter reason for post-verification correction...'
                    }
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-amber-400 rounded text-xs font-bold text-slate-900 dark:text-slate-100 sm:w-72"
                  />
                </div>
              )}

              {/* Dynamic Test Parameters & Results Entry Table */}
              <div className="border-2 border-slate-500 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-200 dark:bg-slate-800 text-slate-950 dark:text-slate-100 sticky top-0 z-10 border-b-2 border-slate-400">
                      <tr>
                        <th className="py-2.5 px-2.5 font-black border-r border-slate-300 dark:border-slate-700 w-[34%]">
                          {t.testName} & Method
                        </th>
                        <th className="py-2.5 px-2.5 font-black border-r border-slate-300 dark:border-slate-700 w-[24%] text-center">
                          {t.result} & Flag
                        </th>
                        <th className="py-2.5 px-2 font-black border-r border-slate-300 dark:border-slate-700 w-[12%] text-center">
                          {t.unit}
                        </th>
                        <th className="py-2.5 px-2.5 font-black border-r border-slate-300 dark:border-slate-700 w-[22%] text-center">
                          {t.normalRange}
                        </th>
                        <th className="py-2.5 px-2 font-black text-center w-[8%]">{t.action}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {testResults.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-slate-400 italic">
                            {t.noTestsAdded}
                          </td>
                        </tr>
                      ) : (
                        testResults.map((item, idx) => {
                          const isRowSensitive =
                            item.isSensitive ||
                            ['hiv', 'hbsag', 'anti-hcv', 'vdrl'].some((kw) =>
                              (item.testName || '').toLowerCase().includes(kw)
                            );
                          const isMasked = isRowSensitive && !isAuthorizedRole;

                          return (
                            <tr
                              key={idx}
                              className={`hover:bg-purple-50/50 dark:hover:bg-slate-800/60 ${
                                item.status === 'Critical'
                                  ? 'bg-red-100/80 dark:bg-red-950/40'
                                  : item.status === 'High'
                                  ? 'bg-red-50/60 dark:bg-red-950/20'
                                  : item.status === 'Low'
                                  ? 'bg-amber-50/60 dark:bg-amber-950/20'
                                  : ''
                              }`}
                            >
                              {/* Parameter Name, Department Badge & Method */}
                              <td className="py-1.5 px-2 border-r border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={item.testName}
                                    onChange={(e) => updateRow(idx, 'testName', e.target.value)}
                                    className="w-full bg-transparent px-1 py-0.5 text-xs font-black text-slate-950 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                                  />
                                  <span
                                    className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                      PATHOLOGY_DEPARTMENTS[classifyTestItem(item)].badgeColor
                                    }`}
                                  >
                                    {lang === 'bn'
                                      ? PATHOLOGY_DEPARTMENTS[classifyTestItem(item)].nameBn.split(' ')[0]
                                      : PATHOLOGY_DEPARTMENTS[classifyTestItem(item)].nameEn.split(' ')[0]}
                                  </span>
                                </div>
                                {item.method && (
                                  <div className="px-1 text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                    Method: {item.method}
                                  </div>
                                )}
                              </td>

                              {/* Dynamic Result Input (Numeric / Dropdown / PosNeg / Text) + Flag Badge */}
                              <td className="py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center">
                                {isMasked ? (
                                  <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded">
                                    🔒 Restricted (RBAC)
                                  </span>
                                ) : (
                                  <div className="flex items-center justify-center gap-1">
                                    {item.inputType === 'dropdown' && item.options && item.options.length > 0 ? (
                                      <select
                                        value={item.result}
                                        onChange={(e) => updateRow(idx, 'result', e.target.value)}
                                        className="w-full max-w-[155px] px-1.5 py-1 text-xs font-black rounded border border-purple-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-100 cursor-pointer"
                                      >
                                        <option value="">-- Select Result --</option>
                                        {item.options.map((opt) => (
                                          <option key={opt} value={opt}>
                                            {opt}
                                          </option>
                                        ))}
                                      </select>
                                    ) : item.inputType === 'posneg' ? (
                                      <select
                                        value={item.result}
                                        onChange={(e) => updateRow(idx, 'result', e.target.value)}
                                        className="w-full max-w-[155px] px-1.5 py-1 text-xs font-black rounded border border-purple-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-100 cursor-pointer"
                                      >
                                        <option value="">-- Select --</option>
                                        {(item.options && item.options.length > 0
                                          ? item.options
                                          : ['Negative', 'Positive', 'Non-Reactive', 'Reactive', 'Borderline']
                                        ).map((opt) => (
                                          <option key={opt} value={opt}>
                                            {opt}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <input
                                        type="text"
                                        value={item.result}
                                        onChange={(e) => updateRow(idx, 'result', e.target.value)}
                                        placeholder={item.inputType === 'numeric' ? 'Enter value...' : 'Enter finding...'}
                                        className={`w-full max-w-[130px] text-center px-1.5 py-1 text-xs font-black rounded border ${
                                          item.status === 'Critical'
                                            ? 'bg-red-600 text-white border-red-800 font-extrabold'
                                            : item.status === 'High'
                                            ? 'bg-red-100 text-red-700 border-red-400 font-extrabold'
                                            : item.status === 'Low'
                                            ? 'bg-amber-100 text-amber-800 border-amber-400 font-extrabold'
                                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-950 dark:text-slate-100'
                                        } focus:outline-none`}
                                      />
                                    )}

                                    {item.result.trim() !== '' && item.status !== 'Normal' && (
                                      <span
                                        className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase shrink-0 ${
                                          item.status === 'Critical'
                                            ? 'bg-red-700 text-white animate-pulse'
                                            : item.status === 'High'
                                            ? 'bg-red-200 text-red-900'
                                            : 'bg-amber-200 text-amber-900'
                                        }`}
                                      >
                                        {item.status}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Unit */}
                              <td className="py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center">
                                <input
                                  type="text"
                                  value={item.unit}
                                  onChange={(e) => updateRow(idx, 'unit', e.target.value)}
                                  placeholder="-"
                                  className="w-full text-center bg-transparent px-1 py-1 text-xs font-mono text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                                />
                              </td>

                              {/* Reference Range (Age / Sex / Pregnancy Dynamic) */}
                              <td className="py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center">
                                <input
                                  type="text"
                                  value={item.normalRange}
                                  onChange={(e) => updateRow(idx, 'normalRange', e.target.value)}
                                  placeholder="Reference Range"
                                  className="w-full text-center bg-transparent px-1 py-1 text-[11px] font-mono text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                                />
                              </td>

                              {/* Delete Row */}
                              <td className="py-1.5 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeRow(idx)}
                                  className="p-1.5 bg-red-100 hover:bg-red-600 text-red-700 hover:text-white rounded-md font-bold text-xs flex items-center justify-center transition cursor-pointer mx-auto border border-red-300"
                                  title={t.deleteRow}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">
                    {lang === 'bn'
                      ? `মোট প্যারামিটার: ${testResults.length} টি`
                      : `Total Parameters: ${testResults.length}`}
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                    {lang === 'bn'
                      ? `সম্পন্ন: ${testResults.filter((r) => r.result.trim() !== '').length} টি`
                      : `Entered: ${testResults.filter((r) => r.result.trim() !== '').length}`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setModuleMode('testMaster')}
                    className="text-pink-700 dark:text-pink-400 hover:underline font-black flex items-center gap-1 cursor-pointer"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'টেমপ্লেট ডিজাইনার খুলুন' : 'Customize Templates'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomTestModal(true)}
                    className="text-purple-800 dark:text-purple-300 hover:underline font-black flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> {t.addTestRow}
                  </button>
                </div>
              </div>

              {/* Correction Audit Trail History Box (if any amendments occurred) */}
              {correctionAuditTrail.length > 0 && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-[11px]">
                  <div className="font-black text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-purple-600" />
                    <span>
                      {lang === 'bn'
                        ? `সংশোধন অডিট ট্রেইল (${correctionAuditTrail.length}টি রেকর্ড)`
                        : `Verified Report Correction Audit Trail (${correctionAuditTrail.length})`}
                    </span>
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {correctionAuditTrail.map((entry) => (
                      <div
                        key={entry.id}
                        className="text-[10px] font-mono text-slate-600 dark:text-slate-300 flex flex-wrap justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-0.5"
                      >
                        <span>
                          <strong>{entry.userFullName}</strong> ({entry.role}):{' '}
                          <strong className="text-purple-700 dark:text-purple-300">{entry.changesSummary}</strong>
                        </span>
                        <span className="text-slate-400">
                          Reason: {entry.reason} · {entry.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Saved Patients, Verification & Action Commands (4 COLS) */}
          <div
            className={`lg:col-span-4 p-3 sm:p-4 flex flex-col justify-between ${
              isDark ? 'bg-slate-900' : isClassic ? 'bg-[#e4d3e8]' : 'bg-slate-100'
            }`}
          >
            <div>
              {/* Dual Tabs: Reception Queue (Billed Tests) vs Saved Pathology Reports */}
              <div className="grid grid-cols-2 gap-1.5 mb-2 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSidebarTab('receptionQueue')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    sidebarTab === 'receptionQueue'
                      ? 'bg-purple-900 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-300/80 dark:hover:bg-slate-700'
                  }`}
                >
                  <FlaskConical className="w-3.5 h-3.5 text-pink-300" />
                  <span>{lang === 'bn' ? 'রিসিপশন টেস্ট কিউ' : 'Reception Queue'}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-pink-500 text-white font-mono font-bold">
                    {invoices.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab('savedReports')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    sidebarTab === 'savedReports'
                      ? 'bg-purple-900 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-300/80 dark:hover:bg-slate-700'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-300" />
                  <span>{lang === 'bn' ? 'সেভ করা রিপোর্ট' : 'Saved Reports'}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-700 text-white font-mono font-bold">
                    {patients.length}
                  </span>
                </button>
              </div>

              {/* Search Input */}
              <div className="mb-2 relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={patientSearchInput}
                  onChange={(e) => setPatientSearchInput(e.target.value)}
                  placeholder={
                    sidebarTab === 'receptionQueue'
                      ? lang === 'bn'
                        ? 'রিসিপশন কিউ খুঁজুন (নাম, আইডি, রসিদ বা টেস্ট)...'
                        : 'Search billed queue (name, PID, invoice or test)...'
                      : t.searchPatients
                  }
                  className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border-2 border-slate-400 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-950 dark:text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              {/* Content Area Based on Active Tab */}
              {sidebarTab === 'receptionQueue' ? (
                <div className="border-2 border-slate-400 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs mb-3">
                  <div className="bg-purple-950 text-white px-3 py-1.5 text-[11px] font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FlaskConical className="w-3.5 h-3.5 text-pink-400" />
                      <span>{lang === 'bn' ? 'কাউন্টার থেকে আসা টেস্টের তালিকা' : 'Billed Lab Tests From Counter'}</span>
                    </span>
                    <span className="text-[10px] text-pink-300 font-mono">
                      {filteredInvoices.length}টি ইনভয়েস
                    </span>
                  </div>

                  <div className="max-h-[235px] overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredInvoices.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 italic text-xs">
                        {lang === 'bn' ? 'কোনো বিলিং রসিদ পাওয়া যায়নি' : 'No billed invoices found'}
                      </div>
                    ) : (
                      filteredInvoices.map((inv) => {
                        const isCurrent = invoiceNo === inv.invoiceNo || (patientId === inv.pId && !invoiceNo);
                        return (
                          <div
                            key={inv.id}
                            onClick={() => lookupAndFillPatient(inv.pId, false, inv.invoiceNo)}
                            className={`p-2.5 hover:bg-purple-50 dark:hover:bg-slate-850 cursor-pointer transition ${
                              isCurrent
                                ? 'bg-purple-100/90 dark:bg-purple-950/60 border-l-4 border-l-purple-800 font-bold'
                                : ''
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-bold text-[11px] bg-purple-900 text-white px-1.5 py-0.2 rounded shadow-2xs">
                                  #{inv.pId}
                                </span>
                                <span className="font-black text-slate-900 dark:text-slate-100 text-xs">
                                  {inv.patientName}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                  ({inv.age || 'N/A'}, {inv.sex || 'N/A'})
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  lookupAndFillPatient(inv.pId, false, inv.invoiceNo);
                                }}
                                className="px-2 py-1 bg-gradient-to-r from-pink-600 to-purple-700 hover:from-pink-500 hover:to-purple-600 text-white rounded-md text-[10px] font-black transition cursor-pointer shadow-xs shrink-0 flex items-center gap-1"
                              >
                                <ArrowDownToLine className="w-3 h-3" />
                                <span>{isCurrent ? (lang === 'bn' ? 'লোড হয়েছে ✓' : 'Loaded ✓') : (lang === 'bn' ? 'ফরম্যাট লোড' : 'Load Format')}</span>
                              </button>
                            </div>

                            <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                              {inv.items.map((it, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.2 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800 rounded text-[9px] font-bold"
                                >
                                  {it.testName}
                                </span>
                              ))}
                            </div>

                            <div className="mt-1 text-[10px] text-slate-400 flex items-center justify-between">
                              <span>রসিদ: #{inv.invoiceNo} · ডাক্তার: {inv.drCode}</span>
                              <span className="font-mono">{inv.date}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                <div className="border-2 border-slate-400 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shadow-xs mb-3">
                  <div className="max-h-[235px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-200 dark:bg-slate-800 text-slate-950 dark:text-slate-100 border-b-2 border-slate-400 sticky top-0">
                        <tr>
                          <th className="py-2 px-2 font-black border-r border-slate-300 dark:border-slate-700">ID / Acc</th>
                          <th className="py-2 px-2 font-black border-r border-slate-300 dark:border-slate-700">{t.patientName}</th>
                          <th className="py-2 px-2 font-black border-r border-slate-300 dark:border-slate-700">Status</th>
                          <th className="py-2 px-1.5 font-black text-center">{t.action}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {filteredPatients.map((p) => (
                          <tr
                            key={p.id}
                            className={`hover:bg-purple-100 dark:hover:bg-slate-800 cursor-pointer ${
                              activeRecordId === p.id ? 'bg-purple-200/60 dark:bg-purple-950/40 font-black' : ''
                            }`}
                            onClick={() => loadPatient(p)}
                          >
                            <td className="py-1.5 px-2 font-mono text-[11px] font-bold text-purple-950 dark:text-purple-300 border-r border-slate-200 dark:border-slate-800">
                              <div>{p.pId}</div>
                              {p.accessionNo && (
                                <div className="text-[9px] text-slate-500">{p.accessionNo}</div>
                              )}
                            </td>
                            <td className="py-1.5 px-2 font-bold truncate max-w-[105px] text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">
                              <div>{p.patientName}</div>
                              <div className="text-[9px] text-slate-500">{p.billDate || p.invDate}</div>
                            </td>
                            <td className="py-1.5 px-2 text-[10px] border-r border-slate-200 dark:border-slate-800">
                              <span
                                className={`px-1.5 py-0.5 rounded font-bold ${
                                  p.workflowStatus === 'Released' || p.workflowStatus === 'Verified'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                }`}
                              >
                                {p.workflowStatus || p.status}
                              </span>
                            </td>
                            <td className="py-1.5 px-1.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPatientForReport(p);
                                  }}
                                  className="p-1 bg-purple-700 hover:bg-purple-800 text-white rounded cursor-pointer"
                                  title="Print / View Report"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deletePatient(p.id);
                                  }}
                                  className="p-1 bg-rose-100 hover:bg-rose-600 text-rose-700 hover:text-white rounded cursor-pointer transition"
                                  title="Delete Report (Admin Only)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Signatories & Verification Summary Box */}
              <div className="mb-2.5 p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    {lang === 'bn' ? 'টেকনিক্যাল ভ্যালিডেশন:' : 'Tech Validated By:'}
                  </span>
                  <input
                    type="text"
                    value={technicallyValidatedBy}
                    onChange={(e) => setTechnicallyValidatedBy(e.target.value)}
                    placeholder={clinicConfig.labInCharge}
                    className="px-2 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-[11px] font-bold text-right w-44"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    {lang === 'bn' ? 'প্যাথলজিস্ট ভেরিফাইড:' : 'Verified By (Doctor):'}
                  </span>
                  <input
                    type="text"
                    value={verifiedBy}
                    onChange={(e) => setVerifiedBy(e.target.value)}
                    placeholder={clinicConfig.pathologistName}
                    className="px-2 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-[11px] font-bold text-right w-44"
                  />
                </div>
              </div>

              {/* Clinical Comments & Disclaimer */}
              <div className="mb-2.5">
                <label className="block text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                  {t.clinicalComments}
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={lang === 'bn' ? 'ক্লিনিক্যাল মন্তব্য / স্পেসিমেন পর্যবেক্ষণ...' : 'Clinical comments / interpretation notes...'}
                  rows={2}
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-400 dark:border-slate-600 p-2 rounded-lg text-xs font-medium text-slate-950 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              {/* Print Options */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-800 dark:text-slate-200 text-xs">
                  <input
                    type="checkbox"
                    checked={autoPrint}
                    onChange={(e) => setAutoPrint(e.target.checked)}
                    className="accent-purple-700 w-3.5 h-3.5"
                  />
                  <span>{t.autoPrint}</span>
                </label>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black ${
                    workflowStatus === 'Verified' || workflowStatus === 'Released'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {workflowStatus === 'Verified' || workflowStatus === 'Released'
                    ? lang === 'bn'
                      ? '✓ চূড়ান্ত রিলিজের জন্য প্রস্তুত'
                      : '✓ Ready for Final Release'
                    : lang === 'bn'
                    ? 'ভেরিফিকেশন অপেক্ষমান'
                    : 'Verification Required to Release'}
                </span>
              </div>
            </div>

            {/* Action Buttons Grid */}
            <div className="space-y-2 pt-2 border-t border-slate-300 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => savePatientReport(false)}
                  className="w-full py-2.5 px-3 bg-[#2a1768] hover:bg-[#1f1052] text-white font-black rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'ড্রাফট / সংরক্ষণ' : t.saveRecord}</span>
                </button>

                <button
                  type="button"
                  onClick={handleAuthorizeVerification}
                  className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'ভেরিফাই রিপোর্ট' : 'Verify Report'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => savePatientReport(true)}
                  className="w-full py-2.5 px-3 bg-[#0e7490] hover:bg-[#08556b] text-white font-black rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md active:scale-95"
                  title={
                    lang === 'bn'
                      ? 'ভেরিফাইড রিপোর্ট চূড়ান্ত রিলিজ ও প্রিন্ট করুন'
                      : 'Final Release & Print Verified Report'
                  }
                >
                  <Printer className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'রিলিজ ও প্রিন্ট' : 'Release & Print'}</span>
                </button>

                <button
                  type="button"
                  onClick={previewReport}
                  className="w-full py-2.5 px-3 bg-[#15803d] hover:bg-[#166534] text-white font-black rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md active:scale-95"
                >
                  <Eye className="w-4 h-4" />
                  <span>{t.printPreview}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pathology Report A4 Modal */}
      {selectedPatientForReport && (
        <PathologyReportModal
          patient={selectedPatientForReport}
          onClose={() => setSelectedPatientForReport(null)}
        />
      )}

      {/* Quick Add Doctor Modal */}
      {showDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-5 border border-purple-300 dark:border-purple-800 text-xs">
            <h3 className="font-black text-base text-purple-950 dark:text-purple-200 mb-3 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-600" />
              {t.addDoctor}
            </h3>

            <div className="space-y-2.5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">Doctor Code:</label>
                <input
                  type="text"
                  value={newDocCode}
                  onChange={(e) => setNewDocCode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">Doctor Name:</label>
                <input
                  type="text"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="Prof. Dr. ..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">Degree:</label>
                  <input
                    type="text"
                    value={newDocDegree}
                    onChange={(e) => setNewDocDegree(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">Specialty:</label>
                  <input
                    type="text"
                    value={newDocSpecialty}
                    onChange={(e) => setNewDocSpecialty(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">Phone:</label>
                  <input
                    type="text"
                    value={newDocPhone}
                    onChange={(e) => setNewDocPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">Room & Fee:</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newDocRoom}
                      onChange={(e) => setNewDocRoom(e.target.value)}
                      placeholder="Room"
                      className="w-1/2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded"
                    />
                    <input
                      type="number"
                      value={newDocFee}
                      onChange={(e) => setNewDocFee(Number(e.target.value))}
                      placeholder="Fee"
                      className="w-1/2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDoctorModal(false)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 font-bold rounded cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newDocName.trim()) return;
                  addDoctor({
                    code: newDocCode.trim().toUpperCase(),
                    name: newDocName.trim(),
                    degree: newDocDegree,
                    specialty: newDocSpecialty,
                    phone: newDocPhone,
                    roomNo: newDocRoom,
                    fee: newDocFee,
                  });
                  setDrCode(newDocCode.trim().toUpperCase());
                  setShowDoctorModal(false);
                  showToast(`Doctor ${newDocName} registered!`);
                }}
                className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded cursor-pointer"
              >
                {t.saveChanges}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Test Catalog Selector Modal */}
      {showAddTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-purple-300 dark:border-purple-800 text-xs">
            <div className="p-3 bg-purple-900 text-white font-bold flex justify-between items-center">
              <span>
                {lang === 'bn'
                  ? `রেডি-মেড টেস্ট টেমপ্লেট ক্যাটালগ (${activeLabTests.length}টি)`
                  : `Ready-Made Pathology Test Catalog (${activeLabTests.length} Templates)`}
              </span>
              <button
                onClick={() => setShowAddTestModal(false)}
                className="text-white hover:text-red-300 font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-3 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 flex-1">
              {activeLabTests.map((test) => (
                <div
                  key={test.id}
                  onClick={() => {
                    addTestToResults(test);
                    setShowAddTestModal(false);
                  }}
                  className="py-2.5 px-3 hover:bg-purple-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center gap-2"
                >
                  <div>
                    <p className="font-bold text-purple-950 dark:text-purple-200 text-sm flex items-center gap-2">
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300">
                        {test.code}
                      </span>
                      <span>{test.name}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Category: <strong>{test.category}</strong> | Parameters:{' '}
                      <strong>{test.subTests?.length || 1}</strong> | Sample:{' '}
                      {test.sampleType || 'Blood/Serum'} | Method: {test.method || 'Automated'}
                    </p>
                  </div>
                  <span className="font-bold text-purple-700 dark:text-purple-300 shrink-0">
                    + {lang === 'bn' ? 'যোগ করুন' : 'Load Template'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Test Form Modal */}
      {showCustomTestModal && (
        <AddCustomTestModal
          onClose={() => setShowCustomTestModal(false)}
          onAddTest={handleAddCustomTest}
          onAddEmptyRowDirectly={addEmptyRow}
        />
      )}
    </div>
  );
};
