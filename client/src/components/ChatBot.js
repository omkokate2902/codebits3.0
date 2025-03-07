import React, { useState, useEffect, useRef } from 'react';
import '../styles/components/ChatBot.css';

// Import the Google Generative AI library
import { GoogleGenerativeAI } from "@google/generative-ai";

const ChatBot = ({ isDialog = false }) => {
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
  const [chatSession, setChatSession] = useState(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Initialize the Gemini API when component mounts
  useEffect(() => {
    const initializeGeminiAPI = async () => {
      try {
        // Initialize the API with your key
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
        if (!apiKey) {
          console.error("API key not found. Please set REACT_APP_GEMINI_API_KEY in your environment variables.");
          return;
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Get the model
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-pro-exp-02-05",
          systemInstruction: "you are relocate.io A smart relocation assistant that analyzes user preferences (budget, commute time, lifestyle, must-haves vs. compromises) to suggest the best areas or homes for long-term stays. It also provides customized recommendations for essential services (gyms, restaurants, transport routes, social spots) based on their personality and past search behavior and Google Map History."
        });

        // Configuration for the model
        const generationConfig = {
          temperature: 1,
          topP: 0.95,
          topK: 64,
          maxOutputTokens: 8192,
          responseMimeType: "text/plain",
        };

        // Start the chat session
        const session = model.startChat({
          generationConfig,
          history: [
            {
              role: "user",
              parts: [{ text: "Hi, I'm looking for relocation assistance." }]
            },
            {
              role: "model",
              parts: [{ text: "Hi there! I'm your relocation assistant. How can I help you today? To give you the best recommendations, could you share some details about your preferences such as budget, commute time, lifestyle, and any must-haves for your new location?" }]
            }
          ]
        });

        setChatSession(session);
      } catch (error) {
        console.error("Error initializing Gemini API:", error);
      }
    };

    initializeGeminiAPI();
  }, []);

  // Scroll chat container to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      const scrollOptions = {
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      };
      
      // Only scroll the container itself, not the whole page
      chatContainerRef.current.scrollTo(scrollOptions);
    }
  }, [messages]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputText.trim() || !chatSession) return;
    
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
      // Send message to Gemini API
      const result = await chatSession.sendMessage(inputText);
      const botResponse = result.response.text();
      
      // Add bot response after a small delay to simulate typing
      setTimeout(() => {
        const botMessage = {
          id: messages.length + 2,
          text: botResponse || "I'm sorry, I couldn't process that request.",
          sender: 'bot',
          timestamp: new Date()
        };
        
        setMessages(prevMessages => [...prevMessages, botMessage]);
        setIsTyping(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error communicating with Gemini API:', error);
      
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
    <div className={`chatbot-container ${isDialog ? 'dialog-mode' : ''}`}>
      <div className="chatbot-header">
        <h3>Relocation Assistant</h3>
        <p>Ask me anything about your relocation!</p>
      </div>
      
      <div className="chatbot-messages" ref={chatContainerRef}>
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
      </div>
      
      <form className="chatbot-input" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Type your message here..."
          disabled={isTyping}
        />
        <button type="submit" disabled={!inputText.trim() || isTyping || !chatSession}>
          Send
        </button>
      </form>
      
      <div className="chatbot-suggestions">
        <p>Suggested questions:</p>
        <div className="suggestion-buttons">
          <button onClick={() => setInputText("What should I know about moving to San Francisco?")}>
            Moving to San Francisco
          </button>
          <button onClick={() => setInputText("What items should I buy for my new home?")}>
            Moving essentials
          </button>
          <button onClick={() => setInputText("Where can I find social groups for expats?")}>
            Social groups
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;