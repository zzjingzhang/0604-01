from flask import Blueprint, request, jsonify
from utils.database import query_db, execute_db
from utils.helpers import token_required, admin_required, rows_to_dict_list, row_to_dict
import json

bp = Blueprint('papers', __name__, url_prefix='/api/papers')

@bp.route('', methods=['GET'])
@token_required
def get_papers():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    subject_id = request.args.get('subject_id')
    keyword = request.args.get('keyword')
    
    query = 'SELECT p.*, s.name as subject_name FROM papers p LEFT JOIN subjects s ON p.subject_id = s.id WHERE 1=1'
    params = []
    
    if subject_id:
        query += ' AND p.subject_id = ?'
        params.append(subject_id)
    if keyword:
        query += ' AND p.title LIKE ?'
        params.append(f'%{keyword}%')
    
    query += ' ORDER BY p.id DESC LIMIT ? OFFSET ?'
    params.extend([per_page, (page - 1) * per_page])
    
    papers = query_db(query, params)
    result = rows_to_dict_list(papers)
    
    for paper in result:
        q_count = query_db('SELECT COUNT(*) as count FROM paper_questions WHERE paper_id = ?', 
                          (paper['id'],), one=True)
        paper['question_count'] = q_count['count']
    
    count_query = 'SELECT COUNT(*) as total FROM papers p WHERE 1=1'
    count_params = []
    if subject_id:
        count_query += ' AND p.subject_id = ?'
        count_params.append(subject_id)
    if keyword:
        count_query += ' AND p.title LIKE ?'
        count_params.append(f'%{keyword}%')
    total = query_db(count_query, count_params, one=True)['total']
    
    return jsonify({
        'items': result,
        'total': total,
        'page': page,
        'per_page': per_page
    })

@bp.route('/all', methods=['GET'])
@token_required
def get_all_papers():
    papers = query_db('SELECT p.*, s.name as subject_name FROM papers p LEFT JOIN subjects s ON p.subject_id = s.id ORDER BY p.id DESC')
    return jsonify(rows_to_dict_list(papers))

@bp.route('/<int:id>', methods=['GET'])
@token_required
def get_paper(id):
    paper = query_db(
        'SELECT p.*, s.name as subject_name FROM papers p LEFT JOIN subjects s ON p.subject_id = s.id WHERE p.id = ?',
        (id,), one=True
    )
    
    if not paper:
        return jsonify({'error': '试卷不存在'}), 404
    
    result = row_to_dict(paper)
    
    questions = query_db('''
        SELECT pq.*, q.type, q.content, q.options, q.answer, q.analysis, q.score as original_score,
               q.difficulty, q.knowledge_point
        FROM paper_questions pq 
        LEFT JOIN questions q ON pq.question_id = q.id 
        WHERE pq.paper_id = ? 
        ORDER BY pq.sort_order, pq.id
    ''', (id,))
    
    questions_list = []
    for q in questions:
        q_dict = row_to_dict(q)
        if q_dict['options']:
            q_dict['options'] = json.loads(q_dict['options'])
        questions_list.append(q_dict)
    
    result['questions'] = questions_list
    result['question_count'] = len(questions_list)
    result['actual_total_score'] = sum(q['score'] for q in questions_list)
    
    return jsonify(result)

@bp.route('', methods=['POST'])
@admin_required
def create_paper():
    data = request.get_json()
    
    title = data.get('title')
    subject_id = data.get('subject_id')
    description = data.get('description', '')
    total_score = data.get('total_score', 100)
    duration = data.get('duration', 60)
    
    if not title or not subject_id:
        return jsonify({'error': '试卷标题和科目不能为空'}), 400
    
    paper_id = execute_db(
        'INSERT INTO papers (title, subject_id, description, total_score, duration) VALUES (?, ?, ?, ?, ?)',
        (title, subject_id, description, total_score, duration)
    )
    
    return jsonify({'id': paper_id, 'message': '创建成功'})

@bp.route('/<int:id>', methods=['PUT'])
@admin_required
def update_paper(id):
    data = request.get_json()
    
    paper = query_db('SELECT id FROM papers WHERE id = ?', (id,), one=True)
    if not paper:
        return jsonify({'error': '试卷不存在'}), 404
    
    fields = ['title', 'subject_id', 'description', 'total_score', 'duration']
    updates = []
    params = []
    
    for field in fields:
        if field in data:
            updates.append(f'{field} = ?')
            params.append(data[field])
    
    if not updates:
        return jsonify({'message': '没有更新内容'})
    
    params.append(id)
    execute_db(f'UPDATE papers SET {", ".join(updates)} WHERE id = ?', params)
    
    return jsonify({'message': '更新成功'})

@bp.route('/<int:id>', methods=['DELETE'])
@admin_required
def delete_paper(id):
    paper = query_db('SELECT id FROM papers WHERE id = ?', (id,), one=True)
    if not paper:
        return jsonify({'error': '试卷不存在'}), 404
    
    execute_db('DELETE FROM paper_questions WHERE paper_id = ?', (id,))
    execute_db('DELETE FROM exam_students WHERE exam_id IN (SELECT id FROM exams WHERE paper_id = ?)', (id,))
    execute_db('DELETE FROM exam_attempts WHERE exam_id IN (SELECT id FROM exams WHERE paper_id = ?)', (id,))
    execute_db('DELETE FROM exams WHERE paper_id = ?', (id,))
    execute_db('DELETE FROM papers WHERE id = ?', (id,))
    
    return jsonify({'message': '删除成功'})

@bp.route('/<int:id>/questions', methods=['POST'])
@admin_required
def add_questions_to_paper(id):
    data = request.get_json()
    questions = data.get('questions', [])
    
    paper = query_db('SELECT id FROM papers WHERE id = ?', (id,), one=True)
    if not paper:
        return jsonify({'error': '试卷不存在'}), 404
    
    if not questions:
        return jsonify({'error': '题目列表不能为空'}), 400
    
    execute_db('DELETE FROM paper_questions WHERE paper_id = ?', (id,))
    
    for idx, q in enumerate(questions):
        execute_db(
            'INSERT INTO paper_questions (paper_id, question_id, score, sort_order) VALUES (?, ?, ?, ?)',
            (id, q.get('question_id'), q.get('score', 10), idx)
        )
    
    return jsonify({'message': f'成功添加{len(questions)}道题目'})

@bp.route('/<int:id>/question/<int:question_id>', methods=['DELETE'])
@admin_required
def remove_question_from_paper(id, question_id):
    paper = query_db('SELECT id FROM papers WHERE id = ?', (id,), one=True)
    if not paper:
        return jsonify({'error': '试卷不存在'}), 404
    
    execute_db('DELETE FROM paper_questions WHERE paper_id = ? AND question_id = ?', (id, question_id))
    
    return jsonify({'message': '删除成功'})
