"""Code search API — text/regex search across workspace files."""

import os
import re
import logging
from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel

logger = logging.getLogger("nexus.api.search")

router = APIRouter()

# Reuse chunker's ignore lists
IGNORE_DIRS = {
    "node_modules", ".git", ".next", "__pycache__", ".venv", "venv",
    "dist", "build", ".cache", ".idea", ".vscode", "coverage",
    "target", "vendor", ".tox", "eggs",
}

IGNORE_FILES = {
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
    ".DS_Store", "Thumbs.db",
}

SUPPORTED_EXTENSIONS = {
    ".py", ".js", ".ts", ".tsx", ".jsx", ".java", ".go", ".rs", ".rb",
    ".c", ".cpp", ".h", ".hpp", ".cs", ".php", ".swift", ".kt",
    ".html", ".css", ".scss", ".sql", ".sh", ".bash", ".yaml", ".yml",
    ".json", ".toml", ".md", ".txt", ".env", ".dockerfile",
}


class TextSearchRequest(BaseModel):
    query: str
    path: str = "/workspace"
    is_regex: bool = False
    case_sensitive: bool = False
    max_results: int = 100


class SearchMatch(BaseModel):
    file: str
    line: int
    content: str
    column_start: int = 0
    column_end: int = 0


class TextSearchResponse(BaseModel):
    query: str
    matches: List[SearchMatch]
    total_files_searched: int
    total_matches: int


class SemanticSearchRequest(BaseModel):
    query: str
    top_k: int = 5


@router.post("/text", response_model=TextSearchResponse)
async def text_search(request: TextSearchRequest):
    """Search across workspace files using text or regex matching."""
    matches: List[SearchMatch] = []
    files_searched = 0
    query = request.query

    if not query.strip():
        return TextSearchResponse(
            query=query, matches=[], total_files_searched=0, total_matches=0
        )

    # Build regex pattern
    flags = 0 if request.case_sensitive else re.IGNORECASE
    try:
        if request.is_regex:
            pattern = re.compile(query, flags)
        else:
            pattern = re.compile(re.escape(query), flags)
    except re.error:
        return TextSearchResponse(
            query=query, matches=[], total_files_searched=0, total_matches=0
        )

    # Walk the workspace
    workspace = request.path
    if not os.path.exists(workspace):
        workspace = os.getcwd()

    for root, dirs, files in os.walk(workspace):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for fname in files:
            if fname in IGNORE_FILES:
                continue
            ext = os.path.splitext(fname)[1].lower()
            if ext not in SUPPORTED_EXTENSIONS:
                continue

            file_path = os.path.join(root, fname)
            rel_path = os.path.relpath(file_path, workspace)

            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    files_searched += 1
                    for line_num, line in enumerate(f, 1):
                        match = pattern.search(line)
                        if match:
                            matches.append(SearchMatch(
                                file=rel_path,
                                line=line_num,
                                content=line.rstrip()[:200],
                                column_start=match.start(),
                                column_end=match.end(),
                            ))
                            if len(matches) >= request.max_results:
                                break
            except Exception:
                continue

            if len(matches) >= request.max_results:
                break

    return TextSearchResponse(
        query=query,
        matches=matches,
        total_files_searched=files_searched,
        total_matches=len(matches),
    )


@router.post("/semantic")
async def semantic_search(request: SemanticSearchRequest):
    """Semantic search via RAG pipeline."""
    try:
        from rag.indexer import code_indexer
        results = await code_indexer.search(request.query, request.top_k)
        return {"query": request.query, "results": results, "count": len(results)}
    except Exception as e:
        logger.error(f"Semantic search failed: {e}")
        return {"query": request.query, "results": [], "count": 0, "error": str(e)}
