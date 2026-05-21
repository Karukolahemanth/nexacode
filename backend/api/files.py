"""File management API endpoints — real disk operations."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os
import shutil

from config import settings

router = APIRouter()


class FileNode(BaseModel):
    name: str
    path: str
    type: str  # "file" or "directory"
    size: Optional[int] = None
    children: Optional[List["FileNode"]] = None


class WriteFileRequest(BaseModel):
    path: str
    content: str


class MoveFileRequest(BaseModel):
    source: str
    destination: str


class MkdirRequest(BaseModel):
    path: str


class SearchRequest(BaseModel):
    query: str
    path: Optional[str] = None
    regex: bool = False


def safe_path(relative_path: str) -> str:
    """Resolve path inside workspace, raising 400 if directory traversal detected."""
    workspace = settings.workspace_path
    # Strip leading slashes to make it relative
    rel = relative_path.lstrip("/").lstrip("\\")
    full = os.path.abspath(os.path.join(workspace, rel))
    if not full.startswith(workspace):
        raise HTTPException(status_code=400, detail="Path traversal not allowed")
    return full


def build_tree(abs_path: str, workspace: str) -> FileNode:
    """Recursively build a FileNode tree from an absolute path."""
    rel = "/" + os.path.relpath(abs_path, workspace).replace("\\", "/")
    name = os.path.basename(abs_path)

    if os.path.isdir(abs_path):
        children = []
        try:
            entries = sorted(os.listdir(abs_path))
        except PermissionError:
            entries = []
        for entry in entries:
            if entry.startswith("."):
                continue  # skip hidden files
            child_path = os.path.join(abs_path, entry)
            children.append(build_tree(child_path, workspace))
        return FileNode(name=name, path=rel, type="directory", children=children)
    else:
        size = os.path.getsize(abs_path)
        return FileNode(name=name, path=rel, type="file", size=size)


@router.get("/list")
async def list_directory(path: str = "/"):
    """List workspace directory contents recursively."""
    workspace = settings.workspace_path
    abs_path = safe_path(path) if path != "/" else workspace

    if not os.path.exists(abs_path):
        return {"path": path, "children": []}

    node = build_tree(abs_path, workspace)
    return {"path": path, "children": node.children or []}


@router.get("/read")
async def read_file(path: str):
    """Read file contents from workspace."""
    abs_path = safe_path(path)

    if not os.path.exists(abs_path):
        raise HTTPException(status_code=404, detail=f"File not found: {path}")
    if os.path.isdir(abs_path):
        raise HTTPException(status_code=400, detail="Path is a directory")

    try:
        with open(abs_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Determine language from extension
    ext_map = {
        "py": "python", "ts": "typescript", "tsx": "typescript",
        "js": "javascript", "jsx": "javascript", "json": "json",
        "md": "markdown", "css": "css", "html": "html",
        "sh": "shell", "bash": "shell", "yaml": "yaml", "yml": "yaml",
        "toml": "toml", "txt": "plaintext", "rs": "rust", "go": "go",
        "java": "java", "cpp": "cpp", "c": "c", "h": "cpp",
    }
    ext = os.path.splitext(abs_path)[1].lstrip(".")
    language = ext_map.get(ext, "plaintext")

    return {"path": path, "content": content, "language": language}


@router.post("/write")
async def write_file(request: WriteFileRequest):
    """Write content to a file in the workspace, creating parent dirs."""
    abs_path = safe_path(request.path)

    os.makedirs(os.path.dirname(abs_path), exist_ok=True)
    try:
        with open(abs_path, "w", encoding="utf-8") as f:
            f.write(request.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"path": request.path, "status": "written", "size": len(request.content)}


@router.post("/mkdir")
async def make_directory(request: MkdirRequest):
    """Create a new directory inside the workspace."""
    abs_path = safe_path(request.path)
    os.makedirs(abs_path, exist_ok=True)
    return {"path": request.path, "status": "created"}


@router.delete("/delete")
async def delete_file(path: str):
    """Delete a file or directory from the workspace."""
    abs_path = safe_path(path)

    if not os.path.exists(abs_path):
        raise HTTPException(status_code=404, detail=f"Not found: {path}")

    if os.path.isdir(abs_path):
        shutil.rmtree(abs_path)
    else:
        os.remove(abs_path)

    return {"path": path, "status": "deleted"}


@router.post("/move")
async def move_file(request: MoveFileRequest):
    """Move or rename a file/directory within the workspace."""
    src = safe_path(request.source)
    dst = safe_path(request.destination)

    if not os.path.exists(src):
        raise HTTPException(status_code=404, detail=f"Source not found: {request.source}")

    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.move(src, dst)

    return {"source": request.source, "destination": request.destination, "status": "moved"}


@router.post("/search")
async def search_files(request: SearchRequest):
    """Search for text across files in the workspace."""
    import re
    workspace = settings.workspace_path
    start_path = safe_path(request.path) if request.path else workspace
    results = []

    for root, dirs, files in os.walk(start_path):
        # Skip hidden dirs
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        for filename in files:
            filepath = os.path.join(root, filename)
            try:
                with open(filepath, "r", encoding="utf-8", errors="replace") as f:
                    lines = f.readlines()
                for i, line in enumerate(lines):
                    match = (
                        re.search(request.query, line)
                        if request.regex
                        else request.query in line
                    )
                    if match:
                        rel = "/" + os.path.relpath(filepath, workspace).replace("\\", "/")
                        results.append({
                            "file": rel,
                            "line": i + 1,
                            "content": line.rstrip(),
                        })
                        if len(results) >= 100:
                            return {"query": request.query, "results": results}
            except Exception:
                continue

    return {"query": request.query, "results": results}
