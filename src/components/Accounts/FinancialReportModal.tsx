import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Printer,
  Download,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { printElementById } from '../../utils/printHelper';

interface DepartmentSummary {
  name: string;
  nameBn: string;
  count: number;
  revenue: number;
  percentage: number;
  color: string;
}

interface DoctorSummary {
  code: string;
  name: string;
  specialty: string;
  patientCount: number;
  totalBill: number;
  commission: number;
}

interface FinancialReportModalProps {
  startDate: string;
  endDate: string;
  dateLabel: string;
  departmentSummaries: DepartmentSummary[];
  doctorSummaries: DoctorSummary[];
  filteredExpenses: any[];
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  totalDue: number;
  onClose: () => void;
}

export const FinancialReportModal: React.FC<FinancialReportModalProps> = ({
  startDate,
  endDate,
  dateLabel,
  departmentSummaries,
  doctorSummaries,
  filteredExpenses,
  totalIncome,
  totalExpenses,
  netProfit,
  totalDue,
  onClose,
}) => {
  const { clinicConfig, lang } = useApp();

  const handlePrint = () => {
    printElementById('financial-printable', {
      pageTitle: `Financial-Statement-${startDate}-to-${endDate}`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-850 rounded-2xl shadow-2xl border border-purple-200 dark:border-gray-700 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Control Bar */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 px-6 py-3.5 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-pink-300" />
            <div>
              <h2 className="text-sm sm:text-base font-bold leading-tight">
                {lang === 'bn' ? 'আয়-ব্যয় ও বিভাগীয় আর্থিক প্রতিবেদন' : 'Financial & Departmental Statement'}
              </h2>
              <span className="text-[11px] text-purple-200 font-mono">
                {dateLabel} ({startDate} - {endDate})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'bn' ? 'স্টেটমেন্ট প্রিন্ট করুন' : 'Print Statement'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Statement Sheet */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto bg-white text-slate-800" id="financial-printable">
          {/* Clinic Header */}
          <div className="text-center border-b-2 border-purple-950 pb-4">
            <div className="flex items-center justify-center gap-3 mb-1">
              {clinicConfig.logoUrl && (
                <img
                  src={clinicConfig.logoUrl}
                  alt="Logo"
                  className="w-12 h-12 object-contain"
                  onError={(e) => ((e.target as any).style.display = 'none')}
                />
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-purple-950 tracking-tight">
                  {lang === 'bn' ? clinicConfig.clinicNameBn : clinicConfig.clinicName}
                </h1>
                <p className="text-xs font-semibold text-pink-700 uppercase tracking-wide">
                  {clinicConfig.clinicName}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-1">{clinicConfig.address}</p>
            <p className="text-[11px] text-slate-500 font-mono">
              ফোন: {clinicConfig.phone} | ইমেইল: {clinicConfig.email} | রেজি: {clinicConfig.regNo}
            </p>
            <div className="mt-3 inline-block px-4 py-1 bg-purple-100 text-purple-950 font-black rounded-full text-xs uppercase tracking-wider border border-purple-300">
              {lang === 'bn' ? 'দৈনিক / মাসিক আয়-ব্যয় ও ডক্টর রেফারেল হিসাব বিবরণী' : 'Financial Audit & Doctor Referral Statement'}
            </div>
          </div>

          {/* Statement Metadata Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 font-medium">হিসাবের সময়কাল / ফিল্টার: </span>
              <strong className="text-purple-950 font-bold">{dateLabel}</strong>
              <span className="text-slate-500 font-mono text-[11px] ml-1">({startDate} হতে {endDate})</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">প্রিন্টের তারিখ ও সময়: </span>
              <strong className="text-slate-800 font-mono text-[11px]">{new Date().toLocaleString('bn-BD')}</strong>
            </div>
          </div>

          {/* Financial Summary KPI Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-[11px] text-emerald-800 font-bold block">মোট আয় (Total Income)</span>
              <span className="text-lg sm:text-xl font-black text-emerald-700 font-mono mt-0.5 block">
                ৳{totalIncome.toLocaleString()}
              </span>
            </div>

            <div className="p-3 bg-red-50 rounded-xl border border-red-200">
              <span className="text-[11px] text-red-800 font-bold block">মোট ব্যয় (Total Expense)</span>
              <span className="text-lg sm:text-xl font-black text-red-600 font-mono mt-0.5 block">
                ৳{totalExpenses.toLocaleString()}
              </span>
            </div>

            <div className={`p-3 rounded-xl border ${netProfit >= 0 ? 'bg-purple-50 border-purple-200 text-purple-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
              <span className="text-[11px] font-bold block">নিট লাভ / উদ্বৃত্ত (Net Profit)</span>
              <span className="text-lg sm:text-xl font-black font-mono mt-0.5 block">
                ৳{netProfit.toLocaleString()}
              </span>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <span className="text-[11px] text-amber-800 font-bold block">বকেয়া টাকা (Total Due)</span>
              <span className="text-lg sm:text-xl font-black text-amber-700 font-mono mt-0.5 block">
                ৳{totalDue.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 1. Department-wise Income Breakdown Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-purple-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-purple-200 pb-1">
              <span>১. প্রতিটি বিভাগ থেকে আয় বিবরণী (Department-wise Income Breakdown)</span>
            </h3>
            <table className="w-full text-left text-xs border border-slate-300 border-collapse">
              <thead className="bg-purple-900 text-white font-bold">
                <tr>
                  <th className="p-2 border border-purple-800 w-12 text-center">নং</th>
                  <th className="p-2 border border-purple-800">বিভাগের নাম</th>
                  <th className="p-2 border border-purple-800 text-center">মোট সেবা / টেস্ট</th>
                  <th className="p-2 border border-purple-800 text-right">আয়ের পরিমাণ (৳)</th>
                  <th className="p-2 border border-purple-800 text-right w-24">অংশীদারিত্ব (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {departmentSummaries.map((dept, idx) => (
                  <tr key={dept.name} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-2 border border-slate-300 text-center font-mono">{idx + 1}</td>
                    <td className="p-2 border border-slate-300 font-bold text-slate-900">
                      {lang === 'bn' ? dept.nameBn : dept.name}
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-mono">{dept.count} টি</td>
                    <td className="p-2 border border-slate-300 text-right font-mono font-bold text-emerald-800">
                      ৳{dept.revenue.toLocaleString()}
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-mono font-semibold">
                      {dept.percentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-purple-100 font-black border-t-2 border-purple-900">
                <tr>
                  <td colSpan={2} className="p-2 text-right border border-purple-300">
                    বিভাগীয় মোট আয়:
                  </td>
                  <td className="p-2 text-center font-mono border border-purple-300">
                    {departmentSummaries.reduce((s, d) => s + d.count, 0)} টি
                  </td>
                  <td className="p-2 text-right font-mono text-emerald-900 border border-purple-300">
                    ৳{totalIncome.toLocaleString()}
                  </td>
                  <td className="p-2 text-right font-mono border border-purple-300">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 2. Doctor-wise Work & Referral Report Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-purple-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-purple-200 pb-1">
              <span>২. কোন ডাক্তার কতো কাজ দিয়েছে (Doctor-wise Referral & Business Volume)</span>
            </h3>
            <table className="w-full text-left text-xs border border-slate-300 border-collapse">
              <thead className="bg-slate-800 text-white font-bold">
                <tr>
                  <th className="p-2 border border-slate-700 w-16 text-center">কোড</th>
                  <th className="p-2 border border-slate-700">ডাক্তারের নাম ও স্পেশালিটি</th>
                  <th className="p-2 border border-slate-700 text-center">রোগী সংখ্যা</th>
                  <th className="p-2 border border-slate-700 text-right">মোট টেস্টের বিল (৳)</th>
                  <th className="p-2 border border-slate-700 text-right">রেফারেল সম্মানী (২৫%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {doctorSummaries.map((doc, idx) => (
                  <tr key={doc.code} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-2 border border-slate-300 text-center font-mono font-bold text-purple-900">
                      {doc.code}
                    </td>
                    <td className="p-2 border border-slate-300">
                      <div className="font-bold text-slate-900">{doc.name}</div>
                      <div className="text-[10px] text-slate-500">{doc.specialty}</div>
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-mono font-bold">
                      {doc.patientCount} জন
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-mono font-bold text-slate-900">
                      ৳{doc.totalBill.toLocaleString()}
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-mono font-bold text-pink-700">
                      ৳{doc.commission.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-black border-t-2 border-slate-800">
                <tr>
                  <td colSpan={2} className="p-2 text-right border border-slate-300">
                    সর্বমোট ডাক্তার রেফারেল:
                  </td>
                  <td className="p-2 text-center font-mono border border-slate-300">
                    {doctorSummaries.reduce((s, d) => s + d.patientCount, 0)} জন
                  </td>
                  <td className="p-2 text-right font-mono border border-slate-300">
                    ৳{doctorSummaries.reduce((s, d) => s + d.totalBill, 0).toLocaleString()}
                  </td>
                  <td className="p-2 text-right font-mono text-pink-800 border border-slate-300">
                    ৳{doctorSummaries.reduce((s, d) => s + d.commission, 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 3. Expense Ledger Details */}
          {filteredExpenses.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black text-purple-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-purple-200 pb-1">
                <span>৩. ব্যয়ের বিবরণী (Expense Ledger)</span>
              </h3>
              <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                <thead className="bg-slate-700 text-white font-bold">
                  <tr>
                    <th className="p-2 border border-slate-600 w-24">তারিখ</th>
                    <th className="p-2 border border-slate-600 w-28">ভাউচার নং</th>
                    <th className="p-2 border border-slate-600">খরচের বিবরণ</th>
                    <th className="p-2 border border-slate-600">খাত / ক্যাটাগরি</th>
                    <th className="p-2 border border-slate-600">প্রদানকারী</th>
                    <th className="p-2 border border-slate-600 text-right w-24">টাকা (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredExpenses.map((exp, idx) => (
                    <tr key={exp.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-2 border border-slate-300 font-mono">{exp.date}</td>
                      <td className="p-2 border border-slate-300 font-mono font-bold text-purple-900">
                        {exp.voucherNo}
                      </td>
                      <td className="p-2 border border-slate-300 font-medium text-slate-900">{exp.title}</td>
                      <td className="p-2 border border-slate-300 text-[11px] text-slate-600">{exp.category}</td>
                      <td className="p-2 border border-slate-300 text-[11px] text-slate-600">{exp.vouchedBy}</td>
                      <td className="p-2 border border-slate-300 text-right font-mono font-bold text-red-600">
                        ৳{exp.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-black border-t-2 border-slate-700">
                  <tr>
                    <td colSpan={5} className="p-2 text-right border border-slate-300">
                      মোট ব্যয় / খরচ:
                    </td>
                    <td className="p-2 text-right font-mono text-red-700 border border-slate-300">
                      ৳{totalExpenses.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Audit Signatures */}
          <div className="pt-12 grid grid-cols-3 gap-6 text-center text-xs font-bold text-slate-700">
            <div className="border-t border-slate-400 pt-1">
              <span>ক্যাশিয়ার / প্রধান হিসাবরক্ষক</span>
              <p className="text-[10px] text-slate-400 font-normal">Prepared by</p>
            </div>
            <div className="border-t border-slate-400 pt-1">
              <span>{clinicConfig.labInCharge}</span>
              <p className="text-[10px] text-slate-400 font-normal">Verified by</p>
            </div>
            <div className="border-t border-slate-400 pt-1">
              <span>ব্যবস্থাপনা পরিচালক / প্রধান পরিচালক</span>
              <p className="text-[10px] text-slate-400 font-normal">Approved by</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
