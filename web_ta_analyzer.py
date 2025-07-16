import pandas as pd
import numpy as np
from collections import defaultdict
import re

class TANeedAnalyzer:
    def __init__(self):
        self.students_classes = None
        self.students_sen = None
        self.timetable = None
        self.student_scores = {}
        self.class_scores = {}
        
        # File paths for uploaded files
        self.students_classes_file = None
        self.students_sen_file = None
        self.timetable_file = None
        
        # Configurable weightings
        self.weightings = {
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
    
    def set_weightings(self, weightings):
        """Update the weighting configuration"""
        self.weightings.update(weightings)
    
    def clear_analysis_data(self):
        """Clear all analysis data and file references"""
        self.students_classes = None
        self.students_sen = None
        self.timetable = None
        self.student_scores = {}
        self.class_scores = {}
        self.students_classes_file = None
        self.students_sen_file = None
        self.timetable_file = None
        print("Cleared all previous analysis data")
    
    def load_data_from_files(self):
        """Load data from uploaded files"""
        if not all([self.students_classes_file, self.students_sen_file, self.timetable_file]):
            raise ValueError("Missing required data files")
        
        print("Loading data files...")
        self.students_classes = pd.read_csv(self.students_classes_file)
        self.students_sen = pd.read_csv(self.students_sen_file)
        self.timetable = pd.read_csv(self.timetable_file)
        
        print(f"Loaded {len(self.students_classes)} student-class records")
        print(f"Loaded {len(self.students_sen)} student SEN records")
        print(f"Loaded {len(self.timetable)} timetable entries")
    
    def load_data(self):
        """Load all three CSV files (legacy method)"""
        print("Loading data files...")
        self.students_classes = pd.read_csv('students_classes.csv')
        self.students_sen = pd.read_csv('students_sen.csv')
        self.timetable = pd.read_csv('timetable.csv')
        print(f"Loaded {len(self.students_classes)} student-class records")
        print(f"Loaded {len(self.students_sen)} student SEN records")
        print(f"Loaded {len(self.timetable)} timetable entries")
    
    def calculate_student_need_score(self, student_name):
        """Calculate need score for a single student using configurable weightings"""
        student_row = self.students_sen[self.students_sen['Name'] == student_name]
        if student_row.empty:
            return 0, "No SEN data found"
        
        row = student_row.iloc[0]
        score = 0
        breakdown = []
        
        # Pupil Premium
        if row['Pupil Premium Recipient at any time this academic year?'] == 'Yes':
            score += self.weightings['pupil_premium']
            breakdown.append(f"Pupil Premium (+{self.weightings['pupil_premium']})")
        
        # Looked After status
        if not pd.isna(row['Looked After (In Care) Status']) and row['Looked After (In Care) Status'] != '':
            score += self.weightings['looked_after']
            breakdown.append(f"Looked After/In Care (+{self.weightings['looked_after']})")
        
        # SEN needs
        if row['SEN at any time this academic year?'] == 'Yes':
            sen_needs = str(row['SEN need(s)'])
            if not pd.isna(sen_needs) and sen_needs != '':
                need_count = len([n for n in sen_needs.split(',') if n.strip()])
                points = need_count * self.weightings['sen_needs_multiplier']
                score += points
                breakdown.append(f"SEN needs ({need_count} types, +{points})")
        
        # EAL
        if row['EAL at any time this academic year?'] == 'Yes':
            score += self.weightings['eal']
            breakdown.append(f"EAL (+{self.weightings['eal']})")
        
        # Low reading comprehension
        reading_score = row['Read. Comp. Standardised Score']
        if not pd.isna(reading_score) and isinstance(reading_score, (int, float)) and reading_score < self.weightings['reading_threshold']:
            score += self.weightings['reading_score']
            breakdown.append(f"Low reading comp ({reading_score}, +{self.weightings['reading_score']})")
        
        # Low spelling
        spelling_score = row['Spelling Standardised Score']
        if not pd.isna(spelling_score) and isinstance(spelling_score, (int, float)) and spelling_score < self.weightings['spelling_threshold']:
            score += self.weightings['spelling_score']
            breakdown.append(f"Low spelling ({spelling_score}, +{self.weightings['spelling_score']})")
        
        # BOXALL assessment present
        if not pd.isna(row['BOXALL']) and str(row['BOXALL']).strip() not in ['', '.']:
            score += self.weightings['boxall']
            breakdown.append(f"BOXALL assessment (+{self.weightings['boxall']})")
        
        # Medical/Health information
        medical_cols = ['Neurodiversity and/or Sensory Impairment', 'Medical Information', 'Health Care Plan/Risk Assessment']
        for col in medical_cols:
            if not pd.isna(row[col]) and str(row[col]).strip() not in ['', '.']:
                score += self.weightings['medical_info']
                breakdown.append(f"{col.split('/')[0]} (+{self.weightings['medical_info']})")
        
        # Support stages
        stage_cols = ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Stage 5']
        for i, col in enumerate(stage_cols, 1):
            if not pd.isna(row[col]) and str(row[col]).strip() not in ['', '.']:
                score += self.weightings['stage_support']
                breakdown.append(f"Stage {i} support (+{self.weightings['stage_support']})")
        
        return score, "; ".join(breakdown) if breakdown else "No specific needs identified"
    
    def calculate_all_student_scores(self):
        """Calculate need scores for all students"""
        print("Calculating student need scores...")
        unique_students = set(self.students_classes['Name'].unique()) | set(self.students_sen['Name'].unique())
        
        for student in unique_students:
            score, breakdown = self.calculate_student_need_score(student)
            self.student_scores[student] = {'score': score, 'breakdown': breakdown}
        
        print(f"Calculated scores for {len(self.student_scores)} students")
    
    def extract_classes_from_string(self, class_string):
        """Extract individual class codes from the classes string, retaining year group format"""
        if pd.isna(class_string):
            return []
        
        classes = []
        parts = str(class_string).split(',')
        for part in parts:
            part = part.strip()
            if part and ':' in part:
                if '/' in part:
                    class_code = part.split(':')[-1].strip()
                    if class_code:
                        classes.append(class_code)
                else:
                    subject = part.split(':')[0].strip()
                    if subject and subject not in ['Assembly', 'Pe/Games']:
                        classes.append(subject)
            elif part and part not in ['Assembly', 'Pe/Games']:
                classes.append(part)
        
        return list(set(classes))
    
    def calculate_class_need_levels(self):
        """Calculate need levels for all classes"""
        print("Calculating class need levels...")
        class_students = defaultdict(list)
        
        for _, row in self.students_classes.iterrows():
            student = row['Name']
            classes = self.extract_classes_from_string(row['Courses/classes'])
            
            for class_code in classes:
                if student in self.student_scores:
                    class_students[class_code].append({
                        'name': student,
                        'score': self.student_scores[student]['score']
                    })
        
        filtered_classes = {}
        excluded_count = 0
        
        for class_code, students in class_students.items():
            if not students:
                continue
            
            if len(students) > 33:
                excluded_count += 1
                continue
            
            is_tutor_time = self.is_tutor_time_class(class_code)
            if is_tutor_time:
                excluded_count += 1
                continue
                
            scores = [s['score'] for s in students]
            total_score = sum(scores)
            avg_score = total_score / len(scores)
            max_score = max(scores)
            high_need_count = len([s for s in scores if s >= 5])
            
            weighted_score = avg_score * (1 + len(students) / 30)
            
            filtered_classes[class_code] = {
                'student_count': len(students),
                'total_need_score': total_score,
                'average_need_score': round(avg_score, 2),
                'max_need_score': max_score,
                'high_need_students': high_need_count,
                'weighted_score': round(weighted_score, 2),
                'students': students
            }
        
        self.class_scores = filtered_classes
        print(f"Calculated need levels for {len(self.class_scores)} classes")
        print(f"Excluded {excluded_count} classes (assemblies and tutor periods)")
    
    def is_tutor_time_class(self, class_code):
        """Check if a class runs during tutor time (08:40-09:00)"""
        timetable_matches = self.timetable[self.timetable['Course/Class'].str.contains(class_code, na=False)]
        
        for _, row in timetable_matches.iterrows():
            time_slot = str(row['Time Slot'])
            if '08:40 - 09:00' in time_slot:
                return True
        
        return False
    
    def generate_timetable_grid_data(self):
        """Generate timetable grid data for web interface"""
        timetable_grid = defaultdict(list)
        class_need_lookup = {code: data['weighted_score'] for code, data in self.class_scores.items()}
        
        for _, row in self.timetable.iterrows():
            course_class = str(row['Course/Class'])
            time_slot = str(row['Time Slot'])
            staff = str(row['Staff'])
            room = str(row['Room'])
            
            if row.get('Suspended?') == 'Yes' or '08:40 - 09:00' in time_slot:
                continue
            
            class_code = self.extract_class_code_from_timetable(course_class)
            
            if class_code in self.class_scores:
                data = self.class_scores[class_code]
                timetable_grid[time_slot].append({
                    'class_code': class_code,
                    'course_class': course_class,
                    'need_score': data['weighted_score'],
                    'student_count': data['student_count'],
                    'high_need_students': data['high_need_students'],
                    'staff': staff,
                    'room': room
                })
        
        # Sort lessons by need score within each time slot
        for time_slot in timetable_grid:
            timetable_grid[time_slot].sort(key=lambda x: x['need_score'], reverse=True)
        
        return dict(timetable_grid)
    
    def extract_class_code_from_timetable(self, course_class_string):
        """Extract class code from timetable course/class string"""
        if ': ' in course_class_string:
            parts = course_class_string.split(': ')
            if len(parts) >= 2:
                class_part = parts[-1]
                return class_part
        
        if '/' in course_class_string:
            return course_class_string
        
        return course_class_string.strip()
    
    def get_analysis_results(self):
        """Get comprehensive analysis results for web interface"""
        if not self.student_scores or not self.class_scores:
            raise ValueError("No analysis results available")
        
        # Top students by need
        sorted_students = sorted(self.student_scores.items(), key=lambda x: x[1]['score'], reverse=True)
        top_students = [
            {
                'name': name,
                'score': data['score'],
                'breakdown': data['breakdown']
            }
            for name, data in sorted_students[:50]  # Top 50 for web display
        ]
        
        # Top classes by need
        sorted_classes = sorted(self.class_scores.items(), key=lambda x: x[1]['weighted_score'], reverse=True)
        top_classes = [
            {
                'class_code': class_code,
                'student_count': data['student_count'],
                'total_need_score': data['total_need_score'],
                'average_need_score': data['average_need_score'],
                'max_need_score': data['max_need_score'],
                'high_need_students': data['high_need_students'],
                'weighted_score': data['weighted_score']
            }
            for class_code, data in sorted_classes[:50]  # Top 50 for web display
        ]
        
        # Summary statistics
        all_scores = [data['score'] for data in self.student_scores.values()]
        statistics = {
            'total_students': len(all_scores),
            'no_needs': len([s for s in all_scores if s == 0]),
            'low_needs': len([s for s in all_scores if 1 <= s <= 3]),
            'medium_needs': len([s for s in all_scores if 4 <= s <= 7]),
            'high_needs': len([s for s in all_scores if s >= 8]),
            'average_score': round(np.mean(all_scores), 2),
            'max_score': max(all_scores),
            'total_classes': len(self.class_scores),
            'average_class_score': round(np.mean([data['weighted_score'] for data in self.class_scores.values()]), 2)
        }
        
        return {
            'top_students': top_students,
            'top_classes': top_classes,
            'statistics': statistics,
            'timetable_grid': self.generate_timetable_grid_data()
        }
    
    def generate_reports(self):
        """Generate comprehensive reports (legacy method)"""
        print("\n" + "="*60)
        print("TEACHING ASSISTANT NEED ANALYSIS REPORT")
        print("="*60)
        
        sorted_students = sorted(self.student_scores.items(), key=lambda x: x[1]['score'], reverse=True)
        print("\nTOP 20 HIGHEST NEED STUDENTS:")
        print("-" * 50)
        for i, (name, data) in enumerate(sorted_students[:20], 1):
            print(f"{i:2d}. {name:<25} Score: {data['score']:2d} - {data['breakdown']}")
        
        sorted_classes = sorted(self.class_scores.items(), key=lambda x: x[1]['weighted_score'], reverse=True)
        print("\n\nTOP 20 HIGHEST NEED CLASSES:")
        print("-" * 70)
        for i, (class_code, data) in enumerate(sorted_classes[:20], 1):
            print(f"{i:2d}. {class_code:<20} Students: {data['student_count']:2d} | "
                  f"Avg Need: {data['average_need_score']:5.2f} | "
                  f"Total: {data['total_need_score']:3d} | "
                  f"High Need: {data['high_need_students']:2d} | "
                  f"Weighted: {data['weighted_score']:5.2f}")
        
        all_scores = [data['score'] for data in self.student_scores.values()]
        print(f"\n\nSUMMARY STATISTICS:")
        print(f"Total students analyzed: {len(all_scores)}")
        print(f"Students with no additional needs (score 0): {len([s for s in all_scores if s == 0])}")
        print(f"Students with low needs (score 1-3): {len([s for s in all_scores if 1 <= s <= 3])}")
        print(f"Students with medium needs (score 4-7): {len([s for s in all_scores if 4 <= s <= 7])}")
        print(f"Students with high needs (score 8+): {len([s for s in all_scores if s >= 8])}")
        print(f"Average need score: {np.mean(all_scores):.2f}")
        print(f"Maximum need score: {max(all_scores)}")
        
        print(f"\nTotal classes analyzed: {len(self.class_scores)}")
        class_weighted_scores = [data['weighted_score'] for data in self.class_scores.values()]
        print(f"Average class weighted score: {np.mean(class_weighted_scores):.2f}")
    
    def run_analysis(self):
        """Run the complete analysis (legacy method)"""
        try:
            self.load_data()
            self.calculate_all_student_scores()
            self.calculate_class_need_levels()
            self.generate_reports()
        except Exception as e:
            print(f"Error during analysis: {e}")
            raise