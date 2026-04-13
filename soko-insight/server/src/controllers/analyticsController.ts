import { Request, Response } from 'express';
import { SalesDataModel } from '../models/SalesData';
import { ProductModel } from '../models/Product';
import { SalesChannelModel } from '../models/SalesChannel';
import { sendSuccess, sendError } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { query } from '../config/database';

// Get comprehensive analytics overview
export const getOverview = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  
  const userId = req.user!.id;
  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string) : new Date();
  
  // Get summary
  const summary = await SalesDataModel.getSummary(userId, start, end);
  
  // Get previous period for comparison
  const periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const prevStart = new Date(start.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const prevEnd = start;
  const prevSummary = await SalesDataModel.getSummary(userId, prevStart, prevEnd);
  
  // Calculate trends
  const revenueTrend = prevSummary.totalRevenue > 0
    ? ((summary.totalRevenue - prevSummary.totalRevenue) / prevSummary.totalRevenue) * 100
    : 0;
  const ordersTrend = prevSummary.totalOrders > 0
    ? ((summary.totalOrders - prevSummary.totalOrders) / prevSummary.totalOrders) * 100
    : 0;
  const profitTrend = prevSummary.totalProfit > 0
    ? ((summary.totalProfit - prevSummary.totalProfit) / prevSummary.totalProfit) * 100
    : 0;
  
  // Get daily sales
  const dailySales = await SalesDataModel.getDailySales(userId, start, end);
  
  // Get top products
  const topProducts = await SalesDataModel.getTopProducts(userId, 10, start, end);
  
  // Get sales by channel
  const salesByChannel = await SalesDataModel.getSalesByChannel(userId, start, end);
  
  // Get low stock products
  const lowStockProducts = await ProductModel.getLowStock(userId);
  
  return sendSuccess(res, {
    summary,
    trends: {
      revenue: revenueTrend,
      orders: ordersTrend,
      profit: profitTrend,
    },
    dailySales,
    topProducts,
    salesByChannel,
    lowStockProducts: lowStockProducts.slice(0, 5),
    period: {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    },
  });
});

// Get sales trends with different granularities
export const getTrends = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate, granularity = 'day' } = req.query;
  
  if (!startDate || !endDate) {
    return sendError(res, 'startDate and endDate are required', 400);
  }
  
  const userId = req.user!.id;
  const start = new Date(startDate as string);
  const end = new Date(endDate as string);
  
  let sql: string;
  let dateFormat: string;
  
  switch (granularity) {
    case 'day':
      dateFormat = "TO_CHAR(sale_date, 'YYYY-MM-DD')";
      break;
    case 'week':
      dateFormat = "TO_CHAR(DATE_TRUNC('week', sale_date), 'YYYY-MM-DD')";
      break;
    case 'month':
      dateFormat = "TO_CHAR(DATE_TRUNC('month', sale_date), 'YYYY-MM')";
      break;
    default:
      dateFormat = "TO_CHAR(sale_date, 'YYYY-MM-DD')";
  }
  
  sql = `
    SELECT 
      ${dateFormat} as period,
      SUM(total_amount) as revenue,
      SUM(profit_amount) as profit,
      COUNT(*) as orders,
      SUM(quantity) as quantity
    FROM sales_data
    WHERE user_id = $1 AND sale_date >= $2 AND sale_date <= $3
    GROUP BY ${dateFormat}
    ORDER BY period ASC
  `;
  
  const { rows } = await query(sql, [userId, start, end]);
  
  const trends = rows.map(row => ({
    period: row.period,
    revenue: parseFloat(row.revenue),
    profit: parseFloat(row.profit),
    orders: parseInt(row.orders, 10),
    quantity: parseInt(row.quantity, 10),
  }));
  
  return sendSuccess(res, { trends, granularity });
});

// Get product performance analytics
export const getProductPerformance = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate, limit = 20 } = req.query;
  
  const userId = req.user!.id;
  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string) : new Date();
  
  // Get top products
  const topProducts = await SalesDataModel.getTopProducts(
    userId,
    parseInt(limit as string, 10),
    start,
    end
  );
  
  // Get slow movers (products with no sales in the period)
  const { rows: slowMoversRows } = await query(
    `SELECT p.id, p.name, p.current_stock, p.selling_price, p.reorder_level
     FROM products p
     WHERE p.user_id = $1 
       AND p.is_active = true
       AND p.id NOT IN (
         SELECT DISTINCT product_id 
         FROM sales_data 
         WHERE user_id = $1 
           AND sale_date >= $2 
           AND sale_date <= $3
           AND product_id IS NOT NULL
       )
     ORDER BY p.current_stock ASC
     LIMIT 10`,
    [userId, start, end]
  );
  
  const slowMovers = slowMoversRows.map(row => ({
    id: row.id,
    name: row.name,
    currentStock: row.current_stock,
    sellingPrice: parseFloat(row.selling_price),
    reorderLevel: row.reorder_level,
  }));
  
  // Get product sales over time
  const { rows: productTrendsRows } = await query(
    `SELECT 
      p.id as product_id,
      p.name as product_name,
      TO_CHAR(sd.sale_date, 'YYYY-MM-DD') as date,
      SUM(sd.quantity) as quantity,
      SUM(sd.total_amount) as revenue
    FROM sales_data sd
    JOIN products p ON sd.product_id = p.id
    WHERE sd.user_id = $1 
      AND sd.sale_date >= $2 
      AND sd.sale_date <= $3
      AND sd.product_id IS NOT NULL
    GROUP BY p.id, p.name, sd.sale_date
    ORDER BY sd.sale_date ASC, revenue DESC`,
    [userId, start, end]
  );
  
  const productTrends = productTrendsRows.map(row => ({
    productId: row.product_id,
    productName: row.product_name,
    date: row.date,
    quantity: parseInt(row.quantity, 10),
    revenue: parseFloat(row.revenue),
  }));
  
  return sendSuccess(res, {
    topProducts,
    slowMovers,
    productTrends,
    period: {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    },
  });
});

// Get channel comparison analytics
export const getChannelComparison = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  
  const userId = req.user!.id;
  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string) : new Date();
  
  // Get sales by channel
  const salesByChannel = await SalesDataModel.getSalesByChannel(userId, start, end);
  
  // Get channel performance over time
  const { rows: channelTrendsRows } = await query(
    `SELECT 
      sc.id as channel_id,
      sc.channel_name,
      sc.channel_type,
      TO_CHAR(sd.sale_date, 'YYYY-MM-DD') as date,
      SUM(sd.total_amount) as revenue,
      COUNT(*) as orders,
      SUM(sd.quantity) as quantity
    FROM sales_data sd
    JOIN sales_channels sc ON sd.channel_id = sc.id
    WHERE sd.user_id = $1 
      AND sd.sale_date >= $2 
      AND sd.sale_date <= $3
      AND sd.channel_id IS NOT NULL
    GROUP BY sc.id, sc.channel_name, sc.channel_type, sd.sale_date
    ORDER BY sd.sale_date ASC, revenue DESC`,
    [userId, start, end]
  );
  
  const channelTrends = channelTrendsRows.map(row => ({
    channelId: row.channel_id,
    channelName: row.channel_name,
    channelType: row.channel_type,
    date: row.date,
    revenue: parseFloat(row.revenue),
    orders: parseInt(row.orders, 10),
    quantity: parseInt(row.quantity, 10),
  }));
  
  // Calculate channel metrics
  const totalRevenue = salesByChannel.reduce((sum, ch) => sum + ch.revenue, 0);
  const channelMetrics = salesByChannel.map(ch => ({
    ...ch,
    percentage: totalRevenue > 0 ? (ch.revenue / totalRevenue) * 100 : 0,
    averageOrderValue: ch.orders > 0 ? ch.revenue / ch.orders : 0,
  }));
  
  // Find best and worst performing channels
  const bestChannel = channelMetrics.length > 0
    ? channelMetrics.reduce((best, current) => 
        current.revenue > best.revenue ? current : best
      )
    : null;
  
  const worstChannel = channelMetrics.length > 0
    ? channelMetrics.reduce((worst, current) => 
        current.revenue < worst.revenue ? current : worst
      )
    : null;
  
  return sendSuccess(res, {
    channels: channelMetrics,
    channelTrends,
    bestChannel,
    worstChannel,
    period: {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    },
  });
});

// Get category performance
export const getCategoryPerformance = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  
  const userId = req.user!.id;
  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string) : new Date();
  
  const { rows } = await query(
    `SELECT 
      c.id as category_id,
      c.name as category_name,
      COUNT(DISTINCT p.id) as product_count,
      SUM(sd.quantity) as total_quantity,
      SUM(sd.total_amount) as total_revenue,
      SUM(sd.profit_amount) as total_profit,
      COUNT(*) as order_count
    FROM sales_data sd
    JOIN products p ON sd.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE sd.user_id = $1 
      AND sd.sale_date >= $2 
      AND sd.sale_date <= $3
      AND sd.product_id IS NOT NULL
    GROUP BY c.id, c.name
    ORDER BY total_revenue DESC`,
    [userId, start, end]
  );
  
  const categories = rows.map(row => ({
    categoryId: row.category_id,
    categoryName: row.category_name || 'Uncategorized',
    productCount: parseInt(row.product_count, 10),
    totalQuantity: parseInt(row.total_quantity, 10),
    totalRevenue: parseFloat(row.total_revenue),
    totalProfit: parseFloat(row.total_profit),
    orderCount: parseInt(row.order_count, 10),
  }));
  
  return sendSuccess(res, {
    categories,
    period: {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    },
  });
});






