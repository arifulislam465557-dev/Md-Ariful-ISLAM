import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  FlaskConical, 
  Receipt, 
  Users, 
  Activity, 
  Film, 
  Radio, 
  Stethoscope, 
  BarChart3, 
  MessageSquareLock, 
  Settings 
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, t } = useApp();

  const tabs = [
    { id: 'pathology', label: t.pathology, icon: FlaskConical, badge: 'Main', color: 'from-purple-700 to-indigo-800' },
    { id: 'billing', label: t.billing, icon: Receipt, color: 'from-emerald-700 to-teal-800' },
    { id: 'doctorVisit', label: t.doctorVisit, icon: Users, color: 'from-blue-700 to-indigo-800' },
    { id: 'ecg', label: t.ecg, icon: Activity, color: 'from-rose-700 to-red-800' },
    { id: 'xray', label: t.xray, icon: Film, color: 'from-slate-700 to-gray-800' },
    { id: 'ultrasound', label: t.ultrasound, icon: Radio, color: 'from-cyan-700 to-blue-800' },
    { id: 'doctorPortal', label: t.doctorPortal, icon: Stethoscope, badge: 'Rx', color: 'from-violet-700 to-purple-800' },
    { id: 'analytics', label: t.analytics, icon: BarChart3, color: 'from-amber-700 to-orange-800' },
    { id: 'chat', label: t.encryptedChat, icon: MessageSquareLock, color: 'from-green-700 to-emerald-800' },
    { id: 'settings', label: t.settings, icon: Settings, color: 'from-fuchsia-700 to-purple-800' },
  ];

  return (
    <nav className="w-full h-auto bg-white border-b border-slate-200/80 shadow-xs no-print sticky top-0 z-30">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="w-full min-w-0 flex flex-wrap items-center gap-x-1.5 gap-y-1.5 py-2">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative group inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold shrink-0 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-md shadow-indigo-500/20 scale-[1.02]`
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-800'}`} />
                <span className="whitespace-nowrap">{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 text-[10px] font-bold rounded uppercase shrink-0 whitespace-nowrap ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
