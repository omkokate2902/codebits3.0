import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import NeighborhoodFinder from './pages/NeighborhoodFinder';
import PlaceRecommender from './pages/PlaceRecommender';
import RelocationAssistant from './pages/RelocationAssistant';
import SocialConnector from './pages/SocialConnector';
import './styles/global.css';
import './styles/App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/neighborhoods" element={<NeighborhoodFinder />} />
              <Route path="/places" element={<PlaceRecommender />} />
              <Route path="/assistant" element={<RelocationAssistant />} />
              <Route path="/social" element={<SocialConnector />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;