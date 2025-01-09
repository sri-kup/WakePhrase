from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq  # Import the Groq library

app = Flask(__name__)
CORS(app)  # Enable cross-origin requests (needed for Flutter app)

# Mock storage for user data (in-memory for now)
user_data = {}

# Initialize Groq client with API key
API_KEY = "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"
client = Groq(api_key=API_KEY)

# Endpoint to save user profile
@app.route('/profile', methods=['POST'])
def save_profile():
    global user_data
    data = request.json
    if not data.get("name") or not data.get("goals") or not data.get("fears"):
        return jsonify({"error": "Name, goals, and fears are required"}), 400
    user_data = data
    return jsonify({"message": "Profile saved successfully!"}), 200

# Endpoint to generate a catchphrase
@app.route('/phrase', methods=['GET'])
def generate_phrase():
    if not user_data:
        return jsonify({"error": "No user profile found"}), 400

    try:
        # Prepare messages for Groq API
        goals = ", ".join(user_data.get("goals", []))
        fears = ", ".join(user_data.get("fears", []))

        # prompt = f"""
        # Generate a single motivational phrase that challenges the user to overcome their fears and pursue their goals.
        # Fears: {fears}
        # Goals: {goals}

        # Do not include explanations, bullet points, or additional text. Respond with only the motivational phrase.
        # """


        # # Call Groq API
        # completion = client.chat.completions.create(
        #     model="llama-3.3-70b-versatile",
        #     messages=[{"role": "system", "content": prompt}],
        #     temperature=1,
        #     max_tokens=100,
        #     top_p=1,
        #     stream=False,
        #     stop=None,
        # )

        # # Extract the phrase from the response
        # response = completion.choices[0].message.content.strip()


        response = 'I have commented the API for now'
        return jsonify({"phrase": response}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
