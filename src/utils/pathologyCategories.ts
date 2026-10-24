import { TestResultItem } from '../types';

export interface LabCategoryDef {
  id: string;
  nameBn: string;
  nameEn: string;
  departmentBn: string;
  departmentEn: string;
  defaultSampleBn: string;
  defaultSampleEn: string;
  badgeBg: string;
  badgeText: string;
  headerBg: string;
}

const CUSTOM_CATEGORIES_KEY = 'medicare_clinic_v1_custom_lab_categories';

export const DEFAULT_LAB_CATEGORIES: LabCategoryDef[] = [
  {
    id: 'Hematology',
    nameBn: 'A. হেমাটোলজি (Hematology)',
    nameEn: 'A. Hematology',
    departmentBn: 'হেমাটোলজি ও ব্লাড প্যাথলজি বিভাগ',
    departmentEn: 'DEPARTMENT OF HEMATOLOGY & COAGULATION',
    defaultSampleBn: 'ইডিটিএ হোল ব্লাড / সাইট্রেটেড প্লাজমা',
    defaultSampleEn: 'EDTA Whole Blood / Citrated Plasma',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700',
    badgeText: 'text-rose-800 dark:text-rose-300',
    headerBg: 'from-rose-900 to-red-950',
  },
  {
    id: 'Biochemistry',
    nameBn: 'B. ক্লিনিক্যাল বায়োকেমিস্ট্রি',
    nameEn: 'B. Clinical Biochemistry',
    departmentBn: 'ক্লিনিক্যাল বায়োকেমিস্ট্রি বিভাগ',
    departmentEn: 'DEPARTMENT OF CLINICAL BIOCHEMISTRY',
    defaultSampleBn: 'সিরাম / ফ্লুরাইড প্লাজমা',
    defaultSampleEn: 'Clotted Blood (Serum) / Fluoride Plasma',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    headerBg: 'from-emerald-900 to-teal-950',
  },
  {
    id: 'Hormone',
    nameBn: 'C. হরমোন ও ইমিউনোঅ্যাসে',
    nameEn: 'C. Hormone & Immunoassay',
    departmentBn: 'হরমোন, এন্ডোক্রাইনোলজি ও ইমিউনোঅ্যাসে বিভাগ',
    departmentEn: 'DEPARTMENT OF HORMONE & IMMUNOASSAY',
    defaultSampleBn: 'সিরাম (ফাস্টিং / টাইমড নমুনা)',
    defaultSampleEn: 'Serum (CLIA / ECLIA)',
    badgeBg: 'bg-pink-100 dark:bg-pink-950/40 border-pink-300 dark:border-pink-700',
    badgeText: 'text-pink-800 dark:text-pink-300',
    headerBg: 'from-pink-900 to-purple-950',
  },
  {
    id: 'Serology',
    nameBn: 'D. সেরোলজি ও ইমিউনোলজি',
    nameEn: 'D. Serology & Immunology',
    departmentBn: 'সেরোলজি ও ইমিউনোলজি বিভাগ',
    departmentEn: 'DEPARTMENT OF SEROLOGY & IMMUNOLOGY',
    defaultSampleBn: 'সিরাম / প্লাজমা',
    defaultSampleEn: 'Serum / Plasma',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700',
    badgeText: 'text-blue-800 dark:text-blue-300',
    headerBg: 'from-blue-900 to-cyan-950',
  },
  {
    id: 'Clinical Pathology',
    nameBn: 'E. ক্লিনিক্যাল প্যাথলজি (ইউরিন/স্টুল/বডি ফ্লুইড)',
    nameEn: 'E. Clinical Pathology',
    departmentBn: 'ক্লিনিক্যাল প্যাথলজি ও বডি ফ্লুইড বিভাগ',
    departmentEn: 'DEPARTMENT OF CLINICAL PATHOLOGY & BODY FLUIDS',
    defaultSampleBn: 'ইউরিন / স্টুল / সিমেন / বডি ফ্লুইড',
    defaultSampleEn: 'Urine / Stool / Semen / Body Fluid',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700',
    badgeText: 'text-amber-800 dark:text-amber-300',
    headerBg: 'from-amber-900 to-yellow-950',
  },
  {
    id: 'Microbiology',
    nameBn: 'F. মাইক্রোবায়োলজি',
    nameEn: 'F. Microbiology',
    departmentBn: 'মাইক্রোবায়োলজি ও কালচার সেনসিটিভিটি বিভাগ',
    departmentEn: 'DEPARTMENT OF MICROBIOLOGY & CULTURE',
    defaultSampleBn: 'স্টেরাইল স্পেসিমেন / সোয়াব / ব্লাড / ইউরিন',
    defaultSampleEn: 'Sterile Specimen / Swab / Culture Media',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-700',
    badgeText: 'text-cyan-800 dark:text-cyan-300',
    headerBg: 'from-cyan-900 to-blue-950',
  },
  {
    id: 'Special Tests',
    nameBn: 'G. বিশেষ পরীক্ষা (Special Tests & Tumor Markers)',
    nameEn: 'G. Special Tests',
    departmentBn: 'বিশেষায়িত ইমিউনোলজি, টিউমার মার্কার ও টক্সিকোলজি বিভাগ',
    departmentEn: 'DEPARTMENT OF SPECIALIZED DIAGNOSTICS & TUMOR MARKERS',
    defaultSampleBn: 'সিরাম / ট্রেস এলিমেন্ট ব্লাড',
    defaultSampleEn: 'Serum / Specialized Specimen',
    badgeBg: 'bg-violet-100 dark:bg-violet-950/40 border-violet-300 dark:border-violet-700',
    badgeText: 'text-violet-800 dark:text-violet-300',
    headerBg: 'from-violet-900 to-indigo-950',
  },
  {
    id: 'Urine',
    nameBn: 'ইউরিন আর/ই (Urine R/E)',
    nameEn: 'Urine Examination (Clinical Pathology)',
    departmentBn: 'ক্লিনিক্যাল প্যাথলজি (ইউরিন পরীক্ষা বিভাগ)',
    departmentEn: 'CLINICAL PATHOLOGY (URINE EXAMINATION REPORT)',
    defaultSampleBn: 'ইউরিন (মিডস্ট্রিম ফ্রেশ নমুনা)',
    defaultSampleEn: 'Midstream Clean Catch Urine',
    badgeBg: 'bg-teal-100 dark:bg-teal-950/40 border-teal-300 dark:border-teal-700',
    badgeText: 'text-teal-800 dark:text-teal-300',
    headerBg: 'from-teal-900 to-emerald-950',
  },
  {
    id: 'Stool',
    nameBn: 'স্টুল আর/ই (Stool R/E)',
    nameEn: 'Stool Examination (Clinical Pathology)',
    departmentBn: 'ক্লিনিক্যাল প্যাথলজি (মল পরীক্ষা বিভাগ)',
    departmentEn: 'CLINICAL PATHOLOGY (STOOL EXAMINATION)',
    defaultSampleBn: 'ফ্রেশ স্টুল নমুনা',
    defaultSampleEn: 'Fresh Stool Specimen',
    badgeBg: 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700',
    badgeText: 'text-stone-800 dark:text-stone-300',
    headerBg: 'from-stone-900 to-neutral-950',
  },
  {
    id: 'CBC',
    nameBn: 'সিবিসি (CBC)',
    nameEn: 'Complete Blood Count (CBC)',
    departmentBn: 'হেমাটোলজি বিভাগ (সিবিসি পূর্ণাঙ্গ রক্ত পরীক্ষা)',
    departmentEn: 'DEPARTMENT OF HEMATOLOGY (CBC REPORT)',
    defaultSampleBn: 'ইডিটিএ হোল ব্লাড',
    defaultSampleEn: 'EDTA Whole Blood (Fresh)',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700',
    badgeText: 'text-purple-800 dark:text-purple-300',
    headerBg: 'from-purple-900 to-indigo-950',
  },
];

export function getCustomLabCategories(): LabCategoryDef[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomLabCategories(cats: LabCategoryDef[]): void {
  try {
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(cats));
  } catch {
    // ignore storage errors
  }
}

export function getAllLabCategories(): LabCategoryDef[] {
  const custom = getCustomLabCategories();
  const existingIds = new Set(DEFAULT_LAB_CATEGORIES.map((c) => c.id.toLowerCase()));
  const merged = [...DEFAULT_LAB_CATEGORIES];
  custom.forEach((c) => {
    if (!existingIds.has(c.id.toLowerCase())) {
      merged.push(c);
    }
  });
  return merged;
}

export const LAB_CATEGORIES: LabCategoryDef[] = DEFAULT_LAB_CATEGORIES;

export function getCategoryDef(categoryId?: string): LabCategoryDef {
  const allCats = getAllLabCategories();
  if (!categoryId) return allCats[1]; // default Biochemistry
  const clean = categoryId.trim().toLowerCase();

  const found = allCats.find(
    (c) =>
      c.id.toLowerCase() === clean ||
      c.nameEn.toLowerCase() === clean ||
      c.nameBn.toLowerCase() === clean
  );

  if (found) return found;

  if (clean.includes('special') || clean.includes('tumor') || clean.includes('বিশেষ')) {
    return allCats.find((c) => c.id === 'Special Tests')!;
  }
  if (clean.includes('clinical') || clean.includes('fluid') || clean.includes('semen')) {
    return allCats.find((c) => c.id === 'Clinical Pathology')!;
  }
  if (clean.includes('bio') || clean.includes('chem') || clean.includes('বায়ো')) {
    return allCats.find((c) => c.id === 'Biochemistry')!;
  }
  if (clean.includes('cbc') || clean.includes('সিবিসি')) {
    return allCats.find((c) => c.id === 'CBC')!;
  }
  if (clean.includes('urin') || clean.includes('ইউরিন')) {
    return allCats.find((c) => c.id === 'Urine')!;
  }
  if (clean.includes('horm') || clean.includes('thyroid') || clean.includes('immunoassay') || clean.includes('হরমোন')) {
    return allCats.find((c) => c.id === 'Hormone')!;
  }
  if (clean.includes('sero') || clean.includes('সেরো') || clean.includes('immun')) {
    return allCats.find((c) => c.id === 'Serology')!;
  }
  if (clean.includes('hema') || clean.includes('হেমা')) {
    return allCats.find((c) => c.id === 'Hematology')!;
  }
  if (clean.includes('micro') || clean.includes('মাইক্রো')) {
    return allCats.find((c) => c.id === 'Microbiology')!;
  }
  if (clean.includes('stool') || clean.includes('স্টুল')) {
    return allCats.find((c) => c.id === 'Stool')!;
  }

  return {
    id: categoryId,
    nameBn: categoryId,
    nameEn: categoryId,
    departmentBn: `${categoryId} বিভাগ`,
    departmentEn: `DEPARTMENT OF ${categoryId.toUpperCase()}`,
    defaultSampleBn: 'ক্লিনিক্যাল নমুনা',
    defaultSampleEn: 'Clinical Specimen',
    badgeBg: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700',
    badgeText: 'text-slate-800 dark:text-slate-300',
    headerBg: 'from-slate-900 to-gray-950',
  };
}

export function detectTestCategory(testName: string, existingCategory?: string): string {
  if (existingCategory && existingCategory.trim()) {
    const matched = getCategoryDef(existingCategory);
    return matched.id;
  }

  const name = testName.trim().toLowerCase();

  if (
    name.includes('urine') ||
    name.includes('ইউরিন') ||
    name.includes('pus cell') ||
    name.includes('epithelial') ||
    name.includes('u_re') ||
    name.includes('r/m/e') ||
    name.includes('albumin / protein') ||
    name.includes('specific gravity')
  ) {
    return 'Urine';
  }

  if (
    name.includes('semen') ||
    name.includes('csf') ||
    name.includes('synovial') ||
    name.includes('pleural') ||
    name.includes('ascitic') ||
    name.includes('body fluid')
  ) {
    return 'Clinical Pathology';
  }

  if (
    name.includes('psa') ||
    name.includes('cea') ||
    name.includes('ca-125') ||
    name.includes('ca 19-9') ||
    name.includes('afp') ||
    name.includes('immunoglobulin') ||
    name.includes('complement c') ||
    name.includes('heavy metal') ||
    name.includes('lead') ||
    name.includes('arsenic')
  ) {
    return 'Special Tests';
  }

  if (
    name.includes('cbc') ||
    name.includes('complete blood count') ||
    name.includes('differential') ||
    name.includes('neutrophil') ||
    name.includes('lymphocyte') ||
    name.includes('monocyte') ||
    name.includes('eosinophil') ||
    name.includes('basophil') ||
    name.includes('pcv') ||
    name.includes('mcv') ||
    name.includes('mch') ||
    name.includes('mchc') ||
    name.includes('rdw') ||
    name.includes('platelet count') ||
    name.includes('total wbc') ||
    name.includes('total rbc')
  ) {
    return 'CBC';
  }

  if (
    name.includes('tsh') ||
    name.includes('thyroid') ||
    name.includes('ft3') ||
    name.includes('ft4') ||
    name.includes('hormone') ||
    name.includes('prolactin') ||
    name.includes('fsh') ||
    name.includes('lh') ||
    name.includes('estradiol') ||
    name.includes('progesterone') ||
    name.includes('testosterone') ||
    name.includes('hcg') ||
    name.includes('cortisol') ||
    name.includes('insulin') ||
    name.includes('pth') ||
    name.includes('anti-tpo') ||
    name.includes('amh') ||
    name.includes('হরমোন')
  ) {
    return 'Hormone';
  }

  if (
    name.includes('widal') ||
    name.includes('hbsag') ||
    name.includes('dengue') ||
    name.includes('vdrl') ||
    name.includes('aso') ||
    name.includes('ra factor') ||
    name.includes('rheumatoid') ||
    name.includes('ana') ||
    name.includes('dsdna') ||
    name.includes('hcv') ||
    name.includes('hiv') ||
    name.includes('malaria') ||
    name.includes('chikungunya') ||
    name.includes('typhoid') ||
    name.includes('pylori') ||
    name.includes('covid') ||
    name.includes('troponin') ||
    name.includes('serology')
  ) {
    return 'Serology';
  }

  if (name.includes('stool') || name.includes('মল') || name.includes('ova') || name.includes('cyst') || name.includes('occult blood')) {
    return 'Stool';
  }

  if (
    name.includes('culture') ||
    name.includes('sensitivity') ||
    name.includes('gram stain') ||
    name.includes('afb') ||
    name.includes('koh') ||
    name.includes('fungal') ||
    name.includes('microbiology')
  ) {
    return 'Microbiology';
  }

  if (
    name.includes('hemoglobin') ||
    name.includes('hb') ||
    name.includes('esr') ||
    name.includes('bleeding time') ||
    name.includes('clotting time') ||
    name.includes('prothrombin') ||
    name.includes('pt/inr') ||
    name.includes('aptt') ||
    name.includes('d-dimer') ||
    name.includes('reticulocyte') ||
    name.includes('blood group') ||
    name.includes('electrophoresis') ||
    name.includes('pbf') ||
    name.includes('hematology')
  ) {
    return 'Hematology';
  }

  return 'Biochemistry';
}

export interface CategoryGroup {
  category: LabCategoryDef;
  tests: TestResultItem[];
}

export function groupTestsByCategory(tests: TestResultItem[]): CategoryGroup[] {
  const map = new Map<string, TestResultItem[]>();

  tests.forEach((t) => {
    const catId = detectTestCategory(t.testName, t.category);
    if (!map.has(catId)) {
      map.set(catId, []);
    }
    map.get(catId)!.push({ ...t, category: catId });
  });

  const result: CategoryGroup[] = [];
  const order = [
    'Hematology',
    'CBC',
    'Biochemistry',
    'Hormone',
    'Serology',
    'Clinical Pathology',
    'Urine',
    'Stool',
    'Microbiology',
    'Special Tests',
  ];

  order.forEach((catId) => {
    if (map.has(catId) && map.get(catId)!.length > 0) {
      result.push({
        category: getCategoryDef(catId),
        tests: map.get(catId)!,
      });
      map.delete(catId);
    }
  });

  map.forEach((items, catId) => {
    if (items.length > 0) {
      result.push({
        category: getCategoryDef(catId),
        tests: items,
      });
    }
  });

  return result;
}

// Preset tests categorized by lab department for quick selection (without any fake pre-filled values)
export const CATEGORIZED_PRESETS: Record<
  string,
  Array<{ name: string; unit: string; normalRange: string; price: number; method?: string }>
> = {
  Hematology: [
    { name: 'Hemoglobin (Hb)', unit: 'g/dL', normalRange: 'M: 13.5 - 17.5, F: 12.0 - 16.0', price: 150, method: 'SLS-Hb' },
    { name: 'ESR (Westergren)', unit: 'mm in 1st hr', normalRange: 'M: 0 - 15, F: 0 - 20', price: 150, method: 'Modified Westergren' },
    { name: 'Total WBC Count', unit: '/cumm', normalRange: '4000 - 11000', price: 200, method: 'Flow Cytometry' },
    { name: 'Platelet Count', unit: '/cumm', normalRange: '150000 - 450000', price: 200, method: 'Impedance & Optical' },
    { name: 'Reticulocyte Count', unit: '%', normalRange: '0.5 - 2.5', price: 350, method: 'Supravital Stain' },
    { name: 'Absolute Eosinophil Count (AEC)', unit: 'cells/cumm', normalRange: '40 - 440', price: 250, method: 'Flow Cytometry' },
    { name: 'Prothrombin Time (PT/INR)', unit: 'Seconds / INR', normalRange: 'PT: 11-14s, INR: 0.8-1.2', price: 600, method: 'Coagulometry' },
    { name: 'APTT', unit: 'Seconds', normalRange: '25.0 - 35.0', price: 750, method: 'Coagulometry' },
    { name: 'D-Dimer', unit: 'ng/mL FEU', normalRange: '< 500', price: 1200, method: 'Immunoassay' },
  ],
  Biochemistry: [
    { name: 'Fasting Blood Glucose (FBS)', unit: 'mmol/L', normalRange: '3.9 - 6.0', price: 150, method: 'Hexokinase' },
    { name: 'Random Blood Glucose (RBS)', unit: 'mmol/L', normalRange: '3.9 - 7.8', price: 150, method: 'Hexokinase' },
    { name: 'Blood Glucose 2h After Meal (2HABF)', unit: 'mmol/L', normalRange: '4.0 - 7.8', price: 150, method: 'Hexokinase' },
    { name: 'HbA1c', unit: '%', normalRange: '4.5 - 5.6 (Normal)', price: 800, method: 'HPLC' },
    { name: 'Serum Creatinine', unit: 'mg/dL', normalRange: 'M: 0.7 - 1.3, F: 0.5 - 1.1', price: 350, method: 'Enzymatic' },
    { name: 'Blood Urea', unit: 'mg/dL', normalRange: '15 - 45', price: 300, method: 'Urease-GLDH' },
    { name: 'Serum Uric Acid', unit: 'mg/dL', normalRange: 'M: 3.5 - 7.2, F: 2.6 - 6.0', price: 350, method: 'Uricase-POD' },
    { name: 'SGPT / ALT', unit: 'U/L', normalRange: 'M: 10 - 45, F: 7 - 34', price: 350, method: 'IFCC Kinetic' },
    { name: 'SGOT / AST', unit: 'U/L', normalRange: '10 - 38', price: 350, method: 'IFCC Kinetic' },
    { name: 'Alkaline Phosphatase (ALP)', unit: 'U/L', normalRange: '40 - 130', price: 400, method: 'p-NPP Kinetic' },
    { name: 'CRP (Quantitative)', unit: 'mg/L', normalRange: '0.0 - 6.0', price: 500, method: 'Immunoturbidimetry' },
    { name: 'Procalcitonin (PCT)', unit: 'ng/mL', normalRange: '0.00 - 0.50', price: 2200, method: 'CLIA' },
    { name: 'LDH', unit: 'U/L', normalRange: '135 - 225', price: 600, method: 'UV Kinetic' },
  ],
  Hormone: [
    { name: 'TSH', unit: 'µIU/mL', normalRange: '0.35 - 4.94', price: 600, method: 'CLIA' },
    { name: 'Free T4 (FT4)', unit: 'ng/dL', normalRange: '0.70 - 1.48', price: 700, method: 'CLIA' },
    { name: 'Free T3 (FT3)', unit: 'pg/mL', normalRange: '1.71 - 3.71', price: 700, method: 'CLIA' },
    { name: 'Serum Prolactin', unit: 'ng/mL', normalRange: 'M: 4.0 - 15.2, F: 4.8 - 23.3', price: 800, method: 'CLIA' },
    { name: 'Beta-hCG', unit: 'mIU/mL', normalRange: '< 5.0 (Non-Pregnant)', price: 900, method: 'CLIA' },
    { name: 'Testosterone (Total)', unit: 'ng/dL', normalRange: 'M: 280 - 800, F: 15 - 70', price: 1000, method: 'CLIA' },
    { name: 'Estradiol (E2)', unit: 'pg/mL', normalRange: '21 - 251', price: 1100, method: 'CLIA' },
    { name: 'Progesterone', unit: 'ng/mL', normalRange: '0.1 - 27.0', price: 1100, method: 'CLIA' },
    { name: 'Cortisol (Morning)', unit: 'µg/dL', normalRange: '5.0 - 23.0', price: 1100, method: 'CLIA' },
    { name: 'Fasting Insulin', unit: 'µIU/mL', normalRange: '2.6 - 24.9', price: 1200, method: 'CLIA' },
    { name: 'Intact PTH', unit: 'pg/mL', normalRange: '15.0 - 65.0', price: 1600, method: 'CLIA' },
    { name: 'Anti-TPO', unit: 'IU/mL', normalRange: '0.0 - 34.0', price: 1300, method: 'CLIA' },
    { name: 'AMH', unit: 'ng/mL', normalRange: '1.0 - 4.0', price: 2400, method: 'ECLIA' },
  ],
  Serology: [
    { name: 'HBsAg', unit: 'Qualitative', normalRange: 'Negative (Non-Reactive)', price: 350, method: 'ICT / ELISA' },
    { name: 'Anti-HCV', unit: 'Qualitative', normalRange: 'Negative (Non-Reactive)', price: 550, method: 'ICT / ELISA' },
    { name: 'HIV 1 & 2 Screening', unit: 'Qualitative', normalRange: 'Negative (Non-Reactive)', price: 500, method: '4th Gen ICT / ELISA' },
    { name: 'VDRL / RPR', unit: 'Qualitative', normalRange: 'Non-Reactive', price: 250, method: 'RPR Flocculation' },
    { name: 'ASO Titre', unit: 'IU/mL', normalRange: '0 - 200', price: 450, method: 'Immunoturbidimetry' },
    { name: 'Rheumatoid Factor (RF)', unit: 'IU/mL', normalRange: '0 - 14', price: 400, method: 'Immunoturbidimetry' },
    { name: 'Troponin-I', unit: 'ng/mL', normalRange: '0.00 - 0.04', price: 1000, method: 'CLIA' },
    { name: 'Dengue NS1 Antigen', unit: 'Qualitative', normalRange: 'Negative', price: 450, method: 'ICT / ELISA' },
    { name: 'H. pylori Antigen/Antibody', unit: 'Qualitative', normalRange: 'Negative', price: 600, method: 'ICT' },
  ],
  'Clinical Pathology': [
    { name: 'Semen Sperm Concentration', unit: 'million/mL', normalRange: '16 - 200 (>= 16)', price: 600, method: 'WHO 6th Ed Microscopy' },
    { name: 'CSF Total Protein', unit: 'mg/dL', normalRange: '15 - 45', price: 500, method: 'Pyrogallol Red' },
    { name: 'Pleural Fluid ADA', unit: 'U/L', normalRange: '0 - 40', price: 700, method: 'Enzymatic' },
    { name: 'Ascitic Fluid PMN Count', unit: 'cells/cumm', normalRange: '0 - 250', price: 500, method: 'Microscopy' },
  ],
  Microbiology: [
    { name: 'Urine Culture & Sensitivity', unit: 'CFU/mL', normalRange: 'No significant bacterial growth', price: 700, method: 'CLED Agar & CLSI AST' },
    { name: 'Blood Culture & Sensitivity', unit: 'Culture', normalRange: 'Sterile after 5 days incubation', price: 1200, method: 'Automated BACTEC' },
    { name: 'Gram Stain', unit: 'Microscopy', normalRange: 'No bacteria seen', price: 250, method: 'Gram Stain (1000x)' },
    { name: 'AFB Smear', unit: 'Microscopy', normalRange: 'Negative for AFB', price: 300, method: 'Ziehl-Neelsen Stain' },
    { name: 'KOH Preparation', unit: 'Microscopy', normalRange: 'No fungal elements seen', price: 250, method: '10% KOH Mount' },
  ],
  'Special Tests': [
    { name: 'Total PSA', unit: 'ng/mL', normalRange: '0.0 - 4.0', price: 1000, method: 'CLIA' },
    { name: 'CEA', unit: 'ng/mL', normalRange: '0.0 - 3.0', price: 1200, method: 'CLIA' },
    { name: 'CA-125', unit: 'U/mL', normalRange: '0.0 - 35.0', price: 1300, method: 'CLIA' },
    { name: 'CA 19-9', unit: 'U/mL', normalRange: '0.0 - 37.0', price: 1400, method: 'CLIA' },
    { name: 'AFP', unit: 'ng/mL', normalRange: '0.0 - 8.5', price: 1200, method: 'CLIA' },
  ],
};
