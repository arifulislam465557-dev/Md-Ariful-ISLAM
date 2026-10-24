import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { LabTest, SubTest, ParameterInputType, Patient } from '../../types';
import {
  getAllLabCategories,
  getCustomLabCategories,
  saveCustomLabCategories,
  LabCategoryDef,
} from '../../utils/pathologyCategories';
import { expandLabTestToResultItems } from '../../utils/pathologyUtils';
import {
  Plus,
  Search,
  Edit3,
  Copy,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  Layers,
  ShieldAlert,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  X,
  RotateCcw,
  Sliders,
  CheckCheck,
  Power,
} from 'lucide-react';

interface AdminTestMasterPanelProps {
  onPreviewTemplate: (previewPatient: Patient) => void;
  onLoadTemplateIntoWorkspace?: (test: LabTest) => void;
}

export const AdminTestMasterPanel: React.FC<AdminTestMasterPanelProps> = ({
  onPreviewTemplate,
  onLoadTemplateIntoWorkspace,
}) => {
  const {
    labTests,
    addLabTest,
    updateLabTest,
    deleteLabTest,
    resetLabTestsToDefault,
    patients,
    invoices,
    currentUser,
    lang,
    addAuditLog,
  } = useApp();

  const [categories, setCategories] = useState<LabCategoryDef[]>(() => getAllLabCategories());
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled' | 'unverified'>('all');
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'warn' | 'error' } | null>(null);

  // Category Management Modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatId, setNewCatId] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [newCatNameBn, setNewCatNameBn] = useState('');
  const [newCatDeptEn, setNewCatDeptEn] = useState('');
  const [newCatSampleEn, setNewCatSampleEn] = useState('Serum / Clinical Specimen');

  // Template Designer Modal state
  const [showDesignerModal, setShowDesignerModal] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Hematology');
  const [sampleType, setSampleType] = useState('EDTA Whole Blood');
  const [method, setMethod] = useState('Automated Analyzer');
  const [turnaroundTime, setTurnaroundTime] = useState('2 Hours');
  const [price, setPrice] = useState<number>(400);
  const [unit, setUnit] = useState('');
  const [normalRange, setNormalRange] = useState('');
  const [maleRange, setMaleRange] = useState('');
  const [femaleRange, setFemaleRange] = useState('');
  const [childRange, setChildRange] = useState('');
  const [pregnancyRange, setPregnancyRange] = useState('');
  const [criticalLow, setCriticalLow] = useState<string>('');
  const [criticalHigh, setCriticalHigh] = useState<string>('');
  const [inputType, setInputType] = useState<ParameterInputType>('numeric');
  const [optionsText, setOptionsText] = useState('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSensitive, setIsSensitive] = useState<boolean>(false);
  const [rangeVerified, setRangeVerified] = useState<boolean>(false);
  const [subTests, setSubTests] = useState<SubTest[]>([]);

  const showToast = (text: string, type: 'success' | 'warn' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Exclude non-pathology radiology items unless user searches for them
  const pathologyTests = useMemo(() => {
    return labTests.filter(
      (t) =>
        t.category.toLowerCase() !== 'x-ray' &&
        t.category.toLowerCase() !== 'ultrasound' &&
        t.category.toLowerCase() !== 'ecg' &&
        !t.code.toUpperCase().startsWith('XR_')
    );
  }, [labTests]);

  const filteredTests = useMemo(() => {
    return pathologyTests.filter((t) => {
      if (selectedCategoryFilter !== 'ALL') {
        const catClean = t.category.toLowerCase();
        const filterClean = selectedCategoryFilter.toLowerCase();
        if (filterClean === 'clinical pathology') {
          if (catClean !== 'clinical pathology' && catClean !== 'urine' && catClean !== 'stool') {
            return false;
          }
        } else if (catClean !== filterClean) {
          return false;
        }
      }

      if (statusFilter === 'active' && t.isActive === false) return false;
      if (statusFilter === 'disabled' && t.isActive !== false) return false;
      if (statusFilter === 'unverified' && t.rangeVerified === true) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = t.code.toLowerCase().includes(q);
        const matchName = t.name.toLowerCase().includes(q);
        const matchCat = t.category.toLowerCase().includes(q);
        const matchSub = t.subTests?.some((st) => st.name.toLowerCase().includes(q));
        return matchCode || matchName || matchCat || Boolean(matchSub);
      }

      return true;
    });
  }, [pathologyTests, selectedCategoryFilter, statusFilter, searchQuery]);

  // Check if a test is referenced in existing patient reports or invoices
  const isTestUsedInRecords = (test: LabTest): boolean => {
    const usedInInvoices = invoices.some((inv) =>
      inv.items.some(
        (it) =>
          it.testId === test.id ||
          it.testId.toUpperCase() === test.code.toUpperCase() ||
          it.testName.toLowerCase() === test.name.toLowerCase()
      )
    );
    const usedInPatients = patients.some((pat) =>
      pat.testResults?.some(
        (tr) =>
          tr.parentTestCode?.toUpperCase() === test.code.toUpperCase() ||
          tr.testName.toLowerCase() === test.name.toLowerCase()
      )
    );
    return usedInInvoices || usedInPatients;
  };

  const openNewTestDesigner = () => {
    setEditingTestId(null);
    setCode(`TST_${Math.floor(100 + Math.random() * 900)}`);
    setName('');
    setCategory(selectedCategoryFilter !== 'ALL' ? selectedCategoryFilter : 'Hematology');
    setSampleType('Serum / EDTA Whole Blood');
    setMethod('Automated Analyzer');
    setTurnaroundTime('2 Hours');
    setPrice(400);
    setUnit('');
    setNormalRange('');
    setMaleRange('');
    setFemaleRange('');
    setChildRange('');
    setPregnancyRange('');
    setCriticalLow('');
    setCriticalHigh('');
    setInputType('numeric');
    setOptionsText('');
    setIsActive(true);
    setIsSensitive(false);
    setRangeVerified(true);
    setSubTests([]);
    setShowDesignerModal(true);
  };

  const openEditTestDesigner = (test: LabTest) => {
    setEditingTestId(test.id);
    setCode(test.code);
    setName(test.name);
    setCategory(test.category);
    setSampleType(test.sampleType || 'Serum');
    setMethod(test.method || 'Standard Laboratory Method');
    setTurnaroundTime(test.turnaroundTime || '2 Hours');
    setPrice(test.price || 0);
    setUnit(test.unit || '');
    setNormalRange(test.normalRange || '');
    setMaleRange(test.maleRange || '');
    setFemaleRange(test.femaleRange || '');
    setChildRange(test.childRange || '');
    setPregnancyRange(test.pregnancyRange || '');
    setCriticalLow(test.criticalLow !== undefined ? String(test.criticalLow) : '');
    setCriticalHigh(test.criticalHigh !== undefined ? String(test.criticalHigh) : '');
    setInputType(test.inputType || 'numeric');
    setOptionsText(test.options ? test.options.join(', ') : '');
    setIsActive(test.isActive !== false);
    setIsSensitive(Boolean(test.isSensitive));
    setRangeVerified(Boolean(test.rangeVerified));
    setSubTests(test.subTests ? test.subTests.map((s) => ({ ...s })) : []);
    setShowDesignerModal(true);
  };

  const handleDuplicateTemplate = (test: LabTest) => {
    const newCode = `${test.code}_COPY`;
    const collision = labTests.some((t) => t.code.toUpperCase() === newCode.toUpperCase());
    const finalCode = collision ? `${test.code}_${Date.now().toString().slice(-3)}` : newCode;

    const duplicated = addLabTest({
      ...test,
      code: finalCode,
      name: `${test.name} (Copy)`,
      subTests: test.subTests ? test.subTests.map((st) => ({ ...st })) : undefined,
      rangeVerified: false,
    });

    addAuditLog({
      actionType: 'SETTINGS_UPDATE',
      details: `Duplicated Pathology Test Template ${test.code} -> ${duplicated.code} (${duplicated.name})`,
    });

    showToast(
      lang === 'bn'
        ? `টেমপ্লেট ডুপ্লিকেট হয়েছে: ${duplicated.name} (${duplicated.code})`
        : `Template duplicated: ${duplicated.name} (${duplicated.code})`,
      'success'
    );
  };

  const handleToggleActive = (test: LabTest) => {
    const nextState = test.isActive === false ? true : false;
    updateLabTest(test.id, { isActive: nextState });
    addAuditLog({
      actionType: 'SETTINGS_UPDATE',
      details: `${nextState ? 'Enabled' : 'Disabled'} Pathology Test Template: ${test.name} (${test.code})`,
    });
    showToast(
      nextState
        ? lang === 'bn'
          ? `${test.name} সক্রিয় করা হয়েছে`
          : `${test.name} enabled`
        : lang === 'bn'
        ? `${test.name} নিষ্ক্রিয় (Disabled) করা হয়েছে`
        : `${test.name} disabled`,
      nextState ? 'success' : 'warn'
    );
  };

  const handleVerifyRange = (test: LabTest) => {
    const verifier = currentUser?.fullName || 'Lab Authority / Admin';
    const nowStr = new Date().toLocaleString();
    const verifiedSubs = test.subTests?.map((st) => ({ ...st, rangeVerified: true }));
    updateLabTest(test.id, {
      rangeVerified: true,
      verifiedBy: verifier,
      verifiedAt: nowStr,
      subTests: verifiedSubs,
    });
    addAuditLog({
      actionType: 'SETTINGS_UPDATE',
      details: `Verified Reference Ranges & Method for ${test.name} (${test.code}) by ${verifier}`,
    });
    showToast(
      lang === 'bn'
        ? `✓ ${test.name}-এর রেফারেন্স রেঞ্জ ও মেথড ল্যাব কর্তৃপক্ষ কর্তৃক যাচাইকৃত হিসেবে অনুমোদিত হয়েছে`
        : `✓ Reference Range & Method verified for ${test.name}`,
      'success'
    );
  };

  const handleVerifyAllRanges = () => {
    const verifier = currentUser?.fullName || 'Lab Authority / Admin';
    const nowStr = new Date().toLocaleString();
    pathologyTests.forEach((t) => {
      if (!t.rangeVerified) {
        updateLabTest(t.id, {
          rangeVerified: true,
          verifiedBy: verifier,
          verifiedAt: nowStr,
          subTests: t.subTests?.map((st) => ({ ...st, rangeVerified: true })),
        });
      }
    });
    addAuditLog({
      actionType: 'SETTINGS_UPDATE',
      details: `Bulk verified all Pathology Test Master reference ranges by ${verifier}`,
    });
    showToast(
      lang === 'bn'
        ? '✓ সকল প্যাথলজি টেস্ট টেমপ্লেটের রেফারেন্স রেঞ্জ ল্যাব কর্তৃক যাচাইকৃত করা হয়েছে!'
        : '✓ All pathology test reference ranges verified!',
      'success'
    );
  };

  const handleDeleteTest = (test: LabTest) => {
    if (isTestUsedInRecords(test)) {
      showToast(
        lang === 'bn'
          ? `সতর্কতা: "${test.name}" ইতিমধ্যে রোগীর রেকর্ড/বিলে ব্যবহৃত হয়েছে। ডিলিট না করে এটি Disable করুন।`
          : `Protected: "${test.name}" is referenced in existing patient records/invoices. Please Disable it instead of deleting.`,
        'error'
      );
      return;
    }
    deleteLabTest(test.id);
  };

  const handlePreviewSingleTemplate = (test: LabTest) => {
    const expanded = expandLabTestToResultItems(test, 'Male', '32 Y');
    const previewPatient: Patient = {
      id: `tmpl-preview-${test.id}`,
      pId: 'TEMPLATE-PREVIEW',
      accessionNo: `TMPL-${test.code}`,
      invDate: new Date().toLocaleDateString('en-GB'),
      billDate: new Date().toLocaleDateString('en-GB'),
      patientName: lang === 'bn' ? 'টেমপ্লেট প্রিন্ট প্রিভিউ (খালি ফরম্যাট)' : 'Template Print Layout Preview (Blank Format)',
      age: '32',
      sex: 'Male',
      drCode: 'DR01',
      drName: 'Template Verification Preview',
      status: 'Printed',
      workflowStatus: 'Verified',
      department: test.category,
      sampleType: test.sampleType || 'Clinical Specimen',
      comments: `Method: ${test.method || 'Standard Laboratory Protocol'} | Turnaround Time: ${test.turnaroundTime || '2 Hours'}`,
      testResults: expanded,
    };
    onPreviewTemplate(previewPatient);
  };

  const handleAddSubTestRow = () => {
    setSubTests((prev) => [
      ...prev,
      {
        name: '',
        unit: '',
        normalRange: '',
        inputType: 'numeric',
        method: method || '',
        rangeVerified: true,
      },
    ]);
  };

  const handleUpdateSubTest = (idx: number, field: keyof SubTest, value: any) => {
    setSubTests((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleMoveSubTest = (idx: number, direction: 'up' | 'down') => {
    setSubTests((prev) => {
      const next = [...prev];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= next.length) return prev;
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };

  const handleRemoveSubTest = (idx: number) => {
    setSubTests((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();

    if (!cleanCode || !cleanName) {
      showToast(lang === 'bn' ? 'টেস্ট কোড এবং টেস্টের নাম আবশ্যক!' : 'Test Code and Name are required!', 'error');
      return;
    }

    // Check duplicate code collision
    const codeCollision = labTests.some(
      (t) => t.id !== editingTestId && t.code.toUpperCase() === cleanCode
    );
    if (codeCollision) {
      showToast(
        lang === 'bn'
          ? `ত্রুটি: টেস্ট কোড "${cleanCode}" ইতিমধ্যে অন্য একটি পরীক্ষায় ব্যবহৃত হয়েছে!`
          : `Validation Error: Test Code "${cleanCode}" already exists in Test Master!`,
        'error'
      );
      return;
    }

    const cleanedSubTests = subTests
      .filter((st) => st.name.trim() !== '')
      .map((st) => ({
        ...st,
        name: st.name.trim(),
        unit: st.unit.trim(),
        normalRange: st.normalRange.trim(),
        rangeVerified,
      }));

    const parsedOptions = optionsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: Omit<LabTest, 'id'> = {
      code: cleanCode,
      name: cleanName,
      category,
      sampleType: sampleType.trim() || 'Clinical Specimen',
      method: method.trim() || 'Standard Method',
      turnaroundTime: turnaroundTime.trim() || '2 Hours',
      price: Number(price) || 0,
      unit: cleanedSubTests.length > 0 ? 'Panel' : unit.trim(),
      normalRange: cleanedSubTests.length > 0 ? 'See Individual Parameters' : normalRange.trim(),
      maleRange: maleRange.trim() || undefined,
      femaleRange: femaleRange.trim() || undefined,
      childRange: childRange.trim() || undefined,
      pregnancyRange: pregnancyRange.trim() || undefined,
      criticalLow: criticalLow.trim() !== '' ? Number(criticalLow) : undefined,
      criticalHigh: criticalHigh.trim() !== '' ? Number(criticalHigh) : undefined,
      inputType,
      options: parsedOptions.length > 0 ? parsedOptions : undefined,
      isActive,
      isSensitive,
      rangeVerified,
      verifiedBy: rangeVerified ? currentUser?.fullName || 'Admin' : undefined,
      verifiedAt: rangeVerified ? new Date().toLocaleString() : undefined,
      subTests: cleanedSubTests.length > 0 ? cleanedSubTests : undefined,
    };

    if (editingTestId) {
      updateLabTest(editingTestId, payload);
      addAuditLog({
        actionType: 'SETTINGS_UPDATE',
        details: `Updated Pathology Test Master Template: ${cleanName} (${cleanCode}) with ${cleanedSubTests.length || 1} parameters`,
      });
      showToast(
        lang === 'bn'
          ? `✓ "${cleanName}" টেমপ্লেট সফলভাবে আপডেট হয়েছে!`
          : `✓ Updated template "${cleanName}" (${cleanCode})!`,
        'success'
      );
    } else {
      addLabTest(payload);
      addAuditLog({
        actionType: 'SETTINGS_UPDATE',
        details: `Created new Pathology Test Master Template: ${cleanName} (${cleanCode}) with ${cleanedSubTests.length || 1} parameters`,
      });
      showToast(
        lang === 'bn'
          ? `✓ নতুন টেস্ট টেমপ্লেট "${cleanName}" মাস্টার ডাটাবেজে যুক্ত হয়েছে!`
          : `✓ Added new template "${cleanName}" (${cleanCode})!`,
        'success'
      );
    }

    setShowDesignerModal(false);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const idClean = newCatId.trim() || newCatNameEn.trim();
    if (!idClean || !newCatNameEn.trim()) return;

    if (categories.some((c) => c.id.toLowerCase() === idClean.toLowerCase())) {
      showToast(lang === 'bn' ? 'এই নামের বিভাগ ইতিমধ্যে বিদ্যমান!' : 'Category already exists!', 'error');
      return;
    }

    const newCat: LabCategoryDef = {
      id: idClean,
      nameEn: newCatNameEn.trim(),
      nameBn: newCatNameBn.trim() || newCatNameEn.trim(),
      departmentEn: newCatDeptEn.trim() || `DEPARTMENT OF ${newCatNameEn.trim().toUpperCase()}`,
      departmentBn: `${newCatNameBn.trim() || newCatNameEn.trim()} বিভাগ`,
      defaultSampleEn: newCatSampleEn.trim() || 'Clinical Specimen',
      defaultSampleBn: newCatSampleEn.trim() || 'ক্লিনিক্যাল নমুনা',
      badgeBg: 'bg-purple-100 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700',
      badgeText: 'text-purple-800 dark:text-purple-300',
      headerBg: 'from-purple-900 to-indigo-950',
    };

    const currentCustom = getCustomLabCategories();
    const updatedCustom = [...currentCustom, newCat];
    saveCustomLabCategories(updatedCustom);
    setCategories(getAllLabCategories());
    setNewCatId('');
    setNewCatNameEn('');
    setNewCatNameBn('');
    setNewCatDeptEn('');
    setShowCategoryModal(false);
    showToast(lang === 'bn' ? `নতুন বিভাগ "${newCat.nameEn}" যুক্ত হয়েছে!` : `Category "${newCat.nameEn}" added!`, 'success');
  };

  const handleExportTestMaster = () => {
    const exportPayload = {
      exportType: 'ADIBA_PATHOLOGY_TEST_MASTER',
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser?.fullName || 'Admin',
      totalTemplates: pathologyTests.length,
      customCategories: getCustomLabCategories(),
      templates: pathologyTests,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Pathology_Test_Master_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(
      lang === 'bn'
        ? `✓ ${pathologyTests.length}টি টেস্ট টেমপ্লেট সফলভাবে এক্সপোর্ট হয়েছে`
        : `✓ Exported ${pathologyTests.length} test templates to JSON`,
      'success'
    );
  };

  const handleImportTestMaster = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || '{}'));
        const list: LabTest[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.templates)
          ? parsed.templates
          : [];

        if (list.length === 0) {
          showToast(lang === 'bn' ? 'ফাইলে কোনো বৈধ টেস্ট টেমপ্লেট পাওয়া যায়নি!' : 'No valid test templates found in file!', 'error');
          return;
        }

        if (Array.isArray(parsed.customCategories) && parsed.customCategories.length > 0) {
          const existingCustom = getCustomLabCategories();
          const mergedCats = [...existingCustom];
          parsed.customCategories.forEach((c: LabCategoryDef) => {
            if (!mergedCats.some((ec) => ec.id.toLowerCase() === c.id.toLowerCase())) {
              mergedCats.push(c);
            }
          });
          saveCustomLabCategories(mergedCats);
          setCategories(getAllLabCategories());
        }

        let addedCount = 0;
        let updatedCount = 0;
        list.forEach((item) => {
          if (!item.code || !item.name) return;
          const existing = labTests.find((t) => t.code.toUpperCase() === item.code.toUpperCase());
          if (existing) {
            updateLabTest(existing.id, { ...item, id: existing.id });
            updatedCount++;
          } else {
            addLabTest(item);
            addedCount++;
          }
        });

        addAuditLog({
          actionType: 'SETTINGS_UPDATE',
          details: `Imported Pathology Test Master JSON (${addedCount} new, ${updatedCount} updated)`,
        });
        showToast(
          lang === 'bn'
            ? `✓ টেস্ট মাস্টার ইমপোর্ট সম্পন্ন: ${addedCount}টি নতুন, ${updatedCount}টি আপডেট হয়েছে`
            : `✓ Imported Test Master: ${addedCount} added, ${updatedCount} updated`,
          'success'
        );
      } catch {
        showToast(lang === 'bn' ? 'অবৈধ JSON ফাইল!' : 'Invalid JSON file format!', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const mainCategories = [
    { id: 'ALL', label: lang === 'bn' ? 'সকল বিভাগ (All)' : 'All Categories' },
    { id: 'Hematology', label: 'A. Hematology' },
    { id: 'Biochemistry', label: 'B. Clinical Biochemistry' },
    { id: 'Hormone', label: 'C. Hormone & Immunoassay' },
    { id: 'Serology', label: 'D. Serology & Immunology' },
    { id: 'Clinical Pathology', label: 'E. Clinical Pathology' },
    { id: 'Microbiology', label: 'F. Microbiology' },
    { id: 'Special Tests', label: 'G. Special Tests' },
  ];

  return (
    <div className="space-y-4">
      {toastMsg && (
        <div
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between shadow-md border ${
            toastMsg.type === 'error'
              ? 'bg-red-900 text-white border-red-400'
              : toastMsg.type === 'warn'
              ? 'bg-amber-800 text-white border-amber-400'
              : 'bg-emerald-900 text-white border-emerald-400'
          }`}
        >
          <span>{toastMsg.text}</span>
          <button onClick={() => setToastMsg(null)} className="ml-4 font-black">
            ✕
          </button>
        </div>
      )}

      {/* Top Header & Actions Bar */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white p-4 rounded-xl border border-purple-800 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
            <Sliders className="w-5 h-5 text-pink-400" />
            <span>
              {lang === 'bn'
                ? 'প্যাথলজি টেস্ট মাস্টার ও রেডিমেড রিপোর্ট টেমপ্লেট প্যানেল'
                : 'Pathology Test Master & Ready-Made Report Template System'}
            </span>
          </h2>
          <p className="text-xs text-purple-200 mt-0.5">
            {lang === 'bn'
              ? `মোট ${pathologyTests.length}টি রেডিমেড টেস্ট টেমপ্লেট · বয়স, লিঙ্গ ও প্রেগন্যান্সি রেফারেন্স রেঞ্জ · ল্যাব মেথড ভেরিফিকেশন`
              : `${pathologyTests.length} Ready-Made Templates · Dynamic Multi-Parameter Designer · Age/Sex/Pregnancy Reference Ranges`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={openNewTestDesigner}
            className="px-3.5 py-2 bg-pink-600 hover:bg-pink-500 text-white font-black rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'bn' ? 'নতুন টেস্ট / টেমপ্লেট যোগ' : 'Add New Test / Template'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCategoryModal(true)}
            className="px-3 py-2 bg-purple-800 hover:bg-purple-700 text-white font-bold rounded-lg flex items-center gap-1.5 border border-purple-600 cursor-pointer transition"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-300" />
            <span>{lang === 'bn' ? 'নতুন বিভাগ যোগ' : 'Category Management'}</span>
          </button>

          <button
            type="button"
            onClick={handleVerifyAllRanges}
            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg flex items-center gap-1.5 border border-emerald-500 cursor-pointer transition"
            title="Approve & verify all template reference ranges for clinical use"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'সব রেঞ্জ ভেরিফাই করুন' : 'Verify All Ranges'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportTestMaster}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold rounded-lg flex items-center gap-1.5 border border-slate-600 cursor-pointer transition"
          >
            <Download className="w-3.5 h-3.5 text-amber-300" />
            <span>{lang === 'bn' ? 'এক্সপোর্ট' : 'Export JSON'}</span>
          </button>

          <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold rounded-lg flex items-center gap-1.5 border border-slate-600 cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-emerald-300" />
            <span>{lang === 'bn' ? 'ইমপোর্ট' : 'Import JSON'}</span>
            <input type="file" accept=".json" onChange={handleImportTestMaster} className="hidden" />
          </label>

          <button
            type="button"
            onClick={resetLabTestsToDefault}
            className="px-2.5 py-2 bg-rose-900/80 hover:bg-rose-800 text-rose-100 font-bold rounded-lg flex items-center gap-1 border border-rose-700 cursor-pointer transition"
            title="Restore default 80+ templates"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Category Filter Tabs & Search */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border-2 border-purple-200 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {mainCategories.map((cat) => {
            const active = selectedCategoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  active
                    ? 'bg-purple-900 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-100'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'টেস্টের নাম, কোড, প্যারামিটার বা বিভাগ দিয়ে খুঁজুন (যেমন: CBC, Lipid, TSH, Dengue, Semen)...'
                  : 'Search by Test Code, Test Name, Parameter or Department (e.g. CBC, Lipid, TSH, Dengue, Semen)...'
              }
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            {(['all', 'active', 'disabled', 'unverified'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1.5 rounded-lg font-bold capitalize cursor-pointer border ${
                  statusFilter === st
                    ? 'bg-indigo-700 text-white border-indigo-800'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
              >
                {st === 'all'
                  ? lang === 'bn'
                    ? 'সবগুলো'
                    : 'All'
                  : st === 'active'
                  ? lang === 'bn'
                    ? 'সক্রিয়'
                    : 'Active'
                  : st === 'disabled'
                  ? lang === 'bn'
                    ? 'নিষ্ক্রিয়'
                    : 'Disabled'
                  : lang === 'bn'
                  ? 'যাচাই বাকি'
                  : 'Unverified Range'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Test Templates Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-300 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[540px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 sticky top-0 z-10 border-b-2 border-slate-400">
              <tr>
                <th className="py-2.5 px-3 font-black">Code</th>
                <th className="py-2.5 px-3 font-black">Test Name & Method</th>
                <th className="py-2.5 px-3 font-black">Category & Sample</th>
                <th className="py-2.5 px-3 font-black text-center">Parameters</th>
                <th className="py-2.5 px-3 font-black">Reference Range & Verification</th>
                <th className="py-2.5 px-3 font-black text-right">Fee / TAT</th>
                <th className="py-2.5 px-3 font-black text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredTests.map((test) => {
                const paramCount = test.subTests && test.subTests.length > 0 ? test.subTests.length : 1;
                const disabled = test.isActive === false;
                return (
                  <tr
                    key={test.id}
                    className={`hover:bg-purple-50/50 dark:hover:bg-slate-800/60 transition ${
                      disabled ? 'opacity-55 bg-slate-100 dark:bg-slate-950' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-black text-purple-900 dark:text-purple-300 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{test.code}</span>
                        {test.isSensitive && (
                          <span
                            className="px-1.5 py-0.2 bg-rose-100 text-rose-800 border border-rose-300 rounded text-[9px] font-bold flex items-center gap-0.5"
                            title="Role-Based Access Control (RBAC) Sensitive Test"
                          >
                            <ShieldAlert className="w-2.5 h-2.5" /> RBAC
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-black text-slate-900 dark:text-slate-100 text-xs">{test.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Method: {test.method || 'Standard Analyzer'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 font-bold text-[10px]">
                        {test.category}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-0.5">{test.sampleType || 'Serum / Blood'}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 font-black text-[11px]">
                        {paramCount} {paramCount > 1 ? 'Params' : 'Param'}
                      </span>
                      {test.subTests && test.subTests.length > 0 && (
                        <div className="text-[9px] text-slate-500 mt-0.5 max-w-[160px] truncate mx-auto">
                          {test.subTests.map((s) => s.name).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 max-w-[220px] truncate">
                        {test.normalRange}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        {test.rangeVerified ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            {lang === 'bn' ? 'ল্যাব ভেরিফাইড' : 'Lab Verified'}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleVerifyRange(test)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 hover:bg-emerald-600 text-amber-900 hover:text-white border border-amber-300 text-[10px] font-bold cursor-pointer transition"
                            title="Click to verify reference range and method for clinical reporting"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            <span>{lang === 'bn' ? 'রেঞ্জ অনুমোদন করুন' : 'Verify Range'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="font-black text-slate-900 dark:text-slate-100">৳{test.price}</div>
                      <div className="text-[10px] text-slate-500">TAT: {test.turnaroundTime || '2 Hours'}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {onLoadTemplateIntoWorkspace && !disabled && (
                          <button
                            type="button"
                            onClick={() => onLoadTemplateIntoWorkspace(test)}
                            className="px-2 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded font-bold text-[10px] cursor-pointer"
                            title="Load this template into active patient report"
                          >
                            + {lang === 'bn' ? 'রিপোর্টে যোগ' : 'Use'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handlePreviewSingleTemplate(test)}
                          className="p-1.5 bg-indigo-100 hover:bg-indigo-600 text-indigo-800 hover:text-white rounded cursor-pointer transition"
                          title="Print Layout Preview (A4)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditTestDesigner(test)}
                          className="p-1.5 bg-amber-100 hover:bg-amber-600 text-amber-900 hover:text-white rounded cursor-pointer transition"
                          title="Edit Template & Parameters"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateTemplate(test)}
                          className="p-1.5 bg-cyan-100 hover:bg-cyan-600 text-cyan-900 hover:text-white rounded cursor-pointer transition"
                          title="Duplicate Template"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(test)}
                          className={`p-1.5 rounded cursor-pointer transition ${
                            disabled
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-600 hover:text-white'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-600 hover:text-white'
                          }`}
                          title={disabled ? 'Enable Test' : 'Disable Test'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTest(test)}
                          className="p-1.5 bg-rose-100 hover:bg-rose-600 text-rose-700 hover:text-white rounded cursor-pointer transition"
                          title="Delete Test (Protected if used in patient records)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-5 border-2 border-purple-500 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <h3 className="font-black text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>{lang === 'bn' ? 'প্যাথলজি বিভাগ ব্যবস্থাপনা' : 'Pathology Category Management'}</span>
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-500 hover:text-red-500 font-bold">
                ✕
              </button>
            </div>

            <div className="mb-3 max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border rounded-lg p-2">
              {categories.map((c) => (
                <div key={c.id} className="py-1.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{c.nameEn}</span>
                    <span className="text-slate-500 ml-2">({c.nameBn})</span>
                  </div>
                  <span className="text-[10px] text-purple-700 dark:text-purple-300 font-mono">{c.defaultSampleEn}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddCategory} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Category Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={newCatNameEn}
                    onChange={(e) => {
                      setNewCatNameEn(e.target.value);
                      setNewCatId(e.target.value);
                    }}
                    placeholder="e.g. Histopathology & Cytology"
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">বিভাগের নাম (বাংলা)</label>
                  <input
                    type="text"
                    value={newCatNameBn}
                    onChange={(e) => setNewCatNameBn(e.target.value)}
                    placeholder="যেমন: হিস্টোপ্যাথলজি ও সাইটোলজি"
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Report Banner Title</label>
                  <input
                    type="text"
                    value={newCatDeptEn}
                    onChange={(e) => setNewCatDeptEn(e.target.value)}
                    placeholder="DEPARTMENT OF HISTOPATHOLOGY"
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Default Sample Type</label>
                  <input
                    type="text"
                    value={newCatSampleEn}
                    onChange={(e) => setNewCatSampleEn(e.target.value)}
                    placeholder="Biopsy Tissue / FNAC Aspirate"
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-black cursor-pointer"
                >
                  + Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Template Designer Modal */}
      {showDesignerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col border-2 border-purple-500 overflow-hidden text-xs">
            <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 px-5 py-3.5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm sm:text-base">
                  {editingTestId
                    ? lang === 'bn'
                      ? `টেস্ট টেমপ্লেট ডিজাইনার: ${name}`
                      : `Edit Report Template & Parameters: ${name}`
                    : lang === 'bn'
                    ? 'নতুন প্যাথলজি টেস্ট ও রিপোর্ট টেমপ্লেট তৈরি করুন'
                    : 'Create New Pathology Test & Report Template'}
                </h3>
                <p className="text-[11px] text-purple-200">
                  Configure test code, sample type, analyzer method, age/sex/pregnancy reference ranges & multi-parameter structure
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDesignerModal(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {/* Row 1: Basic Test Master Info */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="sm:col-span-2">
                  <label className="block font-black mb-1">Test Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CBC"
                    className="w-full p-2 border-2 border-purple-300 rounded-lg font-mono font-black uppercase bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block font-black mb-1">Test Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Complete Blood Count (CBC)"
                    className="w-full p-2 border-2 border-purple-300 rounded-lg font-black bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block font-black mb-1">Category / Department *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 border rounded-lg font-bold bg-white dark:bg-slate-900"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className="block font-black mb-1">Sample Type *</label>
                  <input
                    type="text"
                    value={sampleType}
                    onChange={(e) => setSampleType(e.target.value)}
                    placeholder="EDTA Whole Blood / Serum"
                    className="w-full p-2 border rounded-lg font-semibold bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block font-bold mb-1">Laboratory Method / Instrument</label>
                  <input
                    type="text"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    placeholder="e.g. Automated 5-Part Hematology Analyzer / CLIA"
                    className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold mb-1">Default Price (৳)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg font-bold bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold mb-1">Turnaround Time</label>
                  <input
                    type="text"
                    value={turnaroundTime}
                    onChange={(e) => setTurnaroundTime(e.target.value)}
                    placeholder="2 Hours"
                    className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="sm:col-span-4 flex flex-wrap items-end gap-3">
                  <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rangeVerified}
                      onChange={(e) => setRangeVerified(e.target.checked)}
                      className="accent-emerald-600 w-4 h-4"
                    />
                    <span className="text-emerald-700 dark:text-emerald-400">Range Verified by Lab</span>
                  </label>
                  <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSensitive}
                      onChange={(e) => setIsSensitive(e.target.checked)}
                      className="accent-rose-600 w-4 h-4"
                    />
                    <span className="text-rose-700 dark:text-rose-400">Sensitive RBAC (HIV/HBsAg)</span>
                  </label>
                  <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="accent-purple-600 w-4 h-4"
                    />
                    <span>Active</span>
                  </label>
                </div>
              </div>

              {/* Single-Parameter Configuration (when subTests is empty) */}
              {subTests.length === 0 && (
                <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-slate-700 bg-indigo-50/40 dark:bg-slate-800/40 space-y-3">
                  <div className="font-black text-indigo-950 dark:text-indigo-200">
                    Single-Parameter Reference Range & Input Settings (Or click "+ Add Parameter" below for Multi-Parameter Panel)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="block font-bold mb-1">Input Type</label>
                      <select
                        value={inputType}
                        onChange={(e) => setInputType(e.target.value as ParameterInputType)}
                        className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900"
                      >
                        <option value="numeric">Numeric</option>
                        <option value="posneg">Positive / Negative</option>
                        <option value="dropdown">Dropdown Options</option>
                        <option value="text">Free Text</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold mb-1">Default Unit</label>
                      <input
                        type="text"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        placeholder="mg/dL, mmol/L..."
                        className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block font-bold mb-1">General Reference Range</label>
                      <input
                        type="text"
                        value={normalRange}
                        onChange={(e) => setNormalRange(e.target.value)}
                        placeholder="e.g. 0.7 - 1.3"
                        className="w-full p-2 border rounded-lg font-mono bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold mb-1 text-rose-700">Critical Low</label>
                      <input
                        type="number"
                        step="any"
                        value={criticalLow}
                        onChange={(e) => setCriticalLow(e.target.value)}
                        placeholder="e.g. 2.5"
                        className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold mb-1 text-rose-700">Critical High</label>
                      <input
                        type="number"
                        step="any"
                        value={criticalHigh}
                        onChange={(e) => setCriticalHigh(e.target.value)}
                        placeholder="e.g. 25.0"
                        className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block font-bold mb-1">Male Reference Range</label>
                      <input
                        type="text"
                        value={maleRange}
                        onChange={(e) => setMaleRange(e.target.value)}
                        placeholder="e.g. 0.7 - 1.3"
                        className="w-full p-2 border rounded-lg font-mono bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Female Reference Range</label>
                      <input
                        type="text"
                        value={femaleRange}
                        onChange={(e) => setFemaleRange(e.target.value)}
                        placeholder="e.g. 0.5 - 1.1"
                        className="w-full p-2 border rounded-lg font-mono bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Child (&lt;14Y) Range</label>
                      <input
                        type="text"
                        value={childRange}
                        onChange={(e) => setChildRange(e.target.value)}
                        placeholder="e.g. 0.3 - 0.8"
                        className="w-full p-2 border rounded-lg font-mono bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Pregnancy Range</label>
                      <input
                        type="text"
                        value={pregnancyRange}
                        onChange={(e) => setPregnancyRange(e.target.value)}
                        placeholder="e.g. 0.4 - 0.9"
                        className="w-full p-2 border rounded-lg font-mono bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>

                  {(inputType === 'dropdown' || inputType === 'posneg') && (
                    <div>
                      <label className="block font-bold mb-1">Dropdown / Selection Options (comma-separated)</label>
                      <input
                        type="text"
                        value={optionsText}
                        onChange={(e) => setOptionsText(e.target.value)}
                        placeholder="Negative, Positive, Borderline"
                        className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Multi-Parameter Designer Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-black text-purple-950 dark:text-purple-200 text-xs sm:text-sm">
                    Dynamic Test Parameters ({subTests.length} Configured)
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSubTestRow}
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-black text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Parameter Row</span>
                  </button>
                </div>

                {subTests.length > 0 && (
                  <div className="border-2 border-slate-300 dark:border-slate-700 rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-slate-200 dark:bg-slate-800 font-black">
                        <tr>
                          <th className="p-2">#</th>
                          <th className="p-2">Parameter Name *</th>
                          <th className="p-2">Input Type</th>
                          <th className="p-2">Unit</th>
                          <th className="p-2">General / Default Range</th>
                          <th className="p-2">Male / Female / Child / Pregnancy Range</th>
                          <th className="p-2">Critical (Low / High)</th>
                          <th className="p-2 text-center">Order / Del</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {subTests.map((st, idx) => (
                          <tr key={idx} className="hover:bg-purple-50/40 dark:hover:bg-slate-800/40">
                            <td className="p-2 font-mono font-bold">{idx + 1}</td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={st.name}
                                onChange={(e) => handleUpdateSubTest(idx, 'name', e.target.value)}
                                placeholder="Parameter Name"
                                className="w-40 p-1.5 border rounded font-bold bg-white dark:bg-slate-900"
                              />
                            </td>
                            <td className="p-1.5">
                              <select
                                value={st.inputType || 'numeric'}
                                onChange={(e) => handleUpdateSubTest(idx, 'inputType', e.target.value)}
                                className="p-1.5 border rounded bg-white dark:bg-slate-900"
                              >
                                <option value="numeric">Numeric</option>
                                <option value="posneg">Pos/Neg</option>
                                <option value="dropdown">Dropdown</option>
                                <option value="text">Text</option>
                              </select>
                              {(st.inputType === 'dropdown' || st.inputType === 'posneg') && (
                                <input
                                  type="text"
                                  value={(st.options || []).join(', ')}
                                  onChange={(e) =>
                                    handleUpdateSubTest(
                                      idx,
                                      'options',
                                      e.target.value
                                        .split(',')
                                        .map((s) => s.trim())
                                        .filter(Boolean)
                                    )
                                  }
                                  placeholder="Options (comma-sep)"
                                  className="w-32 mt-1 p-1 border rounded text-[10px] bg-white dark:bg-slate-900 block"
                                />
                              )}
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={st.unit}
                                onChange={(e) => handleUpdateSubTest(idx, 'unit', e.target.value)}
                                placeholder="Unit"
                                className="w-20 p-1.5 border rounded font-mono bg-white dark:bg-slate-900"
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={st.normalRange}
                                onChange={(e) => handleUpdateSubTest(idx, 'normalRange', e.target.value)}
                                placeholder="e.g. 40 - 75"
                                className="w-36 p-1.5 border rounded font-mono bg-white dark:bg-slate-900"
                              />
                            </td>
                            <td className="p-1.5">
                              <div className="grid grid-cols-2 gap-1 w-52">
                                <input
                                  type="text"
                                  value={st.maleRange || ''}
                                  onChange={(e) => handleUpdateSubTest(idx, 'maleRange', e.target.value)}
                                  placeholder="M: e.g. 13.5-17.5"
                                  className="p-1 border rounded font-mono text-[10px] bg-white dark:bg-slate-900"
                                />
                                <input
                                  type="text"
                                  value={st.femaleRange || ''}
                                  onChange={(e) => handleUpdateSubTest(idx, 'femaleRange', e.target.value)}
                                  placeholder="F: e.g. 12.0-16.0"
                                  className="p-1 border rounded font-mono text-[10px] bg-white dark:bg-slate-900"
                                />
                                <input
                                  type="text"
                                  value={st.childRange || ''}
                                  onChange={(e) => handleUpdateSubTest(idx, 'childRange', e.target.value)}
                                  placeholder="Child: 11-14.5"
                                  className="p-1 border rounded font-mono text-[10px] bg-white dark:bg-slate-900"
                                />
                                <input
                                  type="text"
                                  value={st.pregnancyRange || ''}
                                  onChange={(e) => handleUpdateSubTest(idx, 'pregnancyRange', e.target.value)}
                                  placeholder="Preg: 11-14.0"
                                  className="p-1 border rounded font-mono text-[10px] bg-white dark:bg-slate-900"
                                />
                              </div>
                            </td>
                            <td className="p-1.5">
                              <div className="flex gap-1 w-28">
                                <input
                                  type="number"
                                  step="any"
                                  value={st.criticalLow ?? ''}
                                  onChange={(e) =>
                                    handleUpdateSubTest(
                                      idx,
                                      'criticalLow',
                                      e.target.value !== '' ? Number(e.target.value) : undefined
                                    )
                                  }
                                  placeholder="Low"
                                  className="w-1/2 p-1 border rounded text-[10px] bg-white dark:bg-slate-900"
                                />
                                <input
                                  type="number"
                                  step="any"
                                  value={st.criticalHigh ?? ''}
                                  onChange={(e) =>
                                    handleUpdateSubTest(
                                      idx,
                                      'criticalHigh',
                                      e.target.value !== '' ? Number(e.target.value) : undefined
                                    )
                                  }
                                  placeholder="High"
                                  className="w-1/2 p-1 border rounded text-[10px] bg-white dark:bg-slate-900"
                                />
                              </div>
                            </td>
                            <td className="p-1.5 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleMoveSubTest(idx, 'up')}
                                  className="p-1 bg-slate-100 hover:bg-slate-200 rounded"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveSubTest(idx, 'down')}
                                  className="p-1 bg-slate-100 hover:bg-slate-200 rounded"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSubTest(idx)}
                                  className="p-1 bg-rose-100 hover:bg-rose-600 text-rose-700 hover:text-white rounded"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDesignerModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-black flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingTestId ? 'Save Template Changes' : 'Create Test Template'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
