from flask import request, jsonify
import json
import os
import traceback
import google.generativeai as genai
from datetime import datetime

# If you need location services, uncomment and fix the import below
# from services.location_services import get_commute_time, analyze_timeline_data

def analyze_user_personality(timeline_text):
    """Analyze user's timeline text to understand their personality and preferences."""
    prompt = f"""
    Analyze this user's Google Timeline data to understand their personality and preferences:
    
    Timeline Data:
    {timeline_text[:500]}  # Sending only the first 500 characters to avoid overflow.

    Please provide insights about:
    1. Movement patterns (active/sedentary)
    2. Preferred areas of the city
    3. Lifestyle preferences (nightlife, shopping, outdoor activities, etc.)
    4. Common activities and interests
    5. Commute patterns

    Return the analysis in JSON format:
    {{
        "personality_traits": [],
        "area_preferences": [],
        "lifestyle_indicators": [],
        "activity_patterns": [],
        "commute_insights": []
    }}
    """
    
    try:
        # Configure the Gemini API with your API key
        api_key = os.getenv('GOOGLE_AI_KEY')
        if not api_key:
            print("Warning: GOOGLE_AI_KEY environment variable not set")
            return None
            
        genai.configure(api_key=api_key)
        
        # Get an available model
        model_name = get_available_gemini_model()
        
        # Create the model
        model = genai.GenerativeModel(model_name)
        
        # Set generation config to ensure proper JSON formatting
        generation_config = {
            "temperature": 0.2,  # Lower temperature for more deterministic output
            "top_p": 0.8,
            "top_k": 40,
            "response_mime_type": "application/json",  # Request JSON response
        }
        
        # Generate the content with the specified config
        response = model.generate_content(
            prompt,
            generation_config=generation_config
        )
        
        # Parse the response
        if hasattr(response, 'text'):
            try:
                # Clean up the response if it contains markdown code blocks
                response_text = response.text
                if response_text.startswith("```json"):
                    response_text = response_text[7:].strip()
                if response_text.endswith("```"):
                    response_text = response_text[:-3].strip()
                    
                return json.loads(response_text)
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON response: {e}")
                return None
        else:
            print("No text in response")
            return None
            
    except Exception as e:
        print(f"Error analyzing personality: {str(e)}")
        print(traceback.format_exc())
        return None

def generate_housing_prompt(user_data, timeline_analysis=None):
    """Generate a prompt for Gemini API with enhanced user data."""
    
    # Get budget range based on user category
    budget_ranges = {
        'budget': '₹5000 - ₹8000',
        'moderate': '₹8000 - ₹12000',
        'comfort': '₹12000 - ₹18000',
        'premium': '₹18000 - ₹24000',
        'luxury': '₹24000 - ₹50000'
    }
    
    budget_range = budget_ranges.get(user_data['userCategory'], '₹8000 - ₹12000')  # moderate as default

    # Format timeline analysis if available
    timeline_section = ""
    if timeline_analysis:
        timeline_section = f"Timeline Analysis:\n{json.dumps(timeline_analysis, indent=2)}"
    
    # Format prioritized must-haves if available
    must_haves_section = ""
    if 'prioritizedMustHaves' in user_data and user_data['prioritizedMustHaves']:
        must_haves = []
        for item in user_data['prioritizedMustHaves']:
            must_haves.append(f"{item['name']} (Priority: {item['priority']})")
        must_haves_section = f"- Prioritized Must-Have Amenities: {', '.join(must_haves)}"
    else:
        # Fallback to old format if prioritizedMustHaves is not available
        must_haves = []
        if 'mustHaves' in user_data and isinstance(user_data['mustHaves'], dict):
            must_haves = [key for key, value in user_data['mustHaves'].items() if value]
        must_haves_section = f"- Must-Have Amenities: {', '.join(must_haves)}"

    # Get commute details
    commute_details = user_data.get('commute', {})
    work_address = commute_details.get('workAddress', 'Not specified')
    travel_mode = commute_details.get('travelMode', 'driving')
    
    # Calculate max distance based on the selected travel mode
    max_distance = None
    if 'travelModes' in commute_details and travel_mode in commute_details['travelModes']:
        max_distance = commute_details['travelModes'][travel_mode].get('distance', 10)
    else:
        # Default values by travel mode if not specified
        default_distances = {
            'walking': 5,
            'bicycling': 10,
            'transit': 15,
            'driving': 20
        }
        max_distance = default_distances.get(travel_mode, 10)

    # Get lifestyle preferences
    lifestyle_prefs = []
    if 'lifestylePreferences' in user_data:
        if isinstance(user_data['lifestylePreferences'], list):
            # Map numeric indices to actual lifestyle names if needed
            lifestyle_options = [
                'accessibility', 'activeLifestyle', 'affordability', 'amenities', 
                'artsAndMusic', 'casual', 'casualDining', 'cleanliness', 
                'community', 'convenient', 'cultural', 'entertainment', 
                'familyFriendly', 'fineDining', 'greenSpaces', 'healthy', 
                'internationalCuisine', 'nightlife', 'outdoorActivities', 
                'quiet', 'quietness', 'relaxing', 'safety', 'shopping', 
                'socialGatherings'
            ]
            
            # Check if the preferences are numeric indices
            if all(isinstance(pref, str) and pref.isdigit() for pref in user_data['lifestylePreferences']):
                # Convert numeric indices to lifestyle names
                lifestyle_prefs = [
                    lifestyle_options[int(idx)] if int(idx) < len(lifestyle_options) else f"preference_{idx}"
                    for idx in user_data['lifestylePreferences']
                ]
            else:
                # Use the preferences as they are
                lifestyle_prefs = user_data['lifestylePreferences']
        elif isinstance(user_data['lifestylePreferences'], dict):
            lifestyle_prefs = [key for key, value in user_data['lifestylePreferences'].items() if value]
    # Check for legacy 'lifestyle' key
    elif 'lifestyle' in user_data and isinstance(user_data['lifestyle'], dict):
        lifestyle_prefs = [key for key, value in user_data['lifestyle'].items() if value]
    
    # Format lifestyle preferences for display
    lifestyle_section = "- Lifestyle Preferences: None specified"
    if lifestyle_prefs:
        lifestyle_section = f"- Lifestyle Preferences: {', '.join(lifestyle_prefs)}"

    prompt = f"""
    As a housing recommendation expert, analyze the following requirements and suggest suitable housing locations around their work address according to their preferences. Return the response in JSON format.

    User Profile:
    - Budget Range: {budget_range} per month
    - User Category: {user_data['userCategory']} ({user_data.get('userCategoryDescription', '')})
    - Work Address: {work_address}
    - Travel Mode: {travel_mode}
    - Maximum Travel Distance: {max_distance} km
    {lifestyle_section}
    {must_haves_section}

    {timeline_section}
    
    Please recommend 3-5 specific neighborhoods that match these criteria. Return in this JSON format:
    [
        {{
            "name": "Neighborhood Name",
            "city": "City Name",
            "state": "State Name",
            "averageRent": "₹X,XXX/month",
            "safetyScore": 0-10,
            "walkabilityScore": 0-10,
            "image": "URL_placeholder",
            "description": "Detailed description...",
            "amenities": ["amenity1", "amenity2", ...],
            "commuteDetails": {{
                "distance": "X km",
                "time": "X mins",
                "travelMode": "{travel_mode}"
            }},
            "matchingFactors": ["factor1", "factor2", ...],
            "nearbyHighlights": ["highlight1", "highlight2", ...]
        }},
        ...
    ]
    
    IMPORTANT: Do not include any comments in the JSON. The response must be valid JSON that can be parsed directly.
    """
    return prompt

def get_available_gemini_model():
    """Get an available Gemini model from the list of models."""
    try:
        models = genai.list_models()
        model_names = [model.name for model in models]
        print("Available models:", model_names)
        
        # Try models in order of preference
        preferred_models = [
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-pro',
            'gemini-pro-vision',
            'models/gemini-1.0-pro',
            'models/gemini-pro'
        ]
        
        for model_name in preferred_models:
            if any(model_name in name for name in model_names):
                matching_models = [name for name in model_names if model_name in name]
                print(f"Using model: {matching_models[0]}")
                return matching_models[0]
        
        # If none of the preferred models are available, use the first available model
        if model_names:
            print(f"Using first available model: {model_names[0]}")
            return model_names[0]
        
        # Default fallback
        print("No models available, using default: gemini-1.5-flash")
        return 'gemini-1.5-flash'
    except Exception as e:
        print(f"Error listing models: {e}")
        print("Using default model: gemini-1.5-flash")
        return 'gemini-1.5-flash'

def recommend_housing():
    try:
        # Get JSON data
        data = request.get_json()
        print("Received data:", json.dumps(data, indent=2))
        
        # Check if data exists
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data received'
            }), 400
        
        # Extract preferences from data
        preferences = data.get('preferences', data)  # Try both formats
        
        # Validate required fields
        if 'userCategory' not in preferences:
            return jsonify({
                'success': False,
                'error': 'Missing userCategory in preferences'
            }), 400
            
        if 'commute' not in preferences or not isinstance(preferences['commute'], dict):
            return jsonify({
                'success': False,
                'error': 'Missing or invalid commute information in preferences'
            }), 400
        
        # Process timeline data if provided
        timeline_analysis = None
        if 'timelineData' in data:
            timeline_analysis = analyze_user_personality(data['timelineData'])
        
        # Check for API key
        google_ai_key = os.getenv('GOOGLE_AI_KEY')
        if not google_ai_key:
            return jsonify({
                'success': False,
                'error': 'Google AI API key not configured'
            }), 500

        try:
            # Generate prompt for Gemini
            prompt = generate_housing_prompt(preferences, timeline_analysis)
            print("Generated prompt:", prompt)
            
            # Get recommendations from Gemini
            genai.configure(api_key=google_ai_key)
            
            # Get an available model
            model_name = get_available_gemini_model()
            
            # Create the model
            model = genai.GenerativeModel(model_name)
            
            # Set generation config to ensure proper JSON formatting
            generation_config = {
                "temperature": 0.2,  # Lower temperature for more deterministic output
                "top_p": 0.8,
                "top_k": 40,
                "response_mime_type": "application/json",  # Request JSON response
            }
            
            # Generate the content with the specified config
            response = model.generate_content(
                prompt,
                generation_config=generation_config
            )
            
            if not response or not hasattr(response, 'text'):
                return jsonify({
                    'success': False,
                    'error': 'Failed to get response from Gemini API'
                }), 500

            # Process the response
            recommendations = response.text
            
            # Clean up the response
            if recommendations.startswith("```json"):
                recommendations = recommendations[7:].strip()
            if recommendations.endswith("```"):
                recommendations = recommendations[:-3].strip()

            try:
                parsed_recommendations = json.loads(recommendations)
                
                # Add timeline analysis to response if available
                response_data = {
                    'success': True,
                    'recommendations': parsed_recommendations,
                }
                if timeline_analysis:
                    response_data['timelineAnalysis'] = timeline_analysis
                
                return jsonify(response_data)
                
            except json.JSONDecodeError as e:
                print(f"Failed to parse recommendations JSON: {str(e)}")
                print(f"Raw response: {recommendations}")
                
                # Try to clean up the JSON by removing comments and fixing formatting issues
                try:
                    # Remove comments (both // and /* */ style)
                    import re
                    cleaned_json = re.sub(r'//.*?(\n|$)', '\n', recommendations)
                    cleaned_json = re.sub(r'/\*.*?\*/', '', cleaned_json, flags=re.DOTALL)
                    
                    # Try to parse the cleaned JSON
                    parsed_recommendations = json.loads(cleaned_json)
                    
                    response_data = {
                        'success': True,
                        'recommendations': parsed_recommendations,
                    }
                    if timeline_analysis:
                        response_data['timelineAnalysis'] = timeline_analysis
                    
                    return jsonify(response_data)
                except Exception as cleanup_error:
                    print(f"Failed to clean up and parse JSON: {str(cleanup_error)}")
                    
                    # As a last resort, try to manually fix the JSON
                    try:
                        # Create a simplified response with the data we can extract
                        import re
                        
                        # Extract neighborhood names
                        names = re.findall(r'"name":\s*"([^"]+)"', recommendations)
                        cities = re.findall(r'"city":\s*"([^"]+)"', recommendations)
                        descriptions = re.findall(r'"description":\s*"([^"]+)"', recommendations)
                        
                        # Create a simplified response
                        simplified_recommendations = []
                        for i in range(min(len(names), len(cities))):
                            neighborhood = {
                                "name": names[i],
                                "city": cities[i],
                                "description": descriptions[i] if i < len(descriptions) else "No description available"
                            }
                            simplified_recommendations.append(neighborhood)
                        
                        if simplified_recommendations:
                            return jsonify({
                                'success': True,
                                'recommendations': simplified_recommendations,
                                'note': 'This is a simplified response due to JSON parsing issues'
                            })
                    except Exception as manual_error:
                        print(f"Failed to manually extract data: {str(manual_error)}")
                
                # If all attempts fail, return the error
                return jsonify({
                    'success': False,
                    'error': 'Failed to parse recommendations JSON',
                    'raw_response': recommendations[:500]  # Include part of the raw response for debugging
                }), 500

        except Exception as gemini_error:
            print(f"Gemini API error: {str(gemini_error)}")
            print(traceback.format_exc())
            return jsonify({
                'success': False,
                'error': f'Gemini API error: {str(gemini_error)}'
            }), 500

    except Exception as e:
        print(f"General error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500