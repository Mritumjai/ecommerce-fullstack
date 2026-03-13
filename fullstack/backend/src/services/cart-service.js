const { AppError } = require("../lib/errors");
const { createId } = require("../lib/id");

function createCartService(store, catalogService) {
  async function createCart(input = {}) {
    const cart = {
      id: createId("cart"),
      currency: input.currency || "USD",
      customerId: input.customerId || null,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await store.saveCart(cart);
    return decorate(cart);
  }

  async function getCart(cartId) {
    const cart = store.carts.get(cartId);
    if (!cart) {
      throw new AppError(404, "Cart not found");
    }
    return decorate(cart);
  }

  async function addItem(cartId, input) {
    validateItemInput(input);
    const cart = await requireCart(cartId);
    const product = catalogService.ensureStock(input.productId, input.quantity);
    const existing = cart.items.find((item) => item.productId === input.productId);

    if (existing) {
      catalogService.ensureStock(input.productId, existing.quantity + input.quantity);
      existing.quantity += input.quantity;
      existing.unitPrice = product.price;
    } else {
      cart.items.push({
        productId: product.id,
        name: product.name,
        unitPrice: product.price,
        quantity: input.quantity
      });
    }

    touch(cart);
    await store.saveCart(cart);
    return decorate(cart);
  }

  async function updateItem(cartId, productId, input) {
    const quantity = Number(input.quantity);
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new AppError(400, "Quantity must be a non-negative integer");
    }

    const cart = await requireCart(cartId);
    const item = cart.items.find((entry) => entry.productId === productId);
    if (!item) {
      throw new AppError(404, "Cart item not found");
    }

    if (quantity === 0) {
      cart.items = cart.items.filter((entry) => entry.productId !== productId);
    } else {
      const product = catalogService.ensureStock(productId, quantity);
      item.quantity = quantity;
      item.unitPrice = product.price;
      item.name = product.name;
    }

    touch(cart);
    await store.saveCart(cart);
    return decorate(cart);
  }

  async function removeItem(cartId, productId) {
    const cart = await requireCart(cartId);
    const originalLength = cart.items.length;
    cart.items = cart.items.filter((entry) => entry.productId !== productId);

    if (originalLength === cart.items.length) {
      throw new AppError(404, "Cart item not found");
    }

    touch(cart);
    await store.saveCart(cart);
    return decorate(cart);
  }

  async function clearCart(cartId) {
    const cart = await requireCart(cartId);
    cart.items = [];
    touch(cart);
    await store.saveCart(cart);
    return decorate(cart);
  }

  async function requireCart(cartId) {
    const cart = store.carts.get(cartId);
    if (!cart) {
      throw new AppError(404, "Cart not found");
    }
    return cart;
  }

  function decorate(cart) {
    const subtotal = cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    return {
      ...cart,
      summary: {
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal,
        currency: cart.currency
      }
    };
  }

  function validateItemInput(input = {}) {
    if (!input.productId) {
      throw new AppError(400, "productId is required");
    }

    const quantity = Number(input.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new AppError(400, "Quantity must be a positive integer");
    }
  }

  function touch(cart) {
    cart.updatedAt = new Date().toISOString();
  }

  return {
    createCart,
    getCart,
    addItem,
    updateItem,
    removeItem,
    clearCart
  };
}

module.exports = {
  createCartService
};
