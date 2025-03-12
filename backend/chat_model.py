import os
from langchain_groq import ChatGroq
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import StructuredOutputParser, ResponseSchema
from langchain.memory import ConversationBufferMemory
from langchain.agents import initialize_agent, Tool
from langchain.agents import AgentType

# Load API Key
GROQ_API_KEY = "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"

# Initialize LLM
llm = ChatGroq(model="llama-3.2-90b-vision-preview", temperature=0.4, api_key=GROQ_API_KEY)

# Define Memory for Conversation History
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

# =============================== #
# 🔹 TOOL 1: LOAN ELIGIBILITY CHECK
# =============================== #
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


# =============================== #
# 🔹 TOOL 2: LOAN APPLICATION GUIDANCE
# =============================== #
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


# =============================== #
# 🔹 TOOL 3: FINANCIAL LITERACY TIPS
# =============================== #
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


def get_financial_tips(topic: str) -> dict:
    """Provide financial literacy tips, such as saving strategies or credit score improvement."""
    prompt_with_instructions = financial_tips_prompt.format(
        topic=topic,
        format_instructions=financial_tips_parser.get_format_instructions()
    )
    response = llm.invoke(prompt_with_instructions)

    try:
        return financial_tips_parser.parse(response.content)
    except Exception as e:
        return {"error": str(e)}


# =============================== #
# 🔹 TOOL 4: FINANCIAL GOAL TRACKING
# =============================== #

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


# =============================== #
# 🔹 INTEGRATED CHATBOT WITH TOOLS
# =============================== #

# Define tools for the chatbot agent
tools = [
    Tool(name="Loan Eligibility Check", func=check_loan_eligibility, description="Check loan eligibility based on financial details."),
    Tool(name="Loan Application Guidance", func=guide_loan_application, description="Guide on loan application process."),
    Tool(name="Financial Literacy Tips", func=get_financial_tips, description="Provide financial literacy and investment tips."),
    Tool(name="Financial Goal Tracking", func=track_financial_goal, description="Track financial goals and loan payments."),
]

# Create an agent that can call these tools
agent = initialize_agent(
    tools=tools,
    llm=llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True,
    memory=memory,
)

# Start chatbot interaction
def chatbot():
    print("\n🤖 Financial AI Chatbot: How can I assist you today?")
    while True:
        user_input = input("\nYou: ")
        if user_input.lower() in ["exit", "quit"]:
            print("👋 Goodbye! Have a great day!")
            break
        
        response = agent.run(user_input)
        print("\n💬 AI:", response)


# Run chatbot if script is executed directly
if __name__ == "__main__":
    chatbot()
