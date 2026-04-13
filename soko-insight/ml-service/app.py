"""
SokoInsight ML Service
FastAPI microservice for demand forecasting and market intelligence
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import uvicorn

from forecasting import generate_forecast
from trends import get_google_trends
from inventory import optimize_inventory

app = FastAPI(
    title="SokoInsight ML Service",
    description="Demand forecasting and market intelligence microservice",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class SalesDataPoint(BaseModel):
    date: str = Field(..., description="Sale date in YYYY-MM-DD format")
    quantity: int = Field(..., ge=0, description="Quantity sold")
    revenue: Optional[float] = Field(None, ge=0, description="Revenue amount")

class ForecastRequest(BaseModel):
    product_id: str = Field(..., description="Product identifier")
    sales_data: List[SalesDataPoint] = Field(..., min_items=7, description="Historical sales data (minimum 7 days)")
    forecast_days: int = Field(7, ge=1, le=90, description="Number of days to forecast (1-90)")
    model: Optional[str] = Field("sarima", description="Forecasting model: 'sarima' or 'sma'")

class ForecastResponse(BaseModel):
    product_id: str
    forecasts: List[Dict[str, Any]]
    model_used: str
    confidence: float = Field(..., ge=0, le=1)
    message: Optional[str] = None

class TrendsRequest(BaseModel):
    keywords: List[str] = Field(..., min_items=1, max_items=5, description="Keywords to search (1-5)")
    geo: Optional[str] = Field("KE", description="Geographic location (default: KE for Kenya)")
    timeframe: Optional[str] = Field("today 12-m", description="Timeframe for trends")

class TrendsResponse(BaseModel):
    keywords: List[str]
    data: Dict[str, Any]
    timeframe: str
    geo: str

class InventoryRequest(BaseModel):
    product_id: str
    current_stock: int = Field(..., ge=0)
    reorder_level: int = Field(..., ge=0)
    forecasted_demand: int = Field(..., ge=0)
    lead_time_days: int = Field(7, ge=0, description="Lead time for restocking in days")
    safety_stock_percentage: float = Field(0.2, ge=0, le=1, description="Safety stock as percentage of average demand")

class InventoryResponse(BaseModel):
    product_id: str
    current_stock: int
    recommended_stock: int
    order_quantity: int = Field(..., ge=0)
    recommendation: str
    urgency: str = Field(..., description="'low', 'medium', 'high', 'critical'")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "ml-service",
        "timestamp": datetime.now().isoformat()
    }

# Forecasting endpoint
@app.post("/api/forecast", response_model=ForecastResponse)
async def forecast_demand(request: ForecastRequest):
    """
    Generate demand forecast for a product
    
    - **product_id**: Unique product identifier
    - **sales_data**: Historical sales data (minimum 7 days, 14+ recommended)
    - **forecast_days**: Number of days to forecast (1-90)
    - **model**: Forecasting model ('sarima' for SARIMA, 'sma' for Simple Moving Average)
    """
    try:
        # Convert Pydantic models to dicts for processing
        sales_data_dicts = [
            item.model_dump() if hasattr(item, 'model_dump') else (item.dict() if hasattr(item, 'dict') else item)
            for item in request.sales_data
        ]
        
        result = generate_forecast(
            sales_data=sales_data_dicts,
            forecast_days=request.forecast_days,
            model=request.model or "sarima"
        )
        
        return ForecastResponse(
            product_id=request.product_id,
            forecasts=result["forecasts"],
            model_used=result["model_used"],
            confidence=result["confidence"],
            message=result.get("message")
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting error: {str(e)}")

# Google Trends endpoint
@app.post("/api/trends", response_model=TrendsResponse)
async def get_trends(request: TrendsRequest):
    """
    Get Google Trends data for keywords
    
    - **keywords**: List of keywords (1-5)
    - **geo**: Geographic location (default: KE for Kenya)
    - **timeframe**: Timeframe for trends (e.g., "today 12-m", "today 3-m", "today 1-m")
    """
    try:
        result = get_google_trends(
            keywords=request.keywords,
            geo=request.geo or "KE",
            timeframe=request.timeframe or "today 12-m"
        )
        
        return TrendsResponse(
            keywords=request.keywords,
            data=result,
            timeframe=request.timeframe or "today 12-m",
            geo=request.geo or "KE"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trends error: {str(e)}")

# Inventory optimization endpoint
@app.post("/api/inventory/optimize", response_model=InventoryResponse)
async def optimize_stock(request: InventoryRequest):
    """
    Optimize inventory levels based on forecasted demand
    
    - **product_id**: Product identifier
    - **current_stock**: Current stock level
    - **reorder_level**: Current reorder level
    - **forecasted_demand**: Forecasted demand over lead time
    - **lead_time_days**: Lead time for restocking
    - **safety_stock_percentage**: Safety stock percentage
    """
    try:
        result = optimize_inventory(
            current_stock=request.current_stock,
            reorder_level=request.reorder_level,
            forecasted_demand=request.forecasted_demand,
            lead_time_days=request.lead_time_days,
            safety_stock_percentage=request.safety_stock_percentage
        )
        
        return InventoryResponse(
            product_id=request.product_id,
            current_stock=request.current_stock,
            recommended_stock=result["recommended_stock"],
            order_quantity=result["order_quantity"],
            recommendation=result["recommendation"],
            urgency=result["urgency"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inventory optimization error: {str(e)}")

# Root endpoint
@app.get("/")
async def root():
    return {
        "service": "SokoInsight ML Service",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "forecast": "/api/forecast",
            "trends": "/api/trends",
            "inventory": "/api/inventory/optimize"
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

