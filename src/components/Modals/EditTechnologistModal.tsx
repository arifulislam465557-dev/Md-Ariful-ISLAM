import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserCheck, X, Save, CheckCircle2, Award } from 'lucide-react';

interface EditTechnologistModalProps {
  onClose: () => void;
}

export const EditTechnologistModal: React.FC<EditTechnologistModalProps> = ({ onClose }) => {
  const { clinicConfig, updateClinicConfig, lang } = useApp();

  const [labInCharge, setLabInCharge] = useState(clinicConfig.labInCharge || '');
  const [pathologistName, setPathologistName] = useState(clinicConfig.pathologistName || '');
  const [pathologistDegree, setPathologistDegree] = useState(clinicConfig.pathologistDegree || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!labInCharge.trim()) return;

    updateClinicConfig({
      labInCharge: labInCharge.trim(),
      pathologistName: pathologistName.trim() || clinicConfig.pathologistName,
      pathologistDegree: pathologistDegree.trim() || clinicConfig.pathologistDegree,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-purple-400 dark:border-purple-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 px-5 py-3.5 text-white flex items-center justify-between border-b border-purple-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-400/30 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-pink-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                {lang === 'bn' ? 'মেডিকেল টেকনোলজিস্ট ও প্যাথলজিস্ট তথ্য' : 'Medical Technologist & Pathologist Details'}
              </h3>
              <p className="text-[11px] text-purple-300">
                {lang === 'bn'
                  ? 'রিপোর্টে স্বাক্ষরকারী মেডিকেল টেকনোলজিস্টের নাম পরিবর্তন করুন'
                  : 'Update Medical Technologist name printed on pathology reports'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 text-xs">
          {savedSuccess && (
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-400 text-emerald-800 dark:text-emerald-300 rounded-lg flex items-center gap-2 font-bold animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {lang === 'bn'
                  ? 'মেডিকেল টেকনোলজিস্টের নাম সফলভাবে আপডেট হয়েছে!'
                  : 'Medical Technologist name successfully updated!'}
              </span>
            </div>
          )}

          {/* Medical Technologist Name */}
          <div>
            <label className="block font-black text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-purple-600" />
              <span>
                {lang === 'bn' ? 'মেডিকেল টেকনোলজিস্ট (ল্যাব ইন-চার্জ নাম ও ডিগ্রি)' : 'Medical Technologist (Lab In-Charge)'} *
              </span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={labInCharge}
              onChange={(e) => setLabInCharge(e.target.value)}
              placeholder="যেমন: মোঃ আল-আমিন, B.Sc (Lab Technology)"
              className="w-full bg-purple-50/50 dark:bg-slate-800 border-2 border-purple-300 dark:border-purple-600 px-3 py-2 rounded-lg text-sm font-black text-purple-950 dark:text-purple-200 focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              {lang === 'bn'
                ? '💡 এখানে যে নাম লিখবেন, যতক্ষণ না নিজে এসে এটি পরিবর্তন করবেন ততক্ষণ এই নামটাই স্থায়ী থাকবে।'
                : '💡 The name saved here will remain permanently on pathology reports until you edit it.'}
            </p>
          </div>

          {/* Pathologist / Lab Director */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs">
              {lang === 'bn' ? 'কনসালট্যান্ট প্যাথলজিস্টের তথ্য (ঐচ্ছিক):' : 'Consultant Pathologist (Optional):'}
            </h4>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'প্যাথলজিস্টের নাম' : 'Pathologist Name'}
              </label>
              <input
                type="text"
                value={pathologistName}
                onChange={(e) => setPathologistName(e.target.value)}
                placeholder="যেমন: Dr. Sharmin Akter, MBBS, MD (Pathology)"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'পদবী / ডিগ্রি' : 'Designation / Degree'}
              </label>
              <input
                type="text"
                value={pathologistDegree}
                onChange={(e) => setPathologistDegree(e.target.value)}
                placeholder="Senior Consultant & Lab Director"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg font-bold text-xs cursor-pointer"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
