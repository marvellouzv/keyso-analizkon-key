from sqlalchemy import Column, Integer, String, DateTime, JSON
from database import Base
import datetime

class AnalysisHistory(Base):
    __tablename__ = "analysis_history"

    id = Column(Integer, primary_key=True, index=True)
    domain = Column(String, index=True)
    base = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    data = Column(JSON)
    excel_path = Column(String, nullable=True)
