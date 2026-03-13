import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../api';

const STATUS_BADGE = {
  paid: 'badge-green',
  packed: 'badge-amber',
  shipped: 'badge-amber',
  delivered: 'badge-green',
  cancelled: 'badge-red',
  pending: 'badge-amber'
};

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOrder(id).then(d => setOrder(d.data)).catch(() => navigate('/')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!order) return null;

  return (
    <div className="container order-confirm">
      <div className="confirm-icon">🎉</div>
      <h1 className="confirm-title">Order Confirmed!</h1>
      <p className="confirm-sub">Thank you, {order.customer.name}. Your order has been placed.</p>

      <div className="order-detail-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>Order ID</div>
            <div style={{ fontFamily: 'monospace', fontSize: 13 }}>{order.id}</div>
          </div>
          <span className={`badge ${STATUS_BADGE[order.status] || 'badge-amber'}`}>{order.status}</span>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 16 }}>
          {order.items.map(item => (
            <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
              <span>{item.name} × {item.quantity}</span>
              <span style={{ color: 'var(--accent)' }}>${item.lineTotal.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6, color: 'var(--text2)' }}>
            <span>Subtotal</span><span>${order.pricing.subtotal.toFixed(2)}</span>
          </div>
          {order.pricing.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6, color: 'var(--green)' }}>
              <span>Discount</span><span>−${order.pricing.discount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6, color: 'var(--text2)' }}>
            <span>Tax</span><span>${order.pricing.tax.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6, color: 'var(--text2)' }}>
            <span>Shipping</span><span>{order.pricing.shippingCost === 0 ? 'Free' : `$${order.pricing.shippingCost.toFixed(2)}`}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <span>Total</span><span style={{ color: 'var(--accent)' }}>${order.pricing.total.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Shipping to</div>
          <div style={{ fontSize: 14 }}>{order.shippingAddress.line1}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</div>
        </div>
      </div>

      <button className="btn btn-primary btn-lg" onClick={() => navigate('/')}>Continue Shopping</button>
    </div>
  );
}
