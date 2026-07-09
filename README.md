# 🌱 AgriConnect

AgriConnect is a premium, full-stack farm-to-table marketplace web application designed to connect local farmers directly with consumers. By eliminating intermediaries, AgriConnect enables customers to purchase fresh, organic produce at fair prices while empowering farmers with robust business tools.

---

## 🚀 Key Features

*   **Multilingual Localization**: Real-time translation support (English/Gujarati) integrated across all core dashboards.
*   **Dynamic Profit Analytics**: A modern, pill-shaped bar chart rendering visual monthly sales analytics and statistics (Total Revenue, Top-Performing Crops, and Growth) for farmers.
*   **Fully Responsive Layout**: Built with a mobile-first responsive grid system, featuring an interactive hamburger drawer menu designed for all device widths.
*   **Global Toast Notification System**: Replaced native browser alerts with slide-in CSS-animated notifications (success, warning, info, error states).
*   **Centralized Mock API & Data Layer**: Features unified backend fetch operations with automatic client-side local caching fallback if the server goes offline.
*   **Order Lifecycle Management**: Full transaction processing pipeline (Pending, Accepted, Rejected states) with simulated SMS & WhatsApp messaging dispatch notifications.
*   **Robust Accessibility**: Structured with label associations, scope tags, table captions, and ARIA dialog properties to comply with screen reader accessibility best practices.

---

## 🛠️ Tech Stack

*   **Frontend**: Vanilla HTML5, CSS3 Variables & Animations, and Modern ES6 JavaScript.
*   **Backend**: Node.js with Express (equipped with CORS and Body-Parser).
*   **Database**: Structured `db.json` datastore (with automated seeding fallback on launch).

---

## 📁 Directory Structure

```text
AgriConnect_FSD/
├── admin/               # Admin dashboard templates (Farmers, Customers, Transactions)
├── customer/            # Customer store and checkout templates (Fruits, Seasonal, Organic)
├── farmer/              # Farmer inventory and profit analytics templates
├── css/                 # Core stylesheets (common.css layout rules, component styles)
├── js/                  # Application controllers (auth.js, customer.js, farmer.js, admin.js)
├── db.json              # Mock database containing initial seed users and crops
├── server.js            # Express API Server
├── LICENSE              # MIT License details
└── README.md            # Project documentation
```

---

## ⚙️ How to Run Locally

### 1. Prerequisite
Ensure you have **Node.js** (v14 or higher) installed on your system.

### 2. Install Dependencies
Open your terminal inside the project directory and run:
```bash
npm install
```

### 3. Start the Server
Run the Express application server:
```bash
npm start
```
The console will log: `Server running on http://localhost:3000`.

### 4. Access the Application
Open your web browser and navigate to:
```text
http://localhost:3000
```
*(The server serves both the backend API endpoints and the static HTML/CSS/JS frontend pages).*

---

## 🧪 Testing the Pipelines
You can verify the entire full-stack user journey (Farmer crop creation $\rightarrow$ Customer shopping checkout $\rightarrow$ Farmer order acceptance $\rightarrow$ Analytics updates $\rightarrow$ Admin auditing) by running the automated integration script:
```bash
node C:\Users\vatsa\.gemini\antigravity\brain\047af5a0-ac32-4174-a772-d242dc4682bb\scratch\test_user_journey.js
```

---

## 📝 License
This project is open-source and licensed under the **[MIT License](LICENSE)**.
