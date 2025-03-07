from flask import Blueprint
from controllers.social_controller import fetch_social_events

social_blueprint = Blueprint("social", __name__)

@social_blueprint.route("/events", methods=["GET"])
def get_events():
    """API route to fetch upcoming social events in Pune."""
    return fetch_social_events()