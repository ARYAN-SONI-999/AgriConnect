/**
 * Farmer Portal Logic
 */

checkAuth('farmer');

// ─── Confirm Modal Helper ───────────────────────────────────────────────────
function showConfirmModal(message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;z-index:10000;backdrop-filter:blur(4px);';

    const card = document.createElement('div');
    card.style.cssText = 'background:#fff;border-radius:16px;padding:32px 28px;max-width:400px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.2);text-align:center;animation:fadeIn 0.2s ease;';
    card.innerHTML = `
        <div style="font-size:2rem;margin-bottom:12px;">⚠️</div>
        <p style="font-size:1rem;color:#1e293b;margin:0 0 24px;line-height:1.6;">${message}</p>
        <div style="display:flex;gap:12px;justify-content:center;">
            <button id="confirmModalCancel" style="padding:10px 24px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:8px;cursor:pointer;font-size:0.9rem;color:#64748b;transition:background 0.2s;">Cancel</button>
            <button id="confirmModalOk" style="padding:10px 24px;border:none;background:#ef4444;color:#fff;border-radius:8px;cursor:pointer;font-size:0.9rem;font-weight:600;transition:background 0.2s;">Confirm</button>
        </div>
    `;
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const close = () => document.body.removeChild(overlay);
    card.querySelector('#confirmModalCancel').addEventListener('click', close);
    card.querySelector('#confirmModalOk').addEventListener('click', () => { close(); onConfirm(); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}

// ─── Edit Crop Modal ────────────────────────────────────────────────────────
function showEditCropModal(crop) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;z-index:10000;backdrop-filter:blur(4px);';

    const card = document.createElement('div');
    card.style.cssText = 'background:#fff;border-radius:16px;padding:32px 28px;max-width:460px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.2);';
    card.innerHTML = `
        <h3 style="margin:0 0 20px;font-size:1.1rem;color:#1e293b;">Edit Crop: <em>${crop.name}</em></h3>
        <div style="display:flex;flex-direction:column;gap:14px;">
            <label style="font-size:0.85rem;color:#475569;font-weight:600;">Name
                <input id="editCropName" type="text" value="${crop.name}" style="display:block;width:100%;margin-top:4px;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:0.95rem;box-sizing:border-box;">
            </label>
            <label style="font-size:0.85rem;color:#475569;font-weight:600;">Price (₹/kg)
                <input id="editCropPrice" type="number" value="${crop.price}" min="1" style="display:block;width:100%;margin-top:4px;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:0.95rem;box-sizing:border-box;">
            </label>
            <label style="font-size:0.85rem;color:#475569;font-weight:600;">Category
                <select id="editCropCategory" style="display:block;width:100%;margin-top:4px;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:0.95rem;box-sizing:border-box;">
                    <option value="organic" ${crop.category === 'organic' ? 'selected' : ''}>Organic</option>
                    <option value="fruits"  ${crop.category === 'fruits'  ? 'selected' : ''}>Fruits</option>
                    <option value="seasonal"${crop.category === 'seasonal'? 'selected' : ''}>Seasonal</option>
                </select>
            </label>
            <label style="font-size:0.85rem;color:#475569;font-weight:600;">Quantity (kg)
                <input id="editCropQty" type="number" value="${crop.quantity || ''}" min="0" placeholder="e.g. 100" style="display:block;width:100%;margin-top:4px;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:0.95rem;box-sizing:border-box;">
            </label>
        </div>
        <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:24px;">
            <button id="editCropCancel" style="padding:10px 22px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:8px;cursor:pointer;font-size:0.9rem;color:#64748b;">Cancel</button>
            <button id="editCropSave"   style="padding:10px 22px;border:none;background:var(--primary-green,#16a34a);color:#fff;border-radius:8px;cursor:pointer;font-size:0.9rem;font-weight:600;">Save Changes</button>
        </div>
    `;
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const close = () => document.body.removeChild(overlay);
    card.querySelector('#editCropCancel').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    card.querySelector('#editCropSave').addEventListener('click', () => {
        const name     = card.querySelector('#editCropName').value.trim();
        const price    = Number(card.querySelector('#editCropPrice').value);
        const category = card.querySelector('#editCropCategory').value;
        const qty      = card.querySelector('#editCropQty').value;

        if (!name || isNaN(price) || price <= 0) {
            showToast('Please enter valid name and price.', 'error');
            return;
        }

        // Update locally
        const products = DB.getProducts();
        const product  = products.find(p => String(p.id) === String(crop.id));
        if (product) {
            product.name     = name;
            product.price    = price;
            product.category = category;
            if (qty !== '') product.quantity = Number(qty);
            localStorage.setItem(DB.PRODUCTS, JSON.stringify(products));
        }

        // Send to backend
        API.updateProduct(crop.id, { name, price, category, quantity: qty !== '' ? Number(qty) : undefined })
            .catch(() => {/* silent fallback */});

        close();
        renderDashboard();
        showToast('Crop updated successfully!', 'success');
    });
}

// ─── Get My Crops ────────────────────────────────────────────────────────────
function getMyCrops() {
    const user = DB.getCurrentUser();
    if (!user) return [];
    const products = DB.getProducts();
    return products.filter(p => p.farmerId === user.id);
}

// ─── Stock Badge Helper ──────────────────────────────────────────────────────
function getStockBadge(crop) {
    if (crop.quantity === undefined || crop.quantity === null) return '';
    const qty = Number(crop.quantity);
    if (qty <= 10) {
        return `<span style="background:#fee2e2;color:#dc2626;font-size:0.7rem;font-weight:700;padding:2px 8px;border-radius:20px;margin-left:6px;">Low Stock</span>`;
    } else if (qty <= 50) {
        return `<span style="background:#fef3c7;color:#d97706;font-size:0.7rem;font-weight:700;padding:2px 8px;border-radius:20px;margin-left:6px;">Limited</span>`;
    } else {
        return `<span style="background:#dcfce7;color:#16a34a;font-size:0.7rem;font-weight:700;padding:2px 8px;border-radius:20px;margin-left:6px;">In Stock</span>`;
    }
}

// ─── Render Dashboard ────────────────────────────────────────────────────────
function renderDashboard() {
    const user = DB.getCurrentUser();
    if (!user) return;

    // Set personalized greeting
    const subtitleEl = document.getElementById('farmerSubtitle') || document.querySelector('.dashboard-subtitle');
    if (subtitleEl) subtitleEl.textContent = `Welcome back, ${user.name}! 🌾`;

    const renderList = (myCrops) => {
        const cropCountEl = document.getElementById('cropCount');
        if (cropCountEl) cropCountEl.textContent = myCrops.length;

        const cropList = document.getElementById('cropList');
        if (cropList) {
            if (myCrops.length === 0) {
                cropList.innerHTML = '<div style="padding:20px; text-align:center; color:#999">No crops added yet.</div>';
            } else {
                cropList.innerHTML = myCrops.map(crop => `
                    <div class="crop-item">
                        <img src="${crop.image && (crop.image.startsWith('http') || crop.image.startsWith('..')) ? crop.image : '../images/' + (crop.image || '')}" onerror="this.src='https://placehold.co/60?text=${encodeURIComponent(crop.name)}'" class="crop-img">
                        <div class="crop-details">
                            <div style="font-weight:600">${crop.name}${getStockBadge(crop)}</div>
                            <div style="font-size:0.9rem; color:#888">₹${crop.price}/kg • ${crop.type}</div>
                        </div>
                        <div class="crop-actions">
                            <button class="btn-edit" onclick="showEditCropModal(${JSON.stringify(crop).replace(/"/g, '&quot;')})">Edit</button>
                            <button class="btn-delete" onclick="deleteCrop('${crop.id}')">Delete</button>
                        </div>
                    </div>
                `).join('');
            }
        }
    };

    // Render loading spinner
    const cropList = document.getElementById('cropList');
    if (cropList) {
        cropList.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 0; gap: 15px; color: var(--text-medium); width: 100%;">
                <div class="spinner"></div>
                <span style="font-weight: 500;">Loading crops...</span>
            </div>
        `;
    }

    // Fetch from Backend
    API.getProducts()
        .then(products => {
            localStorage.setItem(DB.PRODUCTS, JSON.stringify(products));
            const myCrops = products.filter(p => p.farmerId === user.id);
            renderList(myCrops);
            updateFarmerStats(user.id);
        })
        .catch(() => {
            const myCrops = getMyCrops();
            renderList(myCrops);
            updateFarmerStats(user.id);
        });
}

// ─── Update Dynamic Stats ─────────────────────────────────────────────────────
function updateFarmerStats(farmerId) {
    API.getOrders()
        .then(orders => {
            localStorage.setItem(DB.ORDERS, JSON.stringify(orders));
            calculateAndDisplayStats(orders, farmerId);
        })
        .catch(() => {
            const orders = DB.getOrders() || [];
            calculateAndDisplayStats(orders, farmerId);
        });
}

function calculateAndDisplayStats(orders, farmerId) {
    const myOrders = orders.filter(order =>
        order.items && Array.isArray(order.items) && order.items.some(item => item.farmerId === farmerId)
    );

    const pendingCount = myOrders.filter(order => order.status === 'Pending').length;
    const pendingOrdersCountEl = document.getElementById('pendingOrdersCount');
    if (pendingOrdersCountEl) pendingOrdersCountEl.textContent = pendingCount;

    let totalEarnings = 0;
    myOrders.forEach(order => {
        if (order.status === 'Accepted') {
            order.items.forEach(item => {
                if (item.farmerId === farmerId) {
                    totalEarnings += (item.price * item.quantity);
                }
            });
        }
    });

    const totalEarningsEl = document.getElementById('totalEarningsAmount');
    if (totalEarningsEl) totalEarningsEl.textContent = `₹${totalEarnings.toLocaleString('en-IN')}`;
}

// ─── Edit Crop (legacy redirect → modal) ─────────────────────────────────────
function editCropFromBtn(btn) {
    const id       = btn.dataset.id;
    const products = DB.getProducts();
    const crop     = products.find(p => String(p.id) === String(id));
    if (crop) showEditCropModal(crop);
}

// ─── Delete Crop ──────────────────────────────────────────────────────────────
function deleteCrop(id) {
    showConfirmModal('Stop selling this crop? This action cannot be undone.', () => {
        let products = DB.getProducts();
        products = products.filter(p => String(p.id) !== String(id));
        localStorage.setItem(DB.PRODUCTS, JSON.stringify(products));
        renderDashboard();

        API.deleteProduct(id)
            .then(() => showToast('Crop deleted successfully!', 'success'))
            .catch(() => showToast('Server offline. Crop deleted locally only.', 'warning'));
    });
}

// ─── Add Crop Form ─────────────────────────────────────────────────────────────
const addCropForm = document.getElementById('addCropForm');
if (addCropForm) {
    addCropForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const submitBtn = addCropForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Listing...';
        }

        const user           = DB.getCurrentUser();
        const categorySelect = document.getElementById('category');
        const imageVal       = document.getElementById('cropImage') ? document.getElementById('cropImage').value : '';
        const qtyEl          = document.getElementById('cropQuantity');
        const descEl         = document.getElementById('cropDescription');

        const newCrop = {
            id:          Date.now(),
            name:        document.getElementById('cropName').value,
            price:       Number(document.getElementById('price').value),
            category:    categorySelect.value,
            type:        categorySelect.options[categorySelect.selectedIndex].text,
            image:       imageVal.trim() || 'https://placehold.co/400x300?text=' + encodeURIComponent(document.getElementById('cropName').value),
            farmerId:    user.id,
            quantity:    qtyEl  ? Number(qtyEl.value)  : undefined,
            description: descEl ? descEl.value.trim()  : ''
        };

        API.addProduct(newCrop)
            .then(savedCrop => {
                const products = DB.getProducts();
                products.push(savedCrop || newCrop);
                localStorage.setItem(DB.PRODUCTS, JSON.stringify(products));
                showToast('Crop listed successfully!', 'success');
                setTimeout(() => { window.location.href = 'farmer-home.html'; }, 1000);
            })
            .catch(() => {
                const products = DB.getProducts();
                products.push(newCrop);
                localStorage.setItem(DB.PRODUCTS, JSON.stringify(products));
                showToast('Server offline. Crop saved locally only.', 'warning');
                setTimeout(() => { window.location.href = 'farmer-home.html'; }, 1200);
            });
    });
}

// ─── Render Orders ─────────────────────────────────────────────────────────────
let _allFarmerOrders = [];

function renderOrders() {
    const listEl = document.getElementById('orderListBody');
    if (!listEl) return;

    const user = DB.getCurrentUser();
    if (!user) return;

    listEl.innerHTML = `
        <tr>
            <td colspan="7" style="padding: 40px 0; text-align: center;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 15px; justify-content: center;">
                    <div class="spinner"></div>
                    <span style="color: var(--text-medium); font-weight: 500;">Loading orders...</span>
                </div>
            </td>
        </tr>
    `;

    Promise.all([API.getOrders(), API.getUsers()])
        .then(([orders, users]) => {
            localStorage.setItem(DB.ORDERS, JSON.stringify(orders));
            localStorage.setItem(DB.USERS, JSON.stringify(users));

            _allFarmerOrders = orders.filter(order =>
                order.items && Array.isArray(order.items) && order.items.some(item => item.farmerId === user.id)
            );
            applyOrderFilters();
        })
        .catch(() => {
            listEl.innerHTML = '<tr><td colspan="7" style="padding:20px; text-align:center; color:red">Error loading orders. Is the server running?</td></tr>';
        });
}

function applyOrderFilters() {
    const listEl = document.getElementById('orderListBody');
    if (!listEl) return;

    const statusFilter = document.getElementById('orderStatusFilter');
    const searchEl     = document.getElementById('orderSearch');
    const statusVal    = statusFilter ? statusFilter.value : 'all';
    const searchVal    = searchEl    ? searchEl.value.toLowerCase().trim() : '';

    let filtered = _allFarmerOrders;

    if (statusVal && statusVal !== 'all') {
        filtered = filtered.filter(o => (o.status || 'Pending') === statusVal);
    }
    if (searchVal) {
        filtered = filtered.filter(o =>
            String(o.id).includes(searchVal) ||
            getCustomerName(o.customerId).toLowerCase().includes(searchVal) ||
            (o.items || []).some(i => i.name.toLowerCase().includes(searchVal))
        );
    }

    if (filtered.length === 0) {
        listEl.innerHTML = '<tr><td colspan="7" style="padding:20px; text-align:center; color:#999">No orders found.</td></tr>';
        return;
    }

    const user = DB.getCurrentUser();
    listEl.innerHTML = filtered.map(order => {
        const relevantItems = order.items.filter(i => i.farmerId === user.id);
        const itemNames     = relevantItems.map(i => `${i.name} (×${i.quantity}kg)`).join(', ');

        let statusColor = '#f39c12';
        if (order.status === 'Accepted') statusColor = '#2ecc71';
        if (order.status === 'Rejected') statusColor = '#e74c3c';

        const isActionable = order.status === 'Pending';
        const dateStr = order.date ? `<span style="font-size:0.8rem;color:#94a3b8;">${order.date}</span>` : '';

        return `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 15px;">#${order.id}</td>
                <td style="padding: 15px;">${dateStr}</td>
                <td style="padding: 15px;">${getCustomerName(order.customerId)}</td>
                <td style="padding: 15px;">${itemNames}</td>
                <td style="padding: 15px;">₹${(order.total || 0).toLocaleString('en-IN')}</td>
                <td style="padding: 15px;"><span style="color: ${statusColor}; font-weight:600">${order.status || 'Pending'}</span></td>
                <td style="padding: 15px;">
                    ${isActionable ? `
                        <button class="btn" style="background:var(--primary-green); color:white; padding:5px 10px; font-size:0.8rem; margin-right:5px;" onclick="updateStatus('${order.id}', 'Accepted')">Accept</button>
                        <button class="btn" style="background:#e74c3c; color:white; padding:5px 10px; font-size:0.8rem;" onclick="updateStatus('${order.id}', 'Rejected')">Reject</button>
                    ` : `
                        <span style="color:#aaa; font-size:0.9rem">Completed</span>
                    `}
                </td>
            </tr>
        `;
    }).join('');
}

function getCustomerName(id) {
    if (!id) return 'Guest Customer';
    const users    = DB.getUsers();
    const customer = users.find(u => u.id === id);
    return customer ? customer.name : 'Unknown Customer';
}

async function updateStatus(orderId, status) {
    showConfirmModal(`Mark this order as ${status}?`, async () => {
        try {
            await API.updateOrderStatus(orderId, status);
        } catch(e) {
            // silent fallback
        }
        let orders = DB.getOrders() || [];
        const order = orders.find(o => String(o.id) === String(orderId));
        if (order) {
            order.status = status;
            localStorage.setItem(DB.ORDERS, JSON.stringify(orders));
        }
        showToast(`Order marked as ${status}`, 'success');
        renderOrders();
    });
}

// ─── Profit Chart ──────────────────────────────────────────────────────────────
async function renderProfitChart() {
    const chartEl = document.getElementById('profitChart');
    if (!chartEl) return;

    const user = DB.getCurrentUser();
    if (!user) return;

    try {
        const stats = await API.getFarmerProfit(user.id);
        if (stats && stats.success) {
            // Chart title
            const titleEl = document.getElementById('profitChartTitle');
            if (titleEl) titleEl.textContent = `Monthly Earnings (${new Date().getFullYear()})`;

            const maxVal = Math.max(...stats.chartData.map(d => d.value), 100);
            chartEl.innerHTML = stats.chartData.map(item => {
                const pct = (item.value / maxVal) * 100;
                return `
                    <div class="bar-group">
                        <div class="bar-container">
                            <div class="bar" style="height: ${Math.max(pct, 5)}%;">
                                <span class="bar-value">${item.value > 0 ? '₹' + item.value.toLocaleString('en-IN') : '0'}</span>
                            </div>
                        </div>
                        <div class="bar-label">${item.label}</div>
                    </div>
                `;
            }).join('');

            const revEl    = document.getElementById('statRevenue');
            const prodEl   = document.getElementById('statProduct');
            const growthEl = document.getElementById('statGrowth');

            if (revEl)  revEl.textContent  = `₹${stats.totalRevenue.toLocaleString('en-IN')}`;
            if (prodEl) prodEl.textContent = stats.topProduct;

            if (growthEl) {
                const months          = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                const currentMonthIdx = new Date().getMonth();
                const prevMonth       = months[(currentMonthIdx - 1 + 12) % 12];
                const prevPrevMonth   = months[(currentMonthIdx - 2 + 12) % 12];
                const prevSales       = stats.monthlyRevenue[prevMonth]    || 0;
                const prevPrevSales   = stats.monthlyRevenue[prevPrevMonth] || 0;
                const growth          = prevPrevSales > 0
                    ? (((prevSales - prevPrevSales) / prevPrevSales) * 100).toFixed(1)
                    : (prevSales > 0 ? 100 : 0);

                growthEl.textContent = Number(growth) >= 0 ? `↑ ${growth}%` : `↓ ${Math.abs(growth)}%`;
                growthEl.style.color = Number(growth) >= 0 ? '#2ecc71' : '#ef4444';
            }
        }
    } catch (err) {
        chartEl.innerHTML = '<div style="width:100%; text-align:center; padding-top:100px; color:#999">Error loading profit data. Is the server running?</div>';
    }
}

// ─── Initialize ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const menuBtn  = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            menuBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.classList.toggle('no-scroll');
        });
    }

    if (document.getElementById('cropList'))       renderDashboard();
    if (document.getElementById('orderListBody'))  renderOrders();
    if (document.getElementById('profitChart'))    renderProfitChart();

    // Order filtering listeners
    const statusFilter = document.getElementById('orderStatusFilter');
    const searchEl     = document.getElementById('orderSearch');
    if (statusFilter)  statusFilter.addEventListener('change', applyOrderFilters);
    if (searchEl)      searchEl.addEventListener('input', applyOrderFilters);
});
