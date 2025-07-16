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
    
    def load_data(self):
        """Load all three CSV files"""
        print("Loading data files...")
        self.students_classes = pd.read_csv('students_classes.csv')
        self.students_sen = pd.read_csv('students_sen.csv')
        self.timetable = pd.read_csv('timetable.csv')
        print(f"Loaded {len(self.students_classes)} student-class records")
        print(f"Loaded {len(self.students_sen)} student SEN records")
        print(f"Loaded {len(self.timetable)} timetable entries")
    
    def calculate_student_need_score(self, student_name):
        """Calculate need score for a single student"""
        student_row = self.students_sen[self.students_sen['Name'] == student_name]
        if student_row.empty:
            return 0, "No SEN data found"
        
        row = student_row.iloc[0]
        score = 0
        breakdown = []
        
        # Pupil Premium (+2)
        if row['Pupil Premium Recipient at any time this academic year?'] == 'Yes':
            score += 2
            breakdown.append("Pupil Premium (+2)")
        
        # Looked After status (+3)
        if not pd.isna(row['Looked After (In Care) Status']) and row['Looked After (In Care) Status'] != '':
            score += 3
            breakdown.append("Looked After/In Care (+3)")
        
        # SEN needs (+3 per type)
        if row['SEN at any time this academic year?'] == 'Yes':
            sen_needs = str(row['SEN need(s)'])
            if not pd.isna(sen_needs) and sen_needs != '':
                need_count = len([n for n in sen_needs.split(',') if n.strip()])
                score += need_count * 3
                breakdown.append(f"SEN needs ({need_count} types, +{need_count * 3})")
        
        # EAL (+1)
        if row['EAL at any time this academic year?'] == 'Yes':
            score += 1
            breakdown.append("EAL (+1)")
        
        # Low reading comprehension (<85) (+2)
        reading_score = row['Read. Comp. Standardised Score']
        if not pd.isna(reading_score) and isinstance(reading_score, (int, float)) and reading_score < 85:
            score += 2
            breakdown.append(f"Low reading comp ({reading_score}, +2)")
        
        # Low spelling (<85) (+2)
        spelling_score = row['Spelling Standardised Score']
        if not pd.isna(spelling_score) and isinstance(spelling_score, (int, float)) and spelling_score < 85:
            score += 2
            breakdown.append(f"Low spelling ({spelling_score}, +2)")
        
        # BOXALL assessment present (+2)
        if not pd.isna(row['BOXALL']) and str(row['BOXALL']).strip() not in ['', '.']:
            score += 2
            breakdown.append("BOXALL assessment (+2)")
        
        # Medical/Health information (+1 each)
        medical_cols = ['Neurodiversity and/or Sensory Impairment', 'Medical Information', 'Health Care Plan/Risk Assessment']
        for col in medical_cols:
            if not pd.isna(row[col]) and str(row[col]).strip() not in ['', '.']:
                score += 1
                breakdown.append(f"{col.split('/')[0]} (+1)")
        
        # Support stages (+1 per stage)
        stage_cols = ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Stage 5']
        for i, col in enumerate(stage_cols, 1):
            if not pd.isna(row[col]) and str(row[col]).strip() not in ['', '.']:
                score += 1
                breakdown.append(f"Stage {i} support (+1)")
        
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
        # Split by comma and clean up
        parts = str(class_string).split(',')
        for part in parts:
            part = part.strip()
            if part and ':' in part:
                # Extract the specific class code (e.g., "7E/Ma2JDI" from "Maths: Year 7: 7E/Ma2JDI")
                if '/' in part:
                    # Keep the full format like "7E/Ma2JDI" instead of just "Ma2JDI"
                    class_code = part.split(':')[-1].strip()
                    if class_code:
                        classes.append(class_code)
                else:
                    # For general subjects like "Year 7", "Maths", etc.
                    subject = part.split(':')[0].strip()
                    if subject and subject not in ['Assembly', 'Pe/Games']:
                        classes.append(subject)
            elif part and part not in ['Assembly', 'Pe/Games']:
                classes.append(part)
        
        return list(set(classes))  # Remove duplicates
    
    def calculate_class_need_levels(self):
        """Calculate need levels for all classes"""
        print("Calculating class need levels...")
        class_students = defaultdict(list)
        
        # Map students to their classes
        for _, row in self.students_classes.iterrows():
            student = row['Name']
            classes = self.extract_classes_from_string(row['Courses/classes'])
            
            for class_code in classes:
                if student in self.student_scores:
                    class_students[class_code].append({
                        'name': student,
                        'score': self.student_scores[student]['score']
                    })
        
        # Filter out classes that need to be excluded
        filtered_classes = {}
        excluded_count = 0
        
        for class_code, students in class_students.items():
            if not students:
                continue
            
            # Skip classes with more than 33 students (assemblies)
            if len(students) > 33:
                excluded_count += 1
                continue
            
            # Check if this class runs during tutor time (08:40-09:00)
            is_tutor_time = self.is_tutor_time_class(class_code)
            if is_tutor_time:
                excluded_count += 1
                continue
                
            scores = [s['score'] for s in students]
            total_score = sum(scores)
            avg_score = total_score / len(scores)
            max_score = max(scores)
            high_need_count = len([s for s in scores if s >= 5])
            
            # Weight by class size (larger classes with needs get higher priority)
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
        # Check timetable for this class code
        timetable_matches = self.timetable[self.timetable['Course/Class'].str.contains(class_code, na=False)]
        
        for _, row in timetable_matches.iterrows():
            time_slot = str(row['Time Slot'])
            if '08:40 - 09:00' in time_slot:
                return True
        
        return False
    
    def generate_timetable_grid(self):
        """Generate a visual timetable grid showing lessons ordered by need"""
        print("\n" + "="*80)
        print("VISUAL TIMETABLE GRID - LESSONS ORDERED BY NEED SCORE")
        print("="*80)
        
        # Create a dictionary to organize lessons by time slot
        timetable_grid = defaultdict(list)
        
        # Map class codes to their need scores for quick lookup
        class_need_lookup = {code: data['weighted_score'] for code, data in self.class_scores.items()}
        
        # Process timetable entries
        for _, row in self.timetable.iterrows():
            course_class = str(row['Course/Class'])
            time_slot = str(row['Time Slot'])
            staff = str(row['Staff'])
            room = str(row['Room'])
            
            # Skip if suspended or tutor time
            if row.get('Suspended?') == 'Yes' or '08:40 - 09:00' in time_slot:
                continue
            
            # Extract class code from course/class string
            class_code = self.extract_class_code_from_timetable(course_class)
            
            # Get need score for this class
            need_score = 0
            student_count = 0
            if class_code in self.class_scores:
                need_score = self.class_scores[class_code]['weighted_score']
                student_count = self.class_scores[class_code]['student_count']
            
            # Only include classes that passed our filtering
            if class_code in self.class_scores:
                timetable_grid[time_slot].append({
                    'class_code': class_code,
                    'course_class': course_class,
                    'need_score': need_score,
                    'student_count': student_count,
                    'staff': staff,
                    'room': room
                })
        
        # Sort time slots and display
        sorted_time_slots = sorted(timetable_grid.keys())
        
        for time_slot in sorted_time_slots:
            lessons = timetable_grid[time_slot]
            
            # Sort lessons by need score (highest first)
            lessons.sort(key=lambda x: x['need_score'], reverse=True)
            
            print(f"\n{time_slot}")
            print("-" * len(time_slot))
            
            if not lessons:
                print("  No lessons requiring TA support")
                continue
            
            # Display lessons in order of need
            for i, lesson in enumerate(lessons, 1):
                priority_marker = "🔴" if lesson['need_score'] > 20 else "🟡" if lesson['need_score'] > 10 else "🟢"
                print(f"  {i:2d}. {priority_marker} {lesson['class_code']:<15} "
                      f"Need: {lesson['need_score']:5.1f} | "
                      f"Students: {lesson['student_count']:2d} | "
                      f"Staff: {lesson['staff']:<20} | "
                      f"Room: {lesson['room']}")
    
    def extract_class_code_from_timetable(self, course_class_string):
        """Extract class code from timetable course/class string, retaining year group"""
        # Handle various formats in the timetable
        if ': ' in course_class_string:
            parts = course_class_string.split(': ')
            if len(parts) >= 2:
                class_part = parts[-1]
                if '/' in class_part:
                    # Keep the full format like "8G/Pe1DFL" instead of just "Pe1DFL"
                    return class_part
                else:
                    return class_part
        
        # For simple formats, keep the full format if it contains year group
        if '/' in course_class_string:
            return course_class_string
        
        return course_class_string.strip()
    
    def generate_reports(self):
        """Generate comprehensive reports"""
        print("\n" + "="*60)
        print("TEACHING ASSISTANT NEED ANALYSIS REPORT")
        print("="*60)
        
        # Top 20 highest need students
        print("\nTOP 20 HIGHEST NEED STUDENTS:")
        print("-" * 50)
        sorted_students = sorted(self.student_scores.items(), key=lambda x: x[1]['score'], reverse=True)
        for i, (name, data) in enumerate(sorted_students[:20], 1):
            print(f"{i:2d}. {name:<25} Score: {data['score']:2d} - {data['breakdown']}")
        
        # Top 20 highest need classes
        print("\n\nTOP 20 HIGHEST NEED CLASSES:")
        print("-" * 70)
        sorted_classes = sorted(self.class_scores.items(), key=lambda x: x[1]['weighted_score'], reverse=True)
        
        for i, (class_code, data) in enumerate(sorted_classes[:20], 1):
            print(f"{i:2d}. {class_code:<20} Students: {data['student_count']:2d} | "
                  f"Avg Need: {data['average_need_score']:5.2f} | "
                  f"Total: {data['total_need_score']:3d} | "
                  f"High Need: {data['high_need_students']:2d} | "
                  f"Weighted: {data['weighted_score']:5.2f}")
        
        # Summary statistics
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
        """Run the complete analysis"""
        try:
            self.load_data()
            self.calculate_all_student_scores()
            self.calculate_class_need_levels()
            self.generate_reports()
            self.generate_timetable_grid()
        except Exception as e:
            print(f"Error during analysis: {e}")
            raise

if __name__ == "__main__":
    analyzer = TANeedAnalyzer()
    analyzer.run_analysis()