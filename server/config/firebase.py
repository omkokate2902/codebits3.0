import firebase_admin
from firebase_admin import credentials, auth, db
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Firebase configuration from environment variables
firebase_database_url = os.getenv('FIREBASE_DATABASE_URL', 'https://codebits3-default-rtdb.firebaseio.com')

# Get the absolute path to the credentials file
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cred_path = os.path.join(current_dir, "codebits3-firebase-adminsdk-fbsvc-d00982fcf5.json")

# Load Firebase credentials
try:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred, {
        'databaseURL': firebase_database_url
    })
    print(f"Firebase initialized successfully with database URL: {firebase_database_url}")
except Exception as e:
    print(f"Error initializing Firebase: {e}")
    print(f"Credentials path: {cred_path}")
    print(f"Does file exist? {os.path.exists(cred_path)}")
    raise

def verify_firebase_token(id_token):
    """
    Verify Firebase ID Token and return user data.
    """
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token  # Returns user info like uid, email, name, etc.
    except Exception as e:
        print(f"Error verifying token: {e}")
        return None

def get_firebase_db_ref():
    """
    Get a reference to the Firebase Realtime Database.
    """
    return db.reference('/')