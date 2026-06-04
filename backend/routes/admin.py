from flask import Blueprint, request, jsonify
from utils.database import query_db, execute_db
from utils.helpers import admin_required, rows_to_dict_list, row_to_dict

bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@bp.route('/students', methods=['GET'])
@admin_required
def get_students():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    keyword = request.args.get('keyword')
    
    query = "SELECT id, username, real_name, created_at FROM users WHERE role = 'student'"
    params = []
    
    if keyword:
        query += ' AND (username LIKE ? OR real_name LIKE ?)'
        params.extend([f'%{keyword}%', f'%{keyword}%'])
    
    query += ' ORDER BY id DESC LIMIT ? OFFSET ?'
    params.extend([per_page, (page - 1) * per_page])
    
    students = query_db(query, params)
    
    count_query = "SELECT COUNT(*) as total FROM users WHERE role = 'student'"
    count_params = []
    if keyword:
        count_query += ' AND (username LIKE ? OR real_name LIKE ?)'
        count_params.extend([f'%{keyword}%', f'%{keyword}%'])
    total = query_db(count_query, count_params, one=True)['total']
    
    return jsonify({
        'items': rows_to_dict_list(students),
        'total': total,
        'page': page,
        'per_page': per_page
    })

@bp.route('/students/all', methods=['GET'])
@admin_required
def get_all_students():
    students = query_db(
        "SELECT id, username, real_name, created_at FROM users WHERE role = 'student' ORDER BY id"
    )
    return jsonify(rows_to_dict_list(students))

@bp.route('/students/<int:id>', methods=['DELETE'])
@admin_required
def delete_student(id):
    user = query_db("SELECT id FROM users WHERE id = ? AND role = 'student'", (id,), one=True)
    if not user:
        return jsonify({'error': '学生不存在'}), 404
    
    execute_db('DELETE FROM exam_students WHERE student_id = ?', (id,))
    execute_db('DELETE FROM answers WHERE attempt_id IN (SELECT id FROM exam_attempts WHERE student_id = ?)', (id,))
    execute_db('DELETE FROM exam_attempts WHERE student_id = ?', (id,))
    execute_db('DELETE FROM wrong_questions WHERE student_id = ?', (id,))
    execute_db('DELETE FROM users WHERE id = ?', (id,))
    
    return jsonify({'message': '删除成功'})

@bp.route('/subjects', methods=['GET'])
@admin_required
def get_subjects():
    subjects = query_db('SELECT * FROM subjects ORDER BY id')
    return jsonify(rows_to_dict_list(subjects))

@bp.route('/subjects', methods=['POST'])
@admin_required
def create_subject():
    data = request.get_json()
    name = data.get('name')
    description = data.get('description', '')
    
    if not name:
        return jsonify({'error': '科目名称不能为空'}), 400
    
    existing = query_db('SELECT id FROM subjects WHERE name = ?', (name,), one=True)
    if existing:
        return jsonify({'error': '科目已存在'}), 400
    
    subject_id = execute_db(
        'INSERT INTO subjects (name, description) VALUES (?, ?)',
        (name, description)
    )
    
    return jsonify({'id': subject_id, 'message': '创建成功'})

@bp.route('/subjects/<int:id>', methods=['PUT'])
@admin_required
def update_subject(id):
    data = request.get_json()
    
    subject = query_db('SELECT id FROM subjects WHERE id = ?', (id,), one=True)
    if not subject:
        return jsonify({'error': '科目不存在'}), 404
    
    fields = ['name', 'description']
    updates = []
    params = []
    
    for field in fields:
        if field in data:
            updates.append(f'{field} = ?')
            params.append(data[field])
    
    if not updates:
        return jsonify({'message': '没有更新内容'})
    
    params.append(id)
    execute_db(f'UPDATE subjects SET {", ".join(updates)} WHERE id = ?', params)
    
    return jsonify({'message': '更新成功'})

@bp.route('/subjects/<int:id>', methods=['DELETE'])
@admin_required
def delete_subject(id):
    subject = query_db('SELECT id FROM subjects WHERE id = ?', (id,), one=True)
    if not subject:
        return jsonify({'error': '科目不存在'}), 404
    
    execute_db('DELETE FROM questions WHERE subject_id = ?', (id,))
    execute_db('DELETE FROM paper_questions WHERE paper_id IN (SELECT id FROM papers WHERE subject_id = ?)', (id,))
    execute_db('DELETE FROM exam_students WHERE exam_id IN (SELECT e.id FROM exams e LEFT JOIN papers p ON e.paper_id = p.id WHERE p.subject_id = ?)', (id,))
    execute_db('DELETE FROM exam_attempts WHERE exam_id IN (SELECT e.id FROM exams e LEFT JOIN papers p ON e.paper_id = p.id WHERE p.subject_id = ?)', (id,))
    execute_db('DELETE FROM exams WHERE paper_id IN (SELECT id FROM papers WHERE subject_id = ?)', (id,))
    execute_db('DELETE FROM papers WHERE subject_id = ?', (id,))
    execute_db('DELETE FROM subjects WHERE id = ?', (id,))
    
    return jsonify({'message': '删除成功'})
