"""
AgriOne Soil Interpretation & Nutrient Engine
Interprets chemical and physical soil health test parameters (pH, EC, Organic Carbon, N, P, K, Micronutrients),
classifies nutrient availability, and calculates precise mineral and bio-fertilizer dosages.
"""
from typing import Dict, Any, List

def interpret_soil_test(
    ph: float,
    ec_ds_m: float,
    organic_carbon_pct: float,
    available_n_kgha: float,
    available_p_kgha: float,
    available_k_kgha: float,
    zinc_ppm: float = 0.8,
    iron_ppm: float = 5.2,
    target_crop: str = "wheat"
) -> Dict[str, Any]:
    # 1. Soil Reaction (pH)
    if ph < 5.5:
        ph_class = "Strongly Acidic"
        ph_remedy = f"Apply Agricultural Lime (CaCO3) @ 1.5 - 2.0 tonnes/ha to neutralize soil acidity and unlock phosphorus."
    elif 5.5 <= ph < 6.5:
        ph_class = "Moderately Acidic"
        ph_remedy = "Slight acidity; suitable for most crops. Supplement with rock phosphate or dolomite."
    elif 6.5 <= ph <= 7.5:
        ph_class = "Neutral / Optimal"
        ph_remedy = "Ideal soil pH! Maximum availability of macro and micronutrients."
    elif 7.5 < ph <= 8.5:
        ph_class = "Moderately Alkaline"
        ph_remedy = "Elevated alkalinity. Apply elemental sulfur or gypsum @ 500 kg/ha with organic manure to lower pH."
    else:
        ph_class = "Strongly Alkaline / Saline-Sodic"
        ph_remedy = "High sodium hazard. Apply Agricultural Gypsum (CaSO4) @ 2.5 tonnes/ha followed by leaching with clean water."
        
    # 2. Electrical Conductivity (Salinity in dS/m)
    if ec_ds_m < 1.0:
        ec_class = "Normal (Non-saline)"
    elif 1.0 <= ec_ds_m < 2.0:
        ec_class = "Slightly Saline"
    else:
        ec_class = "Harmfully Saline (High salt stress risk)"
        
    # 3. Organic Carbon (%)
    if organic_carbon_pct < 0.5:
        oc_class = "Low (Depleted Soil Organic Matter)"
        oc_rec = "Incorporate 5-8 tonnes/ha well-decomposed Farmyard Manure (FYM) or Vermicompost before sowing."
    elif 0.5 <= organic_carbon_pct <= 0.75:
        oc_class = "Medium"
        oc_rec = "Maintain organic recycling through crop residue mulching and cover cropping (Dhaincha/Sunn hemp)."
    else:
        oc_class = "High (Excellent Soil Biology)"
        oc_rec = "Rich biological soil health. Sustains high microbial microbial mineralization."
        
    # 4. Primary Macronutrients
    # Nitrogen (kg/ha)
    if available_n_kgha < 280:
        n_status = "Low"
        urea_rec_kgha = 130.0
    elif 280 <= available_n_kgha <= 560:
        n_status = "Medium"
        urea_rec_kgha = 90.0
    else:
        n_status = "High"
        urea_rec_kgha = 50.0
        
    # Phosphorus (P2O5 kg/ha)
    if available_p_kgha < 10:
        p_status = "Low"
        dap_rec_kgha = 110.0
    elif 10 <= available_p_kgha <= 25:
        p_status = "Medium"
        dap_rec_kgha = 75.0
    else:
        p_status = "High"
        dap_rec_kgha = 35.0
        
    # Potassium (K2O kg/ha)
    if available_k_kgha < 110:
        k_status = "Low"
        mop_rec_kgha = 60.0
    elif 110 <= available_k_kgha <= 280:
        k_status = "Medium"
        mop_rec_kgha = 40.0
    else:
        k_status = "High"
        mop_rec_kgha = 20.0
        
    # Micronutrient Status
    zinc_status = "Deficient" if zinc_ppm < 0.6 else "Sufficient"
    iron_status = "Deficient" if iron_ppm < 4.5 else "Sufficient"
    
    return {
        "ph": {
            "value": ph,
            "status": ph_class,
            "recommendation": ph_remedy
        },
        "salinity_ec": {
            "value_ds_m": ec_ds_m,
            "status": ec_class
        },
        "organic_carbon": {
            "percentage": organic_carbon_pct,
            "status": oc_class,
            "recommendation": oc_rec
        },
        "macronutrients": {
            "nitrogen": {
                "value_kgha": available_n_kgha,
                "status": n_status,
                "recommended_urea_kgha": urea_rec_kgha
            },
            "phosphorus": {
                "value_kgha": available_p_kgha,
                "status": p_status,
                "recommended_dap_kgha": dap_rec_kgha
            },
            "potassium": {
                "value_kgha": available_k_kgha,
                "status": k_status,
                "recommended_mop_kgha": mop_rec_kgha
            }
        },
        "micronutrients": {
            "zinc": {"value_ppm": zinc_ppm, "status": zinc_status, "remedy": "Apply Zinc Sulphate (ZnSO4 21%) @ 25 kg/ha if deficient."},
            "iron": {"value_ppm": iron_ppm, "status": iron_status, "remedy": "Foliar spray of Ferrous Sulphate (FeSO4 19%) @ 10g/L if deficient."}
        },
        "regenerative_guidance": "Incorporate Bio-NPK liquid consortia (Azotobacter, PSB, KSB) @ 1L/acre to reduce synthetic fertilizer requirement by 20-25%."
    }
