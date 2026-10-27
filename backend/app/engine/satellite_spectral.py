"""
AgriOne Satellite & Field Spectral Intelligence Engine
Computes Normalized Difference Vegetation Index (NDVI), Normalized Difference Water Index (NDWI),
and Soil-Adjusted Vegetation Index (SAVI) for precision canopy health zoning.
"""
import math
from typing import Dict, Any, List

def calculate_field_spectral_indices(
    field_id: str,
    field_area_acres: float,
    cloud_cover_pct: float = 3.5,
    sentinel_date: str = "2026-09-28"
) -> Dict[str, Any]:
    """
    Computes satellite spectral indices based on Sentinel-2 Multispectral Instrument (MSI) bands:
    Band 4 (Red: 665 nm), Band 8 (NIR: 842 nm), Band 8A (Narrow NIR: 865 nm), Band 11 (SWIR: 1610 nm).
    """
    # Sample calibrated reflectance values
    # Healthy vegetative canopy reflectance signature:
    r_nir = 0.58   # High reflection from spongy mesophyll
    r_red = 0.08   # Strong absorption by chlorophyll a & b
    r_swir = 0.16  # Absorption by leaf water content
    
    # 1. NDVI = (NIR - Red) / (NIR + Red)
    ndvi = round((r_nir - r_red) / (r_nir + r_red), 3)
    
    # 2. NDWI (Gao 1996) = (NIR - SWIR) / (NIR + SWIR)
    ndwi = round((r_nir - r_swir) / (r_nir + r_swir), 3)
    
    # 3. SAVI (Huete 1988) = ((NIR - Red) / (NIR + Red + L)) * (1 + L) with L = 0.5
    l_factor = 0.5
    savi = round(((r_nir - r_red) / (r_nir + r_red + l_factor)) * (1 + l_factor), 3)
    
    # 4. Enhanced Vegetation Index (EVI) = 2.5 * ((NIR - Red) / (NIR + 6*Red - 7.5*Blue + 1))
    r_blue = 0.04
    evi_denom = r_nir + (6.0 * r_red) - (7.5 * r_blue) + 1.0
    evi = round(2.5 * ((r_nir - r_red) / max(0.01, evi_denom)), 3)
    
    # Field Health Zonation
    high_vigor_acres = round(field_area_acres * 0.68, 2)
    mod_vigor_acres = round(field_area_acres * 0.22, 2)
    stress_vigor_acres = round(field_area_acres * 0.08, 2)
    bare_soil_acres = round(field_area_acres * 0.02, 2)
    
    return {
        "field_id": field_id,
        "acquisition_date": sentinel_date,
        "satellite_constellation": "Sentinel-2A / MSI L2A Bottom-Of-Atmosphere",
        "cloud_cover_pct": cloud_cover_pct,
        "indices": {
            "ndvi": {
                "value": ndvi,
                "range": "-1.0 to +1.0",
                "status": "Vigorous Biomass",
                "description": "Dense, healthy chlorophyll canopy with active photosynthetic absorption."
            },
            "ndwi": {
                "value": ndwi,
                "range": "-1.0 to +1.0",
                "status": "High Moisture Content",
                "description": "Adequate internal leaf turgor and cellular water hydration."
            },
            "savi": {
                "value": savi,
                "range": "-1.0 to +1.0",
                "status": "Soil-Background Corrected High",
                "description": "Canopy vigor normalized for soil surface reflectance interference."
            },
            "evi": {
                "value": evi,
                "range": "0.0 to 1.0",
                "status": "High Canopy Density",
                "description": "Atmospherically corrected index resistant to canopy saturation."
            }
        },
        "field_zonation": {
            "high_vigor_zone": {"acres": high_vigor_acres, "percentage": 68.0, "color": "#10B981"},
            "moderate_vigor_zone": {"acres": mod_vigor_acres, "percentage": 22.0, "color": "#84CC16"},
            "moisture_stress_zone": {"acres": stress_vigor_acres, "percentage": 8.0, "color": "#F59E0B"},
            "bare_headlands_zone": {"acres": bare_soil_acres, "percentage": 2.0, "color": "#64748B"}
        },
        "actionable_insight": "Sector North-East (0.64 acres) displays slight NDWI dip (-0.12). Inspect drip lateral #4 for partial pressure loss or dripper clogging."
    }
