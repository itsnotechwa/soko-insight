import { useEffect, useState } from 'react';
import {
  Card,
  Select,
  Button,
  Table,
  message,
  Typography,
  Tag,
  Space,
  Modal,
  Descriptions,
  Spin,
  Tabs,
  Empty,
  Alert,
} from 'antd';
import {
  LineChartOutlined,
  StockOutlined,
  RiseOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { forecastService } from '../services/forecastService';
import { Forecast, InventoryOptimization, Product } from '../types';
import api from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const { Title } = Typography;
const { TabPane } = Tabs;

function Forecasting() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [inventoryOptimization, setInventoryOptimization] = useState<InventoryOptimization | null>(null);
  const [loading, setLoading] = useState(false);
  const [forecastDays, setForecastDays] = useState(7);
  const [forecastModel, setForecastModel] = useState<'sarima' | 'sma'>('sarima');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      fetchForecast();
      fetchInventoryOptimization();
    }
  }, [selectedProduct, forecastDays, forecastModel]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products', { params: { limit: 100, isActive: true } });
      if (response.data.success && response.data.data) {
        setProducts(response.data.data.products || response.data.data);
      }
    } catch (error) {
      message.error('Failed to fetch products');
    }
  };

  const fetchForecast = async () => {
    if (!selectedProduct) return;
    
    try {
      setLoading(true);
      const response = await forecastService.getProductForecast(selectedProduct, forecastDays, forecastModel);
      if (response.success && response.data) {
        setForecast(response.data);
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to fetch forecast');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryOptimization = async () => {
    if (!selectedProduct) return;
    
    try {
      const response = await forecastService.getInventoryOptimization(selectedProduct);
      if (response.success && response.data) {
        setInventoryOptimization(response.data);
      }
    } catch (error: any) {
      // Silently fail - not all products may have enough data
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'blue';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  const selectedProductData = products.find(p => p.id === selectedProduct);

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space style={{ marginBottom: 24, width: '100%', justifyContent: 'space-between' }}>
          <Title level={2} style={{ margin: 0 }}>
            <RiseOutlined /> Demand Forecasting & Inventory Optimization
          </Title>
        </Space>

        <Space style={{ marginBottom: 24, width: '100%' }} wrap>
          <Select
            placeholder="Select a product"
            style={{ width: 300 }}
            value={selectedProduct}
            onChange={setSelectedProduct}
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {products.map(product => (
              <Select.Option key={product.id} value={product.id}>
                {product.name}
              </Select.Option>
            ))}
          </Select>

          {selectedProduct && (
            <>
              <Select
                value={forecastDays}
                onChange={setForecastDays}
                style={{ width: 150 }}
              >
                <Select.Option value={7}>7 days</Select.Option>
                <Select.Option value={14}>14 days</Select.Option>
                <Select.Option value={30}>30 days</Select.Option>
              </Select>

              <Select
                value={forecastModel}
                onChange={setForecastModel}
                style={{ width: 150 }}
              >
                <Select.Option value="sarima">SARIMA</Select.Option>
                <Select.Option value="sma">Moving Average</Select.Option>
              </Select>

              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  fetchForecast();
                  fetchInventoryOptimization();
                }}
              >
                Refresh
              </Button>
            </>
          )}
        </Space>

        {!selectedProduct ? (
          <Empty description="Please select a product to view forecasts" />
        ) : (
          <Tabs defaultActiveKey="forecast">
            <TabPane tab={<span><LineChartOutlined /> Demand Forecast</span>} key="forecast">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: 16 }}>Generating forecast...</div>
                </div>
              ) : forecast ? (
                <div>
                  {forecast.message && (
                    <Alert message={forecast.message} type="info" style={{ marginBottom: 16 }} />
                  )}

                  <Card style={{ marginBottom: 24 }}>
                    <Descriptions bordered column={2}>
                      <Descriptions.Item label="Model Used">
                        <Tag color="blue">{forecast.model_used.toUpperCase()}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Confidence">
                        <Tag color={forecast.confidence > 0.7 ? 'green' : forecast.confidence > 0.5 ? 'orange' : 'red'}>
                          {(forecast.confidence * 100).toFixed(1)}%
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Forecast Period">
                        {forecastDays} days
                      </Descriptions.Item>
                      <Descriptions.Item label="Total Predicted Demand">
                        <strong>{forecast.forecasts.reduce((sum, f) => sum + f.predicted_demand, 0)} units</strong>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>

                  <Card title="Forecast Chart">
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={forecast.forecasts}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="predicted_demand"
                          stroke="#1890ff"
                          name="Predicted Demand"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>

                  <Card title="Forecast Details" style={{ marginTop: 24 }}>
                    <Table
                      dataSource={forecast.forecasts}
                      rowKey="date"
                      pagination={false}
                      columns={[
                        {
                          title: 'Date',
                          dataIndex: 'date',
                          key: 'date',
                        },
                        {
                          title: 'Predicted Demand',
                          dataIndex: 'predicted_demand',
                          key: 'predicted_demand',
                          render: (demand: number) => <strong>{demand} units</strong>,
                        },
                        {
                          title: 'Confidence',
                          dataIndex: 'confidence',
                          key: 'confidence',
                          render: (confidence: number) => (
                            <Tag color={confidence > 0.7 ? 'green' : confidence > 0.5 ? 'orange' : 'red'}>
                              {(confidence * 100).toFixed(1)}%
                            </Tag>
                          ),
                        },
                      ]}
                    />
                  </Card>
                </div>
              ) : (
                <Empty description="No forecast data available. Ensure product has at least 7 days of sales history." />
              )}
            </TabPane>

            <TabPane tab={<span><StockOutlined /> Inventory Optimization</span>} key="inventory">
              {inventoryOptimization ? (
                <div>
                  <Card>
                    <Alert
                      message={inventoryOptimization.urgency.toUpperCase()}
                      description={inventoryOptimization.recommendation}
                      type={
                        inventoryOptimization.urgency === 'critical' ? 'error' :
                        inventoryOptimization.urgency === 'high' ? 'warning' :
                        inventoryOptimization.urgency === 'medium' ? 'info' :
                        'success'
                      }
                      style={{ marginBottom: 24 }}
                    />

                    <Descriptions bordered column={2}>
                      <Descriptions.Item label="Current Stock">
                        <strong>{inventoryOptimization.current_stock} units</strong>
                      </Descriptions.Item>
                      <Descriptions.Item label="Recommended Stock">
                        <strong>{inventoryOptimization.recommended_stock} units</strong>
                      </Descriptions.Item>
                      <Descriptions.Item label="Order Quantity">
                        <Tag color={getUrgencyColor(inventoryOptimization.urgency)} style={{ fontSize: '16px', padding: '4px 12px' }}>
                          {inventoryOptimization.order_quantity} units
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Urgency">
                        <Tag color={getUrgencyColor(inventoryOptimization.urgency)}>
                          {inventoryOptimization.urgency.toUpperCase()}
                        </Tag>
                      </Descriptions.Item>
                      {inventoryOptimization.days_remaining && (
                        <Descriptions.Item label="Days Remaining (at current rate)">
                          {inventoryOptimization.days_remaining} days
                        </Descriptions.Item>
                      )}
                      {inventoryOptimization.safety_stock && (
                        <Descriptions.Item label="Safety Stock">
                          {inventoryOptimization.safety_stock} units
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </Card>

                  {selectedProductData && (
                    <Card title="Product Details" style={{ marginTop: 24 }}>
                      <Descriptions bordered column={2}>
                        <Descriptions.Item label="Product Name">
                          {selectedProductData.name}
                        </Descriptions.Item>
                        <Descriptions.Item label="Current Stock">
                          {selectedProductData.currentStock} units
                        </Descriptions.Item>
                        <Descriptions.Item label="Reorder Level">
                          {selectedProductData.reorderLevel} units
                        </Descriptions.Item>
                        <Descriptions.Item label="Selling Price">
                          KES {selectedProductData.sellingPrice.toLocaleString()}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  )}
                </div>
              ) : (
                <Empty description="No inventory optimization data available. Ensure product has sufficient sales history." />
              )}
            </TabPane>
          </Tabs>
        )}
      </Card>
    </div>
  );
}

export default Forecasting;

