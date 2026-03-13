const { AppError } = require("../lib/errors");

function createCheckoutService(
  store,
  catalogService,
  cartService,
  couponService,
  paymentService,
  orderService
) {
  async function checkout(input = {}) {
    if (!input.cartId) {
      throw new AppError(400, "cartId is required");
    }

    if (!input.customer || !input.customer.email) {
      throw new AppError(400, "customer.email is required");
    }

    if (!input.shippingAddress || !input.shippingAddress.line1) {
      throw new AppError(400, "shippingAddress.line1 is required");
    }

    const cart = await cartService.getCart(input.cartId);
    if (cart.items.length === 0) {
      throw new AppError(409, "Cannot checkout an empty cart");
    }

    let subtotal = cart.summary.subtotal;
    let coupon = null;
    let discount = 0;

    if (input.couponCode) {
      coupon = couponService.validateCoupon(input.couponCode, subtotal);
      discount = Math.min(coupon.discountAmount, subtotal);
    }

    const shippingCost = subtotal >= 500 ? 0 : 25;
    const tax = Number(((subtotal - discount) * 0.18).toFixed(2));
    const total = Number((subtotal - discount + tax + shippingCost).toFixed(2));

    const lineItems = cart.items.map((item) => ({
      ...item,
      lineTotal: Number((item.unitPrice * item.quantity).toFixed(2))
    }));

    await catalogService.reserveStock(lineItems);
    let payment;
    try {
      payment = paymentService.authorizePayment({
        amount: total,
        paymentMethod: input.paymentMethod
      });
    } catch (error) {
      await catalogService.releaseStock(lineItems);
      throw error;
    }
    await catalogService.commitStock(lineItems);

    const order = await orderService.createOrder({
      cartId: cart.id,
      customer: input.customer,
      shippingAddress: input.shippingAddress,
      items: lineItems,
      pricing: {
        subtotal,
        discount,
        tax,
        shippingCost,
        total,
        couponCode: coupon ? coupon.code : null
      },
      payment,
      statusHistory: [
        {
          status: "paid",
          at: new Date().toISOString()
        }
      ]
    });

    await cartService.clearCart(cart.id);
    store.analytics.lastCheckoutAt = new Date().toISOString();

    return order;
  }

  return {
    checkout
  };
}

module.exports = {
  createCheckoutService
};
