<div align="center">
  <img src="https://via.placeholder.com/150x150.png?text=ToppersCrowd" alt="ToppersCrowd Logo" width="120" />
  <h1>ToppersCrowd E-Commerce API</h1>
  
  <p>
    An enterprise-grade, highly scalable Node.js backend infrastructure designed for secure, lightning-fast digital book distribution, real-time collaboration, and e-commerce.
  </p>

  <div>
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
    <img src="https://img.shields.io/badge/Stripe-626CD9?style=for-the-badge&logo=Stripe&logoColor=white" />
    <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" />
  </div>
</div>

---

## ⚡ Key Features

ToppersCrowd is built using modern Software Engineering principles emphasizing **Type Safety, Decoupled Modules, and High Availability**:

- 🛡️ **End-to-End Type Safety:** 100% strict TypeScript configuration validated through **Zod** payload schemas.
- 🔒 **Ironclad Security:** Robust defenses using automated rate limiting, `helmet` HTTP headers, parameterized queries mapping (`express-mongo-sanitize`), XSS cleaning (`xss-clean`), and HTTP parameter pollution prevention (`hpp`).
- 💳 **Advanced Stripe Orders (Bulk Support):** A robust background system featuring atomicity for multiple items per order. An automated `node-cron` task continuously scans pending orders, validates Stripe session expiration, and auto-cancels "ghost" carts.
- 📚 **Dynamic Books:** Book models automatically validate dependencies via pre-save middlewares, deeply integrate metrics for `saleCount` / `averageRating`, and support dual media tracking for `audio` and `image` formats via Cloudinary.
- 🛒 **Unique Cart Tracking:** Each user owns a unique, isolated cart instance with real-time aggregated state updates (live `totalPrice` calculation).
- 💬 **Real-Time Communication:** **Socket.io** powered live chatrooms for interactive user engagement and collaboration.
- 📖 **Personalized Library & Favorites:** Dedicated modules for managing purchased digital content and bookmarked books, offering a seamless user-centric experience.
- 🎧 **Audiobook Persistence:** Native `Listener Progress` tracking that automatically saves playback positions, allowing users to resume exactly where they left off.
- 🏷️ **Smart Discounting System:** Native Coupon module enabling strategic, targeted marketing via `Nodemailer`.
- 📊 **Observability & Logging:** Structured performant logging using **Pino** and `pino-http`, ensuring full visibility into request life-cycles and backend operations.

---

## 🛠️ Technology Stack

| Category | Technologies |
| :--- | :--- |
| **Runtime & Core** | Node.js, TypeScript, Express.js |
| **Database & ORM** | MongoDB, Mongoose |
| **Validation & Auth** | Zod, JWT (JSON Web Tokens), bcrypt, crypto-js |
| **Real-Time** | Socket.io |
| **Payments** | Stripe |
| **Storage & Uploads** | Cloudinary, Multer |
| **Email Services** | Nodemailer |
| **Security** | Helmet, CORS, express-rate-limit, express-mongo-sanitize, xss-clean, hpp |
| **Logging & Tasks** | Pino, node-cron |

---

## 🔌 API Route Structure

Our domain-driven API routes are clean and well-organized into isolated modules. 
Base Prefix: `/api/v1` *(Standardized)*

| Module | Base Path | Functionality Overview |
| :--- | :--- | :--- |
| **Users** | `/user` | User profiles, role-based management, history, capabilities. |
| **Auth** | `/auth` | JWT generation, Registration, Login, and Password resets. |
| **Books** | `/book` | Core CRUD for Digital Books (including filtering and parsing). |
| **Categories** | `/bookcategory` | Taxonomy & relationships for organizing books. |
| **Reviews** | `/review` | Independent review systems mapped to specific resources. |
| **Carts** | `/cart` | Dynamic cart state tracking, updates, and validations. |
| **Orders** | `/order` | Securing checkout state, Stripe flows, and final invoicing (bulk support). |
| **Coupons** | `/coupon` | System for discounts, calculating valid codes and expiries. |
| **Favorites** | `/favorite` | Personal book bookmarking and management. |
| **Library** | `/library` | User-specific purchased digital content and listening stats. |
| **Listener Progress**| `/listener-progress`| Real-time tracking and persistence of audiobook playback positions. |
| **Chatrooms** | `/chatroom` | Interactions connecting internal socket ecosystems. |
| **Admin** | `/admin-dashboard` | Statistical overviews and management of Users, Audio content, and Reviews. |

---

## 🏗️ Architecture & File Structure

The project implements an elegant Domain-Driven Modular architecture to ensure maximum flexibility and scale.

```text
topperscrowd-backend/
├── src/
│   ├── config/             # Environment, Constant Mappers
│   ├── errors/             # Global Zod/Mongoose Error Overrides
│   ├── interface/          # Application-level TS Declarations 
│   ├── lib/                # Third-party wrappers (Stripe, Cloudinary)
│   ├── middleware/         # Auth verify, Role gates, Validation delegates
│   ├── modules/            # Domain Modules (User, Auth, Book, Order...)
│   │   └── {module}/       # e.g., auth.controller, auth.service, auth.route
│   ├── router/             # Centralized routing registry map
│   ├── socket/             # Socket.io connection handlers and events
│   ├── types/              # Express overrides and generic typings
│   ├── utils/              # Pure functions (SMTP, formatting, math)
│   ├── app.ts              # Express initialization & Security limits
│   ├── server.ts           # DB Connection & Bootstrapping
│   ├── logger.ts           # Pino configuration
│   └── httpLogger.ts       # HTTP request logging middleware
├── script/                 # Helper tools (auto-generate modules, etc.)
└── package.json            # Scripts & Dependency mapping
```

---

## 🚀 Getting Started (Installation)

Follow these steps exactly to run the ToppersCrowd backend seamlessly on your local environment.

### 1. Prerequisites
* **Node.js** (v18.x or newer strongly recommended)
* **MongoDB** (Local instance or MongoDB Atlas cluster URI)
* **API Keys** (Stripe, Cloudinary, Gmail App Password)

### 2. Clone & Install
```bash
git clone https://github.com/FSDTeam-SAA/topperscrowd-backend.git
cd topperscrowd-backend
npm install
```

### 3. Environment Variable Configuration
Create a `.env` file at the root of the project. You must populate these exactly as instructed by the following template:

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

# CLOUDINARY STORAGE
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# EMAIL DELIVERY
EMAIL_ADDRESS=your.company@gmail.com
EMAIL_PASS=your_google_app_password

# STRIPE PAYMENTS
STRIPE_SECRET_KEY=sk_test_your_secret_stripe_key

# FRONTEND CONNECTION
CLIENT_URL=http://localhost:3000
```

### 4. Boot Up Server
Utilize the built-in `ts-node-dev` server capability for extremely rapid auto-reloading:

```bash
npm run dev
```

You should see successful startup logs in the console managed by Pino:
```json
{"level":30,"msg":"MongoDB connected successfully"}
{"level":30,"msg":"Server running on port 5000"}
```

---

## 📜 Core CLI Scripts

| Command | Action | Description |
| :--- | :--- | :--- |
| `npm run dev` | **Development** | Runs the server using `ts-node-dev` for blazing fast auto-reloads. |
| `npm run build` | **Compilation** | Compiles TypeScript files securely into production-ready Javascript in `./dist`. |
| `npm start` | **Production** | Runs the compiled application (`npm run build` is required first). |
| `npm run lint` | **Linting** | Scans all `.ts` files to ensure formatting consistency via ESLint. |
| `npm run lint:fix`| **Formatting** | Attempts to auto-resolve ESLint strict rule violations. |
| `npm run make-module` | **Generation** | Custom script `generate-module.ts` to scaffold Domain elements instantly! |

---

<div align="center">
  <sub>Built with ❤️ practically by the FSDTeam-SAA Engineering Team using enterprise REST architectures.</sub>
</div>
