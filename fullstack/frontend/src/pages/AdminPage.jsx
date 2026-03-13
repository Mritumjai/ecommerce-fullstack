import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';
import { useApp } from '../context/AppContext';

export default function AdminPage() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'admin') { navigate('/'); return; }
    api.getAnalytics()
      .then(d => setData(d.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="container admin-page">
      <div className="page-header">
        <h1 className="page-title">Analytics Dashboard</h1>
        <p className="page-subtitle">Overview of store performance</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {data && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">${data.totalRevenue.toFixed(2)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Orders</div>
              <div className="stat-value">{data.totalOrders}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg Order Value</div>
              <div className="stat-value">${data.averageOrderValue.toFixed(2)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Last Order</div>
              <div className="stat-value" style={{ fontSize: 18, marginTop: 8 }}>
                {data.lastCheckoutAt ? new Date(data.lastCheckoutAt).toLocaleString() : '—'}
              </div>
            </div>
          </div>

          <div className="table-section">
            <h2 className="table-title">Top Products</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Units Sold</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.length === 0 ? (
                    <tr><td colSpan={4} style={{ color: 'var(--text3)', textAlign: 'center', padding: 24 }}>No sales yet</td></tr>
                  ) : data.topProducts.map((p, i) => (
                    <tr key={p.productId}>
                      <td style={{ color: 'var(--text3)' }}>{i + 1}</td>
                      <td>{p.name}</td>
                      <td>{p.sold}</td>
                      <td style={{ color: 'var(--accent)' }}>${p.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {data.lowStockProducts.length > 0 && (
            <div className="table-section">
              <h2 className="table-title">⚠️ Low Stock Alert</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Product</th><th>Available</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {data.lowStockProducts.map(p => (
                      <tr key={p.productId}>
                        <td>{p.name}</td>
                        <td>{p.available}</td>
                        <td>
                          <span className={`badge ${p.available === 0 ? 'badge-red' : 'badge-amber'}`}>
                            {p.available === 0 ? 'Out of stock' : 'Low stock'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
