"""
Inventory Optimization Module
Calculates optimal stock levels based on demand forecasts
"""

from typing import Dict, Any


def optimize_inventory(
    current_stock: int,
    reorder_level: int,
    forecasted_demand: int,
    lead_time_days: int = 7,
    safety_stock_percentage: float = 0.2
) -> Dict[str, Any]:
    """
    Optimize inventory levels based on forecasted demand
    
    Args:
        current_stock: Current stock level
        reorder_level: Current reorder level
        forecasted_demand: Forecasted demand over lead time period
        lead_time_days: Lead time for restocking (in days)
        safety_stock_percentage: Safety stock as percentage of average demand
    
    Returns:
        Dictionary with optimization recommendations
    """
    # Calculate safety stock
    safety_stock = int(forecasted_demand * safety_stock_percentage)
    
    # Calculate recommended stock (forecasted demand + safety stock)
    recommended_stock = forecasted_demand + safety_stock
    
    # Calculate order quantity
    if current_stock < reorder_level:
        # Need to order: recommended stock - current stock
        order_quantity = max(0, recommended_stock - current_stock)
    else:
        # Stock is above reorder level, but check if we should still order
        if current_stock < recommended_stock:
            order_quantity = max(0, recommended_stock - current_stock)
        else:
            order_quantity = 0
    
    # Determine urgency and recommendation
    stock_ratio = current_stock / forecasted_demand if forecasted_demand > 0 else float('inf')
    days_remaining = int((current_stock / forecasted_demand * lead_time_days)) if forecasted_demand > 0 else float('inf')
    
    if current_stock == 0:
        urgency = "critical"
        recommendation = f"CRITICAL: Out of stock! Order {order_quantity} units immediately to meet forecasted demand of {forecasted_demand} units."
    elif current_stock < reorder_level:
        urgency = "high"
        recommendation = f"URGENT: Stock below reorder level. Order {order_quantity} units to maintain adequate inventory. Recommended stock: {recommended_stock} units."
    elif days_remaining < lead_time_days:
        urgency = "high"
        recommendation = f"Order {order_quantity} units soon. Current stock will last ~{days_remaining} days, but lead time is {lead_time_days} days."
    elif stock_ratio < 1.2:  # Less than 20% above forecasted demand
        urgency = "medium"
        recommendation = f"Consider ordering {order_quantity} units to reach optimal stock level of {recommended_stock} units."
    elif stock_ratio > 2.0:  # More than double the forecasted demand
        urgency = "low"
        recommendation = f"Stock levels are high ({current_stock} units). Consider reducing orders. Optimal level: {recommended_stock} units."
    else:
        urgency = "low"
        recommendation = f"Stock levels are adequate. Current: {current_stock} units, Recommended: {recommended_stock} units."
    
    return {
        "recommended_stock": recommended_stock,
        "order_quantity": order_quantity,
        "recommendation": recommendation,
        "urgency": urgency,
        "days_remaining": int(days_remaining) if isinstance(days_remaining, (int, float)) and days_remaining != float('inf') else None,
        "safety_stock": safety_stock
    }

