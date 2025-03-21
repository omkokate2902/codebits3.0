/**
 * Environment configuration utility
 * This utility ensures consistent access to environment variables throughout the application
 */

// Get environment variables with fallbacks
export const getEnvVariable = (key, defaultValue = null) => {
  const value = process.env[key];
  
  // If the environment variable doesn't exist, use the default value
  if (value === undefined) {
    console.warn(`Environment variable ${key} is not defined. Using default value.`);
    return defaultValue;
  }
  
  // Remove any whitespace from the beginning or end of the value
  const trimmedValue = value.trim();
  
  // Log only the first and last few characters of sensitive values
  const isSensitive = key.toLowerCase().includes('key') || key.toLowerCase().includes('secret');
  
  if (isSensitive && trimmedValue) {
    const length = trimmedValue.length;
    const firstChars = trimmedValue.substring(0, 4);
    const lastChars = trimmedValue.substring(length - 4);
    console.log(`Loaded ${key}: ${firstChars}...${lastChars} (length: ${length})`);
  } else {
    console.log(`Loaded ${key}: ${isSensitive ? '[REDACTED]' : trimmedValue}`);
  }
  
  return trimmedValue;
};

// Common environment variables
export const config = {
  apiUrl: getEnvVariable('REACT_APP_API_URL', 'http://localhost:3000'),
  googleMapsApiKey: getEnvVariable('REACT_APP_GOOGLE_MAPS_API_KEY'),
  geminiApiKey: getEnvVariable('REACT_APP_GEMINI_API_KEY_NEW')
};

// Export default configuration
export default config; 