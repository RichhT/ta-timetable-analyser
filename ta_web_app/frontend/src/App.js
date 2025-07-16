import React, { useState, useEffect } from 'react';
import { Layout, Menu, notification } from 'antd';
import { 
  UploadOutlined, 
  BarChartOutlined, 
  SettingOutlined, 
  TableOutlined,
  UserOutlined,
  BookOutlined
} from '@ant-design/icons';
import UploadPage from './components/UploadPage';
import WeightingPage from './components/WeightingPage';
import AnalysisPage from './components/AnalysisPage';
import TimetablePage from './components/TimetablePage';
import StudentsPage from './components/StudentsPage';
import ClassesPage from './components/ClassesPage';
import { checkHealth } from './services/api';

const { Header, Sider, Content } = Layout;

function App() {
  const [selectedKey, setSelectedKey] = useState('upload');
  const [collapsed, setCollapsed] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({
    students_classes: false,
    students_sen: false,
    timetable: false
  });

  useEffect(() => {
    // Check backend health on startup
    checkHealth()
      .then(() => {
        notification.success({
          message: 'Backend Connected',
          description: 'Successfully connected to the analysis server'
        });
      })
      .catch(() => {
        notification.error({
          message: 'Backend Connection Failed',
          description: 'Could not connect to the analysis server'
        });
      });
  }, []);

  const menuItems = [
    {
      key: 'upload',
      icon: <UploadOutlined />,
      label: 'Upload Data',
    },
    {
      key: 'weightings',
      icon: <SettingOutlined />,
      label: 'Configure Weightings',
    },
    {
      key: 'analysis',
      icon: <BarChartOutlined />,
      label: 'Analysis Results',
    },
    {
      key: 'timetable',
      icon: <TableOutlined />,
      label: 'Timetable Grid',
    },
    {
      key: 'students',
      icon: <UserOutlined />,
      label: 'Student Rankings',
    },
    {
      key: 'classes',
      icon: <BookOutlined />,
      label: 'Class Analysis',
    }
  ];

  const renderContent = () => {
    switch (selectedKey) {
      case 'upload':
        return <UploadPage uploadedFiles={uploadedFiles} setUploadedFiles={setUploadedFiles} />;
      case 'weightings':
        return <WeightingPage />;
      case 'analysis':
        return <AnalysisPage />;
      case 'timetable':
        return <TimetablePage />;
      case 'students':
        return <StudentsPage />;
      case 'classes':
        return <ClassesPage />;
      default:
        return <UploadPage uploadedFiles={uploadedFiles} setUploadedFiles={setUploadedFiles} />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        theme="light"
        width={250}
      >
        <div style={{ 
          height: 64, 
          margin: 16, 
          background: '#1890ff',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold'
        }}>
          {collapsed ? 'TA' : 'TA Analyser'}
        </div>
        <Menu
          theme="light"
          selectedKeys={[selectedKey]}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => setSelectedKey(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <h1 style={{ margin: 0, fontSize: '20px', color: '#1890ff' }}>
            Teaching Assistant Timetable Analyser
          </h1>
        </Header>
        <Content style={{ 
          margin: '24px',
          padding: '24px',
          background: '#fff',
          borderRadius: '8px',
          minHeight: 'calc(100vh - 112px)'
        }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;