import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
api_key = os.getenv('GEMINI_API_KEY')
print(f"API Key loaded: {api_key[:20]}..." if api_key else "No API key found")

genai.configure(api_key=api_key)

# List available models
print("\n=== Available Gemini Models ===")
for model in genai.list_models():
    if 'generateContent' in model.supported_generation_methods:
        print(f"[OK] {model.name}")

# Test a simple generation
print("\n=== Testing Model ===")
try:
    model = genai.GenerativeModel('gemini-flash-latest')
    response = model.generate_content("Say hello in one word")
    print(f"[OK] gemini-1.5-flash-latest works: {response.text}")
except Exception as e:
    print(f"[FAIL] gemini-1.5-flash-latest failed: {e}")

try:
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content("Say hello in one word")
    print(f"[OK] gemini-1.5-flash works: {response.text}")
except Exception as e:
    print(f"[FAIL] gemini-1.5-flash failed: {e}")

try:
    model = genai.GenerativeModel('gemini-pro')
    response = model.generate_content("Say hello in one word")
    print(f"[OK] gemini-pro works: {response.text}")
except Exception as e:
    print(f"[FAIL] gemini-pro failed: {e}")
