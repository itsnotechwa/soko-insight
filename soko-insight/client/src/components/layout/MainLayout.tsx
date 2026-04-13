import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Button, Typography, Space } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  LineChartOutlined,
  ShopOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UploadOutlined,
  BarChartOutlined,
  CrownOutlined,
  StockOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import NotificationCenter from '../common/NotificationCenter';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
    },
    {
      key: '/products',
      icon: <ShoppingOutlined />,
      label: 'Products',
    },
    {
      key: '/sales',
      icon: <LineChartOutlined />,
      label: 'Sales',
    },
    {
      key: '/upload',
      icon: <UploadOutlined />,
      label: 'Upload Data',
    },
    {
      key: '/channels',
      icon: <ShopOutlined />,
      label: 'Channels',
    },
    {
      key: '/competitors',
      icon: <CrownOutlined />,
      label: 'Competitors',
    },
    {
      key: '/forecasting',
      icon: <StockOutlined />,
      label: 'Forecasting',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Text
            strong
            style={{
              color: 'white',
              fontSize: collapsed ? 16 : 20,
              transition: 'all 0.3s',
            }}
          >
            {collapsed ? 'SI' : 'SokoInsight'}
          </Text>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16 }}
          />

          <Space size="middle">
            <NotificationCenter />

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  style={{ backgroundColor: '#1890ff' }}
                  icon={<UserOutlined />}
                />
                <div style={{ lineHeight: 1.2 }}>
                  <Text strong style={{ display: 'block' }}>
                    {user?.businessName || 'User'}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {user ? getSellerTypeLabel(user.sellerType) : ''}
                  </Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: 24,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;

