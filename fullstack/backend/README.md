# E-Commerce Backend at Scale

A production-style backend project built with Node.js that models a realistic commerce domain with products, carts, coupons, checkout, payments, inventory reservation, order tracking, caching, JWT auth, Swagger-style OpenAPI docs, and PostgreSQL-ready deployment.

## Features

- Product catalog with search, category filtering, and caching
- JWT auth with customer/admin roles
- Cart creation and item management
- Inventory-aware checkout flow
- Coupon validation and discounts
- Simulated payment authorization with failure modes
- Order creation, status updates, and tracking
- Admin analytics for revenue, top products, and inventory risk
- OpenAPI JSON and built-in docs page
- Dockerized app + PostgreSQL setup
- Seed data included for demos and testing
- Integration tests covering auth and protected routes

## Tech

- Node.js
- Native HTTP server
- In-memory store for local verification
- PostgreSQL-ready schema and Docker Compose stack
- Native test runner

## Run

```bash
npm.cmd start
```

The server starts on `http://localhost:3000` by default.

### Docker + PostgreSQL

```bash
docker compose up --build
```

This uses PostgreSQL plus the schema in `db/init.sql`.

## Test

```bash
npm.cmd test
```

## API Overview

### Health

- `GET /health`

### Auth

- `POST /auth/register`
- `POST /auth/login`

### Products

- `GET /products`
- `GET /products/:id`

### Cart

- `POST /carts`
- `GET /carts/:cartId`
- `POST /carts/:cartId/items`
- `PATCH /carts/:cartId/items/:productId`
- `DELETE /carts/:cartId/items/:productId`

### Coupons

- `POST /coupons/validate`

### Checkout and Orders

- `POST /checkout`
- `GET /orders/:orderId`
- `PATCH /orders/:orderId/status`

### Admin Analytics

- `GET /admin/analytics`

### Docs

- `GET /docs`
- `GET /docs/openapi.json`

## Example Checkout Request

```json
{
  "cartId": "cart_1",
  "couponCode": "SAVE10",
  "paymentMethod": {
    "type": "card",
    "cardLast4": "4242"
  },
  "customer": {
    "name": "Ava Stone",
    "email": "ava@example.com"
  },
  "shippingAddress": {
    "line1": "221B Baker Street",
    "city": "London",
    "country": "UK",
    "postalCode": "NW16XE"
  }
}
```

## Demo Credentials

```json
{
  "admin": {
    "email": "admin@example.com",
    "password": "admin123"
  },
  "customer": {
    "email": "ava@example.com",
    "password": "customer123"
  }
}
```

## Design Notes

- Inventory is reserved during checkout and rolled back on payment failure.
- Payment is simulated but deterministic enough for testing.
- Product list responses are cached with TTL.
- Analytics aggregate live order data and are admin-protected.
- Local verification runs on the in-memory driver; Docker configuration provides a PostgreSQL-ready stack for deployment demos.
- JWT signing uses a local secret from environment configuration.
