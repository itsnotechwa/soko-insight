import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin, Empty } from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  RiseOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { SalesSummary, TopProduct, SalesByChannel } from '../types';
import RecommendationsWidget from '../components/dashboard/RecommendationsWidget';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const { Title, Text } = Typography;

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];

function Dashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [salesByChannel, setSalesByChannel] = useState<SalesByChannel[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get date range (last 30 days)
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const [summaryRes, topProductsRes, channelRes] = await Promise.all([
        api.get(`/sales/summary?startDate=${startDate}&endDate=${endDate}`),
        api.get(`/sales/top-products?limit=5&startDate=${startDate}&endDate=${endDate}`),
        api.get(`/sales/by-channel?startDate=${startDate}&endDate=${endDate}`),
      ]);

      setSummary(summaryRes.data.data);
      setTopProducts(topProductsRes.data.data || []);
      setSalesByChannel(channelRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          {getGreeting()}, {user?.businessName}! 👋
        </Title>
        <Text type="secondary">
          Here's what's happening with your business today
        </Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card revenue">
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Total Revenue</span>}
              value={summary?.totalRevenue || 0}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: 'white', fontSize: 24 }}
            />
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
              Last 30 days
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card orders">
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Total Orders</span>}
              value={summary?.totalOrders || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: 'white', fontSize: 24 }}
            />
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
              Last 30 days
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card products">
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Items Sold</span>}
              value={summary?.totalQuantity || 0}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: 'white', fontSize: 24 }}
            />
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
              Last 30 days
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Total Profit</span>}
              value={summary?.totalProfit || 0}
              prefix={<RiseOutlined />}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: 'white', fontSize: 24 }}
            />
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
              Last 30 days
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]}>
        {/* Top Products */}
        <Col xs={24} lg={12}>
          <Card title="Top Products by Revenue" className="dashboard-card">
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis
                    type="category"
                    dataKey="productName"
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#1890ff" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No sales data yet" />
            )}
          </Card>
        </Col>

        {/* Sales by Channel */}
        <Col xs={24} lg={12}>
          <Card title="Sales by Channel" className="dashboard-card">
            {salesByChannel.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={salesByChannel}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ channelName, percent }) =>
                      `${channelName} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="revenue"
                    nameKey="channelName"
                  >
                    {salesByChannel.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No channel data yet" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Recommendations Widget */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={24}>
          <RecommendationsWidget />
        </Col>
      </Row>

      {/* Quick Actions for new users */}
      {(!summary || summary.totalOrders === 0) && (
        <Card style={{ marginTop: 24, textAlign: 'center' }}>
          <Title level={4}>Get Started</Title>
          <Text type="secondary">
            Start by adding your products and recording your first sale!
          </Text>
          <div style={{ marginTop: 16 }}>
            <a href="/products" style={{ marginRight: 16 }}>
              Add Products →
            </a>
            <a href="/sales">Record Sale →</a>
          </div>
        </Card>
      )}
    </div>
  );
}

export default Dashboard;

