import firebase_admin
from firebase_admin import credentials, auth

# Load Firebase credentials
cred = credentials.Certificate("codebits3-firebase-adminsdk-fbsvc-d00982fcf5.json")
firebase_admin.initialize_app(cred)

def verify_firebase_token(id_token):
    """
    Verify Firebase ID Token and return user data.
    """
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token  # Returns user info like uid, email, name, etc.
    except Exception as e:
        return None