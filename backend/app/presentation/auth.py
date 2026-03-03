from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_session
from app.domain.schemas import UserResponse
from app.repository.user_repo import UserRepository

router = APIRouter(prefix="/api/auth", tags=["auth"])

GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"


@router.get("/github")
async def github_login() -> RedirectResponse:
    return RedirectResponse(
        f"{GITHUB_AUTHORIZE_URL}?client_id={settings.github_client_id}&scope=user:email"
    )


@router.get("/github/callback")
async def github_callback(
    code: str,
    session: AsyncSession = Depends(get_session),
) -> RedirectResponse:
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            GITHUB_TOKEN_URL,
            json={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": code,
            },
            headers={"Accept": "application/json"},
        )
        token_data = token_response.json()

        if "access_token" not in token_data:
            raise HTTPException(status_code=400, detail="Failed to get access token")

        user_response = await client.get(
            GITHUB_USER_URL,
            headers={"Authorization": f"Bearer {token_data['access_token']}"},
        )
        github_user = user_response.json()

    repo = UserRepository(session)
    user = await repo.upsert_by_github_id(
        github_id=str(github_user["id"]),
        name=github_user.get("name") or github_user["login"],
        email=github_user.get("email"),
        avatar_url=github_user.get("avatar_url"),
    )

    token = _create_token(user.id)
    return RedirectResponse(f"{settings.frontend_url}?token={token}")


@router.get("/me", response_model=UserResponse)
async def get_me(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> UserResponse:
    user_id = _get_current_user_id(request)
    repo = UserRepository(session)
    user = await repo.get_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def _create_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.jwt_expire_minutes
    )
    return jwt.encode(
        {"sub": user_id, "exp": expire},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


def _get_current_user_id(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
