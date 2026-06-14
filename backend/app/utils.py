# backend/app/utils.py
import re
from datetime import datetime

def parse_roll_number(email: str) -> dict:
    """
    Parses a student's roll number from their @hitam.org email address.
    
    Exact rule logic:
      - Positions 1-2: Year of Joining (Convert to full year, e.g. 24 -> 2024. Graduation year is joining + 4).
      - Position 5: Admission Type (1 = Regular, 5 = Lateral Entry).
      - Positions 7-8: Branch Code Mapping (02=EEE, 03=MECH, 04=ECE, 05=CSE, 66=CSE AI/ML, 67=CSE Data Science).
    """
    email = email.strip().lower()
    if not email.endswith("@hitam.org"):
        raise ValueError("Email domain must be @hitam.org")
    
    roll_number = email.split("@")[0].upper()
    
    # HITAM student roll numbers are standard JNTU roll numbers, e.g., 24121A0501 (10 characters)
    # Positions: 1-indexed. So position 1 is index 0.
    if len(roll_number) != 10:
        raise ValueError("Invalid student roll number length. Must be exactly 10 characters.")
    
    # 1. Joining Year (positions 1-2, index 0-1)
    try:
        joining_digits = int(roll_number[0:2])
        joining_year = 2000 + joining_digits
        graduation_year = joining_year + 4
    except ValueError:
        raise ValueError("Could not parse joining year from roll number.")
    
    # 2. Admission Type (position 5, index 4)
    admission_char = roll_number[4]
    if admission_char == '1':
        admission_type = "Regular"
    elif admission_char == '5':
        admission_type = "Lateral Entry"
    else:
        admission_type = f"Unknown ({admission_char})"
        
    # 3. Branch Code Mapping (positions 7-8, index 6-7)
    branch_code = roll_number[6:8]
    branch_mapping = {
        "02": "EEE",
        "03": "MECH",
        "04": "ECE",
        "05": "CSE",
        "66": "CSE AI/ML",
        "67": "CSE Data Science"
    }
    branch = branch_mapping.get(branch_code, f"Unknown ({branch_code})")
    
    return {
        "roll_number": roll_number,
        "joining_year": joining_year,
        "graduation_year": graduation_year,
        "admission_type": admission_type,
        "branch": branch
    }

def calculate_current_year(joining_year: int) -> int:
    """
    Calculates the current academic year of a student based on their joining year
    and the current system date, assuming the academic year shifts in June.
    """
    now = datetime.now()
    year_diff = now.year - joining_year
    
    # Academic year transitions in June (month 6)
    if now.month >= 6:
        current_year = year_diff + 1
    else:
        current_year = year_diff
        
    # Standard engineering courses are 4 years, cap it between 1 and 4.
    return max(1, min(4, current_year))
