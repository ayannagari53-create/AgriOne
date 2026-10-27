"""
AgriOne Livestock & Dairy Intelligence Engine
Tracks cattle herd health, daily milk yield curves, feed conversion ratios (FCR),
lactation phases, and mandatory vaccination schedules.
"""
from typing import Dict, Any, List

SAMPLE_HERD = [
    {
        "tag_id": "C-104",
        "name": "Kamdhenu",
        "breed": "Gir (Indigenous Zebu)",
        "category": "Milking Cow",
        "age_years": 4.5,
        "lactation_stage": "Peak Lactation (Day 62)",
        "daily_yield_liters": 16.5,
        "fat_percentage": 4.8,
        "snf_percentage": 9.1,
        "health_status": "Excellent",
        "last_insemination": "2026-06-12",
        "upcoming_vaccination": {"name": "FMD (Foot & Mouth Disease)", "due_date": "2026-10-18"},
        "ration_plan": {
            "green_fodder_kg": 25.0, # Napier grass / Berseem
            "dry_fodder_kg": 6.0,    # Wheat straw
            "concentrate_feed_kg": 4.5, # 22% CP cattle pellet
            "mineral_mixture_g": 60
        }
    },
    {
        "tag_id": "C-108",
        "name": "Gauri",
        "breed": "Murrah Buffalo",
        "category": "Milking Buffalo",
        "age_years": 5.2,
        "lactation_stage": "Mid Lactation (Day 145)",
        "daily_yield_liters": 14.2,
        "fat_percentage": 7.4,
        "snf_percentage": 9.4,
        "health_status": "Healthy",
        "last_insemination": "2026-03-20",
        "upcoming_vaccination": {"name": "Haemorrhagic Septicaemia (HS)", "due_date": "2026-11-05"},
        "ration_plan": {
            "green_fodder_kg": 30.0,
            "dry_fodder_kg": 8.0,
            "concentrate_feed_kg": 5.0,
            "mineral_mixture_g": 80
        }
    },
    {
        "tag_id": "C-112",
        "name": "Nandi",
        "breed": "Sahiwal",
        "category": "Dry Cow / Pregnant (7th Month)",
        "age_years": 6.0,
        "lactation_stage": "Dry Period",
        "daily_yield_liters": 0.0,
        "fat_percentage": 0.0,
        "snf_percentage": 0.0,
        "health_status": "Gestating / Good",
        "last_insemination": "2026-02-14",
        "upcoming_vaccination": {"name": "Black Quarter (BQ)", "due_date": "2026-10-25"},
        "ration_plan": {
            "green_fodder_kg": 20.0,
            "dry_fodder_kg": 7.0,
            "concentrate_feed_kg": 2.5,
            "mineral_mixture_g": 50
        }
    }
]

def calculate_feed_and_yield_stats(herd: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    active_herd = herd if herd else SAMPLE_HERD
    total_animals = len(active_herd)
    milking_cows = [a for a in active_herd if a["daily_yield_liters"] > 0]
    total_daily_milk_liters = sum(a["daily_yield_liters"] for a in active_herd)
    avg_yield_per_milking = total_daily_milk_liters / max(1, len(milking_cows))
    
    avg_fat = sum(a["fat_percentage"] for a in milking_cows) / max(1, len(milking_cows))
    avg_snf = sum(a["snf_percentage"] for a in milking_cows) / max(1, len(milking_cows))
    
    # Revenue estimate based on dairy cooperative fat+snf formula (~Rs 42/L cow, ~Rs 58/L buffalo)
    est_daily_milk_revenue = round(total_daily_milk_liters * 49.5, 0)
    
    return {
        "total_animals": total_animals,
        "milking_count": len(milking_cows),
        "total_daily_milk_liters": round(total_daily_milk_liters, 1),
        "avg_yield_per_animal": round(avg_yield_per_milking, 1),
        "herd_avg_fat_pct": round(avg_fat, 2),
        "herd_avg_snf_pct": round(avg_snf, 2),
        "estimated_daily_milk_revenue_rs": est_daily_milk_revenue,
        "herd": active_herd
    }
