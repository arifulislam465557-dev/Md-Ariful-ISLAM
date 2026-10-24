import React, { useState } from 'react';
import { Patient } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Printer,
  Download,
  X,
  FileText,
  Pencil,
  Layers,
  FlaskConical,
  TestTube2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { generatePathologyPdf } from '../../utils/pdfGenerator';
import { printElementById } from '../../utils/printHelper';
import { EditTechnologistModal } from '../Modals/EditTechnologistModal';
import { groupTestsByDepartment, ClassifiedDepartmentPage } from '../../utils/pathologyUtils';

interface PathologyReportModalProps {
  patient: Patient;
  onClose: () => void;
}

export const PathologyReportModal: React.FC<PathologyReportModalProps> = ({ patient, onClose }) => {
  const { clinicConfig, lang, doctors } = useApp();

  const matchedDoctor = doctors.find(
    (d) =>
      (patient.drCode && d.code.toLowerCase() === patient.drCode.trim().toLowerCase()) ||
      (patient.drName &&
        d.name.toLowerCase() ===
          patient.drName
            .replace(/\s*\(DR\w*\)/gi, '')
            .split(',')[0]
            .trim()
            .toLowerCase())
  );

  const cleanDrName = (matchedDoctor?.name || patient.drName || '')
    .replace(/\s*\(DR\w*\)/gi, '')
    .trim();
  const drDegree = matchedDoctor?.degree?.trim() || '';
  const refDoctorWithDegree = cleanDrName
    ? drDegree && !cleanDrName.toLowerCase().includes(drDegree.toLowerCase())
      ? `${cleanDrName}, ${drDegree}`
      : cleanDrName
    : 'Self';

  const patientForPdf: Patient = {
    ...patient,
    drName: refDoctorWithDegree,
  };

  // Pad Mode: true by default so institution name is not rendered on printable report
  const [padMode, setPadMode] = useState(true);
  const [padGapMm, setPadGapMm] = useState<number>(30); // Top space (mm) for pre-printed letterhead
  const [showEditTechModal, setShowEditTechModal] = useState(false);

  // Optional Doctor / Pathologist Name toggle
  const [showDoctorSignature, setShowDoctorSignature] = useState<boolean>(true);

  // Separation of RBS/Biochemistry and Urine into separate pages
  const [splitDepartments, setSplitDepartments] = useState<boolean>(true);
  // 'all' to show/print all pages, or page index number (1, 2, ...) to view/print that specific page
  const [activeTab, setActiveTab] = useState<'all' | number>('all');

  // Group tests into pages
  const departmentPages: ClassifiedDepartmentPage[] = groupTestsByDepartment(
    patient.testResults,
    splitDepartments
  );

  const totalPages = departmentPages.length;

  const handlePrintAll = () => {
    setActiveTab('all');
    generatePathologyPdf(
      patientForPdf,
      clinicConfig,
      'PATHOLOGY INVESTIGATION REPORT',
      !padMode,
      splitDepartments,
      showDoctorSignature,
      {
        action: 'print',
        padGapMm,
      }
    );
  };

  const handlePrintCurrentPage = (pageIdx: number) => {
    setActiveTab(pageIdx);
    generatePathologyPdf(
      patientForPdf,
      clinicConfig,
      'PATHOLOGY INVESTIGATION REPORT',
      !padMode,
      splitDepartments,
      showDoctorSignature,
      {
        action: 'print',
        padGapMm,
        onlyPageIndex: pageIdx,
      }
    );
  };

  const handleDownloadPdf = () => {
    generatePathologyPdf(
      patientForPdf,
      clinicConfig,
      'PATHOLOGY INVESTIGATION REPORT',
      !padMode,
      splitDepartments,
      showDoctorSignature,
      {
        action: 'download',
        padGapMm,
      }
    );
  };

  // Determine pages to render in preview/print
  const visiblePages =
    activeTab === 'all'
      ? departmentPages
      : departmentPages.filter((p) => p.pageIndex === activeTab);

  const hasBiochem = departmentPages.some((p) => p.departmentKey === 'biochemistry');
  const hasUrine = departmentPages.some((p) => p.departmentKey === 'urine');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-slate-100 dark:bg-gray-900 rounded-2xl shadow-2xl border border-purple-300 dark:border-gray-800 overflow-hidden flex flex-col max-h-[96vh]">
        {/* Top Control Bar (Hidden in Print) */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 px-3 sm:px-6 py-2.5 text-white flex flex-col gap-2.5 no-print border-b border-purple-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-pink-500/20 rounded-lg text-pink-300">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-2">
                  <span>
                    {lang === 'bn' ? 'প্যাথলজি টেস্ট রিপোর্ট (A4)' : 'Pathology Investigation Report (A4)'}
                  </span>
                  <span className="font-mono text-[11px] bg-purple-800 px-2 py-0.5 rounded text-purple-200">
                    PID: {patient.pId}
                  </span>
                </h3>
                <p className="text-[11px] text-purple-300">
                  {patient.patientName} · {patient.age} / {patient.sex} · Referred By: {refDoctorWithDegree}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <button
                type="button"
                onClick={() => setShowEditTechModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-800 hover:bg-purple-700 text-purple-100 rounded-lg text-xs font-semibold transition cursor-pointer border border-purple-600 shadow-2xs"
                title={lang === 'bn' ? 'মেডিকেল টেকনোলজিস্ট এর নাম ইডিট করুন' : 'Edit Medical Technologist Name'}
              >
                <Pencil className="w-3 h-3 text-pink-300" />
                <span>{lang === 'bn' ? 'টেকনোলজিস্ট' : 'Edit Tech'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrintAll}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black transition cursor-pointer shadow-sm active:scale-95"
                title={lang === 'bn' ? 'পিডিএফ তৈরি করে সরাসরি প্রিন্ট করুন (PDF to Print)' : 'Direct PDF to Print'}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>
                  {totalPages > 1
                    ? lang === 'bn'
                      ? `সব পেইজ PDF প্রিন্ট (${totalPages} টি)`
                      : `PDF Print All (${totalPages} Pgs)`
                    : lang === 'bn'
                    ? 'PDF প্রিন্ট করুন'
                    : 'PDF Print'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95"
                title="Download Multi-Page PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Secondary Options Bar: Department Page Tabs & Pad Config */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-purple-850 text-xs">
            {/* Page Navigation Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1 mr-1">
                <Layers className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'পৃষ্ঠা নির্বাচন:' : 'Pages:'}</span>
              </span>

              {totalPages > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'bg-purple-850 hover:bg-purple-800 text-purple-200 border border-purple-700'
                  }`}
                >
                  {lang === 'bn' ? `সকল পৃষ্ঠা (${totalPages} টি)` : `All Pages (${totalPages})`}
                </button>
              )}

              {departmentPages.map((page) => (
                <button
                  key={page.departmentKey}
                  type="button"
                  onClick={() => setActiveTab(page.pageIndex)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === page.pageIndex
                      ? 'bg-pink-600 text-white shadow-xs ring-1 ring-white/30'
                      : 'bg-purple-850 hover:bg-purple-800 text-purple-200 border border-purple-700'
                  }`}
                >
                  {page.departmentKey === 'biochemistry' && <FlaskConical className="w-3 h-3 text-amber-300" />}
                  {page.departmentKey === 'urine' && <TestTube2 className="w-3 h-3 text-teal-300" />}
                  <span>
                    {lang === 'bn'
                      ? `পৃষ্ঠা ${page.pageIndex}: ${page.departmentConfig.nameBn}`
                      : `Page ${page.pageIndex}: ${page.departmentConfig.nameEn}`}
                  </span>
                  <span className="text-[10px] opacity-75">({page.tests.length})</span>
                </button>
              ))}
            </div>

            {/* Print & Format Preferences */}
            <div className="flex items-center gap-3 flex-wrap text-xs">
              {/* Separate Pages Toggle */}
              <label
                className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-850 hover:bg-purple-800 rounded-md cursor-pointer border border-purple-700 text-[11px] font-semibold text-purple-100 select-none"
                title={
                  lang === 'bn'
                    ? 'আরবিএস / বায়োকেমিস্ট্রি এবং ইউরিন আলাদা পেইজে সাজান'
                    : 'Split Biochemistry (RBS etc.) & Urine on separate pages'
                }
              >
                <input
                  type="checkbox"
                  checked={splitDepartments}
                  onChange={(e) => {
                    setSplitDepartments(e.target.checked);
                    setActiveTab('all');
                  }}
                  className="accent-pink-500 w-3.5 h-3.5 rounded cursor-pointer"
                />
                <span className="font-bold">
                  {lang === 'bn' ? 'আলাদা আলাদা পেইজ (বায়োকেমিস্ট্রি ও ইউরিন)' : 'Separate Pages (Biochem & Urine)'}
                </span>
              </label>

              {/* Pad Mode Toggle (Institution Name Hidden) */}
              <label className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-850 hover:bg-purple-800 rounded-md cursor-pointer border border-purple-700 text-[11px] font-semibold text-purple-200 select-none">
                <input
                  type="checkbox"
                  checked={padMode}
                  onChange={(e) => setPadMode(e.target.checked)}
                  className="accent-pink-500 w-3.5 h-3.5 rounded cursor-pointer"
                />
                <span>
                  {lang === 'bn' ? 'প্যাড প্রিন্ট (নাম ছাড়া)' : 'Pad Print (Hide Clinic)'}
                </span>
              </label>

              {/* Doctor Name Toggle (Optional) */}
              <label
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md cursor-pointer border text-[11px] font-semibold select-none transition ${
                  showDoctorSignature
                    ? 'bg-purple-800 hover:bg-purple-750 text-white border-purple-500 shadow-2xs'
                    : 'bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border-purple-700/60'
                }`}
                title={
                  lang === 'bn'
                    ? 'রিপোর্টে ডাক্তারের নাম ও পদবী প্রিন্ট করতে বা বাদ দিতে ক্লিক করুন'
                    : 'Show or hide doctor name & degree on report'
                }
              >
                <input
                  type="checkbox"
                  checked={showDoctorSignature}
                  onChange={(e) => setShowDoctorSignature(e.target.checked)}
                  className="accent-pink-500 w-3.5 h-3.5 rounded cursor-pointer"
                />
                <span className={showDoctorSignature ? 'font-black text-pink-300' : 'text-purple-300'}>
                  {lang === 'bn' ? 'ডাক্তারের নাম (ঐচ্ছিক)' : 'Doctor Name (Optional)'}
                </span>
              </label>

              {padMode && (
                <div className="hidden sm:flex items-center gap-1 text-[11px] text-purple-300">
                  <span>{lang === 'bn' ? 'ফাঁকা:' : 'Gap:'}</span>
                  <select
                    value={padGapMm}
                    onChange={(e) => setPadGapMm(Number(e.target.value))}
                    className="bg-purple-900 border border-purple-700 text-white rounded px-1.5 py-0.5 text-[10px] cursor-pointer"
                  >
                    <option value={15}>15 mm</option>
                    <option value={25}>25 mm</option>
                    <option value={30}>30 mm (Normal)</option>
                    <option value={40}>40 mm (Large)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Bengali Confirmation Badge when multiple departments are separated */}
          {hasBiochem && hasUrine && splitDepartments && (
            <div className="flex items-center justify-between bg-gradient-to-r from-emerald-900/60 to-purple-900/60 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-emerald-200 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium text-[11px]">
                  {lang === 'bn'
                    ? '✓ আরবিএস (বায়োকেমিস্ট্রি টেস্ট) এবং ইউরিন টেস্ট সফলভাবে আলাদা আলাদা পেইজে বিভক্ত করা হয়েছে।'
                    : '✓ RBS (Biochemistry) and Urine tests are structured on separate distinct pages as requested.'}
                </span>
              </div>
              <div className="hidden md:flex items-center gap-2 text-[10px] text-emerald-300">
                <span className="px-1.5 py-0.5 bg-amber-950/80 border border-amber-600 rounded text-amber-200">
                  পৃষ্ঠা ১: বায়োকেমিস্ট্রি
                </span>
                <span className="px-1.5 py-0.5 bg-teal-950/80 border border-teal-600 rounded text-teal-200">
                  পৃষ্ঠা ২: ইউরিন
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Printable Report Area - Renders individual .report-page-sheet blocks */}
        <div
          id="printable-report"
          className="p-3 sm:p-6 overflow-y-auto flex-1 bg-slate-200 dark:bg-slate-950 space-y-6 print:p-0 print:m-0 print:bg-transparent print:overflow-visible print:space-y-0"
        >
          {visiblePages.map((pageGroup) => {
            const isSingleActive = activeTab !== 'all';
            return (
              <div
                key={pageGroup.departmentKey}
                className="report-page-sheet bg-white text-slate-900 rounded-xl shadow-md border border-slate-300 p-6 sm:p-8 space-y-4 max-w-3xl mx-auto transition-all print:p-0 print:m-0 print:rounded-none print:shadow-none print:border-none print:max-w-none print:w-full print:space-y-3"
              >
                {/* Visual Sheet Indicator (hidden during print) */}
                <div className="no-print flex items-center justify-between pb-2 mb-2 border-b border-purple-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-purple-900 text-white font-bold rounded text-[11px]">
                      {lang === 'bn' ? `পৃষ্ঠা ${pageGroup.pageIndex} / ${totalPages}` : `Page ${pageGroup.pageIndex} of ${totalPages}`}
                    </span>
                    <span className="font-bold text-purple-950 text-xs">
                      {lang === 'bn' ? pageGroup.departmentConfig.nameBn : pageGroup.departmentConfig.nameEn}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">
                      {lang === 'bn' ? `টেস্ট সংখ্যা: ${pageGroup.tests.length} টি` : `${pageGroup.tests.length} Parameters`}
                    </span>
                    {isSingleActive && (
                      <button
                        type="button"
                        onClick={() => handlePrintCurrentPage(pageGroup.pageIndex)}
                        className="px-2 py-0.5 bg-purple-700 hover:bg-purple-800 text-white rounded font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        <span>{lang === 'bn' ? 'শুধুমাত্র এই পৃষ্ঠা প্রিন্ট' : 'Print this page'}</span>
                      </button>
                    )}
                  </div>
                </div>

                <table className="report-master-table w-full border-collapse">
                  {/* THEAD: Repeating Header at Top of Every Page */}
                  <thead>
                    <tr>
                      <th className="p-0 border-none font-normal text-left">
                        <div className="report-header-section space-y-3 pb-3">
                          {/* Pad Header Gap (when padMode is enabled, no institution name is shown) */}
                          {padMode ? (
                            <div
                              style={{ height: `${padGapMm}mm` }}
                              className="break-inside-avoid flex flex-col justify-end items-center pb-2.5 border-b-2 border-purple-950"
                            >
                              <div className="px-5 py-1.5 bg-purple-950 text-white font-black rounded-md uppercase tracking-wider text-xs shadow-xs">
                                {pageGroup.departmentConfig.reportTitleEn}
                              </div>
                            </div>
                          ) : (
                            /* Digital Header (Only if user explicitly unchecks pad mode) */
                            <div className="break-inside-avoid flex items-center justify-between pb-3.5 border-b-2 border-purple-950 gap-4">
                              {clinicConfig.logoUrl ? (
                                <img
                                  src={clinicConfig.logoUrl}
                                  alt="Clinic Logo"
                                  className="w-16 h-16 object-contain shrink-0 rounded-lg shadow-2xs"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-xl bg-purple-950 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-2xs">
                                  +
                                </div>
                              )}
                              <div className="text-center flex-1">
                                <h1 className="text-2xl sm:text-3xl font-black text-purple-950 uppercase tracking-tight">
                                  {clinicConfig.clinicName}
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-700 font-semibold mt-0.5">
                                  {clinicConfig.address} · Hotline: {clinicConfig.phone} · Reg: {clinicConfig.regNo}
                                </p>
                                <div className="inline-block mt-1.5 px-5 py-1 bg-purple-950 text-white font-black rounded-md uppercase tracking-wider text-xs shadow-xs">
                                  {pageGroup.departmentConfig.reportTitleEn}
                                </div>
                              </div>
                              <div className="w-14 shrink-0 hidden sm:block" />
                            </div>
                          )}

                          {/* Patient Details Table - Clean, High Contrast & Exactly Matching Form Data */}
                          <div className="patient-details-box break-inside-avoid p-3.5 bg-gradient-to-r from-slate-50 to-purple-50/40 rounded-xl border border-slate-300 shadow-2xs print:p-2.5 print:bg-slate-50 print:border-slate-300 print:rounded-lg print:shadow-none">
                            <div className="patient-details-grid grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-slate-800">
                              {/* Left Column */}
                              <div className="space-y-1.5">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-xs font-black text-slate-600 uppercase tracking-wider min-w-28">ID No :</span>
                                  <strong className="font-mono text-purple-950 font-black text-sm bg-purple-100/80 px-2 py-0.5 rounded border border-purple-200">
                                    {patient.pId}
                                  </strong>
                                </div>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-xs font-black text-slate-600 uppercase tracking-wider min-w-28">Patient's Name :</span>
                                  <strong className="text-slate-950 font-black text-base tracking-tight">
                                    {patient.patientName}
                                  </strong>
                                </div>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-xs font-black text-slate-600 uppercase tracking-wider min-w-28">Specimen :</span>
                                  <strong className="text-slate-900 font-bold text-xs bg-white px-2 py-0.5 rounded border border-purple-200 shadow-2xs">
                                    {patient.sampleType || pageGroup.departmentConfig.sampleTypeEn || 'Whole Blood'}
                                  </strong>
                                </div>
                              </div>

                              {/* Right Column */}
                              <div className="space-y-1.5 sm:text-right">
                                <div className="flex items-baseline justify-between sm:justify-end gap-2">
                                  <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Test Date :</span>
                                  <strong className="font-mono text-slate-900 font-bold text-xs bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                                    {patient.billDate || patient.invDate}
                                  </strong>
                                </div>
                                <div className="flex items-baseline justify-between sm:justify-end gap-2">
                                  <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Age :</span>
                                  <span className="font-black text-slate-900 text-sm">
                                    {patient.age}
                                  </span>
                                </div>
                                <div className="flex items-baseline justify-between sm:justify-end gap-2">
                                  <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Sex :</span>
                                  <span className="font-black text-slate-900 text-sm">
                                    {patient.sex}
                                  </span>
                                </div>
                              </div>

                              {/* Full-Width Ref. By (Doctor Name in a single line across full width) */}
                              <div className="sm:col-span-2 flex items-baseline gap-2 pt-1 border-t border-slate-200/80">
                                <span className="text-xs font-black text-slate-600 uppercase tracking-wider shrink-0 min-w-28">Ref. By :</span>
                                <strong className="text-purple-950 font-black text-sm tracking-tight">
                                  {refDoctorWithDegree}
                                </strong>
                              </div>
                            </div>
                          </div>

                          {/* Department Section Header Banner - Clear & Beautiful */}
                          <div className="department-banner break-inside-avoid flex items-center justify-between px-4 py-2 bg-gradient-to-r from-purple-100 via-indigo-50 to-purple-50 border-l-4 border-purple-900 rounded-r-lg shadow-2xs print:py-2 print:px-3 print:bg-purple-100">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="font-black text-purple-950 uppercase tracking-wider text-xs sm:text-sm">
                                DEPARTMENT: {pageGroup.departmentConfig.nameEn.toUpperCase()}
                              </span>
                              <span className="text-xs text-purple-900 font-bold bg-purple-200/60 px-2 py-0.5 rounded">
                                {pageGroup.departmentConfig.nameBn}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="font-bold text-slate-600 uppercase">Specimen:</span>
                              <strong className="text-purple-950 font-black bg-white px-2.5 py-0.5 rounded border border-purple-200 shadow-2xs">
                                {patient.sampleType || pageGroup.departmentConfig.sampleTypeEn}
                              </strong>
                            </div>
                          </div>
                        </div>
                      </th>
                    </tr>
                  </thead>

                  {/* TBODY: Test Results Table & Clinical Remarks */}
                  <tbody>
                    <tr>
                      <td className="p-0 border-none align-top">
                        <div className="report-body-content space-y-3 py-2">
                          {/* Investigation Results Table - High Contrast, Clear & Large */}
                          <div className="results-table-container break-inside-avoid overflow-hidden rounded-xl border-2 border-slate-300 shadow-xs print:rounded-lg print:shadow-none print:border-slate-300">
                            <table className="w-full text-left border-collapse bg-white">
                              <thead>
                                <tr className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white font-black text-xs sm:text-sm tracking-wide">
                                  <th className="py-2.5 px-3.5 border-r border-purple-800">Test Parameter & Method</th>
                                  <th className="py-2.5 px-3.5 border-r border-purple-800 w-32 sm:w-36 text-center">Result</th>
                                  <th className="py-2.5 px-3.5 border-r border-purple-800 w-24 sm:w-28 text-center">Unit</th>
                                  <th className="py-2.5 px-3.5 border-r border-purple-800 w-40 sm:w-48 text-center">Reference Range</th>
                                  <th className="py-2.5 px-3.5 w-24 sm:w-28 text-center">Flag</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {pageGroup.tests.map((tr, idx) => (
                                  <tr
                                    key={idx}
                                    className="break-inside-avoid odd:bg-white even:bg-slate-50/70 hover:bg-purple-50/50 transition-colors"
                                  >
                                    <td className="py-2 px-3.5 font-bold text-slate-900 text-sm border-r border-slate-200">
                                      <div>{tr.testName}</div>
                                      {tr.method && (
                                        <div className="text-[10px] font-medium text-slate-500">
                                          Method: {tr.method}
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-2 px-3.5 text-center font-black font-mono text-purple-950 text-base tracking-wide border-r border-slate-200 bg-purple-50/30">
                                      {tr.result || '-'}
                                    </td>
                                    <td className="py-2 px-3.5 text-center text-slate-700 font-mono text-xs sm:text-sm font-bold border-r border-slate-200">
                                      {tr.unit || '-'}
                                    </td>
                                    <td className="py-2 px-3.5 text-center text-slate-800 font-mono text-xs sm:text-sm font-semibold border-r border-slate-200 leading-snug">
                                      {tr.normalRange || '-'}
                                    </td>
                                    <td className="py-2 px-3.5 text-center">
                                      <span
                                        className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wider border shadow-2xs ${
                                          tr.status === 'Critical'
                                            ? 'bg-red-700 text-white border-red-900 ring-2 ring-red-400'
                                            : tr.status === 'High'
                                            ? 'bg-red-50 text-red-700 border-red-300 ring-1 ring-red-400/30'
                                            : tr.status === 'Low'
                                            ? 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-400/30'
                                            : 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/30'
                                        }`}
                                      >
                                        {tr.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Comments if any */}
                          {patient.comments && (
                            <div className="comments-box break-inside-avoid p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-300 text-sm shadow-2xs print:p-2.5 print:rounded-lg print:shadow-none">
                              <strong className="text-purple-950 font-black block mb-1 uppercase tracking-wide text-xs">
                                Clinical Comments / Interpretation:
                              </strong>
                              <p className="text-slate-800 text-sm font-medium leading-relaxed">{patient.comments}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  </tbody>

                  {/* TFOOT: Repeating Footer with Signatures & Lab Disclaimer Fixed at Bottom of Every Page */}
                  <tfoot>
                    <tr>
                      <td className="p-0 border-none">
                        <div className="report-footer-content pt-4 space-y-2.5">
                          {/* Signatures */}
                          <div className="signatures-section signatures-row break-inside-avoid pt-5 sm:pt-7 flex justify-between items-end text-center print:pt-4">
                            <div>
                              <div className="w-56 border-t-2 border-slate-600 pt-2 font-black text-slate-900 text-sm flex items-center justify-center gap-1.5">
                                <span>{patient.technicallyValidatedBy || clinicConfig.labInCharge}</span>
                                <button
                                  type="button"
                                  onClick={() => setShowEditTechModal(true)}
                                  className="no-print p-0.5 text-purple-700 hover:text-pink-600 hover:bg-purple-100 rounded transition cursor-pointer"
                                  title={lang === 'bn' ? 'মেডিকেল টেকনোলজিস্ট এর নাম ইডিট করুন' : 'Edit Medical Technologist Name'}
                                >
                                  <Pencil className="w-3.5 h-3.5 text-pink-600" />
                                </button>
                              </div>
                              <p className="text-xs font-bold text-slate-600 mt-0.5">
                                {clinicConfig.labInChargeDesignation || 'Checked & Validated By (Medical Technologist)'}
                              </p>
                            </div>
                            {/* Pathologist / Doctor Signature (Optional) */}
                            <div>
                              {showDoctorSignature ? (
                                <div>
                                  <div className="w-56 border-t-2 border-slate-600 pt-2 font-black text-slate-900 text-sm flex items-center justify-center gap-1.5">
                                    <span>{patient.verifiedBy || clinicConfig.pathologistName}</span>
                                    <button
                                      type="button"
                                      onClick={() => setShowEditTechModal(true)}
                                      className="no-print p-0.5 text-purple-700 hover:text-pink-600 hover:bg-purple-100 rounded transition cursor-pointer"
                                      title={lang === 'bn' ? 'ডাক্তারের নাম ও পদবী পরিবর্তন করুন' : 'Edit Doctor Name & Degree'}
                                    >
                                      <Pencil className="w-3.5 h-3.5 text-pink-600" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setShowDoctorSignature(false)}
                                      className="no-print px-1.5 py-0.5 text-[10px] bg-red-100 hover:bg-red-200 text-red-700 rounded font-bold cursor-pointer transition ml-0.5"
                                      title={lang === 'bn' ? 'ডাক্তারের নাম বাদ দিন' : 'Hide Doctor Name'}
                                    >
                                      {lang === 'bn' ? 'বাদ দিন' : 'Hide'}
                                    </button>
                                  </div>
                                  <p className="text-xs font-bold text-slate-600 mt-0.5">{clinicConfig.pathologistDegree}</p>
                                </div>
                              ) : (
                                <div>
                                  <div className="w-56 border-t-2 border-slate-400 pt-2 flex flex-col items-center">
                                    <div className="no-print flex items-center justify-center gap-1.5 mb-1">
                                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                                        {lang === 'bn' ? 'নাম বন্ধ' : 'Name Off'}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setShowDoctorSignature(true)}
                                        className="px-2 py-0.5 text-[10px] bg-purple-700 hover:bg-purple-800 text-white rounded font-bold transition cursor-pointer shadow-2xs"
                                        title={lang === 'bn' ? 'ডাক্তারের নাম ফিরিয়ে আনুন' : 'Show Doctor Name'}
                                      >
                                        + {lang === 'bn' ? 'নাম আনুন' : 'Show Name'}
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-xs font-bold text-slate-500 mt-0.5">
                                    {lang === 'bn' ? 'অনুমোদিত স্বাক্ষর' : 'Authorized Pathologist Signature'}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Lab Disclaimer */}
                          <div className="text-[10px] text-slate-500 italic border-t border-slate-200 pt-1.5">
                            <strong>Lab Disclaimer:</strong>{' '}
                            {patient.labDisclaimer ||
                              'Laboratory investigations should be clinically correlated with patient history. Not valid for medico-legal purpose.'}
                          </div>

                          {/* Page Number & Hospital Footer */}
                          <div className="report-footer-section break-inside-avoid pt-1.5 border-t border-slate-300 flex justify-between items-center text-xs text-slate-600 font-semibold print:pt-1.5">
                            <span>
                              Acc: <strong className="font-mono text-purple-950 font-bold">{patient.accessionNo || `ACC-${patient.pId}`}</strong> | PID: <strong className="font-mono text-purple-950 font-bold">{patient.pId}</strong>
                            </span>
                            <span className="font-black text-purple-950 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              {lang === 'bn'
                                ? `পৃষ্ঠা ${pageGroup.pageIndex} / ${totalPages} (${pageGroup.departmentConfig.nameBn})`
                                : `Page ${pageGroup.pageIndex} of ${totalPages} (${pageGroup.departmentConfig.nameEn})`}
                            </span>
                            <span className="text-slate-500">Computerized Diagnostic Report</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          })}
        </div>
      </div>

      {showEditTechModal && (
        <EditTechnologistModal onClose={() => setShowEditTechModal(false)} />
      )}
    </div>
  );
};
