import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, Alert, Divider } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;

interface LoginForm {
  email: string;
  password: string;
}

function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [form] = Form.useForm();

  const handleSubmit = async (values: LoginForm) => {
    try {
      await login(values);
      navigate('/dashboard');
    } catch {
      // Error is handled by the store
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <Title level={2} style={{ color: '#1890ff', margin: 0 }}>
            SokoInsight
          </Title>
          <Text type="secondary">Market Analytics for Kenyan Sellers</Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={clearError}
            style={{ marginBottom: 24 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Email address"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              block
              style={{ height: 48 }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text type="secondary">New to SokoInsight?</Text>
        </Divider>

        <Link to="/register">
          <Button block size="large" style={{ height: 48 }}>
            Create an Account
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default Login;

