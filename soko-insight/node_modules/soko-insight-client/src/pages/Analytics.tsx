import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  DatePicker,
  Select,
  Typography,
  Spin,
  Empty,
  Statistic,
  Alert,
} from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import {
  AnalyticsOverview,
  TrendData,
  ProductPerformance,
  ChannelComparison,
  CategoryPerformance,
} from '../types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];

function Analytics() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [productPerformance, setProductPerformance] = useState<ProductPerformance | null>(null);
  const [channelComparison, setChannelComparison] = useState<ChannelComparison | null>(null);
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformance | null>(null);
  
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'channels' | 'categories'>('overview');

  useEffect(() => {
    fetchData();
  }, [dateRange, granularity, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      if (activeTab === 'overview') {
        const [overviewRes, trendsRes] = await Promise.all([
          api.get(`/analytics/overview?startDate=${startDate}&endDate=${endDate}`),
          api.get(`/analytics/trends?startDate=${startDate}&endDate=${endDate}&granularity=${granularity}`),
        ]);
        setOverview(overviewRes.data.data);
        setTrends(trendsRes.data.data.trends || []);
      } else if (activeTab === 'products') {
        const res = await api.get(`/analytics/products?startDate=${startDate}&endDate=${endDate}`);
        setProductPerformance(res.data.data);
      } else if (activeTab === 'channels') {
        const res = await api.get(`/analytics/channels?startDate=${startDate}&endDate=${endDate}`);
        setChannelComparison(res.data.data);
      } else if (activeTab === 'categories') {
        const res = await api.get(`/analytics/categories?startDate=${startDate}&endDate=${endDate}`);
        setCategoryPerformance(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
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

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  if (loading && !overview) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Analytics</Title>
        <Text type="secondary">Detailed insights into your business performance</Text>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Text strong>Date Range:</Text>
          </Col>
          <Col>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                if (dates) {
                  setDateRange([dates[0]!, dates[1]!]);
                }
              }}
            />
          </Col>
          <Col>
            <Text strong>Granularity:</Text>
          </Col>
          <Col>
            <Select
              value={granularity}
              onChange={setGranularity}
              style={{ width: 120 }}
            >
              <Option value="day">Daily</Option>
              <Option value="week">Weekly</Option>
              <Option value="month">Monthly</Option>
            </Select>
          </Col>
          <Col>
            <Select
              value={activeTab}
              onChange={setActiveTab}
              style={{ width: 150 }}
            >
              <Option value="overview">Overview</Option>
              <Option value="products">Products</Option>
              <Option value="channels">Channels</Option>
              <Option value="categories">Categories</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Overview Tab */}
      {activeTab === 'overview' && overview && (
        <>
          {/* Summary Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Revenue"
                  value={overview.summary.totalRevenue}
                  prefix={<DollarOutlined />}
                  formatter={(value) => formatCurrency(Number(value))}
                  valueStyle={{ color: '#1890ff' }}
                />
                {overview.trends.revenue !== 0 && (
                  <div style={{ marginTop: 8 }}>
                    {overview.trends.revenue > 0 ? (
                      <RiseOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <FallOutlined style={{ color: '#f5222d' }} />
                    )}
                    <Text
                      style={{
                        marginLeft: 4,
                        color: overview.trends.revenue > 0 ? '#52c41a' : '#f5222d',
                      }}
                    >
                      {formatPercent(overview.trends.revenue)}
                    </Text>
                  </div>
                )}
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Orders"
                  value={overview.summary.totalOrders}
                  prefix={<ShoppingCartOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
                {overview.trends.orders !== 0 && (
                  <div style={{ marginTop: 8 }}>
                    {overview.trends.orders > 0 ? (
                      <RiseOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <FallOutlined style={{ color: '#f5222d' }} />
                    )}
                    <Text
                      style={{
                        marginLeft: 4,
                        color: overview.trends.orders > 0 ? '#52c41a' : '#f5222d',
                      }}
                    >
                      {formatPercent(overview.trends.orders)}
                    </Text>
                  </div>
                )}
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Profit"
                  value={overview.summary.totalProfit}
                  prefix={<RiseOutlined />}
                  formatter={(value) => formatCurrency(Number(value))}
                  valueStyle={{ color: '#722ed1' }}
                />
                {overview.trends.profit !== 0 && (
                  <div style={{ marginTop: 8 }}>
                    {overview.trends.profit > 0 ? (
                      <RiseOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <FallOutlined style={{ color: '#f5222d' }} />
                    )}
                    <Text
                      style={{
                        marginLeft: 4,
                        color: overview.trends.profit > 0 ? '#52c41a' : '#f5222d',
                      }}
                    >
                      {formatPercent(overview.trends.profit)}
                    </Text>
                  </div>
                )}
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Items Sold"
                  value={overview.summary.totalQuantity}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Charts */}
          <Row gutter={[16, 16]}>
            {/* Sales Trends */}
            <Col xs={24} lg={16}>
              <Card title="Sales Trends">
                {trends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis yAxisId="left" tickFormatter={formatCurrency} />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          if (name === 'revenue' || name === 'profit') {
                            return [formatCurrency(value), name];
                          }
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        stroke="#1890ff"
                        name="Revenue"
                        strokeWidth={2}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="profit"
                        stroke="#52c41a"
                        name="Profit"
                        strokeWidth={2}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="orders"
                        stroke="#faad14"
                        name="Orders"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="No trend data available" />
                )}
              </Card>
            </Col>

            {/* Sales by Channel */}
            <Col xs={24} lg={8}>
              <Card title="Sales by Channel">
                {overview.salesByChannel.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={overview.salesByChannel}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ channelName, revenue }) => {
                          const total = overview.salesByChannel.reduce(
                            (sum, ch) => sum + ch.revenue,
                            0
                          );
                          const percent = total > 0 ? ((revenue / total) * 100).toFixed(0) : 0;
                          return `${channelName} (${percent}%)`;
                        }}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                        nameKey="channelName"
                      >
                        {overview.salesByChannel.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="No channel data available" />
                )}
              </Card>
            </Col>

            {/* Top Products */}
            <Col xs={24} lg={12}>
              <Card title="Top Products by Revenue">
                {overview.topProducts.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={overview.topProducts} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={formatCurrency} />
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
                  <Empty description="No product data available" />
                )}
              </Card>
            </Col>

            {/* Low Stock Alert */}
            <Col xs={24} lg={12}>
              <Card title="Low Stock Products">
                {overview.lowStockProducts.length > 0 ? (
                  <div>
                    {overview.lowStockProducts.map((product) => (
                      <Alert
                        key={product.id}
                        message={product.name}
                        description={`Only ${product.currentStock} ${product.unit}(s) left. Reorder level: ${product.reorderLevel}`}
                        type="warning"
                        showIcon
                        style={{ marginBottom: 8 }}
                        action={
                          <a href={`/products/${product.id}`}>View</a>
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <Empty description="All products are well stocked" />
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && productPerformance && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Top Products">
              {productPerformance.topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={productPerformance.topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={formatCurrency} />
                    <YAxis
                      type="category"
                      dataKey="productName"
                      width={150}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="#1890ff" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No product data available" />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Slow Movers">
              {productPerformance.slowMovers.length > 0 ? (
                <div>
                  {productPerformance.slowMovers.map((product) => (
                    <Alert
                      key={product.id}
                      message={product.name}
                      description={`No sales in the last 30 days. Stock: ${product.currentStock} units`}
                      type="warning"
                      showIcon
                      style={{ marginBottom: 8 }}
                    />
                  ))}
                </div>
              ) : (
                <Empty description="No slow movers" />
              )}
            </Card>
          </Col>
        </Row>
      )}

      {/* Channels Tab */}
      {activeTab === 'channels' && channelComparison && (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="Channel Performance">
              {channelComparison.channels.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={channelComparison.channels}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channelName" />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#1890ff" name="Revenue" />
                    <Bar dataKey="orders" fill="#52c41a" name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No channel data available" />
              )}
            </Card>
          </Col>
          {channelComparison.bestChannel && (
            <Col xs={24} sm={12}>
              <Card title="Best Performing Channel">
                <Statistic
                  title={channelComparison.bestChannel.channelName}
                  value={channelComparison.bestChannel.revenue}
                  prefix={<DollarOutlined />}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Text type="secondary">
                  {channelComparison.bestChannel.orders} orders
                </Text>
              </Card>
            </Col>
          )}
          {channelComparison.worstChannel && (
            <Col xs={24} sm={12}>
              <Card title="Underperforming Channel">
                <Statistic
                  title={channelComparison.worstChannel.channelName}
                  value={channelComparison.worstChannel.revenue}
                  prefix={<DollarOutlined />}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Text type="secondary">
                  {channelComparison.worstChannel.orders} orders
                </Text>
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && categoryPerformance && (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="Category Performance">
              {categoryPerformance.categories.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={categoryPerformance.categories} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={formatCurrency} />
                    <YAxis
                      type="category"
                      dataKey="categoryName"
                      width={150}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    />
                    <Bar dataKey="totalRevenue" fill="#1890ff" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No category data available" />
              )}
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}

export default Analytics;






