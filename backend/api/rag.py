"""RAG API endpoints — index and search code."""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()


class IndexRequest(BaseModel):
    path: str
    project_id: str = "default"


class SearchRequest(BaseModel):
    query: str
    top_k: int = 5


class IndexFileRequest(BaseModel):
    file_path: str
    content: str
    project_id: str = "default"


@router.post("/index")
async def index_repository(request: IndexRequest):
    """Index an entire repository for RAG search."""
    from rag.indexer import code_indexer
    result = await code_indexer.index_repository(request.path, request.project_id)
    return result


@router.post("/index-file")
async def index_single_file(request: IndexFileRequest):
    """Index a single file (incremental update)."""
    from rag.indexer import code_indexer
    result = await code_indexer.index_file(request.file_path, request.content, request.project_id)
    return result


@router.post("/search")
async def search_code(request: SearchRequest):
    """Semantic search across indexed code."""
    from rag.indexer import code_indexer
    results = await code_indexer.search(request.query, request.top_k)
    return {"query": request.query, "results": results, "count": len(results)}
