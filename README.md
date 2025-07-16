# Teaching Assistant Timetable Analyzer

A comprehensive web application for analyzing Teaching Assistant needs across school timetables, with configurable SEN weightings and interactive dashboards.

## 🚀 Features

- **📁 File Upload Management**: Drag-and-drop interface for CSV files (timetables, student classes, SEN data)
- **⚖️ Configurable SEN Weightings**: Interactive dashboard to modify scoring weights for different SEN factors
- **📊 Analysis Dashboard**: Visual charts and statistics showing need distribution
- **🎯 Interactive Timetable Grid**: Color-coded priority levels for optimal TA deployment
- **👥 Student Rankings**: Sortable table with detailed need breakdowns
- **📚 Class Analysis**: Priority-based class listings with student details
- **💾 Data Persistence**: Save configurations and results to database

## 🛠️ Technology Stack

- **Frontend**: React 18, Ant Design, Chart.js
- **Backend**: Flask (Python), SQLAlchemy
- **Database**: SQLite (development), PostgreSQL (production)
- **File Processing**: Pandas for CSV analysis

## 🏃‍♂️ Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ta_ttt
   ```

2. **Set up Python environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install Flask Flask-CORS Flask-SQLAlchemy pandas numpy python-dotenv Werkzeug openpyxl
   ```

3. **Install frontend dependencies**
   ```bash
   cd ta_web_app/frontend
   npm install
   cd ../..
   ```

4. **Start the application**
   ```bash
   # Terminal 1 - Backend
   source venv/bin/activate
   python app.py
   
   # Terminal 2 - Frontend
   cd ta_web_app/frontend
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## 📋 Usage

### 1. Upload Data Files
Upload three CSV files:
- **Student Classes**: Student names and enrolled classes
- **Student SEN Data**: SEN information, scores, and support details
- **Timetable**: School timetable with class schedules

### 2. Configure Weightings
- Adjust point values for different SEN factors
- Save custom weighting configurations
- Set default configurations for consistent analysis

### 3. Run Analysis
- Select a weighting configuration
- Click "Run Analysis" to process all data
- View comprehensive results across multiple dashboards

### 4. View Results
- **Analysis Dashboard**: Overview with charts and statistics
- **Timetable Grid**: Time-slot organized lessons by priority
- **Student Rankings**: Individual student need scores
- **Class Analysis**: Class-level need assessment

## 📊 SEN Scoring System

The application uses a configurable points-based system:

- **Pupil Premium**: Default +2 points
- **Looked After Status**: Default +3 points
- **SEN Needs**: Default +3 points per need type
- **EAL**: Default +1 point
- **Low Reading/Spelling**: Default +2 points (below threshold)
- **BOXALL Assessment**: Default +2 points
- **Medical Information**: Default +1 point per entry
- **Support Stages**: Default +1 point per stage

## 📁 File Format Requirements

### Student Classes CSV
```csv
Name,Courses/classes
"Smith, John","Year 7, Maths: Year 7: 7A/Ma1ABC"
```

### Student SEN CSV
```csv
Name,Pupil Premium Recipient at any time this academic year?,SEN at any time this academic year?,...
"Smith, John",Yes,Yes,...
```

### Timetable CSV
```csv
Day,Time Slot,Course/Class,Staff,Room
Monday,09:00 - 10:00,Maths: Year 7: 7A/Ma1ABC,Mr. Teacher,Room 101
```

## 🚀 Deployment

### Render.com (Recommended)
1. Push code to GitHub
2. Connect Render to your repository
3. Deploy backend as "Web Service"
4. Deploy frontend as "Static Site"
5. Add PostgreSQL database

### Environment Variables
```env
DATABASE_URL=postgresql://...
FLASK_ENV=production
SECRET_KEY=your-secret-key
```

## 🔧 Development

### Project Structure
```
ta_ttt/
├── app.py                 # Flask backend
├── web_ta_analyzer.py     # Enhanced analysis logic
├── ta_web_app/
│   ├── frontend/          # React application
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── App.js
│   │   └── package.json
│   └── README.md
├── uploads/               # File upload directory
└── README.md
```

### API Endpoints
- `GET /api/health` - Health check
- `POST /api/upload/{file_type}` - Upload CSV files
- `GET /api/weightings` - Get weighting configurations
- `POST /api/weightings` - Save weighting configuration
- `POST /api/analysis/run` - Run analysis
- `GET /api/students` - Get student rankings
- `GET /api/classes` - Get class analysis
- `GET /api/timetable/grid` - Get timetable grid

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support or questions, please open an issue in the repository or contact the development team.

---

Built with ❤️ for educational institutions to optimize Teaching Assistant deployment and support student needs effectively.