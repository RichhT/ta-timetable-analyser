import React, { useState } from 'react';
import { Card, Row, Col, Button, message, Progress, Typography, Alert } from 'antd';
import { UploadOutlined, CheckCircleOutlined, FileOutlined, ClearOutlined } from '@ant-design/icons';
import { useDropzone } from 'react-dropzone';
import { uploadFile, clearData } from '../services/api';

const { Title, Text } = Typography;

const FileUploadCard = ({ title, fileType, description, uploaded, onUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      message.error('Please upload CSV files only');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const response = await uploadFile(fileType, file);
      setUploadProgress(100);
      message.success(`${title} uploaded successfully! Found ${response.data.rows} rows.`);
      onUpload(fileType, true);
    } catch (error) {
      message.error(`Upload failed: ${error.response?.data?.error || error.message}`);
      onUpload(fileType, false);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false,
    disabled: uploading
  });

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {uploaded ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <FileOutlined />}
          {title}
        </div>
      }
      extra={uploaded && <Text type="success">Uploaded</Text>}
      style={{ height: '100%' }}
    >
      <div 
        {...getRootProps()} 
        className={`upload-area ${isDragActive ? 'dragover' : ''}`}
        style={{ 
          opacity: uploading ? 0.7 : 1,
          cursor: uploading ? 'not-allowed' : 'pointer'
        }}
      >
        <input {...getInputProps()} />
        <UploadOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
        <p style={{ marginBottom: 8 }}>
          {isDragActive ? 'Drop the CSV file here' : 'Drag & drop CSV file here, or click to select'}
        </p>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {description}
        </Text>
      </div>
      
      {uploading && (
        <div style={{ marginTop: 16 }}>
          <Progress percent={uploadProgress} status="active" />
          <Text type="secondary">Uploading and validating...</Text>
        </div>
      )}
    </Card>
  );
};

const UploadPage = ({ uploadedFiles, setUploadedFiles }) => {
  const [clearingData, setClearingData] = useState(false);

  const handleUpload = (fileType, success) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fileType]: success
    }));
  };

  const handleClearData = async () => {
    setClearingData(true);
    try {
      await clearData();
      setUploadedFiles({
        students_classes: false,
        students_sen: false,
        timetable: false
      });
      message.success('All data cleared successfully! You can now upload new files.');
    } catch (error) {
      message.error('Failed to clear data: ' + (error.response?.data?.error || error.message));
    } finally {
      setClearingData(false);
    }
  };

  const allFilesUploaded = Object.values(uploadedFiles).every(Boolean);
  const anyFilesUploaded = Object.values(uploadedFiles).some(Boolean);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Upload Data Files</Title>
        </div>
        {anyFilesUploaded && (
          <Button 
            danger 
            icon={<ClearOutlined />} 
            onClick={handleClearData}
            loading={clearingData}
          >
            Clear All Data
          </Button>
        )}
      </div>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Upload the three required CSV files to begin your analysis. All files must be uploaded before you can run the analysis.
      </Text>

      <Alert
        message="Data Management"
        description="When you upload the first file of a new set, all previous analysis data will be automatically cleared to ensure clean results."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <FileUploadCard
            title="Student Classes"
            fileType="students_classes"
            description="CSV file containing student names and their enrolled classes"
            uploaded={uploadedFiles.students_classes}
            onUpload={handleUpload}
          />
        </Col>
        <Col xs={24} md={8}>
          <FileUploadCard
            title="Student SEN Data"
            fileType="students_sen"
            description="CSV file containing student SEN information, scores, and support details"
            uploaded={uploadedFiles.students_sen}
            onUpload={handleUpload}
          />
        </Col>
        <Col xs={24} md={8}>
          <FileUploadCard
            title="Timetable"
            fileType="timetable"
            description="CSV file containing the school timetable with class schedules"
            uploaded={uploadedFiles.timetable}
            onUpload={handleUpload}
          />
        </Col>
      </Row>

      {allFilesUploaded && (
        <Alert
          message="All files uploaded successfully!"
          description="You can now configure weightings and run the analysis."
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card title="File Format Requirements">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Title level={4}>Student Classes CSV</Title>
            <Text type="secondary">
              Required columns:
              <ul>
                <li>Name</li>
                <li>Courses/classes</li>
              </ul>
            </Text>
          </Col>
          <Col xs={24} md={8}>
            <Title level={4}>Student SEN CSV</Title>
            <Text type="secondary">
              Required columns:
              <ul>
                <li>Name</li>
                <li>Pupil Premium Recipient at any time this academic year?</li>
                <li>SEN at any time this academic year?</li>
                <li>And other SEN-related columns...</li>
              </ul>
            </Text>
          </Col>
          <Col xs={24} md={8}>
            <Title level={4}>Timetable CSV</Title>
            <Text type="secondary">
              Required columns:
              <ul>
                <li>Day</li>
                <li>Time Slot</li>
                <li>Course/Class</li>
                <li>Staff</li>
                <li>Room</li>
              </ul>
            </Text>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default UploadPage;