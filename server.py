import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS # Import CORS
from agno.agent import Agent 
from agno.models.groq import Groq
from agno.tools.yfinance import YFinanceTools
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.models.google import Gemini

# Load environment variables
load_dotenv()
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")

if not GROQ_API_KEY or not GOOGLE_API_KEY:
    raise ValueError("API keys (GROQ_API_KEY, GOOGLE_API_KEY) not found in .env file or environment variables.")

app = Flask(__name__)
CORS(app)
# --- Initialize AI Agents (Identical to your Streamlit app) ---

# Web Search Agent
web_search_agent = Agent(
    name="Web Search Agent",
    role="Search the web for the latest information",
    model=Gemini(api_key=GOOGLE_API_KEY, id="gemini-2.0-flash"), # Use appropriate model ID
    tools=[DuckDuckGoTools()],
    instructions=[
        "ALWAYS present information in tabular format where possible",
        "Always include sources with dates of publication",
        "Structure your output with clear headings and bullet points",
        "For financial news, categorize information by market impact (Positive/Neutral/Negative) in a table format",
        "Include a summary of key takeaways at the end in a table format"
    ],
    show_tool_calls=True, # This might print to console, not affect API response content
    markdown=True,
)

# Financial Agent
finance_agent = Agent(
    name="Finance AI Agent",
    model=Gemini(api_key=GOOGLE_API_KEY, id="gemini-2.0-flash"), # Use appropriate model ID
    tools=[
        YFinanceTools(stock_price=True, analyst_recommendations=True, stock_fundamentals=True, company_news=True),
    ],
    instructions=[
        "ALWAYS present ALL data in tabular format - no exceptions",
        "Present analyst recommendations with consensus ratings in a table (Strong Buy/Buy/Hold/Sell/Strong Sell)",
        "Include target price ranges and average price targets in a dedicated table",
        "Provide technical indicators with clear buy/sell signals in a table format",
        "Format all price data with appropriate currency symbols",
        "Present 'Timing Guidance' section with short-term, medium-term, and long-term outlooks in a table",
        "Add a 'Risk Assessment' section in tabular format highlighting potential downsides",
        "Structure output with clear headings: Summary, Price Data, Fundamentals, Analyst Views, Technical Analysis, Timing Guidance, Risk Assessment",
        "Even summary information must be presented in a table format"
    ],
    show_tool_calls=True,
    markdown=True,
)

# Combined Multi-Agent System
multi_ai_agent = Agent(
    team=[finance_agent, web_search_agent],
    model=Groq(api_key=GROQ_API_KEY, id="meta-llama/llama-4-maverick-17b-128e-instruct"), # Use appropriate model ID e.g., "mixtral-8x7b-32768" or "llama3-8b-8192"
    instructions=[
        "ALWAYS present ALL information in table format - this is mandatory",
        "Structure output with clear sections using markdown headings, with each section containing at least one table",
        "First use the Finance Agent to get detailed stock data",
        "Then use the Web Search Agent for recent news and market sentiment",
        "Present ALL data in tables - never use paragraphs where tables can be used instead",
        "Include a 'Stock Fundamentals' table with key metrics and comparisons to industry averages",
        "Provide 'Analyst Consensus' table with specific ratings, target prices and timeframes",
        "Add 'Technical Analysis' table with key indicators and clear buy/sell signals",
        "Include 'Entry Points' table suggesting optimal buying opportunities based on technical patterns",
        "Add 'Investment Timeframe' table (Short-term trader vs. Long-term investor recommendations)",
        "Include 'Risk Assessment' table highlighting potential downside scenarios",
        "End with 'Action Plan' table summarizing recommendations with clear timing guidance",
        "Always cite sources for all external information in a dedicated sources table"
    ],
    show_tool_calls=True,
    markdown=True,
)

# Gemini Chat Model for AI Assistant
# Note: The original code used Gemini(id="gemini-2.0-flash") which might be an outdated or specific identifier.
# Using a common one like "gemini-1.5-flash-latest" or "gemini-pro" for chat.
# Ensure your agno.models.google.Gemini class has a 'chat' method if you intend to use it like that.
# If 'chat' isn't a method, you might need to use .run() with a specific role.
# For simplicity, let's assume it has a .chat() or similar method for direct chat interaction.
# If not, we'll use the .run() method with a simple prompt.

try:
    # Attempt to initialize the Gemini model specifically for chat
    # This assumes your Gemini class can be instantiated this way and has a 'chat' method
    gemini_chat_model = Gemini(api_key=GOOGLE_API_KEY, id="gemini-2.0-flash") # Or "gemini-pro"
except Exception as e:
    app.logger.error(f"Could not initialize dedicated gemini_chat_model: {e}")
    app.logger.info("Falling back to using a general agent for chat if specific chat model fails.")
    # Fallback or alternative if direct chat model init fails or no 'chat' method
    # For example, create another agent instance for chat
    chatbot_agent_for_direct_chat = Agent(
        name="Simple Chatbot",
        model=Gemini(api_key=GOOGLE_API_KEY, id="gemini-2.0-flash"),
        instructions=["You are a helpful financial assistant. Answer the user's question directly and concisely.", "Present information clearly. Use tables if appropriate for complex data."],
        markdown=True
    )
    gemini_chat_model = None # Explicitly nullify if we use the agent below

@app.route('/analyze', methods=['POST'])
def analyze_stock_endpoint():
    data = request.get_json()
    if not data:
        return jsonify({"status": "error", "message": "Invalid JSON payload"}), 400

    stock_symbol = data.get('stock_symbol')
    analysis_type = data.get('analysis_type', 'Complete Analysis') # Default value

    if not stock_symbol:
        return jsonify({"status": "error", "message": "Missing 'stock_symbol' in request"}), 400

    try:
        if analysis_type == "Complete Analysis":
            prompt = f"Provide comprehensive analysis for {stock_symbol} including current price, analyst recommendations, technical indicators, and investment outlook."
        elif analysis_type == "News Impact":
            prompt = f"Find and summarize the latest news for {stock_symbol} with market impact assessment."
        else:
            return jsonify({"status": "error", "message": "Invalid 'analysis_type'. Must be 'Complete Analysis' or 'News Impact'."}), 400
        
        app.logger.info(f"Running multi_ai_agent for: {stock_symbol} ({analysis_type})")
        response = multi_ai_agent.run(prompt)
        
        # The 'response.content' should be the raw markdown string
        return jsonify({"status": "success", "stock_symbol": stock_symbol, "analysis_type": analysis_type, "data": response.content})

    except Exception as e:
        app.logger.error(f"Error during analysis for {stock_symbol}: {e}", exc_info=True)
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat_endpoint():
    data = request.get_json()
    if not data:
        return jsonify({"status": "error", "message": "Invalid JSON payload"}), 400

    user_question = data.get('user_question')
    if not user_question:
        return jsonify({"status": "error", "message": "Missing 'user_question' in request"}), 400

    try:
        app.logger.info(f"Processing chat question: {user_question}")
        ai_response_content = None

        if gemini_chat_model and hasattr(gemini_chat_model, 'chat'):
            # Ideal case: the Gemini model wrapper has a direct chat method
            ai_response = gemini_chat_model.chat(user_question) # Assumes .chat() returns an object with .content
            ai_response_content = ai_response.content
        else:
            # Fallback: use the chatbot_agent_for_direct_chat or a similar agent's .run() method
            # This is more aligned with the general 'Agent' structure if a direct '.chat()' isn't available
            # on your specific Gemini model wrapper.
            response_obj = chatbot_agent_for_direct_chat.run(user_question)
            ai_response_content = response_obj.content
            
        # The 'ai_response_content' should be the raw markdown string
        return jsonify({"status": "success", "user_question": user_question, "data": ai_response_content})

    except Exception as e:
        app.logger.error(f"Error during chat processing: {e}", exc_info=True)
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    # Make sure to provide the API keys to your models when initializing them
    # For Groq and Gemini models in 'agno', they might take api_key as an argument
    # e.g., model=Groq(api_key=GROQ_API_KEY, id="...")
    # model=Gemini(api_key=GOOGLE_API_KEY, id="...")
    # I have added api_key to the model instantiations above. Ensure your agno classes support this.

    port = int(os.environ.get("PORT", 5001))
app.run(host="0.0.0.0", port=port, debug=True)
 # Running on a different port to avoid conflict if needed