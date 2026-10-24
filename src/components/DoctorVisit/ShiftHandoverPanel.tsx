import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ShiftHandoverNote, PatientHandoverItem, ShiftType } from '../../types';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  Filter,
  User,
  Calendar,
  FileText,
  Printer,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Trash2,
  Edit3,
  CheckSquare,
  ShieldAlert,
  Activity,
  ArrowRight,
  ClipboardList,
  Flame,
  X,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

interface ShiftHandoverPanelProps {
  onBackToQueue?: () => void;
  preSelectedPatient?: {
    pId: string;
    patientName: string;
    age: string;
    sex: 'Male' | 'Female' | 'Other';
    chiefComplaints?: string;
  } | null;
  onClearPreSelectedPatient?: () => void;
}

export const ShiftHandoverPanel: React.FC<ShiftHandoverPanelProps> = ({
  onBackToQueue,
  preSelectedPatient,
  onClearPreSelectedPatient,
}) => {
  const {
    shiftHandovers,
    addShiftHandover,
    updateShiftHandover,
    acknowledgeShiftHandover,
    deleteShiftHandover,
    doctors,
    clinicConfig,
    lang,
    t,
    openPatientOverviewModal,
    currentUser,
    patients,
  } = useApp();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [shiftFilter, setShiftFilter] = useState<'All' | ShiftType>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'Critical' | 'Unacknowledged'>('All');
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({
    'handover-1': true,
  });

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAckModalOpen, setIsAckModalOpen] = useState(false);
  const [selectedHandoverForAck, setSelectedHandoverForAck] = useState<ShiftHandoverNote | null>(null);
  const [ackDoctorName, setAckDoctorName] = useState('');
  const [ackNotes, setAckNotes] = useState('');
  const [printPreviewNote, setPrintPreviewNote] = useState<ShiftHandoverNote | null>(null);

  // New Handover Form State
  const getCurrentShift = (): ShiftType => {
    const hour = new Date().getHours();
    if (hour >= 8 && hour < 14) return 'Morning';
    if (hour >= 14 && hour < 20) return 'Evening';
    return 'Night';
  };

  const [formShiftType, setFormShiftType] = useState<ShiftType>(getCurrentShift());
  const [formShiftDate, setFormShiftDate] = useState(() => {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
  });
  const [formShiftTime, setFormShiftTime] = useState(() => {
    const hour = new Date().getHours();
    if (hour >= 8 && hour < 14) return '08:00 AM - 02:00 PM';
    if (hour >= 14 && hour < 20) return '02:00 PM - 08:00 PM';
    return '08:00 PM - 08:00 AM';
  });
  const [formOutgoingDocId, setFormOutgoingDocId] = useState(doctors[0]?.id || 'doc-1');
  const [formIncomingDocId, setFormIncomingDocId] = useState(doctors[1]?.id || 'doc-2');
  const [formSummary, setFormSummary] = useState('');
  const [formPatientItems, setFormPatientItems] = useState<PatientHandoverItem[]>(() => {
    if (preSelectedPatient) {
      return [
        {
          id: `pt-ho-${Date.now()}`,
          pId: preSelectedPatient.pId,
          patientName: preSelectedPatient.patientName,
          age: preSelectedPatient.age,
          sex: preSelectedPatient.sex,
          bedOrChamber: 'Observation Bay',
          conditionStatus: 'Guarded',
          priority: 'High',
          criticalChanges: preSelectedPatient.chiefComplaints ? `Complaints: ${preSelectedPatient.chiefComplaints}` : 'Acute condition requires next shift monitoring.',
          urgentFollowUps: 'Check vitals every 30 mins and review pending diagnostics.',
          pendingInvestigations: ['Complete Blood Count (CBC)'],
          resolved: false,
        },
      ];
    }
    return [
      {
        id: `pt-ho-${Date.now()}`,
        pId: '26100294',
        patientName: 'Titly',
        age: '24 Y',
        sex: 'Female',
        bedOrChamber: 'Observation Bed 1',
        conditionStatus: 'Guarded',
        priority: 'High',
        criticalChanges: 'Persistent epigastric discomfort, BP 135/88 mmHg, SpO2 97%.',
        urgentFollowUps: 'Follow up repeat Troponin-I and notify surgeon if tenderness increases.',
        pendingInvestigations: ['Serum Amylase & Lipase', 'Repeat ECG'],
        resolved: false,
      },
    ];
  });

  // When preSelectedPatient changes, auto-open modal if needed
  React.useEffect(() => {
    if (preSelectedPatient) {
      setIsCreateModalOpen(true);
      setFormPatientItems([
        {
          id: `pt-ho-${Date.now()}`,
          pId: preSelectedPatient.pId,
          patientName: preSelectedPatient.patientName,
          age: preSelectedPatient.age,
          sex: preSelectedPatient.sex,
          bedOrChamber: 'OPD Chamber / Bay',
          conditionStatus: 'Guarded',
          priority: 'High',
          criticalChanges: preSelectedPatient.chiefComplaints ? `Reported: ${preSelectedPatient.chiefComplaints}` : 'Status change observed in OPD.',
          urgentFollowUps: 'Monitor closely and review investigation results.',
          pendingInvestigations: [],
          resolved: false,
        },
      ]);
    }
  }, [preSelectedPatient]);

  const toggleExpand = (id: string) => {
    setExpandedNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Quick SBAR Template Helper
  const applyQuickTemplate = (index: number, templateType: string) => {
    const templates: Record<string, { changes: string; followUp: string; status: PatientHandoverItem['conditionStatus']; priority: PatientHandoverItem['priority']; tests: string[] }> = {
      cardiac: {
        changes: 'Chest tightness radiating to left arm. Transient BP spike (165/95). Sublingual nitroglycerin given.',
        followUp: 'Check repeat Troponin-I at 2 hours. Serial ECG if pain recurs. Strict bed rest & cardiology review.',
        status: 'Critical',
        priority: 'Stat',
        tests: ['Troponin-I (Stat)', 'Repeat 12-lead ECG', 'Serum Electrolytes'],
      },
      respiratory: {
        changes: 'Acute wheezing and bronchospasm. SpO2 dropped to 91% on room air. Nebulized with Salbutamol+Ipratropium.',
        followUp: 'Keep on 2L nasal cannula. Auscultate chest every hour. If wheeze persists, add Hydrocortisone IV.',
        status: 'Guarded',
        priority: 'High',
        tests: ['Chest X-Ray P/A', 'Complete Blood Count (CBC)'],
      },
      fever: {
        changes: 'High-grade fever (103°F) with severe chills and frontal headache. Platelet count showing downward trend.',
        followUp: 'Maintain fluid balance chart. Check Dengue NS1 & CBC report. Tepid sponging & Tab Paracetamol.',
        status: 'Guarded',
        priority: 'High',
        tests: ['Dengue NS1 Antigen', 'CBC with Platelet count'],
      },
      diabetic: {
        changes: 'Fasting glucose was 16.2 mmol/L with urine ketones trace. Received 6 units subcutaneous regular insulin.',
        followUp: 'Recheck capillary blood glucose in 2 hours. Ensure diabetic meal consumed. Watch for hypoglycemia.',
        status: 'Stable',
        priority: 'Normal',
        tests: ['Random Blood Sugar (RBS)', 'Serum Creatinine'],
      },
    };

    const tpl = templates[templateType];
    if (!tpl) return;

    setFormPatientItems((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = {
          ...copy[index],
          conditionStatus: tpl.status,
          priority: tpl.priority,
          criticalChanges: tpl.changes,
          urgentFollowUps: tpl.followUp,
          pendingInvestigations: tpl.tests,
        };
      }
      return copy;
    });
  };

  // Add new patient item to handover form
  const handleAddPatientRow = () => {
    setFormPatientItems((prev) => [
      ...prev,
      {
        id: `pt-ho-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        pId: '',
        patientName: '',
        age: '',
        sex: 'Female',
        bedOrChamber: 'Observation Bed',
        conditionStatus: 'Guarded',
        priority: 'High',
        criticalChanges: '',
        urgentFollowUps: '',
        pendingInvestigations: [],
        resolved: false,
      },
    ]);
  };

  const handleRemovePatientRow = (index: number) => {
    if (formPatientItems.length <= 1) return;
    setFormPatientItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePatientRowChange = (index: number, field: keyof PatientHandoverItem, value: any) => {
    setFormPatientItems((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], [field]: value };
      }
      return copy;
    });
  };

  const handlePatientLookup = (index: number, pidValue: string) => {
    handlePatientRowChange(index, 'pId', pidValue);
    const matched = patients.find((p) => p.pId.toLowerCase() === pidValue.trim().toLowerCase());
    if (matched) {
      handlePatientRowChange(index, 'patientName', matched.patientName);
      if (matched.age) handlePatientRowChange(index, 'age', matched.age);
      if (matched.sex) handlePatientRowChange(index, 'sex', matched.sex);
    }
  };

  const handleCreateHandoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const outDoc = doctors.find((d) => d.id === formOutgoingDocId) || doctors[0];
    const inDoc = doctors.find((d) => d.id === formIncomingDocId) || doctors[1];

    const validPatients = formPatientItems.filter((p) => p.patientName.trim().length > 0);
    if (validPatients.length === 0) {
      addNotification(
        lang === 'bn' ? 'রোগীর বিবরণ প্রয়োজন' : 'Patient Record Required',
        lang === 'bn' ? 'অনুগ্রহ করে অন্তত একজন রোগীর বিবরণ দিন।' : 'Please provide at least one patient record.',
        'warn'
      );
      return;
    }

    const newNote = addShiftHandover({
      shiftType: formShiftType,
      shiftDate: formShiftDate,
      shiftTime: formShiftTime,
      outgoingDoctorId: outDoc.id,
      outgoingDoctorName: outDoc.name,
      incomingDoctorId: inDoc?.id,
      incomingDoctorName: inDoc?.name || 'On-Duty Clinical Team',
      summary: formSummary.trim() || `${formShiftType} shift clinical handover completed with ${validPatients.length} critical/observed patient(s).`,
      wardStatus: {
        totalPatientsSeen: validPatients.length + 15,
        observationCount: validPatients.length,
        criticalCount: validPatients.filter((p) => p.priority === 'Stat' || p.conditionStatus === 'Critical').length,
        transferredCount: 0,
      },
      patientHandovers: validPatients,
      acknowledged: false,
    });

    setIsCreateModalOpen(false);
    setExpandedNotes((prev) => ({ ...prev, [newNote.id]: true }));
    if (onClearPreSelectedPatient) onClearPreSelectedPatient();
  };

  const handleOpenAcknowledge = (handover: ShiftHandoverNote) => {
    setSelectedHandoverForAck(handover);
    setAckDoctorName(currentUser?.fullName || handover.incomingDoctorName || doctors[0]?.name || '');
    setAckNotes(lang === 'bn' ? 'সকল রোগীর বর্তমান অবস্থা ও জরুরি ফলো-আপ নোট বুঝে নিলাম।' : 'Shift verified and all critical follow-up items acknowledged.');
    setIsAckModalOpen(true);
  };

  const handleConfirmAcknowledge = () => {
    if (!selectedHandoverForAck) return;
    acknowledgeShiftHandover(
      selectedHandoverForAck.id,
      ackDoctorName.trim() || 'On-Duty Medical Officer',
      ackNotes.trim()
    );
    setIsAckModalOpen(false);
    setSelectedHandoverForAck(null);
  };

  const handleTogglePatientResolved = (handoverId: string, patientHoId: string, currentResolved: boolean) => {
    const handover = shiftHandovers.find((h) => h.id === handoverId);
    if (!handover) return;
    const updatedPatients = handover.patientHandovers.map((p) =>
      p.id === patientHoId ? { ...p, resolved: !currentResolved } : p
    );
    updateShiftHandover(handoverId, { patientHandovers: updatedPatients });
  };

  // Filtered Handovers
  const filteredHandovers = useMemo(() => {
    return shiftHandovers.filter((h) => {
      // Shift Type Filter
      if (shiftFilter !== 'All' && h.shiftType !== shiftFilter) return false;

      // Priority Filter
      if (priorityFilter === 'Unacknowledged' && h.acknowledged) return false;
      if (priorityFilter === 'Critical') {
        const hasCritical = h.patientHandovers.some(
          (p) => p.priority === 'Stat' || p.conditionStatus === 'Critical'
        );
        if (!hasCritical) return false;
      }

      // Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSummary = h.summary.toLowerCase().includes(q);
        const matchDoctors =
          h.outgoingDoctorName.toLowerCase().includes(q) ||
          (h.incomingDoctorName && h.incomingDoctorName.toLowerCase().includes(q));
        const matchPatients = h.patientHandovers.some(
          (p) =>
            p.patientName.toLowerCase().includes(q) ||
            p.pId.toLowerCase().includes(q) ||
            p.criticalChanges.toLowerCase().includes(q) ||
            p.urgentFollowUps.toLowerCase().includes(q)
        );
        return matchSummary || matchDoctors || matchPatients;
      }

      return true;
    });
  }, [shiftHandovers, shiftFilter, priorityFilter, searchQuery]);

  // Overall statistics
  const totalNotes = shiftHandovers.length;
  const unacknowledgedCount = shiftHandovers.filter((h) => !h.acknowledged).length;
  const totalCriticalPatients = shiftHandovers.reduce((acc, h) => {
    return (
      acc +
      h.patientHandovers.filter((p) => (p.priority === 'Stat' || p.conditionStatus === 'Critical') && !p.resolved).length
    );
  }, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Shift Handover Header Banner & Active Shift Status */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-purple-800/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-500/30 text-pink-200 border border-pink-400/40 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-pink-300" />
                <span>{lang === 'bn' ? 'লাইভ ডিউটি শিফট' : 'Live Shift'}: {getCurrentShift()}</span>
              </span>
              {totalCriticalPatients > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600/40 text-red-200 border border-red-500/50 flex items-center gap-1 animate-pulse">
                  <Flame className="w-3 h-3 text-red-400" />
                  <span>{totalCriticalPatients} {lang === 'bn' ? 'ক্রিটিক্যাল রোগী' : 'Critical Patient(s)'}</span>
                </span>
              )}
            </div>
            <h2 className="text-xl font-black flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-pink-400" />
              <span>{lang === 'bn' ? 'ডাক্তার শিফট হ্যান্ডওভার কনসোল' : 'Doctor Shift Handover Console'}</span>
            </h2>
            <p className="text-xs text-purple-200/90 max-w-2xl leading-relaxed">
              {lang === 'bn'
                ? 'পরবর্তী শিফটের অন-ডিউটি ডাক্তারদের জন্য রোগীর জরুরি পরিবর্তন, ক্রিটিক্যাল ল্যাব টেস্ট এবং আবশ্যক ফলো-আপের ডিজিটাল রেকর্ড ও সিগনেচার সাইন-অফ।'
                : 'Clinical SBAR shift handoff system for leaving concise notes on acute patient status changes, stat investigations, and urgent handoffs between shifts.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'bn' ? 'নতুন হ্যান্ডওভার নোট' : 'New Handover Note'}</span>
            </button>

            {onBackToQueue && (
              <button
                type="button"
                onClick={onBackToQueue}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>{lang === 'bn' ? 'ওপিডি কিউতে ফিরুন' : 'Back to Queue'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick KPI Stat Counter */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10 text-xs">
          <div className="bg-white/10 rounded-xl p-2.5">
            <p className="text-[11px] text-purple-200">{lang === 'bn' ? 'মোট শিফট নোট' : 'Total Handover Notes'}</p>
            <p className="text-lg font-black">{totalNotes}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5">
            <p className="text-[11px] text-amber-200">{lang === 'bn' ? 'অপেক্ষমান সাইন-অফ' : 'Pending Receipt'}</p>
            <p className="text-lg font-black text-amber-300">{unacknowledgedCount}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5">
            <p className="text-[11px] text-red-200">{lang === 'bn' ? 'জরুরি স্ট্যাট রোগী' : 'Critical / Stat'}</p>
            <p className="text-lg font-black text-red-300">{totalCriticalPatients}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5">
            <p className="text-[11px] text-emerald-200">{lang === 'bn' ? 'বর্তমান সময়' : 'System Time'}</p>
            <p className="text-sm font-bold mt-1 font-mono text-emerald-300">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xs border border-purple-100 dark:border-gray-700">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'bn'
                ? 'রোগীর নাম, PID বা লক্ষণ খুঁজুন...'
                : 'Search patient name, PID, doctor...'
            }
            className="w-full pl-9 pr-3 py-2 bg-purple-50/50 dark:bg-gray-900 border border-purple-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:border-purple-600"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Shift Filter */}
          <div className="flex rounded-xl bg-purple-50 dark:bg-gray-900 p-1 border border-purple-200 dark:border-gray-700 text-xs">
            {(['All', 'Morning', 'Evening', 'Night'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setShiftFilter(s)}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  shiftFilter === s
                    ? 'bg-purple-900 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-purple-900'
                }`}
              >
                {s === 'All' ? (lang === 'bn' ? 'সকল' : 'All') : s}
              </button>
            ))}
          </div>

          {/* Priority Quick Filter */}
          <div className="flex rounded-xl bg-purple-50 dark:bg-gray-900 p-1 border border-purple-200 dark:border-gray-700 text-xs">
            <button
              type="button"
              onClick={() => setPriorityFilter('All')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                priorityFilter === 'All'
                  ? 'bg-purple-900 text-white'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {lang === 'bn' ? 'সব স্ট্যাটাস' : 'All Status'}
            </button>
            <button
              type="button"
              onClick={() => setPriorityFilter('Critical')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                priorityFilter === 'Critical'
                  ? 'bg-red-600 text-white'
                  : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>{lang === 'bn' ? 'ক্রিটিক্যাল' : 'Critical'}</span>
            </button>
            <button
              type="button"
              onClick={() => setPriorityFilter('Unacknowledged')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                priorityFilter === 'Unacknowledged'
                  ? 'bg-amber-600 text-white'
                  : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
              }`}
            >
              <span>{lang === 'bn' ? 'অপেক্ষমান' : 'Pending'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Handover Notes List */}
      <div className="space-y-4">
        {filteredHandovers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xs border border-purple-100 dark:border-gray-700 text-center space-y-3">
            <ClipboardList className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" />
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {lang === 'bn' ? 'কোন শিফট হ্যান্ডওভার রেকর্ড পাওয়া যায়নি' : 'No Shift Handover records found'}
            </p>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              {lang === 'bn'
                ? 'নতুন শিফট হস্তান্তর নোট তৈরি করতে উপরের "+ নতুন হ্যান্ডওভার নোট" বাটনে ক্লিক করুন।'
                : 'Click "+ New Handover Note" above to log concise clinical handoff notes for incoming doctors.'}
            </p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              + {lang === 'bn' ? 'হ্যান্ডওভার নোট তৈরি করুন' : 'Create Handover Note'}
            </button>
          </div>
        ) : (
          filteredHandovers.map((note) => {
            const isExpanded = !!expandedNotes[note.id];
            const hasCritical = note.patientHandovers.some(
              (p) => (p.priority === 'Stat' || p.conditionStatus === 'Critical') && !p.resolved
            );

            return (
              <div
                key={note.id}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xs border transition-all ${
                  hasCritical
                    ? 'border-red-300 dark:border-red-900/60 ring-1 ring-red-400/30'
                    : 'border-purple-100 dark:border-gray-700'
                }`}
              >
                {/* Note Header Card */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700/60">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl text-white shrink-0 ${
                        note.shiftType === 'Morning'
                          ? 'bg-amber-500'
                          : note.shiftType === 'Evening'
                          ? 'bg-indigo-600'
                          : 'bg-purple-900'
                      }`}
                    >
                      <Clock className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-sm text-purple-950 dark:text-purple-200">
                          {note.shiftType} Shift Handover
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          • {note.shiftDate} ({note.shiftTime})
                        </span>
                        {note.acknowledged ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>{lang === 'bn' ? 'গৃহীত' : 'Acknowledged'}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center gap-1 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>{lang === 'bn' ? 'সাইন-অফ অপেক্ষমান' : 'Sign-Off Pending'}</span>
                          </span>
                        )}
                        {hasCritical && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                            <span>Stat Follow-up Required</span>
                          </span>
                        )}
                      </div>

                      {/* Doctor Handover Flow */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 mt-1">
                        <span className="font-semibold">{lang === 'bn' ? 'হস্তান্তরকারী:' : 'From:'}</span>
                        <span className="font-bold text-purple-900 dark:text-purple-300">{note.outgoingDoctorName}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-semibold">{lang === 'bn' ? 'গ্রহীতা:' : 'To:'}</span>
                        <span className="font-bold text-indigo-900 dark:text-indigo-300">{note.incomingDoctorName || 'Incoming Shift Team'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions on note header */}
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    {!note.acknowledged && (
                      <button
                        type="button"
                        onClick={() => handleOpenAcknowledge(note)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        title={lang === 'bn' ? 'শিফট বুঝে নিন এবং সাইন-অফ সম্পন্ন করুন' : 'Verify shift handover and sign off'}
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'শিফট গ্রহণ করুন' : 'Acknowledge Receipt'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setPrintPreviewNote(note)}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold transition cursor-pointer"
                      title={lang === 'bn' ? 'হ্যান্ডওভার শিট প্রিন্ট' : 'Print Handover Sheet'}
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteShiftHandover(note.id)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-600 rounded-lg text-xs transition cursor-pointer"
                      title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete note'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleExpand(note.id)}
                      className="p-1.5 bg-purple-50 dark:bg-gray-700 hover:bg-purple-100 text-purple-900 dark:text-purple-200 rounded-lg text-xs transition cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Handover General Summary Banner */}
                <div className="px-4 sm:px-5 py-2.5 bg-purple-50/50 dark:bg-gray-900/40 text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2 border-b border-gray-100 dark:border-gray-700">
                  <FileText className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold text-purple-950 dark:text-purple-300 mr-1.5">
                      {lang === 'bn' ? 'শিফট সংক্ষিপ্তসার:' : 'Shift Summary:'}
                    </span>
                    <span>{note.summary}</span>
                  </div>
                </div>

                {/* Patient List Section (Expanded) */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-indigo-500" />
                        <span>
                          {lang === 'bn'
                            ? `হ্যান্ডওভারভুক্ত রোগী ও বিশেষ নজরদারি (${note.patientHandovers.length} জন)`
                            : `Observed Patients & Status Changes (${note.patientHandovers.length})`}
                        </span>
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {note.patientHandovers.map((pt) => {
                        const isStat = pt.priority === 'Stat';
                        const isHigh = pt.priority === 'High';
                        const isCrit = pt.conditionStatus === 'Critical';

                        return (
                          <div
                            key={pt.id}
                            className={`p-3.5 rounded-xl border text-xs transition space-y-2.5 ${
                              pt.resolved
                                ? 'bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700 opacity-75'
                                : isStat || isCrit
                                ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
                                : isHigh
                                ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            {/* Patient Info Row */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700/60 pb-2">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openPatientOverviewModal(pt.pId)}
                                  className="font-mono font-black text-purple-700 dark:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded-md"
                                  title={lang === 'bn' ? 'রোগী প্রোফাইল ও ওভারভিউ খুলুন' : 'Open Complete Patient Overview'}
                                >
                                  <User className="w-3 h-3 text-purple-600" />
                                  <span>PID: {pt.pId || 'N/A'}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </button>

                                <span className="font-black text-sm text-gray-900 dark:text-gray-100">
                                  {pt.patientName}
                                </span>
                                {(pt.age || pt.sex) && (
                                  <span className="text-gray-500 dark:text-gray-400">
                                    ({pt.age} {pt.sex ? `/ ${pt.sex}` : ''})
                                  </span>
                                )}
                                <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 font-semibold text-gray-700 dark:text-gray-300 text-[11px]">
                                  📍 {pt.bedOrChamber}
                                </span>
                              </div>

                              {/* Priority & Condition Badges */}
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                    pt.conditionStatus === 'Critical'
                                      ? 'bg-red-600 text-white'
                                      : pt.conditionStatus === 'Guarded'
                                      ? 'bg-amber-500 text-white'
                                      : pt.conditionStatus === 'Stable'
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-gray-500 text-white'
                                  }`}
                                >
                                  {pt.conditionStatus}
                                </span>

                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    pt.priority === 'Stat'
                                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-300'
                                      : pt.priority === 'High'
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  }`}
                                >
                                  Priority: {pt.priority}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleTogglePatientResolved(note.id, pt.id, !!pt.resolved)}
                                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                                    pt.resolved
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-emerald-50 text-gray-700 dark:text-gray-300'
                                  }`}
                                  title={lang === 'bn' ? 'ফলো-আপ সম্পন্ন হিসেবে চিহ্নিত করুন' : 'Mark follow-up completed'}
                                >
                                  <CheckSquare className="w-3 h-3 text-emerald-600" />
                                  <span>{pt.resolved ? (lang === 'bn' ? 'ফলো-আপ সম্পন্ন' : 'Resolved') : (lang === 'bn' ? 'সম্পন্ন করুন' : 'Mark Done')}</span>
                                </button>
                              </div>
                            </div>

                            {/* Critical Status Changes */}
                            <div className="bg-white/80 dark:bg-gray-900/60 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700/60 space-y-1">
                              <p className="font-bold text-[11px] text-red-700 dark:text-red-300 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>{lang === 'bn' ? 'অবস্থার উল্লেখযোগ্য পরিবর্তন (Critical Changes):' : 'Critical Status Changes:'}</span>
                              </p>
                              <p className="text-gray-800 dark:text-gray-200 leading-relaxed font-medium pl-4">
                                {pt.criticalChanges}
                              </p>
                            </div>

                            {/* Urgent Follow-Ups */}
                            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-900/40 space-y-1">
                              <p className="font-bold text-[11px] text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span>{lang === 'bn' ? 'পরবর্তী শিফটের করণীয় (Urgent Follow-ups):' : 'Urgent Follow-ups for Next Shift:'}</span>
                              </p>
                              <p className="text-gray-800 dark:text-gray-200 leading-relaxed font-medium pl-4">
                                {pt.urgentFollowUps}
                              </p>
                            </div>

                            {/* Pending Investigations Pills */}
                            {pt.pendingInvestigations && pt.pendingInvestigations.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="font-bold text-[10px] text-gray-500 dark:text-gray-400">
                                  {lang === 'bn' ? 'অপেক্ষমান ল্যাব/ডায়াগনস্টিক:' : 'Pending Tests:'}
                                </span>
                                {pt.pendingInvestigations.map((tName, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800"
                                  >
                                    🧪 {tName}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Acknowledgment Sign-off Footer */}
                    {note.acknowledged && (
                      <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-emerald-900 dark:text-emerald-200 gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            <strong>{lang === 'bn' ? 'শিফট গ্রহণ করেছেন:' : 'Acknowledged By:'}</strong>{' '}
                            {note.acknowledgedBy} •{' '}
                            <span className="font-mono text-[11px]">
                              {note.acknowledgedAt ? new Date(note.acknowledgedAt).toLocaleString() : ''}
                            </span>
                          </span>
                        </div>
                        {note.acknowledgementNotes && (
                          <div className="text-[11px] italic text-emerald-700 dark:text-emerald-300">
                            "{note.acknowledgementNotes}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: CREATE NEW SHIFT HANDOVER NOTE */}
      {/* ======================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-purple-200 dark:border-gray-700 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <ClipboardList className="w-5 h-5 text-pink-400" />
                <div>
                  <h3 className="font-black text-base">
                    {lang === 'bn' ? 'নতুন ডাক্তার শিফট হ্যান্ডওভার রেকর্ড' : 'New Doctor Shift Handover Record'}
                  </h3>
                  <p className="text-[11px] text-purple-200">
                    {lang === 'bn'
                      ? 'পরবর্তী শিফটের জন্য জরুরি রোগী অবস্থা, পরিবর্তন ও ফলো-আপ নোট লিখুন'
                      : 'Clinical SBAR handoff note for next shift physicians'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  if (onClearPreSelectedPatient) onClearPreSelectedPatient();
                }}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreateHandoverSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* Shift Information Header Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-purple-50/60 dark:bg-gray-900/50 p-3.5 rounded-xl border border-purple-100 dark:border-gray-700">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    {lang === 'bn' ? 'শিফটের ধরন:' : 'Shift Type:'}
                  </label>
                  <select
                    value={formShiftType}
                    onChange={(e) => {
                      const st = e.target.value as ShiftType;
                      setFormShiftType(st);
                      if (st === 'Morning') setFormShiftTime('08:00 AM - 02:00 PM');
                      else if (st === 'Evening') setFormShiftTime('02:00 PM - 08:00 PM');
                      else setFormShiftTime('08:00 PM - 08:00 AM');
                    }}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded-xl font-bold cursor-pointer"
                  >
                    <option value="Morning">Morning Shift (সকাল ৮টা - দুপুর ২টা)</option>
                    <option value="Evening">Evening Shift (দুপুর ২টা - রাত ৮টা)</option>
                    <option value="Night">Night Duty Shift (রাত ৮টা - সকাল ৮টা)</option>
                    <option value="Emergency / Custom">Emergency / Custom Duty Shift</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    {lang === 'bn' ? 'তারিখ ও সময়:' : 'Date & Duty Time:'}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      value={formShiftDate}
                      onChange={(e) => setFormShiftDate(e.target.value)}
                      placeholder="DD-MM-YYYY"
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded-xl font-mono text-[11px]"
                    />
                    <input
                      type="text"
                      value={formShiftTime}
                      onChange={(e) => setFormShiftTime(e.target.value)}
                      placeholder="e.g. 02:00 PM - 08:00 PM"
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded-xl text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    {lang === 'bn' ? 'হস্তান্তরকারী ডাক্তার:' : 'Outgoing Doctor:'}
                  </label>
                  <select
                    value={formOutgoingDocId}
                    onChange={(e) => setFormOutgoingDocId(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded-xl font-bold text-purple-950 dark:text-purple-200 cursor-pointer"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialty})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Incoming Doctor Row & Overall Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    {lang === 'bn' ? 'পরবর্তী শিফট ডাক্তার (গ্রহীতা):' : 'Incoming Doctor (Recipient):'}
                  </label>
                  <select
                    value={formIncomingDocId}
                    onChange={(e) => setFormIncomingDocId(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded-xl font-bold cursor-pointer"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialty})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    {lang === 'bn' ? 'সামগ্রিক শিফট / ওপিডি অবস্থা নোট:' : 'Overall Shift / Ward Condition Summary:'}
                  </label>
                  <input
                    type="text"
                    value={formSummary}
                    onChange={(e) => setFormSummary(e.target.value)}
                    placeholder="e.g. 26 consultations completed. 2 patients kept under active observation in Bay 1 & 2."
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded-xl text-xs focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              {/* Dynamic Observed Patients Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <div>
                    <h4 className="font-bold text-sm text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-purple-700" />
                      <span>{lang === 'bn' ? 'জরুরি ফলো-আপ রোগী তালিকা' : 'Patient Handovers & Status Changes'}</span>
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      {lang === 'bn'
                        ? 'যে রোগীদের অবস্থা পরিবর্তিত হয়েছে বা পরবর্তী শিফটে বিশেষ নজরদারি প্রয়োজন'
                        : 'Highlight acute changes, stat investigations, and specific follow-up instructions'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddPatientRow}
                    className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 rounded-xl font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'আরেকজন রোগী যোগ করুন' : 'Add Patient'}</span>
                  </button>
                </div>

                {/* Patient Rows */}
                <div className="space-y-4">
                  {formPatientItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-4 bg-purple-50/40 dark:bg-gray-900/40 rounded-xl border border-purple-200 dark:border-gray-700 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-purple-900 dark:text-purple-300 flex items-center gap-1">
                          <span>#{idx + 1}.</span>
                          <span>{lang === 'bn' ? 'রোগীর বিবরণ' : 'Patient Entry'}</span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Quick SBAR Template buttons */}
                          <span className="text-[10px] text-gray-500 mr-1 hidden sm:inline">
                            {lang === 'bn' ? 'কুইক টেমপ্লেট:' : 'Quick Template:'}
                          </span>
                          <button
                            type="button"
                            onClick={() => applyQuickTemplate(idx, 'cardiac')}
                            className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-[10px] font-bold hover:bg-red-200 cursor-pointer"
                            title="Heart / Chest Pain"
                          >
                            🫀 Chest Pain
                          </button>
                          <button
                            type="button"
                            onClick={() => applyQuickTemplate(idx, 'respiratory')}
                            className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold hover:bg-blue-200 cursor-pointer"
                            title="Asthma / SpO2 Drop"
                          >
                            🫁 Dyspnea / Asthma
                          </button>
                          <button
                            type="button"
                            onClick={() => applyQuickTemplate(idx, 'fever')}
                            className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold hover:bg-amber-200 cursor-pointer"
                            title="Dengue / High Fever"
                          >
                            🌡️ High Fever
                          </button>

                          {formPatientItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePatientRow(idx)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded cursor-pointer ml-2"
                              title="Remove this patient entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Line 1: PID, Name, Age/Sex, Chamber */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="block font-bold text-gray-700 dark:text-gray-300 mb-0.5">
                            Patient ID (PID):
                          </label>
                          <input
                            type="text"
                            value={item.pId}
                            onChange={(e) => handlePatientLookup(idx, e.target.value)}
                            placeholder="e.g. 26100294"
                            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded-xl font-mono font-bold focus:outline-none focus:border-purple-600"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-gray-700 dark:text-gray-300 mb-0.5">
                            {lang === 'bn' ? 'রোগীর নাম *:' : 'Patient Name *:'}
                          </label>
                          <input
                            type="text"
                            value={item.patientName}
                            onChange={(e) => handlePatientRowChange(idx, 'patientName', e.target.value)}
                            placeholder="Patient Full Name"
                            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded-xl font-bold focus:outline-none focus:border-purple-600"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-0.5">Age:</label>
                            <input
                              type="text"
                              value={item.age || ''}
                              onChange={(e) => handlePatientRowChange(idx, 'age', e.target.value)}
                              placeholder="24 Y"
                              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded-xl text-center"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-0.5">Sex:</label>
                            <select
                              value={item.sex || 'Female'}
                              onChange={(e) => handlePatientRowChange(idx, 'sex', e.target.value)}
                              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded-xl cursor-pointer"
                            >
                              <option value="Female">Female</option>
                              <option value="Male">Male</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-gray-700 dark:text-gray-300 mb-0.5">
                            {lang === 'bn' ? 'চেম্বার / বেড / লোকেশন:' : 'Chamber / Bed / Location:'}
                          </label>
                          <input
                            type="text"
                            value={item.bedOrChamber}
                            onChange={(e) => handlePatientRowChange(idx, 'bedOrChamber', e.target.value)}
                            placeholder="e.g. Observation Bed 1, Chamber 201"
                            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded-xl"
                          />
                        </div>
                      </div>

                      {/* Line 2: Condition & Priority */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block font-bold text-gray-700 dark:text-gray-300 mb-0.5">
                            {lang === 'bn' ? 'ক্লিনিক্যাল কন্ডিশন স্ট্যাটাস:' : 'Condition Status:'}
                          </label>
                          <select
                            value={item.conditionStatus}
                            onChange={(e) => handlePatientRowChange(idx, 'conditionStatus', e.target.value)}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded-xl font-bold cursor-pointer"
                          >
                            <option value="Critical">🔴 Critical (গুরুতর / সংবেদনশীল)</option>
                            <option value="Guarded">🟡 Guarded (সতর্ক পর্যবেক্ষণ প্রয়োজন)</option>
                            <option value="Stable">🟢 Stable (স্থিতিশীল)</option>
                            <option value="Discharged / Left">⚪ Discharged / Left</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-gray-700 dark:text-gray-300 mb-0.5">
                            {lang === 'bn' ? 'ফলো-আপ অগ্রাধিকার (Priority):' : 'Follow-up Priority:'}
                          </label>
                          <select
                            value={item.priority}
                            onChange={(e) => handlePatientRowChange(idx, 'priority', e.target.value)}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded-xl font-bold cursor-pointer"
                          >
                            <option value="Stat">🚨 Stat / Immediate Attention (তাৎক্ষণিক ব্যবস্থা)</option>
                            <option value="High">⚡ High (উচ্চ অগ্রাধিকার)</option>
                            <option value="Normal">📋 Normal Routine (স্বাভাবিক ফলো-আপ)</option>
                          </select>
                        </div>
                      </div>

                      {/* Line 3: Critical Changes Notes */}
                      <div>
                        <label className="block font-bold text-red-700 dark:text-red-400 mb-0.5 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{lang === 'bn' ? 'অবস্থার তীব্র পরিবর্তন বা নতুন সমস্যা (Critical Status Changes) *:' : 'Critical Status Changes (Concise Note) *:'}</span>
                        </label>
                        <textarea
                          rows={2}
                          value={item.criticalChanges}
                          onChange={(e) => handlePatientRowChange(idx, 'criticalChanges', e.target.value)}
                          placeholder="e.g. Sudden severe retrosternal pain radiating to neck, BP spiked to 170/100, SpO2 92% on air. 4L O2 given."
                          className="w-full bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/60 p-2 rounded-xl text-xs focus:outline-none focus:border-red-500 font-medium"
                          required
                        />
                      </div>

                      {/* Line 4: Urgent Follow-ups */}
                      <div>
                        <label className="block font-bold text-indigo-900 dark:text-indigo-300 mb-0.5 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{lang === 'bn' ? 'পরবর্তী শিফটের করণীয় ফলো-আপ (Urgent Actionable Follow-ups) *:' : 'Urgent Follow-ups for Next Shift Team *:'}</span>
                        </label>
                        <textarea
                          rows={2}
                          value={item.urgentFollowUps}
                          onChange={(e) => handlePatientRowChange(idx, 'urgentFollowUps', e.target.value)}
                          placeholder="e.g. 1) Recheck ECG at 4:30 PM. 2) Review Trop-I and Serum Electrolytes. 3) Consult Dr. Rahman if chest pain recurs."
                          className="w-full bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-900/60 p-2 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-medium"
                          required
                        />
                      </div>

                      {/* Line 5: Pending Investigations (Optional) */}
                      <div>
                        <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                          {lang === 'bn' ? 'অপেক্ষমান ল্যাব ও ডায়াগনস্টিক টেস্ট (ক্লিক করে নির্বাচন করুন):' : 'Pending Investigations (Click to toggle):'}
                        </label>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {['Troponin-I (Stat)', 'Complete Blood Count (CBC)', 'Serum Electrolytes', '12-Lead ECG', 'Chest X-Ray', 'USG Whole Abdomen', 'Serum Amylase & Lipase', 'Dengue NS1 Antigen', 'Blood Sugar (RBS)'].map(
                            (testLabel) => {
                              const isChecked = item.pendingInvestigations?.includes(testLabel);
                              return (
                                <button
                                  key={testLabel}
                                  type="button"
                                  onClick={() => {
                                    const current = item.pendingInvestigations || [];
                                    const next = isChecked
                                      ? current.filter((x) => x !== testLabel)
                                      : [...current, testLabel];
                                    handlePatientRowChange(idx, 'pendingInvestigations', next);
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                    isChecked
                                      ? 'bg-purple-900 text-white shadow-xs'
                                      : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-50'
                                  }`}
                                >
                                  {isChecked ? '✓ ' : '+ '}
                                  {testLabel}
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-800 dark:text-gray-200 rounded-xl font-bold transition cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-black shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>{lang === 'bn' ? 'শিফট হ্যান্ডওভার রেকর্ড সংরক্ষণ করুন' : 'Save Shift Handover Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ACKNOWLEDGE SHIFT HANDOVER */}
      {/* ======================================================== */}
      {isAckModalOpen && selectedHandoverForAck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-purple-200 dark:border-gray-700 max-w-lg w-full overflow-hidden">
            <div className="p-4 bg-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-200" />
                <h3 className="font-black text-sm">
                  {lang === 'bn' ? 'শিফট গ্রহণ ও সাইন-অফ নিশ্চিতকরণ' : 'Acknowledge & Sign-off Shift Receipt'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAckModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
                <p className="font-bold text-emerald-950 dark:text-emerald-200">
                  {selectedHandoverForAck.shiftType} Shift • {selectedHandoverForAck.shiftDate}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {lang === 'bn' ? 'হস্তান্তর করেছেন:' : 'Handed over by:'} {selectedHandoverForAck.outgoingDoctorName} (
                  {selectedHandoverForAck.patientHandovers.length} patients observed)
                </p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'bn' ? 'আপনার নাম (অন-ডিউটি ডাক্তার):' : 'Your Name (On-Duty Incoming Doctor):'}
                </label>
                <input
                  type="text"
                  value={ackDoctorName}
                  onChange={(e) => setAckDoctorName(e.target.value)}
                  placeholder="Doctor Name"
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl font-bold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'bn' ? 'গ্রহণ সংক্রান্ত মন্তব্য (ঐচ্ছিক):' : 'Acknowledgement Notes (Optional):'}
                </label>
                <textarea
                  rows={3}
                  value={ackNotes}
                  onChange={(e) => setAckNotes(e.target.value)}
                  placeholder="e.g. Shift taken over. Reviewed Titly's repeat vitals; observation ongoing."
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2.5 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAckModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 rounded-xl font-bold cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAcknowledge}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'শিফট বুঝে নিলাম (সাইন-অফ)' : 'Confirm Receipt & Sign-Off'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: PRINTABLE CLINICAL SHIFT HANDOVER SHEET */}
      {/* ======================================================== */}
      {printPreviewNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white text-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden">
            {/* Print Dialog Bar */}
            <div className="p-3 bg-gray-900 text-white flex items-center justify-between shrink-0">
              <span className="font-bold text-xs flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Shift Handover Clinical Sheet Preview</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintPreviewNote(null)}
                  className="p-1 text-gray-300 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="p-8 overflow-y-auto space-y-6 text-xs font-sans print:p-0">
              {/* Hospital Header */}
              <div className="text-center border-b-2 border-purple-900 pb-4">
                <h1 className="text-xl font-black text-purple-950 uppercase tracking-wide">
                  {clinicConfig.clinicName}
                </h1>
                <p className="text-xs text-gray-600">{clinicConfig.address}</p>
                <p className="text-xs text-gray-500 font-mono">
                  Phone: {clinicConfig.phone} • Reg: {clinicConfig.regNo}
                </p>
                <div className="inline-block mt-2 px-3 py-1 bg-purple-900 text-white font-black text-xs uppercase tracking-widest rounded">
                  Clinical Shift Handoff Record (SBAR)
                </div>
              </div>

              {/* Handover Details Meta */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <p><strong>Shift:</strong> {printPreviewNote.shiftType} Shift ({printPreviewNote.shiftTime})</p>
                  <p><strong>Date:</strong> {printPreviewNote.shiftDate}</p>
                  <p><strong>Outgoing Doctor:</strong> {printPreviewNote.outgoingDoctorName}</p>
                </div>
                <div>
                  <p><strong>Incoming Team / Doctor:</strong> {printPreviewNote.incomingDoctorName || 'Duty Medical Officer'}</p>
                  <p><strong>Status:</strong> {printPreviewNote.acknowledged ? `Acknowledged by ${printPreviewNote.acknowledgedBy}` : 'Pending Acknowledgment'}</p>
                  <p><strong>Observed Patients:</strong> {printPreviewNote.patientHandovers.length}</p>
                </div>
              </div>

              {/* Shift Summary */}
              <div>
                <h3 className="font-bold text-xs uppercase text-purple-950 border-b pb-1 mb-1.5">
                  1. Shift Condition & Ward Status
                </h3>
                <p className="text-gray-700 bg-purple-50/50 p-2.5 rounded border border-purple-100">
                  {printPreviewNote.summary}
                </p>
              </div>

              {/* Patient Breakdown Table */}
              <div>
                <h3 className="font-bold text-xs uppercase text-purple-950 border-b pb-1 mb-2">
                  2. Priority Patients, Critical Changes & Urgent Follow-Ups
                </h3>

                <table className="w-full border-collapse border border-gray-300 text-[11px]">
                  <thead>
                    <tr className="bg-gray-100 text-gray-800">
                      <th className="border border-gray-300 p-2 text-left">Patient & Chamber</th>
                      <th className="border border-gray-300 p-2 text-left">Status & Priority</th>
                      <th className="border border-gray-300 p-2 text-left">Critical Status Changes</th>
                      <th className="border border-gray-300 p-2 text-left">Actionable Follow-ups</th>
                      <th className="border border-gray-300 p-2 text-left">Pending Investigations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printPreviewNote.patientHandovers.map((p, idx) => (
                      <tr key={idx} className="align-top border-b border-gray-200">
                        <td className="border border-gray-300 p-2">
                          <p className="font-bold">{p.patientName}</p>
                          <p className="font-mono text-[10px] text-gray-600">PID: {p.pId}</p>
                          <p className="text-[10px] text-gray-500">📍 {p.bedOrChamber}</p>
                        </td>
                        <td className="border border-gray-300 p-2 font-bold">
                          <p className={p.conditionStatus === 'Critical' ? 'text-red-600' : 'text-amber-600'}>
                            {p.conditionStatus}
                          </p>
                          <p className="text-[10px] font-mono text-gray-600">{p.priority}</p>
                        </td>
                        <td className="border border-gray-300 p-2 text-red-950">
                          {p.criticalChanges}
                        </td>
                        <td className="border border-gray-300 p-2 font-semibold text-indigo-950">
                          {p.urgentFollowUps}
                        </td>
                        <td className="border border-gray-300 p-2 text-[10px]">
                          {p.pendingInvestigations && p.pendingInvestigations.length > 0
                            ? p.pendingInvestigations.join(', ')
                            : 'None'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures Section */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center">
                <div>
                  <div className="border-t border-gray-400 pt-2 w-48 mx-auto font-bold">
                    {printPreviewNote.outgoingDoctorName}
                  </div>
                  <p className="text-[10px] text-gray-500">Outgoing Doctor Signature & Seal</p>
                </div>
                <div>
                  <div className="border-t border-gray-400 pt-2 w-48 mx-auto font-bold">
                    {printPreviewNote.acknowledgedBy || printPreviewNote.incomingDoctorName || 'On-Duty Medical Officer'}
                  </div>
                  <p className="text-[10px] text-gray-500">Incoming Doctor Signature & Seal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
