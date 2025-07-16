import React, { useState, useEffect } from 'react';
import { Card, Typography, Alert, Spin, Tag, Button, Space } from 'antd';
import { ReloadOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { getTimetableGrid } from '../services/api';

const { Title, Text } = Typography;

const TimetablePage = () => {
  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTimetableData();
  }, []);

  const loadTimetableData = async () => {
    setLoading(true);
    try {
      const response = await getTimetableGrid();
      setTimetableData(response.data);
    } catch (error) {
      console.error('Failed to load timetable data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (score) => {
    if (score >= 20) return '#f5222d';
    if (score >= 10) return '#faad14';
    return '#52c41a';
  };

  const getPriorityLabel = (score) => {
    if (score >= 20) return 'High';
    if (score >= 10) return 'Medium';
    return 'Low';
  };

  const sortedTimeSlots = timetableData ? 
    Object.keys(timetableData).sort((a, b) => {
      // Extract time from time slot for sorting
      const timeA = a.match(/\d{2}:\d{2}/);
      const timeB = b.match(/\d{2}:\d{2}/);
      if (timeA && timeB) {
        return timeA[0].localeCompare(timeB[0]);
      }
      return a.localeCompare(b);
    }) : [];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2}>Timetable Grid</Title>
          <Text type="secondary">
            Classes organised by time slot and prioritised by Teaching Assistant need score.
          </Text>
        </div>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={loadTimetableData}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {!timetableData && (
        <Alert
          message="No Timetable Data"
          description="Please upload your data files and run the analysis to view the timetable grid."
          type="info"
          showIcon
        />
      )}

      {timetableData && (
        <div className="timetable-grid">
          {sortedTimeSlots.map(timeSlot => (
            <Card key={timeSlot} style={{ marginBottom: 16 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: 16,
                paddingBottom: 8,
                borderBottom: '1px solid #f0f0f0'
              }}>
                <ClockCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                <Title level={4} style={{ margin: 0 }}>
                  {timeSlot}
                </Title>
                <Tag color="blue" style={{ marginLeft: 'auto' }}>
                  {timetableData[timeSlot].length} classes
                </Tag>
              </div>
              
              {timetableData[timeSlot].length === 0 ? (
                <Text type="secondary">No classes requiring TA support</Text>
              ) : (
                <div>
                  {timetableData[timeSlot].map((lesson, index) => (
                    <div key={index} className="lesson-item" style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 16px',
                      marginBottom: 8,
                      backgroundColor: '#fafafa',
                      borderRadius: 6,
                      border: '1px solid #f0f0f0'
                    }}>
                      <div style={{ 
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: getPriorityColor(lesson.need_score),
                        marginRight: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 12,
                        fontWeight: 'bold'
                      }}>
                        {index + 1}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                          <Text strong style={{ marginRight: 12 }}>
                            {lesson.class_code}
                          </Text>
                          <Tag color={getPriorityColor(lesson.need_score)}>
                            {getPriorityLabel(lesson.need_score)} Priority
                          </Tag>
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#666' }}>
                          <span>Score: {lesson.need_score.toFixed(1)}</span>
                          <span>Students: {lesson.student_count}</span>
                          <span>High Need: {lesson.high_need_students}</span>
                          <span>Staff: {lesson.staff}</span>
                          <span>Room: {lesson.room}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {timetableData && (
        <Card title="Legend" style={{ marginTop: 24 }}>
          <Space>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                width: 16, 
                height: 16, 
                backgroundColor: '#f5222d', 
                borderRadius: '50%',
                marginRight: 8 
              }}></div>
              <Text>High Priority (20+ points)</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                width: 16, 
                height: 16, 
                backgroundColor: '#faad14', 
                borderRadius: '50%',
                marginRight: 8 
              }}></div>
              <Text>Medium Priority (10-19 points)</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                width: 16, 
                height: 16, 
                backgroundColor: '#52c41a', 
                borderRadius: '50%',
                marginRight: 8 
              }}></div>
              <Text>Low Priority (&lt;10 points)</Text>
            </div>
          </Space>
        </Card>
      )}
    </div>
  );
};

export default TimetablePage;