from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.models import User
from app.utils import parse_roll_number

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class GoogleLoginRequest(BaseModel):
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None

@router.post("/google-login")
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    
    # 1. Parse roll number details and enforce @hitam.org domain
    try:
        parsed_data = parse_roll_number(email)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
        
    # 2. Check if student already exists in the database
    user = db.query(User).filter(User.email == email).first()
    
    if user:
        # Update existing profile metadata (in case joining_year or details were modified)
        user.roll_number = parsed_data["roll_number"]
        user.joining_year = parsed_data["joining_year"]
        user.graduation_year = parsed_data["graduation_year"]
        user.admission_type = parsed_data["admission_type"]
        user.branch = parsed_data["branch"]
        if payload.name:
            user.name = payload.name
        if payload.picture:
            user.picture = payload.picture
    else:
        # Create a new student profile
        user = User(
            email=email,
            roll_number=parsed_data["roll_number"],
            joining_year=parsed_data["joining_year"],
            graduation_year=parsed_data["graduation_year"],
            admission_type=parsed_data["admission_type"],
            branch=parsed_data["branch"],
            name=payload.name,
            picture=payload.picture,
            selected_track_id=None,
            bookmarked_tracks=[]
        )
        db.add(user)
        
    try:
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error occurred: {str(e)}"
        )
        
    return {
        "id": user.id,
        "email": user.email,
        "roll_number": user.roll_number,
        "joining_year": user.joining_year,
        "graduation_year": user.graduation_year,
        "admission_type": user.admission_type,
        "branch": user.branch,
        "name": user.name,
        "picture": user.picture,
        "selected_track_id": user.selected_track_id,
        "bookmarked_tracks": user.bookmarked_tracks
    }
