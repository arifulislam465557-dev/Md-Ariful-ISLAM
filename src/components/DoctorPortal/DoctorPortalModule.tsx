import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PrescriptionMedicine } from '../../types';
import {
  Stethoscope,
  Printer,
  Plus,
  Trash2,
  FileText,
  CheckCircle,
  X,
  User,
} from 'lucide-react';

export const DoctorPortalModule: React.FC = () => {
  const { doctors, labTests, clinicConfig, lang, t, openPatientOverviewModal, patients } = useApp();

  const [doctorId, setDoctorId] = useState(doctors[0]?.id || '');
  const [patientName, setPatientName] = useState('Titly');
  const [age, setAge] = useState('24 Y');
  const [sex, setSex] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [phone, setPhone] = useState('+880 1712000001');

  const [chiefComplaints, setChiefComplaints] = useState('Mild fever for 3 days, body ache, general weakness.');
  const [clinicalObs, setClinicalObs] = useState('BP: 120/80 mmHg, Pulse: 78 bpm, Temp: 99.2°F');
  const [diagnosis, setDiagnosis] = useState('Viral Syndrome / Mild Anemia');

  const [medicines, setMedicines] = useState<PrescriptionMedicine[]>([
    {
      name: 'Tab. Paracetamol 500mg (Napa)',
      dosage: '1+0+1',
      instruction: 'After meal (if fever > 100°F)',
      duration: '5 days',
    },
    {
      name: 'Cap. Omeprazole 20mg (Seclo)',
      dosage: '1+0+1',
      instruction: 'Before meal',
      duration: '14 days',
    },
    {
      name: 'Tab. Iron Polymaltose + Folic Acid (Fefol-CI)',
      dosage: '0+0+1',
      instruction: 'After lunch',
      duration: '1 month',
    },
  ]);

  const [investigations, setInvestigations] = useState<string[]>([
    'Complete Blood Count (CBC with ESR)',
    'Random Blood Sugar (RBS)',
  ]);

  const [advice, setAdvice] = useState(
    'Drink plenty of fluids (2.5L daily). Take balanced iron-rich meals. Return for review after 7 days with lab reports.'
  );
  const [followUp, setFollowUp] = useState('After 7 Days (20-10-2026)');
  const [showRxModal, setShowRxModal] = useState(false);
  const [padMode, setPadMode] = useState(true);

  const selectedDoctor = doctors.find((d) => d.id === doctorId) || doctors[0];

  const handleAddMedicine = () => {
    setMedicines([
      ...medicines,
      {
        name: '',
        dosage: '1+0+1',
        instruction: 'After meal',
        duration: '7 days',
      },
    ]);
  };

  const handleRemoveMedicine = (idx: number) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const handleUpdateMedicine = (
    idx: number,
    field: keyof PrescriptionMedicine,
    value: string
  ) => {
    const updated = [...medicines];
    updated[idx] = { ...updated[idx], [field]: value };
    setMedicines(updated);
  };

  const toggleInvestigation = (testName: string) => {
    if (investigations.includes(testName)) {
      setInvestigations(investigations.filter((it) => it !== testName));
    } else {
      setInvestigations([...investigations, testName]);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xs border border-purple-100 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-bold text-purple-950 dark:text-purple-200 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-purple-700" />
            {t.doctorPortal}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Rapid digital prescription studio for consultants. Order lab tests, prescribe dosage regimens & print standardized Rx.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRxModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            {t.printPrescription}
          </button>
        </div>
      </div>

      {/* Main Grid: Left Clinical & Patient Form (4 cols), Right Rx Studio (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Doctor Selection & Patient Bio & Clinical Notes */}
        <div className="lg:col-span-4 space-y-4">
          {/* Consultant Selection */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xs border border-purple-100 dark:border-gray-700 text-xs space-y-3">
            <h3 className="font-bold text-sm text-purple-950 dark:text-purple-200">Consultant Chamber:</h3>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="w-full bg-purple-50 dark:bg-gray-900 border border-purple-200 dark:border-purple-800 p-2 rounded text-xs font-bold text-purple-950 dark:text-purple-200 focus:outline-none"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialty})
                </option>
              ))}
            </select>
            {selectedDoctor && (
              <div className="text-[11px] text-gray-500 dark:text-gray-400 space-y-0.5 pt-1 border-t border-gray-100 dark:border-gray-700">
                <p className="font-semibold text-gray-800 dark:text-gray-200">{selectedDoctor.degree}</p>
                <p>Room: {selectedDoctor.roomNo} | Phone: {selectedDoctor.phone}</p>
              </div>
            )}
          </div>

          {/* Patient Bio */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xs border border-purple-100 dark:border-gray-700 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-purple-950 dark:text-purple-200">{t.patientInfo}</h3>
              <button
                type="button"
                onClick={() => {
                  const matched = patients.find(
                    (p) => p.patientName.toLowerCase() === patientName.toLowerCase()
                  );
                  openPatientOverviewModal(matched || '26100294');
                }}
                className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                title={lang === 'bn' ? 'রোগী প্রোফাইল, ল্যাব রিপোর্ট ও বকেয়া ওভারভিউ' : 'Complete Patient Overview'}
              >
                <User className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>{lang === 'bn' ? 'রোগীর ওভারভিউ' : 'Patient Overview'}</span>
              </button>
            </div>
            <div>
              <label className="block text-gray-600 dark:text-gray-400 font-semibold mb-1">{t.ptName}:</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2 rounded font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-600 dark:text-gray-400 font-semibold mb-1">{t.age}:</label>
                <input
                  type="text"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-600 dark:text-gray-400 font-semibold mb-1">{t.sex}:</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as any)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2 rounded"
                >
                  <option value="Female">{t.female}</option>
                  <option value="Male">{t.male}</option>
                  <option value="Other">{t.other}</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-gray-600 dark:text-gray-400 font-semibold mb-1">Phone:</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2 rounded"
              />
            </div>
          </div>

          {/* Clinical Findings & Diagnosis */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xs border border-purple-100 dark:border-gray-700 text-xs space-y-3">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">{t.chiefComplaints}:</label>
              <textarea
                value={chiefComplaints}
                onChange={(e) => setChiefComplaints(e.target.value)}
                rows={2}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2 rounded"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">O/E (Vitals / Notes):</label>
              <input
                type="text"
                value={clinicalObs}
                onChange={(e) => setClinicalObs(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2 rounded"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">{t.diagnosis}:</label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full bg-purple-50 dark:bg-gray-900 border border-purple-200 dark:border-purple-800 p-2 rounded font-bold text-purple-950 dark:text-purple-200"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Rx Prescription Studio (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Medicines Rx Table */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-xs border border-purple-100 dark:border-gray-700 space-y-3">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-2xl text-purple-900 dark:text-purple-300 italic">℞</span>
                <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{t.medicine} Plan</span>
              </div>
              <button
                type="button"
                onClick={handleAddMedicine}
                className="flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded font-bold text-xs hover:bg-purple-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.addMedicine}
              </button>
            </div>

            <div className="space-y-2">
              {medicines.map((med, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50 dark:bg-gray-900/60 p-2 rounded-lg text-xs">
                  <div className="col-span-4">
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => handleUpdateMedicine(idx, 'name', e.target.value)}
                      placeholder="e.g. Tab. Napa 500mg"
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1.5 rounded font-bold text-purple-950 dark:text-purple-200"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => handleUpdateMedicine(idx, 'dosage', e.target.value)}
                      placeholder="1+0+1"
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1.5 rounded text-center font-bold"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={med.instruction}
                      onChange={(e) => handleUpdateMedicine(idx, 'instruction', e.target.value)}
                      placeholder="After meal"
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1.5 rounded"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={med.duration}
                      onChange={(e) => handleUpdateMedicine(idx, 'duration', e.target.value)}
                      placeholder="7 days"
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1.5 rounded"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveMedicine(idx)}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 mx-auto" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Investigations Selection */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-xs border border-purple-100 dark:border-gray-700 space-y-2.5 text-xs">
            <h3 className="font-bold text-sm text-purple-950 dark:text-purple-200">{t.prescribeInvestigations}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-[11px]">Click items to order clinical diagnostic tests for this patient:</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {labTests.map((lt) => {
                const isSelected = investigations.includes(lt.name);
                return (
                  <button
                    key={lt.id}
                    type="button"
                    onClick={() => toggleInvestigation(lt.name)}
                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition cursor-pointer border ${
                      isSelected
                        ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                        : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-purple-50'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {lt.name.split('(')[0].trim()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advice & Follow-Up */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-xs border border-purple-100 dark:border-gray-700 space-y-3 text-xs">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">{t.advice}:</label>
              <textarea
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                rows={2}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2 rounded"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Follow-up / Review Date:</label>
                <input
                  type="text"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2 rounded font-bold"
                />
              </div>
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowRxModal(true)}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-800 to-indigo-900 hover:from-purple-900 hover:to-indigo-950 text-white font-black rounded-lg text-xs flex items-center gap-2 shadow-md cursor-pointer transition active:scale-98"
                >
                  <Printer className="w-4 h-4" />
                  {t.printPrescription}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prescription Pad Printable Modal */}
      {showRxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white text-gray-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[96vh] flex flex-col overflow-hidden border border-purple-300">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-5 py-3 bg-purple-950 text-white print:hidden">
              <span className="font-bold text-sm">Prescription Pad (Rx Preview) — {patientName}</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-purple-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={padMode}
                    onChange={(e) => setPadMode(e.target.checked)}
                    className="accent-white"
                  />
                  <span>{lang === 'bn' ? 'প্যাড প্রিন্ট (প্রতিষ্ঠানের নাম ছাড়া)' : 'Pad Print (Hide Clinic Name)'}</span>
                </label>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Rx
                </button>
                <button onClick={() => setShowRxModal(false)} className="p-1 text-white hover:text-red-300 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Prescription Pad */}
            <div className="p-8 bg-white flex-1 overflow-y-auto print:p-0" id="printable-rx">
              {/* Doctor Letterhead */}
              <div className="flex justify-between items-start border-b-2 border-purple-900 pb-4 mb-4">
                <div>
                  <h2 className="text-xl font-black text-purple-950 font-serif">{selectedDoctor.name}</h2>
                  <p className="text-xs font-bold text-purple-800">{selectedDoctor.degree}</p>
                  <p className="text-xs text-gray-600">{selectedDoctor.specialty}</p>
                  <p className="text-[11px] text-gray-500">Room: {selectedDoctor.roomNo} | Phone: {selectedDoctor.phone}</p>
                </div>
                {!padMode && (
                  <div className="text-right">
                    <h3 className="text-sm font-bold text-gray-800 font-serif">{clinicConfig.clinicName}</h3>
                    <p className="text-[10px] text-gray-500">{clinicConfig.address}</p>
                    <p className="text-[10px] text-gray-500">Hotline: {clinicConfig.phone}</p>
                  </div>
                )}
              </div>

              {/* Patient Bar */}
              <div className="bg-gray-50 border border-gray-300 p-2.5 rounded-lg grid grid-cols-4 gap-2 text-xs mb-6">
                <div>
                  <span className="text-gray-500 text-[10px] block font-bold">Patient Name</span>
                  <span className="font-bold text-gray-900">{patientName}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block font-bold">Age / Sex</span>
                  <span className="font-semibold text-gray-800">{age} / {sex}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block font-bold">Date</span>
                  <span className="font-semibold text-gray-800">13-10-2026</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block font-bold">Phone</span>
                  <span className="font-semibold text-gray-800">{phone}</span>
                </div>
              </div>

              {/* Rx Split Layout */}
              <div className="grid grid-cols-12 gap-6 min-h-[420px]">
                {/* Left Mini Column (3 cols): Complaints, Vitals, Investigations */}
                <div className="col-span-4 border-r border-gray-200 pr-4 space-y-4 text-xs">
                  {chiefComplaints && (
                    <div>
                      <span className="font-bold text-purple-950 uppercase text-[10px] block">Chief Complaints:</span>
                      <p className="text-gray-700 mt-0.5">{chiefComplaints}</p>
                    </div>
                  )}

                  {clinicalObs && (
                    <div>
                      <span className="font-bold text-purple-950 uppercase text-[10px] block">Observations (O/E):</span>
                      <p className="text-gray-700 mt-0.5">{clinicalObs}</p>
                    </div>
                  )}

                  {diagnosis && (
                    <div>
                      <span className="font-bold text-purple-950 uppercase text-[10px] block">Diagnosis:</span>
                      <p className="font-bold text-gray-900 mt-0.5">{diagnosis}</p>
                    </div>
                  )}

                  {investigations.length > 0 && (
                    <div className="pt-2 border-t border-gray-200">
                      <span className="font-bold text-purple-950 uppercase text-[10px] block mb-1">
                        Advised Investigations:
                      </span>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-gray-800 font-medium">
                        {investigations.map((it, i) => (
                          <li key={i}>{it}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Right Main Column (8 cols): Medicines & Instructions */}
                <div className="col-span-8 pl-2 space-y-4">
                  <div className="font-serif font-black text-3xl text-purple-950 italic border-b border-purple-200 pb-1">
                    ℞
                  </div>

                  <div className="space-y-4 text-xs">
                    {medicines.map((med, i) => (
                      <div key={i} className="space-y-0.5">
                        <div className="flex justify-between items-baseline font-bold text-sm text-gray-950">
                          <span>{i + 1}. {med.name}</span>
                          <span className="font-mono text-xs text-purple-900">{med.dosage}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-gray-600 pl-4">
                          <span>{med.instruction}</span>
                          <span className="italic">{med.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Advice Box */}
                  {advice && (
                    <div className="mt-8 pt-4 border-t border-gray-200 text-xs">
                      <span className="font-bold text-gray-800 block mb-0.5">Advice / পরামর্শ:</span>
                      <p className="text-gray-700">{advice}</p>
                    </div>
                  )}

                  {followUp && (
                    <div className="mt-2 text-xs font-bold text-purple-900">
                      Next Review: {followUp}
                    </div>
                  )}
                </div>
              </div>

              {/* Signature Footer */}
              <div className="mt-12 pt-6 border-t border-gray-300 flex justify-end">
                <div className="text-center w-56">
                  <div className="border-t border-gray-400 pt-1 font-bold text-xs text-gray-900">
                    {selectedDoctor.name}
                  </div>
                  <p className="text-[10px] text-gray-500">{selectedDoctor.degree}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
