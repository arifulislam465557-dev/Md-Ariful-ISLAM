import { Invoice, ClinicConfig } from '../types';

/**
 * Normalizes a Bangladeshi phone number into standard international format for WhatsApp (e.g., 88017xxxxxxxx)
 */
export const formatBanglaWhatsAppPhone = (phoneRaw: string): string => {
  if (!phoneRaw) return '';
  // Remove all non-digit characters
  let digits = phoneRaw.replace(/\D/g, '');

  // If starts with 880, keep it
  if (digits.startsWith('880')) {
    return digits;
  }

  // If starts with 01, prepend 88
  if (digits.startsWith('01')) {
    return `88${digits}`;
  }

  // If starts with 1 and is 10 digits (e.g. 1712345678)
  if (digits.startsWith('1') && digits.length === 10) {
    return `880${digits}`;
  }

  return digits;
};

/**
 * Builds a professional, courteous WhatsApp message containing invoice & test details
 */
export const buildInvoiceWhatsAppMessage = (
  invoice: Invoice,
  clinic: ClinicConfig
): string => {
  const lineBreak = '\n';
  const divider = '--------------------------------';

  let msg = `🏥 *${clinic.clinicName.toUpperCase()}*${lineBreak}`;
  if (clinic.address) {
    msg += `📍 ${clinic.address}${lineBreak}`;
  }
  msg += `📞 হেল্পলাইন: ${clinic.phone}${lineBreak}`;
  msg += `${divider}${lineBreak}`;
  msg += `📄 *ডিজিটাল বিলিং ও ক্যাশ মেমো রশিদ*${lineBreak}`;
  msg += `🧾 ইনভয়েস নং: *#${invoice.invoiceNo}*${lineBreak}`;
  msg += `📅 বিলিং তারিখ: ${invoice.date}${lineBreak}`;
  msg += `${divider}${lineBreak}`;
  msg += `👤 রোগীর নাম: *${invoice.patientName}*${lineBreak}`;
  msg += `🆔 পেশেন্ট আইডি (PID): *${invoice.pId}*${lineBreak}`;
  msg += `🚻 বয়স / লিঙ্গ: ${invoice.age} / ${invoice.sex}${lineBreak}`;
  msg += `👨‍⚕️ রেফার্ড ডাক্তার: ${invoice.drName || invoice.drCode}${lineBreak}`;
  msg += `${divider}${lineBreak}`;
  msg += `🔬 *নির্ধারিত টেস্ট ও ইনভেস্টিগেশন:*${lineBreak}`;

  invoice.items.forEach((item, index) => {
    msg += `${index + 1}. ${item.testName} — ৳${item.price.toFixed(2)}${lineBreak}`;
  });

  msg += `${divider}${lineBreak}`;
  msg += `💰 মোট বিল (Subtotal): ৳${invoice.subtotal.toFixed(2)}${lineBreak}`;
  if (invoice.discountAmount > 0) {
    msg += `🔖 ছাড় / ডিসকাউন্ট: -৳${invoice.discountAmount.toFixed(2)} (${invoice.discountPercent}%)${lineBreak}`;
  }
  msg += `💵 সর্বমোট প্রদেয়: *৳${invoice.netTotal.toFixed(2)}*${lineBreak}`;
  msg += `✅ পরিশোধিত টাকা: *৳${invoice.paidAmount.toFixed(2)}*${lineBreak}`;
  if (invoice.dueAmount > 0) {
    msg += `⚠️ অবশিষ্ট বকেয়া: *৳${invoice.dueAmount.toFixed(2)}*${lineBreak}`;
    msg += `📌 বিলিং স্ট্যাটাস: *আংশিক পরিশোধিত (Due)*${lineBreak}`;
  } else {
    msg += `🎉 বিলিং স্ট্যাটাস: *সম্পূর্ণ পরিশোধিত (Paid)*${lineBreak}`;
  }

  msg += `${divider}${lineBreak}`;
  msg += `📌 *রিপোর্ট সংগ্রহের সময় অনুগ্রহ করে এই ইনভয়েস রশিদ অথবা আইডি (#${invoice.pId}) কাউন্টারে প্রদর্শন করুন।*${lineBreak}`;
  msg += `🙏 আপনার দ্রুত আরোগ্য কামনায় — *${clinic.clinicName}*`;

  return msg;
};

/**
 * Generates direct WhatsApp click-to-chat URL
 */
export const getWhatsAppUrl = (
  phoneRaw: string,
  message: string
): { url: string; formattedPhone: string; isValid: boolean } => {
  const formattedPhone = formatBanglaWhatsAppPhone(phoneRaw);
  const isValid = formattedPhone.length >= 11 && formattedPhone.length <= 15;
  const encodedMessage = encodeURIComponent(message);
  const url = isValid
    ? `https://wa.me/${formattedPhone}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;

  return { url, formattedPhone, isValid };
};
