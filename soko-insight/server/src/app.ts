import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateConfig } from './config';
import { testConnection } from './config/database';
import routes from './routes';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

// Validate configuration
validateConfig();

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
async function startServer(): Promise<void> {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('Failed to connect to database. Please check your configuration.');
      process.exit(1);
    }
    
    // Start listening
    app.listen(config.port, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 SokoInsight API Server                                ║
║                                                            ║
║   Environment: ${config.nodeEnv.padEnd(40)}║
║   Port: ${config.port.toString().padEnd(47)}║
║   Client URL: ${config.clientUrl.padEnd(41)}║
║                                                            ║
║   API Endpoints:                                           ║
║   - Health: http://localhost:${config.port}/api/health              ║
║   - Auth:   http://localhost:${config.port}/api/auth                ║
║   - Products: http://localhost:${config.port}/api/products          ║
║   - Channels: http://localhost:${config.port}/api/channels          ║
║   - Sales:  http://localhost:${config.port}/api/sales               ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

export default app;

