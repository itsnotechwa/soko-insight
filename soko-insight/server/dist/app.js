"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const config_1 = require("./config");
const database_1 = require("./config/database");
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
// Validate configuration
(0, config_1.validateConfig)();
// Create Express app
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
// CORS configuration
app.use((0, cors_1.default)({
    origin: config_1.config.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// API routes
app.use('/api', routes_1.default);
// 404 handler
app.use(errorHandler_1.notFoundHandler);
// Error handler
app.use(errorHandler_1.errorHandler);
// Start server
async function startServer() {
    try {
        // Test database connection
        const dbConnected = await (0, database_1.testConnection)();
        if (!dbConnected) {
            console.error('Failed to connect to database. Please check your configuration.');
            process.exit(1);
        }
        // Start listening
        app.listen(config_1.config.port, () => {
            console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 SokoInsight API Server                                ║
║                                                            ║
║   Environment: ${config_1.config.nodeEnv.padEnd(40)}║
║   Port: ${config_1.config.port.toString().padEnd(47)}║
║   Client URL: ${config_1.config.clientUrl.padEnd(41)}║
║                                                            ║
║   API Endpoints:                                           ║
║   - Health: http://localhost:${config_1.config.port}/api/health              ║
║   - Auth:   http://localhost:${config_1.config.port}/api/auth                ║
║   - Products: http://localhost:${config_1.config.port}/api/products          ║
║   - Channels: http://localhost:${config_1.config.port}/api/channels          ║
║   - Sales:  http://localhost:${config_1.config.port}/api/sales               ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
        });
    }
    catch (error) {
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
exports.default = app;
//# sourceMappingURL=app.js.map