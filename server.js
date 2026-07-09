const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

// Rate limiting in-memory map
const loginAttempts = new Map();

function rateLimitLogin(req, res, next) {
    const ip = req.ip;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 mins
    const limit = 10;

    if (!loginAttempts.has(ip)) {
        loginAttempts.set(ip, []);
    }

    const attempts = loginAttempts.get(ip).filter(timestamp => now - timestamp < windowMs);
    attempts.push(now);
    loginAttempts.set(ip, attempts);

    if (attempts.length > limit) {
        return res.status(429).json({ success: false, message: 'Too many login attempts from this IP. Please try again after 15 minutes.' });
    }
    next();
}

// CORS Config - restrict origins
const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://agriconnect.onrender.com'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1 && !origin.startsWith('http://localhost:')) {
            return callback(new Error('CORS Policy: Access denied'), false);
        }
        return callback(null, true);
    }
}));

app.use(express.json());

// Prevent access to db.json directly
app.get('/db.json', (req, res) => {
    res.status(403).send('Forbidden');
});

app.use(express.static('.')); // Serve static files (HTML/CSS/JS)

// Helper to read DB
function readDB() {
    try {
        if (!fs.existsSync(DB_FILE)) {
            const defaultDB = { users: [], products: [], orders: [], reviews: [], wishlist: [] };
            fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2));
            return defaultDB;
        }
        const data = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(data);
        if (!parsed.reviews) parsed.reviews = [];
        if (!parsed.wishlist) parsed.wishlist = [];
        return parsed;
    } catch (err) {
        console.error('Error reading DB:', err);
        return { users: [], products: [], orders: [], reviews: [], wishlist: [] };
    }
}

// Helper to write DB
function writeDB(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error('Error writing DB:', err);
        return false;
    }
}

// Ensure database file has initial seeded admin/farmers/customers if empty
function initSeededData() {
    const db = readDB();
    let updated = false;
    if (!db.users || db.users.length === 0) {
        db.users = [
            { id: 'admin', name: 'System Admin', username: 'admin', email: 'admin@agri.com', password: 'YWRtaW4=', role: 'admin', location: 'Headquarters' },
            { id: 'f1', name: 'John Farmer (Farmer 1)', username: 'farmer1', email: 'farmer1@agri.com', password: 'cGFzczE=', role: 'farmer', location: 'Green Valley' },
            { id: 'f2', name: 'Sarah Miller (Farmer 2)', username: 'farmer2', email: 'farmer2@agri.com', password: 'cGFzczI=', role: 'farmer', location: 'Sunny Hills' },
            { id: 'c1', name: 'Alice Customer', username: 'customer', email: 'customer@agri.com', password: 'cGFzczE=', role: 'customer' }
        ];
        updated = true;
    }
    if (updated) {
        writeDB(db);
    }
}

initSeededData();

// --- API Routes ---

// 1. Get All Users (Stripped of passwords)
app.get('/api/users', (req, res) => {
    const db = readDB();
    const safeUsers = (db.users || []).map(({ password, ...user }) => user);
    res.json(safeUsers);
});

// 2. Login
app.post('/api/login', rateLimitLogin, (req, res) => {
    const { username, password, role } = req.body;
    const db = readDB();
    const user = (db.users || []).find(u => u.username === username && u.password === password && u.role === role);

    if (user) {
        const { password, ...safeUser } = user;
        res.json({ success: true, user: safeUser });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// 3. Register User
app.post('/api/register', (req, res) => {
    const { name, username, email, mobile, password, role, location } = req.body;
    
    // Server-side validation
    if (!name || !username || !email || !password || !role) {
        return res.status(400).json({ error: 'Name, username, email, password, and role are required fields.' });
    }
    
    // Whitelist role
    if (role !== 'customer' && role !== 'farmer') {
        return res.status(400).json({ error: 'Invalid registration role.' });
    }

    const db = readDB();
    if (!db.users) db.users = [];

    const existing = db.users.find(u => u.username === username || u.email === email);
    if (existing) {
        return res.status(400).json({ error: 'Username or email already exists' });
    }

    const id = Date.now().toString();
    const newUser = { id, name, username, email, password, role, location: location || null, mobile: mobile || null, status: 'active' };
    db.users.push(newUser);

    if (writeDB(db)) {
        res.json({ success: true, user: { id, name, username, email, role, location, mobile, status: 'active' } });
    } else {
        res.status(500).json({ error: 'Failed to write to database' });
    }
});

// 4. Update User
app.put('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const { name, email, location, mobile, status, password } = req.body;
    const db = readDB();

    const user = (db.users || []).find(u => u.id === userId);
    if (user) {
        if (name !== undefined) user.name = name;
        if (email !== undefined) user.email = email;
        if (location !== undefined) user.location = location;
        if (mobile !== undefined) user.mobile = mobile;
        if (status !== undefined) user.status = status;
        if (password !== undefined) user.password = password; // Hashed password from client
        
        if (writeDB(db)) {
            const { password, ...safeUser } = user;
            res.json({ success: true, user: safeUser });
        } else {
            res.status(500).json({ error: 'Failed to write to database' });
        }
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

// 5. Delete User
app.delete('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const db = readDB();

    const initialLen = (db.users || []).length;
    db.users = (db.users || []).filter(u => u.id !== userId);

    if (db.users.length < initialLen) {
        if (writeDB(db)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to write to database' });
        }
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

// 6. Get Products
app.get('/api/products', (req, res) => {
    const db = readDB();
    res.json(db.products || []);
});

// 7. Add Product
app.post('/api/products', (req, res) => {
    const { name, category, price, farmerId, image, type, quantity, description } = req.body;
    
    if (!name || price === undefined || !farmerId) {
        return res.status(400).json({ error: 'Name, price, and farmerId are required fields.' });
    }
    if (isNaN(price) || Number(price) <= 0) {
        return res.status(400).json({ error: 'Price must be a valid positive number.' });
    }

    const db = readDB();
    const id = Date.now();

    if (!db.products) db.products = [];

    const newProduct = { 
        id, 
        name, 
        category: category || 'organic', 
        price: Number(price), 
        farmerId, 
        image: image || 'placeholder.png', 
        type: type || 'Organic Produce',
        quantity: quantity !== undefined ? Number(quantity) : 100, // Stock level
        description: description || ''
    };
    db.products.push(newProduct);

    if (writeDB(db)) {
        res.json(newProduct);
    } else {
        res.status(500).json({ error: 'Failed to write to database' });
    }
});

// 8. Get My Products (Farmer)
app.get('/api/products/farmer/:id', (req, res) => {
    const farmerId = req.params.id;
    const db = readDB();
    const myProducts = (db.products || []).filter(p => p.farmerId === farmerId);
    res.json(myProducts);
});

// 9. Update Product (Price & stock edit)
app.put('/api/products/:id', (req, res) => {
    const productId = Number(req.params.id);
    const { name, category, type, price, quantity, description, image } = req.body;
    const db = readDB();

    const product = (db.products || []).find(p => p.id === productId);
    if (product) {
        if (name !== undefined) product.name = name;
        if (category !== undefined) product.category = category;
        if (type !== undefined) product.type = type;
        if (price !== undefined) {
            if (isNaN(price) || Number(price) <= 0) {
                return res.status(400).json({ error: 'Price must be a valid positive number.' });
            }
            product.price = Number(price);
        }
        if (quantity !== undefined) product.quantity = Number(quantity);
        if (description !== undefined) product.description = description;
        if (image !== undefined) product.image = image;

        if (writeDB(db)) {
            res.json({ success: true, product });
        } else {
            res.status(500).json({ error: 'Failed to write to database' });
        }
    } else {
        res.status(404).json({ error: 'Product not found' });
    }
});

// 10. Delete Product
app.delete('/api/products/:id', (req, res) => {
    const productId = Number(req.params.id);
    const db = readDB();

    const initialLen = (db.products || []).length;
    db.products = (db.products || []).filter(p => p.id !== productId);

    if (db.products.length < initialLen) {
        if (writeDB(db)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to write to database' });
        }
    } else {
        res.status(404).json({ error: 'Product not found' });
    }
});

// 11. Get Orders
app.get('/api/orders', (req, res) => {
    const db = readDB();
    res.json(db.orders || []);
});

// 12. Add Order
app.post('/api/orders', (req, res) => {
    const { customerId, date, total, status, items, paymentMethod, deliveryAddress } = req.body;
    const db = readDB();
    const id = Date.now();
    const orderDate = date || new Date().toISOString();

    if (!db.orders) db.orders = [];

    // Decrement inventory stock on product purchase
    if (items && items.length > 0) {
        if (!db.products) db.products = [];
        items.forEach(item => {
            const prod = db.products.find(p => p.id == item.id);
            if (prod) {
                prod.quantity = Math.max(0, (prod.quantity || 100) - (item.quantity || 1));
            }
        });
    }

    const newOrder = { id, customerId: customerId || null, date: orderDate, total, status: status || 'Pending', items, paymentMethod, deliveryAddress };
    db.orders.push(newOrder);

    if (writeDB(db)) {
        // Log Simulated Notification on Backend
        console.log(`\n=================== SIMULATED NOTIFICATION (BACKEND) ===================`);
        console.log(`[SMS to Customer ${customerId || 'Guest'}]: Your AgriConnect order #${id} was placed successfully! Total: ₹${total}.`);
        if (items && items.length > 0) {
            const farmers = [...new Set(items.map(i => i.farmerId))];
            farmers.forEach(fId => {
                const cropNames = items.filter(i => i.farmerId === fId).map(i => `${i.name} (x${i.quantity})`).join(', ');
                console.log(`[WhatsApp to Farmer ${fId}]: New Order #${id} received for: ${cropNames}. Please review it.`);
            });
        }
        console.log(`========================================================================\n`);
        res.json(newOrder);
    } else {
        res.status(500).json({ error: 'Failed to write to database' });
    }
});

// 13. Update Order Status
app.put('/api/orders/:id', (req, res) => {
    const orderId = Number(req.params.id);
    const { status } = req.body;
    
    // Whitelist status
    const allowedStatuses = ['Pending', 'Accepted', 'Rejected', 'Delivered'];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid order status.' });
    }

    const db = readDB();
    const order = (db.orders || []).find(o => o.id === orderId);
    if (order) {
        order.status = status;
        if (writeDB(db)) {
            // Log Simulated Notification on Backend
            console.log(`\n=================== SIMULATED NOTIFICATION (BACKEND) ===================`);
            console.log(`[WhatsApp to Customer ${order.customerId || 'Guest'}]: Your AgriConnect order #${orderId} has been updated to "${status}".`);
            console.log(`========================================================================\n`);
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to write to database' });
        }
    } else {
        res.status(404).json({ error: 'Order not found' });
    }
});

// 14. Dynamic Profit Analytics for Farmer (Uses ISO Date month parsing)
app.get('/api/farmers/:id/profit', (req, res) => {
    const farmerId = req.params.id;
    const db = readDB();
    const orders = db.orders || [];

    let totalRevenue = 0;
    let productSales = {}; // maps product name -> revenue
    let monthlyRevenue = {
        Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
        Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
    };

    orders.forEach(order => {
        const items = order.items || [];
        
        // Parse ISO Date or locale string date
        const orderDate = new Date(order.date);
        let monthName = 'Jun'; // fallback
        if (!isNaN(orderDate.getTime())) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            monthName = months[orderDate.getMonth()];
        } else {
            // String split fallback if Date constructor fails
            const dateParts = (order.date || '').split('/');
            if (dateParts.length >= 2) {
                const monthIdx = parseInt(dateParts[0]) - 1; // 0-11
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                if (monthIdx >= 0 && monthIdx < 12) {
                    monthName = months[monthIdx];
                }
            }
        }

        items.forEach(item => {
            if (item.farmerId === farmerId) {
                const itemRev = Number(item.price) * Number(item.quantity);
                if (order.status === 'Accepted' || order.status === 'Delivered') {
                    totalRevenue += itemRev;
                    monthlyRevenue[monthName] = (monthlyRevenue[monthName] || 0) + itemRev;
                }
                productSales[item.name] = (productSales[item.name] || 0) + itemRev;
            }
        });
    });

    let topProduct = 'N/A';
    let maxSales = 0;
    for (const prod in productSales) {
        if (productSales[prod] > maxSales) {
            maxSales = productSales[prod];
            topProduct = prod;
        }
    }

    const chartData = [
        { label: 'Jan', value: monthlyRevenue.Jan },
        { label: 'Feb', value: monthlyRevenue.Feb },
        { label: 'Mar', value: monthlyRevenue.Mar },
        { label: 'Apr', value: monthlyRevenue.Apr },
        { label: 'May', value: monthlyRevenue.May },
        { label: 'Jun', value: monthlyRevenue.Jun },
        { label: 'Jul', value: monthlyRevenue.Jul },
        { label: 'Aug', value: monthlyRevenue.Aug },
        { label: 'Sep', value: monthlyRevenue.Sep },
        { label: 'Oct', value: monthlyRevenue.Oct },
        { label: 'Nov', value: monthlyRevenue.Nov },
        { label: 'Dec', value: monthlyRevenue.Dec }
    ];

    res.json({
        success: true,
        totalRevenue,
        topProduct,
        monthlyRevenue,
        chartData
    });
});

// 15. Reviews routes
app.get('/api/products/:id/reviews', (req, res) => {
    const productId = Number(req.params.id);
    const db = readDB();
    const reviews = (db.reviews || []).filter(r => r.productId === productId);
    res.json(reviews);
});

app.post('/api/reviews', (req, res) => {
    const { productId, rating, comment, customerId, customerName } = req.body;
    if (!productId || !rating || !customerId) {
        return res.status(400).json({ error: 'ProductId, rating, and customerId are required.' });
    }
    const db = readDB();
    if (!db.reviews) db.reviews = [];
    
    const newReview = {
        id: Date.now(),
        productId: Number(productId),
        rating: Number(rating),
        comment: comment || '',
        customerId,
        customerName: customerName || 'Verified Customer',
        date: new Date().toLocaleDateString('en-IN')
    };
    db.reviews.push(newReview);
    if (writeDB(db)) {
        res.json(newReview);
    } else {
        res.status(500).json({ error: 'Failed to save review' });
    }
});

// 16. Wishlist routes
app.get('/api/wishlist/:userId', (req, res) => {
    const userId = req.params.userId;
    const db = readDB();
    const list = (db.wishlist || []).filter(w => w.userId === userId).map(w => w.productId);
    res.json(list);
});

app.post('/api/wishlist', (req, res) => {
    const { userId, productId } = req.body;
    if (!userId || !productId) {
        return res.status(400).json({ error: 'UserId and productId are required.' });
    }
    const db = readDB();
    if (!db.wishlist) db.wishlist = [];

    const existing = db.wishlist.find(w => w.userId === userId && w.productId === Number(productId));
    if (!existing) {
        db.wishlist.push({ userId, productId: Number(productId) });
        writeDB(db);
    }
    res.json({ success: true });
});

app.delete('/api/wishlist/:userId/:productId', (req, res) => {
    const { userId, productId } = req.params;
    const db = readDB();
    if (!db.wishlist) db.wishlist = [];

    db.wishlist = db.wishlist.filter(w => !(w.userId === userId && w.productId === Number(productId)));
    writeDB(db);
    res.json({ success: true });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Using database file: ${DB_FILE}`);
});
