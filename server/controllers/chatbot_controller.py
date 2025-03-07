import base64
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import google.generativeai as genai

app = Flask(__name__)
CORS(app)

@app.route('/api/chatbot/message', methods=['POST'])
def chatbot_controller():
    try:
        data = request.json
        user_input = data.get("message", "")

        if not user_input:
            return jsonify({"error": "Message is required"}), 400

        # Configure the Gemini API
        genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
        
        # Create a model instance
        model = genai.GenerativeModel('gemini-pro')
        
        # Generate content
        response = model.generate_content(
            user_input,
            generation_config=genai.types.GenerationConfig(
                temperature=0.9,
                top_p=0.95,
                top_k=64,
                max_output_tokens=8192
            )
        )
        
        return jsonify({"response": response.text}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)