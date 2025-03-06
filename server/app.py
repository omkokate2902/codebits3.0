from flask import Flask, jsonify, session
from flask_cors import CORS
from routes.auth_routes import auth_bp
from routes.user_routes import user_routes
from routes.upload_routes import upload_routes  # Import missing routes
import os

app = Flask(__name__)

app.secret_key = "your_secret_key_here"

# Enable CORS with session support
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Register authentication routes
app.register_blueprint(auth_bp, url_prefix="/api/auth")  # 🔹 Added "/api/auth"

# Register user routes
app.register_blueprint(user_routes, url_prefix="/api/user")

# Register file upload routes
app.register_blueprint(upload_routes, url_prefix="/api")  # 🔹 Added "/api"

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"message": "API is working!"}), 200

if __name__ == "__main__":
    os.makedirs("uploads", exist_ok=True)
    app.run(host="0.0.0.0", debug=True, port=3000)