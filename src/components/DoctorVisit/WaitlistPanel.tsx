import React, { useState, useMemo } from 'react';
import { OpdAppointment, Doctor, Patient, PatientVitals } from '../../types';
import {
  Users,
  Clock,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Volume2,
  Stethoscope,
  History,
  User,
  ClipboardList,
  Printer,
  ChevronRight,
  Flame,
  ArrowRight,
  Sparkles,
  Phone,
  DoorOpen,
  Calendar,
  X,
  RefreshCw,
  Scale,
  Thermometer,
  HeartPulse,
  Activity,
  Edit3,
} from 'lucide-react';

interface WaitlistPanelProps {
  appointments: OpdAppointment[];
  onUpdateStatus: (id: string, newStatus: OpdAppointment['status']) => void;
  onAddAppointment: (appointment: Omit<OpdAppointment, 'id' | 'tokenNo'>) => void;
  onFinishAppointment: (appointment: OpdAppointment) => void;
  onOpenRxModal: (appointment: OpdAppointment) => void;
  onOpenHistory: (pId: string) => void;
  onOpenOverview: (pId: string) => void;
  onSendToHandover: (patient: any) => void;
  onUpdateVitals?: (id: string, vitals: PatientVitals) => void;
  onNavigateToVitals?: () => void;
  doctors: Doctor[];
  patients: Patient[];
  lang: 'bn' | 'en';
}

// Pleasant clinic chime tone using Web Audio API
const playChimeSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.15); // A5
    gain2.gain.setValueAtTime(0.2, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.85);
  } catch (_) {}
};

export const WaitlistPanel: React.FC<WaitlistPanelProps> = ({
  appointments,
  onUpdateStatus,
  onAddAppointment,
  onFinishAppointment,
  onOpenRxModal,
  onOpenHistory,
  onOpenOverview,
  onSendToHandover,
  onUpdateVitals,
  onNavigateToVitals,
  doctors,
  patients,
  lang,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Waiting' | 'In Consultation' | 'Completed'>('All');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'Urgent' | 'Senior' | 'Follow-up' | 'Normal'>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [calledNotice, setCalledNotice] = useState<string | null>(null);

  // Quick Vitals Modal State for waitlist patient card
  const [vitalsModalAppointment, setVitalsModalAppointment] = useState<OpdAppointment | null>(null);
  const [quickWeight, setQuickWeight] = useState('');
  const [quickBpSys, setQuickBpSys] = useState('');
  const [quickBpDia, setQuickBpDia] = useState('');
  const [quickTemp, setQuickTemp] = useState('');
  const [quickPulse, setQuickPulse] = useState('');
  const [quickSpO2, setQuickSpO2] = useState('');
  const [quickNotes, setQuickNotes] = useState('');

  const handleOpenQuickVitals = (apt: OpdAppointment) => {
    setVitalsModalAppointment(apt);
    const v = apt.patientVitals;
    if (v) {
      setQuickWeight(v.weight !== undefined ? String(v.weight) : '');
      setQuickBpSys(v.bpSystolic !== undefined ? String(v.bpSystolic) : '');
      setQuickBpDia(v.bpDiastolic !== undefined ? String(v.bpDiastolic) : '');
      setQuickTemp(v.temperature !== undefined ? String(v.temperature) : '');
      setQuickPulse(v.pulse !== undefined ? String(v.pulse) : '');
      setQuickSpO2(v.spO2 !== undefined ? String(v.spO2) : '');
      setQuickNotes(v.notes || '');
    } else {
      setQuickWeight('');
      setQuickBpSys('');
      setQuickBpDia('');
      setQuickTemp('98.6');
      setQuickPulse('76');
      setQuickSpO2('98');
      setQuickNotes('');
    }
  };

  const handleSaveQuickVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vitalsModalAppointment || !onUpdateVitals) {
      setVitalsModalAppointment(null);
      return;
    }

    const vitalsData: PatientVitals = {
      weight: quickWeight ? parseFloat(quickWeight) : undefined,
      bpSystolic: quickBpSys ? parseInt(quickBpSys, 10) : undefined,
      bpDiastolic: quickBpDia ? parseInt(quickBpDia, 10) : undefined,
      temperature: quickTemp ? parseFloat(quickTemp) : undefined,
      pulse: quickPulse ? parseInt(quickPulse, 10) : undefined,
      spO2: quickSpO2 ? parseInt(quickSpO2, 10) : undefined,
      recordedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      recordedDate: new Date().toLocaleDateString('en-GB'),
      recordedBy: 'Waitlist Triage Desk',
      notes: quickNotes.trim() || undefined,
    };

    onUpdateVitals(vitalsModalAppointment.id, vitalsData);
    setCalledNotice(
      lang === 'bn'
        ? `টোকেন #${vitalsModalAppointment.tokenNo} (${vitalsModalAppointment.patientName}): ভাইটালস সফলভাবে সংরক্ষণ করা হয়েছে!`
        : `Vitals updated for Token #${vitalsModalAppointment.tokenNo} (${vitalsModalAppointment.patientName})`
    );
    setTimeout(() => setCalledNotice(null), 3500);
    setVitalsModalAppointment(null);
  };

  // Modal Form State for adding a patient to the waitlist
  const [modalPid, setModalPid] = useState('');
  const [modalName, setModalName] = useState('');
  const [modalPhone, setModalPhone] = useState('');
  const [modalAge, setModalAge] = useState('');
  const [modalSex, setModalSex] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [modalDoctorId, setModalDoctorId] = useState(doctors[0]?.id || '');
  const [modalPriority, setModalPriority] = useState<'Normal' | 'Urgent' | 'Follow-up' | 'Senior'>('Normal');
  const [modalComplaints, setModalComplaints] = useState('');
  const [modalNote, setModalNote] = useState('');
  // Optional initial vitals in add modal
  const [modalWeight, setModalWeight] = useState('');
  const [modalBpSys, setModalBpSys] = useState('');
  const [modalBpDia, setModalBpDia] = useState('');
  const [modalTemp, setModalTemp] = useState('');
  const [modalPulse, setModalPulse] = useState('');

  // Auto-fill modal from PID
  const handleModalPidChange = (val: string) => {
    setModalPid(val);
    const matched = patients.find((p) => p.pId.toLowerCase() === val.trim().toLowerCase());
    if (matched) {
      setModalName(matched.patientName);
      if (matched.phone) setModalPhone(matched.phone);
      if (matched.age) setModalAge(matched.age);
      if (matched.sex) setModalSex(matched.sex);
    }
  };

  // KPI calculations
  const waitingList = useMemo(
    () => appointments.filter((a) => a.status === 'Waiting'),
    [appointments]
  );
  const inConsultationList = useMemo(
    () => appointments.filter((a) => a.status === 'In Consultation'),
    [appointments]
  );
  const completedList = useMemo(
    () => appointments.filter((a) => a.status === 'Completed'),
    [appointments]
  );

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => {
      // Status filter
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;

      // Doctor filter
      if (selectedDoctorId !== 'All' && item.doctorId !== selectedDoctorId) return false;

      // Priority filter
      if (priorityFilter !== 'All' && (item.priority || 'Normal') !== priorityFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const pIdMatch = item.pId?.toLowerCase().includes(query);
        const nameMatch = item.patientName.toLowerCase().includes(query);
        const phoneMatch = item.phone.toLowerCase().includes(query);
        const tokenMatch = `#${item.tokenNo}`.includes(query) || `${item.tokenNo}` === query;
        const docMatch = item.doctorName.toLowerCase().includes(query);
        if (!pIdMatch && !nameMatch && !phoneMatch && !tokenMatch && !docMatch) {
          return false;
        }
      }

      return true;
    });
  }, [appointments, statusFilter, selectedDoctorId, priorityFilter, searchTerm]);

  // Call Next Patient in Waiting Area
  const handleCallNextPatient = () => {
    const nextPatient = waitingList[0];
    if (!nextPatient) {
      setCalledNotice(
        lang === 'bn'
          ? 'ওয়েটিং এরিয়াতে বর্তমানে কোনো অপেক্ষারত রোগী নেই।'
          : 'No patients currently waiting in queue.'
      );
      setTimeout(() => setCalledNotice(null), 3500);
      return;
    }

    playChimeSound();
    onUpdateStatus(nextPatient.id, 'In Consultation');
    setCalledNotice(
      lang === 'bn'
        ? `টোকেন #${nextPatient.tokenNo} (${nextPatient.patientName}) কে ডাক্তার ${nextPatient.doctorName} এর চেম্বার (রুম ${nextPatient.roomNo}) এ কল করা হয়েছে!`
        : `Token #${nextPatient.tokenNo} (${nextPatient.patientName}) called into Dr. ${nextPatient.doctorName}'s chamber (Room ${nextPatient.roomNo})!`
    );
    setTimeout(() => setCalledNotice(null), 4500);
  };

  const handleCreateWaitlistEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalName.trim()) return;

    const docObj = doctors.find((d) => d.id === modalDoctorId) || doctors[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const hasInitialVitals = modalWeight || modalBpSys || modalTemp || modalPulse;
    const initialVitalsObj: PatientVitals | undefined = hasInitialVitals
      ? {
          weight: modalWeight ? parseFloat(modalWeight) : undefined,
          bpSystolic: modalBpSys ? parseInt(modalBpSys, 10) : undefined,
          bpDiastolic: modalBpDia ? parseInt(modalBpDia, 10) : undefined,
          temperature: modalTemp ? parseFloat(modalTemp) : undefined,
          pulse: modalPulse ? parseInt(modalPulse, 10) : undefined,
          recordedAt: nowTime,
          recordedDate: new Date().toLocaleDateString('en-GB'),
          recordedBy: 'Check-in Triage Desk',
        }
      : undefined;

    const parts: string[] = [];
    if (initialVitalsObj?.bpSystolic && initialVitalsObj?.bpDiastolic) {
      parts.push(`BP: ${initialVitalsObj.bpSystolic}/${initialVitalsObj.bpDiastolic} mmHg`);
    }
    if (initialVitalsObj?.temperature) parts.push(`Temp: ${initialVitalsObj.temperature}°F`);
    if (initialVitalsObj?.pulse) parts.push(`PR: ${initialVitalsObj.pulse} bpm`);
    if (initialVitalsObj?.weight) parts.push(`Wt: ${initialVitalsObj.weight} kg`);

    onAddAppointment({
      pId: modalPid.trim() || undefined,
      patientName: modalName.trim(),
      phone: modalPhone.trim(),
      age: modalAge.trim() || '25 Y',
      sex: modalSex,
      doctorId: docObj.id,
      doctorName: docObj.name,
      specialty: docObj.specialty,
      roomNo: docObj.roomNo || '101',
      fee: docObj.fee || 600,
      status: 'Waiting',
      time: nowTime,
      date: new Date().toLocaleDateString('en-GB'),
      chiefComplaints: modalComplaints.trim() || undefined,
      priority: modalPriority,
      waitingAreaNote: modalNote.trim() || undefined,
      checkInTime: nowTime,
      patientVitals: initialVitalsObj,
      vitals: parts.join(' | ') || undefined,
    });

    playChimeSound();
    setShowAddModal(false);
    setCalledNotice(
      lang === 'bn'
        ? `রোগী ${modalName.trim()} সফলভাবে ওয়েটিং লিস্টে যুক্ত হয়েছেন (ডাক্তার ${docObj.name})`
        : `Patient ${modalName.trim()} added to waiting area queue for Dr. ${docObj.name}`
    );
    setTimeout(() => setCalledNotice(null), 3500);

    // Reset modal fields
    setModalPid('');
    setModalName('');
    setModalPhone('');
    setModalAge('');
    setModalComplaints('');
    setModalNote('');
    setModalPriority('Normal');
    setModalWeight('');
    setModalBpSys('');
    setModalBpDia('');
    setModalTemp('');
    setModalPulse('');
  };

  return (
    <div className="space-y-6">
      {/* Called Patient Audio Notice Alert */}
      {calledNotice && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex justify-between items-center shadow-lg border border-blue-400 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/30 rounded-xl">
              <Volume2 className="w-5 h-5 text-blue-300 animate-pulse" />
            </div>
            <span>{calledNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setCalledNotice(null)}
            className="text-white/80 hover:text-white cursor-pointer ml-3 font-bold text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards: Live Waitlist Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Waiting in Area */}
        <div
          onClick={() => setStatusFilter('Waiting')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'Waiting'
              ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-400/40'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {lang === 'bn' ? 'ওয়েটিং রুমে অপেক্ষারত' : 'Waiting in Area'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              Active Queue
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-900 dark:text-amber-300 font-mono">
              {waitingList.length}
            </span>
            <span className="text-xs text-gray-500">
              {lang === 'bn' ? 'জন রোগী' : 'patients'}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {lang === 'bn' ? 'সিরিয়ালে রয়েছেন' : 'Queued for chamber entry'}
          </p>
        </div>

        {/* Currently in Doctor Chamber */}
        <div
          onClick={() => setStatusFilter('In Consultation')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'In Consultation'
              ? 'bg-blue-500/10 border-blue-500 ring-2 ring-blue-400/40'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 dark:text-blue-400 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4" />
              {lang === 'bn' ? 'ডাক্তারের চেম্বারে আছেন' : 'In Consultation'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 animate-pulse">
              Live Inside
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-900 dark:text-blue-300 font-mono">
              {inConsultationList.length}
            </span>
            <span className="text-xs text-gray-500">
              {lang === 'bn' ? 'জন পরামর্শে' : 'with doctor'}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {lang === 'bn' ? 'বর্তমানে পরামর্শ নিচ্ছেন' : 'Currently being examined'}
          </p>
        </div>

        {/* Completed Consultations Today */}
        <div
          onClick={() => setStatusFilter('Completed')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'Completed'
              ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-400/40'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              {lang === 'bn' ? 'পরামর্শ সম্পন্ন হয়েছে' : 'Completed Today'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
              Done
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-900 dark:text-emerald-300 font-mono">
              {completedList.length}
            </span>
            <span className="text-xs text-gray-500">
              {lang === 'bn' ? 'জন সম্পন্ন' : 'prescribed'}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {lang === 'bn' ? 'প্রেসক্রিপশন সহ সমাপ্ত' : 'Finished consultations'}
          </p>
        </div>

        {/* Average Waiting Time */}
        <div className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-pink-500" />
              {lang === 'bn' ? 'গড় অপেক্ষার সময়' : 'Est. Wait Time'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300">
              Real-time
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-950 dark:text-purple-200 font-mono">
              ~{Math.max(5, waitingList.length * 10)}
            </span>
            <span className="text-xs text-gray-500">
              {lang === 'bn' ? 'মিনিট' : 'mins'}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {lang === 'bn' ? 'প্রতি রোগীর জন্য ~১০ মিনিট' : '~10 min per consultation'}
          </p>
        </div>
      </div>

      {/* Main Waitlist Control Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl shadow-xs border border-purple-100 dark:border-gray-700 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Title & Quick Stats */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base sm:text-lg text-purple-950 dark:text-purple-200 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-700" />
                <span>{lang === 'bn' ? 'ওয়েটিং এরিয়া ও ওপিডি চেম্বার কিউ' : 'Waiting Area & OPD Live Waitlist'}</span>
              </h3>
              <span className="px-2.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-200 font-mono font-bold text-xs rounded-full">
                {filteredAppointments.length} {lang === 'bn' ? 'রোগী' : 'Patients'}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {lang === 'bn'
                ? 'ওয়েটিং এরিয়ায় উপস্থিত রোগীদের সিরিয়াল ট্র্যাক করুন, চেম্বারে কল করুন এবং স্ট্যাটাস পরিবর্তন করুন।'
                : 'Track waiting room presence, call patients into consultant chamber, and manage real-time OPD flow.'}
            </p>
          </div>

          {/* Prominent Action Buttons: Call Next & Add to Waitlist */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* CALL NEXT PATIENT BUTTON */}
            <button
              type="button"
              onClick={handleCallNextPatient}
              disabled={waitingList.length === 0}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition active:scale-95 cursor-pointer ${
                waitingList.length > 0
                  ? 'bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white ring-2 ring-blue-400/50'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed opacity-60'
              }`}
              title={
                lang === 'bn'
                  ? 'পরবর্তী অপেক্ষারত রোগীকে চেম্বারে প্রবেশ করার জন্য কল করুন'
                  : 'Call next waiting patient into consultant chamber'
              }
            >
              <Volume2 className="w-4 h-4 text-pink-300 animate-pulse" />
              <span>
                {lang === 'bn'
                  ? `পরবর্তী রোগীকে ডাকুন (${waitingList.length} জন অপেক্ষমান)`
                  : `Call Next Patient (${waitingList.length} Waiting)`}
              </span>
            </button>

            {/* GO TO VITALS TRACKING DASHBOARD */}
            {onNavigateToVitals && (
              <button
                type="button"
                onClick={onNavigateToVitals}
                className="px-3.5 py-2.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/60 dark:hover:bg-purple-900 text-purple-950 dark:text-purple-200 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer border border-purple-200 dark:border-purple-700"
                title={lang === 'bn' ? 'রোগীদের ভাইটালস ট্র্যাকিং ড্যাশবোর্ড' : 'Open Vitals Tracking Dashboard'}
              >
                <HeartPulse className="w-4 h-4 text-rose-500" />
                <span>{lang === 'bn' ? 'ভাইটালস ট্র্যাকিং' : 'Vitals Tracking'}</span>
              </button>
            )}

            {/* ADD PATIENT TO WAITLIST BUTTON */}
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'bn' ? 'ওয়েটিং রুমে রোগী যোগ করুন' : 'Queue Patient in Waitlist'}</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          {/* Search Box (4 cols) */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={lang === 'bn' ? 'নাম, PID, ফোন বা টোকেন দিয়ে খুঁজুন...' : 'Search by Name, PID, Phone or Token...'}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600"
            />
          </div>

          {/* Status Tabs (4 cols) */}
          <div className="lg:col-span-4 flex rounded-xl p-1 bg-slate-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs font-bold">
            {(['All', 'Waiting', 'In Consultation', 'Completed'] as const).map((st) => {
              const count =
                st === 'All'
                  ? appointments.length
                  : appointments.filter((a) => a.status === st).length;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer text-[11px] ${
                    statusFilter === st
                      ? 'bg-white dark:bg-gray-800 text-purple-950 dark:text-purple-200 shadow-xs font-black'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                  }`}
                >
                  {st === 'All'
                    ? lang === 'bn'
                      ? 'সকল'
                      : 'All'
                    : st === 'Waiting'
                    ? lang === 'bn'
                      ? 'অপেক্ষমান'
                      : 'Waiting'
                    : st === 'In Consultation'
                    ? lang === 'bn'
                      ? 'পরামর্শে'
                      : 'Consult'
                    : lang === 'bn'
                    ? 'সম্পন্ন'
                    : 'Done'}
                  <span className="ml-1 opacity-75 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Doctor Filter (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 py-2 px-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-600 cursor-pointer"
            >
              <option value="All">{lang === 'bn' ? 'সকল ডাক্তার' : 'All Doctors'}</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  Dr. {doc.name} (R: {doc.roomNo})
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 py-2 px-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-600 cursor-pointer"
            >
              <option value="All">{lang === 'bn' ? 'সকল অগ্রাধিকার' : 'All Priority'}</option>
              <option value="Urgent">🚨 {lang === 'bn' ? 'জরুরি (Urgent)' : 'Urgent'}</option>
              <option value="Senior">🧓 {lang === 'bn' ? 'জ্যেষ্ঠ নাগরিক (Senior)' : 'Senior'}</option>
              <option value="Follow-up">🔄 {lang === 'bn' ? 'ফলো-আপ (Follow-up)' : 'Follow-up'}</option>
              <option value="Normal">🟢 {lang === 'bn' ? 'সাধারণ (Normal)' : 'Normal'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Waitlist Patient Cards Grid */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700 space-y-3">
          <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-950 flex items-center justify-center mx-auto text-purple-600">
            <Users className="w-8 h-8" />
          </div>
          <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">
            {lang === 'bn' ? 'কোনো রোগী পাওয়া যায়নি' : 'No Patients Found in Current Filter'}
          </h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {lang === 'bn'
              ? 'নির্বাচিত ফিল্টারের সাথে মিলে এমন কোনো রোগী ওয়েটিং লিস্টে নেই। নতুন রোগী যোগ করতে বা ফিল্টার রিসেট করতে পারেন।'
              : 'There are no queued patients matching your current filters. Click below to add a patient or reset filters.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setSelectedDoctorId('All');
                setPriorityFilter('All');
              }}
              className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {lang === 'bn' ? 'ফিল্টার রিসেট' : 'Reset Filters'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              + {lang === 'bn' ? 'নতুন রোগী যোগ করুন' : 'Add New Patient'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAppointments.map((patientItem) => {
            const patientPId =
              patientItem.pId ||
              patients.find((p) => p.patientName.toLowerCase() === patientItem.patientName.toLowerCase())?.pId ||
              '26100294';

            const isWaiting = patientItem.status === 'Waiting';
            const isInConsultation = patientItem.status === 'In Consultation';
            const isCompleted = patientItem.status === 'Completed';

            return (
              <div
                key={patientItem.id}
                className={`rounded-2xl border p-4 sm:p-5 transition-all flex flex-col justify-between space-y-4 shadow-xs relative overflow-hidden ${
                  isInConsultation
                    ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/30'
                    : isCompleted
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 opacity-80'
                    : patientItem.priority === 'Urgent'
                    ? 'bg-red-50/50 dark:bg-red-950/20 border-red-300 dark:border-red-800'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300'
                }`}
              >
                {/* Top Row: Token Badge, Priority & Status Pill */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black shrink-0 shadow-xs ${
                        isInConsultation
                          ? 'bg-blue-700 text-white'
                          : isCompleted
                          ? 'bg-emerald-700 text-white'
                          : 'bg-purple-950 text-white'
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-wider text-purple-200 opacity-90">Token</span>
                      <span className="text-base leading-none">#{patientItem.tokenNo}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">
                          {patientItem.patientName}
                        </h4>
                        {patientPId && (
                          <span className="font-mono text-[10px] bg-purple-100 dark:bg-purple-900/80 px-1.5 py-0.2 rounded text-purple-900 dark:text-purple-200 font-bold border border-purple-200 dark:border-purple-700">
                            PID: {patientPId}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                        {patientItem.age} · {patientItem.sex} {patientItem.phone && `· ${patientItem.phone}`}
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Status Indicator Badge */}
                  <div className="flex flex-col items-end gap-1.5">
                    {isWaiting && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-900 dark:text-amber-300 border-2 border-amber-400 dark:border-amber-500/60 shadow-xs">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>{lang === 'bn' ? 'অপেক্ষারত (Waiting)' : 'Waiting'}</span>
                      </span>
                    )}

                    {isInConsultation && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-700 shadow-md">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                        <Stethoscope className="w-3.5 h-3.5 text-pink-200" />
                        <span>{lang === 'bn' ? 'পরামর্শ চলছে (In Consultation)' : 'In Consultation'}</span>
                      </span>
                    )}

                    {isCompleted && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border-2 border-emerald-500 shadow-xs">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{lang === 'bn' ? 'পরামর্শ সম্পন্ন (Completed)' : 'Completed'}</span>
                      </span>
                    )}

                    {/* Priority Tag */}
                    {patientItem.priority && patientItem.priority !== 'Normal' && (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                          patientItem.priority === 'Urgent'
                            ? 'bg-red-500 text-white animate-bounce'
                            : patientItem.priority === 'Senior'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-purple-600 text-white'
                        }`}
                      >
                        {patientItem.priority === 'Urgent' && '🚨 '}
                        {patientItem.priority}
                      </span>
                    )}
                  </div>
                </div>

                {/* Interactive Dynamic Status Switcher on Card */}
                <div className="p-1 bg-slate-100 dark:bg-gray-900/90 rounded-xl border border-slate-200 dark:border-gray-700 flex items-center gap-1 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(patientItem.id, 'Waiting')}
                    className={`flex-1 py-1 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
                      isWaiting
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs ring-1 ring-amber-600'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title={lang === 'bn' ? 'স্ট্যাটাস অপেক্ষারত করুন' : 'Mark as Waiting'}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{lang === 'bn' ? 'অপেক্ষারত' : 'Waiting'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playChimeSound();
                      onUpdateStatus(patientItem.id, 'In Consultation');
                    }}
                    className={`flex-1 py-1 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
                      isInConsultation
                        ? 'bg-blue-600 text-white font-black shadow-xs ring-1 ring-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title={lang === 'bn' ? 'স্ট্যাটাস চেম্বারে পরামর্শ চলছে করুন' : 'Mark as In Consultation'}
                  >
                    <Stethoscope className="w-3 h-3" />
                    <span>{lang === 'bn' ? 'পরামর্শে' : 'Consulting'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateStatus(patientItem.id, 'Completed')}
                    className={`flex-1 py-1 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-600 text-white font-black shadow-xs ring-1 ring-emerald-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title={lang === 'bn' ? 'স্ট্যাটাস পরামর্শ সম্পন্ন করুন' : 'Mark as Completed'}
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>{lang === 'bn' ? 'সম্পন্ন' : 'Completed'}</span>
                  </button>
                </div>

                {/* Doctor & Room Info Box */}
                <div className="p-3 bg-slate-50 dark:bg-gray-900/60 rounded-xl border border-slate-200 dark:border-gray-700/60 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-purple-950 dark:text-purple-200">
                      <DoorOpen className="w-3.5 h-3.5 text-purple-600" />
                      <span>Dr. {patientItem.doctorName}</span>
                    </div>
                    <span className="font-mono font-bold text-[11px] px-2 py-0.5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-purple-900 dark:text-purple-300">
                      Room {patientItem.roomNo}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>{patientItem.specialty}</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      Fee: ৳{patientItem.fee} (Paid)
                    </span>
                  </div>

                  {/* Complaints */}
                  {patientItem.chiefComplaints && (
                    <div className="pt-1 border-t border-slate-200/60 dark:border-gray-700/60 text-[11px] text-slate-600 dark:text-slate-400">
                      <strong className="text-slate-700 dark:text-slate-300">লক্ষণ:</strong> {patientItem.chiefComplaints}
                    </div>
                  )}

                  {/* Waiting Area Special Note */}
                  {patientItem.waitingAreaNote && (
                    <div className="text-[10px] text-amber-800 dark:text-amber-300 italic bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                      {patientItem.waitingAreaNote}
                    </div>
                  )}
                </div>

                {/* Vitals Tracking Section on Waitlist Patient Card */}
                {patientItem.patientVitals &&
                (patientItem.patientVitals.weight !== undefined ||
                  patientItem.patientVitals.bpSystolic !== undefined ||
                  patientItem.patientVitals.temperature !== undefined ||
                  patientItem.patientVitals.pulse !== undefined) ? (
                  <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="flex items-center gap-1 text-purple-950 dark:text-purple-200">
                        <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                        <span>{lang === 'bn' ? 'রোগীর ভাইটালস (Vitals):' : 'Patient Vitals:'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenQuickVitals(patientItem)}
                        className="text-[10px] text-purple-700 hover:text-purple-900 dark:text-purple-300 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                        title={lang === 'bn' ? 'ভাইটালস পরিবর্তন বা সম্পাদন করুন' : 'Edit Vitals'}
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                        <span>{lang === 'bn' ? 'এডিট' : 'Edit'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      {/* 1. Weight */}
                      <div className="p-1 rounded-lg bg-white dark:bg-gray-800 border border-purple-100 dark:border-gray-700 shadow-2xs">
                        <div className="text-[9px] text-gray-500 font-semibold">{lang === 'bn' ? 'ওজন' : 'Weight'}</div>
                        <div className="font-mono font-bold text-[11px] text-indigo-700 dark:text-indigo-300">
                          {patientItem.patientVitals.weight !== undefined ? `${patientItem.patientVitals.weight}kg` : '--'}
                        </div>
                      </div>

                      {/* 2. Blood Pressure */}
                      <div
                        className={`p-1 rounded-lg border shadow-2xs ${
                          (patientItem.patientVitals.bpSystolic && patientItem.patientVitals.bpSystolic >= 140) ||
                          (patientItem.patientVitals.bpDiastolic && patientItem.patientVitals.bpDiastolic >= 90)
                            ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                            : 'bg-white dark:bg-gray-800 border-purple-100 dark:border-gray-700'
                        }`}
                      >
                        <div className="text-[9px] text-gray-500 font-semibold">{lang === 'bn' ? 'রক্তচাপ (BP)' : 'BP'}</div>
                        <div className="font-mono font-bold text-[11px] text-rose-600 dark:text-rose-400">
                          {patientItem.patientVitals.bpSystolic && patientItem.patientVitals.bpDiastolic
                            ? `${patientItem.patientVitals.bpSystolic}/${patientItem.patientVitals.bpDiastolic}`
                            : '--'}
                        </div>
                      </div>

                      {/* 3. Temperature */}
                      <div
                        className={`p-1 rounded-lg border shadow-2xs ${
                          patientItem.patientVitals.temperature && patientItem.patientVitals.temperature >= 100
                            ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                            : 'bg-white dark:bg-gray-800 border-purple-100 dark:border-gray-700'
                        }`}
                      >
                        <div className="text-[9px] text-gray-500 font-semibold">{lang === 'bn' ? 'তাপমাত্রা' : 'Temp'}</div>
                        <div className="font-mono font-bold text-[11px] text-amber-600 dark:text-amber-400">
                          {patientItem.patientVitals.temperature !== undefined ? `${patientItem.patientVitals.temperature}°F` : '--'}
                        </div>
                      </div>

                      {/* 4. Pulse */}
                      <div className="p-1 rounded-lg bg-white dark:bg-gray-800 border border-purple-100 dark:border-gray-700 shadow-2xs">
                        <div className="text-[9px] text-gray-500 font-semibold">{lang === 'bn' ? 'পালস' : 'Pulse'}</div>
                        <div className="font-mono font-bold text-[11px] text-pink-600 dark:text-pink-400">
                          {patientItem.patientVitals.pulse !== undefined ? `${patientItem.patientVitals.pulse}bpm` : '--'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{lang === 'bn' ? 'ভাইটালস বাকি (ওজন/বিপি)' : 'Vitals Pending'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenQuickVitals(patientItem)}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-[10px] cursor-pointer transition shadow-2xs flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{lang === 'bn' ? 'মাপুন' : 'Record Vitals'}</span>
                    </button>
                  </div>
                )}

                {/* Timestamps & Card Link Actions */}
                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span>Check-in: {patientItem.time}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* View Patient History */}
                    <button
                      type="button"
                      onClick={() => onOpenHistory(patientPId)}
                      className="p-1 text-purple-700 hover:text-purple-900 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 rounded cursor-pointer transition"
                      title={lang === 'bn' ? 'রোগীর পূর্ববর্তী ভিজিট ও হিস্ট্রি দেখুন' : 'View history'}
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>

                    {/* Complete Patient Overview */}
                    <button
                      type="button"
                      onClick={() => onOpenOverview(patientPId)}
                      className="p-1 text-indigo-700 hover:text-indigo-900 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded cursor-pointer transition"
                      title={lang === 'bn' ? 'রোগী সম্পূর্ণ ওভারভিউ' : 'Complete Overview'}
                    >
                      <User className="w-3.5 h-3.5" />
                    </button>

                    {/* Shift Handover Note */}
                    <button
                      type="button"
                      onClick={() =>
                        onSendToHandover({
                          pId: patientPId,
                          patientName: patientItem.patientName,
                          age: patientItem.age,
                          sex: patientItem.sex,
                          chiefComplaints: patientItem.chiefComplaints,
                        })
                      }
                      className="p-1 text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950 rounded cursor-pointer transition"
                      title={lang === 'bn' ? 'শিফট হ্যান্ডওভার' : 'Shift Handover'}
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Primary Action Controls Row */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-1.5 flex-wrap">
                  {/* Write / Edit Prescription */}
                  <button
                    type="button"
                    onClick={() => onOpenRxModal(patientItem)}
                    className="px-2.5 py-1.5 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white font-black rounded-xl text-[11px] flex items-center gap-1 shadow-xs cursor-pointer transition active:scale-95"
                    title={lang === 'bn' ? 'প্রেসক্রিপশন ও ওষুধের তালিকা লিখুন' : 'Write Rx Prescription'}
                  >
                    <Stethoscope className="w-3 h-3 text-pink-300" />
                    <span>Rx প্রেসক্রিপশন</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Status Changer: Waiting -> In Consultation */}
                    {isWaiting && (
                      <button
                        type="button"
                        onClick={() => {
                          playChimeSound();
                          onUpdateStatus(patientItem.id, 'In Consultation');
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-[11px] flex items-center gap-1 shadow-xs cursor-pointer transition active:scale-95"
                        title={lang === 'bn' ? 'রোগীকে চেম্বারে ডাকুন' : 'Call patient into doctor chamber'}
                      >
                        <Volume2 className="w-3 h-3 text-blue-200" />
                        <span>{lang === 'bn' ? 'চেম্বারে ডাকুন' : 'Call In'}</span>
                      </button>
                    )}

                    {/* Status Changer: In Consultation -> Finish Consultation */}
                    {isInConsultation && (
                      <>
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(patientItem.id, 'Waiting')}
                          className="px-2 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-[10px] cursor-pointer"
                          title={lang === 'bn' ? 'ওয়েটিং রুমে ফেরত পাঠান' : 'Return to Waiting'}
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onFinishAppointment(patientItem)}
                          className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black rounded-xl text-[11px] flex items-center gap-1 shadow-sm cursor-pointer transition active:scale-95 ring-1 ring-emerald-300"
                          title={lang === 'bn' ? 'পরামর্শ সম্পন্ন করুন ও প্রেসক্রিপশন প্রিন্ট করুন' : 'Finish & auto-print Rx'}
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-200" />
                          <span>{lang === 'bn' ? 'পরামর্শ সমাপ্ত' : 'Finish'}</span>
                        </button>
                      </>
                    )}

                    {/* Status Changer: Completed -> Print / Reopen */}
                    {isCompleted && (
                      <button
                        type="button"
                        onClick={() => onFinishAppointment(patientItem)}
                        className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-bold rounded-xl text-[11px] flex items-center gap-1 cursor-pointer transition"
                        title={lang === 'bn' ? 'প্রেসক্রিপশন প্রিন্ট করুন' : 'Print Rx Prescription'}
                      >
                        <Printer className="w-3 h-3 text-emerald-700 dark:text-emerald-300" />
                        <span>{lang === 'bn' ? 'প্রিন্ট' : 'Print Rx'}</span>
                      </button>
                    )}

                    {/* Cancel / Remove option */}
                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(patientItem.id, 'Cancelled')}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
                        title={lang === 'bn' ? 'সিরিয়াল বাতিল করুন' : 'Cancel appointment'}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Queue New Patient into Waiting Area */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-purple-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 px-5 py-3.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-300" />
                <h3 className="font-bold text-sm">
                  {lang === 'bn' ? 'ওয়েটিং রুমে রোগী যুক্ত করুন' : 'Queue Patient in Waiting Area'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateWaitlistEntry} className="p-5 space-y-3.5 text-xs">
              {/* PID Field */}
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'bn' ? 'রোগী আইডি (PID) — স্বয়ংক্রিয় তথ্য পূরণের জন্য:' : 'Patient ID (PID) — For Auto-fill:'}
                </label>
                <input
                  type="text"
                  value={modalPid}
                  onChange={(e) => handleModalPidChange(e.target.value)}
                  placeholder="e.g. 26100294"
                  className="w-full bg-purple-50/60 dark:bg-gray-900 border border-purple-300 dark:border-purple-700 p-2 rounded-xl text-xs font-mono font-bold text-purple-950 dark:text-purple-200 focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Patient Name */}
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'bn' ? 'রোগীর পূর্ণ নাম *:' : 'Patient Full Name *:'}
                </label>
                <input
                  type="text"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  placeholder="Patient Name"
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
                  required
                />
              </div>

              {/* Phone & Age */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    {lang === 'bn' ? 'ফোন নম্বর:' : 'Phone Number:'}
                  </label>
                  <input
                    type="text"
                    value={modalPhone}
                    onChange={(e) => setModalPhone(e.target.value)}
                    placeholder="01712000000"
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded-xl text-xs font-mono focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    {lang === 'bn' ? 'বয়স:' : 'Age:'}
                  </label>
                  <input
                    type="text"
                    value={modalAge}
                    onChange={(e) => setModalAge(e.target.value)}
                    placeholder="25 Y"
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              {/* Sex & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    {lang === 'bn' ? 'লিঙ্গ:' : 'Gender:'}
                  </label>
                  <select
                    value={modalSex}
                    onChange={(e) => setModalSex(e.target.value as any)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="Male">{lang === 'bn' ? 'পুরুষ (Male)' : 'Male'}</option>
                    <option value="Female">{lang === 'bn' ? 'নারী (Female)' : 'Female'}</option>
                    <option value="Other">{lang === 'bn' ? 'অন্যান্য (Other)' : 'Other'}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    {lang === 'bn' ? 'অগ্রাধিকার:' : 'Priority:'}
                  </label>
                  <select
                    value={modalPriority}
                    onChange={(e) => setModalPriority(e.target.value as any)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="Normal">🟢 {lang === 'bn' ? 'সাধারণ (Normal)' : 'Normal'}</option>
                    <option value="Urgent">🚨 {lang === 'bn' ? 'জরুরি (Urgent)' : 'Urgent'}</option>
                    <option value="Senior">🧓 {lang === 'bn' ? 'জ্যেষ্ঠ নাগরিক (Senior)' : 'Senior'}</option>
                    <option value="Follow-up">🔄 {lang === 'bn' ? 'ফলো-আপ (Follow-up)' : 'Follow-up'}</option>
                  </select>
                </div>
              </div>

              {/* Doctor Selector */}
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'bn' ? 'কনসালট্যান্ট ডাক্তার:' : 'Consultant Doctor:'}
                </label>
                <select
                  value={modalDoctorId}
                  onChange={(e) => setModalDoctorId(e.target.value)}
                  className="w-full bg-purple-50 dark:bg-gray-900 border-2 border-purple-200 dark:border-purple-800 p-2 rounded-xl text-xs font-bold text-purple-950 dark:text-purple-200 focus:outline-none cursor-pointer"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.name} — {d.specialty} (Room {d.roomNo}) · ৳{d.fee}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chief Complaints */}
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'bn' ? 'প্রধান সমস্যা / উপসর্গ:' : 'Chief Complaints:'}
                </label>
                <input
                  type="text"
                  value={modalComplaints}
                  onChange={(e) => setModalComplaints(e.target.value)}
                  placeholder="e.g. Chest pain, high fever, abdominal cramps"
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded-xl text-xs focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Initial Vitals Intake (Optional) */}
              <div className="p-3 bg-purple-50/50 dark:bg-gray-900/60 rounded-xl border border-purple-100 dark:border-gray-700 space-y-2">
                <div className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1 text-[11px]">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                  <span>{lang === 'bn' ? 'প্রাথমিক ভাইটালস পরিমাপ (ঐচ্ছিক):' : 'Initial Vitals Intake (Optional):'}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">{lang === 'bn' ? 'ওজন (kg)' : 'Weight (kg)'}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={modalWeight}
                      onChange={(e) => setModalWeight(e.target.value)}
                      placeholder="68"
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-1.5 rounded-lg text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">{lang === 'bn' ? 'রক্তচাপ (Sys)' : 'BP Sys'}</label>
                    <input
                      type="number"
                      value={modalBpSys}
                      onChange={(e) => setModalBpSys(e.target.value)}
                      placeholder="120"
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-1.5 rounded-lg text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">{lang === 'bn' ? 'রক্তচাপ (Dia)' : 'BP Dia'}</label>
                    <input
                      type="number"
                      value={modalBpDia}
                      onChange={(e) => setModalBpDia(e.target.value)}
                      placeholder="80"
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-1.5 rounded-lg text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">{lang === 'bn' ? 'তাপমাত্রা (°F)' : 'Temp (°F)'}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={modalTemp}
                      onChange={(e) => setModalTemp(e.target.value)}
                      placeholder="98.6"
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-1.5 rounded-lg text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Waiting Area Note */}
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'bn' ? 'ওয়েটিং রুমের বিশেষ নোট (ঐচ্ছিক):' : 'Waiting Area Note (Optional):'}
                </label>
                <input
                  type="text"
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  placeholder="e.g. Needs wheelchair assistance, sample given to lab"
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded-xl text-xs focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold cursor-pointer transition"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-md cursor-pointer transition active:scale-95 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'কিউতে যুক্ত করুন' : 'Confirm & Queue'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Vitals Modal for Waitlist Patient Card */}
      {vitalsModalAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-purple-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 px-5 py-3.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-400" />
                <div>
                  <h3 className="font-bold text-sm">
                    {lang === 'bn' ? 'রোগীর ভাইটাল সাইন রেকর্ড' : 'Record Patient Vitals'}
                  </h3>
                  <p className="text-[10px] text-purple-200">
                    Token #{vitalsModalAppointment.tokenNo} · {vitalsModalAppointment.patientName} ({vitalsModalAppointment.age})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVitalsModalAppointment(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveQuickVitals} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* 1. Weight */}
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{lang === 'bn' ? 'ওজন (Weight):' : 'Weight (kg):'}</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={quickWeight}
                      onChange={(e) => setQuickWeight(e.target.value)}
                      placeholder="e.g. 68"
                      className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 py-2 pl-3 pr-8 rounded-xl font-mono font-bold focus:outline-none focus:border-indigo-600 text-xs"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-gray-400 font-bold">kg</span>
                  </div>
                </div>

                {/* 2. Temperature */}
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                    <span>{lang === 'bn' ? 'তাপমাত্রা:' : 'Temp (°F):'}</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={quickTemp}
                      onChange={(e) => setQuickTemp(e.target.value)}
                      placeholder="98.6"
                      className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 py-2 pl-3 pr-8 rounded-xl font-mono font-bold focus:outline-none focus:border-amber-500 text-xs"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-gray-400 font-bold">°F</span>
                  </div>
                </div>

                {/* 3. Blood Pressure: Systolic & Diastolic */}
                <div className="col-span-2">
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-rose-500" />
                    <span>{lang === 'bn' ? 'রক্তচাপ (Blood Pressure - mmHg):' : 'Blood Pressure (mmHg):'}</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        value={quickBpSys}
                        onChange={(e) => setQuickBpSys(e.target.value)}
                        placeholder="Sys (120)"
                        className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 py-2 pl-3 pr-10 rounded-xl font-mono font-bold focus:outline-none focus:border-rose-500 text-xs"
                      />
                      <span className="absolute right-2 top-2 text-[9px] text-gray-400 font-bold">SYS</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={quickBpDia}
                        onChange={(e) => setQuickBpDia(e.target.value)}
                        placeholder="Dia (80)"
                        className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 py-2 pl-3 pr-10 rounded-xl font-mono font-bold focus:outline-none focus:border-rose-500 text-xs"
                      />
                      <span className="absolute right-2 top-2 text-[9px] text-gray-400 font-bold">DIA</span>
                    </div>
                  </div>
                </div>

                {/* 4. Pulse & SpO2 */}
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <HeartPulse className="w-3.5 h-3.5 text-pink-500" />
                    <span>{lang === 'bn' ? 'পালস (bpm):' : 'Pulse (bpm):'}</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={quickPulse}
                      onChange={(e) => setQuickPulse(e.target.value)}
                      placeholder="76"
                      className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 py-2 pl-3 pr-10 rounded-xl font-mono font-bold focus:outline-none focus:border-pink-500 text-xs"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-gray-400 font-bold">bpm</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    <span>SpO2 (Oxygen %):</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={quickSpO2}
                      onChange={(e) => setQuickSpO2(e.target.value)}
                      placeholder="98"
                      className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 py-2 pl-3 pr-8 rounded-xl font-mono font-bold focus:outline-none focus:border-blue-500 text-xs"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-gray-400 font-bold">%</span>
                  </div>
                </div>

                {/* Notes */}
                <div className="col-span-2">
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    {lang === 'bn' ? 'ট্রায়াজ নোট / বিশেষ মন্তব্য:' : 'Triage Note:'}
                  </label>
                  <input
                    type="text"
                    value={quickNotes}
                    onChange={(e) => setQuickNotes(e.target.value)}
                    placeholder={lang === 'bn' ? 'যেমন: শ্বাসকষ্ট, মাথা ঘোরা' : 'e.g. Mild dizziness, fasting'}
                    className="w-full bg-slate-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded-xl text-xs focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setVitalsModalAppointment(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold cursor-pointer transition"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-900 hover:to-indigo-900 text-white rounded-xl font-black shadow-md cursor-pointer transition active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-300" />
                  <span>{lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Vitals'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
