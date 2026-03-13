const { AppError } = require("../lib/errors");
const { createId } = require("../lib/id");

const VALID_STATUSES = new Set([
  "pending",
  "paid",
  "packed",
  "shipped",
  "delivered",
  "cancelled"
]);

function createOrderService(store) {
  async function createOrder(orderInput) {
    const order = {
      id: createId("order"),
      status: "paid",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...orderInput
    };
    await store.saveOrder(order);
    return order;
  }

  function getOrder(orderId) {
    const order = store.orders.get(orderId);
    if (!order) {
      throw new AppError(404, "Order not found");
    }
    return order;
  }

  async function updateOrderStatus(orderId, status) {
    if (!VALID_STATUSES.has(status)) {
      throw new AppError(400, "Invalid order status", {
        allowed: Array.from(VALID_STATUSES)
      });
    }

    const order = getOrder(orderId);
    order.status = status;
    order.updatedAt = new Date().toISOString();
    order.statusHistory = [
      ...(order.statusHistory || []),
      {
        status,
        at: order.updatedAt
      }
    ];
    await store.saveOrder(order);
    return order;
  }

  return {
    createOrder,
    getOrder,
    updateOrderStatus
  };
}

module.exports = {
  createOrderService
};
