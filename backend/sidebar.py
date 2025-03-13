import os
from flask import Blueprint, request, jsonify
from flask_pymongo import PyMongo
from pymongo.errors import ConnectionFailure
from datetime import datetime, timedelta
from bson import ObjectId
from langchain_groq import ChatGroq

# Create blueprint
sidebar_bp = Blueprint('sidebar', __name__)

# Initialize the ChatGroq model (same as chat_model.py)
GROQ_API_KEY = "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"
sidebar_llm = ChatGroq(
    model="llama-3.2-90b-vision-preview",
    temperature=0.3,
    api_key=GROQ_API_KEY
)

# MongoDB configuration
MONGODB_URI = os.environ.get(
    'MONGODB_URI',
    'mongodb+srv://username:password@cluster.mongodb.net/'  # Update with your actual URI
)
mongo = None  # Flask-PyMongo instance
db = None  # MongoClient instance

def init_mongo(app):
    """
    Initialize the MongoDB connection using Flask-PyMongo and MongoClient.
    """
    global mongo, db
    app.config["MONGO_URI"] = MONGODB_URI
    mongo = PyMongo(app)
    db = mongo.cx['FinMate']  # Database name changed to match financial advisor theme

    try:
        # Ensure database connection
        mongo.cx.admin.command('ping')
        print("Connected to MongoDB")
    except ConnectionFailure:
        print("Failed to connect to MongoDB")

# Loan Categories Route
@sidebar_bp.route('/api/loan-categories', methods=['GET'])
def get_loan_categories():
    """Get available loan categories for the sidebar."""
    try:
        categories = [
            {"id": "home_loans", "name": "Home Loans", "icon": "home"},
            {"id": "personal_loans", "name": "Personal Loans", "icon": "person"},
            {"id": "business_loans", "name": "Business Loans", "icon": "business"},
            {"id": "education_loans", "name": "Education Loans", "icon": "school"},
            {"id": "car_loans", "name": "Car Loans", "icon": "directions_car"},
            {"id": "gold_loans", "name": "Gold Loans", "icon": "monetization_on"},
            {"id": "mortgage_loans", "name": "Mortgage Loans", "icon": "account_balance"},
            {"id": "credit_card_loans", "name": "Credit Card Loans", "icon": "credit_card"},
        ]
        return jsonify(categories)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Financial Tools Route
@sidebar_bp.route('/api/financial-tools', methods=['GET'])
def get_financial_tools():
    """Get available financial tools for the sidebar."""
    try:
        tools = [
            {"id": "emi_calculator", "name": "EMI Calculator", "icon": "calculate"},
            {"id": "eligibility_checker", "name": "Loan Eligibility Checker", "icon": "check_circle"},
            {"id": "interest_comparison", "name": "Interest Rate Comparison", "icon": "compare_arrows"},
            {"id": "credit_score", "name": "Credit Score Analysis", "icon": "analytics"},
            {"id": "debt_consolidation", "name": "Debt Consolidation Planner", "icon": "account_balance_wallet"}
        ]
        return jsonify(tools)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Recent Loan Queries Route
@sidebar_bp.route('/api/recent-queries', methods=['GET'])
def get_recent_queries():
    """Get recent loan queries for the sidebar."""
    try:
        if db:
            # Get recent loan queries from database
            recent_queries = list(db.loan_queries.find().sort('timestamp', -1).limit(5))
            
            # Format for response
            formatted_queries = []
            for query in recent_queries:
                time_diff = datetime.utcnow() - query.get('timestamp', datetime.utcnow())
                hours_ago = time_diff.total_seconds() / 3600
                
                formatted_queries.append({
                    'id': str(query.get('_id', '')),
                    'query': query.get('query', 'Loan Query'),
                    'loan_type': query.get('loan_type', 'General'),
                    'hours_ago': round(hours_ago, 1)
                })
                
            return jsonify(formatted_queries)
        else:
            # Return placeholder data if DB not available
            return jsonify([
                {"id": "1", "query": "Home loan interest rates", "loan_type": "Home Loan", "hours_ago": 0.5},
                {"id": "2", "query": "Car loan eligibility", "loan_type": "Car Loan", "hours_ago": 2.3},
                {"id": "3", "query": "Education loan documents", "loan_type": "Education Loan", "hours_ago": 3.1}
            ])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Loan Interest Rates Route
@sidebar_bp.route('/api/interest-rates', methods=['GET'])
def get_interest_rates():
    """Get current loan interest rates for the sidebar."""
    try:
        # These would ideally come from a database that's regularly updated
        rates = {
            "home_loan": {
                "min_rate": 6.5,
                "max_rate": 8.5,
                "last_updated": datetime.now().strftime("%Y-%m-%d")
            },
            "personal_loan": {
                "min_rate": 10.5,
                "max_rate": 15.0,
                "last_updated": datetime.now().strftime("%Y-%m-%d")
            },
            "car_loan": {
                "min_rate": 7.0,
                "max_rate": 11.0,
                "last_updated": datetime.now().strftime("%Y-%m-%d")
            },
            "education_loan": {
                "min_rate": 8.0,
                "max_rate": 12.5,
                "last_updated": datetime.now().strftime("%Y-%m-%d")
            },
            "business_loan": {
                "min_rate": 11.0,
                "max_rate": 16.0,
                "last_updated": datetime.now().strftime("%Y-%m-%d")
            }
        }
        return jsonify(rates)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Financial Tips Route
@sidebar_bp.route('/api/financial-tips', methods=['GET'])
def get_financial_tips():
    """Get random financial tips for the sidebar."""
    tips = [
        "Maintain a credit score above 750 for the best loan interest rates.",
        "Compare offers from multiple lenders before finalizing your loan.",
        "Pay more than the minimum EMI when possible to reduce your loan tenure.",
        "Check for hidden charges and processing fees when evaluating loan offers.",
        "Consider a loan with no prepayment penalties if you plan to close early.",
        "Set up automatic payments to avoid missing EMI due dates.",
        "Consolidate multiple high-interest loans into a single lower-interest loan.",
        "Maintain a debt-to-income ratio below 40% for better loan approval chances.",
        "Review your loan statements regularly to track your progress.",
        "Refinance your loan when interest rates drop significantly."
    ]
    
    # Return 3 random tips
    import random
    selected_tips = random.sample(tips, min(3, len(tips)))
    return jsonify(selected_tips)

# Add loan query to recent queries (called from chat_model.py)
def add_loan_query(query, loan_type="General"):
    """Add a loan query to the recent queries collection."""
    if db:
        try:
            db.loan_queries.insert_one({
                "query": query,
                "loan_type": loan_type,
                "timestamp": datetime.utcnow()
            })
            return True
        except Exception as e:
            print(f"Error adding loan query: {str(e)}")
    return False
