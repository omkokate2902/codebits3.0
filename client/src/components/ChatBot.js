import React, { useState, useEffect, useRef } from 'react';
import '../styles/components/ChatBot.css';
import ReactMarkdown from 'react-markdown';

// Import the Google Generative AI library
import { GoogleGenerativeAI } from "@google/generative-ai";

const ChatBot = ({ isDialog = false }) => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hi there! I'm your **relocation assistant**. How can I help you today?", 
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatSession, setChatSession] = useState(null);
  const [apiInitialized, setApiInitialized] = useState(false); // Track API initialization
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Initialize the Gemini API when component mounts
  useEffect(() => {
    const initializeGeminiAPI = async () => {
      try {
        // Initialize the API with your key
        const apiKey = "AIzaSyAcqGdxbyr7TwHGd7f_QZ7x6qCHYFLYwVQ";
        if (!apiKey) {
          console.error("API key not found. Please set REACT_APP_GEMINI_API_KEY in your environment variables.");
          return;
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Get the model
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-pro-exp-02-05",
          systemInstruction: "You are relocate.io, a smart relocation assistant that analyzes user preferences (budget, commute time, lifestyle, must-haves vs. compromises) to suggest the best areas or homes for long-term stays. Also provide customized recommendations for essential services (gyms, restaurants, transport routes, social spots) based on their personality and past search behavior and Google Map History. FORMAT YOUR RESPONSES: Use **bold** for important terms, *italics* for emphasis, and create bullet points with - or numbered lists with 1. 2. 3. when listing multiple items. Keep responses well-structured with clear sections."
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
              parts: [{ text: "Hi there! I'm your **relocation assistant**. How can I help you today? To give you the best recommendations, could you share some details about your preferences such as:\n\n- **Budget** range\n- Desired **commute time**\n- Your **lifestyle** priorities\n- Any **must-haves** for your new location" }]
            }
          ]
        });

        setChatSession(session);
        setApiInitialized(true);
      } catch (error) {
        console.error("Error initializing Gemini API:", error);
        // Set initialized to true even on error so user can still type and send messages
        setApiInitialized(true);
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
      // If chatSession is available, send to Gemini API
      let botResponse = "I'm sorry, I couldn't connect to my AI service. Please check your API key and try again.";
      
      if (chatSession) {
        const result = await chatSession.sendMessage(inputText);
        botResponse = result.response.text();
      }
      
      // Add bot response after a small delay to simulate typing
      setTimeout(() => {
        const botMessage = {
          id: messages.length + 2,
          text: botResponse,
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
              {message.sender === 'bot' ? (
                <ReactMarkdown>{message.text}</ReactMarkdown>
              ) : (
                <p>{message.text}</p>
              )}
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
        <button 
          type="submit" 
          disabled={!inputText.trim() || isTyping || !apiInitialized}
        >
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