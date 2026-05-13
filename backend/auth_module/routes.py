from fastapi import APIRouter, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session

from database import SessionLocal

from .config import AuthConfig
from .security import constant_time_equal, generate_token
from .service import (
    authenticate_user,
    create_session,
    delete_session,
    is_locked,
    register_failed_attempt,
    reset_failed_attempts,
)
from .templates import login_page_html


def _is_secure_request(request: Request) -> bool:
    if request.url.scheme == "https":
        return True
    forwarded_proto = request.headers.get("x-forwarded-proto", "").lower()
    return forwarded_proto == "https"


def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        return xff.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def build_auth_router(config: AuthConfig) -> APIRouter:
    router = APIRouter(tags=["auth-module"])

    def _login_response(request: Request, csrf_token: str, error: str | None = None, status_code: int = 200) -> HTMLResponse:
        response = HTMLResponse(
            content=login_page_html(config.submit_path, csrf_token, error),
            status_code=status_code,
        )
        response.set_cookie(
            key="auth_csrf",
            value=csrf_token,
            httponly=True,
            secure=_is_secure_request(request),
            samesite="strict",
            max_age=600,
        )
        return response

    @router.get(config.login_path, response_class=HTMLResponse)
    async def login_form(request: Request):
        csrf_token = generate_token(24)
        return _login_response(request, csrf_token)

    @router.post(config.submit_path)
    async def login_submit(
        request: Request,
        username: str = Form(default=""),
        password: str = Form(default=""),
        csrf_token: str = Form(default=""),
    ):
        client_ip = _client_ip(request)
        cookie_csrf = request.cookies.get("auth_csrf", "")
        if not cookie_csrf or not constant_time_equal(csrf_token, cookie_csrf):
            return _login_response(
                request=request,
                csrf_token=generate_token(24),
                error="CSRF token invalid. Refresh page.",
                status_code=400,
            )

        db: Session = SessionLocal()
        try:
            if is_locked(db, username, client_ip):
                return _login_response(
                    request=request,
                    csrf_token=generate_token(24),
                    error="Too many attempts. Try later.",
                    status_code=429,
                )

            user = authenticate_user(db, username=username, password=password)
            if not user:
                register_failed_attempt(db, username, client_ip, config)
                return _login_response(
                    request=request,
                    csrf_token=generate_token(24),
                    error="Invalid login or password.",
                    status_code=401,
                )

            reset_failed_attempts(db, username, client_ip)
            session = create_session(db, user, config)
        finally:
            db.close()

        response = RedirectResponse(url="/", status_code=303)
        response.set_cookie(
            key=config.session_cookie_name,
            value=session.session_id,
            httponly=True,
            secure=_is_secure_request(request),
            samesite="strict",
            max_age=config.session_max_age_seconds,
        )
        response.set_cookie(
            key="auth_csrf",
            value=session.csrf_token,
            httponly=False,
            secure=_is_secure_request(request),
            samesite="strict",
            max_age=config.session_max_age_seconds,
        )
        return response

    @router.post(config.logout_path)
    async def logout(request: Request):
        db: Session = SessionLocal()
        try:
            delete_session(db, request.cookies.get(config.session_cookie_name))
        finally:
            db.close()
        response = RedirectResponse(url=config.login_path, status_code=303)
        response.delete_cookie(config.session_cookie_name)
        response.delete_cookie("auth_csrf")
        return response

    return router
