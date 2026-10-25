import hmac

from fastapi import Header, HTTPException, Request

from app.core.config import settings

_LOCAL_HOSTS = {"127.0.0.1", "::1", "localhost"}


def require_admin(request: Request, x_admin_key: str | None = Header(default=None)) -> None:
    """수동 수집 API 보호.

    ADMIN_API_KEY가 설정돼 있으면 X-Admin-Key 헤더가 일치해야 하고,
    설정돼 있지 않으면(로컬 개발) 같은 PC에서 온 요청만 허용한다.
    """
    if settings.admin_api_key:
        if x_admin_key and hmac.compare_digest(x_admin_key, settings.admin_api_key):
            return
        raise HTTPException(status_code=403, detail="관리자 키가 필요합니다.")

    client_host = request.client.host if request.client else ""
    if client_host not in _LOCAL_HOSTS:
        raise HTTPException(status_code=403, detail="로컬에서만 호출할 수 있습니다.")
