"""
Demand Forecasting Module
Implements SARIMA and Simple Moving Average models for demand prediction
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import warnings

# SARIMA imports
try:
    from statsmodels.tsa.statespace.sarimax import SARIMAX
    from statsmodels.tsa.seasonal import seasonal_decompose
    from statsmodels.tools.sm_exceptions import ConvergenceWarning
    import pmdarima as pm
    SARIMA_AVAILABLE = True
    HAS_CONVERGENCE_WARNING = True
except ImportError:
    SARIMA_AVAILABLE = False
    HAS_CONVERGENCE_WARNING = False

warnings.filterwarnings('ignore')
if HAS_CONVERGENCE_WARNING:
    warnings.filterwarnings('ignore', category=ConvergenceWarning)


def simple_moving_average(
    sales_data: List[Dict[str, Any]],
    forecast_days: int,
    window: int = 7
) -> Dict[str, Any]:
    """
    Simple Moving Average forecasting
    
    Args:
        sales_data: List of sales data points with 'date' and 'quantity'
        forecast_days: Number of days to forecast
        window: Moving average window (default: 7 days)
    
    Returns:
        Dictionary with forecasts and metadata
    """
    # Convert to DataFrame
    df = pd.DataFrame(sales_data)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    
    # Calculate moving average
    df['ma'] = df['quantity'].rolling(window=min(window, len(df)), min_periods=1).mean()
    
    # Get last moving average value
    last_ma = df['ma'].iloc[-1]
    
    # Generate forecasts
    last_date = df['date'].iloc[-1]
    forecasts = []
    
    for i in range(1, forecast_days + 1):
        forecast_date = last_date + timedelta(days=i)
        forecasts.append({
            "date": forecast_date.strftime("%Y-%m-%d"),
            "predicted_demand": max(0, int(round(last_ma))),  # Ensure non-negative
            "confidence": 0.6  # Lower confidence for SMA
        })
    
    # Calculate confidence based on variance
    variance = df['quantity'].var()
    mean_quantity = df['quantity'].mean()
    cv = (variance ** 0.5) / mean_quantity if mean_quantity > 0 else 1.0
    confidence = max(0.3, min(0.7, 1.0 - cv))  # Lower confidence if high variance
    
    return {
        "forecasts": forecasts,
        "model_used": "sma",
        "confidence": float(confidence)
    }


def sarima_forecast(
    sales_data: List[Dict[str, Any]],
    forecast_days: int
) -> Dict[str, Any]:
    """
    SARIMA (Seasonal AutoRegressive Integrated Moving Average) forecasting
    
    Args:
        sales_data: List of sales data points with 'date' and 'quantity'
        forecast_days: Number of days to forecast
    
    Returns:
        Dictionary with forecasts and metadata
    
    Raises:
        ValueError: If data is insufficient or model cannot be fitted
    """
    if not SARIMA_AVAILABLE:
        raise ImportError("statsmodels or pmdarima not installed. Cannot use SARIMA.")
    
    # Convert to DataFrame with proper time series format
    df = pd.DataFrame(sales_data)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    
    # Set date as index for time series
    ts_data = df.set_index('date')['quantity']
    
    # Check for sufficient data
    if len(ts_data) < 14:
        raise ValueError("Need at least 14 days of data for SARIMA")
    
    # Check for data issues
    if ts_data.isna().any():
        raise ValueError("Time series contains NaN values")
    
    if (ts_data == 0).all():
        raise ValueError("Time series contains only zeros")
    
    # Remove any remaining NaN or inf values
    ts_data = ts_data.fillna(ts_data.mean()).replace([np.inf, -np.inf], ts_data.mean())
    
    # Ensure all values are positive (add small value if needed)
    if (ts_data <= 0).any():
        ts_data = ts_data - ts_data.min() + 0.1
    
    try:
        # Use auto_arima to find best parameters
        # For small datasets, use non-seasonal ARIMA
        # For larger datasets (21+ days), use seasonal ARIMA
        use_seasonal = len(ts_data) >= 21  # Need at least 3 weeks for weekly seasonality
        
        model = pm.auto_arima(
            ts_data,
            seasonal=use_seasonal,
            m=7 if use_seasonal else 1,  # Weekly seasonality only if enough data
            start_p=0, max_p=2,
            start_q=0, max_q=2,
            start_P=0, max_P=1,
            start_Q=0, max_Q=1,
            max_d=1, max_D=1,
            stepwise=True,
            suppress_warnings=True,
            error_action='ignore',
            trace=False,
            n_jobs=1,  # Use single core for stability
            with_intercept=True,
            information_criterion='aic',
            max_order=5  # Limit total order to avoid overfitting
        )
        
        # Generate forecast
        try:
            forecast_result = model.predict(
                n_periods=forecast_days,
                return_conf_int=True,
                alpha=0.05  # 95% confidence interval
            )
            
            # Handle different return types from predict()
            if isinstance(forecast_result, tuple):
                forecast_values, conf_int = forecast_result
            else:
                # If no confidence intervals returned, use forecast values only
                forecast_values = forecast_result
                # Create dummy confidence intervals
                forecast_array = np.array(forecast_values) if not isinstance(forecast_values, np.ndarray) else forecast_values
                conf_int = np.array([[v * 0.9, v * 1.1] for v in forecast_array])
            
            # Convert to numpy arrays (handle pandas Series/DataFrame)
            if hasattr(forecast_values, 'values'):
                # It's a pandas Series or DataFrame
                forecast_values = forecast_values.values
            if not isinstance(forecast_values, np.ndarray):
                forecast_values = np.array(forecast_values)
            
            # Flatten if needed
            if forecast_values.ndim > 1:
                forecast_values = forecast_values.flatten()
            
            # Ensure conf_int is a numpy array
            if hasattr(conf_int, 'values'):
                conf_int = conf_int.values
            if not isinstance(conf_int, np.ndarray):
                conf_int = np.array(conf_int)
            
        except Exception as pred_error:
            raise ValueError(f"Failed to generate forecast: {str(pred_error)}")
        
        # Create forecast results
        forecasts = []
        last_date = ts_data.index[-1]
        
        for i in range(forecast_days):
            forecast_date = last_date + timedelta(days=i+1)
            
            # Get predicted value
            if isinstance(forecast_values, np.ndarray):
                predicted_value = max(0, int(round(float(forecast_values[i]))))
            else:
                predicted_value = max(0, int(round(float(forecast_values.iloc[i]))))
            
            # Get confidence intervals
            if len(conf_int.shape) == 2 and conf_int.shape[1] >= 2:
                lower_bound = max(0, int(round(float(conf_int[i][0]))))
                upper_bound = max(0, int(round(float(conf_int[i][1]))))
            else:
                # Fallback if confidence intervals not available
                lower_bound = max(0, int(round(predicted_value * 0.9)))
                upper_bound = max(0, int(round(predicted_value * 1.1)))
            
            forecasts.append({
                "date": forecast_date.strftime("%Y-%m-%d"),
                "predicted_demand": predicted_value,
                "lower_bound": lower_bound,
                "upper_bound": upper_bound,
                "confidence": 0.85  # SARIMA generally has high confidence
            })
        
        # Calculate overall confidence based on prediction intervals
        try:
            confidence = calculate_sarima_confidence(forecast_values, conf_int)
        except Exception:
            # Fallback confidence if calculation fails
            confidence = 0.75
        
        # Get model order information safely
        try:
            model_order = str(model.order) if hasattr(model, 'order') else "Unknown"
            seasonal_order = str(model.seasonal_order) if hasattr(model, 'seasonal_order') else "Unknown"
        except Exception:
            model_order = "Unknown"
            seasonal_order = "Unknown"
        
        return {
            "forecasts": forecasts,
            "model_used": "sarima",
            "confidence": float(confidence),
            "model_order": model_order,
            "seasonal_order": seasonal_order
        }
    
    except Exception as e:
        # If SARIMA fails, raise error to trigger fallback
        error_type = type(e).__name__
        error_msg = str(e) if str(e) and str(e) != "0" else f"{error_type} occurred"
        
        # Provide more context for common errors
        if "convergence" in str(e).lower() or "nan" in str(e).lower():
            raise ValueError(f"SARIMA model fitting failed: {error_msg}. Data may need preprocessing.")
        elif "singular" in str(e).lower() or "invert" in str(e).lower():
            raise ValueError(f"SARIMA model fitting failed: {error_msg}. Try with more data or different parameters.")
        else:
            raise ValueError(f"SARIMA model fitting failed: {error_msg}")


def calculate_sarima_confidence(forecast_values: np.ndarray, conf_int: np.ndarray) -> float:
    """
    Calculate confidence score based on SARIMA prediction intervals
    
    Args:
        forecast_values: Array of forecasted values
        conf_int: Array of confidence intervals (lower, upper)
    
    Returns:
        Confidence score between 0 and 1
    """
    try:
        # Convert to numpy arrays if needed
        if not isinstance(forecast_values, np.ndarray):
            forecast_values = np.array(forecast_values)
        if not isinstance(conf_int, np.ndarray):
            conf_int = np.array(conf_int)
        
        if len(forecast_values) == 0:
            return 0.5
        
        # Ensure conf_int has the right shape
        if len(conf_int.shape) == 1:
            # If 1D, assume it's just lower bounds or invalid
            return 0.75
        
        if conf_int.shape[1] < 2:
            # Not enough columns for intervals
            return 0.75
        
        # Calculate average interval width relative to forecast
        interval_widths = conf_int[:, 1] - conf_int[:, 0]
        mean_forecast = np.mean(forecast_values)
        
        if mean_forecast == 0:
            return 0.5
        
        # Coefficient of variation of uncertainty
        cv = np.mean(interval_widths) / mean_forecast if mean_forecast > 0 else 1.0
        
        # Lower CV = higher confidence
        # Scale to 0.5-0.95 range
        confidence = max(0.5, min(0.95, 1.0 - (cv * 0.3)))
        
        return confidence
    except Exception:
        # Return default confidence if calculation fails
        return 0.75


def _is_prophet_available() -> bool:
    """
    Check if Prophet is properly installed with Stan backend
    
    Returns:
        True if Prophet can be used, False otherwise
    """
    try:
        model = Prophet()
        # Try to access stan_backend to verify it exists
        _ = model.stan_backend
        return True
    except (AttributeError, ImportError, Exception):
        # stan_backend doesn't exist or other error - Prophet not properly installed
        return False


def prophet_forecast(
    sales_data: List[Dict[str, Any]],
    forecast_days: int
) -> Dict[str, Any]:
    """
    Prophet time series forecasting
    
    Args:
        sales_data: List of sales data points with 'date' and 'quantity'
        forecast_days: Number of days to forecast
    
    Returns:
        Dictionary with forecasts and metadata
    
    Raises:
        ImportError: If Prophet is not properly installed with Stan backend
    """
    # Check if Prophet is available before attempting to use it
    if not _is_prophet_available():
        raise ImportError("Prophet's Stan backend is not properly installed. CmdStan may be missing. Use SMA model instead.")
    
    # Convert to DataFrame with Prophet format
    df = pd.DataFrame(sales_data)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    
    # Prophet expects 'ds' and 'y' columns
    prophet_df = pd.DataFrame({
        'ds': df['date'],
        'y': df['quantity']
    })
    
    # Initialize and fit Prophet model
    model = Prophet(
        daily_seasonality=True,
        weekly_seasonality=True,
        yearly_seasonality=False,  # Disable yearly for short-term forecasts
        seasonality_mode='multiplicative',
        changepoint_prior_scale=0.05,  # More stable predictions
        interval_width=0.8
    )
    
    try:
        model.fit(prophet_df)
        
        # Create future dates
        future = model.make_future_dataframe(periods=forecast_days)
        
        # Generate forecast
        forecast = model.predict(future)
        
        # Extract forecasted values
        forecasts = []
        forecast_df = forecast.tail(forecast_days)
        
        for _, row in forecast_df.iterrows():
            forecasts.append({
                "date": row['ds'].strftime("%Y-%m-%d"),
                "predicted_demand": max(0, int(round(row['yhat']))),  # Ensure non-negative
                "confidence": 0.8  # Prophet generally has higher confidence
            })
        
        # Calculate confidence based on uncertainty intervals
        confidence = calculate_prophet_confidence(forecast_df)
        
        return {
            "forecasts": forecasts,
            "model_used": "prophet",
            "confidence": float(confidence)
        }
    
    except Exception as e:
        # Fallback to SMA if Prophet fails
        return simple_moving_average(sales_data, forecast_days)


def calculate_prophet_confidence(forecast_df: pd.DataFrame) -> float:
    """
    Calculate confidence score based on Prophet uncertainty intervals
    
    Args:
        forecast_df: DataFrame with Prophet forecast results
    
    Returns:
        Confidence score between 0 and 1
    """
    if len(forecast_df) == 0:
        return 0.5
    
    # Calculate coefficient of variation of uncertainty
    uncertainty = forecast_df['yhat_upper'] - forecast_df['yhat_lower']
    mean_prediction = forecast_df['yhat'].mean()
    
    if mean_prediction == 0:
        return 0.5
    
    cv = (uncertainty.mean() / mean_prediction) if mean_prediction > 0 else 1.0
    
    # Lower CV = higher confidence
    confidence = max(0.4, min(0.95, 1.0 - (cv * 0.5)))
    
    return confidence


def generate_forecast(
    sales_data: List[Dict[str, Any]],
    forecast_days: int = 7,
    model: str = "sarima"
) -> Dict[str, Any]:
    """
    Main forecasting function that routes to appropriate model
    
    Args:
        sales_data: List of sales data points
        forecast_days: Number of days to forecast
        model: Model to use ('sarima' or 'sma')
    
    Returns:
        Dictionary with forecasts and metadata
    """
    # Validate input
    if len(sales_data) < 7:
        raise ValueError("Need at least 7 days of historical data for forecasting")
    
    # Validate sales_data structure (should already be dicts from endpoint)
    for i, point in enumerate(sales_data):
        # Ensure point is a dict
        if not isinstance(point, dict):
            raise ValueError(f"Sales data point at index {i} must be a dictionary, got {type(point)}")
        
        # Validate required fields
        if 'date' not in point or 'quantity' not in point:
            raise ValueError(f"Each sales data point must have 'date' and 'quantity' fields (invalid at index {i})")
    
    # Route to appropriate model
    if model == "sma" or len(sales_data) < 14:
        # Use SMA for small datasets or when explicitly requested
        result = simple_moving_average(sales_data, forecast_days)
        if len(sales_data) < 14:
            result["message"] = "Using Simple Moving Average due to limited historical data (minimum 14 days recommended for SARIMA)"
    else:
        # Use SARIMA for larger datasets with SMA fallback
        try:
            if not SARIMA_AVAILABLE:
                # SARIMA not available, use SMA
                result = simple_moving_average(sales_data, forecast_days)
                result["message"] = "Using Simple Moving Average (SARIMA libraries not installed)"
            else:
                # Try SARIMA first
                result = sarima_forecast(sales_data, forecast_days)
        except (ValueError, ImportError) as e:
            # SARIMA failed due to insufficient data or import error, use SMA
            result = simple_moving_average(sales_data, forecast_days)
            result["message"] = f"Using Simple Moving Average (SARIMA unavailable: {str(e)})"
        except Exception as e:
            # Fallback to SMA if SARIMA fails for other reasons
            result = simple_moving_average(sales_data, forecast_days)
            result["message"] = f"SARIMA model failed, using Simple Moving Average: {str(e)}"
    
    return result

