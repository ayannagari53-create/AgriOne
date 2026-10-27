"""
AgriOne Crop Recommendation Engine
Multi-criteria agricultural decision support evaluating soil chemical profile (N, P, K, pH),
soil texture, climatic constraints (temperature, rainfall), water availability, and market economics.
"""
from typing import Dict, Any, List

CROP_DATABASE = [
    {
        "id": "wheat",
        "name": "Wheat (Triticum aestivum)",
        "category": "Cereal / Rabi",
        "min_temp": 12.0, "max_temp": 28.0, "opt_temp": 20.0,
        "min_ph": 6.0, "max_ph": 7.5,
        "n_req_kgha": 120, "p_req_kgha": 60, "k_req_kgha": 40,
        "water_req_mm": 450,
        "growing_period_days": "110 - 130 days",
        "suitable_soils": ["loam", "clay_loam", "alluvial", "black_cotton"],
        "suitable_seasons": ["rabi", "winter"],
        "yield_potential_quintal_acre": 18.5,
        "avg_market_price_per_qtl": 2425, # MSP / APMC modal
        "risk_level": "Low",
        "description": "High market liquidity staple crop with guaranteed minimum support price and stable processing demand."
    },
    {
        "id": "rice",
        "name": "Paddy Rice (Oryza sativa)",
        "category": "Cereal / Kharif",
        "min_temp": 20.0, "max_temp": 38.0, "opt_temp": 30.0,
        "min_ph": 5.5, "max_ph": 7.0,
        "n_req_kgha": 100, "p_req_kgha": 50, "k_req_kgha": 50,
        "water_req_mm": 1100,
        "growing_period_days": "120 - 150 days",
        "suitable_soils": ["clay", "clay_loam", "alluvial"],
        "suitable_seasons": ["kharif", "monsoon"],
        "yield_potential_quintal_acre": 22.0,
        "avg_market_price_per_qtl": 2320,
        "risk_level": "Medium (High water dependent)",
        "description": "Staple food crop thriving in heavy water-retaining soils with high solar radiation and canal/tube-well irrigation."
    },
    {
        "id": "cotton",
        "name": "Bt Cotton (Gossypium hirsutum)",
        "category": "Commercial Fiber",
        "min_temp": 21.0, "max_temp": 36.0, "opt_temp": 28.0,
        "min_ph": 6.0, "max_ph": 8.5,
        "n_req_kgha": 120, "p_req_kgha": 60, "k_req_kgha": 60,
        "water_req_mm": 700,
        "growing_period_days": "150 - 180 days",
        "suitable_soils": ["black_cotton", "clay_loam", "deep_loam"],
        "suitable_seasons": ["kharif", "monsoon"],
        "yield_potential_quintal_acre": 10.0,
        "avg_market_price_per_qtl": 7521,
        "risk_level": "Medium-High (pest sensitive)",
        "description": "High-value industrial cash crop suited for deep black soils with good drainage and drip irrigation."
    },
    {
        "id": "tomato",
        "name": "Tomato (Solanum lycopersicum)",
        "category": "Horticulture / Vegetable",
        "min_temp": 15.0, "max_temp": 32.0, "opt_temp": 24.0,
        "min_ph": 6.0, "max_ph": 7.0,
        "n_req_kgha": 150, "p_req_kgha": 80, "k_req_kgha": 100,
        "water_req_mm": 500,
        "growing_period_days": "90 - 110 days",
        "suitable_soils": ["sandy_loam", "loam", "red_soil"],
        "suitable_seasons": ["rabi", "kharif", "zaid"],
        "yield_potential_quintal_acre": 120.0,
        "avg_market_price_per_qtl": 1950,
        "risk_level": "Medium (price volatility)",
        "description": "Fast-cycling, high-cash-flow horticulture crop offering intensive returns when coupled with mulching and fertigation."
    },
    {
        "id": "soybean",
        "name": "Soybean (Glycine max)",
        "category": "Oilseed / Legume",
        "min_temp": 18.0, "max_temp": 34.0, "opt_temp": 26.0,
        "min_ph": 6.0, "max_ph": 7.5,
        "n_req_kgha": 30, "p_req_kgha": 60, "k_req_kgha": 40, # Fixes nitrogen naturally!
        "water_req_mm": 450,
        "growing_period_days": "90 - 105 days",
        "suitable_soils": ["black_cotton", "loam", "alluvial"],
        "suitable_seasons": ["kharif", "monsoon"],
        "yield_potential_quintal_acre": 9.5,
        "avg_market_price_per_qtl": 4892,
        "risk_level": "Low-Medium",
        "description": "Atmospheric nitrogen-fixing legume that enriches soil biology while commanding high industrial crushing demand."
    },
    {
        "id": "maize",
        "name": "Hybrid Maize (Zea mays)",
        "category": "Coarse Cereal / Feed",
        "min_temp": 18.0, "max_temp": 35.0, "opt_temp": 26.0,
        "min_ph": 5.8, "max_ph": 7.8,
        "n_req_kgha": 120, "p_req_kgha": 60, "k_req_kgha": 50,
        "water_req_mm": 500,
        "growing_period_days": "95 - 115 days",
        "suitable_soils": ["loam", "sandy_loam", "alluvial", "red_soil"],
        "suitable_seasons": ["kharif", "rabi", "zaid"],
        "yield_potential_quintal_acre": 28.0,
        "avg_market_price_per_qtl": 2225,
        "risk_level": "Low",
        "description": "Versatile C4 photosynthetic crop with high poultry feed and ethanol industrial demand and wide climatic tolerance."
    },
    {
        "id": "sugarcane",
        "name": "Sugarcane (Saccharum officinarum)",
        "category": "Commercial Cash Crop",
        "min_temp": 20.0, "max_temp": 38.0, "opt_temp": 30.0,
        "min_ph": 6.5, "max_ph": 8.0,
        "n_req_kgha": 250, "p_req_kgha": 100, "k_req_kgha": 120,
        "water_req_mm": 1800,
        "growing_period_days": "300 - 360 days",
        "suitable_soils": ["clay_loam", "alluvial", "black_cotton"],
        "suitable_seasons": ["annual"],
        "yield_potential_quintal_acre": 350.0,
        "avg_market_price_per_qtl": 340,
        "risk_level": "Low (Assured sugar mill FRP)",
        "description": "Long-duration perennial grass with assured Fair & Remunerative Price (FRP) contracts with local sugar cooperatives."
    },
    {
        "id": "chilli",
        "name": "Green/Red Chilli (Capsicum annuum)",
        "category": "Spices / Cash",
        "min_temp": 18.0, "max_temp": 35.0, "opt_temp": 25.0,
        "min_ph": 6.0, "max_ph": 7.5,
        "n_req_kgha": 120, "p_req_kgha": 60, "k_req_kgha": 60,
        "water_req_mm": 600,
        "growing_period_days": "120 - 150 days",
        "suitable_soils": ["black_cotton", "loam", "red_soil"],
        "suitable_seasons": ["kharif", "rabi"],
        "yield_potential_quintal_acre": 25.0,
        "avg_market_price_per_qtl": 14200,
        "risk_level": "Medium-High",
        "description": "High export-potential spice crop yielding extraordinary margins when virus management is rigorously executed."
    }
]

def recommend_crops(
    soil_ph: float,
    nitrogen_kg: float,
    phosphorus_kg: float,
    potassium_kg: float,
    soil_type: str,
    avg_temperature_c: float,
    water_availability: str, # 'high', 'moderate', 'low'
    season: str = "kharif"
) -> List[Dict[str, Any]]:
    scored_crops = []
    
    water_scores = {"high": 1200, "moderate": 600, "low": 350}
    max_avail_water = water_scores.get(water_availability.lower(), 600)
    
    for crop in CROP_DATABASE:
        score = 100.0
        reasons = []
        cautions = []
        
        # 1. Soil pH fitness
        if crop["min_ph"] <= soil_ph <= crop["max_ph"]:
            reasons.append(f"Optimal soil pH: Field pH {soil_ph:.1f} aligns with {crop['min_ph']}-{crop['max_ph']} range.")
        else:
            ph_diff = min(abs(soil_ph - crop["min_ph"]), abs(soil_ph - crop["max_ph"]))
            penalty = min(35.0, ph_diff * 20.0)
            score -= penalty
            cautions.append(f"Suboptimal pH ({soil_ph:.1f}). Needs amendment (lime/gypsum) for best nutrient uptake.")
            
        # 2. Temperature fitness
        if crop["min_temp"] <= avg_temperature_c <= crop["max_temp"]:
            reasons.append(f"Favorable climate: Average temperature {avg_temperature_c:.1f}°C fits the crop thermal window.")
        else:
            temp_diff = min(abs(avg_temperature_c - crop["min_temp"]), abs(avg_temperature_c - crop["max_temp"]))
            score -= min(40.0, temp_diff * 5.0)
            cautions.append(f"Temperature {avg_temperature_c:.1f}°C is outside preferred {crop['min_temp']}-{crop['max_temp']}°C range.")
            
        # 3. Soil type compatibility
        soil_clean = soil_type.lower().replace(" ", "_")
        if soil_clean in crop["suitable_soils"]:
            reasons.append(f"Soil structure match: {soil_type.replace('_', ' ').capitalize()} supports ideal root penetration.")
        else:
            score -= 15.0
            cautions.append(f"{soil_type.capitalize()} soil may require targeted organic matter conditioning.")
            
        # 4. Water availability constraint
        if crop["water_req_mm"] > max_avail_water + 150:
            deficit = crop["water_req_mm"] - max_avail_water
            score -= min(35.0, (deficit / 100.0) * 8.0)
            cautions.append(f"Water requirement ({crop['water_req_mm']}mm) exceeds available water ({max_avail_water}mm). Drip irrigation mandatory.")
        else:
            reasons.append(f"Water supply adequate ({crop['water_req_mm']}mm requirement met by current farm capacity).")
            
        # 5. Nitrogen & Phosphorus nutrient synergy
        n_ratio = nitrogen_kg / max(1.0, crop["n_req_kgha"])
        if 0.7 <= n_ratio <= 1.4:
            reasons.append("Native soil Nitrogen profile is well-balanced for this crop's nutritional needs.")
        elif n_ratio < 0.7:
            cautions.append(f"Requires starter Nitrogen booster ({crop['n_req_kgha'] - nitrogen_kg:.0f} kg/ha additional N).")
            
        # Calculate gross revenue potential per acre
        est_revenue_acre = round(crop["yield_potential_quintal_acre"] * crop["avg_market_price_per_qtl"], 0)
        
        final_score = max(10, min(99, int(score)))
        
        scored_crops.append({
            "id": crop["id"],
            "name": crop["name"],
            "category": crop["category"],
            "match_score": final_score,
            "growing_period": crop["growing_period_days"],
            "water_requirement_mm": crop["water_req_mm"],
            "yield_potential_quintal_acre": crop["yield_potential_quintal_acre"],
            "avg_market_price_per_qtl": crop["avg_market_price_per_qtl"],
            "estimated_gross_revenue_acre": est_revenue_acre,
            "risk_level": crop["risk_level"],
            "why_it_fits": reasons,
            "agronomic_cautions": cautions,
            "description": crop["description"]
        })
        
    scored_crops.sort(key=lambda x: x["match_score"], reverse=True)
    return scored_crops
