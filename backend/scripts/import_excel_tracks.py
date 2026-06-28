import os
import sys
import pandas as pd
from datetime import datetime
from sqlalchemy.orm import Session

# Add parent directory to path so app modules can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import CDCPerformance, User, FinalisedTrack, Track

# Mapping from Excel "Training Domain" to database Track ID (slug)
DOMAIN_TO_TRACK_ID = {
    "Data Analyst / Data Scientist / AI/ML Engineer": "data-analyst-data-scientist-ai-ml-engineer",
    "Full Stack Developer": "full-stack-developer",
    "Software Engineer / Developer": "software-engineer-software-developer",
    "Cloud / DevOps / Security Engineer": "cloud-engineer-devops-engineer-cyber-security-engineer",
    "VLSI / Semiconductor Engineer": "vlsi-semiconductor-engineer",
    "Embedded Systems / IoT Design Engineer": "embedded-system-iot-design-engineer",
    "Design / CAE / Manufacturing Engineer": "design-cae-manufacturing-engineer",
    "EV / Industrial Automation Engineer": "ev-power-systems-automation-engineer"
}

def import_excel_training_domains(file_path: str, semester_key: str = "III-I"):
    """
    Imports Roll Number, Student Name, Branch, and Training Domain from an Excel file
    and updates/upserts them into cdc_performance, users, and finalised_tracks tables.
    """
    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' not found at {file_path}")
        return

    print(f"Reading Excel file: {file_path}")
    xls = pd.ExcelFile(file_path)
    
    dfs = []
    for sheet in xls.sheet_names:
        df_sheet = pd.read_excel(file_path, sheet_name=sheet)
        dfs.append(df_sheet)
        
    df_all = pd.concat(dfs, ignore_index=True)
    print(f"Loaded {len(df_all)} rows across {len(xls.sheet_names)} sheets.")
    
    # Verify required columns exist
    required_cols = ['Roll Number', 'Student Name', 'Branch', 'Training Domain']
    for col in required_cols:
        if col not in df_all.columns:
            print(f"Error: Missing required column '{col}' in Excel file.")
            return

    db: Session = SessionLocal()
    updated_cdc = 0
    created_cdc = 0
    users_updated = 0
    finalised_updated = 0
    now = datetime.utcnow()

    try:
        # Pre-fetch existing records into memory dicts for fast execution
        existing_cdc = {c.roll_number.upper(): c for c in db.query(CDCPerformance).all() if c.roll_number}
        existing_users = {u.roll_number.upper(): u for u in db.query(User).all() if u.roll_number}
        existing_finalised = {f.roll_number.upper(): f for f in db.query(FinalisedTrack).all() if f.roll_number}

        for idx, row in df_all.iterrows():
            roll = str(row['Roll Number']).strip().upper() if pd.notna(row['Roll Number']) else None
            if not roll or roll == 'NAN':
                continue

            name = str(row['Student Name']).strip() if pd.notna(row['Student Name']) else None
            branch = str(row['Branch']).strip().upper() if pd.notna(row['Branch']) else None
            domain = str(row['Training Domain']).strip() if pd.notna(row['Training Domain']) else None
            track_id = DOMAIN_TO_TRACK_ID.get(domain)

            # 1. Update/Upsert CDCPerformance record
            cdc_obj = existing_cdc.get(roll)
            if not cdc_obj:
                cdc_obj = CDCPerformance(
                    roll_number=roll,
                    name=name,
                    branch=branch,
                    batch_year="2024-2028",
                    domain_tracks={}
                )
                db.add(cdc_obj)
                existing_cdc[roll] = cdc_obj
                created_cdc += 1
            else:
                if name:
                    cdc_obj.name = name
                if branch:
                    cdc_obj.branch = branch
                updated_cdc += 1

            # Update domain_tracks JSON field for CDC Dashboard
            current_domains = dict(cdc_obj.domain_tracks) if cdc_obj.domain_tracks else {}
            existing_sem_data = current_domains.get(semester_key, {})
            existing_perf = existing_sem_data.get("performance") if isinstance(existing_sem_data, dict) else None

            current_domains[semester_key] = {
                "domain": domain,
                "performance": existing_perf
            }
            cdc_obj.domain_tracks = current_domains

            # 2. Sync to User model if user exists (automatic track mapping)
            user_obj = existing_users.get(roll)
            if user_obj:
                if name:
                    user_obj.name = name
                if branch:
                    user_obj.branch = branch
                if track_id:
                    user_obj.selected_track_id = track_id
                users_updated += 1

            # 3. Mirror to FinalisedTrack for admin reports
            if track_id:
                fin_obj = existing_finalised.get(roll)
                if fin_obj:
                    fin_obj.track_id = track_id
                    fin_obj.finalised_at = now
                else:
                    fin_obj = FinalisedTrack(
                        roll_number=roll,
                        batch_year="2024-2028",
                        academic_year=3,
                        semester=semester_key,
                        track_id=track_id,
                        finalised_at=now
                    )
                    db.add(fin_obj)
                    existing_finalised[roll] = fin_obj
                finalised_updated += 1

        db.commit()
        print(f"\n--- Import & Track Mapping Summary ---")
        print(f"Semester Key: {semester_key}")
        print(f"CDC Performance Records Updated: {updated_cdc}")
        print(f"CDC Performance Records Created: {created_cdc}")
        print(f"User Accounts Automatically Mapped: {users_updated}")
        print(f"Finalised Track Records Created/Updated: {finalised_updated}")
        print("Database successfully synchronized!")

    except Exception as e:
        db.rollback()
        print(f"Error during import: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    excel_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "misc", "Students List and Training Groups- III -I 2024-28.xlsx")
    import_excel_training_domains(excel_file, semester_key="III-I")
