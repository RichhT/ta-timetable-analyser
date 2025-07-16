# Manual Deployment Guide - TA Timetable Analyser

Since Render Blueprints have limitations, here's a simple manual deployment approach:

## 🚀 Manual Deployment to Render.com (Recommended)

### Step 1: Create Database
1. Go to [render.com](https://render.com) and login
2. Click "New +" → "PostgreSQL"
3. Name: `ta-analyser-db`
4. Database Name: `ta_analyser`
5. User: `ta_user`
6. Plan: Free
7. Click "Create Database"
8. **Copy the "External Database URL"** - you'll need this

### Step 2: Deploy Backend
1. Click "New +" → "Web Service"
2. Connect your GitHub account
3. Select `ta-timetable-analyser` repository
4. Configure:
   - **Name**: `ta-analyser-backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn auth_app:app`
   - **Plan**: Free

5. **Environment Variables** (click "Advanced"):
   - `DATABASE_URL` = Your PostgreSQL External Database URL
   - `SECRET_KEY` = Generate a random string (e.g., `your-secret-key-here-123`)
   - `FLASK_ENV` = `production`

6. Click "Create Web Service"
7. **Copy the backend URL** (e.g., `https://ta-analyser-backend.onrender.com`)

### Step 3: Deploy Frontend
1. Click "New +" → "Static Site"
2. Connect your GitHub account
3. Select `ta-timetable-analyser` repository
4. Configure:
   - **Name**: `ta-analyser-frontend`
   - **Build Command**: `cd ta_web_app/frontend && npm install && npm run build`
   - **Publish Directory**: `ta_web_app/frontend/build`
   - **Plan**: Free

5. **Environment Variables**:
   - `REACT_APP_API_URL` = Your backend URL from Step 2

6. Click "Create Static Site"

### Step 4: Configure CORS (Important!)
After both services are deployed, you need to update the backend to allow the frontend domain.

1. Go to your backend service settings
2. Add environment variable:
   - `FRONTEND_URL` = Your frontend URL (e.g., `https://ta-analyser-frontend.onrender.com`)

## 🔐 Access Your Application

1. **Frontend URL**: `https://ta-analyser-frontend.onrender.com`
2. **Backend API**: `https://ta-analyser-backend.onrender.com`

### Default Login:
- **Username**: `admin`
- **Password**: `admin123`

## 🛠️ Quick Commands

### Generate Secret Key (Python):
```python
import secrets
print(secrets.token_urlsafe(32))
```

### Test Backend Health:
```bash
curl https://your-backend-url.onrender.com/api/health
```

## 📝 Expected Timeline
- Database: 2-3 minutes
- Backend: 5-10 minutes
- Frontend: 3-5 minutes
- Total: ~15 minutes

## 🔧 Troubleshooting

### Common Issues:
1. **Build failures**: Check the logs in Render dashboard
2. **Database connection**: Verify DATABASE_URL is correct
3. **CORS errors**: Ensure REACT_APP_API_URL is set correctly
4. **Login issues**: Check SECRET_KEY is set

### Check Logs:
- Go to your service in Render dashboard
- Click "Logs" to see build and runtime logs
- Look for error messages

## 🎉 Success Indicators

### Backend Working:
- Visit `https://your-backend-url.onrender.com/api/health`
- Should return: `{"status": "healthy", "authenticated": false}`

### Frontend Working:
- Visit your frontend URL
- Should show login page
- Login with admin/admin123

### Database Working:
- Backend logs should show "Created default admin user"
- Login should work successfully

## 🔄 Updates

To update your deployment:
1. Push changes to GitHub
2. Render automatically rebuilds and deploys
3. Check deployment logs for any issues

---

**This manual approach is more reliable than Blueprints and gives you better control over the deployment process.**