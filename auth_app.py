from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, logout_user, login_required, current_user, UserMixin
from flask_bcrypt import Bcrypt
import pandas as pd
import os
from datetime import datetime, timedelta
from web_ta_analyzer import TANeedAnalyzer
from werkzeug.utils import secure_filename
import json

app = Flask(__name__)
CORS(app, supports_credentials=True)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///ta_analyser.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)

# Create uploads directory
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize extensions
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Database Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    school_name = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

class School(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class WeightingConfig(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    config_json = db.Column(db.Text, nullable=False)
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AnalysisResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    weighting_config_id = db.Column(db.Integer, db.ForeignKey('weighting_config.id'), nullable=False)
    result_json = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Initialize database
with app.app_context():
    db.create_all()
    
    # Create default school
    default_school = School.query.filter_by(name='Default School').first()
    if not default_school:
        default_school = School(name='Default School')
        db.session.add(default_school)
        db.session.commit()
    
    # Create default admin user if not exists
    admin_user = User.query.filter_by(username='admin').first()
    if not admin_user:
        admin_user = User(
            username='admin',
            email='admin@school.edu',
            is_admin=True,
            school_name='Default School'
        )
        admin_user.set_password('admin123')  # Change this in production
        db.session.add(admin_user)
        db.session.commit()
        print("Created default admin user: admin / admin123")
    
    # Create default weighting config for admin user
    default_weights = WeightingConfig.query.filter_by(
        school_id=default_school.id, 
        user_id=admin_user.id, 
        is_default=True
    ).first()
    if not default_weights:
        default_config = {
            'pupil_premium': 2,
            'looked_after': 3,
            'sen_needs_multiplier': 3,
            'eal': 1,
            'reading_threshold': 85,
            'reading_score': 2,
            'spelling_threshold': 85,
            'spelling_score': 2,
            'boxall': 2,
            'medical_info': 1,
            'stage_support': 1
        }
        default_weights = WeightingConfig(
            school_id=default_school.id,
            user_id=admin_user.id,
            name='Default Weights',
            config_json=json.dumps(default_config),
            is_default=True
        )
        db.session.add(default_weights)
        db.session.commit()

# Global analyzer instance per user (in production, use Redis or similar)
user_analyzers = {}

def get_user_analyzer():
    """Get or create analyzer for current user"""
    if current_user.is_authenticated:
        user_id = current_user.id
        if user_id not in user_analyzers:
            user_analyzers[user_id] = TANeedAnalyzer()
        return user_analyzers[user_id]
    return None

# Track upload session to clear data on new session
user_upload_sessions = {}

# Authentication Routes
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    user = User.query.filter_by(username=username).first()
    
    if user and user.check_password(password):
        login_user(user, remember=True)
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_admin': user.is_admin,
                'school_name': user.school_name
            }
        })
    
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/auth/logout', methods=['POST'])
@login_required
def logout():
    user_id = current_user.id
    logout_user()
    # Clear user analyzer on logout
    if user_id in user_analyzers:
        del user_analyzers[user_id]
    if user_id in user_upload_sessions:
        del user_upload_sessions[user_id]
    return jsonify({'message': 'Logout successful'})

@app.route('/api/auth/user', methods=['GET'])
@login_required
def get_current_user():
    return jsonify({
        'id': current_user.id,
        'username': current_user.username,
        'email': current_user.email,
        'is_admin': current_user.is_admin,
        'school_name': current_user.school_name
    })

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    school_name = data.get('school_name', 'Default School')
    
    if not username or not email or not password:
        return jsonify({'error': 'Username, email, and password required'}), 400
    
    # Check if user already exists
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    # Create new user
    user = User(
        username=username,
        email=email,
        school_name=school_name
    )
    user.set_password(password)
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'User created successfully'}), 201

# API Routes (all require authentication)
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy', 
        'timestamp': datetime.utcnow().isoformat(),
        'authenticated': current_user.is_authenticated
    })

@app.route('/api/clear-data', methods=['POST'])
@login_required
def clear_data():
    """Clear all analysis data and start fresh"""
    analyzer = get_user_analyzer()
    if analyzer:
        analyzer.clear_analysis_data()
    
    user_id = current_user.id
    if user_id in user_upload_sessions:
        user_upload_sessions[user_id] = set()
    
    return jsonify({'message': 'All analysis data cleared successfully'})

@app.route('/api/upload/<file_type>', methods=['POST'])
@login_required
def upload_file(file_type):
    analyzer = get_user_analyzer()
    if not analyzer:
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = current_user.id
    if user_id not in user_upload_sessions:
        user_upload_sessions[user_id] = set()
    
    if file_type not in ['students_classes', 'students_sen', 'timetable']:
        return jsonify({'error': 'Invalid file type'}), 400
    
    # If this is the first file in a new session, clear previous data
    if len(user_upload_sessions[user_id]) == 0:
        analyzer.clear_analysis_data()
        print(f"Starting new upload session for user {user_id} - cleared previous data")
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and file.filename.endswith('.csv'):
        filename = secure_filename(f"{user_id}_{file_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Validate file structure
        try:
            df = pd.read_csv(filepath)
            expected_columns = {
                'students_classes': ['Name', 'Courses/classes'],
                'students_sen': ['Name', 'Pupil Premium Recipient at any time this academic year?', 'SEN at any time this academic year?'],
                'timetable': ['Day', 'Time Slot', 'Course/Class', 'Staff', 'Room']
            }
            
            required_cols = expected_columns[file_type]
            missing_cols = [col for col in required_cols if col not in df.columns]
            
            if missing_cols:
                os.remove(filepath)
                return jsonify({'error': f'Missing required columns: {missing_cols}'}), 400
            
            # Store file info for current user
            setattr(analyzer, f'{file_type}_file', filepath)
            
            # Track this file type in the current upload session
            user_upload_sessions[user_id].add(file_type)
            
            return jsonify({
                'message': 'File uploaded successfully',
                'filename': filename,
                'rows': len(df),
                'columns': list(df.columns),
                'session_files': list(user_upload_sessions[user_id])
            })
            
        except Exception as e:
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({'error': f'File validation failed: {str(e)}'}), 400
    
    return jsonify({'error': 'Invalid file format. Please upload CSV files only.'}), 400

@app.route('/api/weightings', methods=['GET'])
@login_required
def get_weightings():
    school_id = request.args.get('school_id', 1)
    configs = WeightingConfig.query.filter_by(
        school_id=school_id, 
        user_id=current_user.id
    ).all()
    
    return jsonify([{
        'id': config.id,
        'name': config.name,
        'config': json.loads(config.config_json),
        'is_default': config.is_default,
        'created_at': config.created_at.isoformat()
    } for config in configs])

@app.route('/api/weightings', methods=['POST'])
@login_required
def save_weightings():
    data = request.get_json()
    school_id = data.get('school_id', 1)
    
    # If saving as new default, update existing default for this user
    if data.get('is_default', False):
        existing_default = WeightingConfig.query.filter_by(
            school_id=school_id, 
            user_id=current_user.id, 
            is_default=True
        ).first()
        if existing_default:
            existing_default.is_default = False
    
    new_config = WeightingConfig(
        school_id=school_id,
        user_id=current_user.id,
        name=data['name'],
        config_json=json.dumps(data['config']),
        is_default=data.get('is_default', False)
    )
    
    db.session.add(new_config)
    db.session.commit()
    
    return jsonify({'message': 'Weighting configuration saved successfully', 'id': new_config.id})

@app.route('/api/analysis/run', methods=['POST'])
@login_required
def run_analysis():
    analyzer = get_user_analyzer()
    if not analyzer:
        return jsonify({'error': 'Authentication required'}), 401
    
    data = request.get_json()
    weighting_config_id = data.get('weighting_config_id')
    
    # Check if all required files are uploaded
    required_files = ['students_classes_file', 'students_sen_file', 'timetable_file']
    for file_attr in required_files:
        if not hasattr(analyzer, file_attr) or not getattr(analyzer, file_attr):
            return jsonify({'error': f'Missing required file: {file_attr.replace("_file", "")}'}), 400
    
    try:
        # Load weighting configuration
        if weighting_config_id:
            config = WeightingConfig.query.filter_by(
                id=weighting_config_id,
                user_id=current_user.id
            ).first()
            if config:
                weights = json.loads(config.config_json)
                analyzer.set_weightings(weights)
        
        # Run analysis
        analyzer.load_data_from_files()
        analyzer.calculate_all_student_scores()
        analyzer.calculate_class_need_levels()
        
        # Generate results
        results = analyzer.get_analysis_results()
        
        # Save results to database
        if weighting_config_id:
            analysis_result = AnalysisResult(
                school_id=1,  # Default school for now
                user_id=current_user.id,
                weighting_config_id=weighting_config_id,
                result_json=json.dumps(results)
            )
            db.session.add(analysis_result)
            db.session.commit()
        
        return jsonify({
            'status': 'success',
            'results': results,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

@app.route('/api/analysis/results/<int:result_id>', methods=['GET'])
@login_required
def get_analysis_results(result_id):
    result = AnalysisResult.query.filter_by(
        id=result_id,
        user_id=current_user.id
    ).first()
    
    if not result:
        return jsonify({'error': 'Analysis result not found'}), 404
    
    return jsonify({
        'id': result.id,
        'results': json.loads(result.result_json),
        'created_at': result.created_at.isoformat()
    })

@app.route('/api/students', methods=['GET'])
@login_required
def get_students():
    analyzer = get_user_analyzer()
    if not analyzer or not hasattr(analyzer, 'student_scores') or not analyzer.student_scores:
        return jsonify({'error': 'No analysis results available'}), 400
    
    students = []
    for name, data in analyzer.student_scores.items():
        students.append({
            'name': name,
            'score': data['score'],
            'breakdown': data['breakdown']
        })
    
    # Sort by score descending
    students.sort(key=lambda x: x['score'], reverse=True)
    
    return jsonify(students)

@app.route('/api/classes', methods=['GET'])
@login_required
def get_classes():
    analyzer = get_user_analyzer()
    if not analyzer or not hasattr(analyzer, 'class_scores') or not analyzer.class_scores:
        return jsonify({'error': 'No analysis results available'}), 400
    
    classes = []
    for class_code, data in analyzer.class_scores.items():
        classes.append({
            'class_code': class_code,
            'student_count': data['student_count'],
            'total_need_score': data['total_need_score'],
            'average_need_score': data['average_need_score'],
            'max_need_score': data['max_need_score'],
            'high_need_students': data['high_need_students'],
            'weighted_score': data['weighted_score'],
            'students': data['students']
        })
    
    # Sort by weighted score descending
    classes.sort(key=lambda x: x['weighted_score'], reverse=True)
    
    return jsonify(classes)

@app.route('/api/timetable/grid', methods=['GET'])
@login_required
def get_timetable_grid():
    analyzer = get_user_analyzer()
    if not analyzer or not hasattr(analyzer, 'timetable') or analyzer.timetable is None:
        return jsonify({'error': 'No timetable data available'}), 400
    
    try:
        grid_data = analyzer.generate_timetable_grid_data()
        return jsonify(grid_data)
    except Exception as e:
        return jsonify({'error': f'Failed to generate timetable grid: {str(e)}'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=os.environ.get('FLASK_ENV') != 'production', host='0.0.0.0', port=port)