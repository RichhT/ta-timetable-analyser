import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  message, 
  Typography, 
  Space,
  Select,
  Statistic,
  Progress,
  Alert,
  Spin
} from 'antd';
import { 
  PlayCircleOutlined, 
  DownloadOutlined,
  BarChartOutlined,
  UserOutlined,
  BookOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { getWeightings, runAnalysis } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend,
  ArcElement
);

const { Title, Text } = Typography;

const AnalysisPage = () => {
  const [weightingConfigs, setWeightingConfigs] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    loadWeightingConfigs();
  }, []);

  const loadWeightingConfigs = async () => {
    setLoading(true);
    try {
      const response = await getWeightings();
      setWeightingConfigs(response.data);
      
      // Select default configuration
      const defaultConfig = response.data.find(config => config.is_default);
      if (defaultConfig) {
        setSelectedConfig(defaultConfig.id);
      }
    } catch (error) {
      message.error('Failed to load weighting configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!selectedConfig) {
      message.error('Please select a weighting configuration');
      return;
    }

    setAnalysisLoading(true);
    try {
      const response = await runAnalysis(selectedConfig);
      setAnalysisResults(response.data.results);
      message.success('Analysis completed successfully');
    } catch (error) {
      message.error(`Analysis failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const getStudentNeedDistribution = () => {
    if (!analysisResults?.statistics) return null;

    const { statistics } = analysisResults;
    return {
      labels: ['No Needs', 'Low Needs (1-3)', 'Medium Needs (4-7)', 'High Needs (8+)'],
      datasets: [
        {
          data: [statistics.no_needs, statistics.low_needs, statistics.medium_needs, statistics.high_needs],
          backgroundColor: [
            '#52c41a',
            '#faad14',
            '#fa8c16',
            '#f5222d'
          ],
          borderWidth: 0
        }
      ]
    };
  };

  const getTopClassesChart = () => {
    if (!analysisResults?.top_classes) return null;

    const topClasses = analysisResults.top_classes.slice(0, 10);
    return {
      labels: topClasses.map(cls => cls.class_code),
      datasets: [
        {
          label: 'Weighted Need Score',
          data: topClasses.map(cls => cls.weighted_score),
          backgroundColor: 'rgba(24, 144, 255, 0.6)',
          borderColor: 'rgba(24, 144, 255, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
    },
  };

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
          <Title level={2}>Analysis Results</Title>
          <Text type="secondary">
            Run the analysis to generate comprehensive Teaching Assistant need reports.
          </Text>
        </div>
        <Space>
          <Select
            style={{ width: 250 }}
            placeholder="Select weighting configuration"
            value={selectedConfig}
            onChange={setSelectedConfig}
            options={weightingConfigs.map(config => ({
              label: config.name + (config.is_default ? ' (Default)' : ''),
              value: config.id
            }))}
          />
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />} 
            onClick={handleRunAnalysis}
            loading={analysisLoading}
            disabled={!selectedConfig}
          >
            Run Analysis
          </Button>
        </Space>
      </div>

      {analysisLoading && (
        <Alert
          message="Running Analysis"
          description="Processing student data and calculating need scores..."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {analysisResults && (
        <>
          {/* Summary Statistics */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="Total Students"
                  value={analysisResults.statistics.total_students}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="Total Classes"
                  value={analysisResults.statistics.total_classes}
                  prefix={<BookOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="High Need Students"
                  value={analysisResults.statistics.high_needs}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="Average Need Score"
                  value={analysisResults.statistics.average_score}
                  precision={2}
                  prefix={<BarChartOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Charts */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={12}>
              <Card title="Student Need Distribution" style={{ height: 400 }}>
                <div style={{ height: 300 }}>
                  <Doughnut data={getStudentNeedDistribution()} options={doughnutOptions} />
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Top 10 Classes by Need Score" style={{ height: 400 }}>
                <div style={{ height: 300 }}>
                  <Bar data={getTopClassesChart()} options={chartOptions} />
                </div>
              </Card>
            </Col>
          </Row>

          {/* Quick Insights */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Top 10 Students by Need Score">
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {analysisResults.top_students.slice(0, 10).map((student, index) => (
                    <div key={student.name} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: index < 9 ? '1px solid #f0f0f0' : 'none'
                    }}>
                      <div>
                        <Text strong>{student.name}</Text>
                        <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                          {student.breakdown}
                        </Text>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <Text strong style={{ color: student.score >= 8 ? '#f5222d' : student.score >= 4 ? '#faad14' : '#52c41a' }}>
                          {student.score}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Top 10 Classes by Weighted Score">
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {analysisResults.top_classes.slice(0, 10).map((cls, index) => (
                    <div key={cls.class_code} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: index < 9 ? '1px solid #f0f0f0' : 'none'
                    }}>
                      <div>
                        <Text strong>{cls.class_code}</Text>
                        <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                          {cls.student_count} students • {cls.high_need_students} high need
                        </Text>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <Text strong style={{ color: cls.weighted_score >= 20 ? '#f5222d' : cls.weighted_score >= 10 ? '#faad14' : '#52c41a' }}>
                          {cls.weighted_score}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {!analysisResults && !analysisLoading && (
        <Alert
          message="No Analysis Results"
          description="Upload your data files and run the analysis to see detailed results here."
          type="info"
          showIcon
          style={{ marginTop: 24 }}
        />
      )}
    </div>
  );
};

export default AnalysisPage;