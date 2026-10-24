import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Waves,
  Printer,
  Save,
  CheckCircle,
  X,
  Search,
  Zap,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { printElementById } from '../../utils/printHelper';

export const UltrasoundModule: React.FC = () => {
  const {
    clinicConfig,
    lang,
    t,
    patients,
    invoices,
    usgReports,
    addUsgReport,
    deleteUsgReport,
    activeDrafts,
    updateModuleDraft,
    currentWorkstation,
  } = useApp();

  const savedDraft = activeDrafts?.usgDraft;
  const [pId, setPId] = useState(savedDraft?.pId ?? '26100294');
  const [patientName, setPatientName] = useState(savedDraft?.patientName ?? 'Titly');
  const [age, setAge] = useState(savedDraft?.age ?? '24 Y');
  const [sex, setSex] = useState<'Male' | 'Female' | 'Other'>(savedDraft?.sex ?? 'Female');
  const [drCode, setDrCode] = useState(savedDraft?.drCode ?? 'DR02');
  const [scanType, setScanType] = useState(savedDraft?.scanType ?? 'Whole Abdomen');
  const [searchQuery, setSearchQuery] = useState('');

  const [liver, setLiver] = useState(
    'Normal in size (13.2 cm). Normal parenchymal echotexture. No focal lesion or IHBR dilatation.'
  );
  const [gallBladder, setGallBladder] = useState(
    'Well distended, wall thickness normal (< 3mm). No calculus or sludge detected.'
  );
  const [kidneys, setKidneys] = useState(
    'Both kidneys are normal in size, shape and bipolar position. Good cortico-medullary differentiation. No calculus or hydronephrosis.'
  );
  const [spleenPancreas, setSpleenPancreas] = useState(
    'Spleen is normal in size (9.8 cm). Pancreas appears homogeneous with normal caliber.'
  );
  const [urinaryBladder, setUrinaryBladder] = useState(
    'Well distended, regular wall. No intravesical lesion or mass.'
  );
  const [uterusAdnexa, setUterusAdnexa] = useState(
    'Uterus is anteverted, normal in size and myometrial echotexture. Both adnexae appear clear.'
  );
  const [impression, setImpression] = useState(
    'ULTRASONOGRAPHY OF WHOLE ABDOMEN REVEALS NORMAL SCAN. No significant sonological abnormality detected.'
  );
  const [sonologist, setSonologist] = useState(
    'Dr. Sabrina Farhana, MBBS, PGT (Ultrasonography)'
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
    updateModuleDraft('usgDraft', {
      pId,
      patientName,
      age,
      sex,
      drCode,
      scanType,
      liver,
      gallBladder,
      kidneys,
      spleenPancreas,
      urinaryBladder,
      uterusAdnexa,
      impression,
      sonologist,
      updatedAt: new Date().toISOString(),
    });
  }, [pId, patientName, age, sex, drCode, scanType, liver, gallBladder, kidneys, spleenPancreas, urinaryBladder, uterusAdnexa, impression, sonologist]);

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

      // Check if any USG test was billed
      const usgItem = inv.items.find((item) =>
        item.testName.toLowerCase().includes('usg') ||
        item.testName.toLowerCase().includes('ultrasound') ||
        item.category.toLowerCase().includes('ultrasound') ||
        item.category.toLowerCase().includes('usg')
      );
      if (usgItem) {
        if (usgItem.testName.includes('KUB')) {
          handleScanTypeChange('KUB with Prostate');
        } else if (usgItem.testName.includes('Pelvic') || usgItem.testName.includes('Uterus')) {
          handleScanTypeChange('Pelvic Profile');
        } else if (usgItem.testName.includes('Pregnancy') || usgItem.testName.includes('Obstetric')) {
          handleScanTypeChange('Pregnancy Profile');
        } else {
          handleScanTypeChange('Whole Abdomen');
        }
      }

      showToast(
        lang === 'bn'
          ? `✓ সেন্ট্রাল বিলিং থেকে রোগী ${inv.patientName} (আইডি: ${inv.pId}) এর তথ্য ও টেস্ট লোড হয়েছে!`
          : `✓ Loaded patient ${inv.patientName} (${inv.pId}) from central billing!`
      );
      return;
    }

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

  const handleScanTypeChange = (type: string) => {
    setScanType(type);
    if (type === 'Whole Abdomen') {
      setLiver('Normal in size (13.2 cm). Normal parenchymal echotexture. No focal lesion.');
      setGallBladder('Well distended. No calculus or sludge.');
      setKidneys('Both kidneys normal in size and bipolar position. Good cortico-medullary differentiation.');
      setSpleenPancreas('Spleen and pancreas normal in size and echotexture.');
      setUrinaryBladder('Well distended with normal wall thickness.');
      setUterusAdnexa('Uterus normal in dimensions. Bilateral adnexae clear.');
      setImpression('ULTRASONOGRAPHY OF WHOLE ABDOMEN REVEALS NORMAL SCAN.');
    } else if (type === 'KUB with Prostate') {
      setLiver('Not evaluated in focused KUB protocol.');
      setGallBladder('Not evaluated.');
      setKidneys('Both kidneys normal in size, shape and cortical thickness. No calculus, hydronephrosis or perinephric collection.');
      setUrinaryBladder('Adequately distended. Wall thickness normal. Lumen clear.');
      setSpleenPancreas('Normal retroperitoneal structures.');
      setUterusAdnexa('Prostate gland is normal in size and echotexture (~18 cc). Post-void residue insignificant.');
      setImpression('NORMAL SONOGRAPHIC EVALUATION OF KUB REGION.');
    } else if (type === 'Pelvic Profile') {
      setUterusAdnexa('Uterus is anteverted, measuring 7.6 x 4.2 x 3.8 cm. Endometrial stripe central and regular (7 mm). Bilateral ovaries appear normal with physiological follicles.');
      setUrinaryBladder('Well distended with smooth mucosal lining.');
      setImpression('NORMAL PELVIC ULTRASONOGRAM. No adnexal pathology or free fluid in POD.');
    } else if (type === 'Pregnancy Profile') {
      setUterusAdnexa('Single live intrauterine pregnancy noted. Active fetal cardiac pulsation and somatic movements present. Fetal heart rate 148 bpm.');
      setImpression('SINGLE LIVE INTRAUTERINE PREGNANCY OF ~24 WEEKS. Normal fetal growth parameters and liquor volume.');
    }
  };

  const handleSave = () => {
    addUsgReport({
      pId,
      patientName,
      age,
      sex,
      drCode,
      scanType,
      liver,
      gallBladder,
      kidneys,
      spleenPancreas,
      urinaryBladder,
      uterusAdnexa,
      impression,
      sonologist,
      date: new Date().toISOString().split('T')[0],
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

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
          <span>✓ USG scan report for {patientName} (PId: {pId}) saved and synchronized across LAN!</span>
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
              <Waves className="w-6 h-6 text-cyan-600" />
              {t.usgTitle}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300">
              LAN Node: {currentWorkstation?.terminalCode || 'PC-06'}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {lang === 'bn'
              ? 'সেন্ট্রাল ডাটাবেজ থেকে রোগী আইডি দিয়ে সার্চ করে আল্ট্রাসনোগ্রাফি রিপোর্ট তৈরি ও ভেরিফিকেশন।'
              : 'Ultrasonography reporting with real-time central patient lookup and automated organ templates.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
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
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-cyan-50/50 dark:bg-gray-900/40 p-4 rounded-lg border border-cyan-100 dark:border-gray-700">
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
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Scan Type:</label>
            <select
              value={scanType}
              onChange={(e) => handleScanTypeChange(e.target.value)}
              className="w-full bg-cyan-50 dark:bg-gray-800 border border-cyan-300 dark:border-cyan-700 p-2 rounded font-bold text-cyan-950 dark:text-cyan-300"
            >
              <option value="Whole Abdomen">Whole Abdomen</option>
              <option value="KUB with Prostate">KUB with Prostate</option>
              <option value="Pelvic Profile">Pelvic Profile (Uterus & Ovaries)</option>
              <option value="Pregnancy Profile">Pregnancy Profile (Obstetric)</option>
            </select>
          </div>
        </div>

        {/* Detailed Findings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Liver & Biliary Tree:</label>
            <textarea
              value={liver}
              onChange={(e) => setLiver(e.target.value)}
              rows={2}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Gall Bladder:</label>
            <textarea
              value={gallBladder}
              onChange={(e) => setGallBladder(e.target.value)}
              rows={2}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Kidneys (Bilateral):</label>
            <textarea
              value={kidneys}
              onChange={(e) => setKidneys(e.target.value)}
              rows={2}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Spleen & Pancreas:</label>
            <textarea
              value={spleenPancreas}
              onChange={(e) => setSpleenPancreas(e.target.value)}
              rows={2}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Urinary Bladder:</label>
            <textarea
              value={urinaryBladder}
              onChange={(e) => setUrinaryBladder(e.target.value)}
              rows={2}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Uterus / Prostate / Adnexa:</label>
            <textarea
              value={uterusAdnexa}
              onChange={(e) => setUterusAdnexa(e.target.value)}
              rows={2}
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
            className="w-full bg-cyan-50/60 dark:bg-gray-900 border border-cyan-200 dark:border-cyan-800 p-2.5 rounded font-bold text-cyan-950 dark:text-cyan-200"
          />
        </div>

        <div>
          <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Reporting Sonologist:</label>
          <input
            type="text"
            value={sonologist}
            onChange={(e) => setSonologist(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded font-semibold"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
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

      {/* Saved Ultrasound Reports Archive with Admin-Only Delete */}
      {usgReports.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xs border border-purple-100 dark:border-gray-700 text-xs">
          <h3 className="font-bold text-sm text-purple-950 dark:text-purple-200 mb-3">
            {lang === 'bn' ? `সংরক্ষিত আল্ট্রাসাউন্ড রিপোর্ট তালিকা (${usgReports.length})` : `Saved Ultrasound Reports (${usgReports.length})`}
          </h3>
          <div className="space-y-2">
            {usgReports.map((rep) => (
              <div
                key={rep.id}
                className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3"
              >
                <div>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{rep.patientName}</span>{' '}
                  <span className="font-mono text-cyan-700 dark:text-cyan-400 font-bold">(PID: {rep.pId})</span>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {rep.scanType} · {rep.date}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteUsgReport(rep.id)}
                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg cursor-pointer transition"
                  title="Delete USG Report (Admin Only)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Printable USG Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white text-gray-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[96vh] flex flex-col overflow-hidden border border-gray-300">
            <div className="flex justify-between items-center px-6 py-3 bg-cyan-900 text-white print:hidden">
              <span className="font-bold">Ultrasound Report — {pId} ({scanType})</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-cyan-200 cursor-pointer">
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
                    printElementById('printable-usg', {
                      pageTitle: `USG-Report-${pId}-${patientName}`,
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

            <div className="p-8 bg-white flex-1 overflow-y-auto print:p-0" id="printable-usg">
              {/* Header */}
              {padMode ? (
                <div className="h-16 flex flex-col justify-end items-center border-b-2 border-cyan-800 pb-2 mb-4">
                  <div className="inline-block px-4 py-1 bg-cyan-900 text-white font-bold rounded text-xs uppercase">
                    ULTRASONOGRAPHY INVESTIGATION REPORT
                  </div>
                </div>
              ) : (
                <div className="text-center border-b-2 border-cyan-800 pb-3 mb-4">
                  <h1 className="text-2xl font-black text-cyan-950 font-serif">{clinicConfig.clinicName}</h1>
                  <p className="text-xs text-gray-600">{clinicConfig.address} | Hotline: {clinicConfig.phone}</p>
                  <div className="mt-2 inline-block px-4 py-1 bg-cyan-100 text-cyan-900 font-bold rounded text-xs">
                    ULTRASONOGRAPHY INVESTIGATION REPORT
                  </div>
                </div>
              )}

              {/* Patient Bar */}
              <div className="grid grid-cols-4 gap-2 bg-gray-50 p-3 rounded border border-gray-300 text-xs mb-6">
                <div><span className="text-gray-500 font-bold block">Patient ID:</span> <span className="font-bold">{pId}</span></div>
                <div><span className="text-gray-500 font-bold block">Patient Name:</span> <span className="font-bold">{patientName}</span></div>
                <div><span className="text-gray-500 font-bold block">Age / Sex:</span> {age} / {sex}</div>
                <div><span className="text-gray-500 font-bold block">Scan Protocol:</span> <span className="font-bold text-cyan-900">{scanType}</span></div>
              </div>

              {/* Findings */}
              <div className="space-y-4 text-xs mb-8">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm border-b border-gray-200 pb-1 mb-2">SONOGRAPHIC FINDINGS:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700">
                    <p>• <strong>Liver:</strong> {liver}</p>
                    <p>• <strong>Gall Bladder:</strong> {gallBladder}</p>
                    <p>• <strong>Kidneys:</strong> {kidneys}</p>
                    <p>• <strong>Spleen/Pancreas:</strong> {spleenPancreas}</p>
                    <p>• <strong>Urinary Bladder:</strong> {urinaryBladder}</p>
                    <p>• <strong>Pelvic / Adnexa:</strong> {uterusAdnexa}</p>
                  </div>
                </div>

                <div className="p-4 bg-cyan-50 border border-cyan-300 rounded-lg">
                  <span className="font-bold text-cyan-950 block text-sm mb-1">IMPRESSION:</span>
                  <p className="font-bold text-gray-900 leading-relaxed">{impression}</p>
                </div>
              </div>

              {/* Signature */}
              <div className="mt-16 pt-6 border-t border-gray-300 text-right">
                <div className="inline-block text-center">
                  <div className="border-t border-gray-400 pt-1 font-bold text-xs text-gray-900 w-56">{sonologist}</div>
                  <p className="text-[10px] text-gray-500">Consultant Sonologist</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
