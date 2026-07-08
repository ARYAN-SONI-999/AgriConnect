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

// Render Products
function renderProducts(category = 'all') {
    if (!productsContainer) return;

    const applyFilterAndSort = () => {
        const searchInput = document.getElementById('searchInput');
        const sortSelect = document.getElementById('sortSelect');
        
        let filtered = category === 'all' ? allProductsList : allProductsList.filter(p => p.category === category);
        
        // Search filter
        if (searchInput && searchInput.value.trim() !== '') {
            const query = searchInput.value.toLowerCase().trim();
            filtered = filtered.filter(p => p.name.toLowerCase().includes(query) || p.type.toLowerCase().includes(query));
        }
        
        // Sorting
        if (sortSelect) {
            const sortVal = sortSelect.value;
            if (sortVal === 'price-low-high') {
                filtered.sort((a, b) => a.price - b.price);
            } else if (sortVal === 'price-high-low') {
                filtered.sort((a, b) => b.price - a.price);
            } else if (sortVal === 'name-a-z') {
                filtered.sort((a, b) => a.name.localeCompare(b.name));
            }
        }

        if (filtered.length === 0) {
            productsContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#999; width:100%;">No products found matching your search.</div>';
            return;
        }

        productsContainer.innerHTML = filtered.map(product => `
            <div class="product-card fade-in" style="cursor: pointer;" onclick="openProductDetail(${product.id}, event)">
                <div class="product-img">
                    <img src="${product.image.startsWith('http') || product.image.startsWith('..') ? product.image : '../images/' + product.image}" onerror="this.src='https://placehold.co/400x300?text=${encodeURIComponent(product.name)}'" alt="${escapeHTML(product.name)}">
                </div>
                <div class="product-info">
                    <div class="product-title">${escapeHTML(product.name)}</div>
                    <div class="product-meta">By ${escapeHTML(getFarmerName(product.farmerId))} • ${escapeHTML(product.type)}</div>
                    <div class="product-footer">
                        <span class="price">RS ${product.price}/kg</span>
                        <button class="btn-add" onclick="event.stopPropagation(); addToCart(${product.id})">Add to Cart</button>
                    </div>
                </div>
            </div>
        `).join('');
    };

    const initListeners = (products) => {
        allProductsList = products;
        applyFilterAndSort();

        const searchInput = document.getElementById('searchInput');
        const sortSelect = document.getElementById('sortSelect');
        
        if (searchInput) {
            searchInput.removeEventListener('input', applyFilterAndSort);
            searchInput.addEventListener('input', applyFilterAndSort);
        }
        if (sortSelect) {
            sortSelect.removeEventListener('change', applyFilterAndSort);
            sortSelect.addEventListener('change', applyFilterAndSort);
        }
    };

    // Render loading spinner
    productsContainer.innerHTML = `
        <div style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 0; gap: 15px; color: var(--text-medium);">
            <div class="spinner"></div>
            <span style="font-weight: 500;">Loading fresh produce...</span>
        </div>
    `;

    // Fetch from Backend (Products & Users to resolve farmer names)
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

// Product detailed view modal
function openProductDetail(productId, event) {
    if (event) event.stopPropagation();
    const products = DB.getProducts() || [];
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const users = DB.getUsers() || [];
    const farmer = users.find(u => u.id === product.farmerId) || { name: 'Verified Farmer', location: 'Local Green Farm' };

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
        <div class="card fade-in" role="dialog" aria-modal="true" aria-labelledby="modalProductTitle" style="width: 500px; max-width: 90%; background: white; border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-lg); position: relative; padding: 0;">
            <button onclick="closeProductDetail()" style="position: absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.5); color: white; border: none; width: 35px; height: 35px; border-radius: 50%; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10;">&times;</button>
            <img src="${product.image.startsWith('http') || product.image.startsWith('..') ? product.image : '../images/' + product.image}" onerror="this.src='https://placehold.co/400x300?text=${encodeURIComponent(product.name)}'" style="width: 100%; height: 260px; object-fit: cover;">
            <div style="padding: 25px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom:10px;">
                    <h2 id="modalProductTitle" style="margin: 0; color: var(--text-dark);">${escapeHTML(product.name)}</h2>
                    <span style="background: #eafaf1; color: var(--primary-green); padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 0.9rem;">${escapeHTML(product.type)}</span>
                </div>
                <div style="margin-top: 15px; font-size: 0.95rem; color: #555; line-height: 1.6;">
                    <p style="margin: 5px 0;"><strong>🌾 Category:</strong> ${escapeHTML(product.category.toUpperCase())}</p>
                    <p style="margin: 5px 0;"><strong>👨‍🌾 Harvested By:</strong> ${escapeHTML(farmer.name)}</p>
                    <p style="margin: 5px 0;"><strong>📍 Farm Origin:</strong> ${escapeHTML(farmer.location || 'Green Valley farm')}</p>
                </div>
                <div style="margin-top: 25px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; padding-top: 20px;">
                    <span style="font-size: 1.4rem; font-weight: 800; color: var(--primary-green);">RS ${product.price}/kg</span>
                    <button class="btn btn-primary" onclick="addToCartFromModal(${product.id})" style="border: none; background: var(--primary-green); padding: 10px 25px; border-radius: 8px;">Add to Cart</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function closeProductDetail() {
    const modal = document.getElementById('productDetailModal');
    if (modal) modal.remove();
}

function addToCartFromModal(productId) {
    addToCart(productId);
    closeProductDetail();
}

// Helper to get farmer name
function getFarmerName(id) {
    const users = DB.getUsers() || [];
    const farmer = users.find(u => u.id === id);
    return farmer ? farmer.name : 'Unknown Farmer';
}

// Add to Cart
function addToCart(productId) {
    const products = DB.getProducts() || [];
    const product = products.find(p => p.id.toString() === productId.toString());
    if (product) {
        DB.addToCart(product);
        updateCartCount();
        showToast(`${product.name} added to your cart!`, 'success');
    }
}

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
