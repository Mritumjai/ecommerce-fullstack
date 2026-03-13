function createAnalyticsService(store) {
  function getSummary() {
    const orders = Array.from(store.orders.values());
    const products = Array.from(store.products.values());
    const totalRevenue = orders.reduce((sum, order) => sum + order.pricing.total, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders === 0 ? 0 : Number((totalRevenue / totalOrders).toFixed(2));

    const topProducts = products
      .map((product) => ({
        productId: product.id,
        name: product.name,
        sold: product.inventory.sold,
        revenue: Number((product.inventory.sold * product.price).toFixed(2))
      }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    const lowStockProducts = products
      .filter((product) => product.inventory.available <= 5)
      .map((product) => ({
        productId: product.id,
        name: product.name,
        available: product.inventory.available
      }));

    return {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalOrders,
      averageOrderValue,
      lastCheckoutAt: store.analytics.lastCheckoutAt,
      topProducts,
      lowStockProducts
    };
  }

  return {
    getSummary
  };
}

module.exports = {
  createAnalyticsService
};
