#!/usr/bin/env python3
"""
SignBridge — Full Backend Server
Flask API with SQLite database, user auth, phrase history, and predictive suggestions.
"""

import os
import sqlite3
import hashlib
import hmac
import json
import time
import re
import secrets
from datetime import datetime, timedelta
from functools import wraps
from http.server import SimpleHTTPRequestHandler, HTTPServer
from flask import Flask, request, jsonify, send_from_directory

# ===== Configuration =====
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'signbridge.db')
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')
SECRET_KEY = os.environ.get('SECRET_KEY', secrets.token_hex(32))
TOKEN_EXPIRY_HOURS = 24

app = Flask(__name__, static_folder=PUBLIC_DIR, static_url_path='')

# ===== CORS (since the deployed Flask backend is called cross-origin from Firebase Hosting) =====
@app.after_request
def add_cors(resp):
    resp.headers['Access-Control-Allow-Origin'] = '*'
    resp.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return resp

@app.route('/api/<path:_>', methods=['OPTIONS'])
def cors_preflight(_):
    return ('', 204)

# ===== Database Setup =====

def get_db():
    """Get a database connection with row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    """Create tables if they don't exist."""
    conn = get_db()
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            user_type TEXT NOT NULL DEFAULT 'deaf',
            preferred_language TEXT DEFAULT 'en-US',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS phrases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            phrase TEXT NOT NULL,
            mode TEXT NOT NULL DEFAULT 'sign_to_speech',
            language TEXT DEFAULT 'en-US',
            used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_phrases_user ON phrases(user_id);
        CREATE INDEX IF NOT EXISTS idx_phrases_phrase ON phrases(phrase);
        CREATE INDEX IF NOT EXISTS idx_phrases_used ON phrases(used_at);
    ''')
    conn.commit()
    conn.close()

# ===== Password Hashing (using hashlib — no external deps) =====

def hash_password(password):
    """Hash password with salt using PBKDF2-SHA256."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return salt + ':' + key.hex()

def verify_password(password, stored_hash):
    """Verify password against stored hash."""
    try:
        salt, key_hex = stored_hash.split(':')
        key = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return hmac.compare_digest(key.hex(), key_hex)
    except Exception:
        return False

# ===== JWT-like Token (simple HMAC-based) =====

def create_token(user_id, username):
    """Create a signed token."""
    payload = {
        'user_id': user_id,
        'username': username,
        'exp': time.time() + (TOKEN_EXPIRY_HOURS * 3600)
    }
    payload_json = json.dumps(payload, separators=(',', ':'))
    import base64
    payload_b64 = base64.urlsafe_b64encode(payload_json.encode()).decode()
    sig = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
    return payload_b64 + '.' + sig

def verify_token(token):
    """Verify and decode a token. Returns payload dict or None."""
    try:
        import base64
        parts = token.split('.')
        if len(parts) != 2:
            return None
        payload_b64, sig = parts
        expected_sig = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))
        if payload.get('exp', 0) < time.time():
            return None
        return payload
    except Exception:
        return None

def auth_required(f):
    """Decorator to require authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
        token = auth_header[7:]
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        request.user_id = payload['user_id']
        request.username = payload['username']
        return f(*args, **kwargs)
    return decorated

# ===== Validation =====

def validate_registration(data):
    """Validate registration input."""
    errors = []
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    user_type = data.get('user_type', 'deaf')

    if not username or len(username) < 3:
        errors.append('Username must be at least 3 characters')
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        errors.append('Username can only contain letters, numbers, and underscores')
    if not email or not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
        errors.append('Valid email is required')
    if not password or len(password) < 6:
        errors.append('Password must be at least 6 characters')
    if user_type not in ('deaf', 'hearing'):
        errors.append('User type must be deaf or hearing')

    return errors

# ===== API Routes =====

@app.route('/')
def index():
    return send_from_directory(PUBLIC_DIR, 'index.html')

# --- Auth ---

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'JSON body required'}), 400

    errors = validate_registration(data)
    if errors:
        return jsonify({'error': '; '.join(errors)}), 400

    username = data['username'].strip().lower()
    email = data['email'].strip().lower()
    password_hash = hash_password(data['password'])
    user_type = data.get('user_type', 'deaf')
    language = data.get('preferred_language', 'en-US')

    conn = get_db()
    try:
        conn.execute(
            'INSERT INTO users (username, email, password_hash, user_type, preferred_language) VALUES (?, ?, ?, ?, ?)',
            (username, email, password_hash, user_type, language)
        )
        conn.commit()
        user_id = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
        token = create_token(user_id, username)
        return jsonify({
            'token': token,
            'user': {'id': user_id, 'username': username, 'email': email, 'user_type': user_type, 'preferred_language': language}
        }), 201
    except sqlite3.IntegrityError as e:
        if 'username' in str(e):
            return jsonify({'error': 'Username already taken'}), 409
        elif 'email' in str(e):
            return jsonify({'error': 'Email already registered'}), 409
        return jsonify({'error': 'Registration failed'}), 409
    finally:
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'JSON body required'}), 400

    username = data.get('username', '').strip().lower()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE username = ? OR email = ?', (username, username)).fetchone()
    conn.close()

    if not user or not verify_password(password, user['password_hash']):
        return jsonify({'error': 'Invalid username or password'}), 401

    token = create_token(user['id'], user['username'])
    return jsonify({
        'token': token,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'user_type': user['user_type'],
            'preferred_language': user['preferred_language']
        }
    })

@app.route('/api/me', methods=['GET'])
@auth_required
def get_profile():
    conn = get_db()
    user = conn.execute('SELECT id, username, email, user_type, preferred_language, created_at FROM users WHERE id = ?', (request.user_id,)).fetchone()
    phrase_count = conn.execute('SELECT COUNT(*) FROM phrases WHERE user_id = ?', (request.user_id,)).fetchone()[0]
    conn.close()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({
        'user': dict(user),
        'phrase_count': phrase_count
    })

@app.route('/api/me', methods=['PUT'])
@auth_required
def update_profile():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'JSON body required'}), 400

    conn = get_db()
    if 'preferred_language' in data:
        conn.execute('UPDATE users SET preferred_language = ? WHERE id = ?', (data['preferred_language'], request.user_id))
    if 'user_type' in data and data['user_type'] in ('deaf', 'hearing'):
        conn.execute('UPDATE users SET user_type = ? WHERE id = ?', (data['user_type'], request.user_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Profile updated'})

# --- Phrases ---

@app.route('/api/phrases', methods=['POST'])
@auth_required
def save_phrase():
    """Save a phrase to user's history."""
    data = request.get_json()
    if not data or not data.get('phrase', '').strip():
        return jsonify({'error': 'Phrase is required'}), 400

    phrase = data['phrase'].strip()[:500]  # limit length
    mode = data.get('mode', 'sign_to_speech')
    language = data.get('language', 'en-US')

    conn = get_db()
    conn.execute(
        'INSERT INTO phrases (user_id, phrase, mode, language) VALUES (?, ?, ?, ?)',
        (request.user_id, phrase, mode, language)
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Phrase saved'}), 201

@app.route('/api/phrases', methods=['GET'])
@auth_required
def get_phrases():
    """Get user's phrase history."""
    limit = min(int(request.args.get('limit', 50)), 200)
    conn = get_db()
    phrases = conn.execute(
        'SELECT phrase, mode, language, used_at FROM phrases WHERE user_id = ? ORDER BY used_at DESC LIMIT ?',
        (request.user_id, limit)
    ).fetchall()
    conn.close()
    return jsonify({'phrases': [dict(p) for p in phrases]})

@app.route('/api/phrases/frequent', methods=['GET'])
@auth_required
def get_frequent_phrases():
    """Get user's most frequently used phrases (for suggestions)."""
    limit = min(int(request.args.get('limit', 10)), 30)
    conn = get_db()
    phrases = conn.execute('''
        SELECT phrase, COUNT(*) as count, MAX(used_at) as last_used
        FROM phrases WHERE user_id = ?
        GROUP BY LOWER(phrase)
        ORDER BY count DESC, last_used DESC
        LIMIT ?
    ''', (request.user_id, limit)).fetchall()
    conn.close()
    return jsonify({'phrases': [dict(p) for p in phrases]})

@app.route('/api/phrases/suggest', methods=['GET'])
@auth_required
def suggest_phrases():
    """
    Predictive suggestions based on:
    1. User's own frequent phrases matching the prefix
    2. Common phrases from all users matching the prefix
    3. Built-in common ASL phrases
    Returns up to 5 suggestions.
    """
    prefix = request.args.get('q', '').strip().lower()
    limit = 5

    conn = get_db()
    suggestions = []

    if prefix:
        # User's own frequent phrases matching prefix
        user_phrases = conn.execute('''
            SELECT phrase, COUNT(*) as score
            FROM phrases WHERE user_id = ? AND LOWER(phrase) LIKE ?
            GROUP BY LOWER(phrase)
            ORDER BY score DESC LIMIT ?
        ''', (request.user_id, prefix + '%', limit)).fetchall()
        for p in user_phrases:
            suggestions.append({'phrase': p['phrase'], 'source': 'history', 'score': p['score'] * 3})

        # Global popular phrases matching prefix (from other users too)
        if len(suggestions) < limit:
            global_phrases = conn.execute('''
                SELECT phrase, COUNT(*) as score
                FROM phrases WHERE LOWER(phrase) LIKE ? AND user_id != ?
                GROUP BY LOWER(phrase)
                ORDER BY score DESC LIMIT ?
            ''', (prefix + '%', request.user_id, limit - len(suggestions))).fetchall()
            for p in global_phrases:
                if not any(s['phrase'].lower() == p['phrase'].lower() for s in suggestions):
                    suggestions.append({'phrase': p['phrase'], 'source': 'popular', 'score': p['score']})
    else:
        # No prefix — return user's top recent phrases
        recent = conn.execute('''
            SELECT phrase, COUNT(*) as score
            FROM phrases WHERE user_id = ?
            GROUP BY LOWER(phrase)
            ORDER BY score DESC, MAX(used_at) DESC LIMIT ?
        ''', (request.user_id, limit)).fetchall()
        for p in recent:
            suggestions.append({'phrase': p['phrase'], 'source': 'recent', 'score': p['score']})

    conn.close()

    # Add built-in common phrases if we still have room
    builtins = ['Hello', 'Thank you', 'How are you', 'Please help', 'I need help',
                'Where is the bathroom', 'Nice to meet you', 'My name is',
                'Can you repeat', 'I understand', 'I dont understand', 'Goodbye',
                'Yes', 'No', 'Sorry', 'Excuse me']
    if prefix:
        builtins = [b for b in builtins if b.lower().startswith(prefix)]

    for b in builtins:
        if len(suggestions) >= limit:
            break
        if not any(s['phrase'].lower() == b.lower() for s in suggestions):
            suggestions.append({'phrase': b, 'source': 'common', 'score': 0})

    # Sort: user history first, then popular, then common
    source_priority = {'history': 0, 'popular': 1, 'recent': 0, 'common': 2}
    suggestions.sort(key=lambda s: (source_priority.get(s['source'], 9), -s['score']))

    return jsonify({'suggestions': suggestions[:limit]})

@app.route('/api/phrases', methods=['DELETE'])
@auth_required
def clear_phrases():
    """Clear all user's phrase history."""
    conn = get_db()
    conn.execute('DELETE FROM phrases WHERE user_id = ?', (request.user_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Phrase history cleared'})

# --- Personalization & Keep-Alive ---

@app.route('/api/personalize', methods=['GET'])
def personalize():
    """
    Returns a user's top-N most-used phrases for video preloading.
    Auth optional — falls back to popular phrases for anonymous calls.
    Designed to be called early on app load for warm-cache UX.
    """
    uid = request.args.get('uid', '').strip()
    limit = min(int(request.args.get('limit', 5)), 20)

    conn = get_db()
    if uid:
        rows = conn.execute('''
            SELECT phrase, COUNT(*) as count
            FROM phrases
            WHERE user_id = (SELECT id FROM users WHERE id = ?)
            GROUP BY LOWER(phrase)
            ORDER BY count DESC, MAX(used_at) DESC
            LIMIT ?
        ''', (uid, limit)).fetchall()
    else:
        rows = []

    # If no user-specific data, fall back to global popular phrases
    if not rows:
        rows = conn.execute('''
            SELECT phrase, COUNT(*) as count
            FROM phrases
            GROUP BY LOWER(phrase)
            ORDER BY count DESC
            LIMIT ?
        ''', (limit,)).fetchall()

    conn.close()
    phrases = [r['phrase'] for r in rows]
    return jsonify({'phrases': phrases, 'count': len(phrases)})


@app.route('/api/ping', methods=['GET'])
def ping():
    """Keep-alive endpoint — pinged every 10 min by the client to prevent Render free-tier sleep."""
    return jsonify({'pong': True, 'time': datetime.utcnow().isoformat() + 'Z'})


# --- Static Files ---

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(PUBLIC_DIR, path)

# ===== Start Server =====

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 3000))
    print(f'SignBridge running at http://localhost:{port}')
    app.run(host='0.0.0.0', port=port, debug=True)
