import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Health check
export const checkHealth = () => api.get('/api/health');

// File uploads
export const uploadFile = (fileType, file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post(`/api/upload/${fileType}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Weightings
export const getWeightings = (schoolId = 1) => 
  api.get(`/api/weightings?school_id=${schoolId}`);

export const saveWeightings = (data) => 
  api.post('/api/weightings', data);

// Analysis
export const runAnalysis = (weightingConfigId) => 
  api.post('/api/analysis/run', { weighting_config_id: weightingConfigId });

export const getAnalysisResults = (resultId) => 
  api.get(`/api/analysis/results/${resultId}`);

// Students and Classes
export const getStudents = () => api.get('/api/students');
export const getClasses = () => api.get('/api/classes');

// Timetable
export const getTimetableGrid = () => api.get('/api/timetable/grid');

export default api;