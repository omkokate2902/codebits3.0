import React from 'react';
import { Link } from 'react-router-dom';
import GoogleLogin from '../components/GoogleLogin';
import '../styles/pages/Home.css';

const Home = () => {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Find Your Perfect Neighborhood</h1>
          <p>Your smart relocation assistant to help you find the perfect place to live based on your preferences and lifestyle.</p>
          <div className="hero-buttons">
            <Link to="/neighborhoods" className="primary-btn">Find Neighborhoods</Link>
            <Link to="/assistant" className="secondary-btn">Talk to Assistant</Link>
          </div>
        </div>
        <div className="hero-image">
          <img src="/images/hero-image.jpg" alt="City skyline" />
        </div>
      </section>

      <section className="features-section">
        <h2>How We Help You Relocate</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🏙️</div>
            <h3>Find Perfect Neighborhoods</h3>
            <p>Discover neighborhoods that match your budget, commute preferences, and lifestyle needs.</p>
            <Link to="/neighborhoods" className="feature-link">Explore Neighborhoods</Link>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🍽️</div>
            <h3>Discover Local Places</h3>
            <p>Get personalized recommendations for restaurants, gyms, shops, and more based on your preferences.</p>
            <Link to="/places" className="feature-link">Find Places</Link>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>Relocation Assistant</h3>
            <p>Our AI assistant helps with everything from moving tips to local information.</p>
            <Link to="/assistant" className="feature-link">Chat with Assistant</Link>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Connect Socially</h3>
            <p>Find local groups, events, and communities that match your interests and hobbies.</p>
            <Link to="/social" className="feature-link">Find Social Groups</Link>
          </div>
        </div>
      </section>

      <section className="auth-section">
        <h2>Get Started Today</h2>
        <p>Sign in with your Google account to save your preferences and get personalized recommendations.</p>
        <GoogleLogin />
      </section>
    </div>
  );
};

export default Home; 