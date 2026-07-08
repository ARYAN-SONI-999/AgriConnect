/**
 * AgriConnect API Service Layer
 * Interfaces with Express/SQLite backend server (http://localhost:3000).
 */

const API_BASE = 'http://localhost:3000/api';

const API = {
    // Check if server is reachable
    async checkServer() {
        try {
            const res = await fetch(`${API_BASE}/products`, { method: 'GET' });
            return res.ok;
        } catch (e) {
            return false;
        }
    },

    // 1. User Authentication & Login
    async login(username, password, role) {
        try {
            const res = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Invalid credentials');
            }
            return await res.json(); // returns { success: true, user }
        } catch (e) {
            console.error('API.login error:', e);
            throw e;
        }
    },

    // 2. User Registration
    async register(userData) {
        try {
            const res = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to register user');
            }
            return await res.json(); // returns { success: true, user }
        } catch (e) {
            console.error('API.register error:', e);
            throw e;
        }
    },

    // 3. Update User Profile
    async updateUser(userId, updatedData) {
        try {
            const res = await fetch(`${API_BASE}/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to update user profile');
            }
            return await res.json();
        } catch (e) {
            console.error('API.updateUser error:', e);
            throw e;
        }
    },

    // 4. Delete User (Admin action)
    async deleteUser(userId) {
        try {
            const res = await fetch(`${API_BASE}/users/${userId}`, {
                method: 'DELETE'
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to delete user');
            }
            return await res.json();
        } catch (e) {
            console.error('API.deleteUser error:', e);
            throw e;
        }
    },

    // 5. Get Users list
    async getUsers() {
        try {
            const res = await fetch(`${API_BASE}/users`);
            if (!res.ok) throw new Error('Failed to fetch users list');
            return await res.json();
        } catch (e) {
            console.error('API.getUsers error:', e);
            throw e;
        }
    },

    // 6. Get Products
    async getProducts() {
        try {
            const res = await fetch(`${API_BASE}/products`);
            if (!res.ok) throw new Error('Failed to fetch products');
            return await res.json();
        } catch (e) {
            console.error('API.getProducts error:', e);
            throw e;
        }
    },

    // 7. Add Product
    async addProduct(productData) {
        try {
            const res = await fetch(`${API_BASE}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
            if (!res.ok) throw new Error('Failed to list crop on server');
            return await res.json();
        } catch (e) {
            console.error('API.addProduct error:', e);
            throw e;
        }
    },

    // 8. Update Product (Price edit)
    async updateProduct(productId, updatedFields) {
        try {
            const res = await fetch(`${API_BASE}/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedFields)
            });
            if (!res.ok) throw new Error('Failed to update product on server');
            return await res.json();
        } catch (e) {
            console.error('API.updateProduct error:', e);
            throw e;
        }
    },

    // 9. Delete Product
    async deleteProduct(productId) {
        try {
            const res = await fetch(`${API_BASE}/products/${productId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete product from server');
            return await res.json();
        } catch (e) {
            console.error('API.deleteProduct error:', e);
            throw e;
        }
    },

    // 10. Get Orders list
    async getOrders() {
        try {
            const res = await fetch(`${API_BASE}/orders`);
            if (!res.ok) throw new Error('Failed to fetch orders list');
            return await res.json();
        } catch (e) {
            console.error('API.getOrders error:', e);
            throw e;
        }
    },

    // 11. Add Order
    async addOrder(orderData) {
        try {
            const res = await fetch(`${API_BASE}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            if (!res.ok) throw new Error('Failed to place order on server');
            return await res.json();
        } catch (e) {
            console.error('API.addOrder error:', e);
            throw e;
        }
    },

    // 12. Update Order Status
    async updateOrderStatus(orderId, status) {
        try {
            const res = await fetch(`${API_BASE}/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (!res.ok) throw new Error('Failed to update order status on server');
            return await res.json();
        } catch (e) {
            console.error('API.updateOrderStatus error:', e);
            throw e;
        }
    },

    // 13. Dynamic Profit Analytics
    async getFarmerProfit(farmerId) {
        try {
            const res = await fetch(`${API_BASE}/farmers/${farmerId}/profit`);
            if (!res.ok) throw new Error('Failed to fetch profit stats');
            return await res.json();
        } catch (e) {
            console.error('API.getFarmerProfit error:', e);
            throw e;
        }
    }
};
