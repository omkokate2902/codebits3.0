from flask import jsonify, request, session
import os
from config.firebase import get_firebase_db_ref
import json
import time
from werkzeug.utils import secure_filename
import traceback

def get_user():
    user = session.get("user")
    if user:
        return jsonify(user), 200
    return jsonify({"error": "User not logged in"}), 401

def upload_file():
    """
    Handle file uploads from the client.
    Supports .txt and .json files.
    """
    try:
        # Debug request information
        print("Request method:", request.method)
        print("Request content type:", request.content_type)
        print("Request files:", request.files)
        print("Request form:", request.form)
        
        # Check if user is logged in
        user = session.get("user")
        if not user:
            print("User not logged in")
            return jsonify({"error": "User not logged in"}), 401
            
        if "file" not in request.files:
            print("No file part in request.files")
            print("Keys in request.files:", list(request.files.keys()) if request.files else "None")
            return jsonify({"error": "No file part"}), 400

        file = request.files["file"]
        print("File received:", file.filename)
        
        if file.filename == "":
            print("Empty filename")
            return jsonify({"error": "No selected file"}), 400

        # Get file extension
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        # Create user-specific upload directory
        user_upload_dir = os.path.join("uploads", user["uid"])
        os.makedirs(user_upload_dir, exist_ok=True)
        
        # Save file with timestamp to avoid name collisions
        timestamp = int(time.time())
        safe_filename = f"{timestamp}_{secure_filename(file.filename)}"
        save_path = os.path.join(user_upload_dir, safe_filename)
        
        # Save the file
        file.save(save_path)
        
        # Process file based on type
        if file_ext == '.txt':
            # Process text file
            return jsonify({
                "message": "Text file uploaded successfully", 
                "path": save_path
            }), 200
        elif file_ext == '.json':
            # Process JSON file
            try:
                with open(save_path, 'r') as f:
                    json_data = json.load(f)
                
                # Store in Firebase if needed
                if user:
                    db_ref = get_firebase_db_ref()
                    user_ref = db_ref.child('users').child(user["uid"])
                    
                    # Save file metadata
                    file_meta = {
                        "filename": file.filename,
                        "uploaded_at": {"sv": "timestamp"},
                        "path": save_path
                    }
                    
                    user_ref.child('uploads').push(file_meta)
                
                return jsonify({
                    "message": "JSON file uploaded and processed successfully",
                    "data": json_data
                }), 200
            except json.JSONDecodeError:
                return jsonify({"error": "Invalid JSON file"}), 400
        else:
            return jsonify({"error": "Unsupported file type. Only .txt and .json files are allowed."}), 400
    
    except Exception as e:
        print(f"Error in upload_file: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

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
    
    # Process prioritized must-haves if present
    if "prioritizedMustHaves" in preferences:
        # Ensure prioritizedMustHaves is properly formatted
        if not isinstance(preferences["prioritizedMustHaves"], list):
            return jsonify({"error": "prioritizedMustHaves must be an array"}), 400
        
        # Validate that each item has name and priority
        for item in preferences["prioritizedMustHaves"]:
            if not isinstance(item, dict) or "name" not in item or "priority" not in item:
                return jsonify({"error": "Each prioritizedMustHave must have name and priority"}), 400
    
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