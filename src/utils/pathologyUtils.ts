import { TestResultItem, InvoiceItem, LabTest, PathologyFlagStatus } from '../types';
import { PATHOLOGY_MASTER_TEMPLATES } from '../data/pathologyMasterCatalog';

export type PathologyDepartmentKey =
  | 'hematology'
  | 'biochemistry'
  | 'hormone'
  | 'serology'
  | 'urine'
  | 'microbiology'
  | 'special'
  | 'other';

export interface PathologyDepartmentConfig {
  key: PathologyDepartmentKey;
  order: number;
  nameEn: string;
  nameBn: string;
  reportTitleEn: string;
  reportTitleBn: string;
  sampleTypeEn: string;
  sampleTypeBn: string;
  badgeColor: string;
}

export const PATHOLOGY_DEPARTMENTS: Record<PathologyDepartmentKey, PathologyDepartmentConfig> = {
  hematology: {
    key: 'hematology',
    order: 1,
    nameEn: 'Hematology & Coagulation',
    nameBn: 'হেমাটোলজি বিভাগ',
    reportTitleEn: 'HEMATOLOGY & COAGULATION INVESTIGATION REPORT',
    reportTitleBn: 'হেমাটোলজি টেস্ট রিপোর্ট',
    sampleTypeEn: 'EDTA Whole Blood / Citrated Plasma',
    sampleTypeBn: 'ইডিটিএ হোল ব্লাড / সাইট্রেটেড প্লাজমা',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300',
  },
  biochemistry: {
    key: 'biochemistry',
    order: 2,
    nameEn: 'Clinical Biochemistry',
    nameBn: 'বায়োকেমিস্ট্রি বিভাগ',
    reportTitleEn: 'CLINICAL BIOCHEMISTRY INVESTIGATION REPORT',
    reportTitleBn: 'বায়োকেমিস্ট্রি টেস্ট রিপোর্ট',
    sampleTypeEn: 'Fluoride Plasma / Serum',
    sampleTypeBn: 'ফ্লুরাইড প্লাজমা / সিরাম',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300',
  },
  hormone: {
    key: 'hormone',
    order: 3,
    nameEn: 'Hormone & Immunoassay',
    nameBn: 'হরমোন ও ইমিউনোঅ্যাসে বিভাগ',
    reportTitleEn: 'HORMONE & ENDOCRINOLOGY IMMUNOASSAY REPORT',
    reportTitleBn: 'হরমোন ও ইমিউনোঅ্যাসে রিপোর্ট',
    sampleTypeEn: 'Serum (CLIA / ECLIA)',
    sampleTypeBn: 'সিরাম (হরমোন নমুনা)',
    badgeColor: 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-950/50 dark:text-pink-300',
  },
  serology: {
    key: 'serology',
    order: 4,
    nameEn: 'Serology & Immunology',
    nameBn: 'সেরোলজি ও ইমিউনোলজি বিভাগ',
    reportTitleEn: 'SEROLOGY & IMMUNOLOGY INVESTIGATION REPORT',
    reportTitleBn: 'সেরোলজি ও ইমিউনোলজি রিপোর্ট',
    sampleTypeEn: 'Serum / Plasma',
    sampleTypeBn: 'সিরাম / প্লাজমা',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-300',
  },
  urine: {
    key: 'urine',
    order: 5,
    nameEn: 'Clinical Pathology (Urine / Stool / Fluids)',
    nameBn: 'ক্লিনিক্যাল প্যাথলজি (ইউরিন/স্টুল/বডি ফ্লুইড)',
    reportTitleEn: 'CLINICAL PATHOLOGY & MICROSCOPIC EXAMINATION REPORT',
    reportTitleBn: 'ক্লিনিক্যাল প্যাথলজি রিপোর্ট',
    sampleTypeEn: 'Clean Catch Urine / Stool / Body Fluid',
    sampleTypeBn: 'ইউরিন / স্টুল / বডি ফ্লুইড',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/50 dark:text-teal-300',
  },
  microbiology: {
    key: 'microbiology',
    order: 6,
    nameEn: 'Microbiology & Culture',
    nameBn: 'মাইক্রোবায়োলজি ও কালচার বিভাগ',
    reportTitleEn: 'MICROBIOLOGY & ANTIMICROBIAL SENSITIVITY REPORT',
    reportTitleBn: 'মাইক্রোবায়োলজি ও কালচার সেনসিটিভিটি রিপোর্ট',
    sampleTypeEn: 'Sterile Specimen / Swab / Culture Media',
    sampleTypeBn: 'স্টেরাইল স্পেসিমেন / কালচার মিডিয়া',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/50 dark:text-cyan-300',
  },
  special: {
    key: 'special',
    order: 7,
    nameEn: 'Special Tests & Tumor Markers',
    nameBn: 'বিশেষ পরীক্ষা ও টিউমার মার্কার বিভাগ',
    reportTitleEn: 'SPECIALIZED DIAGNOSTICS & TUMOR MARKER REPORT',
    reportTitleBn: 'বিশেষ পরীক্ষা ও টিউমার মার্কার রিপোর্ট',
    sampleTypeEn: 'Serum / Specialized Specimen',
    sampleTypeBn: 'সিরাম / বিশেষায়িত নমুনা',
    badgeColor: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950/50 dark:text-violet-300',
  },
  other: {
    key: 'other',
    order: 8,
    nameEn: 'General Pathology',
    nameBn: 'সাধারণ প্যাথলজি বিভাগ',
    reportTitleEn: 'PATHOLOGY INVESTIGATION REPORT',
    reportTitleBn: 'প্যাথলজি টেস্ট রিপোর্ট',
    sampleTypeEn: 'Clinical Specimen',
    sampleTypeBn: 'ক্লিনিক্যাল নমুনা',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/50 dark:text-purple-300',
  },
};

export function classifyTestItem(item: TestResultItem): PathologyDepartmentKey {
  const name = (item.testName || '').toLowerCase().trim();
  const unit = (item.unit || '').toLowerCase().trim();
  const category = (item.category || '').toLowerCase().trim();

  if (category.includes('microbiol') || name.includes('culture') || name.includes('sensitivity') || name.includes('gram stain') || name.includes('afb') || name.includes('koh')) {
    return 'microbiology';
  }

  if (
    category.includes('special') ||
    name.includes('psa') ||
    name.includes('cea') ||
    name.includes('ca-125') ||
    name.includes('ca 19-9') ||
    name.includes('afp') ||
    name.includes('immunoglobulin') ||
    name.includes('complement c') ||
    name.includes('heavy metal') ||
    name.includes('blood lead')
  ) {
    return 'special';
  }

  if (
    category.includes('horm') ||
    category.includes('immunoassay') ||
    name.includes('tsh') ||
    name.includes('ft3') ||
    name.includes('ft4') ||
    name.includes('triiodothyronine') ||
    name.includes('thyroxine') ||
    name.includes('fsh') ||
    name.includes('luteinizing') ||
    name.includes('prolactin') ||
    name.includes('estradiol') ||
    name.includes('progesterone') ||
    name.includes('testosterone') ||
    name.includes('beta-hcg') ||
    name.includes('cortisol') ||
    name.includes('insulin') ||
    name.includes('pth') ||
    name.includes('anti-tpo') ||
    name.includes('amh')
  ) {
    return 'hormone';
  }

  const isUrineOrClinical =
    category.includes('urin') ||
    category.includes('stool') ||
    category.includes('clinical pathology') ||
    unit.includes('/hpf') ||
    unit.includes('/lpf') ||
    [
      'urine',
      'pus cell',
      'epithelial',
      'specific gravity',
      'casts',
      'crystals',
      'albumin / protein',
      'sugar / glucose',
      'urobilinogen',
      'bile salt',
      'ketone bod',
      'color & appearance',
      'stool',
      'occult blood',
      'helminth',
      'protozoa',
      'semen',
      'sperm',
      'liquefaction',
      'csf',
      'synovial',
      'pleural',
      'ascitic',
    ].some((kw) => name.includes(kw));

  if (isUrineOrClinical) {
    return 'urine';
  }

  const isBiochem =
    category.includes('biochem') ||
    [
      'rbs',
      'fbs',
      '2habf',
      'blood sugar',
      'blood glucose',
      'glucose',
      'hba1c',
      'creatinine',
      'urea',
      'bun',
      'uric acid',
      'sgpt',
      'alt',
      'sgot',
      'ast',
      'bilirubin',
      'lipid',
      'cholesterol',
      'triglyceride',
      'hdl',
      'ldl',
      'vldl',
      'electrolyte',
      'sodium',
      'potassium',
      'chloride',
      'bicarbonate',
      'calcium',
      'magnesium',
      'phosphorus',
      'alkaline phosphatase',
      'alp',
      'amylase',
      'lipase',
      'total protein',
      'serum albumin',
      'serum globulin',
      'a/g ratio',
      'ldh',
      'procalcitonin',
      'serum iron',
      'ferritin',
      'tibc',
      'transferrin',
      'vitamin d',
      'vitamin b12',
    ].some((kw) => name.includes(kw));

  if (isBiochem) {
    return 'biochemistry';
  }

  const isHematology =
    category.includes('hematol') ||
    category.includes('cbc') ||
    [
      'cbc',
      'hemoglobin',
      'hb',
      'esr',
      'wbc',
      'neutrophil',
      'lymphocyte',
      'monocyte',
      'eosinophil',
      'basophil',
      'platelet',
      'rbc',
      'pcv',
      'hematocrit',
      'mcv',
      'mch',
      'mchc',
      'rdw',
      'blood film',
      'pbf',
      'reticulocyte',
      'prothrombin',
      'pt/inr',
      'inr',
      'aptt',
      'd-dimer',
      'blood group',
      'rh (d)',
      'electrophoresis',
    ].some((kw) => name.includes(kw));

  if (isHematology) {
    return 'hematology';
  }

  const isSerology =
    category.includes('serol') ||
    category.includes('immun') ||
    [
      'widal',
      'typhi',
      'hbsag',
      'anti-hcv',
      'hcv',
      'hiv',
      'vdrl',
      'rpr',
      'dengue',
      'crp',
      'ra factor',
      'rheumatoid',
      'aso',
      'ana',
      'dsdna',
      'chikungunya',
      'malaria',
      'plasmodium',
      'troponin',
      'pylori',
      'covid',
    ].some((kw) => name.includes(kw));

  if (isSerology) {
    return 'serology';
  }

  return 'other';
}

export interface ClassifiedDepartmentPage {
  departmentKey: PathologyDepartmentKey;
  departmentConfig: PathologyDepartmentConfig;
  tests: TestResultItem[];
  pageIndex: number;
}

export function groupTestsByDepartment(
  testResults: TestResultItem[],
  splitPages: boolean = true
): ClassifiedDepartmentPage[] {
  if (!testResults || testResults.length === 0) {
    return [
      {
        departmentKey: 'other',
        departmentConfig: PATHOLOGY_DEPARTMENTS.other,
        tests: [],
        pageIndex: 1,
      },
    ];
  }

  if (!splitPages) {
    return [
      {
        departmentKey: 'other',
        departmentConfig: {
          ...PATHOLOGY_DEPARTMENTS.other,
          nameEn: 'Comprehensive Pathology & Clinical Diagnostic',
          nameBn: 'সম্মিলিত প্যাথলজি ও ডায়াগনস্টিক রিপোর্ট',
          reportTitleEn: 'CLINICAL PATHOLOGY & DIAGNOSTIC REPORT',
          reportTitleBn: 'প্যাথলজি ও ডায়াগনস্টিক রিপোর্ট',
          sampleTypeEn: 'Blood / Urine / Clinical Specimen',
          sampleTypeBn: 'রক্ত / মূত্র / ক্লিনিক্যাল নমুনা',
        },
        tests: testResults,
        pageIndex: 1,
      },
    ];
  }

  const map = new Map<PathologyDepartmentKey, TestResultItem[]>();

  testResults.forEach((item) => {
    const dept = classifyTestItem(item);
    if (!map.has(dept)) {
      map.set(dept, []);
    }
    map.get(dept)!.push(item);
  });

  const departmentOrder: PathologyDepartmentKey[] = [
    'hematology',
    'biochemistry',
    'hormone',
    'serology',
    'urine',
    'microbiology',
    'special',
    'other',
  ];

  const pages: ClassifiedDepartmentPage[] = [];
  let pageNumber = 1;

  for (const deptKey of departmentOrder) {
    const tests = map.get(deptKey);
    if (tests && tests.length > 0) {
      pages.push({
        departmentKey: deptKey,
        departmentConfig: PATHOLOGY_DEPARTMENTS[deptKey],
        tests,
        pageIndex: pageNumber++,
      });
    }
  }

  return pages.length > 0
    ? pages
    : [
        {
          departmentKey: 'other',
          departmentConfig: PATHOLOGY_DEPARTMENTS.other,
          tests: testResults,
          pageIndex: 1,
        },
      ];
}

/**
 * Parses a patient's age string into numeric years (e.g. "25 Y" -> 25, "6 Months" -> 0.5).
 */
export function parsePatientAgeYears(ageStr?: string): number | null {
  if (!ageStr || !ageStr.trim()) return null;
  const clean = ageStr.toLowerCase().trim();
  const numMatch = clean.match(/(\d+(\.\d+)?)/);
  if (!numMatch) return null;
  const val = parseFloat(numMatch[1]);
  if (isNaN(val)) return null;
  if (clean.includes('month') || clean.includes('মাস') || clean.includes('mo')) {
    return val / 12;
  }
  if (clean.includes('day') || clean.includes('দিন')) {
    return val / 365;
  }
  return val;
}

/**
 * Dynamically resolves the appropriate Reference Range string for a parameter
 * based on the patient's Age, Sex, and Pregnancy Status.
 */
export function resolveDynamicReferenceRange(
  item: {
    normalRange: string;
    maleRange?: string;
    femaleRange?: string;
    childRange?: string;
    pregnancyRange?: string;
  },
  patientSex?: string,
  patientAgeStr?: string,
  pregnancyStatus?: string
): string {
  if (
    pregnancyStatus &&
    pregnancyStatus.toLowerCase().includes('pregnant') &&
    !pregnancyStatus.toLowerCase().includes('non-pregnant') &&
    item.pregnancyRange
  ) {
    return item.pregnancyRange;
  }

  const ageYears = parsePatientAgeYears(patientAgeStr);
  if (ageYears !== null && ageYears < 14 && item.childRange) {
    return item.childRange;
  }

  const sexClean = (patientSex || '').toLowerCase();
  if (sexClean === 'male' && item.maleRange) {
    return item.maleRange;
  }
  if (sexClean === 'female' && item.femaleRange) {
    return item.femaleRange;
  }

  return item.normalRange || '';
}

/**
 * Evaluates a user-entered result against the parameter's reference range and critical limits.
 * Never guesses or invents a result. Returns 'Normal' | 'Low' | 'High' | 'Critical'.
 */
export function evaluateResultFlag(
  resultValue: string,
  item: TestResultItem,
  patientSex?: string,
  patientAgeStr?: string,
  pregnancyStatus?: string
): PathologyFlagStatus {
  const valTrimmed = (resultValue || '').trim();
  if (!valTrimmed) return 'Normal';

  const activeRange = resolveDynamicReferenceRange(item, patientSex, patientAgeStr, pregnancyStatus);
  const lowerVal = valTrimmed.toLowerCase();
  const lowerRange = activeRange.toLowerCase();

  // 1. Check Qualitative / Positive-Negative results
  if (
    (lowerVal.includes('positive') && !lowerVal.includes('non')) ||
    (lowerVal.includes('reactive') && !lowerVal.includes('non-reactive') && !lowerVal.includes('non reactive'))
  ) {
    if (lowerRange.includes('negative') || lowerRange.includes('non-reactive')) {
      // Sensitive or critical infections / markers
      const nameLower = (item.testName || '').toLowerCase();
      if (nameLower.includes('troponin') || nameLower.includes('hiv') || nameLower.includes('malaria')) {
        return 'Critical';
      }
      return 'High';
    }
  }

  // 2. Check Numeric results
  const cleanedNumStr = valTrimmed.replace(/,/g, '');
  const numVal = parseFloat(cleanedNumStr);
  if (!isNaN(numVal) && /^-?\d+(\.\d+)?$/.test(cleanedNumStr)) {
    // Check explicit Critical thresholds first
    if (item.criticalLow !== undefined && numVal <= item.criticalLow) {
      return 'Critical';
    }
    if (item.criticalHigh !== undefined && numVal >= item.criticalHigh) {
      return 'Critical';
    }

    // Parse low/high from activeRange string if available (e.g. "13.5 - 17.5" or "< 200" or "> 40")
    const dashMatch = activeRange.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*-\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
    if (dashMatch) {
      const min = parseFloat(dashMatch[1].replace(/,/g, ''));
      const max = parseFloat(dashMatch[2].replace(/,/g, ''));
      if (!isNaN(min) && !isNaN(max)) {
        if (numVal < min) return 'Low';
        if (numVal > max) return 'High';
        return 'Normal';
      }
    }

    const lessMatch = activeRange.match(/<\s*=?\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
    if (lessMatch) {
      const max = parseFloat(lessMatch[1].replace(/,/g, ''));
      if (!isNaN(max)) {
        if (numVal > max) return 'High';
        return 'Normal';
      }
    }

    const greaterMatch = activeRange.match(/>\s*=?\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
    if (greaterMatch) {
      const min = parseFloat(greaterMatch[1].replace(/,/g, ''));
      if (!isNaN(min)) {
        if (numVal < min) return 'Low';
        return 'Normal';
      }
    }

    if (item.lowNormal !== undefined && numVal < item.lowNormal) return 'Low';
    if (item.highNormal !== undefined && numVal > item.highNormal) return 'High';
  }

  return 'Normal';
}

/**
 * Expands a LabTest template into TestResultItem rows with strictly EMPTY results ('')
 * so no fake or imaginary patient results are ever pre-populated.
 */
export function expandLabTestToResultItems(
  test: LabTest,
  patientSex?: string,
  patientAgeStr?: string,
  pregnancyStatus?: string
): TestResultItem[] {
  if (test.subTests && test.subTests.length > 0) {
    return test.subTests.map((st) => {
      const resolvedRange = resolveDynamicReferenceRange(st, patientSex, patientAgeStr, pregnancyStatus);
      return {
        testName: st.name,
        result: '', // Clinical Safety: Never pre-fill fake patient results
        unit: st.unit || '',
        normalRange: resolvedRange || st.normalRange || '',
        status: 'Normal',
        category: test.category,
        method: st.method || test.method || '',
        sampleType: test.sampleType || '',
        inputType: st.inputType || 'numeric',
        options: st.options,
        parentTestCode: test.code,
        parentTestName: test.name,
        maleRange: st.maleRange,
        femaleRange: st.femaleRange,
        childRange: st.childRange,
        pregnancyRange: st.pregnancyRange,
        lowNormal: st.lowNormal,
        highNormal: st.highNormal,
        criticalLow: st.criticalLow,
        criticalHigh: st.criticalHigh,
        isSensitive: test.isSensitive,
        rangeVerified: st.rangeVerified ?? test.rangeVerified ?? false,
      };
    });
  }

  const resolvedRange = resolveDynamicReferenceRange(test, patientSex, patientAgeStr, pregnancyStatus);
  return [
    {
      testName: test.name,
      result: '', // Clinical Safety: Never pre-fill fake patient results
      unit: test.unit || '',
      normalRange: resolvedRange || test.normalRange || '',
      status: 'Normal',
      category: test.category,
      method: test.method || '',
      sampleType: test.sampleType || '',
      inputType: test.inputType || 'numeric',
      options: test.options,
      parentTestCode: test.code,
      parentTestName: test.name,
      maleRange: test.maleRange,
      femaleRange: test.femaleRange,
      childRange: test.childRange,
      pregnancyRange: test.pregnancyRange,
      lowNormal: test.lowNormal,
      highNormal: test.highNormal,
      criticalLow: test.criticalLow,
      criticalHigh: test.criticalHigh,
      isSensitive: test.isSensitive,
      rangeVerified: test.rangeVerified ?? false,
    },
  ];
}

/**
 * Merges PATHOLOGY_MASTER_TEMPLATES with any existing/custom LabTest catalog items.
 */
export function getMergedPathologyCatalog(labCatalog: LabTest[] = []): LabTest[] {
  const map = new Map<string, LabTest>();

  // First load all 80+ ready-made templates from PATHOLOGY_MASTER_TEMPLATES
  PATHOLOGY_MASTER_TEMPLATES.forEach((tmpl) => {
    map.set(tmpl.code.toUpperCase().trim(), tmpl);
  });

  // Overlay custom/modified tests from labCatalog while keeping rich subTests if catalog version lacked them
  labCatalog.forEach((item) => {
    const key = item.code.toUpperCase().trim();
    const master = map.get(key);
    if (master) {
      map.set(key, {
        ...master,
        ...item,
        subTests: item.subTests && item.subTests.length > 0 ? item.subTests : master.subTests,
        method: item.method || master.method,
        sampleType: item.sampleType || master.sampleType,
        turnaroundTime: item.turnaroundTime || master.turnaroundTime,
        inputType: item.inputType || master.inputType,
        options: item.options || master.options,
        isSensitive: item.isSensitive ?? master.isSensitive,
      });
    } else {
      map.set(key, item);
    }
  });

  return Array.from(map.values());
}

/**
 * Converts billed invoice items into formatted clinical test result parameters
 * using the Test Master templates, with empty results ready for verified lab entry.
 */
export function convertInvoiceItemsToTestResults(
  invoiceItems: InvoiceItem[],
  labCatalog: LabTest[] = [],
  patientSex?: string,
  patientAgeStr?: string,
  pregnancyStatus?: string
): TestResultItem[] {
  const results: TestResultItem[] = [];
  const addedNames = new Set<string>();
  const fullCatalog = getMergedPathologyCatalog(labCatalog);

  const appendItems = (items: TestResultItem[]) => {
    items.forEach((item) => {
      const key = `${item.parentTestCode || ''}_${item.testName}`.toLowerCase().trim();
      if (!addedNames.has(key)) {
        addedNames.add(key);
        results.push(item);
      }
    });
  };

  for (const item of invoiceItems) {
    const rawName = (item.testName || '').toLowerCase().trim();
    const rawCode = (item.testId || '').toLowerCase().trim();
    const rawCat = (item.category || '').toLowerCase().trim();

    // Skip non-pathology imaging items (X-Ray / USG / ECG) if present on a combined invoice
    if (rawCat === 'x-ray' || rawCat === 'ultrasound' || rawCat === 'ecg' || rawCode.startsWith('xr_')) {
      continue;
    }

    // 1. Direct match in merged catalog by id, code, or name
    let matchedTemplate = fullCatalog.find(
      (t) =>
        t.id.toLowerCase() === rawCode ||
        t.code.toLowerCase() === rawCode ||
        t.name.toLowerCase() === rawName
    );

    // 2. Fuzzy match by clinical panel keywords if exact match not found
    if (!matchedTemplate) {
      if (rawName.includes('cbc') || rawName.includes('complete blood count')) {
        matchedTemplate = fullCatalog.find((t) => t.code === 'CBC');
      } else if (rawName.includes('urine') && (rawName.includes('r/e') || rawName.includes('r/m/e') || rawName.includes('routine'))) {
        matchedTemplate = fullCatalog.find((t) => t.code === 'U_RE');
      } else if (rawName.includes('stool') && (rawName.includes('r/e') || rawName.includes('routine'))) {
        matchedTemplate = fullCatalog.find((t) => t.code === 'STOOL_RE');
      } else if (rawName.includes('lipid')) {
        matchedTemplate = fullCatalog.find((t) => t.code === 'LIPID');
      } else if (rawName.includes('lft') || rawName.includes('liver function')) {
        matchedTemplate = fullCatalog.find((t) => t.code === 'LFT');
      } else if (rawName.includes('electrolyte')) {
        matchedTemplate = fullCatalog.find((t) => t.code === 'ELECTRO');
      } else if (rawName.includes('widal')) {
        matchedTemplate = fullCatalog.find((t) => t.code === 'WIDAL');
      } else if (rawName.includes('dengue')) {
        matchedTemplate = fullCatalog.find((t) => t.code === 'DENGUE_PANEL');
      } else if (rawName.includes('blood group')) {
        matchedTemplate = fullCatalog.find((t) => t.code === 'BG_RH');
      } else if (rawName.includes('semen')) {
        matchedTemplate = fullCatalog.find((t) => t.code === 'SEMEN');
      } else {
        matchedTemplate = fullCatalog.find(
          (t) =>
            rawName.includes(t.name.toLowerCase()) ||
            t.name.toLowerCase().includes(rawName)
        );
      }
    }

    if (matchedTemplate) {
      appendItems(expandLabTestToResultItems(matchedTemplate, patientSex, patientAgeStr, pregnancyStatus));
    } else {
      appendItems([
        {
          testName: item.testName,
          result: '',
          unit: '',
          normalRange: '',
          status: 'Normal',
          category: item.category || 'Biochemistry',
          inputType: 'text',
        },
      ]);
    }
  }

  return results;
}
