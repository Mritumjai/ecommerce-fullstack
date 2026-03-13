const fs = require("fs");
const path = require("path");
const { seedStore } = require("../seed");

async function createStorage(config) {
  if (config.storageDriver === "postgres") {
    return createPostgresStorage(config);
  }
  return createMemoryStorage();
}

function createMemoryStorage() {
  const store = seedStore();
  store.meta = { driver: "memory" };
  attachMemoryPersistence(store);
  return store;
}

function attachMemoryPersistence(store) {
  store.saveUser = async (user) => {
    store.users.set(user.id, user);
  };
  store.saveCart = async (cart) => {
    store.carts.set(cart.id, cart);
  };
  store.saveProduct = async (product) => {
    store.products.set(product.id, product);
  };
  store.saveOrder = async (order) => {
    store.orders.set(order.id, order);
  };
}

async function createPostgresStorage(config) {
  const { Client } = require("pg");
  const client = new Client({
    connectionString: config.databaseUrl
  });
  await client.connect();
  await ensureSchema(client);

  const store = await hydrateStore(client);
  store.meta = { driver: "postgres", databaseUrl: config.databaseUrl };
  store.db = client;
  store.saveUser = async (user) => {
    await client.query(
      `INSERT INTO users (id, name, email, password_hash, role, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE
       SET name = EXCLUDED.name,
           email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role`,
      [user.id, user.name, user.email, user.passwordHash, user.role, user.createdAt]
    );
    store.users.set(user.id, user);
  };
  store.saveCart = async (cart) => {
    await client.query("BEGIN");
    try {
      await client.query(
        `INSERT INTO carts (id, currency, customer_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE
         SET currency = EXCLUDED.currency,
             customer_id = EXCLUDED.customer_id,
             updated_at = EXCLUDED.updated_at`,
        [cart.id, cart.currency, cart.customerId, cart.createdAt, cart.updatedAt]
      );
      await client.query("DELETE FROM cart_items WHERE cart_id = $1", [cart.id]);
      for (const item of cart.items) {
        await client.query(
          `INSERT INTO cart_items (cart_id, product_id, name, unit_price, quantity)
           VALUES ($1, $2, $3, $4, $5)`,
          [cart.id, item.productId, item.name, item.unitPrice, item.quantity]
        );
      }
      await client.query("COMMIT");
      store.carts.set(cart.id, cart);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  };
  store.saveProduct = async (product) => {
    await client.query(
      `UPDATE products
       SET inventory_available = $2,
           inventory_reserved = $3,
           inventory_sold = $4
       WHERE id = $1`,
      [
        product.id,
        product.inventory.available,
        product.inventory.reserved,
        product.inventory.sold
      ]
    );
    store.products.set(product.id, product);
  };
  store.saveOrder = async (order) => {
    await client.query(
      `INSERT INTO orders (
        id, cart_id, customer_email, customer_name, shipping_address, items, pricing, payment,
        status, status_history, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, $9, $10::jsonb, $11, $12)
      ON CONFLICT (id) DO UPDATE
      SET status = EXCLUDED.status,
          status_history = EXCLUDED.status_history,
          pricing = EXCLUDED.pricing,
          payment = EXCLUDED.payment,
          updated_at = EXCLUDED.updated_at`,
      [
        order.id,
        order.cartId,
        order.customer.email,
        order.customer.name,
        JSON.stringify(order.shippingAddress),
        JSON.stringify(order.items),
        JSON.stringify(order.pricing),
        JSON.stringify(order.payment),
        order.status,
        JSON.stringify(order.statusHistory),
        order.createdAt,
        order.updatedAt
      ]
    );
    store.orders.set(order.id, order);
  };
  return store;
}

async function ensureSchema(client) {
  const schema = fs.readFileSync(path.join(__dirname, "..", "..", "db", "init.sql"), "utf8");
  await client.query(schema);
}

async function hydrateStore(client) {
  const seed = seedStore();
  seed.products = await loadProducts(client);
  seed.coupons = await loadCoupons(client);
  seed.users = await loadUsers(client);
  seed.carts = await loadCarts(client);
  seed.orders = await loadOrders(client);
  seed.analytics.lastCheckoutAt = getLastCheckoutAt(seed.orders);
  return seed;
}

async function loadProducts(client) {
  const result = await client.query("SELECT * FROM products");
  return new Map(
    result.rows.map((row) => [
      row.id,
      {
        id: row.id,
        name: row.name,
        description: row.description,
        category: row.category,
        price: Number(row.price),
        inventory: {
          available: row.inventory_available,
          reserved: row.inventory_reserved,
          sold: row.inventory_sold
        }
      }
    ])
  );
}

async function loadCoupons(client) {
  const result = await client.query("SELECT * FROM coupons");
  return new Map(
    result.rows.map((row) => [
      row.code,
      {
        code: row.code,
        type: row.type,
        value: Number(row.value),
        minimumSubtotal: Number(row.minimum_subtotal),
        active: row.active
      }
    ])
  );
}

async function loadUsers(client) {
  const result = await client.query("SELECT * FROM users");
  return new Map(
    result.rows.map((row) => [
      row.id,
      {
        id: row.id,
        name: row.name,
        email: row.email,
        passwordHash: row.password_hash,
        role: row.role,
        createdAt: row.created_at.toISOString()
      }
    ])
  );
}

async function loadCarts(client) {
  const cartsResult = await client.query("SELECT * FROM carts");
  const itemsResult = await client.query("SELECT * FROM cart_items");
  const itemsByCart = new Map();

  for (const item of itemsResult.rows) {
    const list = itemsByCart.get(item.cart_id) || [];
    list.push({
      productId: item.product_id,
      name: item.name,
      unitPrice: Number(item.unit_price),
      quantity: item.quantity
    });
    itemsByCart.set(item.cart_id, list);
  }

  return new Map(
    cartsResult.rows.map((row) => [
      row.id,
      {
        id: row.id,
        currency: row.currency,
        customerId: row.customer_id,
        items: itemsByCart.get(row.id) || [],
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString()
      }
    ])
  );
}

async function loadOrders(client) {
  const result = await client.query("SELECT * FROM orders");
  return new Map(
    result.rows.map((row) => [
      row.id,
      {
        id: row.id,
        cartId: row.cart_id,
        customer: {
          email: row.customer_email,
          name: row.customer_name
        },
        shippingAddress: row.shipping_address,
        items: row.items,
        pricing: row.pricing,
        payment: row.payment,
        status: row.status,
        statusHistory: row.status_history,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString()
      }
    ])
  );
}

function getLastCheckoutAt(orders) {
  const values = Array.from(orders.values());
  if (values.length === 0) {
    return null;
  }
  return values
    .map((order) => order.createdAt)
    .sort()
    .at(-1);
}

module.exports = {
  createStorage
};
