import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAccount, AppModuleId } from '../../types';
import {
  Crown,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Edit2,
  Save,
  X,
  UserCheck,
  ShieldCheck,
  Users,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  FlaskConical,
  Film,
  Waves,
  Stethoscope,
  Receipt,
  User,
} from 'lucide-react';

interface AdminUserPasswordModalProps {
  onClose: () => void;
}

export const AdminUserPasswordModal: React.FC<AdminUserPasswordModalProps> = ({ onClose }) => {
  const { users, updateUser, addUser, currentUser, lang } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAllPasswords, setShowAllPasswords] = useState(true);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Editing single user password state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Add new user form toggle
  const [showAddUser, setShowAddUser] = useState(false);
  const [addUsername, setAddUsername] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addFullName, setAddFullName] = useState('');
  const [addRole, setAddRole] = useState<'Admin' | 'Lab' | 'Xray' | 'Ultrasound' | 'Doctor' | 'Billing'>('Lab');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCopyPassword = (u: UserAccount) => {
    navigator.clipboard.writeText(u.password);
    setCopiedId(u.id);
    triggerToast(
      lang === 'bn'
        ? `@${u.username} এর পাসওয়ার্ড ক্লিপবোর্ডে কপি হয়েছে!`
        : `Password for @${u.username} copied to clipboard!`
    );
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startEditPassword = (u: UserAccount) => {
    setEditingUserId(u.id);
    setNewPasswordVal(u.password);
  };

  const handleSavePassword = (userId: string, username: string) => {
    if (!newPasswordVal.trim()) {
      triggerToast(lang === 'bn' ? 'পাসওয়ার্ড খালি রাখা যাবে না!' : 'Password cannot be empty!');
      return;
    }
    updateUser(userId, { password: newPasswordVal.trim() });
    setEditingUserId(null);
    triggerToast(
      lang === 'bn'
        ? `@${username} এর নতুন পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে!`
        : `New password for @${username} updated successfully!`
    );
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = addUsername.trim();
    if (!cleanUser || !addPassword.trim()) {
      triggerToast(lang === 'bn' ? 'ইউজার আইডি ও পাসওয়ার্ড উভয়ই দিন!' : 'Enter both User ID and Password!');
      return;
    }
    if (users.some((u) => u.username.toLowerCase() === cleanUser.toLowerCase())) {
      triggerToast(lang === 'bn' ? 'এই ইউজার আইডিটি ইতিমধ্যে ব্যবহৃত!' : 'This User ID is already taken!');
      return;
    }

    let modules: AppModuleId[] = ['pathology'];
    if (addRole === 'Admin') {
      modules = [
        'pathology',
        'billing',
        'doctorVisit',
        'ecg',
        'xray',
        'ultrasound',
        'doctorPortal',
        'incomeExpense',
        'employees',
        'analytics',
        'chat',
        'settings',
      ];
    } else if (addRole === 'Xray') {
      modules = ['xray'];
    } else if (addRole === 'Ultrasound') {
      modules = ['ultrasound'];
    } else if (addRole === 'Doctor') {
      modules = ['doctorVisit', 'doctorPortal'];
    } else if (addRole === 'Billing') {
      modules = ['billing', 'doctorVisit', 'incomeExpense'];
    }

    addUser({
      username: cleanUser,
      password: addPassword.trim(),
      fullName: addFullName.trim() || cleanUser,
      role: addRole,
      allowedModules: modules,
      isActive: true,
      phone: '+880 17',
    });

    triggerToast(
      lang === 'bn'
        ? `নতুন ইউজার @${cleanUser} সফলভাবে তৈরি হয়েছে!`
        : `User @${cleanUser} created successfully!`
    );

    setAddUsername('');
    setAddPassword('');
    setAddFullName('');
    setShowAddUser(false);
  };

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.fullName.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[11px]">
            <Crown className="w-3 h-3 text-amber-400" />
            <span>{lang === 'bn' ? 'আদিবা অ্যাডমিন' : 'Super Admin'}</span>
          </span>
        );
      case 'Lab':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold text-[11px]">
            <FlaskConical className="w-3 h-3 text-purple-400" />
            <span>{lang === 'bn' ? 'প্যাথলজি ল্যাব' : 'Pathology Lab'}</span>
          </span>
        );
      case 'Xray':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/40 font-bold text-[11px]">
            <Film className="w-3 h-3 text-slate-300" />
            <span>{lang === 'bn' ? 'ডিজিটাল এক্স-রে' : 'Digital X-Ray'}</span>
          </span>
        );
      case 'Ultrasound':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold text-[11px]">
            <Waves className="w-3 h-3 text-cyan-400" />
            <span>{lang === 'bn' ? 'আল্ট্রাসাউন্ড (USG)' : 'Ultrasound'}</span>
          </span>
        );
      case 'Doctor':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 font-bold text-[11px]">
            <Stethoscope className="w-3 h-3 text-pink-400" />
            <span>{lang === 'bn' ? 'ডাক্তার ভিজিট ও প্রেসক্রিপশন' : 'Doctor Portal'}</span>
          </span>
        );
      case 'Billing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[11px]">
            <Receipt className="w-3 h-3 text-emerald-400" />
            <span>{lang === 'bn' ? 'বিলিং ও ক্যাশ মেমো' : 'Billing'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold text-[11px]">
            <User className="w-3 h-3" />
            <span>{role}</span>
          </span>
        );
    }
  };

  const isAdmin = currentUser?.role === 'Admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border-2 border-purple-500/60 rounded-3xl shadow-2xl w-full max-w-4xl text-slate-100 overflow-hidden my-auto relative">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-4 sm:p-5 border-b border-purple-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-purple-900/50">
              <Crown className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>{lang === 'bn' ? 'আদিবা অ্যাডমিন - ইউজার ও পাসওয়ার্ড কন্ট্রোল প্যানেল' : 'Adiba Admin - User & Password Control'}</span>
              </h3>
              <p className="text-xs text-purple-300 mt-0.5">
                {lang === 'bn'
                  ? 'সকল ইউজার আইডি, ডিপার্টমেন্ট রোল এবং প্রত্যেকের পাসওয়ার্ড দেখুন ও পরিবর্তন করুন'
                  : 'View all system users, department roles, and manage passwords'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-purple-900/70 hover:bg-purple-800 text-purple-200 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div className="bg-emerald-900/90 border-b border-emerald-700 text-emerald-200 px-4 py-2.5 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Summary Info Cards */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/80 border border-purple-900/70 rounded-2xl p-3">
              <div className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-pink-400" />
                <span>{lang === 'bn' ? 'মোট ইউজার' : 'Total Users'}</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">
                {users.length} <span className="text-xs font-normal text-purple-300">{lang === 'bn' ? 'জন' : 'Users'}</span>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-purple-900/70 rounded-2xl p-3">
              <div className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === 'bn' ? 'অ্যাডমিন অ্যাকাউন্ট' : 'Super Admin'}</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
                1 <span className="text-xs font-normal text-purple-300">(@Adiba)</span>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-purple-900/70 rounded-2xl p-3">
              <div className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
                <span>{lang === 'bn' ? 'ডিপার্টমেন্ট স্টাফ' : 'Staff Accounts'}</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-purple-300 mt-1">
                {users.length - 1} <span className="text-xs font-normal text-purple-300">{lang === 'bn' ? 'জন' : 'Staff'}</span>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-purple-900/70 rounded-2xl p-3 flex flex-col justify-between">
              <div className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-pink-400" />
                <span>{lang === 'bn' ? 'পাসওয়ার্ড প্রদর্শন' : 'Passwords View'}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAllPasswords(!showAllPasswords)}
                className="mt-1 px-2.5 py-1 bg-purple-900/80 hover:bg-purple-800 text-purple-200 hover:text-white rounded-lg text-xs font-bold border border-purple-700 flex items-center justify-between transition cursor-pointer"
              >
                <span>{showAllPasswords ? (lang === 'bn' ? 'সব পাসওয়ার্ড দৃশ্যমান' : 'All Visible') : (lang === 'bn' ? 'পাসওয়ার্ড লুকানো' : 'All Hidden')}</span>
                {showAllPasswords ? <EyeOff className="w-3.5 h-3.5 text-pink-400 ml-1.5" /> : <Eye className="w-3.5 h-3.5 text-purple-300 ml-1.5" />}
              </button>
            </div>
          </div>

          {/* Search bar & Add user button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={lang === 'bn' ? 'ইউজারনেম, পদবি বা নাম দিয়ে খুঁজুন...' : 'Search by username, role, or name...'}
                className="w-full bg-slate-950 border border-purple-800 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowAddUser(!showAddUser)}
                className="px-3.5 py-2 bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-600 hover:to-pink-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddUser ? (lang === 'bn' ? 'ফর্ম বন্ধ করুন' : 'Close Form') : (lang === 'bn' ? '+ নতুন ইউজার আইডি যোগ করুন' : '+ Add New User')}</span>
              </button>
            )}
          </div>

          {/* New User Form Collapse */}
          {showAddUser && (
            <form onSubmit={handleCreateUser} className="p-4 bg-slate-950 border border-purple-700 rounded-2xl space-y-3 animate-fade-in text-xs">
              <div className="font-bold text-white flex items-center gap-1.5 text-xs border-b border-purple-900 pb-2">
                <Plus className="w-4 h-4 text-pink-400" />
                <span>{lang === 'bn' ? 'নতুন ইউজার ও পাসওয়ার্ড তৈরি করুন' : 'Create New User ID & Password'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-purple-300 mb-1">
                    {lang === 'bn' ? 'ইউজার আইডি (Login ID):' : 'User ID:'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={addUsername}
                    onChange={(e) => setAddUsername(e.target.value)}
                    placeholder="e.g. lab2, doc_rahim"
                    className="w-full bg-slate-900 border border-purple-800 rounded-lg p-2 font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-purple-300 mb-1">
                    {lang === 'bn' ? 'পাসওয়ার্ড (Password):' : 'Password:'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    placeholder="e.g. pass123"
                    className="w-full bg-slate-900 border border-purple-800 rounded-lg p-2 font-mono font-bold text-pink-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-purple-300 mb-1">
                    {lang === 'bn' ? 'পূর্ণ নাম:' : 'Full Name:'}
                  </label>
                  <input
                    type="text"
                    value={addFullName}
                    onChange={(e) => setAddFullName(e.target.value)}
                    placeholder="e.g. Md. Karim"
                    className="w-full bg-slate-900 border border-purple-800 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-purple-300 mb-1">
                    {lang === 'bn' ? 'ডিপার্টমেন্ট / রোল:' : 'Role:'}
                  </label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as any)}
                    className="w-full bg-slate-900 border border-purple-800 rounded-lg p-2 text-white font-bold cursor-pointer"
                  >
                    <option value="Lab">🔬 Pathology Lab</option>
                    <option value="Xray">🩻 Digital X-Ray</option>
                    <option value="Ultrasound">🌊 Ultrasound (USG)</option>
                    <option value="Doctor">🩺 Doctor Visit / Rx</option>
                    <option value="Billing">💵 Billing Counter</option>
                    <option value="Admin">👑 Super Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 font-bold hover:bg-gray-700 cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                >
                  {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save User'}
                </button>
              </div>
            </form>
          )}

          {/* Users Table / Card list */}
          <div className="bg-slate-950/90 border border-purple-900/80 rounded-2xl overflow-hidden shadow-inner">
            <div className="p-3 bg-purple-950/60 border-b border-purple-900/80 text-[11px] font-bold text-purple-300 flex items-center justify-between">
              <span>{lang === 'bn' ? 'ইউজার তালিকা ও সক্রিয় পাসওয়ার্ড কন্ট্রোল' : 'Users List & Active Password Controls'}</span>
              <span>{filteredUsers.length} {lang === 'bn' ? 'জন প্রদর্শিত' : 'Displaying'}</span>
            </div>

            <div className="divide-y divide-purple-900/40 max-h-[380px] overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-6 text-center text-purple-400 text-xs italic">
                  {lang === 'bn' ? 'কোনো ইউজার পাওয়া যায়নি!' : 'No matching users found.'}
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  const isAdiba = u.username.toLowerCase() === 'adiba';
                  const isRevealed = showAllPasswords || !!revealedPasswords[u.id];
                  const isEditingThis = editingUserId === u.id;

                  return (
                    <div
                      key={u.id}
                      className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                        isCurrent ? 'bg-purple-900/20' : 'hover:bg-purple-950/30'
                      }`}
                    >
                      {/* Left: User details */}
                      <div className="flex items-start gap-3 min-w-[200px]">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-md ${
                            isAdiba
                              ? 'bg-gradient-to-tr from-amber-500 to-pink-600'
                              : 'bg-gradient-to-tr from-purple-700 to-indigo-600'
                          }`}
                        >
                          {isAdiba ? <Crown className="w-5 h-5 text-amber-200" /> : u.fullName.charAt(0) || 'U'}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-white">{u.fullName}</span>
                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-pink-600 text-white font-bold">
                                {lang === 'bn' ? 'আপনি' : 'You'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-900/90 text-pink-300 font-bold border border-purple-700/60">
                              @{u.username}
                            </span>
                            {getRoleBadge(u.role)}
                          </div>
                        </div>
                      </div>

                      {/* Right: Password display & Edit */}
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
                        {isEditingThis ? (
                          /* Inline Edit Password */
                          <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-pink-500/80 shadow-md">
                            <KeyRound className="w-4 h-4 text-pink-400 shrink-0 ml-1" />
                            <input
                              type="text"
                              value={newPasswordVal}
                              onChange={(e) => setNewPasswordVal(e.target.value)}
                              placeholder="New password"
                              autoFocus
                              className="bg-slate-950 border border-purple-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-white w-28 sm:w-36 focus:outline-none focus:ring-1 focus:ring-pink-400"
                            />
                            <button
                              type="button"
                              onClick={() => handleSavePassword(u.id, u.username)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                              title="Save new password"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>{lang === 'bn' ? 'সেভ' : 'Save'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingUserId(null)}
                              className="p-1 text-gray-400 hover:text-white cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          /* Normal Password View */
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 border border-purple-800/80 rounded-xl text-xs font-mono">
                              <KeyRound className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                              <span className="font-bold text-white select-all">
                                {isRevealed ? u.password : '••••••••'}
                              </span>

                              {/* Toggle eye */}
                              <button
                                type="button"
                                onClick={() =>
                                  setRevealedPasswords((prev) => ({
                                    ...prev,
                                    [u.id]: !prev[u.id],
                                  }))
                                }
                                className="text-purple-400 hover:text-white ml-1 cursor-pointer"
                                title={isRevealed ? 'Hide Password' : 'Show Password'}
                              >
                                {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>

                              {/* Copy button */}
                              <button
                                type="button"
                                onClick={() => handleCopyPassword(u)}
                                className="text-purple-400 hover:text-pink-300 ml-1 cursor-pointer"
                                title="Copy Password"
                              >
                                {copiedId === u.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>

                            {/* Set / Change Password Button */}
                            <button
                              type="button"
                              onClick={() => startEditPassword(u)}
                              className="px-2.5 py-1.5 bg-purple-900/70 hover:bg-purple-800 border border-purple-700/80 text-purple-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-xs active:scale-95"
                              title={lang === 'bn' ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Change password'}
                            >
                              <Edit2 className="w-3.5 h-3.5 text-pink-300" />
                              <span>{lang === 'bn' ? 'পাসওয়ার্ড সেট' : 'Set Password'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="text-[11px] text-purple-300/80 bg-purple-950/40 p-3 rounded-xl border border-purple-900/60 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              {lang === 'bn'
                ? '💡 যেকোনো ইউজারের পাসওয়ার্ড পরিবর্তন করলে তা তাৎক্ষণিকভাবে সংরক্ষিত হয় এবং উক্ত ইউজার আইডি দিয়ে সেই নতুন পাসওয়ার্ড ব্যবহার করে সফটওয়্যারে লগইন করা যাবে। লগইন পেইজে পাসওয়ার্ড সবসময় খালি থাকবে এবং ব্যবহারকারীকে নিজ হাতে টাইপ করতে হবে।'
                : '💡 Passwords updated here take effect immediately. Login fields remain blank on load, requiring users to type their password.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-4 border-t border-purple-900 flex items-center justify-between">
          <span className="text-xs text-purple-400 font-medium">
            Adiba Hospital Management System · Security &amp; Access Controls
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold cursor-pointer transition"
          >
            {lang === 'bn' ? 'সম্পন্ন / বন্ধ করুন' : 'Done & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
