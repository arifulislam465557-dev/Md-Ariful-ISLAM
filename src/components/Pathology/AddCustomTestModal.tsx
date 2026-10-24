import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TestResultItem } from '../../types';
import {
  LAB_CATEGORIES,
  CATEGORIZED_PRESETS,
  getCategoryDef,
} from '../../utils/pathologyCategories';
import {
  PlusCircle,
  X,
  FlaskConical,
  Sparkles,
  Plus,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface AddCustomTestModalProps {
  onClose: () => void;
  onAddTest: (
    item: TestResultItem,
    saveToCatalog: boolean,
    catalogDetails?: { category: string; price: number }
  ) => void;
  onAddEmptyRowDirectly: (category: string) => void;
  initialCategory?: string;
}

const COMMON_UNITS = [
  'mg/dL',
  'g/dL',
  'mmol/L',
  '%',
  'U/L',
  '/cumm',
  'mm/1st hr',
  'uIU/mL',
  'pmol/L',
  'ng/mL',
  'Titre',
  'Qualitative',
];

export const AddCustomTestModal: React.FC<AddCustomTestModalProps> = ({
  onClose,
  onAddTest,
  onAddEmptyRowDirectly,
  initialCategory = 'Biochemistry',
}) => {
  const { lang, t } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [testName, setTestName] = useState('');
  const [result, setResult] = useState('');
  const [unit, setUnit] = useState('mg/dL');
  const [normalRange, setNormalRange] = useState('');
  const [status, setStatus] = useState<'Normal' | 'High' | 'Low'>('Normal');
  const [price, setPrice] = useState(300);
  const [saveToCatalog, setSaveToCatalog] = useState(true);

  // When selected category changes, update default units or sample if empty
  const activeCategoryDef = getCategoryDef(selectedCategory);
  const presetsForCategory = CATEGORIZED_PRESETS[selectedCategory] || [];

  // Auto calculate abnormal status if numeric
  useEffect(() => {
    if (!result.trim() || !normalRange.trim()) return;
    const num = parseFloat(result);
    if (!isNaN(num) && normalRange.includes('-')) {
      const parts = normalRange
        .split('-')
        .map((p) => parseFloat(p.trim().replace(/[^0-9.]/g, '')));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        if (num < parts[0]) {
          setStatus('Low');
        } else if (num > parts[1]) {
          setStatus('High');
        } else {
          setStatus('Normal');
        }
      }
    }
  }, [result, normalRange]);

  const handleSelectPreset = (preset: {
    name: string;
    unit: string;
    normalRange: string;
    price: number;
    defaultValue?: string;
  }) => {
    setTestName(preset.name);
    setUnit(preset.unit);
    setNormalRange(preset.normalRange);
    setPrice(preset.price);
    if (preset.defaultValue) {
      setResult(preset.defaultValue);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) return;

    onAddTest(
      {
        testName: testName.trim(),
        result: result.trim(),
        unit: unit.trim(),
        normalRange: normalRange.trim(),
        status,
        category: selectedCategory,
      },
      saveToCatalog,
      { category: selectedCategory, price }
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-purple-500 dark:border-purple-700 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 px-5 py-3.5 text-white flex items-center justify-between border-b border-purple-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-purple-600/30 border border-purple-400/30 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base leading-tight">
                {lang === 'bn'
                  ? 'ডিপার্টমেন্ট / ক্যাটাগরি অনুযায়ী কাস্টম টেস্ট যোগ'
                  : 'Add Test Parameter by Department / Category'}
              </h3>
              <p className="text-[11px] text-purple-300">
                {lang === 'bn'
                  ? 'ক্যাটাগরি নির্বাচন করে টেস্ট সেট করুন; প্রিন্ট ও প্রিভিউতে এটি আলাদা পেইজে আসবে'
                  : 'Select category first; tests under this department print on a dedicated page'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* STEP 1: Select Category Prominently */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>
                  {lang === 'bn'
                    ? '১. টেস্ট ক্যাটাগরি / বিভাগ নির্বাচন করুন:'
                    : '1. Select Test Department / Category:'}
                </span>
              </label>
              <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400">
                {lang === 'bn' ? activeCategoryDef.departmentBn : activeCategoryDef.departmentEn}
              </span>
            </div>

            {/* Category Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LAB_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setTestName('');
                      setResult('');
                    }}
                    className={`p-2.5 rounded-xl text-left border-2 transition cursor-pointer flex items-center justify-between gap-1.5 ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 shadow-sm ring-2 ring-purple-500/30'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-400'
                    }`}
                  >
                    <div>
                      <div className="font-black text-xs text-slate-900 dark:text-slate-100">
                        {lang === 'bn' ? cat.nameBn : cat.nameEn}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {lang === 'bn' ? cat.defaultSampleBn : cat.defaultSampleEn}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Category Presets */}
          {presetsForCategory.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    {lang === 'bn'
                      ? `"${activeCategoryDef.nameBn}" এর জনপ্রিয় টেস্টসমূহ (ক্লিক করলেই ফিল হবে):`
                      : `Popular Presets for "${activeCategoryDef.nameEn}":`}
                  </span>
                </label>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-purple-50/50 dark:bg-slate-800/60 rounded-xl border border-purple-200 dark:border-slate-700">
                {presetsForCategory.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                      testName === preset.name
                        ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                        : 'bg-white dark:bg-slate-700 hover:bg-purple-100 text-purple-950 dark:text-purple-200 border-purple-300 dark:border-slate-600 shadow-2xs'
                    }`}
                  >
                    + {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Test Name */}
          <div>
            <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
              {lang === 'bn' ? '২. টেস্টের নাম (Test Name)' : '2. Test Name'} *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder={
                selectedCategory === 'CBC'
                  ? 'e.g. Hemoglobin, Platelet Count, Neutrophils...'
                  : selectedCategory === 'Urine'
                  ? 'e.g. Pus Cells, Albumin, Specific Gravity...'
                  : selectedCategory === 'Hormone'
                  ? 'e.g. TSH, Free T4, Prolactin...'
                  : selectedCategory === 'Serology'
                  ? 'e.g. Widal Test, HBsAg, Dengue NS1...'
                  : 'e.g. Serum Creatinine, Fasting Blood Sugar...'
              }
              className="w-full bg-purple-50/40 dark:bg-slate-800 border-2 border-purple-400 dark:border-purple-600 px-3.5 py-2 rounded-xl text-sm font-black text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          {/* STEP 4: Result & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
                {lang === 'bn' ? 'টেস্ট ফলাফল (Result)' : 'Test Result'}
              </label>
              <input
                type="text"
                value={result}
                onChange={(e) => setResult(e.target.value)}
                placeholder="যেমন: 1.2 বা Negative বা 140"
                className="w-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 px-3 py-2 rounded-xl text-sm font-black text-purple-950 dark:text-purple-200 focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
                {lang === 'bn' ? 'ইউনিট (Unit)' : 'Unit'}
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. mg/dL, mmol/L..."
                className="w-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 px-3 py-2 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {COMMON_UNITS.slice(0, 7).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-purple-100 text-[10px] font-semibold text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 5: Biological Reference Range & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-7">
              <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
                {lang === 'bn'
                  ? 'রেফারেন্স রেঞ্জ (Biological Reference Range)'
                  : 'Biological Reference Range'}
              </label>
              <input
                type="text"
                value={normalRange}
                onChange={(e) => setNormalRange(e.target.value)}
                placeholder="যেমন: 0.7 - 1.3 বা 12.0 - 16.0"
                className="w-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 px-3 py-2 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-600 focus:outline-none font-mono"
              />
            </div>

            <div className="sm:col-span-5">
              <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
                {lang === 'bn' ? 'স্ট্যাটাস (Status)' : 'Status'}
              </label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setStatus('Normal')}
                  className={`py-2 rounded-lg text-xs font-black transition cursor-pointer border ${
                    status === 'Normal'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('High')}
                  className={`py-2 rounded-lg text-xs font-black transition cursor-pointer border ${
                    status === 'High'
                      ? 'bg-red-600 text-white border-red-700 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  High
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('Low')}
                  className={`py-2 rounded-lg text-xs font-black transition cursor-pointer border ${
                    status === 'Low'
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Low
                </button>
              </div>
            </div>
          </div>

          {/* Test Fee & Save To Catalog */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'টেস্ট ফি / মূল্য (টাকা)' : 'Test Fee (BDT)'}
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                placeholder="300"
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <label className="p-2 bg-purple-50/60 dark:bg-slate-800/80 rounded-xl border border-purple-200 dark:border-slate-700 flex items-center gap-2 cursor-pointer text-xs font-bold text-purple-950 dark:text-purple-200 w-full">
                <input
                  type="checkbox"
                  checked={saveToCatalog}
                  onChange={(e) => setSaveToCatalog(e.target.checked)}
                  className="w-4 h-4 accent-purple-700 rounded cursor-pointer shrink-0"
                />
                <span className="text-[11px] leading-tight">
                  {lang === 'bn'
                    ? 'মাস্টার ডাটাবেজেও টেস্টটি সংরক্ষণ করুন'
                    : 'Save into master test catalog for reuse'}
                </span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onAddEmptyRowDirectly(selectedCategory);
                onClose();
              }}
              className="text-purple-800 dark:text-purple-300 hover:text-purple-900 font-bold text-xs hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                {lang === 'bn'
                  ? `"${activeCategoryDef.nameBn}" এ ফাঁকা রো যোগ করুন`
                  : `Add empty row in "${activeCategoryDef.nameEn}"`}
              </span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg font-bold text-xs transition cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>
                  {lang === 'bn'
                    ? `"${activeCategoryDef.nameBn}" টেস্ট যোগ`
                    : `Add to ${activeCategoryDef.nameEn}`}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
