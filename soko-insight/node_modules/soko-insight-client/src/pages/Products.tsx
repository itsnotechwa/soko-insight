import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Card,
  Input,
  Space,
  Modal,
  Form,
  InputNumber,
  message,
  Tag,
  Popconfirm,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import api from '../services/api';
import { Product, CreateProductInput } from '../types';

const { Title } = Typography;

function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProducts();
  }, [pagination.current, searchText]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products', {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
          search: searchText || undefined,
        },
      });
      setProducts(response.data.data);
      setPagination((prev) => ({
        ...prev,
        total: response.data.meta?.total || 0,
      }));
    } catch (error) {
      message.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: CreateProductInput) => {
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, values);
        message.success('Product updated successfully');
      } else {
        await api.post('/products', values);
        message.success('Product created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingProduct(null);
      fetchProducts();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/products/${id}`);
      message.success('Product deleted successfully');
      fetchProducts();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Delete failed');
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue({
      name: product.name,
      sku: product.sku,
      description: product.description,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      currentStock: product.currentStock,
      reorderLevel: product.reorderLevel,
      unit: product.unit,
    });
    setModalVisible(true);
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
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Product) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name}</div>
          {record.sku && (
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>SKU: {record.sku}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      render: (price: number) => formatCurrency(price),
    },
    {
      title: 'Cost',
      dataIndex: 'costPrice',
      key: 'costPrice',
      render: (cost: number) => formatCurrency(cost),
    },
    {
      title: 'Stock',
      dataIndex: 'currentStock',
      key: 'currentStock',
      render: (stock: number, record: Product) => {
        const isLowStock = stock <= record.reorderLevel;
        return (
          <Space>
            <span>{stock}</span>
            {isLowStock && (
              <Tag color="warning" icon={<WarningOutlined />}>
                Low Stock
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Product) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          />
          <Popconfirm
            title="Delete this product?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
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
          Products
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingProduct(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          Add Product
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search products..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        </div>

        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} products`,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({ ...prev, current: page, pageSize }));
            },
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingProduct(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Product Name"
            rules={[{ required: true, message: 'Please enter product name' }]}
          >
            <Input placeholder="Enter product name" />
          </Form.Item>

          <Form.Item name="sku" label="SKU (Optional)">
            <Input placeholder="Enter SKU" />
          </Form.Item>

          <Form.Item name="description" label="Description (Optional)">
            <Input.TextArea rows={3} placeholder="Enter description" />
          </Form.Item>

          <Space size="large" style={{ width: '100%' }}>
            <Form.Item
              name="sellingPrice"
              label="Selling Price (KES)"
              rules={[{ required: true, message: 'Please enter selling price' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="0"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              />
            </Form.Item>

            <Form.Item name="costPrice" label="Cost Price (KES)" style={{ flex: 1 }}>
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="0"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              />
            </Form.Item>
          </Space>

          <Space size="large" style={{ width: '100%' }}>
            <Form.Item name="currentStock" label="Current Stock" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
            </Form.Item>

            <Form.Item name="reorderLevel" label="Reorder Level" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="10" />
            </Form.Item>

            <Form.Item name="unit" label="Unit" style={{ flex: 1 }}>
              <Input placeholder="piece" />
            </Form.Item>
          </Space>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingProduct ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Products;

