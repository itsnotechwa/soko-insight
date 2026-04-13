// User types
export interface User {
  id: string;
  email: string;
  businessName: string;
  phone: string | null;
  sellerType: 'small_trader' | 'ecommerce' | 'wholesaler';
  subscriptionTier: 'trial' | 'starter' | 'growth' | 'pro';
  languagePreference: 'en' | 'sw';
  emailNotifications: boolean;
  smsNotifications: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Product types
export interface Product {
  id: string;
  userId: string;
  categoryId: string | null;
  name: string;
  sku: string | null;
  description: string | null;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  reorderLevel: number;
  unit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  sku?: string;
  description?: string;
  categoryId?: string;
  costPrice?: number;
  sellingPrice: number;
  currentStock?: number;
  reorderLevel?: number;
  unit?: string;
}

// Sales channel types
export interface SalesChannel {
  id: string;
  userId: string;
  channelName: string;
  channelType: 'online' | 'offline' | 'mpesa';
  platform: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalesChannelInput {
  channelName: string;
  channelType: 'online' | 'offline' | 'mpesa';
  platform?: string;
  description?: string;
}

// Sales data types
export interface SalesData {
  id: string;
  userId: string;
  productId: string | null;
  channelId: string | null;
  saleDate: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  costAmount: number;
  profitAmount: number;
  entryMethod: 'manual' | 'csv' | 'mpesa' | 'api' | 'quick_entry';
  notes: string | null;
  productName?: string;
  channelName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuickEntryInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  saleDate?: string;
  channelId?: string;
  notes?: string;
}

// Analytics types
export interface SalesSummary {
  totalRevenue: number;
  totalProfit: number;
  totalOrders: number;
  totalQuantity: number;
}

export interface DailySales {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  revenue: number;
  quantity: number;
}

export interface SalesByChannel {
  channelId: string;
  channelName: string;
  revenue: number;
  orders: number;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Category type
export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  isSystem: boolean;
}

// Notification type
export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  category: 'stock' | 'sales' | 'trend' | 'competitor' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// Analytics types
export interface AnalyticsOverview {
  summary: SalesSummary;
  trends: {
    revenue: number;
    orders: number;
    profit: number;
  };
  dailySales: DailySales[];
  topProducts: TopProduct[];
  salesByChannel: SalesByChannel[];
  lowStockProducts: Product[];
  period: {
    start: string;
    end: string;
  };
}

export interface TrendData {
  period: string;
  revenue: number;
  profit: number;
  orders: number;
  quantity: number;
}

export interface ProductPerformance {
  topProducts: TopProduct[];
  slowMovers: Array<{
    id: string;
    name: string;
    currentStock: number;
    sellingPrice: number;
    reorderLevel: number;
  }>;
  productTrends: Array<{
    productId: string;
    productName: string;
    date: string;
    quantity: number;
    revenue: number;
  }>;
  period: {
    start: string;
    end: string;
  };
}

export interface ChannelComparison {
  channels: Array<SalesByChannel & {
    percentage: number;
    averageOrderValue: number;
  }>;
  channelTrends: Array<{
    channelId: string;
    channelName: string;
    channelType: string;
    date: string;
    revenue: number;
    orders: number;
    quantity: number;
  }>;
  bestChannel: SalesByChannel | null;
  worstChannel: SalesByChannel | null;
  period: {
    start: string;
    end: string;
  };
}

export interface CategoryPerformance {
  categories: Array<{
    categoryId: string;
    categoryName: string;
    productCount: number;
    totalQuantity: number;
    totalRevenue: number;
    totalProfit: number;
    orderCount: number;
  }>;
  period: {
    start: string;
    end: string;
  };
}

// Recommendation type
export interface Recommendation {
  type: 'info' | 'warning' | 'alert' | 'success';
  category: 'stock' | 'sales' | 'trend' | 'competitor' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  actionText?: string;
}

// Competitor types
export interface Competitor {
  id: string;
  userId: string;
  name: string;
  platform: string | null;
  website: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompetitorPrice {
  id: string;
  productId: string;
  competitorId: string;
  price: number;
  recordedAt: string;
  competitorName?: string;
  platform?: string | null;
}

export interface CreateCompetitorInput {
  name: string;
  platform?: string;
  website?: string;
  notes?: string;
}

export interface PriceComparison {
  yourPrice: number;
  competitors: Array<{
    competitorId: string;
    competitorName: string;
    platform: string | null;
    price: number;
    difference: number;
    differencePercent: number;
  }>;
  averageCompetitorPrice: number;
  minPrice: number;
  maxPrice: number;
  pricePosition: 'lowest' | 'highest' | 'average' | 'middle';
}

// Forecast types
export interface ForecastDataPoint {
  date: string;
  predicted_demand: number;
  confidence: number;
}

export interface Forecast {
  product_id: string;
  product_name?: string;
  forecasts: ForecastDataPoint[];
  model_used: string;
  confidence: number;
  message?: string;
}

export interface InventoryOptimization {
  product_id: string;
  current_stock: number;
  recommended_stock: number;
  order_quantity: number;
  recommendation: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  days_remaining?: number;
  safety_stock?: number;
}

// Trends types
export interface TrendsData {
  keywords: string[];
  data: {
    interest_over_time: Record<string, Record<string, number>>;
    summary: Record<string, {
      average: number;
      max: number;
      min: number;
      latest: number;
      trend: string;
    }>;
    related_queries: Record<string, any>;
    trending_searches: any[];
  };
  timeframe: string;
  geo: string;
}

