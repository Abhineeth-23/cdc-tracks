# backend/app/models.py
from sqlalchemy import Column, Integer, String, JSON
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    roll_number = Column(String, unique=True, index=True, nullable=False)
    joining_year = Column(Integer, nullable=False)
    graduation_year = Column(Integer, nullable=False)
    admission_type = Column(String, nullable=False)
    branch = Column(String, nullable=False)
    name = Column(String, nullable=True)
    picture = Column(String, nullable=True)
    selected_track_id = Column(String, nullable=True)
    bookmarked_tracks = Column(JSON, default=list, nullable=False)

class Track(Base):
    __tablename__ = "tracks"

    id = Column(String, primary_key=True, index=True) # The track slug
    track_name = Column(String, nullable=False)
    data = Column(JSON, nullable=False) # Stores the complete curriculum JSON structure
