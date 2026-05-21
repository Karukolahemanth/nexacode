"""NexusIDE Backend — FastAPI Application."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from config import settings
from api.router import api_router
from websocket.chat_ws import router as chat_ws_router
from websocket.terminal_ws import router as terminal_ws_router
from auth.models import init_db

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("nexus")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"📡 LLM Provider: {settings.LLM_PROVIDER}")
    logger.info(f"📡 vLLM endpoint: {settings.VLLM_URL}")
    logger.info(f"🗄️  Database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'configured'}")

    # Initialize database tables
    try:
        await init_db()
        logger.info("✅ Database tables initialized")
    except Exception as e:
        logger.error(f"❌ Database init failed: {e}")

    logger.info(f"📁 Workspace: {settings.workspace_path}")

    yield
    logger.info(f"👋 Shutting down {settings.APP_NAME}")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Private AI Coding Platform API",
    lifespan=lifespan,
)

# CORS — "*" cannot be combined with allow_credentials=True
_origins = settings.cors_origins_list
_credentials = "*" not in _origins  # credentials only when origins are explicit
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


# REST API routes
app.include_router(api_router, prefix="/api")

# WebSocket routes
app.include_router(chat_ws_router)
app.include_router(terminal_ws_router)


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "llm_provider": settings.LLM_PROVIDER,
    }
