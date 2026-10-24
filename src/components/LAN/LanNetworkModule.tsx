import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WorkstationNode, ActivityAuditLog } from '../../types';
import {
  Network,
  Server,
  Monitor,
  Wifi,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Terminal,
  Settings,
  Edit2,
  Download,
  Trash2,
  ExternalLink,
  Laptop,
  Check,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Zap,
  Lock,
  Cpu,
} from 'lucide-react';

export const LanNetworkModule: React.FC = () => {
  const {
    workstations,
    currentWorkstationId,
    currentWorkstation,
    setCurrentWorkstationId,
    updateWorkstation,
    auditLogs,
    clearAuditLogs,
    currentUser,
    lang,
    t,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'topology' | 'workstations' | 'audit' | 'guide'>('topology');
  const [searchAudit, setSearchAudit] = useState('');
  const [selectedWsFilter, setSelectedWsFilter] = useState('ALL');
  const [selectedActionFilter, setSelectedActionFilter] = useState('ALL');
  const [pingStatus, setPingStatus] = useState<Record<string, { pinging: boolean; result?: string }>>({});
  const [editingWs, setEditingWs] = useState<WorkstationNode | null>(null);
  const [editIp, setEditIp] = useState('');
  const [editName, setEditName] = useState('');
  const [editNameBn, setEditNameBn] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [showSwitchSuccess, setShowSwitchSuccess] = useState<string | null>(null);

  // Ping simulation
  const handleTestPing = (ws: WorkstationNode) => {
    setPingStatus((prev) => ({ ...prev, [ws.id]: { pinging: true } }));
    setTimeout(() => {
      const pingMs = (0.15 + Math.random() * 0.25).toFixed(2);
      setPingStatus((prev) => ({
        ...prev,
        [ws.id]: {
          pinging: false,
          result: `Reply from ${ws.ipAddress}: bytes=32 time=${pingMs}ms TTL=64 (Cat-6 1Gbps OK)`,
        },
      }));
    }, 450);
  };

  const handleEditOpen = (ws: WorkstationNode) => {
    setEditingWs(ws);
    setEditIp(ws.ipAddress);
    setEditName(ws.name);
    setEditNameBn(ws.nameBn);
    setEditNotes(ws.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWs) return;
    updateWorkstation(editingWs.id, {
      ipAddress: editIp.trim(),
      name: editName.trim(),
      nameBn: editNameBn.trim(),
      notes: editNotes.trim(),
    });
    setEditingWs(null);
  };

  const handleSwitchWorkstation = (wsId: string) => {
    setCurrentWorkstationId(wsId);
    const target = workstations.find((w) => w.id === wsId);
    setShowSwitchSuccess(
      lang === 'bn'
        ? `টার্মিনাল সফলভাবে পরিবর্তিত হয়েছে: ${target?.terminalCode} (${target?.nameBn}) [IP: ${target?.ipAddress}]`
        : `Terminal switched to: ${target?.terminalCode} (${target?.name}) [IP: ${target?.ipAddress}]`
    );
    setTimeout(() => setShowSwitchSuccess(null), 3500);
  };

  // Filter audit logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.details.toLowerCase().includes(searchAudit.toLowerCase()) ||
      log.username.toLowerCase().includes(searchAudit.toLowerCase()) ||
      log.ipAddress.includes(searchAudit) ||
      (log.patientId && log.patientId.toLowerCase().includes(searchAudit.toLowerCase())) ||
      (log.patientName && log.patientName.toLowerCase().includes(searchAudit.toLowerCase())) ||
      log.workstationCode.toLowerCase().includes(searchAudit.toLowerCase());

    const matchesWs =
      selectedWsFilter === 'ALL' || log.workstationCode.includes(selectedWsFilter);

    const matchesAction =
      selectedActionFilter === 'ALL' || log.actionType === selectedActionFilter;

    return matchesSearch && matchesWs && matchesAction;
  });

  const exportAuditLogs = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `adiba_hospital_lan_audit_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300';
      case 'LOGOUT':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
      case 'INVOICE_CREATE':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border-teal-300';
      case 'PATHOLOGY_REPORT':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300';
      case 'XRAY_REPORT':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300';
      case 'USG_REPORT':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300 border-cyan-300';
      case 'ECG_REPORT':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300';
      case 'PRESCRIPTION_CREATE':
        return 'bg-violet-100 text-violet-800 dark:bg-violet-950/70 dark:text-violet-300 border-violet-300';
      default:
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-300';
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Switch Notification Banner */}
      {showSwitchSuccess && (
        <div className="bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <span>{showSwitchSuccess}</span>
          </div>
          <button
            onClick={() => setShowSwitchSuccess(null)}
            className="text-white/80 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-xl border border-purple-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-md">
                <Network className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>
                    {lang === 'bn'
                      ? 'লোকাল এরিয়া নেটওয়ার্ক (LAN) ও ওয়ার্কস্টেশন কন্ট্রোল'
                      : 'Hospital LAN Network & Workstations Hub'}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/50">
                    Cat 6 Gigabit (1 Gbps)
                  </span>
                </h1>
                <p className="text-xs text-purple-200/90 mt-0.5">
                  {lang === 'bn'
                    ? 'অফিসের ৫ থেকে ১০টি কম্পিউটারের ক্যাট-৬ ক্যাবল সংযোগ, স্ট্যাটিক আইপি মনিটরিং, ইউজার অ্যাক্টিভিটি ট্র্যাক ও সেন্ট্রাল ডাটাবেজ রিয়েল-টাইম সিঙ্ক।'
                    : '5-10 Workstation Cat-6 Ethernet topology, Static IP assignment, live user audit logs & central DB sync.'}
                </p>
              </div>
            </div>
          </div>

          {/* Current PC Terminal Pill with 1-Click Switch */}
          <div className="bg-white/10 backdrop-blur-md border border-cyan-400/40 rounded-xl p-3 flex items-center gap-3 shrink-0">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="text-[10px] text-cyan-200 font-semibold uppercase tracking-wider">
                {lang === 'bn' ? 'বর্তমান কম্পিউটারের টার্মিনাল' : 'This PC Active Terminal'}
              </div>
              <div className="font-mono font-black text-sm text-white flex items-center gap-2">
                <span>{currentWorkstation.terminalCode}</span>
                <span className="text-xs text-cyan-300 font-sans font-medium">
                  ({lang === 'bn' ? currentWorkstation.nameBn : currentWorkstation.name})
                </span>
              </div>
              <div className="text-[11px] font-mono text-purple-200">
                Static IP: <strong className="text-yellow-300">{currentWorkstation.ipAddress}</strong> · Port {currentWorkstation.portNumber}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-5 border-t border-purple-800/60 pt-4 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('topology')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'topology'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'bg-purple-900/60 hover:bg-purple-800 text-purple-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'সেন্ট্রাল সুইচ ও নেটওয়ার্ক ম্যাপ' : 'Switch & Topology Map'}</span>
          </button>

          <button
            onClick={() => setActiveTab('workstations')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'workstations'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'bg-purple-900/60 hover:bg-purple-800 text-purple-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>
              {lang === 'bn' ? '১০টি ওয়ার্কস্টেশন ও আইপি কনফিগারেশন' : '10 Workstations & Static IPs'}
            </span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-950 text-cyan-300 font-mono">
              {workstations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'bg-purple-900/60 hover:bg-purple-800 text-purple-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'ইউজার ও আইপি অ্যাক্টিভিটি অডিট' : 'User & IP Activity Audit'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-950 text-yellow-300 font-mono">
              {auditLogs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'bg-purple-900/60 hover:bg-purple-800 text-purple-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'ক্যাট ৬ ক্যাবলিং ও হোস্ট সেটআপ গাইড' : 'Cat-6 Cable & Host Guide'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* TAB 1: VISUAL SWITCH TOPOLOGY & ARCHITECTURE               */}
      {/* ========================================================== */}
      {activeTab === 'topology' && (
        <div className="space-y-6">
          {/* Hardware Specs Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-purple-100 dark:border-gray-700 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Physical Topology
              </div>
              <div className="text-base font-extrabold text-purple-950 dark:text-purple-300 mt-1 flex items-center gap-1.5">
                <Network className="w-4 h-4 text-cyan-600" />
                <span>Star Topology</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Cat 6 UTP High-Speed</div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-purple-100 dark:border-gray-700 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                LAN Speed & Duplex
              </div>
              <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-500" />
                <span>1000 Mbps (1 Gbps)</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Full Duplex Gigabit Link</div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-purple-100 dark:border-gray-700 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Subnet & Gateway
              </div>
              <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
                192.168.1.0/24
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Gateway: 192.168.1.1</div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-purple-100 dark:border-gray-700 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Avg. Ping Latency
              </div>
              <div className="text-base font-extrabold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>~0.2 ms</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Zero Packet Drop (0.00%)</div>
            </div>
          </div>

          {/* Central Switch Physical Mockup */}
          <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-xl border-2 border-slate-700 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
                <div>
                  <h3 className="font-bold text-base text-white tracking-wide">
                    HOSPITAL GIGABIT MANAGED SWITCH (16-PORT CAT-6 RACKMOUNT)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Model: Cisco/TP-Link SG1016 Gigabit Switch · All 10 Workstations Connected & Active
                  </p>
                </div>
              </div>
              <div className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-800">
                Switch Status: Operational (10/10 Ports Linked)
              </div>
            </div>

            {/* 10 RJ-45 Gigabit Ports Visual */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
              {workstations.map((ws) => {
                const isCurrent = ws.id === currentWorkstationId;
                return (
                  <div
                    key={ws.id}
                    onClick={() => handleSwitchWorkstation(ws.id)}
                    className={`p-3 rounded-xl border transition cursor-pointer relative group ${
                      isCurrent
                        ? 'bg-purple-950/90 border-cyan-400 shadow-lg ring-2 ring-cyan-400/50'
                        : 'bg-slate-800/80 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                    }`}
                  >
                    {/* Port LED & Number */}
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-mono text-slate-400 font-bold">PORT #{ws.portNumber}</span>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      </div>
                    </div>

                    {/* RJ45 Plug Graphic */}
                    <div className="w-full h-8 bg-slate-950 rounded-md border border-slate-700 flex items-center justify-center font-mono text-[10px] text-cyan-300 font-bold mb-2">
                      RJ45 · {ws.terminalCode}
                    </div>

                    <div className="font-bold text-xs text-white truncate">
                      {lang === 'bn' ? ws.nameBn : ws.name}
                    </div>
                    <div className="text-[11px] font-mono text-cyan-400 mt-0.5 truncate">
                      {ws.ipAddress}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-700/60">
                      <span>{ws.department}</span>
                      <span className="text-emerald-400 font-mono font-bold">
                        {ws.latencyMs}ms
                      </span>
                    </div>

                    {isCurrent && (
                      <span className="absolute -top-2 right-2 bg-cyan-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                        THIS PC
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>যেকোনো পোর্টে ক্লিক করে ব্রাউজারে সেই ওয়ার্কস্টেশন টার্মিনাল সিলেক্ট করুন।</span>
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                Server Address: <strong>http://192.168.1.100:3000</strong>
              </span>
            </div>
          </div>

          {/* Real-time Data Sync Architecture Explanation */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-purple-100 dark:border-gray-700 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>{lang === 'bn' ? 'সেন্ট্রাল ডাটাবেজ ও রিয়েল-টাইম সার্চ কীভাবে কাজ করে?' : 'Central Database & Real-Time Sync Workflow'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-purple-50 dark:bg-purple-950/40 p-3.5 rounded-xl border border-purple-200 dark:border-purple-800">
                <div className="w-7 h-7 rounded-lg bg-purple-700 text-white flex items-center justify-center font-bold mb-2">
                  1
                </div>
                <div className="font-bold text-purple-950 dark:text-purple-300">
                  {lang === 'bn' ? 'কাউন্টার ১/২ এন্ট্রি ও ইউনিক আইডি' : 'Reception Entry & Unique Patient ID'}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                  রিসেপশন (192.168.1.101) বা ক্যাশ কাউন্টার (192.168.1.102) থেকে রোগী রেজিস্টার করলেই সিস্টেমে একটি ইউনিক আইডি (যেমন: 26100294) তৈরি হয় এবং সমস্ত প্রেসক্রাইবড টেস্ট সেন্ট্রাল ডাটাবেজে রেকর্ড হয়।
                </p>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <div className="w-7 h-7 rounded-lg bg-indigo-700 text-white flex items-center justify-center font-bold mb-2">
                  2
                </div>
                <div className="font-bold text-indigo-950 dark:text-indigo-300">
                  {lang === 'bn' ? 'ইনস্ট্যান্ট ল্যান ব্রডকাস্ট' : 'Instant LAN Broadcast (<0.1s)'}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                  ক্যাট-৬ ইথারনেট ক্যাবলের মাধ্যমে সাথে সাথেই ল্যাবরেটরি (PC-03), এক্স-রে (PC-05), আল্ট্রাসাউন্ড (PC-06) এবং ইসিজি (PC-07) এর স্ক্রিনে নোটিফিকেশন পৌঁছে যায়।
                </p>
              </div>

              <div className="bg-cyan-50 dark:bg-cyan-950/40 p-3.5 rounded-xl border border-cyan-200 dark:border-cyan-800">
                <div className="w-7 h-7 rounded-lg bg-cyan-700 text-white flex items-center justify-center font-bold mb-2">
                  3
                </div>
                <div className="font-bold text-cyan-950 dark:text-cyan-300">
                  {lang === 'bn' ? '১-ক্লিক সার্চ ও অটো-ফিল' : '1-Click ID Search & Auto-Fill'}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                  ল্যাব বা রেডিওলজি টেকনোলজিস্ট রোগীর আইডি দিয়ে সার্চ করলেই রোগীর নাম, বয়স, রেফার্ড ডাক্তার এবং টেস্টের নির্ধারিত ফরম্যাট চোখের পলকে স্ক্রিনে এসে হাজির হয়। নতুন করে টাইপ করার প্রয়োজন হয় না।
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 2: WORKSTATIONS LIST & STATIC IP CONFIGURATION        */}
      {/* ========================================================== */}
      {activeTab === 'workstations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-purple-950 dark:text-purple-200">
                {lang === 'bn' ? 'সংযুক্ত ১০টি পিসি ও আইপি কনফিগারেশন তালিকা' : 'Connected Workstations & Static IP Registry'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {lang === 'bn'
                  ? 'প্রতিটি পিসির নির্দিষ্ট স্ট্যাটিক আইপি, সুইচ পোর্ট এবং দায়িত্বশীল ইউজার রোল।'
                  : 'Designated Static IP address, assigned switch port and operator user account for each terminal.'}
              </p>
            </div>
            <div className="text-xs font-mono text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800">
              Active Workstations: <strong>10/10 Online</strong>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-purple-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-purple-950 text-purple-100 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Port / PC</th>
                    <th className="p-3">Workstation Name</th>
                    <th className="p-3">Static LAN IP</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Operator User</th>
                    <th className="p-3">Latency</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {workstations.map((ws) => {
                    const isCurrent = ws.id === currentWorkstationId;
                    const ping = pingStatus[ws.id];

                    return (
                      <tr
                        key={ws.id}
                        className={`hover:bg-purple-50/50 dark:hover:bg-gray-750 transition ${
                          isCurrent ? 'bg-cyan-50/70 dark:bg-cyan-950/30' : ''
                        }`}
                      >
                        <td className="p-3 font-mono font-bold text-purple-950 dark:text-purple-300 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] mr-1.5">
                            Port {ws.portNumber}
                          </span>
                          {ws.terminalCode}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-gray-900 dark:text-gray-100">
                            {lang === 'bn' ? ws.nameBn : ws.name}
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">
                            {ws.notes}
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-cyan-600 dark:text-cyan-400 whitespace-nowrap">
                          {ws.ipAddress}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300">
                            {ws.department}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          @{ws.assignedUserId}
                        </td>
                        <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                          {ws.latencyMs} ms
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {ws.status}
                          </span>
                        </td>
                        <td className="p-3 text-right whitespace-nowrap space-x-1">
                          <button
                            onClick={() => handleTestPing(ws)}
                            disabled={ping?.pinging}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-700 dark:text-slate-300 rounded text-[11px] font-mono cursor-pointer transition"
                            title="Ping IP via ICMP"
                          >
                            {ping?.pinging ? 'Pinging...' : 'Ping IP'}
                          </button>

                          <button
                            onClick={() => handleEditOpen(ws)}
                            className="px-2 py-1 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/60 dark:hover:bg-purple-800 text-purple-800 dark:text-purple-300 rounded text-[11px] cursor-pointer transition"
                            title="Edit static IP & details"
                          >
                            <Edit2 className="w-3 h-3 inline" />
                          </button>

                          <button
                            onClick={() => handleSwitchWorkstation(ws.id)}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition ${
                              isCurrent
                                ? 'bg-cyan-600 text-white'
                                : 'bg-purple-800 hover:bg-purple-900 text-white'
                            }`}
                          >
                            {isCurrent ? 'Active Desk' : 'Switch Desk'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ping Results Output Box if tested */}
          {Object.entries(pingStatus).some(([_, p]) => p.result) && (
            <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs border border-slate-800 shadow-md">
              <div className="text-slate-400 font-bold mb-1 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>LAN ICMP Ping Response Terminal Output:</span>
              </div>
              {Object.entries(pingStatus)
                .filter(([_, p]) => p.result)
                .map(([id, p]) => (
                  <div key={id} className="py-0.5">
                    &gt; {p.result}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 3: LIVE WORKSTATION ACTIVITY AUDIT LOG (কে কখন কি করল)  */}
      {/* ========================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-purple-950 dark:text-purple-200 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-700 dark:text-purple-400" />
                <span>
                  {lang === 'bn'
                    ? 'সেন্ট্রাল অ্যাডমিন কন্ট্রোল: ইউজার ও আইপি কার্যক্রম মনিটর'
                    : 'Central Admin Control: User & IP Activity Audit Log'}
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {lang === 'bn'
                  ? 'কে কোন সময়ে সিস্টেমে লগইন করেছে এবং কী কাজ করেছে (বিলিং, রিপোর্ট এন্ট্রি, প্রেসক্রিপশন) তার সম্পূর্ণ ডিজিটাল রেকর্ড।'
                  : 'Detailed track of who logged in from which IP/Workstation and what operations were performed.'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={exportAuditLogs}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'অডিট এক্সপোর্ট (JSON)' : 'Export Audit'}</span>
              </button>

              <button
                onClick={() => clearAuditLogs()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-950 dark:text-red-300 rounded-lg text-xs font-bold cursor-pointer"
                title="Audit Trail is Immutable"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'লগ সুরক্ষা চেক' : 'Audit Lock Check'}</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-purple-100 dark:border-gray-700 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchAudit}
                onChange={(e) => setSearchAudit(e.target.value)}
                placeholder={
                  lang === 'bn'
                    ? 'আইপি, ইউজার, পেশেন্ট আইডি বা বিবরণ দিয়ে খুঁজুন...'
                    : 'Filter by IP, username, Patient ID, or action keywords...'
                }
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-slate-50 dark:bg-gray-900 text-xs focus:ring-2 focus:ring-purple-600 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                value={selectedWsFilter}
                onChange={(e) => setSelectedWsFilter(e.target.value)}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs font-semibold outline-none"
              >
                <option value="ALL">{lang === 'bn' ? 'সকল ওয়ার্কস্টেশন' : 'All Workstations'}</option>
                <option value="PC-01">PC-01 (Reception)</option>
                <option value="PC-02">PC-02 (Billing Counter)</option>
                <option value="PC-03">PC-03 (Pathology Lab 1)</option>
                <option value="PC-04">PC-04 (Pathology Lab 2)</option>
                <option value="PC-05">PC-05 (Digital X-Ray)</option>
                <option value="PC-06">PC-06 (Ultrasound)</option>
                <option value="PC-07">PC-07 (ECG Station)</option>
                <option value="PC-08">PC-08 (Doctor OPD 1)</option>
                <option value="PC-09">PC-09 (Doctor OPD 2)</option>
                <option value="PC-10">PC-10 (Server Admin)</option>
              </select>

              <select
                value={selectedActionFilter}
                onChange={(e) => setSelectedActionFilter(e.target.value)}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs font-semibold outline-none"
              >
                <option value="ALL">{lang === 'bn' ? 'সকল অ্যাকশন' : 'All Action Types'}</option>
                <option value="LOGIN">লগইন (LOGIN)</option>
                <option value="LOGOUT">লগআউট (LOGOUT)</option>
                <option value="INVOICE_CREATE">ইনভয়েস তৈরি (INVOICE)</option>
                <option value="PATHOLOGY_REPORT">প্যাথলজি রিপোর্ট (PATHOLOGY)</option>
                <option value="XRAY_REPORT">এক্স-রে রিপোর্ট (X-RAY)</option>
                <option value="USG_REPORT">আল্ট্রাসাউন্ড রিপোর্ট (USG)</option>
                <option value="ECG_REPORT">ইসিজি রিপোর্ট (ECG)</option>
                <option value="PRESCRIPTION_CREATE">প্রেসক্রিপশন (Rx)</option>
                <option value="LAN_SYNC">LAN সিঙ্ক (SYNC)</option>
              </select>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-purple-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-purple-950 text-purple-100 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Time</th>
                    <th className="p-3">Workstation / IP</th>
                    <th className="p-3">User & Role</th>
                    <th className="p-3">Action Type</th>
                    <th className="p-3">Operation Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                        {lang === 'bn' ? 'কোনো অডিট রেকর্ড পাওয়া যায়নি।' : 'No activity audit logs matched the filters.'}
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-purple-50/40 dark:hover:bg-gray-750 transition">
                        <td className="p-3 font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap text-[11px]">
                          {log.timestamp}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="font-bold text-gray-900 dark:text-gray-100 font-mono text-[11px]">
                            {log.workstationCode}
                          </div>
                          <div className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
                            IP: {log.ipAddress}
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="font-bold text-purple-900 dark:text-purple-300">
                            {log.userFullName}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            @{log.username} ({log.role})
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadgeColor(
                              log.actionType
                            )}`}
                          >
                            {log.actionType}
                          </span>
                        </td>
                        <td className="p-3 text-gray-700 dark:text-gray-300">
                          <div>{log.details}</div>
                          {log.patientId && (
                            <div className="text-[10px] text-purple-700 dark:text-purple-400 font-mono mt-0.5">
                              Patient ID: <strong>{log.patientId}</strong>
                              {log.patientName && ` (${log.patientName})`}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 4: CAT-6 CABLING & LAN SERVER SETUP GUIDE               */}
      {/* ========================================================== */}
      {activeTab === 'guide' && (
        <div className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-purple-100 dark:border-gray-700 shadow-xs text-xs">
          <div>
            <h3 className="text-lg font-bold text-purple-950 dark:text-purple-200 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-600" />
              <span>
                {lang === 'bn'
                  ? 'লোকাল নেটওয়ার্ক (LAN) ও Cat 6 ক্যাবল সংযোগ বাস্তবায়ন গাইড'
                  : 'Hospital Local Area Network (LAN) & Cat 6 Setup Manual'}
              </span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {lang === 'bn'
                ? 'হাসপাতাল বা ক্লিনিকের ৫ থেকে ১০টি পিসি কীভাবে ক্যাট-৬ ক্যাবল ও সেন্ট্রাল সুইচের সাথে যুক্ত করবেন তার বিস্তারিত প্রক্রিয়া।'
                : 'Physical wiring, switch configuration, and static IP assignments for the hospital local network.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1: Physical Cabling */}
            <div className="bg-slate-50 dark:bg-gray-900/60 p-4 rounded-xl border border-slate-200 dark:border-gray-700 space-y-2">
              <div className="font-bold text-sm text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full bg-purple-700 text-white flex items-center justify-center text-xs">
                  ১
                </span>
                <span>ফিজিক্যাল কানেকশন ও Cat 6 ক্যাবলিং</span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-gray-600 dark:text-gray-300 pl-2">
                <li>
                  প্রতিটি কম্পিউটারের সাথে সেন্ট্রাল সুইচের সংযোগের জন্য <strong>Cat 6 UTP</strong> ইথারনেট ক্যাবল ব্যবহার করুন।
                </li>
                <li>
                  কানেক্টরে <strong>T568B কালার কোডিং</strong> স্ট্যান্ডার্ড মেনে আরজে-৪৫ (RJ-45) ক্লিপ ক্রিম্প করুন।
                </li>
                <li>
                  সুইচ হিসেবে ১৬-পোর্ট বা ২৪-পোর্ট <strong>Gigabit (10/100/1000 Mbps)</strong> সুইচ ব্যবহার করা আবশ্যক।
                </li>
              </ul>
            </div>

            {/* Step 2: Static IP Setup */}
            <div className="bg-slate-50 dark:bg-gray-900/60 p-4 rounded-xl border border-slate-200 dark:border-gray-700 space-y-2">
              <div className="font-bold text-sm text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full bg-purple-700 text-white flex items-center justify-center text-xs">
                  ২
                </span>
                <span>উইন্ডোজ পিসিতে Static IP বসানোর নিয়ম</span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-gray-600 dark:text-gray-300 pl-2">
                <li>
                  উইন্ডোজের <code>ncpa.cpl</code> (Network Connections) ওপেন করে Ethernet Properties এ যান।
                </li>
                <li>
                  <strong>Internet Protocol Version 4 (TCP/IPv4)</strong> সিলেক্ট করে Properties ক্লিক করুন।
                </li>
                <li>
                  <strong>Use the following IP address</strong> সিলেক্ট করুন:
                  <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 font-mono mt-1 text-[11px]">
                    IP Address: 192.168.1.10X (যেমন পিসি-০১ এর জন্য 192.168.1.101)<br />
                    Subnet Mask: 255.255.255.0<br />
                    Default Gateway: 192.168.1.1
                  </div>
                </li>
              </ul>
            </div>

            {/* Step 3: Main Server PC */}
            <div className="bg-slate-50 dark:bg-gray-900/60 p-4 rounded-xl border border-slate-200 dark:border-gray-700 space-y-2">
              <div className="font-bold text-sm text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full bg-purple-700 text-white flex items-center justify-center text-xs">
                  ৩
                </span>
                <span>সেন্ট্রাল সার্ভার পিসি কনফিগারেশন</span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-gray-600 dark:text-gray-300 pl-2">
                <li>
                  যে কম্পিউটারটিকে মেইন ডাটাবেজ সার্ভার করবেন সেটির আইপি দিন <strong>192.168.1.100</strong>।
                </li>
                <li>
                  উইন্ডোজ ডিফেন্ডার ফায়ারওয়ালে পোর্ট <strong>3000</strong> এর জন্য ইনবাউন্ড রুল (Inbound Rule) অন করুন।
                </li>
                <li>
                  অন্যান্য সমস্ত কম্পিউটার (PC-01 থেকে PC-09) ব্রাউজারে প্রবেশ করবে এই লিংকে:
                  <div className="bg-purple-950 text-cyan-300 p-2 rounded font-mono font-bold mt-1 text-center">
                    http://192.168.1.100:3000
                  </div>
                </li>
              </ul>
            </div>

            {/* Step 4: Security & Auto-Sync */}
            <div className="bg-slate-50 dark:bg-gray-900/60 p-4 rounded-xl border border-slate-200 dark:border-gray-700 space-y-2">
              <div className="font-bold text-sm text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full bg-purple-700 text-white flex items-center justify-center text-xs">
                  ৪
                </span>
                <span>নিরাপত্তা ও রিয়েল-টাইম অডিট ট্র্যাকিং</span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-gray-600 dark:text-gray-300 pl-2">
                <li>
                  প্রতিটি পিসির জন্য আলাদা ইউজার একাউন্ট নির্ধারিত থাকায় কেউ অন্যের মডিউলে অনুমতি ছাড়া প্রবেশ করতে পারবে না।
                </li>
                <li>
                  অ্যাডমিন প্যানেলের <strong>লাইভ অ্যাক্টিভিটি অডিট</strong> থেকে প্রতি মুহূর্তে কে কোন আইপি থেকে কী কাজ করেছে তা মনিটর করা যাবে।
                </li>
                <li>
                  নেটওয়ার্ক তারের মাধ্যমে সেকেন্ডের এক ভগ্নাংশে সমস্ত ডাটা সিঙ্ক হয়ে যায়।
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Edit Workstation Modal */}
      {editingWs && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-purple-200 dark:border-gray-700 overflow-hidden text-xs">
            <div className="bg-purple-950 text-white p-4 font-bold flex justify-between items-center">
              <span>{lang === 'bn' ? 'ওয়ার্কস্টেশন ও আইপি সম্পাদনা' : 'Edit Workstation & Static IP'}</span>
              <button onClick={() => setEditingWs(null)} className="text-white/80 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Terminal Code:
                </label>
                <input
                  type="text"
                  disabled
                  value={editingWs.terminalCode}
                  className="w-full bg-gray-100 dark:bg-gray-700 p-2 rounded font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Static IP Address:
                </label>
                <input
                  type="text"
                  value={editIp}
                  onChange={(e) => setEditIp(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded font-mono font-bold text-cyan-600"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Workstation Name (English):
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  ওয়ার্কস্টেশনের নাম (বাংলা):
                </label>
                <input
                  type="text"
                  value={editNameBn}
                  onChange={(e) => setEditNameBn(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Notes / কার্যবিবরণী:
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setEditingWs(null)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-bold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-800 hover:bg-purple-900 text-white rounded-lg font-bold cursor-pointer"
                >
                  {t.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
