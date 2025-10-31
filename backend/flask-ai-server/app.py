from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os
import json
from datetime import datetime
import logging
import time

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIConversationManager:
    def __init__(self):
        self.conversation_memory = {}
        self.rate_limits = {}
    
    def get_conversation_context(self, session_id, conversation_history, document_context=None):
        
        system_prompt = """You are Chasm AI, an intelligent assistant integrated into the Chasm OS platform"""

        messages = [{"role": "system", "content": system_prompt}]
        
        # Add document context if available
        if document_context and document_context.strip():
            messages.append({
                "role": "system", 
                "content": f"Document context to reference (use this information to answer questions):\n\n{document_context}"
            })
        
        # Add conversation history (last 15 messages for context)
        for msg in conversation_history[-15:]:
            messages.append({
                "role": msg['role'],
                "content": msg['content']
            })
        
        return messages
    
    def check_rate_limit(self, session_id, max_requests=50, window_seconds=3600):
        """Basic rate limiting per session"""
        current_time = time.time()
        if session_id not in self.rate_limits:
            self.rate_limits[session_id] = []
        
        # Remove old requests outside the window
        self.rate_limits[session_id] = [
            req_time for req_time in self.rate_limits[session_id]
            if current_time - req_time < window_seconds
        ]
        
        if len(self.rate_limits[session_id]) >= max_requests:
            return False
        
        self.rate_limits[session_id].append(current_time)
        return True
    
    def generate_response(self, messages, api_key):
        """Generate AI response using OpenAI API"""
        
        openai.api_key = api_key
        
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=1000,
                temperature=0.7,
                top_p=0.9,
                presence_penalty=0.1,
                frequency_penalty=0.1
            )
            
            return response.choices[0].message.content
            
        except openai.error.AuthenticationError:
            raise Exception("Invalid API key provided")
        except openai.error.RateLimitError:
            raise Exception("OpenAI rate limit exceeded. Please try again later.")
        except openai.error.InvalidRequestError as e:
            raise Exception(f"Invalid request: {str(e)}")
        except openai.error.OpenAIError as e:
            raise Exception(f"OpenAI API error: {str(e)}")
        except Exception as e:
            raise Exception(f"Unexpected error: {str(e)}")
    
    def process_message(self, user_message, session_id, conversation_history, document_context, api_key):
        """Process user message and generate AI response"""
        
        # Check rate limiting
        if not self.check_rate_limit(session_id):
            raise Exception("Rate limit exceeded for this session. Please try again later.")
        
        # Build conversation context
        messages = self.get_conversation_context(session_id, conversation_history, document_context)
        
        # Add current user message
        messages.append({"role": "user", "content": user_message})
        
        # Generate response
        ai_response = self.generate_response(messages, api_key)
        
        return ai_response

# Initialize conversation manager
conversation_manager = AIConversationManager()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy", 
        "timestamp": datetime.utcnow().isoformat(),
        "service": "Chasm AI Flask Server",
        "version": "1.0.0"
    })

@app.route('/api/chat', methods=['POST'])
def chat_endpoint():
    start_time = time.time()
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "error": "No JSON data provided",
                "success": False
            }), 400
        
        # Validate required fields
        required_fields = ['message', 'session_id', 'conversation_history', 'api_key']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "error": f"Missing required field: {field}",
                    "success": False
                }), 400
        
        # Validate message length
        if len(data['message']) > 2000:
            return jsonify({
                "error": "Message too long. Maximum 2000 characters allowed.",
                "success": False
            }), 400
        
        logger.info(f"Processing AI request for session: {data['session_id']}")
        
        # Process the message
        ai_response = conversation_manager.process_message(
            user_message=data['message'],
            session_id=data['session_id'],
            conversation_history=data['conversation_history'],
            document_context=data.get('document_context'),
            api_key=data['api_key']
        )
        
        processing_time = time.time() - start_time
        
        logger.info(f"AI response generated in {processing_time:.2f}s for session: {data['session_id']}")
        
        return jsonify({
            "response": ai_response,
            "success": True,
            "session_id": data['session_id'],
            "processing_time": processing_time,
            "timestamp": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        processing_time = time.time() - start_time
        logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({
            "error": str(e),
            "success": False,
            "processing_time": processing_time
        }), 500

@app.route('/api/status', methods=['GET'])
def status_endpoint():
    return jsonify({
        "status": "operational",
        "active_sessions": len(conversation_manager.rate_limits),
        "timestamp": datetime.utcnow().isoformat()
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "error": "Endpoint not found",
        "success": False
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "error": "Internal server error",
        "success": False
    }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"🚀 Starting Chasm AI Flask Server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=debug)