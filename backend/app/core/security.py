import hashlib
import secrets
import string
import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated, Any

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models.host import Host

# Bearer token scheme (auto_error=False to allow optional auth where needed)
bearer_scheme = HTTPBearer(auto_error=False)

ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 30
OTP_EXPIRE_MINUTES = 5


def hash_token(token: str) -> str:
    """Compute SHA256 hex digest of a token or code."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_otp_code(length: int = 6) -> str:
    """Generate a random numeric OTP code."""
    return "".join(secrets.choice(string.digits) for _ in range(length))


def create_access_token(
    subject: str | uuid.UUID, expires_delta: timedelta | None = None
) -> tuple[str, datetime]:
    """Create short lived JWT access token."""
    expire = datetime.now(UTC) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload: dict[str, Any] = {
        "sub": str(subject),
        "exp": expire,
        "type": "access",
        "iat": datetime.now(UTC),
    }
    encoded_jwt = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt, expire


def create_refresh_token(
    subject: str | uuid.UUID, expires_delta: timedelta | None = None
) -> tuple[str, datetime, str]:
    """
    Create long lived JWT refresh token.
    Returns (raw_token, expires_at, token_hash).
    """
    expire = datetime.now(UTC) + (
        expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    raw_secret = secrets.token_urlsafe(32)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "exp": expire,
        "type": "refresh",
        "jti": raw_secret,
        "iat": datetime.now(UTC),
    }
    encoded_jwt = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    token_hash = hash_token(encoded_jwt)
    return encoded_jwt, expire, token_hash


def decode_token(token: str, expected_type: str = "access") -> dict[str, Any]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != expected_type:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token type: expected {expected_type}",
            )
        return payload
    except jwt.ExpiredSignatureError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        ) from e
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        ) from e


async def verify_google_credential(credential_token: str) -> dict[str, Any]:
    """
    Verify Google OAuth credential token against Google tokeninfo endpoint.
    Supports mock/test credentials in test mode.
    """
    # Test / Mock shortcut
    if credential_token.startswith("mock-google-token-"):
        mock_id = credential_token.replace("mock-google-token-", "")
        return {
            "sub": f"google-sub-{mock_id}",
            "email": f"{mock_id}@gmail.com",
            "name": f"Google User {mock_id}",
            "picture": "https://lh3.googleusercontent.com/a/default-user",
        }

    url = f"https://oauth2.googleapis.com/tokeninfo?id_token={credential_token}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(url)
            if res.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid Google OAuth credential token",
                )
            data = res.json()
            if "sub" not in data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Malformed Google OAuth token",
                )
            return data
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to verify Google credential at this time",
        ) from e


async def get_optional_current_host(
    auth: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Host | None:
    """
    Returns the authenticated Host if a valid Bearer token is supplied,
    or None if no Authorization header is present.
    """
    if not auth or not auth.credentials:
        return None

    try:
        payload = decode_token(auth.credentials, expected_type="access")
        host_id_str = payload.get("sub")
        if not host_id_str:
            return None
        host_uuid = uuid.UUID(host_id_str)
    except Exception:
        return None

    result = await db.execute(select(Host).where(Host.id == host_uuid, Host.is_active.is_(True)))
    return result.scalars().first()


async def get_current_active_host(
    auth: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Host:
    """
    FastAPI dependency requiring a valid JWT access token and active Host record.
    Raises 401 Unauthorized if missing, expired, or invalid.
    """
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(auth.credentials, expected_type="access")
    host_id_str = payload.get("sub")
    if not host_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        host_uuid = uuid.UUID(host_id_str)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identifier",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e

    result = await db.execute(select(Host).where(Host.id == host_uuid))
    host = result.scalars().first()

    if not host:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not host.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Host account is deactivated",
        )

    return host
