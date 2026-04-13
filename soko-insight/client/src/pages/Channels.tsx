import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Card,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tag,
  Popconfirm,
  Typography,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../services/api';
import { SalesChannel, CreateSalesChannelInput } from '../types';

const { Title } = Typography;
const { Option } = Select;

function Channels() {
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingChannel, setEditingChannel] = useState<SalesChannel | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const response = await api.get('/channels?includeInactive=true');
      setChannels(response.data.data || []);
    } catch (error) {
      message.error('Failed to fetch channels');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: CreateSalesChannelInput) => {
    try {
      if (editingChannel) {
        await api.put(`/channels/${editingChannel.id}`, values);
        message.success('Channel updated successfully');
      } else {
        await api.post('/channels', values);
        message.success('Channel created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingChannel(null);
      fetchChannels();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/channels/${id}`);
      message.success('Channel deleted successfully');
      fetchChannels();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Delete failed');
    }
  };

  const openEditModal = (channel: SalesChannel) => {
    setEditingChannel(channel);
    form.setFieldsValue({
      channelName: channel.channelName,
      channelType: channel.channelType,
      platform: channel.platform,
      description: channel.description,
    });
    setModalVisible(true);
  };

  const getChannelTypeColor = (type: string) => {
    switch (type) {
      case 'online':
        return 'blue';
      case 'offline':
        return 'green';
      case 'mpesa':
        return 'orange';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Channel Name',
      dataIndex: 'channelName',
      key: 'channelName',
      render: (name: string, record: SalesChannel) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name}</div>
          {record.platform && (
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
              Platform: {record.platform}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'channelType',
      key: 'channelType',
      render: (type: string) => (
        <Tag color={getChannelTypeColor(type)}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => desc || '-',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: SalesChannel) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          />
          <Popconfirm
            title="Delete this channel?"
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
          Sales Channels
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingChannel(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          Add Channel
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={channels}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingChannel ? 'Edit Channel' : 'Add Channel'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingChannel(null);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="channelName"
            label="Channel Name"
            rules={[{ required: true, message: 'Please enter channel name' }]}
          >
            <Input placeholder="e.g., My Shop, Jumia Store" />
          </Form.Item>

          <Form.Item
            name="channelType"
            label="Channel Type"
            rules={[{ required: true, message: 'Please select channel type' }]}
          >
            <Select placeholder="Select type">
              <Option value="online">
                <div>
                  <strong>Online</strong>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                    E-commerce platforms (Jumia, Kilimall, etc.)
                  </div>
                </div>
              </Option>
              <Option value="offline">
                <div>
                  <strong>Offline</strong>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                    Physical store, market, or direct sales
                  </div>
                </div>
              </Option>
              <Option value="mpesa">
                <div>
                  <strong>M-Pesa</strong>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                    M-Pesa Till or Paybill
                  </div>
                </div>
              </Option>
            </Select>
          </Form.Item>

          <Form.Item name="platform" label="Platform (Optional)">
            <Input placeholder="e.g., jumia, kilimall, shop, market" />
          </Form.Item>

          <Form.Item name="description" label="Description (Optional)">
            <Input.TextArea rows={3} placeholder="Brief description of this channel" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingChannel ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Channels;

