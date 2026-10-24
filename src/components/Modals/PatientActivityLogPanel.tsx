import React, { useState, useMemo } from 'react';
import {
  Patient,
  Invoice,
  Prescription,
  EcgReport,
  XrayReport,
  UsgReport,
  OpdAppointment,
  TestResultItem,
} from '../../types';
import {
  Activity,
  Calendar,
  Clock,
  Stethoscope,
  FlaskConical,
  Receipt,
  CreditCard,
  HeartPulse,
  Film,
  Waves,
  Search,
  ChevronDown,
  ChevronUp,
  Filter,
  ArrowDownUp,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  FileText,
  DollarSign,
  User,
  Pill,
  ExternalLink,
  Sparkles,
  Share2,
  Download,
} from 'lucide-react';
import { printElementById } from '../../utils/printHelper';

export type ActivityType = 'all' | 'visit' | 'test' | 'billing';

export interface ActivityLogItem {
  id: string;
  type: 'visit' | 'test' | 'billing';
  category: string;
  categoryLabelBn: string;
  categoryLabelEn: string;
  title: string;
  subtitle: string;
  date: string;
  time?: string;
  timestamp: number; // for chronological sorting
  actor?: string; // Dr. Name, Technologist, Cashier
  status?: string;
  statusVariant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  amount?: number;
  paidAmount?: number;
  dueAmount?: number;
  paymentMethod?: string;
  itemsCount?: number;
  tags?: string[];
  details?: {
    medicines?: { name: string; dosage: string; instruction: string; duration: string }[];
    investigations?: string[];
    chiefComplaints?: string;
    diagnosis?: string;
    advice?: string;
    testResults?: TestResultItem[];
    invoiceItems?: { testName: string; category: string; price: number }[];
    radiologicalFindings?: string;
    impression?: string;
    subtotal?: number;
    discountAmount?: number;
  };
}

interface PatientActivityLogPanelProps {
  patient: Patient;
  invoices: Invoice[];
  prescriptions: Prescription[];
  ecgReports?: EcgReport[];
  xrayReports?: XrayReport[];
  usgReports?: UsgReport[];
  appointments?: OpdAppointment[];
  lang?: 'bn' | 'en';
  clinicName?: string;
  onNavigateToBilling?: (patient: Patient) => void;
  onNavigateToDoctorVisit?: (patient: Patient) => void;
  onSelectTab?: (tab: 'visits' | 'lab' | 'billing' | 'vitals') => void;
  onExportPdf?: () => void;
  isExportingPdf?: boolean;
}

// Helper to normalize date strings to comparable timestamp
function parseDateToTimestamp(dateStr?: string, timeStr?: string): number {
  if (!dateStr) return 0;
  try {
    // If format is DD-MM-YYYY or DD/MM/YYYY
    const parts = dateStr.includes('-') ? dateStr.split('-') : dateStr.split('/');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        return new Date(`${dateStr}T${timeStr || '12:00:00'}`).getTime();
      }
      // DD-MM-YYYY
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day, 12, 0, 0).getTime();
    }
    const d = new Date(dateStr).getTime();
    return isNaN(d) ? Date.now() : d;
  } catch {
    return Date.now();
  }
}

export const PatientActivityLogPanel: React.FC<PatientActivityLogPanelProps> = ({
  patient,
  invoices,
  prescriptions,
  ecgReports = [],
  xrayReports = [],
  usgReports = [],
  appointments = [],
  lang = 'bn',
  clinicName = 'Adiba Diagnostic Center',
  onNavigateToBilling,
  onNavigateToDoctorVisit,
  onSelectTab,
  onExportPdf,
  isExportingPdf = false,
}) => {
  const [filterType, setFilterType] = useState<ActivityType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // 1. Compile all activity items into a single normalized stream
  const allActivities = useMemo(() => {
    const list: ActivityLogItem[] = [];

    // --- A. Doctor Consultations & Prescriptions ---
    prescriptions.forEach((rx) => {
      const ts = parseDateToTimestamp(rx.date);
      list.push({
        id: `rx-${rx.id}`,
        type: 'visit',
        category: 'OPD Prescription',
        categoryLabelBn: 'ডাক্তার প্রেসক্রিপশন ও ওপিডি ভিজিট',
        categoryLabelEn: 'Doctor OPD Prescription',
        title: rx.doctorName ? `ডা. ${rx.doctorName}` : 'ডাক্তার কনসাল্টেশন',
        subtitle: rx.diagnosis || rx.chiefComplaints || 'সাধারণ স্বাস্থ্য পরীক্ষা',
        date: rx.date || 'আজ',
        timestamp: ts,
        actor: rx.doctorName ? `Dr. ${rx.doctorName}` : undefined,
        status: 'Completed',
        statusVariant: 'success',
        tags: [
          ...(rx.medicines?.map((m) => m.name) || []),
          ...(rx.investigations || []),
        ],
        details: {
          medicines: rx.medicines,
          investigations: rx.investigations,
          chiefComplaints: rx.chiefComplaints,
          diagnosis: rx.diagnosis,
          advice: rx.advice,
        },
      });
    });

    // OPD Appointments (if any matched)
    appointments.forEach((app) => {
      if (
        (app.pId && app.pId.toLowerCase() === patient.pId.toLowerCase()) ||
        app.patientName.toLowerCase() === patient.patientName.toLowerCase()
      ) {
        const ts = parseDateToTimestamp(app.date, app.time);
        list.push({
          id: `app-${app.id}`,
          type: 'visit',
          category: 'Chamber Appointment',
          categoryLabelBn: 'চেম্বার অ্যাপয়েন্টমেন্ট',
          categoryLabelEn: 'Chamber Appointment',
          title: `ডা. ${app.doctorName} (${app.specialty})`,
          subtitle: `টোকেন #${app.tokenNo} · রুম: ${app.roomNo}`,
          date: app.date || patient.billDate || 'আজ',
          time: app.time,
          timestamp: ts,
          actor: app.doctorName,
          status: app.status,
          statusVariant: app.status === 'Completed' ? 'success' : app.status === 'Cancelled' ? 'danger' : 'info',
          amount: app.fee,
          details: {
            chiefComplaints: app.chiefComplaints,
            diagnosis: app.diagnosis,
          },
        });
      }
    });

    // --- B. Tests Performed (Pathology, ECG, X-Ray, USG) ---
    // 1) Pathology Lab Results
    if (patient.testResults && patient.testResults.length > 0) {
      const hasCompleted = patient.testResults.some((t) => t.result && t.result.trim() !== '');
      const ts = parseDateToTimestamp(patient.billDate || patient.invDate);
      list.push({
        id: `pathology-${patient.id}`,
        type: 'test',
        category: 'Pathology Investigation',
        categoryLabelBn: 'প্যাথলজি ল্যাব টেস্ট ও রিপোর্ট',
        categoryLabelEn: 'Pathology Lab Examination',
        title: `প্যাথলজি পরীক্ষা (${patient.testResults.length}টি টেস্ট প্যারামিটার)`,
        subtitle: patient.testResults.map((t) => t.testName).slice(0, 3).join(', ') + (patient.testResults.length > 3 ? '...' : ''),
        date: patient.billDate || patient.invDate || 'আজ',
        timestamp: ts,
        actor: patient.drName ? `রেফারেল: ডা. ${patient.drName}` : 'ল্যাব টেকনোলজিস্ট',
        status: hasCompleted ? (patient.status || 'Completed') : 'Pending',
        statusVariant: hasCompleted ? 'success' : 'warning',
        itemsCount: patient.testResults.length,
        tags: patient.testResults.map((t) => t.testName),
        details: {
          testResults: patient.testResults,
        },
      });
    }

    // 2) ECG Reports
    ecgReports.forEach((ecg) => {
      const ts = parseDateToTimestamp(ecg.date);
      list.push({
        id: `ecg-${ecg.id}`,
        type: 'test',
        category: 'ECG Tracing',
        categoryLabelBn: '১২-লিড ইসিজি ট্রেসিং রিপোর্ট',
        categoryLabelEn: '12-Lead ECG Tracing',
        title: '১২-লিড ইসিজি ট্রেসিং পরীক্ষা',
        subtitle: ecg.impression || ecg.rhythm || 'স্বাভাবিক সাইনাস রিদম',
        date: ecg.date,
        timestamp: ts,
        actor: ecg.cardiologist ? `কার্ডিওলজিস্ট: ${ecg.cardiologist}` : (ecg.drCode ? `ডা. ${ecg.drCode}` : undefined),
        status: 'Completed',
        statusVariant: 'info',
        details: {
          radiologicalFindings: `রিদম: ${ecg.rhythm} | হার্ট রেট: ${ecg.heartRate} bpm | PR: ${ecg.prInterval} | ST: ${ecg.stSegment}`,
          impression: ecg.impression,
        },
      });
    });

    // 3) Digital X-Ray Reports
    xrayReports.forEach((xray) => {
      const ts = parseDateToTimestamp(xray.date);
      list.push({
        id: `xray-${xray.id}`,
        type: 'test',
        category: 'Digital X-Ray',
        categoryLabelBn: 'ডিজিটাল এক্স-রে রেডিওগ্রাফি',
        categoryLabelEn: 'Digital X-Ray Film',
        title: `ডিজিটাল এক্স-রে: ${xray.investigation || 'Chest X-Ray'}`,
        subtitle: xray.impression || xray.lungFields || 'রেডিওলজিক্যাল পর্যবেক্ষণ',
        date: xray.date,
        timestamp: ts,
        actor: xray.radiologist ? `রেডিওলজিস্ট: ${xray.radiologist}` : (xray.drCode ? `ডা. ${xray.drCode}` : undefined),
        status: 'Completed',
        statusVariant: 'info',
        details: {
          radiologicalFindings: `ফুসফুস: ${xray.lungFields} | হার্ট সাইজ: ${xray.heartSize} | রিব ও বোন: ${xray.bonyCage}`,
          impression: xray.impression,
        },
      });
    });

    // 4) Ultrasound Reports
    usgReports.forEach((usg) => {
      const ts = parseDateToTimestamp(usg.date);
      list.push({
        id: `usg-${usg.id}`,
        type: 'test',
        category: 'Ultrasound',
        categoryLabelBn: 'আল্ট্রাসনোগ্রাম ডপলার স্টাডি',
        categoryLabelEn: 'Ultrasound Doppler',
        title: `ইউএসজি স্ক্যান: ${usg.scanType || 'Whole Abdomen USG'}`,
        subtitle: usg.impression || usg.liver || 'সোনোগ্রাফিক ফাইন্ডিংস',
        date: usg.date,
        timestamp: ts,
        actor: usg.sonologist ? `সোনোলজিস্ট: ${usg.sonologist}` : (usg.drCode ? `ডা. ${usg.drCode}` : undefined),
        status: 'Completed',
        statusVariant: 'info',
        details: {
          radiologicalFindings: `লিভার: ${usg.liver} | কিডনি: ${usg.kidneys} | গলব্লাডার: ${usg.gallBladder}`,
          impression: usg.impression,
        },
      });
    });

    // --- C. Billing History & Financial Transactions ---
    invoices.forEach((inv) => {
      const ts = parseDateToTimestamp(inv.date);
      list.push({
        id: `inv-${inv.id}`,
        type: 'billing',
        category: 'Cash Receipt',
        categoryLabelBn: 'বিলিং ইনভয়েস ও ক্যাশ মেমো',
        categoryLabelEn: 'Billing Cash Memo',
        title: `ইনভয়েস #${inv.invoiceNo} (ক্যাশ মেমো)`,
        subtitle: `${inv.items?.length || 0}টি টেস্ট/সেবা · নিট: ৳${inv.netTotal}`,
        date: inv.date || 'আজ',
        timestamp: ts,
        actor: `কাউন্টার বিলার · ${inv.drCode || 'General'}`,
        status: inv.status,
        statusVariant: inv.status === 'Paid' ? 'success' : inv.status === 'Partial' ? 'warning' : 'danger',
        amount: inv.netTotal,
        paidAmount: inv.paidAmount,
        dueAmount: inv.dueAmount,
        paymentMethod: inv.paymentMethod,
        itemsCount: inv.items?.length || 0,
        tags: inv.items?.map((it) => it.testName) || [],
        details: {
          invoiceItems: inv.items,
          subtotal: inv.subtotal,
          discountAmount: inv.discountAmount,
        },
      });
    });

    return list;
  }, [patient, invoices, prescriptions, ecgReports, xrayReports, usgReports, appointments]);

  // Aggregate statistics
  const stats = useMemo(() => {
    const visitsCount = allActivities.filter((a) => a.type === 'visit').length;
    const testsCount = allActivities.filter((a) => a.type === 'test').length;
    const billingCount = allActivities.filter((a) => a.type === 'billing').length;

    const totalBilled = invoices.reduce((sum, i) => sum + (i.netTotal || 0), 0);
    const totalPaid = invoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
    const totalDue = invoices.reduce((sum, i) => sum + (i.dueAmount || 0), 0);

    return {
      totalEvents: allActivities.length,
      visitsCount,
      testsCount,
      billingCount,
      totalBilled,
      totalPaid,
      totalDue,
    };
  }, [allActivities, invoices]);

  // 2. Filter & Search
  const filteredActivities = useMemo(() => {
    let result = allActivities;

    if (filterType !== 'all') {
      result = result.filter((item) => item.type === filterType);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.categoryLabelBn.toLowerCase().includes(q) ||
          item.categoryLabelEn.toLowerCase().includes(q) ||
          (item.actor && item.actor.toLowerCase().includes(q)) ||
          item.date.toLowerCase().includes(q) ||
          (item.tags && item.tags.some((t) => t.toLowerCase().includes(q))) ||
          (item.details?.diagnosis && item.details.diagnosis.toLowerCase().includes(q))
      );
    }

    // Sort order
    return [...result].sort((a, b) => {
      if (sortOrder === 'desc') {
        return b.timestamp - a.timestamp;
      } else {
        return a.timestamp - b.timestamp;
      }
    });
  }, [allActivities, filterType, searchQuery, sortOrder]);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpandAll = () => {
    const allExpanded = filteredActivities.every((item) => expandedItems[item.id]);
    if (allExpanded) {
      setExpandedItems({});
    } else {
      const next: Record<string, boolean> = {};
      filteredActivities.forEach((item) => {
        next[item.id] = true;
      });
      setExpandedItems(next);
    }
  };

  const handlePrintLog = () => {
    setIsPrinting(true);
    printElementById('patient-activity-printable-timeline', {
      pageTitle: `ActivityLog-${patient.pId}-${patient.patientName}`,
      onAfterPrint: () => setIsPrinting(false),
    });
    setTimeout(() => setIsPrinting(false), 2000);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* ======================================================== */}
      {/* TOP KPI CARDS: OVERALL PATIENT JOURNEY METRICS */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Total Activities */}
        <div className="p-3 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 rounded-2xl border border-purple-200 dark:border-purple-800/60 shadow-xs">
          <div className="flex items-center justify-between text-purple-700 dark:text-purple-300 font-bold text-[10px] uppercase tracking-wider">
            <span>{lang === 'bn' ? 'মোট কার্যক্রম' : 'Total Activities'}</span>
            <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-xl font-black text-purple-950 dark:text-purple-100 mt-1">
            {stats.totalEvents} <span className="text-xs font-normal text-slate-500">{lang === 'bn' ? 'টি এন্ট্রি' : 'events'}</span>
          </div>
          <div className="text-[10px] text-purple-600 dark:text-purple-400 mt-0.5">
            {lang === 'bn' ? 'সম্পূর্ণ রোগী ইতিহাস' : 'Complete history'}
          </div>
        </div>

        {/* Doctor Visits */}
        <div className="p-3 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/40 dark:to-rose-950/40 rounded-2xl border border-pink-200 dark:border-pink-800/60 shadow-xs">
          <div className="flex items-center justify-between text-pink-700 dark:text-pink-300 font-bold text-[10px] uppercase tracking-wider">
            <span>{lang === 'bn' ? 'ডাক্তার ভিজিট' : 'Doctor Visits'}</span>
            <Stethoscope className="w-4 h-4 text-pink-600 dark:text-pink-400" />
          </div>
          <div className="text-xl font-black text-pink-950 dark:text-pink-100 mt-1">
            {stats.visitsCount} <span className="text-xs font-normal text-slate-500">{lang === 'bn' ? 'বার' : 'times'}</span>
          </div>
          <div className="text-[10px] text-pink-600 dark:text-pink-400 mt-0.5">
            {lang === 'bn' ? 'ওপিডি ও চেম্বার' : 'OPD & Chamber'}
          </div>
        </div>

        {/* Tests Performed */}
        <div className="p-3 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40 rounded-2xl border border-teal-200 dark:border-teal-800/60 shadow-xs">
          <div className="flex items-center justify-between text-teal-700 dark:text-teal-300 font-bold text-[10px] uppercase tracking-wider">
            <span>{lang === 'bn' ? 'টেস্ট ও ডায়াগনস্টিক' : 'Tests Performed'}</span>
            <FlaskConical className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-xl font-black text-teal-950 dark:text-teal-100 mt-1">
            {stats.testsCount} <span className="text-xs font-normal text-slate-500">{lang === 'bn' ? 'টি বিভাগ' : 'sessions'}</span>
          </div>
          <div className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5">
            {lang === 'bn' ? 'ল্যাব, ইসিজি, এক্সরে, ইউএসজি' : 'Lab & Imaging'}
          </div>
        </div>

        {/* Billing & Due */}
        <div
          className={`p-3 rounded-2xl border shadow-xs ${
            stats.totalDue > 0
              ? 'bg-gradient-to-br from-amber-50 to-rose-50 dark:from-amber-950/40 dark:to-rose-950/40 border-amber-300 dark:border-amber-800/60'
              : 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-emerald-300 dark:border-emerald-800/60'
          }`}
        >
          <div className="flex items-center justify-between font-bold text-[10px] uppercase tracking-wider">
            <span className={stats.totalDue > 0 ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-800 dark:text-emerald-300'}>
              {lang === 'bn' ? 'বিলিং ও ব্যালেন্স' : 'Billing & Balance'}
            </span>
            <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1 font-mono">
            ৳{stats.totalPaid} <span className="text-xs text-slate-500 font-normal">/ ৳{stats.totalBilled}</span>
          </div>
          <div
            className={`text-[10px] font-bold mt-0.5 ${
              stats.totalDue > 0 ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {stats.totalDue > 0 ? `বকেয়া: ৳${stats.totalDue}` : lang === 'bn' ? 'পরিশোধিত ✓' : 'Paid in Full ✓'}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* FILTER CONTROLS & SEARCH BAR */}
      {/* ======================================================== */}
      <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Activity Category Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                filterType === 'all'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'সকল কার্যক্রম' : 'All Activities'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {allActivities.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('visit')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                filterType === 'visit'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-pink-400" />
              <span>{lang === 'bn' ? 'ডাক্তার ভিজিট' : 'Visits'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {stats.visitsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('test')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                filterType === 'test'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5 text-teal-400" />
              <span>{lang === 'bn' ? 'ল্যাব ও পরীক্ষা' : 'Tests Performed'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {stats.testsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('billing')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                filterType === 'billing'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'bn' ? 'বিলিং ও পেমেন্ট' : 'Billing History'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {stats.billingCount}
              </span>
            </button>
          </div>

          {/* Quick Actions (Sort, Expand, Print) */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="p-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
              title={sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
            >
              <ArrowDownUp className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden md:inline">
                {sortOrder === 'desc' ? (lang === 'bn' ? 'নতুন আগে' : 'Newest') : (lang === 'bn' ? 'পুরনো আগে' : 'Oldest')}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleExpandAll}
              className="p-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
              title="Expand/Collapse All Details"
            >
              <span className="text-[10px] px-1 font-bold">
                {filteredActivities.every((i) => expandedItems[i.id])
                  ? (lang === 'bn' ? 'সব ছোট করুন' : 'Collapse')
                  : (lang === 'bn' ? 'সব বড় করুন' : 'Expand')}
              </span>
            </button>

            <button
              type="button"
              onClick={handlePrintLog}
              disabled={isPrinting}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              title="Print Patient Activity Statement"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="text-[11px]">{isPrinting ? 'প্রিন্ট...' : (lang === 'bn' ? 'লগ প্রিন্ট' : 'Print Log')}</span>
            </button>

            {onExportPdf && (
              <button
                type="button"
                onClick={onExportPdf}
                disabled={isExportingPdf}
                className="px-2.5 py-1.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                title={lang === 'bn' ? 'সম্পূর্ণ রোগীর ভিজিট ও মেডিকেল হিস্ট্রি PDF ডাউনলোড করুন' : 'Export complete visit and medical history as PDF'}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="text-[11px]">
                  {isExportingPdf
                    ? (lang === 'bn' ? 'তৈরি হচ্ছে...' : 'Generating...')
                    : (lang === 'bn' ? 'পিডিএফ এক্সপোর্ট' : 'Export PDF')}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Live Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'bn'
                ? 'কার্যক্রম খুঁজুন (ডাক্তারের নাম, টেস্টের নাম, ইনভয়েস নম্বর, ডায়াগনসিস বা ওষুধ)...'
                : 'Search activities (Doctor, test name, invoice #, diagnosis, drug)...'
            }
            className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* TIMELINE STREAM OF PATIENT ACTIVITIES */}
      {/* ======================================================== */}
      <div id="patient-activity-printable-timeline" className="space-y-3">
        {filteredActivities.length === 0 ? (
          <div className="p-10 text-center bg-slate-50 dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-2">
            <Activity className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <h4 className="font-bold text-slate-700 dark:text-slate-300">
              {lang === 'bn' ? 'কোনো কার্যক্রম পাওয়া যায়নি' : 'No activities matched your search'}
            </h4>
            <p className="text-slate-500 text-[11px]">
              {lang === 'bn'
                ? 'ফিল্টার পরিবর্তন করুন অথবা নতুন টেস্ট বা ভিজিট যুক্ত করুন।'
                : 'Try clearing the search or adding new tests or visits.'}
            </p>
          </div>
        ) : (
          <div className="relative border-l-2 border-purple-200 dark:border-slate-700 ml-4 sm:ml-5 pl-4 sm:pl-6 space-y-4">
            {filteredActivities.map((act) => {
              const isExpanded = !!expandedItems[act.id];

              // Pick category-specific color tokens
              let borderAccent = 'border-purple-200 dark:border-slate-800';
              let iconBg = 'bg-purple-900 text-white';
              let badgeColor = 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300';

              if (act.type === 'visit') {
                borderAccent = 'border-pink-200 dark:border-pink-900/60';
                iconBg = 'bg-pink-600 text-white';
                badgeColor = 'bg-pink-100 text-pink-900 dark:bg-pink-950 dark:text-pink-300';
              } else if (act.type === 'test') {
                borderAccent = 'border-teal-200 dark:border-teal-900/60';
                iconBg = 'bg-teal-600 text-white';
                badgeColor = 'bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-300';
              } else if (act.type === 'billing') {
                borderAccent = 'border-emerald-200 dark:border-emerald-900/60';
                iconBg = 'bg-emerald-600 text-white';
                badgeColor = 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300';
              }

              return (
                <div key={act.id} className="relative group">
                  {/* Timeline Dot Icon on the Left Border */}
                  <div
                    className={`absolute -left-[27px] sm:-left-[35px] top-3.5 w-6 h-6 rounded-full ${iconBg} ring-4 ring-white dark:ring-slate-900 flex items-center justify-center shadow-sm shrink-0`}
                  >
                    {act.type === 'visit' && <Stethoscope className="w-3 h-3 text-white" />}
                    {act.type === 'test' && <FlaskConical className="w-3 h-3 text-white" />}
                    {act.type === 'billing' && <Receipt className="w-3 h-3 text-white" />}
                  </div>

                  {/* Main Event Card */}
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-850 border ${borderAccent} shadow-xs transition hover:shadow-md space-y-2.5`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide ${badgeColor}`}>
                          {lang === 'bn' ? act.categoryLabelBn : act.categoryLabelEn}
                        </span>

                        {act.status && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              act.statusVariant === 'success'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : act.statusVariant === 'warning'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : act.statusVariant === 'danger'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {act.status}
                          </span>
                        )}

                        {act.actor && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{act.actor}</span>
                          </span>
                        )}
                      </div>

                      {/* Date & Time Stamp */}
                      <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px] shrink-0">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{act.date}</span>
                        {act.time && (
                          <>
                            <span>·</span>
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{act.time}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Headline and Subtitle */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {act.title}
                        </h4>
                        <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
                          {act.subtitle}
                        </p>
                      </div>

                      {/* Financial Figure for Billing / Consultations */}
                      {act.amount !== undefined && (
                        <div className="text-right shrink-0 font-mono">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">
                            {act.type === 'billing' ? 'Net Amount' : 'Fee'}
                          </div>
                          <div className="text-sm font-black text-slate-900 dark:text-slate-100">
                            ৳{act.amount}
                          </div>
                          {act.dueAmount !== undefined && act.dueAmount > 0 && (
                            <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                              Due: ৳{act.dueAmount}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tags (Tests or Medicines preview) */}
                    {act.tags && act.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-1">
                        {act.tags.slice(0, 5).map((tg, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-[10px] font-semibold border border-slate-200 dark:border-slate-700"
                          >
                            {tg}
                          </span>
                        ))}
                        {act.tags.length > 5 && (
                          <span className="text-[10px] text-slate-400 font-bold">
                            +{act.tags.length - 5} {lang === 'bn' ? 'আরও' : 'more'}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Expand Details Trigger */}
                    {act.details && (
                      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => toggleExpand(act.id)}
                          className="text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:text-purple-900 flex items-center gap-1 cursor-pointer transition"
                        >
                          <span>{isExpanded ? (lang === 'bn' ? 'বিস্তারিত লুকান' : 'Hide Details') : (lang === 'bn' ? 'বিস্তারিত দেখুন' : 'View Full Details')}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {/* Direct module deep links */}
                        {act.type === 'visit' && onSelectTab && (
                          <button
                            type="button"
                            onClick={() => onSelectTab('visits')}
                            className="text-[10px] text-slate-500 hover:text-pink-600 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>{lang === 'bn' ? 'প্রেসক্রিপশন মডিউল' : 'Rx Module'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                        {act.type === 'test' && onSelectTab && (
                          <button
                            type="button"
                            onClick={() => onSelectTab('lab')}
                            className="text-[10px] text-slate-500 hover:text-teal-600 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>{lang === 'bn' ? 'ল্যাব রিপোর্ট মডিউল' : 'Lab Module'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                        {act.type === 'billing' && onSelectTab && (
                          <button
                            type="button"
                            onClick={() => onSelectTab('billing')}
                            className="text-[10px] text-slate-500 hover:text-emerald-600 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>{lang === 'bn' ? 'বিলিং মডিউল' : 'Billing Module'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Expandable Details Body */}
                    {isExpanded && act.details && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs animate-in fade-in duration-150">
                        {/* 1. If Visit: Medicines & Observations */}
                        {act.details.medicines && act.details.medicines.length > 0 && (
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1 flex items-center gap-1">
                              <Pill className="w-3.5 h-3.5 text-pink-600" />
                              <span>{lang === 'bn' ? 'প্রেসক্রিপশনভুক্ত ওষুধসমূহ:' : 'Prescribed Medications:'}</span>
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {act.details.medicines.map((m, idx) => (
                                <div
                                  key={idx}
                                  className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                                >
                                  <strong className="text-slate-900 dark:text-slate-100">{m.name}</strong>
                                  <div className="text-[10px] text-slate-500">
                                    {m.dosage} · {m.instruction} · {m.duration}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 2. If Visit: Diagnosis & Advice */}
                        {act.details.diagnosis && (
                          <div>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {lang === 'bn' ? 'ক্লিনিক্যাল ডায়াগনসিস: ' : 'Clinical Diagnosis: '}
                            </span>
                            <span className="text-slate-900 dark:text-slate-100">{act.details.diagnosis}</span>
                          </div>
                        )}

                        {act.details.advice && (
                          <div>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {lang === 'bn' ? 'পরামর্শ ও নির্দেশিকা: ' : 'Advice & Instructions: '}
                            </span>
                            <span className="text-slate-800 dark:text-slate-200">{act.details.advice}</span>
                          </div>
                        )}

                        {/* 3. If Test: Detailed Parameter Results */}
                        {act.details.testResults && act.details.testResults.length > 0 && (
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1 flex items-center gap-1">
                              <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
                              <span>{lang === 'bn' ? 'টেস্ট ফলাফল ও রেফারেন্স রেঞ্জ:' : 'Test Findings & Normal Ranges:'}</span>
                            </span>
                            <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                              <table className="w-full text-left text-[11px] border-collapse bg-white dark:bg-slate-800">
                                <thead className="bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold">
                                  <tr>
                                    <th className="p-1.5 border-b border-r border-slate-200 dark:border-slate-700">Test Parameter</th>
                                    <th className="p-1.5 border-b border-r border-slate-200 dark:border-slate-700 text-center">Result</th>
                                    <th className="p-1.5 border-b border-r border-slate-200 dark:border-slate-700 text-center">Unit</th>
                                    <th className="p-1.5 border-b border-slate-200 dark:border-slate-700 text-center">Reference Range</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                  {act.details.testResults.map((tr, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                                      <td className="p-1.5 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700">
                                        {tr.testName}
                                      </td>
                                      <td className="p-1.5 text-center font-bold text-slate-950 dark:text-slate-50 border-r border-slate-200 dark:border-slate-700">
                                        <span
                                          className={`px-1.5 py-0.2 rounded font-black ${
                                            tr.status === 'High'
                                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                              : tr.status === 'Low'
                                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                              : 'text-slate-800 dark:text-slate-200'
                                          }`}
                                        >
                                          {tr.result || 'Pending'}
                                        </span>
                                      </td>
                                      <td className="p-1.5 text-center text-slate-500 border-r border-slate-200 dark:border-slate-700">
                                        {tr.unit || '-'}
                                      </td>
                                      <td className="p-1.5 text-center text-slate-500 font-mono text-[10px]">
                                        {tr.normalRange || '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* 4. If Imaging: Findings & Impression */}
                        {act.details.radiologicalFindings && (
                          <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">Findings:</span>
                            <p className="text-slate-700 dark:text-slate-300">{act.details.radiologicalFindings}</p>
                          </div>
                        )}
                        {act.details.impression && (
                          <div className="p-2 bg-purple-50/60 dark:bg-purple-950/40 rounded-lg border border-purple-200 dark:border-purple-800">
                            <span className="font-bold text-purple-950 dark:text-purple-200 block mb-0.5">Clinical Impression:</span>
                            <p className="text-purple-900 dark:text-purple-300 font-semibold">{act.details.impression}</p>
                          </div>
                        )}

                        {/* 5. If Billing: Invoiced Items & Cost Breakdown */}
                        {act.details.invoiceItems && act.details.invoiceItems.length > 0 && (
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1 flex items-center gap-1">
                              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{lang === 'bn' ? 'বিলকৃত টেস্ট ও সেবাসমূহ:' : 'Invoiced Items & Services:'}</span>
                            </span>
                            <div className="space-y-1">
                              {act.details.invoiceItems.map((it, idx) => (
                                <div
                                  key={idx}
                                  className="p-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                                >
                                  <div>
                                    <strong className="text-slate-900 dark:text-slate-100">{it.testName}</strong>
                                    <span className="text-[10px] text-slate-500 ml-2">({it.category})</span>
                                  </div>
                                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                    ৳{it.price}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Financial Summary */}
                            <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-[11px] font-mono">
                              <div>
                                <span>Subtotal: ৳{act.details.subtotal || act.amount}</span>
                                {act.details.discountAmount ? (
                                  <span className="text-emerald-700 ml-2 font-bold">-৳{act.details.discountAmount} (Less)</span>
                                ) : null}
                              </div>
                              <div className="font-bold">
                                <span>Paid: ৳{act.paidAmount || 0}</span>
                                <span className={`ml-2 ${act.dueAmount ? 'text-rose-600' : 'text-emerald-700'}`}>
                                  Due: ৳{act.dueAmount || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info Box */}
      <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-900 text-[11px] text-purple-950 dark:text-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
          <span>
            {lang === 'bn'
              ? 'এই অ্যাক্টিভিটি টাইমলাইনে রোগীর সকল ডাক্তার ভিজিট, প্যাথলজি টেস্ট, ইমেজিং এবং বিলিং স্বয়ংক্রিয়ভাবে সিঙ্ক হয়।'
              : 'Unified patient timeline synchronizes all doctor visits, diagnostic tests, imaging, and payments.'}
          </span>
        </div>
        <div className="font-mono text-purple-700 dark:text-purple-300 font-bold shrink-0">
          PID: {patient.pId} · {patient.patientName}
        </div>
      </div>
    </div>
  );
};
