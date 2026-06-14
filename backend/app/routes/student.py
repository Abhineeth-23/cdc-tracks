# backend/app/routes/student.py
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import User, Track
from app.utils import calculate_current_year

router = APIRouter(prefix="/api/student", tags=["Student Profile & Tracks"])

# Helper dependency to authenticate/retrieve user by Authorization header
def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header"
        )
    
    # Expect "Bearer <email>" or just "<email>"
    email = authorization
    if authorization.startswith("Bearer "):
        email = authorization.split(" ")[1]
        
    email = email.strip().lower()
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Student not registered or authenticated"
        )
    return user

class TrackSelectionRequest(BaseModel):
    track_id: Optional[str] = None # Allow null/None to uncommit

class TrackBookmarkRequest(BaseModel):
    track_id: str

@router.post("/select-track")
def select_track(
    payload: TrackSelectionRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    track_id = payload.track_id
    
    # If a track_id is provided, verify it exists in our seeded Tracks table
    if track_id:
        track = db.query(Track).filter(Track.id == track_id).first()
        if not track:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Track '{track_id}' not found in database."
            )
            
    user.selected_track_id = track_id
    
    try:
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update selected track: {str(e)}"
        )
        
    return {
        "message": "Selected track updated successfully",
        "selected_track_id": user.selected_track_id
    }

@router.post("/bookmark-track")
def bookmark_track(
    payload: TrackBookmarkRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    track_id = payload.track_id
    
    # Verify track exists
    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Track '{track_id}' not found."
        )
        
    # Get copy of bookmarks list to prevent SQLAlchemy mutation detection issues
    bookmarks = list(user.bookmarked_tracks) if user.bookmarked_tracks else []
    
    if track_id in bookmarks:
        bookmarks.remove(track_id)
        action = "removed"
    else:
        bookmarks.append(track_id)
        action = "added"
        
    user.bookmarked_tracks = bookmarks
    
    try:
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update bookmarks: {str(e)}"
        )
        
    return {
        "message": f"Track {action} successfully",
        "bookmarked_tracks": user.bookmarked_tracks
    }

@router.get("/dashboard-data")
def get_dashboard_data(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Calculate academic year
    current_academic_year = calculate_current_year(user.joining_year)
    
    # Retrieve complete details for the selected track
    selected_track_data = None
    if user.selected_track_id:
        track = db.query(Track).filter(Track.id == user.selected_track_id).first()
        if track:
            selected_track_data = track.data
            
    # Retrieve summaries for bookmarked tracks
    bookmarked_summaries = []
    if user.bookmarked_tracks:
        tracks = db.query(Track).filter(Track.id.in_(user.bookmarked_tracks)).all()
        for t in tracks:
            bookmarked_summaries.append({
                "id": t.id,
                "track_name": t.track_name
            })
            
    return {
        "student": {
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
        },
        "current_year": current_academic_year,
        "selected_track": selected_track_data,
        "bookmarked_tracks_data": bookmarked_summaries
    }
