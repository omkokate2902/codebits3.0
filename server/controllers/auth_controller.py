from flask import request, jsonify, session
from config.firebase import verify_firebase_token, get_firebase_db_ref
import traceback

def verify_token():
    """
    Verify the Firebase ID token sent from the frontend.
    """
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        id_token = data.get("idToken")
        if not id_token:
            return jsonify({"error": "Missing token"}), 400

        print(f"Verifying token: {id_token[:10]}...")
        user_data = verify_firebase_token(id_token)
        
        if not user_data:
            return jsonify({"error": "Invalid token"}), 401
        
        print(f"Token verified for user: {user_data.get('email')}")
        
        # Store user in session
        session["user"] = {
            "uid": user_data["uid"],
            "email": user_data.get("email"),
            "name": user_data.get("name", ""),
            "picture": user_data.get("picture", ""),
        }
        
        # Store user in Firebase Realtime Database
        try:
            db_ref = get_firebase_db_ref()
            users_ref = db_ref.child('users').child(user_data["uid"])
            
            # Check if user exists, if not create a new user record
            if not users_ref.get():
                users_ref.set({
                    "email": user_data.get("email"),
                    "name": user_data.get("name", ""),
                    "picture": user_data.get("picture", ""),
                    "created_at": {".sv": "timestamp"},
                })
            else:
                # Update last login time
                users_ref.update({
                    "last_login": {".sv": "timestamp"},
                })
        except Exception as e:
            print(f"Error storing user in database: {e}")
            # Continue even if database storage fails
            traceback.print_exc()

        return jsonify({
            "message": "Token verified successfully",
            "user": session["user"]
        }), 200
    except Exception as e:
        print(f"Error in verify_token: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

def check_session():
    """
    Check if the user has an active session.
    """
    try:
        user = session.get("user")
        if user:
            return jsonify({
                "message": "Session found",
                "user": user
            }), 200
        else:
            return jsonify({
                "message": "No active session",
                "user": None
            }), 401
    except Exception as e:
        print(f"Error in check_session: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

def logout():
    """
    Clear the user's session.
    """
    try:
        session.pop("user", None)
        return jsonify({
            "message": "Logged out successfully"
        }), 200
    except Exception as e:
        print(f"Error in logout: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500