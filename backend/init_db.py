import sqlite3
import os
from werkzeug.security import generate_password_hash

def init_database():
    db_path = os.path.join(os.path.dirname(__file__), 'instance', 'exam.db')
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    if os.path.exists(db_path):
        os.remove(db_path)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    with open(os.path.join(os.path.dirname(__file__), 'models.py'), 'r', encoding='utf-8') as f:
        sql_script = f.read()
    cursor.executescript(sql_script)
    print('数据库表创建成功')
    
    admin_pwd = generate_password_hash('123456')
    student_pwd = generate_password_hash('123456')
    
    cursor.execute('INSERT INTO users (username, password, role, real_name) VALUES (?, ?, ?, ?)',
                   ('admin', admin_pwd, 'admin', '系统管理员'))
    cursor.execute('INSERT INTO users (username, password, role, real_name) VALUES (?, ?, ?, ?)',
                   ('student', student_pwd, 'student', '测试学生'))
    cursor.execute('INSERT INTO users (username, password, role, real_name) VALUES (?, ?, ?, ?)',
                   ('zhangshan', student_pwd, 'student', '张三'))
    cursor.execute('INSERT INTO users (username, password, role, real_name) VALUES (?, ?, ?, ?)',
                   ('lisi', student_pwd, 'student', '李四'))
    print('用户数据插入成功')
    
    subjects = [
        ('计算机基础', '计算机科学基础知识'),
        ('Python程序设计', 'Python编程语言基础与应用'),
        ('数据结构与算法', '常用数据结构与算法分析'),
        ('数据库原理', '关系型数据库原理与应用')
    ]
    for subj in subjects:
        cursor.execute('INSERT INTO subjects (name, description) VALUES (?, ?)', subj)
    print('科目数据插入成功')
    
    questions_data = [
        (1, 'single', '计算机中用来存储程序和数据的部件是？', 
         '["A. 控制器", "B. 运算器", "C. 存储器", "D. 输入设备"]', 'C', 
         '存储器是计算机的记忆装置，用于存储程序和数据。', 10, 'easy', '计算机硬件'),
        (1, 'single', '以下哪个不是计算机的特点？',
         '["A. 运算速度快", "B. 计算精度高", "C. 具有记忆和逻辑判断能力", "D. 无需程序控制"]', 'D',
         '计算机必须按照程序运行，不能脱离程序控制。', 10, 'easy', '计算机概述'),
        (1, 'multiple', '以下属于输入设备的有？',
         '["A. 键盘", "B. 鼠标", "C. 显示器", "D. 扫描仪"]', 'ABD',
         '显示器属于输出设备，键盘、鼠标、扫描仪属于输入设备。', 15, 'medium', '计算机硬件'),
        (1, 'judge', 'CPU由运算器和控制器两部分组成。',
         None, 'A',
         'CPU（中央处理器）主要由运算器和控制器组成，运算器负责算术和逻辑运算，控制器负责指令控制。', 10, 'easy', 'CPU结构'),
        (2, 'single', 'Python中用于定义函数的关键字是？',
         '["A. func", "B. def", "C. function", "D. define"]', 'B',
         'Python使用def关键字来定义函数。', 10, 'easy', '函数定义'),
        (2, 'single', '以下哪个不是Python的基本数据类型？',
         '["A. int", "B. string", "C. float", "D. char"]', 'D',
         'Python没有char类型，单个字符也是字符串类型。', 10, 'easy', '数据类型'),
        (2, 'multiple', '以下哪些是Python的内置数据结构？',
         '["A. list", "B. tuple", "C. dictionary", "D. array"]', 'ABC',
         'Python内置数据结构包括list、tuple、dict、set等，array需要导入array模块。', 15, 'medium', '数据结构'),
        (2, 'judge', 'Python是一种强类型语言。',
         None, 'A',
         'Python是强类型、动态类型语言，不允许不同类型直接运算。', 10, 'medium', '语言特性'),
        (3, 'single', '在一个长度为n的顺序表中，删除第i个元素需要移动多少个元素？',
         '["A. n-i", "B. n-i+1", "C. n-i-1", "D. i"]', 'A',
         '删除第i个元素，后面的n-i个元素都要向前移动一位。', 10, 'medium', '线性表'),
        (3, 'single', '栈的特点是？',
         '["A. 先进先出", "B. 后进先出", "C. 随机读写", "D. 顺序读写"]', 'B',
         '栈是后进先出（LIFO）的线性表，只能在栈顶进行插入和删除操作。', 10, 'easy', '栈'),
        (3, 'multiple', '以下排序算法中，时间复杂度为O(nlogn)的有？',
         '["A. 快速排序", "B. 归并排序", "C. 冒泡排序", "D. 堆排序"]', 'ABD',
         '冒泡排序时间复杂度为O(n^2)，快速排序、归并排序、堆排序平均时间复杂度为O(nlogn)。', 15, 'hard', '排序算法'),
        (3, 'judge', '二叉树的先序遍历序列中，任意一个结点都在其子孙结点的前面。',
         None, 'A',
         '先序遍历顺序是：根结点 -> 左子树 -> 右子树，所以根结点一定在子孙结点前面。', 10, 'medium', '二叉树遍历'),
        (4, 'single', 'SQL语言中，用于查询数据的关键字是？',
         '["A. INSERT", "B. UPDATE", "C. SELECT", "D. DELETE"]', 'C',
         'SELECT是SQL中用于查询数据的关键字。', 10, 'easy', 'SQL基础'),
        (4, 'single', '以下哪个是数据库事务的特性？',
         '["A. 原子性", "B. 一致性", "C. 隔离性", "D. 以上都是"]', 'D',
         '数据库事务具有ACID特性：原子性(Atomicity)、一致性(Consistency)、隔离性(Isolation)、持久性(Durability)。', 10, 'medium', '事务'),
        (4, 'multiple', '以下哪些属于关系型数据库？',
         '["A. MySQL", "B. MongoDB", "C. SQLite", "D. Oracle"]', 'ACD',
         'MongoDB是非关系型数据库，MySQL、SQLite、Oracle都是关系型数据库。', 15, 'easy', '数据库分类'),
        (4, 'judge', '主键的值可以为NULL。',
         None, 'B',
         '主键必须唯一且非空，用于唯一标识表中的每一行数据。', 10, 'easy', '主键约束')
    ]
    
    for q in questions_data:
        cursor.execute('''
            INSERT INTO questions (subject_id, type, content, options, answer, analysis, score, difficulty, knowledge_point)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', q)
    print('题库数据插入成功')
    
    cursor.execute('INSERT INTO papers (title, subject_id, description, total_score, duration) VALUES (?, ?, ?, ?, ?)',
                   ('计算机基础模拟试卷', 1, '计算机基础知识测试卷', 100, 60))
    cursor.execute('INSERT INTO papers (title, subject_id, description, total_score, duration) VALUES (?, ?, ?, ?, ?)',
                   ('Python程序设计期中试卷', 2, 'Python编程基础测试', 100, 90))
    cursor.execute('INSERT INTO papers (title, subject_id, description, total_score, duration) VALUES (?, ?, ?, ?, ?)',
                   ('数据结构综合测试', 3, '数据结构与算法期末测试', 100, 120))
    print('试卷数据插入成功')
    
    paper1_questions = [(1, 1, 1, 10, 1), (2, 1, 2, 10, 2), (3, 1, 3, 15, 3), (4, 1, 4, 10, 4)]
    for pq in paper1_questions:
        cursor.execute('INSERT INTO paper_questions (paper_id, question_id, score, sort_order) VALUES (?, ?, ?, ?)',
                       (pq[1], pq[2], pq[3], pq[4]))
    
    paper2_questions = [(5, 2, 5, 10, 1), (6, 2, 6, 10, 2), (7, 2, 7, 15, 3), (8, 2, 8, 10, 4)]
    for pq in paper2_questions:
        cursor.execute('INSERT INTO paper_questions (paper_id, question_id, score, sort_order) VALUES (?, ?, ?, ?)',
                       (pq[1], pq[2], pq[3], pq[4]))
    
    paper3_questions = [(9, 3, 9, 10, 1), (10, 3, 10, 10, 2), (11, 3, 11, 15, 3), (12, 3, 12, 10, 4)]
    for pq in paper3_questions:
        cursor.execute('INSERT INTO paper_questions (paper_id, question_id, score, sort_order) VALUES (?, ?, ?, ?)',
                       (pq[1], pq[2], pq[3], pq[4]))
    print('试卷题目关联成功')
    
    cursor.execute('INSERT INTO exams (paper_id, title, status) VALUES (?, ?, ?)',
                   (1, '2024年计算机基础第一次模拟考试', 'published'))
    cursor.execute('INSERT INTO exams (paper_id, title, status) VALUES (?, ?, ?)',
                   (2, '2024年Python期中测试', 'published'))
    cursor.execute('INSERT INTO exams (paper_id, title, status) VALUES (?, ?, ?)',
                   (3, '2024年数据结构期末复习', 'published'))
    print('考试数据插入成功')
    
    for exam_id in [1, 2, 3]:
        for student_id in [2, 3, 4]:
            cursor.execute('INSERT INTO exam_students (exam_id, student_id) VALUES (?, ?)',
                           (exam_id, student_id))
    print('考试学生分配成功')
    
    conn.commit()
    conn.close()
    print('数据库初始化完成！')
    print('测试账号：')
    print('  管理员: admin / 123456')
    print('  学生: student / 123456')
    print('  学生: zhangshan / 123456')
    print('  学生: lisi / 123456')

if __name__ == '__main__':
    init_database()
