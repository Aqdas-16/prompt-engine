export const reviewService = {
    getReviews: () => {
        try {
            const stored = localStorage.getItem('pe_reviews');
            return stored ? JSON.parse(stored) : [];
        }
        catch {
            return [];
        }
    },
    getStats: () => {
        try {
            const stats = localStorage.getItem('pe_review_stats');
            return stats ? JSON.parse(stats) : { totalSubmitted: 0 };
        }
        catch {
            return { totalSubmitted: 0 };
        }
    },
    getFeedbackCount: () => {
        return reviewService.getReviews().length;
    },
    addReview: (review) => {
        const targetEmail = "cognixlabs.team@gmail.com";
        console.log("EMAIL TARGET:", targetEmail);
        // Increment total submitted
        const stats = reviewService.getStats();
        stats.totalSubmitted += 1;
        localStorage.setItem('pe_review_stats', JSON.stringify(stats));
        if (review.rating < 3) {
            return { success: false, message: 'Discarded', saved: false };
        }
        if (review.rating === 3) {
            // basic filter for abusive words / spam
            const text = review.review.toLowerCase();
            const blockedWords = ['spam', 'abuse', 'hate', 'stupid', 'idiot', 'worst', 'sucks', 'terrible'];
            if (blockedWords.some(w => text.includes(w))) {
                return { success: false, message: 'Please keep feedback respectful and constructive', saved: false };
            }
        }
        const reviews = reviewService.getReviews();
        const fourFiveStarReviews = reviews.filter(r => r.rating >= 4);
        const threeStarReviews = reviews.filter(r => r.rating === 3);
        if (review.rating >= 4) {
            if (fourFiveStarReviews.length >= 20) {
                return { success: true, message: 'We\'ve reached our review limit, but your feedback is counted', saved: false };
            }
        }
        else if (review.rating === 3) {
            if (threeStarReviews.length >= 10) {
                return { success: true, message: 'We\'ve reached our review limit, but your feedback is counted', saved: false };
            }
        }
        const validReview = { ...review, approved: true, createdAt: Date.now() };
        const newReviews = [validReview, ...reviews];
        localStorage.setItem('pe_reviews', JSON.stringify(newReviews));
        window.dispatchEvent(new Event("feedbackUpdated"));
        return { success: true, message: 'Thanks for your feedback', saved: true };
    }
};
