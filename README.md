<div align="center">
  <img src="https://via.placeholder.com/150x150.png?text=ToppersCrowd" alt="ToppersCrowd Logo" width="120" />
  <h1>ToppersCrowd E-Commerce API</h1>
  
  <p>
    An enterprise-grade, highly scalable Node.js backend infrastructure designed for secure, lightning-fast digital book distribution.
  </p>

  <div>
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
    <img src="https://img.shields.io/badge/Stripe-626CD9?style=for-the-badge&logo=Stripe&logoColor=white" />
  </div>
</div>

---

## ⚡ Key Architecture & Features
ToppersCrowd is built using modern Software Engineering principles emphasizing **Type Safety, Decoupled Modules, and High Availability**:

- 🛡️ **End-to-End Type Safety**: 100% strict TypeScript configuration validated through Zod payload parsers.
- 🔒 **Ironclad Security**: Automated rate limiting, helmet HTTP headers, parameterized queries mapping, XSS cleaning, and secure cookie parsers. 
- 💳 **WebHook-Free Payment Pipeline**: Native Stripe Checkout integration with unique 10-second fail-safe Cron Jobs ensuring atomic transactions.
- 🎟️ **Dynamic Digital Asset Pipelines**: Auto-syncing Cloudinary integrations for Book Covers (Images) and Audiobooks (MP3s).
- 🏷️ **Smart Discounting System**: A native Coupon Module integrated strictly to user identification for targeted marketing emails.
- 🛒 **Self-Healing Shopping Carts**: Ghost products are automatically scrubbed and live prices recalculate continuously to protect revenue.

## 🛠️ Technology Stack
* **Runtime Node:** `Node.js`
* **Core Language:** `TypeScript`
* **Server Library:** `Express`
* **Database & ORM:** `MongoDB` & `Mongoose`
* **Validation Schema:** `Zod`
* **Payment Gateway:** `Stripe`
* **Task Scheduling:** `Node-Cron`
* **Cloud Storage:** `Cloudinary`
* **Mail Integration:** `Nodemailer`

---

## 🚀 Getting Started (Installation)

Follow these simple steps perfectly to run the ToppersCrowd backend on your local development environment.

### 1. Prerequisites
Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/en/) (v18.x or newer strongly recommended)
* [MongoDB](https://www.mongodb.com/try/download/community) (Local install) OR a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) URI string.

### 2. Clone the Repository
```bash
git clone https://github.com/FSDTeam-SAA/topperscrowd-backend.git
cd topperscrowd-backend
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a root file named `.env` in the backend folder. You MUST populate this file for the server to securely bind its secrets. Use the following template:

```env
# SERVER CONIFGURATION
NODE_ENV=development
PORT=5000
DATABASE_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/topperscrowd

# AUTHENTICATION
BCRYPT_SALT_ROUNDS=12
JWT_ACCESS_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_ACCESS_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=30d

# CLOUDINARY STORAGE (Images & Audio)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# EMAIL DELIVERY (Nodemailer)
EMAIL_ADDRESS=your.company@gmail.com
EMAIL_PASS=your_google_app_password

# STRIPE PAYMENTS
STRIPE_SECRET_KEY=sk_test_your_secret_stripe_key

# FRONTEND CONNECTION
CLIENT_URL=http://localhost:3000
```

### 5. Start the Development Server
Our dev script operates highly effectively with `ts-node-dev` for blazing fast auto-reloads.
```bash
npm run dev
```

If successful, your console will output:
```bash
INFO: MongoDB connected successfully
INFO: Server running on port 5000
```

---

## 📜 Core NPM Scripts

| Command | Action | Description |
| :--- | :--- | :--- |
| `npm run dev` | **Development** | Re-compiles code and restarts the server implicitly whenever a TypeScript file is saved. |
| `npm run build` | **Compilation** | Emits raw, production-ready JavaScript code files safely into the `./dist` folder securely dropping type files. |
| `npm start` | **Production** | Serves the finalized production infrastructure securely utilizing Node.js (Requires you to run `npm run build` first). |
| `npm run lint` | **Code Quality** | Scans all backend TS files enforcing strict formatting and code-standard guidelines via ESLint. |

---

## 🏗️ Technical File Structure

An elegant Domain-Driven Modular architecture ensures maximum flexibility preventing technical debt overhead.

```
topperscrowd-backend/
├── src/
│   ├── modules/            # The Core DNA (Business Logic Hub)
│   │   ├── auth/           # Login, Session Tokens, Registration
│   │   ├── book/           # Cloudinary Audiobooks, Pricing mapping
│   │   ├── cart/           # Advanced Ghost-scrubbing cart architecture 
│   │   ├── order/          # Stripe web-hook-free Cron checkpoints
│   │   ├── coupon/         # Custom discount triggers via Nodemailer
│   │   └── user/           # Identification and Profile schemas
│   ├── middleware/         # Security Gatekeepers (JWT Auth, Error Handlers)
│   ├── errors/             # Global Zod / Mongoose Formatting Overrides
│   ├── utils/              # Pure Extracted Functions (SMTP, Math validation)
│   ├── config/             # Type-Safe Environment Variable Wrappers
│   ├── server.ts           # The MongoDB Bootstrap Pipeline
│   └── app.ts              # API Declaration, Router registrations & Security limits
├── package.json            
└── tsconfig.json           
```

---

<div align="center">
  <sub>Built with ❤️ perfectly by the FSDTeam-SAA Engineering Team using standard REST architectures.</sub>
</div>
