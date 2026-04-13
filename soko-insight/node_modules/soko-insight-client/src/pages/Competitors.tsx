import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Card,
  Input,
  Space,
  Modal,
  Form,
  message,
  Tag,
  Popconfirm,
  Typography,
  Select,
  Tabs,
  Descriptions,
  Tooltip,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  LineChartOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { competitorService } from '../services/competitorService';
import { Competitor, PriceComparison, Product } from '../types';
import api from '../services/api';

const { Title } = Typography;
const { TabPane } = Tabs;

function Competitors() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [comparisonModalVisible, setComparisonModalVisible] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [priceComparison, setPriceComparison] = useState<PriceComparison | null>(null);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [form] = Form.useForm();
  const [priceForm] = Form.useForm();

  useEffect(() => {
    fetchCompetitors();
    fetchProducts();
  }, [pagination.current, searchText]);

  const fetchCompetitors = async () => {
    try {
      setLoading(true);
      const response = await competitorService.getCompetitors({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText || undefined,
      });
      if (response.success && response.data) {
        setCompetitors(response.data.competitors);
        setPagination((prev) => ({
          ...prev,
          total: response.data!.total,
        }));
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to fetch competitors');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products', { params: { limit: 100 } });
      if (response.data.success && response.data.data) {
        setProducts(response.data.data.products || response.data.data);
      }
    } catch (error) {
      // Silently fail
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingCompetitor) {
        await competitorService.updateCompetitor(editingCompetitor.id, values);
        message.success('Competitor updated successfully');
      } else {
        await competitorService.createCompetitor(values);
        message.success('Competitor created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingCompetitor(null);
      fetchCompetitors();
    } catch (error: any) {
      message.error(error.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await competitorService.deleteCompetitor(id);
      message.success('Competitor deleted successfully');
      fetchCompetitors();
    } catch (error: any) {
      message.error(error.message || 'Delete failed');
    }
  };

  const handleAddPrice = async (values: any) => {
    try {
      await competitorService.addPrice({
        productId: values.productId,
        competitorId: values.competitorId,
        price: values.price,
      });
      message.success('Price recorded successfully');
      setPriceModalVisible(false);
      priceForm.resetFields();
    } catch (error: any) {
      message.error(error.message || 'Failed to record price');
    }
  };

  const handleViewComparison = async (product: Product) => {
    try {
      setSelectedProduct(product);
      const response = await competitorService.getPriceComparison(product.id);
      if (response.success && response.data) {
        setPriceComparison(response.data);
        setComparisonModalVisible(true);
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to fetch price comparison');
    }
  };

  const openEditModal = (competitor: Competitor) => {
    setEditingCompetitor(competitor);
    form.setFieldsValue({
      name: competitor.name,
      platform: competitor.platform,
      website: competitor.website,
      notes: competitor.notes,
    });
    setModalVisible(true);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Platform',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string | null) => platform ? <Tag>{platform}</Tag> : '-',
    },
    {
      title: 'Website',
      dataIndex: 'website',
      key: 'website',
      render: (website: string | null) => website ? (
        <a href={website} target="_blank" rel="noopener noreferrer">{website}</a>
      ) : '-',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Competitor) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEditModal(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this competitor?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Title level={2} style={{ margin: 0 }}>
            <ShopOutlined /> Competitor Tracking
          </Title>
          <Space>
            <Input
              placeholder="Search competitors..."
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPagination({ ...pagination, current: 1 });
              }}
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingCompetitor(null);
                form.resetFields();
                setModalVisible(true);
              }}
            >
              Add Competitor
            </Button>
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={competitors}
          loading={loading}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page) => setPagination({ ...pagination, current: page }),
          }}
        />
      </Card>

      <Card style={{ marginTop: 24 }}>
        <Title level={3}><DollarOutlined /> Price Comparison</Title>
        <Table
          dataSource={products.filter(p => p.isActive)}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: 'Product',
              dataIndex: 'name',
              key: 'name',
            },
            {
              title: 'Your Price',
              dataIndex: 'sellingPrice',
              key: 'sellingPrice',
              render: (price: number) => `KES ${price.toLocaleString()}`,
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_: any, product: Product) => (
                <Button
                  icon={<LineChartOutlined />}
                  onClick={() => handleViewComparison(product)}
                >
                  View Comparison
                </Button>
              ),
            },
          ]}
        />
      </Card>

      {/* Add/Edit Competitor Modal */}
      <Modal
        title={editingCompetitor ? 'Edit Competitor' : 'Add Competitor'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingCompetitor(null);
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="Competitor Name"
            rules={[{ required: true, message: 'Please enter competitor name' }]}
          >
            <Input placeholder="e.g., Jumia, Kilimall, etc." />
          </Form.Item>
          <Form.Item name="platform" label="Platform">
            <Input placeholder="e.g., Jumia, Kilimall, Amazon, etc." />
          </Form.Item>
          <Form.Item name="website" label="Website">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Additional notes..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Price Modal */}
      <Modal
        title="Record Competitor Price"
        open={priceModalVisible}
        onCancel={() => {
          setPriceModalVisible(false);
          priceForm.resetFields();
        }}
        onOk={() => priceForm.submit()}
      >
        <Form form={priceForm} onFinish={handleAddPrice} layout="vertical">
          <Form.Item
            name="productId"
            label="Product"
            rules={[{ required: true, message: 'Please select a product' }]}
          >
            <Select placeholder="Select product">
              {products.filter(p => p.isActive).map(product => (
                <Select.Option key={product.id} value={product.id}>
                  {product.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="competitorId"
            label="Competitor"
            rules={[{ required: true, message: 'Please select a competitor' }]}
          >
            <Select placeholder="Select competitor">
              {competitors.filter(c => c.isActive).map(competitor => (
                <Select.Option key={competitor.id} value={competitor.id}>
                  {competitor.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="price"
            label="Price (KES)"
            rules={[{ required: true, message: 'Please enter price' }]}
          >
            <Input type="number" step="0.01" placeholder="0.00" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Price Comparison Modal */}
      <Modal
        title={`Price Comparison - ${selectedProduct?.name}`}
        open={comparisonModalVisible}
        onCancel={() => {
          setComparisonModalVisible(false);
          setSelectedProduct(null);
          setPriceComparison(null);
        }}
        footer={[
          <Button key="add-price" type="primary" onClick={() => {
            setComparisonModalVisible(false);
            setPriceModalVisible(true);
          }}>
            Add Price
          </Button>,
          <Button key="close" onClick={() => {
            setComparisonModalVisible(false);
            setSelectedProduct(null);
            setPriceComparison(null);
          }}>
            Close
          </Button>,
        ]}
        width={800}
      >
        {priceComparison && selectedProduct ? (
          <div>
            <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Your Price">
                <strong>KES {priceComparison.yourPrice.toLocaleString()}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Position">
                <Tag color={
                  priceComparison.pricePosition === 'lowest' ? 'green' :
                  priceComparison.pricePosition === 'highest' ? 'red' :
                  'blue'
                }>
                  {priceComparison.pricePosition.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Average Competitor Price">
                KES {priceComparison.averageCompetitorPrice.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Price Range">
                KES {priceComparison.minPrice.toLocaleString()} - KES {priceComparison.maxPrice.toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            {priceComparison.competitors.length > 0 ? (
              <Table
                dataSource={priceComparison.competitors}
                rowKey="competitorId"
                pagination={false}
                columns={[
                  {
                    title: 'Competitor',
                    dataIndex: 'competitorName',
                    key: 'competitorName',
                    render: (name: string, record: any) => (
                      <Space>
                        <span>{name}</span>
                        {record.platform && <Tag>{record.platform}</Tag>}
                      </Space>
                    ),
                  },
                  {
                    title: 'Price',
                    dataIndex: 'price',
                    key: 'price',
                    render: (price: number) => `KES ${price.toLocaleString()}`,
                  },
                  {
                    title: 'Difference',
                    dataIndex: 'difference',
                    key: 'difference',
                    render: (diff: number, record: any) => (
                      <Tag color={diff < 0 ? 'green' : 'red'}>
                        {diff < 0 ? '-' : '+'}KES {Math.abs(diff).toLocaleString()} ({record.differencePercent.toFixed(1)}%)
                      </Tag>
                    ),
                  },
                ]}
              />
            ) : (
              <Empty description="No competitor prices recorded yet">
                <Button type="primary" onClick={() => {
                  setComparisonModalVisible(false);
                  priceForm.setFieldValue('productId', selectedProduct.id);
                  setPriceModalVisible(true);
                }}>
                  Add First Price
                </Button>
              </Empty>
            )}
          </div>
        ) : (
          <Empty />
        )}
      </Modal>
    </div>
  );
}

export default Competitors;

