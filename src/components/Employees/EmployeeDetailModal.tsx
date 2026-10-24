import React, { useState } from 'react';
import { Employee } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  CreditCard,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  MapPin,
  Heart,
  User,
  Shield,
  Eye,
  Download,
  Printer,
  FileText,
  BadgeCheck,
  Building,
} from 'lucide-react';

interface EmployeeDetailModalProps {
  employee: Employee;
  onClose: () => void;
  onEdit: (emp: Employee) => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  employee,
  onClose,
  onEdit,
}) => {
  const { clinicConfig, lang } = useApp();
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);

  const printIdCard = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-gray-850 rounded-2xl shadow-2xl border border-purple-200 dark:border-gray-700 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <User className="w-5 h-5 text-pink-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight flex items-center gap-2">
                <span>{employee.name}</span>
                <span className="text-[10px] bg-purple-700/80 border border-purple-400/40 text-purple-100 font-mono px-2 py-0.5 rounded-full">
                  {employee.empId}
                </span>
              </h2>
              <p className="text-xs text-purple-200">
                {employee.designation} · {employee.department}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={printIdCard}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition cursor-pointer text-xs flex items-center gap-1.5 px-2.5"
              title="Print Employee Profile"
            >
              <Printer className="w-4 h-4 text-purple-200" />
              <span className="hidden sm:inline font-semibold">{lang === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Top Banner with Profile Photo & Quick Highlights */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-5 bg-gradient-to-br from-purple-50 via-slate-50 to-indigo-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-850 rounded-2xl border border-purple-100 dark:border-gray-700">
            {/* Photo */}
            <div className="relative group shrink-0">
              <div className="w-28 h-28 rounded-2xl overflow-hidden bg-purple-100 dark:bg-gray-700 border-3 border-purple-600 shadow-md flex items-center justify-center">
                {employee.photoUrl ? (
                  <img
                    src={employee.photoUrl}
                    alt={employee.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-14 h-14 text-purple-400" />
                )}
              </div>
              <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs ${
                    employee.status === 'Active'
                      ? 'bg-emerald-600 text-white'
                      : employee.status === 'On Leave'
                      ? 'bg-amber-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}
                >
                  {employee.status === 'Active' ? 'সক্রিয় (Active)' : employee.status}
                </span>
              </div>
            </div>

            {/* Quick Details */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{employee.name}</h3>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                  {employee.department}
                </span>
              </div>
              <p className="text-sm font-semibold text-purple-950 dark:text-purple-300 flex items-center justify-center sm:justify-start gap-1.5">
                <BadgeCheck className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                <span>{employee.designation}</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400 shrink-0" />
                  <span className="font-mono font-medium">{employee.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400 shrink-0" />
                  <span className="truncate">{employee.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400 shrink-0" />
                  <span>
                    {lang === 'bn' ? 'যোগদান: ' : 'Joined: '}
                    <strong className="text-gray-800 dark:text-gray-200">{employee.joiningDate}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    {lang === 'bn' ? 'বেতন: ' : 'Salary: '}
                    <strong className="text-emerald-700 dark:text-emerald-400 font-bold">
                      ৳{employee.salary.toLocaleString()}
                    </strong>
                    /মাস
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Personal & Identity Grid */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 space-y-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-700 pb-2">
              <Shield className="w-4 h-4 text-purple-700" />
              <span>{lang === 'bn' ? 'ব্যক্তিগত ও পরিচয়পত্র তথ্য' : 'Personal & Identity Information'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-gray-750 rounded-lg border border-slate-100 dark:border-gray-700">
                <span className="text-gray-500 block text-[11px] font-medium">
                  {lang === 'bn' ? 'পিতার নাম (Father)' : "Father's Name"}
                </span>
                <span className="font-bold text-gray-900 dark:text-gray-100 text-sm mt-0.5 block">
                  {employee.fatherName || 'তথ্য নেই'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-gray-750 rounded-lg border border-slate-100 dark:border-gray-700">
                <span className="text-gray-500 block text-[11px] font-medium">
                  {lang === 'bn' ? 'মাতার নাম (Mother)' : "Mother's Name"}
                </span>
                <span className="font-bold text-gray-900 dark:text-gray-100 text-sm mt-0.5 block">
                  {employee.motherName || 'তথ্য নেই'}
                </span>
              </div>

              <div className="p-3 bg-purple-50/60 dark:bg-purple-950/40 rounded-lg border border-purple-200/80 dark:border-purple-800">
                <span className="text-purple-700 dark:text-purple-300 block text-[11px] font-bold flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-pink-600" />
                  {lang === 'bn' ? 'ভোটার কার্ড / NID নং' : 'Voter Card / NID'}
                </span>
                <span className="font-mono font-black text-purple-950 dark:text-purple-100 text-sm mt-0.5 block tracking-wide">
                  {employee.voterId}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-gray-750 rounded-lg border border-slate-100 dark:border-gray-700">
                <span className="text-gray-500 block text-[11px] font-medium">
                  {lang === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'}
                </span>
                <span className="font-bold text-red-600 dark:text-red-400 text-sm mt-0.5 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  {employee.bloodGroup || 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-gray-750 rounded-lg border border-slate-100 dark:border-gray-700">
                <span className="text-gray-500 block text-[11px] font-medium">
                  {lang === 'bn' ? 'জরুরি যোগাযোগ' : 'Emergency Contact'}
                </span>
                <span className="font-bold text-gray-900 dark:text-gray-100 text-xs mt-0.5 block">
                  {employee.emergencyContact || 'তথ্য নেই'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-gray-750 rounded-lg border border-slate-100 dark:border-gray-700">
                <span className="text-gray-500 block text-[11px] font-medium">
                  {lang === 'bn' ? 'বর্তমান ঠিকানা' : 'Address'}
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100 text-xs mt-0.5 block leading-snug">
                  {employee.address || 'তথ্য নেই'}
                </span>
              </div>
            </div>

            {employee.notes && (
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                <strong className="block font-bold mb-0.5">{lang === 'bn' ? 'বিশেষ নোট:' : 'Internal Notes:'}</strong>
                <span>{employee.notes}</span>
              </div>
            )}
          </div>

          {/* Voter Card / NID Document Gallery */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-purple-700" />
                <span>
                  {lang === 'bn' ? 'ভোটার কার্ডের ছবি (NID Photos)' : 'Voter Card / NID Photo Documents'}
                </span>
              </h4>
              <span className="text-[11px] text-gray-500 font-mono">
                {lang === 'bn' ? 'সম্মুখ ও পেছনের কপি' : 'Front & Back Copies'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Voter Card Front */}
              <div className="bg-slate-50 dark:bg-gray-750 p-4 rounded-xl border border-slate-200 dark:border-gray-700 flex flex-col items-center">
                <span className="text-xs font-bold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-pink-600" />
                  {lang === 'bn' ? 'ভোটার কার্ডের সম্মুখ ছবি (Front Side)' : 'Voter Card Front Photo'}
                </span>

                <div className="w-full h-48 rounded-lg overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center relative group shadow-xs">
                  {employee.voterCardFrontPhotoUrl ? (
                    <>
                      <img
                        src={employee.voterCardFrontPhotoUrl}
                        alt="Voter Card Front"
                        className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                      />
                      <button
                        onClick={() =>
                          setSelectedImage({
                            url: employee.voterCardFrontPhotoUrl!,
                            title: `${employee.name} - ভোটার কার্ড সম্মুখ ছবি`,
                          })
                        }
                        className="absolute inset-0 bg-black/40 text-white flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition cursor-pointer font-bold text-xs"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{lang === 'bn' ? 'বড় করে দেখুন' : 'Zoom View'}</span>
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-4 text-gray-400">
                      <CreditCard className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-xs">{lang === 'bn' ? 'সম্মুখ ছবি আপলোড করা হয়নি' : 'No front photo uploaded'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Voter Card Back */}
              <div className="bg-slate-50 dark:bg-gray-750 p-4 rounded-xl border border-slate-200 dark:border-gray-700 flex flex-col items-center">
                <span className="text-xs font-bold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-pink-600" />
                  {lang === 'bn' ? 'ভোটার কার্ডের পেছনের ছবি (Back Side)' : 'Voter Card Back Photo'}
                </span>

                <div className="w-full h-48 rounded-lg overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center relative group shadow-xs">
                  {employee.voterCardBackPhotoUrl ? (
                    <>
                      <img
                        src={employee.voterCardBackPhotoUrl}
                        alt="Voter Card Back"
                        className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                      />
                      <button
                        onClick={() =>
                          setSelectedImage({
                            url: employee.voterCardBackPhotoUrl!,
                            title: `${employee.name} - ভোটার কার্ড পেছনের ছবি`,
                          })
                        }
                        className="absolute inset-0 bg-black/40 text-white flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition cursor-pointer font-bold text-xs"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{lang === 'bn' ? 'বড় করে দেখুন' : 'Zoom View'}</span>
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-4 text-gray-400">
                      <CreditCard className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-xs">{lang === 'bn' ? 'পেছনের ছবি আপলোড করা হয়নি' : 'No back photo uploaded'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Buttons */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
          <div className="text-[11px] text-gray-500">
            {lang === 'bn' ? 'রেজিস্ট্রেশন তারিখ: ' : 'Registered: '}
            <span className="font-mono">{employee.createdAt || employee.joiningDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onEdit(employee);
              }}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
            >
              {lang === 'bn' ? 'তথ্য সম্পাদনা করুন' : 'Edit Information'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-650 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox / Zoom modal for Voter Card / Photo */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center w-full pb-2 text-white">
              <span className="font-bold text-sm">{selectedImage.title}</span>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-1 bg-white/20 hover:bg-white/40 rounded-full text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={selectedImage.url}
              alt="Zoomed document"
              className="max-h-[80vh] w-auto rounded-lg shadow-2xl object-contain border border-white/20"
            />
          </div>
        </div>
      )}
    </div>
  );
};
