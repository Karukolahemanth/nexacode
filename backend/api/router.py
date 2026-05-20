"""API Router — aggregates all route modules."""

from fastapi import APIRouter
from api.health import router as health_router
from api.files import router as files_router
from api.projects import router as projects_router
from api.chat import router as chat_router
from api.rag import router as rag_router
from api.search import router as search_router
from api.auth import router as auth_router

api_router = APIRouter()

api_router.include_router(health_router, prefix="/health", tags=["Health"])
api_router.include_router(auth_router, prefix="/auth", tags=["Auth"])
api_router.include_router(files_router, prefix="/files", tags=["Files"])
api_router.include_router(projects_router, prefix="/projects", tags=["Projects"])
api_router.include_router(chat_router, prefix="/chat", tags=["Chat"])
api_router.include_router(rag_router, prefix="/rag", tags=["RAG"])
api_router.include_router(search_router, prefix="/search", tags=["Search"])
