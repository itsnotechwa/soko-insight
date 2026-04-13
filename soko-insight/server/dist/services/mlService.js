"use strict";
/**
 * ML Service Integration
 * Communicates with Python ML microservice for forecasting and trends
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mlService = void 0;
const axios_1 = __importDefault(require("axios"));
class MLService {
    constructor() {
        this.baseUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            timeout: 30000, // 30 seconds timeout
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    /**
     * Check if ML service is available
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/health');
            return response.status === 200;
        }
        catch (error) {
            console.error('ML Service health check failed:', error);
            return false;
        }
    }
    /**
     * Generate demand forecast
     */
    async forecast(request) {
        try {
            // #region agent log
            fetch('http://127.0.0.1:7245/ingest/f95be562-4ac5-45c9-8b92-5fade3576870', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'mlService.ts:forecast', message: 'Sending request to ML service', data: { productId: request.product_id, salesDataCount: request.sales_data.length, samplePoint: request.sales_data[0], allHaveDate: request.sales_data.every(d => d.date), allHaveQuantity: request.sales_data.every(d => typeof d.quantity === 'number') }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' }) }).catch(() => { });
            // #endregion
            const response = await this.client.post('/api/forecast', request);
            return response.data;
        }
        catch (error) {
            // #region agent log
            fetch('http://127.0.0.1:7245/ingest/f95be562-4ac5-45c9-8b92-5fade3576870', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'mlService.ts:forecast', message: 'ML service error', data: { errorMessage: error.message, responseData: error.response?.data, status: error.response?.status }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }) }).catch(() => { });
            // #endregion
            if (error.response) {
                throw new Error(`ML Service error: ${error.response.data.detail || error.response.statusText}`);
            }
            throw new Error(`Failed to connect to ML Service: ${error.message}`);
        }
    }
    /**
     * Get Google Trends data
     */
    async getTrends(request) {
        try {
            const response = await this.client.post('/api/trends', {
                keywords: request.keywords,
                geo: request.geo || 'KE',
                timeframe: request.timeframe || 'today 12-m',
            });
            return response.data;
        }
        catch (error) {
            if (error.response) {
                throw new Error(`ML Service error: ${error.response.data.detail || error.response.statusText}`);
            }
            throw new Error(`Failed to connect to ML Service: ${error.message}`);
        }
    }
    /**
     * Optimize inventory levels
     */
    async optimizeInventory(request) {
        try {
            const response = await this.client.post('/api/inventory/optimize', {
                product_id: request.product_id,
                current_stock: request.current_stock,
                reorder_level: request.reorder_level,
                forecasted_demand: request.forecasted_demand,
                lead_time_days: request.lead_time_days || 7,
                safety_stock_percentage: request.safety_stock_percentage || 0.2,
            });
            return response.data;
        }
        catch (error) {
            if (error.response) {
                throw new Error(`ML Service error: ${error.response.data.detail || error.response.statusText}`);
            }
            throw new Error(`Failed to connect to ML Service: ${error.message}`);
        }
    }
}
exports.mlService = new MLService();
//# sourceMappingURL=mlService.js.map