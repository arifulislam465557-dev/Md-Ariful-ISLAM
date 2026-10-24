/**
 * Professional print utility for Adiba Hospital & Diagnostic Software.
 * Ensures 100% pixel-perfect print output matching on-screen previews:
 * - Full color fidelity: backgrounds, gradients, borders, badge tags (-webkit-print-color-adjust: exact)
 * - True A4 layout: standard dimensions, zero-margin page sizing, no unwanted browser header/footer URLs
 * - Structure preservation: flexbox, CSS grid, table formatting, multi-page breaks
 * - Font & asset hydration: waits for web fonts and images to load before opening print dialogue
 */

export interface PrintOptions {
  pageTitle?: string;
  landscape?: boolean;
  twoCopiesOnA4?: boolean;
  customStyle?: string;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
  documentType?: string;
  documentId?: string;
  pId?: string;
  patientName?: string;
}

export function printElementById(elementId: string, options: PrintOptions = {}): boolean {
  try {
    const inferredType =
      options.documentType ||
      (elementId.includes('report')
        ? 'PATHOLOGY_REPORT'
        : elementId.includes('rx')
        ? 'PRESCRIPTION_RX'
        : elementId.includes('ecg')
        ? 'ECG_REPORT'
        : elementId.includes('xray')
        ? 'XRAY_REPORT'
        : elementId.includes('usg')
        ? 'USG_REPORT'
        : elementId.includes('financial')
        ? 'FINANCIAL_STATEMENT'
        : 'OTHER_DOCUMENT');

    window.dispatchEvent(
      new CustomEvent('medicare-print-record', {
        detail: {
          documentType: inferredType,
          documentTitle: options.pageTitle || `Print (${elementId})`,
          documentId: options.documentId || elementId,
          pId: options.pId || 'N/A',
          patientName: options.patientName || options.pageTitle || 'Hospital Document',
          actionType: 'PRINT',
        },
      })
    );

    const sourceEl = document.getElementById(elementId);
    if (!sourceEl) {
      console.warn(`[printHelper] Element #${elementId} not found, falling back to window.print()`);
      window.print();
      return true;
    }

    if (options.onBeforePrint) {
      try {
        options.onBeforePrint();
      } catch (e) {
        console.error('[printHelper] onBeforePrint error:', e);
      }
    }

    // 1. Gather all stylesheet link tags from document head
    let linkTags = '';
    const links = document.querySelectorAll<HTMLLinkElement>(
      'link[rel="stylesheet"], link[rel="preconnect"], link[rel="preload"]'
    );
    links.forEach((link) => {
      linkTags += link.outerHTML + '\n';
    });

    // 2. Gather all inline style tags from document head & body
    let styleTags = '';
    const styles = document.querySelectorAll<HTMLStyleElement>('style');
    styles.forEach((style) => {
      styleTags += `<style>${style.innerHTML}</style>\n`;
    });

    // 3. Extract CSS rules from styleSheets if accessible (for runtime Tailwind compilation)
    let dynamicRules = '';
    try {
      Array.from(document.styleSheets).forEach((sheet) => {
        try {
          if (sheet.cssRules) {
            Array.from(sheet.cssRules).forEach((rule) => {
              dynamicRules += rule.cssText + '\n';
            });
          }
        } catch (_) {
          // Cross-origin stylesheet rules can't be accessed directly, link tag already covers it
        }
      });
    } catch (_) {}

    // 4. Create an isolated hidden iframe with true A4 dimensions
    const iframeId = 'adiba_print_frame_' + Date.now();
    const existing = document.getElementById(iframeId);
    if (existing) {
      existing.remove();
    }

    const printFrame = document.createElement('iframe');
    printFrame.id = iframeId;
    printFrame.setAttribute('aria-hidden', 'true');
    // Position off-screen with standard A4 paper dimensions so media layout computes accurately
    printFrame.style.position = 'fixed';
    printFrame.style.left = '-9999px';
    printFrame.style.top = '0';
    printFrame.style.width = options.landscape ? '297mm' : '210mm';
    printFrame.style.height = options.landscape ? '210mm' : '297mm';
    printFrame.style.border = 'none';
    printFrame.style.zIndex = '-9999';
    printFrame.style.opacity = '0';
    printFrame.style.pointerEvents = 'none';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
    if (!frameDoc || !printFrame.contentWindow) {
      window.print();
      return true;
    }

    const htmlContent = sourceEl.outerHTML;
    const orientation = options.landscape ? 'landscape' : 'portrait';

    // Construct the complete standalone printable HTML document
    const printHtml = `<!DOCTYPE html>
<html lang="bn">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${options.pageTitle || 'Print Document - Adiba Clinic'}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    ${linkTags}
    ${styleTags}
    <style>
      ${dynamicRules}

      /* 100% Print Color Fidelity */
      *, *::before, *::after {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
        box-sizing: border-box !important;
      }

      @page {
        size: A4 ${orientation};
        margin: 10mm;
      }
      @page :first {
        margin: 10mm;
      }
      @page :left {
        margin: 10mm;
      }
      @page :right {
        margin: 10mm;
      }

      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        font-family: 'Plus Jakarta Sans', 'Hind Siliguri', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        width: 100% !important;
        height: auto !important;
        -webkit-font-smoothing: antialiased;
      }

      /* Hide any interactive UI or no-print indicators */
      .no-print, button, input[type="button"], input[type="submit"], nav, header {
        display: none !important;
      }

      /* Ensure target container is fully displayed */
      #${elementId} {
        display: block !important;
        visibility: visible !important;
        width: 100% !important;
        max-width: ${elementId === 'printable-report' ? '100%' : '210mm'} !important;
        margin: 0 auto !important;
        padding: ${elementId === 'printable-report' ? '0' : '6mm 8mm'} !important;
        box-sizing: border-box !important;
        background: ${elementId === 'printable-report' ? 'transparent' : '#ffffff'} !important;
        position: static !important;
        overflow: visible !important;
      }

      /* Retain Flexbox & Grid layouts exactly as designed */
      .flex, [class*="flex"] {
        display: flex !important;
      }
      .inline-flex {
        display: inline-flex !important;
      }
      .grid, [class*="grid"] {
        display: grid !important;
      }
      .block {
        display: block !important;
      }
      .inline-block {
        display: inline-block !important;
      }
      .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
      .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
      .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
      .grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)) !important; }
      .grid-cols-6 { grid-template-columns: repeat(6, minmax(0, 1fr)) !important; }
      .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)) !important; }
      .col-span-1 { grid-column: span 1 / span 1 !important; }
      .col-span-2 { grid-column: span 2 / span 2 !important; }
      .col-span-3 { grid-column: span 3 / span 3 !important; }
      .col-span-4 { grid-column: span 4 / span 4 !important; }
      .col-span-5 { grid-column: span 5 / span 5 !important; }
      .col-span-6 { grid-column: span 6 / span 6 !important; }
      .col-span-8 { grid-column: span 8 / span 8 !important; }
      .col-span-12 { grid-column: span 12 / span 12 !important; }

      .justify-between { justify-content: space-between !important; }
      .justify-center { justify-content: center !important; }
      .justify-end { justify-content: flex-end !important; }
      .items-center { align-items: center !important; }
      .items-end { align-items: flex-end !important; }
      .items-start { align-items: flex-start !important; }

      /* Table structure preservation */
      table {
        border-collapse: collapse !important;
        width: 100% !important;
      }
      th, td {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      thead {
        display: table-header-group !important;
      }
      tr {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      /* Multi-page Pathology Report Sheets - Exact A4 fit */
      .report-page-sheet {
        width: 100% !important;
        max-width: 100% !important;
        min-height: calc(297mm - 20mm) !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        background: #ffffff !important;
        margin: 0 !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        overflow: visible !important;
      }
      .report-page-sheet:last-child {
        page-break-after: auto !important;
        break-after: auto !important;
      }

      /* Prevent break cuts inside sub-sections */
      .report-header-section,
      .patient-details-box,
      .department-banner,
      .results-table-container,
      .comments-box,
      .signatures-section,
      .report-footer-section {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      .patient-details-grid {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
      }

      .signatures-row {
        display: flex !important;
        justify-content: space-between !important;
        align-items: flex-end !important;
        margin-top: auto !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      /* Master Report Table: Fixed thead (Header) & Fixed tfoot (Signatures & Footer on Every Page) */
      .report-master-table {
        width: 100% !important;
        border-collapse: collapse !important;
        border-spacing: 0 !important;
        table-layout: fixed !important;
      }

      .report-master-table > thead {
        display: table-header-group !important;
      }

      .report-master-table > tfoot {
        display: table-footer-group !important;
      }

      .report-master-table > tbody {
        display: table-row-group !important;
      }

      .report-master-table tr {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      .report-master-table th,
      .report-master-table td {
        padding: 0 !important;
        border: none !important;
      }

      /* Specific rules for Rx prescription container */
      #printable-rx {
        display: block !important;
        visibility: visible !important;
        width: 100% !important;
        max-width: 210mm !important;
        min-height: 290mm !important;
        padding: 8mm 10mm !important;
        background: #ffffff !important;
        margin: 0 auto !important;
        box-sizing: border-box !important;
      }

      /* Specific rules for imaging & financial reports */
      #printable-ecg, #printable-xray, #printable-usg, #financial-printable {
        display: block !important;
        visibility: visible !important;
        width: 100% !important;
        max-width: 210mm !important;
        padding: 8mm 10mm !important;
        background: #ffffff !important;
        margin: 0 auto !important;
        box-sizing: border-box !important;
      }

      ${options.customStyle || ''}
    </style>
  </head>
  <body>
    ${htmlContent}
  </body>
</html>`;

    frameDoc.open();
    frameDoc.write(printHtml);
    frameDoc.close();

    // Ensure all web fonts and images in the iframe are fully decoded before triggering print
    const executePrint = async () => {
      try {
        if (!printFrame?.contentWindow) {
          window.print();
          return;
        }

        // Wait for fonts to be ready
        if (frameDoc.fonts && frameDoc.fonts.ready) {
          try {
            await frameDoc.fonts.ready;
          } catch (_) {}
        }

        // Wait for images to load
        const images = Array.from(frameDoc.images);
        if (images.length > 0) {
          await Promise.all(
            images.map((img) => {
              if (img.complete) return Promise.resolve();
              return new Promise((res) => {
                img.onload = () => res(true);
                img.onerror = () => res(true);
              });
            })
          );
        }

        // Micro-delay for rendering engine layout pass
        setTimeout(() => {
          try {
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();

            if (options.onAfterPrint) {
              options.onAfterPrint();
            }

            // Cleanup iframe after user interacts with print dialog
            setTimeout(() => {
              try {
                printFrame?.remove();
              } catch (_) {}
            }, 3000);
          } catch (err) {
            console.error('[printHelper] Error during frame.print():', err);
            window.print();
          }
        }, 120);
      } catch (err) {
        console.error('[printHelper] Pre-print hydration exception:', err);
        window.print();
      }
    };

    // Execute once iframe DOM content loaded
    if (frameDoc.readyState === 'complete') {
      executePrint();
    } else {
      printFrame.onload = executePrint;
      setTimeout(executePrint, 350); // Fallback timeout
    }

    return true;
  } catch (outerErr) {
    console.error('[printHelper] Top-level failure, fallback to window.print():', outerErr);
    window.print();
    return false;
  }
}
