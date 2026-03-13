const { AppError } = require("../lib/errors");
const { TTLCache } = require("../lib/cache");

function createCatalogService(store) {
  const cache = new TTLCache(15_000);

  function listProducts(filters = {}) {
    const key = `products:${JSON.stringify(filters)}`;
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }

    let items = Array.from(store.products.values());

    if (filters.search) {
      const search = filters.search.toLowerCase();
      items = items.filter((product) => {
        return (
          product.name.toLowerCase().includes(search) ||
          product.description.toLowerCase().includes(search)
        );
      });
    }

    if (filters.category) {
      const category = filters.category.toLowerCase();
      items = items.filter((product) => product.category.toLowerCase() === category);
    }

    if (filters.sortBy === "price_asc") {
      items.sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === "price_desc") {
      items.sort((a, b) => b.price - a.price);
    } else {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }

    const result = {
      data: items,
      meta: {
        total: items.length,
        cached: false
      }
    };
    cache.set(key, result);
    return result;
  }

  function getProduct(productId) {
    const product = store.products.get(productId);
    if (!product) {
      throw new AppError(404, "Product not found");
    }
    return product;
  }

  function ensureStock(productId, requestedQuantity) {
    const product = getProduct(productId);
    if (requestedQuantity > product.inventory.available) {
      throw new AppError(409, "Insufficient inventory", {
        productId,
        available: product.inventory.available,
        requested: requestedQuantity
      });
    }
    return product;
  }

  async function reserveStock(items) {
    for (const item of items) {
      ensureStock(item.productId, item.quantity);
    }

    for (const item of items) {
      const product = store.products.get(item.productId);
      product.inventory.available -= item.quantity;
      product.inventory.reserved += item.quantity;
      await store.saveProduct(product);
    }

    cache.invalidate("products:");
  }

  async function releaseStock(items) {
    for (const item of items) {
      const product = store.products.get(item.productId);
      product.inventory.available += item.quantity;
      product.inventory.reserved -= item.quantity;
      await store.saveProduct(product);
    }
    cache.invalidate("products:");
  }

  async function commitStock(items) {
    for (const item of items) {
      const product = store.products.get(item.productId);
      product.inventory.reserved -= item.quantity;
      product.inventory.sold += item.quantity;
      await store.saveProduct(product);
    }
    cache.invalidate("products:");
  }

  return {
    listProducts,
    getProduct,
    ensureStock,
    reserveStock,
    releaseStock,
    commitStock
  };
}

module.exports = {
  createCatalogService
};
