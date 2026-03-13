import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const CATEGORY_EMOJIS = { electronics: '💻', furniture: '🪑', default: '📦' };

export default function CartPage() {
  const { cart, cartLoading, updateCartItem, removeCartItem } = useApp();
  const navigate = useNavigate();

  if (cartLoading) return <div className="loading"><div className="spinner"></div></div>;

  const items = cart?.items || [];
  const subtotal = cart?.summary?.subtotal || 0;
  const shipping = subtotal >= 500 ? 0 : subtotal > 0 ? 25 : 0;
  const tax = Number(((subtotal) * 0.18).toFixed(2));
  const total = Number((subtotal + tax + shipping).toFixed(2));

  if (items.length === 0) {
    return (
      <div className="container cart-page">
        <h1 className="page-title" style={{ marginBottom: 32 }}>Your Cart</h1>
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <div className="empty-title">Your cart is empty</div>
          <p style={{ marginBottom: 24 }}>Add some products to get started</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Browse Products</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container cart-page">
      <h1 className="page-title" style={{ marginBottom: 32 }}>Your Cart</h1>
      <div className="cart-layout">
        <div className="cart-items">
          {items.map(item => (
            <div key={item.productId} className="cart-item">
              <div className="cart-item-emoji">
                {CATEGORY_EMOJIS.default}
              </div>
              <div className="cart-item-info">
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-price">${item.unitPrice.toFixed(2)} each</div>
              </div>
              <div className="cart-item-controls">
                <button className="btn btn-ghost btn-sm" onClick={() => updateCartItem(item.productId, item.quantity - 1)}>−</button>
                <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => updateCartItem(item.productId, item.quantity + 1)}>+</button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => removeCartItem(item.productId)}>✕</button>
              </div>
              <div className="cart-item-total">${(item.unitPrice * item.quantity).toFixed(2)}</div>
            </div>
          ))}
        </div>

        <div className="order-summary">
          <div className="summary-title">Order Summary</div>
          <div className="summary-row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>{shipping === 0 && subtotal > 0 ? <span style={{ color: 'var(--green)' }}>Free</span> : `$${shipping.toFixed(2)}`}</span>
          </div>
          <div className="summary-row"><span>Tax (18%)</span><span>${tax.toFixed(2)}</span></div>
          <div className="summary-row total"><span>Total</span><span>${total.toFixed(2)}</span></div>
          {subtotal > 0 && subtotal < 500 && (
            <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 8 }}>
              Add ${(500 - subtotal).toFixed(2)} more for free shipping!
            </p>
          )}
          <button className="btn btn-primary btn-full btn-lg" style={{ marginTop: 20 }} onClick={() => navigate('/checkout')}>
            Proceed to Checkout
          </button>
          <button className="btn btn-ghost btn-full" style={{ marginTop: 8 }} onClick={() => navigate('/')}>
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
