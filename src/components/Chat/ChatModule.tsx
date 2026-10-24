import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, Send, Shield, Users, Stethoscope, FlaskConical, Building } from 'lucide-react';

export const ChatModule: React.FC = () => {
  const { chatMessages, sendChatMessage, t } = useApp();

  const [channel, setChannel] = useState<'lab' | 'opd' | 'billing' | 'general'>('lab');
  const [senderRole, setSenderRole] = useState<'Lab' | 'Doctor' | 'Reception' | 'Admin'>('Lab');
  const [inputText, setInputText] = useState('');

  const currentMessages = chatMessages.filter((m) => m.channel === channel);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendChatMessage(inputText.trim(), channel, senderRole);
    setInputText('');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xs border border-purple-100 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-bold text-purple-950 dark:text-purple-200 flex items-center gap-2">
            <Lock className="w-6 h-6 text-emerald-600" />
            {t.encryptedChat} (End-to-End Encrypted)
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Zero-knowledge clinical messaging between Doctor chambers, Pathology Laboratory, Reception desk and Admin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-semibold rounded-full border border-emerald-300">
            <Shield className="w-3.5 h-3.5" /> 256-Bit E2E Active
          </span>
        </div>
      </div>

      {/* Main Grid: Channels & Role Left (4 cols), Chat Stream Right (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Settings */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 space-y-3 text-xs">
            <label className="block font-bold text-gray-800 dark:text-gray-200">Transmit As Role:</label>
            <select
              value={senderRole}
              onChange={(e) => setSenderRole(e.target.value as any)}
              className="w-full bg-purple-50 dark:bg-gray-900 border border-purple-200 dark:border-purple-800 p-2 rounded text-xs font-semibold text-purple-950 dark:text-purple-200 focus:outline-none"
            >
              <option value="Lab">Pathology Lab Technologist</option>
              <option value="Doctor">Consultant Doctor</option>
              <option value="Reception">Front Desk Receptionist</option>
              <option value="Admin">Clinic Director / Admin</option>
            </select>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 space-y-2 text-xs">
            <label className="block font-bold text-gray-800 dark:text-gray-200 mb-1">Encrypted Channels:</label>
            {[
              { id: 'lab', label: '🔬 Pathology & Lab Queue', desc: 'Critical specimen results & flags' },
              { id: 'opd', label: '🩺 Doctor Chambers & OPD', desc: 'Patient calling & room status' },
              { id: 'billing', label: '🧾 Accounts & Cash Desk', desc: 'Due collections & invoices' },
              { id: 'general', label: '📢 Hospital Intercom', desc: 'Clinic-wide urgent broadcasts' },
            ].map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setChannel(ch.id as any)}
                className={`w-full text-left p-2.5 rounded-lg border transition cursor-pointer ${
                  channel === ch.id
                    ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                    : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-purple-50'
                }`}
              >
                <div className="font-bold">{ch.label}</div>
                <div className={`text-[10px] ${channel === ch.id ? 'text-purple-200' : 'text-gray-500'}`}>
                  {ch.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Chat Stream */}
        <div className="lg:col-span-8 bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 flex flex-col h-[520px] overflow-hidden">
          {/* Channel Header */}
          <div className="p-3 bg-purple-950 text-white font-bold text-xs flex justify-between items-center">
            <span>Channel: #{channel.toUpperCase()}</span>
            <span className="text-[10px] text-purple-300 font-normal">Encrypted with Local Storage Layer</span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50 dark:bg-gray-900/50">
            {currentMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400 italic">
                No clinical transmissions in this channel yet. Send the first secure message.
              </div>
            ) : (
              currentMessages.map((m) => (
                <div
                  key={m.id}
                  className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs space-y-1 text-xs"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 font-bold text-purple-950 dark:text-purple-300">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase ${
                          m.senderRole === 'Doctor'
                            ? 'bg-blue-100 text-blue-800'
                            : m.senderRole === 'Lab'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {m.senderRole}
                      </span>
                      <span>{m.sender}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">{m.timestamp}</span>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 pl-1 leading-relaxed">{m.message}</p>
                </div>
              ))
            )}
          </div>

          {/* Send Input */}
          <form onSubmit={handleSend} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Transmit confidential clinical message..."
              className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 px-3 py-2 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition active:scale-95"
            >
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
