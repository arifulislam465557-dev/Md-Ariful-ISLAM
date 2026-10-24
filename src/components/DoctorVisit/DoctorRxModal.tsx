import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { OpdAppointment, Patient, Prescription, PrescriptionMedicine, Doctor } from '../../types';
import {
  X,
  Stethoscope,
  Printer,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  Clock,
  User,
  Phone,
  Calendar,
  Activity,
  Heart,
  Thermometer,
  Scale,
  Droplets,
  Share2,
  Sparkles,
  FileText,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

import { generatePrescriptionPdf } from '../../utils/pdfGenerator';
import { printElementById } from '../../utils/printHelper';

interface DoctorRxModalProps {
  appointment?: OpdAppointment | null;
  patient?: Patient | null;
  initialPId?: string;
  onClose: () => void;
  onSaved?: (rx: Prescription) => void;
  autoPrintOnFinish?: boolean;
}

// 40+ Commonly prescribed medications in Bangladesh for instant 1-click selection or custom edit
const POPULAR_MEDICINES = [
  'Tab. Napa 500mg (Paracetamol)',
  'Tab. Napa Extra (Paracetamol + Caffeine)',
  'Cap. Seclo 20mg (Omeprazole)',
  'Tab. Pantonix 20mg (Pantoprazole)',
  'Cap. Sergel 20mg (Esomeprazole)',
  'Tab. Ciprocin 500mg (Ciprofloxacin)',
  'Tab. Moxaclav 625mg (Amoxicillin + Clavulanic)',
  'Tab. Azithrocin 500mg (Azithromycin)',
  'Tab. Monas 10mg (Montelukast)',
  'Tab. Fexo 120mg (Fexofenadine)',
  'Tab. Alatrol 10mg (Cetirizine)',
  'Tab. Bizoran 5/20 (Amlodipine + Olmesartan)',
  'Tab. Camlosart 5/40',
  'Tab. Indever 10mg (Propranolol)',
  'Tab. Rosuva 10mg (Rosuvastatin)',
  'Tab. Lipicon 10mg (Atorvastatin)',
  'Tab. Gluconor 500mg (Metformin)',
  'Tab. Comprid 2mg (Glimepiride)',
  'Tab. Fefol-CI (Iron + Folic Acid)',
  'Tab. Calbo-D (Calcium + Vit D3)',
  'Tab. B-50 Forte (Vitamin B-Complex)',
  'Tab. Neuro-B (B1+B6+B12)',
  'Tab. D-Rise 20000 IU (Cholecalciferol)',
  'Syr. Adryl (Diphenhydramine)',
  'Syr. Tuzid (Dextromethorphan + Guaifenesin)',
  'Syr. Brofex (Bromhexine)',
  'Cap. Flagyl 400mg (Metronidazole)',
  'Tab. Filmet 400mg',
  'Tab. Motigut 10mg (Domperidone)',
  'Tab. Deflux 10mg (Domperidone)',
  'Tab. Anaflex 50mg (Diclofenac Sodium)',
  'Tab. Ace Plus (Paracetamol + Caffeine)',
  'Tab. Clofenac 50mg',
  'Tab. Ketorolac 10mg (Torax)',
  'Eye Drop Moxifloxacin 0.5%',
  'Nasal Spray Antazol 0.1%',
];

const COMMON_DOSAGES = [
  { label: '১+০+১ (সকাল + রাত)', value: '1+0+1' },
  { label: '১+১+১ (সকাল + দুপুর + রাত)', value: '1+1+1' },
  { label: '০+০+১ (শুধু রাতে)', value: '0+0+1' },
  { label: '১+০+০ (শুধু সকালে)', value: '1+0+0' },
  { label: '১+১+১+১ (৪ বার)', value: '1+1+1+1' },
  { label: '০+১+০ (দুপুরে)', value: '0+1+0' },
  { label: 'প্রয়োজনে (SOS)', value: 'SOS' },
];

const COMMON_INSTRUCTIONS = [
  'খাবারের পর (After Meal)',
  'খাবারের আগে (Before Meal)',
  'ভরা পেটে (Full Stomach)',
  'খালি পেটে (Empty Stomach)',
  'ঘুমানোর আগে (At Bedtime)',
  'চুষে খাবেন (Chewable)',
  'জ্বর ১০০°F এর বেশি হলে',
];

const COMMON_DURATIONS = [
  '৩ দিন (3 Days)',
  '৫ দিন (5 Days)',
  '৭ দিন (7 Days)',
  '১০ দিন (10 Days)',
  '১৪ দিন (14 Days)',
  '১ মাস (1 Month)',
  'চলবে (Continue)',
];

const COMMON_INVESTIGATIONS = [
  'Complete Blood Count (CBC with ESR)',
  'Random Blood Sugar (RBS)',
  'Fasting Blood Sugar (FBS)',
  'Serum Creatinine',
  'Serum ALT / SGPT',
  'Lipid Profile',
  'Urine Routine & Microscopic (R/M/E)',
  'Electrocardiogram (12-Lead ECG)',
  'Digital X-Ray Chest PA View',
  'USG of Whole Abdomen',
  'Thyroid Stimulating Hormone (TSH)',
  'Serum Uric Acid',
  'Serum Bilirubin (Total)',
];

const COMMON_ADVICE = [
  'প্রচুর পরিমাণে বিশুদ্ধ পানি পান করুন (দৈনিক ২.৫ - ৩ লিটার)।',
  'পর্যাপ্ত বিশ্রাম নিন ও ভারী কাজ থেকে বিরত থাকুন।',
  'তৈলাক্ত, মশলাযুক্ত ও চর্বিযুক্ত খাবার সম্পূর্ণ পরিহার করুন।',
  'কাঁচা লবণ ও অতিরিক্ত চিনিযুক্ত খাবার খাবেন না।',
  'প্রতিদিন অন্তত ৩০ মিনিট হাঁটা বা হালকা ব্যায়াম করার চেষ্টা করুন।',
  'ধূমপান ও অ্যালকোহল সম্পূর্ণ পরিহার করুন।',
  'কোনো সমস্যা দেখা দিলে অবিলম্বে হাসপাতালে যোগাযোগ করুন।',
];

export const DoctorRxModal: React.FC<DoctorRxModalProps> = ({
  appointment,
  patient,
  initialPId,
  onClose,
  onSaved,
  autoPrintOnFinish = false,
}) => {
  const {
    doctors,
    clinicConfig,
    lang,
    addPrescription,
    addAuditLog,
    addNotification,
    patients,
  } = useApp();

  // Find initial patient by ID if passed
  const matchedPatient =
    patient ||
    (appointment?.pId ? patients.find((p) => p.pId === appointment.pId) : null) ||
    (initialPId ? patients.find((p) => p.pId === initialPId) : null);

  // Doctor state
  const [doctorId, setDoctorId] = useState<string>(() => {
    if (appointment?.doctorId) return appointment.doctorId;
    return doctors[0]?.id || '';
  });
  const selectedDoctor: Doctor = doctors.find((d) => d.id === doctorId) || doctors[0];

  // Patient Demographic State
  const [pId, setPId] = useState<string>(
    appointment?.pId || matchedPatient?.pId || initialPId || '26100294'
  );
  const [patientName, setPatientName] = useState<string>(
    appointment?.patientName || matchedPatient?.patientName || 'Titly'
  );
  const [age, setAge] = useState<string>(appointment?.age || matchedPatient?.age || '24 Y');
  const [sex, setSex] = useState<'Male' | 'Female' | 'Other'>(
    appointment?.sex || matchedPatient?.sex || 'Female'
  );
  const [phone, setPhone] = useState<string>(
    appointment?.phone || matchedPatient?.phone || '01712000001'
  );

  // Vitals & Clinical Examination
  const [bp, setBp] = useState<string>('120/80');
  const [pulse, setPulse] = useState<string>('76');
  const [temp, setTemp] = useState<string>('98.6');
  const [weight, setWeight] = useState<string>('60');
  const [bloodSugar, setBloodSugar] = useState<string>('6.1');

  // Symptoms & Diagnosis
  const [chiefComplaints, setChiefComplaints] = useState<string>(
    appointment?.chiefComplaints || 'জ্বর, মাথা ব্যথা ও শারীরিক দুর্বলতা (Fever, headache, weakness)'
  );
  const [diagnosis, setDiagnosis] = useState<string>('Acute Viral Fever / URTI');

  // Medicines List: Each row has Name, Dosage, Instruction, Duration
  const [medicines, setMedicines] = useState<PrescriptionMedicine[]>([
    {
      name: 'Tab. Napa 500mg (Paracetamol)',
      dosage: '1+0+1',
      instruction: 'খাবারের পর (After Meal)',
      duration: '৫ দিন (5 Days)',
    },
    {
      name: 'Cap. Seclo 20mg (Omeprazole)',
      dosage: '1+0+1',
      instruction: 'খাবারের আগে (Before Meal)',
      duration: '১৪ দিন (14 Days)',
    },
    {
      name: 'Tab. Fexo 120mg (Fexofenadine)',
      dosage: '0+0+1',
      instruction: 'ঘুমানোর আগে (At Bedtime)',
      duration: '৭ দিন (7 Days)',
    },
  ]);

  // Advised Investigations
  const [investigations, setInvestigations] = useState<string[]>([
    'Complete Blood Count (CBC with ESR)',
    'Random Blood Sugar (RBS)',
  ]);
  const [customInvestigation, setCustomInvestigation] = useState<string>('');

  // Advice & Follow Up
  const [advice, setAdvice] = useState<string>(
    'প্রচুর পানি পান করবেন (দৈনিক ২.৫ লিটার)। তেল-মশলাযুক্ত খাবার পরিহার করুন এবং পর্যাপ্ত বিশ্রাম নিন।'
  );
  const [followUp, setFollowUp] = useState<string>('৭ দিন পর রিপোর্টসহ আসবেন (After 7 Days)');

  // Print Mode: Normal Full Letterhead vs Doctor Pad Mode (blank header for official pad)
  const [padMode, setPadMode] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [filterMedSearch, setFilterMedSearch] = useState<string>('');

  // Auto fill if PID changes
  const handlePIdLookup = (idVal: string) => {
    setPId(idVal);
    const found = patients.find((p) => p.pId.toLowerCase() === idVal.trim().toLowerCase());
    if (found) {
      setPatientName(found.patientName);
      if (found.age) setAge(found.age);
      if (found.sex) setSex(found.sex);
      if (found.phone) setPhone(found.phone);
    }
  };

  // Medicine operations
  const handleAddMedicine = (initialName = '') => {
    setMedicines([
      ...medicines,
      {
        name: initialName,
        dosage: '1+0+1',
        instruction: 'খাবারের পর (After Meal)',
        duration: '৭ দিন (7 Days)',
      },
    ]);
  };

  const handleUpdateMedicine = (idx: number, field: keyof PrescriptionMedicine, value: string) => {
    const updated = [...medicines];
    updated[idx] = { ...updated[idx], [field]: value };
    setMedicines(updated);
  };

  const handleRemoveMedicine = (idx: number) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const toggleInvestigation = (testName: string) => {
    if (investigations.includes(testName)) {
      setInvestigations(investigations.filter((t) => t !== testName));
    } else {
      setInvestigations([...investigations, testName]);
    }
  };

  const handleAddCustomInvestigation = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInvestigation.trim() && !investigations.includes(customInvestigation.trim())) {
      setInvestigations([...investigations, customInvestigation.trim()]);
      setCustomInvestigation('');
    }
  };

  const handleSavePrescription = (autoPrintAfterSave: boolean = false): Prescription | null => {
    if (!patientName.trim()) {
      alert(lang === 'bn' ? 'দয়া করে রোগীর নাম প্রদান করুন।' : 'Please enter patient name.');
      return null;
    }

    const clinicalObsString = `BP: ${bp} mmHg, Pulse: ${pulse} bpm, Temp: ${temp} °F, Wt: ${weight} kg, Sugar: ${bloodSugar} mmol/L`;

    const newRx: Prescription = {
      id: `rx-${Date.now()}`,
      pId: pId.trim() || undefined,
      patientName: patientName.trim(),
      age: age || '24 Y',
      sex: sex || 'Female',
      phone: phone || '',
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      chiefComplaints: chiefComplaints.trim(),
      clinicalObservations: clinicalObsString,
      diagnosis: diagnosis.trim(),
      medicines: medicines.filter((m) => m.name.trim() !== ''),
      investigations,
      advice: advice.trim(),
      followUp: followUp.trim(),
      date: new Date().toLocaleDateString('en-GB'),
    };

    addPrescription(newRx);

    // If linked to an appointment, mark it completed in local storage
    if (appointment?.id) {
      try {
        const saved = localStorage.getItem('medicare_clinic_v1_opd_appointments');
        if (saved) {
          const list: OpdAppointment[] = JSON.parse(saved);
          const updated = list.map((a) => (a.id === appointment.id ? { ...a, status: 'Completed' as const } : a));
          localStorage.setItem('medicare_clinic_v1_opd_appointments', JSON.stringify(updated));
        }
      } catch {}
    }

    addAuditLog({
      actionType: 'PRESCRIPTION_CREATE',
      patientId: pId,
      patientName,
      details: `ডা. ${selectedDoctor.name} কর্তৃক রোগী ${patientName} (PID: ${pId}) এর জন্য Rx প্রেসক্রিপশন সংরক্ষিত হয়েছে। মোট ওষুধ: ${newRx.medicines.length} টি।`,
    });

    addNotification(
      lang === 'bn' ? 'প্রেসক্রিপশন সফলভাবে সংরক্ষিত হয়েছে' : 'Prescription Saved',
      lang === 'bn'
        ? `রোগী ${patientName} এর জন্য ডা. ${selectedDoctor.name} এর প্রেসক্রিপশন সিস্টেমে যুক্ত হয়েছে।`
        : `Prescription saved for ${patientName} by Dr. ${selectedDoctor.name}.`,
      'success'
    );

    setSavedSuccess(true);
    if (onSaved) onSaved(newRx);

    // Automatically trigger PDF print dialogue if requested!
    if (autoPrintAfterSave) {
      generatePrescriptionPdf(newRx, selectedDoctor, clinicConfig, {
        padMode,
        autoPrint: true,
      });
    }

    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);

    return newRx;
  };

  // Dedicated Finish handler: automatically finalizes RX and triggers the PDF print dialogue
  const handleFinish = () => {
    const rx = handleSavePrescription(true);
    if (rx) {
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  // Download PDF file
  const handleDownloadPdf = () => {
    const rx = handleSavePrescription(false);
    if (rx) {
      generatePrescriptionPdf(rx, selectedDoctor, clinicConfig, {
        padMode,
        autoDownload: true,
      });
    }
  };

  const handlePrint = () => {
    printElementById('printable-rx', {
      pageTitle: `Prescription-${pId || 'Patient'}-${patientName || 'Rx'}`,
    });
  };

  // WhatsApp prescription text generator
  const handleShareWhatsApp = () => {
    let msg = `*${clinicConfig.clinicName}*\n`;
    msg += `প্রেসক্রিপশন / Doctor Prescription\n`;
    msg += `ডা. ${selectedDoctor.name} (${selectedDoctor.specialty})\n`;
    msg += `রোগী: ${patientName} | PID: ${pId} | বয়স: ${age} | লিঙ্গ: ${sex}\n`;
    msg += `তারিখ: ${new Date().toLocaleDateString('en-GB')}\n`;
    if (diagnosis) msg += `রোগনির্ণয় (Diagnosis): ${diagnosis}\n`;
    msg += `\n*ওষুধ তালিকা (Prescribed Medicines):*\n`;
    medicines.forEach((m, idx) => {
      msg += `${idx + 1}. ${m.name}\n   ডোজ: ${m.dosage} · ${m.instruction} · কয়দিন: ${m.duration}\n`;
    });
    if (investigations.length > 0) {
      msg += `\n*পরীক্ষা-নিরীক্ষা (Tests):*\n${investigations.join(', ')}\n`;
    }
    if (advice) msg += `\n*উপদেশ:* ${advice}\n`;
    if (followUp) msg += `\n*ফলো-আপ:* ${followUp}\n`;

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const targetNumber = cleanPhone.startsWith('88') ? cleanPhone : cleanPhone.startsWith('0') ? `88${cleanPhone}` : `880${cleanPhone}`;
    const url = `https://wa.me/${targetNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-purple-200 dark:border-gray-700 w-full max-w-5xl overflow-hidden flex flex-col max-h-[96vh] animate-in fade-in zoom-in-95 duration-150">
        {/* ======================================================== */}
        {/* MODAL HEADER: Rx Prescription Banner */}
        {/* ======================================================== */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-950 text-white p-4 sm:p-5 shrink-0 flex items-center justify-between border-b border-indigo-800 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center font-black text-2xl shadow-lg ring-2 ring-white/20">
              Rx
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  {lang === 'bn' ? 'রোগীর প্রেসক্রিপশন ও ওষুধ পরামর্শ (Doctor Rx)' : 'Clinical OPD Prescription & Rx'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500 text-white shadow-xs">
                  {lang === 'bn' ? 'ওষুধ ও মাত্রা নির্ধারণ' : 'Rx Consultation'}
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                {lang === 'bn'
                  ? 'রোগীর সমস্যা, রোগনির্ণয়, ওষুধের নাম, ডোজ, খাওয়ার নিয়ম এবং পরীক্ষার পূর্ণাঙ্গ প্রেসক্রিপশন।'
                  : 'Prescribe medicines with customizable names, dosage, duration, instructions, and tests.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Pad Mode Toggle */}
            <button
              type="button"
              onClick={() => setPadMode(!padMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                padMode
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
              title="ডাক্তারের নিজস্ব ছাপানো প্যাডে প্রিন্ট করতে ওপরের মার্জিন খালি রাখুন"
            >
              <span>{padMode ? 'প্যাড মোড চালু' : 'প্যাড মোড বন্ধ'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MODAL BODY (Scrollable) */}
        {/* ======================================================== */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-800 dark:text-slate-100">
          {/* Top Row: Doctor Selection & Patient Demographics */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-purple-50/60 dark:bg-gray-900/60 p-4 rounded-2xl border border-purple-100 dark:border-gray-700">
            {/* Doctor Info */}
            <div className="md:col-span-5 space-y-2 border-b md:border-b-0 md:border-r border-purple-200 dark:border-gray-700 md:pr-4 pb-3 md:pb-0">
              <label className="font-bold text-purple-950 dark:text-purple-300 block">
                {lang === 'bn' ? 'চিকিৎসক নির্বাচন করুন (Doctor):' : 'Consulting Doctor:'}
              </label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-700 p-2 rounded-xl text-xs font-bold text-purple-950 dark:text-purple-200 focus:outline-none focus:border-purple-600 cursor-pointer"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialty}) — Room {d.roomNo}
                  </option>
                ))}
              </select>

              {selectedDoctor && (
                <div className="text-[11px] text-gray-600 dark:text-gray-300 bg-white/70 dark:bg-gray-800/80 p-2.5 rounded-xl border border-purple-100 dark:border-gray-700 space-y-0.5">
                  <div className="font-bold text-purple-900 dark:text-purple-300">{selectedDoctor.name}</div>
                  <div>{selectedDoctor.degree}</div>
                  <div className="text-gray-500 font-semibold">{selectedDoctor.specialty} · Room: {selectedDoctor.roomNo}</div>
                </div>
              )}
            </div>

            {/* Patient Demographic Details */}
            <div className="md:col-span-7 space-y-2.5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    {lang === 'bn' ? 'রোগীর আইডি (PID):' : 'Patient ID (PID):'}
                  </label>
                  <input
                    type="text"
                    value={pId}
                    onChange={(e) => handlePIdLookup(e.target.value)}
                    placeholder="26100294"
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded-xl text-xs font-mono font-bold focus:border-purple-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    {lang === 'bn' ? 'রোগীর নাম (Patient Name) *:' : 'Patient Name *:'}
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Patient Full Name"
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded-xl text-xs font-bold text-purple-950 dark:text-purple-200 focus:border-purple-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    {lang === 'bn' ? 'বয়স (Age):' : 'Age:'}
                  </label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="24 Y"
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded-xl text-xs font-semibold focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    {lang === 'bn' ? 'লিঙ্গ (Sex):' : 'Sex:'}
                  </label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value as any)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded-xl text-xs font-semibold focus:border-purple-600 cursor-pointer"
                  >
                    <option value="Female">Female (মহিলা)</option>
                    <option value="Male">Male (পুরুষ)</option>
                    <option value="Other">Other (অন্যান্য)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    {lang === 'bn' ? 'মোবাইল (Phone):' : 'Phone:'}
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01712000000"
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded-xl text-xs font-mono focus:border-purple-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Vitals Strip */}
          <div className="bg-slate-50 dark:bg-gray-900/50 p-3 rounded-2xl border border-slate-200 dark:border-gray-700">
            <div className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>{lang === 'bn' ? 'শারীরিক পরীক্ষা ও ভাইটালস (Clinical Vitals):' : 'Vitals & Measurements:'}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div>
                <label className="text-[11px] text-gray-500 font-semibold block mb-0.5">Blood Pressure (BP):</label>
                <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-2 py-1.5 rounded-xl">
                  <Activity className="w-3.5 h-3.5 text-rose-500" />
                  <input
                    type="text"
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    placeholder="120/80"
                    className="w-full font-mono font-bold text-xs outline-none bg-transparent"
                  />
                  <span className="text-[10px] text-gray-400">mmHg</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-gray-500 font-semibold block mb-0.5">Pulse / HR:</label>
                <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-2 py-1.5 rounded-xl">
                  <Heart className="w-3.5 h-3.5 text-red-500" />
                  <input
                    type="text"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                    placeholder="76"
                    className="w-full font-mono font-bold text-xs outline-none bg-transparent"
                  />
                  <span className="text-[10px] text-gray-400">bpm</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-gray-500 font-semibold block mb-0.5">Temp (°F):</label>
                <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-2 py-1.5 rounded-xl">
                  <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                  <input
                    type="text"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    placeholder="98.6"
                    className="w-full font-mono font-bold text-xs outline-none bg-transparent"
                  />
                  <span className="text-[10px] text-gray-400">°F</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-gray-500 font-semibold block mb-0.5">Weight (কেজি):</label>
                <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-2 py-1.5 rounded-xl">
                  <Scale className="w-3.5 h-3.5 text-indigo-500" />
                  <input
                    type="text"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="60"
                    className="w-full font-mono font-bold text-xs outline-none bg-transparent"
                  />
                  <span className="text-[10px] text-gray-400">kg</span>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="text-[11px] text-gray-500 font-semibold block mb-0.5">Blood Sugar (RBS):</label>
                <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-2 py-1.5 rounded-xl">
                  <Droplets className="w-3.5 h-3.5 text-cyan-500" />
                  <input
                    type="text"
                    value={bloodSugar}
                    onChange={(e) => setBloodSugar(e.target.value)}
                    placeholder="6.1"
                    className="w-full font-mono font-bold text-xs outline-none bg-transparent"
                  />
                  <span className="text-[10px] text-gray-400">mmol</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chief Complaints & Clinical Diagnosis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-800 dark:text-gray-200 block mb-1">
                {lang === 'bn' ? 'প্রধান শারীরিক সমস্যা (Chief Complaints):' : 'Chief Complaints:'}
              </label>
              <textarea
                rows={2}
                value={chiefComplaints}
                onChange={(e) => setChiefComplaints(e.target.value)}
                placeholder="e.g. Mild fever for 3 days, dry cough, headache"
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:border-purple-600 outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-gray-800 dark:text-gray-200 block mb-1">
                {lang === 'bn' ? 'সম্ভাব্য রোগনির্ণয় (Clinical Diagnosis):' : 'Clinical Diagnosis:'}
              </label>
              <textarea
                rows={2}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Acute Viral Syndrome, Dyspepsia"
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:border-purple-600 outline-none"
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION: PRESCRIBED MEDICINES (ওষুধ ব্যবস্থাপনা) */}
          {/* ======================================================== */}
          <div className="space-y-3 pt-2 border-t border-purple-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-black text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-purple-600" />
                  <span>{lang === 'bn' ? 'প্রেসক্রিপশনভুক্ত ওষুধসমূহ (Medicines & Dosage)' : 'Prescribed Medicines'}</span>
                  <span className="px-2 py-0.2 rounded-full text-[11px] bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 font-bold">
                    {medicines.length} টি ওষুধ
                  </span>
                </h3>
                <p className="text-[11px] text-gray-500">
                  {lang === 'bn'
                    ? 'ওষুধের নাম লিখুন বা পরিবর্তন করুন, ডোজ, কয়দিন খাবে এবং খাওয়ার নিয়ম নির্ধারণ করুন।'
                    : 'Enter or edit medicine name, dosage schedule, duration in days, and intake instructions.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddMedicine('')}
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? '+ নতুন ওষুধ যোগ করুন' : '+ Add Medicine'}</span>
                </button>
              </div>
            </div>

            {/* Quick Autocomplete Medicine Suggestions Dropdown / Chips */}
            <div className="bg-purple-50/70 dark:bg-gray-900/50 p-2.5 rounded-2xl border border-purple-200 dark:border-gray-700 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                  <span>{lang === 'bn' ? 'দ্রুত ওষুধ নির্বাচনের তালিকা (ক্লিক করলেই যুক্ত হবে):' : 'Quick Medicine Auto-Suggestions:'}</span>
                </span>
                <input
                  type="text"
                  value={filterMedSearch}
                  onChange={(e) => setFilterMedSearch(e.target.value)}
                  placeholder="ওষুধ খুঁজুন (e.g. Napa, Seclo)..."
                  className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-[10px] w-48 outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {POPULAR_MEDICINES.filter((m) =>
                  m.toLowerCase().includes(filterMedSearch.toLowerCase())
                ).slice(0, 16).map((medName, mIdx) => (
                  <button
                    key={mIdx}
                    type="button"
                    onClick={() => handleAddMedicine(medName)}
                    className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-white dark:bg-gray-800 hover:bg-purple-600 hover:text-white border border-purple-200 dark:border-gray-700 text-purple-950 dark:text-purple-200 transition cursor-pointer active:scale-95 text-left"
                  >
                    + {medName}
                  </button>
                ))}
              </div>
            </div>

            {/* Medicines List Table / Card Rows */}
            {medicines.length === 0 ? (
              <div className="p-6 text-center bg-gray-50 dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-400">
                {lang === 'bn'
                  ? 'এখনও কোনো ওষুধ যুক্ত করা হয়নি। উপরের বাটন থেকে ওষুধ যোগ করুন।'
                  : 'No medicines added yet. Click "+ Add Medicine" to start prescribing.'}
              </div>
            ) : (
              <div className="space-y-2.5">
                {medicines.map((med, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white dark:bg-gray-900/90 rounded-2xl border-2 border-purple-100 dark:border-gray-700 shadow-2xs hover:border-purple-300 transition space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="w-6 h-6 rounded-lg bg-purple-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        {/* Medicine Name Input - Full editing capability as requested */}
                        <div className="flex-1">
                          <input
                            type="text"
                            value={med.name}
                            onChange={(e) => handleUpdateMedicine(idx, 'name', e.target.value)}
                            placeholder="ওষুধের নাম লিখুন বা পরিবর্তন করুন (e.g. Tab. Napa 500mg, Cap. Seclo 20mg)"
                            className="w-full bg-purple-50/50 dark:bg-gray-800 border border-purple-200 dark:border-gray-700 p-2 rounded-xl text-xs font-bold text-purple-950 dark:text-purple-200 focus:border-purple-600 outline-none"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveMedicine(idx)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                        title="এই ওষুধটি মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Dosage, Instruction, Duration Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                      {/* Dosage Field */}
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                          {lang === 'bn' ? 'ডোজ (Dosage):' : 'Dosage Schedule:'}
                        </label>
                        <input
                          type="text"
                          value={med.dosage}
                          onChange={(e) => handleUpdateMedicine(idx, 'dosage', e.target.value)}
                          placeholder="e.g. 1+0+1"
                          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-1.5 rounded-xl text-xs font-mono font-bold outline-none focus:border-purple-600 mb-1"
                        />
                        <div className="flex flex-wrap gap-1">
                          {COMMON_DOSAGES.map((d, dIdx) => (
                            <button
                              key={dIdx}
                              type="button"
                              onClick={() => handleUpdateMedicine(idx, 'dosage', d.value)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition ${
                                med.dosage === d.value
                                  ? 'bg-purple-900 text-white'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                              }`}
                            >
                              {d.value}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Instruction Field */}
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                          {lang === 'bn' ? 'খাওয়ার নিয়ম (Instruction):' : 'Instruction / Timing:'}
                        </label>
                        <input
                          type="text"
                          value={med.instruction}
                          onChange={(e) => handleUpdateMedicine(idx, 'instruction', e.target.value)}
                          placeholder="e.g. খাবারের পর"
                          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-1.5 rounded-xl text-xs font-semibold outline-none focus:border-purple-600 mb-1"
                        />
                        <div className="flex flex-wrap gap-1">
                          {COMMON_INSTRUCTIONS.slice(0, 4).map((inst, iIdx) => (
                            <button
                              key={iIdx}
                              type="button"
                              onClick={() => handleUpdateMedicine(idx, 'instruction', inst)}
                              className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition ${
                                med.instruction === inst
                                  ? 'bg-blue-800 text-white font-bold'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                              }`}
                            >
                              {inst.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Duration Field */}
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                          {lang === 'bn' ? 'কয়দিন খাবে (Duration):' : 'Duration (Days/Period):'}
                        </label>
                        <input
                          type="text"
                          value={med.duration}
                          onChange={(e) => handleUpdateMedicine(idx, 'duration', e.target.value)}
                          placeholder="e.g. ৭ দিন (7 Days)"
                          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-1.5 rounded-xl text-xs font-semibold outline-none focus:border-purple-600 mb-1"
                        />
                        <div className="flex flex-wrap gap-1">
                          {COMMON_DURATIONS.slice(0, 5).map((dur, durIdx) => (
                            <button
                              key={durIdx}
                              type="button"
                              onClick={() => handleUpdateMedicine(idx, 'duration', dur)}
                              className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition ${
                                med.duration === dur
                                  ? 'bg-emerald-800 text-white font-bold'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                              }`}
                            >
                              {dur.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* SECTION: INVESTIGATIONS ADVICED (পরীক্ষা-নিরীক্ষা) */}
          {/* ======================================================== */}
          <div className="space-y-2 pt-2 border-t border-purple-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="font-bold text-gray-800 dark:text-gray-200">
                {lang === 'bn' ? 'পরামর্শকৃত ল্যাব ও ডায়াগনস্টিক পরীক্ষা (Investigations):' : 'Advised Investigations / Lab Tests:'}
              </label>

              <form onSubmit={handleAddCustomInvestigation} className="flex gap-1.5">
                <input
                  type="text"
                  value={customInvestigation}
                  onChange={(e) => setCustomInvestigation(e.target.value)}
                  placeholder="কাস্টম টেস্ট লিখুন..."
                  className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-xs outline-none"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-purple-900 hover:bg-purple-950 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  + টেস্ট
                </button>
              </form>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {COMMON_INVESTIGATIONS.map((tName, idx) => {
                const isSelected = investigations.includes(tName);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleInvestigation(tName)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-700 text-white border-blue-600 shadow-2xs font-bold'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:border-purple-400'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '} {tName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advice & Follow-Up Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-purple-200 dark:border-gray-700">
            <div>
              <label className="font-bold text-gray-800 dark:text-gray-200 block mb-1">
                {lang === 'bn' ? 'চিকিৎসকের বিশেষ উপদেশ (Special Advice):' : 'Doctor Advice:'}
              </label>
              <textarea
                rows={3}
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                placeholder="প্রচুর পানি পান করবেন, বিশ্রাম নিন..."
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-purple-600"
              />
              <div className="flex flex-wrap gap-1 mt-1">
                {COMMON_ADVICE.slice(0, 3).map((adv, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAdvice((prev) => (prev ? `${prev} ${adv}` : adv))}
                    className="px-2 py-0.5 rounded text-[10px] bg-purple-50 dark:bg-gray-800 hover:bg-purple-100 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-gray-700 cursor-pointer"
                  >
                    + {adv.slice(0, 24)}...
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-800 dark:text-gray-200 block mb-1">
                {lang === 'bn' ? 'পরবর্তী সাক্ষাতের সময় (Follow-up / Next Visit):' : 'Follow-up Date:'}
              </label>
              <input
                type="text"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                placeholder="e.g. ৭ দিন পর রিপোর্টসহ আসবেন (After 7 Days)"
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-purple-600 mb-2"
              />
              <div className="flex flex-wrap gap-1.5">
                {['৭ দিন পর (After 7 Days)', '১৫ দিন পর (After 15 Days)', '১ মাস পর (After 1 Month)', 'প্রয়োজনে (When Needed)'].map((fu, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFollowUp(fu)}
                    className={`px-2 py-1 rounded-xl text-[10px] font-semibold cursor-pointer border ${
                      followUp === fu
                        ? 'bg-purple-900 text-white font-bold border-purple-800'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-purple-300'
                    }`}
                  >
                    {fu}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MODAL FOOTER: Save, Print, WhatsApp & Close */}
        {/* ======================================================== */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            {savedSuccess ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'bn' ? 'প্রেসক্রিপশন সফলভাবে ডাটাবেজে সংরক্ষিত হয়েছে!' : 'Prescription Saved Successfully!'}</span>
              </span>
            ) : (
              <span className="text-gray-500 text-[11px]">
                {clinicConfig.clinicName} · OPD Chamber
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* WhatsApp Share */}
            {phone && (
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition active:scale-95"
                title="রোগীর হোয়াটসঅ্যাপে প্রেসক্রিপশন পাঠান"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
            )}

            {/* Download PDF File Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition active:scale-95"
              title="পিডিএফ ফাইল ডাউনলোড করুন"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{lang === 'bn' ? 'পিডিএফ ফাইল' : 'PDF File'}</span>
            </button>

            {/* Print Rx Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'প্রিন্ট ভিউ' : 'Print View'}</span>
            </button>

            {/* Save Only Prescription Button */}
            <button
              type="button"
              onClick={() => handleSavePrescription(false)}
              className="px-3.5 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-950 dark:text-purple-200 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition active:scale-95"
            >
              <Save className="w-3.5 h-3.5 text-purple-700 dark:text-purple-300" />
              <span>{lang === 'bn' ? 'শুধু সংরক্ষণ' : 'Save Only'}</span>
            </button>

            {/* FINISH BUTTON: Automatically saves, marks complete, and triggers PDF print dialogue */}
            <button
              type="button"
              onClick={handleFinish}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition active:scale-95 ring-2 ring-emerald-300 dark:ring-emerald-700"
              title={lang === 'bn' ? 'প্রেসক্রিপশন সম্পন্ন করুন এবং স্বয়ংক্রিয়ভাবে পিডিএফ প্রিন্ট ডায়ালগ চালু করুন' : 'Finish & trigger automatic PDF print dialogue'}
            >
              <CheckCircle className="w-4 h-4 text-emerald-200" />
              <Printer className="w-4 h-4 text-white" />
              <span>{lang === 'bn' ? 'Finish (সমাপ্ত ও পিডিএফ প্রিন্ট)' : 'Finish & Print PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-bold text-xs cursor-pointer transition"
            >
              {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* HIDDEN PRINTABLE CONTAINER FOR A4 / PAD PRINTING */}
        {/* ======================================================== */}
        <div id="printable-rx" className="hidden print:block text-black bg-white p-6 font-sans">
          {/* Header if NOT Pad Mode */}
          {!padMode && (
            <div className="border-b-2 border-slate-900 pb-3 mb-4 text-center">
              <h1 className="text-xl font-black uppercase tracking-wider">{clinicConfig.clinicName}</h1>
              <p className="text-xs font-semibold">{clinicConfig.address} · Phone: {clinicConfig.phone}</p>
              <div className="mt-2 pt-2 border-t border-slate-300 flex justify-between items-center text-xs">
                <div className="text-left">
                  <div className="font-bold text-sm">Dr. {selectedDoctor.name}</div>
                  <div>{selectedDoctor.degree}</div>
                  <div>{selectedDoctor.specialty}</div>
                </div>
                <div className="text-right">
                  <div>Room: {selectedDoctor.roomNo}</div>
                  <div>Date: {new Date().toLocaleDateString('en-GB')}</div>
                </div>
              </div>
            </div>
          )}

          {padMode && <div className="h-40"></div>}

          {/* Patient Details Ribbon */}
          <div className="border border-slate-400 p-2.5 rounded-lg mb-4 text-xs flex justify-between items-center bg-slate-50">
            <div>
              <strong>Patient:</strong> {patientName} (PID: {pId})
            </div>
            <div>
              <strong>Age/Sex:</strong> {age} / {sex}
            </div>
            <div>
              <strong>Date:</strong> {new Date().toLocaleDateString('en-GB')}
            </div>
            {phone && (
              <div>
                <strong>Phone:</strong> {phone}
              </div>
            )}
          </div>

          {/* Clinical Findings & Vitals */}
          <div className="grid grid-cols-12 gap-4">
            {/* Left Sidebar: Vitals & Tests */}
            <div className="col-span-4 border-r border-slate-300 pr-3 space-y-3 text-xs">
              <div className="border-b pb-2">
                <strong className="block text-[11px] uppercase tracking-wider mb-1">Vitals:</strong>
                <div>BP: {bp} mmHg</div>
                <div>Pulse: {pulse} bpm</div>
                <div>Temp: {temp} °F</div>
                <div>Weight: {weight} kg</div>
                <div>Sugar: {bloodSugar} mmol/L</div>
              </div>

              {chiefComplaints && (
                <div className="border-b pb-2">
                  <strong className="block text-[11px] uppercase tracking-wider mb-0.5">Complaints:</strong>
                  <p className="text-[11px]">{chiefComplaints}</p>
                </div>
              )}

              {diagnosis && (
                <div className="border-b pb-2">
                  <strong className="block text-[11px] uppercase tracking-wider mb-0.5">Diagnosis:</strong>
                  <p className="font-bold text-xs">{diagnosis}</p>
                </div>
              )}

              {investigations.length > 0 && (
                <div>
                  <strong className="block text-[11px] uppercase tracking-wider mb-1">Advised Tests:</strong>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {investigations.map((it, idx) => (
                      <li key={idx}>{it}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right Main Column: Rx Symbol & Medicines */}
            <div className="col-span-8 pl-2 space-y-4">
              <div className="text-3xl font-black italic text-slate-900 border-b pb-1 font-serif">
                ℞
              </div>

              <div className="space-y-3">
                {medicines.map((m, idx) => (
                  <div key={idx} className="pb-2 border-b border-dashed border-slate-200 text-xs">
                    <div className="font-bold text-sm">
                      {idx + 1}. {m.name}
                    </div>
                    <div className="text-slate-700 font-semibold pl-4">
                      {m.dosage} --------------------- {m.instruction} ({m.duration})
                    </div>
                  </div>
                ))}
              </div>

              {advice && (
                <div className="pt-3 border-t text-xs">
                  <strong className="block mb-0.5">উপদেশ / Advice:</strong>
                  <p className="whitespace-pre-line">{advice}</p>
                </div>
              )}

              {followUp && (
                <div className="pt-2 text-xs font-semibold">
                  <strong>পরবর্তী সাক্ষাত / Follow-Up:</strong> {followUp}
                </div>
              )}
            </div>
          </div>

          <div className="mt-20 pt-4 border-t flex justify-between items-end text-xs">
            <div className="text-[10px] text-slate-500">
              Generated by Adiba Hospital Software · Not for medicolegal use
            </div>
            <div className="text-center">
              <div className="w-44 border-b border-slate-400 mb-1"></div>
              <div className="font-bold">Doctor Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
