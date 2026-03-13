function createOpenApiDocument() {
  return {
    openapi: "3.0.3",
    info: {
      title: "E-Commerce Backend at Scale",
      version: "1.1.0",
      description: "Production-style e-commerce backend with JWT auth, checkout, analytics, and PostgreSQL-ready deployment."
    },
    servers: [{ url: "http://localhost:3000" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    paths: {
      "/health": {
        get: {
          summary: "Health check",
          responses: { 200: { description: "Service is healthy" } }
        }
      },
      "/auth/register": {
        post: {
          summary: "Register a user",
          responses: { 201: { description: "Registered" } }
        }
      },
      "/auth/login": {
        post: {
          summary: "Login and receive a JWT",
          responses: { 200: { description: "Authenticated" } }
        }
      },
      "/products": {
        get: {
          summary: "List products",
          responses: { 200: { description: "Product list" } }
        }
      },
      "/checkout": {
        post: {
          summary: "Checkout a cart",
          security: [{ bearerAuth: [] }],
          responses: { 201: { description: "Order created" } }
        }
      },
      "/admin/analytics": {
        get: {
          summary: "Admin analytics",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Analytics summary" } }
        }
      }
    }
  };
}

function createDocsHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>E-Commerce Backend Docs</title>
    <style>
      :root { color-scheme: light; }
      body {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        background: linear-gradient(135deg, #f7f2e8, #d8e7f0);
        color: #17212b;
      }
      main {
        max-width: 900px;
        margin: 48px auto;
        padding: 32px;
        background: rgba(255,255,255,0.88);
        border: 1px solid rgba(23,33,43,0.08);
        box-shadow: 0 18px 60px rgba(23,33,43,0.12);
      }
      pre {
        overflow: auto;
        padding: 16px;
        background: #17212b;
        color: #f7f2e8;
      }
      a { color: #0b5c7a; }
    </style>
  </head>
  <body>
    <main>
      <h1>E-Commerce Backend Docs</h1>
      <p>This project exposes an OpenAPI document at <a href="/docs/openapi.json">/docs/openapi.json</a>.</p>
      <p>Use the auth endpoints to get a JWT, then send it as <code>Authorization: Bearer &lt;token&gt;</code>.</p>
      <pre>{
  "adminLogin": {
    "email": "admin@example.com",
    "password": "admin123"
  },
  "customerLogin": {
    "email": "ava@example.com",
    "password": "customer123"
  }
}</pre>
    </main>
  </body>
</html>`;
}

module.exports = {
  createDocsHtml,
  createOpenApiDocument
};
