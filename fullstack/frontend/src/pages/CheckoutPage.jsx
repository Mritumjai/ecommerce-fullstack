import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import * as api from '../api';

export default function CheckoutPage() {
  const { cart, user, clearCart } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    line1: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    cardLast4: '4242',
    couponCode: ''
  });
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const items = cart?.items || [];
  const subtotal = cart?.summary?.subtotal || 0;
  const discount = coupon ? Math.min(coupon.discountAmount, subtotal) : 0;
  const shipping = (subtotal - discount) >= 500 ? 0 : subtotal > 0 ? 25 : 0;
  const tax = Number(((subtotal - discount) * 0.18).toFixed(2));
  const total = Number((subtotal - discount + tax + shipping).toFixed(2));

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function applyCode() {
    setCouponError('');
    setCoupon(null);
    try {
      const data = await api.validateCoupon(form.couponCode, subtotal);
      setCoupon(data.data);
    } catch (e) {
      setCouponError(e.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (items.length === 0) { navigate('/cart'); return; }

    setLoading(true);
    setError('');
    try {
      const data = await api.checkout({
        cartId: cart.id,
        customer: { name: form.name, email: form.email },
        shippingAddress: { line1: form.line1, city: form.city, state: form.state, zip: form.zip, country: form.country },
        paymentMethod: { type: 'card', cardLast4: form.cardLast4 },
        couponCode: coupon ? form.couponCode : undefined
      });
      clearCart();
      navigate(`/orders/${data.data.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0 && !loading) {
    return (
      <div className="container checkout-page">
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <div className="empty-title">Nothing to checkout</div>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Shop now</button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container checkout-page">
        <div className="empty-state">
          <div className="empty-icon">🔐</div>
          <div className="empty-title">Sign in required</div>
          <p style={{ marginBottom: 20, color: 'var(--text2)' }}>You need to be signed in to checkout</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Sign in</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container checkout-page">
      <h1 className="page-title" style={{ marginBottom: 32 }}>Checkout</h1>
      <form onSubmit={handleSubmit}>
        <div className="checkout-layout">
          <div>
            <div className="form-section">
              <div className="section-title">Contact Information</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input required value={form.name} onChange={set('name')} placeholder="Your name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input required type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="section-title">Shipping Address</div>
              <div className="form-group">
                <label className="form-label">Street Address</label>
                <input required value={form.line1} onChange={set('line1')} placeholder="123 Main St" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input required value={form.city} onChange={set('city')} placeholder="New York" />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input required value={form.state} onChange={set('state')} placeholder="NY" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">ZIP Code</label>
                  <input required value={form.zip} onChange={set('zip')} placeholder="10001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input required value={form.country} onChange={set('country')} placeholder="US" />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="section-title">Payment (Mock)</div>
              <div className="form-group">
                <label className="form-label">Card Last 4 Digits</label>
                <input
                  value={form.cardLast4}
                  onChange={set('cardLast4')}
                  placeholder="4242"
                  maxLength={4}
                  pattern="\d{4}"
                />
                <span style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                  Use 4242 for success, 0000 to simulate failure
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className="order-summary" style={{ marginBottom: 16 }}>
              <div className="summary-title">Order Summary</div>
              {items.map(item => (
                <div key={item.productId} className="summary-row">
                  <span>{item.name} × {item.quantity}</span>
                  <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 8 }}>
                <div className="summary-row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                {discount > 0 && <div className="summary-row" style={{ color: 'var(--green)' }}><span>Discount</span><span>−${discount.toFixed(2)}</span></div>}
                <div className="summary-row"><span>Shipping</span><span>{shipping === 0 ? <span style={{ color: 'var(--green)' }}>Free</span> : `$${shipping.toFixed(2)}`}</span></div>
                <div className="summary-row"><span>Tax (18%)</span><span>${tax.toFixed(2)}</span></div>
                <div className="summary-row total"><span>Total</span><span>${total.toFixed(2)}</span></div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
                <div className="form-label" style={{ marginBottom: 8 }}>Coupon Code</div>
                <div className="coupon-row">
                  <input value={form.couponCode} onChange={set('couponCode')} placeholder="e.g. SAVE10" />
                  <button type="button" className="btn btn-outline btn-sm" onClick={applyCode}>Apply</button>
                </div>
                {couponError && <div className="alert alert-error" style={{ marginTop: 0 }}>{couponError}</div>}
                {coupon && <div className="alert alert-success" style={{ marginTop: 0 }}>✓ {coupon.code}: −${coupon.discountAmount.toFixed(2)}</div>}
                <p style={{ fontSize: 11, color: 'var(--text3)' }}>Try: SAVE10 or SHIPFREE</p>
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Placing order...' : `Place Order — $${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
