import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Input, 
  Card, 
  Typography, 
  Tag, 
  Button, 
  Space,
  Alert,
  Spin,
  Modal,
  List,
  Descriptions,
  Progress
} from 'antd';
import { SearchOutlined, EyeOutlined, ReloadOutlined, TeamOutlined } from '@ant-design/icons';
import { getClasses } from '../services/api';

const { Title, Text } = Typography;
const { Search } = Input;

const ClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const response = await getClasses();
      setClasses(response.data);
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (score) => {
    if (score >= 20) return 'red';
    if (score >= 10) return 'orange';
    return 'green';
  };

  const getPriorityText = (score) => {
    if (score >= 20) return 'High';
    if (score >= 10) return 'Medium';
    return 'Low';
  };

  const filteredClasses = classes.filter(cls =>
    cls.class_code.toLowerCase().includes(searchText.toLowerCase())
  );

  const showClassDetails = (cls) => {
    setSelectedClass(cls);
    setDetailModalVisible(true);
  };

  const columns = [
    {
      title: 'Rank',
      key: 'rank',
      width: 80,
      render: (_, __, index) => (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: index < 3 ? '#faad14' : '#f0f0f0',
          color: index < 3 ? 'white' : '#666',
          fontWeight: 'bold'
        }}>
          {index + 1}
        </div>
      )
    },
    {
      title: 'Class Code',
      dataIndex: 'class_code',
      key: 'class_code',
      sorter: (a, b) => a.class_code.localeCompare(b.class_code),
      render: (class_code) => <Text strong>{class_code}</Text>
    },
    {
      title: 'Students',
      dataIndex: 'student_count',
      key: 'student_count',
      width: 100,
      sorter: (a, b) => b.student_count - a.student_count,
      render: (count) => (
        <div style={{ textAlign: 'center' }}>
          <TeamOutlined style={{ marginRight: 4 }} />
          {count}
        </div>
      )
    },
    {
      title: 'High Need',
      dataIndex: 'high_need_students',
      key: 'high_need_students',
      width: 100,
      sorter: (a, b) => b.high_need_students - a.high_need_students,
      render: (count, record) => (
        <div style={{ textAlign: 'center' }}>
          <Text strong style={{ color: '#f5222d' }}>{count}</Text>
          <div style={{ fontSize: 12, color: '#666' }}>
            ({((count / record.student_count) * 100).toFixed(0)}%)
          </div>
        </div>
      )
    },
    {
      title: 'Average Need',
      dataIndex: 'average_need_score',
      key: 'average_need_score',
      width: 120,
      sorter: (a, b) => b.average_need_score - a.average_need_score,
      render: (score) => (
        <div style={{ textAlign: 'center' }}>
          <Text strong>{score}</Text>
        </div>
      )
    },
    {
      title: 'Weighted Score',
      dataIndex: 'weighted_score',
      key: 'weighted_score',
      width: 130,
      sorter: (a, b) => b.weighted_score - a.weighted_score,
      render: (score) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: 16, 
            fontWeight: 'bold', 
            color: getPriorityColor(score) === 'red' ? '#f5222d' : 
                   getPriorityColor(score) === 'orange' ? '#fa8c16' : '#52c41a'
          }}>
            {score}
          </div>
          <Tag color={getPriorityColor(score)} size="small">
            {getPriorityText(score)}
          </Tag>
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />} 
          onClick={() => showClassDetails(record)}
        >
          Details
        </Button>
      )
    }
  ];

  const getStudentNeedColor = (score) => {
    if (score >= 8) return '#f5222d';
    if (score >= 4) return '#fa8c16';
    if (score >= 1) return '#faad14';
    return '#52c41a';
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
          <Title level={2}>Class Analysis</Title>
          <Text type="secondary">
            Classes ranked by Teaching Assistant need score from highest to lowest priority.
          </Text>
        </div>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={loadClasses}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {classes.length === 0 ? (
        <Alert
          message="No Class Data"
          description="Please upload your data files and run the analysis to view class analysis."
          type="info"
          showIcon
        />
      ) : (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Search
                placeholder="Search classes by code"
                allowClear
                enterButton={<SearchOutlined />}
                size="middle"
                onSearch={setSearchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
              />
              <Text type="secondary">
                Showing {filteredClasses.length} of {classes.length} classes
              </Text>
            </Space>
          </Card>

          <Card>
            <Table
              columns={columns}
              dataSource={filteredClasses}
              rowKey="class_code"
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} classes`
              }}
              scroll={{ x: 900 }}
            />
          </Card>
        </>
      )}

      <Modal
        title={selectedClass ? `Class Details: ${selectedClass.class_code}` : 'Class Details'}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedClass && (
          <div>
            <Descriptions column={2} bordered style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Class Code">
                {selectedClass.class_code}
              </Descriptions.Item>
              <Descriptions.Item label="Total Students">
                {selectedClass.student_count}
              </Descriptions.Item>
              <Descriptions.Item label="High Need Students">
                <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
                  {selectedClass.high_need_students}
                </span>
                <span style={{ color: '#666', marginLeft: 8 }}>
                  ({((selectedClass.high_need_students / selectedClass.student_count) * 100).toFixed(0)}%)
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Average Need Score">
                {selectedClass.average_need_score}
              </Descriptions.Item>
              <Descriptions.Item label="Total Need Score">
                {selectedClass.total_need_score}
              </Descriptions.Item>
              <Descriptions.Item label="Weighted Score">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ 
                    fontSize: 16, 
                    fontWeight: 'bold',
                    color: getPriorityColor(selectedClass.weighted_score) === 'red' ? '#f5222d' : 
                           getPriorityColor(selectedClass.weighted_score) === 'orange' ? '#fa8c16' : '#52c41a'
                  }}>
                    {selectedClass.weighted_score}
                  </span>
                  <Tag color={getPriorityColor(selectedClass.weighted_score)}>
                    {getPriorityText(selectedClass.weighted_score)} Priority
                  </Tag>
                </div>
              </Descriptions.Item>
            </Descriptions>

            <Card title="Students in This Class" size="small">
              <List
                dataSource={selectedClass.students}
                renderItem={(student) => (
                  <List.Item>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong>{student.name}</Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 100 }}>
                          <Progress
                            percent={Math.min((student.score / 15) * 100, 100)}
                            size="small"
                            strokeColor={getStudentNeedColor(student.score)}
                            showInfo={false}
                          />
                        </div>
                        <Text 
                          strong 
                          style={{ 
                            color: getStudentNeedColor(student.score),
                            minWidth: 24,
                            textAlign: 'right'
                          }}
                        >
                          {student.score}
                        </Text>
                      </div>
                    </div>
                  </List.Item>
                )}
                pagination={{ 
                  pageSize: 10,
                  size: 'small'
                }}
              />
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClassesPage;