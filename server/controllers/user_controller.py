from flask import jsonify, request, session
import os

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