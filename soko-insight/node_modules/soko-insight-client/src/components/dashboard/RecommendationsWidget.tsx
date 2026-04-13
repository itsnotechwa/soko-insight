import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, List, Typography, Button, Alert, Empty, Spin, Tag } from 'antd';
import { BulbOutlined, RightOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { Recommendation } from '../../types';

const { Title, Text } = Typography;

function RecommendationsWidget() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/recommendations');
      if (response.data.success) {
        setRecommendations(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    try {
      setLoading(true);
      const response = await api.post('/recommendations/generate');
      if (response.data.success) {
        setRecommendations(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Failed to generate recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      default:
        return 'blue';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return '🔴';
      case 'warning':
        return '🟡';
      case 'success':
        return '🟢';
      default:
        return '🔵';
    }
  };

  if (loading && recommendations.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin />
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            <BulbOutlined style={{ marginRight: 8 }} />
            Recommendations
          </span>
          <Button size="small" onClick={generateRecommendations} loading={loading}>
            Refresh
          </Button>
        </div>
      }
    >
      {recommendations.length === 0 ? (
        <Empty
          description="No recommendations available"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={generateRecommendations}>
            Generate Recommendations
          </Button>
        </Empty>
      ) : (
        <List
          dataSource={recommendations.slice(0, 5)}
          renderItem={(rec) => (
            <List.Item
              style={{
                padding: '12px 0',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <List.Item.Meta
                avatar={<span style={{ fontSize: 24 }}>{getTypeIcon(rec.type)}</span>}
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text strong>{rec.title}</Text>
                    <Tag color={getPriorityColor(rec.priority)}>{rec.priority}</Tag>
                  </div>
                }
                description={
                  <div>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {rec.message}
                    </Text>
                    {rec.actionUrl && (
                      <div style={{ marginTop: 8 }}>
                        <Button
                          type="link"
                          size="small"
                          icon={<RightOutlined />}
                          onClick={() => {
                            navigate(rec.actionUrl!);
                          }}
                        >
                          {rec.actionText || 'View Details'}
                        </Button>
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
      
      {recommendations.length > 5 && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button type="link" onClick={() => navigate('/analytics')}>
            View All Recommendations
          </Button>
        </div>
      )}
    </Card>
  );
}

export default RecommendationsWidget;






