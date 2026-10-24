import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserCheck, X, Save, CheckCircle2, Award, Stethoscope, Lock, Sparkles } from 'lucide-react';

interface EditTechnologistModalProps {
  onClose: () => void;
  initialTarget?: 'technologist' | 'pathologist' | 'both';
  onSaved?: (cfg: {
    labInCharge: string;
    labInChargeDesignation: string;
    pathologistName: string;
    pathologistDegree: string;
  }) => void;
}

export const EditTechnologistModal: React.FC<EditTechnologistModalProps> = ({
  onClose,
  initialTarget = 'both',
  onSaved,
}) => {
  const { clinicConfig, updateClinicConfig, lang } = useApp();

  const [activeTab, setActiveTab] = useState<'technologist' | 'pathologist' | 'both'>(initialTarget);
  const [labInCharge, setLabInCharge] = useState(clinicConfig.labInCharge || '');
  const [labInChargeDesignation, setLabInChargeDesignation] = useState(
    clinicConfig.labInChargeDesignation || 'Medical Technologist (Lab In-Charge)'
  );
  const [pathologistName, setPathologistName] = useState(clinicConfig.pathologistName || '');
  const [pathologistDegree, setPathologistDegree] = useState(
    clinicConfig.pathologistDegree || 'Senior Consultant & Lab Director, MBBS, MD (Pathology)'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const finalTechName = labInCharge.trim() || clinicConfig.labInCharge || 'Medical Technologist (Lab In-Charge)';
    const finalTechDesig = labInChargeDesignation.trim() || 'Medical Technologist (Lab)';
    const finalPathName = pathologistName.trim() || clinicConfig.pathologistName || 'Dr. Sharmin Akter, MBBS, MD (Pathology)';
    const finalPathDegree = pathologistDegree.trim() || clinicConfig.pathologistDegree || 'Senior Consultant & Lab Director';

    updateClinicConfig({
      labInCharge: finalTechName,
      labInChargeDesignation: finalTechDesig,
      pathologistName: finalPathName,
      pathologistDegree: finalPathDegree,
    });

    if (onSaved) {
      onSaved({
        labInCharge: finalTechName,
        labInChargeDesignation: finalTechDesig,
        pathologistName: finalPathName,
        pathologistDegree: finalPathDegree,
      });
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-purple-400 dark:border-purple-700 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 px-5 py-4 text-white flex items-center justify-between border-b border-purple-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-400/30 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-pink-300" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg leading-tight flex items-center gap-2">
                <span>
                  {lang === 'bn' ? 'স্বাক্ষরকারী নাম ও পদবী নির্ধারণ' : 'Set Signatory Name & Designation'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 font-normal">
                  <Lock className="w-2.5 h-2.5 inline mr-1" />
                  {lang === 'bn' ? 'স্থায়ী / ফিক্সড' : 'Fixed'}
                </span>
              </h3>
              <p className="text-[11px] text-purple-200 mt-0.5">
                {lang === 'bn'
                  ? 'এখানে একবার নাম ও পদবী সেট করলে তা স্থায়ী থাকবে এবং প্রতি রিপোর্টে ব্যবহার হবে'
                  : 'Name and designation set here will remain fixed on all pathology reports'}
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

        {/* Tab Selection */}
        <div className="bg-slate-100 dark:bg-slate-800 p-2 border-b border-slate-200 dark:border-slate-700 flex gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('technologist')}
            className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'technologist'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-pink-400" />
            <span>{lang === 'bn' ? '১. টেকনিক্যাল ভ্যালিডেশন' : '1. Tech Validated'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pathologist')}
            className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'pathologist'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
            <span>{lang === 'bn' ? '২. প্যাথলজিস্ট ভেরিফাইড' : '2. Verified By'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('both')}
            className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
              activeTab === 'both'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'bn' ? 'উভয়' : 'Both'}</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 text-xs">
          {savedSuccess && (
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-400 text-emerald-800 dark:text-emerald-300 rounded-lg flex items-center gap-2 font-bold animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {lang === 'bn'
                  ? 'নাম ও পদবী স্থায়ীভাবে সংরক্ষিত হয়েছে! যতক্ষণে আপনি পরিবর্তন না করবেন ততক্ষণ এই নাম থাকবে।'
                  : 'Names and designations permanently saved! They will remain fixed until changed.'}
              </span>
            </div>
          )}

          {/* Section 1: Medical Technologist (Tech Validated By) */}
          {(activeTab === 'technologist' || activeTab === 'both') && (
            <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border-2 border-purple-200 dark:border-purple-800 space-y-3">
              <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-200 flex items-center justify-center font-black text-xs">
                    ১
                  </span>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                      {lang === 'bn' ? 'টেকনিক্যাল ভ্যালিডেশন (মেডিকেল টেকনোলজিস্ট)' : 'Technical Validation (Medical Technologist)'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {lang === 'bn' ? 'প্রথম ঘরের জন্য নাম ও ডেজিগনেশন' : 'For the first signature box'}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-200">
                  {lang === 'bn' ? 'ফিক্সড বক্স ১' : 'Fixed Box 1'}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {lang === 'bn' ? 'টেকনোলজিস্টের নাম (Name):' : 'Technologist Name:'} *
                </label>
                <input
                  type="text"
                  required
                  value={labInCharge}
                  onChange={(e) => setLabInCharge(e.target.value)}
                  placeholder="যেমন: মোঃ আল-আমিন"
                  className="w-full bg-white dark:bg-slate-800 border-2 border-purple-300 dark:border-purple-700 px-3 py-2 rounded-lg text-sm font-black text-slate-950 dark:text-slate-100 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {lang === 'bn' ? 'পদবী / ডিগ্রী (Designation / Degree):' : 'Designation / Degree:'}
                </label>
                <input
                  type="text"
                  value={labInChargeDesignation}
                  onChange={(e) => setLabInChargeDesignation(e.target.value)}
                  placeholder="যেমন: Medical Technologist (Lab) / B.Sc in Laboratory Medicine"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Section 2: Pathologist / Verified By */}
          {(activeTab === 'pathologist' || activeTab === 'both') && (
            <div className="p-3.5 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/20 border-2 border-cyan-200 dark:border-cyan-800 space-y-3">
              <div className="flex items-center justify-between border-b border-cyan-200 dark:border-cyan-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-cyan-200 dark:bg-cyan-800 text-cyan-900 dark:text-cyan-200 flex items-center justify-center font-black text-xs">
                    ২
                  </span>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                      {lang === 'bn' ? 'প্যাথলজিস্ট ভেরিফাইড (কনসালট্যান্ট ডাক্তার)' : 'Pathologist Verified (Consultant Doctor)'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {lang === 'bn' ? 'দ্বিতীয় ঘরের জন্য নাম ও ডেজিগনেশন' : 'For the second signature box'}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-200 dark:bg-cyan-800 text-cyan-900 dark:text-cyan-200">
                  {lang === 'bn' ? 'ফিক্সড বক্স ২' : 'Fixed Box 2'}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {lang === 'bn' ? 'ডাক্তার / প্যাথলজিস্টের নাম (Doctor Name):' : 'Doctor / Pathologist Name:'} *
                </label>
                <input
                  type="text"
                  required
                  value={pathologistName}
                  onChange={(e) => setPathologistName(e.target.value)}
                  placeholder="যেমন: Dr. Sharmin Akter, MBBS, MD (Pathology)"
                  className="w-full bg-white dark:bg-slate-800 border-2 border-cyan-300 dark:border-cyan-700 px-3 py-2 rounded-lg text-sm font-black text-slate-950 dark:text-slate-100 focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {lang === 'bn' ? 'পদবী / ডিগ্রী / বিভাগ (Designation / Department):' : 'Designation / Department:'}
                </label>
                <input
                  type="text"
                  value={pathologistDegree}
                  onChange={(e) => setPathologistDegree(e.target.value)}
                  placeholder="যেমন: Senior Consultant & Head of Pathology"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Helper Callout */}
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>{lang === 'bn' ? 'স্থায়ী সংরক্ষণের নিশ্চয়তা:' : 'Permanent Fixed Storage:'}</strong>{' '}
              {lang === 'bn'
                ? 'এই নাম দুটো একবার লিখলেই হবে, বারবার লেখার কোনো প্রয়োজন নেই। যতক্ষণে আপনি নিজে এসে এখানে পরিবর্তন না করবেন, ততক্ষণে নাম দুটো সব সময় এখানেই ফিক্সড থাকবে।'
                : 'These names only need to be entered once. They will remain fixed permanently across reports until you choose to change them.'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg font-bold text-xs cursor-pointer"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{lang === 'bn' ? 'স্থায়ীভাবে সংরক্ষণ করুন' : 'Save Permanently'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
