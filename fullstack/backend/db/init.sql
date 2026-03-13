CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  inventory_available INTEGER NOT NULL DEFAULT 0,
  inventory_reserved INTEGER NOT NULL DEFAULT 0,
  inventory_sold INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS coupons (
  code TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value NUMERIC(10, 2) NOT NULL,
  minimum_subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS carts (
  id TEXT PRIMARY KEY,
  currency TEXT NOT NULL DEFAULT 'USD',
  customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
  cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  name TEXT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  PRIMARY KEY (cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  cart_id TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  shipping_address JSONB NOT NULL,
  items JSONB NOT NULL,
  pricing JSONB NOT NULL,
  payment JSONB NOT NULL,
  status TEXT NOT NULL,
  status_history JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO users (id, name, email, password_hash, role)
VALUES
  ('user_admin', 'Admin User', 'admin@example.com', 'sha256$240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin'),
  ('user_customer', 'Ava Stone', 'ava@example.com', 'sha256$b041c0aeb35bb0fa4aa668ca5a920b590196fdaf9a00eb852c9b7f4d123cc6d6', 'customer')
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, name, description, category, price, inventory_available, inventory_reserved, inventory_sold)
VALUES
  ('prod_keyboard', 'Mechanical Keyboard Pro', 'Hot-swappable keyboard with aluminum chassis and RGB backlight.', 'electronics', 129.99, 24, 0, 0),
  ('prod_mouse', 'Precision Wireless Mouse', 'Low-latency mouse designed for productivity and gaming.', 'electronics', 79.99, 40, 0, 0),
  ('prod_monitor', '4K Productivity Monitor', '27-inch IPS monitor with USB-C docking support.', 'electronics', 349.99, 10, 0, 0),
  ('prod_chair', 'Ergonomic Office Chair', 'Adjustable lumbar support and breathable mesh design.', 'furniture', 259.50, 8, 0, 0),
  ('prod_desk', 'Standing Desk', 'Dual-motor standing desk with memory presets.', 'furniture', 499.00, 6, 0, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO coupons (code, type, value, minimum_subtotal, active)
VALUES
  ('SAVE10', 'percentage', 10, 100, TRUE),
  ('SHIPFREE', 'fixed', 25, 150, TRUE)
ON CONFLICT (code) DO NOTHING;
