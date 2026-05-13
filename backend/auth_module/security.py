import html
import secrets
from datetime import datetime, timedelta

import bcrypt


def hash_password(plain_password: str) -> str:
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt(rounds=12))
    return hashed.decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), password_hash.encode("utf-8"))
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
