# Teaching Assistant Timetable Analyzer - Web Application

A comprehensive web application for analyzing Teaching Assistant needs across school timetables, with configurable SEN weightings and interactive dashboards.

## Features

- **File Upload Management**: Drag-and-drop interface for CSV files (timetables, student classes, SEN data)
- **Configurable SEN Weightings**: Interactive dashboard to modify scoring weights for different SEN factors
- **Analysis Dashboard**: Visual charts and statistics showing need distribution
- **Interactive Timetable Grid**: Color-coded priority levels for optimal TA deployment
- **Student Rankings**: Sortable table with detailed need breakdowns
- **Class Analysis**: Priority-based class listings with student details
- **Report Generation**: Comprehensive analysis results with exportable data

## Technology Stack

- **Frontend**: React 18 with TypeScript, Ant Design, Chart.js
- **Backend**: Flask (Python), SQLAlchemy, Pandas
- **Database**: SQLite (development)
- **File Processing**: Pandas for CSV analysis

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Installation

1. **Clone and navigate to the project**
   ```bash
   cd ta_web_app
   ```

2. **Set up the backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Set up the frontend**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   python app.py
   ```
   Backend will run on http://localhost:5000

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm start
   ```
   Frontend will run on http://localhost:3000

3. **Access the application**
   Open your browser and navigate to http://localhost:3000

## Usage Guide

### 1. Upload Data Files
- **Student Classes CSV**: Contains student names and their enrolled classes
- **Student SEN CSV**: Contains SEN information, scores, and support details  
- **Timetable CSV**: Contains school timetable with class schedules

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

## File Format Requirements

### Student Classes CSV
Required columns:
- `Name`: Student name
- `Courses/classes`: Comma-separated list of enrolled classes

### Student SEN CSV
Required columns:
- `Name`: Student name
- `Pupil Premium Recipient at any time this academic year?`: Yes/No
- `SEN at any time this academic year?`: Yes/No
- `SEN need(s)`: Comma-separated list of SEN types
- `EAL at any time this academic year?`: Yes/No
- `Read. Comp. Standardised Score`: Numeric score
- `Spelling Standardised Score`: Numeric score
- `BOXALL`: Assessment data
- Additional medical and support columns

### Timetable CSV
Required columns:
- `Day`: Day of week
- `Time Slot`: Time period
- `Course/Class`: Class identifier
- `Staff`: Teacher name
- `Room`: Room number

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/upload/{file_type}` - Upload CSV files
- `GET /api/weightings` - Get weighting configurations
- `POST /api/weightings` - Save weighting configuration
- `POST /api/analysis/run` - Run analysis
- `GET /api/students` - Get student rankings
- `GET /api/classes` - Get class analysis
- `GET /api/timetable/grid` - Get timetable grid

## SEN Scoring System

The application uses a configurable points-based system:

- **Pupil Premium**: Default +2 points
- **Looked After Status**: Default +3 points
- **SEN Needs**: Default +3 points per need type
- **EAL**: Default +1 point
- **Low Reading/Spelling**: Default +2 points (below threshold)
- **BOXALL Assessment**: Default +2 points
- **Medical Information**: Default +1 point per entry
- **Support Stages**: Default +1 point per stage

## Development

### Project Structure
```
ta_web_app/
├── backend/
│   ├── app.py              # Flask application
│   ├── ta_analyzer.py      # Core analysis logic
│   ├── requirements.txt    # Python dependencies
│   └── uploads/           # Uploaded files
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   └── App.js         # Main application
│   ├── package.json       # Node dependencies
│   └── public/            # Static files
└── README.md
```

### Adding New Features

1. **Backend**: Add new endpoints in `app.py` and extend analysis logic in `ta_analyzer.py`
2. **Frontend**: Create new components in `src/components/` and update routing in `App.js`
3. **Database**: Extend models in `app.py` for new data requirements

## Production Deployment

### Backend
- Use Gunicorn: `gunicorn -w 4 -b 0.0.0.0:5000 app:app`
- Configure PostgreSQL database
- Set up environment variables for configuration

### Frontend
- Build for production: `npm run build`
- Serve static files with nginx or similar
- Configure API proxy for backend communication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.