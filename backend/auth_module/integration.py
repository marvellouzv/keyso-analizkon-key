from fastapi import FastAPI

import models

from .config import AuthConfig
from .middleware import AuthGuardMiddleware
from .models import AuthLoginAttempt, AuthSession, AuthUser
from .routes import build_auth_router
from .service import ensure_seed_user


def init_auth_module(app: FastAPI, db_engine, config: AuthConfig | None = None) -> None:
    cfg = config or AuthConfig()

    AuthUser.__table__.create(bind=db_engine, checkfirst=True)
    AuthSession.__table__.create(bind=db_engine, checkfirst=True)
    AuthLoginAttempt.__table__.create(bind=db_engine, checkfirst=True)
    models.Base.metadata.create_all(bind=db_engine)

    from database import SessionLocal

    db = SessionLocal()
    try:
        ensure_seed_user(db)
    finally:
        db.close()

    app.include_router(build_auth_router(cfg))
    app.add_middleware(AuthGuardMiddleware, config=cfg)
