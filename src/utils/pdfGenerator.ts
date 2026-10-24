import { jsPDF } from 'jspdf';
import {
  Patient,
  ClinicConfig,
  Invoice,
  Prescription,
  Doctor,
  EcgReport,
  XrayReport,
  UsgReport,
} from '../types';
import { groupTestsByDepartment } from './pathologyUtils';

export interface PathologyPdfOptions {
  action?: 'download' | 'print';
  padGapMm?: number;
  onlyPageIndex?: number;
}

export const printJsPdfDirectly = (doc: jsPDF) => {
  doc.autoPrint();
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);

  let printFrame = document.getElementById('pdf-direct-print-iframe') as HTMLIFrameElement | null;
  if (!printFrame) {
    printFrame = document.createElement('iframe');
    printFrame.id = 'pdf-direct-print-iframe';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '1px';
    printFrame.style.height = '1px';
    printFrame.style.border = '0';
    printFrame.style.opacity = '0.01';
    printFrame.style.pointerEvents = 'none';
    document.body.appendChild(printFrame);
  }

  printFrame.onload = () => {
    setTimeout(() => {
      try {
        if (printFrame && printFrame.contentWindow) {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();
        }
      } catch {
        window.open(blobUrl, '_blank');
      }
    }, 250);
  };

  printFrame.src = blobUrl;
};

export const generatePathologyPdf = (
  patient: Patient,
  clinic: ClinicConfig,
  reportTitle: string = 'PATHOLOGY INVESTIGATION REPORT',
  includeClinicName: boolean = false,
  splitDepartments: boolean = true,
  includeDoctorSignature: boolean = true,
  options?: PathologyPdfOptions
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const allPages = groupTestsByDepartment(patient.testResults, splitDepartments);
  const pages =
    options?.onlyPageIndex !== undefined
      ? allPages.filter((p) => p.pageIndex === options.onlyPageIndex)
      : allPages;
  const totalPages = allPages.length;

  pages.forEach((pageGroup, pageIdx) => {
    if (pageIdx > 0) {
      doc.addPage('a4', 'portrait');
    }

    let yPos = 14;

    if (includeClinicName) {
      // Header Box
      doc.setFillColor(245, 243, 255);
      doc.rect(14, 10, pageWidth - 28, 26, 'F');
      doc.setDrawColor(124, 58, 237);
      doc.setLineWidth(0.4);
      doc.rect(14, 10, pageWidth - 28, 26, 'D');

      // Clinic Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(76, 29, 149);
      doc.text(clinic.clinicName, pageWidth / 2, 17, { align: 'center' });

      // Subtitles
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(75, 85, 99);
      doc.text(clinic.tagline, pageWidth / 2, 22, { align: 'center' });
      doc.text(`${clinic.address} | Phone: ${clinic.phone}`, pageWidth / 2, 27, { align: 'center' });
      doc.text(`Govt Reg No: ${clinic.regNo} | Email: ${clinic.email}`, pageWidth / 2, 32, { align: 'center' });

      // Department Title Badge
      const pageTitle = pageGroup.departmentConfig.reportTitleEn || reportTitle;
      doc.setFillColor(109, 40, 217);
      doc.roundedRect(pageWidth / 2 - 50, 39, 100, 7, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(pageTitle, pageWidth / 2, 44, { align: 'center' });
      yPos = 50;
    } else {
      // Official Pad Paper Mode: Top margin for hospital pre-printed letterhead
      const customGap = options?.padGapMm ?? 30;
      yPos = Math.max(22, customGap + 6);
      const pageTitle = pageGroup.departmentConfig.reportTitleEn || reportTitle;
      doc.setFillColor(109, 40, 217);
      doc.roundedRect(pageWidth / 2 - 52, yPos - 8, 104, 7, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(pageTitle, pageWidth / 2, yPos - 3, { align: 'center' });
      yPos = yPos + 4;
    }

    // Patient Details Box
    doc.setFillColor(250, 250, 252);
    doc.rect(14, yPos, pageWidth - 28, 26, 'F');
    doc.setDrawColor(209, 213, 219);
    doc.rect(14, yPos, pageWidth - 28, 26, 'D');

    doc.setFontSize(8);
    doc.setTextColor(17, 24, 39);

    // Left Column
    doc.setFont('helvetica', 'bold');
    doc.text('Accession / PID:', 17, yPos + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${patient.accessionNo || `ACC-${patient.pId}`}  |  PID: ${patient.pId}`, 43, yPos + 5);

    doc.setFont('helvetica', 'bold');
    doc.text('Patient Name:', 17, yPos + 9.8);
    doc.setFont('helvetica', 'bold');
    doc.text(patient.patientName, 43, yPos + 9.8);

    doc.setFont('helvetica', 'bold');
    doc.text('Age:', 17, yPos + 14.6);
    doc.setFont('helvetica', 'normal');
    doc.text(`${patient.age || 'N/A'}`, 43, yPos + 14.6);

    doc.setFont('helvetica', 'bold');
    doc.text('Sex:', 17, yPos + 19.4);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${patient.sex || 'N/A'}${
        patient.pregnancyStatus && patient.pregnancyStatus !== 'Non-Pregnant'
          ? ` (${patient.pregnancyStatus})`
          : ''
      }`,
      43,
      yPos + 19.4
    );

    // Bottom Single Line: Referred By (Doctor Name + Degree) alongside Sample Type
    doc.setFont('helvetica', 'bold');
    doc.text('Referred By:', 17, yPos + 24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(76, 29, 149);
    const refDoctorLine = (patient.drName || 'Self').replace(/\s*\(DR\w*\)/gi, '').trim();
    doc.text(refDoctorLine, 43, yPos + 24);
    doc.setTextColor(17, 24, 39);

    // Right Column
    const rightCol = pageWidth / 2 + 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Sample Collected:', rightCol, yPos + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      patient.sampleCollectionTime || `${patient.billDate || patient.invDate} 09:00 AM`,
      rightCol + 28,
      yPos + 5
    );

    doc.setFont('helvetica', 'bold');
    doc.text('Sample Received:', rightCol, yPos + 9.8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      patient.sampleReceivedTime || `${patient.billDate || patient.invDate} 09:30 AM`,
      rightCol + 28,
      yPos + 9.8
    );

    doc.setFont('helvetica', 'bold');
    doc.text('Report Date/Time:', rightCol, yPos + 14.6);
    doc.setFont('helvetica', 'normal');
    doc.text(patient.reportDateTime || patient.invDate, rightCol + 28, yPos + 14.6);

    doc.setFont('helvetica', 'bold');
    doc.text('Sample Type:', rightCol, yPos + 24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(76, 29, 149);
    doc.text(
      patient.sampleType || pageGroup.departmentConfig.sampleTypeEn || 'Blood / Serum',
      rightCol + 28,
      yPos + 24
    );
    doc.setTextColor(17, 24, 39);

    // Department Header Sub-bar
    yPos += 29;
    doc.setFillColor(243, 232, 255);
    doc.rect(14, yPos, pageWidth - 28, 6, 'F');
    doc.setDrawColor(192, 132, 252);
    doc.rect(14, yPos, pageWidth - 28, 6, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(76, 29, 149);
    doc.text(
      `DEPARTMENT: ${pageGroup.departmentConfig.nameEn.toUpperCase()}`,
      18,
      yPos + 4.2
    );

    if (totalPages > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(107, 114, 128);
      doc.text(`Sheet ${pageGroup.pageIndex} of ${totalPages}`, pageWidth - 18, yPos + 4.2, { align: 'right' });
    }

    // Test Results Table Header
    yPos += 8.5;
    doc.setFillColor(76, 29, 149);
    doc.rect(14, yPos, pageWidth - 28, 7.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('Test Parameter & Method', 17, yPos + 5.2);
    doc.text('Result', 90, yPos + 5.2);
    doc.text('Unit', 117, yPos + 5.2);
    doc.text('Reference Interval', 138, yPos + 5.2);
    doc.text('Flag', 180, yPos + 5.2);

    // Test Results Rows
    yPos += 7.5;
    doc.setTextColor(31, 41, 55);

    pageGroup.tests.forEach((test, idx) => {
      const rowHeight = test.method ? 8.5 : 6.8;
      if (idx % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(14, yPos, pageWidth - 28, rowHeight, 'F');
      }
      doc.setDrawColor(229, 231, 235);
      doc.line(14, yPos + rowHeight, pageWidth - 14, yPos + rowHeight);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(17, 24, 39);
      doc.text(test.testName, 17, yPos + 4.4);

      if (test.method) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(107, 114, 128);
        doc.text(`Method: ${test.method}`, 17, yPos + 7.4);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      if (test.status === 'Critical') {
        doc.setTextColor(185, 28, 28);
      } else if (test.status === 'High') {
        doc.setTextColor(220, 38, 38);
      } else if (test.status === 'Low') {
        doc.setTextColor(180, 83, 9);
      } else {
        doc.setTextColor(17, 24, 39);
      }
      doc.text(test.result || '-', 90, yPos + 4.8);

      doc.setTextColor(75, 85, 99);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(test.unit || '-', 117, yPos + 4.8);
      doc.text((test.normalRange || '-').slice(0, 24), 138, yPos + 4.8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      if (test.status === 'Critical' || test.status === 'High') {
        doc.setTextColor(220, 38, 38);
      } else if (test.status === 'Low') {
        doc.setTextColor(180, 83, 9);
      } else {
        doc.setTextColor(22, 101, 52);
      }
      doc.text(test.status || 'Normal', 180, yPos + 4.8);

      yPos += rowHeight;
    });

    // Clinical Comments
    yPos += 5;
    doc.setDrawColor(209, 213, 219);
    doc.setFillColor(254, 252, 232);
    doc.roundedRect(14, yPos, pageWidth - 28, 13, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(133, 77, 14);
    doc.text('Clinical Comments / Remarks:', 18, yPos + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(75, 85, 99);
    const comments =
      patient.comments ||
      'Results correlate with clinical presentation. Verified by internal quality control.';
    doc.text(comments, 18, yPos + 9);

    // Signatures
    doc.setDrawColor(156, 163, 175);
    doc.line(24, 250, 79, 250);
    doc.line(pageWidth - 14 - 65, 250, pageWidth - 14 - 10, 250);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(17, 24, 39);
    doc.text(patient.technicallyValidatedBy || clinic.labInCharge, 24, 254);
    if (includeDoctorSignature) {
      doc.text(patient.verifiedBy || clinic.pathologistName, pageWidth - 14 - 65, 254);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.text('Checked By (Medical Lab Technologist)', 24, 258);
    if (includeDoctorSignature) {
      doc.text(clinic.pathologistDegree || 'Consultant Pathologist', pageWidth - 14 - 65, 258);
    } else {
      doc.text('Authorized Pathologist Signature', pageWidth - 14 - 65, 258);
    }

    // Lab Disclaimer & Footer
    doc.setFontSize(6.5);
    doc.setTextColor(120, 125, 135);
    doc.text(
      `Disclaimer: ${
        patient.labDisclaimer ||
        'Laboratory findings should be clinically correlated with patient history. Not valid for medico-legal purpose.'
      }`,
      14,
      280
    );
    doc.text(
      `* Computerized Diagnostic Report | Acc: ${patient.accessionNo || `ACC-${patient.pId}`} | PID: ${patient.pId} | Page ${pageGroup.pageIndex} of ${totalPages} (${pageGroup.departmentConfig.nameEn})`,
      14,
      285
    );
  });

  window.dispatchEvent(
    new CustomEvent('medicare-print-record', {
      detail: {
        documentType: 'PATHOLOGY_REPORT',
        documentTitle: `Pathology Report (${patient.pId})`,
        documentId: patient.accessionNo || `LAB-${patient.pId}`,
        pId: patient.pId,
        patientName: patient.patientName,
        actionType: options?.action === 'print' ? 'PRINT' : 'PDF_DOWNLOAD',
        snapshotSummary: `${(patient.testResults || []).length} parameters · Status: ${patient.status}`,
      },
    })
  );

  if (options?.action === 'print') {
    printJsPdfDirectly(doc);
  } else {
    doc.save(`Lab_Report_${patient.pId}_${patient.patientName.replace(/\s+/g, '_')}.pdf`);
  }
  return doc;
};

export const generateInvoicePdf = (
  invoice: Invoice,
  clinic: ClinicConfig,
  autoDownload: boolean = true
): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // 186mm

  const renderSingleSlip = (startY: number, isOfficeCopy: boolean) => {
    // Header boundary box
    doc.setFillColor(252, 250, 255);
    doc.rect(margin, startY, contentWidth, 20, 'F');
    doc.setDrawColor(76, 29, 149);
    doc.setLineWidth(0.3);
    doc.rect(margin, startY, contentWidth, 20, 'D');

    // Clinic Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(76, 29, 149);
    doc.text(clinic.clinicName.toUpperCase(), pageWidth / 2, startY + 6, { align: 'center' });

    // Clinic Subtitles
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text(
      `${clinic.address} · Phone: ${clinic.phone} · Reg: ${clinic.regNo}`,
      pageWidth / 2,
      startY + 11,
      { align: 'center' }
    );

    // Copy Type Badge
    doc.setFillColor(isOfficeCopy ? 76 : 16, isOfficeCopy ? 29 : 185, isOfficeCopy ? 149 : 129);
    doc.roundedRect(pageWidth / 2 - 38, startY + 13.5, 76, 5, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(
      isOfficeCopy ? 'OFFICE / CLINIC RECORD COPY' : 'PATIENT / CUSTOMER ORIGINAL COPY',
      pageWidth / 2,
      startY + 17.2,
      { align: 'center' }
    );

    // Invoice No and Status Pill
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(76, 29, 149);
    doc.text(`INV #${invoice.invoiceNo}`, margin + 3, startY + 17.2);

    doc.setFillColor(invoice.dueAmount <= 0 ? 220 : 254, invoice.dueAmount <= 0 ? 252 : 243, invoice.dueAmount <= 0 ? 231 : 199);
    doc.rect(pageWidth - margin - 22, startY + 13.5, 20, 5, 'F');
    doc.setDrawColor(invoice.dueAmount <= 0 ? 34 : 220, invoice.dueAmount <= 0 ? 197 : 38, invoice.dueAmount <= 0 ? 94 : 38);
    doc.rect(pageWidth - margin - 22, startY + 13.5, 20, 5, 'D');
    doc.setFontSize(7);
    doc.setTextColor(invoice.dueAmount <= 0 ? 22 : 185, invoice.dueAmount <= 0 ? 101 : 28, invoice.dueAmount <= 0 ? 52 : 28);
    doc.text(invoice.dueAmount <= 0 ? 'PAID' : 'DUE', pageWidth - margin - 12, startY + 17.2, { align: 'center' });

    // Patient Info Grid
    let py = startY + 22;
    doc.setFillColor(248, 248, 250);
    doc.rect(margin, py, contentWidth, 14, 'F');
    doc.setDrawColor(220, 220, 225);
    doc.rect(margin, py, contentWidth, 14, 'D');

    doc.setFontSize(7.5);
    // Col 1
    doc.setTextColor(100, 100, 100);
    doc.text('Patient Name:', margin + 3, py + 4.5);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.patientName, margin + 24, py + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Patient ID:', margin + 3, py + 10.5);
    doc.setTextColor(76, 29, 149);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.pId, margin + 24, py + 10.5);

    // Col 2
    const col2X = margin + 65;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Age / Sex:', col2X, py + 4.5);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`${invoice.age} / ${invoice.sex}`, col2X + 16, py + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Phone:', col2X, py + 10.5);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.phone || 'N/A', col2X + 16, py + 10.5);

    // Col 3
    const col3X = margin + 120;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Date & Time:', col3X, py + 4.5);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.date, col3X + 19, py + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Ref. Doctor:', col3X, py + 10.5);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    const drText = invoice.drName ? `${invoice.drName}` : invoice.drCode;
    doc.text(drText.length > 22 ? drText.slice(0, 20) + '...' : drText, col3X + 19, py + 10.5);

    // Items Table Header
    let ty = py + 16;
    doc.setFillColor(76, 29, 149);
    doc.rect(margin, ty, contentWidth, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('#', margin + 3, ty + 4);
    doc.text('Investigation / Service Description', margin + 12, ty + 4);
    doc.text('Department', margin + 120, ty + 4);
    doc.text('Amount (BDT)', pageWidth - margin - 3, ty + 4, { align: 'right' });

    // Items rows
    ty += 5.5;
    const maxItemsToShow = 6;
    const displayedItems = invoice.items.slice(0, maxItemsToShow);
    const rowHeight = 4.8;

    displayedItems.forEach((it, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 252);
        doc.rect(margin, ty, contentWidth, rowHeight, 'F');
      }
      doc.setDrawColor(230, 230, 235);
      doc.rect(margin, ty, contentWidth, rowHeight, 'D');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);
      doc.text(`${idx + 1}`, margin + 3, ty + 3.4);

      doc.setTextColor(20, 20, 25);
      doc.setFont('helvetica', 'bold');
      const itemTitle = it.testName.length > 55 ? it.testName.slice(0, 52) + '...' : it.testName;
      doc.text(itemTitle, margin + 12, ty + 3.4);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(it.category || 'Clinical', margin + 120, ty + 3.4);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(`Tk ${it.price.toFixed(2)}`, pageWidth - margin - 3, ty + 3.4, { align: 'right' });

      ty += rowHeight;
    });

    if (invoice.items.length > maxItemsToShow) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(120, 120, 120);
      doc.text(`+ ${invoice.items.length - maxItemsToShow} more tests listed on records`, margin + 12, ty + 3.5);
      ty += 4;
    }

    // Financial Calculation Summary Box
    let sy = ty + 1.5;
    const summaryBoxWidth = 62;
    const summaryBoxX = pageWidth - margin - summaryBoxWidth;

    // Left Note
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(90, 90, 90);
    doc.text('* Please present this original slip during lab report delivery.', margin + 2, sy + 4);
    doc.text(`* Method: ${invoice.paymentMethod || 'Cash'} | Issued by: Cashier Terminal`, margin + 2, sy + 8);
    doc.text(`* Contact: ${clinic.phone} | Web: ${clinic.email || 'adibahospital.com'}`, margin + 2, sy + 12);

    // Right Summary table
    doc.setFillColor(248, 248, 252);
    doc.rect(summaryBoxX, sy, summaryBoxWidth, 20, 'F');
    doc.setDrawColor(210, 210, 220);
    doc.rect(summaryBoxX, sy, summaryBoxWidth, 20, 'D');

    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text('Subtotal:', summaryBoxX + 2, sy + 4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text(`Tk ${invoice.subtotal.toFixed(2)}`, summaryBoxX + summaryBoxWidth - 2, sy + 4, { align: 'right' });

    if (invoice.discountAmount > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(22, 101, 52);
      doc.text(`Discount (${invoice.discountPercent}%):`, summaryBoxX + 2, sy + 8);
      doc.setFont('helvetica', 'bold');
      doc.text(`-Tk ${invoice.discountAmount.toFixed(2)}`, summaryBoxX + summaryBoxWidth - 2, sy + 8, { align: 'right' });
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(76, 29, 149);
    doc.text('Net Payable:', summaryBoxX + 2, sy + 12);
    doc.text(`Tk ${invoice.netTotal.toFixed(2)}`, summaryBoxX + summaryBoxWidth - 2, sy + 12, { align: 'right' });

    doc.setTextColor(22, 101, 52);
    doc.text('Paid Amount:', summaryBoxX + 2, sy + 16);
    doc.text(`Tk ${invoice.paidAmount.toFixed(2)}`, summaryBoxX + summaryBoxWidth - 2, sy + 16, { align: 'right' });

    doc.setTextColor(invoice.dueAmount > 0 ? 185 : 80, invoice.dueAmount > 0 ? 28 : 80, invoice.dueAmount > 0 ? 28 : 80);
    doc.text('Due Amount:', summaryBoxX + 2, sy + 19.5);
    doc.text(`Tk ${invoice.dueAmount.toFixed(2)}`, summaryBoxX + summaryBoxWidth - 2, sy + 19.5, { align: 'right' });

    // Signature lines
    let sigY = sy + 25;
    doc.setDrawColor(160, 160, 160);
    doc.line(margin + 10, sigY, margin + 48, sigY);
    doc.line(pageWidth - margin - 48, sigY, pageWidth - margin - 10, sigY);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(70, 70, 70);
    doc.text('Prepared By (Cashier)', margin + 15, sigY + 3.5);
    doc.text('Authorized Signature', pageWidth - margin - 45, sigY + 3.5);
  };

  // 1) Render Top Slip: Office / Clinic Record Copy (Y = 8 to 135)
  renderSingleSlip(8, true);

  // 2) Render Middle Scissor / Divider Line
  doc.setDrawColor(160, 160, 175);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(margin, 146, pageWidth - margin, 146);
  doc.setLineDashPattern([], 0); // reset

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(140, 140, 150);
  doc.text(
    '- - - - - - - - - - [ ✂ TEAR / CUT HERE FOR PATIENT COPY ] - - - - - - - - - -',
    pageWidth / 2,
    145.5,
    { align: 'center' }
  );

  // 3) Render Bottom Slip: Patient / Customer Original Copy (Y = 153 to 280)
  renderSingleSlip(153, false);

  window.dispatchEvent(
    new CustomEvent('medicare-print-record', {
      detail: {
        documentType: 'BILLING_INVOICE',
        documentTitle: `Cash Memo #${invoice.invoiceNo}`,
        documentId: invoice.invoiceNo,
        pId: invoice.pId,
        patientName: invoice.patientName,
        actionType: autoDownload ? 'PDF_DOWNLOAD' : 'PRINT',
        snapshotSummary: `Net: BDT ${invoice.netTotal}, Paid: BDT ${invoice.paidAmount}, Due: BDT ${invoice.dueAmount}`,
      },
    })
  );

  if (autoDownload) {
    doc.save(`CashMemo_${invoice.invoiceNo}_${invoice.patientName.replace(/\s+/g, '_')}.pdf`);
  }

  return doc;
};

/**
 * Automatically triggers browser print dialogue for a given jsPDF document
 * using an invisible iframe to prevent disrupting the user's current UI.
 */
export const printPdfBlob = (doc: jsPDF): void => {
  try {
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          window.print();
        }
      }, 250);
    };
  } catch {
    window.print();
  }
};

/**
 * Generates an official A4 Prescription PDF and optionally triggers automatic print dialogue
 */
export const generatePrescriptionPdf = (
  rx: Prescription,
  doctor?: Doctor,
  clinic?: ClinicConfig,
  options?: {
    padMode?: boolean;
    autoPrint?: boolean;
    autoDownload?: boolean;
  }
): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const padMode = options?.padMode || false;

  let y = margin;

  // 1. Header (if not Pad Mode)
  if (!padMode && clinic) {
    // Clinic Brand Strip
    doc.setFillColor(76, 29, 149); // #4c1d95
    doc.rect(margin, y, pageWidth - margin * 2, 2.5, 'F');
    y += 7;

    // Clinic Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(59, 7, 100);
    doc.text(clinic.clinicName.toUpperCase(), pageWidth / 2, y, { align: 'center' });
    y += 5;

    // Tagline & Contact
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    doc.text(clinic.tagline, pageWidth / 2, y, { align: 'center' });
    y += 4.5;
    doc.text(`${clinic.address}  |  Phone: ${clinic.phone}`, pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.text(`Govt Reg No: ${clinic.regNo}  |  Email: ${clinic.email || 'info@adibahospital.com'}`, pageWidth / 2, y, { align: 'center' });
    y += 4;

    doc.setDrawColor(200, 200, 220);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  } else if (padMode) {
    // Blank margin for pre-printed letterhead pad
    y = 48;
  }

  // 2. Doctor Information & OPD Details
  const docName = doctor?.name || rx.doctorName || 'Medical Officer';
  const docDegree = doctor?.degree || 'MBBS, BCS (Health)';
  const docSpecialty = doctor?.specialty || 'General Physician';
  const docRoom = doctor?.roomNo ? `Room: ${doctor.roomNo}` : 'OPD Chamber';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 27, 75);
  doc.text(`Dr. ${docName}`, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(70, 70, 70);
  doc.text(`Date: ${rx.date || new Date().toLocaleDateString('en-GB')}`, pageWidth - margin, y, { align: 'right' });
  y += 4.5;

  doc.text(docDegree, margin, y);
  doc.text(`Rx ID: ${rx.id}`, pageWidth - margin, y, { align: 'right' });
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(91, 33, 182);
  doc.text(docSpecialty, margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 70, 70);
  doc.text(docRoom, pageWidth - margin, y, { align: 'right' });
  y += 6;

  // 3. Patient Demographic Info Ribbon Box
  const pBoxY = y;
  const pBoxHeight = 16;
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, pBoxY, pageWidth - margin * 2, pBoxHeight, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(margin, pBoxY, pageWidth - margin * 2, pBoxHeight, 'D');

  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  // Line 1: Name, PID, Age, Sex
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Name:', margin + 3, pBoxY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.text(rx.patientName, margin + 26, pBoxY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.text('PID:', margin + 85, pBoxY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.text(rx.pId || 'N/A', margin + 94, pBoxY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Age / Sex:', margin + 130, pBoxY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${rx.age || 'N/A'} / ${rx.sex || 'N/A'}`, margin + 150, pBoxY + 5.5);

  // Line 2: Phone & Doctor Visit Date
  if (rx.phone) {
    doc.setFont('helvetica', 'bold');
    doc.text('Phone:', margin + 3, pBoxY + 11.5);
    doc.setFont('helvetica', 'normal');
    doc.text(rx.phone, margin + 26, pBoxY + 11.5);
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Department:', margin + 85, pBoxY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.text('OPD Clinical Chamber', margin + 110, pBoxY + 11.5);

  y = pBoxY + pBoxHeight + 6;

  // 4. Two-Column Layout (Left: Vitals, Complaints, Diagnosis, Tests | Right: Rx, Medicines, Advice)
  const leftColWidth = 52;
  const dividerX = margin + leftColWidth;
  const rightColX = dividerX + 5;
  const rightColWidth = pageWidth - margin - rightColX;

  // Vertical Separator Line
  const colStartY = y;
  const colEndY = pageHeight - 38;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(dividerX, colStartY, dividerX, colEndY);

  // --- LEFT COLUMN CONTENT ---
  let leftY = colStartY;

  // Vitals & Clinical Observations
  if (rx.clinicalObservations) {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, leftY, leftColWidth - 3, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('CLINICAL VITALS', margin + 2, leftY + 3.6);
    leftY += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const vitalsLines = rx.clinicalObservations.split(/,\s*/);
    vitalsLines.forEach((line) => {
      doc.text(`• ${line}`, margin + 2, leftY);
      leftY += 4;
    });
    leftY += 3;
  }

  // Chief Complaints
  if (rx.chiefComplaints) {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, leftY, leftColWidth - 3, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('CHIEF COMPLAINTS', margin + 2, leftY + 3.6);
    leftY += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const complaintsLines = doc.splitTextToSize(rx.chiefComplaints, leftColWidth - 5);
    doc.text(complaintsLines, margin + 2, leftY);
    leftY += complaintsLines.length * 4 + 3;
  }

  // Clinical Diagnosis
  if (rx.diagnosis) {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, leftY, leftColWidth - 3, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('DIAGNOSIS', margin + 2, leftY + 3.6);
    leftY += 7;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    const diagLines = doc.splitTextToSize(rx.diagnosis, leftColWidth - 5);
    doc.text(diagLines, margin + 2, leftY);
    leftY += diagLines.length * 4 + 4;
  }

  // Advised Investigations
  if (rx.investigations && rx.investigations.length > 0) {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, leftY, leftColWidth - 3, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('INVESTIGATIONS', margin + 2, leftY + 3.6);
    leftY += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    rx.investigations.forEach((t) => {
      const tLines = doc.splitTextToSize(`□ ${t}`, leftColWidth - 5);
      doc.text(tLines, margin + 2, leftY);
      leftY += tLines.length * 4;
    });
    leftY += 3;
  }

  // --- RIGHT COLUMN CONTENT (Rx & Medicines) ---
  let rightY = colStartY;

  // The Big Rx Symbol
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(22);
  doc.setTextColor(59, 7, 100);
  doc.text('Rx', rightColX, rightY + 6);
  rightY += 10;

  // Medicines List
  if (rx.medicines && rx.medicines.length > 0) {
    rx.medicines.forEach((m, idx) => {
      // Medicine Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}.  ${m.name}`, rightColX + 2, rightY);
      rightY += 4.5;

      // Dosage, Instructions & Duration
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const doseText = `       ${m.dosage}   -----   ${m.instruction}   (${m.duration})`;
      doc.text(doseText, rightColX + 2, rightY);
      rightY += 6.5;

      // Dashed separator between medicines
      doc.setDrawColor(241, 245, 249);
      doc.setLineDashPattern([1, 2], 0);
      doc.line(rightColX + 4, rightY - 2, pageWidth - margin - 4, rightY - 2);
      doc.setLineDashPattern([], 0);
    });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('No prescription medications recorded.', rightColX + 4, rightY);
    rightY += 8;
  }

  rightY += 4;

  // Advice Box
  if (rx.advice) {
    doc.setFillColor(254, 252, 232); // amber-50
    const advLines = doc.splitTextToSize(rx.advice, rightColWidth - 8);
    const advBoxHeight = advLines.length * 4 + 7;
    doc.roundedRect(rightColX, rightY, rightColWidth, advBoxHeight, 2, 2, 'F');
    doc.setDrawColor(253, 230, 138);
    doc.roundedRect(rightColX, rightY, rightColWidth, advBoxHeight, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(146, 64, 14); // amber-800
    doc.text('ADVICE / নির্দেশনাবলী:', rightColX + 3, rightY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(advLines, rightColX + 3, rightY + 8.5);

    rightY += advBoxHeight + 4;
  }

  // Follow-up Box
  if (rx.followUp) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(88, 28, 135);
    doc.text(`NEXT FOLLOW-UP:  ${rx.followUp}`, rightColX + 2, rightY + 3);
    rightY += 6;
  }

  // 5. Footer: Signature & Clinic Watermark
  const sigY = pageHeight - 24;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - margin - 50, sigY, pageWidth - margin, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Dr. ${docName}`, pageWidth - margin - 25, sigY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Signature & Seal', pageWidth - margin - 25, sigY + 8, { align: 'center' });

  // System Watermark Notice
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Adiba Hospital Management System · Generated on ${new Date().toLocaleString()} · Not valid for medicolegal claims`,
    margin,
    pageHeight - 10
  );

  window.dispatchEvent(
    new CustomEvent('medicare-print-record', {
      detail: {
        documentType: 'PRESCRIPTION_RX',
        documentTitle: `Prescription Rx (${rx.id})`,
        documentId: rx.id,
        pId: rx.pId || 'N/A',
        patientName: rx.patientName,
        actionType: options?.autoPrint ? 'PRINT' : 'PDF_DOWNLOAD',
        snapshotSummary: `Dr. ${docName} · ${(rx.medicines || []).length} medicines`,
      },
    })
  );

  // Auto actions
  if (options?.autoPrint) {
    doc.autoPrint();
    printPdfBlob(doc);
  }

  return doc;
};

export interface PatientHistoryPdfOptions {
  patient: Patient;
  clinic: ClinicConfig;
  invoices?: Invoice[];
  prescriptions?: Prescription[];
  ecgReports?: EcgReport[];
  xrayReports?: XrayReport[];
  usgReports?: UsgReport[];
  vitals?: any[];
  autoDownload?: boolean;
  autoPrint?: boolean;
}

/**
 * Generates an official Comprehensive Patient Visit and Medical History PDF
 * including demographics, doctor consultations, prescriptions, pathology findings,
 * imaging diagnostics (ECG, X-Ray, USG), and financial billing ledger.
 */
export const generatePatientHistoryPdf = (options: PatientHistoryPdfOptions): jsPDF => {
  const {
    patient,
    clinic,
    invoices = [],
    prescriptions = [],
    ecgReports = [],
    xrayReports = [],
    usgReports = [],
    vitals = [],
    autoDownload = true,
    autoPrint = false,
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let pageNumber = 1;

  const drawPageHeader = (isFirstPage: boolean) => {
    if (isFirstPage) {
      // Clinic Brand Bar
      doc.setFillColor(76, 29, 149); // purple-900
      doc.rect(margin, 10, contentWidth, 2.5, 'F');

      // Clinic Name & Details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(59, 7, 100);
      doc.text(clinic.clinicName.toUpperCase(), pageWidth / 2, 18, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(clinic.tagline, pageWidth / 2, 22.5, { align: 'center' });
      doc.text(
        `${clinic.address}  |  Phone: ${clinic.phone}  |  Govt Reg: ${clinic.regNo}`,
        pageWidth / 2,
        26.5,
        { align: 'center' }
      );

      // Document Title Badge
      doc.setFillColor(88, 28, 135);
      doc.roundedRect(pageWidth / 2 - 70, 30, 140, 7, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text('COMPREHENSIVE PATIENT MEDICAL & VISIT HISTORY', pageWidth / 2, 34.6, {
        align: 'center',
      });
    } else {
      // Running header on page 2+
      doc.setFillColor(243, 232, 255);
      doc.rect(margin, 9, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(88, 28, 135);
      doc.text(
        `${clinic.clinicName} · Medical Record: ${patient.patientName} (PID: ${patient.pId})`,
        margin + 3,
        13.8
      );
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - margin - 3, 13.8, {
        align: 'right',
      });
    }
  };

  const drawPageFooter = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `PID: ${patient.pId} · Confidential Medical Record · Page ${pageNumber}`,
      margin,
      pageHeight - 8
    );
    doc.text(
      `Adiba Healthcare Management System · ${new Date().toLocaleString('en-GB')}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: 'right' }
    );
  };

  let y = 41;
  drawPageHeader(true);

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 22) {
      drawPageFooter();
      doc.addPage('a4', 'portrait');
      pageNumber++;
      drawPageHeader(false);
      y = 20;
    }
  };

  const drawSectionHeader = (title: string, countStr?: string) => {
    checkPageBreak(12);
    doc.setFillColor(238, 242, 255);
    doc.roundedRect(margin, y, contentWidth, 6.5, 1, 1, 'F');
    doc.setDrawColor(199, 210, 254);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 6.5, 1, 1, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(67, 56, 202);
    doc.text(title, margin + 3, y + 4.5);

    if (countStr) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(99, 102, 241);
      doc.text(countStr, pageWidth - margin - 3, y + 4.5, { align: 'right' });
    }
    y += 9;
  };

  // 1. Patient Demographics & Profile Box
  const pBoxY = y;
  const pBoxHeight = 22;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, pBoxY, contentWidth, pBoxHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, pBoxY, contentWidth, pBoxHeight, 1.5, 1.5, 'D');

  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);

  // Left Col
  doc.setFont('helvetica', 'bold');
  doc.text('Hospital PID:', margin + 4, pBoxY + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(88, 28, 135);
  doc.text(patient.pId, margin + 28, pBoxY + 5.5);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Name:', margin + 4, pBoxY + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(patient.patientName, margin + 28, pBoxY + 11);

  doc.setFont('helvetica', 'bold');
  doc.text('Age / Gender:', margin + 4, pBoxY + 16.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${patient.age || 'N/A'}  /  ${patient.sex || 'N/A'}`, margin + 28, pBoxY + 16.5);

  // Middle Col
  const midColX = margin + 70;
  doc.setFont('helvetica', 'bold');
  doc.text('Phone No:', midColX, pBoxY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.text(patient.phone || 'N/A', midColX + 22, pBoxY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Ref. Doctor:', midColX, pBoxY + 11);
  doc.setFont('helvetica', 'normal');
  const drText = patient.drName ? `Dr. ${patient.drName} (${patient.drCode})` : patient.drCode || 'General';
  doc.text(doc.splitTextToSize(drText, 45), midColX + 22, pBoxY + 11);

  doc.setFont('helvetica', 'bold');
  doc.text('Address:', midColX, pBoxY + 16.5);
  doc.setFont('helvetica', 'normal');
  doc.text(patient.address || 'Dhaka, Bangladesh', midColX + 22, pBoxY + 16.5);

  // Right Col: Summary Totals
  const rightColX = margin + 130;
  const totalBilled = invoices.reduce((sum, inv) => sum + (inv.netTotal || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalDue = invoices.reduce((sum, inv) => sum + (inv.dueAmount || 0), 0);

  doc.setFont('helvetica', 'bold');
  doc.text('First Reg Date:', rightColX, pBoxY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.text(patient.billDate || patient.invDate || new Date().toLocaleDateString('en-GB'), rightColX + 24, pBoxY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Consultations:', rightColX, pBoxY + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${prescriptions.length} visits`, rightColX + 24, pBoxY + 11);

  doc.setFont('helvetica', 'bold');
  doc.text('Due Balance:', rightColX, pBoxY + 16.5);
  if (totalDue > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text(`BDT ${totalDue} (Due)`, rightColX + 24, pBoxY + 16.5);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52);
    doc.text('BDT 0 (Paid)', rightColX + 24, pBoxY + 16.5);
  }

  y = pBoxY + pBoxHeight + 6;

  // 2. Doctor Consultations & Prescriptions Section
  drawSectionHeader('1. DOCTOR CONSULTATIONS & PRESCRIPTIONS', `${prescriptions.length} Recorded Visits`);

  if (prescriptions.length === 0) {
    checkPageBreak(8);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('No prescription consultations recorded for this patient.', margin + 4, y);
    y += 7;
  } else {
    prescriptions.forEach((rx, rxIdx) => {
      checkPageBreak(28);

      // Card Header
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, contentWidth, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(
        `Visit #${rxIdx + 1} · Date: ${rx.date || 'N/A'} · Doctor: ${rx.doctorName || 'Consultant Physician'}`,
        margin + 3,
        y + 4.2
      );

      y += 8;

      // Complaints & Diagnosis
      if (rx.chiefComplaints || rx.diagnosis) {
        checkPageBreak(10);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        if (rx.chiefComplaints) {
          doc.text(`Chief Complaints: `, margin + 3, y);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(15, 23, 42);
          doc.text(rx.chiefComplaints, margin + 32, y);
          y += 4.5;
        }
        if (rx.diagnosis) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(71, 85, 105);
          doc.text(`Diagnosis: `, margin + 3, y);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(185, 28, 28);
          doc.text(rx.diagnosis, margin + 32, y);
          y += 5;
        }
      }

      // Prescribed Medicines Table
      if (rx.medicines && rx.medicines.length > 0) {
        checkPageBreak(8 + rx.medicines.length * 5);
        doc.setFillColor(248, 250, 252);
        doc.rect(margin + 2, y, contentWidth - 4, 5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        doc.text('Medicine / Rx Drug', margin + 5, y + 3.5);
        doc.text('Dosage', margin + 70, y + 3.5);
        doc.text('Instruction', margin + 110, y + 3.5);
        doc.text('Duration', margin + 150, y + 3.5);
        y += 5;

        rx.medicines.forEach((med, mIdx) => {
          checkPageBreak(5.5);
          doc.setDrawColor(241, 245, 249);
          doc.line(margin + 2, y + 4.5, pageWidth - margin - 2, y + 4.5);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(15, 23, 42);
          doc.text(`${mIdx + 1}. ${med.name}`, margin + 5, y + 3.5);

          doc.setFont('helvetica', 'normal');
          doc.text(med.dosage || '-', margin + 70, y + 3.5);
          doc.text(med.instruction || '-', margin + 110, y + 3.5);
          doc.text(med.duration || '-', margin + 150, y + 3.5);
          y += 5;
        });
      }

      // Advice / Follow-up
      if (rx.advice || rx.followUp) {
        checkPageBreak(6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        const adviceParts: string[] = [];
        if (rx.advice) adviceParts.push(`Advice: ${rx.advice}`);
        if (rx.followUp) adviceParts.push(`Follow-up: ${rx.followUp}`);
        doc.text(adviceParts.join('  |  '), margin + 4, y + 3);
        y += 6;
      }

      y += 3;
    });
  }

  // 3. Diagnostic & Pathology Test Results Section
  const testResults = patient.testResults || [];
  drawSectionHeader('2. DIAGNOSTIC LABORATORY & PATHOLOGY TESTS', `${testResults.length} Parameters`);

  if (testResults.length === 0) {
    checkPageBreak(8);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('No pathology test results recorded for this patient.', margin + 4, y);
    y += 7;
  } else {
    // Pathology Table Header
    checkPageBreak(8);
    doc.setFillColor(76, 29, 149); // purple-900
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('Test Parameter', margin + 4, y + 4.2);
    doc.text('Observed Result', margin + 80, y + 4.2);
    doc.text('Unit', margin + 115, y + 4.2);
    doc.text('Normal Reference Range', margin + 138, y + 4.2);
    y += 6;

    testResults.forEach((tr, trIdx) => {
      checkPageBreak(6);
      if (trIdx % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, y, contentWidth, 5.5, 'F');
      }
      doc.setDrawColor(229, 231, 235);
      doc.line(margin, y + 5.5, pageWidth - margin, y + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(17, 24, 39);
      doc.text(tr.testName, margin + 4, y + 4);

      // Result with highlight
      doc.setFont('helvetica', 'bold');
      if (tr.status === 'High') {
        doc.setTextColor(220, 38, 38);
      } else if (tr.status === 'Low') {
        doc.setTextColor(37, 99, 235);
      } else {
        doc.setTextColor(17, 24, 39);
      }
      doc.text(tr.result || 'Pending', margin + 80, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      doc.text(tr.unit || '-', margin + 115, y + 4);
      doc.text(tr.normalRange || '-', margin + 138, y + 4);
      y += 5.5;
    });

    if (patient.comments) {
      checkPageBreak(8);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Lab Remarks: ${patient.comments}`, margin + 4, y + 4);
      y += 7;
    }
  }

  // 4. Specialized Imaging Investigations (ECG, X-Ray, USG)
  const totalImaging = ecgReports.length + xrayReports.length + usgReports.length;
  if (totalImaging > 0) {
    drawSectionHeader('3. SPECIALIZED IMAGING & DIAGNOSTIC STUDIES', `${totalImaging} Reports`);

    // ECG
    ecgReports.forEach((ecg) => {
      checkPageBreak(16);
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(margin, y, contentWidth, 14, 1, 1, 'F');
      doc.setDrawColor(254, 202, 202);
      doc.roundedRect(margin, y, contentWidth, 14, 1, 1, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(153, 27, 27);
      doc.text(`12-Lead ECG Tracing · Date: ${ecg.date} · HR: ${ecg.heartRate} bpm · Rhythm: ${ecg.rhythm}`, margin + 3, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`PR Interval: ${ecg.prInterval}  |  QRS: ${ecg.qrsDuration}  |  QT: ${ecg.qtInterval}  |  ST: ${ecg.stSegment}`, margin + 3, y + 8.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`Cardiologist Impression: ${ecg.impression || 'Normal sinus rhythm'}`, margin + 3, y + 12);
      y += 16;
    });

    // X-Ray
    xrayReports.forEach((xray) => {
      checkPageBreak(16);
      doc.setFillColor(240, 253, 250);
      doc.roundedRect(margin, y, contentWidth, 14, 1, 1, 'F');
      doc.setDrawColor(153, 246, 228);
      doc.roundedRect(margin, y, contentWidth, 14, 1, 1, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(17, 94, 89);
      doc.text(`Digital X-Ray: ${xray.investigation || 'Chest X-Ray PA'} · Date: ${xray.date}`, margin + 3, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`Lungs: ${xray.lungFields}  |  Heart Size: ${xray.heartSize}  |  Bony Cage: ${xray.bonyCage}`, margin + 3, y + 8.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`Radiologist Impression: ${xray.impression || 'No active lung lesion detected'}`, margin + 3, y + 12);
      y += 16;
    });

    // USG
    usgReports.forEach((usg) => {
      checkPageBreak(16);
      doc.setFillColor(245, 243, 255);
      doc.roundedRect(margin, y, contentWidth, 14, 1, 1, 'F');
      doc.setDrawColor(221, 214, 254);
      doc.roundedRect(margin, y, contentWidth, 14, 1, 1, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(91, 33, 182);
      doc.text(`Ultrasound Study: ${usg.scanType || 'Whole Abdomen USG'} · Date: ${usg.date}`, margin + 3, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`Liver: ${usg.liver}  |  Kidneys: ${usg.kidneys}  |  Gallbladder: ${usg.gallBladder}`, margin + 3, y + 8.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`Sonologist Impression: ${usg.impression || 'Normal abdominal sonogram'}`, margin + 3, y + 12);
      y += 16;
    });
  }

  // 5. Billing Ledger & Financial History
  drawSectionHeader('4. BILLING & FINANCIAL TRANSACTION LEDGER', `${invoices.length} Invoices`);

  if (invoices.length === 0) {
    checkPageBreak(8);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('No billing invoice records found for this patient.', margin + 4, y);
    y += 7;
  } else {
    checkPageBreak(8);
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('Invoice No', margin + 4, y + 4.2);
    doc.text('Date', margin + 32, y + 4.2);
    doc.text('Billed Test Items / Services', margin + 60, y + 4.2);
    doc.text('Net Total', margin + 125, y + 4.2);
    doc.text('Paid', margin + 148, y + 4.2);
    doc.text('Due', margin + 168, y + 4.2);
    y += 6;

    invoices.forEach((inv, invIdx) => {
      checkPageBreak(6);
      if (invIdx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 5.5, 'F');
      }
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + 5.5, pageWidth - margin, y + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(inv.invoiceNo, margin + 4, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.text(inv.date, margin + 32, y + 4);

      const itemsStr = inv.items?.map((it) => it.testName).join(', ') || 'Diagnostic tests';
      const truncatedItems = itemsStr.length > 36 ? itemsStr.substring(0, 34) + '...' : itemsStr;
      doc.text(truncatedItems, margin + 60, y + 4);

      doc.setFont('helvetica', 'bold');
      doc.text(`BDT ${inv.netTotal}`, margin + 125, y + 4);

      doc.setTextColor(22, 101, 52);
      doc.text(`BDT ${inv.paidAmount}`, margin + 148, y + 4);

      if (inv.dueAmount > 0) {
        doc.setTextColor(220, 38, 38);
        doc.text(`BDT ${inv.dueAmount}`, margin + 168, y + 4);
      } else {
        doc.setTextColor(100, 116, 139);
        doc.text(`BDT 0`, margin + 168, y + 4);
      }

      y += 5.5;
    });

    // Ledger Summary Box
    checkPageBreak(9);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y + 1.5, contentWidth, 7, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(`LEDGER TOTAL:`, margin + 4, y + 6);
    doc.text(`Billed: BDT ${totalBilled}`, margin + 70, y + 6);
    doc.setTextColor(22, 101, 52);
    doc.text(`Paid: BDT ${totalPaid}`, margin + 115, y + 6);
    if (totalDue > 0) {
      doc.setTextColor(220, 38, 38);
      doc.text(`Net Outstanding Due: BDT ${totalDue}`, margin + 145, y + 6);
    } else {
      doc.setTextColor(22, 101, 52);
      doc.text(`Balance Cleared (BDT 0)`, margin + 145, y + 6);
    }
    y += 12;
  }

  // 6. Clinical Vitals History (if available)
  if (vitals && vitals.length > 0) {
    drawSectionHeader('5. CLINICAL VITALS OBSERVATIONS', `${vitals.length} Recorded Readings`);
    checkPageBreak(8);
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Date / Time', margin + 4, y + 3.8);
    doc.text('Blood Pressure (BP)', margin + 45, y + 3.8);
    doc.text('Pulse (bpm)', margin + 95, y + 3.8);
    doc.text('Temperature (°F)', margin + 125, y + 3.8);
    doc.text('SpO2 (%)', margin + 158, y + 3.8);
    y += 5.5;

    vitals.forEach((v: any, vIdx: number) => {
      checkPageBreak(5.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${v.date} ${v.time || ''}`, margin + 4, y + 3.8);
      doc.text(`${v.systolic}/${v.diastolic} mmHg`, margin + 45, y + 3.8);
      doc.text(`${v.pulse} bpm`, margin + 95, y + 3.8);
      doc.text(`${v.temperature} °F`, margin + 125, y + 3.8);
      doc.text(v.spO2 ? `${v.spO2}%` : '-', margin + 158, y + 3.8);
      y += 5.5;
    });
    y += 4;
  }

  // 7. Official Signatures & Hospital Authorization Block
  checkPageBreak(28);
  y += 4;
  const sigY = y + 14;

  // Left Signature
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(margin + 10, sigY, margin + 65, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(clinic.labInCharge || 'Medical Records Officer', margin + 37.5, sigY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Prepared & Verified By', margin + 37.5, sigY + 7.5, { align: 'center' });

  // Center Seal placeholder
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(pageWidth / 2 - 20, sigY - 12, 40, 18, 2, 2, 'D');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Official Hospital Seal', pageWidth / 2, sigY - 2, { align: 'center' });

  // Right Signature
  doc.line(pageWidth - margin - 65, sigY, pageWidth - margin - 10, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(clinic.pathologistName || 'Medical Director / Superintendent', pageWidth - margin - 37.5, sigY + 4, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Medical In-Charge', pageWidth - margin - 37.5, sigY + 7.5, { align: 'center' });

  // Draw final page footer
  drawPageFooter();

  window.dispatchEvent(
    new CustomEvent('medicare-print-record', {
      detail: {
        documentType: 'PATIENT_HISTORY',
        documentTitle: `Medical History (${patient.pId})`,
        documentId: `HIST-${patient.pId}`,
        pId: patient.pId,
        patientName: patient.patientName,
        actionType: autoPrint ? 'PRINT' : 'PDF_DOWNLOAD',
        snapshotSummary: `Full Medical Dossier · ${invoices.length} Invoices · ${prescriptions.length} Rx`,
      },
    })
  );

  // Auto actions
  if (autoPrint) {
    doc.autoPrint();
    printPdfBlob(doc);
  }

  if (autoDownload) {
    const safeName = patient.patientName.replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`Medical_History_${patient.pId}_${safeName}.pdf`);
  }

  return doc;
};

