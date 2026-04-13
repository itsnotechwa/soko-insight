import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  // Database
  database: {
    url: process.env.DATABASE_URL || '',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'soko_insight',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },
  
  // Email
  email: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  
  // Africa's Talking (SMS)
  africastalking: {
    apiKey: process.env.AT_API_KEY || '',
    username: process.env.AT_USERNAME || 'sandbox',
    senderId: process.env.AT_SENDER_ID || 'SokoInsight',
  },
  
  // Client URL
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  
  // ML Service
  mlService: {
    url: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  },
};

// Validate required environment variables in production
export function validateConfig(): void {
  if (config.nodeEnv === 'production') {
    const required = [
      'DATABASE_URL',
      'JWT_SECRET',
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}

export default config;

