/**
 * AgriConnect Data Manager
 * Handles local cache and synchronizes with Express JSON backend.
 */

const API_BASE = 'http://localhost:3000/api';

const API_FALLBACK = {
    async login(username, password, role) {
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Invalid credentials');
        }
        return await res.json();
    },

    async register(userData) {
        const res = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to register');
        }
        return await res.json();
    },

    async addProduct(productData) {
        const res = await fetch(`${API_BASE}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        if (!res.ok) throw new Error('Failed to add product');
        return await res.json();
    },

    async addOrder(orderData) {
        const res = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        if (!res.ok) throw new Error('Failed to place order');
        return await res.json();
    },

    async updateOrderStatus(orderId, status) {
        const res = await fetch(`${API_BASE}/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (!res.ok) throw new Error('Failed to update order');
        return await res.json();
    },

    async updateUser(userId, updatedData) {
        const res = await fetch(`${API_BASE}/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        if (!res.ok) throw new Error('Failed to update user profile');
        return await res.json();
    },

    async deleteUser(userId) {
        const res = await fetch(`${API_BASE}/users/${userId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete user');
        return await res.json();
    },

    async getFarmerProfit(farmerId) {
        const res = await fetch(`${API_BASE}/farmers/${farmerId}/profit`);
        if (!res.ok) throw new Error('Failed to fetch profit data');
        return await res.json();
    },

    async getUsers() {
        const res = await fetch(`${API_BASE}/users`);
        if (!res.ok) throw new Error('Failed to fetch users list');
        return await res.json();
    },

    async getProducts() {
        const res = await fetch(`${API_BASE}/products`);
        if (!res.ok) throw new Error('Failed to fetch products');
        return await res.json();
    },

    async getOrders() {
        const res = await fetch(`${API_BASE}/orders`);
        if (!res.ok) throw new Error('Failed to fetch orders list');
        return await res.json();
    },

    async updateProductPrice(productId, price) {
        const res = await fetch(`${API_BASE}/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ price })
        });
        if (!res.ok) throw new Error('Failed to update product price');
        return await res.json();
    },

    async deleteProduct(productId) {
        const res = await fetch(`${API_BASE}/products/${productId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete product');
        return await res.json();
    }
};

const apiService = (typeof API !== 'undefined') ? API : API_FALLBACK;
if (typeof window !== 'undefined' && !window.API) {
    window.API = apiService;
}


const DB = {
    // Keys
    USERS: 'agri_users_v3',
    PRODUCTS: 'agri_products',
    ORDERS: 'agri_orders',
    CURRENT_USER: 'agri_current_user',
    CART: 'agri_cart',

    // Initialization
    init() {
        if (!localStorage.getItem(this.USERS)) {
            localStorage.setItem(this.USERS, JSON.stringify([
                { id: 'admin', name: 'System Admin', username: 'admin', email: 'admin@agri.com', password: btoa('admin'), role: 'admin' },
                { id: 'f1', name: 'John Farmer (Farmer 1)', username: 'farmer1', email: 'farmer1@agri.com', password: btoa('pass1'), role: 'farmer', location: 'Green Valley' },
                { id: 'f2', name: 'Sarah Miller (Farmer 2)', username: 'farmer2', email: 'farmer2@agri.com', password: btoa('pass2'), role: 'farmer', location: 'Sunny Hills' },
                { id: 'c1', name: 'Alice Customer', username: 'customer', email: 'customer@agri.com', password: btoa('pass1'), role: 'customer' }
            ]));
        }

        // Helper to assign specific crops to Farmer 1
        const farmer1Crops = [
            'Organic Kale', 'Fresh Spinach', 'Sweet Potatoes', 'Organic Carrots',
            'Crisp Cucumber', 'Fresh Strawberries', 'Quinoa', 'Brown Rice', 'Raw Almonds',
            'Red Tomatoes', 'Fresh Broccoli', 'Juicy Oranges'
        ];

        const getFarmer = (cropName) => {
            return farmer1Crops.includes(cropName) ? 'f1' : 'f2';
        };

        // Initialize Products (Forcing update to ensure new data appears)
        const products = [
            // --- Organic Category (15 items) ---
            { id: 101, name: 'Organic Kale', category: 'organic', price: 80, farmerId: getFarmer('Organic Kale'), image: '../photos/kale.jpeg', type: 'Vegetable' },
            { id: 102, name: 'Red Tomatoes', category: 'organic', price: 45, farmerId: getFarmer('Red Tomatoes'), image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80', type: 'Vegetable' },
            { id: 103, name: 'Fresh Spinach', category: 'organic', price: 60, farmerId: getFarmer('Fresh Spinach'), image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&q=80', type: 'Vegetable' },
            { id: 104, name: 'Organic Avocados', category: 'organic', price: 200, farmerId: getFarmer('Organic Avocados'), image: '../photos/avocado.jpeg', type: 'Fruit' },
            { id: 105, name: 'Sweet Potatoes', category: 'organic', price: 55, farmerId: getFarmer('Sweet Potatoes'), image: '../photos/sweetpoptato.webp', type: 'Vegetable' },
            { id: 106, name: 'Fresh Broccoli', category: 'organic', price: 90, farmerId: getFarmer('Fresh Broccoli'), image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=400&q=80', type: 'Vegetable' },
            { id: 107, name: 'Bell Peppers', category: 'organic', price: 120, farmerId: getFarmer('Bell Peppers'), image: '../photos/bellpeper.jpeg', type: 'Vegetable' },
            { id: 108, name: 'Organic Carrots', category: 'organic', price: 50, farmerId: getFarmer('Organic Carrots'), image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=400&q=80', type: 'Vegetable' },
            { id: 109, name: 'Crisp Cucumber', category: 'organic', price: 40, farmerId: getFarmer('Crisp Cucumber'), image: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=400&q=80', type: 'Vegetable' },
            { id: 110, name: 'Fresh Strawberries', category: 'organic', price: 150, farmerId: getFarmer('Fresh Strawberries'), image: '../photos/strawbeey.webp', type: 'Fruit' },
            { id: 111, name: 'Blueberries', category: 'organic', price: 180, farmerId: getFarmer('Blueberries'), image: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=400&q=80', type: 'Fruit' },
            { id: 112, name: 'Organic Honey', category: 'organic', price: 350, farmerId: getFarmer('Organic Honey'), image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=400&q=80', type: 'Pantry' },
            { id: 113, name: 'Brown Rice', category: 'organic', price: 95, farmerId: getFarmer('Brown Rice'), image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80', type: 'Grains' },
            { id: 114, name: 'Quinoa', category: 'organic', price: 220, farmerId: getFarmer('Quinoa'), image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80', type: 'Grains' },
            { id: 115, name: 'Raw Almonds', category: 'organic', price: 400, farmerId: getFarmer('Raw Almonds'), image: '../photos/raw_almonds.jpeg', type: 'Nuts' },

            // --- Fruits Category (15 items) ---
            { id: 201, name: 'Premium Bananas', category: 'fruits', price: 60, farmerId: getFarmer('Premium Bananas'), image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=400&q=80', type: 'Fruit' },
            { id: 202, name: 'Green Grapes', category: 'fruits', price: 100, farmerId: getFarmer('Green Grapes'), image: '../photos/green-graps.jpg', type: 'Fruit' },
            { id: 203, name: 'Red Apples', category: 'fruits', price: 140, farmerId: getFarmer('Red Apples'), image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&q=80', type: 'Fruit' },
            { id: 204, name: 'Juicy Oranges', category: 'fruits', price: 80, farmerId: getFarmer('Juicy Oranges'), image: '../photos/orange.webp', type: 'Citrus' },
            { id: 205, name: 'Ripe Mangoes', category: 'fruits', price: 150, farmerId: getFarmer('Ripe Mangoes'), image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80', type: 'Tropical' },
            { id: 206, name: 'Pineapple', category: 'fruits', price: 90, farmerId: getFarmer('Pineapple'), image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=400&q=80', type: 'Tropical' },
            { id: 207, name: 'Watermelon', category: 'fruits', price: 40, farmerId: getFarmer('Watermelon'), image: '../photos/watermelon-6640124_1280.jpg', type: 'Melon' },
            { id: 208, name: 'Pomegranates', category: 'fruits', price: 160, farmerId: getFarmer('Pomegranates'), image: 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?auto=format&fit=crop&w=400&q=80', type: 'Exotic' },
            { id: 209, name: 'Dragon Fruit', category: 'fruits', price: 250, farmerId: getFarmer('Dragon Fruit'), image: 'https://images.unsplash.com/photo-1527325678964-54921661f888?auto=format&fit=crop&w=400&q=80', type: 'Exotic' },
            { id: 210, name: 'Kiwi', category: 'fruits', price: 200, farmerId: getFarmer('Kiwi'), image: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=400&q=80', type: 'Berry' },
            { id: 211, name: 'Papaya', category: 'fruits', price: 60, farmerId: getFarmer('Papaya'), image: '../photos/papaya.jpeg', type: 'Tropical' },
            { id: 212, name: 'Cherries', category: 'fruits', price: 300, farmerId: getFarmer('Cherries'), image: '../photos/cherry.jpg', type: 'Berry' },
            { id: 213, name: 'Pears', category: 'fruits', price: 110, farmerId: getFarmer('Pears'), image: '../photos/pears.jpeg', type: 'Pome' },
            { id: 214, name: 'Peaches', category: 'fruits', price: 130, farmerId: getFarmer('Peaches'), image: 'https://images.unsplash.com/photo-1595123550441-d377e017de6a?auto=format&fit=crop&w=400&q=80', type: 'Stone Fruit' },
            { id: 215, name: 'Plums', category: 'fruits', price: 120, farmerId: getFarmer('Plums'), image: 'https://images.unsplash.com/photo-1603569283847-aa295f0d016a?auto=format&fit=crop&w=400&q=80', type: 'Stone Fruit' },

            // --- Seasonal Category (15 items) ---
            { id: 301, name: 'Winter Squash', category: 'seasonal', price: 70, farmerId: getFarmer('Winter Squash'), image: '../photos/winter_squash.jpeg', type: 'Winter' },
            { id: 302, name: 'Pumpkins', category: 'seasonal', price: 150, farmerId: getFarmer('Pumpkins'), image: '../photos/pumpkin.jpeg', type: 'Autumn' },
            { id: 303, name: 'Sweet Corn', category: 'seasonal', price: 30, farmerId: getFarmer('Sweet Corn'), image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=400&q=80', type: 'Summer' },
            { id: 304, name: 'Radishes', category: 'seasonal', price: 40, farmerId: getFarmer('Radishes'), image: 'https://images.unsplash.com/photo-1506459225024-1428097a7e18?auto=format&fit=crop&w=400&q=80', type: 'Spring' },
            { id: 305, name: 'Asparagus', category: 'seasonal', price: 180, farmerId: getFarmer('Asparagus'), image: 'https://images.unsplash.com/photo-1515471209610-dae1c92d8777?auto=format&fit=crop&w=400&q=80', type: 'Spring' },
            { id: 306, name: 'Brussels Sprouts', category: 'seasonal', price: 90, farmerId: getFarmer('Brussels Sprouts'), image: '../photos/brucceels.jpg', type: 'Winter' },
            { id: 307, name: 'Mushrooms', category: 'seasonal', price: 120, farmerId: getFarmer('Mushrooms'), image: '../photos/mushrooms.jpg', type: 'Autumn' },
            { id: 308, name: 'Green Peas', category: 'seasonal', price: 80, farmerId: getFarmer('Green Peas'), image: '../photos/greenpeace.jpg', type: 'Spring' },
            { id: 309, name: 'Cauliflower', category: 'seasonal', price: 50, farmerId: getFarmer('Cauliflower'), image: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=400&q=80', type: 'Winter' },
            { id: 310, name: 'Eggplant', category: 'seasonal', price: 60, farmerId: getFarmer('Eggplant'), image: '../photos/eggphant.webp', type: 'Summer' },
            { id: 311, name: 'Zucchini', category: 'seasonal', price: 45, farmerId: getFarmer('Zucchini'), image: '../photos/zuchhini.webp', type: 'Summer' },
            { id: 312, name: 'Okra', category: 'seasonal', price: 70, farmerId: getFarmer('Okra'), image: '../photos/okra.jpg', type: 'Summer' },
            { id: 313, name: 'Beetroot', category: 'seasonal', price: 50, farmerId: getFarmer('Beetroot'), image: '../photos/beetroot.webp', type: 'Winter' },
            { id: 314, name: 'Cabbage', category: 'seasonal', price: 35, farmerId: getFarmer('Cabbage'), image: '../photos/cabbage.webp', type: 'Winter' },
            { id: 315, name: 'Figs', category: 'seasonal', price: 200, farmerId: getFarmer('Figs'), image: '../photos/figs.jpeg', type: 'Autumn' }
        ];

        // Initialize Products if not already initialized
        if (!localStorage.getItem(this.PRODUCTS)) {
            localStorage.setItem(this.PRODUCTS, JSON.stringify(products));
            console.log('📦 Products initialized in localStorage.');
        }

        // Initialize Default Orders for Demo
        const defaultOrders = [
            {
                id: 1001,
                date: new Date().toLocaleDateString(),
                customerId: 'c1',
                status: 'Pending',
                total: 160,
                items: [
                    { id: 101, name: 'Organic Kale', price: 80, quantity: 2, farmerId: 'f1', image: '../photos/kale.jpeg' }
                ],
                paymentMethod: 'UPI'
            },
            {
                id: 1002,
                date: new Date().toLocaleDateString(),
                customerId: 'c1',
                status: 'Accepted',
                total: 60,
                items: [
                    { id: 103, name: 'Fresh Spinach', price: 60, quantity: 1, farmerId: 'f1', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&q=80' }
                ],
                paymentMethod: 'Card'
            }
        ];

        // Always reset orders to defaults for this demo request to ensure they appear
        const currentOrders = JSON.parse(localStorage.getItem(this.ORDERS));
        if (!currentOrders || currentOrders.length === 0) {
            localStorage.setItem(this.ORDERS, JSON.stringify(defaultOrders));
        }
        if (!localStorage.getItem(this.CART)) {
            localStorage.setItem(this.CART, JSON.stringify([]));
        }

        this.syncFromServer();
    },

    logConnection() {
        console.log('%c Database Connected to Local Storage ', 'background: #222; color: #bada55; padding: 4px; border-radius: 4px;');
        console.log('📦 Products:', this.getProducts().length);
        console.log('👤 Users (Detailed View):');
        console.table(this.getUsers()); // Displays all admins, farmers, and customers in a table
    },

    async syncFromServer() {
        try {
            const [users, products, orders] = await Promise.all([
                apiService.getUsers(),
                apiService.getProducts(),
                apiService.getOrders()
            ]);
            localStorage.setItem(this.USERS, JSON.stringify(users || []));
            localStorage.setItem(this.PRODUCTS, JSON.stringify(products || []));
            localStorage.setItem(this.ORDERS, JSON.stringify(orders || []));
        } catch (e) {
            console.warn('Server sync unavailable, using local cache only:', e);
        }
    },

    // User Operations
    getUsers() {
        return JSON.parse(localStorage.getItem(this.USERS));
    },

    async registerUser(user) {
        const cachedPassword = user.password;
        try {
            const res = await apiService.register(user);
            if (res && res.success) {
                user = res.user;
                user.password = cachedPassword;
            }
        } catch (e) {
            console.warn('API registration failed, saving locally only:', e);
        }

        const users = this.getUsers();
        if (users.find(u => u.username === user.username)) {
            throw new Error('Username already exists');
        }
        if (users.find(u => u.email === user.email)) {
            throw new Error('Email already exists');
        }
        user.id = user.id || Date.now().toString();
        users.push(user);
        localStorage.setItem(this.USERS, JSON.stringify(users));
        return user;
    },

    async login(username, password, role) {
        try {
            const res = await apiService.login(username, password, role);
            if (res && res.success) {
                localStorage.setItem(this.CURRENT_USER, JSON.stringify(res.user));
                return res.user;
            }
        } catch (e) {
            console.warn('API login failed, checking local storage:', e);
        }

        const users = this.getUsers();
        // Login with username. Compares password hashes, fallback to unhashed comparison.
        const user = users.find(u => u.username === username && u.role === role && (u.password === password || u.password === btoa(password)));
        if (user) {
            localStorage.setItem(this.CURRENT_USER, JSON.stringify(user));
            return user;
        }
        return null;
    },

    logout() {
        localStorage.removeItem(this.CURRENT_USER);
        window.location.href = '../index.html';
    },

    getCurrentUser() {
        return JSON.parse(localStorage.getItem(this.CURRENT_USER));
    },

    // Product Operations
    getProducts() {
        return JSON.parse(localStorage.getItem(this.PRODUCTS));
    },

    async addProduct(product) {
        try {
            const res = await apiService.addProduct(product);
            if (res && res.id) {
                product.id = res.id;
            }
        } catch (e) {
            console.warn('API addProduct failed, saving locally only:', e);
        }

        const products = this.getProducts();
        product.id = product.id || Date.now();
        products.push(product);
        localStorage.setItem(this.PRODUCTS, JSON.stringify(products));
    },

    getProductsByFarmer(farmerId) {
        return this.getProducts().filter(p => p.farmerId === farmerId);
    },

    // Cart Operations
    getCart() {
        return JSON.parse(localStorage.getItem(this.CART));
    },

    addToCart(product) {
        let cart = this.getCart();
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        localStorage.setItem(this.CART, JSON.stringify(cart));
        return cart;
    },

    clearCart() {
        localStorage.setItem(this.CART, JSON.stringify([]));
    },

    // Order Operations
    getOrders() {
        return JSON.parse(localStorage.getItem(this.ORDERS));
    },

    async placeOrder(order) {
        order.id = order.id || Date.now();
        order.date = order.date || new Date().toLocaleDateString();
        const user = this.getCurrentUser();
        if (user) order.customerId = user.id;

        try {
            await apiService.addOrder(order);
        } catch (err) {
            console.error('Order API error, saving locally only:', err);
        }

        // Update Local Storage immediately for UI responsiveness
        let orders = this.getOrders();
        orders.push(order);
        localStorage.setItem(this.ORDERS, JSON.stringify(orders));
        this.clearCart();

        // Simulated Notifications: Order Placement
        if (window.showSimulatedSMS) {
            window.showSimulatedSMS('AGRI-CNCT', `Order #${order.id} placed! Total amount: RS ${order.total}. Thank you for shopping with AgriConnect.`);
        }

        // Notify matching farmers via WhatsApp
        if (window.showSimulatedWhatsApp && order.items && order.items.length > 0) {
            const farmerIds = [...new Set(order.items.map(item => item.farmerId))];
            const users = this.getUsers() || [];
            
            farmerIds.forEach(fId => {
                const farmer = users.find(u => u.id === fId);
                const farmerName = farmer ? farmer.name : 'Farmer';
                const itemsStr = order.items.filter(item => item.farmerId === fId).map(item => `${item.name} (${item.quantity}kg)`).join(', ');
                
                window.showSimulatedWhatsApp('AgriConnect Support', `Hello ${farmerName}, you have a new order #${order.id} for: ${itemsStr}. Please review and update order status on your dashboard.`);
            });
        }

        return order;
    },

    async updateOrderStatus(orderId, status) {
        try {
            await apiService.updateOrderStatus(orderId, status);
        } catch (err) {
            console.error('Order status sync server error, updating locally only:', err);
        }

        let orders = this.getOrders();
        const order = orders.find(o => o.id == orderId); // Loose equality for string/number match
        if (order) {
            order.status = status;
            localStorage.setItem(this.ORDERS, JSON.stringify(orders));

            // Simulated Notifications: Status Update
            if (window.showSimulatedWhatsApp) {
                const users = this.getUsers() || [];
                const customer = users.find(u => u.id === order.customerId);
                const customerName = customer ? customer.name : 'Customer';
                
                window.showSimulatedWhatsApp('AgriConnect Support', `Hello ${customerName}, your AgriConnect order #${orderId} status has been updated to: "${status}".`);
            }

            return true;
        }
        return false;
    }
};

// Initialize DB on load
DB.init();
DB.logConnection();

// --- SMS & WhatsApp Notification Simulator Engine ---
function showSimulatedNotification(type, sender, message) {
    const containerId = 'simulatedNotificationContainer';
    let container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 380px;
            width: calc(100vw - 40px);
        `;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.cssText = `
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        transform: translateY(-50px);
        opacity: 0;
        border: 1px solid rgba(0,0,0,0.08);
    `;

    if (type === 'whatsapp') {
        toast.innerHTML = `
            <div style="background: #075E54; color: white; padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; font-weight: bold; letter-spacing: 0.5px; font-family: sans-serif;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 0.9rem;">💬</span> WHATSAPP
                </div>
                <div>now</div>
            </div>
            <div style="padding: 12px; background: #E5DDD5; display: flex; flex-direction: column; gap: 3px; font-family: sans-serif; text-align: left;">
                <strong style="color: #075E54; font-size: 0.85rem;">${sender}</strong>
                <p style="margin: 0; color: #303030; font-size: 0.82rem; line-height: 1.4;">${message}</p>
            </div>
        `;
    } else {
        toast.innerHTML = `
            <div style="background: #2f3542; color: #f1f2f6; padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; font-weight: bold; letter-spacing: 0.5px; font-family: sans-serif;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 0.9rem;">✉️</span> MESSAGES
                </div>
                <div>now</div>
            </div>
            <div style="padding: 12px; background: #f1f2f6; display: flex; flex-direction: column; gap: 3px; font-family: monospace; text-align: left;">
                <strong style="color: #2f3542; font-size: 0.85rem;">${sender}</strong>
                <p style="margin: 0; color: #57606f; font-size: 0.82rem; line-height: 1.4; font-weight: 700;">${message}</p>
            </div>
        `;
    }

    container.appendChild(toast);

    // Slide in
    setTimeout(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    }, 50);

    // Slide out and remove after 6 seconds
    setTimeout(() => {
        toast.style.transform = 'translateY(-20px)';
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 6000);
}

window.showSimulatedSMS = function(sender, message) {
    showSimulatedNotification('sms', sender, message);
    console.log(`%c[SMS from ${sender}] ${message}`, 'background: #2f3542; color: #f1f2f6; padding: 4px; font-weight: bold;');
};

window.showSimulatedWhatsApp = function(sender, message) {
    showSimulatedNotification('whatsapp', sender, message);
    console.log(`%c[WhatsApp from ${sender}] ${message}`, 'background: #075E54; color: white; padding: 4px; font-weight: bold;');
};

window.showToast = function(message, type = 'success', title = '') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;

    let icon = '🎉';
    if (type === 'error') icon = '❌';
    else if (type === 'warning') icon = '⚠️';
    else if (type === 'info') icon = 'ℹ️';

    if (!title) {
        if (type === 'success') title = 'Success';
        else if (type === 'error') title = 'Error';
        else if (type === 'warning') title = 'Warning';
        else if (type === 'info') title = 'Info';
    }

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;

    container.appendChild(toast);

    // Trigger transition
    setTimeout(() => {
        toast.classList.add('show');
    }, 50);

    // Auto-remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 400);
    }, 4000);
};
