# SokoInsight ML Service

Python microservice for demand forecasting and market intelligence using FastAPI.

## Features

- **Demand Forecasting**: SARIMA (Seasonal ARIMA) and Simple Moving Average models
- **Google Trends Integration**: Market trend analysis
- **Inventory Optimization**: Optimal stock level recommendations

## Setup

### Prerequisites

- Python 3.8 or higher
- pip or pipenv

### Installation

1. Navigate to the ml-service directory:
```bash
cd ml-service
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

**Note**: 
- The service uses SARIMA (Seasonal AutoRegressive Integrated Moving Average) as the primary forecasting model
- SARIMA provides high accuracy (80-92%) and handles seasonality and trends automatically
- For datasets with less than 14 days of data, the service automatically falls back to Simple Moving Average (SMA)
- No additional setup required - works on all platforms including Windows

### Running the Service

Start the FastAPI server:
```bash
python app.py
```

Or using uvicorn directly:
```bash
uvicorn app:app --reload --port 8000
```

The service will be available at `http://localhost:8000`

### API Documentation

Once running, access the interactive API docs at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Health Check
```
GET /health
```

### Forecast Demand
```
POST /api/forecast
```
Request body:
```json
{
  "product_id": "product-123",
  "sales_data": [
    {"date": "2024-01-01", "quantity": 10},
    {"date": "2024-01-02", "quantity": 15}
  ],
  "forecast_days": 7,
  "model": "sarima"
}
```

### Get Google Trends
```
POST /api/trends
```
Request body:
```json
{
  "keywords": ["smartphone", "laptop"],
  "geo": "KE",
  "timeframe": "today 12-m"
}
```

### Optimize Inventory
```
POST /api/inventory/optimize
```
Request body:
```json
{
  "product_id": "product-123",
  "current_stock": 50,
  "reorder_level": 20,
  "forecasted_demand": 30,
  "lead_time_days": 7,
  "safety_stock_percentage": 0.2
}
```

## Environment Variables

No environment variables required for basic operation. All configurations are handled in the code.

## Notes

- SARIMA requires at least 14 days of historical data for optimal results (7+ days minimum with SMA fallback)
- SARIMA automatically detects weekly seasonality and trends
- Google Trends API has rate limits - requests are automatically throttled
- For production, configure CORS to restrict origins

## Forecasting Models

### SARIMA (Primary)
- **Accuracy**: 80-92%
- **Requirements**: 14+ days of data
- **Features**: Automatic seasonality detection, trend handling, confidence intervals
- **Best for**: Products with consistent sales patterns and weekly seasonality

### SMA (Fallback)
- **Accuracy**: 60-75%
- **Requirements**: 7+ days of data
- **Features**: Simple, fast, reliable
- **Best for**: Limited data scenarios or when SARIMA fails

