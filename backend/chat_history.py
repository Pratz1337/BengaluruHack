from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_pymongo import PyMongo
import pymongo
import os
from dotenv import load_dotenv

load_dotenv()

chat_history_bp = Blueprint('chat_history', __name__)

def init_app(app):
    mongo_uri = os.getenv('MONGO_URI')
    if not mongo_uri:
        raise ValueError("MONGO_URI environment variable is not set")
        
    app.config["MONGO_URI"] = mongo_uri
    print("[DEBUG] Initializing MongoDB with URI:", app.config["MONGO_URI"])
    mongo.init_app(app)
    print("[DEBUG] MongoDB initialization complete")

mongo = PyMongo()

@chat_history_bp.route('/recent-queries', methods=['GET'])
def get_recent_queries():
    try:
        print("[DEBUG] /recent-queries called - fetching all public queries")
        
        # Get recent queries from MongoDB - from the public collection
        collection_name = "all_public_queries"
        print(f"[DEBUG] Fetching from collection: {collection_name}")
        
        recent_queries = list(
            mongo.db[collection_name].find(
                {},
                {'_id': 1, 'query': 1, 'loan_type': 1, 'timestamp': 1, 'user_id': 1}
            )
            .sort('timestamp', pymongo.DESCENDING)
            .limit(10)
        )
        
        print(f"[DEBUG] Found {len(recent_queries)} recent queries")
        
        # Format queries for response
        formatted_queries = []
        for query in recent_queries:
            formatted_queries.append({
                'id': str(query['_id']),
                'query': query['query'],
                'loan_type': query['loan_type'],
                'timestamp': query['timestamp'].isoformat(),
                'user_id': query.get('user_id', 'anonymous')  # Keep user_id for reference but it's optional
            })
            
        return jsonify(formatted_queries)
        
    except Exception as e:
        print(f"[DEBUG] Error fetching recent queries: {str(e)}")
        return jsonify([]), 500

@chat_history_bp.route('/save-chat', methods=['POST'])
def save_chat():
    try:
        print("[DEBUG] /save-chat endpoint called")
        data = request.json
        print(f"[DEBUG] Received data: {data}")
        
        # Validate required fields - only query is required now
        if not data.get('query'):
            print("[DEBUG] Error: Query is missing")
            return jsonify({'error': 'Query is required'}), 400
        
        # Create chat history entry - user_id is optional
        chat_entry = {
            'query': data['query'],
            'loan_type': data.get('loan_type', 'General'),
            'timestamp': datetime.fromisoformat(data['timestamp']) if data.get('timestamp') else datetime.utcnow(),
            'user_id': data.get('user_id', 'anonymous')  # Make user_id optional, default to 'anonymous'
        }
        print(f"[DEBUG] Created chat entry: {chat_entry}")
        
        # Save to MongoDB - single public collection
        collection_name = "all_public_queries"
        print(f"[DEBUG] Saving to collection: {collection_name}")
        
        result = mongo.db[collection_name].insert_one(chat_entry)
        print(f"[DEBUG] MongoDB insert successful, ID: {result.inserted_id}")
        
        return jsonify({
            'success': True,
            'id': str(result.inserted_id)
        })
        
    except Exception as e:
        print(f"[DEBUG] Error saving chat: {str(e)}")
        return jsonify({'error': str(e)}), 500
