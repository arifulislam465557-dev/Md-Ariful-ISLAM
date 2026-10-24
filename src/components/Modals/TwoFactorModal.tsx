import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Lock, Check, X, Smartphone, KeyRound } from 'lucide-react';

interface TwoFactorModalProps {
  onClose: () => void;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({ onClose }) => {
  const { is2FAEnabled, setIs2FAEnabled, addNotification } = useApp();
  const [code, setCode] = useState(['5', '4', '8', '2', '0', '9']);
  const [view, setView] = useState<'status' | 'setup'>('status');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleToggle = () => {
    if (!is2FAEnabled) {
      setView('setup');
    } else {
      setIs2FAEnabled(false);
      setFeedback('Two-factor security disabled.');
      addNotification('Security Alert', 'Two-Factor Authentication was disabled.', 'warn');
    }
  };

  const handleVerify = () => {
    setIs2FAEnabled(true);
    setView('status');
    setFeedback('2FA has been successfully verified & enabled for this browser!');
    addNotification('Security Enabled', '2FA Authenticator verified & active.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-purple-200 dark:border-gray-700">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-purple-800 to-indigo-900 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-200" />
            <h3 className="font-semibold text-base">Two-Factor Authentication (2FA)</h3>
          </div>
          <button onClick={onClose} className="p-1 text-white/80 hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {feedback && (
            <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 p-3 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{feedback}</span>
            </div>
          )}

          {view === 'status' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3.5 bg-purple-50 dark:bg-gray-900 rounded-lg border border-purple-100 dark:border-gray-700">
                <div className={`p-3 rounded-full ${is2FAEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                    2FA Security Layer: {is2FAEnabled ? 'ACTIVE' : 'INACTIVE'}
                  </h4>
                  <p className="text-gray-500 mt-0.5">
                    {is2FAEnabled
                      ? 'Every critical diagnostic action and report printing is safeguarded.'
                      : 'Enable 2FA to prevent unauthorized report modifications and access.'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-gray-600 dark:text-gray-300">
                <p className="font-semibold text-gray-800 dark:text-gray-100">Protected Resources:</p>
                <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
                  <li>Pathology & Clinical Test Result Modifiers</li>
                  <li>Doctor Billing & Financial Cash Receipts</li>
                  <li>Diagnostic Report Signature Seals</li>
                  <li>Administrative Settings & Backup Restores</li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleToggle}
                  className={`w-full py-2.5 rounded-lg font-bold text-xs cursor-pointer shadow-xs ${
                    is2FAEnabled
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-purple-900 hover:bg-purple-950 text-white'
                  }`}
                >
                  {is2FAEnabled ? 'Disable 2FA Protection' : 'Configure & Enable 2FA'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                  Enter 6-Digit Authenticator Token
                </p>
                <p className="text-gray-500 text-[11px]">
                  Use Google Authenticator or default demo security token below:
                </p>
              </div>

              <div className="flex justify-center gap-2 py-2">
                {code.map((digit, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const updated = [...code];
                      updated[i] = e.target.value;
                      setCode(updated);
                    }}
                    className="w-10 h-12 text-center text-lg font-black bg-purple-50 dark:bg-gray-900 border-2 border-purple-300 dark:border-purple-700 rounded-lg text-purple-950 dark:text-purple-200 focus:outline-none focus:border-purple-600"
                  />
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setView('status')}
                  className="w-1/2 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleVerify}
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Verify & Activate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
