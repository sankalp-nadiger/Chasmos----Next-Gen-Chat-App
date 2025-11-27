from flask import Flask, request, jsonify 
from flask_cors import CORS
import os
from datetime import datetime
import requests
from io import BytesIO
import fitz  # PyMuPDF
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = Flask(__name__)
CORS(app)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ---------------------------
# 🆕 PDF TEXT EXTRACTION (REAL)
# ---------------------------

def extract_pdf_text(url):
    """Download PDF & extract text using PyMuPDF."""
    try:
        res = requests.get(url)
        if res.status_code != 200:
            return None

        data = res.content
        doc = fitz.open(stream=data, filetype="pdf")

        text = ""
        for page in doc:
            text += page.get_text()

        return text.strip()

    except Exception as e:
        print("❌ PDF extraction error:", e)
        return None


# ---------------------------
# GENERAL AI CHAT (kept same)
# ---------------------------

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": "Chasm AI Flask Server",
        "timestamp": datetime.utcnow().isoformat()
    })


@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        required = ["message", "session_id", "conversation_history", "api_key"]
        for f in required:
            if f not in data:
                return jsonify({"success": False, "error": f"Missing field: {f}"}), 400

        ai_response = f"AI processed text: {data['message'][:100]}..."

        return jsonify({
            "success": True,
            "response": ai_response
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ---------------------------
# ⚡ REAL DOCUMENT → AI PROCESSING
# ---------------------------

from transformers import pipeline

# Initialize QA pipeline once (better free model)
qa_pipeline = pipeline("question-answering", model="deepset/roberta-base-squad2")

def chunk_text(text, chunk_size=1000, overlap=200):
    """Split text into overlapping chunks for QA."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap  # overlap to avoid cutting context
    return chunks

def answer_question(document_text, question, chunk_size=1000, overlap=200):
    chunks = chunk_text(document_text, chunk_size, overlap)
    best_answer = ""
    best_score = 0.0

    for chunk in chunks:
        try:
            result = qa_pipeline(question=question, context=chunk)
            if result['score'] > best_score:
                best_score = result['score']
                best_answer = result['answer']
        except Exception as e:
            print("QA chunk error:", e)

    return best_answer if best_answer.strip() else "❌ Could not find answer in document"

@app.route("/api/document/<document_id>/process", methods=["POST"])
def process_document(document_id):
    data = request.get_json()
    if not data or "question" not in data or "file_url" not in data:
        return jsonify({"success": False, "error": "Missing question or file_url"}), 400

    question = data["question"]
    file_url = data["file_url"]

    print("📁 Processing PDF:", file_url)
    document_text = extract_pdf_text(file_url)

    if not document_text:
        return jsonify({
            "success": False,
            "documentId": document_id,
            "answer": "❌ Could not extract text from PDF"
        })

    # Use chunked QA for better accuracy
    try:
        answer = answer_question(document_text, question)
        return jsonify({
            "success": True,
            "documentId": document_id,
            "answer": answer
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "documentId": document_id,
            "answer": f"❌ Free QA failed: {e}"
        })

# ---------------------------
# Landing + 404
# ---------------------------

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "success": True,
        "message": "🚀 Chasm AI Flask Server is running!",
        "routes": {
            "POST /api/document/<document_id>/process": "Document question answering",
            "POST /api/chat": "General chat",
            "GET /api/health": "Health check"
        }
    })


@app.errorhandler(404)
def not_found(e):
    return jsonify({"success": False, "error": "Endpoint not found"}), 404


if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5001))
    print(f"🚀 Flask AI Server running on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port)