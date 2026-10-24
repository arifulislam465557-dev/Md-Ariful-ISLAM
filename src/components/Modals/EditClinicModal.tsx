import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  X,
  Save,
  CheckCircle2,
  RotateCcw,
  Image as ImageIcon,
  Upload,
  Trash2,
  Activity,
  HeartPulse,
  Cross,
  Stethoscope,
  FlaskConical,
  Shield,
  Eye,
} from 'lucide-react';

interface EditClinicModalProps {
  onClose: () => void;
}

export const EditClinicModal: React.FC<EditClinicModalProps> = ({ onClose }) => {
  const { clinicConfig, updateClinicConfig, lang } = useApp();

  const [clinicNameBn, setClinicNameBn] = useState(clinicConfig.clinicNameBn || '');
  const [clinicName, setClinicName] = useState(clinicConfig.clinicName || '');
  const [taglineBn, setTaglineBn] = useState(clinicConfig.taglineBn || '');
  const [tagline, setTagline] = useState(clinicConfig.tagline || '');
  const [address, setAddress] = useState(clinicConfig.address || '');
  const [phone, setPhone] = useState(clinicConfig.phone || '');
  const [email, setEmail] = useState(clinicConfig.email || '');
  const [regNo, setRegNo] = useState(clinicConfig.regNo || '');
  const [labInCharge, setLabInCharge] = useState(clinicConfig.labInCharge || '');
  const [logoUrl, setLogoUrl] = useState(clinicConfig.logoUrl || '');
  const [hospitalBackgroundUrl, setHospitalBackgroundUrl] = useState(clinicConfig.hospitalBackgroundUrl || '/hospital-bg.jpg');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Logo File Upload (reads file into Base64 data URL)
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert(lang === 'bn' ? 'লোগো ফাইলের সাইজ সর্বোচ্চ ২ মেগাবাইট হতে পারবে।' : 'Logo file size must be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setLogoUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicNameBn.trim() && !clinicName.trim()) {
      return;
    }

    updateClinicConfig({
      clinicNameBn: clinicNameBn.trim(),
      clinicName: clinicName.trim() || clinicNameBn.trim(),
      taglineBn: taglineBn.trim(),
      tagline: tagline.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      regNo: regNo.trim(),
      labInCharge: labInCharge.trim(),
      logoUrl: logoUrl.trim(),
      hospitalBackgroundUrl: hospitalBackgroundUrl.trim(),
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const handleResetToCurrent = () => {
    setClinicNameBn(clinicConfig.clinicNameBn || '');
    setClinicName(clinicConfig.clinicName || '');
    setTaglineBn(clinicConfig.taglineBn || '');
    setTagline(clinicConfig.tagline || '');
    setAddress(clinicConfig.address || '');
    setPhone(clinicConfig.phone || '');
    setEmail(clinicConfig.email || '');
    setRegNo(clinicConfig.regNo || '');
    setLabInCharge(clinicConfig.labInCharge || '');
    setLogoUrl(clinicConfig.logoUrl || '');
    setHospitalBackgroundUrl(clinicConfig.hospitalBackgroundUrl || '/hospital-bg.jpg');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-purple-500/80 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 px-5 py-3.5 text-white flex items-center justify-between border-b border-purple-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-400/40 flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5 text-pink-300" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base leading-tight">
                {lang === 'bn' ? 'প্রতিষ্ঠানের নাম, লোগো ও প্যাড সম্পাদনা' : 'Edit Hospital Name, Logo & Letterhead'}
              </h3>
              <p className="text-[11px] text-purple-300">
                {lang === 'bn'
                  ? 'এখানে লোগো বা নাম পরিবর্তন করলে তা হেডারে, প্যাডে এবং সকল রিপোর্টে স্থায়ীভাবে থাকবে'
                  : 'Changes to logo, name or in-charge will permanently persist across reports and headers'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {savedSuccess && (
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-400 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center gap-2 font-bold animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {lang === 'bn'
                  ? 'প্রতিষ্ঠানের সকল তথ্য ও লোগো সফলভাবে সংরক্ষিত হয়েছে!'
                  : 'Hospital info & logo successfully updated!'}
              </span>
            </div>
          )}

          {/* ======================================================== */}
          {/* SECTION 1: LOGO EDIT & UPLOAD */}
          {/* ======================================================== */}
          <div className="p-4 bg-gradient-to-r from-purple-50/70 to-pink-50/50 dark:from-slate-800/80 dark:to-purple-950/40 rounded-2xl border-2 border-purple-200 dark:border-purple-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-black text-sm text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-pink-500" />
                <span>{lang === 'bn' ? 'প্রতিষ্ঠানের লোগো পরিবর্তন / আপলোড' : 'Hospital / Clinic Logo'}</span>
              </label>
              <span className="text-[10px] text-purple-600 font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900">
                {lang === 'bn' ? 'হেডার ও রিপোর্টে দেখা যাবে' : 'Appears on Header & Reports'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Logo Preview */}
              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border-2 border-purple-300 dark:border-purple-600 flex items-center justify-center p-1.5 shadow-md shrink-0 relative overflow-hidden group">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Clinic Logo Preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as any).src = '/icon.svg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-indigo-600 flex items-center justify-center text-white">
                    <Activity className="w-8 h-8" />
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-600 hover:to-pink-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'লোগো ছবি আপলোড করুন' : 'Upload Logo Image'}</span>
                  </button>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="px-2.5 py-2 bg-red-100 dark:bg-red-950/60 hover:bg-red-200 text-red-700 dark:text-red-300 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      title="Remove Logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'রিমুভ' : 'Remove'}</span>
                    </button>
                  )}
                </div>

                {/* Direct URL input */}
                <div>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder={lang === 'bn' ? 'বা লোগো ইমেজের ওয়েব লিংক (URL) দিন' : 'Or paste direct logo image URL'}
                    className="w-full bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-700 px-3 py-1.5 rounded-lg text-xs font-mono text-purple-950 dark:text-purple-200 focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 2: HOSPITAL BACKGROUND IN HEADER */}
          {/* ======================================================== */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                <Building2 className="w-4 h-4 text-purple-600" />
                <span>{lang === 'bn' ? 'হেডারে হসপিটাল ব্যাকগ্রাউন্ড ছবি' : 'Hospital Header Background'}</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHospitalBackgroundUrl(hospitalBackgroundUrl ? '' : '/hospital-bg.jpg')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                    hospitalBackgroundUrl
                      ? 'bg-purple-900 text-purple-200 border-purple-700'
                      : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {hospitalBackgroundUrl
                    ? (lang === 'bn' ? 'ছবি সক্রিয়' : 'Image Active')
                    : (lang === 'bn' ? 'ছবি বন্ধ' : 'Disabled')}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              {lang === 'bn'
                ? 'হেডারের ব্যাকগ্রাউন্ডে একটি আধুনিক মাল্টি-স্পেশালিটি হসপিটাল বিল্ডিংয়ের প্যানোরামা দৃশ্য প্রদর্শিত হবে।'
                : 'Displays a high-tech modern hospital architectural panorama in the header area.'}
            </p>
          </div>

          {/* Bengali Name */}
          <div>
            <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
              {lang === 'bn' ? 'প্রতিষ্ঠানের নাম (বাংলা)' : 'Institution Name (Bengali)'} *
            </label>
            <input
              type="text"
              required
              value={clinicNameBn}
              onChange={(e) => setClinicNameBn(e.target.value)}
              placeholder="যেমন: মেডিকেয়ার ডায়াগনস্টিক ও কনসালটেশন সেন্টার"
              className="w-full bg-purple-50/50 dark:bg-slate-800 border-2 border-purple-300 dark:border-purple-600 px-3 py-2 rounded-xl text-sm font-black text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          {/* English Name */}
          <div>
            <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
              {lang === 'bn' ? 'প্রতিষ্ঠানের নাম (English)' : 'Institution Name (English)'} *
            </label>
            <input
              type="text"
              required
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="e.g. MEDICARE DIAGNOSTIC & CONSULTATION CENTER"
              className="w-full bg-purple-50/50 dark:bg-slate-800 border-2 border-purple-300 dark:border-purple-600 px-3 py-2 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-600 focus:outline-none uppercase"
            />
          </div>

          {/* Tagline Bengali & English */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'স্লোগান / ট্যাগলাইন (বাংলা)' : 'Tagline (Bengali)'}
              </label>
              <input
                type="text"
                value={taglineBn}
                onChange={(e) => setTaglineBn(e.target.value)}
                placeholder="যেমন: আধুনিক ডায়াগনস্টিক সেবা..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'স্লোগান / ট্যাগলাইন (English)' : 'Tagline (English)'}
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Modern Diagnostic Services..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Address & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'ঠিকানা (Address)' : 'Address'}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="যেমন: প্লট-১২, মেইন রোড, ঢাকা"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'ফোন / হটলাইন' : 'Phone / Hotline'}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 1712-345678"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Email & Registration No */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'ইমেইল' : 'Email'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@clinic.com"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'সরকারি লাইসেন্স / রেজি. নম্বর' : 'Govt Reg. No.'}
              </label>
              <input
                type="text"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                placeholder="DGHS-REG-2024/78912"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Medical Technologist / Lab In-Charge */}
          <div className="p-3.5 bg-purple-50/70 dark:bg-slate-800/80 rounded-2xl border-2 border-purple-200 dark:border-purple-800">
            <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
              {lang === 'bn' ? 'মেডিকেল টেকনোলজিস্ট (ল্যাব ইন-চার্জ নাম ও পদবী)' : 'Medical Technologist (Lab In-Charge)'}
            </label>
            <input
              type="text"
              value={labInCharge}
              onChange={(e) => setLabInCharge(e.target.value)}
              placeholder="যেমন: মোঃ আল-আমিন, B.Sc (Medical Technology)"
              className="w-full bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-600 px-3 py-2 rounded-xl text-xs font-bold text-purple-950 dark:text-purple-200 focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              {lang === 'bn'
                ? '💡 এখানে যে নামটি লিখে সংরক্ষণ করবেন, যতক্ষণ না নিজে এসে এটি পরিবর্তন করবেন ততক্ষণ পর্যন্ত এই নামটাই রিপোর্টে স্থায়ী থাকবে।'
                : '💡 The name you save here will permanently remain on pathology reports until you edit it.'}
            </p>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetToCurrent}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'রিসেট' : 'Reset'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-xl font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
