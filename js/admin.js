/**
 * Admin Portal Logic
 */

checkAuth('admin');

// Styled confirmation modal helper
function showAdminConfirm(message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;z-index:10000;backdrop-filter:blur(4px);';
    
    const card = document.createElement('div');
    card.style.cssText = 'background:#fff;border-radius:16px;padding:32px 28px;max-width:400px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.2);text-align:center;animation:fadeIn 0.2s ease;';
    card.innerHTML = `
        <div style="font-size:2rem;margin-bottom:12px;">🛡️</div>
        <p style="font-size:1.1rem;color:#1e293b;margin:0 0 24px;line-height:1.6;font-family:sans-serif;">${message}</p>
        <div style="display:flex;gap:12px;justify-content:center;">
            <button id="adminConfirmCancel" style="padding:10px 24px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:8px;cursor:pointer;font-size:0.9rem;color:#64748b;font-weight:600;">Cancel</button>
            <button id="adminConfirmOk" style="padding:10px 24px;border:none;background:#dc2626;color:#fff;border-radius:8px;cursor:pointer;font-size:0.9rem;font-weight:600;">Confirm</button>
        </div>
    `;
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const close = () => document.body.removeChild(overlay);
    card.querySelector('#adminConfirmCancel').addEventListener('click', close);
    card.querySelector('#adminConfirmOk').addEventListener('click', () => { close(); onConfirm(); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}

// Render User Lists
function renderUsers(role) {
    const tableBody = document.getElementById('userTableBody');
    if (!tableBody) return;

    const users = DB.getUsers().filter(u => u.role === role);

    // Update count if exists
    const countEl = document.getElementById(role + 'Count');
    if (countEl) countEl.textContent = users.length;

    tableBody.innerHTML = users.map(user => {
        const isBanned = user.status === 'banned';
        const badgeClass = isBanned ? 'status-rejected' : 'status-active';
        const badgeText = isBanned ? 'Banned' : 'Active';
        const banBtn = isBanned 
            ? `<button class="btn-unban" onclick="toggleBanUser('${user.id}', false)">Unban</button>`
            : `<button class="btn-ban" onclick="toggleBanUser('${user.id}', true)">Ban</button>`;

        return `
            <tr>
                <td>${user.id}</td>
                <td>${user.username || 'N/A'}</td>
                <td>${escapeHTML(user.name)}</td>
                <td>${user.email}</td>
                <td>${escapeHTML(user.location || 'N/A')}</td>
                <td><span class="status-badge ${badgeClass}">${badgeText}</span></td>
                <td>
                    <div style="display:flex;gap:8px;">
                        ${banBtn}
                        <button class="btn btn-secondary" style="padding: 5px 10px; font-size: 0.8rem; border-color:#fca5a5; color:#dc2626;" onclick="deleteUser('${user.id}')">Remove</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Ban / Unban User
async function toggleBanUser(userId, doBan) {
    const status = doBan ? 'banned' : 'active';
    const actionText = doBan ? 'ban' : 'unban';
    
    showAdminConfirm(`Are you sure you want to ${actionText} this user?`, async () => {
        try {
            await API.updateUser(userId, { status });
        } catch(e) {
            console.warn(e);
        }
        
        let users = DB.getUsers();
        const user = users.find(u => u.id.toString() === userId.toString());
        if (user) {
            user.status = status;
            localStorage.setItem(DB.USERS, JSON.stringify(users));
            showToast(`User account ${status} successfully!`, 'success');
            
            // Re-render
            const role = user.role;
            renderUsers(role);
        }
    });
}
window.toggleBanUser = toggleBanUser;

function deleteUser(userId) {
    showAdminConfirm('Are you sure you want to permanently delete this user?', () => {
        API.deleteUser(userId)
            .then(() => {
                // Remove from local cache
                let users = DB.getUsers();
                const user = users.find(u => u.id.toString() === userId.toString());
                const role = user ? user.role : '';
                users = users.filter(u => u.id.toString() !== userId.toString());
                localStorage.setItem(DB.USERS, JSON.stringify(users));
                showToast('User deleted successfully!', 'success');
                if (role) renderUsers(role);
                else window.location.reload();
            })
            .catch(err => {
                console.warn('Server delete failed, deleting locally only:', err);
                let users = DB.getUsers();
                const user = users.find(u => u.id.toString() === userId.toString());
                const role = user ? user.role : '';
                users = users.filter(u => u.id.toString() !== userId.toString());
                localStorage.setItem(DB.USERS, JSON.stringify(users));
                showToast('Server offline. User deleted locally only.', 'warning');
                if (role) renderUsers(role);
                else window.location.reload();
            });
    });
}
window.deleteUser = deleteUser;

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
        API.getOrders()
    ]).then(([users, orders]) => {
        localStorage.setItem(DB.USERS, JSON.stringify(users));
        localStorage.setItem(DB.ORDERS, JSON.stringify(orders));

        document.getElementById('farmerCount').textContent = users.filter(u => u.role === 'farmer').length;
        document.getElementById('customerCount').textContent = users.filter(u => u.role === 'customer').length;

        const revenue = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
        document.getElementById('totalRevenue').textContent = revenue.toLocaleString('en-IN');

        renderRecentOrders(orders);
    }).catch(() => {
        // Fallback to localStorage
        const users = DB.getUsers() || [];
        const orders = DB.getOrders() || [];
        document.getElementById('farmerCount').textContent = users.filter(u => u.role === 'farmer').length;
        document.getElementById('customerCount').textContent = users.filter(u => u.role === 'customer').length;
        const revenue = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
        document.getElementById('totalRevenue').textContent = revenue.toLocaleString('en-IN');
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
                <div style="font-size: 0.8rem; color: #888;">${new Date(order.date).toLocaleDateString('en-IN')} • ${order.paymentMethod || 'Card'}</div>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: 700; color: var(--primary-green);">+₹${(order.total || 0).toLocaleString('en-IN')}</div>
                <div style="font-size: 0.75rem; background: #eee; display: inline-block; padding: 2px 6px; border-radius: 4px; margin-top: 4px;">${order.status || 'Pending'}</div>
            </div>
        </div>
    `).join('');
}

// Export Transactions to CSV
function exportTransactions() {
    const orders = DB.getOrders();
    const users = DB.getUsers();
    const headers = 'Order ID,Date,Customer,Total,Status,Payment Method';
    const rows = orders.map(o => {
        const customer = users.find(u => u.id == o.customerId);
        const name = customer ? customer.name.replace(/,/g, ' ') : 'Guest Customer';
        return `${o.id},"${new Date(o.date).toLocaleDateString()}","${name}",${o.total},${o.status},${o.paymentMethod || 'Card'}`;
    });
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agri_transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Transactions exported as CSV!', 'success');
}
window.exportTransactions = exportTransactions;

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
