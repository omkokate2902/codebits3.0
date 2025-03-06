import React, { useState, useEffect, useRef } from 'react';
import '../styles/components/ChatBot.css';

const ChatBot = () => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hi there! I'm your relocation assistant. How can I help you today?", 
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputText.trim()) return;
    
    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputText('');
    setIsTyping(true);
    
    try {
      // Send message to backend
      const response = await fetch('http://192.168.0.118:3000/bot/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputText }),
      });
      
      const data = await response.json();
      
      // Add bot response after a small delay to simulate typing
      setTimeout(() => {
        const botMessage = {
          id: messages.length + 2,
          text: data.response || "I'm sorry, I couldn't process that request.",
          sender: 'bot',
          timestamp: new Date()
        };
        
        setMessages(prevMessages => [...prevMessages, botMessage]);
        setIsTyping(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error sending message to bot:', error);
      
      // Add error message
      setTimeout(() => {
        const errorMessage = {
          id: messages.length + 2,
          text: "Sorry, I'm having trouble connecting right now. Please try again later.",
          sender: 'bot',
          timestamp: new Date()
        };
        
        setMessages(prevMessages => [...prevMessages, errorMessage]);
        setIsTyping(false);
      }, 1000);
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h3>Relocation Assistant</h3>
        <p>Ask me anything about your relocation!</p>
      </div>
      
      <div className="chatbot-messages">
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`message ${message.sender === 'bot' ? 'bot-message' : 'user-message'}`}
          >
            <div className="message-content">
              <p>{message.text}</p>
              <span className="message-time">{formatTime(message.timestamp)}</span>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message bot-message">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chatbot-input" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Type your message here..."
          disabled={isTyping}
        />
        <button type="submit" disabled={!inputText.trim() || isTyping}>
          Send
        </button>
      </form>
      
      <div className="chatbot-suggestions">
        <p>Suggested questions:</p>
        <div className="suggestion-buttons">
          <button onClick={() => setInputText("What should I know about this neighborhood?")}>
            About this neighborhood
          </button>
          <button onClick={() => setInputText("What items should I buy for my new home?")}>
            Moving essentials
          </button>
          <button onClick={() => setInputText("Where can I find social groups nearby?")}>
            Social groups
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot; 