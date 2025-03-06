import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/components/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Relocate.io</h3>
          <p>Your smart relocation assistant to help you find the perfect neighborhood, discover places, and connect with people in your new location.</p>
        </div>
        
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/neighborhoods">Find Neighborhoods</Link></li>
            <li><Link to="/places">Discover Places</Link></li>
            <li><Link to="/assistant">Relocation Assistant</Link></li>
            <li><Link to="/social">Connect Socially</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Contact Us</h3>
          <p>Email: support@relocate.io</p>
          <p>Phone: (123) 456-7890</p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Relocate.io. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer; 