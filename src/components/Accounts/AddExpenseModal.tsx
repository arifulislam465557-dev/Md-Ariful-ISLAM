import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExpenseItem } from '../../types';
import {
  X,
  DollarSign,
  Calendar,
  User,
  CreditCard,
  FileText,
  Check,
  Tag,
  AlertCircle,
} from 'lucide-react';

interface AddExpenseModalProps {
  onClose: () => void;
  initialExpense?: ExpenseItem | null;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  onClose,
  initialExpense,
}) => {
  const { addExpense, updateExpense, lang, expenses, employees } = useApp();

  const isEdit = Boolean(initialExpense);

  const [title, setTitle] = useState(initialExpense?.title || '');
  const [category, setCategory] = useState<ExpenseItem['category']>(
    initialExpense?.category || 'Reagents & Chemicals'
  );
  const [amount, setAmount] = useState(initialExpense?.amount ? String(initialExpense.amount) : '');
  const [date, setDate] = useState(
    initialExpense?.date || new Date().toISOString().split('T')[0]
  );
  const [vouchedBy, setVouchedBy] = useState(
    initialExpense?.vouchedBy || (employees[0]?.name || 'ক্যাশিয়ার')
  );
  const [paymentMethod, setPaymentMethod] = useState<ExpenseItem['paymentMethod']>(
    initialExpense?.paymentMethod || 'Cash'
  );
  const [note, setNote] = useState(initialExpense?.note || '');
  const [error, setError] = useState('');

  const voucherNo =
    initialExpense?.voucherNo ||
    `VCH-${new Date().getFullYear()}-${String(expenses.length + 1).padStart(3, '0')}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(lang === 'bn' ? 'খরচের বিবরণ বা শিরোনাম লিখুন!' : 'Expense title is required!');
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError(lang === 'bn' ? 'সঠিক টাকার পরিমাণ লিখুন!' : 'Valid amount is required!');
      return;
    }

    if (isEdit && initialExpense) {
      updateExpense(initialExpense.id, {
        title: title.trim(),
        category,
        amount: numAmount,
        date,
        vouchedBy: vouchedBy.trim(),
        paymentMethod,
        note: note.trim(),
      });
    } else {
      addExpense({
        voucherNo,
        title: title.trim(),
        category,
        amount: numAmount,
        date,
        vouchedBy: vouchedBy.trim(),
        paymentMethod,
        note: note.trim(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-850 rounded-2xl shadow-2xl border border-purple-200 dark:border-gray-700 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <DollarSign className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                {isEdit
                  ? lang === 'bn'
                    ? 'ব্যয় ভাউচার সম্পাদন'
                    : 'Edit Expense Voucher'
                  : lang === 'bn'
                  ? 'নতুন ব্যয় / খরচ যুক্ত করুন'
                  : 'Record New Expense'}
              </h2>
              <span className="text-xs text-purple-200 font-mono">ভাউচার নং: {voucherNo}</span>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Expense Title */}
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
              {lang === 'bn' ? 'খরচের বিবরণ / শিরোনাম' : 'Expense Title / Description'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'যেমন: ল্যাব রিএজেন্ট ক্রয় / বিদ্যুৎ বিল / স্টাফ নাস্তা'
                  : 'e.g. Lab Reagents / Generator Fuel / Office Supplies'
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-600 outline-none"
            />
          </div>

          {/* Category & Amount in Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                {lang === 'bn' ? 'ব্যয়ের খাত / ক্যাটাগরি' : 'Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-600 outline-none"
              >
                <option value="Reagents & Chemicals">রিএজেন্ট ও কেমিক্যাল (Reagents)</option>
                <option value="Salary">স্টাফ বেতন ও মজুরি (Salary)</option>
                <option value="Electricity & Utility">বিদ্যুৎ ও জেনারেটর (Electricity/Fuel)</option>
                <option value="Doctor Commission">ডাক্তার রেফারেল ফি/কমিশন (Doctor Fee)</option>
                <option value="Rent">ক্লিনিক ও চেম্বার ভাড়া (Rent)</option>
                <option value="Stationery & Printing">স্টেশনারি ও পেপার (Stationery)</option>
                <option value="Maintenance">যন্ত্রপাতি মেরামত (Maintenance)</option>
                <option value="Refreshment">ডাক্তার ও স্টাফ চা-নাস্তা (Refreshment)</option>
                <option value="Other">অন্যান্য খরচ (Other)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                {lang === 'bn' ? 'টাকার পরিমাণ (৳)' : 'Amount (৳)'}{' '}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono font-bold text-red-600 dark:text-red-400 focus:ring-2 focus:ring-purple-600 outline-none"
                />
                <span className="absolute left-2.5 top-2 font-bold text-gray-400">৳</span>
              </div>
            </div>
          </div>

          {/* Date & Vouched By */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                {lang === 'bn' ? 'খরচের তারিখ' : 'Expense Date'}
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono focus:ring-2 focus:ring-purple-600 outline-none"
                />
                <Calendar className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                {lang === 'bn' ? 'প্রদানকারী / ভাউচার প্রস্তুতকারক' : 'Vouched By'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={vouchedBy}
                  onChange={(e) => setVouchedBy(e.target.value)}
                  placeholder="কর্মচারীর নাম"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-600 outline-none"
                />
                <User className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
              {lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Cash', 'Bank Transfer', 'bKash/Nagad', 'Cheque'] as const).map((method) => (
                <button
                  type="button"
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-2 rounded-lg border text-center transition cursor-pointer font-bold ${
                    paymentMethod === method
                      ? 'bg-purple-900 text-white border-purple-800'
                      : 'bg-gray-50 dark:bg-gray-750 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-650 hover:bg-gray-100'
                  }`}
                >
                  {method === 'Cash'
                    ? 'নগদ (Cash)'
                    : method === 'bKash/Nagad'
                    ? 'বিকাশ/নগদ'
                    : method === 'Bank Transfer'
                    ? 'ব্যাংক'
                    : 'চেক'}
                </button>
              ))}
            </div>
          </div>

          {/* Note / Memo */}
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
              {lang === 'bn' ? 'অতিরিক্ত মন্তব্য বা মেমো নম্বর' : 'Notes / Memo Details'}
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={lang === 'bn' ? 'ভাউচার বা চালানের রেফারেন্স...' : 'Receipt or invoice reference...'}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-600 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 text-xs font-bold transition cursor-pointer"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>
                {isEdit
                  ? lang === 'bn'
                    ? 'সংরক্ষণ করুন'
                    : 'Save Changes'
                  : lang === 'bn'
                  ? 'ব্যয় ভাউচার যুক্ত করুন'
                  : 'Record Expense'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
