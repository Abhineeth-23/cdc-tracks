# backend/app/services/google_sheets_sync.py
import os
import json
import logging
from sqlalchemy.orm import Session
from app.models import CDCPerformance

logger = logging.getLogger("cdc_sync")

def clean_sheet_value(val):
    """
    Cleans Google Sheet cell values.
    Handles VLOOKUP errors (#N/A, #VALUE!, #REF!) and empty cells by treating them as None.
    """
    if val is None:
        return None
    val_str = str(val).strip()
    if val_str in ["", "#N/A", "#VALUE!", "#REF!", "#NAME?", "#DIV/0!"]:
        return None
    try:
        # Try converting numeric values
        if "." in val_str:
            return float(val_str)
        return int(val_str)
    except ValueError:
        return val_str

def fetch_sheet_records(wks):
    all_values = wks.get_all_values(value_render_option='FORMATTED_VALUE')
    if not all_values:
        return []
    raw_headers = all_values[0]
    seen = {}
    headers = []
    for h in raw_headers:
        h_clean = str(h).replace("\n", " ").strip()
        if h_clean in seen:
            seen[h_clean] += 1
            headers.append(f"{h_clean}_{seen[h_clean]}")
        else:
            seen[h_clean] = 1
            headers.append(h_clean)
            
    records = []
    for row_values in all_values[1:]:
        row_dict = {}
        for idx, header in enumerate(headers):
            val = row_values[idx] if idx < len(row_values) else ""
            row_dict[header] = val
        records.append(row_dict)
    return records

def sync_live_google_sheets(db: Session, sheet1_id_or_url: str, sheet2_id_or_url: str, credentials_path: str = "service_account.json"):
    """
    Connects to live Google Sheets via gspread and syncs evaluated values (including VLOOKUP results).
    """
    try:
        import gspread
        from google.oauth2.service_account import Credentials
    except ImportError:
        logger.error("gspread or google-auth not installed. Run: pip install gspread google-auth")
        return {"success": False, "message": "Missing dependencies: gspread or google-auth"}

    scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    
    # Check if JSON content is provided via environment variable
    env_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    if env_json:
        try:
            info = json.loads(env_json)
            creds = Credentials.from_service_account_info(info, scopes=scopes)
        except Exception as e_env:
            logger.error(f"Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON env var: {e_env}")
            creds = None
    else:
        creds = None

    if not creds:
        # Fallback to check backend directory if credentials_path doesn't exist directly
        if not os.path.exists(credentials_path):
            alt_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), credentials_path)
            if os.path.exists(alt_path):
                credentials_path = alt_path
            else:
                return {
                    "success": False, 
                    "message": f"Service account credential file '{credentials_path}' not found."
                }
        creds = Credentials.from_service_account_file(credentials_path, scopes=scopes)

    client = gspread.authorize(creds)

    try:
        # Extract keys or open by url
        try:
            sheet1 = client.open_by_url(sheet1_id_or_url) if sheet1_id_or_url.startswith("http") else client.open_by_key(sheet1_id_or_url)
        except Exception as e1:
            return {"success": False, "message": f"Failed to access Google Sheet 1: {str(e1)}. Make sure it is shared with {creds.service_account_email}"}

        try:
            sheet2 = client.open_by_url(sheet2_id_or_url) if sheet2_id_or_url.startswith("http") else client.open_by_key(sheet2_id_or_url)
        except Exception as e2:
            return {"success": False, "message": f"Failed to access Google Sheet 2: {str(e2)}. Make sure it is shared with {creds.service_account_email}"}

        # 1. Process File 1 (Overall Metrics & Tests)
        wks1 = sheet1.sheet1
        records1 = fetch_sheet_records(wks1)
        
        # 2. Process File 2 (Semester Domains)
        wks2 = sheet2.sheet1
        records2 = fetch_sheet_records(wks2)

        # Create dictionary map for File 2 by Roll Number
        domain_map = {}
        for row in records2:
            roll = str(row.get("Roll Number") or row.get("Roll No") or "").strip()
            if roll:
                domain_map[roll] = {
                    "I-II": {
                        "domain": clean_sheet_value(row.get("I-II Domain")),
                        "performance": clean_sheet_value(row.get("I-II Performance"))
                    },
                    "II-I": {
                        "domain": clean_sheet_value(row.get("II-I Domain")),
                        "performance": clean_sheet_value(row.get("II-I Performance"))
                    },
                    "II-II": {
                        "domain": clean_sheet_value(row.get("II-II Domain")),
                        "performance": clean_sheet_value(row.get("II-II Performance"))
                    }
                }

        synced_count = 0
        for row in records1:
            roll = str(row.get("Roll Number") or row.get("Roll No") or "").strip()
            if not roll:
                continue

            # Extract test scores (Test 1 - Test 30) and post assessments
            test_scores = {}
            post_assessments = {}
            for col, val in row.items():
                col_clean = " ".join(col.replace("\n", " ").split()).strip()
                # Standardize common typos in sheet headers
                col_clean_norm = col_clean.replace("Asssessment", "Assessment").replace("asssessment", "assessment")
                
                if "test" in col_clean_norm.lower() or "post assessment" in col_clean_norm.lower():
                    cleaned_val = clean_sheet_value(val)
                    test_scores[col_clean_norm] = cleaned_val
                    if "post" in col_clean_norm.lower():
                        post_assessments[col_clean_norm] = cleaned_val

            # Upsert into database
            cdc_obj = db.query(CDCPerformance).filter(CDCPerformance.roll_number == roll).first()
            if not cdc_obj:
                cdc_obj = CDCPerformance(roll_number=roll)
                db.add(cdc_obj)

            cdc_obj.name = str(row.get("Name") or "")
            cdc_obj.branch = str(row.get("Branch") or "")
            cdc_obj.email = str(row.get("Mail ID") or row.get("Email") or "")
            cdc_obj.mobile = str(row.get("Mobile Number") or "")
            cdc_obj.participation = clean_sheet_value(row.get("Participation")) or 0
            cdc_obj.consistency_score = clean_sheet_value(row.get("Consistency Score")) or 0.0
            cdc_obj.avg_performance = clean_sheet_value(row.get("Avg Performance")) or 0.0
            cdc_obj.cdc_grade_score = clean_sheet_value(row.get("CDC Grade Score")) or 0.0
            
            raw_cie = clean_sheet_value(row.get("CIE/5")) or clean_sheet_value(row.get("CIE/5_2")) or 0.0
            import math
            try:
                cdc_obj.cie_score = math.ceil(float(raw_cie) * 2) / 2
            except (ValueError, TypeError):
                cdc_obj.cie_score = 0.0

            cdc_obj.cdc_rank = clean_sheet_value(row.get("CDC Rank"))
            cdc_obj.cdc_band = str(clean_sheet_value(row.get("CDC Band")) or "D").upper()
            
            cdc_obj.test_scores = test_scores
            cdc_obj.post_assessments = post_assessments
            if roll in domain_map:
                cdc_obj.domain_tracks = domain_map[roll]

            synced_count += 1

        db.commit()
        return {"success": True, "message": f"Successfully synced {synced_count} student CDC records from Google Sheets!"}

    except Exception as e:
        db.rollback()
        logger.error(f"Error syncing Google Sheets: {e}")
        return {"success": False, "message": f"Failed to sync Google Sheets: {str(e)}"}
