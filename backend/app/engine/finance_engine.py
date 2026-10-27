"""
AgriOne Agricultural Finance, Crop Insurance & Risk Engine
Calculates Pradhan Mantri Fasal Bima Yojana (PMFBY) insurance premiums,
yield indemnity thresholds, input cost structures, and farm profitability metrics.
"""
from typing import Dict, Any

INSURANCE_RATES = {
    "kharif_food_oilseeds": {"farmer_share_pct": 2.0, "description": "Food & Oilseed crops in Kharif season"},
    "rabi_food_oilseeds": {"farmer_share_pct": 1.5, "description": "Food & Oilseed crops in Rabi season"},
    "annual_commercial_horticulture": {"farmer_share_pct": 5.0, "description": "Cotton, Sugarcane, Tomato, Chilli, Horticulture"}
}

def calculate_crop_insurance(
    crop_name: str,
    farm_acres: float,
    sum_insured_per_acre: float = 38000.0,
    season: str = "kharif"
) -> Dict[str, Any]:
    crop_l = crop_name.lower()
    
    if any(h in crop_l for h in ["cotton", "tomato", "chilli", "sugarcane", "onion"]):
        rate_info = INSURANCE_RATES["annual_commercial_horticulture"]
    elif season.lower() == "rabi":
        rate_info = INSURANCE_RATES["rabi_food_oilseeds"]
    else:
        rate_info = INSURANCE_RATES["kharif_food_oilseeds"]
        
    farmer_pct = rate_info["farmer_share_pct"]
    total_sum_insured = farm_acres * sum_insured_per_acre
    
    # Actuarial premium ~12.5%, of which farmer pays 1.5% - 5%, remainder subsidized 50:50 by Central & State Govt
    actuarial_rate_pct = 12.5
    total_gross_premium = round((actuarial_rate_pct / 100.0) * total_sum_insured, 2)
    farmer_payable_premium = round((farmer_pct / 100.0) * total_sum_insured, 2)
    govt_subsidy_amount = round(total_gross_premium - farmer_payable_premium, 2)
    
    # Threshold yield calculation (typically 7-year historical average * indemnity level 80%)
    indemnity_level_pct = 80.0
    
    return {
        "crop": crop_name.capitalize(),
        "insured_acres": farm_acres,
        "sum_insured_per_acre": sum_insured_per_acre,
        "total_sum_insured": total_sum_insured,
        "farmer_share_rate_pct": farmer_pct,
        "farmer_payable_premium_rs": farmer_payable_premium,
        "govt_subsidy_benefit_rs": govt_subsidy_amount,
        "total_actuarial_premium_rs": total_gross_premium,
        "indemnity_coverage_pct": indemnity_level_pct,
        "scheme": "PM-Fasal Bima Yojana (PMFBY)",
        "coverage_events": [
            "Prevented Sowing / Planting risk due to deficit rainfall",
            "Mid-season adversity (drought, dry spells, severe pest infestation)",
            "Post-harvest losses up to 14 days for unbundled crops drying in field",
            "Localized calamities (hailstorm, landslide, inundation, cloudburst)"
        ]
    }
