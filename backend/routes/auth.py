from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from utils.database import query_db, execute_db
from utils.helpers import generate_token, token_required, row_to_dict

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': '用户名和密码不能为空'}), 400
    
    user = query_db('SELECT * FROM users WHERE username = ?', (username,), one=True)
    
    if not user:
        return jsonify({'error': '用户不存在'}), 401
    
    if not check_password_hash(user['password'], password):
        return jsonify({'error': '密码错误'}), 401
    
    token = generate_token(user['id'], user['username'], user['role'])
    
    return jsonify({
        'token': token,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'role': user['role'],
            'real_name': user['real_name']
        }
    })

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    real_name = data.get('real_name', '')
    
    if not username or not password:
        return jsonify({'error': '用户名和密码不能为空'}), 400
    
    existing = query_db('SELECT id FROM users WHERE username = ?', (username,), one=True)
    if existing:
        return jsonify({'error': '用户名已存在'}), 400
    
    hashed_pwd = generate_password_hash(password)
    user_id = execute_db(
        'INSERT INTO users (username, password, role, real_name) VALUES (?, ?, ?, ?)',
        (username, hashed_pwd, 'student', real_name)
    )
    
    user = query_db('SELECT * FROM users WHERE id = ?', (user_id,), one=True)
    token = generate_token(user['id'], user['username'], user['role'])
    
    return jsonify({
        'token': token,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'role': user['role'],
            'real_name': user['real_name']
        }
    })

@bp.route('/profile', methods=['GET'])
@token_required
def profile():
    user_id = request.user['user_id']
    user = query_db('SELECT id, username, role, real_name, created_at FROM users WHERE id = ?', (user_id,), one=True)
    
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    
    return jsonify(row_to_dict(user))
