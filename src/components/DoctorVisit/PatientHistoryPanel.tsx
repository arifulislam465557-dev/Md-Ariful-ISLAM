import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Prescription, Patient, Invoice, EcgReport, XrayReport, UsgReport } from '../../types';
import { DoctorRxModal } from './DoctorRxModal';
import {
  History,
  Search,
  User,
  Calendar,
  Stethoscope,
  Pill,
  FlaskConical,
  FileText,
  Printer,
  CheckCircle2,
  AlertCircle,
  Activity,
  HeartPulse,
  ClipboardList,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  X,
  PlusCircle,
  Phone,
  Clock,
  ShieldAlert,
} from 'lucide-react';

interface PatientHistoryPanelProps {
  initialPatientId?: string;
  onSelectPatientForNewVisit?: (patient: {
    pId: string;
    name: string;
    phone: string;
    age: string;
    sex: 'Male' | 'Female' | 'Other';
  }) => void;
  onBackToQueue?: () => void;
}

export const PatientHistoryPanel: React.FC<PatientHistoryPanelProps> = ({
  initialPatientId = '26100294',
  onSelectPatientForNewVisit,
  onBackToQueue,
}) => {
  const {
    prescriptions,
    patients,
    invoices,
    doctors,
    clinicConfig,
    lang,
    t,
    ecgReports,
    xrayReports,
    usgReports,
    setActiveTab,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>(initialPatientId);
  const [selectedPId, setSelectedPId] = useState<string>(initialPatientId);
  const [expandedVisitId, setExpandedVisitId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [selectedVisitForPrint, setSelectedVisitForPrint] = useState<Prescription | null>(null);
  const [showRxModalForHistory, setShowRxModalForHistory] = useState<boolean>(false);

  // Quick select patient profiles
  const quickPatients = useMemo(() => {
    return [
      { pId: '26100294', name: 'Titly', age: '24 Y', sex: 'Female', condition: 'Enteric Fever / Anemia' },
      { pId: '26100290', name: 'Masud Shikder', age: '48 Y', sex: 'Male', condition: 'Diabetes & HTN' },
      { pId: '26100286', name: 'Minara', age: '29 Y', sex: 'Female', condition: 'ANC 18 Wks / UTI' },
      { pId: '26100289', name: 'Abul Kalam', age: '55 Y', sex: 'Male', condition: 'Cholecystitis & Fatty Liver' },
      { pId: '26100285', name: 'Sumaiya', age: '19 Y', sex: 'Female', condition: 'Hypothyroidism' },
    ];
  }, []);

  // Normalize search ID / string
  const activePId = selectedPId.trim();

  // Find Patient Info from registered patients
  const patientRecord = useMemo(() => {
    return (
      patients.find((p) => p.pId.toLowerCase() === activePId.toLowerCase()) ||
      patients.find((p) => p.patientName.toLowerCase().includes(activePId.toLowerCase())) ||
      null
    );
  }, [patients, activePId]);

  // Find all previous doctor visits / prescriptions matching this patient's ID or Name
  const patientVisits = useMemo(() => {
    if (!activePId) return [];

    const matchedPrescriptions = prescriptions.filter((rx) => {
      const matchId = rx.pId && rx.pId.toLowerCase() === activePId.toLowerCase();
      const matchName =
        patientRecord &&
        rx.patientName.toLowerCase() === patientRecord.patientName.toLowerCase();
      const matchQueryName = rx.patientName.toLowerCase().includes(activePId.toLowerCase());
      return matchId || matchName || matchQueryName;
    });

    // Sort by latest visit first (assuming standard DD-MM-YYYY format or ISO)
    return [...matchedPrescriptions].sort((a, b) => {
      return (b.date || '').localeCompare(a.date || '');
    });
  }, [prescriptions, activePId, patientRecord]);

  // Find all previous billing invoices for this patient
  const patientInvoices = useMemo(() => {
    if (!activePId) return [];
    return invoices.filter(
      (inv) =>
        inv.pId.toLowerCase() === activePId.toLowerCase() ||
        (patientRecord && inv.patientName.toLowerCase() === patientRecord.patientName.toLowerCase())
    );
  }, [invoices, activePId, patientRecord]);

  // Find linked diagnostic reports (ECG, X-Ray, USG, Pathology)
  const patientEcg = useMemo(
    () => ecgReports.filter((r) => r.pId.toLowerCase() === activePId.toLowerCase()),
    [ecgReports, activePId]
  );
  const patientXray = useMemo(
    () => xrayReports.filter((r) => r.pId.toLowerCase() === activePId.toLowerCase()),
    [xrayReports, activePId]
  );
  const patientUsg = useMemo(
    () => usgReports.filter((r) => r.pId.toLowerCase() === activePId.toLowerCase()),
    [usgReports, activePId]
  );

  // Extract all unique confirmed diagnoses for this patient across all visits
  const uniqueDiagnoses = useMemo(() => {
    const list: { text: string; date: string; doctor: string }[] = [];
    patientVisits.forEach((v) => {
      if (v.diagnosis && v.diagnosis.trim()) {
        list.push({ text: v.diagnosis.trim(), date: v.date, doctor: v.doctorName });
      }
    });
    return list;
  }, [patientVisits]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSelectedPId(searchQuery.trim());
      setExpandedVisitId(null);
    }
  };

  const handleCopyId = () => {
    if (activePId) {
      navigator.clipboard.writeText(activePId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleBookVisitForThisPatient = () => {
    const targetName = patientRecord?.patientName || (patientVisits[0]?.patientName ?? '');
    const targetPhone = patientRecord?.phone || (patientVisits[0]?.phone ?? '');
    const targetAge = patientRecord?.age || (patientVisits[0]?.age ?? '25 Y');
    const targetSex = patientRecord?.sex || (patientVisits[0]?.sex ?? 'Female');

    if (onSelectPatientForNewVisit) {
      onSelectPatientForNewVisit({
        pId: activePId,
        name: targetName,
        phone: targetPhone,
        age: targetAge,
        sex: targetSex as any,
      });
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Search Bar & Quick Patient Chips */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl shadow-xs border border-purple-200 dark:border-gray-700 space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-sm sm:text-base text-purple-950 dark:text-purple-100 flex items-center gap-2">
              <History className="w-5 h-5 text-purple-700 dark:text-purple-400" />
              <span>
                {lang === 'bn'
                  ? 'রোগীর ভিজিট ও ডায়াগনোসিস হিস্ট্রি অনুসন্ধান'
                  : 'Patient Consultation History & Diagnostic Records'}
              </span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {lang === 'bn'
                ? 'রোগীর আইডি (Patient ID) দিয়ে পূর্ববর্তী সমস্ত ওপিডি ভিজিট, প্রেসক্রিপশন, ডায়াগনোসিস ও ল্যাব পরীক্ষার রেকর্ড অনুসন্ধান করুন।'
                : 'Fetch historical OPD appointments, clinical diagnoses, prescriptions, and lab test reports by Patient ID.'}
            </p>
          </div>

          {onBackToQueue && (
            <button
              type="button"
              onClick={onBackToQueue}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold self-start md:self-auto cursor-pointer transition"
            >
              {lang === 'bn' ? '← ওপিডি কিউতে ফিরে যান' : '← Back to OPD Queue'}
            </button>
          )}
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-purple-600 dark:text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'রোগীর আইডি (PId) বা নাম লিখে সার্চ করুন (যেমন: 26100294, 26100290, Titly, Masud)...'
                  : 'Enter Patient ID (e.g. 26100294, 26100290, 26100286) or patient name...'
              }
              className="w-full pl-10 pr-3 py-2.5 bg-purple-50/50 dark:bg-gray-900 border-2 border-purple-300 dark:border-purple-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 shadow-2xs"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-900 hover:to-indigo-900 text-white font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>{lang === 'bn' ? 'হিস্ট্রি খুঁজুন' : 'Fetch History'}</span>
          </button>
        </form>

        {/* Quick Patient Selection Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
          <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            {lang === 'bn' ? 'নমুনা রোগী:' : 'Quick Select:'}
          </span>
          {quickPatients.map((qp) => (
            <button
              key={qp.pId}
              type="button"
              onClick={() => {
                setSearchQuery(qp.pId);
                setSelectedPId(qp.pId);
                setExpandedVisitId(null);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                activePId.toLowerCase() === qp.pId.toLowerCase()
                  ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                  : 'bg-white dark:bg-gray-800 text-purple-950 dark:text-purple-200 border-purple-200 dark:border-gray-700 hover:bg-purple-100/60'
              }`}
            >
              <span className="font-mono text-[10px] bg-purple-100 dark:bg-purple-950 px-1 rounded text-purple-900 dark:text-purple-300">
                #{qp.pId}
              </span>
              <span>{qp.name}</span>
              <span className="text-[10px] text-gray-500 hidden sm:inline">({qp.condition})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Patient Header Profile Card */}
      {activePId && (
        <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-purple-900 text-white p-5 rounded-2xl shadow-lg border border-purple-800 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-white/10 border-2 border-purple-400/50 flex items-center justify-center shrink-0 shadow-inner">
                <User className="w-7 h-7 text-purple-200" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                    {patientRecord?.patientName || patientVisits[0]?.patientName || 'Registered Patient'}
                  </h2>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-800/80 text-purple-200 border border-purple-600 font-bold">
                      PID: {activePId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="p-1 rounded bg-purple-800/60 hover:bg-purple-700 text-purple-200 transition cursor-pointer"
                      title="Copy Patient ID"
                    >
                      {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-1 text-purple-200 flex-wrap text-xs font-medium">
                  <span>
                    বয়স / লিঙ্গ:{' '}
                    <strong className="text-white">
                      {patientRecord?.age || patientVisits[0]?.age || '25 Y'} /{' '}
                      {patientRecord?.sex || patientVisits[0]?.sex || 'Female'}
                    </strong>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-pink-300" />
                    <strong className="font-mono text-white">
                      {patientRecord?.phone || patientVisits[0]?.phone || '01712000000'}
                    </strong>
                  </span>
                  {patientRecord?.address && (
                    <>
                      <span>·</span>
                      <span className="text-purple-300 truncate max-w-xs">{patientRecord.address}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions & Stats Badge */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-purple-300 block">মোট ভিজিট</span>
                <span className="text-base font-black text-amber-300 leading-none">
                  {patientVisits.length} বার
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-purple-300 block">ল্যাব রিপোর্ট</span>
                <span className="text-base font-black text-emerald-300 leading-none">
                  {(patientRecord?.testResults?.length || 0) + patientEcg.length + patientXray.length + patientUsg.length} টি
                </span>
              </div>

              {/* Write Rx Prescription Button */}
              <button
                type="button"
                onClick={() => setShowRxModalForHistory(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer border border-indigo-400/50"
                title="এই রোগীর জন্য সরাসরি প্রেসক্রিপশন ও ওষুধ লিখুন"
              >
                <Stethoscope className="w-4 h-4 text-pink-300" />
                <span>Rx প্রেসক্রিপশন</span>
              </button>

              {onSelectPatientForNewVisit && (
                <button
                  type="button"
                  onClick={handleBookVisitForThisPatient}
                  className="px-3.5 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer border border-pink-400/50"
                  title="এই রোগীর তথ্য নিয়ে নতুন ওপিডি টিকিট কাটুন"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>নতুন ভিজিট বুকিং</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clinical Diagnoses Summary Card */}
      {uniqueDiagnoses.length > 0 && (
        <div className="bg-amber-50/70 dark:bg-amber-950/20 p-4 rounded-2xl border-2 border-amber-300 dark:border-amber-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-sm text-amber-950 dark:text-amber-200 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{lang === 'bn' ? 'রোগ নির্ণয় সামারি (Clinical Diagnoses History)' : 'Clinical Diagnoses History'}</span>
            </h4>
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
              {uniqueDiagnoses.length} টি ডায়াগনোসিস রেকর্ড
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {uniqueDiagnoses.map((diag, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 shadow-2xs flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">{diag.text}</span>
                  <span className="text-[10px] text-gray-500 font-medium">
                    {diag.date} · {diag.doctor}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chronological Visits List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-purple-700" />
            <span>
              {lang === 'bn'
                ? `পূর্ববর্তী ডাক্তার ভিজিট ও প্রেসক্রিপশন সমূহ (${patientVisits.length})`
                : `Past Doctor Visits & Prescriptions Timeline (${patientVisits.length})`}
            </span>
          </h4>
          {patientVisits.length > 0 && (
            <span className="text-xs text-gray-500 font-medium">
              সর্বশেষ ভিজিট: <strong>{patientVisits[0]?.date}</strong>
            </span>
          )}
        </div>

        {patientVisits.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xs border border-purple-100 dark:border-gray-700 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-bold text-base text-gray-800 dark:text-gray-200">
                {lang === 'bn'
                  ? `আইডি #${activePId} এর কোনো পূর্ববর্তী ওপিডি ভিজিট পাওয়া যায়নি`
                  : `No past visits found for Patient ID #${activePId}`}
              </h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                {lang === 'bn'
                  ? 'এই রোগী হয়তো শুধুমাত্র প্যাথলজি বা টেস্টের জন্য এসেছিলেন, অথবা এখনো ওপিডি চেম্বারে প্রেসক্রিপশন এন্ট্রি করা হয়নি।'
                  : 'This patient may only have pathology tests registered or this might be their first OPD consultation.'}
              </p>
            </div>

            {/* Quick check: do they have pathology test records? */}
            {patientRecord && patientRecord.testResults && patientRecord.testResults.length > 0 && (
              <div className="mt-4 p-3 bg-purple-50 dark:bg-gray-900 rounded-xl text-left max-w-lg mx-auto border border-purple-200 dark:border-purple-800">
                <span className="font-bold text-purple-950 dark:text-purple-200 block mb-1">
                  ✓ তবে ল্যাব ইনভেস্টিগেশন রেকর্ড আছে ({patientRecord.testResults.length} টি টেস্ট):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {patientRecord.testResults.map((tr, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-white dark:bg-gray-800 border border-purple-200 dark:border-gray-700 rounded text-[11px] font-medium"
                    >
                      {tr.testName}: <strong>{tr.result} {tr.unit}</strong> ({tr.status})
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-center gap-2">
              {onSelectPatientForNewVisit && (
                <button
                  type="button"
                  onClick={handleBookVisitForThisPatient}
                  className="px-4 py-2 bg-purple-800 hover:bg-purple-900 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'এই রোগীর জন্য নতুন ভিজিট তৈরি করুন' : 'Book First Consultation'}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* List of Previous Visits Cards */
          <div className="space-y-4">
            {patientVisits.map((visit, vIdx) => {
              const isExpanded = expandedVisitId === visit.id || vIdx === 0;

              return (
                <div
                  key={visit.id || vIdx}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border-2 border-purple-200/80 dark:border-gray-700 overflow-hidden transition"
                >
                  {/* Visit Card Top Bar */}
                  <div
                    onClick={() => setExpandedVisitId(isExpanded ? '__collapsed__' : visit.id)}
                    className="p-4 sm:p-5 bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-white dark:from-gray-850 dark:to-gray-800 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700 hover:bg-purple-50/90 transition select-none"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-900 text-white flex flex-col items-center justify-center font-black shrink-0">
                        <span className="text-[9px] uppercase tracking-wider text-purple-300">ভিজিট</span>
                        <span className="text-sm leading-none">#{patientVisits.length - vIdx}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-purple-950 dark:text-purple-100">
                            {visit.doctorName}
                          </span>
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-200">
                            তারিখ: {visit.date}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            ডায়াগনোসিস: {visit.diagnosis || 'Clinical Follow-up'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVisitForPrint(visit);
                        }}
                        className="px-2.5 py-1 bg-white dark:bg-gray-700 hover:bg-purple-100 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-gray-600 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                        title="প্রেসক্রিপশন প্রিন্ট বা প্রিভিউ করুন"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>প্রিন্ট / Rx</span>
                      </button>

                      <div className="p-1 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Visit Card Details Body (when expanded) */}
                  {isExpanded && (
                    <div className="p-4 sm:p-6 space-y-4 text-xs divide-y divide-gray-100 dark:divide-gray-700">
                      {/* Section 1: Chief Complaints & Clinical Diagnosis */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                        {/* Clinical Diagnosis Box */}
                        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800 space-y-1">
                          <span className="text-[11px] font-black uppercase text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            প্রাথমিক রোগ নির্ণয় / Clinical Diagnosis:
                          </span>
                          <p className="font-black text-sm text-slate-900 dark:text-slate-100 leading-snug">
                            {visit.diagnosis || 'Clinical Investigation & Routine Check'}
                          </p>
                        </div>

                        {/* Chief Complaints Box */}
                        <div className="bg-purple-50/50 dark:bg-gray-900 p-3.5 rounded-xl border border-purple-200 dark:border-purple-800 space-y-1">
                          <span className="text-[11px] font-black uppercase text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-purple-700" />
                            রোগীর প্রধান লক্ষণ ও উপসর্গ (Chief Complaints):
                          </span>
                          <p className="font-semibold text-gray-800 dark:text-gray-200 leading-relaxed">
                            {visit.chiefComplaints || 'Routine checkup visit.'}
                          </p>
                        </div>
                      </div>

                      {/* Section 2: Clinical Observations & Vitals */}
                      {visit.clinicalObservations && (
                        <div className="pt-3 pb-3">
                          <span className="font-bold text-gray-500 uppercase text-[10px] block mb-1">
                            ক্লিনিক্যাল পর্যবেক্ষণ ও ভাইটালস (Observations / Vitals):
                          </span>
                          <div className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 font-mono text-gray-800 dark:text-gray-200 font-bold">
                            {visit.clinicalObservations}
                          </div>
                        </div>
                      )}

                      {/* Section 3: Prescribed Medicines (Rx) */}
                      {visit.medicines && visit.medicines.length > 0 && (
                        <div className="pt-3 pb-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                              <Pill className="w-4 h-4 text-pink-600" />
                              <span>প্রেসক্রাইবকৃত ওষুধ তালিকা (Medicines - {visit.medicines.length}টি):</span>
                            </span>
                          </div>

                          <div className="overflow-x-auto rounded-xl border border-purple-200 dark:border-gray-700">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead className="bg-purple-900 text-white font-bold text-[11px]">
                                <tr>
                                  <th className="py-2 px-3 w-8 text-center">#</th>
                                  <th className="py-2 px-3">ওষুধের নাম (Medicine Name)</th>
                                  <th className="py-2 px-3 w-28 text-center">ডোজ (Dosage)</th>
                                  <th className="py-2 px-3">সেবনবিধি (Instruction)</th>
                                  <th className="py-2 px-3 w-28 text-center">মেয়াদ (Duration)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-gray-750 bg-white dark:bg-gray-800">
                                {visit.medicines.map((med, mIdx) => (
                                  <tr key={mIdx} className="hover:bg-purple-50/50 dark:hover:bg-gray-750">
                                    <td className="py-2 px-3 text-center text-gray-400 font-mono">{mIdx + 1}</td>
                                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">
                                      {med.name}
                                    </td>
                                    <td className="py-2 px-3 text-center font-mono font-bold text-purple-900 dark:text-purple-300 bg-purple-50/60 dark:bg-purple-950/40">
                                      {med.dosage}
                                    </td>
                                    <td className="py-2 px-3 text-gray-600 dark:text-gray-300">{med.instruction}</td>
                                    <td className="py-2 px-3 text-center font-semibold text-gray-500">
                                      {med.duration}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Section 4: Ordered Investigations & Linked Lab Findings */}
                      {visit.investigations && visit.investigations.length > 0 && (
                        <div className="pt-3 pb-3 space-y-2">
                          <span className="font-bold text-sm text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                            <FlaskConical className="w-4 h-4 text-purple-700" />
                            <span>পরামর্শকৃত ল্যাব পরীক্ষা (Ordered Investigations):</span>
                          </span>

                          <div className="flex flex-wrap gap-2">
                            {visit.investigations.map((inv, iIdx) => (
                              <span
                                key={iIdx}
                                className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                {inv}
                              </span>
                            ))}
                          </div>

                          {/* Correlated Lab Test Findings from Pathology Database */}
                          {patientRecord && patientRecord.testResults && patientRecord.testResults.length > 0 && (
                            <div className="mt-2.5 p-3.5 bg-purple-50/60 dark:bg-gray-900 rounded-xl border border-purple-200 dark:border-purple-800 space-y-2">
                              <span className="font-bold text-xs text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>ক্লিনিকের প্যাথলজি ল্যাব থেকে প্রাপ্ত রিপোর্ট ফলাফল (Lab Findings):</span>
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {patientRecord.testResults.map((tr, rIdx) => (
                                  <div
                                    key={rIdx}
                                    className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-purple-200/80 dark:border-gray-700 text-[11px] flex justify-between items-center"
                                  >
                                    <div>
                                      <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[150px]">
                                        {tr.testName}
                                      </span>
                                      <span className="text-[10px] text-gray-400">Normal: {tr.normalRange}</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="font-mono font-black text-xs text-purple-950 dark:text-purple-200 block">
                                        {tr.result} {tr.unit}
                                      </span>
                                      <span
                                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                          tr.status === 'High'
                                            ? 'bg-red-100 text-red-700'
                                            : tr.status === 'Low'
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-emerald-100 text-emerald-700'
                                        }`}
                                      >
                                        {tr.status}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Section 5: Doctor's Advice & Follow-Up */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                        {visit.advice && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 space-y-1">
                            <span className="font-bold text-gray-500 uppercase text-[10px] block">
                              ডাক্তারের বিশেষ উপদেশ (Advice):
                            </span>
                            <p className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
                              {visit.advice}
                            </p>
                          </div>
                        )}
                        {visit.followUp && (
                          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 space-y-1">
                            <span className="font-bold text-blue-800 dark:text-blue-300 uppercase text-[10px] block flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" /> পরবর্তী ফলো-আপ ভিজিট (Follow-up):
                            </span>
                            <p className="text-blue-950 dark:text-blue-100 font-bold">{visit.followUp}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Print Prescription / Visit Summary Modal */}
      {selectedVisitForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full p-6 border-2 border-purple-400 dark:border-purple-700 text-xs space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-purple-950 dark:text-purple-100">
                    প্রেসক্রিপশন ও ভিজিট সামারি প্রিন্ট ভিউ
                  </h3>
                  <p className="text-gray-500 text-xs">
                    তারিখ: {selectedVisitForPrint.date} | ডাক্তার: {selectedVisitForPrint.doctorName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVisitForPrint(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Printable Slip Content */}
            <div className="p-5 bg-white text-slate-900 rounded-xl border border-slate-300 space-y-4 shadow-sm">
              {/* Slip Top Header */}
              <div className="text-center pb-3 border-b-2 border-purple-950">
                <h2 className="text-lg font-black uppercase text-purple-950 tracking-tight">
                  {clinicConfig.clinicName}
                </h2>
                <p className="text-[11px] text-slate-600">
                  {clinicConfig.address} · ফোন: {clinicConfig.phone} · রেজি: {clinicConfig.regNo}
                </p>
                <div className="mt-1 font-bold text-xs text-purple-900">
                  {selectedVisitForPrint.doctorName}
                </div>
              </div>

              {/* Patient Bio */}
              <div className="grid grid-cols-4 gap-2 p-2 bg-slate-50 rounded border border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Patient:</span>
                  <strong className="font-bold">{selectedVisitForPrint.patientName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Age / Sex:</span>
                  <strong>{selectedVisitForPrint.age} / {selectedVisitForPrint.sex}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Patient ID:</span>
                  <strong className="font-mono text-purple-950 font-bold">
                    {selectedVisitForPrint.pId || activePId}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Date:</span>
                  <strong className="font-mono">{selectedVisitForPrint.date}</strong>
                </div>
              </div>

              {/* Diagnosis Highlight */}
              <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-300 text-xs">
                <span className="font-bold text-emerald-800 uppercase text-[10px] block">
                  Diagnosis / রোগ নির্ণয়:
                </span>
                <strong className="text-slate-950 font-black text-sm block">
                  {selectedVisitForPrint.diagnosis}
                </strong>
              </div>

              {/* Medicines Table */}
              {selectedVisitForPrint.medicines && selectedVisitForPrint.medicines.length > 0 && (
                <div className="space-y-1">
                  <span className="font-bold text-xs text-purple-950 uppercase block">Rx (Medicines):</span>
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded">
                    {selectedVisitForPrint.medicines.map((m, idx) => (
                      <div key={idx} className="p-2 flex justify-between items-center text-xs">
                        <div>
                          <strong className="text-slate-900 font-bold block">{idx + 1}. {m.name}</strong>
                          <span className="text-slate-500 text-[11px]">{m.instruction}</span>
                        </div>
                        <div className="text-right font-mono font-bold">
                          <span className="bg-purple-100 text-purple-950 px-2 py-0.5 rounded text-xs">{m.dosage}</span>
                          <span className="block text-[10px] text-slate-400">{m.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Advice & Follow-up */}
              {selectedVisitForPrint.advice && (
                <div className="text-xs pt-1">
                  <span className="font-bold text-slate-700 block">উপদেশ (Advice):</span>
                  <p className="text-slate-600">{selectedVisitForPrint.advice}</p>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setSelectedVisitForPrint(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-xl font-bold cursor-pointer"
              >
                বন্ধ করুন
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-purple-900 hover:bg-purple-950 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>প্রিন্ট দিন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Rx Modal for this Patient */}
      {showRxModalForHistory && (
        <DoctorRxModal
          patient={patientRecord || undefined}
          initialPId={activePId}
          onClose={() => setShowRxModalForHistory(false)}
        />
      )}
    </div>
  );
};
