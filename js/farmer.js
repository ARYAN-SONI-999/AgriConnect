/**
 * Farmer Portal Logic
 */

checkAuth('farmer');

// Helper to get my crops
function getMyCrops() {
    const user = DB.getCurrentUser();
    console.log('Current User:', user);

    if (!user) return [];

    const products = DB.getProducts();

    // Filter by farmer ID. We need to ensure we are comparing strings/numbers correctly.
    // In init(), we set ids like 'f1', 'f2'. 
    // If a new user registers, they get a timestamp ID.
    // We filter products where farmerId matches the user.id.
    const myCrops = products.filter(p => p.farmerId === user.id);

    console.log('My Crops:', myCrops); // Debug log
    return myCrops;
}

// Render Dashboard
// Render Dashboard
function renderDashboard() {
    const user = DB.getCurrentUser();
    if (!user) return;

    const renderList = (myCrops) => {
        const cropCountEl = document.getElementById('cropCount');
        if (cropCountEl) {
            cropCountEl.textContent = myCrops.length;
        }

        const cropList = document.getElementById('cropList');
        if (cropList) {
            if (myCrops.length === 0) {
                cropList.innerHTML = '<div style="padding:20px; text-align:center; color:#999">No crops added yet.</div>';
            } else {
                cropList.innerHTML = myCrops.map(crop => `
                    <div class="crop-item">
                        <img src="${crop.image.startsWith('http') || crop.image.startsWith('..') ? crop.image : '../images/' + crop.image}" onerror="this.src='https://placehold.co/60?text=${crop.name}'" class="crop-img">
                        <div class="crop-details">
                            <div style="font-weight:600">${crop.name}</div>
                            <div style="font-size:0.9rem; color:#888">RS ${crop.price}/kg • ${crop.type}</div>
                        </div>
                        <div class="crop-actions">
                            <button class="btn-edit" data-id="${crop.id}" data-name="${crop.name.replace(/"/g, '&quot;')}" data-price="${crop.price}" onclick="editCropFromBtn(this)">Edit</button>
                            <button class="btn-delete" onclick="deleteCrop(${crop.id})">Delete</button>
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

    // Fetch from Backend (db.json)
    API.getProducts()
        .then(products => {
            // Update LocalStorage to keep client-side logic in sync
            localStorage.setItem(DB.PRODUCTS, JSON.stringify(products));
            console.log('📦 Products fetched from server:', products.length);

            const myCrops = products.filter(p => p.farmerId === user.id);
            renderList(myCrops);
            updateFarmerStats(user.id);
        })
        .catch(err => {
            console.warn('Error fetching dashboard data, falling back to local storage:', err);
            const myCrops = getMyCrops();
            renderList(myCrops);
            updateFarmerStats(user.id);
        });
}

// Update Dynamic Stats on Dashboard
function updateFarmerStats(farmerId) {
    // Try to fetch orders from server to keep stats fresh
    API.getOrders()
        .then(orders => {
            localStorage.setItem(DB.ORDERS, JSON.stringify(orders));
            calculateAndDisplayStats(orders, farmerId);
        })
        .catch(err => {
            console.warn('Error fetching orders for stats, using local storage:', err);
            const orders = DB.getOrders() || [];
            calculateAndDisplayStats(orders, farmerId);
        });
}

function calculateAndDisplayStats(orders, farmerId) {
    // Filter orders relevant to this farmer
    const myOrders = orders.filter(order =>
        order.items && Array.isArray(order.items) && order.items.some(item => item.farmerId === farmerId)
    );

    // Pending Orders count (status is Pending)
    const pendingCount = myOrders.filter(order => order.status === 'Pending').length;
    const pendingOrdersCountEl = document.getElementById('pendingOrdersCount');
    if (pendingOrdersCountEl) {
        pendingOrdersCountEl.textContent = pendingCount;
    }

    // Total Earnings (Accepted orders)
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
    if (totalEarningsEl) {
        totalEarningsEl.textContent = `RS ${totalEarnings.toLocaleString()}`;
    }
}

// Edit Crop
function editCrop(id, currentName, currentPrice) {
    const newPrice = prompt(`Enter new price for ${currentName} (Current: RS ${currentPrice})`, currentPrice);

    if (newPrice !== null && newPrice !== "" && !isNaN(newPrice)) {
        const price = Number(newPrice);

        // Update locally immediately
        const products = DB.getProducts();
        const product = products.find(p => p.id === id);
        if (product) {
            product.price = price;
            localStorage.setItem(DB.PRODUCTS, JSON.stringify(products));
            renderDashboard();

            // Send to Backend
            API.updateProductPrice(id, price)
                .then(() => {
                    showToast('Crop price updated successfully!', 'success');
                })
                .catch(err => {
                    console.warn('Server offline. Price updated locally only.', err);
                    showToast('Server offline. Price updated locally only.', 'warning');
                });
        }
    }
}
function editCropFromBtn(btn) {
    const id = Number(btn.dataset.id);
    const name = btn.dataset.name;
    const price = Number(btn.dataset.price);
    editCrop(id, name, price);
}

function deleteCrop(id) {
    if (confirm('Stop selling this crop?')) {
        // Update local storage immediately
        let products = DB.getProducts();
        products = products.filter(p => Number(p.id) !== Number(id));
        localStorage.setItem(DB.PRODUCTS, JSON.stringify(products));
        renderDashboard();

        // Send DELETE to backend
        API.deleteProduct(id)
            .then(() => {
                showToast('Crop deleted successfully!', 'success');
            })
            .catch(err => {
                console.warn('Server offline. Crop deleted locally only.', err);
                showToast('Server offline. Crop deleted locally only.', 'warning');
            });
    }
}

// Add Crop Form
const addCropForm = document.getElementById('addCropForm');
if (addCropForm) {
    addCropForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Disable submit button to prevent double-clicks/duplicate submissions
        const submitBtn = addCropForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Listing...';
        }

        const user = DB.getCurrentUser();
        const categorySelect = document.getElementById('category');

        const imageVal = document.getElementById('cropImage') ? document.getElementById('cropImage').value : '';
        const newCrop = {
            id: Date.now(), // Unique ID
            name: document.getElementById('cropName').value,
            price: Number(document.getElementById('price').value),
            category: categorySelect.value,
            type: categorySelect.options[categorySelect.selectedIndex].text,
            image: imageVal.trim() || "https://placehold.co/400x300?text=" + encodeURIComponent(document.getElementById('cropName').value),
            farmerId: user.id
        };

        // Send to Backend (db.json)
        API.addProduct(newCrop)
            .then(savedCrop => {
                // Also update LocalStorage for immediate interaction in current session
                const products = DB.getProducts();
                products.push(savedCrop || newCrop);
                localStorage.setItem(DB.PRODUCTS, JSON.stringify(products));
                alert('Crop listed successfully!');
                window.location.href = 'farmer-home.html';
            })
            .catch(err => {
                console.warn('Error adding crop to server, saving locally:', err);
                const products = DB.getProducts();
                products.push(newCrop);
                localStorage.setItem(DB.PRODUCTS, JSON.stringify(products));
                alert(`Server connection failed. Crop saved LOCALLY only.`);
                window.location.href = 'farmer-home.html';
            });
    });
}

// Render Orders
function renderOrders() {
    const listEl = document.getElementById('orderListBody');
    if (!listEl) return;

    const user = DB.getCurrentUser();
    if (!user) return;

    // Render loading spinner
    listEl.innerHTML = `
        <tr>
            <td colspan="6" style="padding: 40px 0; text-align: center;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 15px; justify-content: center;">
                    <div class="spinner"></div>
                    <span style="color: var(--text-medium); font-weight: 500;">Loading orders...</span>
                </div>
            </td>
        </tr>
    `;

    // Fetch from Backend (Orders & Users to resolve customer names)
    Promise.all([
        API.getOrders(),
        API.getUsers()
    ])
        .then(([orders, users]) => {
            localStorage.setItem(DB.ORDERS, JSON.stringify(orders));
            localStorage.setItem(DB.USERS, JSON.stringify(users));
            console.log('📦 Orders fetched from server:', orders.length);

            // Filter orders that contain at least one item from this farmer
            const myOrders = orders.filter(order =>
                order.items && Array.isArray(order.items) && order.items.some(item => item.farmerId === user.id)
            );

            if (myOrders.length === 0) {
                listEl.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; color:#999">No orders found.</td></tr>';
            } else {
                listEl.innerHTML = myOrders.map(order => {
                    const relevantItems = order.items.filter(i => i.farmerId === user.id);
                    const itemNames = relevantItems.map(i => `${i.name} (x${i.quantity})`).join(', ');

                    let statusColor = '#f39c12'; // Pending
                    if (order.status === 'Accepted') statusColor = '#2ecc71';
                    if (order.status === 'Rejected') statusColor = '#e74c3c';

                    const isActionable = order.status === 'Pending';

                    return `
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 15px;">#${order.id}</td>
                            <td style="padding: 15px;">${getCustomerName(order.customerId)}</td>
                            <td style="padding: 15px;">${itemNames}</td>
                            <td style="padding: 15px;">RS ${order.total}</td>
                            <td style="padding: 15px;"><span style="color: ${statusColor}; font-weight:600">${order.status || 'Pending'}</span></td>
                            <td style="padding: 15px;">
                                ${isActionable ? `
                                    <button class="btn" style="background:var(--primary-green); color:white; padding:5px 10px; font-size:0.8rem; margin-right:5px;" onclick="updateStatus(${order.id}, 'Accepted')">Accept</button>
                                    <button class="btn" style="background:#e74c3c; color:white; padding:5px 10px; font-size:0.8rem;" onclick="updateStatus(${order.id}, 'Rejected')">Reject</button>
                                ` : `
                                    <span style="color:#aaa; font-size:0.9rem">Completed</span>
                                `}
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        })
        .catch(err => {
            console.error('Error fetching orders:', err);
            listEl.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; color:red">Error loading orders. Is the server running?</td></tr>';
        });
}

function getCustomerName(id) {
    if (!id) return 'Guest Customer';
    const users = DB.getUsers();
    const customer = users.find(u => u.id === id);
    return customer ? customer.name : 'Unknown Customer';
}

async function updateStatus(orderId, status) {
    if (confirm(`Mark this order as ${status}?`)) {
        try {
            await API.updateOrderStatus(orderId, status);
        } catch(e) {
            console.warn('Server update failed, updating locally:', e);
        }
        // Update local cache
        let orders = DB.getOrders() || [];
        const order = orders.find(o => o.id == orderId);
        if (order) {
            order.status = status;
            localStorage.setItem(DB.ORDERS, JSON.stringify(orders));
        }
        renderOrders();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
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

    // Only run render if we are on dashboard
    if (document.getElementById('cropList')) {
        renderDashboard();
    }
    // Only run render if we are on orders page
    if (document.getElementById('orderListBody')) {
        renderOrders();
    }
    // Only run if on profit page
    if (document.getElementById('profitChart')) {
        renderProfitChart();
    }
});

async function renderProfitChart() {
    console.log('Rendering Profit Chart...');
    const chartEl = document.getElementById('profitChart');
    if (!chartEl) return;

    const user = DB.getCurrentUser();
    if (!user) return;

    try {
        const stats = await API.getFarmerProfit(user.id);
        if (stats && stats.success) {
            // Render Chart
            const maxVal = Math.max(...stats.chartData.map(d => d.value), 100);
            chartEl.innerHTML = stats.chartData.map(item => {
                const pct = (item.value / maxVal) * 100;
                return `
                    <div class="bar-group">
                        <div class="bar-container">
                            <div class="bar" style="height: ${Math.max(pct, 5)}%;">
                                <span class="bar-value">${item.value > 0 ? 'RS ' + item.value : '0'}</span>
                            </div>
                        </div>
                        <div class="bar-label">${item.label}</div>
                    </div>
                `;
            }).join('');

            // Update Stats
            const revEl = document.getElementById('statRevenue');
            const prodEl = document.getElementById('statProduct');
            const growthEl = document.getElementById('statGrowth');

            if (revEl) revEl.textContent = `RS ${stats.totalRevenue.toLocaleString()}`;
            if (prodEl) prodEl.textContent = stats.topProduct;

            if (growthEl) {
                const maySales = stats.monthlyRevenue.May || 0;
                const junSales = stats.monthlyRevenue.Jun || 0;
                let growth = 0;
                if (maySales > 0) {
                    growth = Math.round(((junSales - maySales) / maySales) * 100);
                } else if (junSales > 0) {
                    growth = 100;
                }
                growthEl.textContent = growth >= 0 ? `↑ ${growth}%` : `↓ ${Math.abs(growth)}%`;
                growthEl.style.color = growth >= 0 ? '#2ecc71' : '#ef4444';
            }
        }
    } catch (err) {
        console.error('Error loading profit stats from server:', err);
        chartEl.innerHTML = '<div style="width:100%; text-align:center; padding-top:100px; color:#999">Error loading profit data. Is the server running?</div>';
    }
}
