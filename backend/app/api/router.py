from fastapi import APIRouter

from backend.app.api.routes import auth, banks, health, members, sessions, venues

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router)
api_router.include_router(sessions.router)
api_router.include_router(venues.router)
api_router.include_router(members.router)
api_router.include_router(banks.router)


