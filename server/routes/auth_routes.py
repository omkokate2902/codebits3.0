from flask import Blueprint
from controllers.auth_controller import verify_token, check_session, logout

auth_bp = Blueprint("auth", __name__)

auth_bp.route("/verify-token", methods=["POST"])(verify_token)
auth_bp.route("/session", methods=["GET"])(check_session)
auth_bp.route("/logout", methods=["POST"])(logout)