import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BookOpen, X, CheckCircle, FileText, Printer, Stethoscope, Activity, Lock } from 'lucide-react';

interface UserGuideModalProps {
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ onClose }) => {
  const { lang, t } = useApp();
  const [guideLang, setGuideLang] = useState<'bn' | 'en'>(lang);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-purple-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-gradient-to-r from-purple-800 to-indigo-900 text-white">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-200" />
            <h3 className="font-semibold text-base">
              {guideLang === 'bn'
                ? 'মেডিকেয়ার সিস্টেম ডকুমেন্টেশন ও নির্দেশিকা'
                : 'MediCare System Documentation & User Manual'}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setGuideLang(guideLang === 'bn' ? 'en' : 'bn')}
              className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-xs font-bold"
            >
              {guideLang === 'bn' ? 'English Guide' : 'বাংলা নির্দেশিকা'}
            </button>
            <button onClick={onClose} className="p-1 text-white/80 hover:text-white rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 text-xs space-y-6 text-gray-700 dark:text-gray-300">
          {guideLang === 'bn' ? (
            <>
              {/* Pathology Guide BN */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-purple-950 dark:text-purple-300 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                    ১
                  </span>
                  প্যাথলজি টেস্ট রিপোর্ট তৈরি ও প্রিন্ট করার নিয়ম
                </h4>
                <div className="pl-8 space-y-1.5 leading-relaxed">
                  <p>• বিলের তারিখ এবং রোগীর আইডি (স্বয়ংক্রিয় বা কাস্টম) দিন।</p>
                  <p>• রোগীর নাম, বয়স, লিঙ্গ এবং রেফার্ড ডাক্তার কোড (যেমন: <strong>DR01</strong>) লিখুন।</p>
                  <p>• টেস্ট সার্চ বারে যে কোনো টেস্টের নাম (যেমন: CBC, Sugar, Lipid) টাইপ করে যোগ করুন অথবা নিচের শর্টকাট ক্লিক করুন।</p>
                  <p>• টেস্ট ফলাফল দিলে নরমাল রেঞ্জের বাইরে হলে স্বয়ংক্রিয়ভাবে <strong>High</strong> অথবা <strong>Low</strong> ফ্ল্যাগ মার্ক হবে।</p>
                  <p>• <strong>'Save Record'</strong> দিয়ে ডাটা সেভ করুন এবং <strong>'Save & Print'</strong> বাটনে চাপলে সরাসরি হাসপাতাল প্যাড প্রিন্ট ও PDF ডাউনলোড হবে।</p>
                </div>
              </div>

              {/* Billing Guide BN */}
              <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                <h4 className="font-bold text-sm text-purple-950 dark:text-purple-300 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    ২
                  </span>
                  বিলিং ও ক্যাশ মেমো / মানি রিসিপ্ট
                </h4>
                <div className="pl-8 space-y-1.5 leading-relaxed">
                  <p>• টেস্ট ড্রপডাউন থেকে এক বা একাধিক টেস্ট নির্বাচন করুন।</p>
                  <p>• প্রয়োজনে ডিসকাউন্ট (%) বা পরিশোধিত টাকা লিখলে স্বয়ংক্রিয়ভাবে বকেয়া হিসাব হয়ে যাবে।</p>
                  <p>• ক্যাশ মেমো প্রিন্ট বাটনে চাপ দিলে থার্মাল বা A4 রশিদ প্রিভিউ হবে।</p>
                </div>
              </div>

              {/* Doctor OPD & Rx Guide BN */}
              <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                <h4 className="font-bold text-sm text-purple-950 dark:text-purple-300 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                    ৩
                  </span>
                  ডাক্তার ভিজিট ও ডিজিটাল প্রেসক্রিপশন পোর্টাল
                </h4>
                <div className="pl-8 space-y-1.5 leading-relaxed">
                  <p>• ফ্রন্ট ডেস্ক থেকে ডাক্তার সিলেক্ট করে টোকেন ইস্যু করুন।</p>
                  <p>• কনসালট্যান্ট তার পোর্টালে রোগীর তথ্য, লক্ষণ, ওষুধ (ডোজ ও নির্দেশনাসহ) লিখে সরাসরি অফিসিয়াল Rx প্রিন্ট করতে পারবেন।</p>
                </div>
              </div>

              {/* LAN Multi-PC Guide BN */}
              <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                <h4 className="font-bold text-sm text-purple-950 dark:text-purple-300 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-xs">
                    ৪
                  </span>
                  লোকাল এরিয়া নেটওয়ার্ক (LAN) ও Cat 6 ক্যাবলে ৫-১০টি পিসি সংযোগ
                </h4>
                <div className="pl-8 space-y-1.5 leading-relaxed">
                  <p>• <strong>কানেকশন:</strong> সমস্ত পিসি Cat 6 UTP ক্যাবলের মাধ্যমে সেন্ট্রাল গিগাবিট সুইচের সাথে যুক্ত থাকবে।</p>
                  <p>• <strong>আইপি অ্যাড্রেস:</strong> প্রতিটি পিসিতে নির্দিষ্ট Static IP (যেমন: 192.168.1.101 থেকে 192.168.1.110) কনফিগার করা থাকবে।</p>
                  <p>• <strong>ইউজার রোল:</strong> রিসেপশন, বিলিং, প্যাথলজি ল্যাব, এক্স-রে, ইউএসজি, ইসিজি ও ডাক্তার চেম্বারের জন্য নির্দিষ্ট ইউজার আইডি ব্যবহার করুন।</p>
                  <p>• <strong>আইডি ভিত্তিক রিয়েল-টাইম সার্চ:</strong> কাউন্টারে বিল হওয়ার সাথে সাথেই যেকোনো ডিপার্টমেন্টের পিসি থেকে রোগীর ইউনিক আইডি দিলেই তার সকল তথ্য ও প্রেসক্রাইবড টেস্ট স্ক্রিনে চলে আসবে।</p>
                  <p>• <strong>অ্যাডমিন অডিট:</strong> অ্যাডমিন প্যানেলের <strong>'LAN নেটওয়ার্ক'</strong> ট্যাব থেকে কে কোন সময়ে সিস্টেমে লগইন করেছে এবং কী কাজ করেছে তা সরাসরি ট্র্যাক করা যায়।</p>
                </div>
              </div>

              {/* Security & Backup Guide BN */}
              <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                <h4 className="font-bold text-sm text-purple-950 dark:text-purple-300 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                    ৫
                  </span>
                  ডাটা ব্যাকআপ ও অফলাইন নিরাপত্তা
                </h4>
                <div className="pl-8 space-y-1.5 leading-relaxed">
                  <p>• সেটিংস ট্যাবের <strong>Data Backup</strong> অপশন থেকে প্রতিদিনের ডাটা JSON ফাইলে ডাউনলোড করে নিরাপদে সংরক্ষণ করতে পারবেন।</p>
                  <p>• ইন্টারনেট সংযোগ ছাড়াই সম্পূর্ণ লোকাল নেটওয়ার্কে হাই-স্পিড ডেটা ট্রান্সফারের মাধ্যমে সফটওয়্যারটি নির্বিঘ্নে চলবে।</p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Pathology Guide EN */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-purple-950 dark:text-purple-300 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                    1
                  </span>
                  Pathology Lab Reporting & Printing Workflow
                </h4>
                <div className="pl-8 space-y-1.5 leading-relaxed">
                  <p>• Enter Bill Date and Patient ID (autogenerated or custom).</p>
                  <p>• Type Patient Name, Age, Sex and Ref. Doctor Code (e.g. <strong>DR01</strong>).</p>
                  <p>• Search for any investigative test (e.g. CBC, Lipid, Sugar) or click quick panel shortcuts.</p>
                  <p>• Automatic abnormal flagging: values beyond reference ranges instantly mark as <strong>High</strong> or <strong>Low</strong>.</p>
                  <p>• Click <strong>'Save Record'</strong> to persist or <strong>'Save & Print'</strong> to open instant PDF & print dialog.</p>
                </div>
              </div>

              {/* Billing Guide EN */}
              <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                <h4 className="font-bold text-sm text-purple-950 dark:text-purple-300 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    2
                  </span>
                  Billing & Cash Memo / Money Receipts
                </h4>
                <div className="pl-8 space-y-1.5 leading-relaxed">
                  <p>• Select investigations from catalog dropdown.</p>
                  <p>• Input discount percent or paid amount to automatically calculate outstanding dues.</p>
                  <p>• Generate and print standard Cash Memos with computerized barcodes & receipt headers.</p>
                </div>
              </div>

              {/* Doctor OPD & Rx Guide EN */}
              <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                <h4 className="font-bold text-sm text-purple-950 dark:text-purple-300 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                    3
                  </span>
                  Doctor OPD Queue & Digital Prescription (Rx) Studio
                </h4>
                <div className="pl-8 space-y-1.5 leading-relaxed">
                  <p>• Issue sequential token numbers for doctor chambers from the OPD desk.</p>
                  <p>• Consultants enter complaints, vitals, prescribe medications with dosage instructions and advice.</p>
                  <p>• Instant A4 standardized doctor prescription printing.</p>
                </div>
              </div>

              {/* LAN Guide EN */}
              <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                <h4 className="font-bold text-sm text-purple-950 dark:text-purple-300 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-xs">
                    4
                  </span>
                  Hospital LAN & Cat-6 Multi-PC Network Architecture
                </h4>
                <div className="pl-8 space-y-1.5 leading-relaxed">
                  <p>• <strong>Cat 6 Cabling:</strong> Connect 5 to 10 workstations via Cat 6 UTP Ethernet to a central Gigabit switch.</p>
                  <p>• <strong>Static IP Scheme:</strong> Assign fixed Static IPs (e.g. 192.168.1.101 - 192.168.1.110) on subnet 255.255.255.0.</p>
                  <p>• <strong>Real-Time Central Database:</strong> When Reception creates a bill, other desks (Lab, X-Ray, USG, ECG) load patient demographics and test formats by typing the unique Patient ID.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserGuideModal;
