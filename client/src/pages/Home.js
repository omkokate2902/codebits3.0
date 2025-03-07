import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/pages/Home.css';
import TestMap from "../components/TestMap"

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
          {/* <img src="/images/hero-image.jpg" alt="City skyline" /> */}
          <TestMap />
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

      <section className="business-plans-section">
        <h2>Business Partnership Plans</h2>
        <p className="section-description">Join our platform and connect with new residents in your area. Showcase your business to people who are actively looking for local services.</p>
        
        <div className="plans-container">
          <div className="plan-card basic">
            <div className="plan-header">
              <h3>Basic Listing</h3>
              <div className="price">₹999<span>/month</span></div>
            </div>
            <div className="plan-features">
              <ul>
                <li>Business profile on our platform</li>
                <li>Appear in local search results</li>
                <li>Basic analytics dashboard</li>
                <li>Customer reviews management</li>
              </ul>
            </div>
            <div className="plan-cta">
              <Link to="/business/register" className="plan-btn">Get Started</Link>
            </div>
          </div>
          
          <div className="plan-card premium">
            <div className="plan-badge">Popular</div>
            <div className="plan-header">
              <h3>Premium Placement</h3>
              <div className="price">₹2,499<span>/month</span></div>
            </div>
            <div className="plan-features">
              <ul>
                <li>Enhanced business profile</li>
                <li>Priority placement in search results</li>
                <li>Personalized recommendation boost</li>
                <li>Advanced analytics and insights</li>
                <li>Promotional offers display</li>
              </ul>
            </div>
            <div className="plan-cta">
              <Link to="/business/register" className="plan-btn">Get Started</Link>
            </div>
          </div>
          
          <div className="plan-card featured">
            <div className="plan-header">
              <h3>Featured Partner</h3>
              <div className="price">₹4,999<span>/month</span></div>
            </div>
            <div className="plan-features">
              <ul>
                <li>Premium business profile</li>
                <li>Featured placement in recommendations</li>
                <li>Inclusion in welcome packages</li>
                <li>Dedicated account manager</li>
                <li>Exclusive event promotions</li>
                <li>Integration with relocation assistant</li>
              </ul>
            </div>
            <div className="plan-cta">
              <Link to="/business/register" className="plan-btn">Get Started</Link>
            </div>
          </div>
        </div>
        
        <div className="business-benefits">
          <h3>Why Partner With Us?</h3>
          <div className="benefits-grid">
            <div className="benefit-item">
              <div className="benefit-icon">🎯</div>
              <h4>Targeted Audience</h4>
              <p>Connect with new residents actively looking for services in your area.</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">📊</div>
              <h4>Data Insights</h4>
              <p>Gain valuable insights about customer preferences and behaviors.</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">🔄</div>
              <h4>Seamless Integration</h4>
              <p>Easily integrate with our platform and recommendation engine.</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">🌱</div>
              <h4>Community Building</h4>
              <p>Help build stronger local communities and establish your brand.</p>
            </div>
          </div>
        </div>
        
        <div className="contact-section">
          <h3>Interested in a custom partnership?</h3>
          <p>Contact our business team to discuss custom solutions for your business needs.</p>
          <Link to="/business/contact" className="contact-btn">Contact Us</Link>
        </div>
      </section>
    </div>
  );
};

export default Home; 