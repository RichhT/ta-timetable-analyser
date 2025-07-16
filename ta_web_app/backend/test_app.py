#!/usr/bin/env python3

import os
import sys
import shutil
import requests
import json
from pathlib import Path

# Add the parent directory to path to import the analyzer
sys.path.append(str(Path(__file__).parent))

def test_backend():
    """Test the backend API endpoints"""
    base_url = "http://localhost:5000"
    
    print("🧪 Testing TA Timetable Analyzer Backend")
    print("=" * 50)
    
    # Test health endpoint
    print("Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/api/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health check passed")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to backend: {e}")
        print("Make sure the backend is running with: python app.py")
        return False
    
    # Test weightings endpoint
    print("Testing weightings endpoint...")
    try:
        response = requests.get(f"{base_url}/api/weightings")
        if response.status_code == 200:
            weightings = response.json()
            print(f"✅ Weightings loaded: {len(weightings)} configurations")
        else:
            print(f"❌ Weightings endpoint failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Weightings request failed: {e}")
        return False
    
    # Test file upload with sample data
    print("Testing file upload...")
    
    # Create sample CSV files for testing
    sample_files = create_sample_files()
    
    for file_type, file_path in sample_files.items():
        try:
            with open(file_path, 'rb') as f:
                files = {'file': f}
                response = requests.post(f"{base_url}/api/upload/{file_type}", files=files)
                
            if response.status_code == 200:
                print(f"✅ {file_type} upload successful")
            else:
                print(f"❌ {file_type} upload failed: {response.status_code}")
                print(f"Error: {response.text}")
        except Exception as e:
            print(f"❌ {file_type} upload error: {e}")
    
    # Test analysis run
    print("Testing analysis run...")
    try:
        response = requests.post(f"{base_url}/api/analysis/run", 
                               json={"weighting_config_id": 1})
        if response.status_code == 200:
            print("✅ Analysis completed successfully")
        else:
            print(f"❌ Analysis failed: {response.status_code}")
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"❌ Analysis request error: {e}")
    
    # Cleanup
    cleanup_sample_files(sample_files)
    
    print("\n🎉 Backend testing completed!")
    return True

def create_sample_files():
    """Create sample CSV files for testing"""
    sample_files = {}
    
    # Sample student classes
    students_classes_content = """Name,Courses/classes
"Smith, John","Year 7, Maths: Year 7: 7A/Ma1ABC, English: Year 7: 7A/En1DEF"
"Jones, Sarah","Year 8, Science: Year 8: 8B/Sc1GHI, History: Year 8: 8B/Hi1JKL"
"Brown, Mike","Year 9, Maths: Year 9: 9C/Ma2MNO, English: Year 9: 9C/En2PQR"
"""
    
    # Sample SEN data
    students_sen_content = """Name,Pupil Premium Recipient at any time this academic year?,Looked After (In Care) Status,SEN at any time this academic year?,SEN need(s),EAL at any time this academic year?,Read. Comp. Standardised Score,Spelling Standardised Score,BOXALL,Neurodiversity and/or Sensory Impairment,Medical Information,Health Care Plan/Risk Assessment,Stage 1,Stage 2,Stage 3,Stage 4,Stage 5
"Smith, John",Yes,,Yes,"Social, Emotional & Mental Health",No,82,75,Y,.,.,.,,.,.,"Stage 3 support",.,
"Jones, Sarah",No,,No,,No,95,110,.,.,.,.,,.,.,.,.,.
"Brown, Mike",Yes,,Yes,"Specific Learning Difficulty",Yes,70,65,.,.,.,.,,.,Reading support,.,.
"""
    
    # Sample timetable
    timetable_content = """Day,Time Slot,Course/Class,Staff,Room,Suspended?
Monday,09:00 - 10:00,Maths: Year 7: 7A/Ma1ABC,Mr. Teacher,Room 101,
Monday,10:00 - 11:00,English: Year 7: 7A/En1DEF,Ms. English,Room 102,
Monday,11:00 - 12:00,Science: Year 8: 8B/Sc1GHI,Dr. Science,Lab 1,
"""
    
    # Write files
    uploads_dir = Path("uploads")
    uploads_dir.mkdir(exist_ok=True)
    
    files_content = {
        "students_classes": students_classes_content,
        "students_sen": students_sen_content,
        "timetable": timetable_content
    }
    
    for file_type, content in files_content.items():
        file_path = uploads_dir / f"test_{file_type}.csv"
        with open(file_path, 'w') as f:
            f.write(content)
        sample_files[file_type] = file_path
    
    return sample_files

def cleanup_sample_files(sample_files):
    """Remove sample files after testing"""
    for file_path in sample_files.values():
        try:
            os.remove(file_path)
        except:
            pass

if __name__ == "__main__":
    test_backend()