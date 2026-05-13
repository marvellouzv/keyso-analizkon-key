from dataclasses import dataclass, field


@dataclass(frozen=True)
class AuthConfig:
    login_path: str = "/auth/login"
    submit_path: str = "/auth/login"
    logout_path: str = "/auth/logout"
    session_cookie_name: str = "seo_auth_session"
    session_max_age_seconds: int = 60 * 60 * 24 * 30
    lockout_threshold: int = 5
    lockout_window_seconds: int = 60 * 15
    protected_prefixes: tuple[str, ...] = field(default_factory=lambda: ("/api",))
    excluded_paths: tuple[str, ...] = field(
        default_factory=lambda: (
            "/api/status",
            "/auth/login",
            "/auth/logout",
            "/docs",
            "/openapi.json",
            "/redoc",
            "/assets",
            "/favicon.ico",
        )
    )
