import jwt
import datetime
from functools import wraps
from flask import request, jsonify, current_app
from .database import query_db

SECRET_KEY = 'exam-platform-secret-key-2024'

def generate_token(user_id, username, role):
    payload = {
        'user_id': user_id,
        'username': username,
        'role': role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def decode_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header[7:]
        
        if not token:
            return jsonify({'error': '缺少认证令牌'}), 401
        
        payload = decode_token(token)
        if not payload:
            return jsonify({'error': '无效或已过期的令牌'}), 401
        
        request.user = payload
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if request.user.get('role') != 'admin':
            return jsonify({'error': '需要管理员权限'}), 403
        return f(*args, **kwargs)
    return decorated

def row_to_dict(row):
    if row is None:
        return None
    return dict(zip(row.keys(), row))

def rows_to_dict_list(rows):
    return [row_to_dict(row) for row in rows]
