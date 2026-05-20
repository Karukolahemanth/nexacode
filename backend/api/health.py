"""Health check endpoint."""

from fastapi import APIRouter
from config import settings

router = APIRouter()


@router.get("/")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@router.get("/ready")
async def readiness_check():
    """Check if all dependencies are available."""
    checks = {
        "api": True,
        "database": False,
        "redis": False,
        "vllm": False,
    }
    # TODO: Implement actual dependency checks in Phase 2+
    return {"ready": checks["api"], "checks": checks}
