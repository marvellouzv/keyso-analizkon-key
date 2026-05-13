from sqlalchemy import Boolean, Column, DateTime, Integer, String

from database import Base


class AuthUser(Base):
    __tablename__ = "auth_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False)


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(128), unique=True, index=True, nullable=False)
    user_id = Column(Integer, nullable=False, index=True)
    csrf_token = Column(String(128), nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, nullable=False)


class AuthLoginAttempt(Base):
    __tablename__ = "auth_login_attempts"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(255), unique=True, index=True, nullable=False)
    attempts = Column(Integer, nullable=False, default=0)
    locked_until = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=False)
