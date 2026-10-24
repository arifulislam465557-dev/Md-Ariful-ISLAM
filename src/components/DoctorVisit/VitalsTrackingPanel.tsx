import React, { useState, useMemo } from 'react';
import { OpdAppointment, Doctor, Patient, PatientVitals } from '../../types';
import {
  HeartPulse,
  Activity,
  Thermometer,
  Scale,
  Droplets,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Search,
  Filter,
  Printer,
  Sparkles,
  Stethoscope,
  Volume2,
  RefreshCw,
  Plus,
  Edit3,
  Calendar,
  FileText,
  X,
  Wind,
} from 'lucide-react';

interface VitalsTrackingPanelProps {
  appointments: OpdAppointment[];
  onUpdateVitals: (appointmentId: string, vitals: PatientVitals) => void;
  onUpdateStatus: (appointmentId: string, newStatus: OpdAppointment['status']) => void;
  onOpenRxModal?: (appointment: OpdAppointment) => void;
  doctors: Doctor[];
  patients: Patient[];
  lang: 'bn' | 'en';
}

// Helper: Calculate BMI and classification
export const calculateBmi = (weightKg?: number, heightCm?: number) => {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  let status = 'Normal';
  let color = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';

  if (bmi < 18.5) {
    status = 'Underweight';
    color = 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
  } else if (bmi >= 25 && bmi < 30) {
    status = 'Overweight';
    color = 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800';
  } else if (bmi >= 30) {
    status = 'Obese';
    color = 'text-red-600 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800';
  }

  return { bmi: parseFloat(bmi.toFixed(1)), status, color };
};

// Helper: BP Classification (AHA Guidelines)
export const getBpClassification = (systolic?: number, diastolic?: number) => {
  if (!systolic || !diastolic) return null;

  if (systolic >= 180 || diastolic >= 120) {
    return {
      label: 'Hypertensive Crisis',
      labelBn: 'হাইপারটেনসিভ ক্রাইসিস (জরুরি)',
      severity: 'critical',
      badgeClass: 'bg-red-600 text-white animate-pulse',
      bgCard: 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800',
    };
  }
  if (systolic >= 140 || diastolic >= 90) {
    return {
      label: 'Stage 2 HTN',
      labelBn: 'উচ্চ রক্তচাপ স্টেজ ২',
      severity: 'high',
      badgeClass: 'bg-rose-500 text-white',
      bgCard: 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800',
    };
  }
  if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
    return {
      label: 'Stage 1 HTN',
      labelBn: 'উচ্চ রক্তচাপ স্টেজ ১',
      severity: 'moderate',
      badgeClass: 'bg-amber-500 text-slate-950 font-black',
      bgCard: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800',
    };
  }
  if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
    return {
      label: 'Elevated BP',
      labelBn: 'কিছুটা বৃদ্ধিপ্রাপ্ত',
      severity: 'mild',
      badgeClass: 'bg-yellow-400 text-slate-950 font-bold',
      bgCard: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300 dark:border-yellow-800',
    };
  }
  if (systolic < 90 || diastolic < 60) {
    return {
      label: 'Hypotension',
      labelBn: 'নিম্ন রক্তচাপ (লো বিপি)',
      severity: 'low',
      badgeClass: 'bg-blue-600 text-white',
      bgCard: 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800',
    };
  }

  return {
    label: 'Normal BP',
    labelBn: 'স্বাভাবিক (Normal)',
    severity: 'normal',
    badgeClass: 'bg-emerald-600 text-white',
    bgCard: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800',
  };
};

// Helper: Temperature Classification
export const getTempClassification = (temp?: number) => {
  if (!temp) return null;
  if (temp >= 102) {
    return {
      label: 'High Fever',
      labelBn: 'উচ্চ জ্বর (>১০২°F)',
      severity: 'critical',
      badgeClass: 'bg-red-600 text-white animate-pulse',
    };
  }
  if (temp >= 99.1) {
    return {
      label: 'Mild Fever',
      labelBn: 'হালকা জ্বর',
      severity: 'moderate',
      badgeClass: 'bg-amber-500 text-slate-950 font-bold',
    };
  }
  if (temp < 95) {
    return {
      label: 'Hypothermia',
      labelBn: 'হাইপোথার্মিয়া (<৯৫°F)',
      severity: 'low',
      badgeClass: 'bg-sky-600 text-white',
    };
  }
  return {
    label: 'Normal',
    labelBn: 'স্বাভাবিক',
    severity: 'normal',
    badgeClass: 'bg-emerald-600 text-white',
  };
};

// Helper: Pulse Classification
export const getPulseClassification = (pulse?: number) => {
  if (!pulse) return null;
  if (pulse > 100) {
    return {
      label: 'Tachycardia',
      labelBn: 'দ্রুত নাড়িস্পন্দন (>১০০)',
      severity: 'high',
      badgeClass: 'bg-rose-500 text-white',
    };
  }
  if (pulse < 60) {
    return {
      label: 'Bradycardia',
      labelBn: 'ধীর নাড়িস্পন্দন (<৬০)',
      severity: 'low',
      badgeClass: 'bg-blue-600 text-white',
    };
  }
  return {
    label: 'Normal',
    labelBn: 'স্বাভাবিক',
    severity: 'normal',
    badgeClass: 'bg-emerald-600 text-white',
  };
};

export const VitalsTrackingPanel: React.FC<VitalsTrackingPanelProps> = ({
  appointments,
  onUpdateVitals,
  onUpdateStatus,
  onOpenRxModal,
  doctors,
  patients,
  lang,
}) => {
  // Currently selected patient for vitals input
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>(
    appointments[0]?.id || ''
  );

  // Form Fields
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [bpSystolic, setBpSystolic] = useState<string>('');
  const [bpDiastolic, setBpDiastolic] = useState<string>('');
  const [temperature, setTemperature] = useState<string>('');
  const [pulse, setPulse] = useState<string>('');
  const [spO2, setSpO2] = useState<string>('');
  const [respiratoryRate, setRespiratoryRate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [staffName, setStaffName] = useState<string>('Staff Nurse Shampa');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'recorded' | 'abnormal'>('all');
  const [printingAppointment, setPrintingAppointment] = useState<OpdAppointment | null>(null);

  // Load existing vitals into form when selected appointment changes
  const activeAppointment = useMemo(
    () => appointments.find((a) => a.id === selectedAppointmentId),
    [appointments, selectedAppointmentId]
  );

  React.useEffect(() => {
    if (activeAppointment) {
      const v = activeAppointment.patientVitals;
      if (v) {
        setWeight(v.weight !== undefined ? String(v.weight) : '');
        setHeight(v.height !== undefined ? String(v.height) : '');
        setBpSystolic(v.bpSystolic !== undefined ? String(v.bpSystolic) : '');
        setBpDiastolic(v.bpDiastolic !== undefined ? String(v.bpDiastolic) : '');
        setTemperature(v.temperature !== undefined ? String(v.temperature) : '');
        setPulse(v.pulse !== undefined ? String(v.pulse) : '');
        setSpO2(v.spO2 !== undefined ? String(v.spO2) : '');
        setRespiratoryRate(v.respiratoryRate !== undefined ? String(v.respiratoryRate) : '');
        setNotes(v.notes || '');
        if (v.recordedBy) setStaffName(v.recordedBy);
      } else {
        // Clear or default
        setWeight('');
        setHeight('');
        setBpSystolic('');
        setBpDiastolic('');
        setTemperature('98.6');
        setPulse('78');
        setSpO2('98');
        setRespiratoryRate('16');
        setNotes('');
      }
    }
  }, [activeAppointment]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = appointments.length;
    const recorded = appointments.filter(
      (a) =>
        a.patientVitals &&
        (a.patientVitals.weight ||
          a.patientVitals.bpSystolic ||
          a.patientVitals.temperature ||
          a.patientVitals.pulse)
    ).length;
    const pending = total - recorded;

    const abnormal = appointments.filter((a) => {
      const v = a.patientVitals;
      if (!v) return false;
      const bp = getBpClassification(v.bpSystolic, v.bpDiastolic);
      const temp = getTempClassification(v.temperature);
      const pr = getPulseClassification(v.pulse);
      return (
        (bp && bp.severity !== 'normal' && bp.severity !== 'mild') ||
        (temp && temp.severity !== 'normal') ||
        (pr && pr.severity !== 'normal') ||
        (v.spO2 && v.spO2 < 95)
      );
    }).length;

    return { total, recorded, pending, abnormal };
  }, [appointments]);

  // Filtered List
  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => {
      const v = item.patientVitals;
      const hasVitals =
        v &&
        (v.weight !== undefined ||
          v.bpSystolic !== undefined ||
          v.temperature !== undefined ||
          v.pulse !== undefined);

      if (filterType === 'pending' && hasVitals) return false;
      if (filterType === 'recorded' && !hasVitals) return false;
      if (filterType === 'abnormal') {
        if (!hasVitals || !v) return false;
        const bp = getBpClassification(v.bpSystolic, v.bpDiastolic);
        const temp = getTempClassification(v.temperature);
        const pr = getPulseClassification(v.pulse);
        const isAbn =
          (bp && bp.severity !== 'normal' && bp.severity !== 'mild') ||
          (temp && temp.severity !== 'normal') ||
          (pr && pr.severity !== 'normal') ||
          (v.spO2 && v.spO2 < 95);
        if (!isAbn) return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = item.patientName.toLowerCase().includes(q);
        const matchesPid = item.pId ? item.pId.toLowerCase().includes(q) : false;
        const matchesPhone = item.phone.toLowerCase().includes(q);
        const matchesDoctor = item.doctorName.toLowerCase().includes(q);
        const matchesToken = String(item.tokenNo).includes(q);
        return matchesName || matchesPid || matchesPhone || matchesDoctor || matchesToken;
      }

      return true;
    });
  }, [appointments, filterType, searchTerm]);

  // Form submit handler
  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointmentId) return;

    const w = weight ? parseFloat(weight) : undefined;
    const h = height ? parseFloat(height) : undefined;
    const sys = bpSystolic ? parseInt(bpSystolic, 10) : undefined;
    const dia = bpDiastolic ? parseInt(bpDiastolic, 10) : undefined;
    const temp = temperature ? parseFloat(temperature) : undefined;
    const pr = pulse ? parseInt(pulse, 10) : undefined;
    const oxy = spO2 ? parseInt(spO2, 10) : undefined;
    const rr = respiratoryRate ? parseInt(respiratoryRate, 10) : undefined;

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowDate = new Date().toLocaleDateString('en-GB');

    const vitalsData: PatientVitals = {
      weight: w,
      height: h,
      bpSystolic: sys,
      bpDiastolic: dia,
      temperature: temp,
      pulse: pr,
      spO2: oxy,
      respiratoryRate: rr,
      recordedAt: nowTime,
      recordedDate: nowDate,
      recordedBy: staffName.trim() || 'Triage Staff',
      notes: notes.trim() || undefined,
    };

    onUpdateVitals(selectedAppointmentId, vitalsData);

    const pt = appointments.find((a) => a.id === selectedAppointmentId);
    setToastMsg(
      lang === 'bn'
        ? `টোকেন #${pt?.tokenNo || ''} (${pt?.patientName}): ভাইটালস সফলভাবে সংরক্ষণ করা হয়েছে!`
        : `Vitals recorded successfully for Token #${pt?.tokenNo || ''} (${pt?.patientName})`
    );
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Live indicators based on current form inputs
  const currentBpClass = getBpClassification(
    bpSystolic ? parseInt(bpSystolic, 10) : undefined,
    bpDiastolic ? parseInt(bpDiastolic, 10) : undefined
  );
  const currentTempClass = getTempClassification(
    temperature ? parseFloat(temperature) : undefined
  );
  const currentPulseClass = getPulseClassification(
    pulse ? parseInt(pulse, 10) : undefined
  );
  const currentBmi = calculateBmi(
    weight ? parseFloat(weight) : undefined,
    height ? parseFloat(height) : undefined
  );

  // Print Triage Slip
  const handlePrintSlip = (apt: OpdAppointment) => {
    setPrintingAppointment(apt);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between animate-fade-in text-xs font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-200" />
            <span>{toastMsg}</span>
          </div>
          <button
            onClick={() => setToastMsg(null)}
            className="text-white/80 hover:text-white cursor-pointer ml-3 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total in Queue */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-purple-100 dark:border-gray-700 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-purple-600" />
              {lang === 'bn' ? 'মোট সিরিয়াল / ওয়েটলিস্ট' : 'Total Waitlist'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
              Queue
            </span>
          </div>
          <div className="mt-2 text-3xl font-black text-purple-950 dark:text-purple-200 font-mono">
            {stats.total}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {lang === 'bn' ? 'ওপিডি চেম্বার ও ওয়েটিং এরিয়া' : 'OPD & waiting room presence'}
          </p>
        </div>

        {/* Vitals Recorded */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-emerald-100 dark:border-gray-700 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              {lang === 'bn' ? 'ভাইটালস সম্পন্ন' : 'Vitals Recorded'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {stats.total > 0 ? Math.round((stats.recorded / stats.total) * 100) : 0}%
            </span>
          </div>
          <div className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {stats.recorded}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {lang === 'bn' ? 'ওজন, বিপি, পালস ও তাপমাত্রা নথিভুক্ত' : 'Weight, BP, Pulse & Temp captured'}
          </p>
        </div>

        {/* Vitals Pending */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-amber-200 dark:border-gray-700 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <Clock className="w-4 h-4 text-amber-500" />
              {lang === 'bn' ? 'ভাইটালস বাকি (Pending)' : 'Vitals Pending'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
              Triage Intake
            </span>
          </div>
          <div className="mt-2 text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {stats.pending}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {lang === 'bn' ? 'ট্রায়াজ কাউন্টারে পরিমাপ প্রয়োজন' : 'Awaiting nursing triage check'}
          </p>
        </div>

        {/* Abnormal / Flagged Alerts */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-rose-200 dark:border-gray-700 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              {lang === 'bn' ? 'সতর্কতা / অস্বাভাবিক' : 'Clinical Alerts'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300">
              High Risk
            </span>
          </div>
          <div className="mt-2 text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {stats.abnormal}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {lang === 'bn' ? 'উচ্চ রক্তচাপ, জ্বর বা অতিরিক্ত পালস' : 'Elevated BP, Fever or Tachycardia'}
          </p>
        </div>
      </div>

      {/* Main Two-Column Layout: Left (Input Form), Right (Waitlist Triage Table) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Vitals Entry & Live Triage Form (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-purple-100 dark:border-gray-700 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h3 className="font-black text-base text-purple-950 dark:text-purple-200 flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-500" />
                <span>{lang === 'bn' ? 'ভাইটাল সাইন এন্ট্রি ফরম' : 'Vitals Intake & Triage Form'}</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {lang === 'bn'
                  ? 'ওয়েটিং এরিয়ার রোগীর ওজন, রক্তচাপ, তাপমাত্রা ও পালস ইনপুট করুন।'
                  : 'Input and update vitals for waitlisted patients before consultation.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveVitals} className="space-y-4">
            {/* 1. Patient Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center justify-between">
                <span>{lang === 'bn' ? 'রোগী নির্বাচন করুন (ওয়েটলিস্ট থেকে)' : 'Select Patient from Waitlist'}</span>
                {activeAppointment && (
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-200">
                    Token #{activeAppointment.tokenNo} · Room {activeAppointment.roomNo}
                  </span>
                )}
              </label>
              <select
                value={selectedAppointmentId}
                onChange={(e) => setSelectedAppointmentId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 py-2.5 px-3 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-600 cursor-pointer"
              >
                {appointments.map((apt) => {
                  const hasV =
                    apt.patientVitals &&
                    (apt.patientVitals.weight || apt.patientVitals.bpSystolic);
                  return (
                    <option key={apt.id} value={apt.id}>
                      #{apt.tokenNo} - {apt.patientName} ({apt.age}, {apt.sex}) — Dr. {apt.doctorName} [
                      {apt.status}] {hasV ? '✓ Vitals Recorded' : '⚠️ Pending'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Selected Patient Banner */}
            {activeAppointment && (
              <div className="p-3 bg-purple-50/70 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800/60 flex items-center justify-between text-xs">
                <div>
                  <div className="font-black text-purple-950 dark:text-purple-200">
                    {activeAppointment.patientName}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">
                    {activeAppointment.age} · {activeAppointment.sex} · PID:{' '}
                    <span className="font-mono">{activeAppointment.pId || 'N/A'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      activeAppointment.status === 'In Consultation'
                        ? 'bg-blue-600 text-white'
                        : activeAppointment.status === 'Completed'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-400 text-slate-950'
                    }`}
                  >
                    {activeAppointment.status}
                  </span>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Dr. {activeAppointment.doctorName}
                  </div>
                </div>
              </div>
            )}

            {/* 2. THE 4 PRIMARY VITALS GRID: Weight, BP, Temperature, Pulse */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* VITAL 1: Weight (kg) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{lang === 'bn' ? 'ওজন (Weight)' : 'Weight (kg)'}</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="300"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g. 68"
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-indigo-600"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-gray-400">
                    kg
                  </span>
                </div>
              </div>

              {/* Optional Height (cm) for BMI */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                  <span>{lang === 'bn' ? 'উচ্চতা (Height)' : 'Height (cm)'}</span>
                  {currentBmi && (
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${currentBmi.color}`}
                    >
                      BMI {currentBmi.bmi} ({currentBmi.status})
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="30"
                    max="250"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="e.g. 165"
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-indigo-600"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-gray-400">
                    cm
                  </span>
                </div>
              </div>

              {/* VITAL 2: Blood Pressure (Systolic / Diastolic) */}
              <div className="col-span-2 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-rose-600" />
                    <span>{lang === 'bn' ? 'রক্তচাপ (Blood Pressure)' : 'Blood Pressure (BP)'}</span>
                  </label>
                  {currentBpClass && (
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs ${currentBpClass.badgeClass}`}
                    >
                      {lang === 'bn' ? currentBpClass.labelBn : currentBpClass.label}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      min="50"
                      max="260"
                      value={bpSystolic}
                      onChange={(e) => setBpSystolic(e.target.value)}
                      placeholder="Systolic (120)"
                      className="w-full pl-3 pr-12 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-rose-600"
                    />
                    <span className="absolute right-2 top-2.5 text-[9px] font-bold text-gray-400">
                      SYS
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="30"
                      max="160"
                      value={bpDiastolic}
                      onChange={(e) => setBpDiastolic(e.target.value)}
                      placeholder="Diastolic (80)"
                      className="w-full pl-3 pr-12 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-rose-600"
                    />
                    <span className="absolute right-2 top-2.5 text-[9px] font-bold text-gray-400">
                      DIA
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-gray-400">
                  {lang === 'bn'
                    ? 'স্বাভাবিক মাত্রা: < ১২০/৮০ mmHg | হাইপারটেনশন: ≥ ১৪০/৯০ mmHg'
                    : 'Target range: < 120/80 mmHg | Stage 2 HTN: ≥ 140/90 mmHg'}
                </div>
              </div>

              {/* VITAL 3: Temperature (°F) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                    <span>{lang === 'bn' ? 'তাপমাত্রা' : 'Temp (°F)'}</span>
                  </label>
                  {currentTempClass && (
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.2 rounded ${currentTempClass.badgeClass}`}
                    >
                      {lang === 'bn' ? currentTempClass.labelBn : currentTempClass.label}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="90"
                    max="108"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="98.6"
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-gray-400">
                    °F
                  </span>
                </div>
              </div>

              {/* VITAL 4: Pulse / Heart Rate (bpm) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <HeartPulse className="w-3.5 h-3.5 text-pink-500" />
                    <span>{lang === 'bn' ? 'পালস / নাড়িস্পন্দন' : 'Pulse (bpm)'}</span>
                  </label>
                  {currentPulseClass && (
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.2 rounded ${currentPulseClass.badgeClass}`}
                    >
                      {lang === 'bn' ? currentPulseClass.labelBn : currentPulseClass.label}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="30"
                    max="220"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                    placeholder="76"
                    className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-pink-500"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-gray-400">
                    bpm
                  </span>
                </div>
              </div>

              {/* Extra Vitals: SpO2 (%) & Respiratory Rate */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  <span>SpO2 (Oxygen %)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={spO2}
                    onChange={(e) => setSpO2(e.target.value)}
                    placeholder="98"
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-gray-400">
                    %
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-teal-600" />
                  <span>{lang === 'bn' ? 'শ্বাসপ্রশ্বাস হার (RR)' : 'Resp Rate (RR)'}</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="8"
                    max="60"
                    value={respiratoryRate}
                    onChange={(e) => setRespiratoryRate(e.target.value)}
                    placeholder="18"
                    className="w-full pl-3 pr-12 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-teal-500"
                  />
                  <span className="absolute right-2 top-2.5 text-[9px] font-bold text-gray-400">
                    /min
                  </span>
                </div>
              </div>
            </div>

            {/* Staff Member & Triage Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'bn' ? 'দায়িত্বরত নার্স / স্টাফ' : 'Recorded By (Staff)'}
                </label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="Nurse / Triage Officer"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'bn' ? 'লক্ষণ ও ট্রায়াজ নোট' : 'Triage Notes'}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={lang === 'bn' ? 'যেমন: মাথা ঘোরা, ঠান্ডা লাগা' : 'e.g. Mild headache, feverish'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-900 hover:to-indigo-900 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer transition active:scale-95"
              >
                <CheckCircle className="w-4 h-4 text-emerald-300" />
                <span>{lang === 'bn' ? 'ভাইটালস সংরক্ষণ করুন' : 'Save & Record Vitals'}</span>
              </button>

              {activeAppointment && (
                <button
                  type="button"
                  onClick={() => handlePrintSlip(activeAppointment)}
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title={lang === 'bn' ? 'ট্রায়াজ স্লিপ প্রিন্ট করুন' : 'Print Vitals Slip'}
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">{lang === 'bn' ? 'স্লিপ' : 'Slip'}</span>
                </button>
              )}
            </div>

            {/* Quick Presets for Rapid Entry */}
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <div className="text-[10px] font-bold text-gray-400 mb-1.5">
                {lang === 'bn' ? 'দ্রুত প্রিসেট (Rapid Triage):' : 'Quick Normal Preset:'}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBpSystolic('120');
                    setBpDiastolic('80');
                    setTemperature('98.6');
                    setPulse('76');
                    setSpO2('98');
                    setRespiratoryRate('16');
                  }}
                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900 text-purple-900 dark:text-purple-300 rounded-lg text-[10px] font-bold cursor-pointer transition"
                >
                  ✓ {lang === 'bn' ? 'স্বাভাবিক প্রাপ্তবয়স্ক (120/80, 98.6°F, 76 bpm)' : 'Adult Normal (120/80)'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWeight('');
                    setHeight('');
                    setBpSystolic('');
                    setBpDiastolic('');
                    setTemperature('');
                    setPulse('');
                    setSpO2('');
                    setNotes('');
                  }}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-[10px] font-bold cursor-pointer transition"
                >
                  {lang === 'bn' ? 'রিসেট' : 'Clear'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Waitlist Vitals Triage Overview Table (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-purple-100 dark:border-gray-700 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-base text-purple-950 dark:text-purple-200 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-700" />
                <span>{lang === 'bn' ? 'ওয়েটলিস্ট রোগীদের ভাইটালস ট্র্যাকিং' : 'Waitlist Vitals Triage Queue'}</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {lang === 'bn'
                  ? 'সব রোগীর রক্তচাপ, ওজন, তাপমাত্রা ও পালস পর্যবেক্ষণ ও যাচাই করুন।'
                  : 'Live monitoring of weight, blood pressure, temperature, and pulse for all waitlisted patients.'}
              </p>
            </div>

            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/60 text-purple-950 dark:text-purple-200 font-mono font-bold text-xs rounded-full self-start sm:self-auto">
              {filteredAppointments.length} {lang === 'bn' ? 'জন রোগী' : 'Patients'}
            </span>
          </div>

          {/* Search & Filter Tabs Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
            <div className="sm:col-span-5 relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={lang === 'bn' ? 'নাম, PID বা টোকেন...' : 'Search Name, PID, Token...'}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600"
              />
            </div>

            <div className="sm:col-span-7 flex rounded-xl p-1 bg-slate-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs font-bold">
              {[
                { id: 'all', label: lang === 'bn' ? 'সব' : 'All', count: stats.total },
                { id: 'pending', label: lang === 'bn' ? 'বাকি' : 'Pending', count: stats.pending },
                { id: 'recorded', label: lang === 'bn' ? 'সম্পন্ন' : 'Recorded', count: stats.recorded },
                { id: 'abnormal', label: lang === 'bn' ? 'সতর্কতা' : 'Alerts', count: stats.abnormal },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id as any)}
                  className={`flex-1 py-1 px-1 rounded-lg transition text-[11px] flex items-center justify-center gap-1 cursor-pointer ${
                    filterType === tab.id
                      ? tab.id === 'abnormal'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : tab.id === 'pending'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'bg-purple-900 text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[9px] px-1 rounded-full ${
                      filterType === tab.id
                        ? 'bg-black/20 text-white'
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* List of Waitlist Patients with Vitals Cards */}
          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            {filteredAppointments.length === 0 ? (
              <div className="p-8 text-center text-gray-400 border border-dashed rounded-xl border-gray-200 dark:border-gray-700 space-y-2">
                <HeartPulse className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600" />
                <p className="text-xs font-medium">
                  {lang === 'bn' ? 'কোনো রোগী পাওয়া যায়নি' : 'No patients found matching this filter.'}
                </p>
              </div>
            ) : (
              filteredAppointments.map((apt) => {
                const v = apt.patientVitals;
                const hasVitals =
                  v &&
                  (v.weight !== undefined ||
                    v.bpSystolic !== undefined ||
                    v.temperature !== undefined ||
                    v.pulse !== undefined);

                const bpClass = getBpClassification(v?.bpSystolic, v?.bpDiastolic);
                const tempClass = getTempClassification(v?.temperature);
                const pulseClass = getPulseClassification(v?.pulse);
                const bmiData = calculateBmi(v?.weight, v?.height);

                const isSelected = apt.id === selectedAppointmentId;

                return (
                  <div
                    key={apt.id}
                    className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-600/20'
                        : bpClass && (bpClass.severity === 'critical' || bpClass.severity === 'high')
                        ? 'border-rose-300 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 hover:border-purple-300'
                    }`}
                  >
                    {/* Header: Token, Patient, Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-purple-950 text-white flex flex-col items-center justify-center font-black text-xs shrink-0">
                          <span className="text-[8px] text-purple-200 opacity-80">TK</span>
                          <span>#{apt.tokenNo}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-xs text-slate-900 dark:text-slate-100">
                              {apt.patientName}
                            </span>
                            {apt.pId && (
                              <span className="font-mono text-[9px] px-1 rounded bg-purple-100 dark:bg-purple-900/80 text-purple-900 dark:text-purple-200 font-bold">
                                PID: {apt.pId}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {apt.age} · {apt.sex} · Dr. {apt.doctorName} (Room {apt.roomNo})
                          </div>
                        </div>
                      </div>

                      {/* Status pill & Select button */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            apt.status === 'In Consultation'
                              ? 'bg-blue-600 text-white'
                              : apt.status === 'Completed'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-400 text-slate-950'
                          }`}
                        >
                          {apt.status}
                        </span>

                        <button
                          type="button"
                          onClick={() => setSelectedAppointmentId(apt.id)}
                          className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            isSelected
                              ? 'bg-purple-900 text-white'
                              : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                          title={lang === 'bn' ? 'এই রোগীর ভাইটালস এডিট করুন' : 'Edit vitals for this patient'}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Vitals Data Row (4 Primary Metrics) */}
                    {hasVitals && v ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {/* 1. Weight */}
                        <div className="p-2 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50">
                          <div className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                            <Scale className="w-3 h-3" />
                            <span>{lang === 'bn' ? 'ওজন' : 'Weight'}</span>
                          </div>
                          <div className="mt-0.5 font-mono font-black text-xs text-indigo-950 dark:text-indigo-200">
                            {v.weight !== undefined ? `${v.weight} kg` : '--'}
                          </div>
                          {bmiData && (
                            <div className="text-[9px] text-indigo-600 dark:text-indigo-400 font-semibold">
                              BMI {bmiData.bmi}
                            </div>
                          )}
                        </div>

                        {/* 2. Blood Pressure */}
                        <div
                          className={`p-2 rounded-lg border ${
                            bpClass?.bgCard || 'bg-slate-50 dark:bg-gray-900 border-slate-200'
                          }`}
                        >
                          <div className="text-[10px] font-bold text-rose-700 dark:text-rose-400 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Activity className="w-3 h-3" />
                              <span>{lang === 'bn' ? 'রক্তচাপ' : 'BP'}</span>
                            </span>
                            {bpClass && (
                              <span
                                className={`text-[8px] font-black px-1 rounded ${bpClass.badgeClass}`}
                              >
                                {bpClass.severity === 'critical' ? 'CRISIS' : bpClass.label}
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 font-mono font-black text-xs text-slate-900 dark:text-slate-100">
                            {v.bpSystolic && v.bpDiastolic
                              ? `${v.bpSystolic}/${v.bpDiastolic} mmHg`
                              : '--'}
                          </div>
                          <div className="text-[9px] text-gray-500">
                            {v.bpSystolic && v.bpDiastolic
                              ? bpClass?.label
                              : lang === 'bn'
                              ? 'পরিমাপ হয়নি'
                              : 'Not checked'}
                          </div>
                        </div>

                        {/* 3. Temperature */}
                        <div className="p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50">
                          <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Thermometer className="w-3 h-3" />
                              <span>{lang === 'bn' ? 'তাপমাত্রা' : 'Temp'}</span>
                            </span>
                            {tempClass && (
                              <span
                                className={`text-[8px] font-black px-1 rounded ${tempClass.badgeClass}`}
                              >
                                {tempClass.label}
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 font-mono font-black text-xs text-amber-950 dark:text-amber-200">
                            {v.temperature !== undefined ? `${v.temperature}°F` : '--'}
                          </div>
                          <div className="text-[9px] text-gray-500">
                            {v.temperature && v.temperature > 99.0
                              ? lang === 'bn'
                                ? 'জ্বরের লক্ষণ'
                                : 'Feverish'
                              : lang === 'bn'
                              ? 'স্বাভাবিক'
                              : 'Normal'}
                          </div>
                        </div>

                        {/* 4. Pulse */}
                        <div className="p-2 rounded-lg bg-pink-50/70 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-900/50">
                          <div className="text-[10px] font-bold text-pink-700 dark:text-pink-400 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <HeartPulse className="w-3 h-3" />
                              <span>{lang === 'bn' ? 'পালস' : 'Pulse'}</span>
                            </span>
                            {pulseClass && (
                              <span
                                className={`text-[8px] font-black px-1 rounded ${pulseClass.badgeClass}`}
                              >
                                {pulseClass.label}
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 font-mono font-black text-xs text-pink-950 dark:text-pink-200">
                            {v.pulse !== undefined ? `${v.pulse} bpm` : '--'}
                          </div>
                          <div className="text-[9px] text-gray-500">
                            {v.spO2 !== undefined ? `SpO2: ${v.spO2}%` : 'Rhythm OK'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Warning when Vitals are pending */
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>
                            {lang === 'bn'
                              ? 'ভাইটালস গ্রহণ করা হয়নি — ট্রায়াজ পরিমাপ বাকি'
                              : 'Vitals pending — Patient in waiting area'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedAppointmentId(apt.id)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-[10px] cursor-pointer transition shadow-xs"
                        >
                          + {lang === 'bn' ? 'এখনই মাপুন' : 'Record Now'}
                        </button>
                      </div>
                    )}

                    {/* Footer Row: Timestamp & Fast Actions */}
                    <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                      <div>
                        {v?.recordedAt ? (
                          <span>
                            Recorded at {v.recordedAt} by{' '}
                            <strong className="text-gray-600 dark:text-gray-300">
                              {v.recordedBy || 'Staff'}
                            </strong>
                          </span>
                        ) : (
                          <span>Token check-in: {apt.time}</span>
                        )}
                        {v?.notes && (
                          <span className="ml-2 italic text-gray-500">“{v.notes}”</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Call into Chamber */}
                        {apt.status === 'Waiting' && (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(apt.id, 'In Consultation')}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                            title={lang === 'bn' ? 'চেম্বারে ডাকুন' : 'Call in'}
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>{lang === 'bn' ? 'কল' : 'Call'}</span>
                          </button>
                        )}

                        {/* Print Vitals Slip */}
                        <button
                          type="button"
                          onClick={() => handlePrintSlip(apt)}
                          className="p-1 text-gray-500 hover:text-gray-800 dark:hover:text-white cursor-pointer"
                          title="Print Vitals Slip"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Write Rx Prescription */}
                        {onOpenRxModal && (
                          <button
                            type="button"
                            onClick={() => onOpenRxModal(apt)}
                            className="px-2 py-1 bg-purple-900 hover:bg-purple-800 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                          >
                            <Stethoscope className="w-3 h-3 text-pink-300" />
                            <span>Rx</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* HIDDEN PRINT-FRIENDLY TRIAGE SLIP (For Window.print()) */}
      {printingAppointment && (
        <div id="vitals-print-slip" className="hidden print:block p-6 max-w-sm mx-auto text-black font-sans">
          <div className="text-center border-b pb-2 mb-3">
            <h2 className="text-lg font-black uppercase tracking-wider">
              Medicare Hospital & Consultation
            </h2>
            <p className="text-xs">OPD Triage & Patient Vitals Slip</p>
            <p className="text-[10px] text-gray-500">
              Date: {printingAppointment.date || new Date().toLocaleDateString()} | Time:{' '}
              {printingAppointment.time}
            </p>
          </div>

          <div className="space-y-1 text-xs mb-3 border-b pb-2">
            <div className="flex justify-between">
              <strong>Token #:</strong>
              <span className="font-bold text-base">#{printingAppointment.tokenNo}</span>
            </div>
            <div className="flex justify-between">
              <strong>Patient Name:</strong>
              <span>{printingAppointment.patientName}</span>
            </div>
            <div className="flex justify-between">
              <strong>PID / Age / Sex:</strong>
              <span>
                {printingAppointment.pId || 'N/A'} | {printingAppointment.age} |{' '}
                {printingAppointment.sex}
              </span>
            </div>
            <div className="flex justify-between">
              <strong>Consultant Doctor:</strong>
              <span>Dr. {printingAppointment.doctorName} (Room {printingAppointment.roomNo})</span>
            </div>
          </div>

          <div className="space-y-2 text-xs mb-4">
            <h4 className="font-bold border-b pb-1">Clinical Vitals:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <strong>Weight:</strong>{' '}
                {printingAppointment.patientVitals?.weight
                  ? `${printingAppointment.patientVitals.weight} kg`
                  : 'N/A'}
              </div>
              <div>
                <strong>Blood Pressure:</strong>{' '}
                {printingAppointment.patientVitals?.bpSystolic &&
                printingAppointment.patientVitals?.bpDiastolic
                  ? `${printingAppointment.patientVitals.bpSystolic}/${printingAppointment.patientVitals.bpDiastolic} mmHg`
                  : 'N/A'}
              </div>
              <div>
                <strong>Temperature:</strong>{' '}
                {printingAppointment.patientVitals?.temperature
                  ? `${printingAppointment.patientVitals.temperature} °F`
                  : 'N/A'}
              </div>
              <div>
                <strong>Pulse Rate:</strong>{' '}
                {printingAppointment.patientVitals?.pulse
                  ? `${printingAppointment.patientVitals.pulse} bpm`
                  : 'N/A'}
              </div>
              <div>
                <strong>SpO2:</strong>{' '}
                {printingAppointment.patientVitals?.spO2
                  ? `${printingAppointment.patientVitals.spO2}%`
                  : 'N/A'}
              </div>
              <div>
                <strong>Resp. Rate:</strong>{' '}
                {printingAppointment.patientVitals?.respiratoryRate
                  ? `${printingAppointment.patientVitals.respiratoryRate}/min`
                  : 'N/A'}
              </div>
            </div>
            {printingAppointment.patientVitals?.notes && (
              <div className="text-[11px] pt-1">
                <strong>Triage Notes:</strong> {printingAppointment.patientVitals.notes}
              </div>
            )}
          </div>

          <div className="pt-4 border-t flex justify-between text-[10px] text-gray-500">
            <span>Recorded By: {printingAppointment.patientVitals?.recordedBy || 'Triage Nurse'}</span>
            <span>Adiba Software</span>
          </div>
        </div>
      )}
    </div>
  );
};
