import { LicenseSecurityState, LicenseRenewalRecord } from '../types';

export const MASTER_LICENSE_KEY = 'raidaraha512022#adiba';
export const SUBSCRIPTION_PHONE = '01744465557';
export const TRIAL_DAYS = 7; // সফটওয়্যার ইনস্টল হবার পর প্রথম ৭ দিন সম্পূর্ণ ফ্রি ট্রায়াল
export const QUARTER_DAYS = 90; // ৩ মাস (Quarterly সাবস্ক্রিপশন সাইকেল)
export const WARNING_THRESHOLD_DAYS = 10; // পপ-আপ রিমাইন্ডার শুরুর সময়

export const LICENSE_STORAGE_KEY = 'medicare_clinic_v1_license_security';
const INTERNAL_SALT = 'Adiba_Hospital_Secure_Quarterly_2026_#9901';

// Fast tamper-resistant checksum generator
function generateLicenseSignature(
  installedAt: string,
  currentStart: string,
  expiresAt: string,
  renewals: number,
  isTrial: boolean
): string {
  const payload = `${installedAt}::${currentStart}::${expiresAt}::${renewals}::${isTrial ? 'TRIAL' : 'ACTIVATED'}::${INTERNAL_SALT}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return `SIG-${hash.toString(16).toUpperCase()}-${expiresAt.slice(0, 10)}`;
}

// Check if signature matches
function verifyLicenseSignature(state: {
  installedAt: string;
  currentPeriodStart: string;
  expiresAt: string;
  totalRenewals: number;
  isTrial?: boolean;
  signature?: string;
}): boolean {
  if (!state.signature) return false;
  const expected = generateLicenseSignature(
    state.installedAt,
    state.currentPeriodStart,
    state.expiresAt,
    state.totalRenewals,
    !!state.isTrial
  );
  return state.signature === expected;
}

// Initial fresh installation state: Starts a 7-day free trial from installation moment!
export function createInitialLicenseState(): LicenseSecurityState {
  const now = new Date();
  const installedAt = now.toISOString();
  const currentPeriodStart = now.toISOString();
  const trialExpiresDate = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const trialExpiresAt = trialExpiresDate.toISOString();
  const totalRenewals = 0;
  const signature = generateLicenseSignature(installedAt, currentPeriodStart, trialExpiresAt, totalRenewals, true);

  return {
    isActivated: false,
    isTrial: true,
    installedAt,
    currentPeriodStart,
    trialExpiresAt,
    expiresAt: trialExpiresAt,
    lastCheckedAt: now.toISOString(),
    totalRenewals,
    status: 'trial',
    daysRemaining: TRIAL_DAYS,
    hoursRemaining: TRIAL_DAYS * 24,
    trialDaysRemaining: TRIAL_DAYS,
    trialHoursRemaining: TRIAL_DAYS * 24,
    subscriptionPhone: SUBSCRIPTION_PHONE,
    renewalHistory: [],
    signature,
  };
}

// Load and evaluate current state
export function evaluateLicenseState(): LicenseSecurityState {
  let rawState: any = null;
  try {
    const raw = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (raw) {
      rawState = JSON.parse(raw);
    }
  } catch {
    rawState = null;
  }

  // If no saved state, software is newly installed: grant 7-day free trial!
  if (!rawState) {
    const fresh = createInitialLicenseState();
    saveLicenseState(fresh);
    return fresh;
  }

  const now = new Date();
  const lastChecked = rawState.lastCheckedAt ? new Date(rawState.lastCheckedAt) : now;

  // Protect against system clock rollback cheat (e.g. user set system clock back by > 2 days)
  const isClockTampered = now.getTime() < lastChecked.getTime() - 2 * 24 * 60 * 60 * 1000;

  // Case A: User has NOT entered a paid license key yet (Trial Mode)
  if (rawState.isActivated === false || rawState.status === 'unactivated' || rawState.status === 'trial' || rawState.status === 'trial_expired') {
    // Determine trial expiration timestamp (fallback to 7 days from installedAt or now)
    let trialExpireDate: Date;
    if (rawState.trialExpiresAt) {
      trialExpireDate = new Date(rawState.trialExpiresAt);
    } else if (rawState.installedAt) {
      trialExpireDate = new Date(new Date(rawState.installedAt).getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    } else {
      trialExpireDate = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    }

    const diffMs = trialExpireDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const hoursRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));

    let status: LicenseSecurityState['status'] = 'trial';

    if (isClockTampered) {
      status = 'tampered';
    } else if (diffMs <= 0 || daysRemaining <= 0) {
      // 7-day trial has elapsed! Software must be locked until paid 3-month key is entered!
      status = 'trial_expired';
    } else {
      // 7-day trial is currently running
      status = 'trial';
    }

    const updatedTrial: LicenseSecurityState = {
      ...rawState,
      isActivated: false,
      isTrial: status === 'trial',
      installedAt: rawState.installedAt || now.toISOString(),
      currentPeriodStart: rawState.currentPeriodStart || now.toISOString(),
      trialExpiresAt: trialExpireDate.toISOString(),
      expiresAt: trialExpireDate.toISOString(),
      status,
      daysRemaining,
      hoursRemaining,
      trialDaysRemaining: daysRemaining,
      trialHoursRemaining: hoursRemaining,
      lastCheckedAt: now.toISOString(),
      subscriptionPhone: SUBSCRIPTION_PHONE,
      signature: generateLicenseSignature(
        rawState.installedAt || now.toISOString(),
        rawState.currentPeriodStart || now.toISOString(),
        trialExpireDate.toISOString(),
        rawState.totalRenewals || 0,
        status === 'trial'
      ),
    };

    saveLicenseState(updatedTrial);
    return updatedTrial;
  }

  // Case B: Software has been activated with a paid 3-Month (90 Days) license key
  const isValidSignature = verifyLicenseSignature(rawState);
  const expireTime = new Date(rawState.expiresAt).getTime();
  const currentTime = now.getTime();
  const diffMs = expireTime - currentTime;

  const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));

  let status: LicenseSecurityState['status'] = 'active';

  if (!isValidSignature || isClockTampered) {
    status = 'tampered';
  } else if (diffMs <= 0 || daysRemaining < 0) {
    status = 'expired';
  } else if (daysRemaining <= WARNING_THRESHOLD_DAYS) {
    status = 'warning';
  } else {
    status = 'active';
  }

  const updated: LicenseSecurityState = {
    ...rawState,
    isActivated: true,
    isTrial: false,
    status,
    daysRemaining: Math.max(0, daysRemaining),
    hoursRemaining,
    lastCheckedAt: now.toISOString(),
    subscriptionPhone: SUBSCRIPTION_PHONE,
  };

  saveLicenseState(updated);
  return updated;
}

// Save to persistent storage
export function saveLicenseState(state: LicenseSecurityState): void {
  try {
    localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save license state:', e);
  }
}

// Validate input activation key and activate/renew for 90 days (Quarterly cycle)
export function validateAndRenewLicense(
  inputKey: string,
  workstationCode = 'CURRENT_PC'
): { success: boolean; message?: string; error?: string; updatedState?: LicenseSecurityState } {
  const cleanKey = inputKey.trim();

  // Strict check against hardcoded master license key
  if (cleanKey !== MASTER_LICENSE_KEY) {
    return {
      success: false,
      error: 'ভুল অ্যাক্টিভেশন কি! সঠিক কোড প্রদান করুন অথবা ০১৭৪৪৪৬৫৫৫৭ নম্বরে যোগাযোগ করুন।',
    };
  }

  const current = evaluateLicenseState();
  const now = new Date();
  const prevExpires = new Date(current.expiresAt);

  const wasTrialOrExpired = !current.isActivated || current.status === 'trial' || current.status === 'trial_expired' || current.status === 'expired' || current.status === 'unactivated';

  // If trial, expired, or tampered, renew 90 days from right now.
  // If already active paid subscription, stack 90 days onto the existing expiry date!
  let baseTime = now.getTime();
  if (!wasTrialOrExpired && (current.status === 'active' || current.status === 'warning')) {
    if (prevExpires.getTime() > now.getTime()) {
      baseTime = prevExpires.getTime();
    }
  }

  const newExpiresDate = new Date(baseTime + QUARTER_DAYS * 24 * 60 * 60 * 1000);
  const newExpiresAt = newExpiresDate.toISOString();
  const newPeriodStart = now.toISOString();
  const newRenewals = wasTrialOrExpired ? 1 : (current.totalRenewals || 0) + 1;
  const newSignature = generateLicenseSignature(
    current.installedAt,
    newPeriodStart,
    newExpiresAt,
    newRenewals,
    false
  );

  const newHistoryRecord: LicenseRenewalRecord = {
    id: wasTrialOrExpired ? `activate-${Date.now()}` : `renew-${Date.now()}`,
    renewedAt: now.toISOString(),
    previousExpiresAt: wasTrialOrExpired ? '7_DAY_TRIAL' : current.expiresAt,
    newExpiresAt,
    workstationCode,
  };

  const updatedState: LicenseSecurityState = {
    isActivated: true,
    isTrial: false,
    installedAt: current.installedAt,
    currentPeriodStart: newPeriodStart,
    expiresAt: newExpiresAt,
    lastCheckedAt: now.toISOString(),
    totalRenewals: newRenewals,
    lastRenewedAt: now.toISOString(),
    status: 'active',
    daysRemaining: Math.floor((newExpiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    hoursRemaining: Math.floor((newExpiresDate.getTime() - now.getTime()) / (1000 * 60 * 60)),
    subscriptionPhone: SUBSCRIPTION_PHONE,
    renewalHistory: [newHistoryRecord, ...(current.renewalHistory || []).slice(0, 49)],
    signature: newSignature,
  };

  saveLicenseState(updatedState);

  return {
    success: true,
    message: wasTrialOrExpired
      ? 'অভিনন্দন! আদিবা হাসপাতাল সফটওয়্যার লাইসেন্স কি সফলভাবে সক্রিয় হয়েছে। পরবর্তী ৩ মাসের (৯০ দিন) জন্য সফটওয়্যার সক্রিয় থাকবে।'
      : 'অভিনন্দন! আপনার সফটওয়্যার লাইসেন্স সফলভাবে পরবর্তী ৩ মাসের (৯০ দিন) জন্য নবায়ন করা হয়েছে।',
    updatedState,
  };
}

// Simulation method for Admin / Testing purposes: simulate 90-day subscription days
export function simulateLicenseDaysRemaining(days: number): LicenseSecurityState {
  const current = evaluateLicenseState();
  const now = new Date();
  const newExpiresDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const newExpiresAt = newExpiresDate.toISOString();
  const signature = generateLicenseSignature(
    current.installedAt,
    current.currentPeriodStart,
    newExpiresAt,
    current.totalRenewals,
    false
  );

  const diffMs = newExpiresDate.getTime() - now.getTime();
  let status: LicenseSecurityState['status'] = 'active';
  if (days <= 0) {
    status = 'expired';
  } else if (days <= WARNING_THRESHOLD_DAYS) {
    status = 'warning';
  }

  const simulated: LicenseSecurityState = {
    ...current,
    isActivated: true,
    isTrial: false,
    expiresAt: newExpiresAt,
    status,
    daysRemaining: Math.max(0, days),
    hoursRemaining: Math.max(0, Math.floor(diffMs / (1000 * 60 * 60))),
    signature,
    lastCheckedAt: now.toISOString(),
  };

  saveLicenseState(simulated);
  return simulated;
}

// Simulation method for 7-day trial testing
export function simulateTrialDaysRemaining(days: number): LicenseSecurityState {
  const current = evaluateLicenseState();
  const now = new Date();
  const trialExpiresDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const trialExpiresAt = trialExpiresDate.toISOString();
  const isTrialActive = days > 0;
  const status: LicenseSecurityState['status'] = isTrialActive ? 'trial' : 'trial_expired';
  const signature = generateLicenseSignature(
    current.installedAt,
    current.currentPeriodStart,
    trialExpiresAt,
    0,
    isTrialActive
  );

  const simulated: LicenseSecurityState = {
    ...current,
    isActivated: false,
    isTrial: isTrialActive,
    trialExpiresAt,
    expiresAt: trialExpiresAt,
    status,
    daysRemaining: Math.max(0, days),
    hoursRemaining: Math.max(0, days * 24),
    trialDaysRemaining: Math.max(0, days),
    trialHoursRemaining: Math.max(0, days * 24),
    signature,
    lastCheckedAt: now.toISOString(),
  };

  saveLicenseState(simulated);
  return simulated;
}

// Reset to fresh installation 7-day trial state
export function resetToInitialTrialState(): LicenseSecurityState {
  const fresh = createInitialLicenseState();
  saveLicenseState(fresh);
  return fresh;
}

// Legacy alias for compatibility
export function resetToUnactivatedInstallState(): LicenseSecurityState {
  return resetToInitialTrialState();
}
