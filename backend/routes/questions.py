from flask import Blueprint, request, jsonify
from utils.database import query_db, execute_db
from utils.helpers import token_required, admin_required, rows_to_dict_list, row_to_dict
import json

bp = Blueprint('questions', __name__, url_prefix='/api/questions')

@bp.route('/subjects', methods=['GET'])
@token_required
def get_subjects():
    subjects = query_db('SELECT * FROM subjects ORDER BY id')
    return jsonify(rows_to_dict_list(subjects))

@bp.route('', methods=['GET'])
@token_required
def get_questions():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    subject_id = request.args.get('subject_id')
    q_type = request.args.get('type')
    difficulty = request.args.get('difficulty')
    keyword = request.args.get('keyword')
    
    query = 'SELECT q.*, s.name as subject_name FROM questions q LEFT JOIN subjects s ON q.subject_id = s.id WHERE 1=1'
    params = []
    
    if subject_id:
        query += ' AND q.subject_id = ?'
        params.append(subject_id)
    if q_type:
        query += ' AND q.type = ?'
        params.append(q_type)
    if difficulty:
        query += ' AND q.difficulty = ?'
        params.append(difficulty)
    if keyword:
        query += ' AND q.content LIKE ?'
        params.append(f'%{keyword}%')
    
    query += ' ORDER BY q.id DESC LIMIT ? OFFSET ?'
    params.extend([per_page, (page - 1) * per_page])
    
    questions = query_db(query, params)
    result = []
    for q in questions:
        q_dict = row_to_dict(q)
        if q_dict['options']:
            q_dict['options'] = json.loads(q_dict['options'])
        result.append(q_dict)
    
    count_query = 'SELECT COUNT(*) as total FROM questions q WHERE 1=1'
    count_params = []
    if subject_id:
        count_query += ' AND q.subject_id = ?'
        count_params.append(subject_id)
    if q_type:
        count_query += ' AND q.type = ?'
        count_params.append(q_type)
    if difficulty:
        count_query += ' AND q.difficulty = ?'
        count_params.append(difficulty)
    if keyword:
        count_query += ' AND q.content LIKE ?'
        count_params.append(f'%{keyword}%')
    
    total = query_db(count_query, count_params, one=True)['total']
    
    return jsonify({
        'items': result,
        'total': total,
        'page': page,
        'per_page': per_page
    })

@bp.route('/<int:id>', methods=['GET'])
@token_required
def get_question(id):
    question = query_db(
        'SELECT q.*, s.name as subject_name FROM questions q LEFT JOIN subjects s ON q.subject_id = s.id WHERE q.id = ?',
        (id,), one=True
    )
    
    if not question:
        return jsonify({'error': '题目不存在'}), 404
    
    result = row_to_dict(question)
    if result['options']:
        result['options'] = json.loads(result['options'])
    
    return jsonify(result)

@bp.route('', methods=['POST'])
@admin_required
def create_question():
    data = request.get_json()
    
    subject_id = data.get('subject_id')
    q_type = data.get('type')
    content = data.get('content')
    options = data.get('options')
    answer = data.get('answer')
    analysis = data.get('analysis', '')
    score = data.get('score', 10)
    difficulty = data.get('difficulty', 'medium')
    knowledge_point = data.get('knowledge_point', '')
    
    if not subject_id or not q_type or not content or not answer:
        return jsonify({'error': '必填字段不能为空'}), 400
    
    options_json = json.dumps(options, ensure_ascii=False) if options else None
    
    question_id = execute_db(
        '''INSERT INTO questions (subject_id, type, content, options, answer, analysis, score, difficulty, knowledge_point)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (subject_id, q_type, content, options_json, answer, analysis, score, difficulty, knowledge_point)
    )
    
    return jsonify({'id': question_id, 'message': '创建成功'})

@bp.route('/<int:id>', methods=['PUT'])
@admin_required
def update_question(id):
    data = request.get_json()
    
    question = query_db('SELECT id FROM questions WHERE id = ?', (id,), one=True)
    if not question:
        return jsonify({'error': '题目不存在'}), 404
    
    fields = ['subject_id', 'type', 'content', 'answer', 'analysis', 'score', 'difficulty', 'knowledge_point']
    updates = []
    params = []
    
    for field in fields:
        if field in data:
            updates.append(f'{field} = ?')
            params.append(data[field])
    
    if 'options' in data:
        updates.append('options = ?')
        params.append(json.dumps(data['options'], ensure_ascii=False) if data['options'] else None)
    
    if not updates:
        return jsonify({'message': '没有更新内容'})
    
    params.append(id)
    execute_db(f'UPDATE questions SET {", ".join(updates)} WHERE id = ?', params)
    
    return jsonify({'message': '更新成功'})

@bp.route('/<int:id>', methods=['DELETE'])
@admin_required
def delete_question(id):
    question = query_db('SELECT id FROM questions WHERE id = ?', (id,), one=True)
    if not question:
        return jsonify({'error': '题目不存在'}), 404
    
    execute_db('DELETE FROM paper_questions WHERE question_id = ?', (id,))
    execute_db('DELETE FROM questions WHERE id = ?', (id,))
    
    return jsonify({'message': '删除成功'})

@bp.route('/batch', methods=['POST'])
@admin_required
def batch_create_questions():
    data = request.get_json()
    questions = data.get('questions', [])
    
    if not questions:
        return jsonify({'error': '题目列表不能为空'}), 400
    
    created_ids = []
    for q in questions:
        options_json = json.dumps(q.get('options'), ensure_ascii=False) if q.get('options') else None
        qid = execute_db(
            '''INSERT INTO questions (subject_id, type, content, options, answer, analysis, score, difficulty, knowledge_point)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (q.get('subject_id'), q.get('type'), q.get('content'), options_json,
             q.get('answer'), q.get('analysis', ''), q.get('score', 10),
             q.get('difficulty', 'medium'), q.get('knowledge_point', ''))
        )
        created_ids.append(qid)
    
    return jsonify({'message': f'成功创建{len(created_ids)}道题目', 'ids': created_ids})
