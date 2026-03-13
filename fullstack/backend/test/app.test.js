const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const { createServer } = require("../src/app");

function makeRequest(server, method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: address.port,
        path,
        method,
        headers: {
          ...headers,
          ...(payload
            ? {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload)
              }
            : {})
        }
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          resolve({
            statusCode: res.statusCode,
            body: raw ? JSON.parse(raw) : null
          });
        });
      }
    );

    req.on("error", reject);

    if (payload) {
      req.write(payload);
    }

    req.end();
  });
}

test("health endpoint responds", async () => {
  const server = await createServer();
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    const response = await makeRequest(server, "GET", "/health");
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.status, "ok");
  } finally {
    server.close();
  }
});

test("product listing supports category filtering", async () => {
  const server = await createServer();
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    const response = await makeRequest(server, "GET", "/products?category=furniture");
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.data.length, 2);
  } finally {
    server.close();
  }
});

test("full checkout flow creates an order and updates analytics", async () => {
  const server = await createServer();
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    const login = await makeRequest(server, "POST", "/auth/login", {
      email: "ava@example.com",
      password: "customer123"
    });
    const token = login.body.data.accessToken;

    const createdCart = await makeRequest(server, "POST", "/carts", {
      customerId: "cust_123"
    });
    const cartId = createdCart.body.data.id;

    const addItem = await makeRequest(server, "POST", `/carts/${cartId}/items`, {
      productId: "prod_keyboard",
      quantity: 2
    });
    assert.equal(addItem.statusCode, 201);
    assert.equal(addItem.body.data.summary.subtotal, 259.98);

    const checkout = await makeRequest(server, "POST", "/checkout", {
      cartId,
      couponCode: "SAVE10",
      paymentMethod: {
        type: "card",
        cardLast4: "4242"
      },
      customer: {
        name: "Ava Stone",
        email: "ava@example.com"
      },
      shippingAddress: {
        line1: "221B Baker Street",
        city: "London",
        country: "UK",
        postalCode: "NW16XE"
      }
    }, {
      Authorization: `Bearer ${token}`
    });

    assert.equal(checkout.statusCode, 201);
    assert.equal(checkout.body.data.pricing.discount, 26);
    assert.equal(checkout.body.data.status, "paid");

    const orderId = checkout.body.data.id;
    const order = await makeRequest(server, "GET", `/orders/${orderId}`);
    assert.equal(order.statusCode, 200);
    assert.equal(order.body.data.id, orderId);

    const adminLogin = await makeRequest(server, "POST", "/auth/login", {
      email: "admin@example.com",
      password: "admin123"
    });
    const analytics = await makeRequest(
      server,
      "GET",
      "/admin/analytics",
      null,
      { Authorization: `Bearer ${adminLogin.body.data.accessToken}` }
    );
    assert.equal(analytics.statusCode, 200);
    assert.equal(analytics.body.data.totalOrders, 1);
    assert.equal(analytics.body.data.topProducts[0].productId, "prod_keyboard");
  } finally {
    server.close();
  }
});

test("payment failure returns a 402 response", async () => {
  const server = await createServer();
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    const login = await makeRequest(server, "POST", "/auth/login", {
      email: "ava@example.com",
      password: "customer123"
    });
    const token = login.body.data.accessToken;

    const createdCart = await makeRequest(server, "POST", "/carts");
    const cartId = createdCart.body.data.id;

    await makeRequest(server, "POST", `/carts/${cartId}/items`, {
      productId: "prod_mouse",
      quantity: 1
    });

    const checkout = await makeRequest(server, "POST", "/checkout", {
      cartId,
      paymentMethod: {
        type: "card",
        cardLast4: "0000"
      },
      customer: {
        name: "Test User",
        email: "test@example.com"
      },
      shippingAddress: {
        line1: "123 Market Street",
        city: "Mumbai",
        country: "India",
        postalCode: "400001"
      }
    }, {
      Authorization: `Bearer ${token}`
    });

    assert.equal(checkout.statusCode, 402);
    assert.match(checkout.body.error.message, /authorization failed/i);

    const product = await makeRequest(server, "GET", "/products/prod_mouse");
    assert.equal(product.statusCode, 200);
    assert.equal(product.body.data.inventory.available, 40);
    assert.equal(product.body.data.inventory.reserved, 0);
  } finally {
    server.close();
  }
});

test("admin analytics is protected", async () => {
  const server = await createServer();
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    const customerLogin = await makeRequest(server, "POST", "/auth/login", {
      email: "ava@example.com",
      password: "customer123"
    });

    const forbidden = await makeRequest(
      server,
      "GET",
      "/admin/analytics",
      null,
      { Authorization: `Bearer ${customerLogin.body.data.accessToken}` }
    );
    assert.equal(forbidden.statusCode, 403);

    const docs = await makeRequest(server, "GET", "/docs/openapi.json");
    assert.equal(docs.statusCode, 200);
    assert.equal(docs.body.openapi, "3.0.3");
  } finally {
    server.close();
  }
});
