/**
 * Admin Portal Logic
 */

checkAuth('admin');

// Render User Lists
function renderUsers(role) {
    const tableBody = document.getElementById('userTableBody');
    if (!tableBody) return;

    const users = DB.getUsers().filter(u => u.role === role);

    // Update count if exists
    const countEl = document.getElementById(role + 'Count');
    if (countEl) countEl.textContent = users.length;

    console.log(`All ${role}s:`, users); // Proactive logging for debugging


    tableBody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.username || 'N/A'}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.location || 'N/A'}</td>
            <td><span class="status-badge status-active">Active</span></td>
            <td>
                <button class="btn btn-secondary" style="padding: 5px 10px; font-size: 0.8rem;" onclick="deleteUser('${user.id}')">Remove</button>
            </td>
        </tr>
    `).join('');
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to remove this user?')) {
        // Remove from server
        API.deleteUser(userId)
            .then(() => {
                console.log('User deleted from server');
                // Remove from local cache
                let users = DB.getUsers();
                users = users.filter(u => u.id.toString() !== userId.toString());
                localStorage.setItem(DB.USERS, JSON.stringify(users));
                window.location.reload();
            })
            .catch(err => {
                console.warn('Server delete failed, deleting locally only:', err);
                let users = DB.getUsers();
                users = users.filter(u => u.id.toString() !== userId.toString());
                localStorage.setItem(DB.USERS, JSON.stringify(users));
                window.location.reload();
            });
    }
}

// Dashboard stats
// Dashboard stats
function renderAdminDashboard() {
    // Display Date
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = new Date().toLocaleDateString('en-US', options);
    }

    const container = document.getElementById('recentOrdersList');
    if (container) {
        container.innerHTML = '<div style="display: flex; justify-content: center; padding: 30px;"><div class="spinner"></div></div>';
    }

    // Fetch live data from server
    Promise.all([
        API.getUsers(),
        API.getProducts(),
        API.getOrders()
    ]).then(([users, products, orders]) => {
        localStorage.setItem(DB.USERS, JSON.stringify(users));
        localStorage.setItem(DB.PRODUCTS, JSON.stringify(products));
        localStorage.setItem(DB.ORDERS, JSON.stringify(orders));

        document.getElementById('farmerCount').textContent = users.filter(u => u.role === 'farmer').length;
        document.getElementById('customerCount').textContent = users.filter(u => u.role === 'customer').length;

        const revenue = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
        document.getElementById('totalRevenue').textContent = revenue.toLocaleString();

        renderRecentOrders(orders);
    }).catch(() => {
        // Fallback to localStorage
        const users = DB.getUsers() || [];
        const orders = DB.getOrders() || [];
        document.getElementById('farmerCount').textContent = users.filter(u => u.role === 'farmer').length;
        document.getElementById('customerCount').textContent = users.filter(u => u.role === 'customer').length;
        const revenue = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
        document.getElementById('totalRevenue').textContent = revenue.toLocaleString();
        renderRecentOrders(orders);
    });
}

function renderRecentOrders(orders) {
    const container = document.getElementById('recentOrdersList');
    if (!container) return;

    // Sort by date (newest first) and take top 5
    const recent = [...orders].sort((a, b) => b.id - a.id).slice(0, 5);

    if (recent.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No transaction data available yet.</p>';
        return;
    }

    container.innerHTML = recent.map(order => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
            <div>
                <div style="font-weight: 600; font-size: 0.95rem;">Order #${order.id}</div>
                <div style="font-size: 0.8rem; color: #888;">${order.date} • ${order.paymentMethod || 'Card'}</div>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: 700; color: var(--primary-green);">+RS ${order.total}</div>
                <div style="font-size: 0.75rem; background: #eee; display: inline-block; padding: 2px 6px; border-radius: 4px; margin-top: 4px;">${order.status || 'Pending'}</div>
            </div>
        </div>
    `).join('');
}


// Init
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

    if (window.location.pathname.includes('admin-home')) renderAdminDashboard();
    if (window.location.pathname.includes('farmers')) {
        const tableBody = document.getElementById('userTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 35px;"><div class="spinner" style="margin: 0 auto;"></div></td></tr>';
        }
        // Sync from server first, then render
        API.getUsers().then(users => {
            localStorage.setItem(DB.USERS, JSON.stringify(users));
            renderUsers('farmer');
        }).catch(() => renderUsers('farmer'));
    }
    if (window.location.pathname.includes('customers')) {
        const tableBody = document.getElementById('userTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 35px;"><div class="spinner" style="margin: 0 auto;"></div></td></tr>';
        }
        API.getUsers().then(users => {
            localStorage.setItem(DB.USERS, JSON.stringify(users));
            renderUsers('customer');
        }).catch(() => renderUsers('customer'));
    }
});
