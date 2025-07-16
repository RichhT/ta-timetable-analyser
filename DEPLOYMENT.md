# Deployment Guide - TA Timetable Analyser

## 🚀 Deploy to Render.com (Free)

### Prerequisites
- GitHub account with your repository
- Render.com account (free)

### Step-by-Step Deployment

#### 1. **Connect to Render.com**
1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" and select "Blueprint"
3. Connect your GitHub account
4. Select the `ta-timetable-analyser` repository
5. Click "Connect"

#### 2. **Configure Services**
Render will automatically detect the `render.yaml` file and create:
- **Database**: PostgreSQL (free tier)
- **Backend**: Flask API server
- **Frontend**: React static site

#### 3. **Environment Variables**
The following environment variables will be automatically set:
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - Auto-generated secure key
- `FLASK_ENV` - Set to "production"
- `REACT_APP_API_URL` - Backend API URL

#### 4. **Deploy**
- Click "Apply"
- Wait for deployment to complete (5-10 minutes)
- Both services should show "Live" status

#### 5. **Access Your Application**
- Frontend URL: `https://ta-analyser-frontend.onrender.com`
- Backend API: `https://ta-analyser-backend.onrender.com`

### 🔐 Default Login Credentials
- **Username**: `admin`
- **Password**: `admin123`

**⚠️ Important**: Change the default password after first login!

---

## 🛠️ Manual Deployment (Alternative)

### Deploy Backend
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `gunicorn auth_app:app`
5. Add environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `SECRET_KEY`: A secure random string
   - `FLASK_ENV`: `production`

### Deploy Frontend
1. Create a new Static Site on Render
2. Connect your GitHub repository
3. Set build command: `cd ta_web_app/frontend && npm install && npm run build`
4. Set publish directory: `ta_web_app/frontend/build`
5. Add environment variable:
   - `REACT_APP_API_URL`: Your backend service URL

### Create Database
1. Create a new PostgreSQL database on Render
2. Copy the connection string to your backend environment variables

---

## 🔧 Production Configuration

### Security Settings
- Change default admin password immediately
- Use strong, unique SECRET_KEY
- Enable HTTPS (automatic on Render)
- Configure CORS for your domain

### Performance Optimization
- Enable database connection pooling
- Configure static file serving
- Set up monitoring and logging

### Scaling
- Free tier limitations: 750 hours/month
- Upgrade to paid plan for:
  - Always-on services
  - More resources
  - Custom domains
  - Advanced features

---

## 📊 Usage After Deployment

### Admin Setup
1. Log in with default credentials
2. Change admin password
3. Create user accounts for staff
4. Configure school-specific weightings

### User Workflow
1. **Login** with provided credentials
2. **Upload** three CSV files:
   - Student Classes
   - Student SEN Data
   - Timetable
3. **Configure** SEN weightings as needed
4. **Run Analysis** to generate reports
5. **View Results** in interactive dashboards

### Features Available
- ✅ Secure user authentication
- ✅ File upload and validation
- ✅ Configurable SEN weightings
- ✅ Interactive analysis dashboard
- ✅ Visual timetable grid
- ✅ Student and class rankings
- ✅ Data export capabilities

---

## 🆘 Troubleshooting

### Common Issues
- **Build failures**: Check requirements.txt and Node.js version
- **Database connection**: Verify DATABASE_URL format
- **CORS errors**: Ensure backend URL is correct in frontend
- **Login issues**: Check SECRET_KEY and database connection

### Support
- Check Render.com documentation
- Review application logs in Render dashboard
- GitHub Issues: Repository issues tab

---

## 🔄 Updates and Maintenance

### Deploying Updates
1. Push changes to GitHub
2. Render automatically rebuilds and deploys
3. Monitor deployment status in dashboard

### Database Backups
- Render provides automatic backups
- Export data regularly for additional safety
- Consider paid plan for enhanced backup features

### Monitoring
- Monitor application performance
- Check error logs regularly
- Set up alerts for downtime

---

**🎉 Your TA Timetable Analyser is now live and ready for use!**