import { SalesDataModel } from '../models/SalesData';
import { ProductModel } from '../models/Product';
import { SalesChannelModel } from '../models/SalesChannel';
import { NotificationModel, CreateNotificationInput } from '../models/Notification';
import { UserModel } from '../models/User';
import { query } from '../config/database';

export interface Recommendation {
  type: 'info' | 'warning' | 'alert' | 'success';
  category: 'stock' | 'sales' | 'trend' | 'competitor' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  actionText?: string;
}

export class RecommendationsService {
  // Generate recommendations for a user
  static async generateRecommendations(userId: string): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    
    // Get user preferences
    const user = await UserModel.findById(userId);
    if (!user) {
      return recommendations;
    }
    
    // Get recent sales data (last 30 days)
    const endDate = new Date();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const summary = await SalesDataModel.getSummary(userId, startDate, endDate);
    const topProducts = await SalesDataModel.getTopProducts(userId, 10, startDate, endDate);
    const salesByChannel = await SalesDataModel.getSalesByChannel(userId, startDate, endDate);
    const lowStockProducts = await ProductModel.getLowStock(userId);
    
    // 1. Stock recommendations
    if (lowStockProducts.length > 0) {
      lowStockProducts.slice(0, 5).forEach(product => {
        recommendations.push({
          type: 'alert',
          category: 'stock',
          title: `Low Stock Alert: ${product.name}`,
          message: `Only ${product.currentStock} ${product.unit}(s) left. Reorder level is ${product.reorderLevel}. Consider restocking soon.`,
          priority: product.currentStock === 0 ? 'high' : 'medium',
          actionUrl: `/products/${product.id}`,
          actionText: 'View Product',
        });
      });
    }
    
    // 2. Slow movers
    const { rows: slowMovers } = await query(
      `SELECT p.id, p.name, p.current_stock, p.selling_price
       FROM products p
       WHERE p.user_id = $1 
         AND p.is_active = true
         AND p.id NOT IN (
           SELECT DISTINCT product_id 
           FROM sales_data 
           WHERE user_id = $1 
             AND sale_date >= $2
             AND product_id IS NOT NULL
         )
       ORDER BY p.current_stock DESC
       LIMIT 5`,
      [userId, startDate]
    );
    
    if (slowMovers.length > 0) {
      slowMovers.forEach((product: any) => {
        recommendations.push({
          type: 'warning',
          category: 'sales',
          title: `Slow Mover: ${product.name}`,
          message: `${product.name} hasn't sold in the last 30 days. Consider promoting it or adjusting the price.`,
          priority: 'medium',
          actionUrl: `/products/${product.id}`,
          actionText: 'View Product',
        });
      });
    }
    
    // 3. High demand products
    if (topProducts.length > 0) {
      const topProduct = topProducts[0];
      const product = await ProductModel.findById(topProduct.productId, userId);
      
      if (product && product.currentStock < product.reorderLevel * 2) {
        recommendations.push({
          type: 'info',
          category: 'sales',
          title: `High Demand: ${topProduct.productName}`,
          message: `${topProduct.productName} is your top seller with ${topProduct.quantity} units sold. Stock is getting low - consider increasing inventory.`,
          priority: 'medium',
          actionUrl: `/products/${topProduct.productId}`,
          actionText: 'View Product',
        });
      }
    }
    
    // 4. Channel performance
    if (salesByChannel.length > 1) {
      const totalRevenue = salesByChannel.reduce((sum, ch) => sum + ch.revenue, 0);
      const bestChannel = salesByChannel.reduce((best, current) => 
        current.revenue > best.revenue ? current : best
      );
      const worstChannel = salesByChannel.reduce((worst, current) => 
        current.revenue < worst.revenue ? current : worst
      );
      
      if (bestChannel.revenue > 0 && worstChannel.revenue > 0) {
        const bestPercentage = (bestChannel.revenue / totalRevenue) * 100;
        const worstPercentage = (worstChannel.revenue / totalRevenue) * 100;
        
        if (bestPercentage > 50) {
          recommendations.push({
            type: 'info',
            category: 'sales',
            title: `Channel Focus: ${bestChannel.channelName}`,
            message: `${bestChannel.channelName} accounts for ${bestPercentage.toFixed(1)}% of your revenue. Consider focusing marketing efforts here.`,
            priority: 'low',
            actionUrl: '/analytics',
            actionText: 'View Analytics',
          });
        }
        
        if (worstPercentage < 10 && worstChannel.orders > 0) {
          recommendations.push({
            type: 'warning',
            category: 'sales',
            title: `Underperforming Channel: ${worstChannel.channelName}`,
            message: `${worstChannel.channelName} only accounts for ${worstPercentage.toFixed(1)}% of revenue. Consider optimizing or reallocating resources.`,
            priority: 'low',
            actionUrl: '/analytics',
            actionText: 'View Analytics',
          });
        }
      }
    }
    
    // 5. Sales trends
    const prevStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prevSummary = await SalesDataModel.getSummary(userId, prevStartDate, startDate);
    
    if (prevSummary.totalRevenue > 0) {
      const revenueChange = ((summary.totalRevenue - prevSummary.totalRevenue) / prevSummary.totalRevenue) * 100;
      
      if (revenueChange < -10) {
        recommendations.push({
          type: 'alert',
          category: 'sales',
          title: 'Sales Decline Detected',
          message: `Your revenue has decreased by ${Math.abs(revenueChange).toFixed(1)}% compared to the previous period. Review your sales strategy.`,
          priority: 'high',
          actionUrl: '/analytics',
          actionText: 'View Analytics',
        });
      } else if (revenueChange > 20) {
        recommendations.push({
          type: 'success',
          category: 'sales',
          title: 'Great Sales Growth!',
          message: `Your revenue has increased by ${revenueChange.toFixed(1)}% compared to the previous period. Keep up the great work!`,
          priority: 'low',
          actionUrl: '/analytics',
          actionText: 'View Analytics',
        });
      }
    }
    
    // 6. Overstocked products
    const { rows: overstocked } = await query(
      `SELECT p.id, p.name, p.current_stock, p.reorder_level
       FROM products p
       WHERE p.user_id = $1 
         AND p.is_active = true
         AND p.current_stock > (p.reorder_level * 5)
       ORDER BY p.current_stock DESC
       LIMIT 5`,
      [userId]
    );
    
    if (overstocked.length > 0) {
      overstocked.forEach((product: any) => {
        recommendations.push({
          type: 'warning',
          category: 'stock',
          title: `Overstocked: ${product.name}`,
          message: `${product.name} has ${product.current_stock} units in stock, which is ${Math.round((product.current_stock / product.reorder_level) * 100)}% above reorder level. Consider running a promotion.`,
          priority: 'low',
          actionUrl: `/products/${product.id}`,
          actionText: 'View Product',
        });
      });
    }
    
    // If no specific recommendations, provide general insights
    if (recommendations.length === 0 && summary.totalRevenue > 0) {
      recommendations.push({
        type: 'success',
        category: 'system',
        title: 'Business Running Smoothly',
        message: `Your business generated ${summary.totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} in the last 30 days. All inventory levels are healthy and sales are consistent.`,
        priority: 'low',
        actionUrl: '/analytics',
        actionText: 'View Analytics',
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
  
  // Create notifications from recommendations
  static async createNotificationsFromRecommendations(
    userId: string,
    recommendations: Recommendation[]
  ): Promise<void> {
    for (const rec of recommendations) {
      const notification: CreateNotificationInput = {
        userId,
        type: rec.type,
        category: rec.category,
        title: rec.title,
        message: rec.message,
      };
      
      await NotificationModel.create(notification);
    }
  }
  
  // Generate and save recommendations for a user
  static async generateAndSaveRecommendations(userId: string): Promise<Recommendation[]> {
    const recommendations = await this.generateRecommendations(userId);
    
    // Only create notifications for high and medium priority recommendations
    const importantRecs = recommendations.filter(r => 
      r.priority === 'high' || r.priority === 'medium'
    );
    
    if (importantRecs.length > 0) {
      await this.createNotificationsFromRecommendations(userId, importantRecs);
    }
    
    return recommendations;
  }
}






