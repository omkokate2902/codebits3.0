import os
import googlemaps
from datetime import datetime
import dotenv
from collections import defaultdict

dotenv.load_dotenv()

gmaps = googlemaps.Client(key=os.getenv('GOOGLE_MAPS_KEY'))

def analyze_timeline_data(timeline_data):
    """
    Analyze Google Timeline data to extract patterns and preferences.
    Returns a structured analysis of the user's movement patterns.
    """
    analysis = {
        'most_visited_areas': [],
        'common_activities': defaultdict(int),
        'movement_patterns': {
            'weekday': defaultdict(list),
            'weekend': defaultdict(list)
        },
        'average_daily_locations': 0,
        'activity_preferences': {
            'shopping': 0,
            'dining': 0,
            'entertainment': 0,
            'outdoor': 0,
            'fitness': 0
        }
    }

    try:
        for segment in timeline_data.get('timelineObjects', []):
            if 'placeVisit' in segment:
                place = segment['placeVisit']
                location = place.get('location', {})
                
                # Extract place details
                place_name = location.get('name', '')
                place_type = location.get('type', '')
                
                # Update visit counts
                analysis['common_activities'][place_type] += 1
                
                # Analyze place type for activity preferences
                if any(keyword in place_type.lower() for keyword in ['shop', 'store', 'mall']):
                    analysis['activity_preferences']['shopping'] += 1
                elif any(keyword in place_type.lower() for keyword in ['restaurant', 'cafe', 'food']):
                    analysis['activity_preferences']['dining'] += 1
                elif any(keyword in place_type.lower() for keyword in ['movie', 'theatre', 'entertainment']):
                    analysis['activity_preferences']['entertainment'] += 1
                elif any(keyword in place_type.lower() for keyword in ['park', 'garden', 'outdoor']):
                    analysis['activity_preferences']['outdoor'] += 1
                elif any(keyword in place_type.lower() for keyword in ['gym', 'fitness', 'sport']):
                    analysis['activity_preferences']['fitness'] += 1

        # Convert defaultdict to regular dict for JSON serialization
        analysis['common_activities'] = dict(analysis['common_activities'])
        analysis['movement_patterns'] = dict(analysis['movement_patterns'])
        
        return analysis
    except Exception as e:
        print(f"Error analyzing timeline data: {str(e)}")
        return None

def get_commute_time(origin, destination, mode="transit"):
    """
    Calculate the commute time between two locations.
    Returns duration in minutes.
    """
    try:
        # Get directions using Google Maps API
        directions_result = gmaps.directions(
            origin,
            destination,
            mode=mode,  # Using specified travel mode
            departure_time=datetime.now()  # Current time
        )

        if directions_result:
            # Get the first route's duration
            duration = directions_result[0]['legs'][0]['duration']['value']
            # Convert seconds to minutes
            return round(duration / 60)
        
        return None
    except Exception as e:
        print(f"Error calculating commute time: {str(e)}")
        return None