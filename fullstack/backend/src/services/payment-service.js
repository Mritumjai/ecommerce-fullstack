const { AppError } = require("../lib/errors");
const { createId } = require("../lib/id");

function createPaymentService() {
  function authorizePayment({ amount, paymentMethod }) {
    if (!paymentMethod || !paymentMethod.type) {
      throw new AppError(400, "paymentMethod.type is required");
    }

    if (amount <= 0) {
      throw new AppError(400, "Payment amount must be greater than zero");
    }

    if (paymentMethod.type === "card" && paymentMethod.cardLast4 === "0000") {
      throw new AppError(402, "Payment authorization failed");
    }

    return {
      id: createId("pay"),
      status: "authorized",
      amount,
      provider: "mockpay",
      authorizedAt: new Date().toISOString()
    };
  }

  return {
    authorizePayment
  };
}

module.exports = {
  createPaymentService
};
