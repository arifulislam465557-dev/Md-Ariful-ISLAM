import React, { useState, useRef } from 'react';
import {
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  Activity,
  ArrowRight,
  AlertCircle,
  FlaskConical,
  Film,
  Waves,
  Stethoscope,
  Receipt,
  Crown,
  Sparkles,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { clinicConfig, lang, setLang, loginUser, users, licenseInfo, setOpenLicenseModal } = useApp();

  // Both username and password are EMPTY by default!
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim()) {
      setErrorMsg(lang === 'bn' ? 'অনুগ্রহ করে ইউজার আইডি / ইউজারনেম লিখুন।' : 'Please enter your User ID / Username.');
      return;
    }
    if (!password) {
      setErrorMsg(lang === 'bn' ? 'অনুগ্রহ করে পাসওয়ার্ড লিখুন।' : 'Please enter your password.');
      passwordInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const result = loginUser(username, password);
      if (result.success) {
        onLoginSuccess();
      } else {
        setErrorMsg(result.error || (lang === 'bn' ? 'ইউজার নেইম বা পাসওয়ার্ড সঠিক নয়!' : 'Invalid username or password!'));
        setIsSubmitting(false);
      }
    }, 300);
  };

  // Only sets the Username! Password is ALWAYS cleared and left blank for the user to type!
  const handleSelectAccount = (u: string) => {
    setUsername(u);
    setPassword(''); // Password remains completely blank!
    setErrorMsg(null);
    setSelectedNotice(
      lang === 'bn'
        ? `ইউজার আইডি @${u} বসানো হয়েছে। এখন পাসওয়ার্ড টাইপ করুন।`
        : `User ID @${u} set. Please enter password.`
    );
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 100);
  };

  // Helper icons for role
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin':
        return <Crown className="w-3.5 h-3.5 text-amber-400" />;
      case 'Lab':
        return <FlaskConical className="w-3.5 h-3.5 text-purple-400" />;
      case 'Xray':
        return <Film className="w-3.5 h-3.5 text-blue-400" />;
      case 'Ultrasound':
        return <Waves className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Doctor':
        return <Stethoscope className="w-3.5 h-3.5 text-pink-400" />;
      case 'Billing':
        return <Receipt className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <User className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const getModuleSummary = (u: typeof users[0]) => {
    if (u.role === 'Admin') return lang === 'bn' ? 'সকল মডিউল ও সেটিংস' : 'All Modules + Settings';
    if (u.allowedModules.includes('pathology') && u.allowedModules.length === 1) return lang === 'bn' ? 'ল্যাব / প্যাথলজি' : 'Lab / Pathology';
    if (u.allowedModules.includes('xray') && u.allowedModules.length === 1) return lang === 'bn' ? 'ডিজিটাল এক্স-রে' : 'Digital X-Ray';
    if (u.allowedModules.includes('ultrasound') && u.allowedModules.length === 1) return lang === 'bn' ? 'আল্ট্রাসাউন্ড (USG)' : 'Ultrasound (USG)';
    if (u.allowedModules.includes('doctorVisit') || u.allowedModules.includes('doctorPortal')) return lang === 'bn' ? 'ডাক্তার ভিজিট ও Rx' : 'Doctor OPD & Rx';
    if (u.allowedModules.includes('billing')) return lang === 'bn' ? 'বিলিং ও ক্যাশ মেমো' : 'Billing & Cash Memo';
    return u.allowedModules.join(', ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 text-slate-100 flex flex-col justify-between p-4 selection:bg-pink-500 selection:text-white">
      {/* Top Header bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center shadow-md">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">
            {lang === 'bn' ? clinicConfig.clinicNameBn : clinicConfig.clinicName}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
          className="text-xs px-2.5 py-1 rounded bg-purple-900/80 hover:bg-purple-800 border border-purple-700 text-purple-200 cursor-pointer font-bold transition"
        >
          {lang === 'bn' ? 'English' : 'বাংলা'}
        </button>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-lg mx-auto my-auto">
        <div className="bg-slate-900/95 backdrop-blur-md border-2 border-purple-600/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Decorative Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Brand & Lock Icon */}
          <div className="text-center mb-6 relative">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-purple-700 via-pink-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40 border border-purple-400/40">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {lang === 'bn' ? 'সফটওয়্যার সিকিউরিটি লগইন' : 'Hospital Portal Security Login'}
            </h2>
            <p className="text-xs text-purple-300 mt-1 max-w-sm mx-auto">
              {lang === 'bn'
                ? 'আপনার নির্দিষ্ট ইউজার আইডি ও পাসওয়ার্ড বসিয়ে প্রবেশ করুন'
                : 'Enter your designated User ID and password to access authorized modules'}
            </p>
          </div>

          {/* Notice after selecting a User ID */}
          {selectedNotice && (
            <div className="mb-3 p-2.5 bg-purple-950/80 border border-pink-500/50 rounded-xl text-pink-200 text-xs flex items-center gap-2 animate-fade-in">
              <Info className="w-4 h-4 text-pink-400 shrink-0" />
              <span>{selectedNotice}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/80 border border-red-500/80 rounded-xl text-red-200 text-xs flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username / User ID */}
            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-pink-400" />
                  <span>{lang === 'bn' ? 'ইউজার আইডি / ইউজারনেম (User ID)' : 'User ID / Username'}</span>
                </span>
                <span className="text-[10px] text-purple-400">
                  {lang === 'bn' ? 'কেস-সেন্সিটিভ নয়' : 'Case insensitive'}
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setSelectedNotice(null);
                  }}
                  placeholder={lang === 'bn' ? 'ইউজার আইডি লিখুন (যেমন: Adiba, lab1, xray1)' : 'Enter User ID (e.g. Adiba, lab1, xray1)'}
                  className="w-full bg-slate-950 border-2 border-purple-800 focus:border-pink-500 rounded-xl px-4 py-2.5 text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-pink-400" />
                  <span>{lang === 'bn' ? 'পাসওয়ার্ড (Password)' : 'Password'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-pink-400 hover:text-pink-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? (lang === 'bn' ? 'পাসওয়ার্ড লুকান' : 'Hide') : (lang === 'bn' ? 'পাসওয়ার্ড দেখুন' : 'Show')}</span>
                </button>
              </label>
              <div className="relative">
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder={lang === 'bn' ? 'পাসওয়ার্ড টাইপ করুন' : 'Type your password'}
                  className="w-full bg-slate-950 border-2 border-purple-800 focus:border-pink-500 rounded-xl px-4 py-2.5 pr-11 text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 p-1 rounded-lg text-purple-400 hover:text-white hover:bg-purple-900/50 transition cursor-pointer"
                  title={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-pink-400" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-700 hover:from-purple-600 hover:via-pink-500 hover:to-indigo-600 text-white font-black text-sm rounded-xl shadow-lg shadow-purple-900/50 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 disabled:opacity-50 mt-1"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{lang === 'bn' ? 'সফটওয়্যারে প্রবেশ করুন' : 'Verify & Access System'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* User Account Role Switcher / Quick Select User ID */}
          <div className="mt-5 pt-4 border-t border-purple-900/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>
                  {lang === 'bn'
                    ? 'ইউজার আইডি নির্বাচন করুন (পাসওয়ার্ড নিজ দায়িত্বে লিখুন):'
                    : 'Select User ID (Password must be entered manually):'}
                </span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-52 overflow-y-auto pr-1">
              {users.map((u) => {
                const isSelected = username.toLowerCase() === u.username.toLowerCase();
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectAccount(u.username)}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-purple-800/80 border-pink-400 shadow-md ring-1 ring-pink-400'
                        : 'bg-slate-950/70 hover:bg-purple-900/40 border-purple-900/60 text-purple-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-1 font-bold text-xs text-white">
                        {getRoleIcon(u.role)}
                        <span className="font-mono text-[11px]">{u.username}</span>
                      </div>
                      <span className="text-[8px] font-mono font-bold px-1 py-0.5 rounded bg-cyan-950 text-cyan-300">
                        {u.assignedWorkstation || u.role}
                      </span>
                    </div>
                    <div className="text-[9px] text-pink-300 truncate font-medium">
                      {getModuleSummary(u)}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-purple-400 mt-2 text-center leading-relaxed">
              {lang === 'bn'
                ? '🔒 লোকাল নেটওয়ার্কের (LAN) ১০টি পিসির যেকোনো ইউজার সিলেক্ট করুন। নিরাপত্তা নিশ্চিত করতে পাসওয়ার্ড নিজ হাতে টাইপ করতে হবে।'
                : '🔒 Select any of the 10 LAN workstation accounts. For security, manually enter password.'}
            </p>
          </div>

          {/* Security Badge */}
          <div className="mt-4 pt-3 border-t border-purple-900/70 text-center flex items-center justify-center gap-2 text-[11px] text-purple-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'bn' ? 'রোল-বেসড পারমিশন ও এনক্রিপ্টেড ডাটাবেস প্রটেক্টেড' : 'Role-Based Access Control & Encrypted Security'}</span>
          </div>

          {/* 3-Month Subscription Info & Renewal Access */}
          <div className="mt-3 flex items-center justify-between text-[11px] bg-purple-950/70 px-3 py-1.5 rounded-xl border border-purple-900/60 text-purple-200">
            <button
              type="button"
              onClick={() => setOpenLicenseModal(true)}
              className="flex items-center gap-1.5 hover:text-amber-300 transition cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {lang === 'bn'
                  ? `কোয়ার্টারলি লাইসেন্স: ${licenseInfo.daysRemaining} দিন অবশিষ্ট`
                  : `Subscription: ${licenseInfo.daysRemaining} days left`}
              </span>
            </button>
            <a
              href={`tel:${licenseInfo.subscriptionPhone}`}
              className="text-[10px] text-purple-300 hover:text-white font-mono"
            >
              হেল্পলাইন: {licenseInfo.subscriptionPhone}
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-2 text-[11px] text-purple-400">
        <span>Adiba Hospital &amp; Diagnostic Management Software · Version PRO 2.6</span>
      </div>
    </div>
  );
};
