import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ExpenseItem, Invoice, Patient, Doctor } from '../../types';
import { AddExpenseModal } from './AddExpenseModal';
import { FinancialReportModal } from './FinancialReportModal';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Stethoscope,
  Building2,
  FlaskConical,
  Activity,
  Film,
  Waves,
  Receipt,
  UserCheck,
  Plus,
  Trash2,
  Printer,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  PieChart,
  Percent,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Sparkles,
} from 'lucide-react';

export const IncomeExpenseModule: React.FC = () => {
  const { invoices, patients, doctors, expenses, deleteExpense, clinicConfig, lang } = useApp();

  // Date Filter State
  const todayStr = new Date().toISOString().split('T')[0];
  const [datePreset, setDatePreset] = useState<'today' | 'yesterday' | 'week' | 'month' | 'lastMonth' | 'all' | 'custom'>('month');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // 1st day of current month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(todayStr);

  // Modals state
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [expandedDoctorId, setExpandedDoctorId] = useState<string | null>(null);

  // Commission % setting for doctor referrals
  const [commissionRate, setCommissionRate] = useState<number>(25);

  // Search query for expense ledger
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');

  // Handle Preset Quick Clicks
  const handlePresetChange = (preset: typeof datePreset) => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === 'today') {
      const today = now.toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(now.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'week') {
      const w = new Date();
      w.setDate(now.getDate() - 7);
      setStartDate(w.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'month') {
      const m = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(m.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'lastMonth') {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(first.toISOString().split('T')[0]);
      setEndDate(last.toISOString().split('T')[0]);
    } else if (preset === 'all') {
      setStartDate('2020-01-01');
      setEndDate('2030-12-31');
    }
  };

  // 1. Filtered Invoices within Date Range
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const invDate = inv.date || inv.createdAt?.split('T')[0] || todayStr;
      return invDate >= startDate && invDate <= endDate;
    });
  }, [invoices, startDate, endDate, todayStr]);

  // 2. Filtered Expenses within Date Range
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchDate = exp.date >= startDate && exp.date <= endDate;
      const matchCategory =
        expenseCategoryFilter === 'all' || exp.category === expenseCategoryFilter;
      const matchSearch =
        !expenseSearch ||
        exp.title.toLowerCase().includes(expenseSearch.toLowerCase()) ||
        exp.voucherNo.toLowerCase().includes(expenseSearch.toLowerCase()) ||
        exp.vouchedBy.toLowerCase().includes(expenseSearch.toLowerCase());
      return matchDate && matchCategory && matchSearch;
    });
  }, [expenses, startDate, endDate, expenseCategoryFilter, expenseSearch]);

  // Total Income, Expenses, Net Profit
  const totalIncome = filteredInvoices.reduce((sum, inv) => sum + (inv.paidAmount || inv.netTotal || 0), 0);
  const totalBilled = filteredInvoices.reduce((sum, inv) => sum + (inv.netTotal || 0), 0);
  const totalDue = filteredInvoices.reduce((sum, inv) => sum + (inv.dueAmount || 0), 0);
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const netProfit = totalIncome - totalExpenses;

  // 3. Department-wise Income Breakdown Calculation
  const departmentSummaries = useMemo(() => {
    const deptTotals: Record<string, { count: number; revenue: number }> = {
      Pathology: { count: 0, revenue: 0 },
      XRay: { count: 0, revenue: 0 },
      ECG: { count: 0, revenue: 0 },
      Ultrasound: { count: 0, revenue: 0 },
      DoctorVisit: { count: 0, revenue: 0 },
      Other: { count: 0, revenue: 0 },
    };

    filteredInvoices.forEach((inv) => {
      if (inv.items && inv.items.length > 0) {
        inv.items.forEach((item) => {
          const cat = (item.category || '').toLowerCase();
          const name = (item.testName || '').toLowerCase();

          if (
            cat.includes('hematology') ||
            cat.includes('biochemistry') ||
            cat.includes('clinical') ||
            cat.includes('microbiology') ||
            cat.includes('immunology') ||
            name.includes('cbc') ||
            name.includes('blood') ||
            name.includes('urine') ||
            name.includes('rbs')
          ) {
            deptTotals.Pathology.count += 1;
            deptTotals.Pathology.revenue += item.price;
          } else if (cat.includes('x-ray') || cat.includes('xray') || name.includes('x-ray')) {
            deptTotals.XRay.count += 1;
            deptTotals.XRay.revenue += item.price;
          } else if (cat.includes('ecg') || name.includes('ecg')) {
            deptTotals.ECG.count += 1;
            deptTotals.ECG.revenue += item.price;
          } else if (cat.includes('ultrasound') || cat.includes('usg') || name.includes('usg')) {
            deptTotals.Ultrasound.count += 1;
            deptTotals.Ultrasound.revenue += item.price;
          } else if (cat.includes('opd') || cat.includes('visit') || name.includes('visit')) {
            deptTotals.DoctorVisit.count += 1;
            deptTotals.DoctorVisit.revenue += item.price;
          } else {
            deptTotals.Other.count += 1;
            deptTotals.Other.revenue += item.price;
          }
        });
      } else {
        // Fallback to invoice net total in other
        deptTotals.Pathology.count += 1;
        deptTotals.Pathology.revenue += inv.netTotal;
      }
    });

    const totalCalculatedRev =
      Object.values(deptTotals).reduce((sum, d) => sum + d.revenue, 0) || totalIncome || 1;

    return [
      {
        name: 'Pathology Lab',
        nameBn: 'প্যাথলজি ল্যাব (সিবিসি, আরবিএস, ইউরিন ও বায়োকেমিস্ট্রি)',
        count: deptTotals.Pathology.count,
        revenue: deptTotals.Pathology.revenue,
        percentage: (deptTotals.Pathology.revenue / totalCalculatedRev) * 100,
        color: 'from-purple-600 to-indigo-700',
        textColor: 'text-purple-700 dark:text-purple-300',
        bgColor: 'bg-purple-100 dark:bg-purple-950/60',
        icon: FlaskConical,
      },
      {
        name: 'Digital X-Ray',
        nameBn: 'ডিজিটাল এক্স-রে ইমেজিং শাখা',
        count: deptTotals.XRay.count,
        revenue: deptTotals.XRay.revenue,
        percentage: (deptTotals.XRay.revenue / totalCalculatedRev) * 100,
        color: 'from-slate-600 to-zinc-700',
        textColor: 'text-slate-700 dark:text-slate-300',
        bgColor: 'bg-slate-100 dark:bg-slate-800',
        icon: Film,
      },
      {
        name: 'ECG Department',
        nameBn: 'ইসিজি (Electrocardiogram) শাখা',
        count: deptTotals.ECG.count,
        revenue: deptTotals.ECG.revenue,
        percentage: (deptTotals.ECG.revenue / totalCalculatedRev) * 100,
        color: 'from-rose-600 to-red-700',
        textColor: 'text-rose-700 dark:text-rose-300',
        bgColor: 'bg-rose-100 dark:bg-rose-950/60',
        icon: Activity,
      },
      {
        name: 'Ultrasound (USG)',
        nameBn: 'আল্ট্রাসনোগ্রাফি (USG 4D) শাখা',
        count: deptTotals.Ultrasound.count,
        revenue: deptTotals.Ultrasound.revenue,
        percentage: (deptTotals.Ultrasound.revenue / totalCalculatedRev) * 100,
        color: 'from-cyan-600 to-blue-700',
        textColor: 'text-cyan-700 dark:text-cyan-300',
        bgColor: 'bg-cyan-100 dark:bg-cyan-950/60',
        icon: Waves,
      },
      {
        name: 'Doctor OPD Visits',
        nameBn: 'ডক্টর ভিজিট ও ওপিডি কনসালটেশন',
        count: deptTotals.DoctorVisit.count,
        revenue: deptTotals.DoctorVisit.revenue,
        percentage: (deptTotals.DoctorVisit.revenue / totalCalculatedRev) * 100,
        color: 'from-blue-600 to-indigo-700',
        textColor: 'text-blue-700 dark:text-blue-300',
        bgColor: 'bg-blue-100 dark:bg-blue-950/60',
        icon: Stethoscope,
      },
      {
        name: 'Other Diagnostic Services',
        nameBn: 'সাধারণ ডায়াগনস্টিক কাউন্টার ও বিবিধ',
        count: deptTotals.Other.count,
        revenue: deptTotals.Other.revenue,
        percentage: (deptTotals.Other.revenue / totalCalculatedRev) * 100,
        color: 'from-emerald-600 to-teal-700',
        textColor: 'text-emerald-700 dark:text-emerald-300',
        bgColor: 'bg-emerald-100 dark:bg-emerald-950/60',
        icon: Receipt,
      },
    ];
  }, [filteredInvoices, totalIncome]);

  // 4. Doctor-wise Work & Referral Volume Calculation
  const doctorSummaries = useMemo(() => {
    return doctors.map((doc) => {
      // Find invoices referred by this doctor in date range
      const docInvoices = filteredInvoices.filter(
        (inv) =>
          inv.drCode?.toLowerCase() === doc.code?.toLowerCase() ||
          inv.drName?.toLowerCase().includes(doc.name?.toLowerCase())
      );

      const patientCount = docInvoices.length;
      const totalBill = docInvoices.reduce((sum, inv) => sum + (inv.netTotal || 0), 0);
      const commission = Math.round((totalBill * commissionRate) / 100);

      return {
        id: doc.id,
        code: doc.code,
        name: doc.name,
        specialty: doc.specialty,
        phone: doc.phone,
        roomNo: doc.roomNo,
        patientCount,
        totalBill,
        commission,
        invoices: docInvoices,
      };
    }).sort((a, b) => b.totalBill - a.totalBill);
  }, [doctors, filteredInvoices, commissionRate]);

  // Human-readable date label
  const dateLabel = useMemo(() => {
    if (datePreset === 'today') return lang === 'bn' ? 'আজকের হিসাব' : "Today's Accounts";
    if (datePreset === 'yesterday') return lang === 'bn' ? 'গতকালের হিসাব' : "Yesterday's Accounts";
    if (datePreset === 'week') return lang === 'bn' ? 'গত ৭ দিনের হিসাব' : 'Last 7 Days';
    if (datePreset === 'month') return lang === 'bn' ? 'চলতি মাসের হিসাব' : 'This Month';
    if (datePreset === 'lastMonth') return lang === 'bn' ? 'গত মাসের হিসাব' : 'Last Month';
    if (datePreset === 'all') return lang === 'bn' ? 'সকল সময়ের হিসাব' : 'All Time Records';
    return `${startDate} হতে ${endDate}`;
  }, [datePreset, startDate, endDate, lang]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 p-6 rounded-2xl shadow-xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border border-purple-800/80">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-pink-600 flex items-center justify-center shadow-lg border border-white/20">
            <DollarSign className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {lang === 'bn' ? 'আয়-ব্যয় ও বিভাগীয় হিসাব ব্যবস্থাপনা' : 'Income, Expenses & Accounts'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                PRO Financial
              </span>
            </div>
            <p className="text-xs text-purple-200 mt-0.5">
              {lang === 'bn'
                ? 'প্রতিটি বিভাগ থেকে আয়, কোন ডাক্তার কতো কাজ দিয়েছে এবং তারিখ অনুযায়ী সার্বিক হিসাব নিরীক্ষা'
                : 'Departmental income breakdown, doctor referral volume, and daily expense ledger'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowReportModal(true)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <Printer className="w-4 h-4 text-purple-300" />
            <span>{lang === 'bn' ? 'আর্থিক স্টেটমেন্ট প্রিন্ট' : 'Print Statement'}</span>
          </button>
          <button
            onClick={() => setShowAddExpense(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black shadow-lg transition flex items-center gap-1.5 cursor-pointer active:scale-95 border border-amber-300/40"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'bn' ? '+ নতুন ব্যয় যুক্ত করুন' : '+ Record Expense'}</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar (তারিখ অনুযায়ী ফিল্টারিং) */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-700 dark:text-purple-400" />
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
              {lang === 'bn' ? 'তারিখ অনুযায়ী ফিল্টার করুন (Date Filter):' : 'Filter by Date:'}
            </span>
            <span className="px-2.5 py-0.5 bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 text-xs font-bold rounded-md">
              {dateLabel}
            </span>
          </div>

          <div className="text-[11px] text-gray-500 font-mono">
            {startDate} <span className="text-purple-500 font-bold">➔</span> {endDate}
          </div>
        </div>

        {/* Quick Preset Buttons & Custom Picker */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-gray-100 dark:border-gray-750">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'today', labelBn: 'আজ (Today)', labelEn: 'Today' },
              { id: 'yesterday', labelBn: 'গতকাল', labelEn: 'Yesterday' },
              { id: 'week', labelBn: 'গত ৭ দিন', labelEn: 'Last 7 Days' },
              { id: 'month', labelBn: 'চলতি মাস (This Month)', labelEn: 'This Month' },
              { id: 'lastMonth', labelBn: 'গত মাস', labelEn: 'Last Month' },
              { id: 'all', labelBn: 'সকল সময়', labelEn: 'All Time' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePresetChange(p.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  datePreset === p.id
                    ? 'bg-purple-900 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-900'
                }`}
              >
                {lang === 'bn' ? p.labelBn : p.labelEn}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 font-medium">{lang === 'bn' ? 'কাস্টম:' : 'Custom:'}</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('custom');
              }}
              className="px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-750 text-gray-800 dark:text-gray-200 font-mono text-xs outline-none"
            />
            <span className="text-gray-400 font-bold">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('custom');
              }}
              className="px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-750 text-gray-800 dark:text-gray-200 font-mono text-xs outline-none"
            />
          </div>
        </div>
      </div>

      {/* 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-white to-emerald-50/30 dark:from-emerald-950/40 dark:via-gray-800 dark:to-gray-800 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs text-emerald-800 dark:text-emerald-300 font-bold">
            <span className="flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              {lang === 'bn' ? 'মোট আদায়কৃত আয়' : 'Total Collected Income'}
            </span>
            <span className="p-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 rounded-lg">
              ৳
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
            ৳{totalIncome.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-500 flex justify-between">
            <span>মোট ইনভয়েস: {filteredInvoices.length} টি</span>
            <span className="font-semibold text-emerald-600">আদায়: ১০০%</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-gradient-to-br from-red-500/10 via-white to-rose-50/30 dark:from-red-950/40 dark:via-gray-800 dark:to-gray-800 p-5 rounded-2xl border border-red-200 dark:border-red-800 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs text-red-800 dark:text-red-300 font-bold">
            <span className="flex items-center gap-1.5">
              <ArrowDownRight className="w-4 h-4 text-red-600" />
              {lang === 'bn' ? 'মোট ব্যয় / খরচ' : 'Total Clinic Expenses'}
            </span>
            <span className="p-1.5 bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200 rounded-lg">
              ভাউচার
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400 font-mono">
            ৳{totalExpenses.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-500 flex justify-between">
            <span>মোট ভাউচার: {filteredExpenses.length} টি</span>
            <span className="text-red-600 font-semibold">{dateLabel}</span>
          </div>
        </div>

        {/* Net Profit / Surplus */}
        <div className={`p-5 rounded-2xl border shadow-xs space-y-2 bg-gradient-to-br ${
          netProfit >= 0
            ? 'from-purple-500/10 via-white to-indigo-50/30 dark:from-purple-950/40 dark:via-gray-800 dark:to-gray-800 border-purple-200 dark:border-purple-800'
            : 'from-amber-500/10 via-white to-red-50/30 dark:from-red-950/40 dark:via-gray-800 dark:to-gray-800 border-amber-200 dark:border-amber-800'
        }`}>
          <div className="flex justify-between items-center text-xs font-bold text-purple-900 dark:text-purple-300">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              {lang === 'bn' ? 'নিট লাভ / উদ্বৃত্ত (Net Profit)' : 'Net Profit / Surplus'}
            </span>
            <span className={`p-1.5 rounded-lg text-xs font-bold ${netProfit >= 0 ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200' : 'bg-red-100 text-red-800'}`}>
              {netProfit >= 0 ? '+ লাভ' : '- ঘাটতি'}
            </span>
          </div>
          <div className={`text-2xl sm:text-3xl font-black font-mono ${netProfit >= 0 ? 'text-purple-950 dark:text-purple-200' : 'text-red-600 dark:text-red-400'}`}>
            ৳{netProfit.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-500">
            {lang === 'bn' ? 'মোট আয় থেকে মোট খরচ বাদ' : 'Revenue minus all operational costs'}
          </div>
        </div>

        {/* Due & Receivable */}
        <div className="bg-gradient-to-br from-amber-500/10 via-white to-amber-50/30 dark:from-amber-950/40 dark:via-gray-800 dark:to-gray-800 p-5 rounded-2xl border border-amber-200 dark:border-amber-800 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs text-amber-800 dark:text-amber-300 font-bold">
            <span>{lang === 'bn' ? 'বকেয়া টাকা (Due)' : 'Outstanding Due'}</span>
            <span className="p-1.5 bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 rounded-lg">
              বকেয়া
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-400 font-mono">
            ৳{totalDue.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-500">
            সর্বমোট বিলিং: ৳{totalBilled.toLocaleString()}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: প্রতিটি বিভাগ থেকে আয় (Department Income) */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-700" />
              <span>{lang === 'bn' ? '১. প্রতিটি বিভাগ থেকে আয় (Department-wise Income Breakdown)' : '1. Department-wise Income Breakdown'}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {lang === 'bn'
                ? 'ল্যাব, এক্স-রে, ইসিজি, আল্ট্রাসাউন্ড ও ওপিডি বিভাগ থেকে নির্দিষ্ট সময়ে কত টাকা আয় হয়েছে'
                : 'Revenue generated across Pathology, X-Ray, ECG, Ultrasound and OPD visits'}
            </p>
          </div>

          <div className="text-xs font-bold text-purple-950 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 font-mono">
            সর্বমোট বিভাগীয় আয়: ৳{totalIncome.toLocaleString()}
          </div>
        </div>

        {/* Department Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departmentSummaries.map((dept) => {
            const Icon = dept.icon;
            return (
              <div
                key={dept.name}
                className="bg-slate-50 dark:bg-gray-750 p-4 rounded-xl border border-slate-200 dark:border-gray-700 shadow-xs hover:border-purple-300 dark:hover:border-purple-600 transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${dept.bgColor} ${dept.textColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-xs text-gray-900 dark:text-gray-100">
                        {lang === 'bn' ? dept.nameBn : dept.name}
                      </h3>
                    </div>
                    <span className="font-mono text-xs font-black text-purple-700 dark:text-purple-300">
                      {dept.percentage.toFixed(1)}%
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 block">মোট সংগৃহীত আয়</span>
                      <span className="text-xl font-black font-mono text-gray-900 dark:text-gray-100">
                        ৳{dept.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 block">সেবা / টেস্ট সংখ্যা</span>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 font-mono">
                        {dept.count} টি
                      </span>
                    </div>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-650 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${dept.color}`}
                      style={{ width: `${Math.min(100, Math.max(4, dept.percentage))}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 2: কোন ডাক্তার কতো কাজ দিয়েছে (Doctor Referral) */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-purple-700" />
              <span>{lang === 'bn' ? '২. কোন ডাক্তার কতো কাজ দিয়েছে (Doctor-wise Referral & Business Volume)' : '2. Doctor-wise Referral & Business Volume'}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {lang === 'bn'
                ? 'নির্বাচিত তারিখ অনুযায়ী ডাক্তার ভিত্তিক রেফার্ড রোগীর সংখ্যা, মোট টেস্টের মূল্য ও রেফারেল কমিশন'
                : 'Doctor-wise business contribution, patient referrals, and commission honorarium'}
            </p>
          </div>

          {/* Commission percentage slider/controller */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-gray-750 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-gray-700 text-xs">
            <span className="font-bold text-gray-600 dark:text-gray-300">
              {lang === 'bn' ? 'রেফারেল কমিশন:' : 'Commission:'}
            </span>
            <div className="flex items-center gap-1 font-mono font-bold text-purple-700 dark:text-purple-300">
              {[15, 20, 25, 30].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setCommissionRate(rate)}
                  className={`px-1.5 py-0.5 rounded text-[11px] cursor-pointer transition ${
                    commissionRate === rate
                      ? 'bg-purple-900 text-white'
                      : 'hover:bg-purple-100 dark:hover:bg-gray-650'
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Doctors Referral Table */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 dark:bg-gray-750 text-gray-700 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="p-3 w-16 text-center">কোড</th>
                <th className="p-3">ডাক্তারের নাম ও পদবি</th>
                <th className="p-3">চেম্বার / ফোন</th>
                <th className="p-3 text-center">রেফার্ড রোগী</th>
                <th className="p-3 text-right">মোট টেস্টের বিল (৳)</th>
                <th className="p-3 text-right">কমিশন ({commissionRate}%)</th>
                <th className="p-3 text-center w-24">ডিটেইলস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {doctorSummaries.map((doc) => {
                const isExpanded = expandedDoctorId === doc.id;
                return (
                  <React.Fragment key={doc.id}>
                    <tr className="hover:bg-purple-50/50 dark:hover:bg-gray-750/70 transition">
                      <td className="p-3 text-center">
                        <span className="font-mono font-bold text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded">
                          {doc.code}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-black text-gray-900 dark:text-gray-100 text-xs">
                          {doc.name}
                        </div>
                        <div className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                          {doc.specialty}
                        </div>
                      </td>
                      <td className="p-3 text-[11px] text-gray-500">
                        <div>চেম্বার: {doc.roomNo}</div>
                        <div className="font-mono">{doc.phone}</div>
                      </td>
                      <td className="p-3 text-center font-mono font-black text-sm text-gray-900 dark:text-gray-100">
                        {doc.patientCount} <span className="text-[10px] text-gray-500 font-normal">জন</span>
                      </td>
                      <td className="p-3 text-right font-mono font-black text-sm text-emerald-700 dark:text-emerald-400">
                        ৳{doc.totalBill.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-sm text-pink-700 dark:text-pink-400">
                        ৳{doc.commission.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setExpandedDoctorId(isExpanded ? null : doc.id)}
                          className="px-2 py-1 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-800 dark:text-purple-300 rounded text-[11px] font-bold flex items-center gap-1 mx-auto transition cursor-pointer"
                        >
                          <span>{doc.patientCount} রোগী</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </td>
                    </tr>

                    {/* Drill-down of Patients sent by this doctor */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="p-4 bg-purple-50/50 dark:bg-gray-850 border-t border-purple-100 dark:border-gray-700">
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-purple-200 dark:border-gray-700 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-purple-950 dark:text-purple-300 border-b border-gray-100 dark:border-gray-700 pb-2">
                              <span>
                                {doc.name} এর রেফারকৃত রোগীর তালিকা ({dateLabel})
                              </span>
                              <span className="font-mono text-emerald-600">
                                সর্বমোট বিল: ৳{doc.totalBill.toLocaleString()}
                              </span>
                            </div>

                            {doc.invoices.length === 0 ? (
                              <p className="text-xs text-gray-400 italic py-2">
                                এই সময়ে এই ডাক্তারের কোন রেফারেল টেস্ট রেকর্ড নেই।
                              </p>
                            ) : (
                              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {doc.invoices.map((inv) => (
                                  <div key={inv.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                                    <div>
                                      <span className="font-bold text-gray-900 dark:text-gray-100">
                                        {inv.patientName}
                                      </span>
                                      <span className="text-[10px] text-gray-400 ml-2 font-mono">
                                        ID: {inv.pId} · বয়স: {inv.age}
                                      </span>
                                      <div className="text-[11px] text-gray-500 mt-0.5">
                                        টেস্ট: {inv.items?.map((it) => it.testName).join(', ') || 'ডায়াগনস্টিক টেস্ট'}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                        ৳{inv.netTotal}
                                      </span>
                                      <div className="text-[10px] text-gray-400 font-mono">{inv.date}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot className="bg-purple-50 dark:bg-gray-900 font-black border-t-2 border-purple-900 text-xs">
              <tr>
                <td colSpan={3} className="p-3 text-right">
                  সর্বমোট ডাক্তার রেফারেল যোগফল:
                </td>
                <td className="p-3 text-center font-mono">
                  {doctorSummaries.reduce((s, d) => s + d.patientCount, 0)} জন
                </td>
                <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-400">
                  ৳{doctorSummaries.reduce((s, d) => s + d.totalBill, 0).toLocaleString()}
                </td>
                <td className="p-3 text-right font-mono text-pink-700 dark:text-pink-400">
                  ৳{doctorSummaries.reduce((s, d) => s + d.commission, 0).toLocaleString()}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 3: দৈনন্দিন ব্যয় ট্র্যাকিং (Expense Ledger) */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-red-600" />
              <span>{lang === 'bn' ? '৩. ক্লিনিক ব্যয় ও খরচ খতিয়ান (Daily Expense Ledger)' : '3. Daily Expense Ledger'}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {lang === 'bn'
                ? 'ল্যাব রিএজেন্ট, বিদ্যুৎ, স্টাফ বেতন, ডাক্তার কমিশন ও চেম্বার খরচের ভাউচার তালিকা'
                : 'Recorded operational expenses, reagents, electricity, and voucher entries'}
            </p>
          </div>

          <button
            onClick={() => setShowAddExpense(true)}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'bn' ? 'নতুন খরচ ভাউচার' : 'Add Expense'}</span>
          </button>
        </div>

        {/* Expense Search & Category Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={expenseSearch}
              onChange={(e) => setExpenseSearch(e.target.value)}
              placeholder={lang === 'bn' ? 'খরচের শিরোনাম বা ভাউচার খুঁজুন...' : 'Search expense title or voucher...'}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-slate-50 dark:bg-gray-750 text-gray-800 dark:text-gray-200 text-xs outline-none"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-gray-500">{lang === 'bn' ? 'খাত:' : 'Category:'}</span>
            <select
              value={expenseCategoryFilter}
              onChange={(e) => setExpenseCategoryFilter(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs outline-none"
            >
              <option value="all">{lang === 'bn' ? 'সকল খাত' : 'All Categories'}</option>
              <option value="Reagents & Chemicals">রিএজেন্ট ও কেমিক্যাল</option>
              <option value="Salary">স্টাফ বেতন</option>
              <option value="Electricity & Utility">বিদ্যুৎ ও জ্বালানি</option>
              <option value="Doctor Commission">ডাক্তার কমিশন</option>
              <option value="Rent">ভাড়া</option>
              <option value="Stationery & Printing">স্টেশনারি ও কাগজ</option>
              <option value="Maintenance">যন্ত্রপাতি মেরামত</option>
              <option value="Refreshment">চা-নাস্তা</option>
              <option value="Other">অন্যান্য</option>
            </select>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 dark:bg-gray-750 text-gray-700 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="p-3 w-28">তারিখ</th>
                <th className="p-3 w-28">ভাউচার নং</th>
                <th className="p-3">খরচের শিরোনাম</th>
                <th className="p-3">ব্যয়ের খাত</th>
                <th className="p-3">প্রদানকারী</th>
                <th className="p-3">পদ্ধতি</th>
                <th className="p-3 text-right">টাকা (৳)</th>
                <th className="p-3 text-center w-16">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-400 italic">
                    {lang === 'bn' ? 'এই সময়ে কোন খরচের ভাউচার পাওয়া যায়নি।' : 'No expense records found for this period.'}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-red-50/30 dark:hover:bg-gray-750 transition">
                    <td className="p-3 font-mono text-gray-600 dark:text-gray-400">{exp.date}</td>
                    <td className="p-3 font-mono font-bold text-purple-900 dark:text-purple-300">
                      {exp.voucherNo}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-gray-900 dark:text-gray-100">{exp.title}</div>
                      {exp.note && <div className="text-[10px] text-gray-400 mt-0.5">{exp.note}</div>}
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">
                      <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[10px] font-semibold">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-3 text-gray-700 dark:text-gray-300">{exp.vouchedBy}</td>
                    <td className="p-3 text-gray-500 font-medium">{exp.paymentMethod}</td>
                    <td className="p-3 text-right font-mono font-bold text-red-600 dark:text-red-400 text-sm">
                      ৳{exp.amount.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        className="p-1 hover:bg-red-100 rounded text-red-600 cursor-pointer"
                        title="Delete voucher (Admin Only)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-red-50/50 dark:bg-gray-900 font-black border-t-2 border-red-700 text-xs">
              <tr>
                <td colSpan={6} className="p-3 text-right">
                  নির্বাচিত সময়ে মোট ব্যয়:
                </td>
                <td className="p-3 text-right font-mono text-red-600 dark:text-red-400 text-sm">
                  ৳{totalExpenses.toLocaleString()}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showAddExpense && <AddExpenseModal onClose={() => setShowAddExpense(false)} />}

      {showReportModal && (
        <FinancialReportModal
          startDate={startDate}
          endDate={endDate}
          dateLabel={dateLabel}
          departmentSummaries={departmentSummaries}
          doctorSummaries={doctorSummaries}
          filteredExpenses={filteredExpenses}
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          netProfit={netProfit}
          totalDue={totalDue}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};
