import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Trash2,
  X,
  AlertTriangle,
  Lock,
  CheckCircle2,
  ArchiveRestore,
  FileWarning,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const PRESET_REASONS = [
  'ডুপ্লিকেট বা ভুল এন্ট্রি (Duplicate / Wrong Entry)',
  'রোগীর অনুরোধে অর্ডার বাতিল (Cancelled by Patient)',
  'টেস্ট বা ইনভেস্টিগেশন পরিবর্তন (Test / Service Changed)',
  'ভুল পেশেন্ট আইডিতে এন্ট্রি (Entered Under Wrong PID)',
  'অ্যাডমিন ডাটা ক্লিনআপ ও সংশোধন (Admin Data Audit)',
];

export const AdminDeleteConfirmModal: React.FC = () => {
  const {
    pendingDeleteRequest,
    setPendingDeleteRequest,
    confirmAdminSoftDelete,
    currentUser,
    isAdminUser,
    setOpenRecycleBinModal,
  } = useApp();

  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (pendingDeleteRequest) {
      setReason('');
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [pendingDeleteRequest]);

  if (!pendingDeleteRequest) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const finalReason = reason.trim() || (!isAdminUser ? 'Non-Admin Delete Attempt' : '');
    if (isAdminUser && !finalReason) {
      setErrorMsg('অনুগ্রহ করে তথ্য মুছে ফেলার সুনির্দিষ্ট কারণ (Deletion Reason) উল্লেখ করুন।');
      return;
    }

    setIsSubmitting(true);
    const res = await confirmAdminSoftDelete(finalReason);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Delete operation blocked by server security policy.');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div
          className={`px-6 py-4 flex items-center justify-between border-b ${
            isAdminUser
              ? 'bg-gradient-to-r from-rose-600 to-red-700 text-white border-rose-700'
              : 'bg-gradient-to-r from-amber-600 to-red-700 text-white border-amber-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              {isAdminUser ? <Trash2 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">
                {isAdminUser
                  ? 'অ্যাডমিন ডিলিট নিশ্চিতকরণ (Soft Delete to Recycle Bin)'
                  : 'ডিলিট পারমিশন সংরক্ষিত (Admin-Only Delete Permission)'}
              </h3>
              <p className="text-xs text-white/85 mt-0.5">
                {pendingDeleteRequest.entityLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPendingDeleteRequest(null)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-6 space-y-4">
          {/* Target Record Summary Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              নির্বাচিত রেকর্ড (Target Record)
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
              {pendingDeleteRequest.recordTitle}
            </div>
            {pendingDeleteRequest.recordSubtitle && (
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {pendingDeleteRequest.recordSubtitle}
              </div>
            )}
          </div>

          {/* Non-Admin Role Warning */}
          {!isAdminUser ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
                  <p className="font-bold text-sm mb-1">
                    আপনার ইউজার রোলের ({currentUser?.role || 'Staff'}) কোনো তথ্য Delete করার অনুমতি নেই!
                  </p>
                  <p>
                    হাসপাতালের নিরাপত্তা নীতিমালা অনুযায়ী শুধুমাত্র <strong>Admin</strong> কোনো রেকর্ড মুছে ফেলতে পারেন।
                    অন্যান্য ব্যবহারকারী (Receptionist, Lab Technologist, Doctor, Billing Staff) শুধুমাত্র তথ্য দেখতে, নতুন এন্ট্রি দিতে বা অনুমোদিত অংশ সম্পাদনা করতে পারবেন।
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Dependency Check Alert */}
              {pendingDeleteRequest.dependencies && pendingDeleteRequest.dependencies.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300 mb-1.5">
                    <FileWarning className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>সংশ্লিষ্ট রেকর্ড ও ডিপেন্ডেন্সি সতর্কতা (Linked Dependencies):</span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-amber-800 dark:text-amber-200 space-y-1">
                    {pendingDeleteRequest.dependencies.map((dep, idx) => (
                      <li key={idx}>{dep}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Soft Delete Information */}
              <div className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 flex items-start gap-2.5">
                <ArchiveRestore className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                  <strong>নিরাপদ Soft Delete সক্রিয়:</strong> এই তথ্যটি সাথে সাথে স্থায়ীভাবে নষ্ট হবে না। এটি{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setPendingDeleteRequest(null);
                      setOpenRecycleBinModal(true);
                    }}
                    className="underline font-bold hover:text-indigo-700"
                  >
                    Admin Recycle Bin / Trash
                  </button>
                  -এ সংরক্ষিত থাকবে এবং প্রয়োজনে পরে আবার Restore করা যাবে।
                </div>
              </div>

              {/* Deletion Reason Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  মুছে ফেলার কারণ (Mandatory Deletion Reason for Audit Log) <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="কেন এই রেকর্ডটি ডিলিট করা হচ্ছে তা সংক্ষেপে লিখুন..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PRESET_REASONS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setReason(preset);
                        setErrorMsg(null);
                      }}
                      className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition ${
                        reason === preset
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Error / 403 Response Banner */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 flex items-start gap-2 text-xs font-semibold text-rose-800 dark:text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setPendingDeleteRequest(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            >
              বাতিল করুন (Cancel)
            </button>

            {isAdminUser ? (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white shadow-sm flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'মুছে ফেলা হচ্ছে...' : 'Confirm Soft Delete'}</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 transition"
                title="সার্ভারে ডিলিট রিকোয়েস্ট পাঠিয়ে 403 Forbidden এবং Audit Log যাচাই করুন"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'যাচাই হচ্ছে...' : 'Verify Backend 403 Block'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
