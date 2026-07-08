const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite database (creates file if not exists)
const dbPath = path.resolve(__dirname, 'agri_connect.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the AgriConnect SQLite database.');
        initDatabase();
    }
});

function initDatabase() {
    db.serialize(() => {
        // 1. Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT,
            location TEXT,
            mobile TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 2. Products Table
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY,
            name TEXT,
            category TEXT,
            price REAL,
            farmerId TEXT,
            image TEXT,
            type TEXT,
            FOREIGN KEY(farmerId) REFERENCES users(id)
        )`);

        // 3. Orders Table (storing items as JSON string for simplicity in SQLite)
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY,
            customerId TEXT,
            date TEXT,
            total REAL,
            status TEXT DEFAULT 'Pending',
            items JSON, 
            FOREIGN KEY(customerId) REFERENCES users(id)
        )`);

        console.log('Database tables initialized.');
        seedData();
    });
}

const fs = require('fs');

// Seed initial data if empty
function seedData() {
    let dbJson = null;
    try {
        const dataPath = path.resolve(__dirname, 'db.json');
        if (fs.existsSync(dataPath)) {
            dbJson = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        }
    } catch (e) {
        console.error('Failed to read db.json for seeding:', e);
    }

    db.get("SELECT count(*) as count FROM users", (err, row) => {
        if (row && row.count === 0) {
            console.log('Seeding initial users...');
            const users = (dbJson && dbJson.users) ? dbJson.users : [
                { id: 'admin', name: 'System Admin', username: 'admin', email: 'admin@agri.com', password: 'YWRtaW4=', role: 'admin', location: 'Headquarters' },
                { id: 'f1', name: 'John Farmer (Farmer 1)', username: 'farmer1', email: 'farmer1@agri.com', password: 'cGFzczE=', role: 'farmer', location: 'Green Valley' },
                { id: 'f2', name: 'Sarah Miller (Farmer 2)', username: 'farmer2', email: 'farmer2@agri.com', password: 'cGFzczI=', role: 'farmer', location: 'Sunny Hills' },
                { id: 'c1', name: 'Alice Customer', username: 'customer', email: 'customer@agri.com', password: 'cGFzczE=', role: 'customer', location: 'City Center' }
            ];
            const stmt = db.prepare("INSERT INTO users (id, name, username, email, password, role, location) VALUES (?, ?, ?, ?, ?, ?, ?)");
            users.forEach(u => {
                stmt.run(u.id, u.name, u.username, u.email, u.password, u.role, u.location || null);
            });
            stmt.finalize();
            console.log('Users seeded.');
        }
    });

    db.get("SELECT count(*) as count FROM products", (err, row) => {
        if (row && row.count === 0) {
            console.log('Seeding initial products...');
            const products = (dbJson && dbJson.products) ? dbJson.products : [];
            const stmt = db.prepare("INSERT INTO products (id, name, category, price, farmerId, image, type) VALUES (?, ?, ?, ?, ?, ?, ?)");
            products.forEach(p => {
                stmt.run(p.id, p.name, p.category, p.price, p.farmerId, p.image, p.type);
            });
            stmt.finalize();
            console.log('Products seeded.');
        }
    });

    db.get("SELECT count(*) as count FROM orders", (err, row) => {
        if (row && row.count === 0) {
            console.log('Seeding initial orders...');
            const orders = (dbJson && dbJson.orders) ? dbJson.orders : [];
            const stmt = db.prepare("INSERT INTO orders (id, customerId, date, total, status, items) VALUES (?, ?, ?, ?, ?, ?)");
            orders.forEach(o => {
                stmt.run(o.id, o.customerId, o.date, o.total, o.status || 'Pending', JSON.stringify(o.items));
            });
            stmt.finalize();
            console.log('Orders seeded.');
        }
    });
}

module.exports = db;
