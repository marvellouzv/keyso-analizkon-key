from sqlalchemy.orm import Session

from .config import AuthConfig
from .models import AuthLoginAttempt, AuthSession, AuthUser
from .security import (
    expires_in,
    generate_token,
    now_utc,
    verify_password,
    hash_password,
)


def has_any_user(db: Session) -> bool:
    return db.query(AuthUser.id).first() is not None


def create_first_user(db: Session, username: str, password: str, pepper_hash: str) -> AuthUser:
    user = AuthUser(
        username=(username or "").strip(),
        password_hash=hash_password(password, pepper_hash),
        is_active=True,
        created_at=now_utc(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _attempt_key(username: str, client_ip: str) -> str:
    return f"{(username or '').strip().lower()}::{client_ip or 'unknown'}"


def is_locked(db: Session, username: str, client_ip: str) -> bool:
    key = _attempt_key(username, client_ip)
    record = db.query(AuthLoginAttempt).filter(AuthLoginAttempt.key == key).first()
    if not record or not record.locked_until:
        return False
    return record.locked_until > now_utc()


def register_failed_attempt(db: Session, username: str, client_ip: str, config: AuthConfig) -> None:
    key = _attempt_key(username, client_ip)
    record = db.query(AuthLoginAttempt).filter(AuthLoginAttempt.key == key).first()
    current = now_utc()
    if not record:
        record = AuthLoginAttempt(key=key, attempts=0, locked_until=None, updated_at=current)
        db.add(record)
    if (current - record.updated_at).total_seconds() > config.lockout_window_seconds:
        record.attempts = 0
        record.locked_until = None
    record.attempts += 1
    record.updated_at = current
    if record.attempts >= config.lockout_threshold:
        record.locked_until = expires_in(config.lockout_window_seconds)
    db.commit()


def reset_failed_attempts(db: Session, username: str, client_ip: str) -> None:
    key = _attempt_key(username, client_ip)
    record = db.query(AuthLoginAttempt).filter(AuthLoginAttempt.key == key).first()
    if not record:
        return
    db.delete(record)
    db.commit()


def authenticate_user(db: Session, username: str, password: str, pepper_hash: str) -> AuthUser | None:
    user = db.query(AuthUser).filter(AuthUser.username == (username or "").strip()).first()
    if not user or not user.is_active:
        return None
    if not verify_password(password, user.password_hash, pepper_hash):
        return None
    return user


def create_session(db: Session, user: AuthUser, config: AuthConfig) -> AuthSession:
    session = AuthSession(
        session_id=generate_token(24),
        user_id=user.id,
        csrf_token=generate_token(24),
        expires_at=expires_in(config.session_max_age_seconds),
        created_at=now_utc(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def delete_session(db: Session, session_id: str | None) -> None:
    if not session_id:
        return
    session = db.query(AuthSession).filter(AuthSession.session_id == session_id).first()
    if not session:
        return
    db.delete(session)
    db.commit()


def get_valid_session(db: Session, session_id: str | None) -> AuthSession | None:
    if not session_id:
        return None
    session = db.query(AuthSession).filter(AuthSession.session_id == session_id).first()
    if not session:
        return None
    if session.expires_at <= now_utc():
        db.delete(session)
        db.commit()
        return None
    return session
