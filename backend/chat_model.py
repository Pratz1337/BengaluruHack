import json
import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import StructuredOutputParser, ResponseSchema
from langchain.memory import ConversationBufferMemory
from langchain.chains import LLMChain
from langchain_core.tools import tool
from document_processor import DocumentProcessor
from vector_search import PineconeRAGPipeline
from confidence import get_confidence_score

# Load environment variables
load_dotenv()

# Get API keys from environment variables with error handling
def get_required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value

try:
    GROQ_API_KEY = get_required_env("GROQ_API_KEY")
    SARVAM_API_KEY = get_required_env("SARVAM_API_KEY")
    PINECONE_API_KEY = get_required_env("PINECONE_API_KEY")
except ValueError as e:
    print(f"Configuration error: {str(e)}")
    raise

# Initialize Pinecone RAG Pipeline
vector_search = PineconeRAGPipeline(
    pinecone_api_key=PINECONE_API_KEY,
    assistant_name="finmate-assistant"
)

# Initialize LLM
llm = ChatGroq(model="llama-3.2-90b-vision-preview", temperature=0.4, api_key=GROQ_API_KEY)

# Initialize document processor
document_processor = DocumentProcessor(SARVAM_API_KEY)

# Define memory for chat history
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

# **Tool Definitions**
loan_eligibility_schema = [
    ResponseSchema(name="loan_type", description="Type of loan being considered (e.g., home loan, car loan)"),
    ResponseSchema(name="income_requirement", description="Minimum income required for this loan"),
    ResponseSchema(name="credit_score", description="Minimum credit score needed"),
    ResponseSchema(name="employment_status", description="Required employment type (e.g., salaried, self-employed)"),
    ResponseSchema(name="eligibility_result", description="Final eligibility decision"),
]

loan_eligibility_parser = StructuredOutputParser.from_response_schemas(loan_eligibility_schema)

loan_eligibility_prompt = ChatPromptTemplate.from_template("""
You are a Loan Advisor AI. Help the user determine loan eligibility based on their financial details.

User Details:  
{user_info}

Response Format:  
{format_instructions}
""")

@tool("Loan Eligibility Check")
def check_loan_eligibility(user_info: str) -> dict:
    """Determine the user's loan eligibility based on financial details."""
    prompt_with_instructions = loan_eligibility_prompt.format(
        user_info=user_info,
        format_instructions=loan_eligibility_parser.get_format_instructions()
    )
    response = llm.invoke(prompt_with_instructions)
    try:
        return loan_eligibility_parser.parse(response.content)
    except Exception as e:
        return {"error": str(e)}

loan_application_schema = [
    ResponseSchema(name="required_documents", description="List of required documents for the loan application"),
    ResponseSchema(name="application_steps", description="Step-by-step guide on how to apply for the loan"),
    ResponseSchema(name="common_mistakes", description="Common mistakes to avoid when applying for a loan"),
]

loan_application_parser = StructuredOutputParser.from_response_schemas(loan_application_schema)

loan_application_prompt = ChatPromptTemplate.from_template("""
You are a Loan Advisor AI. Guide the user through the process of applying for a loan.

Loan Type: {loan_type}

Response Format:  
{format_instructions}
""")

@tool("Loan Application Guidance")
def guide_loan_application(loan_type: str) -> dict:
    """Guide users through the loan application process, including required documents and steps."""
    prompt_with_instructions = loan_application_prompt.format(
        loan_type=loan_type,
        format_instructions=loan_application_parser.get_format_instructions()
    )
    response = llm.invoke(prompt_with_instructions)
    try:
        return loan_application_parser.parse(response.content)
    except Exception as e:
        return {"error": str(e)}

financial_tips_schema = [
    ResponseSchema(name="saving_tips", description="Effective saving strategies"),
    ResponseSchema(name="credit_score_tips", description="How to improve and maintain a good credit score"),
    ResponseSchema(name="investment_advice", description="Basic investment strategies"),
]

financial_tips_parser = StructuredOutputParser.from_response_schemas(financial_tips_schema)

financial_tips_prompt = ChatPromptTemplate.from_template("""
You are a Financial Advisor AI. Provide financial literacy tips to the user.

User Interest: {topic}

Response Format:  
{format_instructions}
""")
@tool("Financial Literacy Tips")
def get_financial_tips(topic: str) -> dict:
    """Provide financial literacy tips, such as saving strategies or credit score improvement."""
    
    # Format the prompt with user input
    prompt_with_instructions = financial_tips_prompt.format(
        topic=topic,
        format_instructions=financial_tips_parser.get_format_instructions()
    )
    
    # Invoke the LLM with the formatted prompt
    response = llm.invoke(prompt_with_instructions)

    # Debugging: Print the raw response
    print("\n=== Raw LLM Response ===")
    print(response.content)
    print("=== End Raw Response ===\n")

    try:
        # Attempt to parse the response into structured JSON
        parsed_response = financial_tips_parser.parse(response.content)

        # Debugging: Print the parsed output
        print("\n=== Parsed Response ===")
        print(parsed_response)
        print("=== End Parsed Response ===\n")

        return parsed_response

    except Exception as e:
        # Debugging: Print error details if parsing fails
        print("\n!!! Parsing Error:", str(e))
        print("Response Content:", response.content)
        print("!!!\n")

        return {"error": f"Parsing Error: {str(e)}"}

financial_goal_schema = [
    ResponseSchema(name="goal", description="The financial goal set by the user"),
    ResponseSchema(name="current_status", description="Current financial status in relation to the goal"),
    ResponseSchema(name="progress_percentage", description="Progress towards the goal in percentage"),
    ResponseSchema(name="next_steps", description="Recommended next steps to achieve the goal"),
    ResponseSchema(name="loan_advice", description="Loan-related advice tailored to the user's goal"),
    ResponseSchema(name="next_due_date", description="Reminder for the next loan payment due date"),
    ResponseSchema(name="refinancing_guidance", description="Guidance on refinancing options if applicable"),
]

financial_goal_parser = StructuredOutputParser.from_response_schemas(financial_goal_schema)

financial_goal_prompt = ChatPromptTemplate.from_template("""
You are a Financial Goal Advisor AI. Help the user track their financial goals and progress.

User's Financial Goal: {goal}  
Current Status: {status}

Response Format:  
{format_instructions}
""")

@tool("Financial Goal Tracking")
def track_financial_goal(goal: str, status: str) -> dict:
    """Help users track financial goals, offer loan advice, and remind them of loan due dates."""
    prompt_with_instructions = financial_goal_prompt.format(
        goal=goal,
        status=status,
        format_instructions=financial_goal_parser.get_format_instructions()
    )
    response = llm.invoke(prompt_with_instructions)
    try:
        return financial_goal_parser.parse(response.content)
    except Exception as e:
        return {"error": str(e)}

# **Tools Dictionary**
tools = {
    "Loan Eligibility Check": check_loan_eligibility,
    "Loan Application Guidance": guide_loan_application,
    "Financial Literacy Tips": get_financial_tips,
    "Financial Goal Tracking": track_financial_goal
}

# Define Response Schema for Main FinMate Output
response_schemas = [
    ResponseSchema(name="result", description="Final response to the user's loan-related query"),
    ResponseSchema(name="loan_type", description="Type of loan discussed"),
    ResponseSchema(name="interest_rate", description="Applicable interest rate"),
    ResponseSchema(name="eligibility", description="Eligibility criteria for the loan"),
    ResponseSchema(name="repayment_options", description="Available repayment options"),
    ResponseSchema(name="additional_info", description="Any extra information relevant to the loan"),
    ResponseSchema(name="tool_call", description="Whether a tool call is needed and which tool to use"),
    ResponseSchema(name="tool_parameters", description="Parameters to pass to the tool if needed"),
]

# Structured Output Parser for main output
output_parser = StructuredOutputParser.from_response_schemas(response_schemas)

# Enhanced Loan Advisory Prompt Template with document context and tool awareness
loan_prompt = ChatPromptTemplate.from_template("""
You are a Loan Advisor AI named "FinMate". Your job is to assist users with loan-related queries.
  
    *Guidelines:*
    - Answer *only* questions related to *loans, interest rates, eligibility,"Financial Literacy Tips", repayment plans, and financial advice*.
    - Do *NOT* discuss non-loan-related topics.
    - Always provide *concise, structured, and accurate* financial guidance.
    - If the question is *not about loans*, respond with: "I specialize in loan advisory. How can I assist with your loan needs?"
    - Always provide your response in *structured JSON format*.
     If the query is about *loans*, provide direct answers using available tools.
- If the query is about *financial literacy*, use the "Financial Literacy Tips" tool.
- If uncertain, ask clarifying questions instead of rejecting the request.

*Chat History:*  
{chat_history}

*Document Context:*
{document_context}

                                                   ## **Introduction**
Welcome to "FinMate," a specialized AI-based loan advisor built to provide detailed financial advice related to loan eligibility, interest rates, repayment plans, and loan application processes. Your purpose is to assist users efficiently and professionally by delivering structured responses in a clear and concise manner.

You are expected to:
- Provide factually correct, up-to-date financial advice.
- Respond in the language the user chooses at the beginning of the conversation.
- Offer consistent and professional communication at all times.
- If you cannot answer a question directly, attempt to gather additional information through follow-up questions.

---
                                               ## **1. Scope of Responses**
You are strictly programmed to answer queries related to financial and loan-related topics. The following areas are within your scope:
- **Loan Types**:
    - Home loans
    - Personal loans
    - Education loans
    - Business loans
    - Car loans
    - Gold loans
    - Mortgage loans
    - Debt consolidation loans
    - Credit card loans
- **Interest Rates**:
    - Fixed vs. floating interest rates
    - Annual percentage rates (APR)
    - Impact of credit score on interest rates
    - Central bank rate influence on loans
- **Loan Eligibility**:
    - Minimum income requirements
    - Age and employment criteria
    - Credit score thresholds
    - Co-applicant and guarantor guidelines
- **Repayment Options**:
    - Monthly EMIs
    - Step-up repayment plans
    - Bullet payments
    - Loan restructuring options
- **Financial Literacy TIPS**:
    - Credit score improvement tips
    - Budgeting strategies
    - Debt management
    - Financial planning
    - If the user asks about *saving strategies, credit scores, investment advice, or general money management*, call:
  - "tool_call": "Financial Literacy Tips"
  - "tool_parameters": "topic": "user's query" 
                                         

---

### **1.1. Out-of-Scope Queries**
If a user asks a question outside the defined scope, respond with:

> "I specialize in loan advisory. How can I assist with your loan needs?"

Example:
- **User:** "What is the best stock to buy right now?"
- **Response:**  
    `"I specialize in loan advisory. How can I assist with your loan needs?"`

---

## **2. Language Support**
- FinMate must understand and respond in **multiple languages**, including:  
    - English  
    - Hindi  
    - Tamil  
    - Telugu  
    - Bengali  
    - Marathi  
    - Kannada  
    - Malayalam  
    - Gujarati  

- If the user starts the conversation in one language, maintain consistency in that language unless the user explicitly switches languages.

**Example:**  
- **User:** "मुझे होम लोन के लिए ब्याज दर के बारे में बताएं।"  
- **Response:** "होम लोन के लिए ब्याज दरें आमतौर पर 6.5% से 8.5% तक होती हैं।"  

---

## **3. Data Source and Retrieval**
1. FinMate has access to a central financial database.
2. Use the "FETCH DATABASE" tool to retrieve the latest data on:  
   - Current loan offerings  
   - Interest rate structures  
   - Eligibility requirements  
   - Repayment options  
3. If data retrieval fails, state the following:  
   `"I am unable to retrieve the latest information at the moment. Please check with your bank for more details."`

---

## **4. Structured and Concise Responses**
### **4.1. Formatting Guidelines**
- Keep responses **under 500 words** unless detailed clarification is required.
- Present information using:
    - **Markdown** for clarity
    - **Numbering** for steps and instructions
    - **Bullet points** for lists
    - **Bold text** for important information

### **4.2. Example Formatting:**
**User:** "What are the eligibility criteria for a home loan?"  
**Response:**  
**Eligibility Criteria for Home Loans:**  
1. **Minimum Income:** ₹30,000 per month  
2. **Age Requirement:** 21 to 65 years  
3. **Credit Score:** Minimum 700  
4. **Employment:** Must have stable income for the past two years  

---

## **5. Complex Queries Handling**
### **5.1. Asking Follow-Up Questions**
If the query is unclear or involves multiple data points, ask follow-up questions to narrow down the response:

**Example:**  
**User:** "Tell me about car loans."  
**Follow-Up:**  
*"Do you want to know about car loan eligibility, interest rates, or repayment options?"*

### **5.2. Handling Conflicting Information**
- If the data source provides conflicting information:
    - Present the information with a disclaimer:
      > "Data may vary across financial institutions. Please confirm with your bank for accuracy."

---

## **6. Data Privacy and Security**
1. Do NOT request or store sensitive information like:
    - Bank account numbers  
    - Credit card details  
    - Aadhaar or PAN numbers  
2. Ensure that all conversations are encrypted and secure.
3. If the user shares personal information, respond with:
    `"For your security, please avoid sharing sensitive information."`

---

## **7. User Experience and Tone**
- Maintain a **professional, friendly, and polite** tone.
- Avoid financial jargon; explain in simple terms.  
- If the user becomes aggressive or rude, remain calm and professional.  

**Example:**  
- **User:** "Why is the interest rate so high?"  
- **Response:**  
*"Interest rates are influenced by several factors, including your credit score and market conditions. Let me help you explore lower-interest options."*  

---

## **8. Continuous Availability**
- Remind users that FinMate is available **24/7**.  
- If the user returns after a long period, acknowledge the gap and continue smoothly.

---

## **9. Available Tools**
You have access to several specialized tools that can help provide better responses:

1. **Loan Eligibility Check**: Use this when users ask about their eligibility for specific loans based on their financial details.
2. **Loan Application Guidance**: Use this when users need help applying for a loan, want to know required documents, or application steps.
3. **Financial Literacy Tips**: Use this when users ask for advice on financial management, saving strategies, or improving credit scores.
4. **Financial Goal Tracking**: Use this when users want to track progress toward financial goals or need planning advice.

To use a tool, specify in your response that a tool call is needed:
- For "tool_call" field: Indicate which tool to use (e.g., "Loan Eligibility Check")
- For "tool_parameters" field: Provide the necessary parameters as a JSON-like structure

---

## **10. Fallback for Missing Data**
- Before stating that you lack information:
    - Try fetching data again.
    - Analyze available data to construct a reasonable response.
- If you still cannot find the information:
    `"I'm unable to retrieve the latest data. Please consult your bank for more details."`


*User Query:* {msg}

    KEY POINTS:
    1. Language: You can understand queries in English and many other Indic Languages, but always respond in the language chosen by the user at the start of the conversation.
    2. Scope: You only provide information about loans, interest rates, eligibility, repayment plans, and financial advice.
    3. User Experience: Be polite, patient, and thorough in your responses. Use markdown, numbering, and bolding where appropriate to present information clearly.
    4. Complex Queries: If a query is too complex or outside your knowledge base, politely suggest contacting the specific bank or financial institution for more information.
    5. Data Privacy: Do not share or ask for personal information.
    6. Continuous Availability: Remind users that you're available 24/7 for their queries
    7. When a lot of data is available for the same question then ask follow up questions from the user based on the information you have from tools to pin point the exact information the user is asking for
    8. For complex queries before saying you don't have the information try going back and looking at your data available and try making an answer using that 
    9. TOOL USAGE: Determine if any of your specialized tools can provide a better response. If so, include the tool name in "tool_call" field and required parameters in "tool_parameters".
    10. GREETING MESSAGES: For simple greetings, introduction, or non-specific questions, do not use tools - just provide a friendly response.
    
    PLEASE USE MARKDOWN WHERE NECESSARY TO MAKE THE TEXT LOOK AS FORMATTED AND STRUCTURED AS POSSIBLE. Try breaking up larger paragraphs into smaller ones or points
    TRY TO KEEP YOUR REPLIES SHORT AND TO THE POINT AS POSSIBLE

*Response Format:*
{format_instructions}
""")

# Create LangChain with Memory
chain = LLMChain(
    llm=llm,
    prompt=loan_prompt,
    memory=memory
)

def extract_loan_info(msg, document_context=""):
    """
    Extracts loan-related information using LangChain's memory and document context.
    Prioritizes vector search results as the main context.
    Returns both extracted info and the combined context.
    """
    # Get relevant context from vector search
    vector_context = ""
    try:
        vector_response = vector_search.query_assistant(msg, verbose=False)
        if (vector_response and 'message' in vector_response and 
            vector_response['message'].get('content')):
            vector_context = vector_response['message']['content']
            print("\n=== VECTOR SEARCH CONTEXT ADDED ===")
            print(vector_context)
            print("=== END VECTOR SEARCH CONTEXT ===\n")
    except Exception as e:
        print(f"Vector search error: {str(e)}")
        vector_context = ""

    # Prioritize vector search results, only add document context if no vector results
    if vector_context:
        combined_context = vector_context
        if document_context:
            print("\n=== ADDITIONAL DOCUMENT CONTEXT ===")
            print(document_context)
            print("=== END ADDITIONAL CONTEXT ===\n")
            combined_context += f"\n\nAdditional Context:\n{document_context}"
    else:
        combined_context = document_context
        print("\n=== USING DOCUMENT CONTEXT ONLY ===")
        print(document_context)
        print("=== END DOCUMENT CONTEXT ===\n")

    prompt_with_instructions = loan_prompt.format(
        msg=msg,
        chat_history=memory.load_memory_variables({})["chat_history"],
        document_context=combined_context,
        format_instructions=output_parser.get_format_instructions()
    )

    # Get structured response from LLM
    response = llm.invoke(prompt_with_instructions)

    print("\n=== RAW LLM RESPONSE ===")
    print(response.content)
    print("=== END RAW RESPONSE ===\n")

    # Parse JSON output
    try:
        extracted_info = output_parser.parse(response.content)
    except Exception as e:
        print("Error parsing response:", str(e))
        extracted_info = {schema.name: "" for schema in response_schemas}
        extracted_info["result"] = "I apologize, but I couldn't process your request properly. Could you please rephrase your question?"

    return {"extracted_info": extracted_info, "context": combined_context}

def execute_tool_call(tool_name, tool_params):
    """
    Execute the appropriate tool dynamically based on the LLM's decision.
    
    Args:
        tool_name: Name of the tool to call
        tool_params: Parameters to pass to the tool (dictionary)
    
    Returns:
        Tool execution results or error message
    """
    if tool_name in tools:
        tool_func = tools[tool_name]
        try:
            # Pass tool_params as keyword arguments to the tool function
            return tool_func(**tool_params)
        except TypeError as e:
            print(f"Invalid parameters for {tool_name}: {str(e)}")
            return {"error": f"Invalid parameters for {tool_name}: {str(e)}"}
    else:
        print(f"Unknown tool: {tool_name}")
        return {"error": f"Unknown tool: {tool_name}"}

def ChatModel(msg, document_context):
    """
    Processes the user query and provides loan-related information while maintaining chat history.
    Uses dynamic tool calling and generic tool result integration.
    Includes a confidence score for the response.
    """
    result = extract_loan_info(msg, document_context)
    extracted_info = result["extracted_info"]
    combined_context = result["context"]
    
    # Check if we need to make a tool call
    tool_call_needed = extracted_info.get("tool_call", "")
    tool_parameters = extracted_info.get("tool_parameters", {})
    
    tool_result = {}
    if tool_call_needed and tool_call_needed.strip():
        print(f"Tool call detected: {tool_call_needed}")
        try:
            if isinstance(tool_parameters, str):
                try:
                    tool_parameters = json.loads(tool_parameters)
                except:
                    tool_parameters = {}
            
            tool_result = execute_tool_call(tool_call_needed, tool_parameters)
            print(f"Tool result: {tool_result}")
            
            if isinstance(tool_result, dict) and "error" not in tool_result:
                tool_output_str = json.dumps(tool_result, indent=2)
                extracted_info["additional_info"] = (
                    extracted_info.get("additional_info", "") +
                    f"\n\n**Detailed Information from {tool_call_needed}:**\n```json\n{tool_output_str}\n```"
                )
            else:
                extracted_info["additional_info"] = (
                    extracted_info.get("additional_info", "") +
                    "\nNote: Could not retrieve detailed information from the tool."
                )
        except Exception as e:
            print(f"Error in tool execution: {str(e)}")
            extracted_info["additional_info"] = (
                extracted_info.get("additional_info", "") +
                "\nNote: An error occurred while retrieving detailed information."
            )
    
    # Save to memory
    memory.save_context({"input": msg}, {"output": extracted_info["result"]})
    
    # Format the final response
    formatted_response = ""
    if extracted_info.get("result"):
        formatted_response += f"{extracted_info['result']}\n\n"
    if extracted_info.get("loan_type"):
        formatted_response += f"**Loan Type:** {extracted_info['loan_type']}\n\n"
    if extracted_info.get("interest_rate"):
        formatted_response += f"**Interest Rate:** {extracted_info['interest_rate']}\n\n"
    if extracted_info.get("eligibility"):
        formatted_response += f"**Eligibility:** {extracted_info['eligibility']}\n\n"
    if extracted_info.get("repayment_options"):
        formatted_response += f"**Repayment Options:** {extracted_info['repayment_options']}\n\n"
    if extracted_info.get("additional_info"):
        formatted_response += f"**Additional Information:**\n{extracted_info['additional_info']}"
    
    if not formatted_response.strip():
        formatted_response = extracted_info.get("result") or "I couldn't process your request."
    
    # Compute confidence score
    confidence_score = get_confidence_score(msg, combined_context, formatted_response)
    print(f"Confidence Score: {confidence_score}")
    return {
        "res": {
            "msg": formatted_response,
            "confidence": confidence_score
        },
        "info": extracted_info
    }