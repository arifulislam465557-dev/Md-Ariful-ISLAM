import React, { useState } from 'react';
import { Employee } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Upload,
  User,
  CreditCard,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  MapPin,
  Heart,
  Briefcase,
  Building,
  Check,
  AlertCircle,
  Camera,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';

interface AddEmployeeModalProps {
  onClose: () => void;
  initialEmployee?: Employee | null;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  onClose,
  initialEmployee,
}) => {
  const { addEmployee, updateEmployee, lang, employees } = useApp();

  const isEdit = Boolean(initialEmployee);

  const [name, setName] = useState(initialEmployee?.name || '');
  const [fatherName, setFatherName] = useState(initialEmployee?.fatherName || '');
  const [motherName, setMotherName] = useState(initialEmployee?.motherName || '');
  const [voterId, setVoterId] = useState(initialEmployee?.voterId || '');
  const [email, setEmail] = useState(initialEmployee?.email || '');
  const [phone, setPhone] = useState(initialEmployee?.phone || '');
  const [designation, setDesignation] = useState(initialEmployee?.designation || 'মেডিকেল টেকনোলজিস্ট');
  const [department, setDepartment] = useState(initialEmployee?.department || 'Pathology');
  const [joiningDate, setJoiningDate] = useState(
    initialEmployee?.joiningDate || new Date().toISOString().split('T')[0]
  );
  const [salary, setSalary] = useState(initialEmployee?.salary ? String(initialEmployee.salary) : '25000');
  const [bloodGroup, setBloodGroup] = useState(initialEmployee?.bloodGroup || 'B+');
  const [address, setAddress] = useState(initialEmployee?.address || '');
  const [emergencyContact, setEmergencyContact] = useState(initialEmployee?.emergencyContact || '');
  const [status, setStatus] = useState<'Active' | 'On Leave' | 'Terminated'>(
    initialEmployee?.status || 'Active'
  );
  const [notes, setNotes] = useState(initialEmployee?.notes || '');

  // Photo strings (Base64 or URL)
  const [photoUrl, setPhotoUrl] = useState(initialEmployee?.photoUrl || '');
  const [voterCardFrontPhotoUrl, setVoterCardFrontPhotoUrl] = useState(
    initialEmployee?.voterCardFrontPhotoUrl || ''
  );
  const [voterCardBackPhotoUrl, setVoterCardBackPhotoUrl] = useState(
    initialEmployee?.voterCardBackPhotoUrl || ''
  );

  const [error, setError] = useState('');

  // Auto-generate employee ID
  const empId = initialEmployee?.empId || `EMP-${100 + employees.length + 1}`;

  // File upload reader helper
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(lang === 'bn' ? 'ফাইল সাইজ ৫MB এর কম হতে হবে।' : 'File size must be under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(lang === 'bn' ? 'কর্মচারীর নাম প্রদান করুন!' : 'Employee name is required!');
      return;
    }
    if (!voterId.trim()) {
      setError(lang === 'bn' ? 'ভোটার আইডি / এনআইডি নম্বর প্রদান করুন!' : 'Voter Card / NID number is required!');
      return;
    }
    if (!phone.trim()) {
      setError(lang === 'bn' ? 'মোবাইল নম্বর প্রদান করুন!' : 'Mobile phone number is required!');
      return;
    }

    if (isEdit && initialEmployee) {
      updateEmployee(initialEmployee.id, {
        name: name.trim(),
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        voterId: voterId.trim(),
        email: email.trim(),
        phone: phone.trim(),
        designation: designation.trim(),
        department,
        joiningDate,
        salary: Number(salary) || 0,
        bloodGroup,
        address: address.trim(),
        emergencyContact: emergencyContact.trim(),
        status,
        notes: notes.trim(),
        photoUrl: photoUrl || undefined,
        voterCardFrontPhotoUrl: voterCardFrontPhotoUrl || undefined,
        voterCardBackPhotoUrl: voterCardBackPhotoUrl || undefined,
      });
    } else {
      addEmployee({
        empId,
        name: name.trim(),
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        voterId: voterId.trim(),
        email: email.trim(),
        phone: phone.trim(),
        designation: designation.trim(),
        department,
        joiningDate,
        salary: Number(salary) || 0,
        bloodGroup,
        address: address.trim(),
        emergencyContact: emergencyContact.trim(),
        status,
        notes: notes.trim(),
        photoUrl: photoUrl || undefined,
        voterCardFrontPhotoUrl: voterCardFrontPhotoUrl || undefined,
        voterCardBackPhotoUrl: voterCardBackPhotoUrl || undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-gray-850 rounded-2xl shadow-2xl border border-purple-200 dark:border-gray-700 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <User className="w-5 h-5 text-pink-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                {isEdit
                  ? lang === 'bn'
                    ? 'কর্মচারীর তথ্য সম্পাদনা'
                    : 'Edit Employee Information'
                  : lang === 'bn'
                  ? 'নতুন কর্মচারী ও কর্মকর্তা যোগ করুন'
                  : 'Add New Employee / Staff'}
              </h2>
              <p className="text-xs text-purple-200">
                {lang === 'bn'
                  ? 'ছবি, ভোটার আইডি কার্ড এবং পূর্ণ তথ্যাদি অন্তর্ভুক্ত করুন'
                  : 'Enter photo, voter card photos, and personal records'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Photo & ID upload row */}
          <div className="p-4 bg-purple-50/60 dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700 space-y-4">
            <h3 className="text-xs font-bold text-purple-950 dark:text-purple-300 uppercase tracking-wider flex items-center gap-2">
              <Camera className="w-4 h-4 text-pink-600" />
              <span>{lang === 'bn' ? 'ফটো ও ভোটার কার্ড ডকুমেন্টস' : 'Photo & Voter Card Documents'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 1. Employee Photo */}
              <div className="space-y-2 text-center">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  {lang === 'bn' ? '১. কর্মচারীর ফটো' : '1. Profile Photo'} <span className="text-red-500">*</span>
                </label>
                <div className="relative mx-auto w-28 h-28 rounded-2xl border-2 border-dashed border-purple-300 dark:border-purple-700 overflow-hidden bg-white dark:bg-gray-750 flex items-center justify-center group shadow-xs">
                  {photoUrl ? (
                    <>
                      <img src={photoUrl} alt="Employee" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition cursor-pointer text-xs"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                        <span>{lang === 'bn' ? 'ছবি মুছুন' : 'Remove'}</span>
                      </button>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer p-2 w-full h-full text-gray-400 hover:text-purple-700 dark:hover:text-purple-300">
                      <Camera className="w-6 h-6 mb-1 text-purple-500" />
                      <span className="text-[10px] font-semibold text-center leading-tight">
                        {lang === 'bn' ? 'ছবি আপলোড' : 'Upload Photo'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setPhotoUrl)}
                      />
                    </label>
                  )}
                </div>
                <p className="text-[10px] text-gray-500">JPG, PNG (Max 5MB)</p>
              </div>

              {/* 2. Voter Card Front */}
              <div className="space-y-2 text-center">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  {lang === 'bn' ? '২. ভোটার কার্ড (সম্মুখ)' : '2. Voter Card (Front)'}{' '}
                  <span className="text-pink-600 font-normal">({lang === 'bn' ? 'ছবি অ্যাড' : 'Photo'})</span>
                </label>
                <div className="relative mx-auto w-full h-28 rounded-2xl border-2 border-dashed border-purple-300 dark:border-purple-700 overflow-hidden bg-white dark:bg-gray-750 flex items-center justify-center group shadow-xs">
                  {voterCardFrontPhotoUrl ? (
                    <>
                      <img
                        src={voterCardFrontPhotoUrl}
                        alt="Voter Front"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setVoterCardFrontPhotoUrl('')}
                        className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition cursor-pointer text-xs"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                        <span>{lang === 'bn' ? 'মুছুন' : 'Remove'}</span>
                      </button>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer p-2 w-full h-full text-gray-400 hover:text-purple-700 dark:hover:text-purple-300">
                      <CreditCard className="w-6 h-6 mb-1 text-pink-500" />
                      <span className="text-[10px] font-semibold text-center leading-tight">
                        {lang === 'bn' ? 'কার্ডের সামনের ছবি' : 'Front Photo'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setVoterCardFrontPhotoUrl)}
                      />
                    </label>
                  )}
                </div>
                <p className="text-[10px] text-gray-500">{lang === 'bn' ? 'এনআইডি সম্মুখ দিক' : 'NID Front side'}</p>
              </div>

              {/* 3. Voter Card Back */}
              <div className="space-y-2 text-center">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  {lang === 'bn' ? '৩. ভোটার কার্ড (পেছন)' : '3. Voter Card (Back)'}{' '}
                  <span className="text-pink-600 font-normal">({lang === 'bn' ? 'ছবি অ্যাড' : 'Photo'})</span>
                </label>
                <div className="relative mx-auto w-full h-28 rounded-2xl border-2 border-dashed border-purple-300 dark:border-purple-700 overflow-hidden bg-white dark:bg-gray-750 flex items-center justify-center group shadow-xs">
                  {voterCardBackPhotoUrl ? (
                    <>
                      <img
                        src={voterCardBackPhotoUrl}
                        alt="Voter Back"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setVoterCardBackPhotoUrl('')}
                        className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition cursor-pointer text-xs"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                        <span>{lang === 'bn' ? 'মুছুন' : 'Remove'}</span>
                      </button>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer p-2 w-full h-full text-gray-400 hover:text-purple-700 dark:hover:text-purple-300">
                      <CreditCard className="w-6 h-6 mb-1 text-indigo-500" />
                      <span className="text-[10px] font-semibold text-center leading-tight">
                        {lang === 'bn' ? 'কার্ডের পেছনের ছবি' : 'Back Photo'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setVoterCardBackPhotoUrl)}
                      />
                    </label>
                  )}
                </div>
                <p className="text-[10px] text-gray-500">{lang === 'bn' ? 'এনআইডি পেছনের দিক' : 'NID Back side'}</p>
              </div>
            </div>
          </div>

          {/* Primary Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Full Name */}
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                {lang === 'bn' ? 'কর্মচারীর পূর্ণ নাম' : 'Employee Full Name'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === 'bn' ? 'যেমন: মো: আরিফুল ইসলাম' : 'e.g. Md. Ariful Islam'}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-600 outline-none"
                />
                <User className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Voter ID / NID Number */}
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                {lang === 'bn' ? 'ভোটার কার্ড / NID নম্বর' : 'Voter Card / NID Number'}{' '}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={voterId}
                  onChange={(e) => setVoterId(e.target.value)}
                  placeholder={lang === 'bn' ? 'যেমন: 19952691234567890' : 'National ID / Smart Card No'}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono focus:ring-2 focus:ring-purple-600 outline-none"
                />
                <CreditCard className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Father's Name */}
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                {lang === 'bn' ? 'পিতার নাম' : "Father's Name"}
              </label>
              <input
                type="text"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                placeholder={lang === 'bn' ? 'পিতার নাম লিখুন' : "Enter father's name"}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-600 outline-none"
              />
            </div>

            {/* Mother's Name */}
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                {lang === 'bn' ? 'মাতার নাম' : "Mother's Name"}
              </label>
              <input
                type="text"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                placeholder={lang === 'bn' ? 'মাতার নাম লিখুন' : "Enter mother's name"}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-600 outline-none"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                {lang === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+880 1712-345678"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono focus:ring-2 focus:ring-purple-600 outline-none"
                />
                <Phone className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                {lang === 'bn' ? 'ইমেইল এড্রেস' : 'Email Address'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee@clinic.com"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-600 outline-none"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Designation */}
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                {lang === 'bn' ? 'পদবি (Designation)' : 'Designation'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="যেমন: সিনিয়র ল্যাব টেকনোলজিস্ট / ক্যাশিয়ার"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-600 outline-none"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                {lang === 'bn' ? 'বিভাগ (Department)' : 'Department'}
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-600 outline-none"
              >
                <option value="Pathology">প্যাথলজি ল্যাব (Pathology)</option>
                <option value="Billing & Accounts">বিলিং ও একাউন্টস (Billing & Accounts)</option>
                <option value="Radiology">রেডিওলজি ও এক্স-রে (Radiology/X-Ray)</option>
                <option value="Doctor OPD">ডক্টর ওপিডি ভিজিট (Doctor OPD)</option>
                <option value="Ultrasound">আল্ট্রাসাউন্ড শাখা (Ultrasound)</option>
                <option value="Nursing">নার্সিং ও রোগী সেবা (Nursing)</option>
                <option value="Administration">প্রশাসন ও এইচআর (Administration)</option>
                <option value="General">সাধারণ ও সাপোর্ট স্টাফ (General Staff)</option>
              </select>
            </div>

            {/* Joining Date */}
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                {lang === 'bn' ? 'যোগদানের তারিখ' : 'Joining Date'}
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono focus:ring-2 focus:ring-purple-600 outline-none"
                />
                <Calendar className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Monthly Salary */}
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                {lang === 'bn' ? 'মাসিক বেতন (৳)' : 'Monthly Salary (৳)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="25000"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono font-bold text-emerald-700 dark:text-emerald-400 focus:ring-2 focus:ring-purple-600 outline-none"
                />
                <span className="absolute left-2.5 top-2 font-bold text-gray-400">৳</span>
              </div>
            </div>

            {/* Blood Group */}
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                {lang === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'}
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-600 outline-none"
              >
                <option value="A+">A+</option>
                <option value="B+">B+</option>
                <option value="AB+">AB+</option>
                <option value="O+">O+</option>
                <option value="A-">A-</option>
                <option value="B-">B-</option>
                <option value="AB-">AB-</option>
                <option value="O-">O-</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                {lang === 'bn' ? 'স্ট্যাটাস' : 'Employment Status'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-600 outline-none"
              >
                <option value="Active">সক্রিয় (Active)</option>
                <option value="On Leave">ছুটিতে (On Leave)</option>
                <option value="Terminated">চাকরি শেষ (Terminated)</option>
              </select>
            </div>

            {/* Emergency Contact */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                {lang === 'bn' ? 'জরুরি যোগাযোগের ফোন নম্বর ও সম্পর্ক' : 'Emergency Contact'}
              </label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder={lang === 'bn' ? 'যেমন: +880 1711-223344 (ভাই / পিতা)' : '+880 1711-223344 (Brother)'}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-600 outline-none"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                {lang === 'bn' ? 'বর্তমান ঠিকানা ও স্থায়ী ঠিকানা' : 'Address'}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={lang === 'bn' ? 'বাড়ি নং, রোড নং, থানা, জেলা...' : 'House, Road, Area, City'}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-600 outline-none"
              />
            </div>

            {/* Internal Notes */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                {lang === 'bn' ? 'অতিরিক্ত মন্তব্য বা অভিজ্ঞতা' : 'Internal Notes / Skills'}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={lang === 'bn' ? 'কর্মচারীর দক্ষতা, দায়িত্ব বা শিক্ষাগত বিবরণ...' : 'Notes or special duties...'}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-600 outline-none"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 text-xs font-bold transition cursor-pointer"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-900 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>
                {isEdit
                  ? lang === 'bn'
                    ? 'তথ্য সংরক্ষণ করুন'
                    : 'Save Changes'
                  : lang === 'bn'
                  ? 'নতুন কর্মচারী যুক্ত করুন'
                  : 'Register Employee'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
