from flask import Blueprint
from controllers.user_controller import get_user, upload_file, save_user_preferences, get_user_preferences

user_routes = Blueprint("user_routes", __name__)

user_routes.route("/profile", methods=["GET"])(get_user)
user_routes.route("/upload", methods=["POST"])(upload_file)
user_routes.route("/preferences", methods=["POST"])(save_user_preferences)
user_routes.route("/preferences", methods=["GET"])(get_user_preferences)