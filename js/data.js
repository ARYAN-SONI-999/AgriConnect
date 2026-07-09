/**
 * AgriConnect Data Manager
 * Handles data persistence using localStorage and connects to SQLite backend.
 */

const API_BASE = window.location.origin + '/api';

const API = {
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

    async updateProduct(productId, updatedFields) {
        const res = await fetch(`${API_BASE}/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedFields)
        });
        if (!res.ok) throw new Error('Failed to update product');
        return await res.json();
    },

    async deleteProduct(productId) {
        const res = await fetch(`${API_BASE}/products/${productId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete product');
        return await res.json();
    },

    async getReviews(productId) {
        const res = await fetch(`${API_BASE}/products/${productId}/reviews`);
        if (!res.ok) throw new Error('Failed to fetch reviews');
        return await res.json();
    },

    async addReview(reviewData) {
        const res = await fetch(`${API_BASE}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData)
        });
        if (!res.ok) throw new Error('Failed to add review');
        return await res.json();
    },

    async getWishlist(userId) {
        const res = await fetch(`${API_BASE}/wishlist/${userId}`);
        if (!res.ok) throw new Error('Failed to fetch wishlist');
        return await res.json();
    },

    async addToWishlistAPI(userId, productId) {
        const res = await fetch(`${API_BASE}/wishlist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, productId })
        });
        if (!res.ok) throw new Error('Failed to add to wishlist');
        return await res.json();
    },

    async removeFromWishlistAPI(userId, productId) {
        const res = await fetch(`${API_BASE}/wishlist/${userId}/${productId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to remove from wishlist');
        return await res.json();
    }
};


const DB = {
    // Keys
    USERS: 'agri_users_v3',
    PRODUCTS: 'agri_products',
    ORDERS: 'agri_orders',
    CURRENT_USER: 'agri_current_user',
    CART: 'agri_cart',
    WISHLIST: 'agri_wishlist_v1',

    // Initialization
    init() {
        if (!localStorage.getItem(this.USERS)) {
            localStorage.setItem(this.USERS, JSON.stringify([
                { id: 'admin', name: 'System Admin', username: 'admin', email: 'admin@agri.com', password: btoa('admin'), role: 'admin', status: 'active' },
                { id: 'f1', name: 'John Farmer (Farmer 1)', username: 'farmer1', email: 'farmer1@agri.com', password: btoa('pass1'), role: 'farmer', location: 'Green Valley', status: 'active' },
                { id: 'f2', name: 'Sarah Miller (Farmer 2)', username: 'farmer2', email: 'farmer2@agri.com', password: btoa('pass2'), role: 'farmer', location: 'Sunny Hills', status: 'active' },
                { id: 'c1', name: 'Alice Customer', username: 'customer', email: 'customer@agri.com', password: btoa('pass1'), role: 'customer', status: 'active' }
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

        // Initialize Products
        const products = [
            // --- Organic Category (15 items) ---
            { id: 101, name: 'Organic Kale', category: 'organic', price: 80, farmerId: getFarmer('Organic Kale'), image: '../photos/kale.jpeg', type: 'Vegetable', quantity: 100, description: 'Fresh curly organic kale leaves.' },
            { id: 102, name: 'Red Tomatoes', category: 'organic', price: 45, farmerId: getFarmer('Red Tomatoes'), image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80', type: 'Vegetable', quantity: 150, description: 'Red, ripe tomatoes direct from vine.' },
            { id: 103, name: 'Fresh Spinach', category: 'organic', price: 60, farmerId: getFarmer('Fresh Spinach'), image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&q=80', type: 'Vegetable', quantity: 80, description: 'Crisp green spinach leaves.' },
            { id: 104, name: 'Organic Avocados', category: 'organic', price: 200, farmerId: getFarmer('Organic Avocados'), image: '../photos/avocado.jpeg', type: 'Fruit', quantity: 45, description: 'Rich, buttery Haas avocados.' },
            { id: 105, name: 'Sweet Potatoes', category: 'organic', price: 55, farmerId: getFarmer('Sweet Potatoes'), image: '../photos/sweetpotato.webp', type: 'Vegetable', quantity: 120, description: 'Naturally sweet and earthy sweet potatoes.' },
            { id: 106, name: 'Fresh Broccoli', category: 'organic', price: 90, farmerId: getFarmer('Fresh Broccoli'), image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=400&q=80', type: 'Vegetable', quantity: 90, description: 'Green broccoli heads packed with nutrients.' },
            { id: 107, name: 'Bell Peppers', category: 'organic', price: 120, farmerId: getFarmer('Bell Peppers'), image: '../photos/bellpeper.jpeg', type: 'Vegetable', quantity: 70, description: 'Sweet and crunchy bell peppers.' },
            { id: 108, name: 'Organic Carrots', category: 'organic', price: 50, farmerId: getFarmer('Organic Carrots'), image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=400&q=80', type: 'Vegetable', quantity: 130, description: 'Juicy, sweet organic carrots.' },
            { id: 109, name: 'Crisp Cucumber', category: 'organic', price: 40, farmerId: getFarmer('Crisp Cucumber'), image: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=400&q=80', type: 'Vegetable', quantity: 110, description: 'Cool and hydrating cucumbers.' },
            { id: 110, name: 'Fresh Strawberries', category: 'organic', price: 150, farmerId: getFarmer('Fresh Strawberries'), image: '../photos/strawberry.webp', type: 'Fruit', quantity: 50, description: 'Delicious and sweet red strawberries.' },
            { id: 111, name: 'Blueberries', category: 'organic', price: 180, farmerId: getFarmer('Blueberries'), image: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=400&q=80', type: 'Fruit', quantity: 60, description: 'Plump antioxidant-rich blueberries.' },
            { id: 112, name: 'Organic Honey', category: 'organic', price: 350, farmerId: getFarmer('Organic Honey'), image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=400&q=80', type: 'Pantry', quantity: 30, description: 'Pure, raw wildflower organic honey.' },
            { id: 113, name: 'Brown Rice', category: 'organic', price: 95, farmerId: getFarmer('Brown Rice'), image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80', type: 'Grains', quantity: 200, description: 'Unpolished whole grain brown rice.' },
            { id: 114, name: 'Quinoa', category: 'organic', price: 220, farmerId: getFarmer('Quinoa'), image: 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&w=400&q=80', type: 'Grains', quantity: 120, description: 'High-protein organic white quinoa grains.' },
            { id: 115, name: 'Raw Almonds', category: 'organic', price: 400, farmerId: getFarmer('Raw Almonds'), image: '../photos/raw_almonds.jpeg', type: 'Nuts', quantity: 80, description: 'Premium raw California almonds.' },

            // --- Fruits Category (15 items) ---
            { id: 201, name: 'Premium Bananas', category: 'fruits', price: 60, farmerId: getFarmer('Premium Bananas'), image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=400&q=80', type: 'Fruit', quantity: 150, description: 'Sweet and nutritious yellow bananas.' },
            { id: 202, name: 'Green Grapes', category: 'fruits', price: 100, farmerId: getFarmer('Green Grapes'), image: '../photos/green-graps.jpg', type: 'Fruit', quantity: 100, description: 'Seedless crisp green grapes.' },
            { id: 203, name: 'Red Apples', category: 'fruits', price: 140, farmerId: getFarmer('Red Apples'), image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&q=80', type: 'Fruit', quantity: 120, description: 'Crunchy sweet red apples.' },
            { id: 204, name: 'Juicy Oranges', category: 'fruits', price: 80, farmerId: getFarmer('Juicy Oranges'), image: '../photos/orange.webp', type: 'Citrus', quantity: 110, description: 'Tangy and sweet fresh oranges.' },
            { id: 205, name: 'Ripe Mangoes', category: 'fruits', price: 150, farmerId: getFarmer('Ripe Mangoes'), image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80', type: 'Tropical', quantity: 80, description: 'Sweet and aromatic seasonal mangoes.' },
            { id: 206, name: 'Pineapple', category: 'fruits', price: 90, farmerId: getFarmer('Pineapple'), image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=400&q=80', type: 'Tropical', quantity: 60, description: 'Queen pineapple packed with juice.' },
            { id: 207, name: 'Watermelon', category: 'fruits', price: 40, farmerId: getFarmer('Watermelon'), image: '../photos/watermelon-6640124_1280.jpg', type: 'Melon', quantity: 200, description: 'Refreshing sweet summer watermelons.' },
            { id: 208, name: 'Pomegranates', category: 'fruits', price: 160, farmerId: getFarmer('Pomegranates'), image: 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?auto=format&fit=crop&w=400&q=80', type: 'Exotic', quantity: 90, description: 'Ruby-red, juicy pomegranate seeds.' },
            { id: 209, name: 'Dragon Fruit', category: 'fruits', price: 250, farmerId: getFarmer('Dragon Fruit'), image: 'https://images.unsplash.com/photo-1527325678964-54921661f888?auto=format&fit=crop&w=400&q=80', type: 'Exotic', quantity: 40, description: 'Vibrant pink dragon fruit with white flesh.' },
            { id: 210, name: 'Kiwi', category: 'fruits', price: 200, farmerId: getFarmer('Kiwi'), image: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=400&q=80', type: 'Berry', quantity: 70, description: 'Zesty kiwi fruits rich in vitamin C.' },
            { id: 211, name: 'Papaya', category: 'fruits', price: 60, farmerId: getFarmer('Papaya'), image: '../photos/papaya.jpeg', type: 'Tropical', quantity: 100, description: 'Ripe orange papaya fruit.' },
            { id: 212, name: 'Cherries', category: 'fruits', price: 300, farmerId: getFarmer('Cherries'), image: '../photos/cherry.jpg', type: 'Berry', quantity: 50, description: 'Sweet dark red cherries.' },
            { id: 213, name: 'Pears', category: 'fruits', price: 110, farmerId: getFarmer('Pears'), image: '../photos/pears.jpeg', type: 'Pome', quantity: 120, description: 'Crisp and sweet green pears.' },
            { id: 214, name: 'Peaches', category: 'fruits', price: 130, farmerId: getFarmer('Peaches'), image: 'https://images.unsplash.com/photo-1595123550441-d377e017de6a?auto=format&fit=crop&w=400&q=80', type: 'Stone Fruit', quantity: 80, description: 'Fuzzy sweet ripe peaches.' },
            { id: 215, name: 'Plums', category: 'fruits', price: 120, farmerId: getFarmer('Plums'), image: 'https://images.unsplash.com/photo-1603569283847-aa295f0d016a?auto=format&fit=crop&w=400&q=80', type: 'Stone Fruit', quantity: 95, description: 'Sweet and tart fresh purple plums.' },

            // --- Seasonal Category (15 items) ---
            { id: 301, name: 'Winter Squash', category: 'seasonal', price: 70, farmerId: getFarmer('Winter Squash'), image: '../photos/winter_squash.jpeg', type: 'Winter', quantity: 110, description: 'Hearty winter squash perfect for soups.' },
            { id: 302, name: 'Pumpkins', category: 'seasonal', price: 150, farmerId: getFarmer('Pumpkins'), image: '../photos/pumpkin.jpeg', type: 'Autumn', quantity: 80, description: 'Large round orange pumpkins.' },
            { id: 303, name: 'Sweet Corn', category: 'seasonal', price: 30, farmerId: getFarmer('Sweet Corn'), image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=400&q=80', type: 'Summer', quantity: 250, description: 'Sweet juicy yellow corn cobs.' },
            { id: 304, name: 'Radishes', category: 'seasonal', price: 40, farmerId: getFarmer('Radishes'), image: 'https://images.unsplash.com/photo-1506459225024-1428097a7e18?auto=format&fit=crop&w=400&q=80', type: 'Spring', quantity: 140, description: 'Crisp and peppery fresh radishes.' },
            { id: 305, name: 'Asparagus', category: 'seasonal', price: 180, farmerId: getFarmer('Asparagus'), image: 'https://images.unsplash.com/photo-1515471209610-dae1c92d8777?auto=format&fit=crop&w=400&q=80', type: 'Spring', quantity: 60, description: 'Tender green asparagus spears.' },
            { id: 306, name: 'Brussels Sprouts', category: 'seasonal', price: 90, farmerId: getFarmer('Brussels Sprouts'), image: '../photos/brusselsprouts.jpg', type: 'Winter', quantity: 90, description: 'Nutritious mini green cabbages.' },
            { id: 307, name: 'Mushrooms', category: 'seasonal', price: 120, farmerId: getFarmer('Mushrooms'), image: '../photos/mushrooms.jpg', type: 'Autumn', quantity: 100, description: 'Earthy white button mushrooms.' },
            { id: 308, name: 'Green Peas', category: 'seasonal', price: 80, farmerId: getFarmer('Green Peas'), image: '../photos/greenpeas.jpg', type: 'Spring', quantity: 150, description: 'Sweet tender green peas.' },
            { id: 309, name: 'Cauliflower', category: 'seasonal', price: 50, farmerId: getFarmer('Cauliflower'), image: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=400&q=80', type: 'Winter', quantity: 110, description: 'Fresh white cauliflower heads.' },
            { id: 310, name: 'Eggplant', category: 'seasonal', price: 60, farmerId: getFarmer('Eggplant'), image: '../photos/eggplant.webp', type: 'Summer', quantity: 130, description: 'Glossy purple eggplant.' },
            { id: 311, name: 'Zucchini', category: 'seasonal', price: 45, farmerId: getFarmer('Zucchini'), image: '../photos/zucchini.webp', type: 'Summer', quantity: 125, description: 'Tender green summer zucchinis.' },
            { id: 312, name: 'Okra', category: 'seasonal', price: 70, farmerId: getFarmer('Okra'), image: '../photos/okra.jpg', type: 'Summer', quantity: 140, description: 'Crisp green ladies fingers.' },
            { id: 313, name: 'Beetroot', category: 'seasonal', price: 50, farmerId: getFarmer('Beetroot'), image: '../photos/beetroot.webp', type: 'Winter', quantity: 120, description: 'Rich red nutrient-dense beets.' },
            { id: 314, name: 'Cabbage', category: 'seasonal', price: 35, farmerId: getFarmer('Cabbage'), image: '../photos/cabbage.webp', type: 'Winter', quantity: 160, description: 'Fresh green cabbage heads.' },
            { id: 315, name: 'Figs', category: 'seasonal', price: 200, farmerId: getFarmer('Figs'), image: '../photos/figs.jpeg', type: 'Autumn', quantity: 50, description: 'Sweet ripe purple figs.' }
        ];

        // Cache Invalidation Check
        if (localStorage.getItem('agri_products_version') !== '2' || !localStorage.getItem(this.PRODUCTS)) {
            localStorage.setItem(this.PRODUCTS, JSON.stringify(products));
            localStorage.setItem('agri_products_version', '2');
            console.log('📦 Products initialized/updated in localStorage.');
        }

        // Initialize Default Orders for Demo
        const defaultOrders = [
            {
                id: 1001,
                date: new Date().toISOString(),
                customerId: 'c1',
                status: 'Pending',
                total: 160,
                items: [
                    { id: 101, name: 'Organic Kale', price: 80, quantity: 2, farmerId: 'f1', image: '../photos/kale.jpeg' }
                ],
                paymentMethod: 'UPI',
                deliveryAddress: '123 Farm Road, Green Valley, 380001'
            },
            {
                id: 1002,
                date: new Date().toISOString(),
                customerId: 'c1',
                status: 'Accepted',
                total: 60,
                items: [
                    { id: 103, name: 'Fresh Spinach', price: 60, quantity: 1, farmerId: 'f1', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&q=80' }
                ],
                paymentMethod: 'Card',
                deliveryAddress: '123 Farm Road, Green Valley, 380001'
            }
        ];

        const currentOrders = JSON.parse(localStorage.getItem(this.ORDERS));
        if (!currentOrders || currentOrders.length === 0) {
            localStorage.setItem(this.ORDERS, JSON.stringify(defaultOrders));
        }
        if (!localStorage.getItem(this.CART)) {
            localStorage.setItem(this.CART, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.WISHLIST)) {
            localStorage.setItem(this.WISHLIST, JSON.stringify([]));
        }
    },

    // User Operations
    getUsers() {
        return JSON.parse(localStorage.getItem(this.USERS)) || [];
    },

    async registerUser(user) {
        const cachedPassword = user.password;
        try {
            const res = await API.register(user);
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
        user.status = user.status || 'active';
        users.push(user);
        localStorage.setItem(this.USERS, JSON.stringify(users));
        return user;
    },

    async login(username, password, role) {
        try {
            const res = await API.login(username, password, role);
            if (res && res.success) {
                localStorage.setItem(this.CURRENT_USER, JSON.stringify(res.user));
                return res.user;
            }
        } catch (e) {
            console.warn('API login failed, checking local storage:', e);
        }

        const users = this.getUsers();
        const user = users.find(u => u.username === username && u.role === role && (u.password === password || u.password === btoa(password)));
        if (user) {
            if (user.status === 'banned') {
                throw new Error('Your account is suspended. Please contact admin.');
            }
            const { password, ...safeUser } = user;
            localStorage.setItem(this.CURRENT_USER, JSON.stringify(safeUser));
            return safeUser;
        }
        return null;
    },

    logout() {
        localStorage.removeItem(this.CURRENT_USER);
        const path = window.location.pathname;
        const depth = path.includes('/customer/') || path.includes('/farmer/') || path.includes('/admin/') ? '../' : '';
        window.location.href = depth + 'index.html';
    },

    getCurrentUser() {
        return JSON.parse(localStorage.getItem(this.CURRENT_USER));
    },

    // Product Operations
    getProducts() {
        return JSON.parse(localStorage.getItem(this.PRODUCTS)) || [];
    },

    async addProduct(product) {
        try {
            const res = await API.addProduct(product);
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
        return JSON.parse(localStorage.getItem(this.CART)) || [];
    },

    addToCart(product, quantity = 1) {
        let cart = this.getCart();
        const existing = cart.find(item => item.id.toString() === product.id.toString());
        if (existing) {
            existing.quantity += Number(quantity);
        } else {
            cart.push({ ...product, quantity: Number(quantity) });
        }
        localStorage.setItem(this.CART, JSON.stringify(cart));
        return cart;
    },

    clearCart() {
        localStorage.setItem(this.CART, JSON.stringify([]));
    },

    // Order Operations
    getOrders() {
        return JSON.parse(localStorage.getItem(this.ORDERS)) || [];
    },

    async placeOrder(order) {
        order.id = order.id || Date.now();
        order.date = order.date || new Date().toISOString();
        const user = this.getCurrentUser();
        if (user) order.customerId = user.id;

        try {
            await API.addOrder(order);
        } catch (err) {
            console.error('Order API error, saving locally only:', err);
        }

        // Deduct inventory stock on client side immediately
        if (order.items && order.items.length > 0) {
            const allProds = this.getProducts();
            order.items.forEach(item => {
                const prod = allProds.find(p => p.id.toString() === item.id.toString());
                if (prod) {
                    prod.quantity = Math.max(0, (prod.quantity || 100) - Number(item.quantity));
                }
            });
            localStorage.setItem(this.PRODUCTS, JSON.stringify(allProds));
        }

        // Update Local Storage
        let orders = this.getOrders();
        orders.push(order);
        localStorage.setItem(this.ORDERS, JSON.stringify(orders));
        this.clearCart();

        // Simulated Notifications: Order Placement
        if (window.showSimulatedSMS) {
            window.showSimulatedSMS('AGRI-CNCT', `Order #${order.id} placed! Total amount: ₹${order.total}. Thank you for shopping with AgriConnect.`);
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
            await API.updateOrderStatus(orderId, status);
        } catch (err) {
            console.error('Order status sync server error, updating locally only:', err);
        }

        let orders = this.getOrders();
        const order = orders.find(o => o.id.toString() === orderId.toString());
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
    },

    // Wishlist Operations
    getWishlist() {
        return JSON.parse(localStorage.getItem(this.WISHLIST)) || [];
    },

    addToWishlist(productId) {
        let wishlist = this.getWishlist();
        const idStr = productId.toString();
        if (!wishlist.includes(idStr)) {
            wishlist.push(idStr);
            localStorage.setItem(this.WISHLIST, JSON.stringify(wishlist));
            
            const user = this.getCurrentUser();
            if (user) {
                API.addToWishlistAPI(user.id, productId).catch(err => console.warn(err));
            }
        }
        return wishlist;
    },

    removeFromWishlist(productId) {
        let wishlist = this.getWishlist();
        const idStr = productId.toString();
        wishlist = wishlist.filter(id => id !== idStr);
        localStorage.setItem(this.WISHLIST, JSON.stringify(wishlist));

        const user = this.getCurrentUser();
        if (user) {
            API.removeFromWishlistAPI(user.id, productId).catch(err => console.warn(err));
        }
        return wishlist;
    },

    isInWishlist(productId) {
        const wishlist = this.getWishlist();
        return wishlist.includes(productId.toString());
    }
};

// Initialize DB on load
DB.init();

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
        // Add dynamic accessibility support
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('role', 'status');
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

// Helper utility globally declared for customer detail screen
window.escapeHTML = function(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
};
