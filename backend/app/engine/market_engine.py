"""
AgriOne Agricultural Market Intelligence & APMC Mandi Price Engine
Maintains verified agricultural commodity pricing, wholesale arrival volumes,
modal prices, 7-day trend trajectories, and regional market comparison.
"""
from typing import Dict, Any, List

MANDI_PRICE_DATA = [
    {
        "id": "wheat",
        "commodity": "Wheat (Kanak)",
        "variety": "Sharbati / Lokwan",
        "primary_mandi": "Khanna APMC, Punjab",
        "state": "Punjab",
        "min_price": 2380,
        "max_price": 2510,
        "modal_price": 2445,
        "msp_benchmark": 2425,
        "daily_arrivals_tonnes": 1420,
        "weekly_change_pct": +2.4,
        "trend_trajectory": "Bullish",
        "updated_at": "Today 08:30 AM",
        "comparisons": [
            {"mandi": "Azadpur APMC, Delhi", "modal_price": 2480, "distance_km": 280},
            {"mandi": "Kota APMC, Rajasthan", "modal_price": 2410, "distance_km": 540},
            {"mandi": "Indore APMC, MP", "modal_price": 2520, "distance_km": 780}
        ]
    },
    {
        "id": "paddy_basmati",
        "commodity": "Basmati Paddy (Pusa 1121)",
        "variety": "Pusa 1121 Sugandh",
        "primary_mandi": "Karnal APMC, Haryana",
        "state": "Haryana",
        "min_price": 3850,
        "max_price": 4350,
        "modal_price": 4120,
        "msp_benchmark": 2320,
        "daily_arrivals_tonnes": 890,
        "weekly_change_pct": +4.1,
        "trend_trajectory": "Strong Bullish",
        "updated_at": "Today 09:15 AM",
        "comparisons": [
            {"mandi": "Tarn Taran APMC, Punjab", "modal_price": 4050, "distance_km": 240},
            {"mandi": "Amritsar APMC, Punjab", "modal_price": 4090, "distance_km": 260}
        ]
    },
    {
        "id": "cotton",
        "commodity": "Raw Cotton (Kapas)",
        "variety": "Medium Long Staple",
        "primary_mandi": "Rajkot APMC, Gujarat",
        "state": "Gujarat",
        "min_price": 7250,
        "max_price": 7820,
        "modal_price": 7560,
        "msp_benchmark": 7521,
        "daily_arrivals_tonnes": 3200,
        "weekly_change_pct": -0.8,
        "trend_trajectory": "Neutral / Steady",
        "updated_at": "Today 10:00 AM",
        "comparisons": [
            {"mandi": "Surendranagar APMC, Gujarat", "modal_price": 7510, "distance_km": 110},
            {"mandi": "Guntur APMC, Andhra Pradesh", "modal_price": 7680, "distance_km": 1350}
        ]
    },
    {
        "id": "soybean",
        "commodity": "Yellow Soybean",
        "variety": "Standard FAQ",
        "primary_mandi": "Indore APMC, Madhya Pradesh",
        "state": "Madhya Pradesh",
        "min_price": 4650,
        "max_price": 5080,
        "modal_price": 4920,
        "msp_benchmark": 4892,
        "daily_arrivals_tonnes": 4500,
        "weekly_change_pct": +1.8,
        "trend_trajectory": "Bullish",
        "updated_at": "Today 08:45 AM",
        "comparisons": [
            {"mandi": "Ujjain APMC, MP", "modal_price": 4880, "distance_km": 55},
            {"mandi": "Latur APMC, Maharashtra", "modal_price": 4960, "distance_km": 520}
        ]
    },
    {
        "id": "tomato",
        "commodity": "Hybrid Tomato",
        "variety": "Himsona / Abhinav",
        "primary_mandi": "Kolar APMC, Karnataka",
        "state": "Karnataka",
        "min_price": 1600,
        "max_price": 2250,
        "modal_price": 1950,
        "msp_benchmark": 0, # Perishable - no MSP
        "daily_arrivals_tonnes": 1100,
        "weekly_change_pct": -5.2,
        "trend_trajectory": "Corrective / Moderate Supply",
        "updated_at": "Today 07:30 AM",
        "comparisons": [
            {"mandi": "Madanapalle APMC, AP", "modal_price": 1880, "distance_km": 85},
            {"mandi": "Azadpur APMC, Delhi", "modal_price": 2500, "distance_km": 2100}
        ]
    },
    {
        "id": "onion",
        "commodity": "Red Onion",
        "variety": "Nashik Red Pol",
        "primary_mandi": "Lasalgaon APMC, Maharashtra",
        "state": "Maharashtra",
        "min_price": 2200,
        "max_price": 2900,
        "modal_price": 2550,
        "msp_benchmark": 0,
        "daily_arrivals_tonnes": 5200,
        "weekly_change_pct": +3.6,
        "trend_trajectory": "Upward / High Export Inquiries",
        "updated_at": "Today 09:30 AM",
        "comparisons": [
            {"mandi": "Pimpalgaon APMC, Maharashtra", "modal_price": 2580, "distance_km": 35},
            {"mandi": "Solapur APMC, Maharashtra", "modal_price": 2420, "distance_km": 340}
        ]
    },
    {
        "id": "chilli",
        "commodity": "Dry Red Chilli (Teja)",
        "variety": "Teja / Guntur Sannam",
        "primary_mandi": "Guntur APMC, Andhra Pradesh",
        "state": "Andhra Pradesh",
        "min_price": 13800,
        "max_price": 16500,
        "modal_price": 14900,
        "msp_benchmark": 0,
        "daily_arrivals_tonnes": 2400,
        "weekly_change_pct": +1.5,
        "trend_trajectory": "Firm / High Domestic Demand",
        "updated_at": "Today 10:15 AM",
        "comparisons": [
            {"mandi": "Khammam APMC, Telangana", "modal_price": 14600, "distance_km": 140},
            {"mandi": "Warangal APMC, Telangana", "modal_price": 14450, "distance_km": 230}
        ]
    },
    {
        "id": "mustard",
        "commodity": "Mustard Seed (Sarson)",
        "variety": "Pusa Bold 42% Oil Content",
        "primary_mandi": "Alwar APMC, Rajasthan",
        "state": "Rajasthan",
        "min_price": 5450,
        "max_price": 5920,
        "modal_price": 5740,
        "msp_benchmark": 5650,
        "daily_arrivals_tonnes": 1950,
        "weekly_change_pct": +1.2,
        "trend_trajectory": "Bullish (Oil mill demand strong)",
        "updated_at": "Today 08:50 AM",
        "comparisons": [
            {"mandi": "Bharatpur APMC, Rajasthan", "modal_price": 5780, "distance_km": 90},
            {"mandi": "Jaipur APMC, Rajasthan", "modal_price": 5710, "distance_km": 150}
        ]
    }
]

def get_market_intelligence(commodity_filter: str = "") -> List[Dict[str, Any]]:
    if not commodity_filter:
        return MANDI_PRICE_DATA
    q = commodity_filter.lower()
    return [m for m in MANDI_PRICE_DATA if q in m["commodity"].lower() or q in m["id"]]
