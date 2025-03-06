from flask import Blueprint
from controllers.user_controller import get_user, upload_file

user_routes = Blueprint("user_routes", __name__)

user_routes.route("/user", methods=["GET"])(get_user)
user_routes.route("/upload", methods=["POST"])(upload_file)