import React, { useState } from 'react';
import { Patient } from '../../types';
import {
  HeartPulse,
  Activity,
  Thermometer,
  Scale,
  Droplets,
  Plus,
  Trash2,
  Calendar,
  Clock,
  User,
  CheckCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  TrendingDown,
  Printer,
  Sparkles,
  X,
} from 'lucide-react';

export interface VitalRecord {
  id: string;
  date: string;
  time?: string;
  systolic: number; // mmHg
  diastolic: number; // mmHg
  pulse: number; // bpm
  temperature: number; // °F
  spO2?: number; // %
  weight?: number; // kg
  notes?: string;
  recordedBy?: string;
}

interface PatientVitalsPanelProps {
  patient: Patient;
  lang?: 'bn' | 'en';
  clinicName?: string;
}

export const PatientVitalsPanel: React.FC<PatientVitalsPanelProps> = ({
  patient,
  lang = 'bn',
  clinicName,
}) => {
  const storageKey = `adiba_patient_vitals_${patient.pId}`;

  // Seed default 5 historical points for rich visualization
  const [vitals, setVitals] = useState<VitalRecord[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return [
      {
        id: 'v-1',
        date: '2026-08-10',
        time: '10:15 AM',
        systolic: 138,
        diastolic: 88,
        pulse: 84,
        temperature: 98.6,
        spO2: 98,
        weight: 62.5,
        notes: 'প্রাথমিক চেকআপ - হালকা মাথা ধরা ও ক্লান্তি',
        recordedBy: 'Nurse Rupa',
      },
      {
        id: 'v-2',
        date: '2026-08-26',
        time: '11:00 AM',
        systolic: 130,
        diastolic: 84,
        pulse: 80,
        temperature: 98.4,
        spO2: 99,
        weight: 62.0,
        notes: 'ওষুধ শুরুর পর প্রথম ফলোআপ',
        recordedBy: 'Dr. Rafiqul Islam',
      },
      {
        id: 'v-3',
        date: '2026-09-14',
        time: '04:30 PM',
        systolic: 126,
        diastolic: 82,
        pulse: 78,
        temperature: 99.2,
        spO2: 98,
        weight: 61.2,
        notes: 'হালকা আবহাওয়াজনিত জ্বর ও সর্দি',
        recordedBy: 'Nurse Rupa',
      },
      {
        id: 'v-4',
        date: '2026-10-02',
        time: '10:00 AM',
        systolic: 122,
        diastolic: 80,
        pulse: 74,
        temperature: 98.4,
        spO2: 99,
        weight: 60.8,
        notes: 'নিয়মিত ওপিডি চেকআপ - উন্নতি লক্ষণীয়',
        recordedBy: 'Dr. Rafiqul Islam',
      },
      {
        id: 'v-5',
        date: '2026-10-18',
        time: '12:30 PM',
        systolic: 118,
        diastolic: 78,
        pulse: 72,
        temperature: 98.2,
        spO2: 99,
        weight: 60.5,
        notes: 'রক্তচাপ ও পালস সম্পূর্ণ স্বাভাবিক মাত্রায় রয়েছে',
        recordedBy: 'Dr. Tasnim Ara',
      },
    ];
  });

  const [activeMetric, setActiveMetric] = useState<'all' | 'bp' | 'pulse' | 'temp' | 'spo2'>('all');
  const [hoveredVital, setHoveredVital] = useState<VitalRecord | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form states for adding new vital record
  const [formDate, setFormDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState<string>('10:00 AM');
  const [formSystolic, setFormSystolic] = useState<number>(120);
  const [formDiastolic, setFormDiastolic] = useState<number>(80);
  const [formPulse, setFormPulse] = useState<number>(75);
  const [formTemp, setFormTemp] = useState<number>(98.4);
  const [formSpO2, setFormSpO2] = useState<number>(99);
  const [formWeight, setFormWeight] = useState<number>(60);
  const [formNotes, setFormNotes] = useState<string>('');
  const [formRecorder, setFormRecorder] = useState<string>('Duty Doctor / Nurse');

  // Save changes to localStorage
  const saveVitals = (updated: VitalRecord[]) => {
    setVitals(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
  };

  const handleAddVital = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: VitalRecord = {
      id: `v-${Date.now()}`,
      date: formDate,
      time: formTime,
      systolic: Number(formSystolic) || 120,
      diastolic: Number(formDiastolic) || 80,
      pulse: Number(formPulse) || 75,
      temperature: Number(formTemp) || 98.4,
      spO2: Number(formSpO2) || 99,
      weight: Number(formWeight) || 60,
      notes: formNotes.trim(),
      recordedBy: formRecorder.trim() || 'Medical Staff',
    };

    // Sort chronologically
    const updated = [...vitals, newEntry].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    saveVitals(updated);
    setShowAddModal(false);
    setFormNotes('');
  };

  const handleDeleteVital = (id: string) => {
    if (vitals.length <= 1) {
      alert(lang === 'bn' ? 'কমপক্ষে একটি ভাইটালস রেকর্ড থাকা আবশ্যক।' : 'At least one record is required.');
      return;
    }
    const updated = vitals.filter((v) => v.id !== id);
    saveVitals(updated);
    if (hoveredVital?.id === id) setHoveredVital(null);
  };

  // Latest record for summary cards
  const latestVital = vitals[vitals.length - 1] || vitals[0];

  // Helper for clinical status
  const getBpStatus = (sys: number, dia: number) => {
    if (sys < 90 || dia < 60) return { label: lang === 'bn' ? 'কম রক্তচাপ (Low BP)' : 'Hypotension', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-300' };
    if (sys <= 120 && dia <= 80) return { label: lang === 'bn' ? 'আদর্শ রক্তচাপ (Optimal)' : 'Normal', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300' };
    if (sys <= 129 && dia < 80) return { label: lang === 'bn' ? 'হালকা বেশি (Elevated)' : 'Elevated', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-300' };
    if (sys <= 139 || dia <= 89) return { label: lang === 'bn' ? 'স্টেজ ১ উচ্চ রক্তচাপ' : 'Stage 1 HTN', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-300' };
    return { label: lang === 'bn' ? 'স্টেজ ২ উচ্চ রক্তচাপ' : 'Stage 2 HTN', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-300' };
  };

  const getPulseStatus = (pulse: number) => {
    if (pulse < 60) return { label: lang === 'bn' ? 'ব্র্যাডিকার্ডিয়া (<60 bpm)' : 'Bradycardia', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-300' };
    if (pulse <= 100) return { label: lang === 'bn' ? 'স্বাভাবিক পালস (Normal Sinus)' : 'Normal Sinus', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300' };
    return { label: lang === 'bn' ? 'ট্যাকিকার্ডিয়া (>100 bpm)' : 'Tachycardia', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-300' };
  };

  const getTempStatus = (temp: number) => {
    if (temp <= 98.8) return { label: lang === 'bn' ? 'স্বাভাবিক তাপমাত্রা' : 'Normal / Afebrile', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300' };
    if (temp <= 100.4) return { label: lang === 'bn' ? 'হালকা জ্বর (Low-grade Fever)' : 'Low-grade Fever', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-300' };
    return { label: lang === 'bn' ? 'উচ্চ জ্বর (Pyrexia)' : 'High Fever', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-300' };
  };

  // --- SVG Line Chart Math & Coordinates ---
  const chartWidth = 720;
  const chartHeight = 240;
  const paddingX = 45;
  const paddingY = 30;
  const plotWidth = chartWidth - paddingX * 2;
  const plotHeight = chartHeight - paddingY * 2;

  // X Coordinates based on index of sorted records
  const n = vitals.length;
  const getX = (index: number) => {
    if (n <= 1) return paddingX + plotWidth / 2;
    return paddingX + (index / (n - 1)) * plotWidth;
  };

  // Y Scale ranges:
  // BP & Pulse scale: 40 to 180 (for BP systolic/diastolic and Pulse)
  const minBp = 40;
  const maxBp = 180;
  const getYBp = (val: number) => {
    const clamped = Math.max(minBp, Math.min(maxBp, val));
    return paddingY + plotHeight - ((clamped - minBp) / (maxBp - minBp)) * plotHeight;
  };

  // Temp scale: 96°F to 104°F
  const minTemp = 96.0;
  const maxTemp = 104.0;
  const getYTemp = (val: number) => {
    const clamped = Math.max(minTemp, Math.min(maxTemp, val));
    return paddingY + plotHeight - ((clamped - minTemp) / (maxTemp - minTemp)) * plotHeight;
  };

  // Path generator for polylines
  const buildPath = (values: number[], scaleFn: (v: number) => number) => {
    return values
      .map((val, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${scaleFn(val).toFixed(1)}`)
      .join(' ');
  };

  const systolicPath = buildPath(vitals.map((v) => v.systolic), getYBp);
  const diastolicPath = buildPath(vitals.map((v) => v.diastolic), getYBp);
  const pulsePath = buildPath(vitals.map((v) => v.pulse), getYBp);
  const tempPath = buildPath(vitals.map((v) => v.temperature), getYTemp);

  return (
    <div className="space-y-5">
      {/* Top Header & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 dark:border-gray-700">
        <div>
          <h3 className="font-black text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-rose-500 animate-pulse" />
            <span>{lang === 'bn' ? 'রোগীর ভাইটালস ইতিহাস ও ভিজ্যুয়াল ট্রেন্ড চার্ট' : 'Patient Vitals Timeline & Trend Chart'}</span>
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            {lang === 'bn'
              ? 'রক্তচাপ, হৃদস্পন্দন/পালস, তাপমাত্রা ও ওজনের ক্রমান্বয়ে পরিবর্তন পর্যবেক্ষণ এবং চার্ট ট্র্যাকিং।'
              : 'Continuous tracking of Blood Pressure (Sys/Dia), Pulse BPM, Body Temp, and SpO2 trends over time.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-900 hover:to-indigo-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? '+ নতুন ভাইটালস মাপ লিখুন' : '+ Log Vitals'}</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards (Latest Measurements) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Blood Pressure */}
        <div className="p-3 bg-gradient-to-br from-rose-50 to-pink-50/50 dark:from-rose-950/20 dark:to-pink-950/10 rounded-2xl border border-rose-200 dark:border-rose-900/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'রক্তচাপ (BP)' : 'Blood Pressure'}</span>
            </span>
            <span className="text-[10px] font-mono text-gray-400">{latestVital.date}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-black text-rose-950 dark:text-rose-200">
              {latestVital.systolic}/{latestVital.diastolic}
            </span>
            <span className="text-[10px] text-rose-700 font-mono">mmHg</span>
          </div>
          <div className="mt-1.5">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getBpStatus(latestVital.systolic, latestVital.diastolic).color}`}>
              {getBpStatus(latestVital.systolic, latestVital.diastolic).label}
            </span>
          </div>
        </div>

        {/* Card 2: Pulse / Heart Rate */}
        <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/10 rounded-2xl border border-indigo-200 dark:border-indigo-900/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
              <HeartPulse className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'পালস / হৃদস্পন্দন' : 'Heart Rate'}</span>
            </span>
            <span className="text-[10px] font-mono text-gray-400">{latestVital.time || '10:00 AM'}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-black text-indigo-950 dark:text-indigo-200">
              {latestVital.pulse}
            </span>
            <span className="text-[10px] text-indigo-700 font-mono">bpm</span>
          </div>
          <div className="mt-1.5">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getPulseStatus(latestVital.pulse).color}`}>
              {getPulseStatus(latestVital.pulse).label}
            </span>
          </div>
        </div>

        {/* Card 3: Body Temperature */}
        <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/10 rounded-2xl border border-amber-200 dark:border-amber-900/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'শরীরের তাপমাত্রা' : 'Temperature'}</span>
            </span>
            <span className="text-[10px] font-mono text-gray-400">Oral / Axilla</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-black text-amber-950 dark:text-amber-200">
              {latestVital.temperature}
            </span>
            <span className="text-[10px] text-amber-700 font-mono">°F</span>
          </div>
          <div className="mt-1.5">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getTempStatus(latestVital.temperature).color}`}>
              {getTempStatus(latestVital.temperature).label}
            </span>
          </div>
        </div>

        {/* Card 4: SpO2 & Weight */}
        <div className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/10 rounded-2xl border border-emerald-200 dark:border-emerald-900/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'অক্সিজেন ও ওজন' : 'SpO2 & Weight'}</span>
            </span>
            <span className="text-[10px] font-mono text-gray-400">Room Air</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <div>
              <span className="text-xl font-black text-emerald-950 dark:text-emerald-200">
                {latestVital.spO2 || 99}%
              </span>
              <span className="text-[10px] text-emerald-700 font-mono ml-0.5">SpO2</span>
            </div>
            {latestVital.weight && (
              <div className="border-l border-emerald-300 dark:border-emerald-800 pl-2">
                <span className="text-base font-black text-teal-950 dark:text-teal-200">
                  {latestVital.weight}
                </span>
                <span className="text-[10px] text-teal-700 font-mono ml-0.5">kg</span>
              </div>
            )}
          </div>
          <div className="mt-1.5">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300">
              {lang === 'bn' ? 'পর্যাপ্ত অক্সিজেন মাত্রা (Normal)' : 'Adequate Saturation'}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* INTERACTIVE SVG LINE CHART FOR VISUAL TRACKING */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-purple-100 dark:border-gray-700 p-4 shadow-xs space-y-3">
        {/* Metric Selector Pills & Chart Legends */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-2 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-gray-500 mr-1">
              {lang === 'bn' ? 'ট্রেন্ড ফিল্টার:' : 'Filter Metric:'}
            </span>
            <button
              type="button"
              onClick={() => setActiveMetric('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeMetric === 'all'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {lang === 'bn' ? 'সব প্যারামিটার (All)' : 'All Vitals'}
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('bp')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                activeMetric === 'bp'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              <span>{lang === 'bn' ? 'রক্তচাপ (BP)' : 'Blood Pressure'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('pulse')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                activeMetric === 'pulse'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
              <span>{lang === 'bn' ? 'পালস রেট (Pulse)' : 'Pulse BPM'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('temp')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                activeMetric === 'temp'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              <span>{lang === 'bn' ? 'তাপমাত্রা (°F)' : 'Temperature'}</span>
            </button>
          </div>

          {/* Color Legend Indicators */}
          <div className="flex items-center gap-3 text-[10px] text-gray-500 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 bg-rose-500 rounded-full" />
              <span>Sys BP</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 bg-orange-400 rounded-full" />
              <span>Dia BP</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 bg-indigo-500 rounded-full" />
              <span>Pulse BPM</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 bg-amber-500 rounded-full" />
              <span>Temp °F</span>
            </span>
          </div>
        </div>

        {/* SVG Chart Container */}
        <div className="relative overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-56 sm:h-64 select-none"
          >
            <defs>
              <linearGradient id="normalBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="roseGlow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#e11d48" />
              </linearGradient>
            </defs>

            {/* Background Normal Clinical Range (BP Normal 80-120 band) */}
            {(activeMetric === 'all' || activeMetric === 'bp') && (
              <rect
                x={paddingX}
                y={getYBp(120)}
                width={plotWidth}
                height={getYBp(80) - getYBp(120)}
                fill="url(#normalBand)"
                stroke="#10b981"
                strokeWidth="0.5"
                strokeDasharray="3 3"
              />
            )}

            {/* Horizontal Grid lines & scale labels */}
            {[60, 80, 100, 120, 140, 160].map((val) => {
              const y = getYBp(val);
              return (
                <g key={val}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="currentColor"
                    className="text-gray-200 dark:text-gray-700"
                    strokeWidth="0.7"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="9"
                    className="fill-gray-400 font-mono"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Vertical grid lines & Date markers */}
            {vitals.map((v, idx) => {
              const x = getX(idx);
              return (
                <g key={v.id}>
                  <line
                    x1={x}
                    y1={paddingY}
                    x2={x}
                    y2={chartHeight - paddingY}
                    stroke="currentColor"
                    className="text-gray-100 dark:text-gray-800"
                    strokeWidth="0.5"
                  />
                  <text
                    x={x}
                    y={chartHeight - 10}
                    textAnchor="middle"
                    fontSize="9"
                    className="fill-gray-500 font-mono font-medium"
                  >
                    {v.date.slice(5)}
                  </text>
                </g>
              );
            })}

            {/* --- LINE 1: Systolic BP (Rose) --- */}
            {(activeMetric === 'all' || activeMetric === 'bp') && (
              <>
                <path
                  d={systolicPath}
                  fill="none"
                  stroke="url(#roseGlow)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {vitals.map((v, idx) => (
                  <circle
                    key={`sys-${v.id}`}
                    cx={getX(idx)}
                    cy={getYBp(v.systolic)}
                    r="4.5"
                    className="fill-white stroke-rose-600 hover:r-6 cursor-pointer transition-all"
                    strokeWidth="2"
                    onMouseEnter={() => setHoveredVital(v)}
                  />
                ))}
              </>
            )}

            {/* --- LINE 2: Diastolic BP (Orange) --- */}
            {(activeMetric === 'all' || activeMetric === 'bp') && (
              <>
                <path
                  d={diastolicPath}
                  fill="none"
                  stroke="#fb923c"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {vitals.map((v, idx) => (
                  <circle
                    key={`dia-${v.id}`}
                    cx={getX(idx)}
                    cy={getYBp(v.diastolic)}
                    r="4"
                    className="fill-white stroke-orange-500 hover:r-6 cursor-pointer transition-all"
                    strokeWidth="2"
                    onMouseEnter={() => setHoveredVital(v)}
                  />
                ))}
              </>
            )}

            {/* --- LINE 3: Heart Rate / Pulse (Indigo) --- */}
            {(activeMetric === 'all' || activeMetric === 'pulse') && (
              <>
                <path
                  d={pulsePath}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2.2"
                  strokeDasharray={activeMetric === 'all' ? '4 2' : 'none'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {vitals.map((v, idx) => (
                  <circle
                    key={`pulse-${v.id}`}
                    cx={getX(idx)}
                    cy={getYBp(v.pulse)}
                    r="4"
                    className="fill-white stroke-indigo-600 hover:r-6 cursor-pointer transition-all"
                    strokeWidth="2"
                    onMouseEnter={() => setHoveredVital(v)}
                  />
                ))}
              </>
            )}

            {/* --- LINE 4: Temperature (Amber) --- */}
            {(activeMetric === 'all' || activeMetric === 'temp') && (
              <>
                <path
                  d={tempPath}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {vitals.map((v, idx) => (
                  <circle
                    key={`temp-${v.id}`}
                    cx={getX(idx)}
                    cy={getYTemp(v.temperature)}
                    r="4"
                    className="fill-white stroke-amber-500 hover:r-6 cursor-pointer transition-all"
                    strokeWidth="2"
                    onMouseEnter={() => setHoveredVital(v)}
                  />
                ))}
              </>
            )}
          </svg>
        </div>

        {/* Floating Tooltip details when a point is hovered */}
        {hoveredVital && (
          <div className="p-3 bg-purple-950 text-white rounded-xl shadow-lg border border-purple-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
            <div className="space-y-0.5">
              <div className="font-bold flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-pink-300" />
                <span>
                  {hoveredVital.date} · {hoveredVital.time || 'Visit'}
                </span>
                <span className="text-purple-300">({hoveredVital.recordedBy})</span>
              </div>
              {hoveredVital.notes && (
                <p className="text-[11px] text-purple-200">{hoveredVital.notes}</p>
              )}
            </div>

            <div className="flex items-center gap-3 font-mono shrink-0">
              <span className="px-2 py-0.5 rounded bg-rose-500/30 text-rose-200 border border-rose-400/30 font-bold">
                BP: {hoveredVital.systolic}/{hoveredVital.diastolic}
              </span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-bold">
                Pulse: {hoveredVital.pulse} bpm
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 border border-amber-400/30 font-bold">
                Temp: {hoveredVital.temperature}°F
              </span>
              <button
                type="button"
                onClick={() => setHoveredVital(null)}
                className="text-white/60 hover:text-white cursor-pointer ml-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* HISTORICAL TIMELINE TABLE & LOGS */}
      {/* ======================================================== */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-xs text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-purple-700" />
            <span>{lang === 'bn' ? 'ক্রমানুসারে ভাইটালস পরিমাপের বিবরণী' : 'Chronological Vitals Logs'}</span>
          </h4>
          <span className="text-[11px] text-gray-400 font-mono">
            {vitals.length} {lang === 'bn' ? 'টি এন্ট্রি' : 'Records'}
          </span>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-2xs">
          {vitals
            .slice()
            .reverse()
            .map((v, idx) => {
              const bpInfo = getBpStatus(v.systolic, v.diastolic);
              return (
                <div
                  key={v.id}
                  className="p-3.5 hover:bg-purple-50/40 dark:hover:bg-gray-750 transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-purple-600" />
                        <span>{v.date}</span>
                      </span>
                      {v.time && (
                        <span className="text-gray-400 font-mono text-[11px]">({v.time})</span>
                      )}
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold border ${bpInfo.color}`}>
                        {bpInfo.label}
                      </span>
                      <span className="text-gray-400 text-[11px]">
                        · {v.recordedBy || 'Nurse Duty'}
                      </span>
                    </div>

                    {v.notes && (
                      <p className="text-[11px] text-gray-600 dark:text-gray-300 italic">
                        "{v.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 self-end md:self-auto shrink-0 font-mono">
                    <div className="text-right">
                      <div className="text-gray-400 text-[10px]">Blood Pressure</div>
                      <div className="font-black text-rose-700 dark:text-rose-400">
                        {v.systolic}/{v.diastolic} <span className="text-[9px] font-normal">mmHg</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-gray-400 text-[10px]">Heart Rate</div>
                      <div className="font-black text-indigo-700 dark:text-indigo-400">
                        {v.pulse} <span className="text-[9px] font-normal">bpm</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-gray-400 text-[10px]">Temperature</div>
                      <div className="font-black text-amber-700 dark:text-amber-400">
                        {v.temperature} <span className="text-[9px] font-normal">°F</span>
                      </div>
                    </div>

                    {v.spO2 && (
                      <div className="text-right">
                        <div className="text-gray-400 text-[10px]">SpO2</div>
                        <div className="font-black text-emerald-700 dark:text-emerald-400">
                          {v.spO2}%
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteVital(v.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                      title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: ADD NEW VITALS ENTRY */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-purple-200 dark:border-gray-700 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-400" />
                <h4 className="font-black text-sm">
                  {lang === 'bn' ? 'নতুন ভাইটালস মাপ যুক্ত করুন' : 'Record New Patient Vitals'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-white/70 hover:text-white cursor-pointer font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVital} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    {lang === 'bn' ? 'তারিখ' : 'Date'}
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    {lang === 'bn' ? 'সময়' : 'Time'}
                  </label>
                  <input
                    type="text"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="e.g. 10:30 AM"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/40">
                  <label className="block font-bold text-rose-950 dark:text-rose-200 mb-1">
                    Systolic BP (mmHg)
                  </label>
                  <input
                    type="number"
                    value={formSystolic}
                    onChange={(e) => setFormSystolic(Number(e.target.value))}
                    min="50"
                    max="260"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-rose-300 dark:border-rose-700 dark:bg-gray-700 text-sm font-black font-mono"
                  />
                  <span className="text-[10px] text-rose-600 mt-1 block">Normal: 90 - 120</span>
                </div>

                <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-200 dark:border-orange-900/40">
                  <label className="block font-bold text-orange-950 dark:text-orange-200 mb-1">
                    Diastolic BP (mmHg)
                  </label>
                  <input
                    type="number"
                    value={formDiastolic}
                    onChange={(e) => setFormDiastolic(Number(e.target.value))}
                    min="30"
                    max="160"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-orange-300 dark:border-orange-700 dark:bg-gray-700 text-sm font-black font-mono"
                  />
                  <span className="text-[10px] text-orange-600 mt-1 block">Normal: 60 - 80</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Pulse (bpm)
                  </label>
                  <input
                    type="number"
                    value={formPulse}
                    onChange={(e) => setFormPulse(Number(e.target.value))}
                    min="30"
                    max="220"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-xs font-mono font-bold"
                  />
                  <span className="text-[10px] text-gray-400">60 - 100</span>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Temp (°F)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formTemp}
                    onChange={(e) => setFormTemp(Number(e.target.value))}
                    min="94"
                    max="108"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-xs font-mono font-bold"
                  />
                  <span className="text-[10px] text-gray-400">97.0 - 99.0</span>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    SpO2 (%)
                  </label>
                  <input
                    type="number"
                    value={formSpO2}
                    onChange={(e) => setFormSpO2(Number(e.target.value))}
                    min="70"
                    max="100"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-xs font-mono font-bold"
                  />
                  <span className="text-[10px] text-gray-400">95 - 100%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    {lang === 'bn' ? 'ওজন (Weight kg)' : 'Weight (kg)'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formWeight}
                    onChange={(e) => setFormWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    {lang === 'bn' ? 'পরিমাপকারী (Staff)' : 'Recorded By'}
                  </label>
                  <input
                    type="text"
                    value={formRecorder}
                    onChange={(e) => setFormRecorder(e.target.value)}
                    placeholder="Doctor / Nurse name"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'bn' ? 'চিকিৎসাগত পর্যবেক্ষণ / নোট' : 'Clinical Notes'}
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder={lang === 'bn' ? 'উদাঃ রোগী স্বাভাবিক, নিয়মিত ওষুধ সেবন করছেন' : 'e.g. Normal recovery, continuing therapy'}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-900 hover:bg-purple-950 text-white font-bold rounded-xl shadow-md cursor-pointer transition active:scale-95"
                >
                  {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
