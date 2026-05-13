from sqlalchemy import Boolean, Column, Integer, String, DateTime, JSON
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


class ServiceWish(Base):
    __tablename__ = "service_wishes"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, nullable=False)
    is_done = Column(Boolean, default=False, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
        nullable=False,
    )
