from flask import Blueprint
from controllers.user_controller import upload_file

upload_routes = Blueprint("upload_routes", __name__)

upload_routes.route("/upload", methods=["POST"])(upload_file)