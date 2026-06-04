from flask import Flask
from flask_cors import CORS
import os

from utils.database import close_db
from routes.auth import bp as auth_bp
from routes.questions import bp as questions_bp
from routes.papers import bp as papers_bp
from routes.exams import bp as exams_bp
from routes.scores import bp as scores_bp
from routes.admin import bp as admin_bp

def create_app():
    app = Flask(__name__, instance_relative_config=True)
    
    app.config['DATABASE'] = os.path.join(app.instance_path, 'exam.db')
    app.config['SECRET_KEY'] = 'exam-platform-secret-key-2024'
    
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:5101"}})
    
    app.teardown_appcontext(close_db)
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(questions_bp)
    app.register_blueprint(papers_bp)
    app.register_blueprint(exams_bp)
    app.register_blueprint(scores_bp)
    app.register_blueprint(admin_bp)
    
    @app.route('/api/health')
    def health_check():
        return {'status': 'ok', 'message': '在线考试平台后端服务运行正常'}
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=8001, debug=True)
