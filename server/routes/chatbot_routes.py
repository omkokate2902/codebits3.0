from flask import Blueprint
from controllers.chatbot_controller import chatbot_controller

chatbot_bp = Blueprint('chatbot', __name__)

chatbot_bp.route('/chat', methods=['POST'])(chatbot_controller)