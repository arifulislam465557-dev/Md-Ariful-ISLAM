import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Patient, Invoice, Prescription } from '../../types';
import {
  X,
  User,
  Phone,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  FileText,
  Receipt,
  Stethoscope,
  FlaskConical,
  CreditCard,
  Printer,
  ChevronRight,
  Copy,
  Check,
  Film,
  Waves,
  Activity,
  ArrowUpRight,
  ExternalLink,
  ShieldAlert,
  HeartPulse,
  Thermometer,
  TrendingUp,
  Plus,
  Scale,
  Droplets,
  Trash2,
  Download,
} from 'lucide-react';

export interface VitalRecord {
  id: string;
  date: string;
  time?: string;
  systolic: number; // mmHg
  diastolic: number; // mmHg
  pulse: number; // bpm
  temperature: number; // °F
  spO2?: number; // %
  weight?: number; // kg
  notes?: string;
  recordedBy?: string;
}

import { PatientVitalsPanel } from './PatientVitalsPanel';
import { PatientActivityLogPanel } from './PatientActivityLogPanel';
import { generatePatientHistoryPdf } from '../../utils/pdfGenerator';

interface PatientOverviewModalProps {
  patient: Patient | null;
  onClose: () => void;
  onNavigateToBilling?: (patient: Patient) => void;
  onNavigateToDoctorVisit?: (patient: Patient) => void;
}

export const PatientOverviewModal: React.FC<PatientOverviewModalProps> = ({
  patient,
  onClose,
  onNavigateToBilling,
  onNavigateToDoctorVisit,
}) => {
  const {
    patients,
    invoices,
    prescriptions,
    ecgReports,
    xrayReports,
    usgReports,
    lang,
    setActiveTab,
    setSelectedPatientForReport,
    clinicConfig,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'activityLog' | 'visits' | 'lab' | 'billing' | 'vitals'>('activityLog');
  const [copiedPid, setCopiedPid] = useState(false);
  const [labFilter, setLabFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!patient) return null;

  // All pathology lab reports for this patient ID (supports multiple accession orders)
  const patientLabReports = useMemo(() => {
    const matches = patients.filter((p) => p.pId === patient.pId);
    return matches.length > 0 ? matches : [patient];
  }, [patients, patient]);

  // Find all patient records matching this PID
  const patientInvoices = useMemo(
    () => invoices.filter((inv) => inv.pId === patient.pId),
    [invoices, patient.pId]
  );

  const patientPrescriptions = useMemo(
    () => prescriptions.filter((rx) => rx.pId === patient.pId || rx.patientName === patient.patientName),
    [prescriptions, patient.pId, patient.patientName]
  );

  const patientEcg = useMemo(
    () => ecgReports.filter((e) => e.pId === patient.pId),
    [ecgReports, patient.pId]
  );

  const patientXray = useMemo(
    () => xrayReports.filter((x) => x.pId === patient.pId),
    [xrayReports, patient.pId]
  );

  const patientUsg = useMemo(
    () => usgReports.filter((u) => u.pId === patient.pId),
    [usgReports, patient.pId]
  );

  // Financial aggregates
  const totalBilled = patientInvoices.reduce((sum, inv) => sum + (inv.netTotal || 0), 0);
  const totalPaid = patientInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalDue = patientInvoices.reduce((sum, inv) => sum + (inv.dueAmount || 0), 0);

  // Combined Lab test results across all reports for this patient
  const testResults = useMemo(
    () => patientLabReports.flatMap((r) => r.testResults || []),
    [patientLabReports]
  );

  const totalActivityCount = useMemo(() => {
    return (
      patientPrescriptions.length +
      patientLabReports.filter((r) => r.testResults && r.testResults.length > 0).length +
      patientInvoices.length +
      patientEcg.length +
      patientXray.length +
      patientUsg.length
    );
  }, [patientPrescriptions, patientLabReports, patientInvoices, patientEcg, patientXray, patientUsg]);

  const pendingTests = testResults.filter(
    (t) => t.status === 'Pending' || !t.result || t.result.trim() === ''
  );
  const completedTests = testResults.filter(
    (t) => t.status !== 'Pending' && t.result && t.result.trim() !== ''
  );

  const filteredTests = useMemo(() => {
    if (labFilter === 'pending') return pendingTests;
    if (labFilter === 'completed') return completedTests;
    return testResults;
  }, [labFilter, pendingTests, completedTests, testResults]);

  const copyPid = () => {
    navigator.clipboard.writeText(patient.pId);
    setCopiedPid(true);
    setTimeout(() => setCopiedPid(false), 2000);
  };

  const handlePrintSummary = () => {
    window.print();
  };

  const handleExportPdf = () => {
    try {
      setIsExportingPdf(true);
      generatePatientHistoryPdf({
        patient,
        clinic: clinicConfig,
        invoices: patientInvoices,
        prescriptions: patientPrescriptions,
        ecgReports: patientEcg,
        xrayReports: patientXray,
        usgReports: patientUsg,
        autoDownload: true,
      });
    } catch (err) {
      console.error('Error generating patient history PDF:', err);
    } finally {
      setTimeout(() => setIsExportingPdf(false), 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-purple-200 dark:border-gray-700 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* ======================================================== */}
        {/* MODAL HEADER: PATIENT PROFILE & QUICK SUMMARY */}
        {/* ======================================================== */}
        <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 shrink-0 relative">
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition cursor-pointer border border-white/20 shadow-xs"
              title={lang === 'bn' ? 'সম্পূর্ণ রোগীর মেডিকেল ইতিহাস PDF ডাউনলোড' : 'Export complete visit and medical history as PDF'}
            >
              <Download className="w-3.5 h-3.5 text-pink-300" />
              <span className="hidden sm:inline">
                {isExportingPdf
                  ? (lang === 'bn' ? 'তৈরি হচ্ছে...' : 'Exporting...')
                  : (lang === 'bn' ? 'পিডিএফ এক্সপোর্ট' : 'Export PDF')}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-8">
            <div className="flex items-start gap-4">
              {/* Patient Avatar */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-white/20 shrink-0">
                {patient.patientName?.charAt(0)?.toUpperCase() || 'P'}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-white tracking-wide">
                    {patient.patientName}
                  </h2>
                  <button
                    type="button"
                    onClick={copyPid}
                    className="flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-pink-200 hover:bg-white/25 transition cursor-pointer border border-white/10"
                    title="Click to copy PID"
                  >
                    <span>PID: {patient.pId}</span>
                    {copiedPid ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs text-purple-200/90 mt-1 flex-wrap font-medium">
                  <span>{patient.age}</span>
                  <span>·</span>
                  <span className="capitalize">{patient.sex}</span>
                  {patient.phone && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-pink-300" />
                        {patient.phone}
                      </span>
                    </>
                  )}
                  {patient.drName && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-pink-300">
                        <Stethoscope className="w-3 h-3" />
                        Dr. {patient.drName}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick KPI Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Due Balance Badge */}
              <div
                className={`px-3.5 py-2 rounded-2xl border text-center ${
                  totalDue > 0
                    ? 'bg-rose-500/20 border-rose-400/50 text-rose-200'
                    : 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                  {lang === 'bn' ? 'বকেয়া ব্যালেন্স' : 'Due Balance'}
                </div>
                <div className="text-sm font-black mt-0.5">
                  {totalDue > 0 ? `৳${totalDue}` : lang === 'bn' ? 'পরিশোধিত (৳০)' : 'Cleared (৳0)'}
                </div>
              </div>

              {/* Pending Tests Badge */}
              <div
                className={`px-3.5 py-2 rounded-2xl border text-center ${
                  pendingTests.length > 0
                    ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                    : 'bg-indigo-500/20 border-indigo-400/50 text-indigo-200'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                  {lang === 'bn' ? 'পেন্ডিং টেস্ট' : 'Pending Tests'}
                </div>
                <div className="text-sm font-black mt-0.5">
                  {pendingTests.length > 0
                    ? `${pendingTests.length} ${lang === 'bn' ? 'টি বাকি' : 'Pending'}`
                    : lang === 'bn' ? 'সকল টেস্ট সম্পন্ন' : 'Completed ✓'}
                </div>
              </div>

              {/* Total Visits Badge */}
              <div className="px-3.5 py-2 rounded-2xl border bg-white/10 border-white/20 text-center text-white">
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                  {lang === 'bn' ? 'মোট ভিজিট' : 'Total Visits'}
                </div>
                <div className="text-sm font-black mt-0.5">
                  {patientPrescriptions.length + (patientInvoices.length > 0 ? 1 : 0)}{' '}
                  {lang === 'bn' ? 'বার' : 'times'}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex gap-2 mt-5 border-t border-white/10 pt-3 text-xs font-bold overflow-x-auto pb-1 scrollbar-none">
            {/* Tab 0: Comprehensive Activity History Log */}
            <button
              type="button"
              onClick={() => setActiveSubTab('activityLog')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
                activeSubTab === 'activityLog'
                  ? 'bg-white text-purple-950 shadow-md font-black'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>{lang === 'bn' ? 'কার্যক্রম ইতিহাস (Activity Log)' : 'Activity History Log'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-pink-500 text-white font-black ml-0.5">
                {totalActivityCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('visits')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
                activeSubTab === 'visits'
                  ? 'bg-white text-purple-950 shadow-md font-black'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              <Stethoscope className="w-4 h-4 text-pink-500" />
              <span>{lang === 'bn' ? 'ভিজিট ও প্রেসক্রিপশন' : 'Visits & Rx'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-200 text-purple-900 font-bold ml-1">
                {patientPrescriptions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('lab')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
                activeSubTab === 'lab'
                  ? 'bg-white text-purple-950 shadow-md font-black'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              <FlaskConical className="w-4 h-4 text-cyan-500" />
              <span>{lang === 'bn' ? 'ল্যাব ও ডায়াগনস্টিক' : 'Lab & Imaging'}</span>
              {pendingTests.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-amber-950 font-bold ml-1 animate-pulse">
                  {pendingTests.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('billing')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
                activeSubTab === 'billing'
                  ? 'bg-white text-purple-950 shadow-md font-black'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              <Receipt className="w-4 h-4 text-emerald-500" />
              <span>{lang === 'bn' ? 'বিলিং ও লেজার' : 'Billing & Ledger'}</span>
              {totalDue > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold ml-1">
                  ৳{totalDue}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('vitals')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
                activeSubTab === 'vitals'
                  ? 'bg-white text-purple-950 shadow-md font-black'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              <HeartPulse className="w-4 h-4 text-rose-400" />
              <span>{lang === 'bn' ? 'ভাইটালস ও গ্রাফ' : 'Vitals & Chart'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold ml-1">
                New
              </span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MODAL BODY */}
        {/* ======================================================== */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-xs">
          {/* TAB 0: COMPREHENSIVE ACTIVITY HISTORY LOG */}
          {activeSubTab === 'activityLog' && (
            <PatientActivityLogPanel
              patient={patient}
              invoices={patientInvoices}
              prescriptions={patientPrescriptions}
              ecgReports={patientEcg}
              xrayReports={patientXray}
              usgReports={patientUsg}
              lang={lang}
              clinicName={clinicConfig.clinicName}
              onNavigateToBilling={onNavigateToBilling}
              onNavigateToDoctorVisit={onNavigateToDoctorVisit}
              onSelectTab={(tab) => setActiveSubTab(tab)}
              onExportPdf={handleExportPdf}
              isExportingPdf={isExportingPdf}
            />
          )}

          {/* TAB 1: VISIT HISTORY & PRESCRIPTIONS */}
          {activeSubTab === 'visits' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2 dark:border-gray-700">
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-purple-700" />
                  <span>{lang === 'bn' ? 'ডাক্তার কনসাল্টেশন ও প্রেসক্রিপশন হিস্ট্রি' : 'Doctor Consultation & Prescription Timeline'}</span>
                </h3>
                <span className="text-gray-400 font-mono text-[11px]">
                  {patientPrescriptions.length} Records Found
                </span>
              </div>

              {patientPrescriptions.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-400 space-y-2">
                  <Stethoscope className="w-8 h-8 mx-auto text-gray-300" />
                  <p>{lang === 'bn' ? 'এই রোগীর কোনো প্রেসক্রিপশন রেকর্ড এখনও পাওয়া যায়নি।' : 'No prescriptions recorded for this patient yet.'}</p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onNavigateToDoctorVisit) onNavigateToDoctorVisit(patient);
                      else setActiveTab('doctorVisit');
                    }}
                    className="px-3 py-1.5 bg-purple-900 hover:bg-purple-950 text-white font-bold rounded-xl text-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>{lang === 'bn' ? 'নতুন প্রেসক্রিপশন তৈরি করুন' : 'Create New Rx'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {patientPrescriptions.map((rx) => (
                    <div
                      key={rx.id}
                      className="p-4 bg-purple-50/40 dark:bg-gray-900 rounded-2xl border border-purple-100 dark:border-gray-700 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 dark:border-gray-700 pb-2">
                        <div>
                          <div className="font-bold text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
                            <span>Dr. {rx.doctorName}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 font-bold">
                              OPD Visit
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            <span>{rx.date}</span>
                          </div>
                        </div>
                      </div>

                      {/* Complaints & Diagnosis */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                        {rx.chiefComplaints && (
                          <div className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700">
                            <span className="font-bold text-purple-900 dark:text-purple-300 block mb-0.5">
                              {lang === 'bn' ? 'প্রধান শারীরিক লক্ষণ (Chief Complaints):' : 'Chief Complaints:'}
                            </span>
                            <p className="text-gray-700 dark:text-gray-300">{rx.chiefComplaints}</p>
                          </div>
                        )}

                        {rx.diagnosis && (
                          <div className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700">
                            <span className="font-bold text-purple-900 dark:text-purple-300 block mb-0.5">
                              {lang === 'bn' ? 'সম্ভাব্য রোগনির্ণয় (Diagnosis):' : 'Clinical Diagnosis:'}
                            </span>
                            <p className="text-gray-700 dark:text-gray-300">{rx.diagnosis}</p>
                          </div>
                        )}
                      </div>

                      {/* Prescribed Medicines */}
                      {rx.medicines && rx.medicines.length > 0 && (
                        <div>
                          <div className="font-bold text-[11px] text-gray-800 dark:text-gray-200 mb-1.5">
                            {lang === 'bn' ? 'প্রেসক্রিপশনভুক্ত ওষুধসমূহ:' : 'Prescribed Medications:'}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {rx.medicines.map((m, idx) => (
                              <div
                                key={idx}
                                className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-[11px]"
                              >
                                <strong className="text-purple-950 dark:text-purple-200">{m.name}</strong>
                                <div className="text-[10px] text-gray-500">
                                  {m.dosage} · {m.instruction} · {m.duration}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Advised Tests */}
                      {rx.investigations && rx.investigations.length > 0 && (
                        <div className="text-[11px] flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                          <strong className="text-purple-900 dark:text-purple-300">
                            {lang === 'bn' ? 'পরামর্শকৃত টেস্ট:' : 'Advised Tests:'}
                          </strong>
                          <span>{rx.investigations.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PENDING LAB RESULTS & IMAGING */}
          {activeSubTab === 'lab' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2 dark:border-gray-700">
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-cyan-600" />
                    <span>{lang === 'bn' ? 'প্যাথলজি টেস্ট ও ইমেজিং রিপোর্ট বিবরণ' : 'Pathology & Diagnostic Results'}</span>
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {lang === 'bn'
                      ? `মোট টেস্ট: ${testResults.length}টি | ফলাফল সম্পন্ন: ${completedTests.length}টি | অপেক্ষমান: ${pendingTests.length}টি`
                      : `Total Tests: ${testResults.length} | Completed: ${completedTests.length} | Pending: ${pendingTests.length}`}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl text-[11px]">
                  <button
                    type="button"
                    onClick={() => setLabFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                      labFilter === 'all' ? 'bg-purple-900 text-white' : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    All ({testResults.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabFilter('pending')}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                      labFilter === 'pending' ? 'bg-amber-500 text-white' : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    Pending ({pendingTests.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabFilter('completed')}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                      labFilter === 'completed' ? 'bg-emerald-600 text-white' : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    Done ({completedTests.length})
                  </button>
                </div>
              </div>

              {/* Saved Pathology Accession Reports */}
              {patientLabReports.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {patientLabReports.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-3 bg-purple-50/50 dark:bg-gray-900 border border-purple-200 dark:border-gray-700 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-purple-950 dark:text-purple-200 flex items-center gap-2">
                          <span className="font-mono text-[11px] bg-purple-900 text-white px-2 py-0.5 rounded">
                            {rep.accessionNo || `ACC-${rep.pId}`}
                          </span>
                          <span>{rep.billDate || rep.invDate}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">
                          Status: <strong>{rep.workflowStatus || rep.status}</strong> · {rep.testResults?.length || 0} Parameters
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          setSelectedPatientForReport(rep);
                        }}
                        className="px-2.5 py-1.5 bg-purple-800 hover:bg-purple-900 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'রিপোর্ট প্রিন্ট' : 'View / Print'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Lab Results Table */}
              {filteredTests.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-400">
                  {lang === 'bn' ? 'কোনো টেস্ট ফলাফল পাওয়া যায়নি।' : 'No test investigations match this filter.'}
                </div>
              ) : (
                <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-purple-50/70 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-purple-950 dark:text-purple-200 font-bold">
                      <tr>
                        <th className="p-3">Test Investigation</th>
                        <th className="p-3">Observed Result</th>
                        <th className="p-3">Unit</th>
                        <th className="p-3">Standard Normal Range</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {filteredTests.map((t, idx) => {
                        const isPending = t.status === 'Pending' || !t.result || t.result.trim() === '';
                        return (
                          <tr key={idx} className="hover:bg-purple-50/20 dark:hover:bg-gray-750 transition">
                            <td className="p-3 font-bold text-gray-900 dark:text-gray-100">
                              {t.testName}
                            </td>
                            <td className="p-3 font-mono font-bold">
                              {isPending ? (
                                <span className="text-amber-600 dark:text-amber-400 italic">
                                  {lang === 'bn' ? 'ল্যাবে প্রক্রিয়াধীন...' : 'Awaiting Lab Result...'}
                                </span>
                              ) : (
                                <span className="text-purple-950 dark:text-purple-200">
                                  {t.result}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-gray-500 font-mono text-[11px]">{t.unit || '-'}</td>
                            <td className="p-3 text-gray-500 font-mono text-[11px]">{t.normalRange || '-'}</td>
                            <td className="p-3 text-right">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isPending
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : t.status === 'High' || t.status === 'Low' || t.status === 'Abnormal'
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                }`}
                              >
                                {isPending ? 'Pending' : t.status || 'Normal'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Imaging Investigations Summary */}
              {(patientEcg.length > 0 || patientXray.length > 0 || patientUsg.length > 0) && (
                <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <h4 className="font-bold text-xs text-gray-900 dark:text-gray-100">
                    {lang === 'bn' ? 'ডিজিটাল ইমেজিং ও স্ক্যান রেকর্ডস:' : 'Digital Imaging & Radiology Records:'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {patientEcg.map((ecg) => (
                      <div
                        key={ecg.id}
                        className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl"
                      >
                        <div className="font-bold text-rose-950 dark:text-rose-200 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-rose-600" />
                          <span>ECG Tracing Report</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">
                          HR: {ecg.heartRate} bpm · Rhythm: {ecg.rhythm}
                        </div>
                      </div>
                    ))}

                    {patientXray.map((xray) => (
                      <div
                        key={xray.id}
                        className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                      >
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <Film className="w-3.5 h-3.5 text-slate-600" />
                          <span>Digital X-Ray</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">
                          {xray.investigation} · Dr. {xray.radiologist}
                        </div>
                      </div>
                    ))}

                    {patientUsg.map((usg) => (
                      <div
                        key={usg.id}
                        className="p-3 bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800 rounded-xl"
                      >
                        <div className="font-bold text-cyan-950 dark:text-cyan-200 flex items-center gap-1.5">
                          <Waves className="w-3.5 h-3.5 text-cyan-600" />
                          <span>Ultrasound (USG)</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">
                          {usg.scanType} · Sonologist: {usg.sonologist}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BILLING & INVOICE LEDGER */}
          {activeSubTab === 'billing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2 dark:border-gray-700">
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'bn' ? 'বিলিং খতিয়ান ও পেমেন্ট হিস্ট্রি' : 'Billing Ledger & Payment History'}</span>
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {lang === 'bn'
                      ? `মোট ইনভয়েস: ${patientInvoices.length}টি | মোট বিল: ৳${totalBilled} | পরিশোধ: ৳${totalPaid} | বকেয়া: ৳${totalDue}`
                      : `Total Invoices: ${patientInvoices.length} | Net Total: ৳${totalBilled} | Paid: ৳${totalPaid} | Due: ৳${totalDue}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onNavigateToBilling) onNavigateToBilling(patient);
                      else setActiveTab('billing');
                    }}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 transition active:scale-95"
                  >
                    <span>{lang === 'bn' ? 'নতুন বিল করুন' : 'New Bill'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {patientInvoices.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-400">
                  {lang === 'bn' ? 'এই রোগীর কোনো ইনভয়েস রেকর্ড এখনও তৈরি হয়নি।' : 'No invoices generated for this patient yet.'}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {patientInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3.5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-purple-950 dark:text-purple-200 text-sm">
                            {inv.invoiceNo}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : inv.status === 'Partial'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {inv.status}
                          </span>
                          <span className="text-gray-400 font-mono text-[11px]">{inv.date}</span>
                        </div>

                        <div className="text-[11px] text-gray-600 dark:text-gray-400 flex items-center gap-2 flex-wrap">
                          <span>
                            Items: {inv.items?.map((it) => it.testName).join(', ') || 'Diagnostic tests'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-auto font-mono">
                        <div className="text-right">
                          <div className="text-gray-500 text-[10px]">Net Total</div>
                          <div className="font-bold text-gray-900 dark:text-gray-100">৳{inv.netTotal}</div>
                        </div>

                        <div className="text-right">
                          <div className="text-emerald-600 text-[10px]">Paid</div>
                          <div className="font-bold text-emerald-700 dark:text-emerald-400">৳{inv.paidAmount}</div>
                        </div>

                        <div className="text-right">
                          <div className="text-rose-600 text-[10px]">Due</div>
                          <div className={`font-bold ${inv.dueAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400'}`}>
                            ৳{inv.dueAmount}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: HISTORICAL VITALS TIMELINE & VISUAL LINE CHART */}
          {activeSubTab === 'vitals' && (
            <PatientVitalsPanel
              patient={patient}
              lang={lang}
              clinicName={clinicConfig.clinicName}
            />
          )}
        </div>

        {/* ======================================================== */}
        {/* MODAL FOOTER */}
        {/* ======================================================== */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span>Hospital PID: <strong className="font-mono text-purple-900 dark:text-purple-300">{patient.pId}</strong></span>
            <span>·</span>
            <span>Clinic: <strong>{clinicConfig.clinicName}</strong></span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-xl font-bold cursor-pointer flex items-center gap-1.5 transition text-xs shadow-xs"
              title={lang === 'bn' ? 'রোগীর সম্পূর্ণ ভিজিট, টেস্ট ও বিলিং হিস্ট্রি PDF ডাউনলোড করুন' : 'Export patient complete visit, test and billing history as PDF'}
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {isExportingPdf
                  ? (lang === 'bn' ? 'পিডিএফ তৈরি হচ্ছে...' : 'Generating PDF...')
                  : (lang === 'bn' ? 'সম্পূর্ণ হিস্ট্রি PDF ডাউনলোড' : 'Export Full History PDF')}
              </span>
            </button>

            <button
              type="button"
              onClick={handlePrintSummary}
              className="px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl font-bold cursor-pointer flex items-center gap-1.5 transition text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'সারাংশ প্রিন্ট' : 'Print Summary'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white rounded-xl font-bold cursor-pointer transition text-xs"
            >
              {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
