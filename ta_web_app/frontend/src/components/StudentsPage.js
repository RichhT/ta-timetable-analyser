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
  Descriptions
} from 'antd';
import { SearchOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { getStudents } from '../services/api';

const { Title, Text } = Typography;
const { Search } = Input;

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await getStudents();
      setStudents(response.data);
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNeedLevelColor = (score) => {
    if (score >= 8) return 'red';
    if (score >= 4) return 'orange';
    if (score >= 1) return 'yellow';
    return 'green';
  };

  const getNeedLevelText = (score) => {
    if (score >= 8) return 'High';
    if (score >= 4) return 'Medium';
    if (score >= 1) return 'Low';
    return 'None';
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchText.toLowerCase()) ||
    student.breakdown.toLowerCase().includes(searchText.toLowerCase())
  );

  const showStudentDetails = (student) => {
    setSelectedStudent(student);
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
      title: 'Student Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name) => <Text strong>{name}</Text>
    },
    {
      title: 'Need Score',
      dataIndex: 'score',
      key: 'score',
      width: 120,
      sorter: (a, b) => b.score - a.score,
      render: (score) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: 18, 
            fontWeight: 'bold', 
            color: getNeedLevelColor(score) === 'red' ? '#f5222d' : 
                   getNeedLevelColor(score) === 'orange' ? '#fa8c16' :
                   getNeedLevelColor(score) === 'yellow' ? '#faad14' : '#52c41a'
          }}>
            {score}
          </div>
          <Tag color={getNeedLevelColor(score)} size="small">
            {getNeedLevelText(score)}
          </Tag>
        </div>
      )
    },
    {
      title: 'Need Breakdown',
      dataIndex: 'breakdown',
      key: 'breakdown',
      ellipsis: true,
      render: (breakdown) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {breakdown}
        </Text>
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
          onClick={() => showStudentDetails(record)}
        >
          Details
        </Button>
      )
    }
  ];

  const getBreakdownItems = (breakdown) => {
    if (!breakdown || breakdown === "No specific needs identified") {
      return [];
    }
    
    return breakdown.split(';').map(item => item.trim()).filter(item => item);
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
          <Title level={2}>Student Rankings</Title>
          <Text type="secondary">
            Students ranked by Teaching Assistant need score from highest to lowest.
          </Text>
        </div>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={loadStudents}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {students.length === 0 ? (
        <Alert
          message="No Student Data"
          description="Please upload your data files and run the analysis to view student rankings."
          type="info"
          showIcon
        />
      ) : (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Search
                placeholder="Search students by name or needs"
                allowClear
                enterButton={<SearchOutlined />}
                size="middle"
                onSearch={setSearchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
              />
              <Text type="secondary">
                Showing {filteredStudents.length} of {students.length} students
              </Text>
            </Space>
          </Card>

          <Card>
            <Table
              columns={columns}
              dataSource={filteredStudents}
              rowKey="name"
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} students`
              }}
              scroll={{ x: 800 }}
            />
          </Card>
        </>
      )}

      <Modal
        title={selectedStudent ? `Student Details: ${selectedStudent.name}` : 'Student Details'}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedStudent && (
          <div>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Name">
                {selectedStudent.name}
              </Descriptions.Item>
              <Descriptions.Item label="Need Score">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ 
                    fontSize: 20, 
                    fontWeight: 'bold',
                    color: getNeedLevelColor(selectedStudent.score) === 'red' ? '#f5222d' : 
                           getNeedLevelColor(selectedStudent.score) === 'orange' ? '#fa8c16' :
                           getNeedLevelColor(selectedStudent.score) === 'yellow' ? '#faad14' : '#52c41a'
                  }}>
                    {selectedStudent.score}
                  </span>
                  <Tag color={getNeedLevelColor(selectedStudent.score)}>
                    {getNeedLevelText(selectedStudent.score)}
                  </Tag>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Need Factors">
                {getBreakdownItems(selectedStudent.breakdown).length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {getBreakdownItems(selectedStudent.breakdown).map((item, index) => (
                      <Tag key={index} color="blue">
                        {item}
                      </Tag>
                    ))}
                  </div>
                ) : (
                  <Text type="secondary">No specific needs identified</Text>
                )}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudentsPage;