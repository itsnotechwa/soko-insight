import nodemailer from 'nodemailer';
import { config } from '../config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;
  
  // Initialize email transporter
  static initialize(): void {
    // For development, use Ethereal Email (fake SMTP)
    // In production, configure with real SMTP settings
    if (config.nodeEnv === 'production') {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Development: Use console logging
      this.transporter = null;
    }
  }
  
  // Send email
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter) {
        // In development, just log the email
        console.log('📧 Email (dev mode):', {
          to: options.to,
          subject: options.subject,
          preview: options.text || options.html.substring(0, 100),
        });
        return true;
      }
      
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@sokoinsight.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
      };
      
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }
  
  // Send notification email
  static async sendNotificationEmail(
    to: string,
    notification: {
      title: string;
      message: string;
      type: 'info' | 'warning' | 'alert' | 'success';
    }
  ): Promise<boolean> {
    const typeColors = {
      info: '#1890ff',
      warning: '#faad14',
      alert: '#f5222d',
      success: '#52c41a',
    };
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${typeColors[notification.type]}; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; padding: 10px 20px; background: ${typeColors[notification.type]}; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>SokoInsight Notification</h2>
            </div>
            <div class="content">
              <h3>${notification.title}</h3>
              <p>${notification.message}</p>
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" class="button">View Dashboard</a>
            </div>
          </div>
        </body>
      </html>
    `;
    
    return this.sendEmail({
      to,
      subject: `SokoInsight: ${notification.title}`,
      html,
    });
  }
  
  // Send daily/weekly digest
  static async sendDigest(
    to: string,
    businessName: string,
    summary: {
      totalRevenue: number;
      totalOrders: number;
      totalProfit: number;
      period: string;
    }
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1890ff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
            .stat { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #1890ff; }
            .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
            .stat-value { font-size: 24px; font-weight: bold; color: #1890ff; margin-top: 5px; }
            .button { display: inline-block; padding: 10px 20px; background: #1890ff; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>📊 Your ${summary.period} Sales Summary</h2>
            </div>
            <div class="content">
              <p>Hello ${businessName},</p>
              <p>Here's your sales summary for ${summary.period}:</p>
              
              <div class="stat">
                <div class="stat-label">Total Revenue</div>
                <div class="stat-value">KES ${summary.totalRevenue.toLocaleString()}</div>
              </div>
              
              <div class="stat">
                <div class="stat-label">Total Orders</div>
                <div class="stat-value">${summary.totalOrders}</div>
              </div>
              
              <div class="stat">
                <div class="stat-label">Total Profit</div>
                <div class="stat-value">KES ${summary.totalProfit.toLocaleString()}</div>
              </div>
              
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" class="button">View Full Dashboard</a>
            </div>
          </div>
        </body>
      </html>
    `;
    
    return this.sendEmail({
      to,
      subject: `SokoInsight ${summary.period} Summary`,
      html,
    });
  }
}

// Initialize on module load
EmailService.initialize();






