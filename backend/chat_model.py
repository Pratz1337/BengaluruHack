import json
import os
from langchain_groq import ChatGroq
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import StructuredOutputParser, ResponseSchema
from langchain.memory import ConversationBufferMemory
from langchain.chains import LLMChain
from langchain_core.tools import tool
from document_processor import DocumentProcessor

# Load environment variables securely
GROQ_API_KEY = "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"
SARVAM_API_KEY = "b7e1c4f0-4c19-4d34-8d2f-6aea1990bdbf"  # Your Sarvam API key

# Initialize LLM
llm = ChatGroq(model="llama-3.2-90b-vision-preview", temperature=0.4, api_key=GROQ_API_KEY)

# Initialize document processor
document_processor = DocumentProcessor(SARVAM_API_KEY)

# Define memory for chat history
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

# --- Response Schemas ---
loan_eligibility_schema = [
    ResponseSchema(name="loan_type", description="Type of loan being considered (e.g., home loan, car loan)"),
    ResponseSchema(name="income_requirement", description="Minimum income required for this loan"),
    ResponseSchema(name="credit_score", description="Minimum credit score needed"),
    ResponseSchema(name="employment_status", description="Required employment type (e.g., salaried, self-employed)"),
    ResponseSchema(name="eligibility_result", description="Final eligibility decision"),
]

loan_application_schema = [
    ResponseSchema(name="required_documents", description="List of required documents for the loan application"),
    ResponseSchema(name="application_steps", description="Step-by-step guide on how to apply for the loan"),
    ResponseSchema(name="common_mistakes", description="Common mistakes to avoid when applying for a loan"),
]

financial_tips_schema = [
    ResponseSchema(name="saving_tips", description="Effective saving strategies"),
    ResponseSchema(name="credit_score_tips", description="How to improve and maintain a good credit score"),
    ResponseSchema(name="investment_advice", description="Basic investment strategies"),
]

financial_goal_schema = [
    ResponseSchema(name="goal", description="The financial goal set by the user"),
    ResponseSchema(name="current_status", description="Current financial status in relation to the goal"),
    ResponseSchema(name="progress_percentage", description="Progress towards the goal in percentage"),
    ResponseSchema(name="next_steps", description="Recommended next steps to achieve the goal"),
    ResponseSchema(name="loan_advice", description="Loan-related advice tailored to the user's goal"),
    ResponseSchema(name="next_due_date", description="Reminder for the next loan payment due date"),
    ResponseSchema(name="refinancing_guidance", description="Guidance on refinancing options if applicable"),
]

# --- Tool Definitions ---
@tool("Loan Eligibility Check")
def check_loan_eligibility(user_info: str) -> dict:
    """Determine the user's loan eligibility based on financial details."""
    prompt_with_instructions = ChatPromptTemplate.from_template("""
    Analyze user financial details: {user_info}
    {format_instructions}
    """).format(
        user_info=user_info,
        format_instructions=StructuredOutputParser.from_response_schemas(loan_eligibility_schema).get_format_instructions()
    )
    response = llm.invoke(prompt_with_instructions)
    print(response.content)
    return StructuredOutputParser.from_response_schemas(loan_eligibility_schema).parse(response.content)

@tool("Loan Application Guidance")
def guide_loan_application(loan_type: str) -> dict:
    """Guide users through the loan application process."""
    prompt_with_instructions = ChatPromptTemplate.from_template("""
    Provide guidance for {loan_type} application:
    {format_instructions}
    """).format(
        loan_type=loan_type,
        format_instructions=StructuredOutputParser.from_response_schemas(loan_application_schema).get_format_instructions()
    )
    response = llm.invoke(prompt_with_instructions)
    return StructuredOutputParser.from_response_schemas(loan_application_schema).parse(response.content)

@tool("Financial Literacy Tips")
def get_financial_tips(topic: str) -> dict:
    """Provide financial literacy tips."""
    prompt_with_instructions = ChatPromptTemplate.from_template("""
    Provide financial tips about {topic}:
    {format_instructions}
    """).format(
        topic=topic,
        format_instructions=StructuredOutputParser.from_response_schemas(financial_tips_schema).get_format_instructions()
    )
    response = llm.invoke(prompt_with_instructions)
    return StructuredOutputParser.from_response_schemas(financial_tips_schema).parse(response.content)

@tool("Financial Goal Tracking")
def track_financial_goal(goal: str, status: str) -> dict:
    """Track financial goals and provide advice."""
    prompt_with_instructions = ChatPromptTemplate.from_template("""
    Track financial goal: {goal}
    Current status: {status}
    {format_instructions}
    """).format(
        goal=goal,
        status=status,
        format_instructions=StructuredOutputParser.from_response_schemas(financial_goal_schema).get_format_instructions()
    )
    response = llm.invoke(prompt_with_instructions)
    return StructuredOutputParser.from_response_schemas(financial_goal_schema).parse(response.content)

# --- Dynamic Tool Registry ---
TOOL_REGISTRY = {
    "Loan Eligibility Check": {
        "function": check_loan_eligibility,
        "param_mapping": {
            "user_info": "Extract financial details like income, credit score, employment status"
        }
    },
    "Loan Application Guidance": {
        "function": guide_loan_application,
        "param_mapping": {
            "loan_type": "Identify loan type from user query or previous context"
        }
    },
    "Financial Literacy Tips": {
        "function": get_financial_tips,
        "param_mapping": {
            "topic": "Detect financial topic from query (saving, credit, investments)"
        }
    },
    "Financial Goal Tracking": {
        "function": track_financial_goal,
        "param_mapping": {
            "goal": "Extract financial goal from user message",
            "status": "Infer current status from chat history or ask follow-up"
        }
    }
}

# --- Main Response Schema ---
response_schemas = [
    ResponseSchema(name="result", description="Final response to the user's query"),
    ResponseSchema(name="loan_type", description="Type of loan discussed"),
    ResponseSchema(name="interest_rate", description="Applicable interest rate"),
    ResponseSchema(name="eligibility", description="Eligibility criteria"),
    ResponseSchema(name="repayment_options", description="Repayment options"),
    ResponseSchema(name="additional_info", description="Extra information"),
    ResponseSchema(name="tool_call", description="Which tool to use if needed"),
    ResponseSchema(name="tool_parameters", description="Parameters for the tool"),
    ResponseSchema(name="needs_clarification", description="Clarification questions needed", type="list"),
    ResponseSchema(name="confidence_score", description="Confidence in tool selection 0-1", type="float"),
]

output_parser = StructuredOutputParser.from_response_schemas(response_schemas)

# --- Enhanced Prompt Template ---
loan_prompt = ChatPromptTemplate.from_template("""
You are a Loan Advisor AI named "FinMate". Assist with loan-related queries only.

*Guidelines:*
- Answer only loan-related questions
- Maintain professional tone
- Support multiple languages
- Use tools when confident (confidence_score > 0.7)
- Ask clarification when unsure

*Available Tools:*
{tool_list}

*Tool Selection Guidelines:*
1. Eligibility Check: Look for income, credit score, employment details
2. Application Guidance: Mentions of "apply", "documents", "process"
3. Financial Tips: Requests for savings/credit advice
4. Goal Tracking: References to financial targets/progress

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
- **Financial Literacy**:
    - Credit score improvement tips
    - Budgeting strategies
    - Debt management
    - Financial planning

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

# --- Core Processing Logic ---
chain = LLMChain(llm=llm, prompt=loan_prompt, memory=memory)

def extract_loan_info(msg, document_context=""):
    """Process query with dynamic context handling."""
    enhanced_context = f"Tools Available: {', '.join(TOOL_REGISTRY.keys())}\n{document_context}"
    
    prompt = loan_prompt.format(
        msg=msg,
        chat_history=memory.load_memory_variables({})["chat_history"],
        document_context=enhanced_context,
        format_instructions=output_parser.get_format_instructions(),
        tool_list=list(TOOL_REGISTRY.keys())
    )

    response = llm.invoke(prompt)
    print("Raw LLM Response:", response.content)

    
    try:
        return output_parser.parse(response.content)
    except Exception as e:
        print(f"Parsing Error: {str(e)}")
        return {schema.name: "" for schema in response_schemas}

def execute_tool_call(tool_name, tool_params):
    """Dynamic tool execution with parameter validation."""
    if tool_name not in TOOL_REGISTRY:
        return {"error": f"Tool {tool_name} not registered"}
    
    tool_config = TOOL_REGISTRY[tool_name]
    validated_params = {}
    
    for param, guidance in tool_config["param_mapping"].items():
        if param not in tool_params:
            param_prompt = f"""Extract {param} from: {tool_params}
            Guidance: {guidance}
            Return ONLY the value."""
            extracted = llm.invoke(param_prompt).content.strip('"')
            validated_params[param] = extracted
        else:
            validated_params[param] = tool_params[param]
    
    return tool_config["function"](**validated_params)

def ChatModel(msg, document_context):
    """Enhanced chat model with dynamic tool handling."""
    extracted_info = extract_loan_info(msg, document_context)
    
    # Handle clarification requests first
    if extracted_info.get("needs_clarification"):
        return {
            "res": {"msg": "\n".join(extracted_info["needs_clarification"])},
            "info": extracted_info
        }
    
    # Process tool calls when confident
    tool_result = {}
    if extracted_info.get("confidence_score", 0) > 0.7 and extracted_info.get("tool_call"):
        tool_name = extracted_info["tool_call"]
        tool_params = extracted_info.get("tool_parameters", {})
        
        if isinstance(tool_params, str):
            param_prompt = f"""Extract JSON parameters for {tool_name} from:
            Query: {msg}
            Expected Parameters: {TOOL_REGISTRY.get(tool_name, {}).get('param_mapping', {})}
            """
            tool_params = json.loads(llm.invoke(param_prompt).content)
        
        tool_result = execute_tool_call(tool_name, tool_params)
        print(tool_result)
        
        # Merge tool results with response
        if "error" not in tool_result:
            extracted_info["additional_info"] = "\n".join(
                [f"**{k}:** {v}" for k,v in tool_result.items()]
            )
    
    # Format final response
    memory.save_context({"input": msg}, {"output": extracted_info["result"]})
    
    response_parts = []
    for field in ["result", "loan_type", "interest_rate", "eligibility", "repayment_options"]:
        if extracted_info.get(field):
            response_parts.append(f"**{field.title()}:** {extracted_info[field]}")
    
    if extracted_info.get("additional_info"):
        response_parts.append(f"**Additional Info:**\n{extracted_info['additional_info']}")
    print(response_parts)
    return {
        "res": {"msg": "\n\n".join(response_parts)},
        "info": extracted_info
    }