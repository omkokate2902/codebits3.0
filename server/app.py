from flask import Flask, jsonify
from flask_cors import CORS
from routes.auth_routes import auth_bp
from routes.user_routes import user_routes
import os

app = Flask(__name__)
CORS(app)  # Allow frontend to access backend

# Register authentication routes
app.register_blueprint(auth_bp)

app.register_blueprint(user_routes, url_prefix="/api/user")


@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"message": "API is working!"}), 200

if __name__ == "__main__":
    os.makedirs("uploads", exist_ok=True)
    app.run(host="0.0.0.0", debug=True, port=3000)