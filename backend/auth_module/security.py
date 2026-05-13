import html
import os
import secrets
from datetime import datetime, timedelta

import bcrypt


def _password_payload(plain_password: str, pepper_hash: str) -> bytes:
    return f"{plain_password}::{pepper_hash}".encode("utf-8")


def get_password_pepper_hash() -> str:
    return (os.getenv("AUTH_PASSWORD_PEPPER_HASH", "") or "").strip()


def hash_password(plain_password: str, pepper_hash: str) -> str:
    hashed = bcrypt.hashpw(_password_payload(plain_password, pepper_hash), bcrypt.gensalt(rounds=12))
    return hashed.decode("utf-8")


def verify_password(plain_password: str, password_hash: str, pepper_hash: str) -> bool:
    try:
        return bcrypt.checkpw(_password_payload(plain_password, pepper_hash), password_hash.encode("utf-8"))
    except ValueError:
        return False


def now_utc() -> datetime:
    return datetime.utcnow()


def expires_in(seconds: int) -> datetime:
    return now_utc() + timedelta(seconds=seconds)


def generate_token(size: int = 32) -> str:
    return secrets.token_urlsafe(size)


def constant_time_equal(left: str, right: str) -> bool:
    return secrets.compare_digest(left or "", right or "")


def escape_html(value: str) -> str:
    return html.escape(value or "", quote=True)
