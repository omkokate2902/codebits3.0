from flask import request, jsonify
from config.firebase import verify_firebase_token

def verify_token():
    """
    Verify the Firebase ID token sent from the frontend.
    """
    data = request.json
    id_token = data.get("idToken")

    if not id_token:
        return jsonify({"error": "Missing token"}), 400

    user_data = verify_firebase_token(id_token)
    if not user_data:
        return jsonify({"error": "Invalid token"}), 401

    return jsonify({
        "message": "Token verified successfully",
        "user": {
            "uid": user_data["uid"],
            "email": user_data.get("email"),
            "name": user_data.get("name", ""),
            "picture": user_data.get("picture", ""),
        }
    }), 200