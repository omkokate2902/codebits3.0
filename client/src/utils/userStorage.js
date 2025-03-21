/**
 * User Storage Utility
 * 
 * This utility provides functions to store and retrieve user data locally.
 * It maps user IDs to their preferences, analysis results, and other data.
 */

// Storage key for user data
const USER_DATA_KEY = 'roommate_finder_user_data';

/**
 * Get all user data from local storage
 * @returns {Object} - Object mapping user IDs to their data
 */
export const getAllUserData = () => {
  try {
    const userData = localStorage.getItem(USER_DATA_KEY);
    console.log('userData', userData);
    return userData ? JSON.parse(userData) : {};
  } catch (error) {
    console.error('Error getting user data from local storage:', error);
    return {};
  }
};

/**
 * Get data for a specific user
 * @param {string} userId - The user ID
 * @returns {Object|null} - The user data or null if not found
 */
export const getUserData = (userId) => {
  if (!userId) return null;
  
  try {
    const allUserData = getAllUserData();
    return allUserData[userId] || null;
  } catch (error) {
    console.error(`Error getting data for user ${userId}:`, error);
    return null;
  }
};

/**
 * Save data for a specific user
 * @param {string} userId - The user ID
 * @param {Object} data - The data to save
 * @returns {boolean} - Whether the operation was successful
 */
export const saveUserData = (userId, data) => {
  if (!userId) return false;
  
  try {
    const allUserData = getAllUserData();
    
    // Merge with existing data if available
    allUserData[userId] = {
      ...allUserData[userId],
      ...data,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(allUserData));
    return true;
  } catch (error) {
    console.error(`Error saving data for user ${userId}:`, error);
    return false;
  }
};

/**
 * Save user preferences
 * @param {string} userId - The user ID
 * @param {Object} preferences - The user preferences
 * @returns {boolean} - Whether the operation was successful
 */
export const saveUserPreferences = (userId, preferences) => {
  return saveUserData(userId, { preferences });
};

/**
 * Save user analysis results
 * @param {string} userId - The user ID
 * @param {Object} analysisResults - The analysis results
 * @returns {boolean} - Whether the operation was successful
 */
export const saveUserAnalysis = (userId, analysisResults) => {
  return saveUserData(userId, { analysisResults });
};

/**
 * Save user persona
 * @param {string} userId - The user ID
 * @param {string} persona - The user persona
 * @returns {boolean} - Whether the operation was successful
 */
export const saveUserPersona = (userId, persona) => {
  return saveUserData(userId, { persona });
};

/**
 * Save recommended neighborhoods for a user
 * @param {string} userId - The user ID
 * @param {Array} neighborhoods - Array of recommended neighborhoods
 * @returns {boolean} - Whether the operation was successful
 */
export const saveRecommendedNeighborhoods = (userId, neighborhoods) => {
  return saveUserData(userId, { recommendedNeighborhoods: neighborhoods });
};

/**
 * Save selected neighborhood for a user
 * @param {string} userId - The user ID
 * @param {Object} neighborhood - The selected neighborhood
 * @returns {boolean} - Whether the operation was successful
 */
export const saveSelectedNeighborhood = (userId, neighborhood) => {
  console.log('111111Saving selected neighborhood to userStorage:', neighborhood);
  return saveUserData(userId, { selectedNeighborhood: neighborhood });
};

/**
 * Get user preferences
 * @param {string} userId - The user ID
 * @returns {Object|null} - The user preferences or null if not found
 */
export const getUserPreferences = (userId) => {
  const userData = getUserData(userId);
  return userData ? userData.preferences || null : null;
};

/**
 * Get user analysis results
 * @param {string} userId - The user ID
 * @returns {Object|null} - The user analysis results or null if not found
 */
export const getUserAnalysis = (userId) => {
  const userData = getUserData(userId);
  return userData ? userData.analysisResults || null : null;
};

/**
 * Get user persona
 * @param {string} userId - The user ID
 * @returns {string|null} - The user persona or null if not found
 */
export const getUserPersona = (userId) => {
  const userData = getUserData(userId);
  return userData ? userData.persona || null : null;
};

/**
 * Get recommended neighborhoods for a user
 * @param {string} userId - The user ID
 * @returns {Array|null} - Array of recommended neighborhoods or null if not found
 */
export const getRecommendedNeighborhoods = (userId) => {
  const userData = getUserData(userId);
  return userData ? userData.recommendedNeighborhoods || null : null;
};

/**
 * Get selected neighborhood for a user
 * @param {string} userId - The user ID
 * @returns {Object|null} - The selected neighborhood or null if not found
 */
export const getSelectedNeighborhood = (userId) => {
  const userData = getUserData(userId);
  return userData ? userData.selectedNeighborhood || null : null;
};

/**
 * Clear all data for a specific user
 * @param {string} userId - The user ID
 * @returns {boolean} - Whether the operation was successful
 */
export const clearUserData = (userId) => {
  if (!userId) return false;
  
  try {
    const allUserData = getAllUserData();
    delete allUserData[userId];
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(allUserData));
    return true;
  } catch (error) {
    console.error(`Error clearing data for user ${userId}:`, error);
    return false;
  }
};

/**
 * Clear all user data
 * @returns {boolean} - Whether the operation was successful
 */
export const clearAllUserData = () => {
  try {
    localStorage.removeItem(USER_DATA_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing all user data:', error);
    return false;
  }
};

export default {
  getAllUserData,
  getUserData,
  saveUserData,
  saveUserPreferences,
  saveUserAnalysis,
  saveUserPersona,
  saveRecommendedNeighborhoods,
  saveSelectedNeighborhood,
  getUserPreferences,
  getUserAnalysis,
  getUserPersona,
  getRecommendedNeighborhoods,
  getSelectedNeighborhood,
  clearUserData,
  clearAllUserData
}; 