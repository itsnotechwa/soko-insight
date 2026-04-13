import { useState, useEffect } from 'react';
import { Badge, Popover, List, Typography, Button, Empty, Spin } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { Notification } from '../../types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

interface NotificationCenterProps {
  onNotificationClick?: (notification: Notification) => void;
}

function NotificationCenter({ onNotificationClick }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications?limit=10&isRead=false');
      if (response.data.success) {
        setNotifications(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      if (response.data.success) {
        setUnreadCount(response.data.data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const getNotificationIcon = (type: string) => {
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

  const content = (
    <div style={{ width: 320, maxHeight: 400, overflowY: 'auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: '1px solid #f0f0f0',
        marginBottom: 8
      }}>
        <Text strong>Notifications</Text>
        {notifications.length > 0 && (
          <Button 
            type="link" 
            size="small" 
            icon={<CheckOutlined />}
            onClick={markAllAsRead}
          >
            Mark all read
          </Button>
        )}
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin />
        </div>
      ) : notifications.length === 0 ? (
        <Empty 
          description="No new notifications" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: 20 }}
        />
      ) : (
        <List
          dataSource={notifications}
          renderItem={(notification) => (
            <List.Item
              style={{
                cursor: 'pointer',
                backgroundColor: notification.isRead ? 'transparent' : '#f0f7ff',
                padding: '12px',
                borderLeft: notification.isRead ? 'none' : '3px solid #1890ff',
              }}
              onClick={() => handleNotificationClick(notification)}
            >
              <List.Item.Meta
                avatar={<span style={{ fontSize: 20 }}>{getNotificationIcon(notification.type)}</span>}
                title={
                  <div>
                    <Text strong={!notification.isRead}>{notification.title}</Text>
                    <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                      {dayjs(notification.createdAt).fromNow()}
                    </Text>
                  </div>
                }
                description={
                  <Text 
                    type="secondary" 
                    style={{ 
                      fontSize: 12,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {notification.message}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      )}
      
      {notifications.length > 0 && (
        <div style={{ textAlign: 'center', padding: '8px 0', borderTop: '1px solid #f0f0f0' }}>
          <Button type="link" size="small" onClick={() => {
            setVisible(false);
            window.location.href = '/notifications';
          }}>
            View all notifications
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      title={null}
      trigger="click"
      placement="bottomRight"
      visible={visible}
      onVisibleChange={(v) => {
        setVisible(v);
        if (v) {
          fetchNotifications();
        }
      }}
    >
      <Badge count={unreadCount} size="small">
        <BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
      </Badge>
    </Popover>
  );
}

export default NotificationCenter;

