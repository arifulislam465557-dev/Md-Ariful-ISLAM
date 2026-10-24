import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee } from '../../types';
import { AddEmployeeModal } from './AddEmployeeModal';
import { EmployeeDetailModal } from './EmployeeDetailModal';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CreditCard,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Building2,
  Trash2,
  Edit3,
  Eye,
  Printer,
  FileCheck,
  ShieldAlert,
  LayoutGrid,
  List,
  Sparkles,
} from 'lucide-react';

export const EmployeeModule: React.FC = () => {
  const { employees, deleteEmployee, clinicConfig, lang } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  // Departments list for filtering
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [employees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.empId.toLowerCase().includes(q) ||
        emp.voterId.toLowerCase().includes(q) ||
        emp.phone.toLowerCase().includes(q) ||
        (emp.email && emp.email.toLowerCase().includes(q)) ||
        (emp.fatherName && emp.fatherName.toLowerCase().includes(q)) ||
        (emp.motherName && emp.motherName.toLowerCase().includes(q)) ||
        emp.designation.toLowerCase().includes(q);

      const matchDept = departmentFilter === 'all' || emp.department === departmentFilter;
      const matchStatus = statusFilter === 'all' || emp.status === statusFilter;

      return matchQuery && matchDept && matchStatus;
    });
  }, [employees, searchQuery, departmentFilter, statusFilter]);

  // Statistics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === 'Active').length;
  const totalPayroll = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
  const employeesWithVoterPhoto = employees.filter(
    (e) => e.voterCardFrontPhotoUrl || e.voterCardBackPhotoUrl
  ).length;

  const handleDelete = (emp: Employee) => {
    deleteEmployee(emp.id);
  };

  const printDirectory = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 p-6 rounded-2xl shadow-xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border border-purple-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-400/40 flex items-center justify-center">
              <Users className="w-5 h-5 text-pink-300" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {lang === 'bn' ? 'কর্মচারী ও কর্মকর্তা তালিকা' : 'Employee & Staff Directory'}
              </h1>
              <p className="text-xs text-purple-200 mt-0.5">
                {lang === 'bn'
                  ? 'ছবি, ভোটার কার্ড (NID), পিতা-মাতার নাম, মোবাইল ও পরিচয়পত্র সহ সার্বিক স্টাফ ম্যানেজমেন্ট'
                  : 'Manage hospital staff, photos, voter cards, contact details, and payroll records'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={printDirectory}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-purple-300" />
            <span>{lang === 'bn' ? 'স্টাফ তালিকা প্রিন্ট' : 'Print Directory'}</span>
          </button>
          <button
            onClick={() => {
              setEditingEmployee(null);
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-xl text-xs font-black shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95 border border-pink-400/60"
          >
            <UserPlus className="w-4 h-4" />
            <span>{lang === 'bn' ? '+ নতুন কর্মচারী যুক্ত করুন' : '+ Add New Employee'}</span>
          </button>
        </div>
      </div>

      {/* KPI Statistic Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">
              {lang === 'bn' ? 'মোট কর্মচারী' : 'Total Employees'}
            </div>
            <div className="text-xl sm:text-2xl font-black text-purple-950 dark:text-purple-200">
              {totalEmployees} <span className="text-xs font-normal text-gray-500">{lang === 'bn' ? 'জন' : 'staff'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">
              {lang === 'bn' ? 'সক্রিয় কর্মী' : 'Active Staff'}
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300">
              {activeEmployees} <span className="text-xs font-normal text-gray-500">{lang === 'bn' ? 'জন' : 'active'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/60 text-pink-700 dark:text-pink-300 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">
              {lang === 'bn' ? 'ভোটার কার্ড ডকুমেন্টস' : 'Voter Card Attached'}
            </div>
            <div className="text-xl sm:text-2xl font-black text-pink-700 dark:text-pink-300">
              {employeesWithVoterPhoto} <span className="text-xs font-normal text-gray-500">{lang === 'bn' ? 'টি' : 'cards'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">
              {lang === 'bn' ? 'মাসিক মোট বেতন' : 'Total Monthly Payroll'}
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-800 dark:text-amber-300">
              ৳{totalPayroll.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'bn'
                ? 'নাম, আইডি, ভোটার কার্ড, পিতা বা ফোন...'
                : 'Search name, ID, voter card, phone...'
            }
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-slate-50 dark:bg-gray-750 text-gray-900 dark:text-gray-100 text-xs focus:ring-2 focus:ring-purple-600 outline-none"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>

        {/* Filters and View Switcher */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-between sm:justify-end">
          {/* Department Filter */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs outline-none"
            >
              <option value="all">{lang === 'bn' ? 'সকল বিভাগ' : 'All Departments'}</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs outline-none"
          >
            <option value="all">{lang === 'bn' ? 'সকল স্ট্যাটাস' : 'All Status'}</option>
            <option value="Active">{lang === 'bn' ? 'সক্রিয় (Active)' : 'Active'}</option>
            <option value="On Leave">{lang === 'bn' ? 'ছুটিতে (On Leave)' : 'On Leave'}</option>
            <option value="Terminated">{lang === 'bn' ? 'চাকরি শেষ (Terminated)' : 'Terminated'}</option>
          </select>

          {/* Grid / Table View toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-800 text-purple-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Grid Cards"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-800 text-purple-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
            {lang === 'bn' ? 'কোন কর্মচারী পাওয়া যায়নি' : 'No employees found'}
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? lang === 'bn'
                ? `"${searchQuery}" এর সাথে মিলে এমন কোন কর্মচারীর রেকর্ড নেই।`
                : `No results matching "${searchQuery}".`
              : lang === 'bn'
              ? 'নতুন কর্মচারী যোগ করতে উপরের বাটনে ক্লিক করুন।'
              : 'Click + Add New Employee to register your first staff member.'}
          </p>
          <button
            onClick={() => {
              setEditingEmployee(null);
              setShowAddModal(true);
            }}
            className="mt-4 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{lang === 'bn' ? 'নতুন কর্মচারী যোগ করুন' : 'Add Employee'}</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs hover:shadow-md transition overflow-hidden flex flex-col justify-between group"
            >
              {/* Card Header & Photo */}
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-4">
                  {/* Photo thumbnail */}
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-purple-50 dark:bg-gray-700 border-2 border-purple-500/40 shadow-xs flex items-center justify-center">
                      {emp.photoUrl ? (
                        <img
                          src={emp.photoUrl}
                          alt={emp.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="w-8 h-8 text-purple-400" />
                      )}
                    </div>
                    <span
                      className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800 ${
                        emp.status === 'Active'
                          ? 'bg-emerald-500'
                          : emp.status === 'On Leave'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      title={emp.status}
                    />
                  </div>

                  {/* Name and Designation */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] text-purple-700 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                        {emp.empId}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-500 truncate">
                        {emp.department}
                      </span>
                    </div>

                    <h3 className="font-black text-sm text-gray-900 dark:text-gray-100 truncate mt-1">
                      {emp.name}
                    </h3>
                    <p className="text-xs font-semibold text-purple-900 dark:text-purple-300 truncate">
                      {emp.designation}
                    </p>
                  </div>
                </div>

                {/* Identity & Family Details (পিতা, মাতা, ভোটার কার্ড) */}
                <div className="p-3 bg-slate-50 dark:bg-gray-750 rounded-xl space-y-2 text-xs border border-slate-100 dark:border-gray-700">
                  {/* Voter Card / NID */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-[11px] flex items-center gap-1 font-medium">
                      <CreditCard className="w-3.5 h-3.5 text-pink-600" />
                      <span>{lang === 'bn' ? 'ভোটার কার্ড (NID):' : 'Voter Card:'}</span>
                    </span>
                    <span className="font-mono font-bold text-gray-900 dark:text-gray-100 tracking-wide text-[11px]">
                      {emp.voterId}
                    </span>
                  </div>

                  {/* Father's Name */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-[11px] font-medium">
                      {lang === 'bn' ? 'পিতা:' : 'Father:'}
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[170px] text-right">
                      {emp.fatherName || 'তথ্য নেই'}
                    </span>
                  </div>

                  {/* Mother's Name */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-[11px] font-medium">
                      {lang === 'bn' ? 'মাতা:' : 'Mother:'}
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[170px] text-right">
                      {emp.motherName || 'তথ্য নেই'}
                    </span>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-[11px] flex items-center gap-1 font-medium">
                      <Phone className="w-3.5 h-3.5 text-purple-600" />
                      <span>{lang === 'bn' ? 'মোবাইল:' : 'Phone:'}</span>
                    </span>
                    <span className="font-mono font-bold text-gray-900 dark:text-gray-100 text-[11px]">
                      {emp.phone}
                    </span>
                  </div>
                </div>

                {/* Voter Card Photo Attachments Pill */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-gray-500 text-[11px]">
                    {lang === 'bn' ? 'কার্ড ডকুমেন্টস:' : 'Documents:'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        emp.voterCardFrontPhotoUrl
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                      }`}
                    >
                      {lang === 'bn' ? 'সম্মুখ ছবি' : 'Front'} {emp.voterCardFrontPhotoUrl ? '✓' : '✗'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        emp.voterCardBackPhotoUrl
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                      }`}
                    >
                      {lang === 'bn' ? 'পেছন ছবি' : 'Back'} {emp.voterCardBackPhotoUrl ? '✓' : '✗'}
                    </span>
                  </div>
                </div>

                {/* Salary */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500">{lang === 'bn' ? 'মাসিক বেতন:' : 'Monthly Salary:'}</span>
                  <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm">
                    ৳{emp.salary ? emp.salary.toLocaleString() : '0'}
                  </span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-750/80 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-1.5">
                <button
                  onClick={() => setViewingEmployee(emp)}
                  className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'বিস্তারিত ও ভোটার কার্ড' : 'View & NID'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingEmployee(emp);
                      setShowAddModal(true);
                    }}
                    className="p-1.5 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-600 transition cursor-pointer"
                    title={lang === 'bn' ? 'সম্পাদনা করুন' : 'Edit'}
                  >
                    <Edit3 className="w-3.5 h-3.5 text-purple-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(emp)}
                    className="p-1.5 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-950/60 text-red-600 rounded-lg border border-gray-200 dark:border-gray-600 transition cursor-pointer"
                    title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-gray-750 text-gray-700 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="p-3 w-14">ফটো</th>
                  <th className="p-3">আইডি ও নাম</th>
                  <th className="p-3">পদবি ও বিভাগ</th>
                  <th className="p-3">পিতা ও মাতা</th>
                  <th className="p-3">ভোটার কার্ড (NID)</th>
                  <th className="p-3">মোবাইল নম্বর</th>
                  <th className="p-3 text-right">বেতন (৳)</th>
                  <th className="p-3 text-center">স্ট্যাটাস</th>
                  <th className="p-3 text-right w-28">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-purple-50/40 dark:hover:bg-gray-750 transition">
                    <td className="p-3">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-purple-100 dark:bg-gray-700 flex items-center justify-center">
                        {emp.photoUrl ? (
                          <img src={emp.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Users className="w-5 h-5 text-purple-400" />
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-gray-900 dark:text-gray-100">{emp.name}</div>
                      <span className="font-mono text-[10px] text-purple-700 dark:text-purple-300">
                        {emp.empId}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-purple-900 dark:text-purple-300">
                        {emp.designation}
                      </div>
                      <div className="text-[11px] text-gray-500">{emp.department}</div>
                    </td>
                    <td className="p-3 text-[11px]">
                      <div>
                        <strong>পিতা:</strong> {emp.fatherName || '-'}
                      </div>
                      <div>
                        <strong>মাতা:</strong> {emp.motherName || '-'}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-mono font-bold text-gray-800 dark:text-gray-200 block">
                        {emp.voterId}
                      </span>
                      <div className="flex gap-1 text-[9px] mt-0.5">
                        <span className={emp.voterCardFrontPhotoUrl ? 'text-emerald-600 font-bold' : 'text-gray-400'}>
                          সম্মুখ: {emp.voterCardFrontPhotoUrl ? '✓' : '✗'}
                        </span>
                        <span className={emp.voterCardBackPhotoUrl ? 'text-emerald-600 font-bold' : 'text-gray-400'}>
                          পেছন: {emp.voterCardBackPhotoUrl ? '✓' : '✗'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 font-mono font-medium text-gray-900 dark:text-gray-100">
                      {emp.phone}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      ৳{emp.salary ? emp.salary.toLocaleString() : '0'}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          emp.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingEmployee(emp)}
                          className="p-1.5 hover:bg-purple-100 rounded text-purple-700 cursor-pointer"
                          title="বিস্তারিত"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingEmployee(emp);
                            setShowAddModal(true);
                          }}
                          className="p-1.5 hover:bg-purple-100 rounded text-blue-700 cursor-pointer"
                          title="সম্পাদনা"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp)}
                          className="p-1.5 hover:bg-red-100 rounded text-red-600 cursor-pointer"
                          title="মুছুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddEmployeeModal
          initialEmployee={editingEmployee}
          onClose={() => {
            setShowAddModal(false);
            setEditingEmployee(null);
          }}
        />
      )}

      {viewingEmployee && (
        <EmployeeDetailModal
          employee={viewingEmployee}
          onClose={() => setViewingEmployee(null)}
          onEdit={(emp) => {
            setViewingEmployee(null);
            setEditingEmployee(emp);
            setShowAddModal(true);
          }}
        />
      )}
    </div>
  );
};
