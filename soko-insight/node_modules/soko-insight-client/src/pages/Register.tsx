import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, Alert, Select, Divider } from 'antd';
import { MailOutlined, LockOutlined, ShopOutlined, PhoneOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;
const { Option } = Select;

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  businessName: string;
  phone?: string;
  sellerType: 'small_trader' | 'ecommerce' | 'wholesaler';
}

function Register() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [form] = Form.useForm();

  const handleSubmit = async (values: RegisterForm) => {
    try {
      await register({
        email: values.email,
        password: values.password,
        businessName: values.businessName,
        phone: values.phone,
        sellerType: values.sellerType,
      });
      navigate('/dashboard');
    } catch {
      // Error is handled by the store
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <Title level={2} style={{ color: '#1890ff', margin: 0 }}>
            SokoInsight
          </Title>
          <Text type="secondary">Create your account</Text>
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
            name="businessName"
            label="Business Name"
            rules={[
              { required: true, message: 'Please enter your business name' },
              { min: 2, message: 'Business name must be at least 2 characters' },
            ]}
          >
            <Input
              prefix={<ShopOutlined />}
              placeholder="Your business name"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
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
            name="phone"
            label="Phone Number (Optional)"
            rules={[
              {
                pattern: /^(\+254|0)[17]\d{8}$/,
                message: 'Please enter a valid Kenyan phone number',
              },
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="+254 or 07..."
            />
          </Form.Item>

          <Form.Item
            name="sellerType"
            label="Seller Type"
            rules={[{ required: true, message: 'Please select your seller type' }]}
          >
            <Select placeholder="Select your seller type">
              <Option value="small_trader">
                <div>
                  <Text strong>Small Trader</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Individual traders, small shops, market vendors
                  </Text>
                </div>
              </Option>
              <Option value="ecommerce">
                <div>
                  <Text strong>E-commerce Seller</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Sellers on Jumia, Kilimall, or other platforms
                  </Text>
                </div>
              </Option>
              <Option value="wholesaler">
                <div>
                  <Text strong>Wholesaler</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Bulk sellers, distributors, large inventory
                  </Text>
                </div>
              </Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please enter your password' },
              { min: 8, message: 'Password must be at least 8 characters' },
              {
                pattern: /\d/,
                message: 'Password must contain at least one number',
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Create a password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm your password"
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
              Create Account
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text type="secondary">Already have an account?</Text>
        </Divider>

        <Link to="/login">
          <Button block size="large" style={{ height: 48 }}>
            Sign In
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default Register;

