# ShopScale — E-Commerce Fullstack App

A portfolio-grade fullstack e-commerce application built with **Node.js** (backend) and **React + Vite** (frontend).

---

## Features

- **Product catalog** — search, filter by category, sort by price
- **Shopping cart** — add, update, remove items with live totals
- **Coupon system** — apply discount codes at checkout
- **Checkout flow** — shipping address, mock payment, order confirmation
- **Auth** — register, login, JWT-based sessions
- **Admin dashboard** — revenue, order stats, top products, low stock alerts

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, plain HTTP (no Express) |
| Frontend | React 18, Vite, React Router |
| Auth | JWT (custom implementation, no libraries) |
| Storage | In-memory (default) or PostgreSQL |
| Styling | Pure CSS with CSS variables |

---

## Project Structure

```
fullstack/
├── backend/          # Node.js REST API
│   ├── src/
│   │   ├── services/ # Business logic (auth, cart, checkout, orders...)
│   │   ├── lib/      # Auth, crypto, cache, error handling
│   │   ├── storage/  # In-memory & PostgreSQL drivers
│   │   └── router.js # All API routes
│   └── db/
│       └── init.sql  # PostgreSQL schema
└── frontend/         # React + Vite SPA
    └── src/
        ├── api/      # Fetch layer
        ├── context/  # Auth + cart state
        └── pages/    # Products, Cart, Checkout, Orders, Admin
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### 1. Backend

```bash
cd fullstack/backend
npm install
node src/index.js
# API running at http://localhost:3000
```

### 2. Frontend

```bash
cd fullstack/frontend
npm install
npm run dev
# App running at http://localhost:5173
```

> Run both at the same time in two separate terminals.

---

## Environment Variables

Copy `.env.example` to `.env` in the backend folder:

```env
PORT=3000
JWT_SECRET=your-secret-here
STORAGE_DRIVER=memory        # or postgres
DATABASE_URL=postgresql://...  # required if STORAGE_DRIVER=postgres
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and get JWT |
| GET | `/products` | List products (search, category, sortBy) |
| GET | `/products/:id` | Get single product |
| POST | `/carts` | Create a cart |
| GET | `/carts/:id` | Get cart |
| POST | `/carts/:id/items` | Add item to cart |
| PATCH | `/carts/:id/items/:productId` | Update item quantity |
| DELETE | `/carts/:id/items/:productId` | Remove item |
| POST | `/coupons/validate` | Validate coupon code |
| POST | `/checkout` | Place an order (auth required) |
| GET | `/orders/:id` | Get order details |
| GET | `/admin/analytics` | Analytics summary (admin only) |

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| Customer | ava@example.com | customer123 |

## Test Coupons

| Code | Type | Value | Min. Order |
|------|------|-------|------------|
| `SAVE10` | 10% off | — | $100 |
| `SHIPFREE` | Free shipping | $25 | $150 |

---

## Deployment

- **Backend** → [Render](https://render.com) (set root directory to `fullstack/backend`)
- **Frontend** → [Vercel](https://vercel.com) (set root directory to `fullstack/frontend`, add `VITE_API_URL` env var pointing to your Render URL)

---

## License

MIT
