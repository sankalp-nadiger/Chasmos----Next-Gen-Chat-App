from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
import requests
import fitz  # PyMuPDF
from openai import OpenAI
from dotenv import load_dotenv
from werkzeug.middleware.proxy_fix import ProxyFix
import tempfile
import hashlib
import time
import json

load_dotenv()

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1)

# Increase request size limit (50MB)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False

CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173", "https://chasmos.netlify.app"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"],
        "expose_headers": ["Content-Type", "X-Request-ID"]
    }
})

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Cache for processed documents to avoid reprocessing
document_cache = {}

# ---------------------------
# Enhanced PDF Text Extraction
# ---------------------------

def extract_pdf_text_enhanced(url, max_pages=100):
    """Enhanced PDF extraction with better error handling and performance."""
    try:
        start_time = time.time()
        
        # Download PDF with timeout
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        res = requests.get(url, headers=headers, timeout=30, stream=True)
        
        if res.status_code != 200:
            return {
                "success": False,
                "error": f"Failed to download PDF. Status: {res.status_code}",
                "text": "",
                "page_count": 0,
                "word_count": 0
            }

        # Save to temp file for large PDFs
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            for chunk in res.iter_content(chunk_size=8192):
                if chunk:
                    tmp_file.write(chunk)
            tmp_path = tmp_file.name

        try:
            # Open PDF with PyMuPDF
            doc = fitz.open(tmp_path)
            
            if len(doc) > max_pages:
                return {
                    "success": False,
                    "error": f"PDF too large. Maximum {max_pages} pages allowed. This PDF has {len(doc)} pages.",
                    "text": "",
                    "page_count": len(doc),
                    "word_count": 0
                }
            
            # Extract text from all pages
            full_text = ""
            for page_num, page in enumerate(doc, 1):
                text = page.get_text()
                full_text += f"\n--- Page {page_num} ---\n{text}\n"
                
                # Stop if text is getting too large (approx 100K words)
                if len(full_text.split()) > 100000:
                    full_text += f"\n[Text truncated at page {page_num} due to size limits]\n"
                    break
            
            doc.close()
            
            # Clean text
            cleaned_text = full_text.strip()
            word_count = len(cleaned_text.split())
            
            processing_time = time.time() - start_time
            
            return {
                "success": True,
                "text": cleaned_text,
                "page_count": len(doc) if 'doc' in locals() else 0,
                "word_count": word_count,
                "processing_time": round(processing_time, 2),
                "truncated": word_count > 100000
            }
            
        finally:
            # Clean up temp file
            try:
                os.unlink(tmp_path)
            except:
                pass
                
    except requests.exceptions.Timeout:
        return {
            "success": False,
            "error": "Download timeout. The document might be too large or the server is slow.",
            "text": "",
            "page_count": 0,
            "word_count": 0
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"PDF extraction error: {str(e)}",
            "text": "",
            "page_count": 0,
            "word_count": 0
        }

# ---------------------------
# Text Processing Utilities
# ---------------------------

def chunk_text_smart(text, max_chunk_size=3000, overlap=500):
    """Smart text chunking that respects paragraph boundaries."""
    if not text or len(text) < max_chunk_size:
        return [text] if text else []
    
    chunks = []
    paragraphs = text.split('\n\n')
    
    current_chunk = ""
    for paragraph in paragraphs:
        if len(current_chunk) + len(paragraph) + 2 <= max_chunk_size:
            current_chunk += paragraph + "\n\n"
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = paragraph + "\n\n"
    
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    # Add overlap between chunks for context
    if len(chunks) > 1:
        overlapped_chunks = []
        for i in range(len(chunks)):
            if i == 0:
                overlapped_chunks.append(chunks[i])
            else:
                prev_chunk_end = chunks[i-1][-overlap:] if len(chunks[i-1]) > overlap else chunks[i-1]
                overlapped_chunks.append(prev_chunk_end + "\n\n" + chunks[i])
        return overlapped_chunks
    
    return chunks

def answer_with_openai(document_text, question, previous_context=None):
    """Use OpenAI to answer questions about documents."""
    try:
        start_time = time.time()
        
        # Prepare system message
        system_message = """You are Chasm AI, an intelligent document analysis assistant. 
        Your task is to answer questions based on the provided document text.
        Be thorough, accurate, and helpful. If the answer isn't in the document, say so clearly.
        Format your answers clearly with paragraphs and bullet points when appropriate."""
        
        # Prepare user message with document context
        context_str = ""
        if previous_context:
            context_str = "\n\nPrevious questions and answers for context:\n"
            for i, qa in enumerate(previous_context[-3:], 1):
                context_str += f"{i}. Q: {qa.get('question', '')}\n   A: {qa.get('answer', '')[:200]}...\n"
        
        user_message = f"""Document Content:
{document_text[:12000]}  # Limit context to avoid token limits

{context_str}

Question: {question}

Please provide a comprehensive answer based on the document. If the document doesn't contain relevant information, state that clearly."""
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-3.5-turbo-16k",  # Use 16k context for larger documents
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ],
            temperature=0.3,
            max_tokens=2000,
            top_p=0.9,
            frequency_penalty=0.1,
            presence_penalty=0.1
        )
        
        answer = response.choices[0].message.content.strip()
        processing_time = time.time() - start_time
        
        return {
            "success": True,
            "answer": answer,
            "tokens_used": response.usage.total_tokens,
            "processing_time": round(processing_time, 2)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"OpenAI API error: {str(e)}",
            "answer": "I apologize, but I encountered an error while processing your request. Please try again."
        }

def process_large_document_in_chunks(document_text, question):
    """Process very large documents by chunking."""
    try:
        chunks = chunk_text_smart(document_text, max_chunk_size=6000, overlap=1000)
        
        if not chunks:
            return {
                "success": False,
                "error": "No text could be extracted from the document.",
                "answer": "The document appears to be empty or couldn't be processed."
            }
        
        # Process each chunk
        chunk_answers = []
        for i, chunk in enumerate(chunks[:5]):  # Limit to first 5 chunks for performance
            result = answer_with_openai(chunk, question)
            if result["success"]:
                chunk_answers.append({
                    "chunk": i + 1,
                    "answer": result["answer"][:500] + "..." if len(result["answer"]) > 500 else result["answer"]
                })
        
        if not chunk_answers:
            return {
                "success": False,
                "error": "Could not process any document chunks.",
                "answer": "Unable to analyze the document content."
            }
        
        # Combine answers
        if len(chunk_answers) == 1:
            return {
                "success": True,
                "answer": chunk_answers[0]["answer"],
                "answer_type": "direct",
                "chunks_processed": 1
            }
        else:
            # Summarize multiple answers
            combined_answers = "\n\n".join([f"Chunk {ca['chunk']}: {ca['answer']}" for ca in chunk_answers])
            
            summary_prompt = f"""I have analyzed a document in {len(chunk_answers)} parts. Here are the findings:

{combined_answers}

Based on all parts of the document, please provide a comprehensive answer to: {question}

Combine information from all relevant parts and provide a complete answer."""
            
            summary_result = answer_with_openai(summary_prompt, "Summarize the findings into a comprehensive answer")
            
            return {
                "success": True,
                "answer": summary_result["answer"] if summary_result["success"] else combined_answers,
                "answer_type": "combined",
                "chunks_processed": len(chunk_answers)
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Chunk processing error: {str(e)}",
            "answer": "Error processing the document in chunks."
        }

# ---------------------------
# API Endpoints
# ---------------------------

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": "Chasm AI Document Processing Server",
        "timestamp": datetime.utcnow().isoformat(),
        "openai_status": "configured" if os.getenv("OPENAI_API_KEY") else "not_configured",
        "max_file_size": "50MB"
    })

@app.route("/api/ping", methods=["GET"])
def ping():
    return jsonify({
        "success": True,
        "message": "pong",
        "timestamp": datetime.utcnow().isoformat()
    })

@app.route("/api/document/<document_id>/process", methods=["POST"])
def process_document_question(document_id):
    """Process a question about a specific document."""
    try:
        start_time = time.time()
        data = request.get_json()
        
        if not data or "question" not in data or "file_url" not in data:
            return jsonify({
                "success": False,
                "error": "Missing required fields: question and file_url"
            }), 400
        
        question = data["question"].strip()
        file_url = data["file_url"]
        document_type = data.get("document_type", "application/pdf")
        previous_context = data.get("previous_context", [])
        
        if not question:
            return jsonify({
                "success": False,
                "error": "Question cannot be empty"
            }), 400
        
        if len(question) > 1000:
            return jsonify({
                "success": False,
                "error": "Question too long. Maximum 1000 characters."
            }), 400
        
        print(f"Processing question for document {document_id}: {question[:100]}...")
        
        # Check cache first
        cache_key = f"{document_id}_{hashlib.md5(question.encode()).hexdigest()}"
        if cache_key in document_cache:
            cached_result = document_cache[cache_key]
            if time.time() - cached_result["timestamp"] < 3600:  # Cache for 1 hour
                print(f"Returning cached result for {cache_key}")
                return jsonify(cached_result["data"])
        
        # Extract text from document
        extraction_result = extract_pdf_text_enhanced(file_url)
        
        if not extraction_result["success"]:
            return jsonify({
                "success": False,
                "documentId": document_id,
                "error": extraction_result["error"],
                "answer": "Unable to extract text from the document. Please ensure it's a valid PDF file."
            })
        
        document_text = extraction_result["text"]
        
        if not document_text or len(document_text.strip()) < 10:
            return jsonify({
                "success": False,
                "documentId": document_id,
                "answer": "The document appears to be empty or contains no extractable text."
            })
        
        # Decide processing strategy based on document size
        word_count = extraction_result["word_count"]
        
        if word_count > 10000:  # Large document
            print(f"Processing large document ({word_count} words) in chunks")
            result = process_large_document_in_chunks(document_text, question)
        else:  # Small/medium document
            print(f"Processing document ({word_count} words) directly")
            result = answer_with_openai(document_text, question, previous_context)
        
        if result["success"]:
            response_data = {
                "success": True,
                "documentId": document_id,
                "answer": result["answer"],
                "answer_type": result.get("answer_type", "direct"),
                "confidence": 0.9,
                "processing_time": round(time.time() - start_time, 2),
                "extraction_time": extraction_result.get("processing_time", 0),
                "word_count": word_count,
                "page_count": extraction_result.get("page_count", 0),
                "chunks_processed": result.get("chunks_processed", 1),
                "tokens_used": result.get("tokens_used", 0)
            }
            
            # Cache the result
            document_cache[cache_key] = {
                "timestamp": time.time(),
                "data": response_data
            }
            
            # Clean old cache entries
            for key in list(document_cache.keys()):
                if time.time() - document_cache[key]["timestamp"] > 3600:
                    del document_cache[key]
            
            return jsonify(response_data)
        else:
            return jsonify({
                "success": False,
                "documentId": document_id,
                "error": result.get("error", "Unknown error"),
                "answer": result.get("answer", "Error processing document")
            })
            
    except Exception as e:
        print(f"Error in process_document_question: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Server error: {str(e)}",
            "answer": "An internal server error occurred. Please try again."
        }), 500

@app.route("/api/process-large-document", methods=["POST"])
def process_large_document():
    """Background processing endpoint for large documents."""
    try:
        data = request.get_json()
        
        if not data or "document_id" not in data or "file_url" not in data:
            return jsonify({"success": False, "error": "Missing required fields"}), 400
        
        document_id = data["document_id"]
        file_url = data["file_url"]
        
        print(f"Starting background processing for document {document_id}")
        
        # Extract text
        extraction_result = extract_pdf_text_enhanced(file_url, max_pages=200)
        
        if extraction_result["success"]:
            return jsonify({
                "success": True,
                "document_id": document_id,
                "extracted_text": extraction_result["text"][:50000],  # Return first 50K chars
                "page_count": extraction_result.get("page_count", 0),
                "word_count": extraction_result.get("word_count", 0),
                "processing_time": extraction_result.get("processing_time", 0),
                "truncated": extraction_result.get("truncated", False)
            })
        else:
            return jsonify({
                "success": False,
                "document_id": document_id,
                "error": extraction_result.get("error", "Extraction failed")
            })
            
    except Exception as e:
        print(f"Error in process_large_document: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/summarize", methods=["POST"])
def summarize_document():
    """Generate a summary of the document."""
    try:
        data = request.get_json()
        
        if not data or "file_url" not in data:
            return jsonify({"success": False, "error": "file_url is required"}), 400
        
        file_url = data["file_url"]
        
        # Extract text
        extraction_result = extract_pdf_text_enhanced(file_url)
        
        if not extraction_result["success"]:
            return jsonify({
                "success": False,
                "error": extraction_result.get("error", "Extraction failed")
            })
        
        document_text = extraction_result["text"]
        
        if not document_text or len(document_text.strip()) < 50:
            return jsonify({
                "success": False,
                "error": "Document text too short for summarization"
            })
        
        # Generate summary using OpenAI
        summary_prompt = f"""Please provide a comprehensive summary of the following document. 
        Include key points, main arguments, and important details.
        
        Document:
        {document_text[:8000]}
        
        Summary:"""
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a document summarization expert."},
                {"role": "user", "content": summary_prompt}
            ],
            temperature=0.5,
            max_tokens=1000
        )
        
        summary = response.choices[0].message.content.strip()
        
        return jsonify({
            "success": True,
            "summary": summary,
            "word_count": extraction_result.get("word_count", 0),
            "page_count": extraction_result.get("page_count", 0)
        })
        
    except Exception as e:
        print(f"Error in summarize_document: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "success": True,
        "message": "Chasm AI Document Processing Server",
        "version": "2.0.0",
        "endpoints": {
            "POST /api/document/<id>/process": "Ask questions about documents",
            "POST /api/process-large-document": "Background processing for large documents",
            "POST /api/summarize": "Generate document summaries",
            "GET /api/health": "Health check",
            "GET /api/ping": "Simple ping endpoint"
        },
        "limits": {
            "max_file_size": "50MB",
            "max_pages": "100 (configurable)",
            "cache_ttl": "1 hour"
        }
    })

@app.errorhandler(404)
def not_found(e):
    return jsonify({"success": False, "error": "Endpoint not found"}), 404

@app.errorhandler(413)
def request_entity_too_large(e):
    return jsonify({
        "success": False, 
        "error": "Request too large",
        "message": "Maximum file size is 50MB"
    }), 413

@app.errorhandler(500)
def internal_server_error(e):
    return jsonify({
        "success": False, 
        "error": "Internal server error",
        "message": "An unexpected error occurred"
    }), 500

if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5001))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    
    print(f"Starting Chasm AI Document Processing Server on http://localhost:{port}")
    print(f"Debug mode: {debug}")
    print(f"OpenAI configured: {'Yes' if os.getenv('OPENAI_API_KEY') else 'No'}")
    
    app.run(host="0.0.0.0", port=port, debug=debug, threaded=True)