from flask import Blueprint, request, jsonify
from utils.database import query_db, execute_db
from utils.helpers import token_required, admin_required, rows_to_dict_list, row_to_dict
import json
from datetime import datetime

bp = Blueprint('exams', __name__, url_prefix='/api/exams')

def check_answer(question_type, student_answer, correct_answer):
    if student_answer is None or student_answer == '':
        return False
    
    if question_type == 'multiple':
        student_sorted = ''.join(sorted(student_answer.upper()))
        correct_sorted = ''.join(sorted(correct_answer.upper()))
        return student_sorted == correct_sorted
    else:
        return student_answer.strip().upper() == correct_answer.strip().upper()

@bp.route('', methods=['GET'])
@token_required
def get_exams():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    status = request.args.get('status')
    keyword = request.args.get('keyword')
    
    user_role = request.user['role']
    user_id = request.user['user_id']
    
    query = '''
        SELECT e.*, p.title as paper_title, p.duration, p.total_score, s.name as subject_name
        FROM exams e 
        LEFT JOIN papers p ON e.paper_id = p.id 
        LEFT JOIN subjects s ON p.subject_id = s.id 
        WHERE 1=1
    '''
    params = []
    
    if user_role == 'student':
        query += ' AND e.id IN (SELECT exam_id FROM exam_students WHERE student_id = ?)'
        params.append(user_id)
    
    if status:
        query += ' AND e.status = ?'
        params.append(status)
    if keyword:
        query += ' AND e.title LIKE ?'
        params.append(f'%{keyword}%')
    
    query += ' ORDER BY e.id DESC LIMIT ? OFFSET ?'
    params.extend([per_page, (page - 1) * per_page])
    
    exams = query_db(query, params)
    result = rows_to_dict_list(exams)
    
    for exam in result:
        q_count = query_db('SELECT COUNT(*) as count FROM paper_questions WHERE paper_id = ?', 
                          (exam['paper_id'],), one=True)
        exam['question_count'] = q_count['count']
        
        if user_role == 'student':
            attempt = query_db('''
                SELECT * FROM exam_attempts 
                WHERE exam_id = ? AND student_id = ? 
                ORDER BY id DESC LIMIT 1
            ''', (exam['id'], user_id), one=True)
            exam['attempt'] = row_to_dict(attempt) if attempt else None
    
    count_query = '''
        SELECT COUNT(*) as total FROM exams e 
        LEFT JOIN papers p ON e.paper_id = p.id 
        WHERE 1=1
    '''
    count_params = []
    if user_role == 'student':
        count_query += ' AND e.id IN (SELECT exam_id FROM exam_students WHERE student_id = ?)'
        count_params.append(user_id)
    if status:
        count_query += ' AND e.status = ?'
        count_params.append(status)
    if keyword:
        count_query += ' AND e.title LIKE ?'
        count_params.append(f'%{keyword}%')
    total = query_db(count_query, count_params, one=True)['total']
    
    return jsonify({
        'items': result,
        'total': total,
        'page': page,
        'per_page': per_page
    })

@bp.route('/all', methods=['GET'])
@admin_required
def get_all_exams():
    exams = query_db('''
        SELECT e.*, p.title as paper_title, p.duration, p.total_score, s.name as subject_name
        FROM exams e 
        LEFT JOIN papers p ON e.paper_id = p.id 
        LEFT JOIN subjects s ON p.subject_id = s.id 
        ORDER BY e.id DESC
    ''')
    return jsonify(rows_to_dict_list(exams))

@bp.route('/<int:id>', methods=['GET'])
@token_required
def get_exam(id):
    user_role = request.user['role']
    user_id = request.user['user_id']
    
    exam = query_db('''
        SELECT e.*, p.title as paper_title, p.description as paper_description, 
               p.duration, p.total_score, s.name as subject_name
        FROM exams e 
        LEFT JOIN papers p ON e.paper_id = p.id 
        LEFT JOIN subjects s ON p.subject_id = s.id 
        WHERE e.id = ?
    ''', (id,), one=True)
    
    if not exam:
        return jsonify({'error': '考试不存在'}), 404
    
    result = row_to_dict(exam)
    
    if user_role == 'student':
        is_assigned = query_db(
            'SELECT 1 FROM exam_students WHERE exam_id = ? AND student_id = ?',
            (id, user_id), one=True
        )
        if not is_assigned:
            return jsonify({'error': '您没有参加此考试的权限'}), 403
    
    questions = query_db('''
        SELECT pq.*, q.type, q.content, q.options, q.answer, q.analysis, q.score as original_score,
               q.difficulty, q.knowledge_point
        FROM paper_questions pq 
        LEFT JOIN questions q ON pq.question_id = q.id 
        WHERE pq.paper_id = ? 
        ORDER BY pq.sort_order, pq.id
    ''', (result['paper_id'],))
    
    questions_list = []
    for q in questions:
        q_dict = row_to_dict(q)
        if q_dict['options']:
            q_dict['options'] = json.loads(q_dict['options'])
        questions_list.append(q_dict)
    
    result['questions'] = questions_list
    result['question_count'] = len(questions_list)
    result['actual_total_score'] = sum(q['score'] for q in questions_list)
    
    students = query_db('''
        SELECT es.student_id, u.username, u.real_name
        FROM exam_students es 
        LEFT JOIN users u ON es.student_id = u.id 
        WHERE es.exam_id = ?
    ''', (id,))
    result['students'] = rows_to_dict_list(students)
    
    return jsonify(result)

@bp.route('', methods=['POST'])
@admin_required
def create_exam():
    data = request.get_json()
    
    paper_id = data.get('paper_id')
    title = data.get('title')
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    student_ids = data.get('student_ids', [])
    
    if not paper_id or not title:
        return jsonify({'error': '试卷和考试标题不能为空'}), 400
    
    paper = query_db('SELECT id FROM papers WHERE id = ?', (paper_id,), one=True)
    if not paper:
        return jsonify({'error': '试卷不存在'}), 404
    
    exam_id = execute_db(
        'INSERT INTO exams (paper_id, title, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)',
        (paper_id, title, start_time, end_time, 'published')
    )
    
    if student_ids:
        for sid in student_ids:
            execute_db(
                'INSERT OR IGNORE INTO exam_students (exam_id, student_id) VALUES (?, ?)',
                (exam_id, sid)
            )
    
    return jsonify({'id': exam_id, 'message': '创建成功'})

@bp.route('/<int:id>', methods=['PUT'])
@admin_required
def update_exam(id):
    data = request.get_json()
    
    exam = query_db('SELECT id FROM exams WHERE id = ?', (id,), one=True)
    if not exam:
        return jsonify({'error': '考试不存在'}), 404
    
    if 'student_ids' in data:
        execute_db('DELETE FROM exam_students WHERE exam_id = ?', (id,))
        for sid in data['student_ids']:
            execute_db(
                'INSERT OR IGNORE INTO exam_students (exam_id, student_id) VALUES (?, ?)',
                (id, sid)
            )
        del data['student_ids']
    
    fields = ['paper_id', 'title', 'start_time', 'end_time', 'status']
    updates = []
    params = []
    
    for field in fields:
        if field in data:
            updates.append(f'{field} = ?')
            params.append(data[field])
    
    if updates:
        params.append(id)
        execute_db(f'UPDATE exams SET {", ".join(updates)} WHERE id = ?', params)
    
    return jsonify({'message': '更新成功'})

@bp.route('/<int:id>', methods=['DELETE'])
@admin_required
def delete_exam(id):
    exam = query_db('SELECT id FROM exams WHERE id = ?', (id,), one=True)
    if not exam:
        return jsonify({'error': '考试不存在'}), 404
    
    execute_db('DELETE FROM answers WHERE attempt_id IN (SELECT id FROM exam_attempts WHERE exam_id = ?)', (id,))
    execute_db('DELETE FROM exam_attempts WHERE exam_id = ?', (id,))
    execute_db('DELETE FROM exam_students WHERE exam_id = ?', (id,))
    execute_db('DELETE FROM exams WHERE id = ?', (id,))
    
    return jsonify({'message': '删除成功'})

@bp.route('/<int:id>/start', methods=['POST'])
@token_required
def start_exam(id):
    user_id = request.user['user_id']
    
    exam = query_db('SELECT * FROM exams WHERE id = ?', (id,), one=True)
    if not exam:
        return jsonify({'error': '考试不存在'}), 404
    
    if exam['status'] != 'published':
        return jsonify({'error': '考试未发布'}), 400
    
    is_assigned = query_db(
        'SELECT 1 FROM exam_students WHERE exam_id = ? AND student_id = ?',
        (id, user_id), one=True
    )
    if not is_assigned:
        return jsonify({'error': '您没有参加此考试的权限'}), 403
    
    existing = query_db('''
        SELECT * FROM exam_attempts 
        WHERE exam_id = ? AND student_id = ? AND status IN ('in_progress', 'submitted')
        ORDER BY id DESC LIMIT 1
    ''', (id, user_id), one=True)
    
    if existing and existing['status'] == 'submitted':
        return jsonify({'error': '您已经提交过此考试'}), 400
    
    if existing and existing['status'] == 'in_progress':
        attempt = existing
    else:
        attempt_id = execute_db(
            'INSERT INTO exam_attempts (exam_id, student_id, status) VALUES (?, ?, ?)',
            (id, user_id, 'in_progress')
        )
        attempt = query_db('SELECT * FROM exam_attempts WHERE id = ?', (attempt_id,), one=True)
    
    return jsonify(row_to_dict(attempt))

@bp.route('/<int:id>/submit', methods=['POST'])
@token_required
def submit_exam(id):
    user_id = request.user['user_id']
    data = request.get_json()
    answers = data.get('answers', {})
    
    exam = query_db('''
        SELECT e.*, p.duration 
        FROM exams e 
        LEFT JOIN papers p ON e.paper_id = p.id 
        WHERE e.id = ?
    ''', (id,), one=True)
    
    if not exam:
        return jsonify({'error': '考试不存在'}), 404
    
    attempt = query_db('''
        SELECT * FROM exam_attempts 
        WHERE exam_id = ? AND student_id = ? AND status = 'in_progress'
        ORDER BY id DESC LIMIT 1
    ''', (id, user_id), one=True)
    
    if not attempt:
        return jsonify({'error': '没有进行中的考试'}), 400
    
    paper_questions = query_db('''
        SELECT pq.*, q.type, q.answer
        FROM paper_questions pq 
        LEFT JOIN questions q ON pq.question_id = q.id 
        WHERE pq.paper_id = ?
    ''', (exam['paper_id'],))
    
    total_score = 0
    wrong_questions = []
    
    for pq in paper_questions:
        qid = pq['question_id']
        student_ans = answers.get(str(qid))
        is_correct = check_answer(pq['type'], student_ans, pq['answer'])
        score = pq['score'] if is_correct else 0
        
        if student_ans is not None:
            execute_db('''
                INSERT INTO answers (attempt_id, question_id, student_answer, is_correct, score)
                VALUES (?, ?, ?, ?, ?)
            ''', (attempt['id'], qid, student_ans, 1 if is_correct else 0, score))
        
        total_score += score
        
        if not is_correct:
            wrong_questions.append(qid)
    
    for qid in wrong_questions:
        existing = query_db(
            'SELECT * FROM wrong_questions WHERE student_id = ? AND question_id = ?',
            (user_id, qid), one=True
        )
        if existing:
            execute_db('''
                UPDATE wrong_questions 
                SET wrong_count = wrong_count + 1, last_wrong_time = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (existing['id'],))
        else:
            execute_db(
                'INSERT INTO wrong_questions (student_id, question_id) VALUES (?, ?)',
                (user_id, qid)
            )
    
    execute_db('''
        UPDATE exam_attempts 
        SET submit_time = CURRENT_TIMESTAMP, score = ?, status = 'submitted'
        WHERE id = ?
    ''', (total_score, attempt['id']))
    
    return jsonify({
        'message': '提交成功',
        'attempt_id': attempt['id'],
        'score': total_score
    })

@bp.route('/attempt/<int:attempt_id>', methods=['GET'])
@token_required
def get_attempt(attempt_id):
    user_id = request.user['user_id']
    user_role = request.user['role']
    
    attempt = query_db('SELECT * FROM exam_attempts WHERE id = ?', (attempt_id,), one=True)
    if not attempt:
        return jsonify({'error': '考试记录不存在'}), 404
    
    if user_role == 'student' and attempt['student_id'] != user_id:
        return jsonify({'error': '无权查看此记录'}), 403
    
    result = row_to_dict(attempt)
    
    exam = query_db('''
        SELECT e.*, p.title as paper_title, p.duration, p.total_score, s.name as subject_name
        FROM exams e 
        LEFT JOIN papers p ON e.paper_id = p.id 
        LEFT JOIN subjects s ON p.subject_id = s.id 
        WHERE e.id = ?
    ''', (result['exam_id'],), one=True)
    result['exam'] = row_to_dict(exam)
    
    student = query_db(
        'SELECT id, username, real_name FROM users WHERE id = ?',
        (result['student_id'],), one=True
    )
    result['student'] = row_to_dict(student)
    
    questions = query_db('''
        SELECT pq.*, q.type, q.content, q.options, q.answer, q.analysis,
               q.difficulty, q.knowledge_point
        FROM paper_questions pq 
        LEFT JOIN questions q ON pq.question_id = q.id 
        WHERE pq.paper_id = ? 
        ORDER BY pq.sort_order, pq.id
    ''', (exam['paper_id'],))
    
    questions_list = []
    for q in questions:
        q_dict = row_to_dict(q)
        if q_dict['options']:
            q_dict['options'] = json.loads(q_dict['options'])
        
        answer = query_db('''
            SELECT * FROM answers 
            WHERE attempt_id = ? AND question_id = ?
        ''', (attempt_id, q['question_id']), one=True)
        q_dict['student_answer'] = answer['student_answer'] if answer else None
        q_dict['is_correct'] = answer['is_correct'] if answer else 0
        q_dict['actual_score'] = answer['score'] if answer else 0
        
        questions_list.append(q_dict)
    
    result['questions'] = questions_list
    
    type_stats = {}
    knowledge_stats = {}
    for q in questions_list:
        q_type = q['type']
        if q_type not in type_stats:
            type_stats[q_type] = {'total': 0, 'correct': 0, 'score': 0, 'max_score': 0}
        type_stats[q_type]['total'] += 1
        type_stats[q_type]['max_score'] += q['score']
        if q['is_correct']:
            type_stats[q_type]['correct'] += 1
            type_stats[q_type]['score'] += q['actual_score']
        
        kp = q['knowledge_point'] or '未分类'
        if kp not in knowledge_stats:
            knowledge_stats[kp] = {'total': 0, 'correct': 0}
        knowledge_stats[kp]['total'] += 1
        if q['is_correct']:
            knowledge_stats[kp]['correct'] += 1
    
    result['type_stats'] = type_stats
    result['knowledge_stats'] = knowledge_stats
    
    total_correct = sum(1 for q in questions_list if q['is_correct'])
    result['correct_count'] = total_correct
    result['wrong_count'] = len(questions_list) - total_correct
    result['accuracy'] = round(total_correct / len(questions_list) * 100, 2) if questions_list else 0
    
    return jsonify(result)

@bp.route('/practice/generate', methods=['POST'])
@token_required
def generate_practice():
    data = request.get_json()
    subject_id = data.get('subject_id')
    q_type = data.get('type')
    difficulty = data.get('difficulty')
    count = int(data.get('count', 10))
    
    query = 'SELECT * FROM questions WHERE 1=1'
    params = []
    
    if subject_id:
        query += ' AND subject_id = ?'
        params.append(subject_id)
    if q_type:
        query += ' AND type = ?'
        params.append(q_type)
    if difficulty:
        query += ' AND difficulty = ?'
        params.append(difficulty)
    
    query += ' ORDER BY RANDOM() LIMIT ?'
    params.append(count)
    
    questions = query_db(query, params)
    result = []
    for q in questions:
        q_dict = row_to_dict(q)
        if q_dict['options']:
            q_dict['options'] = json.loads(q_dict['options'])
        result.append(q_dict)
    
    return jsonify({
        'questions': result,
        'total': len(result)
    })

@bp.route('/practice/submit', methods=['POST'])
@token_required
def submit_practice():
    data = request.get_json()
    answers = data.get('answers', {})
    questions = data.get('questions', [])
    
    def check_answer(q_type, student_answer, correct_answer):
        if student_answer is None or student_answer == '':
            return False
        if q_type == 'multiple':
            student_sorted = ''.join(sorted(student_answer.upper()))
            correct_sorted = ''.join(sorted(correct_answer.upper()))
            return student_sorted == correct_sorted
        else:
            return student_answer.strip().upper() == correct_answer.strip().upper()
    
    result = []
    correct_count = 0
    total_score = 0
    
    for q in questions:
        qid = q['id']
        student_ans = answers.get(str(qid))
        is_correct = check_answer(q['type'], student_ans, q['answer'])
        score = q['score'] if is_correct else 0
        
        if is_correct:
            correct_count += 1
        total_score += score
        
        result.append({
            'question_id': qid,
            'student_answer': student_ans,
            'correct_answer': q['answer'],
            'is_correct': is_correct,
            'score': score,
            'max_score': q['score'],
            'analysis': q.get('analysis', '')
        })
    
    return jsonify({
        'results': result,
        'correct_count': correct_count,
        'total_count': len(questions),
        'total_score': total_score,
        'max_score': sum(q['score'] for q in questions),
        'accuracy': round(correct_count / len(questions) * 100, 2) if questions else 0
    })
