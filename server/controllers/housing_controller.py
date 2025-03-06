from flask import request, jsonify
import json
import os
import traceback
import google.generativeai as genai

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
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(prompt)
        return json.loads(response.text)
    except Exception as e:
        print(f"Error analyzing personality: {str(e)}")
        return None

def generate_housing_prompt(user_data, timeline_analysis=None):
    """Generate a prompt for Gemini API with enhanced user data."""
    
    budget_ranges = {
        'budget': '₹5000 - ₹8000',
        'moderate': '₹8000 - ₹12000',
        'comfort': '₹12000 - ₹18000',
        'premium': '₹18000 - ₹24000',
        'luxury': '₹24000 - ₹50000'
    }
    
    budget_range = budget_ranges.get(user_data['userCategory'], '₹8000 - ₹12000')

    timeline_section = ""
    if timeline_analysis:
        timeline_section = f"Timeline Analysis:\n{json.dumps(timeline_analysis, indent=2)}"

    prompt = f"""
    As a housing recommendation expert, analyze the following requirements and suggest suitable housing locations around their work address according to their preferences. Return the response in JSON format.

    User Profile:
    - Budget Range: {budget_range} per month
    - User Category: {user_data['userCategory']} ({user_data.get('userCategoryDescription', '')})
    - Work Address: {user_data['commute']['workAddress']}
    - Travel Mode: {user_data['commute']['travelMode']}
    - Maximum Travel Distance: {user_data['commute']['maxCommuteDistance']} km
    - Lifestyle Preferences: {', '.join(key for key, value in user_data['lifestyle'].items() if value)}
    - Must-Have Amenities: {', '.join(key for key, value in user_data['mustHaves'].items() if value)}

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
                "travelMode": "{user_data['commute']['travelMode']}"
            }},
            "matchingFactors": ["factor1", "factor2", ...],
            "nearbyHighlights": ["highlight1", "highlight2", ...]
        }},
        ...
    ]
    """
    return prompt

def recommend_housing():
    try:
        # Handle JSON Data
        user_data = request.form.get("userData")
        
        if not user_data:
            return jsonify({
                'success': False,
                'error': 'User data not received'
            }), 400
        
        user_data = json.loads(user_data)

        # Handle File Upload for Timeline Data
        # timeline_analysis = None
        # if 'timelineData' in request.files:
        #     timeline_file = request.files['timelineData']
        #     timeline_text = timeline_file.read().decode('utf-8')
        #     timeline_analysis = analyze_user_personality(timeline_text)
        
        timeline_analysis = None
        # if 'timelineData' in user_data:
        with open("/Users/omkokate/dev/codebits3.0/server/uploads/Timeline2.txt", 'r') as timeline_file:
            timeline_text = timeline_file.read().decode('utf-8')
            timeline_analysis = analyze_user_personality(timeline_text)
        # timeline_text = timeline_file.read().decode('utf-8')
        # timeline_analysis = analyze_user_personality(timeline_text)


        # Check for API key
        google_ai_key = os.getenv('GOOGLE_AI_KEY')
        if not google_ai_key:
            return jsonify({
                'success': False,
                'error': 'Google AI API key not configured'
            }), 500

        # Generate prompt for Gemini
        prompt = generate_housing_prompt(user_data, timeline_analysis)
        
        try:
            # Get recommendations from Gemini
            genai.configure(api_key=google_ai_key)
            model = genai.GenerativeModel('gemini-2.0-flash')
            response = model.generate_content(prompt)
            
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
                
                response_data = {
                    'success': True,
                    'recommendations': parsed_recommendations,
                }
                if timeline_analysis:
                    response_data['timelineAnalysis'] = timeline_analysis
                
                return jsonify(response_data)
                
            except json.JSONDecodeError as e:
                print(f"Failed to parse recommendations JSON: {str(e)}")
                return jsonify({
                    'success': False,
                    'error': 'Failed to parse recommendations JSON'
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