const { parseBody, sendJson, setCorsHeaders } = require("./lib/http");
const { readBearerToken, requireRole } = require("./lib/auth");
const { AppError, handleError } = require("./lib/errors");
const { createCatalogService } = require("./services/catalog-service");
const { createCartService } = require("./services/cart-service");
const { createCouponService } = require("./services/coupon-service");
const { createCheckoutService } = require("./services/checkout-service");
const { createOrderService } = require("./services/order-service");
const { createAnalyticsService } = require("./services/analytics-service");
const { createPaymentService } = require("./services/payment-service");
const { createAuthService } = require("./services/auth-service");
const { createDocsHtml, createOpenApiDocument } = require("./docs/openapi");

function createRouter(store, config) {
  const paymentService = createPaymentService();
  const catalogService = createCatalogService(store);
  const couponService = createCouponService(store);
  const cartService = createCartService(store, catalogService);
  const orderService = createOrderService(store);
  const analyticsService = createAnalyticsService(store);
  const authService = createAuthService(store, config);
  const checkoutService = createCheckoutService(
    store,
    catalogService,
    cartService,
    couponService,
    paymentService,
    orderService
  );

  return async function router(req, res) {
    try {
      const url = new URL(req.url, "http://localhost");
      const path = url.pathname;
      const method = req.method;

      // Bug fix: Handle CORS preflight OPTIONS requests
      if (method === "OPTIONS") {
        setCorsHeaders(res);
        res.writeHead(204);
        return res.end();
      }

      if (method === "GET" && path === "/health") {
        return sendJson(res, 200, {
          status: "ok",
          service: "ecommerce-backend-at-scale",
          storage: store.meta,
          timestamp: new Date().toISOString()
        });
      }

      if (method === "GET" && path === "/docs/openapi.json") {
        return sendJson(res, 200, createOpenApiDocument());
      }

      if (method === "GET" && path === "/docs") {
        const html = createDocsHtml();
        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Length": Buffer.byteLength(html)
        });
        return res.end(html);
      }

      if (method === "POST" && path === "/auth/register") {
        const body = await parseBody(req);
        return sendJson(res, 201, {
          data: await authService.register(body)
        });
      }

      if (method === "POST" && path === "/auth/login") {
        const body = await parseBody(req);
        // Bug fix: login() is synchronous; wrap result correctly (no await needed)
        return sendJson(res, 200, {
          data: authService.login(body)
        });
      }

      if (method === "GET" && path === "/products") {
        // Bug fix: listProducts already returns { data, meta } so pass it directly
        const result = catalogService.listProducts({
          search: url.searchParams.get("search"),
          category: url.searchParams.get("category"),
          sortBy: url.searchParams.get("sortBy")
        });
        return sendJson(res, 200, result);
      }

      const productMatch = match(path, /^\/products\/([^/]+)$/);
      if (method === "GET" && productMatch) {
        return sendJson(res, 200, {
          data: catalogService.getProduct(productMatch[1])
        });
      }

      if (method === "POST" && path === "/carts") {
        const body = await parseBody(req);
        return sendJson(res, 201, {
          data: await cartService.createCart(body)
        });
      }

      const cartMatch = match(path, /^\/carts\/([^/]+)$/);
      if (method === "GET" && cartMatch) {
        return sendJson(res, 200, {
          data: await cartService.getCart(cartMatch[1])
        });
      }

      const cartItemsMatch = match(path, /^\/carts\/([^/]+)\/items$/);
      if (method === "POST" && cartItemsMatch) {
        const body = await parseBody(req);
        return sendJson(res, 201, {
          data: await cartService.addItem(cartItemsMatch[1], body)
        });
      }

      const cartItemMatch = match(path, /^\/carts\/([^/]+)\/items\/([^/]+)$/);
      if (method === "PATCH" && cartItemMatch) {
        const body = await parseBody(req);
        return sendJson(res, 200, {
          data: await cartService.updateItem(cartItemMatch[1], cartItemMatch[2], body)
        });
      }

      if (method === "DELETE" && cartItemMatch) {
        return sendJson(res, 200, {
          data: await cartService.removeItem(cartItemMatch[1], cartItemMatch[2])
        });
      }

      if (method === "POST" && path === "/coupons/validate") {
        const body = await parseBody(req);
        return sendJson(res, 200, {
          data: couponService.validateCoupon(body.code, body.cartSubtotal || 0)
        });
      }

      if (method === "POST" && path === "/checkout") {
        const body = await parseBody(req);
        const user = authenticate(req, authService);
        body.customer = {
          ...(body.customer || {}),
          email: body.customer && body.customer.email ? body.customer.email : user.email,
          name: body.customer && body.customer.name ? body.customer.name : user.name
        };
        return sendJson(res, 201, {
          data: await checkoutService.checkout(body)
        });
      }

      const orderMatch = match(path, /^\/orders\/([^/]+)$/);
      if (method === "GET" && orderMatch) {
        return sendJson(res, 200, {
          data: orderService.getOrder(orderMatch[1])
        });
      }

      if (method === "PATCH" && orderMatch) {
        const body = await parseBody(req);
        return sendJson(res, 200, {
          data: await orderService.updateOrderStatus(orderMatch[1], body.status)
        });
      }

      if (method === "GET" && path === "/admin/analytics") {
        requireRole(authenticate(req, authService), ["admin"]);
        return sendJson(res, 200, {
          data: analyticsService.getSummary()
        });
      }

      throw new AppError(404, "Route not found");
    } catch (error) {
      return handleError(res, error);
    }
  };
}

function authenticate(req, authService) {
  const token = readBearerToken(req);
  return authService.authenticate(token);
}

function match(path, pattern) {
  return path.match(pattern);
}

module.exports = {
  createRouter
};
