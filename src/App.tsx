import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { PathologyModule } from './components/Pathology/PathologyModule';
import { BillingModule } from './components/Billing/BillingModule';
import { DoctorVisitModule } from './components/DoctorVisit/DoctorVisitModule';
import { DoctorPortalModule } from './components/DoctorPortal/DoctorPortalModule';
import { EcgModule } from './components/Imaging/EcgModule';
import { XrayModule } from './components/Imaging/XrayModule';
import { UltrasoundModule } from './components/Imaging/UltrasoundModule';
import { AnalyticsModule } from './components/Analytics/AnalyticsModule';
import { ChatModule } from './components/Chat/ChatModule';
import { SettingsModule } from './components/Settings/SettingsModule';
import { LanNetworkModule } from './components/LAN/LanNetworkModule';
import { EmployeeModule } from './components/Employees/EmployeeModule';
import { IncomeExpenseModule } from './components/Accounts/IncomeExpenseModule';
import { TwoFactorModal } from './components/Modals/TwoFactorModal';
import { SurveyModal } from './components/Modals/SurveyModal';
import { UserGuideModal } from './components/Modals/UserGuideModal';
import { AdminUserPasswordModal } from './components/Modals/AdminUserPasswordModal';
import { KeyboardShortcutsModal } from './components/Modals/KeyboardShortcutsModal';
import { OfflineIndicator } from './components/PWA/OfflineIndicator';
import { LoginScreen } from './components/Auth/LoginScreen';
import { LicenseLockModal } from './components/Licensing/LicenseLockModal';
import { LicenseReminderModal } from './components/Licensing/LicenseReminderModal';
import { PatientOverviewModal } from './components/Modals/PatientOverviewModal';
import { RemoteLockScreen } from './components/Modals/RemoteLockScreen';
import { RemoteKillScreen } from './components/Modals/RemoteKillScreen';
import { MobileRemoteControlModal } from './components/Modals/MobileRemoteControlModal';
import { AdminDeleteConfirmModal } from './components/Modals/AdminDeleteConfirmModal';
import { RecycleBinModal } from './components/Modals/RecycleBinModal';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const MainApp: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    theme,
    currentUser,
    logoutUser,
    hasAccessToModule,
    getAllowedTabs,
    lang,
    licenseInfo,
    renewLicense,
    simulateLicenseDays,
    openLicenseModal,
    setOpenLicenseModal,
    currentWorkstation,
    showShortcutsModal,
    setShowShortcutsModal,
    showGlobalSearch,
    setShowGlobalSearch,
    addNotification,
    selectedPatientForOverview,
    setSelectedPatientForOverview,
    openMobileRemoteModal,
    setOpenMobileRemoteModal,
    executeOfflineRemoteCommand,
  } = useApp();

  const [open2FA, setOpen2FA] = useState<boolean>(false);
  const [openSurvey, setOpenSurvey] = useState<boolean>(false);
  const [openDocs, setOpenDocs] = useState<boolean>(false);
  const [openAdminModal, setOpenAdminModal] = useState<boolean>(false);
  const [dismissedWarningSession, setDismissedWarningSession] = useState<boolean>(false);

  // Global hotkey system: Ctrl+B (Billing), Ctrl+P (Pathology), Ctrl+D (Doctor Visit), etc.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.tagName === 'SELECT');

      // F1 or Alt+/ or Ctrl+/ to open Keyboard Shortcuts cheat sheet
      if (
        e.key === 'F1' ||
        ((e.ctrlKey || e.altKey || e.metaKey) && (e.key === '/' || e.key === '?'))
      ) {
        e.preventDefault();
        setShowShortcutsModal(true);
        return;
      }

      // Check modifier combinations: Ctrl + Key or Alt + Key
      if (e.ctrlKey || e.altKey || e.metaKey) {
        const key = e.key.toLowerCase();
        let targetModule: string | null = null;

        if (key === 'b') targetModule = 'billing';
        else if (key === 'p') targetModule = 'pathology';
        else if (key === 'd') targetModule = 'doctorVisit';
        else if (key === 'r') targetModule = 'doctorPortal';
        else if (key === 'x') targetModule = 'xray';
        else if (key === 'u') targetModule = 'ultrasound';
        else if (key === 'e') targetModule = 'ecg';
        else if (key === 'i') targetModule = 'incomeExpense';
        else if (key === 'm') targetModule = 'employees';
        else if (key === 'a') targetModule = 'analytics';
        else if (key === 'l') targetModule = 'lanNetwork';
        else if (key === 's' && e.altKey) targetModule = 'settings';
        else if (key === 's' && e.ctrlKey && !isInput) targetModule = 'settings';
        else if (key === 'k') {
          e.preventDefault();
          setShowGlobalSearch(true);
          return;
        }

        if (targetModule) {
          e.preventDefault();
          if (currentUser && !hasAccessToModule(targetModule)) {
            addNotification(
              lang === 'bn' ? 'অনুমতি নেই' : 'Access Restricted',
              lang === 'bn'
                ? 'আপনার ইউজার অ্যাকাউন্টের এই মডিউলে প্রবেশের অনুমতি নেই।'
                : 'Your account is not permitted to access this department.',
              'warn'
            );
          } else {
            setActiveTab(targetModule);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser, hasAccessToModule, setActiveTab, setShowShortcutsModal, setShowGlobalSearch, addNotification, lang]);

  // Enforce access control: if user is logged in and activeTab is not allowed, redirect to first allowed tab
  useEffect(() => {
    if (currentUser && !hasAccessToModule(activeTab)) {
      const allowed = getAllowedTabs();
      if (allowed.length > 0 && !allowed.includes(activeTab as any)) {
        setActiveTab(allowed[0]);
      }
    }
  }, [currentUser, activeTab, hasAccessToModule, getAllowedTabs, setActiveTab]);

  // 1. Check if this PC is Remote-Killed by Administrator via Mobile Remote
  if (currentWorkstation?.isRemoteKilled) {
    return (
      <RemoteKillScreen
        terminalCode={currentWorkstation.terminalCode}
        terminalName={currentWorkstation.nameBn}
        killReason={currentWorkstation.remoteKillReason}
        onReactivate={(code) => {
          const res = executeOfflineRemoteCommand(code);
          return res.success;
        }}
        lang={lang}
      />
    );
  }

  // 2. Check if this PC is Remote-Locked by Administrator via Mobile Remote
  if (currentWorkstation?.isRemoteLocked) {
    return (
      <RemoteLockScreen
        terminalCode={currentWorkstation.terminalCode}
        terminalName={currentWorkstation.nameBn}
        lockReason={currentWorkstation.remoteLockReason}
        onUnlock={(code) => {
          const res = executeOfflineRemoteCommand(code);
          return res.success;
        }}
        lang={lang}
      />
    );
  }

  // 3. Hard License Lockout:
  // If 7-day trial has elapsed (status === 'trial_expired'),
  // OR if 3-month quarterly subscription is expired or tampered: STRICTLY LOCK OUT!
  // Note: While in 7-day trial (licenseInfo.status === 'trial'), software is UNLOCKED & 100% accessible!
  const isTrialExpired = licenseInfo.status === 'trial_expired';
  const isLicenseLocked =
    isTrialExpired ||
    (licenseInfo.status === 'unactivated' && licenseInfo.daysRemaining <= 0) ||
    (licenseInfo.isActivated &&
      (licenseInfo.status === 'expired' ||
        licenseInfo.status === 'tampered' ||
        licenseInfo.daysRemaining <= 0));

  if (isLicenseLocked) {
    return (
      <LicenseLockModal
        onRenew={renewLicense}
        expiresAt={licenseInfo.expiresAt}
        isTampered={licenseInfo.status === 'tampered'}
        isUnactivated={licenseInfo.status === 'unactivated'}
        isTrialExpired={isTrialExpired}
        workstationCode={currentWorkstation?.terminalCode || 'TERMINAL-PC'}
        lang={lang}
      />
    );
  }

  // If not logged in, show lock screen
  if (!currentUser) {
    return (
      <>
        <LoginScreen onLoginSuccess={() => {}} />
        {(openLicenseModal || (licenseInfo.status === 'warning' && !dismissedWarningSession)) && (
          <LicenseReminderModal
            licenseInfo={licenseInfo}
            onClose={() => {
              setOpenLicenseModal(false);
              setDismissedWarningSession(true);
            }}
            onRenew={renewLicense}
            onSimulateDays={simulateLicenseDays}
            lang={lang}
          />
        )}
      </>
    );
  }

  const isCurrentTabAllowed = hasAccessToModule(activeTab);

  return (
    <div
      className={`min-h-screen flex flex-col font-sans ${
        theme === 'dark' ? 'dark bg-gray-900 text-gray-100' : 'bg-slate-50 text-gray-900'
      }`}
    >
      <Header
        onOpen2FA={() => setOpen2FA(true)}
        onOpenSurvey={() => setOpenSurvey(true)}
        onOpenDocs={() => setOpenDocs(true)}
        onLogout={logoutUser}
        onOpenAdminModal={() => setOpenAdminModal(true)}
      />
      <Navbar />

      <main className="flex-1 overflow-x-hidden">
        {!isCurrentTabAllowed ? (
          <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-red-200 dark:border-red-900 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-950/60 text-red-600 rounded-full flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {lang === 'bn' ? 'অ্যাক্সেস সংরক্ষিত / অনুমতি নেই' : 'Restricted Module Access'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {lang === 'bn'
                ? `আপনার ইউজার আইডি (@${currentUser.username}) এই মডিউলটি দেখার অনুমতি নেই। আপনি শুধুমাত্র আপনার জন্য নির্ধারিত ইন্টারফেসে প্রবেশ করতে পারবেন।`
                : `Your account (@${currentUser.username}) is not permitted to access this department. Please contact your system administrator.`}
            </p>
            <button
              onClick={() => {
                const allowed = getAllowedTabs();
                if (allowed.length > 0) setActiveTab(allowed[0]);
              }}
              className="mt-6 px-4 py-2 bg-purple-800 hover:bg-purple-900 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'bn' ? 'অনুমোদিত ড্যাশবোর্ডে ফিরে যান' : 'Return to Allowed Module'}</span>
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'pathology' && <PathologyModule />}
            {activeTab === 'billing' && <BillingModule />}
            {activeTab === 'doctorVisit' && <DoctorVisitModule />}
            {activeTab === 'doctorPortal' && <DoctorPortalModule />}
            {activeTab === 'incomeExpense' && <IncomeExpenseModule />}
            {activeTab === 'employees' && <EmployeeModule />}
            {activeTab === 'ecg' && <EcgModule />}
            {activeTab === 'xray' && <XrayModule />}
            {activeTab === 'ultrasound' && <UltrasoundModule />}
            {activeTab === 'analytics' && <AnalyticsModule />}
            {activeTab === 'chat' && <ChatModule />}
            {activeTab === 'lanNetwork' && <LanNetworkModule />}
            {activeTab === 'settings' && <SettingsModule />}
          </>
        )}
      </main>

      {openAdminModal && <AdminUserPasswordModal onClose={() => setOpenAdminModal(false)} />}
      {open2FA && <TwoFactorModal onClose={() => setOpen2FA(false)} />}
      {openSurvey && <SurveyModal onClose={() => setOpenSurvey(false)} />}
      {openDocs && <UserGuideModal onClose={() => setOpenDocs(false)} />}
      {(openLicenseModal || (licenseInfo.status === 'warning' && !dismissedWarningSession)) && (
        <LicenseReminderModal
          licenseInfo={licenseInfo}
          onClose={() => {
            setOpenLicenseModal(false);
            setDismissedWarningSession(true);
          }}
          onRenew={renewLicense}
          onSimulateDays={simulateLicenseDays}
          lang={lang}
        />
      )}
      {showShortcutsModal && (
        <KeyboardShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}
      {selectedPatientForOverview && (
        <PatientOverviewModal
          patient={selectedPatientForOverview}
          onClose={() => setSelectedPatientForOverview(null)}
          onNavigateToBilling={() => {
            setSelectedPatientForOverview(null);
            setActiveTab('billing');
          }}
          onNavigateToDoctorVisit={() => {
            setSelectedPatientForOverview(null);
            setActiveTab('doctorVisit');
          }}
        />
      )}
      {openMobileRemoteModal && (
        <MobileRemoteControlModal onClose={() => setOpenMobileRemoteModal(false)} />
      )}
      <AdminDeleteConfirmModal />
      <RecycleBinModal />
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
