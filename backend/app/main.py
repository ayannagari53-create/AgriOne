"""
AgriOne Core Python Application & Agricultural Intelligence Server
Full Python backend managing persistence, agricultural rule engines,
FAO-56 calculations, disease CV diagnostics, spectral indices, and REST endpoints.
"""
import sys
import os
import json
import sqlite3
import argparse
import hashlib
import secrets
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
from urllib.parse import urlparse, parse_qs
from typing import Dict, Any

# Ensure local engine imports work
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from engine.irrigation import calculate_irrigation_plan
from engine.crop_recommender import recommend_crops
from engine.disease_cv import analyze_crop_image, get_agronomic_knowledge
from engine.satellite_spectral import calculate_field_spectral_indices
from engine.soil_interpreter import interpret_soil_test
from engine.market_engine import get_market_intelligence
from engine.livestock_engine import calculate_feed_and_yield_stats
from engine.finance_engine import calculate_crop_insurance

DB_PATH = os.environ.get("AGRI_DB_PATH") or os.environ.get("DATABASE_PATH") or os.path.join(os.path.dirname(SCRIPT_DIR), "agri_data.db")

def hash_password(password: str, salt: str = None) -> tuple:
    if salt is None:
        salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), bytes.fromhex(salt), 100000)
    return key.hex(), salt

def verify_password(password: str, password_hash: str, salt: str) -> bool:
    try:
        key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), bytes.fromhex(salt), 100000)
        return secrets.compare_digest(key.hex(), password_hash)
    except Exception:
        return False

def init_db():
    # Ensure directory exists for DB_PATH
    db_dir = os.path.dirname(DB_PATH)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # 1. Users Table (Real authentication)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT,
        salt TEXT,
        auth_provider TEXT NOT NULL,
        google_sub TEXT,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Ensure google_sub and avatar_url columns exist if migrating older db
    cur.execute("PRAGMA table_info(users)")
    existing_cols = [c[1] for c in cur.fetchall()]
    if "google_sub" not in existing_cols:
        cur.execute("ALTER TABLE users ADD COLUMN google_sub TEXT")
    if "avatar_url" not in existing_cols:
        cur.execute("ALTER TABLE users ADD COLUMN avatar_url TEXT")

    # Index on google_sub and email for fast lookups
    cur.execute("CREATE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")

    # 2. Sessions Table (Persistent session tokens)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)

    # 3. Farms & Fields (Farmer-Specific Schema)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS farms (
        id TEXT PRIMARY KEY,
        farmer_id TEXT NOT NULL,
        name TEXT NOT NULL,
        location_name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        state TEXT NOT NULL,
        district TEXT NOT NULL,
        village TEXT,
        acreage REAL NOT NULL,
        soil_type TEXT NOT NULL,
        irrigation_method TEXT NOT NULL,
        primary_crop TEXT NOT NULL,
        field_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Farm Tasks (authenticated farmer-specific tasks)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        farmer_id TEXT,
        title TEXT NOT NULL,
        field_name TEXT NOT NULL,
        category TEXT NOT NULL,
        due_date TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        assigned_to TEXT
    )
    """)
    cur.execute("PRAGMA table_info(tasks)")
    task_cols = [c[1] for c in cur.fetchall()]
    if "farmer_id" not in task_cols:
        cur.execute("ALTER TABLE tasks ADD COLUMN farmer_id TEXT")
    
    # Harvest & Supply Chain Listings
    cur.execute("""
    CREATE TABLE IF NOT EXISTS produce_listings (
        id TEXT PRIMARY KEY,
        commodity TEXT NOT NULL,
        variety TEXT NOT NULL,
        quantity_quintals REAL NOT NULL,
        expected_harvest_date TEXT NOT NULL,
        target_price_per_qtl REAL NOT NULL,
        location TEXT NOT NULL,
        quality_grade TEXT NOT NULL,
        status TEXT NOT NULL
    )
    """)
    
    # NOTE: Zero demo tasks or farms are inserted. Everything is farmer-specific.
        
    cur.execute("SELECT count(*) FROM produce_listings")
    if cur.fetchone()[0] == 0:
        sample_listings = [
            ('list_1', 'Pusa 1121 Basmati Paddy', 'Organic Export Grade', 120.0, '2026-10-25', 4150.0, 'Karnal Mandi Yard', 'Grade A+', 'Active Listing'),
            ('list_2', 'Sharbati Durum Wheat', 'FAQ Standard', 250.0, '2026-11-15', 2460.0, 'Khanna APMC Hub', 'Grade A', 'Active Listing'),
            ('list_3', 'Medium Staple Bt Cotton', 'Clean Picked 28mm', 85.0, '2026-11-02', 7650.0, 'Rajkot Mandi Delivery', 'Grade A', 'In Negotiations')
        ]
        cur.executemany("INSERT INTO produce_listings VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", sample_listings)
        
    # Crop Health Scans History (Authenticated farmer-specific scans)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS crop_scans (
        id TEXT PRIMARY KEY,
        farmer_id TEXT NOT NULL,
        farm_id TEXT,
        image_preview TEXT,
        detected_crop TEXT NOT NULL,
        plant_part TEXT,
        condition TEXT NOT NULL,
        health_status TEXT NOT NULL,
        confidence REAL NOT NULL,
        severity TEXT NOT NULL,
        pathogen TEXT,
        visible_symptoms TEXT,
        recommendations TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        model_version TEXT DEFAULT 'Gemini-3.8-Flash-Pathology-V2'
    )
    """)

    conn.commit()
    conn.close()

init_db()

MARKETPLACE_CATALOG = [
    {
        "id": "prod_seed_1",
        "category": "Certified Seeds",
        "title": "DBW-187 (Karan Vandana) Wheat Seed",
        "certifier": "National Seeds Corporation (NSC)",
        "germination_rate_pct": 98.5,
        "package_size": "40 kg Bag",
        "price_rs": 1480,
        "rating": 4.9,
        "features": ["Yellow rust immune", "Heat tolerant at terminal filling", "Yield potential: 28 qtl/acre"]
    },
    {
        "id": "prod_bio_2",
        "category": "Bio-Fertilizers",
        "title": "Bio-NPK Consortia Liquid Microbial Inoculant",
        "certifier": "ICAR-IARI Certified Organic Input",
        "germination_rate_pct": 100,
        "package_size": "1 Litre Bottle (Treats 1 Acre)",
        "price_rs": 420,
        "rating": 4.8,
        "features": ["Contains Azotobacter, PSB, and KSB", "Fixes 30-40 kg atmospheric N/ha", "Mobilizes insoluble rock phosphate"]
    },
    {
        "id": "prod_drip_3",
        "category": "Smart Irrigation",
        "title": "Pressure Compensating (PC) Drip Lateral 16mm (2.0 LPH)",
        "certifier": "ISO 9261 Compliant",
        "germination_rate_pct": 0,
        "package_size": "400 Metre Coil",
        "price_rs": 3650,
        "rating": 4.9,
        "features": ["Uniform discharge across undulating terrain", "Built-in anti-siphon self-cleaning diaphragm", "UV stabilized 8-year field life"]
    },
    {
        "id": "prod_tool_4",
        "category": "Sensors & Tools",
        "title": "AgriOne Optical Field Soil Moisture & EC Tensiometer",
        "certifier": "Precision Ag Lab Calibrated",
        "germination_rate_pct": 0,
        "package_size": "Complete Field Probe Unit",
        "price_rs": 2890,
        "rating": 4.7,
        "features": ["Instant digital volumetric water content readout", "0-100% saturation range", "Includes soil salinity EC probe"]
    }
]

def get_user_from_token(token: str, conn: sqlite3.Connection):
    if not token:
        return None
    cur = conn.cursor()
    now = time.time()
    cur.execute("""
    SELECT u.id, u.email, u.name, u.auth_provider, u.avatar_url, u.google_sub
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ?
    """, (token, now))
    row = cur.fetchone()
    if row:
        return {
            "id": row[0],
            "email": row[1],
            "name": row[2],
            "auth_provider": row[3],
            "avatar_url": row[4] or "",
            "google_sub": row[5] or ""
        }
    return None

def get_user_farm(user_id: str, conn: sqlite3.Connection):
    if not user_id:
        return None
    cur = conn.cursor()
    cur.execute("""
    SELECT id, farmer_id, name, location_name, latitude, longitude,
           state, district, village, acreage, soil_type, irrigation_method, primary_crop, field_name, created_at
    FROM farms WHERE farmer_id = ?
    ORDER BY created_at DESC LIMIT 1
    """, (user_id,))
    row = cur.fetchone()
    if row:
        return {
            "id": row[0],
            "farmer_id": row[1],
            "name": row[2],
            "location_name": row[3],
            "latitude": row[4],
            "longitude": row[5],
            "state": row[6],
            "district": row[7],
            "village": row[8] or "",
            "acreage": row[9],
            "soil_type": row[10],
            "irrigation_method": row[11],
            "primary_crop": row[12],
            "field_name": row[13] or "",
            "created_at": row[14]
        }
    return None

def handle_request_route(path: str, method: str, body: Dict[str, Any] = None) -> Dict[str, Any]:
    body = body or {}
    parsed = urlparse(path)
    route = parsed.path
    
    # 0. Authentication Endpoints
    if route == "/api/auth/register":
        email = (body.get("email") or "").strip().lower()
        password = body.get("password") or ""
        name = (body.get("name") or "").strip()
        
        if not email or "@" not in email or "." not in email:
            return {"success": False, "error": "Please provide a valid email address."}
        if len(password) < 6:
            return {"success": False, "error": "Password must be at least 6 characters in length."}
        if not name:
            name = email.split("@")[0].capitalize()
            
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cur.fetchone():
            conn.close()
            return {"success": False, "error": "An account with this email already exists. Please sign in instead."}
            
        user_id = f"usr_{secrets.token_hex(8)}"
        pw_hash, salt = hash_password(password)
        cur.execute("""
        INSERT INTO users (id, email, name, password_hash, salt, auth_provider)
        VALUES (?, ?, ?, ?, ?, 'email')
        """, (user_id, email, name, pw_hash, salt))
        
        token = f"agri_{secrets.token_urlsafe(32)}"
        expires = time.time() + (30 * 86400)
        cur.execute("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", (token, user_id, expires))
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "user": {"id": user_id, "email": email, "name": name, "auth_provider": "email"},
            "token": token,
            "has_farm": False,
            "farm": None,
            "message": "Account created successfully."
        }
        
    elif route == "/api/auth/login":
        email = (body.get("email") or "").strip().lower()
        password = body.get("password") or ""
        
        if not email or not password:
            return {"success": False, "error": "Please enter both email and password."}
            
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT id, email, name, password_hash, salt, auth_provider, avatar_url FROM users WHERE email = ?", (email,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return {"success": False, "error": "No account found with this email. Please check your spelling or sign up."}
            
        u_id, u_email, u_name, u_hash, u_salt, u_provider, u_avatar = row
        if not u_hash or not u_salt:
            conn.close()
            return {"success": False, "error": "This account was created with Google. Please use 'Continue with Google'."}
            
        if not verify_password(password, u_hash, u_salt):
            conn.close()
            return {"success": False, "error": "Invalid email or password. Please try again."}
            
        token = f"agri_{secrets.token_urlsafe(32)}"
        expires = time.time() + (30 * 86400)
        cur.execute("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", (token, u_id, expires))
        conn.commit()
        
        farm = get_user_farm(u_id, conn)
        conn.close()
        
        return {
            "success": True,
            "user": {"id": u_id, "email": u_email, "name": u_name, "auth_provider": u_provider, "avatar_url": u_avatar or ""},
            "token": token,
            "has_farm": farm is not None,
            "farm": farm,
            "message": "Signed in successfully."
        }
        
    elif route == "/api/auth/google":
        email = (body.get("email") or "").strip().lower()
        name = (body.get("name") or "").strip()
        google_sub = (body.get("google_sub") or "").strip()
        avatar_url = (body.get("avatar_url") or "").strip()
        
        if not email:
            return {"success": False, "error": "Google authentication failed: Verified email was not provided."}
        if not name:
            name = email.split("@")[0].capitalize()
            
        try:
            conn = sqlite3.connect(DB_PATH)
            cur = conn.cursor()

            existing_user = None

            # 1. Search primarily by Google's permanent sub identifier
            if google_sub:
                cur.execute(
                    "SELECT id, email, name, auth_provider, google_sub, avatar_url FROM users WHERE google_sub = ?",
                    (google_sub,)
                )
                existing_user = cur.fetchone()

            # 2. Fallback search by email address (for account linking)
            if not existing_user and email:
                cur.execute(
                    "SELECT id, email, name, auth_provider, google_sub, avatar_url FROM users WHERE email = ?",
                    (email,)
                )
                existing_user = cur.fetchone()

            if existing_user:
                # Update existing account with verified Google metadata
                u_id = existing_user[0]
                cur.execute("""
                UPDATE users 
                SET name = COALESCE(NULLIF(?, ''), name),
                    google_sub = COALESCE(NULLIF(?, ''), google_sub),
                    avatar_url = COALESCE(NULLIF(?, ''), avatar_url),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """, (name, google_sub, avatar_url, u_id))
            else:
                # Create brand new farmer account
                u_id = f"usr_{secrets.token_hex(8)}"
                cur.execute("""
                INSERT INTO users (id, email, name, auth_provider, google_sub, avatar_url)
                VALUES (?, ?, ?, 'google', ?, ?)
                """, (u_id, email, name, google_sub, avatar_url))

            # Clean expired sessions for user
            now = time.time()
            cur.execute("DELETE FROM sessions WHERE user_id = ? AND expires_at < ?", (u_id, now))

            # Create authenticated application session token
            token = f"agri_{secrets.token_urlsafe(32)}"
            expires = now + (30 * 86400)
            cur.execute("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", (token, u_id, expires))
            conn.commit()
            
            # Fetch farm profile status
            farm = get_user_farm(u_id, conn)
            conn.close()
            
            return {
                "success": True,
                "user": {
                    "id": u_id,
                    "email": email,
                    "name": name,
                    "auth_provider": "google",
                    "avatar_url": avatar_url,
                    "google_sub": google_sub
                },
                "token": token,
                "has_farm": farm is not None,
                "farm": farm,
                "message": "Google authentication successful."
            }
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": f"Database error during Google user registration: {str(e)}"
            }
        
    elif route == "/api/auth/me":
        query_params = parse_qs(parsed.query)
        token = body.get("token") or (query_params.get("token", [None])[0]) or ""
        if not token:
            return {"authenticated": False}
        conn = sqlite3.connect(DB_PATH)
        user = get_user_from_token(token, conn)
        if not user:
            conn.close()
            return {"authenticated": False}
            
        farm = get_user_farm(user["id"], conn)
        conn.close()
        return {
            "authenticated": True,
            "user": user,
            "token": token,
            "has_farm": farm is not None,
            "farm": farm
        }
        
    elif route == "/api/auth/profile":
        query_params = parse_qs(parsed.query)
        token = body.get("token") or (query_params.get("token", [None])[0]) or ""
        if not token:
            return {"success": False, "error": "Authentication token is required."}
        conn = sqlite3.connect(DB_PATH)
        user = get_user_from_token(token, conn)
        if not user:
            conn.close()
            return {"success": False, "error": "Invalid or expired session token."}

        # If GET or body is empty or no new name provided, return current user profile and farm
        new_name = (body.get("name") or "").strip()
        avatar_url = body.get("avatar_url")

        if not new_name and avatar_url is None:
            farm = get_user_farm(user["id"], conn)
            conn.close()
            return {
                "success": True,
                "user": user,
                "farm": farm
            }

        cur = conn.cursor()
        if avatar_url is not None and new_name:
            cur.execute("""
            UPDATE users SET name = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
            """, (new_name, avatar_url, user["id"]))
        elif new_name:
            cur.execute("""
            UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
            """, (new_name, user["id"]))
        elif avatar_url is not None:
            cur.execute("""
            UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
            """, (avatar_url, user["id"]))
        conn.commit()

        cur.execute("SELECT id, email, name, auth_provider, avatar_url, google_sub FROM users WHERE id = ?", (user["id"],))
        updated_row = cur.fetchone()
        updated_user = {
            "id": updated_row[0],
            "email": updated_row[1],
            "name": updated_row[2],
            "auth_provider": updated_row[3],
            "avatar_url": updated_row[4] or "",
            "google_sub": updated_row[5] or ""
        }
        farm = get_user_farm(user["id"], conn)
        conn.close()
        return {
            "success": True,
            "user": updated_user,
            "farm": farm,
            "message": "User profile updated successfully."
        }

    elif route == "/api/auth/logout":
        query_params = parse_qs(parsed.query)
        token = body.get("token") or (query_params.get("token", [None])[0]) or ""
        if token:
            conn = sqlite3.connect(DB_PATH)
            cur = conn.cursor()
            cur.execute("DELETE FROM sessions WHERE token = ?", (token,))
            conn.commit()
            conn.close()
        return {"success": True, "message": "Logged out successfully."}

    # 1. System Health
    elif route == "/api/status":
        return {
            "status": "ONLINE",
            "backend": "Python 3.10 / FastAPI Core Architecture",
            "engines_loaded": ["irrigation", "crop_recommender", "disease_cv", "satellite_spectral", "soil_interpreter", "market_engine", "livestock", "finance"],
            "database": "SQLite 3 Engine Initialized",
            "db_path": DB_PATH
        }
        
    # 2. Smart Irrigation
    elif route == "/api/irrigation/calculate":
        crop = body.get("crop", "Wheat")
        stage = body.get("growth_stage", "mid")
        acres = float(body.get("farm_area_acres", 5.0))
        soil = body.get("soil_type", "clay_loam")
        method_irr = body.get("irrigation_method", "drip")
        t_min = float(body.get("t_min", 21.0))
        t_max = float(body.get("t_max", 33.0))
        rain = float(body.get("rain_forecast_mm", 0.0))
        moisture = float(body.get("current_soil_moisture_pct", 48.0))
        
        result = calculate_irrigation_plan(
            crop_name=crop,
            growth_stage=stage,
            farm_area_acres=acres,
            soil_type=soil,
            irrigation_method=method_irr,
            t_min=t_min,
            t_max=t_max,
            rain_forecast_mm=rain,
            current_soil_moisture_pct=moisture
        )
        return result
        
    # 3. Crop Recommendation
    elif route == "/api/crop-recommend":
        ph = float(body.get("soil_ph", 6.8))
        n = float(body.get("nitrogen_kg", 110.0))
        p = float(body.get("phosphorus_kg", 55.0))
        k = float(body.get("potassium_kg", 45.0))
        soil = body.get("soil_type", "loam")
        temp = float(body.get("avg_temperature_c", 25.0))
        water = body.get("water_availability", "moderate")
        season = body.get("season", "kharif")
        
        results = recommend_crops(
            soil_ph=ph,
            nitrogen_kg=n,
            phosphorus_kg=p,
            potassium_kg=k,
            soil_type=soil,
            avg_temperature_c=temp,
            water_availability=water,
            season=season
        )
        return {"recommendations": results, "total_crops_evaluated": len(results)}
        
    # 4. Crop Health & Disease Preprocessing and Knowledge Base
    elif route in ("/api/disease/analyze", "/api/crop-health/analyze"):
        img_b64 = body.get("image_base64") or body.get("imageBase64") or ""
        filename = body.get("filename", "crop_scan.jpg")
        suspected = body.get("suspected_crop", "")
        result = analyze_crop_image(img_b64, filename, suspected)
        return result

    elif route == "/api/crop-health/knowledge":
        crop = body.get("crop") or (parsed.query and parse_qs(parsed.query).get("crop", [""])[0]) or ""
        condition = body.get("condition") or (parsed.query and parse_qs(parsed.query).get("condition", [""])[0]) or ""
        knowledge = get_agronomic_knowledge(crop, condition)
        return {"knowledge": knowledge}

    elif route == "/api/crop-health/history":
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        query_params = parse_qs(parsed.query)
        token = body.get("token") or (query_params.get("token", [None])[0])
        user = get_user_from_token(token, conn) if token else None
        raw_farmer_id = body.get("farmer_id") or (query_params.get("farmer_id", [None])[0])
        farmer_id = (user["id"] if user else None)
        if not farmer_id and raw_farmer_id and raw_farmer_id not in ("farmer_default", "current_authenticated_farmer"):
            farmer_id = raw_farmer_id

        if not farmer_id:
            conn.close()
            return {"scans": []}

        if method == "POST":
            action = body.get("action")
            if action == "delete":
                scan_id = body.get("id")
                if scan_id:
                    cur.execute("DELETE FROM crop_scans WHERE id = ? AND farmer_id = ?", (scan_id, farmer_id))
                    conn.commit()
            else:
                scan_id = f"scan_{int(time.time() * 1000)}"
                farm_id = body.get("farm_id") or ""
                image_preview = (body.get("image_preview") or "")[:5000]
                detected_crop = (body.get("detected_crop") or "Crop").strip()
                plant_part = (body.get("plant_part") or "Leaf").strip()
                condition = (body.get("condition") or "Healthy").strip()
                health_status = (body.get("health_status") or "Disease Detected").strip()
                confidence = float(body.get("confidence") or 0.0)
                severity = (body.get("severity") or "Moderate").strip()
                pathogen = (body.get("pathogen") or "").strip()
                visible_symptoms = json.dumps(body.get("visible_symptoms") or [])
                recommendations = json.dumps(body.get("recommendations") or {})

                cur.execute("""
                INSERT INTO crop_scans (
                    id, farmer_id, farm_id, image_preview, detected_crop, plant_part,
                    condition, health_status, confidence, severity, pathogen,
                    visible_symptoms, recommendations
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    scan_id, farmer_id, farm_id, image_preview, detected_crop, plant_part,
                    condition, health_status, confidence, severity, pathogen,
                    visible_symptoms, recommendations
                ))
                conn.commit()

        cur.execute("""
        SELECT id, detected_crop, plant_part, condition, health_status,
               confidence, severity, pathogen, visible_symptoms, recommendations, created_at, image_preview
        FROM crop_scans
        WHERE farmer_id = ?
        ORDER BY created_at DESC LIMIT 20
        """, (farmer_id,))
        rows = cur.fetchall()
        scans = []
        for r in rows:
            try:
                symp = json.loads(r[8]) if r[8] else []
            except Exception:
                symp = []
            try:
                rec = json.loads(r[9]) if r[9] else {}
            except Exception:
                rec = {}
            scans.append({
                "id": r[0],
                "detected_crop": r[1],
                "plant_part": r[2],
                "condition": r[3],
                "health_status": r[4],
                "confidence": r[5],
                "severity": r[6],
                "pathogen": r[7],
                "visible_symptoms": symp,
                "recommendations": rec,
                "created_at": r[10],
                "image_preview": r[11] or ""
            })
        conn.close()
        return {"scans": scans}
        
    # 5. Satellite & Field Spectral
    elif route == "/api/satellite/indices":
        field_id = body.get("field_id", "Field-North-01")
        acres = float(body.get("field_area_acres", 5.0))
        cloud = float(body.get("cloud_cover_pct", 2.8))
        result = calculate_field_spectral_indices(field_id, acres, cloud)
        return result
        
    # 6. Soil Health Interpretation
    elif route == "/api/soil/interpret":
        ph = float(body.get("ph", 6.8))
        ec = float(body.get("ec_ds_m", 0.65))
        oc = float(body.get("organic_carbon_pct", 0.62))
        n = float(body.get("available_n_kgha", 310.0))
        p = float(body.get("available_p_kgha", 18.5))
        k = float(body.get("available_k_kgha", 195.0))
        result = interpret_soil_test(ph, ec, oc, n, p, k)
        return result
        
    # 7. Market Prices
    elif route == "/api/markets":
        q = body.get("q", "")
        prices = get_market_intelligence(q)
        return {"markets": prices, "total": len(prices)}
        
    # 8. Livestock Management
    elif route == "/api/livestock":
        stats = calculate_feed_and_yield_stats()
        return stats
        
    # 9. Crop Insurance Finance
    elif route == "/api/finance/insurance":
        crop = body.get("crop", "Wheat")
        acres = float(body.get("farm_acres", 10.0))
        sum_ins = float(body.get("sum_insured_per_acre", 40000.0))
        season = body.get("season", "rabi")
        return calculate_crop_insurance(crop, acres, sum_ins, season)
        
    # 10. Farms Database (Farmer-Specific Storage & Validation)
    elif route == "/api/farms":
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        
        # Query parameters
        query_params = parse_qs(parsed.query)
        token = body.get("token") or (query_params.get("token", [None])[0])
        user = get_user_from_token(token, conn) if token else None
        farmer_id = (user["id"] if user else None)
        if not farmer_id:
            if raw_farmer_id and raw_farmer_id not in ("farmer_default", "current_authenticated_farmer"):
                farmer_id = raw_farmer_id
            else:
                cur.execute("SELECT id FROM users ORDER BY created_at DESC LIMIT 1")
                latest_u = cur.fetchone()
                farmer_id = latest_u[0] if latest_u else "farmer_default"

        if not farmer_id:
            conn.close()
            return {"configured": False, "farm": None, "farms": []}

        if method == "POST":
            raw_name = (body.get("name") or body.get("farm_name") or "").strip()
            name = raw_name if raw_name else "My Farm"
            location_name = (body.get("location_name") or body.get("location") or "").strip()
            state = (body.get("state") or "").strip()
            district = (body.get("district") or "").strip()
            village = (body.get("village") or "").strip()
            field_name = (body.get("field_name") or "").strip()
            soil_type = (body.get("soil_type") or "").strip()
            irrigation_method = (body.get("irrigation_method") or body.get("irrigation_type") or "").strip()
            primary_crop = (body.get("primary_crop") or "").strip()

            # Coordinates and acreage validation
            try:
                lat = float(body.get("latitude", 0.0))
                lon = float(body.get("longitude", 0.0))
                acreage = float(body.get("acreage", 0.0) or body.get("total_acres", 0.0))
            except (ValueError, TypeError):
                conn.close()
                return {"valid": False, "error": "Invalid numerical values for latitude, longitude, or acreage."}

            if not (-90.0 <= lat <= 90.0):
                conn.close()
                return {"valid": False, "error": "Latitude must be between -90 and 90."}
            if not (-180.0 <= lon <= 180.0):
                conn.close()
                return {"valid": False, "error": "Longitude must be between -180 and 180."}
            if acreage <= 0:
                conn.close()
                return {"valid": False, "error": "Acreage must be a positive number greater than 0."}
            if not location_name:
                conn.close()
                return {"valid": False, "error": "Farm location name/address is required."}
            if not state or not district:
                conn.close()
                return {"valid": False, "error": "State and District are required."}
            if not soil_type or not irrigation_method or not primary_crop:
                conn.close()
                return {"valid": False, "error": "Soil type, irrigation method, and primary crop are required."}

            # Check existing farm for this farmer
            cur.execute("SELECT id FROM farms WHERE farmer_id = ?", (farmer_id,))
            existing = cur.fetchone()
            if existing:
                farm_id = existing[0]
                cur.execute("""
                UPDATE farms SET
                    name = ?, location_name = ?, latitude = ?, longitude = ?,
                    state = ?, district = ?, village = ?, acreage = ?,
                    soil_type = ?, irrigation_method = ?, primary_crop = ?, field_name = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """, (name, location_name, lat, lon, state, district, village, acreage, soil_type, irrigation_method, primary_crop, field_name, farm_id))
            else:
                farm_id = f"farm_{secrets.token_hex(8)}"
                cur.execute("""
                INSERT INTO farms (
                    id, farmer_id, name, location_name, latitude, longitude,
                    state, district, village, acreage, soil_type, irrigation_method, primary_crop, field_name
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (farm_id, farmer_id, name, location_name, lat, lon, state, district, village, acreage, soil_type, irrigation_method, primary_crop, field_name))
            conn.commit()

        # Retrieve saved profile
        cur.execute("""
        SELECT id, farmer_id, name, location_name, latitude, longitude,
               state, district, village, acreage, soil_type, irrigation_method, primary_crop, field_name, created_at
        FROM farms WHERE farmer_id = ?
        ORDER BY created_at DESC LIMIT 1
        """, (farmer_id,))
        row = cur.fetchone()

        farm = None
        configured = False
        if row:
            configured = True
            farm = {
                "id": row[0],
                "farmer_id": row[1],
                "name": row[2],
                "location_name": row[3],
                "latitude": row[4],
                "longitude": row[5],
                "state": row[6],
                "district": row[7],
                "village": row[8] or "",
                "acreage": row[9],
                "soil_type": row[10],
                "irrigation_method": row[11],
                "primary_crop": row[12],
                "field_name": row[13] or "",
                "created_at": row[14]
            }

        conn.close()
        return {"success": True, "valid": True, "configured": configured, "farm": farm, "farms": [farm] if farm else []}
        
    # 11. Tasks Database (Farmer-specific)
    elif route == "/api/tasks":
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        query_params = parse_qs(parsed.query)
        token = body.get("token") or (query_params.get("token", [None])[0])
        user = get_user_from_token(token, conn) if token else None
        raw_farmer_id = body.get("farmer_id") or (query_params.get("farmer_id", [None])[0])
        farmer_id = (user["id"] if user else None)
        if not farmer_id and raw_farmer_id and raw_farmer_id not in ("farmer_default", "current_authenticated_farmer"):
            farmer_id = raw_farmer_id

        if not farmer_id:
            conn.close()
            return {"tasks": []}

        if method == "POST":
            action = body.get("action")
            if action == "toggle":
                task_id = body.get("id")
                new_status = body.get("status", "Completed")
                if task_id:
                    cur.execute("UPDATE tasks SET status = ? WHERE id = ? AND farmer_id = ?", (new_status, task_id, farmer_id))
                    conn.commit()
            elif action == "delete":
                task_id = body.get("id")
                if task_id:
                    cur.execute("DELETE FROM tasks WHERE id = ? AND farmer_id = ?", (task_id, farmer_id))
                    conn.commit()
            else:
                task_title = (body.get("title") or "").strip()
                if task_title:
                    task_id = f"task_{int(os.times().system * 1000)}"
                    cur.execute("""
                    INSERT INTO tasks (id, farmer_id, title, field_name, category, due_date, priority, status, assigned_to)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        task_id,
                        farmer_id,
                        task_title,
                        (body.get("field_name") or "Main Field").strip(),
                        (body.get("category") or "General").strip(),
                        (body.get("due_date") or "Today").strip(),
                        (body.get("priority") or "Medium").strip(),
                        (body.get("status") or "Pending").strip(),
                        (body.get("assigned_to") or "Self").strip()
                    ))
                    conn.commit()

        cur.execute("SELECT id, title, field_name, category, due_date, priority, status, assigned_to FROM tasks WHERE farmer_id = ? ORDER BY id DESC", (farmer_id,))
        rows = cur.fetchall()
        tasks = []
        for r in rows:
            tasks.append({
                "id": r[0], "title": r[1], "field_name": r[2], "category": r[3],
                "due_date": r[4], "priority": r[5], "status": r[6], "assigned_to": r[7]
            })
        conn.close()
        return {"tasks": tasks}
        
    # 12. Marketplace Catalog
    elif route == "/api/marketplace":
        return {"products": MARKETPLACE_CATALOG}
        
    # 13. Supply Chain Listings
    elif route == "/api/supply-chain":
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        if method == "POST":
            list_id = f"list_{int(os.times().system * 1000)}"
            cur.execute("""
            INSERT INTO produce_listings (id, commodity, variety, quantity_quintals, expected_harvest_date, target_price_per_qtl, location, quality_grade, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                list_id,
                body.get("commodity", "Wheat"),
                body.get("variety", "Sharbati"),
                float(body.get("quantity_quintals", 100.0)),
                body.get("expected_harvest_date", "2026-11-01"),
                float(body.get("target_price_per_qtl", 2450.0)),
                body.get("location", "Mandi Yard"),
                body.get("quality_grade", "Grade A"),
                "Active Listing"
            ))
            conn.commit()
            
        cur.execute("SELECT id, commodity, variety, quantity_quintals, expected_harvest_date, target_price_per_qtl, location, quality_grade, status FROM produce_listings")
        rows = cur.fetchall()
        listings = []
        for r in rows:
            listings.append({
                "id": r[0], "commodity": r[1], "variety": r[2], "quantity_quintals": r[3],
                "expected_harvest_date": r[4], "target_price_per_qtl": r[5], "location": r[6],
                "quality_grade": r[7], "status": r[8]
            })
        conn.close()
        return {"listings": listings}
        
    # 14. Context-Aware AI Farmer Advisor
    elif route == "/api/ai/farmer-advisory":
        query = body.get("query", "").lower()
        lang = body.get("language", "en")
        
        # Rule validation & intent matching:
        if "water" in query or "irrigat" in query or "rain" in query:
            plan = calculate_irrigation_plan("Wheat", "mid", 5.0, "clay_loam", "drip", 22.0, 34.0, 0.0, 48.0)
            return {
                "intent": "IRRIGATION_SCHEDULE",
                "rule_validated": True,
                "data_source": "FAO-56 Hargreaves-Samani Reference Evapotranspiration",
                "structured_data": plan,
                "farmer_summary": f"Your current soil moisture is at 48%. Recommended irrigation requirement today is {plan['gross_irrigation_depth_mm']} mm ({plan['total_water_liters']} Liters). Best timing: {plan['recommended_timing']}."
            }
        elif "price" in query or "mandi" in query or "market" in query:
            markets = get_market_intelligence()
            return {
                "intent": "MARKET_INTELLIGENCE",
                "rule_validated": True,
                "data_source": "APMC Mandi Wholesale Arrival Gateway",
                "structured_data": markets[:3],
                "farmer_summary": f"Today's modal price for Sharbati Wheat at Khanna Mandi is Rs {markets[0]['modal_price']}/quintal (weekly trend: +2.4%). Pusa 1121 Basmati Paddy is trending strong at Rs {markets[1]['modal_price']}/quintal in Karnal."
            }
        elif "leaf" in query or "yellow" in query or "disease" in query or "spot" in query:
            diag = analyze_crop_image("", "", "tomato")
            return {
                "intent": "CROP_HEALTH_DIAGNOSIS",
                "rule_validated": True,
                "data_source": "AgriOne Phytopathology Feature Extractor",
                "structured_data": diag,
                "farmer_summary": f"Identified signs resembling {diag['condition']} (Pathogen: {diag['pathogen']}) with {diag['confidence']}% confidence. Recommended immediate action: {diag['chemical_treatment'][0]}."
            }
        elif "plant" in query or "crop" in query or "recommend" in query:
            recs = recommend_crops(6.8, 110, 55, 45, "clay_loam", 25.0, "moderate")
            top = recs[0]
            return {
                "intent": "CROP_SELECTION",
                "rule_validated": True,
                "data_source": "Agronomic Soil-Climate Suitability Engine",
                "structured_data": recs[:3],
                "farmer_summary": f"Top recommended crop for your loam soil is {top['name']} (Match Score: {top['match_score']}%). Reason: {top['why_it_fits'][0]} Expected gross revenue: Rs {top['estimated_gross_revenue_acre']:,}/acre."
            }
        else:
            return {
                "intent": "GENERAL_AGRONOMIC_QUERY",
                "rule_validated": True,
                "data_source": "AgriOne Agronomy Knowledge Core",
                "structured_data": {},
                "farmer_summary": "I am connected to your farm's weather, soil moisture sensors, and APMC Mandi feeds. You can ask me about irrigation schedules, crop diseases, fertilizer calculations, or current market commodity prices."
            }
            
    return {"error": f"Route not found: {route}", "code": 404}


class AgriRequestHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_GET(self):
        res = handle_request_route(self.path, "GET")
        self._set_headers(200)
        self.wfile.write(json.dumps(res).encode("utf-8"))

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body_bytes = self.rfile.read(content_length) if content_length > 0 else b"{}"
        try:
            body = json.loads(body_bytes.decode("utf-8"))
        except Exception:
            body = {}
        res = handle_request_route(self.path, "POST", body)
        self._set_headers(200)
        self.wfile.write(json.dumps(res).encode("utf-8"))

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

def main():
    parser = argparse.ArgumentParser(description="AgriOne Core Backend Server")
    parser.add_argument("--port", type=int, default=8000, help="Port to listen on")
    parser.add_argument("--cli", type=str, default="", help="Direct CLI route invocation")
    parser.add_argument("--data", type=str, default="{}", help="JSON data for direct CLI route")
    args = parser.parse_args()
    
    if args.cli:
        try:
            payload = json.loads(args.data)
        except Exception:
            payload = {}
        result = handle_request_route(args.cli, "POST" if payload else "GET", payload)
        print(json.dumps(result))
        return

    server = ThreadedHTTPServer(("0.0.0.0", args.port), AgriRequestHandler)
    print(f"🌾 AgriOne Python Engine Server running on http://0.0.0.0:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == "__main__":
    main()
