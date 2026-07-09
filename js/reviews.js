/**
 * AgriConnect Reviews System
 * Handles product star ratings and customer reviews.
 */

const Reviews = {
    // Render star rating HTML (filled/empty)
    renderStars(rating, max = 5) {
        const stars = [];
        for (let i = 1; i <= max; i++) {
            if (i <= Math.floor(rating)) {
                stars.push('<span class="star" aria-hidden="true" style="color:#f59e0b">★</span>');
            } else if (i - 0.5 <= rating) {
                stars.push('<span class="star" aria-hidden="true" style="color:#f59e0b">⭐</span>');
            } else {
                stars.push('<span class="star star-empty" aria-hidden="true" style="color:#d1d5db">☆</span>');
            }
        }
        return `<span class="stars" aria-label="${rating} out of ${max} stars" style="display:inline-flex;gap:2px;">${stars.join('')}</span>`;
    },

    // Get average rating for a product
    getAverageRating(reviews) {
        if (!reviews || reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
        return Math.round((sum / reviews.length) * 10) / 10;
    },

    // Render the full reviews section HTML
    renderReviewsSection(productId, reviews, currentUser) {
        const avg = this.getAverageRating(reviews);
        const canReview = currentUser && currentUser.role === 'customer';
        
        const reviewsList = reviews.length === 0
            ? '<p style="color:#94a3b8;text-align:center;padding:20px;">No reviews yet. Be the first!</p>'
            : reviews.map(r => `
                <div style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                        <div style="display:flex;align-items:center;gap:8px;">
                            <strong style="font-size:0.9rem;">${escapeHTML(r.customerName || 'Customer')}</strong>
                            ${this.renderStars(r.rating)}
                        </div>
                        <span style="font-size:0.75rem;color:#94a3b8;">${r.date || ''}</span>
                    </div>
                    <p style="font-size:0.85rem;color:#64748b;margin:0;">${escapeHTML(r.comment || '')}</p>
                </div>
            `).join('');

        const addForm = canReview ? `
            <div style="margin-top:20px;padding-top:15px;border-top:1px solid #e2e8f0;">
                <h4 style="margin-bottom:12px;font-size:0.95rem;">Leave a Review</h4>
                <div style="display:flex;gap:8px;margin-bottom:10px;">
                    ${[1,2,3,4,5].map(n => 
                        `<button onclick="Reviews.selectStar(${n}, this.parentElement)" class="star-select-btn" data-value="${n}" 
                            style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:#d1d5db;transition:color 0.2s;" 
                            aria-label="${n} stars">★</button>`
                    ).join('')}
                </div>
                <input type="hidden" id="reviewRating_${productId}" value="0">
                <textarea id="reviewComment_${productId}" placeholder="Share your experience..." rows="2"
                    style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:0.85rem;resize:none;font-family:inherit;"
                    maxlength="300"></textarea>
                <button onclick="Reviews.submitReview(${productId})" class="btn btn-primary" 
                    style="margin-top:10px;font-size:0.85rem;padding:8px 20px;border:none;background:var(--primary-green);">Submit Review</button>
            </div>
        ` : (currentUser ? '' : '<p style="font-size:0.85rem;color:#94a3b8;margin-top:10px;">Log in as a customer to leave a review.</p>');

        return `
            <div style="border-top:1px solid #e2e8f0;margin-top:20px;padding-top:15px;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:15px;">
                    <h3 style="font-size:1rem;margin:0;">Customer Reviews</h3>
                    ${avg > 0 ? `<span style="display:flex;align-items:center;gap:4px;">${this.renderStars(avg)}<span style="font-size:0.85rem;color:#64748b;">(${reviews.length})</span></span>` : ''}
                </div>
                <div id="reviewsList_${productId}">${reviewsList}</div>
                ${addForm}
            </div>
        `;
    },

    // Star selection handler
    selectStar(value, container) {
        const buttons = container.querySelectorAll('.star-select-btn');
        // Find input hidden field
        const productId = container.nextElementSibling?.id?.replace('reviewRating_', '');
        if (productId) {
            const hidden = document.getElementById('reviewRating_' + productId);
            if (hidden) hidden.value = value;
        }
        buttons.forEach((btn, idx) => {
            btn.style.color = idx < value ? '#f59e0b' : '#d1d5db';
        });
    },

    // Submit a review
    async submitReview(productId) {
        const user = DB.getCurrentUser();
        if (!user || user.role !== 'customer') {
            showToast('Please log in as a customer to review', 'error'); return;
        }
        const rating = parseInt(document.getElementById('reviewRating_' + productId)?.value || '0');
        const comment = document.getElementById('reviewComment_' + productId)?.value?.trim();
        if (!rating || rating < 1) { showToast('Please select a star rating', 'warning'); return; }
        if (!comment) { showToast('Please write a review comment', 'warning'); return; }

        const review = {
            productId,
            rating,
            comment,
            customerId: user.id,
            customerName: user.name,
            date: new Date().toLocaleDateString('en-IN')
        };

        try {
            await API.addReview(review);
            showToast('Review submitted successfully!', 'success');
            setTimeout(() => { location.reload(); }, 1200);
        } catch(e) {
            // Fallback to localStorage
            const reviews = JSON.parse(localStorage.getItem('agri_reviews_v1') || '[]');
            reviews.push({ ...review, id: Date.now() });
            localStorage.setItem('agri_reviews_v1', JSON.stringify(reviews));
            showToast('Review saved locally!', 'success');
            setTimeout(() => { location.reload(); }, 1200);
        }
    },

    // Get reviews for a product (from localStorage fallback)
    getLocalReviews(productId) {
        const all = JSON.parse(localStorage.getItem('agri_reviews_v1') || '[]');
        return all.filter(r => Number(r.productId) === Number(productId));
    }
};

window.Reviews = Reviews;
