"""
Google Trends Integration Module
Fetches trending data using pytrends library
"""

from pytrends.request import TrendReq
from typing import List, Dict, Any, Optional
import pandas as pd
import time


def get_google_trends(
    keywords: List[str],
    geo: str = "KE",
    timeframe: str = "today 12-m"
) -> Dict[str, Any]:
    """
    Get Google Trends data for keywords
    
    Args:
        keywords: List of keywords (1-5)
        geo: Geographic location code (default: KE for Kenya)
        timeframe: Timeframe for trends (e.g., "today 12-m", "today 3-m")
    
    Returns:
        Dictionary with trends data
    """
    if not keywords or len(keywords) == 0:
        raise ValueError("At least one keyword is required")
    
    if len(keywords) > 5:
        raise ValueError("Maximum 5 keywords allowed")
    
    try:
        # Initialize pytrends
        pytrends = TrendReq(hl='en-US', tz=360)  # Timezone offset for Kenya (UTC+3)
        
        # Build payload
        pytrends.build_payload(
            kw_list=keywords,
            geo=geo,
            timeframe=timeframe
        )
        
        # Get interest over time
        interest_over_time = pytrends.interest_over_time()
        
        # Get related queries
        try:
            related_queries = pytrends.related_queries()
        except:
            related_queries = {}
        
        # Get trending searches
        try:
            trending_searches = pytrends.trending_searches(pn=geo.lower())
        except:
            trending_searches = None
        
        # Process interest over time data
        processed_data = {}
        if not interest_over_time.empty:
            # Convert to dict with date strings
            for keyword in keywords:
                if keyword in interest_over_time.columns:
                    keyword_data = interest_over_time[keyword].to_dict()
                    processed_data[keyword] = {
                        str(date): int(value) for date, value in keyword_data.items()
                    }
            
            # Calculate summary statistics
            summary = {}
            for keyword in keywords:
                if keyword in processed_data:
                    values = list(processed_data[keyword].values())
                    if values:
                        summary[keyword] = {
                            "average": float(sum(values) / len(values)),
                            "max": int(max(values)),
                            "min": int(min(values)),
                            "latest": int(values[-1]) if values else 0,
                            "trend": "increasing" if len(values) >= 2 and values[-1] > values[0] else "decreasing"
                        }
        else:
            # No data available
            for keyword in keywords:
                processed_data[keyword] = {}
                summary[keyword] = {
                    "average": 0,
                    "max": 0,
                    "min": 0,
                    "latest": 0,
                    "trend": "no_data"
                }
        
        # Process related queries
        related_data = {}
        if related_queries:
            for keyword in keywords:
                if keyword in related_queries and related_queries[keyword]:
                    related_data[keyword] = {
                        "rising": related_queries[keyword].get('rising', pd.DataFrame()).to_dict('records')[:10] if isinstance(related_queries[keyword].get('rising'), pd.DataFrame) else [],
                        "top": related_queries[keyword].get('top', pd.DataFrame()).to_dict('records')[:10] if isinstance(related_queries[keyword].get('top'), pd.DataFrame) else []
                    }
        
        # Rate limiting - wait a bit between requests
        time.sleep(1)
        
        return {
            "interest_over_time": processed_data,
            "summary": summary,
            "related_queries": related_data,
            "trending_searches": trending_searches.to_dict('records')[:20].tolist() if trending_searches is not None and not trending_searches.empty else []
        }
    
    except Exception as e:
        # Return error information but don't fail completely
        return {
            "error": str(e),
            "interest_over_time": {kw: {} for kw in keywords},
            "summary": {kw: {"average": 0, "max": 0, "min": 0, "latest": 0, "trend": "error"} for kw in keywords},
            "related_queries": {},
            "trending_searches": []
        }


def get_trending_keywords(geo: str = "KE", limit: int = 20) -> List[str]:
    """
    Get currently trending keywords in a region
    
    Args:
        geo: Geographic location code
        limit: Maximum number of keywords to return
    
    Returns:
        List of trending keywords
    """
    try:
        pytrends = TrendReq(hl='en-US', tz=360)
        trending = pytrends.trending_searches(pn=geo.lower())
        
        if trending is not None and not trending.empty:
            return trending[0].head(limit).tolist()
        
        return []
    except Exception as e:
        print(f"Error fetching trending keywords: {str(e)}")
        return []

