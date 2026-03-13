import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../api';
import { useApp } from '../context/AppContext';

const CATEGORY_EMOJIS = { electronics: '💻', furniture: '🪑', default: '📦' };

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useApp();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.getProduct(id).then(d => setProduct(d.data)).catch(() => navigate('/')).finally(() => setLoading(false));
  }, [id]);

  async function handleAdd() {
    setAdding(true);
    setMessage(null);
    try {
      await addToCart(product.id, qty);
      setMessage({ type: 'success', text: `Added ${qty} × ${product.name} to cart!` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!product) return null;

  const emoji = CATEGORY_EMOJIS[product.category] || CATEGORY_EMOJIS.default;

  return (
    <div className="container product-detail">
      <a className="back-btn" onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>
        ← Back
      </a>
      <div className="detail-grid">
        <div className="detail-img">{emoji}</div>
        <div className="detail-info">
          <div className="detail-category">{product.category}</div>
          <h1 className="detail-name">{product.name}</h1>
          <div className="detail-price">${product.price.toFixed(2)}</div>
          <p className="detail-desc">{product.description}</p>
          <div className="stock-info">
            {product.inventory.available > 0
              ? `✓ ${product.inventory.available} units in stock`
              : '✗ Out of stock'}
          </div>

          {message && (
            <div className={`alert alert-${message.type}`}>{message.text}</div>
          )}

          <div className="qty-row">
            <div className="qty-control">
              <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span className="qty-val">{qty}</span>
              <button className="qty-btn" onClick={() => setQty(q => Math.min(product.inventory.available, q + 1))}>+</button>
            </div>
            <button
              className="btn btn-primary btn-lg"
              disabled={adding || product.inventory.available === 0}
              onClick={handleAdd}
              style={{ flex: 1 }}
            >
              {adding ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
          <button className="btn btn-outline btn-full" onClick={() => navigate('/cart')}>View Cart</button>
        </div>
      </div>
    </div>
  );
}
