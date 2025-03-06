import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/components/Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">Relocate.io</Link>
      </div>
      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/neighborhoods">Find Neighborhoods</Link></li>
        <li><Link to="/places">Discover Places</Link></li>
        <li><Link to="/assistant">Relocation Assistant</Link></li>
        <li><Link to="/social">Connect Socially</Link></li>
      </ul>
      <div className="navbar-auth">
        {user ? (
          <div className="user-menu">
            <img src={user.picture} alt={user.name} className="user-avatar" />
            <span>{user.name}</span>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        ) : (
          <Link to="/login" className="login-btn">Login</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 