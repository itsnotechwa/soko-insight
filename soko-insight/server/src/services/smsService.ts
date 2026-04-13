import { config } from '../config';

export interface SmsOptions {
  to: string;
  message: string;
}

export class SmsService {
  // Send SMS using Africa's Talking API
  static async sendSms(options: SmsOptions): Promise<boolean> {
    try {
      const apiKey = process.env.AFRICAS_TALKING_API_KEY;
      const username = process.env.AFRICAS_TALKING_USERNAME;
      
      if (!apiKey || !username) {
        // In development, just log the SMS
        console.log('📱 SMS (dev mode):', {
          to: options.to,
          message: options.message.substring(0, 50) + '...',
        });
        return true;
      }
      
      // Format phone number (ensure it starts with +254 for Kenya)
      let phoneNumber = options.to.replace(/\s+/g, '');
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '+254' + phoneNumber.substring(1);
      } else if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+254' + phoneNumber;
      }
      
      // Africa's Talking API endpoint
      const url = 'https://api.africastalking.com/version1/messaging';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'ApiKey': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: username,
          to: phoneNumber,
          message: options.message,
          from: process.env.AFRICAS_TALKING_SENDER_ID || 'SokoInsight',
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Africa\'s Talking API error:', errorText);
        return false;
      }
      
      const result = await response.json();
      console.log('SMS sent:', result);
      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  }
  
  // Send notification SMS
  static async sendNotificationSms(
    to: string,
    notification: {
      title: string;
      message: string;
    }
  ): Promise<boolean> {
    // SMS has character limit, so keep it concise
    const smsMessage = `SokoInsight: ${notification.title}\n\n${notification.message}\n\nView: ${process.env.CLIENT_URL || 'http://localhost:5173'}`;
    
    // Truncate if too long (SMS limit is typically 160 characters)
    const truncatedMessage = smsMessage.length > 160 
      ? smsMessage.substring(0, 157) + '...'
      : smsMessage;
    
    return this.sendSms({
      to,
      message: truncatedMessage,
    });
  }
  
  // Send low stock alert SMS
  static async sendLowStockAlert(
    to: string,
    productName: string,
    currentStock: number,
    reorderLevel: number
  ): Promise<boolean> {
    const message = `Low Stock Alert: ${productName} has only ${currentStock} units left. Reorder level: ${reorderLevel}.`;
    
    return this.sendNotificationSms(to, {
      title: 'Low Stock Alert',
      message,
    });
  }
  
  // Send sales milestone SMS
  static async sendSalesMilestone(
    to: string,
    milestone: string,
    amount: number
  ): Promise<boolean> {
    const message = `Congratulations! You've reached ${milestone}: KES ${amount.toLocaleString()}`;
    
    return this.sendNotificationSms(to, {
      title: 'Sales Milestone',
      message,
    });
  }
}






