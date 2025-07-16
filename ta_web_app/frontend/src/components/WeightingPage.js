import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  InputNumber, 
  Button, 
  message, 
  Typography, 
  Space,
  Modal,
  Input,
  List,
  Tag,
  Popconfirm
} from 'antd';
import { 
  SaveOutlined, 
  ReloadOutlined, 
  PlusOutlined, 
  EditOutlined,
  DeleteOutlined,
  StarOutlined,
  StarFilled
} from '@ant-design/icons';
import { getWeightings, saveWeightings } from '../services/api';

const { Title, Text } = Typography;

const WeightingPage = () => {
  const [weightings, setWeightings] = useState({
    pupil_premium: 2,
    looked_after: 3,
    sen_needs_multiplier: 3,
    eal: 1,
    reading_threshold: 85,
    reading_score: 2,
    spelling_threshold: 85,
    spelling_score: 2,
    boxall: 2,
    medical_info: 1,
    stage_support: 1
  });
  
  const [savedConfigs, setSavedConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');
  const [makeDefault, setMakeDefault] = useState(false);

  useEffect(() => {
    loadWeightings();
  }, []);

  const loadWeightings = async () => {
    try {
      const response = await getWeightings();
      setSavedConfigs(response.data);
      
      // Load default configuration
      const defaultConfig = response.data.find(config => config.is_default);
      if (defaultConfig) {
        setWeightings(defaultConfig.config);
      }
    } catch (error) {
      message.error('Failed to load weighting configurations');
    }
  };

  const handleWeightingChange = (field, value) => {
    setWeightings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!newConfigName.trim()) {
      message.error('Please enter a configuration name');
      return;
    }

    setLoading(true);
    try {
      await saveWeightings({
        school_id: 1,
        name: newConfigName,
        config: weightings,
        is_default: makeDefault
      });
      
      message.success('Weighting configuration saved successfully');
      setSaveModalVisible(false);
      setNewConfigName('');
      setMakeDefault(false);
      loadWeightings();
    } catch (error) {
      message.error('Failed to save weighting configuration');
    } finally {
      setLoading(false);
    }
  };

  const loadConfiguration = (config) => {
    setWeightings(config.config);
    message.success(`Loaded configuration: ${config.name}`);
  };

  const resetToDefault = () => {
    const defaultConfig = savedConfigs.find(config => config.is_default);
    if (defaultConfig) {
      setWeightings(defaultConfig.config);
      message.success('Reset to default configuration');
    }
  };

  const weightingItems = [
    {
      key: 'pupil_premium',
      label: 'Pupil Premium',
      description: 'Points awarded for students eligible for pupil premium',
      value: weightings.pupil_premium
    },
    {
      key: 'looked_after',
      label: 'Looked After/In Care',
      description: 'Points awarded for students in care or looked after',
      value: weightings.looked_after
    },
    {
      key: 'sen_needs_multiplier',
      label: 'SEN Needs Multiplier',
      description: 'Points per SEN need type (multiplied by number of needs)',
      value: weightings.sen_needs_multiplier
    },
    {
      key: 'eal',
      label: 'English as Additional Language',
      description: 'Points awarded for EAL students',
      value: weightings.eal
    },
    {
      key: 'reading_threshold',
      label: 'Reading Comprehension Threshold',
      description: 'Score threshold below which reading support points are awarded',
      value: weightings.reading_threshold
    },
    {
      key: 'reading_score',
      label: 'Reading Comprehension Points',
      description: 'Points awarded for low reading comprehension',
      value: weightings.reading_score
    },
    {
      key: 'spelling_threshold',
      label: 'Spelling Threshold',
      description: 'Score threshold below which spelling support points are awarded',
      value: weightings.spelling_threshold
    },
    {
      key: 'spelling_score',
      label: 'Spelling Points',
      description: 'Points awarded for low spelling scores',
      value: weightings.spelling_score
    },
    {
      key: 'boxall',
      label: 'BOXALL Assessment',
      description: 'Points awarded for having BOXALL assessment data',
      value: weightings.boxall
    },
    {
      key: 'medical_info',
      label: 'Medical Information',
      description: 'Points awarded per medical/health information entry',
      value: weightings.medical_info
    },
    {
      key: 'stage_support',
      label: 'Stage Support',
      description: 'Points awarded per support stage',
      value: weightings.stage_support
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2}>Configure SEN Weightings</Title>
          <Text type="secondary">
            Adjust the point values used to calculate student need scores. Higher values increase the impact of each factor.
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={resetToDefault}>
            Reset to Default
          </Button>
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={() => setSaveModalVisible(true)}
          >
            Save Configuration
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Weighting Configuration">
            <Row gutter={[16, 16]}>
              {weightingItems.map(item => (
                <Col xs={24} sm={12} key={item.key}>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>{item.label}</Text>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 8 }}>
                      {item.description}
                    </Text>
                    <InputNumber
                      value={item.value}
                      onChange={(value) => handleWeightingChange(item.key, value)}
                      min={0}
                      max={20}
                      style={{ width: '100%' }}
                    />
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            title="Saved Configurations" 
            extra={
              <Button 
                type="text" 
                icon={<PlusOutlined />} 
                onClick={() => setSaveModalVisible(true)}
              >
                New
              </Button>
            }
          >
            <List
              dataSource={savedConfigs}
              renderItem={config => (
                <List.Item
                  actions={[
                    <Button 
                      type="text" 
                      icon={<EditOutlined />} 
                      onClick={() => loadConfiguration(config)}
                    >
                      Load
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {config.name}
                        {config.is_default && <StarFilled style={{ color: '#faad14' }} />}
                      </div>
                    }
                    description={`Created: ${new Date(config.created_at).toLocaleDateString()}`}
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card title="Current Score Preview" style={{ marginTop: 16 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Example student with multiple needs:
            </Text>
            <div>
              <div style={{ marginBottom: 8 }}>
                <Tag color="blue">Pupil Premium: +{weightings.pupil_premium}</Tag>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Tag color="orange">SEN (2 types): +{weightings.sen_needs_multiplier * 2}</Tag>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Tag color="green">EAL: +{weightings.eal}</Tag>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Tag color="red">Low Reading: +{weightings.reading_score}</Tag>
              </div>
              <div style={{ marginBottom: 16 }}>
                <Tag color="purple">Medical Info: +{weightings.medical_info}</Tag>
              </div>
              <Text strong>
                Total Score: {
                  weightings.pupil_premium + 
                  (weightings.sen_needs_multiplier * 2) + 
                  weightings.eal + 
                  weightings.reading_score + 
                  weightings.medical_info
                }
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title="Save Weighting Configuration"
        open={saveModalVisible}
        onOk={handleSave}
        onCancel={() => setSaveModalVisible(false)}
        confirmLoading={loading}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text>Configuration Name:</Text>
            <Input
              value={newConfigName}
              onChange={(e) => setNewConfigName(e.target.value)}
              placeholder="Enter configuration name"
              style={{ marginTop: 8 }}
            />
          </div>
          <div>
            <Button
              type={makeDefault ? "primary" : "default"}
              icon={makeDefault ? <StarFilled /> : <StarOutlined />}
              onClick={() => setMakeDefault(!makeDefault)}
            >
              {makeDefault ? "Set as Default" : "Make Default"}
            </Button>
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default WeightingPage;