from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq  # Import the Groq library
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
import os
import sqlite3
import uuid

# Load environment variables from .env file
load_dotenv()

# Fetch the API key from the environment
API_KEY = os.getenv('API_KEY')

if not API_KEY:
    raise Exception("API_KEY is not set in the environment variables")

app = Flask(__name__)
CORS(app)  # Enable cross-origin requests (needed for Flutter app)

# Initialize Groq client with API key
client = Groq(api_key=API_KEY)

# SQLite setup
DB_PATH = "wakephrase.db"

def init_db():
    """Initialises the SQLite database and creates necessary tables."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )
    ''')

    # Create user profiles table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_profile (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            goals TEXT NOT NULL,
            fears TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# Helper function to get database connection
def get_db_connection():
    return sqlite3.connect(DB_PATH)

# Helper function to fetch user by email
def fetch_user_by_email(email):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()
    return user

# Helper function to fetch user profile
def fetch_user_profile(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM user_profile WHERE user_id = ? ORDER BY id DESC LIMIT 1", (user_id,))
    profile = cursor.fetchone()
    conn.close()
    if profile:
        return {"name": profile[2], "goals": profile[3], "fears": profile[4]}
    return None

# User registration
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    # Check if the user already exists
    if fetch_user_by_email(email):
        return jsonify({"error": "User already exists"}), 400

    # Generate a unique user ID
    user_id = str(uuid.uuid4())

    # Hash the password for security
    hashed_password = generate_password_hash(password)

    # Save the user to the database
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO users (id, email, password) VALUES (?, ?, ?)", (user_id, email, hashed_password))
    conn.commit()
    conn.close()

    # Return the generated user_id to the frontend
    return jsonify({"message": "User registered successfully!", "user_id": user_id}), 200


# User login
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = fetch_user_by_email(email)
    if not user or not check_password_hash(user[2], password):
        return jsonify({"error": "Invalid credentials"}), 401

    # Return user_id on successful login
    return jsonify({"message": "Login successful!", "user_id": user[0]}), 200


# Save user profile
@app.route('/profile', methods=['POST'])
def save_profile():
    data = request.json
    user_id = data.get("user_id")
    if not user_id or not data.get("name") or not data.get("goals") or not data.get("fears"):
        return jsonify({"error": "User ID, name, goals, and fears are required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO user_profile (user_id, name, goals, fears)
        VALUES (?, ?, ?, ?)
    ''', (user_id, data["name"], data["goals"], data["fears"]))
    conn.commit()
    conn.close()
    return jsonify({"message": "Profile saved successfully!"}), 200

# Generate catchphrase
@app.route('/phrase', methods=['GET'])
def generate_phrase():
    user_id = request.args.get("user_id")
    action = request.args.get("action")

    if not user_id or not action:
        return jsonify({"error": "User ID and action are required"}), 400

    if action not in ["dismiss", "snooze"]:
        return jsonify({"error": "Invalid action. Must be 'dismiss' or 'snooze'"}), 400

    user_profile = fetch_user_profile(user_id)
    if not user_profile:
        return jsonify({"error": "No user profile found"}), 400

    try:
        # Prepare messages for Groq API
        goals = user_profile.get("goals")
        fears = user_profile.get("fears")

        # Adjust the prompt based on the action
        if action == "dismiss":
            prompt = f"""
            Based on the user's goals and fears, generate a single concise, powerful motivational phrase that affirms their desire to achieve their goals. Avoid being patronising or overly formal.
            Goals: {goals}
            Fears: {fears}
            """
        elif action == "snooze":
            prompt = f"""
            Generate a concise, impactful phrase that reflects the user's fears and challenges their goals in a direct, aggressive tone. Avoid excessive explanation or formality.
            Goals: {goals}
            Fears: {fears}
            """

        # Call Groq API
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "system", "content": prompt}],
            temperature=1,
            max_tokens=100,
            top_p=1,
            stream=False,
            stop=None,
        )

        # Extract the phrase from the response
        response = completion.choices[0].message.content.strip()

        return jsonify({"phrase": response}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
