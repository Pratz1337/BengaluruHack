import os
from flask import Blueprint, request, jsonify
from flask_pymongo import PyMongo
from pymongo.errors import ConnectionFailure
from datetime import datetime, timedelta
from bson import ObjectId
from langchain_groq import ChatGroq
from pinecone import Pinecone
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value

try:
    MONGO_URI = get_required_env("MONGO_URI")
    GROQ_API_KEY = get_required_env("GROQ_API_KEY")
    PINECONE_API_KEY = get_required_env("PINECONE_API_KEY")
except ValueError as e:
    print(f"Configuration error: {str(e)}")
    raise

# Create blueprint
sidebar_bp = Blueprint('sidebar', __name__)

# Initialize the ChatGroq model
sidebar_llm = ChatGroq(
    model="llama-3.2-90b-vision-preview",
    temperature=0.3,
    api_key=GROQ_API_KEY
)

# MongoDB configuration
mongo = PyMongo()

def init_app(app):
    app.config["MONGO_URI"] = MONGO_URI
    mongo.init_app(app)

# Initialize Pinecone
pinecone = Pinecone(api_key=PINECONE_API_KEY)

# Loan Categories Route
@sidebar_bp.route('/api/loan-categories', methods=['GET'])
def get_loan_categories():
    """Get available loan categories for the sidebar."""
    try:
        # Fetch categories from database if available
        if mongo.db:
            loan_categories = list(mongo.db.loan_categories.find({}, {'_id': 0}))
            if loan_categories:
                return jsonify(loan_categories)
        
        # Default categories if not found in database
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
        print(f"Error fetching loan categories: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Financial Tools Route
@sidebar_bp.route('/api/financial-tools', methods=['GET'])
def get_financial_tools():
    """Get available financial tools for the sidebar."""
    try:
        # Fetch tools from database if available
        if mongo.db:
            financial_tools = list(mongo.db.financial_tools.find({}, {'_id': 0}))
            if financial_tools:
                return jsonify(financial_tools)
        
        # Default tools if not found in database
        tools = [
            {"id": "emi_calculator", "name": "EMI Calculator", "icon": "calculate"},
            {"id": "eligibility_checker", "name": "Loan Eligibility Checker", "icon": "check_circle"},
            {"id": "interest_comparison", "name": "Interest Rate Comparison", "icon": "compare_arrows"},
            {"id": "credit_score", "name": "Credit Score Analysis", "icon": "analytics"},
            {"id": "debt_consolidation", "name": "Debt Consolidation Planner", "icon": "account_balance_wallet"}
        ]
        return jsonify(tools)
    except Exception as e:
        print(f"Error fetching financial tools: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Recent Loan Queries Route
@sidebar_bp.route('/api/recent-queries', methods=['GET'])
def get_recent_queries():
    """Get recent loan queries for the sidebar."""
    try:
        if mongo.db:
            # Get recent loan queries from database
            recent_queries = list(mongo.db.loan_queries.find().sort('timestamp', -1).limit(5))
            
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
            return jsonify([{"id": "1", "query": "Home loan interest rates", "loan_type": "Home Loan", "hours_ago": 0.5},
                            {"id": "2", "query": "Car loan eligibility", "loan_type": "Car Loan", "hours_ago": 2.3},
                            {"id": "3", "query": "Education loan documents", "loan_type": "Education Loan", "hours_ago": 3.1}])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Loan Interest Rates Route
@sidebar_bp.route('/api/interest-rates', methods=['GET'])
def get_api_interest_rates():
    """Get current interest rates."""
    try:
        # Fetch rates from database if available
        if mongo.db:
            interest_rates = list(mongo.db.interest_rates.find({}, {'_id': 0}))
            if interest_rates:
                return jsonify(interest_rates)
        
        # Default rates if not found in database
        rates = [
            {"loan_type": "Home Loan", "min_rate": 6.7, "max_rate": 8.9},
            {"loan_type": "Personal Loan", "min_rate": 10.8, "max_rate": 18.5},
            {"loan_type": "Car Loan", "min_rate": 8.0, "max_rate": 12.0},
            {"loan_type": "Education Loan", "min_rate": 7.0, "max_rate": 15.0}
        ]
        return jsonify(rates)
    except Exception as e:
        print(f"Error fetching interest rates: {str(e)}")
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
        "Maintain a debt-to-income ratio below 40%\ for better loan approval chances.",
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
    if mongo.db:
        try:
            mongo.db.loan_queries.insert_one({
                "query": query,
                "loan_type": loan_type,
                "timestamp": datetime.utcnow()
            })
            return True
        except Exception as e:
            print(f"Error adding loan query: {str(e)}")
    return False
