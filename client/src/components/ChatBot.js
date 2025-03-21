import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import * as userStorage from '../utils/userStorage';
import '../styles/components/ChatBot.css';
import { config } from '../utils/envConfig';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

// Import the Google Generative AI library
import { GoogleGenerativeAI } from "@google/generative-ai";

const ChatBot = ({ isDialog = false }) => {
  const { user } = useContext(AuthContext);
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
  const [userData, setUserData] = useState(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [error, setError] = useState(null);

  // Load user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      if (user && user.uid) {
        try {
          // Get user data from storage
          const preferences = userStorage.getUserPreferences(user.uid);
          const analysisResults = userStorage.getUserAnalysis(user.uid);
          const persona = userStorage.getUserPersona(user.uid);
          
          // Get neighborhood data
          const selectedNeighborhood = userStorage.getSelectedNeighborhood(user.uid);
          const recommendedNeighborhoods = userStorage.getRecommendedNeighborhoods(user.uid);
          
          // Combine all user data
          const combinedUserData = {
            preferences: preferences || {},
            analysisResults: analysisResults || {},
            persona: persona || 'balanced',
            selectedNeighborhood: selectedNeighborhood || null,
            recommendedNeighborhoods: recommendedNeighborhoods || []
          };
          
          console.log('Loaded user data for chatbot:', combinedUserData);
          setUserData(combinedUserData);
        } catch (error) {
          console.error('Error loading user data for chatbot:', error);
        }
      }
    };
    
    loadUserData();
  }, [user]);

  // Initialize the Gemini API when component mounts or userData changes
  useEffect(() => {
    const initializeGeminiAPI = async () => {
      try {
        // Get API key from our environment configuration
        const apiKey = config.geminiApiKey || "";
        
        // Check if API key is available
        if (!apiKey) {
          console.error("ERROR: Gemini API key not found in environment configuration.");
          setError("Could not initialize chat due to missing API key. Please contact support.");
          return;
        }
        
        console.log("ChatBot: API key loaded and ready to use");

        // Initialize the API with error handling
        let genAI;
        try {
          genAI = new GoogleGenerativeAI(apiKey);
          console.log("ChatBot: Successfully initialized GoogleGenerativeAI client");
        } catch (initError) {
          console.error("Error initializing Gemini API:", initError.message);
          setError("Could not initialize chat. Please try again later.");
          return;
        }
        
        // Get the model
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          systemInstruction: `You are relocate.io's smart relocation assistant that helps users with their relocation needs. Your capabilities:

1. Analyze user preferences (budget, commute time, lifestyle, must-haves) to provide personalized advice
2. Provide specific information about neighborhoods the user has selected or that were recommended to them
3. Offer practical moving tips and local insights
4. Help users discover essential services (gyms, restaurants, transport routes, social spots) based on their personality and preferences
5. Answer questions about commute options, local amenities, and lifestyle opportunities

If the user has selected a neighborhood, focus your suggestions and information on that specific area. If they have recommended neighborhoods but haven't selected one yet, help them choose between their options. Reference their personality traits and lifestyle indicators to provide truly tailored advice.

Always be helpful, detailed, and practical in your responses, focusing on actionable information the user can apply to their relocation journey.

IMPORTANT FORMATTING INSTRUCTIONS:
- Format your responses using Markdown syntax for better readability
- Use **bold text** for important points, neighborhood names, and key information
- Use bullet points or numbered lists to organize information
- Add proper line breaks and spacing between paragraphs
- Use headings (## and ###) to structure longer responses
- Use > for important quotes or highlights
- Keep formatting clean and consistent throughout your response`
        });

        // Configuration for the model
        const generationConfig = {
          temperature: 1,
          topP: 0.95,
          topK: 64,
          maxOutputTokens: 8192,
          responseMimeType: "text/plain",
        };

        // Prepare chat history with user data if available
        let chatHistory = [
          {
            role: "user",
            parts: [{ text: "Hi, I'm looking for relocation assistance." }]
          },
          {
            role: "model",
            parts: [{ text: "Hi there! I'm your relocation assistant. How can I help you today? To give you the best recommendations, could you share some details about your preferences such as budget, commute time, lifestyle, and any must-haves for your new location?" }]
          }
        ];

        // Add user data to chat history if available
        if (userData) {
          // Format user preferences
          let userPreferencesText = "Here are my preferences and data from my profile:\n\n";
          
          // Add budget category if available
          if (userData.preferences.userCategory) {
            userPreferencesText += `Budget Category: ${userData.preferences.userCategory}\n`;
          }
          
          // Add commute preferences if available
          if (userData.preferences.commute) {
            const commute = userData.preferences.commute;
            userPreferencesText += `Commute Preferences: ${commute.mode || 'Not specified'}, ${commute.duration || 'No'} minutes max\n`;
            
            if (commute.workAddress) {
              userPreferencesText += `Work Address: ${commute.workAddress}\n`;
            }
            
            if (commute.coordinates) {
              userPreferencesText += `Work Coordinates: Lat ${commute.coordinates.lat}, Lng ${commute.coordinates.lng}\n`;
            }
          }
          
          // Add lifestyle preferences if available
          if (userData.preferences.lifestylePreferences && userData.preferences.lifestylePreferences.length > 0) {
            userPreferencesText += `Lifestyle Preferences: ${userData.preferences.lifestylePreferences.join(', ')}\n`;
          }
          
          // Add must-haves if available
          if (userData.preferences.mustHaves && Object.keys(userData.preferences.mustHaves).length > 0) {
            const mustHaveItems = Object.keys(userData.preferences.mustHaves);
            userPreferencesText += `Must-Haves: ${mustHaveItems.join(', ')}\n`;
          }
          
          // Add personality traits if available
          if (userData.analysisResults && userData.analysisResults.personality_traits && userData.analysisResults.personality_traits.length > 0) {
            userPreferencesText += `\nPersonality Traits: ${userData.analysisResults.personality_traits.join(', ')}\n`;
          }
          
          // Add lifestyle indicators if available
          if (userData.analysisResults && userData.analysisResults.lifestyle_indicators && userData.analysisResults.lifestyle_indicators.length > 0) {
            userPreferencesText += `Lifestyle Indicators: ${userData.analysisResults.lifestyle_indicators.join(', ')}\n`;
          }
          
          // Add area preferences if available
          if (userData.analysisResults && userData.analysisResults.area_preferences && userData.analysisResults.area_preferences.length > 0) {
            userPreferencesText += `Area Preferences: ${userData.analysisResults.area_preferences.join(', ')}\n`;
          }
          
          // Add persona if available
          if (userData.persona) {
            userPreferencesText += `\nPersona: ${userData.persona}\n`;
          }
          
          // Add frequent locations if available
          if (userData.analysisResults && userData.analysisResults.frequent_locations && userData.analysisResults.frequent_locations.length > 0) {
            userPreferencesText += `Frequent Locations: ${userData.analysisResults.frequent_locations.join(', ')}\n`;
          }
          
          // Add selected neighborhood if available
          if (userData.selectedNeighborhood) {
            userPreferencesText += `\nSelected Neighborhood: ${userData.selectedNeighborhood.name}\n`;
            
            if (userData.selectedNeighborhood.description) {
              userPreferencesText += `Neighborhood Description: ${userData.selectedNeighborhood.description}\n`;
            }
            
            if (userData.selectedNeighborhood.address) {
              userPreferencesText += `Neighborhood Address: ${userData.selectedNeighborhood.address}\n`;
            }
            
            if (userData.selectedNeighborhood.coordinates) {
              userPreferencesText += `Neighborhood Coordinates: Lat ${userData.selectedNeighborhood.coordinates.lat}, Lng ${userData.selectedNeighborhood.coordinates.lng}\n`;
            }
            
            if (userData.selectedNeighborhood.amenities && userData.selectedNeighborhood.amenities.length > 0) {
              userPreferencesText += `Neighborhood Amenities: ${userData.selectedNeighborhood.amenities.join(', ')}\n`;
            }
          }
          
          // Add recommended neighborhoods if available
          if (userData.recommendedNeighborhoods && userData.recommendedNeighborhoods.length > 0) {
            userPreferencesText += `\nRecommended Neighborhoods: ${userData.recommendedNeighborhoods.map(n => n.name).join(', ')}\n`;
          }
          
          // Add user data message to chat history
          chatHistory.push({
            role: "user",
            parts: [{ text: userPreferencesText }]
          });
          
          // Add bot acknowledgment with personalized response based on neighborhood selection
          let acknowledgmentText = "**Thank you for sharing your preferences and profile data!** I'll use this information to provide personalized recommendations for your relocation needs.\n\n";
          
          if (userData.selectedNeighborhood) {
            acknowledgmentText += `I see you've selected **${userData.selectedNeighborhood.name}** as your neighborhood. I can provide specific information about this area and help with your relocation needs.\n\n`;
            
            // Add some details about the neighborhood if available
            if (userData.selectedNeighborhood.description) {
              acknowledgmentText += `> ${userData.selectedNeighborhood.description}\n\n`;
            }
            
            if (userData.selectedNeighborhood.amenities && userData.selectedNeighborhood.amenities.length > 0) {
              acknowledgmentText += "**Available amenities:**\n";
              userData.selectedNeighborhood.amenities.forEach(amenity => {
                acknowledgmentText += `- ${amenity}\n`;
              });
              acknowledgmentText += "\n";
            }
            
          } else if (userData.recommendedNeighborhoods && userData.recommendedNeighborhoods.length > 0) {
            acknowledgmentText += `I see you have some recommended neighborhoods like **${userData.recommendedNeighborhoods[0].name}**. Would you like more information about any of these areas?\n\n`;
            
            // List recommended neighborhoods
            acknowledgmentText += "**Your recommended neighborhoods:**\n";
            userData.recommendedNeighborhoods.slice(0, 3).forEach((neighborhood, index) => {
              acknowledgmentText += `${index + 1}. **${neighborhood.name}**${neighborhood.description ? ` - ${neighborhood.description.substring(0, 80)}...` : ''}\n`;
            });
            acknowledgmentText += "\n";
          }
          
          acknowledgmentText += "## How can I help you today?\n\nIs there anything specific you'd like to know about relocating to a new area?";
          
          chatHistory.push({
            role: "model",
            parts: [{ text: acknowledgmentText }]
          });
        }

        // Start the chat session with the updated history
        const session = model.startChat({
          generationConfig,
          history: chatHistory
        });

        setChatSession(session);
        
        // If user data was added, update the messages state to show the conversation
        if (userData) {
          // Generate the appropriate bot response based on available data
          let personalizedResponse = "**Thank you for sharing your preferences and profile data!** I'll use this information to provide personalized recommendations for your relocation needs.";
          
          if (userData.selectedNeighborhood) {
            personalizedResponse = `**Thank you for sharing your preferences!** I see you've selected **${userData.selectedNeighborhood.name}** as your neighborhood.\n\n`;
            
            // Add some details about the neighborhood if available
            if (userData.selectedNeighborhood.description) {
              personalizedResponse += `> ${userData.selectedNeighborhood.description}\n\n`;
            }
            
            personalizedResponse += "I can provide specific information about this area and help with your relocation needs.";
            
            if (userData.selectedNeighborhood.amenities && userData.selectedNeighborhood.amenities.length > 0) {
              personalizedResponse += "\n\n**Available amenities:**\n";
              userData.selectedNeighborhood.amenities.slice(0, 3).forEach(amenity => {
                personalizedResponse += `- ${amenity}\n`;
              });
            }
          } else if (userData.recommendedNeighborhoods && userData.recommendedNeighborhoods.length > 0) {
            personalizedResponse = `**Thank you for sharing your preferences!** I see you have some recommended neighborhoods like **${userData.recommendedNeighborhoods[0].name}**.\n\n`;
            
            // List recommended neighborhoods
            personalizedResponse += "**Your recommended neighborhoods:**\n";
            userData.recommendedNeighborhoods.slice(0, 3).forEach((neighborhood, index) => {
              personalizedResponse += `${index + 1}. **${neighborhood.name}**${neighborhood.description ? ` - ${neighborhood.description.substring(0, 70)}...` : ''}\n`;
            });
            
            personalizedResponse += "\nWould you like more information about any of these areas?";
          }
          
          setMessages([
            { 
              id: 1, 
              text: "Hi there! I'm your relocation assistant. How can I help you today?", 
              sender: 'bot',
              timestamp: new Date()
            },
            {
              id: 2,
              text: "Hi, I'm looking for relocation assistance.",
              sender: 'user',
              timestamp: new Date()
            },
            {
              id: 3,
              text: "To give you the best recommendations, could you share some details about your preferences such as budget, commute time, lifestyle, and any must-haves for your new location?",
              sender: 'bot',
              timestamp: new Date()
            },
            {
              id: 4,
              text: "Here are my preferences and data from my profile...",
              sender: 'user',
              timestamp: new Date()
            },
            {
              id: 5,
              text: personalizedResponse + "\n\n## How can I help you today?\n\nIs there anything specific you'd like to know about relocating to a new area?",
              sender: 'bot',
              timestamp: new Date()
            }
          ]);
        }
      } catch (error) {
        console.error("Error initializing Gemini API:", error);
      }
    };

    initializeGeminiAPI();
  }, [userData]);

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
      // Append a reminder to use Markdown formatting
      const formattedQuery = inputText + "\n\n(Remember to use Markdown formatting in your response with headings, bold text, lists, and proper spacing for readability)";
      
      // Send message to Gemini API
      const result = await chatSession.sendMessage(formattedQuery);
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
              {message.sender === 'bot' ? (
                <div className="markdown-content">
                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                  {message.text}
                </ReactMarkdown>
                </div>
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
        <button type="submit" disabled={!inputText.trim() || isTyping || !chatSession}>
          Send
        </button>
      </form>
      
      <div className="chatbot-suggestions">
        <p>Suggested questions:</p>
        <div className="suggestion-buttons">
          {userData && userData.selectedNeighborhood ? (
            <>
              <button onClick={() => setInputText(`What are the best places to visit in ${userData.selectedNeighborhood.name}?`)}>
                Places in {userData.selectedNeighborhood.name}
              </button>
              <button onClick={() => setInputText(`What's the commute like from ${userData.selectedNeighborhood.name} to my workplace?`)}>
                Commute details
              </button>
              <button onClick={() => setInputText(`What amenities are available in ${userData.selectedNeighborhood.name}?`)}>
                Local amenities
              </button>
            </>
          ) : userData && userData.recommendedNeighborhoods && userData.recommendedNeighborhoods.length > 0 ? (
            <>
              <button onClick={() => setInputText(`Tell me more about ${userData.recommendedNeighborhoods[0].name}`)}>
                About {userData.recommendedNeighborhoods[0].name}
              </button>
              <button onClick={() => setInputText("Compare my recommended neighborhoods")}>
                Compare neighborhoods
              </button>
              <button onClick={() => setInputText("What neighborhood would suit me best?")}>
                Best neighborhood
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setInputText("What neighborhoods would suit me best?")}>
                Best neighborhoods
              </button>
              <button onClick={() => setInputText("What items should I buy for my new home?")}>
                Moving essentials
              </button>
              <button onClick={() => setInputText("Where can I find social groups for my interests?")}>
                Social groups
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBot;