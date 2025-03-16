import os
from flask import Blueprint, request, jsonify
from flask_pymongo import PyMongo
from pymongo.errors import ConnectionFailure
from datetime import datetime, timedelta
from bson import ObjectId
from langchain_groq import ChatGroq
from pinecone import Pinecone

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
    'mongodb+srv://kamalkarteek1:rvZSeyVHhgOd2fbE@gbh.iliw2.mongodb.net/'  # Update with your actual URI
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

# Initialize Pinecone
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "pcsk_a3nGH_2C5f2D2Nd1uNb6GVSDSer3SaaJFXZZKzaHjxhmXHjwnx2SNm5ScYs8udYHfudoP")
pinecone = Pinecone(api_key=PINECONE_API_KEY)

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
