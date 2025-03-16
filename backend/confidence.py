import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import StructuredOutputParser, ResponseSchema

# Load environment variables
load_dotenv()

def get_required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value

try:
    GROQ_API_KEY = get_required_env("GROQ_API_KEY")
except ValueError as e:
    print(f"Configuration error: {str(e)}")
    raise

# Define response schema for structured output
confidence_schema = [
    ResponseSchema(name="confidence_score", description="Confidence score out of 100")
]
confidence_parser = StructuredOutputParser.from_response_schemas(confidence_schema)

# Define the prompt template for confidence evaluation
confidence_prompt = ChatPromptTemplate.from_template("""
You are a confidence evaluator for a loan advisory AI. Your task is to assess the accuracy and reliability of the AI's response based on the user's query, the provided context, and the generated response.

Evaluate the following aspects:
1. **Relevance**: How well does the context match the user's query?
2. **Consistency**: Does the response align with the provided context?
3. **Specificity**: Is the response detailed and specific?
4. **Completeness**: Does the response address all parts of the user's query?
5. **Language and Tone**: Is the response in the correct language and tone?

Based on these factors, provide a confidence score out of 100, where 100 is the highest confidence.

**User's Query**: {user_query}

**Context**: {context}

**Generated Response**: {response}

{format_instructions}
""")

# Initialize the ChatGroq model for confidence evaluation
confidence_llm = ChatGroq(
    model="llama-3.2-90b-vision-preview",
    temperature=0.2,  # Lower temperature for more deterministic output
    api_key=GROQ_API_KEY
)

def get_confidence_score(user_query: str, context: str, response: str) -> int:
    """
    Compute the confidence score for the given response based on the user's query and context.
    
    Args:
        user_query (str): The user's original query
        context (str): The context retrieved from the vector database
        response (str): The generated response to evaluate
    
    Returns:
        int: Confidence score between 0 and 100
    """
    prompt_with_instructions = confidence_prompt.format(
        user_query=user_query,
        context=context,
        response=response,
        format_instructions=confidence_parser.get_format_instructions()
    )
    
    llm_response = confidence_llm.invoke(prompt_with_instructions)
    
    try:
        parsed_response = confidence_parser.parse(llm_response.content)
        return int(parsed_response["confidence_score"])
    except Exception as e:
        print(f"Error parsing confidence score: {str(e)}")
        return 50  # Default to 50 if parsing fails