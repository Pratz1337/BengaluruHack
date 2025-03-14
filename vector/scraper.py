import requests
from langchain.document_loaders import WebBaseLoader
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from pymongo import MongoClient

# MongoDB Connection
MONGO_URI = "mongodb+srv://kamalkarteek1:rvZSeyVHhgOd2fbE@gbh.iliw2.mongodb.net/"
client = MongoClient(MONGO_URI)
db = client['LoanDataDB']

# Collections for loan-related data
interest_rates_col = db['InterestRates']
eligibility_col = db['EligibilityCriteria']
loan_amounts_col = db['LoanAmounts']
processing_fees_col = db['ProcessingFees']
repayment_terms_col = db['RepaymentTerms']

# List of websites to scrape
websites = [
    "https://www.bankbazaar.com/personal-loan-interest-rate.html",
    "https://www.paisabazaar.com/personal-loan/eligibility-calculator/",
    "https://www.icicibank.com/personal-banking/loans/personal-loan/eligibility",
    "https://www.hdfcbank.com/personal/tools-and-calculators/personal-loan-calculator"
]

# Initialize LLM for LangChain processing
llm = ChatOpenAI(model="gpt-4", temperature=0.3, openai_api_key="YOUR_OPENAI_API_KEY")

# LangChain Prompt for Extracting Loan Data
prompt_template = PromptTemplate(
    input_variables=["text"],
    template="""
    Extract the following loan-related details from the given website text:
    
    - Loan Interest Rates
    - Eligibility Criteria (Income, credit score, employment type, age)
    - Loan Amounts (Minimum and Maximum)
    - Processing Fees
    - Repayment Terms (EMI breakdown, loan tenure)

    Extracted Information:
    {text}
    """
)

loan_data_chain = LLMChain(llm=llm, prompt=prompt_template)

# Function to scrape and extract loan-related data
def scrape_and_store(url):
    print(f"Scraping {url}...")

    # Load web page content using LangChain's WebBaseLoader
    loader = WebBaseLoader(url)
    documents = loader.load()

    if not documents:
        print(f"Failed to load {url}")
        return

    page_content = documents[0].page_content  # Extract raw text from page
    structured_data = loan_data_chain.run({"text": page_content})  # Process using LangChain

    # Store extracted data into MongoDB collections
    data_to_store = {
        "url": url,
        "data": structured_data
    }

    if "Interest Rate" in structured_data:
        interest_rates_col.insert_one(data_to_store)
    if "Eligibility Criteria" in structured_data:
        eligibility_col.insert_one(data_to_store)
    if "Loan Amount" in structured_data:
        loan_amounts_col.insert_one(data_to_store)
    if "Processing Fee" in structured_data:
        processing_fees_col.insert_one(data_to_store)
    if "Repayment Terms" in structured_data:
        repayment_terms_col.insert_one(data_to_store)

    print(f"Data from {url} stored successfully!")

# Run scraper for each website
for website in websites:
    scrape_and_store(website)

print("✅ Scraping completed. Data stored in MongoDB!")
