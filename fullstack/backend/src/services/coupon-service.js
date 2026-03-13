const { AppError } = require("../lib/errors");

function createCouponService(store) {
  function validateCoupon(code, cartSubtotal) {
    if (!code) {
      throw new AppError(400, "Coupon code is required");
    }

    const coupon = store.coupons.get(code.toUpperCase());
    if (!coupon) {
      throw new AppError(404, "Coupon not found");
    }

    if (!coupon.active) {
      throw new AppError(409, "Coupon is inactive");
    }

    if (cartSubtotal < coupon.minimumSubtotal) {
      throw new AppError(409, "Cart subtotal does not meet coupon minimum", {
        minimumSubtotal: coupon.minimumSubtotal
      });
    }

    const discountAmount =
      coupon.type === "percentage"
        ? Number((cartSubtotal * (coupon.value / 100)).toFixed(2))
        : coupon.value;

    return {
      ...coupon,
      discountAmount
    };
  }

  return {
    validateCoupon
  };
}

module.exports = {
  createCouponService
};
