import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWAInstall();
  const [showOnlineBanner, setShowOnlineBanner] = useState(false);
  const prevOnlineRef = useRef(isOnline);

  useEffect(() => {
    // If was offline and now came back online, show positive green reconnection banner
    if (!prevOnlineRef.current && isOnline) {
      setShowOnlineBanner(true);
      const timer = setTimeout(() => {
        setShowOnlineBanner(false);
      }, 4500);
      return () => clearTimeout(timer);
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline]);

  if (!isOnline) {
    return (
      <aside
        aria-label="Network status offline"
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-2.5 text-xs font-bold shadow-2xl border-2 border-amber-400 animate-in slide-in-from-bottom duration-300"
      >
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
        </span>
        <WifiOff className="w-4 h-4 shrink-0" />
        <div>
          <span className="block font-bold">অফলাইন মোড সক্রিয় (Offline Mode Active)</span>
          <span className="text-[10px] font-normal opacity-90 block">
            পিসিতে ইন্টারনেট নেই — সম্পূর্ণ সফটওয়্যার অফলাইনে নিরবচ্ছিন্ন কাজ করছে।
          </span>
        </div>
      </aside>
    );
  }

  if (showOnlineBanner) {
    return (
      <aside
        aria-label="Network status online"
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2.5 text-xs font-bold shadow-2xl border-2 border-emerald-400 animate-in slide-in-from-bottom duration-300"
      >
        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
        <div>
          <span className="block font-bold">অনলাইন মোড সক্রিয় (Online Mode Restored)</span>
          <span className="text-[10px] font-normal opacity-90 block">
            ইন্টারনেট কানেকশন সচল হয়েছে — সেন্ট্রাল সার্ভার ও ক্লাউড সিঙ্ক লাইভ।
          </span>
        </div>
      </aside>
    );
  }

  return null;
};

