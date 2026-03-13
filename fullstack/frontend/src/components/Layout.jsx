import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Layout() {
  const { user, doLogout, cartItemCount } = useApp();
  const navigate = useNavigate();

  function handleLogout() {
    doLogout();
    navigate('/');
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <NavLink to="/" className="navbar-logo">ShopScale</NavLink>
          <div className="navbar-links">
            <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Products
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Admin
              </NavLink>
            )}
            {user ? (
              <>
                <span style={{ color: 'var(--text3)', fontSize: 14, padding: '0 4px' }}>
                  {user.name}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sign out</button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                  Sign in
                </NavLink>
                <NavLink to="/register" className="btn btn-primary btn-sm">
                  Register
                </NavLink>
              </>
            )}
            <NavLink to="/cart" className="cart-btn">
              🛒
              {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
            </NavLink>
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </>
  );
}
