import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Card,
  Space,
  Modal,
  Form,
  InputNumber,
  Select,
  DatePicker,
  message,
  Typography,
  Row,
  Col,
  Statistic,
  Input,
} from 'antd';
import { PlusOutlined, DollarOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';
import { SalesData, Product, SalesChannel, SalesSummary } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

function Sales() {
  const [sales, setSales] = useState<SalesData[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [form] = Form.useForm();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchSales();
    fetchSummary();
  }, [pagination.current, dateRange]);

  const fetchInitialData = async () => {
    try {
      const [productsRes, channelsRes] = await Promise.all([
        api.get('/products?limit=100'),
        api.get('/channels'),
      ]);
      setProducts(productsRes.data.data || []);
      setChannels(channelsRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.current,
        limit: pagination.pageSize,
      };

      if (dateRange) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      const response = await api.get('/sales', { params });
      setSales(response.data.data || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.meta?.total || 0,
      }));
    } catch (error) {
      message.error('Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const params: any = {};
      if (dateRange) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      const response = await api.get('/sales/summary', { params });
      setSummary(response.data.data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const handleQuickEntry = async (values: any) => {
    try {
      await api.post('/sales/quick-entry', {
        productId: values.productId,
        quantity: values.quantity,
        unitPrice: values.unitPrice,
        saleDate: values.saleDate?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
        channelId: values.channelId,
        notes: values.notes,
      });
      message.success('Sale recorded successfully');
      setModalVisible(false);
      form.resetFields();
      fetchSales();
      fetchSummary();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to record sale');
    }
  };

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      form.setFieldsValue({ unitPrice: product.sellingPrice });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'saleDate',
      key: 'saleDate',
      render: (date: string) => dayjs(date).format('MMM D, YYYY'),
    },
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      render: (name: string) => name || '-',
    },
    {
      title: 'Channel',
      dataIndex: 'channelName',
      key: 'channelName',
      render: (name: string) => name || '-',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (price: number) => formatCurrency(price),
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: 'Entry Method',
      dataIndex: 'entryMethod',
      key: 'entryMethod',
      render: (method: string) => method.replace('_', ' '),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Sales
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            form.setFieldsValue({ saleDate: dayjs() });
            setModalVisible(true);
          }}
        >
          Quick Entry
        </Button>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={summary?.totalRevenue || 0}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Orders"
              value={summary?.totalOrders || 0}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Profit"
              value={summary?.totalProfit || 0}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              allowClear
            />
            <Button onClick={() => setDateRange(null)}>Clear Filter</Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={sales}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} sales`,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({ ...prev, current: page, pageSize }));
            },
          }}
        />
      </Card>

      {/* Quick Entry Modal */}
      <Modal
        title="Quick Sale Entry"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleQuickEntry}>
          <Form.Item
            name="productId"
            label="Product"
            rules={[{ required: true, message: 'Please select a product' }]}
          >
            <Select
              placeholder="Select product"
              showSearch
              optionFilterProp="children"
              onChange={handleProductChange}
            >
              {products.map((product) => (
                <Option key={product.id} value={product.id}>
                  {product.name} ({formatCurrency(product.sellingPrice)})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label="Quantity"
                rules={[{ required: true, message: 'Please enter quantity' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="1" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unitPrice"
                label="Unit Price (KES)"
                rules={[{ required: true, message: 'Please enter price' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="saleDate" label="Sale Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="channelId" label="Channel">
                <Select placeholder="Select channel" allowClear>
                  {channels.map((channel) => (
                    <Option key={channel.id} value={channel.id}>
                      {channel.channelName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notes (Optional)">
            <Input.TextArea rows={2} placeholder="Any notes about this sale" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Record Sale
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Sales;

