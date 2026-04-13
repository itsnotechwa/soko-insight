import { useState, useEffect } from 'react';
import {
  Card,
  Upload,
  Button,
  Form,
  Select,
  message,
  Steps,
  Alert,
  Table,
  Typography,
  Space,
  Checkbox,
  Row,
  Col,
  Progress,
  Divider,
  Statistic,
  Tabs,
  InputNumber,
} from 'antd';
import {
  UploadOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MobileOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import api from '../services/api';
import { SalesChannel } from '../types';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Option } = Select;
const { Dragger } = Upload;

interface ColumnMapping {
  productName?: string;
  productSku?: string;
  saleDate?: string;
  quantity?: string;
  unitPrice?: string;
  totalAmount?: string;
  channelName?: string;
  notes?: string;
}

interface InvalidRow {
  row: number;
  errors: string[];
}

interface UploadResult {
  total: number;
  created: number;
  failed: number;
  invalid: number;
  invalidRows: InvalidRow[];
  summary: {
    successRate: string;
  };
}

function UploadPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState<UploadFile | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileType, setFileType] = useState<'csv' | 'xlsx' | null>(null);
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [form] = Form.useForm();
  const [mpesaForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('csv');

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const response = await api.get('/channels');
      setChannels(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setFile(null);
    setHeaders([]);
    setUploadResult(null);
    setCurrentStep(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/sales/upload/detect-headers', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadFile: UploadFile = {
        uid: '-1',
        name: file.name,
        status: 'done',
        originFileObj: file,
      };

      setFile(uploadFile);
      setHeaders(response.data.data.headers);
      setFileType(response.data.data.fileType);
      setCurrentStep(1);

      // Initialize form with auto-detected mappings
      const autoMapping = detectColumnMapping(response.data.data.headers);
      form.setFieldsValue({
        ...autoMapping,
        skipFirstRow: true,
        dateFormat: 'YYYY-MM-DD',
      });

      message.success('File uploaded successfully. Please map the columns.');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to process file');
    } finally {
      setLoading(false);
    }
  };

  const detectColumnMapping = (headers: string[]): Partial<ColumnMapping> => {
    const mapping: Partial<ColumnMapping> = {};
    const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

    // Common column name patterns
    const patterns: Record<keyof ColumnMapping, string[]> = {
      productName: ['product', 'item', 'name', 'product name', 'item name'],
      productSku: ['sku', 'code', 'product code', 'item code'],
      saleDate: ['date', 'sale date', 'transaction date', 'order date'],
      quantity: ['quantity', 'qty', 'amount', 'units'],
      unitPrice: ['price', 'unit price', 'unit_price', 'unitprice'],
      totalAmount: ['total', 'total amount', 'total_amount', 'revenue', 'amount'],
      channelName: ['channel', 'channel name', 'platform', 'source'],
      notes: ['notes', 'note', 'comment', 'description', 'remarks'],
    };

    Object.entries(patterns).forEach(([key, patterns]) => {
      const foundIndex = lowerHeaders.findIndex((h) =>
        patterns.some((p) => h.includes(p))
      );
      if (foundIndex !== -1) {
        mapping[key as keyof ColumnMapping] = headers[foundIndex];
      }
    });

    return mapping;
  };

  const handleMappingSubmit = async (values: any) => {
    if (!file?.originFileObj) {
      message.error('Please upload a file first');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file.originFileObj);
      formData.append('channelId', values.channelId || '');
      formData.append('defaultChannelId', values.defaultChannelId || '');
      formData.append('skipFirstRow', values.skipFirstRow ? 'true' : 'false');
      formData.append('dateFormat', values.dateFormat || 'YYYY-MM-DD');

      const columnMapping: ColumnMapping = {
        productName: values.productName,
        productSku: values.productSku,
        saleDate: values.saleDate,
        quantity: values.quantity,
        unitPrice: values.unitPrice,
        totalAmount: values.totalAmount,
        channelName: values.channelName,
        notes: values.notes,
      };

      formData.append('columnMapping', JSON.stringify(columnMapping));

      const response = await api.post('/sales/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadResult(response.data.data);
      setCurrentStep(2);
      message.success(
        `Successfully imported ${response.data.data.created} sales records`
      );
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const invalidColumns: ColumnsType<InvalidRow> = [
    {
      title: 'Row',
      dataIndex: 'row',
      key: 'row',
      width: 80,
    },
    {
      title: 'Errors',
      dataIndex: 'errors',
      key: 'errors',
      render: (errors: string[]) => (
        <div>
          {errors.map((error, index) => (
            <div key={index} style={{ color: '#ff4d4f' }}>
              • {error}
            </div>
          ))}
        </div>
      ),
    },
  ];

  const resetUpload = () => {
    setFile(null);
    setHeaders([]);
    setUploadResult(null);
    setCurrentStep(0);
    form.resetFields();
    mpesaForm.resetFields();
  };

  const handleMpesaUpload = async (values: any) => {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    
    if (!file) {
      message.error('Please select an M-Pesa CSV file');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (values.channelId) formData.append('channelId', values.channelId);
      if (values.minAmount) formData.append('minAmount', values.minAmount.toString());
      formData.append('excludeWithdrawals', values.excludeWithdrawals ? 'true' : 'false');

      const response = await api.post('/sales/upload/mpesa', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadResult(response.data.data);
      setCurrentStep(2);
      message.success(
        `Successfully imported ${response.data.data.created} sales records from M-Pesa`
      );
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to upload M-Pesa statement');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Upload Sales Data
      </Title>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'csv',
            label: (
              <span>
                <FileExcelOutlined />
                CSV/Excel Upload
              </span>
            ),
            children: (
              <div>

      <Steps
        current={currentStep}
        items={[
          {
            title: 'Upload File',
            description: 'Select CSV or Excel file',
          },
          {
            title: 'Map Columns',
            description: 'Match your columns',
          },
          {
            title: 'Review Results',
            description: 'Import summary',
          },
        ]}
        style={{ marginBottom: 32 }}
      />

      {currentStep === 0 && (
        <Card>
          <Dragger
            accept=".csv,.xlsx,.xls"
            beforeUpload={(file) => {
              handleFileUpload(file);
              return false; // Prevent auto upload
            }}
            showUploadList={false}
            loading={loading}
          >
            <p className="ant-upload-drag-icon">
              {fileType === 'xlsx' ? (
                <FileExcelOutlined style={{ fontSize: 48, color: '#52c41a' }} />
              ) : (
                <FileTextOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              )}
            </p>
            <p className="ant-upload-text">
              Click or drag file to this area to upload
            </p>
            <p className="ant-upload-hint">
              Support for CSV and Excel files (.csv, .xlsx, .xls). Maximum file size: 10MB
            </p>
          </Dragger>

          {file && (
            <Alert
              message={`File selected: ${file.name}`}
              type="success"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </Card>
      )}

      {currentStep === 1 && file && (
        <Card>
          <Form form={form} layout="vertical" onFinish={handleMappingSubmit}>
            <Alert
              message="Map your file columns to our system fields"
              description="Required fields are marked with *. Select the column from your file that matches each field."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="saleDate"
                  label="Sale Date *"
                  rules={[{ required: true, message: 'Please select sale date column' }]}
                >
                  <Select placeholder="Select column">
                    {headers.map((header) => (
                      <Option key={header} value={header}>
                        {header}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="quantity"
                  label="Quantity *"
                  rules={[{ required: true, message: 'Please select quantity column' }]}
                >
                  <Select placeholder="Select column">
                    {headers.map((header) => (
                      <Option key={header} value={header}>
                        {header}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="unitPrice"
                  label="Unit Price"
                  tooltip="If not provided, will calculate from Total Amount / Quantity"
                >
                  <Select placeholder="Select column (optional)" allowClear>
                    {headers.map((header) => (
                      <Option key={header} value={header}>
                        {header}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="totalAmount"
                  label="Total Amount"
                  tooltip="Required if Unit Price is not provided"
                >
                  <Select placeholder="Select column (optional)" allowClear>
                    {headers.map((header) => (
                      <Option key={header} value={header}>
                        {header}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="productName" label="Product Name">
                  <Select placeholder="Select column (optional)" allowClear>
                    {headers.map((header) => (
                      <Option key={header} value={header}>
                        {header}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="productSku" label="Product SKU">
                  <Select placeholder="Select column (optional)" allowClear>
                    {headers.map((header) => (
                      <Option key={header} value={header}>
                        {header}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="channelName" label="Channel Name">
                  <Select placeholder="Select column (optional)" allowClear>
                    {headers.map((header) => (
                      <Option key={header} value={header}>
                        {header}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="notes" label="Notes">
                  <Select placeholder="Select column (optional)" allowClear>
                    {headers.map((header) => (
                      <Option key={header} value={header}>
                        {header}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="defaultChannelId" label="Default Channel">
                  <Select placeholder="Select default channel (optional)" allowClear>
                    {channels.map((channel) => (
                      <Option key={channel.id} value={channel.id}>
                        {channel.channelName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="dateFormat" label="Date Format">
                  <Select defaultValue="YYYY-MM-DD">
                    <Option value="YYYY-MM-DD">YYYY-MM-DD</Option>
                    <Option value="DD/MM/YYYY">DD/MM/YYYY</Option>
                    <Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
                    <Option value="DD-MM-YYYY">DD-MM-YYYY</Option>
                    <Option value="MM-DD-YYYY">MM-DD-YYYY</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="skipFirstRow" valuePropName="checked" initialValue={true}>
              <Checkbox>Skip first row (header row)</Checkbox>
            </Form.Item>

            <Form.Item style={{ marginTop: 24 }}>
              <Space>
                <Button onClick={resetUpload}>Start Over</Button>
                <Button type="primary" htmlType="submit" loading={uploading}>
                  Import Data
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}

      {currentStep === 2 && uploadResult && (
        <Card>
          <Title level={4}>Import Results</Title>

          <Row gutter={16} style={{ marginTop: 24, marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Rows"
                  value={uploadResult.total}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Created"
                  value={uploadResult.created}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Failed"
                  value={uploadResult.failed}
                  prefix={<CloseCircleOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Invalid"
                  value={uploadResult.invalid}
                  prefix={<CloseCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>

          <Progress
            percent={parseFloat(uploadResult.summary.successRate)}
            status={uploadResult.created > 0 ? 'success' : 'exception'}
            format={(percent) => `${percent}% success rate`}
            style={{ marginBottom: 24 }}
          />

          {uploadResult.invalidRows.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <Title level={5}>Invalid Rows (showing first 50)</Title>
              <Table
                columns={invalidColumns}
                dataSource={uploadResult.invalidRows}
                rowKey="row"
                pagination={{ pageSize: 10 }}
                size="small"
              />
            </div>
          )}

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Space>
              <Button onClick={resetUpload}>Upload Another File</Button>
              <Button type="primary" href="/sales">
                View Sales
              </Button>
            </Space>
          </div>
        </Card>
      )}
              </div>
            ),
          },
          {
            key: 'mpesa',
            label: (
              <span>
                <MobileOutlined />
                M-Pesa Statement
              </span>
            ),
            children: (
              <div>
                <Card>
                  <Alert
                    message="Import M-Pesa Statement"
                    description="Upload your M-Pesa statement CSV file exported from the M-Pesa portal. The system will automatically process payments received and create sales records."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                  />

                  <Form form={mpesaForm} layout="vertical" onFinish={handleMpesaUpload}>
                    <Form.Item label="M-Pesa CSV File" required>
                      <Upload
                        accept=".csv"
                        beforeUpload={(file) => {
                          return false;
                        }}
                        maxCount={1}
                      >
                        <Button icon={<UploadOutlined />}>Select M-Pesa CSV File</Button>
                      </Upload>
                      <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 12 }}>
                        Export your M-Pesa statement from the M-Pesa portal as CSV format
                      </div>
                    </Form.Item>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="channelId" label="Sales Channel">
                          <Select placeholder="Select channel (optional)" allowClear>
                            {channels
                              .filter((c) => c.channelType === 'mpesa' || c.channelType === 'offline')
                              .map((channel) => (
                                <Option key={channel.id} value={channel.id}>
                                  {channel.channelName}
                                </Option>
                              ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="minAmount" label="Minimum Amount (KES)">
                          <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            placeholder="Filter transactions above this amount"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item name="excludeWithdrawals" valuePropName="checked" initialValue={true}>
                      <Checkbox>Exclude withdrawals (only process payments received)</Checkbox>
                    </Form.Item>

                    <Form.Item style={{ marginTop: 24 }}>
                      <Button type="primary" htmlType="submit" loading={uploading} icon={<MobileOutlined />}>
                        Import M-Pesa Statement
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

export default UploadPage;

