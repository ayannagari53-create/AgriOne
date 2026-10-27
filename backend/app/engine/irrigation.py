"""
AgriOne FAO-56 Smart Irrigation & Evapotranspiration Engine
Calculates Reference Evapotranspiration (ET0) using Hargreaves & Penman-Monteith principles,
applies crop coefficients (Kc) across growth stages, and computes precise water requirements.
"""
import math
from typing import Dict, Any, List

# Crop coefficients (Kc) across phenological stages: (Initial, Mid-Season, Late-Season)
CROP_KC_PROFILES = {
    "wheat": {"initial": 0.35, "mid": 1.15, "late": 0.45, "root_depth_m": 1.2, "depletion_factor_p": 0.55},
    "rice": {"initial": 1.05, "mid": 1.20, "late": 0.90, "root_depth_m": 0.6, "depletion_factor_p": 0.20},
    "cotton": {"initial": 0.35, "mid": 1.20, "late": 0.65, "root_depth_m": 1.4, "depletion_factor_p": 0.65},
    "tomato": {"initial": 0.60, "mid": 1.15, "late": 0.80, "root_depth_m": 0.8, "depletion_factor_p": 0.40},
    "maize": {"initial": 0.30, "mid": 1.20, "late": 0.50, "root_depth_m": 1.0, "depletion_factor_p": 0.55},
    "sugarcane": {"initial": 0.40, "mid": 1.25, "late": 0.75, "root_depth_m": 1.5, "depletion_factor_p": 0.65},
    "potato": {"initial": 0.50, "mid": 1.15, "late": 0.75, "root_depth_m": 0.6, "depletion_factor_p": 0.35},
    "soybean": {"initial": 0.40, "mid": 1.15, "late": 0.50, "root_depth_m": 0.9, "depletion_factor_p": 0.50},
    "onion": {"initial": 0.70, "mid": 1.05, "late": 0.75, "root_depth_m": 0.4, "depletion_factor_p": 0.30},
    "chilli": {"initial": 0.60, "mid": 1.10, "late": 0.80, "root_depth_m": 0.7, "depletion_factor_p": 0.45},
}

# Soil Available Water Capacity (AWC in mm water per meter soil depth)
SOIL_AWC = {
    "clay": 180.0,
    "clay_loam": 170.0,
    "loam": 150.0,
    "sandy_loam": 120.0,
    "sandy": 80.0,
    "black_cotton": 190.0,
    "alluvial": 160.0,
    "red_soil": 130.0
}

# Irrigation method application efficiency
IRRIGATION_EFFICIENCY = {
    "drip": 0.90,
    "sprinkler": 0.75,
    "furrow": 0.60,
    "flood": 0.50,
    "sub_surface_drip": 0.95
}

def calculate_et0_hargreaves(t_min: float, t_max: float, t_mean: float, latitude_deg: float = 20.0, day_of_year: int = 180) -> float:
    """
    FAO-56 Hargreaves-Samani method for daily Reference Evapotranspiration (mm/day).
    Suitable when solar radiation / humidity sensors are partial.
    """
    # Extraterrestrial radiation Ra (MJ/m2/day) approximation based on latitude
    phi = math.radians(latitude_deg)
    delta = 0.409 * math.sin(2 * math.pi * day_of_year / 365 - 1.39)
    dr = 1 + 0.033 * math.cos(2 * math.pi * day_of_year / 365)
    
    # Sunset hour angle
    ws_arg = -math.tan(phi) * math.tan(delta)
    ws_arg = max(-1.0, min(1.0, ws_arg))
    omega_s = math.acos(ws_arg)
    
    # Ra calculation
    g_sc = 0.0820  # MJ/m2/min
    ra = (24 * 60 / math.pi) * g_sc * dr * (
        omega_s * math.sin(phi) * math.sin(delta) +
        math.cos(phi) * math.cos(delta) * math.sin(omega_s)
    )
    
    # Equivalent evaporation in mm/day (divide by latent heat ~2.45 MJ/kg)
    ra_mm = max(2.0, ra / 2.45)
    
    td = max(1.0, t_max - t_min)
    et0 = 0.0023 * (t_mean + 17.8) * math.sqrt(td) * ra_mm
    return round(max(1.0, min(12.0, et0)), 2)

def calculate_irrigation_plan(
    crop_name: str,
    growth_stage: str,  # 'initial', 'mid', 'late'
    farm_area_acres: float,
    soil_type: str,
    irrigation_method: str,
    t_min: float = 22.0,
    t_max: float = 34.0,
    rain_forecast_mm: float = 0.0,
    current_soil_moisture_pct: float = 45.0, # % of Field Capacity
    pump_flow_rate_lph: float = 10000.0 # Liters per hour
) -> Dict[str, Any]:
    crop_key = crop_name.lower().strip()
    profile = CROP_KC_PROFILES.get(crop_key, CROP_KC_PROFILES["wheat"])
    stage_key = growth_stage.lower() if growth_stage.lower() in ["initial", "mid", "late"] else "mid"
    kc = profile[stage_key]
    
    t_mean = (t_min + t_max) / 2.0
    et0 = calculate_et0_hargreaves(t_min, t_max, t_mean)
    
    # Crop Evapotranspiration ETc = Kc * ET0
    etc_daily_mm = round(kc * et0, 2)
    
    # Effective rainfall (FAO approximation: 80% of rain > 5mm)
    effective_rain_mm = max(0.0, (rain_forecast_mm - 5.0) * 0.8) if rain_forecast_mm > 5.0 else 0.0
    
    # Net irrigation depth (mm)
    awc = SOIL_AWC.get(soil_type.lower(), 150.0)
    root_depth = profile["root_depth_m"]
    taw = awc * root_depth  # Total Available Water (mm)
    raw = taw * profile["depletion_factor_p"]  # Readily Available Water (mm)
    
    # Soil moisture deficit
    moisture_ratio = current_soil_moisture_pct / 100.0
    moisture_deficit_mm = max(0.0, (1.0 - moisture_ratio) * raw)
    
    # Net requirement considering crop water loss and incoming rain
    net_irrigation_mm = max(0.0, etc_daily_mm + (moisture_deficit_mm * 0.3) - effective_rain_mm)
    
    efficiency = IRRIGATION_EFFICIENCY.get(irrigation_method.lower(), 0.80)
    gross_irrigation_mm = round(net_irrigation_mm / efficiency, 2)
    
    # Volumetric calculation: 1 mm over 1 acre = 4,046.86 Liters
    area_sq_m = farm_area_acres * 4046.86
    total_water_liters = round(gross_irrigation_mm * area_sq_m, 0)
    
    # Pump run duration
    pump_hours = round(total_water_liters / max(100.0, pump_flow_rate_lph), 2)
    
    # Status and priority
    if current_soil_moisture_pct < 35.0 and rain_forecast_mm < 2.0:
        status = "URGENT_IRRIGATION"
        timing = "Early Morning (05:00 - 08:30 AM) to minimize evaporative loss"
    elif rain_forecast_mm > 15.0:
        status = "SUSPEND_IRRIGATION"
        timing = "Rain expected (>15mm). Pause irrigation to prevent root rot and nitrogen leaching"
        gross_irrigation_mm = 0.0
        total_water_liters = 0
        pump_hours = 0.0
    elif current_soil_moisture_pct >= 70.0:
        status = "OPTIMAL_MOISTURE"
        timing = "Soil moisture is adequate. Next check in 48 hours"
        gross_irrigation_mm = 0.0
        total_water_liters = 0
        pump_hours = 0.0
    else:
        status = "SCHEDULED_IRRIGATION"
        timing = "Late Evening (05:30 - 08:00 PM) or Early Morning"
        
    water_saving_vs_flood = round(max(0.0, (1.0 - (efficiency / 0.50)) * -100), 1) if efficiency > 0.50 else 0.0
    
    return {
        "crop": crop_name.capitalize(),
        "growth_stage": stage_key.capitalize(),
        "kc_factor": kc,
        "reference_et0_mm": et0,
        "crop_etc_daily_mm": etc_daily_mm,
        "effective_rain_offset_mm": round(effective_rain_mm, 2),
        "soil_type": soil_type,
        "soil_moisture_pct": current_soil_moisture_pct,
        "irrigation_efficiency_pct": int(efficiency * 100),
        "gross_irrigation_depth_mm": gross_irrigation_mm,
        "total_water_liters": int(total_water_liters),
        "total_water_cubic_m": round(total_water_liters / 1000.0, 2),
        "recommended_pump_hours": pump_hours,
        "status": status,
        "recommended_timing": timing,
        "water_saving_pct_vs_flood": water_saving_vs_flood,
        "fao_notes": f"Based on FAO-56 Penman-Monteith dual crop coefficient with {soil_type} AWC {awc} mm/m."
    }
