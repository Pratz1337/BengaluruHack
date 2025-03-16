import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ToolIndex:
    def __init__(self):
        self.tools = {}
        self.tool_descriptions = {}
        self.intent_patterns = {}
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self.doc_vectors = None
        self.initialized = False
        
    def add_tool(self, name, func, description, intent_patterns=None):
        """
        Register a tool with its description and intent patterns
        """
        self.tools[name] = func
        self.tool_descriptions[name] = description
        
        if intent_patterns:
            self.intent_patterns[name] = intent_patterns
        else:
            # Default intent patterns based on name
            self.intent_patterns[name] = [name.lower().replace("_", " ")]
        
    def build_index(self):
        """
        Build the vector index of tools for similarity matching
        """
        # Combine all descriptions and intent patterns for vectorization
        docs = []
        self.tool_names = []
        
        for name, desc in self.tool_descriptions.items():
            # Add the tool description
            docs.append(desc)
            self.tool_names.append(name)
            
            # Add each intent pattern as a separate document
            for pattern in self.intent_patterns.get(name, []):
                docs.append(pattern)
                self.tool_names.append(name)
        
        if not docs:
            logger.warning("No tools registered for indexing")
            return
            
        # Create document vectors
        try:
            self.doc_matrix = self.vectorizer.fit_transform(docs)
            self.initialized = True
            logger.info(f"Successfully built index for {len(self.tools)} tools")
        except Exception as e:
            logger.error(f"Error building tool index: {e}")
    
    def match_intent(self, query, threshold=0.2):
        """
        Match user query to the most appropriate tool
        
        Args:
            query: User's query text
            threshold: Minimum similarity score to consider a match
            
        Returns:
            tuple: (tool_name, similarity_score) or (None, 0) if no match
        """
        if not self.initialized:
            logger.warning("Tool index not initialized, can't match intent")
            return None, 0
            
        try:
            # Vectorize the query
            query_vec = self.vectorizer.transform([query])
            
            # Calculate similarity with all documents
            similarities = cosine_similarity(query_vec, self.doc_matrix)[0]
            
            # Find the best match
            max_idx = np.argmax(similarities)
            max_score = similarities[max_idx]
            
            # Check if the score exceeds the threshold
            if max_score >= threshold:
                tool_name = self.tool_names[max_idx]
                logger.info(f"Matched intent: {tool_name} with score {max_score:.4f}")
                return tool_name, max_score
            else:
                logger.info(f"No intent matched above threshold {threshold} (max: {max_score:.4f})")
                return None, max_score
                
        except Exception as e:
            logger.error(f"Error matching intent: {e}")
            return None, 0
            
    def get_tool_function(self, tool_name):
        """Get the tool function by name"""
        return self.tools.get(tool_name)