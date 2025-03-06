from flask import Blueprint
from controllers.auth_controller import verify_token

auth_bp = Blueprint("auth", __name__)

auth_bp.route("/auth/verify-token", methods=["POST"])(verify_token)