import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star, X } from 'lucide-react';

export interface ReviewData {
  name: string;
  rating: number;
  review: string;
  recommended: boolean;
  createdAt: number;
}

interface ReviewModalProps {
  onClose: () => void;
  onSubmit: (reviewData: ReviewData) => void;
}

export function ReviewModal({ onClose, onSubmit }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [recommended, setRecommended] = useState<boolean | null>(null);
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit({
      name: name.trim() || "Anonymous User",
      rating,
      review: reviewText,
      recommended: recommended ?? true,
      createdAt: Date.now()
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-10 transition-colors">
           <X size={20} />
        </button>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-1 text-gray-900 dark:text-gray-100">Enjoying PromptEngine?</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">We'd love to hear your feedback on the prompts generated.</p>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <input 
                type="text" 
                placeholder="Your Name (Optional)" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors"
              />
            </div>
            
                <div className="flex flex-col items-center gap-2 my-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rate your experience</span>
                  <div className="flex gap-2">
                     {[1,2,3,4,5].map(star => (
                       <button 
                         key={star} 
                         type="button" 
                         className={`focus:outline-none transition-transform hover:scale-110 ${star < 3 ? 'cursor-not-allowed opacity-50' : ''}`}
                         onMouseEnter={() => { if(star >= 3) setHoverRating(star); }}
                         onMouseLeave={() => { if(star >= 3) setHoverRating(0); }}
                         onClick={() => { if(star >= 3) setRating(star); }}
                         title={star < 3 ? "Please contact support for critical issues" : `${star} stars`}
                       >
                         <Star 
                           size={28} 
                           className={`${(hoverRating || rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'} transition-colors`} 
                         />
                       </button>
                     ))}
                  </div>
                  {rating === 0 && <span className="text-[10px] text-gray-400">Scores 3 and above are currently accepted here.</span>}
                </div>

            <div>
              <textarea 
                placeholder="What did you like or dislike? (Optional)"
                rows={3}
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Would you recommend us?</span>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setRecommended(true)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${recommended === true ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  Yes 👍
                </button>
                <button 
                  type="button"
                  onClick={() => setRecommended(false)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${recommended === false ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  No 👎
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={rating === 0}
              className="mt-2 w-full py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 disabled:opacity-50 transition-opacity shadow-sm"
            >
              Submit Feedback
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="w-full py-2 rounded-lg font-medium text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              Remind me later
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
