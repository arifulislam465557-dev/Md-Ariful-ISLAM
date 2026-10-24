import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MessageSquare, Star, CheckCircle, X, Send } from 'lucide-react';

interface FeedbackModalProps {
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose }) => {
  const { lang, addNotification } = useApp();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    addNotification('Feedback Submitted', 'Thank you for rating MediCare Clinical Management.', 'success');
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-purple-200">
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-purple-800 to-indigo-900 text-white">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-200" />
            <h3 className="font-bold text-sm">
              {lang === 'bn' ? 'ব্যবহারকারী মতামত ও পরামর্শ' : 'Clinic Staff Feedback & Suggestions'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {submitted ? (
            <div className="py-8 text-center space-y-2">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-base text-slate-900">
                {lang === 'bn' ? 'মতামত প্রদানের জন্য ধন্যবাদ!' : 'Thank you for your feedback!'}
              </h4>
              <p className="text-slate-500">Your review helps improve our clinical diagnostic software.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-slate-600 font-medium mb-1.5 text-center">
                  {lang === 'bn' ? 'সফটওয়্যার রেটিং দিন' : 'Rate Your Experience'}
                </label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-1.5 rounded-lg transition-transform hover:scale-110 cursor-pointer ${
                        rating >= star ? 'text-amber-400' : 'text-slate-200'
                      }`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {lang === 'bn' ? 'আপনার মন্তব্য বা নতুন ফিচারের প্রস্তাবনা' : 'Your Comments & Feature Requests'}
                </label>
                <textarea
                  rows={4}
                  required
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder={lang === 'bn' ? 'কোনো সমস্যা বা নতুন কিছু যোগ করার থাকলে লিখুন...' : 'Describe any issues or feature enhancements you would like...'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-purple-600 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Review</span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
