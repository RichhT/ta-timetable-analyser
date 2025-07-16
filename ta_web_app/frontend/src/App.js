import React, { useState, useEffect } from 'react';
import { Layout, Menu, notification, Button, Dropdown, Avatar } from 'antd';
import { 
  UploadOutlined, 
  BarChartOutlined, 
  SettingOutlined, 
  TableOutlined,
  UserOutlined,
  BookOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import UploadPage from './components/UploadPage';
import WeightingPage from './components/WeightingPage';
import AnalysisPage from './components/AnalysisPage';
import TimetablePage from './components/TimetablePage';
import StudentsPage from './components/StudentsPage';
import ClassesPage from './components/ClassesPage';
import LoginPage from './components/LoginPage';
import { checkHealth, getCurrentUser, logout } from './services/api';

const { Header, Sider, Content } = Layout;

function App() {
  const [selectedKey, setSelectedKey] = useState('upload');
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState({
    students_classes: false,
    students_sen: false,
    timetable: false
  });

  useEffect(() => {
    // Check authentication status and backend health on startup
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await getCurrentUser();
      setUser(response.data);
      
      // Check backend health
      await checkHealth();
      notification.success({
        message: 'Connected',
        description: 'Successfully connected to the analysis server'
      });
    } catch (error) {
      // User not authenticated or backend error
      setUser(null);
      if (error.response?.status !== 401) {
        notification.error({
          message: 'Connection Error',
          description: 'Could not connect to the analysis server'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setUploadedFiles({
        students_classes: false,
        students_sen: false,
        timetable: false
      });
      notification.success({
        message: 'Logged Out',
        description: 'Successfully logged out'
      });
    } catch (error) {
      notification.error({
        message: 'Logout Error',
        description: 'Error during logout'
      });
    }
  };

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

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // User menu items
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: `${user.username} (${user.school_name})`,
      disabled: true
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout
    }
  ];

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
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <h1 style={{ margin: 0, fontSize: '20px', color: '#1890ff' }}>
            Teaching Assistant Timetable Analyser
          </h1>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} />
              {user.username}
            </Button>
          </Dropdown>
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