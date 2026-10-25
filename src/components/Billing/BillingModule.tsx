import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice, InvoiceItem } from '../../types';
import { CashMemoModal } from './CashMemoModal';
import {
  Receipt,
  Plus,
  Trash2,
  Printer,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  ArrowRight,
  Sparkles,
  UserPlus,
  Edit3,
  History,
  Send,
  Share2,
  User,
  ExternalLink,
} from 'lucide-react';
import { getTodayDateStr } from '../../utils/dateUtils';
import {
  buildInvoiceWhatsAppMessage,
  getWhatsAppUrl,
  formatBanglaWhatsAppPhone,
} from '../../utils/whatsappHelper';

export const BillingModule: React.FC = () => {
  const {
    invoices,
    addInvoice,
    deleteInvoice,
    labTests,
    addLabTest,
    updateLabTest,
    doctors,
    addDoctor,
    clinicConfig,
    t,
    lang,
    setActiveTab,
    currentWorkstation,
    currentUser,
    printLogs,
    addNotification,
    openPatientOverviewModal,
    activeDrafts,
    updateModuleDraft,
    isAdminUser,
    searchReceiptsAndInvoices,
    deleteReceipt,
  } = useApp();

  const savedDraft = activeDrafts?.billingFormDraft;

  const [pId, setPId] = useState(() => savedDraft?.pId || `26100${Math.floor(100 + Math.random() * 900)}`);
  const [billDate, setBillDate] = useState<string>(() => savedDraft?.billDate || getTodayDateStr(true));
  const [patientName, setPatientName] = useState(() => savedDraft?.patientName || '');
  const [age, setAge] = useState(() => savedDraft?.age || '');
  const [sex, setSex] = useState<'Male' | 'Female' | 'Other'>(() => savedDraft?.sex || 'Female');
  const [phone, setPhone] = useState(() => savedDraft?.phone || '+880 17');
  const [drCode, setDrCode] = useState(() => savedDraft?.drCode || 'DR01');

  // Doctor search & registration state
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [doctorSearchInput, setDoctorSearchInput] = useState('');
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

  // New Doctor form state for modal
  const [newDocCode, setNewDocCode] = useState(`DR0${doctors.length + 1}`);
  const [newDocName, setNewDocName] = useState('');
  const [newDocDegree, setNewDocDegree] = useState('MBBS, FCPS');
  const [newDocSpecialty, setNewDocSpecialty] = useState('Specialist Physician');
  const [newDocPhone, setNewDocPhone] = useState('+880 17');
  const [newDocRoom, setNewDocRoom] = useState('201');
  const [newDocFee, setNewDocFee] = useState(800);

  // Test Search & Autocomplete state
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [showTestDropdown, setShowTestDropdown] = useState(false);

  // Quick Add / Edit Test modal state
  const [showCustomTestModal, setShowCustomTestModal] = useState(false);
  const [customTestTab, setCustomTestTab] = useState<'add' | 'edit'>('add');
  const [customTestName, setCustomTestName] = useState('');
  const [customTestPrice, setCustomTestPrice] = useState<number | ''>('');
  const [customTestCategory, setCustomTestCategory] = useState('Pathology');
  const [customTestUnit, setCustomTestUnit] = useState('');
  const [customTestNormal, setCustomTestNormal] = useState('');
  const [saveCustomToCatalog, setSaveCustomToCatalog] = useState(true);

  // Edit Test sub-state for catalog
  const [selectedTestToEditId, setSelectedTestToEditId] = useState<string>('');
  const [editCatalogTestName, setEditCatalogTestName] = useState<string>('');
  const [editCatalogTestPrice, setEditCatalogTestPrice] = useState<number | ''>('');
  const [editCatalogTestCategory, setEditCatalogTestCategory] = useState<string>('Pathology');
  const [editCatalogTestUnit, setEditCatalogTestUnit] = useState<string>('');
  const [editCatalogTestNormal, setEditCatalogTestNormal] = useState<string>('');
  const [testSearchEditQuery, setTestSearchEditQuery] = useState<string>('');

  // Right column tab: Recent Invoices vs Print Audit Log
  const [rightTab, setRightTab] = useState<'invoices' | 'printLogs'>('invoices');
  const [printLogSearch, setPrintLogSearch] = useState<string>('');

  // Discount options: Percent (%) or Flat (৳)
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('flat');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountFlat, setDiscountFlat] = useState<number>(0);
  const [discountBy, setDiscountBy] = useState<string>('');

  // Auto-save active Billing form draft as user types
  useEffect(() => {
    if (!patientName.trim() && (!phone.trim() || phone.trim() === '+880 17')) return;
    const timer = setTimeout(() => {
      updateModuleDraft('billingFormDraft', {
        pId,
        billDate,
        patientName,
        age,
        sex,
        phone,
        drCode,
        discountType,
        discountPercent,
        discountFlat,
        discountBy,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [pId, billDate, patientName, age, sex, phone, drCode, discountType, discountPercent, discountFlat, discountBy, updateModuleDraft]);

  const filteredDoctors = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(doctorSearchInput.toLowerCase()) ||
      d.code.toLowerCase().includes(doctorSearchInput.toLowerCase()) ||
      d.specialty.toLowerCase().includes(doctorSearchInput.toLowerCase())
  );

  const filteredLabTests = labTests.filter(
    (t) =>
      testSearchQuery.trim() !== '' &&
      (t.name.toLowerCase().includes(testSearchQuery.toLowerCase()) ||
        t.code.toLowerCase().includes(testSearchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(testSearchQuery.toLowerCase()))
  );

  const handleSaveNewDoctor = () => {
    if (!newDocName.trim()) return;
    const added = addDoctor({
      code: newDocCode.trim().toUpperCase(),
      name: newDocName.trim(),
      degree: newDocDegree.trim(),
      specialty: newDocSpecialty.trim(),
      phone: newDocPhone.trim(),
      roomNo: newDocRoom.trim(),
      fee: Number(newDocFee) || 0,
    });
    setDrCode(added.code);
    setShowDoctorModal(false);
    setAlertMsg(
      lang === 'bn'
        ? `ডাক্তার ${added.name} (${added.code}) সফলভাবে যুক্ত হয়েছে!`
        : `Doctor ${added.name} registered!`
    );
  };

  // Keep bill date updated with real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setBillDate((prev) => {
        // Only update if user hasn't typed a completely custom date
        if (!prev || prev.includes(':')) {
          return getTodayDateStr(true);
        }
        return prev;
      });
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchStatus, setSearchStatus] = useState<string>('ALL');
  const [searchMethod, setSearchMethod] = useState<string>('ALL');
  const [searchStartDate, setSearchStartDate] = useState<string>('');
  const [searchEndDate, setSearchEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const matchedDoctor = doctors.find(
    (d) => d.code.toUpperCase() === drCode.toUpperCase()
  );

  const subtotal = items.reduce((acc, it) => acc + it.price, 0);
  const discountAmount =
    discountType === 'percent'
      ? Math.round((subtotal * discountPercent) / 100)
      : Math.min(subtotal, Math.max(0, discountFlat));
  const effectiveDiscountPercent =
    discountType === 'percent'
      ? discountPercent
      : subtotal > 0
      ? Math.round((discountAmount / subtotal) * 100)
      : 0;
  const netTotal = Math.max(0, subtotal - discountAmount);
  const dueAmount = Math.max(0, netTotal - paidAmount);

  const handleAddTest = (testId: string) => {
    const found = labTests.find((t) => t.id === testId);
    if (found && !items.some((i) => i.testId === testId)) {
      const newItems = [
        ...items,
        {
          testId: found.id,
          code: found.code,
          testName: found.name,
          nameBn: (found as any).nameBn,
          category: found.category,
          price: found.price,
          sampleType: (found as any).sampleType,
          departmentId: (found as any).departmentId || 'pathology',
        },
      ];
      setItems(newItems);
      const newSub = newItems.reduce((acc, it) => acc + it.price, 0);
      const newDisc =
        discountType === 'percent'
          ? Math.round((newSub * discountPercent) / 100)
          : Math.min(newSub, discountFlat);
      const newNet = Math.max(0, newSub - newDisc);
      setPaidAmount(newNet);
    }
  };

  const handleAddCustomTest = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customTestName.trim()) {
      setAlertMsg(lang === 'bn' ? 'টেস্টের নাম লিখুন' : 'Enter test name');
      return;
    }
    const price = Number(customTestPrice) || 0;
    const testId = `cust-${Date.now()}`;
    const newItem: InvoiceItem = {
      testId,
      testName: customTestName.trim(),
      category: customTestCategory,
      price,
    };
    const newItems = [...items, newItem];
    setItems(newItems);

    const newSub = newItems.reduce((acc, it) => acc + it.price, 0);
    const newDisc =
      discountType === 'percent'
        ? Math.round((newSub * discountPercent) / 100)
        : Math.min(newSub, discountFlat);
    const newNet = Math.max(0, newSub - newDisc);
    setPaidAmount(newNet);

    if (saveCustomToCatalog) {
      addLabTest({
        code: `CUST${Date.now().toString().slice(-4)}`,
        name: customTestName.trim(),
        category: customTestCategory,
        unit: '',
        normalRange: '',
        price,
      });
    }

    setAlertMsg(
      lang === 'bn'
        ? `"${customTestName.trim()}" (৳${price}) সফলভাবে বিলে যুক্ত হয়েছে!`
        : `Added "${customTestName.trim()}" (৳${price}) to bill!`
    );
    setCustomTestName('');
    setCustomTestPrice('');
    setShowCustomTestModal(false);
  };

  const handleSelectTestToEdit = (tId: string) => {
    const found = labTests.find((t) => t.id === tId);
    if (found) {
      setSelectedTestToEditId(found.id);
      setEditCatalogTestName(found.name);
      setEditCatalogTestPrice(found.price);
      setEditCatalogTestCategory(found.category);
      setEditCatalogTestUnit(found.unit || '');
      setEditCatalogTestNormal(found.normalRange || '');
    }
  };

  const handleUpdateCatalogTest = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTestToEditId || !editCatalogTestName.trim()) {
      setAlertMsg(lang === 'bn' ? 'টেস্ট নির্বাচন ও নাম পূরণ করুন' : 'Select test and enter name');
      return;
    }
    const priceNum = Number(editCatalogTestPrice) || 0;
    updateLabTest(selectedTestToEditId, {
      name: editCatalogTestName.trim(),
      price: priceNum,
      category: editCatalogTestCategory,
      unit: editCatalogTestUnit,
      normalRange: editCatalogTestNormal,
    });

    // Also update any item currently on the active bill matching this testId
    const updatedItems = items.map((it) =>
      it.testId === selectedTestToEditId
        ? { ...it, testName: editCatalogTestName.trim(), price: priceNum, category: editCatalogTestCategory }
        : it
    );
    setItems(updatedItems);
    const newSub = updatedItems.reduce((acc, it) => acc + it.price, 0);
    const newDisc =
      discountType === 'percent'
        ? Math.round((newSub * discountPercent) / 100)
        : Math.min(newSub, discountFlat);
    const newNet = Math.max(0, newSub - newDisc);
    setPaidAmount(newNet);

    setAlertMsg(
      lang === 'bn'
        ? `"${editCatalogTestName.trim()}" এর মূল্য ৳${priceNum} সফলভাবে আপডেট হয়েছে!`
        : `Test "${editCatalogTestName.trim()}" updated to ৳${priceNum}!`
    );
    setShowCustomTestModal(false);
  };

  const handleUpdateItemPrice = (index: number, newPrice: number) => {
    const updatedItems = items.map((it, idx) =>
      idx === index ? { ...it, price: Math.max(0, newPrice) } : it
    );
    setItems(updatedItems);
    const newSub = updatedItems.reduce((acc, it) => acc + it.price, 0);
    const newDisc =
      discountType === 'percent'
        ? Math.round((newSub * discountPercent) / 100)
        : Math.min(newSub, discountFlat);
    const newNet = Math.max(0, newSub - newDisc);
    setPaidAmount(newNet);
  };

  const handleSendWhatsAppInvoice = (inv: Invoice) => {
    const msg = buildInvoiceWhatsAppMessage(inv, clinicConfig);
    const { url, formattedPhone } = getWhatsAppUrl(inv.phone, msg);
    window.open(url, '_blank');
    addNotification(
      'WhatsApp ইনভয়েস পাঠানো হয়েছে',
      `ইনভয়েস #${inv.invoiceNo} গ্রাহকের নম্বরে (${formattedPhone || inv.phone}) পাঠানো হয়েছে।`,
      'success'
    );
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, idx) => idx !== index);
    setItems(newItems);
    const newSub = newItems.reduce((acc, it) => acc + it.price, 0);
    const newDisc =
      discountType === 'percent'
        ? Math.round((newSub * discountPercent) / 100)
        : Math.min(newSub, discountFlat);
    const newNet = Math.max(0, newSub - newDisc);
    setPaidAmount(newNet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!patientName.trim()) {
      setAlertMsg(lang === 'bn' ? 'দয়া করে রোগীর নাম লিখুন।' : 'Please enter patient name.');
      return;
    }
    if (items.length === 0) {
      setAlertMsg(lang === 'bn' ? 'কমপক্ষে একটি পরীক্ষা বা সার্ভিস নির্বাচন করুন।' : 'Please select at least one test or service.');
      return;
    }

    setIsSubmitting(true);
    const invoiceNo = `INV-2026-${1000 + invoices.length + 1}`;
    const status: 'Paid' | 'Partial' | 'Due' =
      dueAmount <= 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Due';

    const savedPid = pId;
    try {
      const res = await addInvoice({
        invoiceNo,
        pId: savedPid,
        patientName: patientName.trim(),
        age: age || '25 Y',
        sex,
        phone,
        drCode,
        drName: matchedDoctor?.name || drCode,
        date: billDate,
        items,
        subtotal,
        discountPercent: effectiveDiscountPercent,
        discountAmount,
        discountBy: discountBy.trim() || undefined,
        netTotal,
        paidAmount,
        dueAmount,
        paymentMethod,
        status,
      });

      if (!res.success || !res.invoice) {
        setAlertMsg(
          res.error ||
            (lang === 'bn'
              ? 'রসিদ ও বিল ডাটাবেজে সংরক্ষণ করা সম্ভব হয়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
              : 'Failed to finalize and save receipt to database. Please try again.')
        );
        setIsSubmitting(false);
        return;
      }

      setSelectedInvoice(res.invoice);
      const pathCount =
        (res as any).pathologyOrdersCount ??
        (res.invoice.items || []).filter((i: any) => i.departmentId === 'pathology').length;
      const syncStatusText =
        pathCount > 0
          ? lang === 'bn'
            ? `✓ Pathology Orders Synced Successfully (${pathCount}টি টেস্ট প্যাথলজিতে পৌঁছেছে)`
            : `✓ Pathology Orders Synced Successfully (${pathCount} tests synced)`
          : '';

      setAlertMsg(
        lang === 'bn'
          ? `✓ Receipt Saved: বিল #${invoiceNo} (ক্যাশ মেমো #${res.invoice.cashMemoNo || ''}, রসিদ #${res.invoice.receiptNo || ''}) স্থায়ী ডাটাবেজে সংরক্ষিত! ${syncStatusText}`
          : `✓ Receipt Saved: Bill #${invoiceNo} (Memo #${res.invoice.cashMemoNo || ''}, Receipt #${res.invoice.receiptNo || ''}) saved to database! ${syncStatusText}`
      );
      setPId(`26100${Math.floor(100 + Math.random() * 900)}`);
      setBillDate(getTodayDateStr(true));
      setPatientName('');
      setAge('');
      setItems([]);
      setDiscountPercent(0);
      setDiscountFlat(0);
      setDiscountBy('');
      setPaidAmount(0);
      updateModuleDraft('billingFormDraft', null);
    } catch (err: any) {
      setAlertMsg(err?.message || 'Error occurred while saving invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const q = searchQuery.trim().toLowerCase();
    const cleanQ = q.replace(/[\s-]/g, '');

    const matchesQuery =
      !q ||
      (inv.invoiceNo && inv.invoiceNo.toLowerCase().includes(q)) ||
      (inv.cashMemoNo && inv.cashMemoNo.toLowerCase().includes(q)) ||
      (inv.receiptNo && inv.receiptNo.toLowerCase().includes(q)) ||
      (inv.pId && inv.pId.toLowerCase().includes(q)) ||
      (inv.patientName && inv.patientName.toLowerCase().includes(q)) ||
      (inv.phone && inv.phone.replace(/[\s-]/g, '').toLowerCase().includes(cleanQ)) ||
      (inv.id && inv.id.toLowerCase().includes(q)) ||
      (inv.payments &&
        inv.payments.some(
          (p) =>
            (p.id && p.id.toLowerCase().includes(q)) ||
            (p.receiptNo && p.receiptNo.toLowerCase().includes(q)) ||
            (p.transactionReference && p.transactionReference.toLowerCase().includes(q))
        ));

    const matchesStatus =
      searchStatus === 'ALL' || inv.status.toLowerCase() === searchStatus.toLowerCase();

    const matchesMethod =
      searchMethod === 'ALL' ||
      (inv.paymentMethod && inv.paymentMethod.toLowerCase() === searchMethod.toLowerCase()) ||
      (inv.payments &&
        inv.payments.some(
          (p) => p.paymentMethod && p.paymentMethod.toLowerCase() === searchMethod.toLowerCase()
        ));

    const matchesDate = (() => {
      if (!searchStartDate && !searchEndDate) return true;
      const invDateStr = inv.date ? inv.date.split(' ')[0] : '';
      if (!invDateStr) return true;
      if (searchStartDate && invDateStr < searchStartDate) return false;
      if (searchEndDate && invDateStr > searchEndDate) return false;
      return true;
    })();

    return matchesQuery && matchesStatus && matchesMethod && matchesDate;
  });

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const currentPageClamped = Math.min(currentPage, totalPages);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPageClamped - 1) * pageSize,
    currentPageClamped * pageSize
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Alert Banner */}
      {alertMsg && (
        <div className="bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex justify-between items-center shadow-md">
          <span>{alertMsg}</span>
          <button onClick={() => setAlertMsg(null)} className="text-white/80 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xs border border-purple-100 dark:border-gray-700">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-purple-950 dark:text-purple-200 flex items-center gap-2">
              <Receipt className="w-6 h-6 text-purple-700" />
              {t.billing}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
              LAN Counter: {currentWorkstation?.terminalCode || 'PC-01'} ({currentWorkstation?.ipAddress || '192.168.1.101'})
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {lang === 'bn'
              ? 'রোগী রেজিস্ট্রেশন, ইউনিক আইডি তৈরি, এবং ক্যাশ মেমো প্রিন্ট। এন্ট্রি হওয়া মাত্রই সেন্ট্রাল ডাটাবেজে ল্যাব, এক্স-রে ও ইমেজিং কিউতে ডাটা সিঙ্ক হয়ে যাবে।'
              : 'Instant billing, itemized investigation receipt, cash memos and real-time LAN broadcast to Pathology, X-Ray, USG and ECG.'}
          </p>
        </div>
      </div>

      {/* Grid: Left Entry Form (7 cols) + Right Invoices List (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-800 p-5 rounded-xl shadow-xs border border-purple-100 dark:border-gray-700 space-y-4">
          <h3 className="font-bold text-sm text-purple-950 dark:text-purple-200 border-b border-gray-100 dark:border-gray-700 pb-2">
            {t.newBill}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Row 1: Patient ID, Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-gray-700 dark:text-gray-300">{t.patientId}:</label>
                  <button
                    type="button"
                    onClick={() => openPatientOverviewModal(pId)}
                    className="text-[10px] text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 font-bold flex items-center gap-1 cursor-pointer"
                    title={lang === 'bn' ? 'রোগীর সম্পূর্ণ ওভারভিউ ও বকেয়া দেখুন' : 'Quick Patient Overview'}
                  >
                    <User className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span>{lang === 'bn' ? 'রোগী ওভারভিউ' : 'Overview'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={pId}
                  onChange={(e) => setPId(e.target.value)}
                  className="w-full bg-purple-50 dark:bg-gray-900 border border-purple-200 dark:border-purple-800 p-2 rounded text-xs font-bold text-purple-950 dark:text-purple-200 focus:outline-none"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-gray-700 dark:text-gray-300">{t.billDate}:</label>
                  <button
                    type="button"
                    onClick={() => setBillDate(getTodayDateStr(true))}
                    className="text-[10px] text-purple-700 dark:text-purple-300 hover:text-purple-900 font-bold flex items-center gap-0.5 cursor-pointer"
                    title={lang === 'bn' ? 'বর্তমান লাইভ সময়ে আপডেট করুন' : 'Refresh to current time'}
                  >
                    <Clock className="w-3 h-3 text-pink-600" />
                    <span>{lang === 'bn' ? 'লাইভ সময়' : 'Live Time'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  placeholder="DD-MM-YYYY HH:MM AM/PM"
                  className="w-full bg-white dark:bg-gray-900 border border-purple-300 dark:border-purple-700 p-2 rounded text-xs font-bold text-purple-950 dark:text-purple-100 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>
            </div>

            {/* Row 2: Name, Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">{t.ptName} *:</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder={lang === 'bn' ? 'যেমন: রোগীর নাম (Ex: Patient Name)' : 'Ex: Patient Name'}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded text-xs font-semibold focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Phone:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Row 3: Age, Sex, Dr Code with Doctor Searchbar and Add Doctor Button */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
              <div className="sm:col-span-3">
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">{t.age}:</label>
                <input
                  type="text"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Ex: 24 Y"
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded text-xs focus:outline-none"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">{t.sex}:</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as any)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded text-xs focus:outline-none cursor-pointer"
                >
                  <option value="Female">{t.female}</option>
                  <option value="Male">{t.male}</option>
                  <option value="Other">{t.other}</option>
                </select>
              </div>
              <div className="sm:col-span-6 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-gray-700 dark:text-gray-300">{t.drCode}:</label>
                  {/* Side button to add new doctor */}
                  <button
                    type="button"
                    onClick={() => {
                      setNewDocCode(`DR0${doctors.length + 1}`);
                      setNewDocName('');
                      setShowDoctorModal(true);
                    }}
                    className="px-2 py-0.5 bg-purple-700 hover:bg-purple-800 text-white rounded font-bold text-[10px] flex items-center gap-1 shadow-2xs transition cursor-pointer active:scale-95"
                    title={lang === 'bn' ? 'নতুন ডাক্তার অ্যাড করুন' : 'Add New Doctor'}
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>{lang === 'bn' ? '+ ডাক্তার অ্যাড' : '+ Add Doctor'}</span>
                  </button>
                </div>

                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={drCode}
                    onChange={(e) => setDrCode(e.target.value.toUpperCase())}
                    placeholder="DR01"
                    className="w-24 bg-purple-50 dark:bg-gray-900 border-2 border-purple-300 dark:border-purple-800 p-2 rounded text-xs font-black text-purple-950 dark:text-purple-200 focus:outline-none uppercase text-center tracking-wider"
                  />
                  {/* Doctor Search & Auto-complete input */}
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={doctorSearchInput}
                      onChange={(e) => {
                        setDoctorSearchInput(e.target.value);
                        setShowDoctorDropdown(true);
                      }}
                      onFocus={() => setShowDoctorDropdown(true)}
                      placeholder={lang === 'bn' ? 'ডাক্তারের নাম দিয়ে সার্চ করুন...' : 'Search doctor name...'}
                      className="w-full pl-8 pr-2 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:border-purple-600"
                    />

                    {/* Autocomplete / Filtered dropdown */}
                    {showDoctorDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded-lg shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredDoctors.length === 0 ? (
                          <div className="p-2.5 text-xs text-gray-400 text-center">
                            {lang === 'bn' ? 'কোনো ডাক্তার পাওয়া যায়নি' : 'No doctor found'}
                          </div>
                        ) : (
                          filteredDoctors.map((doc) => (
                            <div
                              key={doc.id}
                              onClick={() => {
                                setDrCode(doc.code);
                                setDoctorSearchInput('');
                                setShowDoctorDropdown(false);
                              }}
                              className={`p-2 hover:bg-purple-50 dark:hover:bg-gray-750 cursor-pointer flex justify-between items-center text-xs ${
                                doc.code.toUpperCase() === drCode.toUpperCase()
                                  ? 'bg-purple-100 dark:bg-purple-950/60 font-bold'
                                  : ''
                              }`}
                            >
                              <div>
                                <span className="font-bold text-purple-950 dark:text-purple-200">{doc.name}</span>
                                <span className="text-[10px] text-gray-500 ml-1.5">({doc.specialty})</span>
                              </div>
                              <span className="font-mono text-[10px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-200 rounded font-bold">
                                {doc.code}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Searchbar result: Shows which doctor's code is entered */}
                <div className="p-2 rounded-lg border text-xs transition bg-purple-50/80 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
                  {matchedDoctor ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <div className="truncate">
                          <span className="font-bold text-purple-950 dark:text-purple-100">{matchedDoctor.name}</span>
                          <span className="text-[11px] text-purple-700 dark:text-purple-400 font-medium ml-1">
                            · {matchedDoctor.degree} ({matchedDoctor.specialty})
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-[10px] bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 px-2 py-0.5 rounded shrink-0">
                        কোড: {matchedDoctor.code}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {lang === 'bn'
                          ? `কোড "${drCode}" এর কোনো ডাক্তার তালিকায় নেই। পাশের "+ ডাক্তার অ্যাড" বাটনে ক্লিক করে যুক্ত করুন।`
                          : `No doctor registered for code "${drCode}". Click "+ Add Doctor" to add.`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Test Selector & Search bar with Add Test Button */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-gray-700 dark:text-gray-300 text-xs">
                  {lang === 'bn' ? 'টেস্ট / সেবা নির্বাচন করুন:' : 'Select Investigations / Services:'}
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomTestTab('add');
                      setCustomTestName('');
                      setCustomTestPrice('');
                      setShowCustomTestModal(true);
                    }}
                    className="px-2.5 py-1 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-md text-xs font-black flex items-center gap-1 shadow-2xs transition cursor-pointer active:scale-95"
                    title={lang === 'bn' ? 'নতুন টেস্টের নাম ও ফি (টাকা) অ্যাড করুন' : 'Add custom test & price'}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? '+ টেস্ট ও টাকা Add' : '+ Add Test & Fee'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomTestTab('edit');
                      if (labTests.length > 0) {
                        handleSelectTestToEdit(labTests[0].id);
                      }
                      setShowCustomTestModal(true);
                    }}
                    className="px-2 py-1 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/60 dark:hover:bg-purple-800 text-purple-900 dark:text-purple-200 rounded-md text-xs font-bold flex items-center gap-1 transition cursor-pointer border border-purple-300 dark:border-purple-700 active:scale-95"
                    title={lang === 'bn' ? 'টেস্টের নাম ও মূল্য এডিট বা পরিবর্তন করুন' : 'Edit test name & price'}
                  >
                    <Edit3 className="w-3.5 h-3.5 text-purple-700 dark:text-purple-300" />
                    <span>{lang === 'bn' ? 'টেস্ট/মূল্য Edit' : 'Edit Fee'}</span>
                  </button>
                </div>
              </div>

              {/* Instant Search Box with Autocomplete Dropdown */}
              <div className="relative">
                <div className="relative">
                  <Search className="w-4 h-4 text-purple-600 dark:text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={testSearchQuery}
                    onChange={(e) => {
                      setTestSearchQuery(e.target.value);
                      setShowTestDropdown(true);
                    }}
                    onFocus={() => {
                      if (testSearchQuery.trim()) setShowTestDropdown(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (filteredLabTests.length > 0) {
                          handleAddTest(filteredLabTests[0].id);
                          setTestSearchQuery('');
                          setShowTestDropdown(false);
                        }
                      } else if (e.key === 'Escape') {
                        setShowTestDropdown(false);
                      }
                    }}
                    placeholder={
                      lang === 'bn'
                        ? 'টেস্টের নাম লিখে সার্চ করুন (যেমন: CBC, Urine, RBS, Lipid, Creatinine, X-Ray, USG)...'
                        : 'Type test name (e.g. CBC, Urine, RBS, Lipid, Creatinine, X-Ray)...'
                    }
                    className="w-full pl-9 pr-10 py-2 bg-white dark:bg-gray-900 border-2 border-purple-300 dark:border-purple-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 shadow-2xs"
                  />
                  {testSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setTestSearchQuery('');
                        setShowTestDropdown(false);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs px-1.5 py-0.5 rounded cursor-pointer font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Instant Search Autocomplete Dropdown */}
                {showTestDropdown && testSearchQuery.trim() !== '' && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border-2 border-purple-400 dark:border-purple-700 rounded-xl shadow-2xl z-40 max-h-56 overflow-y-auto divide-y divide-purple-100 dark:divide-gray-700">
                    {filteredLabTests.length === 0 ? (
                      <div className="p-3 text-xs text-gray-500 text-center flex flex-col items-center gap-1.5">
                        <span>{lang === 'bn' ? `"${testSearchQuery}" নামে কোনো টেস্ট পাওয়া যায়নি` : `No test found for "${testSearchQuery}"`}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomTestName(testSearchQuery);
                            setShowTestDropdown(false);
                            setShowCustomTestModal(true);
                          }}
                          className="px-2.5 py-1 bg-purple-700 text-white rounded text-xs font-bold hover:bg-purple-800 transition cursor-pointer"
                        >
                          + {lang === 'bn' ? `"${testSearchQuery}" টেস্টটি নতুনভাবে যুক্ত করুন` : `Add "${testSearchQuery}" as new test`}
                        </button>
                      </div>
                    ) : (
                      filteredLabTests.map((t) => {
                        const isAlreadyAdded = items.some((i) => i.testId === t.id);
                        return (
                          <div
                            key={t.id}
                            onClick={() => {
                              handleAddTest(t.id);
                              setTestSearchQuery('');
                              setShowTestDropdown(false);
                            }}
                            className={`p-2.5 hover:bg-purple-50 dark:hover:bg-gray-700 flex items-center justify-between cursor-pointer transition text-xs ${
                              isAlreadyAdded ? 'bg-purple-50/70 dark:bg-purple-950/40 opacity-70' : ''
                            }`}
                          >
                            <div>
                              <span className="font-bold text-slate-900 dark:text-slate-100">{t.name}</span>
                              <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 rounded font-semibold">
                                {t.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-purple-950 dark:text-purple-200">
                                ৳{t.price}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-700 text-white hover:bg-purple-800">
                                {isAlreadyAdded ? '✓ যোগ আছে' : '+ যোগ করুন'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Secondary Select Dropdown from Catalog */}
              <div>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddTest(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full bg-white dark:bg-gray-900 border border-purple-300 dark:border-purple-700 p-2 rounded-lg text-xs font-medium focus:outline-none"
                >
                  <option value="">{lang === 'bn' ? '-- বা তালিকা থেকে টেস্ট বাছাই করুন --' : '-- Or pick from full catalog list --'}</option>
                  {labTests.map((lt) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name} — ৳{lt.price} ({lt.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Investigations Table */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-purple-50 dark:bg-gray-900 text-purple-950 dark:text-purple-200 font-bold border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="p-2 border-r border-gray-200 dark:border-gray-700">Investigation</th>
                    <th className="p-2 border-r border-gray-200 dark:border-gray-700">Dept</th>
                    <th className="p-2 border-r border-gray-200 dark:border-gray-700 text-right">Fee (৳)</th>
                    <th className="p-2 text-center w-10">✕</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-750">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-gray-400 italic">
                        No tests selected. Choose from dropdown above.
                      </td>
                    </tr>
                  ) : (
                    items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-purple-50/50 dark:hover:bg-gray-750">
                        <td className="p-2 font-medium border-r border-gray-100 dark:border-gray-700">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{it.testName}</span>
                        </td>
                        <td className="p-2 text-gray-500 border-r border-gray-100 dark:border-gray-700">
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-medium">
                            {it.category}
                          </span>
                        </td>
                        <td className="p-2 text-right border-r border-gray-100 dark:border-gray-700">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-gray-400 font-bold text-xs">৳</span>
                            <input
                              type="number"
                              min="0"
                              value={it.price}
                              onChange={(e) => handleUpdateItemPrice(idx, Number(e.target.value) || 0)}
                              className="w-16 text-right font-mono font-bold p-1 bg-white dark:bg-gray-900 border border-purple-300 dark:border-purple-700 rounded text-xs focus:ring-1 focus:ring-purple-600 focus:outline-none"
                              title={lang === 'bn' ? 'ফি সরাসরি এডিট করুন' : 'Edit fee directly'}
                            />
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-500 hover:text-red-700 cursor-pointer p-1"
                            title={lang === 'bn' ? 'মুছে ফেলুন' : 'Remove'}
                          >
                            <Trash2 className="w-3.5 h-3.5 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Calculation */}
            <div className="bg-purple-50/60 dark:bg-gray-900/40 p-3 rounded-lg border border-purple-100 dark:border-gray-700 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-gray-600 dark:text-gray-400">{t.subtotal}:</span>
                <span className="font-bold text-sm">৳{subtotal}</span>
              </div>
              <div className="flex justify-between items-center text-xs flex-wrap gap-2 py-1 border-y border-purple-150 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-700 dark:text-gray-300">{t.discount}:</span>
                  {/* Mode Selector Toggle: ৳ টাকা (লেস) vs % পার্সেন্ট */}
                  <div className="flex rounded-md border border-purple-300 dark:border-purple-700 p-0.5 bg-purple-50 dark:bg-gray-800 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType('flat');
                        setDiscountFlat(discountAmount);
                      }}
                      className={`px-2 py-0.5 rounded cursor-pointer transition ${
                        discountType === 'flat'
                          ? 'bg-purple-900 text-white shadow-2xs'
                          : 'text-purple-900 dark:text-purple-300 hover:bg-purple-200/50'
                      }`}
                      title={lang === 'bn' ? 'টাকায় সরাসরি ডিসকাউন্ট / লেস' : 'Direct fixed Taka discount'}
                    >
                      ৳ টাকা (লেস)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType('percent');
                        const pVal = subtotal > 0 ? Math.round((discountAmount / subtotal) * 100) : 0;
                        setDiscountPercent(pVal);
                      }}
                      className={`px-2 py-0.5 rounded cursor-pointer transition ${
                        discountType === 'percent'
                          ? 'bg-purple-900 text-white shadow-2xs'
                          : 'text-purple-900 dark:text-purple-300 hover:bg-purple-200/50'
                      }`}
                      title={lang === 'bn' ? 'শতকরা (%) হারে ডিসকাউন্ট' : 'Percentage discount'}
                    >
                      % পার্সেন্ট
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {discountType === 'flat' ? (
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-slate-700 dark:text-slate-300">৳</span>
                      <input
                        type="number"
                        min="0"
                        max={subtotal}
                        value={discountFlat === 0 ? '' : discountFlat}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          const capped = Math.min(subtotal, val);
                          setDiscountFlat(capped);
                          const n = Math.max(0, subtotal - capped);
                          setPaidAmount(n);
                        }}
                        placeholder="0"
                        className="w-20 bg-white dark:bg-gray-800 border-2 border-purple-400 dark:border-purple-600 p-1 text-right rounded font-bold text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-purple-600 focus:outline-none"
                      />
                      <span className="font-bold text-emerald-700 text-xs">
                        -৳{discountAmount} {subtotal > 0 && `(${effectiveDiscountPercent}%)`}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discountPercent === 0 ? '' : discountPercent}
                        onChange={(e) => {
                          const disc = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                          setDiscountPercent(disc);
                          const n = Math.max(0, subtotal - Math.round((subtotal * disc) / 100));
                          setPaidAmount(n);
                        }}
                        placeholder="0"
                        className="w-16 bg-white dark:bg-gray-800 border-2 border-purple-400 dark:border-purple-600 p-1 text-right rounded font-bold text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-purple-600 focus:outline-none"
                      />
                      <span className="font-bold text-slate-700 dark:text-slate-300">%</span>
                      <span className="font-bold text-emerald-700 text-xs">-৳{discountAmount}</span>
                    </div>
                  )}

                  {/* Discount By (কে ডিসকাউন্ট দিয়েছেন তার নাম) */}
                  <input
                    type="text"
                    value={discountBy}
                    onChange={(e) => setDiscountBy(e.target.value)}
                    placeholder={lang === 'bn' ? 'ডিসকাউন্ট প্রদানকারীর নাম...' : 'Discount by (Name)...'}
                    title={lang === 'bn' ? 'কে ডিসকাউন্ট দিয়েছেন তার নাম লিখুন' : 'Enter name of person authorizing discount'}
                    className="w-44 sm:w-48 bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-600 p-1 px-2 rounded font-semibold text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-purple-600 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center text-sm font-bold border-t border-purple-200 dark:border-gray-700 pt-2 text-purple-950 dark:text-purple-200">
                <span>{t.netTotal}:</span>
                <span>৳{netTotal}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-0.5">{t.paidAmount}:</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full bg-white dark:bg-gray-800 border border-emerald-400 dark:border-emerald-700 p-1.5 rounded font-bold text-emerald-800 dark:text-emerald-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-0.5">{t.dueAmount}:</label>
                  <div className={`p-1.5 rounded font-black text-sm ${dueAmount > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    ৳{dueAmount}
                  </div>
                </div>
              </div>
              <div className="pt-1">
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-0.5">{t.paymentMethod}:</label>
                <div className="flex gap-2">
                  {['Cash', 'bKash', 'Nagad', 'Card'].map((pm) => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setPaymentMethod(pm)}
                      className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer border ${
                        paymentMethod === pm
                          ? 'bg-purple-900 text-white border-purple-900'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
                      }`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Create & Print Invoice Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 bg-gradient-to-r from-purple-800 via-indigo-900 to-purple-900 hover:from-purple-900 hover:via-indigo-950 hover:to-purple-950 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition active:scale-98 border border-purple-500/30 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              title={lang === 'bn' ? 'ইনভয়েস তৈরি করুন এবং স্বয়ংক্রিয়ভাবে A4 ডাবল-কপি প্রিন্ট ভিউ খুলুন' : 'Create Invoice and Open Dual A4 Cash Memo'}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{lang === 'bn' ? 'ডাটাবেজে স্থায়ীভাবে সংরক্ষণ হচ্ছে...' : 'Saving Permanently to Database...'}</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4 text-pink-300" />
                  <span>{lang === 'bn' ? 'ইনভয়েস তৈরি ও প্রিন্ট (A4 ডাবল কপি)' : 'Create & Print Invoice (A4 Dual Slip)'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Invoices Archive & Print Audit Log */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-800 p-5 rounded-xl shadow-xs border border-purple-100 dark:border-gray-700 flex flex-col justify-between">
          <div>
            {/* Top Sub-tabs Switcher */}
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2 mb-3">
              <button
                type="button"
                onClick={() => setRightTab('invoices')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  rightTab === 'invoices'
                    ? 'bg-purple-900 text-white shadow-xs'
                    : 'bg-purple-50 dark:bg-gray-900 text-purple-900 dark:text-purple-300 hover:bg-purple-100'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'রশিদ তালিকা' : 'Invoices'}</span>
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                  {invoices.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRightTab('printLogs')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  rightTab === 'printLogs'
                    ? 'bg-purple-900 text-white shadow-xs'
                    : 'bg-purple-50 dark:bg-gray-900 text-purple-900 dark:text-purple-300 hover:bg-purple-100'
                }`}
              >
                <History className="w-3.5 h-3.5 text-pink-400" />
                <span>{lang === 'bn' ? 'প্রিন্ট অডিট লগ' : 'Print Log'}</span>
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-pink-500/20 text-pink-200">
                  {printLogs.length}
                </span>
              </button>
            </div>

            {/* TAB 1: Invoices List */}
            {rightTab === 'invoices' && (
              <div className="space-y-3">
                {/* Search Bar with Multi-field support */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-purple-600 dark:text-purple-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder={
                      lang === 'bn'
                        ? 'রসিদ নং (RCP-), মেমো (CM-), বিল (INV-), আইডি, নাম, ফোন বা পেমেন্ট আইডি...'
                        : 'Receipt No, Memo, Bill No, Patient ID, Name, Phone, Txn ID...'
                    }
                    className="w-full pl-9 pr-8 py-2 bg-purple-50/50 dark:bg-gray-900 border-2 border-purple-200 dark:border-purple-800 rounded-lg text-xs font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setCurrentPage(1);
                      }}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter Controls: Status, Payment Method & Date Range */}
                <div className="bg-gray-50 dark:bg-gray-900/60 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2 text-xs">
                  {/* Status Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-gray-500 mr-1">{lang === 'bn' ? 'স্ট্যাটাস:' : 'Status:'}</span>
                    {['ALL', 'Paid', 'Partial', 'Due'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setSearchStatus(st);
                          setCurrentPage(1);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                          searchStatus === st
                            ? 'bg-purple-900 text-white shadow-xs'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {st === 'ALL' ? (lang === 'bn' ? 'সকল' : 'All') : st}
                      </button>
                    ))}

                    <span className="text-[11px] font-bold text-gray-500 ml-2 mr-1">{lang === 'bn' ? 'পেমেন্ট:' : 'Method:'}</span>
                    <select
                      value={searchMethod}
                      onChange={(e) => {
                        setSearchMethod(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 text-[11px] font-semibold text-gray-700 dark:text-gray-300"
                    >
                      <option value="ALL">{lang === 'bn' ? 'সকল মাধ্যম' : 'All Methods'}</option>
                      <option value="Cash">Cash</option>
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>

                  {/* Date Range Filters */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-200 dark:border-gray-700/60 text-[11px]">
                    <span className="font-bold text-gray-500">{lang === 'bn' ? 'তারিখ:' : 'Date:'}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">{lang === 'bn' ? 'হতে' : 'From'}</span>
                      <input
                        type="date"
                        value={searchStartDate}
                        onChange={(e) => {
                          setSearchStartDate(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 text-[11px]"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">{lang === 'bn' ? 'পর্যন্ত' : 'To'}</span>
                      <input
                        type="date"
                        value={searchEndDate}
                        onChange={(e) => {
                          setSearchEndDate(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 text-[11px]"
                      />
                    </div>
                    {(searchStartDate || searchEndDate || searchStatus !== 'ALL' || searchMethod !== 'ALL' || searchQuery) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSearchStatus('ALL');
                          setSearchMethod('ALL');
                          setSearchStartDate('');
                          setSearchEndDate('');
                          setCurrentPage(1);
                        }}
                        className="text-[10px] text-purple-700 dark:text-purple-300 hover:underline font-bold ml-auto cursor-pointer"
                      >
                        {lang === 'bn' ? 'রিসেট' : 'Reset'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Results Count Header */}
                <div className="flex justify-between items-center text-[11px] text-gray-500 px-1">
                  <span>
                    {lang === 'bn'
                      ? `মোট ${filteredInvoices.length}টি রেকর্ড পাওয়া গেছে`
                      : `Found ${filteredInvoices.length} receipt/invoice records`}
                  </span>
                  {totalPages > 1 && (
                    <span>
                      {lang === 'bn' ? `পৃষ্ঠা ${currentPageClamped} / ${totalPages}` : `Page ${currentPageClamped} of ${totalPages}`}
                    </span>
                  )}
                </div>

                {/* Invoices & Receipts List */}
                <div className="space-y-2.5 max-h-[480px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredInvoices.length === 0 ? (
                    <div className="py-10 text-center text-gray-400 text-xs space-y-1">
                      <AlertCircle className="w-8 h-8 mx-auto text-gray-300" />
                      <p className="font-bold">{lang === 'bn' ? 'কোনো রসিদ বা ইনভয়েস পাওয়া যায়নি' : 'No receipts or invoices found'}</p>
                      <p className="text-[11px] text-gray-400">
                        {lang === 'bn'
                          ? 'রসিদ নং, মেমো নং, বিল নং, পেশেন্ট আইডি বা মোবাইল নম্বর যাচাই করুন।'
                          : 'Try checking Receipt No, Cash Memo No, Bill No, Patient ID or Mobile.'}
                      </p>
                    </div>
                  ) : (
                    paginatedInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="pt-2.5 hover:bg-purple-50/60 dark:hover:bg-gray-750 p-2.5 rounded-lg transition border border-transparent hover:border-purple-200 dark:hover:border-purple-800"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-mono font-black text-purple-950 dark:text-purple-200 text-xs">
                                #{inv.invoiceNo}
                              </span>
                              {inv.cashMemoNo && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-bold border border-purple-200 dark:border-purple-800">
                                  Memo: {inv.cashMemoNo}
                                </span>
                              )}
                              {inv.receiptNo && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                                  RCP: {inv.receiptNo}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => openPatientOverviewModal(inv.pId)}
                              className="font-bold text-gray-900 dark:text-gray-100 text-sm hover:text-purple-700 dark:hover:text-purple-400 text-left cursor-pointer flex items-center gap-1 group"
                              title={lang === 'bn' ? 'রোগীর ওভারভিউ দেখুন' : 'View Patient Overview'}
                            >
                              <span>{inv.patientName}</span>
                              <ExternalLink className="w-3 h-3 text-purple-600 opacity-60 group-hover:opacity-100 transition" />
                            </button>

                            <p className="text-[11px] text-gray-500 flex flex-wrap items-center gap-2">
                              <span>PID: <strong className="text-gray-700 dark:text-gray-300">{inv.pId}</strong></span>
                              <span>·</span>
                              <span>{inv.date}</span>
                              <span>·</span>
                              <span>Ref: {inv.drCode}</span>
                              {inv.phone && (
                                <>
                                  <span>·</span>
                                  <span className="font-mono text-gray-600 dark:text-gray-300">{inv.phone}</span>
                                </>
                              )}
                            </p>

                            {/* Linked Payment Transactions if any */}
                            {Array.isArray(inv.payments) && inv.payments.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                <span className="text-[10px] text-gray-400 font-semibold">{lang === 'bn' ? 'পেমেন্ট ট্রানজেকশন:' : 'Txns:'}</span>
                                {inv.payments.map((p) => (
                                  <span
                                    key={p.id}
                                    className="text-[9px] px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-mono"
                                    title={`Paid: ৳${p.amount} via ${p.paymentMethod} (${p.timestamp})`}
                                  >
                                    {p.receiptNo || p.id} (৳{p.amount})
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                inv.status === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : inv.status === 'Partial'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-red-100 text-red-800 border border-red-300'
                              }`}
                            >
                              {inv.status}
                            </span>
                            <p className="font-black text-sm text-gray-900 dark:text-gray-100 mt-1">
                              ৳{inv.netTotal}
                            </p>
                            {inv.paidAmount > 0 && (
                              <p className="text-[10px] font-bold text-emerald-700">
                                Paid: ৳{inv.paidAmount} ({inv.paymentMethod || 'Cash'})
                              </p>
                            )}
                            {inv.dueAmount > 0 && (
                              <p className="text-[10px] font-black text-red-600">
                                Due: ৳{inv.dueAmount}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="mt-2.5 flex justify-between items-center pt-1.5 border-t border-gray-100 dark:border-gray-700 text-xs">
                          <span className="text-gray-500 text-[11px]">{inv.items.length} items</span>
                          <div className="flex items-center gap-2">
                            {/* Patient Overview Button */}
                            <button
                              type="button"
                              onClick={() => openPatientOverviewModal(inv.pId)}
                              className="px-2 py-0.5 rounded text-[11px] font-bold text-indigo-700 hover:text-indigo-900 dark:text-indigo-300 flex items-center gap-1 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition cursor-pointer"
                              title={lang === 'bn' ? 'রোগী প্রোফাইল ও ওভারভিউ দেখুন' : 'Quick Patient Overview'}
                            >
                              <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              <span>{lang === 'bn' ? 'ওভারভিউ' : 'Overview'}</span>
                            </button>

                            {/* WhatsApp Send Button */}
                            <button
                              type="button"
                              onClick={() => handleSendWhatsAppInvoice(inv)}
                              className="px-2 py-0.5 rounded text-[11px] font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 flex items-center gap-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                              title={lang === 'bn' ? 'রোগীর নম্বরে হোয়াটসঅ্যাপ মেসেজ পাঠান' : 'Send invoice via WhatsApp'}
                            >
                              <svg className="w-3.5 h-3.5 fill-[#25D366]" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                              </svg>
                              <span>WhatsApp</span>
                            </button>

                            {/* Print Cash Memo Button */}
                            <button
                              type="button"
                              onClick={() => setSelectedInvoice(inv)}
                              className="flex items-center gap-1 text-purple-700 dark:text-purple-300 font-bold hover:underline cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>{lang === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
                            </button>

                            {/* Admin-Only Delete Invoice Button */}
                            {isAdminUser && (
                              <button
                                type="button"
                                onClick={() => deleteInvoice(inv.id)}
                                className="p-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                                title={lang === 'bn' ? 'ইনভয়েস মুছে ফেলুন (শুধুমাত্র অ্যাডমিন)' : 'Delete Invoice (Admin Only)'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700 text-xs">
                    <button
                      type="button"
                      disabled={currentPageClamped <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-2.5 py-1 rounded bg-gray-100 dark:bg-gray-750 text-gray-700 dark:text-gray-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 cursor-pointer"
                    >
                      {lang === 'bn' ? 'পূর্ববর্তী' : 'Previous'}
                    </button>
                    <span className="font-bold text-gray-600 dark:text-gray-400">
                      {currentPageClamped} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPageClamped >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="px-2.5 py-1 rounded bg-gray-100 dark:bg-gray-750 text-gray-700 dark:text-gray-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 cursor-pointer"
                    >
                      {lang === 'bn' ? 'পরবর্তী' : 'Next'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Printed Invoices Audit Log */}
            {rightTab === 'printLogs' && (
              <div>
                <div className="relative mb-3">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={printLogSearch}
                    onChange={(e) => setPrintLogSearch(e.target.value)}
                    placeholder={lang === 'bn' ? 'ইনভয়েস নং, রোগী বা অপারেটর দিয়ে খুঁজুন...' : 'Search print logs...'}
                    className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-2 max-h-[520px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                  {printLogs
                    .filter(
                      (l) =>
                        l.invoiceNo.toLowerCase().includes(printLogSearch.toLowerCase()) ||
                        l.patientName.toLowerCase().includes(printLogSearch.toLowerCase()) ||
                        l.pId.toLowerCase().includes(printLogSearch.toLowerCase()) ||
                        (l.printedByUserName && l.printedByUserName.toLowerCase().includes(printLogSearch.toLowerCase()))
                    )
                    .map((log) => {
                      const matchedInv = invoices.find((i) => i.invoiceNo === log.invoiceNo);
                      return (
                        <div key={log.id} className="pt-2 hover:bg-purple-50/50 dark:hover:bg-gray-750 p-2.5 rounded-lg transition text-xs">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-purple-950 dark:text-purple-300">
                                  #{log.invoiceNo}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-semibold">
                                  {log.copies || 2} Copies
                                </span>
                              </div>
                              <p className="font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                                {log.patientName} (PID: {log.pId})
                              </p>
                              <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                                🕒 প্রিন্ট সময়: {log.printedAt}
                              </p>
                            </div>

                            <div className="text-right">
                              <span className="font-mono font-black text-slate-900 dark:text-slate-100 text-sm">
                                ৳{log.totalAmount}
                              </span>
                              <span className="block text-[10px] text-gray-400">
                                টার্মিনাল: {log.workstationCode || 'PC-01'}
                              </span>
                            </div>
                          </div>

                          <div className="mt-2 pt-1 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-[11px]">
                            <div className="text-gray-500">
                              অপারেটর: <strong className="text-slate-700 dark:text-slate-300">{log.printedByUserName}</strong>
                            </div>

                            <div className="flex items-center gap-2">
                              {matchedInv && (
                                <button
                                  type="button"
                                  onClick={() => handleSendWhatsAppInvoice(matchedInv)}
                                  className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                                  title="WhatsApp"
                                >
                                  <svg className="w-3 h-3 fill-[#25D366]" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                  </svg>
                                  <span>WA</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  if (matchedInv) {
                                    setSelectedInvoice(matchedInv);
                                  } else {
                                    // Construct temporary invoice for viewing
                                    setSelectedInvoice({
                                      id: log.invoiceId,
                                      invoiceNo: log.invoiceNo,
                                      pId: log.pId,
                                      patientName: log.patientName,
                                      age: 'N/A',
                                      sex: 'Female',
                                      phone: '',
                                      drCode: 'DR01',
                                      drName: 'Medical Officer',
                                      date: log.printedAt,
                                      items: [{ testId: 't-1', testName: 'Investigation Service', category: 'Clinical', price: log.totalAmount }],
                                      subtotal: log.totalAmount,
                                      discountPercent: 0,
                                      discountAmount: 0,
                                      netTotal: log.totalAmount,
                                      paidAmount: log.paidAmount,
                                      dueAmount: log.dueAmount,
                                      paymentMethod: 'Cash',
                                      status: log.dueAmount <= 0 ? 'Paid' : 'Due',
                                    });
                                  }
                                }}
                                className="text-purple-700 hover:text-purple-900 dark:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>পুনরায় প্রিন্ট</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cash Memo Modal */}
      {selectedInvoice && (
        <CashMemoModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}

      {/* Add New Doctor Modal */}
      {showDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-5 border border-purple-300 dark:border-purple-800 text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-700" />
                <span>{lang === 'bn' ? 'নতুন ডাক্তারের তথ্য যুক্ত করুন' : 'Register New Doctor'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowDoctorModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-0.5">
                    {lang === 'bn' ? 'ডাক্তার কোড:' : 'Doctor Code:'}
                  </label>
                  <input
                    type="text"
                    value={newDocCode}
                    onChange={(e) => setNewDocCode(e.target.value.toUpperCase())}
                    className="w-full bg-purple-50 dark:bg-gray-900 border border-purple-300 dark:border-purple-700 p-2 rounded font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-0.5">
                    {lang === 'bn' ? 'ভিজিট ফি (৳):' : 'Consultation Fee:'}
                  </label>
                  <input
                    type="number"
                    value={newDocFee}
                    onChange={(e) => setNewDocFee(Number(e.target.value))}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-0.5">
                  {lang === 'bn' ? 'ডাক্তারের নাম *:' : 'Doctor Name *:'}
                </label>
                <input
                  type="text"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="e.g. Prof. Dr. Kamal Ahmed"
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded font-bold"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-0.5">
                    {lang === 'bn' ? 'ডিগ্রী / শিক্ষাগত যোগ্যতা:' : 'Degree / Qualification:'}
                  </label>
                  <input
                    type="text"
                    value={newDocDegree}
                    onChange={(e) => setNewDocDegree(e.target.value)}
                    placeholder="MBBS, FCPS"
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-0.5">
                    {lang === 'bn' ? 'স্পেশালিটি / বিভাগ:' : 'Specialty:'}
                  </label>
                  <input
                    type="text"
                    value={newDocSpecialty}
                    onChange={(e) => setNewDocSpecialty(e.target.value)}
                    placeholder="Medicine Specialist"
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-0.5">
                    {lang === 'bn' ? 'মোবাইল নম্বর:' : 'Phone:'}
                  </label>
                  <input
                    type="text"
                    value={newDocPhone}
                    onChange={(e) => setNewDocPhone(e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-0.5">
                    {lang === 'bn' ? 'রুম নম্বর:' : 'Room No:'}
                  </label>
                  <input
                    type="text"
                    value={newDocRoom}
                    onChange={(e) => setNewDocRoom(e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowDoctorModal(false)}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 rounded font-semibold cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleSaveNewDoctor}
                className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded font-bold cursor-pointer transition shadow-sm active:scale-95"
              >
                {lang === 'bn' ? 'ডাক্তার সংরক্ষণ করুন' : 'Save Doctor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Test & Fee Add/Edit Modal */}
      {showCustomTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-5 sm:p-6 border-2 border-purple-400 dark:border-purple-700 text-xs space-y-4 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-purple-950 dark:text-purple-100">
                    {lang === 'bn' ? 'টেস্টের নাম ও মূল্য (টাকা) অ্যাড বা এডিট' : 'Test Name & Fee (Price) Manager'}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {lang === 'bn' ? 'নতুন টেস্ট তৈরি করুন অথবা বিদ্যমান টেস্টের ফি পরিবর্তন করুন' : 'Add custom test to bill or update catalog rates'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomTestModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Sub-Tabs: Add vs Edit */}
            <div className="flex rounded-xl p-1 bg-purple-50 dark:bg-gray-900 border border-purple-200 dark:border-purple-800 font-bold text-xs">
              <button
                type="button"
                onClick={() => setCustomTestTab('add')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  customTestTab === 'add'
                    ? 'bg-purple-800 text-white shadow-xs'
                    : 'text-purple-900 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-gray-800'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? '১. নতুন টেস্ট ও টাকা Add' : '1. Add New Test & Fee'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomTestTab('edit');
                  if (!selectedTestToEditId && labTests.length > 0) {
                    handleSelectTestToEdit(labTests[0].id);
                  }
                }}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  customTestTab === 'edit'
                    ? 'bg-purple-800 text-white shadow-xs'
                    : 'text-purple-900 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-gray-800'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? '২. টেস্টের নাম ও মূল্য এডিট' : '2. Edit Test & Price'}</span>
              </button>
            </div>

            {/* TAB 1: ADD NEW TEST & FEE */}
            {customTestTab === 'add' && (
              <form onSubmit={handleAddCustomTest} className="space-y-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    {lang === 'bn' ? 'টেস্টের নাম *:' : 'Test Name *:'}
                  </label>
                  <input
                    type="text"
                    value={customTestName}
                    onChange={(e) => setCustomTestName(e.target.value)}
                    placeholder="e.g. Serum Electrolytes (Na+, K+, Cl-)"
                    className="w-full bg-white dark:bg-gray-900 border-2 border-purple-300 dark:border-purple-700 p-2.5 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600 text-xs"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {lang === 'bn' ? 'টেস্টের ফি / মূল্য (টাকা ৳) *:' : 'Test Price / Fee (BDT) *:'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
                      <input
                        type="number"
                        min="0"
                        value={customTestPrice}
                        onChange={(e) => setCustomTestPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="500"
                        className="w-full pl-7 pr-3 py-2 bg-white dark:bg-gray-900 border-2 border-purple-300 dark:border-purple-700 rounded-xl font-black text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {lang === 'bn' ? 'বিভাগ / ক্যাটাগরি:' : 'Department / Category:'}
                    </label>
                    <select
                      value={customTestCategory}
                      onChange={(e) => setCustomTestCategory(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-gray-900 border-2 border-purple-300 dark:border-purple-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 text-xs cursor-pointer focus:outline-none focus:border-purple-600"
                    >
                      <option value="Pathology">Pathology</option>
                      <option value="Hematology">Hematology</option>
                      <option value="Biochemistry">Biochemistry</option>
                      <option value="Serology & Immunology">Serology & Immunology</option>
                      <option value="Microbiology">Microbiology</option>
                      <option value="Clinical Pathology">Clinical Pathology (Urine/Stool)</option>
                      <option value="Hormone & Thyroid">Hormone & Thyroid</option>
                      <option value="X-Ray & Imaging">Digital X-Ray</option>
                      <option value="Ultrasonography">Ultrasonography (USG)</option>
                      <option value="ECG">ECG</option>
                      <option value="General Investigation">General Investigation</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-purple-50/60 dark:bg-gray-900 rounded-xl border border-purple-200 dark:border-purple-800">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={saveCustomToCatalog}
                      onChange={(e) => setSaveCustomToCatalog(e.target.checked)}
                      className="accent-purple-700 w-4 h-4 rounded cursor-pointer"
                    />
                    <span>
                      {lang === 'bn'
                        ? 'ল্যাব টেস্ট ক্যাটালগে স্থায়ীভাবে সংরক্ষণ করুন (ভবিষ্যতে ড্রপডাউনে থাকবে)'
                        : 'Save permanently to lab catalog for future bills'}
                    </span>
                  </label>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowCustomTestModal(false)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 rounded-xl font-bold cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-900 hover:to-indigo-900 text-white rounded-xl font-black cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'বিলে যুক্ত করুন ও সংরক্ষণ' : 'Add to Bill & Save'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: EDIT EXISTING TEST NAME & PRICE */}
            {customTestTab === 'edit' && (
              <form onSubmit={handleUpdateCatalogTest} className="space-y-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    {lang === 'bn' ? 'কোন টেস্টটি এডিট করতে চান নির্বাচন করুন:' : 'Select Test to Edit:'}
                  </label>
                  <select
                    value={selectedTestToEditId}
                    onChange={(e) => handleSelectTestToEdit(e.target.value)}
                    className="w-full p-2.5 bg-purple-50 dark:bg-gray-900 border-2 border-purple-400 dark:border-purple-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 text-xs cursor-pointer focus:outline-none"
                  >
                    {labTests.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} — বর্তমান ফি: ৳{t.price} ({t.category})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTestToEditId && (
                  <div className="space-y-3 p-3.5 bg-purple-50/40 dark:bg-gray-900/40 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        {lang === 'bn' ? 'টেস্টের পরিবর্তিত নাম:' : 'Updated Test Name:'}
                      </label>
                      <input
                        type="text"
                        value={editCatalogTestName}
                        onChange={(e) => setEditCatalogTestName(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded-lg font-bold text-xs focus:ring-1 focus:ring-purple-600 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                          {lang === 'bn' ? 'নতুন ফি / মূল্য (টাকা ৳):' : 'New Price (BDT ৳):'}
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
                          <input
                            type="number"
                            min="0"
                            value={editCatalogTestPrice}
                            onChange={(e) =>
                              setEditCatalogTestPrice(e.target.value === '' ? '' : Number(e.target.value))
                            }
                            className="w-full pl-6 pr-2 py-2 bg-white dark:bg-gray-800 border-2 border-emerald-400 dark:border-emerald-600 rounded-lg font-black text-emerald-800 dark:text-emerald-300 text-sm focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                          {lang === 'bn' ? 'ক্যাটাগরি / বিভাগ:' : 'Category:'}
                        </label>
                        <select
                          value={editCatalogTestCategory}
                          onChange={(e) => setEditCatalogTestCategory(e.target.value)}
                          className="w-full p-2 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded-lg font-bold text-xs cursor-pointer focus:outline-none"
                        >
                          <option value="Pathology">Pathology</option>
                          <option value="Hematology">Hematology</option>
                          <option value="Biochemistry">Biochemistry</option>
                          <option value="Serology & Immunology">Serology & Immunology</option>
                          <option value="Microbiology">Microbiology</option>
                          <option value="Clinical Pathology">Clinical Pathology</option>
                          <option value="X-Ray & Imaging">Digital X-Ray</option>
                          <option value="Ultrasonography">Ultrasonography (USG)</option>
                          <option value="ECG">ECG</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowCustomTestModal(false)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 rounded-xl font-bold cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'মূল্য ও নাম আপডেট করুন' : 'Save Updates'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
