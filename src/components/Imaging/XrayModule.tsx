import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Film,
  Printer,
  Save,
  CheckCircle,
  X,
  Search,
  Zap,
  Clock,
  Sparkles,
  Network,
  UserCheck,
  Trash2,
} from 'lucide-react';
import { printElementById } from '../../utils/printHelper';

export const XrayModule: React.FC = () => {
  const {
    clinicConfig,
    lang,
    t,
    patients,
    invoices,
    doctors,
    xrayReports,
    addXrayReport,
    deleteXrayReport,
    activeDrafts,
    updateModuleDraft,
    currentWorkstation,
  } = useApp();

  const savedDraft = activeDrafts?.xrayDraft;
  const [pId, setPId] = useState(savedDraft?.pId ?? '26100294');
  const [patientName, setPatientName] = useState(savedDraft?.patientName ?? 'Titly');
  const [age, setAge] = useState(savedDraft?.age ?? '24 Y');
  const [sex, setSex] = useState<'Male' | 'Female' | 'Other'>(savedDraft?.sex ?? 'Female');
  const [drCode, setDrCode] = useState(savedDraft?.drCode ?? 'DR01');
  const [investigation, setInvestigation] = useState(savedDraft?.investigation ?? 'Chest PA View');
  const [searchQuery, setSearchQuery] = useState('');

  const [lungFields, setLungFields] = useState(
    'Both lung fields are clear. No active parenchymal infiltration, consolidation or cavitation noted.'
  );
  const [heartSize, setHeartSize] = useState(
    'Heart size and contour are within normal limits. Cardiothoracic ratio is normal (< 0.50).'
  );
  const [costophrenicAngles, setCostophrenicAngles] = useState(
    'Both costophrenic and cardiophrenic angles are sharp and clear.'
  );
  const [bonyCage, setBonyCage] = useState(
    'Ribs, clavicles and visible spine appear intact without fracture or lytic lesion.'
  );
  const [impression, setImpression] = useState(
    'NORMAL CHEST PA VIEW RADIOGRAPH. No active pulmonary or cardiac abnormality seen.'
  );
  const [radiologist, setRadiologist] = useState(
    'Dr. Sabrina Farhana, MBBS, MD (Radiology & Imaging)'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [padMode, setPadMode] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  React.useEffect(() => {
    updateModuleDraft('xrayDraft', {
      pId,
      patientName,
      age,
      sex,
      drCode,
      investigation,
      lungFields,
      heartSize,
      costophrenicAngles,
      bonyCage,
      impression,
      radiologist,
      updatedAt: new Date().toISOString(),
    });
  }, [pId, patientName, age, sex, drCode, investigation, lungFields, heartSize, costophrenicAngles, bonyCage, impression, radiologist]);

  // Cross-department ID search: Looks up in Central Invoices & Patients
  const handleLookupPatient = (targetPid: string) => {
    const clean = targetPid.trim().toLowerCase();
    if (!clean) return;

    // Search in invoices first
    const inv = invoices.find(
      (i) => i.pId.toLowerCase() === clean || i.invoiceNo.toLowerCase() === clean
    );
    if (inv) {
      setPId(inv.pId);
      setPatientName(inv.patientName);
      setAge(inv.age);
      setSex(inv.sex as any);
      setDrCode(inv.drCode);

      // Check if any X-Ray test was billed
      const xrayItem = inv.items.find((item) =>
        item.testName.toLowerCase().includes('x-ray') ||
        item.testName.toLowerCase().includes('xray') ||
        item.testName.toLowerCase().includes('chest') ||
        item.category.toLowerCase().includes('imaging') ||
        item.category.toLowerCase().includes('x-ray')
      );
      if (xrayItem) {
        if (xrayItem.testName.includes('KUB')) {
          handleInvestigationChange('KUB View');
        } else if (xrayItem.testName.includes('Spine')) {
          handleInvestigationChange('Lumbosacral Spine (AP & Lat)');
        } else {
          handleInvestigationChange('Chest PA View');
        }
      }

      showToast(
        lang === 'bn'
          ? `✓ সেন্ট্রাল বিলিং থেকে রোগী ${inv.patientName} (আইডি: ${inv.pId}) এর তথ্য ও টেস্ট লোড হয়েছে!`
          : `✓ Loaded patient ${inv.patientName} (${inv.pId}) from central billing!`
      );
      return;
    }

    // Search in pathology patients
    const pat = patients.find(
      (p) => p.pId.toLowerCase() === clean || p.patientName.toLowerCase().includes(clean)
    );
    if (pat) {
      setPId(pat.pId);
      setPatientName(pat.patientName);
      setAge(pat.age);
      setSex(pat.sex as any);
      setDrCode(pat.drCode);
      showToast(
        lang === 'bn'
          ? `✓ সেন্ট্রাল ডাটাবেজ থেকে রোগী ${pat.patientName} (${pat.pId}) এর তথ্য লোড হয়েছে!`
          : `✓ Loaded patient ${pat.patientName} (${pat.pId}) from central database!`
      );
      return;
    }

    showToast(
      lang === 'bn'
        ? `⚠️ পেশেন্ট আইডি বা ইনভয়েস "${targetPid}" পাওয়া যায়নি!`
        : `⚠️ Patient ID or Invoice "${targetPid}" not found in central database!`
    );
  };

  const handleInvestigationChange = (val: string) => {
    setInvestigation(val);
    if (val === 'Chest PA View') {
      setLungFields('Both lung fields are clear. No active parenchymal infiltration or consolidation.');
      setHeartSize('Cardiac shadow is normal in size and shape. CTR is normal.');
      setCostophrenicAngles('Both costophrenic and cardiophrenic angles are sharp and clear.');
      setBonyCage('Ribs, clavicles and visible spine appear intact without fracture.');
      setImpression('NORMAL CHEST PA VIEW RADIOGRAPH.');
    } else if (val === 'KUB View') {
      setLungFields('Normal soft tissue shadow and properitoneal fat lines.');
      setHeartSize('Psoas shadows are symmetrical and well-visualized.');
      setCostophrenicAngles('Bilateral diaphragmatic domes are normal.');
      setBonyCage('Pelvis and lumbar spine show normal bone density.');
      setImpression('NO RADIOPAQUE CALCULUS DETECTED ALONG THE URINARY TRACT.');
    } else if (val.includes('Spine')) {
      setLungFields('Normal lumbar lordosis maintained. Vertebral body heights preserved.');
      setHeartSize('Paravertebral soft tissues are unremarkable.');
      setCostophrenicAngles('Visualized lower thoracic cage is normal.');
      setBonyCage('Intervertebral disc spaces are preserved. No osteophyte or spondylolisthesis.');
      setImpression('NO SIGNIFICANT SPONDYLOTIC OR COMPRESSION CHANGES SEEN.');
    } else if (val.includes('Knee')) {
      setLungFields('Soft tissues around the knee joint appear normal.');
      setHeartSize('Patellar position is normal.');
      setCostophrenicAngles('No joint effusion or soft tissue calcification noted.');
      setBonyCage('Joint space width is preserved. No subchondral sclerosis or osteophyte.');
      setImpression('NORMAL RADIOLOGICAL APPEARANCE OF THE KNEE JOINT.');
    }
  };

  const handleSave = () => {
    addXrayReport({
      pId,
      patientName,
      age,
      sex,
      drCode,
      investigation,
      lungFields,
      heartSize,
      costophrenicAngles,
      bonyCage,
      impression,
      radiologist,
      date: new Date().toISOString().split('T')[0],
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  // Recent patients from Billing for quick 1-click loading
  const recentBilled = invoices.slice(0, 5);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      {toastMsg && (
        <div className="bg-purple-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between shadow-lg">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-white/80 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {savedSuccess && (
        <div className="bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex justify-between items-center shadow-md">
          <span>✓ X-Ray report for {patientName} (PId: {pId}) saved and synchronized across LAN!</span>
          <button onClick={() => setSavedSuccess(false)} className="text-white/80 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xs border border-purple-100 dark:border-gray-700">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-purple-950 dark:text-purple-200 flex items-center gap-2">
              <Film className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              {t.xrayTitle}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300">
              LAN Node: {currentWorkstation?.terminalCode || 'PC-05'}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {lang === 'bn'
              ? 'সেন্ট্রাল ডাটাবেজ থেকে পেশেন্ট আইডি দিয়ে সার্চ করে সরাসরি এক্স-রে রিপোর্ট তৈরি ও প্রিন্ট।'
              : 'Digital Radiography reporting with real-time central patient ID lookup & Cat-6 LAN sync.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            {t.printReport}
          </button>
        </div>
      </div>

      {/* Central ID Search & Pending Patients Quick Bar */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-4 rounded-xl shadow-md border border-purple-700/60 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Search className="w-4 h-4 text-cyan-400" />
            <span>
              {lang === 'bn'
                ? 'সেন্ট্রাল ডাটাবেজ থেকে পেশেন্ট আইডি / বিল সার্চ:'
                : 'Central Real-Time Search by Patient ID:'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLookupPatient(searchQuery);
              }}
              placeholder={lang === 'bn' ? 'পেশেন্ট আইডি বা ইনভয়েস লিখুন (যেমন: 26100294)...' : 'Type Patient ID or Invoice No...'}
              className="w-full bg-white/10 text-white placeholder-purple-200/60 border border-purple-400/50 rounded-lg px-3 py-1.5 text-xs font-mono outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <button
              type="button"
              onClick={() => handleLookupPatient(searchQuery)}
              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs whitespace-nowrap cursor-pointer transition"
            >
              {lang === 'bn' ? 'সার্চ ও লোড' : 'Load ID'}
            </button>
          </div>
        </div>

        {/* Quick Pending Chips from Reception/Billing */}
        {recentBilled.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-1 scrollbar-none text-xs">
            <span className="text-[11px] text-purple-200 font-semibold shrink-0">
              {lang === 'bn' ? 'রিসেপশন থেকে সম্প্রতি কিউ:' : 'Queued from Reception:'}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {recentBilled.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleLookupPatient(b.pId)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition cursor-pointer ${
                    pId === b.pId
                      ? 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-sm'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                  }`}
                  title={`${b.patientName} (${b.items.map((i) => i.testName).join(', ')})`}
                >
                  #{b.pId} · {b.patientName.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Form Container */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xs border border-purple-100 dark:border-gray-700 space-y-5 text-xs">
        {/* Patient Details */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-gray-900/40 p-4 rounded-lg border border-slate-200 dark:border-gray-700">
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">{t.patientId}:</label>
            <input
              type="text"
              value={pId}
              onChange={(e) => setPId(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded font-bold text-purple-950 dark:text-purple-300 font-mono"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">{t.ptName}:</label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded font-bold"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">{t.age} / {t.sex}:</label>
            <div className="flex gap-1">
              <input
                type="text"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-1/2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded"
              />
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as any)}
                className="w-1/2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded"
              >
                <option value="Female">{t.female}</option>
                <option value="Male">{t.male}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Investigation Region:</label>
            <select
              value={investigation}
              onChange={(e) => handleInvestigationChange(e.target.value)}
              className="w-full bg-purple-50 dark:bg-gray-800 border border-purple-300 dark:border-purple-700 p-2 rounded font-bold text-purple-950 dark:text-purple-300"
            >
              <option value="Chest PA View">Chest PA View</option>
              <option value="Cervical Spine (AP & Lat)">Cervical Spine (AP & Lat)</option>
              <option value="Lumbosacral Spine (AP & Lat)">Lumbosacral Spine (AP & Lat)</option>
              <option value="KUB View">X-Ray KUB View</option>
              <option value="Right Knee Joint (AP & Lat)">Right Knee Joint (AP & Lat)</option>
            </select>
          </div>
        </div>

        {/* Detailed Findings */}
        <div className="space-y-3.5">
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Lung Fields / Soft Tissues:</label>
            <textarea
              value={lungFields}
              onChange={(e) => setLungFields(e.target.value)}
              rows={2}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Cardiac Contour / Mediastinum:</label>
            <input
              type="text"
              value={heartSize}
              onChange={(e) => setHeartSize(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Diaphragm & Angles:</label>
              <input
                type="text"
                value={costophrenicAngles}
                onChange={(e) => setCostophrenicAngles(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Bony Thorax / Skeleton:</label>
              <input
                type="text"
                value={bonyCage}
                onChange={(e) => setBonyCage(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded"
              />
            </div>
          </div>
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">{t.impression}:</label>
            <textarea
              value={impression}
              onChange={(e) => setImpression(e.target.value)}
              rows={2}
              className="w-full bg-purple-50/60 dark:bg-gray-900 border border-purple-200 dark:border-purple-800 p-2.5 rounded font-bold text-purple-950 dark:text-purple-200"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Reporting Radiologist:</label>
            <input
              type="text"
              value={radiologist}
              onChange={(e) => setRadiologist(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded font-semibold"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-purple-900 hover:bg-purple-950 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Save className="w-4 h-4" />
            {t.saveRecord}
          </button>
          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            {t.printReport}
          </button>
        </div>
      </div>

      {/* Saved X-Ray Reports Archive with Admin-Only Delete */}
      {xrayReports.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xs border border-purple-100 dark:border-gray-700 text-xs">
          <h3 className="font-bold text-sm text-purple-950 dark:text-purple-200 mb-3">
            {lang === 'bn' ? `সংরক্ষিত এক্স-রে রিপোর্ট তালিকা (${xrayReports.length})` : `Saved X-Ray Reports (${xrayReports.length})`}
          </h3>
          <div className="space-y-2">
            {xrayReports.map((rep) => (
              <div
                key={rep.id}
                className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3"
              >
                <div>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{rep.patientName}</span>{' '}
                  <span className="font-mono text-purple-700 dark:text-purple-400 font-bold">(PID: {rep.pId})</span>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {rep.investigation} · {rep.date}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteXrayReport(rep.id)}
                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg cursor-pointer transition"
                  title="Delete X-Ray Report (Admin Only)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Printable X-Ray Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white text-gray-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[96vh] flex flex-col overflow-hidden border border-gray-300">
            <div className="flex justify-between items-center px-6 py-3 bg-slate-900 text-white print:hidden">
              <span className="font-bold">Digital X-Ray Report — {pId} ({investigation})</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={padMode}
                    onChange={(e) => setPadMode(e.target.checked)}
                    className="accent-white"
                  />
                  <span>{lang === 'bn' ? 'প্যাড প্রিন্ট (নাম ছাড়া)' : 'Pad Print (Hide Clinic Name)'}</span>
                </label>
                <button
                  onClick={() =>
                    printElementById('printable-xray', {
                      pageTitle: `XRay-Report-${pId}-${patientName}`,
                    })
                  }
                  className="px-3 py-1 bg-emerald-600 text-white font-bold rounded text-xs cursor-pointer shadow-xs active:scale-95"
                >
                  Print Report
                </button>
                <button onClick={() => setShowPrintModal(false)} className="text-white hover:text-red-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 bg-white flex-1 overflow-y-auto print:p-0" id="printable-xray">
              {/* Header */}
              {padMode ? (
                <div className="h-16 flex flex-col justify-end items-center border-b-2 border-slate-800 pb-2 mb-4">
                  <div className="inline-block px-4 py-1 bg-slate-900 text-white font-bold rounded text-xs uppercase">
                    DIGITAL X-RAY INVESTIGATION REPORT
                  </div>
                </div>
              ) : (
                <div className="text-center border-b-2 border-slate-800 pb-3 mb-4">
                  <h1 className="text-2xl font-black text-slate-950 font-serif">{clinicConfig.clinicName}</h1>
                  <p className="text-xs text-gray-600">{clinicConfig.address} | Hotline: {clinicConfig.phone}</p>
                  <div className="mt-2 inline-block px-4 py-1 bg-slate-100 text-slate-900 font-bold rounded text-xs">
                    DIGITAL X-RAY INVESTIGATION REPORT
                  </div>
                </div>
              )}

              {/* Patient Bar */}
              <div className="grid grid-cols-4 gap-2 bg-gray-50 p-3 rounded border border-gray-300 text-xs mb-6">
                <div><span className="text-gray-500 font-bold block">Patient ID:</span> <span className="font-bold">{pId}</span></div>
                <div><span className="text-gray-500 font-bold block">Patient Name:</span> <span className="font-bold">{patientName}</span></div>
                <div><span className="text-gray-500 font-bold block">Age / Sex:</span> {age} / {sex}</div>
                <div><span className="text-gray-500 font-bold block">Investigation:</span> <span className="font-bold text-purple-900">{investigation}</span></div>
              </div>

              {/* Findings */}
              <div className="space-y-4 text-xs mb-8">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm border-b border-gray-200 pb-1 mb-1">FINDINGS:</h4>
                  <p className="text-gray-700 leading-relaxed mb-2">• <strong>Lungs:</strong> {lungFields}</p>
                  <p className="text-gray-700 leading-relaxed mb-2">• <strong>Heart & Mediastinum:</strong> {heartSize}</p>
                  <p className="text-gray-700 leading-relaxed mb-2">• <strong>Angles:</strong> {costophrenicAngles}</p>
                  <p className="text-gray-700 leading-relaxed">• <strong>Bones:</strong> {bonyCage}</p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg">
                  <span className="font-bold text-slate-950 block text-sm mb-1">IMPRESSION:</span>
                  <p className="font-bold text-gray-900 leading-relaxed">{impression}</p>
                </div>
              </div>

              {/* Signature */}
              <div className="mt-16 pt-6 border-t border-gray-300 text-right">
                <div className="inline-block text-center">
                  <div className="border-t border-gray-400 pt-1 font-bold text-xs text-gray-900 w-56">{radiologist}</div>
                  <p className="text-[10px] text-gray-500">Consultant Radiologist</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
