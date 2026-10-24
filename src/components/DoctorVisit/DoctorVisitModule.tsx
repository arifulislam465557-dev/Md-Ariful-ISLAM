import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OpdAppointment, PatientVitals } from '../../types';
import { initialAppointments } from '../../data/initialData';
import { PatientHistoryPanel } from './PatientHistoryPanel';
import { ShiftHandoverPanel } from './ShiftHandoverPanel';
import { DoctorRxModal } from './DoctorRxModal';
import { WaitlistPanel } from './WaitlistPanel';
import { VitalsTrackingPanel } from './VitalsTrackingPanel';
import { generatePrescriptionPdf } from '../../utils/pdfGenerator';
import {
  UserCheck,
  Ticket,
  Clock,
  Printer,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  History,
  Search,
  FileText,
  User,
  Users,
  ArrowRight,
  Sparkles,
  Phone,
  Stethoscope,
  ExternalLink,
  ClipboardList,
  HeartPulse,
  Trash2,
} from 'lucide-react';

export const DoctorVisitModule: React.FC = () => {
  const {
    doctors,
    clinicConfig,
    t,
    lang,
    patients,
    prescriptions,
    openPatientOverviewModal,
    shiftHandovers,
    activeShiftHandoverCount,
    opdAppointments,
    setOpdAppointments,
    deleteOpdAppointment,
    activeDrafts,
    updateModuleDraft,
  } = useApp();

  const [subTab, setSubTab] = useState<'waitlist' | 'vitals' | 'queue' | 'history' | 'handover'>('waitlist');
  const [historyPId, setHistoryPId] = useState<string>('26100294');
  const [handoverPreSelectedPatient, setHandoverPreSelectedPatient] = useState<{
    pId: string;
    patientName: string;
    age: string;
    sex: 'Male' | 'Female' | 'Other';
    chiefComplaints?: string;
  } | null>(null);

  // Rx Prescription Modal State
  const [openRxModal, setOpenRxModal] = useState<boolean>(false);
  const [selectedAppointmentForRx, setSelectedAppointmentForRx] = useState<OpdAppointment | null>(null);
  const [rxInitialPId, setRxInitialPId] = useState<string>('26100294');

  const appointments = (opdAppointments && opdAppointments.length > 0 ? opdAppointments : initialAppointments) as OpdAppointment[];
  const setAppointments = (next: OpdAppointment[]) => {
    setOpdAppointments(next as any);
  };

  const savedDraft = activeDrafts?.doctorVisitDraft;
  const [pId, setPId] = useState<string>(savedDraft?.pId ?? '26100294');
  const [patientName, setPatientName] = useState<string>(savedDraft?.patientName ?? 'Titly');
  const [phone, setPhone] = useState<string>(savedDraft?.phone ?? '01712000001');
  const [age, setAge] = useState<string>(savedDraft?.age ?? '24 Y');
  const [sex, setSex] = useState<'Male' | 'Female' | 'Other'>(savedDraft?.sex ?? 'Female');
  const [doctorId, setDoctorId] = useState<string>(savedDraft?.doctorId ?? (doctors[0]?.id || ''));
  const [chiefComplaints, setChiefComplaints] = useState<string>(savedDraft?.chiefComplaints ?? '');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  React.useEffect(() => {
    updateModuleDraft('doctorVisitDraft', {
      pId,
      patientName,
      phone,
      age,
      sex,
      doctorId,
      chiefComplaints,
      updatedAt: new Date().toISOString(),
    });
  }, [pId, patientName, phone, age, sex, doctorId, chiefComplaints]);

  const selectedDoctor = doctors.find((d) => d.id === doctorId) || doctors[0];

  // Auto-fill from Patient ID if exists in database
  const handlePIdChange = (idVal: string) => {
    setPId(idVal);
    const matched = patients.find(
      (p) => p.pId.toLowerCase() === idVal.trim().toLowerCase()
    );
    if (matched) {
      setPatientName(matched.patientName);
      if (matched.phone) setPhone(matched.phone);
      if (matched.age) setAge(matched.age);
      if (matched.sex) setSex(matched.sex);
    }
  };

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    const tokenNo = appointments.length + 1;
    const newAppointment: OpdAppointment = {
      id: `opd-${Date.now()}`,
      tokenNo,
      pId: pId.trim() || undefined,
      patientName: patientName.trim(),
      phone: phone.trim(),
      age: age || '25 Y',
      sex,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      specialty: selectedDoctor.specialty,
      roomNo: selectedDoctor.roomNo || '101',
      fee: selectedDoctor.fee || 600,
      status: 'Waiting',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('en-GB'),
      chiefComplaints: chiefComplaints.trim() || undefined,
    };

    const updated = [...appointments, newAppointment];
    setAppointments(updated);
    try {
      localStorage.setItem('medicare_clinic_v1_opd_appointments', JSON.stringify(updated));
    } catch {}

    setToastMsg(
      lang === 'bn'
        ? `টোকেন #${tokenNo} প্রদান করা হয়েছে: ${patientName} (${selectedDoctor.name})`
        : `Token #${tokenNo} issued for ${patientName} to ${selectedDoctor.name}`
    );
    setPId('');
    setPatientName('');
    setAge('');
    setChiefComplaints('');
    setTimeout(() => setToastMsg(null), 3500);
  };

  const updateStatus = (id: string, newStatus: OpdAppointment['status']) => {
    const updated = appointments.map((a) => (a.id === id ? { ...a, status: newStatus } : a));
    setAppointments(updated);
    try {
      localStorage.setItem('medicare_clinic_v1_opd_appointments', JSON.stringify(updated));
    } catch {}
  };

  const handleUpdateVitals = (appointmentId: string, vitalsData: PatientVitals) => {
    const parts: string[] = [];
    if (vitalsData.bpSystolic && vitalsData.bpDiastolic) {
      parts.push(`BP: ${vitalsData.bpSystolic}/${vitalsData.bpDiastolic} mmHg`);
    }
    if (vitalsData.temperature) {
      parts.push(`Temp: ${vitalsData.temperature}°F`);
    }
    if (vitalsData.pulse) {
      parts.push(`PR: ${vitalsData.pulse} bpm`);
    }
    if (vitalsData.weight) {
      parts.push(`Wt: ${vitalsData.weight} kg`);
    }
    if (vitalsData.spO2) {
      parts.push(`SpO2: ${vitalsData.spO2}%`);
    }
    const formattedVitalsString = parts.join(' | ');

    const updated = appointments.map((a) => {
      if (a.id === appointmentId) {
        return {
          ...a,
          patientVitals: vitalsData,
          vitals: formattedVitalsString || a.vitals,
        };
      }
      return a;
    });

    setAppointments(updated);
    try {
      localStorage.setItem('medicare_clinic_v1_opd_appointments', JSON.stringify(updated));
    } catch {}
  };

  const pendingVitalsCount = appointments.filter(
    (a) =>
      a.status !== 'Completed' &&
      (!a.patientVitals ||
        (a.patientVitals.weight === undefined && a.patientVitals.bpSystolic === undefined))
  ).length;

  const handleAddWaitlistAppointment = (appointmentData: Omit<OpdAppointment, 'id' | 'tokenNo'>) => {
    const tokenNo = appointments.length + 1;
    const newAppointment: OpdAppointment = {
      ...appointmentData,
      id: `opd-${Date.now()}`,
      tokenNo,
    };
    const updated = [...appointments, newAppointment];
    setAppointments(updated);
    try {
      localStorage.setItem('medicare_clinic_v1_opd_appointments', JSON.stringify(updated));
    } catch {}
    setToastMsg(
      lang === 'bn'
        ? `টোকেন #${tokenNo} প্রদান করা হয়েছে: ${newAppointment.patientName} (${newAppointment.doctorName})`
        : `Token #${tokenNo} issued for ${newAppointment.patientName} (${newAppointment.doctorName})`
    );
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Automatically trigger a PDF print dialogue for the generated RX prescription once the doctor clicks 'Finish'
  const handleFinishAppointment = (appointment: OpdAppointment) => {
    // 1. Mark status as 'Completed'
    updateStatus(appointment.id, 'Completed');

    // 2. Find if an Rx prescription exists for this patient (by PID or name)
    const patientPId = appointment.pId || '';
    const existingRx = prescriptions.find(
      (rx) =>
        (patientPId && rx.pId === patientPId) ||
        rx.patientName.toLowerCase() === appointment.patientName.toLowerCase()
    );

    const docObj = doctors.find((d) => d.id === appointment.doctorId) || doctors[0];

    if (existingRx) {
      // Automatically trigger PDF print dialogue for the generated Rx prescription!
      generatePrescriptionPdf(existingRx, docObj, clinicConfig, {
        autoPrint: true,
      });

      setToastMsg(
        lang === 'bn'
          ? `পরামর্শ সমাপ্ত হয়েছে এবং রোগী ${appointment.patientName} এর প্রেসক্রিপশন পিডিএফ প্রিন্ট ডায়ালগ চালু হয়েছে!`
          : `Consultation finished for ${appointment.patientName}. Rx PDF print dialogue triggered!`
      );
      setTimeout(() => setToastMsg(null), 4000);
    } else {
      // If no Rx was created yet during this consultation, open the RxModal so the doctor can review/customize and print
      setSelectedAppointmentForRx(appointment);
      setRxInitialPId(patientPId || '26100294');
      setOpenRxModal(true);
      setToastMsg(
        lang === 'bn'
          ? `পরামর্শ সম্পন্ন করতে প্রেসক্রিপশনে 'Finish' বাটনে ক্লিক করুন (স্বয়ংক্রিয়ভাবে পিডিএফ প্রিন্ট ডায়ালগ চালু হবে)`
          : `Please review prescription and click 'Finish' to auto-trigger PDF print dialogue.`
      );
      setTimeout(() => setToastMsg(null), 4500);
    }
  };

  const handleOpenPatientHistory = (idToFetch: string) => {
    setHistoryPId(idToFetch);
    setSubTab('history');
  };

  const handleSelectPatientForNewVisit = (patient: {
    pId: string;
    name: string;
    phone: string;
    age: string;
    sex: 'Male' | 'Female' | 'Other';
  }) => {
    setPId(patient.pId);
    setPatientName(patient.name);
    setPhone(patient.phone);
    setAge(patient.age);
    setSex(patient.sex);
    setSubTab('queue');
    setToastMsg(
      lang === 'bn'
        ? `রোগী ${patient.name} (PID: ${patient.pId}) এর তথ্য বুকিং ফর্মে যুক্ত হয়েছে`
        : `Patient ${patient.name} (PID: ${patient.pId}) loaded into OPD booking form`
    );
    setTimeout(() => setToastMsg(null), 3500);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="bg-purple-900 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex justify-between items-center shadow-lg border border-purple-500 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-white/80 hover:text-white cursor-pointer ml-3 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Module Header & Sub-Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl shadow-xs border border-purple-100 dark:border-gray-700">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-purple-950 dark:text-purple-200 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-700" />
            <span>{t.doctorVisit}</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {lang === 'bn'
              ? 'ডাক্তার ভিজিট ওপিডি চেম্বার, কিউ টোকেন, ওয়েটিং রুম ও ওয়েটলিস্ট সিরিয়াল ব্যবস্থাপনা।'
              : 'OPD Chamber queue, token issue, patient waiting room waitlist, and historical clinical records.'}
          </p>
        </div>

        {/* View Switcher Tabs & Quick Rx Prescription Button */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          <div className="flex rounded-xl p-1 bg-purple-50 dark:bg-gray-900 border border-purple-200 dark:border-purple-800 text-xs font-bold">
            {/* 1. WAITLIST TAB */}
            <button
              type="button"
              onClick={() => setSubTab('waitlist')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                subTab === 'waitlist'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-purple-900 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-gray-800'
              }`}
            >
              <Users className="w-4 h-4 text-amber-300" />
              <span>{lang === 'bn' ? 'ওয়েটিং রুম / ওয়েটলিস্ট' : 'Waitlist'}</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black">
                {appointments.filter((a) => a.status === 'Waiting').length}
              </span>
            </button>

            {/* 2. VITALS TRACKING SECTION */}
            <button
              type="button"
              onClick={() => setSubTab('vitals')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                subTab === 'vitals'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-purple-900 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-gray-800'
              }`}
            >
              <HeartPulse className="w-4 h-4 text-rose-400" />
              <span>{lang === 'bn' ? 'ভাইটালস ট্র্যাকিং' : 'Vitals Tracking'}</span>
              {pendingVitalsCount > 0 ? (
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-black animate-pulse">
                  {pendingVitalsCount}
                </span>
              ) : (
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-white font-black">
                  ✓
                </span>
              )}
            </button>

            {/* 3. OPD LIVE QUEUE & TOKEN BOOKING */}
            <button
              type="button"
              onClick={() => setSubTab('queue')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                subTab === 'queue'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-purple-900 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-gray-800'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>{lang === 'bn' ? 'টোকেন বুকিং' : 'Token Booking'}</span>
            </button>

            {/* 4. PATIENT HISTORY */}
            <button
              type="button"
              onClick={() => setSubTab('history')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                subTab === 'history'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-purple-900 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-gray-800'
              }`}
            >
              <History className="w-4 h-4 text-pink-400" />
              <span>{lang === 'bn' ? 'রোগীর হিস্ট্রি' : 'History'}</span>
            </button>

            {/* 5. SHIFT HANDOVER */}
            <button
              type="button"
              onClick={() => setSubTab('handover')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                subTab === 'handover'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-purple-900 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-gray-800'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'bn' ? 'হ্যান্ডওভার' : 'Handover'}</span>
              {activeShiftHandoverCount > 0 ? (
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-red-500 text-white font-black animate-pulse">
                  {activeShiftHandoverCount}
                </span>
              ) : (
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                  {shiftHandovers.length}
                </span>
              )}
            </button>
          </div>

          {/* Direct Rx Prescription Trigger */}
          <button
            type="button"
            onClick={() => {
              setSelectedAppointmentForRx(null);
              setRxInitialPId(pId || '26100294');
              setOpenRxModal(true);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition active:scale-95 ring-1 ring-white/20"
            title={lang === 'bn' ? 'নতুন প্রেসক্রিপশন লিখুন — ওষুধ নির্বাচন, ডোজ ও নির্দেশনাসমূহ' : 'Write Rx Prescription'}
          >
            <Stethoscope className="w-4 h-4 text-pink-300" />
            <span>{lang === 'bn' ? 'Rx প্রেসক্রিপশন লিখুন' : 'Write Rx'}</span>
          </button>
        </div>
      </div>

      {/* VIEW: WAITLIST SECTION */}
      {subTab === 'waitlist' && (
        <WaitlistPanel
          appointments={appointments}
          onUpdateStatus={updateStatus}
          onAddAppointment={handleAddWaitlistAppointment}
          onFinishAppointment={handleFinishAppointment}
          onOpenRxModal={(a) => {
            const patientPId =
              a.pId ||
              patients.find((p) => p.patientName.toLowerCase() === a.patientName.toLowerCase())?.pId ||
              '26100294';
            setSelectedAppointmentForRx(a);
            setRxInitialPId(patientPId);
            setOpenRxModal(true);
          }}
          onOpenHistory={handleOpenPatientHistory}
          onOpenOverview={openPatientOverviewModal}
          onSendToHandover={(patient) => {
            setHandoverPreSelectedPatient(patient);
            setSubTab('handover');
          }}
          onUpdateVitals={handleUpdateVitals}
          onNavigateToVitals={() => setSubTab('vitals')}
          doctors={doctors}
          patients={patients}
          lang={lang}
        />
      )}

      {/* VIEW: VITALS TRACKING SECTION */}
      {subTab === 'vitals' && (
        <VitalsTrackingPanel
          appointments={appointments}
          onUpdateVitals={handleUpdateVitals}
          onUpdateStatus={updateStatus}
          onOpenRxModal={(a) => {
            const patientPId =
              a.pId ||
              patients.find((p) => p.patientName.toLowerCase() === a.patientName.toLowerCase())?.pId ||
              '26100294';
            setSelectedAppointmentForRx(a);
            setRxInitialPId(patientPId);
            setOpenRxModal(true);
          }}
          doctors={doctors}
          patients={patients}
          lang={lang}
        />
      )}

      {/* VIEW 1: PATIENT HISTORY PANEL */}
      {subTab === 'history' && (
        <PatientHistoryPanel
          initialPatientId={historyPId}
          onSelectPatientForNewVisit={handleSelectPatientForNewVisit}
          onBackToQueue={() => setSubTab('waitlist')}
        />
      )}

      {/* VIEW 3: DOCTOR SHIFT HANDOVER */}
      {subTab === 'handover' && (
        <ShiftHandoverPanel
          onBackToQueue={() => setSubTab('waitlist')}
          preSelectedPatient={handoverPreSelectedPatient}
          onClearPreSelectedPatient={() => setHandoverPreSelectedPatient(null)}
        />
      )}

      {/* VIEW 2: OPD QUEUE & APPOINTMENT BOOKING */}
      {subTab === 'queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-150">
          {/* Booking Form (5 Cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-xs border border-purple-100 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
              <h3 className="font-bold text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-purple-700" />
                <span>{t.newAppointment}</span>
              </h3>
              <span className="text-[11px] text-gray-500">
                {lang === 'bn' ? 'সিরিয়াল টোকেন ইস্যু' : 'Issue Token'}
              </span>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-3.5 text-xs">
              {/* Patient ID (PID) Field with History Search Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">
                    {lang === 'bn' ? 'রোগীর আইডি (Patient ID / PID):' : 'Patient ID (PID):'}
                  </label>
                  {pId && (
                    <button
                      type="button"
                      onClick={() => handleOpenPatientHistory(pId)}
                      className="text-[11px] text-purple-700 dark:text-purple-300 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <History className="w-3 h-3 text-purple-700" />
                      <span>{lang === 'bn' ? 'হিস্ট্রি দেখুন' : 'View History'}</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pId}
                    onChange={(e) => handlePIdChange(e.target.value)}
                    placeholder="e.g. 26100294"
                    className="flex-1 bg-purple-50/60 dark:bg-gray-900 border-2 border-purple-300 dark:border-purple-700 p-2 rounded-xl text-xs font-mono font-bold text-purple-950 dark:text-purple-200 focus:outline-none focus:border-purple-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleOpenPatientHistory(pId || '26100294')}
                    className="px-3 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition"
                    title={lang === 'bn' ? 'এই রোগীর পূর্ববর্তী ভিজিট ও ডায়াগনোসিস হিস্ট্রি দেখুন' : 'View past visits & diagnosis history'}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'হিস্ট্রি' : 'History'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openPatientOverviewModal(pId || '26100294')}
                    className="px-3 py-2 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-200 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition"
                    title={lang === 'bn' ? 'রোগী প্রোফাইল, ল্যাব রিপোর্ট ও বকেয়া ওভারভিউ' : 'Complete Patient Overview'}
                  >
                    <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-300" />
                    <span>{lang === 'bn' ? 'ওভারভিউ' : 'Overview'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHandoverPreSelectedPatient({
                        pId: pId || '26100294',
                        patientName: patientName || 'Patient',
                        age: age || '24 Y',
                        sex: sex || 'Female',
                        chiefComplaints: chiefComplaints,
                      });
                      setSubTab('handover');
                    }}
                    className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition"
                    title={lang === 'bn' ? 'শিফট হ্যান্ডওভারে এই রোগীকে যোগ করুন' : 'Add patient to Shift Handover'}
                  >
                    <ClipboardList className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
                    <span>{lang === 'bn' ? 'হ্যান্ডওভার' : 'Handover'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">{t.ptName} *:</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Patient Full Name"
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Phone:</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded-xl text-xs font-mono focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">{t.age}:</label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="25 Y"
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">{t.sex}:</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as any)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-600 cursor-pointer"
                >
                  <option value="Female">{t.female}</option>
                  <option value="Male">{t.male}</option>
                  <option value="Other">{t.other}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'bn' ? 'প্রধান সমস্যা / উপসর্গ (ঐচ্ছিক):' : 'Chief Complaints (Optional):'}
                </label>
                <input
                  type="text"
                  value={chiefComplaints}
                  onChange={(e) => setChiefComplaints(e.target.value)}
                  placeholder="e.g. Fever for 3 days, cough, headache"
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded-xl text-xs focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Consultant Doctor:</label>
                <select
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className="w-full bg-purple-50 dark:bg-gray-900 border-2 border-purple-200 dark:border-purple-800 p-2 rounded-xl text-xs font-bold text-purple-950 dark:text-purple-200 focus:outline-none cursor-pointer"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — Room {d.roomNo} (Fee: ৳{d.fee})
                    </option>
                  ))}
                </select>
              </div>

              {/* Doctor Info Pill */}
              {selectedDoctor && (
                <div className="bg-purple-50 dark:bg-gray-900/40 p-3 rounded-xl border border-purple-200 dark:border-gray-700 text-xs space-y-1">
                  <p className="font-bold text-purple-950 dark:text-purple-300">{selectedDoctor.name}</p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400">{selectedDoctor.specialty}</p>
                  <div className="flex justify-between items-center pt-1 font-semibold text-purple-900 dark:text-purple-200">
                    <span>Room: {selectedDoctor.roomNo}</span>
                    <span className="font-bold text-sm text-emerald-700">Fee: ৳{selectedDoctor.fee}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition active:scale-98"
              >
                <Ticket className="w-4 h-4" />
                <span>{lang === 'bn' ? 'ওপিডি সিরিয়াল টোকেন কাটুন' : 'Issue OPD Calling Token'}</span>
              </button>

              {/* Direct Rx Prescription Button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedAppointmentForRx(null);
                  setRxInitialPId(pId || '26100294');
                  setOpenRxModal(true);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-purple-800 via-pink-700 to-indigo-800 hover:from-purple-900 hover:to-indigo-900 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition active:scale-98"
              >
                <Stethoscope className="w-4 h-4 text-pink-300" />
                <span>{lang === 'bn' ? '⚡ দ্রুত Rx প্রেসক্রিপশন লিখুন' : '⚡ Write New Rx Prescription'}</span>
              </button>
            </form>
          </div>

          {/* Live Queue Table (7 Cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-xs border border-purple-100 dark:border-gray-700 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2 mb-3">
                <h3 className="font-bold text-sm text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>{t.opdQueue}</span>
                </h3>
                <span className="text-xs text-purple-700 dark:text-purple-300 font-bold">
                  {appointments.filter((a) => a.status === 'Waiting').length} Waiting
                </span>
              </div>

              <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
                {appointments.map((a) => {
                  const patientPId =
                    a.pId ||
                    patients.find((p) => p.patientName.toLowerCase() === a.patientName.toLowerCase())?.pId ||
                    '26100294';

                  return (
                    <div
                      key={a.id}
                      className={`p-3.5 rounded-2xl border transition ${
                        a.status === 'In Consultation'
                          ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 shadow-xs'
                          : a.status === 'Completed'
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 opacity-75'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-900 text-white flex flex-col items-center justify-center font-black shrink-0">
                            <span className="text-[9px] uppercase tracking-wider text-purple-300">Token</span>
                            <span className="text-sm leading-none">#{a.tokenNo}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">{a.patientName}</h4>
                              {patientPId && (
                                <span className="font-mono text-[10px] bg-purple-100 dark:bg-purple-900 px-1.5 py-0.2 rounded text-purple-900 dark:text-purple-200 font-bold">
                                  PID: {patientPId}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500">
                              {a.age} | {a.sex} | Phone: {a.phone}
                            </p>
                            <p className="text-[11px] font-semibold text-purple-800 dark:text-purple-300 mt-0.5">
                              Dr. {a.doctorName} (Room {a.roomNo})
                            </p>
                            {a.chiefComplaints && (
                              <p className="text-[10px] text-slate-500 italic mt-0.5">
                                লক্ষণ: {a.chiefComplaints}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-1">
                          {a.status === 'Waiting' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-400">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                              <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              <span>{lang === 'bn' ? 'অপেক্ষারত' : 'Waiting'}</span>
                            </span>
                          )}

                          {a.status === 'In Consultation' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-700 shadow-xs">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-85"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                              </span>
                              <Stethoscope className="w-3 h-3 text-pink-200" />
                              <span>{lang === 'bn' ? 'পরামর্শ চলছে' : 'In Consultation'}</span>
                            </span>
                          )}

                          {a.status === 'Completed' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-400">
                              <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>{lang === 'bn' ? 'সম্পন্ন' : 'Completed'}</span>
                            </span>
                          )}

                          {a.status === 'Cancelled' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-300">
                              <span>Cancelled</span>
                            </span>
                          )}
                          <p className="text-[11px] text-gray-400 mt-0.5 font-mono">{a.time}</p>
                        </div>
                      </div>

                      {/* Quick Action Status Changer & History Trigger */}
                      <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 font-mono text-[11px]">Fee: ৳{a.fee} (Paid)</span>
                          {/* Patient History Button on Queue Card */}
                          <button
                            type="button"
                            onClick={() => handleOpenPatientHistory(patientPId)}
                            className="px-2 py-0.5 rounded bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                            title={lang === 'bn' ? 'এই রোগীর পূর্ববর্তী ভিজিট ও ডায়াগনোসিস হিস্ট্রি দেখুন' : 'View patient visit & diagnosis history'}
                          >
                            <History className="w-3 h-3 text-purple-700 dark:text-purple-300" />
                            <span>{lang === 'bn' ? 'হিস্ট্রি দেখুন' : 'History'}</span>
                          </button>

                          {/* Complete Patient Overview Modal Trigger */}
                          <button
                            type="button"
                            onClick={() => openPatientOverviewModal(patientPId)}
                            className="px-2 py-0.5 rounded bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-200 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                            title={lang === 'bn' ? 'রোগীর সম্পূর্ণ ওভারভিউ (ভিজিট, ল্যাব, বকেয়া)' : 'Complete Patient Overview (Visits, Lab, Due)'}
                          >
                            <User className="w-3 h-3 text-indigo-700 dark:text-indigo-300" />
                            <span>{lang === 'bn' ? 'ওভারভিউ' : 'Overview'}</span>
                          </button>

                          {/* Quick Shift Handover Note Trigger */}
                          <button
                            type="button"
                            onClick={() => {
                              setHandoverPreSelectedPatient({
                                pId: patientPId,
                                patientName: a.patientName,
                                age: a.age,
                                sex: a.sex,
                                chiefComplaints: a.chiefComplaints,
                              });
                              setSubTab('handover');
                            }}
                            className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                            title={lang === 'bn' ? 'পরবর্তী শিফটের জন্য হ্যান্ডওভার নোট প্রস্তুত করুন' : 'Create shift handover note for this patient'}
                          >
                            <ClipboardList className="w-3 h-3 text-emerald-700 dark:text-emerald-300" />
                            <span>{lang === 'bn' ? 'হ্যান্ডওভার' : 'Handover'}</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* PROMINENT Rx PRESCRIPTION BUTTON */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAppointmentForRx(a);
                              setRxInitialPId(patientPId);
                              setOpenRxModal(true);
                            }}
                            className="px-2.5 py-1 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white font-black rounded-lg text-[11px] flex items-center gap-1.5 shadow-md cursor-pointer transition active:scale-95 ring-1 ring-white/20"
                            title={lang === 'bn' ? 'এই রোগীর জন্য প্রেসক্রিপশন ও ওষুধের মাত্রা নির্ধারণ করুন' : 'Write Rx Prescription'}
                          >
                            <Stethoscope className="w-3.5 h-3.5 text-pink-300" />
                            <span>Rx প্রেসক্রিপশন</span>
                          </button>

                          {a.status === 'Waiting' && (
                            <button
                              onClick={() => updateStatus(a.id, 'In Consultation')}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] cursor-pointer"
                            >
                              Call In
                            </button>
                          )}
                          {a.status === 'In Consultation' && (
                            <button
                              type="button"
                              onClick={() => handleFinishAppointment(a)}
                              className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black rounded-lg text-[11px] cursor-pointer flex items-center gap-1 shadow-sm transition active:scale-95 ring-1 ring-emerald-300 dark:ring-emerald-600"
                              title={lang === 'bn' ? 'পরামর্শ সমাপ্ত করুন এবং স্বয়ংক্রিয়ভাবে প্রেসক্রিপশন পিডিএফ প্রিন্ট ডায়ালগ চালু করুন' : 'Finish consultation & auto-trigger PDF print dialogue'}
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-200" />
                              <span>Finish</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteOpdAppointment(a.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-300 rounded-lg transition cursor-pointer"
                            title={lang === 'bn' ? 'অ্যাপয়েন্টমেন্ট ডিলিট করুন (শুধুমাত্র অ্যাডমিন)' : 'Delete Appointment (Admin Only)'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {a.status === 'Completed' && (
                            <button
                              type="button"
                              onClick={() => {
                                const patientPId = a.pId || '';
                                const existingRx = prescriptions.find(
                                  (rx) =>
                                    (patientPId && rx.pId === patientPId) ||
                                    rx.patientName.toLowerCase() === a.patientName.toLowerCase()
                                );
                                const docObj = doctors.find((d) => d.id === a.doctorId) || doctors[0];
                                if (existingRx) {
                                  generatePrescriptionPdf(existingRx, docObj, clinicConfig, { autoPrint: true });
                                } else {
                                  setSelectedAppointmentForRx(a);
                                  setRxInitialPId(patientPId || '26100294');
                                  setOpenRxModal(true);
                                }
                              }}
                              className="px-2 py-0.5 rounded bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                              title={lang === 'bn' ? 'প্রেসক্রিপশন পিডিএফ প্রিন্ট ডায়ালগ চালু করুন' : 'Trigger Rx PDF print dialogue'}
                            >
                              <Printer className="w-3 h-3 text-purple-700 dark:text-purple-300" />
                              <span>পিডিএফ প্রিন্ট</span>
                            </button>
                          )}

                          {a.status !== 'Completed' && (
                            <button
                              onClick={() => updateStatus(a.id, 'Cancelled')}
                              className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-lg text-[11px] cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Rx Prescription Modal */}
      {openRxModal && (
        <DoctorRxModal
          appointment={selectedAppointmentForRx}
          initialPId={rxInitialPId}
          onClose={() => {
            setOpenRxModal(false);
            setSelectedAppointmentForRx(null);
          }}
          onSaved={() => {
            const saved = localStorage.getItem('medicare_clinic_v1_opd_appointments');
            if (saved) {
              try {
                const list = JSON.parse(saved);
                if (Array.isArray(list)) setAppointments(list);
              } catch {}
            }
            setToastMsg(
              lang === 'bn'
                ? 'প্রেসক্রিপশন সফলভাবে সংরক্ষিত হয়েছে এবং পিডিএফ প্রিন্ট ডায়ালগ চালু হয়েছে!'
                : 'Prescription saved successfully & PDF print dialogue triggered!'
            );
            setTimeout(() => setToastMsg(null), 3500);
          }}
        />
      )}
    </div>
  );
};
