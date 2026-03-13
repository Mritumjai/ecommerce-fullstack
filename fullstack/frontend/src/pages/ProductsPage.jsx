import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';
import { useApp } from '../context/AppContext';

const CATEGORY_EMOJIS = {
  electronics: '💻',
  furniture: '🪑',
  default: '📦'
};

const CATEGORIES = ['All', 'electronics', 'furniture'];

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [addingId, setAddingId] = useState(null);
  const { addToCart } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search, category, sortBy]);

  async function fetchProducts() {
    setLoading(true);
    try {
      const data = await api.getProducts({ search, category, sortBy });
      setProducts(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToCart(e, productId) {
    e.stopPropagation();
    setAddingId(productId);
    try {
      await addToCart(productId, 1);
    } catch (err) {
      alert(err.message);
    } finally {
      setAddingId(null);
    }
  }

  const emoji = (cat) => CATEGORY_EMOJIS[cat] || CATEGORY_EMOJIS.default;

  return (
    <div className="container products-page">
      <div className="page-header">
        <h1 className="page-title">Our Collection</h1>
        <p className="page-subtitle">{products.length} products available</p>
      </div>

      <div className="filters">
        <div className="search-box">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={category} onChange={e => setCategory(e.target.value === 'All' ? '' : e.target.value)}>
          {CATEGORIES.map(c => <option key={c} value={c === 'All' ? '' : c}>{c === 'All' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
        <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="">Sort: Default</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
        </select>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div>Loading products...</div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">No products found</div>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="card product-card" onClick={() => navigate(`/products/${product.id}`)}>
              <div className="product-card-img">{emoji(product.category)}</div>
              <div className="product-card-body">
                <div className="product-category">{product.category}</div>
                <div className="product-name">{product.name}</div>
                <div className="product-desc">{product.description}</div>
                <div className="product-footer">
                  <span className="product-price">${product.price.toFixed(2)}</span>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={addingId === product.id || product.inventory.available === 0}
                    onClick={e => handleAddToCart(e, product.id)}
                  >
                    {addingId === product.id ? '...' : product.inventory.available === 0 ? 'Out of stock' : '+ Add'}
                  </button>
                </div>
                <div className="product-stock" style={{ marginTop: 8 }}>
                  {product.inventory.available} in stock
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
