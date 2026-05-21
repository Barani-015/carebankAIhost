from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import pandas as pd
from pathlib import Path
from typing import Dict, Any
import logging
import traceback
from datetime import datetime, timedelta
import time
import os

# RAG imports
try:
    from sentence_transformers import SentenceTransformer
    import faiss
    RAG_AVAILABLE = True
except ImportError:
    RAG_AVAILABLE = False

app = Flask(__name__)
# Update your CORS configuration
CORS(app, origins=['https://carebank-ai.onrender.com','https://carebankhost-1.onrender.com', 'http://localhost:3000'])

# ============================================
# AI Provider Configuration
# ============================================
# Hugging Face Configuration
HF_API_TOKEN = os.getenv("HF_TOKEN")  # ✅ Correct Python syntax
HF_MODEL_NAME = "meta-llama/Llama-3.2-3B-Instruct"

# Hosted AI Service Configuration (Replaces Ollama)
# Replace this URL with your actual hosted AI service endpoint
HOSTED_AI_URL = os.getenv("HOSTED_AI_URL", "https://api.groq.com/openai/v1/chat/completions")  # Example: Groq
HOSTED_AI_API_KEY = os.getenv("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")  # Your hosted AI API key
HOSTED_AI_MODEL = os.getenv("HOSTED_AI_MODEL", "llama3-70b-8192")  # Model name for hosted service

# Alternative: If using OpenRouter
# HOSTED_AI_URL = "https://openrouter.ai/api/v1/chat/completions"
# HOSTED_AI_MODEL = "meta-llama/llama-3.2-3b-instruct"

# Alternative: If using Together AI
# HOSTED_AI_URL = "https://api.together.xyz/v1/chat/completions"
# HOSTED_AI_MODEL = "meta-llama/Llama-3.2-3B-Instruct-Turbo"

# Provider priority: 'huggingface' first, then 'hosted_ai' as fallback
AI_PROVIDER = "huggingface"  # Start with Hugging Face

BASE_DIR = Path(__file__).parent.parent
UPLOAD_CSV_FOLDER = BASE_DIR / "uploadsCSVs"

# Configure logging with more detail
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

csv_cache = {}
CACHE_TTL = 300

def get_cached_csv_data(user_id: str):
    start_time = time.time()
    current_time = datetime.now()
    
    if user_id in csv_cache:
        cache_entry = csv_cache[user_id]
        if current_time - cache_entry['timestamp'] < timedelta(seconds=CACHE_TTL):
            logger.info(f"📦 CACHE HIT - User: {user_id} (took: {(time.time() - start_time)*1000:.2f}ms)")
            return cache_entry['data']
    
    logger.info(f"🔄 CACHE MISS - Loading fresh data for user: {user_id}")
    csv_data = load_user_csv_files(user_id)
    csv_cache[user_id] = {'data': csv_data, 'timestamp': current_time}
    logger.info(f"✅ Data loaded for user: {user_id} (took: {(time.time() - start_time)*1000:.2f}ms)")
    return csv_data

def invalidate_cache(user_id: str = None):
    if user_id:
        csv_cache.pop(user_id, None)
        logger.info(f"🗑️ Cache invalidated for user: {user_id}")
    else:
        csv_cache.clear()
        logger.info(f"🗑️ All cache invalidated")

class CSV_RAG_System:
    def __init__(self):
        self.encoder = None
        self.indexes = {}
        self.text_chunks = {}
        self.user_summaries = {}
        
    def init_encoder(self):
        if self.encoder is None and RAG_AVAILABLE:
            logger.info("🔧 Initializing embedding model (all-MiniLM-L6-v2)...")
            self.encoder = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("✅ Embedding model ready")
    
    def index_user_data(self, user_id: str, csv_data: Dict[str, pd.DataFrame]):
        if not RAG_AVAILABLE:
            logger.warning("⚠️ RAG not available - skipping indexing")
            return
        
        start_time = time.time()
        logger.info(f"🔨 Building RAG index for user: {user_id}")
        self.init_encoder()
        self._create_user_summary(user_id, csv_data)
        
        all_chunks = []
        for filename, df in csv_data.items():
            for idx in range(min(len(df), 5000)):
                row = df.iloc[idx]
                chunk_parts = [f"{col}: {row[col]}" for col in df.columns if pd.notna(row[col])]
                chunk_text = f"[FILE: {filename}] " + " | ".join(chunk_parts)
                all_chunks.append({'text': chunk_text, 'filename': filename, 'row_data': row.to_dict()})
        
        if all_chunks:
            texts = [chunk['text'] for chunk in all_chunks]
            embeddings = self.encoder.encode(texts, show_progress_bar=False)
            index = faiss.IndexFlatL2(embeddings.shape[1])
            index.add(embeddings.astype('float32'))
            self.indexes[user_id] = index
            self.text_chunks[user_id] = all_chunks
            logger.info(f"✅ RAG index built for user: {user_id} - {len(all_chunks)} chunks indexed (took: {(time.time() - start_time)*1000:.2f}ms)")
    
    def _create_user_summary(self, user_id: str, csv_data: Dict[str, pd.DataFrame]):
        summary = {'total_files': len(csv_data), 'total_rows': 0, 'total_spending': 0, 'total_income': 0}
        for df in csv_data.values():
            summary['total_rows'] += len(df)
            if 'amount' in df.columns:
                if 'type' in df.columns:
                    summary['total_spending'] += df[df['type'] == 'debit']['amount'].sum()
                    summary['total_income'] += df[df['type'] == 'credit']['amount'].sum()
                else:
                    summary['total_spending'] += df['amount'].sum()
        self.user_summaries[user_id] = summary
        logger.info(f"📊 Summary created for user: {user_id} - Files: {summary['total_files']}, Rows: {summary['total_rows']}")
    
    def get_summary_context(self, user_id: str) -> str:
        if user_id not in self.user_summaries:
            return None
        s = self.user_summaries[user_id]
        return f"Total files: {s['total_files']}, Total rows: {s['total_rows']}, Spending: ₹{s['total_spending']:,.2f}, Income: ₹{s['total_income']:,.2f}"
    
    def retrieve_relevant_data(self, user_id: str, question: str, top_k: int = 10) -> str:
        if not RAG_AVAILABLE or user_id not in self.indexes:
            return None
        
        start_time = time.time()
        self.init_encoder()
        q_embedding = self.encoder.encode([question])
        _, indices = self.indexes[user_id].search(q_embedding.astype('float32'), top_k)
        
        context = []
        for idx in indices[0]:
            if idx < len(self.text_chunks[user_id]):
                chunk = self.text_chunks[user_id][idx]
                row_text = [f"{k}: ₹{v:,.2f}" if k == 'amount' and pd.notna(v) else f"{k}: {v}" for k, v in chunk['row_data'].items() if pd.notna(v)]
                context.append(" | ".join(row_text))
        
        retrieval_time = (time.time() - start_time) * 1000
        logger.info(f"🎯 Retrieved {len(context)} relevant rows for query (took: {retrieval_time:.2f}ms)")
        return "\n".join(context) if context else None

rag_system = CSV_RAG_System()

def load_user_csv_files(user_id: str) -> Dict[str, pd.DataFrame]:
    start_time = time.time()
    user_folder = UPLOAD_CSV_FOLDER / str(user_id)
    
    if not user_folder.exists():
        logger.error(f"❌ User folder not found: {user_id} at {user_folder}")
        raise FileNotFoundError(f"User folder {user_id} not found")
    
    csv_data = {}
    csv_files = list(user_folder.glob("*.csv"))
    logger.info(f"📂 Found {len(csv_files)} CSV files for user: {user_id}")
    
    for csv_file in csv_files:
        try:
            df = pd.read_csv(csv_file, encoding='utf-8')
        except UnicodeDecodeError:
            df = pd.read_csv(csv_file, encoding='latin1')
        csv_data[csv_file.name] = df
        logger.info(f"   ✅ Loaded: {csv_file.name} ({len(df)} rows, {len(df.columns)} cols)")
    
    logger.info(f"📁 Total data loaded for user {user_id}: {len(csv_data)} files (took: {(time.time() - start_time)*1000:.2f}ms)")
    return csv_data

def prepare_csv_context(csv_data: Dict[str, pd.DataFrame], user_id: str = None, question: str = None) -> str:
    if user_id and question and RAG_AVAILABLE:
        if any(kw in question.lower() for kw in ['overview', 'summary', 'total']):
            summary = rag_system.get_summary_context(user_id)
            if summary:
                logger.info(f"📊 Using summary context for user: {user_id}")
                return summary
        relevant = rag_system.retrieve_relevant_data(user_id, question)
        if relevant:
            logger.info(f"🎯 Using RAG retrieval context")
            return relevant
    
    logger.info(f"📄 Using fallback lightweight context")
    parts = []
    for filename, df in csv_data.items():
        parts.append(f"File: {filename} ({len(df)} rows)")
        if 'amount' in df.columns:
            total = df['amount'].sum() if 'type' not in df.columns else df[df['type'] == 'debit']['amount'].sum()
            parts.append(f"Total: ₹{total:,.2f}")
        parts.append(df.head(3).to_string())
    return "\n".join(parts)

# ============================================
# Hugging Face API Function
# ============================================
def query_huggingface_api(prompt: str, user_id: str = None) -> Dict[str, Any]:
    """Query Hugging Face Inference API for CSV Q&A"""
    
    start_time = time.time()
    
    # Check if API token is configured
    if not HF_API_TOKEN or HF_API_TOKEN == "":
        logger.warning("⚠️ Hugging Face API token not configured")
        return {
            "success": False,
            "response": "Hugging Face API token not configured",
            "error": "missing_token",
            "provider": "huggingface"
        }
    
    API_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL_NAME}"
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    
    # Format prompt for Llama 3.2 chat format
    formatted_prompt = f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\nYou are a helpful financial data analyst. Answer based on the CSV data accurately and concisely.<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n"
    
    payload = {
        "inputs": formatted_prompt,
        "parameters": {
            "max_new_tokens": 512,
            "temperature": 0.1,
            "top_p": 0.95,
            "do_sample": True,
            "return_full_text": False
        }
    }
    
    logger.info(f"🤗 [Hugging Face] Sending request to {HF_MODEL_NAME}")
    logger.info(f"   📝 Prompt length: {len(prompt)} characters")
    
    try:
        response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
        api_duration = (time.time() - start_time) * 1000
        
        if response.status_code == 200:
            result = response.json()
            
            # Handle different response formats
            if isinstance(result, list) and len(result) > 0:
                response_text = result[0].get('generated_text', '')
            elif isinstance(result, dict):
                response_text = result.get('generated_text', '')
            else:
                response_text = str(result)
            
            logger.info(f"✅ [Hugging Face] Success - {api_duration:.2f}ms")
            logger.info(f"   📥 Response preview: {response_text[:150]}...")
            
            return {
                "success": True,
                "response": response_text,
                "model": HF_MODEL_NAME,
                "provider": "huggingface",
                "api_duration_ms": api_duration
            }
        else:
            logger.error(f"❌ [Hugging Face] API Error {response.status_code}: {response.text[:200]}")
            return {
                "success": False,
                "response": f"Hugging Face API error: {response.status_code}",
                "error": response.text,
                "provider": "huggingface"
            }
            
    except requests.exceptions.Timeout:
        logger.error(f"❌ [Hugging Face] Request timeout after 60 seconds")
        return {
            "success": False,
            "response": "Hugging Face API timeout",
            "error": "timeout",
            "provider": "huggingface"
        }
    except Exception as e:
        logger.error(f"❌ [Hugging Face] Exception: {str(e)}")
        return {
            "success": False,
            "response": f"Hugging Face error: {str(e)}",
            "error": str(e),
            "provider": "huggingface"
        }

# ============================================
# Hosted AI API Function (Replaces Ollama)
# ============================================
def query_hosted_ai_api(prompt: str, user_id: str = None) -> Dict[str, Any]:
    """Query hosted AI service as fallback (replaces Ollama)"""
    
    start_time = time.time()
    
    # Check if hosted AI URL is configured
    if not HOSTED_AI_URL or not HOSTED_AI_API_KEY:
        logger.warning("⚠️ Hosted AI service not configured")
        return {
            "success": False,
            "response": "Hosted AI service not configured",
            "error": "missing_config",
            "provider": "hosted_ai"
        }
    
    logger.info(f"🌐 [Hosted AI] Sending request to {HOSTED_AI_URL}")
    logger.info(f"   🤖 Model: {HOSTED_AI_MODEL}")
    logger.info(f"   📝 Prompt length: {len(prompt)} characters")
    
    # Format for OpenAI-compatible API (Groq, OpenRouter, Together AI)
    headers = {
        "Authorization": f"Bearer {HOSTED_AI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": HOSTED_AI_MODEL,
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful financial data analyst. Answer based on the provided data accurately and concisely."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.1,
        "max_tokens": 512
    }
    
    try:
        response = requests.post(
            HOSTED_AI_URL,
            headers=headers,
            json=payload,
            timeout=60
        )
        
        api_duration = (time.time() - start_time) * 1000
        
        if response.status_code == 200:
            result = response.json()
            
            # Handle OpenAI-compatible response format
            if 'choices' in result and len(result['choices']) > 0:
                response_text = result['choices'][0]['message']['content']
            elif 'response' in result:
                response_text = result['response']
            else:
                response_text = str(result)
            
            logger.info(f"✅ [Hosted AI] Success - {api_duration:.2f}ms")
            logger.info(f"   📥 Response preview: {response_text[:150]}...")
            
            return {
                "success": True,
                "response": response_text,
                "model": HOSTED_AI_MODEL,
                "provider": "hosted_ai",
                "api_duration_ms": api_duration
            }
        else:
            logger.error(f"❌ [Hosted AI] Error {response.status_code}: {response.text[:200]}")
            return {
                "success": False,
                "response": f"Hosted AI error: {response.status_code}",
                "error": response.text,
                "provider": "hosted_ai"
            }
            
    except requests.exceptions.Timeout:
        logger.error(f"❌ [Hosted AI] Request timeout after 60 seconds")
        return {
            "success": False,
            "response": "Hosted AI timeout",
            "error": "timeout",
            "provider": "hosted_ai"
        }
    except Exception as e:
        logger.error(f"❌ [Hosted AI] Exception: {str(e)}")
        return {
            "success": False,
            "response": f"Hosted AI error: {str(e)}",
            "error": str(e),
            "provider": "hosted_ai"
        }

# ============================================
# Unified Query Function with Fallback
# ============================================
def query_ai_with_csv(user_id: str, question: str) -> Dict[str, Any]:
    """
    Main function that tries Hugging Face first, then falls back to Hosted AI
    """
    logger.info(f"="*60)
    logger.info(f"📨 NEW QUERY RECEIVED")
    logger.info(f"👤 User ID: {user_id}")
    logger.info(f"💬 User Prompt: \"{question}\"")
    logger.info(f"="*60)
    
    total_start_time = time.time()
    
    # Handle simple greetings
    if question.lower().strip() in ['hi', 'hello', 'hey']:
        response_time = (time.time() - total_start_time) * 1000
        logger.info(f"✅ Greeting response sent (took: {response_time:.2f}ms)")
        return {
            "success": True, 
            "response": "Hello! Ask me about your spending, totals, or categories.", 
            "model": HF_MODEL_NAME,
            "provider": "greeting",
            "user_id": user_id,
            "response_time_ms": response_time
        }
    
    try:
        # Load CSV data
        logger.info(f"📂 Loading CSV data for user: {user_id}")
        csv_data = get_cached_csv_data(user_id)
        
        # Build RAG index if needed
        if RAG_AVAILABLE and user_id not in rag_system.indexes:
            rag_system.index_user_data(user_id, csv_data)
        
        # Prepare context
        logger.info(f"🔍 Preparing context for question...")
        context = prepare_csv_context(csv_data, user_id, question)
        
        # Build prompt
        prompt = f"Based on this data: {context}\n\nAnswer concisely in English: {question}"
        
        # Try Hugging Face first
        logger.info(f"🚀 Attempting Hugging Face API first...")
        result = query_huggingface_api(prompt, user_id)
        
        # If Hugging Face fails, fall back to Hosted AI
        if not result.get('success', False):
            logger.warning(f"⚠️ Hugging Face failed, falling back to Hosted AI...")
            result = query_hosted_ai_api(prompt, user_id)
        
        total_time = (time.time() - total_start_time) * 1000
        
        # Log response summary
        logger.info(f"="*60)
        logger.info(f"📤 RESPONSE SENT")
        logger.info(f"👤 User: {user_id}")
        logger.info(f"🔧 Provider: {result.get('provider', 'unknown').upper()}")
        logger.info(f"🤖 Model: {result.get('model', 'unknown')}")
        logger.info(f"💬 Query: \"{question[:100]}{'...' if len(question) > 100 else ''}\"")
        logger.info(f"📝 Response: \"{result.get('response', '')[:150]}{'...' if len(result.get('response', '')) > 150 else ''}\"")
        logger.info(f"⏱️ Total time: {total_time:.2f}ms")
        logger.info(f"⚡ API time: {result.get('api_duration_ms', 0):.2f}ms")
        logger.info(f"="*60)
        
        return {
            "success": result.get("success", False),
            "response": result.get("response", ""),
            "model": result.get("model", ""),
            "provider": result.get("provider", "unknown"),
            "user_id": user_id,
            "response_time_ms": total_time,
            "api_time_ms": result.get("api_duration_ms", 0)
        }
        
    except Exception as e:
        total_time = (time.time() - total_start_time) * 1000
        logger.error(f"❌ ERROR processing query")
        logger.error(f"   User: {user_id}")
        logger.error(f"   Query: {question}")
        logger.error(f"   Error: {str(e)}")
        logger.error(f"   Time before error: {total_time:.2f}ms")
        logger.error(traceback.format_exc())
        
        return {
            "success": False, 
            "response": f"Error: {str(e)}", 
            "error": str(e),
            "response_time_ms": total_time
        }

# ============================================
# Flask Routes
# ============================================
@app.route('/chat/transaction', methods=['POST'])
def chat_transaction():
    request_start = time.time()
    
    data = request.get_json()
    user_id = data.get('user_id', '')
    question = data.get('question', '')
    
    logger.info(f"🌐 API Call: /chat/transaction - User: {user_id}")
    
    if not user_id or not question:
        logger.warning(f"⚠️ Invalid request - missing user_id or question")
        return jsonify({'success': False, 'message': 'user_id and question required'}), 400
    
    result = query_ai_with_csv(user_id, question)
    
    total_api_time = (time.time() - request_start) * 1000
    logger.info(f"🏁 Request completed - Total API time: {total_api_time:.2f}ms")
    
    return jsonify(result)

@app.route('/user/csv_files', methods=['GET'])
def list_user_csv_files():
    start_time = time.time()
    user_id = request.args.get('user_id')
    
    logger.info(f"🌐 API Call: /user/csv_files - User: {user_id}")
    
    if not user_id:
        logger.warning(f"⚠️ Missing user_id parameter")
        return jsonify({'success': False, 'message': 'user_id required'}), 400
    
    user_folder = UPLOAD_CSV_FOLDER / str(user_id)
    if not user_folder.exists():
        logger.warning(f"⚠️ User not found: {user_id}")
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    files = [{'filename': f.name, 'size_kb': round(f.stat().st_size / 1024, 2)} for f in user_folder.glob("*.csv")]
    
    response_time = (time.time() - start_time) * 1000
    logger.info(f"✅ Listed {len(files)} files for user {user_id} (took: {response_time:.2f}ms)")
    
    return jsonify({'success': True, 'user_id': user_id, 'csv_files': files, 'total_files': len(files)})

@app.route('/health', methods=['GET'])
def health_check():
    logger.info(f"🌐 Health check requested")
    return jsonify({
        'success': True, 
        'status': 'running', 
        'primary_model': HF_MODEL_NAME,
        'primary_provider': 'huggingface',
        'fallback_model': HOSTED_AI_MODEL,
        'fallback_provider': 'hosted_ai',
        'fallback_url': HOSTED_AI_URL,
        'rag_available': RAG_AVAILABLE,
        'huggingface_configured': bool(HF_API_TOKEN and HF_API_TOKEN != ""),
        'hosted_ai_configured': bool(HOSTED_AI_URL and HOSTED_AI_API_KEY)
    })

@app.route('/user/cache/invalidate', methods=['POST'])
def invalidate_user_cache():
    data = request.get_json()
    user_id = data.get('user_id') if data else None
    
    if user_id:
        invalidate_cache(user_id)
        if RAG_AVAILABLE and user_id in rag_system.indexes:
            del rag_system.indexes[user_id]
            del rag_system.text_chunks[user_id]
        logger.info(f"🗑️ Cache invalidated for user: {user_id}")
        return jsonify({'success': True, 'message': f'Cache invalidated for user {user_id}'})
    else:
        invalidate_cache()
        if RAG_AVAILABLE:
            rag_system.indexes.clear()
            rag_system.text_chunks.clear()
        logger.info(f"🗑️ All cache invalidated")
        return jsonify({'success': True, 'message': 'All cache invalidated'})

@app.route('/provider/status', methods=['GET'])
def provider_status():
    """Check status of both AI providers"""
    return jsonify({
        'success': True,
        'primary': {
            'name': 'huggingface',
            'model': HF_MODEL_NAME,
            'configured': bool(HF_API_TOKEN and HF_API_TOKEN != ""),
            'available': bool(HF_API_TOKEN and HF_API_TOKEN != "")
        },
        'fallback': {
            'name': 'hosted_ai',
            'model': HOSTED_AI_MODEL,
            'url': HOSTED_AI_URL,
            'configured': bool(HOSTED_AI_URL and HOSTED_AI_API_KEY)
        }
    })

if __name__ == '__main__':
    UPLOAD_CSV_FOLDER.mkdir(parents=True, exist_ok=True)
    
    print(f"\n{'='*70}")
    print(f"🚀 CareBank AI Server Starting")
    print(f"{'='*70}")
    print(f"📁 Base Directory: {BASE_DIR}")
    print(f"📂 CSV Folder: {UPLOAD_CSV_FOLDER}")
    print(f"\n🤖 AI Configuration:")
    print(f"   PRIMARY: Hugging Face")
    print(f"   Model: {HF_MODEL_NAME}")
    print(f"   Token Configured: {'✅ YES' if HF_API_TOKEN and HF_API_TOKEN != '' else '❌ NO'}")
    print(f"\n   FALLBACK: Hosted AI Service")
    print(f"   Model: {HOSTED_AI_MODEL}")
    print(f"   URL: {HOSTED_AI_URL}")
    print(f"   API Key Configured: {'✅ YES' if HOSTED_AI_API_KEY else '❌ NO'}")
    print(f"\n🔍 RAG Available: {RAG_AVAILABLE}")
    print(f"💻 Server: http://0.0.0.0:5000")
    print(f"{'='*70}")
    print(f"\n📋 Available Endpoints:")
    print(f"   POST /chat/transaction - Chat with CSV data (Hugging Face → Hosted AI fallback)")
    print(f"   GET  /user/csv_files - List user's CSV files")
    print(f"   GET  /health - Health check")
    print(f"   POST /user/cache/invalidate - Clear cache")
    print(f"   GET  /provider/status - Check AI provider status")
    print(f"{'='*70}\n")
    
    if not HF_API_TOKEN or HF_API_TOKEN == "":
        print(f"⚠️  WARNING: Hugging Face token not configured!")
        print(f"   Set environment variable: export HF_TOKEN='your_token_here'")
        print(f"   Get your token from: https://huggingface.co/settings/tokens")
    
    if not HOSTED_AI_API_KEY:
        print(f"⚠️  WARNING: Hosted AI API key not configured!")
        print(f"   Set environment variable: export HOSTED_AI_API_KEY='your_api_key_here'")
        print(f"   Set HOSTED_AI_URL to your service endpoint")
    
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
