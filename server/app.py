from flask import Flask, jsonify
from flask_cors import CORS
from routes.auth_routes import auth_bp

app = Flask(__name__)
CORS(app)  # Allow frontend to access backend

# Register authentication routes
app.register_blueprint(auth_bp)

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"message": "API is working!"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, port=3000)