const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'db.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Serve static files (HTML/CSS/JS)

// Helper to read DB
function readDB() {
    try {
        if (!fs.existsSync(DB_FILE)) {
            const defaultDB = { users: [], products: [], orders: [] };
            fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2));
            return defaultDB;
        }
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading DB:', err);
        return { users: [], products: [], orders: [] };
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

// 1. Get All Users
app.get('/api/users', (req, res) => {
    const db = readDB();
    res.json(db.users || []);
});

// 2. Login
app.post('/api/login', (req, res) => {
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
    const db = readDB();
    
    if (!db.users) db.users = [];

    const existing = db.users.find(u => u.username === username || u.email === email);
    if (existing) {
        return res.status(400).json({ error: 'Username or email already exists' });
    }

    const id = Date.now().toString();
    const newUser = { id, name, username, email, password, role, location: location || null, mobile: mobile || null };
    db.users.push(newUser);

    if (writeDB(db)) {
        res.json({ success: true, user: { id, name, username, email, role, location, mobile } });
    } else {
        res.status(500).json({ error: 'Failed to write to database' });
    }
});

// 4. Update User
app.put('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const { name, email, location, mobile } = req.body;
    const db = readDB();

    const user = (db.users || []).find(u => u.id === userId);
    if (user) {
        Object.assign(user, { name, email, location, mobile });
        if (writeDB(db)) {
            res.json({ success: true, user });
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
    const { name, category, price, farmerId, image, type } = req.body;
    const db = readDB();
    const id = Date.now();

    if (!db.products) db.products = [];

    const newProduct = { id, name, category, price: Number(price), farmerId, image, type };
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

// 9. Update Product (Price edit)
app.put('/api/products/:id', (req, res) => {
    const productId = Number(req.params.id);
    const { price } = req.body;
    const db = readDB();

    const product = (db.products || []).find(p => p.id === productId);
    if (product) {
        product.price = Number(price);
        if (writeDB(db)) {
            res.json({ success: true });
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
    const { customerId, date, total, status, items, paymentMethod } = req.body;
    const db = readDB();
    const id = Date.now();
    const orderDate = date || new Date().toLocaleDateString();

    if (!db.orders) db.orders = [];

    const newOrder = { id, customerId: customerId || null, date: orderDate, total, status: status || 'Pending', items, paymentMethod };
    db.orders.push(newOrder);

    if (writeDB(db)) {
        // Log Simulated Notification on Backend
        console.log(`\n=================== SIMULATED NOTIFICATION (BACKEND) ===================`);
        console.log(`[SMS to Customer ${customerId || 'Guest'}]: Your AgriConnect order #${id} was placed successfully! Total: RS ${total}.`);
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

// 14. Dynamic Profit Analytics for Farmer
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
        const dateParts = (order.date || '').split('/');
        let monthName = 'Jun'; // default fallback
        if (dateParts.length >= 2) {
            const monthIdx = parseInt(dateParts[0]) - 1; // 0-11
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            if (monthIdx >= 0 && monthIdx < 12) {
                monthName = months[monthIdx];
            }
        }

        items.forEach(item => {
            if (item.farmerId === farmerId) {
                const itemRev = Number(item.price) * Number(item.quantity);
                if (order.status === 'Accepted') {
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

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Using database file: ${DB_FILE}`);
});
