from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import pandas as pd
import os
from datetime import datetime
from web_ta_analyzer import TANeedAnalyzer
from werkzeug.utils import secure_filename
import json

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///ta_analyzer.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create uploads directory
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db = SQLAlchemy(app)

# Database Models
class School(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class WeightingConfig(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    config_json = db.Column(db.Text, nullable=False)
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AnalysisResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)
    weighting_config_id = db.Column(db.Integer, db.ForeignKey('weighting_config.id'), nullable=False)
    result_json = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Initialize database
with app.app_context():
    db.create_all()
    
    # Create default school and weighting config if not exists
    default_school = School.query.filter_by(name='Default School').first()
    if not default_school:
        default_school = School(name='Default School')
        db.session.add(default_school)
        db.session.commit()
    
    default_weights = WeightingConfig.query.filter_by(school_id=default_school.id, is_default=True).first()
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
            name='Default Weights',
            config_json=json.dumps(default_config),
            is_default=True
        )
        db.session.add(default_weights)
        db.session.commit()

# Global analyzer instance
analyzer = TANeedAnalyzer()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})

@app.route('/api/upload/<file_type>', methods=['POST'])
def upload_file(file_type):
    if file_type not in ['students_classes', 'students_sen', 'timetable']:
        return jsonify({'error': 'Invalid file type'}), 400
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and file.filename.endswith('.csv'):
        filename = secure_filename(f"{file_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv")
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
            
            # Store file info in session/memory for now
            setattr(analyzer, f'{file_type}_file', filepath)
            
            return jsonify({
                'message': 'File uploaded successfully',
                'filename': filename,
                'rows': len(df),
                'columns': list(df.columns)
            })
            
        except Exception as e:
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({'error': f'File validation failed: {str(e)}'}), 400
    
    return jsonify({'error': 'Invalid file format. Please upload CSV files only.'}), 400

@app.route('/api/weightings', methods=['GET'])
def get_weightings():
    school_id = request.args.get('school_id', 1)
    configs = WeightingConfig.query.filter_by(school_id=school_id).all()
    
    return jsonify([{
        'id': config.id,
        'name': config.name,
        'config': json.loads(config.config_json),
        'is_default': config.is_default,
        'created_at': config.created_at.isoformat()
    } for config in configs])

@app.route('/api/weightings', methods=['POST'])
def save_weightings():
    data = request.get_json()
    school_id = data.get('school_id', 1)
    
    # If saving as new default, update existing default
    if data.get('is_default', False):
        existing_default = WeightingConfig.query.filter_by(school_id=school_id, is_default=True).first()
        if existing_default:
            existing_default.is_default = False
    
    new_config = WeightingConfig(
        school_id=school_id,
        name=data['name'],
        config_json=json.dumps(data['config']),
        is_default=data.get('is_default', False)
    )
    
    db.session.add(new_config)
    db.session.commit()
    
    return jsonify({'message': 'Weighting configuration saved successfully', 'id': new_config.id})

@app.route('/api/analysis/run', methods=['POST'])
def run_analysis():
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
            config = WeightingConfig.query.get(weighting_config_id)
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
def get_analysis_results(result_id):
    result = AnalysisResult.query.get_or_404(result_id)
    return jsonify({
        'id': result.id,
        'results': json.loads(result.result_json),
        'created_at': result.created_at.isoformat()
    })

@app.route('/api/students', methods=['GET'])
def get_students():
    if not hasattr(analyzer, 'student_scores') or not analyzer.student_scores:
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
def get_classes():
    if not hasattr(analyzer, 'class_scores') or not analyzer.class_scores:
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
def get_timetable_grid():
    if not hasattr(analyzer, 'timetable') or analyzer.timetable is None:
        return jsonify({'error': 'No timetable data available'}), 400
    
    try:
        grid_data = analyzer.generate_timetable_grid_data()
        return jsonify(grid_data)
    except Exception as e:
        return jsonify({'error': f'Failed to generate timetable grid: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)