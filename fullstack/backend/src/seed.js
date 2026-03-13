const { hashPassword } = require("./lib/crypto");

function seedStore() {
  const products = new Map(
    [
      {
        id: "prod_keyboard",
        name: "Mechanical Keyboard Pro",
        description: "Hot-swappable keyboard with aluminum chassis and RGB backlight.",
        category: "electronics",
        price: 129.99,
        inventory: { available: 24, reserved: 0, sold: 0 }
      },
      {
        id: "prod_mouse",
        name: "Precision Wireless Mouse",
        description: "Low-latency mouse designed for productivity and gaming.",
        category: "electronics",
        price: 79.99,
        inventory: { available: 40, reserved: 0, sold: 0 }
      },
      {
        id: "prod_monitor",
        name: "4K Productivity Monitor",
        description: "27-inch IPS monitor with USB-C docking support.",
        category: "electronics",
        price: 349.99,
        inventory: { available: 10, reserved: 0, sold: 0 }
      },
      {
        id: "prod_chair",
        name: "Ergonomic Office Chair",
        description: "Adjustable lumbar support and breathable mesh design.",
        category: "furniture",
        price: 259.5,
        inventory: { available: 8, reserved: 0, sold: 0 }
      },
      {
        id: "prod_desk",
        name: "Standing Desk",
        description: "Dual-motor standing desk with memory presets.",
        category: "furniture",
        price: 499,
        inventory: { available: 6, reserved: 0, sold: 0 }
      }
    ].map((product) => [product.id, product])
  );

  const coupons = new Map(
    [
      {
        code: "SAVE10",
        type: "percentage",
        value: 10,
        minimumSubtotal: 100,
        active: true
      },
      {
        code: "SHIPFREE",
        type: "fixed",
        value: 25,
        minimumSubtotal: 150,
        active: true
      }
    ].map((coupon) => [coupon.code, coupon])
  );

  return {
    products,
    coupons,
    users: new Map(
      [
        {
          id: "user_admin",
          name: "Admin User",
          email: "admin@example.com",
          passwordHash: hashPassword("admin123"),
          role: "admin",
          createdAt: new Date().toISOString()
        },
        {
          id: "user_customer",
          name: "Ava Stone",
          email: "ava@example.com",
          passwordHash: hashPassword("customer123"),
          role: "customer",
          createdAt: new Date().toISOString()
        }
      ].map((user) => [user.id, user])
    ),
    carts: new Map(),
    orders: new Map(),
    analytics: {
      lastCheckoutAt: null
    }
  };
}

module.exports = {
  seedStore
};
