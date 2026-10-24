import React, { useState } from 'react';
import {
  ArchiveRestore,
  Trash2,
  X,
  ShieldCheck,
  ShieldAlert,
  Printer,
  FileText,
  History,
  Database,
  RefreshCw,
  CheckCircle2,
  Lock,
  Search,
  Eye,
  AlertOctagon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const RecycleBinModal: React.FC = () => {
  const {
    openRecycleBinModal,
    setOpenRecycleBinModal,
    trashRecords,
    restoreFromRecycleBin,
    permanentlyDeleteFromRecycleBin,
    printRecords,
    auditLogs,
    isAdminUser,
    currentUser,
    autoSaveStatus,
    lastAutoSavedAt,
    dbVersion,
    triggerImmediateAutoSave,
    simulateUnauthorizedDeleteAttempt,
    patients,
    invoices,
    doctors,
    labTests,
    prescriptions,
    opdAppointments,
    employees,
    expenses,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'trash' | 'prints' | 'audit' | 'diagnostics'>('trash');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [confirmingPermanentId, setConfirmingPermanentId] = useState<string | null>(null);
  const [permanentDeleteReason, setPermanentDeleteReason] = useState<string>('');
  const [expandedJsonId, setExpandedJsonId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error' | 'warn';
    message: string;
  } | null>(null);
  const [simulatedRole, setSimulatedRole] = useState<string>('Billing');
  const [simResult, setSimResult] = useState<{ status: number; error: string } | null>(null);

  if (!openRecycleBinModal) return null;

  const handleRestore = async (trashId: string) => {
    setBusyId(trashId);
    setFeedbackBanner(null);
    const res = await restoreFromRecycleBin(trashId);
    setBusyId(null);
    if (res.success) {
      setFeedbackBanner({
        type: 'success',
        message: 'রেকর্ডটি সফলভাবে মূল মডিউলে পুনরুদ্ধার (Restore) করা হয়েছে!',
      });
    } else {
      setFeedbackBanner({
        type: 'error',
        message: res.error || 'রিস্টোর করা সম্ভব হয়নি।',
      });
    }
  };

  const handlePermanentDelete = async (trashId: string, fallbackReason?: string) => {
    const finalReason = permanentDeleteReason.trim() || fallbackReason || 'Admin confirmed permanent purge from Recycle Bin';
    setBusyId(trashId);
    setFeedbackBanner(null);
    const res = await permanentlyDeleteFromRecycleBin(trashId, finalReason);
    setBusyId(null);
    setConfirmingPermanentId(null);
    setPermanentDeleteReason('');
    if (res.success) {
      setFeedbackBanner({
        type: 'warn',
        message: 'রেকর্ডটি রিসাইকেল বিন থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে এবং অডিট লগে নথিভুক্ত হয়েছে।',
      });
    } else {
      setFeedbackBanner({
        type: 'error',
        message: res.error || 'Permanent Delete ব্যর্থ হয়েছে।',
      });
    }
  };

  const handleSimulateNonAdminDelete = async () => {
    setBusyId('sim');
    const result = await simulateUnauthorizedDeleteAttempt(
      simulatedRole,
      'Patient Record — Titly (PID: 26100294)'
    );
    setBusyId(null);
    setSimResult(result);
  };

  const filteredTrash = trashRecords.filter(
    (item) =>
      !searchQuery.trim() ||
      item.recordTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.entityLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.deletionReason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPrints = printRecords.filter(
    (item) =>
      !searchQuery.trim() ||
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.pId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.documentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.printedByFullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAudit = auditLogs.filter(
    (item) =>
      !searchQuery.trim() ||
      item.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.userFullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.actionType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  স্থায়ী ডাটাবেস, অটো-সেভ এবং অ্যাডমিন রিসাইকেল বিন ও অডিট সেন্টার
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  DB v{dbVersion} · Auto-Save Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Permanent Data Storage · Soft Delete Recovery · Print/PDF Version Tracking · Admin-Only RBAC
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpenRecycleBinModal(false)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs & Search Bar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('trash')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'trash'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>রিসাইকেল বিন / Trash ({trashRecords.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('prints')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'prints'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট ও পিডিএফ ভার্সন ({printRecords.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'audit'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>অপরিবর্তনীয় অডিট লগ ({auditLogs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('diagnostics')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'diagnostics'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Auto-Save ও RBAC ভেরিফিকেশন</span>
            </button>
          </div>

          {activeTab !== 'diagnostics' && (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="রেকর্ড, পিআইডি বা ইউজার খুঁজুন..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Feedback Banner */}
        {feedbackBanner && (
          <div
            className={`mx-6 mt-3 p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
              feedbackBanner.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200'
                : feedbackBanner.type === 'warn'
                ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-200'
                : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-200'
            }`}
          >
            <span>{feedbackBanner.message}</span>
            <button
              type="button"
              onClick={() => setFeedbackBanner(null)}
              className="text-xs underline ml-4"
            >
              বন্ধ করুন
            </button>
          </div>
        )}

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: RECYCLE BIN / TRASH */}
          {activeTab === 'trash' && (
            <div className="space-y-4">
              {!isAdminUser ? (
                <div className="p-8 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center space-y-2">
                  <Lock className="w-10 h-10 text-rose-600 mx-auto" />
                  <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">
                    শুধুমাত্র সিস্টেম অ্যাডমিন (Admin) রিসাইকেল বিন ও ডিলিটকৃত তথ্য দেখতে এবং Restore করতে পারবেন
                  </h3>
                  <p className="text-xs text-rose-700 dark:text-rose-300 max-w-lg mx-auto">
                    আপনার বর্তমান ইউজার রোল ({currentUser?.role || 'Staff'})। রিসাইকেল বিন থেকে কোনো রেকর্ড পুনরুদ্ধার বা স্থায়ীভাবে মুছে ফেলার জন্য Admin অ্যাকাউন্টে লগইন করুন।
                  </p>
                </div>
              ) : filteredTrash.length === 0 ? (
                <div className="p-10 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                  <Trash2 className="w-9 h-9 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    রিসাইকেল বিনে কোনো মুছে ফেলা রেকর্ড নেই (Recycle Bin is Empty)
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    যখন কোনো রেকর্ড Admin কর্তৃক Delete করা হবে, তখন সেটি স্থায়ীভাবে নষ্ট না হয়ে এখানে সংরক্ষিত থাকবে এবং যেকোনো সময় Restore করা যাবে।
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTrash.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2.5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                              {item.entityLabel}
                            </span>
                            <span className="text-xs text-slate-400">
                              Deleted: {new Date(item.deletedAt).toLocaleString()}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                            {item.recordTitle}
                          </h4>
                          {item.recordSubtitle && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {item.recordSubtitle}
                            </p>
                          )}
                          <div className="mt-1.5 text-xs text-slate-700 dark:text-slate-300">
                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                              মুছে ফেলার কারণ (Reason):
                            </span>{' '}
                            {item.deletionReason} ·{' '}
                            <span className="text-slate-500">
                              Deleted by: {item.deletedByFullName} ({item.deletedByRole})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedJsonId(expandedJsonId === item.id ? null : item.id)
                            }
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center gap-1 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Data Snapshot</span>
                          </button>

                          <button
                            type="button"
                            disabled={busyId === item.id}
                            onClick={() => handleRestore(item.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition"
                          >
                            <ArchiveRestore className="w-3.5 h-3.5" />
                            <span>Restore Record</span>
                          </button>

                          {confirmingPermanentId === item.id ? (
                            <div className="flex flex-wrap items-center gap-1.5 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800">
                              <input
                                type="text"
                                value={permanentDeleteReason}
                                onChange={(e) => setPermanentDeleteReason(e.target.value)}
                                placeholder="স্থায়ী মুছে ফেলার কারণ লিখুন..."
                                className="px-2 py-1 text-[11px] rounded border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-44 outline-none"
                              />
                              <button
                                type="button"
                                disabled={busyId === item.id || !permanentDeleteReason.trim()}
                                onClick={() => handlePermanentDelete(item.id, item.deletionReason)}
                                className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-[11px] font-bold"
                              >
                                হ্যাঁ, নিশ্চিত
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmingPermanentId(null);
                                  setPermanentDeleteReason('');
                                }}
                                className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold"
                              >
                                না
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmingPermanentId(item.id);
                                setPermanentDeleteReason(item.deletionReason || '');
                              }}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-1 transition"
                            >
                              <AlertOctagon className="w-3.5 h-3.5" />
                              <span>Permanent Delete</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {expandedJsonId === item.id && (
                        <pre className="mt-2 p-3 rounded-xl bg-slate-900 text-emerald-300 text-[11px] overflow-x-auto max-h-48">
                          {JSON.stringify(item.originalData, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRINT & PDF VERSION REGISTRY */}
          {activeTab === 'prints' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                <div>
                  <strong>প্রিন্ট ও পিডিএফ ভার্সন ট্র্যাকিং সক্রিয়:</strong> প্রতিটি রিপোর্ট, ইনভয়েস ও প্রেসক্রিপশন কতবার এবং কার দ্বারা প্রিন্ট বা পিডিএফ ডাউনলোড হয়েছে তার অপরিবর্তনীয় রেকর্ড এখানে সংরক্ষিত থাকে।
                </div>
                <span className="font-bold shrink-0 ml-3">মোট প্রিন্ট/পিডিএফ: {printRecords.length}</span>
              </div>

              {filteredPrints.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  এখনো কোনো প্রিন্ট বা পিডিএফ এক্সপোর্ট রেকর্ড নেই। যেকোনো রিপোর্ট বা ইনভয়েস প্রিন্ট/পিডিএফ করলে এখানে স্বয়ংক্রিয়ভাবে যুক্ত হবে।
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2.5 px-3 font-bold">সময় ও তারিখ</th>
                        <th className="py-2.5 px-3 font-bold">ডকুমেন্ট ও ধরন</th>
                        <th className="py-2.5 px-3 font-bold">রোগীর নাম ও পিআইডি</th>
                        <th className="py-2.5 px-3 font-bold">ভার্সন স্ট্যাটাস</th>
                        <th className="py-2.5 px-3 font-bold">প্রিন্টকারী ইউজার ও টার্মিনাল</th>
                        <th className="py-2.5 px-3 font-bold">সারসংক্ষেপ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                      {filteredPrints.map((pr) => (
                        <tr key={pr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {pr.printedAt}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {pr.documentTitle}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {pr.documentType} · {pr.actionType}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {pr.patientName}
                            </span>{' '}
                            <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                              ({pr.pId})
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                pr.isReprint
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              }`}
                            >
                              {pr.isReprint ? `Reprint (v${pr.version})` : `Original (v1)`}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {pr.printedByFullName}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Role: {pr.printedByRole} · {pr.workstationCode}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                            {pr.snapshotSummary}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: IMMUTABLE AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 text-xs text-purple-900 dark:text-purple-200 flex items-center justify-between">
                <span>
                  <strong>অপরিবর্তনীয় অডিট ট্রেইল (Immutable Audit Log):</strong> কে, কখন, কোন আইপি থেকে কী তৈরি, আপডেট, ডিলিট বা অননুমোদিত ডিলিট চেষ্টা করেছে তার সম্পূর্ণ ইতিহাস এখানে সংরক্ষিত। এটি কখনো মুছে ফেলা যায় না।
                </span>
              </div>

              <div className="space-y-2">
                {filteredAudit.slice(0, 80).map((log) => {
                  const isSecurityAlert =
                    log.actionType === 'UNAUTHORIZED_DELETE_ATTEMPT' ||
                    log.actionType === 'PERMANENT_DELETE' ||
                    log.actionType === 'SOFT_DELETE';
                  return (
                    <div
                      key={log.id}
                      className={`p-3 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
                        log.actionType === 'UNAUTHORIZED_DELETE_ATTEMPT'
                          ? 'bg-rose-50/90 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800'
                          : isSecurityAlert
                          ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                          : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.actionType === 'UNAUTHORIZED_DELETE_ATTEMPT'
                                ? 'bg-rose-600 text-white'
                                : log.actionType === 'SOFT_DELETE' ||
                                  log.actionType === 'PERMANENT_DELETE'
                                ? 'bg-amber-600 text-white'
                                : log.actionType === 'RESTORE_RECORD'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                            }`}
                          >
                            {log.actionType}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {log.userFullName} (@{log.username})
                          </span>
                          <span className="text-slate-500">
                            [{log.role} · {log.workstationCode} · IP: {log.ipAddress}]
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 mt-1">{log.details}</p>
                      </div>
                      <span className="font-mono text-[11px] text-slate-500 shrink-0">
                        {log.timestamp}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: LIVE AUTO-SAVE, PERMANENT DB & RBAC DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-5">
              {/* Permanent Database Inventory Grid */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Permanent Server Database Status (hospital-permanent-db.json)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      সর্বশেষ স্বয়ংক্রিয়ভাবে সংরক্ষিত: <strong>{lastAutoSavedAt}</strong> · Database Version: <strong>v{dbVersion}</strong> · Status: <strong>{autoSaveStatus.toUpperCase()}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerImmediateAutoSave('manual_verification_sync')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Force Auto-Save & Sync Now</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  {[
                    { label: 'Patients & Lab Orders', count: patients.length },
                    { label: 'Billing Invoices', count: invoices.length },
                    { label: 'OPD Appointments', count: opdAppointments.length },
                    { label: 'Prescriptions (Rx)', count: prescriptions.length },
                    { label: 'Doctors Master', count: doctors.length },
                    { label: 'Pathology Templates', count: labTests.length },
                    { label: 'Staff / Employees', count: employees.length },
                    { label: 'Expense Vouchers', count: expenses.length },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    >
                      <div className="text-[11px] text-slate-500">{stat.label}</div>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {stat.count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Backend 403 RBAC Live Security Simulator */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 space-y-3">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      লাইভ ব্যাকএন্ড ডিলিট পারমিশন (HTTP 403 Forbidden) টেস্টার
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      এখানে আপনি পরীক্ষা করে দেখতে পারেন যে Admin ছাড়া অন্য কোনো রোল (যেমন Receptionist, Lab Technologist, Doctor, Billing Staff) যদি সরাসরি Backend API (<code className="font-mono">POST /api/db/delete</code>) কল করে কোনো তথ্য মুছে ফেলার চেষ্টা করে, তবে সার্ভার তাৎক্ষণিকভাবে <strong>403 Forbidden</strong> দিয়ে তা ব্লক করে দেয় এবং Audit Log-এ নথিভুক্ত করে।
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <select
                    value={simulatedRole}
                    onChange={(e) => setSimulatedRole(e.target.value)}
                    className="px-3 py-2 rounded-xl text-xs font-bold border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    <option value="Billing">Billing / Cashier Role</option>
                    <option value="Lab">Pathology Lab Technologist Role</option>
                    <option value="Doctor">Doctor / Consultant Role</option>
                    <option value="Staff">Receptionist / Staff Role</option>
                    <option value="Xray">X-Ray Operator Role</option>
                  </select>

                  <button
                    type="button"
                    disabled={busyId === 'sim'}
                    onClick={handleSimulateNonAdminDelete}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition"
                  >
                    {busyId === 'sim'
                      ? 'সার্ভারে রিকোয়েস্ট পাঠানো হচ্ছে...'
                      : `Simulate Delete API as "${simulatedRole}" Role`}
                  </button>
                </div>

                {simResult && (
                  <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 space-y-1">
                    <div className="font-bold">
                      Backend Response Status: HTTP {simResult.status} Forbidden (Blocked!)
                    </div>
                    <div>{simResult.error}</div>
                    <div className="text-[11px] text-rose-700 dark:text-rose-300">
                      ✓ এই অননুমোদিত ডিলিট চেষ্টাটি স্বয়ংক্রিয়ভাবে Immutable Audit Trail-এ রেকর্ড করা হয়েছে।
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
