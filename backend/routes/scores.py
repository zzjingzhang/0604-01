from flask import Blueprint, request, jsonify
from utils.database import query_db, execute_db
from utils.helpers import token_required, admin_required, rows_to_dict_list, row_to_dict
import json

bp = Blueprint('scores', __name__, url_prefix='/api/scores')

@bp.route('/my', methods=['GET'])
@token_required
def get_my_scores():
    user_id = request.user['user_id']
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    exam_id = request.args.get('exam_id')
    
    query = '''
        SELECT ea.*, e.title as exam_title, p.title as paper_title, 
               p.total_score, s.name as subject_name
        FROM exam_attempts ea 
        LEFT JOIN exams e ON ea.exam_id = e.id 
        LEFT JOIN papers p ON e.paper_id = p.id 
        LEFT JOIN subjects s ON p.subject_id = s.id 
        WHERE ea.student_id = ? AND ea.status = 'submitted'
    '''
    params = [user_id]
    
    if exam_id:
        query += ' AND ea.exam_id = ?'
        params.append(exam_id)
    
    query += ' ORDER BY ea.submit_time DESC LIMIT ? OFFSET ?'
    params.extend([per_page, (page - 1) * per_page])
    
    attempts = query_db(query, params)
    result = rows_to_dict_list(attempts)
    
    count_query = '''
        SELECT COUNT(*) as total FROM exam_attempts ea 
        WHERE ea.student_id = ? AND ea.status = 'submitted'
    '''
    count_params = [user_id]
    if exam_id:
        count_query += ' AND ea.exam_id = ?'
        count_params.append(exam_id)
    total = query_db(count_query, count_params, one=True)['total']
    
    return jsonify({
        'items': result,
        'total': total,
        'page': page,
        'per_page': per_page
    })

@bp.route('/wrong-questions', methods=['GET'])
@token_required
def get_wrong_questions():
    user_id = request.user['user_id']
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    subject_id = request.args.get('subject_id')
    
    query = '''
        SELECT wq.*, q.type, q.content, q.options, q.answer, q.analysis,
               q.score, q.difficulty, q.knowledge_point, s.name as subject_name
        FROM wrong_questions wq 
        LEFT JOIN questions q ON wq.question_id = q.id 
        LEFT JOIN subjects s ON q.subject_id = s.id 
        WHERE wq.student_id = ?
    '''
    params = [user_id]
    
    if subject_id:
        query += ' AND q.subject_id = ?'
        params.append(subject_id)
    
    query += ' ORDER BY wq.last_wrong_time DESC LIMIT ? OFFSET ?'
    params.extend([per_page, (page - 1) * per_page])
    
    questions = query_db(query, params)
    result = []
    for q in questions:
        q_dict = row_to_dict(q)
        if q_dict['options']:
            q_dict['options'] = json.loads(q_dict['options'])
        result.append(q_dict)
    
    count_query = '''
        SELECT COUNT(*) as total FROM wrong_questions wq 
        LEFT JOIN questions q ON wq.question_id = q.id 
        WHERE wq.student_id = ?
    '''
    count_params = [user_id]
    if subject_id:
        count_query += ' AND q.subject_id = ?'
        count_params.append(subject_id)
    total = query_db(count_query, count_params, one=True)['total']
    
    return jsonify({
        'items': result,
        'total': total,
        'page': page,
        'per_page': per_page
    })

@bp.route('/wrong-questions/<int:question_id>', methods=['DELETE'])
@token_required
def remove_wrong_question(question_id):
    user_id = request.user['user_id']
    
    execute_db(
        'DELETE FROM wrong_questions WHERE student_id = ? AND question_id = ?',
        (user_id, question_id)
    )
    
    return jsonify({'message': '删除成功'})

@bp.route('/wrong-questions/clear', methods=['POST'])
@token_required
def clear_wrong_questions():
    user_id = request.user['user_id']
    
    execute_db('DELETE FROM wrong_questions WHERE student_id = ?', (user_id,))
    
    return jsonify({'message': '清空成功'})

@bp.route('/statistics', methods=['GET'])
@admin_required
def get_statistics():
    exam_id = request.args.get('exam_id')
    subject_id = request.args.get('subject_id')
    
    if not exam_id and not subject_id:
        return jsonify({'error': '请指定考试或科目'}), 400
    
    attempts_query = '''
        SELECT ea.*, u.username, u.real_name, e.title as exam_title, 
               p.title as paper_title, p.total_score
        FROM exam_attempts ea 
        LEFT JOIN users u ON ea.student_id = u.id 
        LEFT JOIN exams e ON ea.exam_id = e.id 
        LEFT JOIN papers p ON e.paper_id = p.id 
        WHERE ea.status = 'submitted'
    '''
    params = []
    
    if exam_id:
        attempts_query += ' AND ea.exam_id = ?'
        params.append(exam_id)
    if subject_id:
        attempts_query += ' AND p.subject_id = ?'
        params.append(subject_id)
    
    attempts_query += ' ORDER BY ea.score DESC'
    attempts = query_db(attempts_query, params)
    attempt_list = rows_to_dict_list(attempts)
    
    if not attempt_list:
        return jsonify({
            'attempts': [],
            'avg_score': 0,
            'max_score': 0,
            'min_score': 0,
            'pass_rate': 0,
            'excellent_rate': 0,
            'score_distribution': {
                '0-59': 0, '60-69': 0, '70-79': 0, '80-89': 0, '90-100': 0
            },
            'total_count': 0
        })
    
    scores = [a['score'] for a in attempt_list]
    total_score = attempt_list[0]['total_score']
    
    avg_score = round(sum(scores) / len(scores), 2)
    max_score = max(scores)
    min_score = min(scores)
    
    pass_count = sum(1 for s in scores if s >= total_score * 0.6)
    excellent_count = sum(1 for s in scores if s >= total_score * 0.9)
    
    distribution = {'0-59': 0, '60-69': 0, '70-79': 0, '80-89': 0, '90-100': 0}
    for s in scores:
        percentage = s / total_score * 100
        if percentage < 60:
            distribution['0-59'] += 1
        elif percentage < 70:
            distribution['60-69'] += 1
        elif percentage < 80:
            distribution['70-79'] += 1
        elif percentage < 90:
            distribution['80-89'] += 1
        else:
            distribution['90-100'] += 1
    
    return jsonify({
        'attempts': attempt_list,
        'avg_score': avg_score,
        'max_score': max_score,
        'min_score': min_score,
        'pass_rate': round(pass_count / len(scores) * 100, 2),
        'excellent_rate': round(excellent_count / len(scores) * 100, 2),
        'score_distribution': distribution,
        'total_count': len(scores),
        'total_score': total_score
    })

@bp.route('/overview', methods=['GET'])
@admin_required
def get_overview():
    total_students = query_db(
        "SELECT COUNT(*) as count FROM users WHERE role = 'student'",
        one=True
    )['count']
    
    total_questions = query_db(
        'SELECT COUNT(*) as count FROM questions',
        one=True
    )['count']
    
    total_papers = query_db(
        'SELECT COUNT(*) as count FROM papers',
        one=True
    )['count']
    
    total_exams = query_db(
        'SELECT COUNT(*) as count FROM exams',
        one=True
    )['count']
    
    total_attempts = query_db(
        "SELECT COUNT(*) as count FROM exam_attempts WHERE status = 'submitted'",
        one=True
    )['count']
    
    recent_exams = query_db('''
        SELECT e.*, p.title as paper_title, p.total_score, s.name as subject_name,
               (SELECT COUNT(*) FROM exam_attempts ea WHERE ea.exam_id = e.id AND ea.status = 'submitted') as attempt_count
        FROM exams e 
        LEFT JOIN papers p ON e.paper_id = p.id 
        LEFT JOIN subjects s ON p.subject_id = s.id 
        ORDER BY e.id DESC LIMIT 5
    ''')
    
    recent_attempts = query_db('''
        SELECT ea.*, u.username, u.real_name, e.title as exam_title, p.total_score
        FROM exam_attempts ea 
        LEFT JOIN users u ON ea.student_id = u.id 
        LEFT JOIN exams e ON ea.exam_id = e.id 
        LEFT JOIN papers p ON e.paper_id = p.id 
        WHERE ea.status = 'submitted'
        ORDER BY ea.submit_time DESC LIMIT 10
    ''')
    
    return jsonify({
        'total_students': total_students,
        'total_questions': total_questions,
        'total_papers': total_papers,
        'total_exams': total_exams,
        'total_attempts': total_attempts,
        'recent_exams': rows_to_dict_list(recent_exams),
        'recent_attempts': rows_to_dict_list(recent_attempts)
    })

@bp.route('/student/<int:student_id>/overview', methods=['GET'])
@token_required
def get_student_overview(student_id):
    user_id = request.user['user_id']
    user_role = request.user['role']
    
    if user_role == 'student' and student_id != user_id:
        return jsonify({'error': '无权查看'}), 403
    
    total_attempts = query_db(
        "SELECT COUNT(*) as count FROM exam_attempts WHERE student_id = ? AND status = 'submitted'",
        (student_id,), one=True
    )['count']
    
    avg_score = query_db('''
        SELECT AVG(score) as avg FROM exam_attempts 
        WHERE student_id = ? AND status = 'submitted'
    ''', (student_id,), one=True)['avg'] or 0
    
    total_wrong = query_db(
        'SELECT COUNT(*) as count FROM wrong_questions WHERE student_id = ?',
        (student_id,), one=True
    )['count']
    
    recent_attempts = query_db('''
        SELECT ea.*, e.title as exam_title, p.title as paper_title, p.total_score, s.name as subject_name
        FROM exam_attempts ea 
        LEFT JOIN exams e ON ea.exam_id = e.id 
        LEFT JOIN papers p ON e.paper_id = p.id 
        LEFT JOIN subjects s ON p.subject_id = s.id 
        WHERE ea.student_id = ? AND ea.status = 'submitted'
        ORDER BY ea.submit_time DESC LIMIT 5
    ''', (student_id,))
    
    subject_stats = query_db('''
        SELECT s.id, s.name, 
               COUNT(ea.id) as attempt_count,
               AVG(ea.score) as avg_score,
               MAX(ea.score) as max_score
        FROM exam_attempts ea 
        LEFT JOIN exams e ON ea.exam_id = e.id 
        LEFT JOIN papers p ON e.paper_id = p.id 
        LEFT JOIN subjects s ON p.subject_id = s.id 
        WHERE ea.student_id = ? AND ea.status = 'submitted'
        GROUP BY s.id, s.name
    ''', (student_id,))
    
    return jsonify({
        'total_attempts': total_attempts,
        'avg_score': round(avg_score, 2),
        'total_wrong': total_wrong,
        'recent_attempts': rows_to_dict_list(recent_attempts),
        'subject_stats': rows_to_dict_list(subject_stats)
    })
