from flask import jsonify, request, session
import os
from config.firebase import get_firebase_db_ref

def get_user():
    user = session.get("user")
    if user:
        return jsonify(user), 200
    return jsonify({"error": "User not logged in"}), 401

def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if file and file.filename.endswith(".txt"):
        save_path = os.path.join("uploads", file.filename)
        file.save(save_path)
        return jsonify({"message": "File uploaded successfully", "path": save_path}), 200

    return jsonify({"error": "Invalid file type"}), 400

def save_user_preferences():
    """
    Save user preferences to Firebase Realtime Database.
    """
    user = session.get("user")
    if not user:
        return jsonify({"error": "User not logged in"}), 401
    
    data = request.json
    preferences = data.get("preferences")
    
    if not preferences:
        return jsonify({"error": "No preferences provided"}), 400
    
    # Get Firebase DB reference
    db_ref = get_firebase_db_ref()
    user_ref = db_ref.child('users').child(user["uid"])
    
    # Save preferences to user's record
    user_ref.child('preferences').set(preferences)
    
    return jsonify({
        "message": "Preferences saved successfully",
        "preferences": preferences
    }), 200

def get_user_preferences():
    """
    Get user preferences from Firebase Realtime Database.
    """
    user = session.get("user")
    if not user:
        return jsonify({"error": "User not logged in"}), 401
    
    # Get Firebase DB reference
    db_ref = get_firebase_db_ref()
    user_ref = db_ref.child('users').child(user["uid"])
    
    # Get preferences from user's record
    preferences = user_ref.child('preferences').get()
    
    if not preferences:
        return jsonify({"message": "No preferences found"}), 404
    
    return jsonify({
        "preferences": preferences
    }), 200