from flask import jsonify
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini API
GOOGLE_API_KEY = os.getenv("GOOGLE_AI_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

def fetch_social_events():
    """Fetches upcoming social events in Pune using Google Gemini."""
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        prompt = (
            "Find me a list of upcoming social events happening in Pune, including live concerts, "
            "networking meetups, parties, cultural festivals, open mics, and tech gatherings. "
            "Format the response strictly in JSON with the following structure:\n"
            "{\n"
            '  "events": [\n'
            "    {\n"
            '      "name": "<Event Name>",\n'
            '      "date": "<Date in YYYY-MM-DD format>",\n'
            '      "location": "<Event Location>",\n'
            '      "category": "<Category: Concert, Meetup, Festival, etc.>",\n'
            '      "ticket_details": {\n'
            '        "price": "<Price or Free>",\n'
            '        "booking_link": "<URL for tickets>"\n'
            "      },\n"
            '      "official_source": "<Official Event Page URL>"\n'
            "    }\n"
            "  ]\n"
            "}"
        )
        response = model.generate_content(prompt)
        return jsonify({"events": response.text})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500