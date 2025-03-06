from flask import Blueprint
from controllers.housing_controller import recommend_housing

housing_bp = Blueprint('housing', __name__)

housing_bp.route('/recommend-housing', methods=['POST'])(recommend_housing)