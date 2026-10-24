import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MessageSquareHeart, Star, Check, X } from 'lucide-react';

interface SurveyModalProps {
  onClose: () => void;
}

export const SurveyModal: React.FC<SurveyModalProps> = ({ onClose }) => {
  const { addNotification } = useApp();

  const [rating, setRating] = useState(5);
  const [role, setRole] = useState('Laboratory Technologist');
  const [satisfaction, setSatisfaction] = useState('Extremely Satisfied');
  const [feature, setFeature] = useState('Pathology reporting & instant PDF download');
  const [comments, setComments] = useState(
    'The software matches our diagnostic clinic workflow perfectly. Very fast and user-friendly.'
  );
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    addNotification('Feedback Received', 'Thank you for your feedback! Your evaluation was saved.', 'success');
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-purple-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-purple-800 to-indigo-900 text-white">
          <div className="flex items-center gap-2">
            <MessageSquareHeart className="w-5 h-5 text-pink-300" />
            <h3 className="font-semibold text-base">User Feedback & Rating</h3>
          </div>
          <button onClick={onClose} className="p-1 text-white/80 hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 text-xs">
          {submitted ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-gray-900 dark:text-gray-100">Feedback Submitted!</h4>
              <p className="text-gray-500">Thank you for rating MediCare Clinic & Diagnostic Management.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Overall Rating:</label>
                <div className="flex gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Your Role in Clinic:</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded text-xs font-semibold"
                >
                  <option value="Laboratory Technologist">Medical Technologist (Lab)</option>
                  <option value="Consultant Doctor">Consultant Doctor</option>
                  <option value="Front Desk Receptionist">Front Desk Receptionist</option>
                  <option value="Clinic Director">Clinic Director / Management</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Most Valuable Feature:</label>
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => setFeature(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Review Comments:</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-2 rounded text-xs"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-purple-800 to-indigo-900 hover:from-purple-900 hover:to-indigo-950 text-white font-bold rounded-lg text-xs cursor-pointer shadow-md"
                >
                  Submit Clinical Review
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
