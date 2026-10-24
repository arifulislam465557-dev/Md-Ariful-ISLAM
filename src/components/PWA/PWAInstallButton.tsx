import React, { useState } from 'react';
import { Download, MonitorCheck, Laptop } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'button' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  const handleClick = async () => {
    // If the browser currently supports prompt, try it directly or open the full installer guide modal
    if (isInstallable) {
      const res = await install();
      if (!res) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      {variant === 'header' ? (
        <button
          onClick={handleClick}
          title="Install as PC Desktop App or Android APK"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border transition cursor-pointer shadow-xs ${
            isInstalled
              ? 'bg-purple-900/80 text-purple-200 border-purple-700 hover:bg-purple-800'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-500 animate-pulse'
          } ${className}`}
        >
          {isInstalled ? (
            <>
              <MonitorCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">পিসি অ্যাপ</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5 text-white" />
              <span className="font-extrabold tracking-wide">পিসি ও APK ইনস্টল</span>
            </>
          )}
        </button>
      ) : (
        <button
          onClick={handleClick}
          className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
            isInstalled
              ? 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'
              : 'bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white shadow-purple-500/20'
          } ${className}`}
        >
          <Laptop className="w-4 h-4" />
          <span>{isInstalled ? 'পিসি অ্যাপ ইনস্টল্ড (Settings)' : 'পিসিতে ইনস্টল করুন (PC & APK)'}</span>
        </button>
      )}

      {showModal && <PWAInstallModal onClose={() => setShowModal(false)} />}
    </>
  );
};
