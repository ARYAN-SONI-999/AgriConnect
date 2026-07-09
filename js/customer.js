/**
 * Customer Portal Logic
 */

// Check Auth
checkAuth('customer');

// Escape HTML utility to prevent XSS
function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// DOM Elements
const cartCount = document.getElementById('cartCount');
const productsContainer = document.getElementById('productsContainer');

// Update Cart Count
function updateCartCount() {
    const cart = DB.getCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.textContent = count;
}

let allProductsList = [];
let currentPage = 1;
const itemsPerPage = 8;

// Render Products
function renderProducts(category = 'all') {
    if (!productsContainer) return;

    const applyFilterAndSort = () => {
        const searchInput = document.getElementById('searchInput');
        const sortSelect = document.getElementById('sortSelect');
        
        let filtered = category === 'all' ? allProductsList : allProductsList.filter(p => p.category === category);
        
        // Search filter including category search
        if (searchInput && searchInput.value.trim() !== '') {
            const query = searchInput.value.toLowerCase().trim();
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(query) || 
                p.type.toLowerCase().includes(query) ||
                p.category.toLowerCase().includes(query)
            );
        }
        
        // Sorting
        if (sortSelect) {
            const sortVal = sortSelect.value;
            if (sortVal === 'price-low-high') {
                filtered.sort((a, b) => Number(a.price) - Number(b.price));
            } else if (sortVal === 'price-high-low') {
                filtered.sort((a, b) => Number(b.price) - Number(a.price));
            } else if (sortVal === 'name-a-z') {
                filtered.sort((a, b) => a.name.localeCompare(b.name));
            }
        }

        if (filtered.length === 0) {
            productsContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#999; width:100%;">No products found matching your search.</div>';
            renderPagination(0);
            return;
        }

        // Pagination calculations
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        currentPage = Math.min(currentPage, totalPages);
        
        const startIdx = (currentPage - 1) * itemsPerPage;
        const pageItems = filtered.slice(startIdx, startIdx + itemsPerPage);

        productsContainer.innerHTML = pageItems.map(product => {
            const isWishlisted = DB.isInWishlist(product.id);
            const isOutOfStock = product.quantity !== undefined && Number(product.quantity) <= 0;
            return `
                <div class="product-card fade-in" style="cursor: pointer;" onclick="openProductDetail(${product.id}, event)">
                    ${isOutOfStock ? `<div class="out-of-stock-overlay">Out of Stock</div>` : ''}
                    <div class="product-img">
                        <img src="${product.image.startsWith('http') || product.image.startsWith('..') ? product.image : '../images/' + product.image}" 
                             onerror="this.src='https://placehold.co/400x300?text=${encodeURIComponent(product.name)}'" 
                             alt="${escapeHTML(product.name)}" loading="lazy">
                        <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" 
                            onclick="event.stopPropagation(); toggleWishlist(${product.id}, this)" 
                            aria-label="${isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}">
                            ${isWishlisted ? '❤️' : '🤍'}
                        </button>
                    </div>
                    <div class="product-info">
                        <div class="product-title">${escapeHTML(product.name)}</div>
                        <div class="product-meta">By ${escapeHTML(getFarmerName(product.farmerId))} • ${escapeHTML(product.type)}</div>
                        <div class="product-footer">
                            <span class="price">₹${product.price}/kg</span>
                            <button class="btn-add" ${isOutOfStock ? 'disabled' : ''} onclick="event.stopPropagation(); addToCart(${product.id})">Add to Cart</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        renderPagination(totalPages);
    };

    const renderPagination = (totalPages) => {
        let pagContainer = document.getElementById('paginationContainer');
        if (!pagContainer) {
            pagContainer = document.createElement('div');
            pagContainer.id = 'paginationContainer';
            pagContainer.className = 'pagination';
            productsContainer.parentElement.appendChild(pagContainer);
        }
        if (totalPages <= 1) {
            pagContainer.innerHTML = '';
            return;
        }

        let buttonsHTML = `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">Prev</button>`;
        for (let i = 1; i <= totalPages; i++) {
            buttonsHTML += `<button class="page-btn ${currentPage === i ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        }
        buttonsHTML += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">Next</button>`;
        pagContainer.innerHTML = buttonsHTML;
    };

    window.changePage = (page) => {
        currentPage = page;
        applyFilterAndSort();
        window.scrollTo(0, 0);
    };

    const initListeners = (products) => {
        allProductsList = products;
        applyFilterAndSort();

        const searchInput = document.getElementById('searchInput');
        const sortSelect = document.getElementById('sortSelect');
        
        if (searchInput) {
            searchInput.removeEventListener('input', () => { currentPage = 1; applyFilterAndSort(); });
            searchInput.addEventListener('input', () => { 
                currentPage = 1; 
                applyFilterAndSort(); 
                renderAutocomplete(searchInput.value, allProductsList);
            });
            // Close autocomplete on focusout with delay
            searchInput.addEventListener('focusout', () => {
                setTimeout(() => {
                    const dropdown = document.getElementById('autocompleteDropdown');
                    if (dropdown) dropdown.style.display = 'none';
                }, 200);
            });
        }
        if (sortSelect) {
            sortSelect.removeEventListener('change', applyFilterAndSort);
            sortSelect.addEventListener('change', applyFilterAndSort);
            sortSelect.setAttribute('aria-label', 'Sort products dropdown options');
        }
    };

    // Render loading spinner
    productsContainer.innerHTML = `
        <div style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 0; gap: 15px; color: var(--text-medium);">
            <div class="spinner"></div>
            <span style="font-weight: 500;">Loading fresh produce...</span>
        </div>
    `;

    // Fetch from Backend
    Promise.all([
        API.getProducts(),
        API.getUsers()
    ])
        .then(([products, users]) => {
            localStorage.setItem(DB.PRODUCTS, JSON.stringify(products));
            localStorage.setItem(DB.USERS, JSON.stringify(users));
            initListeners(products);
        })
        .catch(err => {
            console.warn('Error fetching data from server, falling back to local storage:', err);
            const localProducts = DB.getProducts() || [];
            initListeners(localProducts);
        });
}

// Search Autocomplete Suggestion Logic
function renderAutocomplete(query, products) {
    const wrapper = document.getElementById('searchInput').parentElement;
    let dropdown = document.getElementById('autocompleteDropdown');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = 'autocompleteDropdown';
        dropdown.className = 'autocomplete-dropdown';
        wrapper.style.position = 'relative';
        wrapper.appendChild(dropdown);
    }
    if (!query || query.length < 2) { dropdown.style.display = 'none'; return; }
    
    const matches = products.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase()) ||
        p.type.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 6);

    if (matches.length === 0) { dropdown.style.display = 'none'; return; }
    
    dropdown.innerHTML = matches.map(p => 
        `<div class="autocomplete-item" onclick="selectAutocomplete('${escapeHTML(p.name)}')">
            <span class="autocomplete-item-name">${escapeHTML(p.name)}</span>
            <span class="autocomplete-item-meta">₹${p.price}/kg • ${escapeHTML(p.type)}</span>
        </div>`
    ).join('');
    dropdown.style.display = 'block';
}

window.selectAutocomplete = (name) => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = name;
        currentPage = 1;
        const event = new Event('input');
        searchInput.dispatchEvent(event);
    }
    const dropdown = document.getElementById('autocompleteDropdown');
    if (dropdown) dropdown.style.display = 'none';
};

// Wishlist Heart Toggle
window.toggleWishlist = (productId, btn) => {
    if (DB.isInWishlist(productId)) {
        DB.removeFromWishlist(productId);
        btn.innerHTML = '🤍';
        btn.classList.remove('active');
        btn.setAttribute('aria-label', 'Add to wishlist');
        showToast('Removed from wishlist', 'info');
    } else {
        DB.addToWishlist(productId);
        btn.innerHTML = '❤️';
        btn.classList.add('active');
        btn.setAttribute('aria-label', 'Remove from wishlist');
        showToast('Added to wishlist! ❤️', 'success');
    }
};

// Product detailed view modal
async function openProductDetail(productId, event) {
    if (event) event.stopPropagation();
    const products = DB.getProducts() || [];
    const product = products.find(p => Number(p.id) === Number(productId));
    if (!product) return;

    const users = DB.getUsers() || [];
    const farmer = users.find(u => u.id === product.farmerId) || { name: 'Verified Farmer', location: 'Local Green Farm' };

    // Fetch reviews from server if possible, fallback to local storage
    let productReviews = [];
    try {
        productReviews = await API.getReviews(productId);
    } catch(e) {
        if (window.Reviews) productReviews = Reviews.getLocalReviews(productId);
    }

    const isOutOfStock = product.quantity !== undefined && Number(product.quantity) <= 0;

    // Create Modal Element
    const modal = document.createElement('div');
    modal.id = 'productDetailModal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '9999';
    modal.style.backdropFilter = 'blur(5px)';

    modal.innerHTML = `
        <div class="card fade-in" role="dialog" aria-modal="true" aria-labelledby="modalProductTitle" style="width: 500px; max-width: 90%; max-height:90vh; overflow-y:auto; background: white; border-radius: 16px; position: relative; padding: 0; box-shadow: var(--shadow-lg);">
            <button onclick="closeProductDetail()" aria-label="Close product details" style="position: absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.5); color: white; border: none; width: 35px; height: 35px; border-radius: 50%; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10;">&times;</button>
            <img src="${product.image.startsWith('http') || product.image.startsWith('..') ? product.image : '../images/' + product.image}" onerror="this.src='https://placehold.co/400x300?text=${encodeURIComponent(product.name)}'" style="width: 100%; height: 220px; object-fit: cover;">
            <div style="padding: 25px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom:10px;">
                    <h2 id="modalProductTitle" style="margin: 0; color: var(--text-dark);">${escapeHTML(product.name)}</h2>
                    <span class="badge badge-green">${escapeHTML(product.type)}</span>
                </div>
                
                <div style="margin-top: 15px; font-size: 0.95rem; color: #555; line-height: 1.6;">
                    <p style="margin: 5px 0;"><strong>🌾 Category:</strong> ${escapeHTML(product.category.toUpperCase())}</p>
                    <p style="margin: 5px 0;"><strong>👨‍🌾 Harvested By:</strong> ${escapeHTML(farmer.name)}</p>
                    <p style="margin: 5px 0;"><strong>📍 Farm Origin:</strong> ${escapeHTML(farmer.location || 'Green Valley farm')}</p>
                    <p style="margin: 5px 0;"><strong>📦 Stock Level:</strong> ${isOutOfStock ? '<span style="color:#dc2626;font-weight:700;">Out of Stock</span>' : (product.quantity || 100) + ' kg available'}</p>
                    ${product.description ? `<p style="margin: 10px 0 5px;"><strong>📄 Info:</strong> ${escapeHTML(product.description)}</p>` : ''}
                </div>

                <!-- Quantity input selector -->
                ${!isOutOfStock ? `
                <div style="display:flex; align-items:center; gap:12px; margin-top:20px; background:#f8fafc; padding:10px 15px; border-radius:8px; border:1px solid #e2e8f0;">
                    <label for="modalQty" style="font-weight:600; font-size:0.9rem;">Qty (kg):</label>
                    <input type="number" id="modalQty" name="qty" min="1" max="${product.quantity || 100}" step="1" value="1" style="width:85px; padding:6px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.95rem; text-align:center;">
                </div>
                ` : ''}

                <div style="margin-top: 25px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; padding-top: 20px;">
                    <span style="font-size: 1.4rem; font-weight: 800; color: var(--primary-green);">₹${product.price}/kg</span>
                    <button class="btn btn-primary" ${isOutOfStock ? 'disabled' : ''} onclick="addToCartFromModal(${product.id})" style="border: none; background: var(--primary-green); padding: 10px 25px; border-radius: 8px;">Add to Cart</button>
                </div>

                <!-- Reviews section wrapper -->
                <div id="reviewsContainer"></div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Render reviews using Reviews module
    const reviewsDiv = document.getElementById('reviewsContainer');
    if (reviewsDiv && window.Reviews) {
        reviewsDiv.innerHTML = Reviews.renderReviewsSection(productId, productReviews, DB.getCurrentUser());
    }

    // Keyboard focus trap inside modal
    const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex="0"]');
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const tabHandler = (e) => {
        if (e.key !== 'Tab') return;
        if (e.shiftKey) { // Shift + Tab
            if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            }
        } else { // Tab
            if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    };
    modal.addEventListener('keydown', tabHandler);

    // Escape listener
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            cleanup();
        }
    };
    document.addEventListener('keydown', escHandler);

    function cleanup() {
        modal.removeEventListener('keydown', tabHandler);
        document.removeEventListener('keydown', escHandler);
        closeProductDetail();
    }

    // Bind close logic
    modal.querySelector('[aria-label="Close product details"]').onclick = cleanup;
    firstElement.focus();
}

window.openProductDetail = openProductDetail;

window.closeProductDetail = function() {
    const modal = document.getElementById('productDetailModal');
    if (modal) modal.remove();
};

window.addToCartFromModal = (productId) => {
    const qtyInput = document.getElementById('modalQty');
    const quantity = qtyInput ? Number(qtyInput.value) : 1;
    addToCart(productId, quantity);
    window.closeProductDetail();
};

// Helper to get farmer name
function getFarmerName(id) {
    const users = DB.getUsers() || [];
    const farmer = users.find(u => u.id === id);
    return farmer ? farmer.name : 'Unknown Farmer';
}

// Add to Cart with Quantity Support
function addToCart(productId, quantity = 1) {
    const products = DB.getProducts() || [];
    const product = products.find(p => p.id.toString() === productId.toString());
    if (product) {
        DB.addToCart(product, quantity);
        updateCartCount();
        showToast(`${product.name} (${quantity}kg) added to your cart!`, 'success');
    }
}
window.addToCart = addToCart;

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();

    // Mobile menu toggle
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            menuBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.classList.toggle('no-scroll');
        });
    }

    // Determine page type to render specific category
    const path = window.location.pathname;
    if (path.includes('fruits')) renderProducts('fruits');
    else if (path.includes('seasonal')) renderProducts('seasonal');
    else if (path.includes('organic')) renderProducts('organic');
});
