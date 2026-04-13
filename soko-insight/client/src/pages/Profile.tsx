import { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Switch,
  message,
  Typography,
  Divider,
  Space,
  Row,
  Col,
  Tag,
} from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, ShopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { PRICING_PLANS } from '../config/pricing';

const { Title, Text } = Typography;
const { Option } = Select;

function Profile() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const handleProfileUpdate = async (values: any) => {
    try {
      setLoading(true);
      await updateProfile(values);
      message.success('Profile updated successfully');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values: any) => {
    try {
      setPasswordLoading(true);
      const result = await authService.changePassword(
        values.currentPassword,
        values.newPassword
      );
      // Update token in store
      localStorage.setItem('token', result.token);
      message.success('Password changed successfully');
      passwordForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Password change failed');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getSellerTypeLabel = (type: string) => {
    switch (type) {
      case 'small_trader':
        return 'Small Trader';
      case 'ecommerce':
        return 'E-commerce Seller';
      case 'wholesaler':
        return 'Wholesaler';
      default:
        return type;
    }
  };

  const getSubscriptionColor = (tier: string) => {
    switch (tier) {
      case 'trial':
        return 'geekblue';
      case 'starter':
        return 'blue';
      case 'growth':
        return 'gold';
      case 'pro':
        return 'purple';
      default:
        return 'default';
    }
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Profile Settings
      </Title>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          {/* Profile Information */}
          <Card title="Profile Information" style={{ marginBottom: 24 }}>
            <Form
              form={profileForm}
              layout="vertical"
              initialValues={{
                businessName: user?.businessName,
                phone: user?.phone,
                languagePreference: user?.languagePreference,
                emailNotifications: user?.emailNotifications,
                smsNotifications: user?.smsNotifications,
              }}
              onFinish={handleProfileUpdate}
            >
              <Form.Item
                name="businessName"
                label="Business Name"
                rules={[
                  { required: true, message: 'Please enter business name' },
                  { min: 2, message: 'Business name must be at least 2 characters' },
                ]}
              >
                <Input prefix={<ShopOutlined />} placeholder="Your business name" />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[
                  {
                    pattern: /^(\+254|0)[17]\d{8}$/,
                    message: 'Please enter a valid Kenyan phone number',
                  },
                ]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="+254 or 07..." />
              </Form.Item>

              <Form.Item name="languagePreference" label="Language">
                <Select>
                  <Option value="en">English</Option>
                  <Option value="sw">Swahili (Kiswahili)</Option>
                </Select>
              </Form.Item>

              <Divider>Notifications</Divider>

              <Form.Item
                name="emailNotifications"
                label="Email Notifications"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="smsNotifications"
                label="SMS Notifications"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Save Changes
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {/* Change Password */}
          <Card title="Change Password">
            <Form form={passwordForm} layout="vertical" onFinish={handlePasswordChange}>
              <Form.Item
                name="currentPassword"
                label="Current Password"
                rules={[{ required: true, message: 'Please enter current password' }]}
              >
                <Input.Password placeholder="Enter current password" />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="New Password"
                rules={[
                  { required: true, message: 'Please enter new password' },
                  { min: 8, message: 'Password must be at least 8 characters' },
                  { pattern: /\d/, message: 'Password must contain at least one number' },
                ]}
              >
                <Input.Password placeholder="Enter new password" />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirm New Password"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Please confirm new password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Confirm new password" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={passwordLoading}>
                  Change Password
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {/* Account Info */}
          <Card title="Account Information">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">Email</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MailOutlined />
                  <Text strong>{user?.email}</Text>
                </div>
              </div>

              <div>
                <Text type="secondary">Seller Type</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserOutlined />
                  <Text strong>{user ? getSellerTypeLabel(user.sellerType) : ''}</Text>
                </div>
              </div>

              <div>
                <Text type="secondary">Subscription</Text>
                <div>
                  <Tag color={user ? getSubscriptionColor(user.subscriptionTier) : 'default'}>
                    {user?.subscriptionTier.toUpperCase()}
                  </Tag>
                </div>
              </div>

              <div>
                <Text type="secondary">Member Since</Text>
                <div>
                  <Text strong>
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-KE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : ''}
                  </Text>
                </div>
              </div>
            </Space>
          </Card>

          {/* Subscription Info */}
          <Card title="Subscription" style={{ marginTop: 24 }}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Tag
                color={user ? getSubscriptionColor(user.subscriptionTier) : 'default'}
                style={{ fontSize: 16, padding: '8px 16px' }}
              >
                {user?.subscriptionTier.toUpperCase()} PLAN
              </Tag>
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">
                  {user?.subscriptionTier === 'trial'
                    ? 'Trial active. Upgrade to keep access after trial ends.'
                    : 'Thank you for your subscription!'}
                </Text>
              </div>
              {user && (
                <div style={{ marginTop: 16 }}>
                  <Text strong>
                    KES {PRICING_PLANS[user.subscriptionTier].monthlyPriceKes.toLocaleString()} / month
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary">
                      {PRICING_PLANS[user.subscriptionTier].annualDiscountPercent > 0
                        ? `${PRICING_PLANS[user.subscriptionTier].annualDiscountPercent}% annual discount available`
                        : PRICING_PLANS[user.subscriptionTier].tagline}
                    </Text>
                  </div>
                </div>
              )}
              {user?.subscriptionTier === 'trial' && (
                <Button type="primary" style={{ marginTop: 16 }} onClick={() => navigate('/plans')}>
                  Upgrade Plan
                </Button>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Profile;

