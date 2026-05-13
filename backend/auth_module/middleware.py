from fastapi import Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from starlette.middleware.base import BaseHTTPMiddleware

from database import SessionLocal

from .config import AuthConfig
from .service import get_valid_session


class AuthGuardMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, config: AuthConfig):
        super().__init__(app)
        self.config = config

    def _requires_auth(self, path: str) -> bool:
        if any(path.startswith(item) for item in self.config.excluded_paths):
            return False
        # Protect every non-excluded path so SPA routes are also gated.
        return True

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if not self._requires_auth(path):
            return await call_next(request)

        session_cookie = request.cookies.get(self.config.session_cookie_name)
        db: Session = SessionLocal()
        try:
            session = get_valid_session(db, session_cookie)
            if session:
                request.state.auth_user_id = session.user_id
                request.state.auth_session_id = session.session_id
                request.state.auth_csrf_token = session.csrf_token
                return await call_next(request)
        finally:
            db.close()

        if path.startswith("/api"):
            return RedirectResponse(url=self.config.login_path, status_code=302)
        return RedirectResponse(url=self.config.login_path, status_code=302)
