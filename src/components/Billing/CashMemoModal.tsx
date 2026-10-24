import React, { useState } from 'react';
import { Invoice } from '../../types';
import { useApp } from '../../context/AppContext';
import { Printer, X, Scissors, Check, Copy, Download, MessageSquare, Send } from 'lucide-react';
import { generateInvoicePdf } from '../../utils/pdfGenerator';
import { printElementById } from '../../utils/printHelper';
import {
  buildInvoiceWhatsAppMessage,
  getWhatsAppUrl,
  formatBanglaWhatsAppPhone,
} from '../../utils/whatsappHelper';

interface CashMemoModalProps {
  invoice: Invoice;
  onClose: () => void;
}

export const CashMemoModal: React.FC<CashMemoModalProps> = ({ invoice, onClose }) => {
  const {
    clinicConfig,
    lang,
    currentUser,
    currentWorkstation,
    addPrintLog,
    addNotification,
  } = useApp();
  // By default, print 2 copies on a single A4 page (Hospital / Office Copy + Patient Copy)
  const [printTwoCopies, setPrintTwoCopies] = useState<boolean>(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState<boolean>(false);
  const [targetPhone, setTargetPhone] = useState<string>(invoice.phone || '+880 17');
  const [whatsappSent, setWhatsappSent] = useState<boolean>(false);

  const handlePrint = () => {
    setIsPrinting(true);
    // Record in print audit log
    addPrintLog({
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
      pId: invoice.pId,
      patientName: invoice.patientName,
      totalAmount: invoice.netTotal,
      paidAmount: invoice.paidAmount,
      dueAmount: invoice.dueAmount,
      printedByUserId: currentUser?.id || 'cashier',
      printedByUserName: currentUser?.fullName || 'Cashier',
      userRole: currentUser?.role || 'Billing',
      workstationCode: currentWorkstation?.terminalCode || 'PC-01',
      copies: printTwoCopies ? 2 : 1,
    });

    // Use robust multi-strategy print executor
    const success = printElementById('printable-receipt', {
      pageTitle: `CashMemo-${invoice.invoiceNo}-${invoice.patientName}`,
      twoCopiesOnA4: printTwoCopies,
      onAfterPrint: () => {
        setIsPrinting(false);
      },
    });

    setTimeout(() => {
      setIsPrinting(false);
    }, 1500);

    addNotification(
      lang === 'bn' ? 'ক্যাশ মেমো প্রিন্ট' : 'Receipt Print',
      lang === 'bn'
        ? `ইনভয়েস #${invoice.invoiceNo} এর প্রিন্ট কমান্ড পাঠানো হয়েছে।`
        : `Print command sent for invoice #${invoice.invoiceNo}.`,
      'info'
    );
  };

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      generateInvoicePdf(invoice, clinicConfig, true);
      addNotification(
        'PDF তৈরি হয়েছে',
        `ইনভয়েস #${invoice.invoiceNo} এর A4 ডাবল-কপি PDF ডাউনলোড হয়েছে।`,
        'success'
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSendWhatsApp = (customPhone?: string) => {
    const phoneToUse = customPhone || targetPhone;
    const msg = buildInvoiceWhatsAppMessage(invoice, clinicConfig);
    const { url, formattedPhone, isValid } = getWhatsAppUrl(phoneToUse, msg);

    // Open WhatsApp
    window.open(url, '_blank');
    setWhatsappSent(true);
    setShowWhatsAppDialog(false);

    addNotification(
      'WhatsApp ইনভয়েস পাঠানো হয়েছে',
      `গ্রাহক ${invoice.patientName} এর নম্বরে (${formattedPhone || phoneToUse}) ইনভয়েস পাঠানো হয়েছে।`,
      'success'
    );
  };

  const renderSlip = (copyType: 'OFFICE' | 'PATIENT') => {
    const isOffice = copyType === 'OFFICE';
    return (
      <div
        className={`bg-white text-slate-900 border border-slate-300 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs ${
          printTwoCopies ? 'text-[11px] min-h-[128mm] max-h-[135mm]' : 'text-xs min-h-[250mm]'
        }`}
      >
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between pb-2 border-b-2 border-purple-950 gap-2">
            {clinicConfig.logoUrl ? (
              <img
                src={clinicConfig.logoUrl}
                alt="Clinic Logo"
                className="w-10 h-10 object-contain shrink-0 rounded"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-purple-950 text-white flex items-center justify-center font-black text-base shrink-0">
                +
              </div>
            )}
            <div className="text-center flex-1">
              <h2 className="text-base sm:text-lg font-black text-purple-950 uppercase tracking-tight leading-tight">
                {clinicConfig.clinicName}
              </h2>
              <p className="text-[10px] text-slate-600 font-medium leading-tight">
                {clinicConfig.address} · ফোন: {clinicConfig.phone} · রেজি: {clinicConfig.regNo}
              </p>
              <div className="mt-1 inline-flex items-center gap-2">
                <span
                  className={`px-3 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-2xs border ${
                    isOffice
                      ? 'bg-purple-950 text-white border-purple-950'
                      : 'bg-emerald-800 text-white border-emerald-900'
                  }`}
                >
                  {isOffice
                    ? lang === 'bn'
                      ? 'অফিস / হাসপাতাল রেকর্ড কপি'
                      : 'OFFICE / CLINIC RECORD COPY'
                    : lang === 'bn'
                    ? 'গ্রাহক / রোগী মূল ক্যাশ মেমো'
                    : 'PATIENT / CUSTOMER ORIGINAL COPY'}
                </span>
                <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-300 font-bold text-purple-950">
                  ইনভয়েস: #{invoice.invoiceNo}
                </span>
              </div>
            </div>
            <div className="w-9 shrink-0 hidden sm:block text-right">
              <span
                className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                  invoice.dueAmount <= 0
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-red-50 text-red-800 border-red-300'
                }`}
              >
                {invoice.dueAmount <= 0 ? 'PAID' : 'DUE'}
              </span>
            </div>
          </div>

          {/* Patient Details Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 bg-slate-50/90 rounded-lg border border-slate-300 mt-2 text-[11px] text-slate-800">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Patient Name:</span>
              <strong className="text-slate-950 font-black text-xs block truncate">{invoice.patientName}</strong>
              <span className="text-[10px] text-slate-600">
                PID: <strong className="font-mono text-purple-950 font-bold">{invoice.pId}</strong>
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Age / Sex:</span>
              <strong className="text-slate-900 font-bold">{invoice.age} Y / {invoice.sex}</strong>
              <span className="text-[10px] text-slate-600 block">
                মোবাইল: <span className="font-mono">{invoice.phone || 'N/A'}</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Bill Date & Time:</span>
              <strong className="font-mono text-slate-900 text-[10px] block">{invoice.date}</strong>
              <span className="text-[10px] text-slate-600">
                Payment: <strong className="font-bold">{invoice.paymentMethod}</strong>
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Referred By:</span>
              <strong className="text-purple-950 font-bold text-[10px] block truncate">
                {invoice.drName || invoice.drCode}
              </strong>
              <span
                className={`text-[9px] font-bold uppercase inline-block px-1.5 py-0.2 rounded border ${
                  invoice.status === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}
              >
                {invoice.status}
              </span>
            </div>
          </div>

          {/* Investigations Table */}
          <div className="mt-2 overflow-hidden rounded-md border border-slate-300">
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="bg-purple-950 text-white font-bold text-[10px] uppercase">
                  <th className="py-1 px-2 border-r border-purple-800 w-8 text-center">#</th>
                  <th className="py-1 px-2 border-r border-purple-800">Test / Service Description</th>
                  <th className="py-1 px-2 border-r border-purple-800 w-24 text-center">Department</th>
                  <th className="py-1 px-2 w-20 text-right">Fee (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="odd:bg-white even:bg-slate-50/60">
                    <td className="py-1 px-2 text-center text-slate-500 font-mono text-[10px] border-r border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="py-1 px-2 font-bold text-slate-900 text-[11px] border-r border-slate-200">
                      {item.testName}
                    </td>
                    <td className="py-1 px-2 text-center text-slate-600 text-[10px] border-r border-slate-200">
                      {item.category}
                    </td>
                    <td className="py-1 px-2 text-right font-mono font-black text-slate-950 text-[11px]">
                      ৳{item.price.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary & Signatures */}
        <div className="mt-2 pt-1.5 border-t border-slate-200">
          <div className="flex justify-between items-end gap-4">
            {/* Left Remarks / Note */}
            <div className="text-[10px] text-slate-600 space-y-1 flex-1">
              <p className="font-semibold">
                * প্যাথলজি ও ডায়াগনস্টিক রিপোর্ট সংগ্রহের সময় এই রশিদটি অবশ্যই সঙ্গে আনতে হবে।
              </p>
              <p className="text-[9px] text-slate-400 font-mono">
                Computerized Billing System · Adiba Clinic · Hotline: {clinicConfig.phone}
              </p>
            </div>

            {/* Right Financial Breakdown */}
            <div className="w-56 bg-slate-50 p-2 rounded-lg border border-slate-300 text-[10px] space-y-0.5">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-bold">৳{invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="text-emerald-700 font-bold">
                  <div className="flex justify-between">
                    <span>
                      Discount {invoice.discountPercent > 0 ? `(${invoice.discountPercent}%)` : '(লেস)'}:
                    </span>
                    <span className="font-mono">-৳{invoice.discountAmount.toFixed(2)}</span>
                  </div>
                  {invoice.discountBy && (
                    <div className="text-[9px] text-slate-600 font-semibold text-right">
                      Ref/Disc By: {invoice.discountBy}
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-between py-0.5 border-y border-purple-900 font-black text-purple-950 text-xs">
                <span>Net Payable:</span>
                <span className="font-mono">৳{invoice.netTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-bold">
                <span>Paid Amount:</span>
                <span className="font-mono">৳{invoice.paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black">
                <span className={invoice.dueAmount > 0 ? 'text-red-700' : 'text-slate-600'}>
                  Due Amount:
                </span>
                <span
                  className={`font-mono ${
                    invoice.dueAmount > 0 ? 'text-red-700 bg-red-100 px-1 rounded' : 'text-slate-700'
                  }`}
                >
                  ৳{invoice.dueAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-4 flex justify-between items-end text-center text-[10px] text-slate-600">
            <div>
              <div className="w-36 border-t border-slate-500 pt-1 font-bold text-slate-900">
                Prepared By (Cashier)
              </div>
            </div>
            <div>
              <div className="w-36 border-t border-slate-500 pt-1 font-bold text-slate-900">
                Authorized Signature
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-slate-100 dark:bg-slate-900 rounded-2xl shadow-2xl border border-purple-300 dark:border-purple-800 overflow-hidden flex flex-col max-h-[96vh]">
        {/* Top Control Bar (Hidden in Print) */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 px-4 sm:px-6 py-2.5 text-white flex flex-wrap items-center justify-between gap-2.5 no-print border-b border-purple-800">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <span>{lang === 'bn' ? 'বিলিং ক্যাশ মেমো (A4 প্রিন্ট)' : 'Billing Cash Memo (A4)'}</span>
              <span className="font-mono text-xs bg-purple-800 px-2 py-0.5 rounded text-purple-200">
                #{invoice.invoiceNo}
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Toggle 2 Copies on A4 */}
            <label
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-800/80 hover:bg-purple-700 text-white rounded-lg cursor-pointer border border-purple-600 select-none shadow-2xs transition"
              title={lang === 'bn' ? 'একটি A4 পেইজে ২টি কপি (অফিস ও পেশেন্ট কপি) প্রিন্ট করুন' : 'Print 2 copies on a single A4 page'}
            >
              <input
                type="checkbox"
                checked={printTwoCopies}
                onChange={(e) => setPrintTwoCopies(e.target.checked)}
                className="accent-pink-500 w-3.5 h-3.5 rounded cursor-pointer"
              />
              <span className="font-bold text-[11px] text-pink-200">
                {lang === 'bn' ? 'A4 এ ২টি কপি (অফিস + রোগী)' : '2 Copies on A4'}
              </span>
            </label>

            {/* WhatsApp Send Button */}
            <button
              type="button"
              onClick={() => {
                if (targetPhone && targetPhone.replace(/\D/g, '').length >= 10) {
                  handleSendWhatsApp(targetPhone);
                } else {
                  setShowWhatsAppDialog(true);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-md active:scale-95 border border-emerald-400"
              title={lang === 'bn' ? 'গ্রাহকের হোয়াটসঅ্যাপে ইনভয়েস পাঠান' : 'Send invoice to Customer WhatsApp'}
            >
              {/* WhatsApp Icon */}
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}</span>
            </button>

            {/* PDF Download Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
              title={lang === 'bn' ? 'ইনভয়েসের A4 সাইজ PDF ডাউনলোড করুন' : 'Download Vector A4 PDF'}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'PDF...' : 'PDF ডাউনলোড'}</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black transition cursor-pointer shadow-md active:scale-95 disabled:opacity-75"
              title={lang === 'bn' ? 'ক্যাশ মেমো প্রিন্ট করুন' : 'Print Cash Memo'}
            >
              <Printer className={`w-3.5 h-3.5 ${isPrinting ? 'animate-bounce' : ''}`} />
              <span>{isPrinting ? (lang === 'bn' ? 'প্রিন্ট হচ্ছে...' : 'Printing...') : (lang === 'bn' ? 'প্রিন্ট দিন' : 'Print Receipt')}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* WhatsApp Phone Confirm / Quick Edit Modal */}
        {showWhatsAppDialog && (
          <div className="absolute top-14 right-4 sm:right-16 z-50 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl border-2 border-emerald-500 w-80 text-xs text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
              <h4 className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <svg className="w-4 h-4 fill-[#25D366]" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                <span>গ্রাহকের হোয়াটসঅ্যাপ নম্বর</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowWhatsAppDialog(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] text-gray-500 my-2">
              ইনভয়েসের বিস্তারিত বিবরণ সরাসরি এই হোয়াটসঅ্যাপে স্বয়ংক্রিয়ভাবে মেসেজ হিসেবে চলে যাবে:
            </p>
            <div className="space-y-2">
              <input
                type="text"
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
                placeholder="+880 17..."
                className="w-full p-2 bg-emerald-50 dark:bg-gray-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                autoFocus
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowWhatsAppDialog(false)}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(targetPhone)}
                  className="px-3 py-1 bg-[#25D366] hover:bg-[#20ba59] text-white rounded font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Send className="w-3 h-3" />
                  <span>এখনই পাঠান</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Printable Area */}
        <div id="printable-receipt" className="p-3 sm:p-5 overflow-y-auto flex-1 bg-slate-200 dark:bg-slate-950 space-y-3">
          {printTwoCopies ? (
            <div className="max-w-2xl mx-auto space-y-3">
              {/* Slip 1: Hospital / Office Copy */}
              {renderSlip('OFFICE')}

              {/* Scissor / Cut Divider */}
              <div className="py-1 flex items-center justify-center gap-2 border-y-2 border-dashed border-slate-400 text-slate-500 font-mono text-[10px] my-1 select-none bg-white/70 rounded">
                <Scissors className="w-3 h-3 text-slate-500" />
                <span className="font-bold tracking-widest uppercase">
                  {lang === 'bn'
                    ? '✂ কেটে আলাদা করুন / CUT HERE (A4 Dual Copies: Office & Patient)'
                    : '✂ TEAR OR CUT HERE (A4 DUAL COPIES)'}
                </span>
                <Scissors className="w-3 h-3 text-slate-500" />
              </div>

              {/* Slip 2: Patient / Customer Copy */}
              {renderSlip('PATIENT')}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              {renderSlip('PATIENT')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
