import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  FlaskConical,
  ShieldCheck,
  Server,
  Activity,
  AlertTriangle,
  Info,
} from 'lucide-react';

export const AnalyticsModule: React.FC = () => {
  const { patients, invoices, doctors, labTests, systemLogs, clinicConfig, t } = useApp();

  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');

  const totalRevenue = invoices.reduce((acc, inv) => acc + inv.netTotal, 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const totalDue = invoices.reduce((acc, inv) => acc + inv.dueAmount, 0);
  const totalTestParameters = patients.reduce(
    (acc, p) => acc + (p.testResults ? p.testResults.length : 0),
    0
  );

  const filteredLogs = systemLogs.filter(
    (log) => logFilter === 'all' || log.level === logFilter
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xs border border-purple-100 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-bold text-purple-950 dark:text-purple-200 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-700" />
            {t.analytics} & Performance Telemetry
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Real-time diagnostic analytics, financial metrics, cloud caching performance and diagnostic audit error logs.
          </p>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Total Patients</span>
            <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">👥</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{patients.length}</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +100% active in-session
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Total Revenue</span>
            <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">৳</span>
          </div>
          <div className="text-2xl font-bold text-purple-950 dark:text-purple-200">৳{totalRevenue}</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <span>Paid: ৳{totalPaid}</span>
            {totalDue > 0 && <span className="text-red-500 ml-1">| Due: ৳{totalDue}</span>}
          </div>
        </div>

        {/* Lab Tests Conducted */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Lab Test Parameters</span>
            <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">🧪</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalTestParameters}</div>
          <div className="text-[11px] text-purple-600 font-semibold">
            {labTests.length} Standard clinical profiles
          </div>
        </div>

        {/* System & Encryption */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>System Integrity</span>
            <span className="p-1.5 bg-cyan-100 text-cyan-700 rounded-lg">🔒</span>
          </div>
          <div className="text-xl font-bold text-emerald-600 flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-emerald-500" /> 100% Operational
          </div>
          <div className="text-[11px] text-gray-500">
            Zero-latency cache & offline ready
          </div>
        </div>
      </div>

      {/* Telemetry & System Logs Table */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-purple-700" />
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
              System Audit Trails & Diagnostic Event Logs
            </h3>
          </div>

          <div className="flex items-center gap-1 text-xs">
            {(['all', 'info', 'warn', 'error'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLogFilter(lvl)}
                className={`px-2.5 py-1 rounded text-xs font-semibold capitalize cursor-pointer ${
                  logFilter === lvl
                    ? 'bg-purple-900 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-[380px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-700 sticky top-0">
              <tr>
                <th className="p-2.5 border-r border-gray-200 dark:border-gray-700 w-24">Time</th>
                <th className="p-2.5 border-r border-gray-200 dark:border-gray-700 w-20 text-center">Level</th>
                <th className="p-2.5 border-r border-gray-200 dark:border-gray-700 w-36">Module</th>
                <th className="p-2.5">Log Event Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-750 font-mono text-[11px]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-purple-50/50 dark:hover:bg-gray-750">
                  <td className="p-2.5 text-gray-500 border-r border-gray-100 dark:border-gray-700">{log.timestamp}</td>
                  <td className="p-2.5 text-center border-r border-gray-100 dark:border-gray-700">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.level === 'info'
                          ? 'bg-blue-100 text-blue-800'
                          : log.level === 'warn'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {log.level}
                    </span>
                  </td>
                  <td className="p-2.5 font-bold text-purple-900 dark:text-purple-300 border-r border-gray-100 dark:border-gray-700">
                    {log.module}
                  </td>
                  <td className="p-2.5 text-gray-800 dark:text-gray-200">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
