import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Star, Quote, ArrowRight, X, Filter } from 'lucide-react';
import { ReviewData } from './ReviewModal';
import { reviewService } from '../services/reviewService';
import { counterService } from '../services/counterService';

export function ReviewSection() {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showAllModal, setShowAllModal] = useState(false);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');

  const refreshReviews = () => {
    const stored = reviewService.getReviews();
    const count = reviewService.getFeedbackCount();
    const currentTotalUsers = counterService.getCounts().totalUsers;

    console.log({ feedbackCount: count, totalUsers: currentTotalUsers });

    if (count > currentTotalUsers) {
      console.warn("Feedback count is irregularly larger than total users.");
    }

    let displayReviews = [...stored];
    displayReviews.sort((a, b) => b.rating - a.rating || (b.createdAt || 0) - (a.createdAt || 0));
    setReviews(displayReviews);
    setFeedbackCount(count);
    setTotalUsers(currentTotalUsers);
  };

  useEffect(() => {
    refreshReviews();
    window.addEventListener("feedbackUpdated", refreshReviews);
    window.addEventListener("statsUpdated", refreshReviews);
    return () => {
      window.removeEventListener("feedbackUpdated", refreshReviews);
      window.removeEventListener("statsUpdated", refreshReviews);
    };
  }, []);

  const getFeedbackDisplayText = () => {
    if (feedbackCount === 0) return "No feedback yet. Be the first to share.";
    if (feedbackCount < 10) return `${feedbackCount} users shared feedback`;
    return `${Math.floor(feedbackCount / 10) * 10}+ users shared feedback`;
  };

  const reviewsToShow = reviews.slice(0, 6);
  
  const filteredReviews = filterRating === 'all' 
    ? reviews.slice(0, 30)
    : reviews.filter(r => r.rating === filterRating).slice(0, 30);

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
      
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white mb-3">What Our Users Say</h2>
        <p className={`text-sm font-medium ${feedbackCount === 0 ? "text-gray-500" : "text-indigo-500"} mb-2`}>{getFeedbackDisplayText()}</p>
        <p className="text-base text-gray-500 dark:text-gray-400">Join the thousands upgrading their prompt engineering workflow.</p>
      </div>

      {reviewsToShow.length > 0 ? (
        <>
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${reviewsToShow.length < 6 ? 'justify-center max-w-5xl mx-auto' : ''}`}>
            {reviewsToShow.map((review, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="p-5 rounded-2xl backdrop-blur-[14px] bg-white/40 dark:bg-white/[0.04] border border-white/50 dark:border-white/[0.1] shadow-sm flex flex-col h-full transition-transform duration-300 hover:-translate-y-1 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                  {review.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">{review.name}</h4>
                </div>
              </div>
              <div className="flex text-yellow-500 dark:text-yellow-400 shrink-0">
                {[...Array(5)].map((_, idx) => (
                  <Star key={idx} size={12} className={idx < review.rating ? "fill-current" : "text-gray-200 dark:text-gray-700"} />
                ))}
              </div>
            </div>
            
            <p className="text-xs text-gray-600 dark:text-gray-300 flex-grow relative z-10 leading-relaxed font-medium line-clamp-3">
              "{review.review || 'This tool has significantly improved my AI workflows. Highly recommended!'}"
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <button 
          onClick={() => setShowAllModal(true)}
          className="group flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm"
        >
          View All Reviews <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
      </>
      ) : null}

      {showAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-gray-50 dark:bg-gray-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10 shrink-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Community Reviews <span className="text-xs font-semibold px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">{reviews.length} Total</span>
              </h3>
              
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                   {[{label: 'All', val: 'all'}, {label: '5★', val: 5}, {label: '4★', val: 4}, {label: '3★', val: 3}].map(f => (
                     <button
                       key={f.label}
                       onClick={() => setFilterRating(f.val as number | 'all')}
                       className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filterRating === f.val ? 'bg-white dark:bg-gray-700 shadow flex items-center justify-center' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                     >
                       {f.label}
                     </button>
                   ))}
                </div>
                <button 
                  onClick={() => setShowAllModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto w-full">
               {/* Mobile Filter */}
               <div className="sm:hidden flex items-center gap-1.5 p-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg shrink-0">
                   {[{label: 'All', val: 'all'}, {label: '5★', val: 5}, {label: '4★', val: 4}, {label: '3★', val: 3}].map(f => (
                     <button
                       key={f.label}
                       onClick={() => setFilterRating(f.val as number | 'all')}
                       className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${filterRating === f.val ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
                     >
                       {f.label}
                     </button>
                   ))}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {filteredReviews.length > 0 ? filteredReviews.map((review, i) => (
                   <div key={i} className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col space-y-3">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2.5">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-inner shrink-0">
                           {review.name.charAt(0).toUpperCase()}
                         </div>
                         <div className="flex flex-col">
                           <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-none">{review.name}</h4>
                           <span className="text-[10px] text-gray-400 mt-1">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recent'}</span>
                         </div>
                       </div>
                       <div className="flex gap-0.5 text-yellow-400">
                          {[...Array(review.rating)].map((_, idx) => (
                            <Star key={idx} size={12} className="fill-current" />
                          ))}
                       </div>
                     </div>
                     <p className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                       "{review.review || 'Awesome tool!'}"
                     </p>
                   </div>
                 )) : (
                   <div className="col-span-1 md:col-span-2 text-center py-10 text-gray-500 dark:text-gray-400 text-sm">
                      No reviews found for this filter.
                   </div>
                 )}
               </div>
               
               {filteredReviews.length >= 30 && filterRating === 'all' && (
                 <div className="mt-8 text-center text-xs text-gray-400">
                   Showing maximum of 30 reviews.
                 </div>
               )}
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}
