import React from 'react';
import ChatBot from '../components/ChatBot';
import '../styles/pages/RelocationAssistant.css';

const RelocationAssistant = () => {
  return (
    <div className="relocation-assistant-page">
      <div className="page-header">
        <h1>Relocation Assistant</h1>
        <p>Your AI assistant to help with all aspects of your relocation.</p>
      </div>
      
      <div className="assistant-content">
        <div className="assistant-info">
          <div className="info-card">
            <h3>How I Can Help</h3>
            <ul>
              <li>Answer questions about neighborhoods</li>
              <li>Recommend essential items for your new home</li>
              <li>Provide information about local services</li>
              <li>Suggest social groups and activities</li>
              <li>Help with moving logistics</li>
            </ul>
          </div>
          
          <div className="info-card">
            <h3>Popular Questions</h3>
            <ul>
              <li>What's the best neighborhood for families?</li>
              <li>Where can I find affordable groceries?</li>
              <li>What items should I buy for my new apartment?</li>
              <li>How do I set up utilities?</li>
              <li>Where can I meet people with similar interests?</li>
            </ul>
          </div>
        </div>
        
        <div className="chatbot-wrapper">
          <ChatBot />
        </div>
      </div>
    </div>
  );
};

export default RelocationAssistant; 