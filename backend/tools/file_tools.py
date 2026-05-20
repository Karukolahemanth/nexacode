"""File tools for agent use — read, write, search, list, delete, move."""

import os
import glob
from typing import List, Optional


async def read_file(path: str, workspace_root: str = "/workspace") -> dict:
    """Read file contents from workspace."""
    full_path = os.path.join(workspace_root, path.lstrip("/"))
    try:
        with open(full_path, "r", encoding="utf-8") as f:
            content = f.read()
        return {"path": path, "content": content, "size": len(content)}
    except Exception as e:
        return {"path": path, "error": str(e)}


async def write_file(path: str, content: str, workspace_root: str = "/workspace") -> dict:
    """Write content to a file."""
    full_path = os.path.join(workspace_root, path.lstrip("/"))
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    try:
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        return {"path": path, "status": "written", "size": len(content)}
    except Exception as e:
        return {"path": path, "error": str(e)}


async def search_files(query: str, workspace_root: str = "/workspace", pattern: str = "**/*") -> List[dict]:
    """Search for text across files."""
    results = []
    for filepath in glob.glob(os.path.join(workspace_root, pattern), recursive=True):
        if os.path.isfile(filepath):
            try:
                with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                    for i, line in enumerate(f, 1):
                        if query.lower() in line.lower():
                            rel_path = os.path.relpath(filepath, workspace_root)
                            results.append({"file": rel_path, "line": i, "content": line.strip()})
                            if len(results) >= 50:
                                return results
            except Exception:
                continue
    return results


async def list_directory(path: str = "/", workspace_root: str = "/workspace") -> List[dict]:
    """List directory contents."""
    full_path = os.path.join(workspace_root, path.lstrip("/"))
    entries = []
    try:
        for entry in sorted(os.listdir(full_path)):
            entry_path = os.path.join(full_path, entry)
            entries.append({
                "name": entry,
                "path": os.path.join(path, entry),
                "type": "directory" if os.path.isdir(entry_path) else "file",
                "size": os.path.getsize(entry_path) if os.path.isfile(entry_path) else None,
            })
    except Exception as e:
        return [{"error": str(e)}]
    return entries


async def delete_file(path: str, workspace_root: str = "/workspace") -> dict:
    """Delete a file."""
    full_path = os.path.join(workspace_root, path.lstrip("/"))
    try:
        os.remove(full_path)
        return {"path": path, "status": "deleted"}
    except Exception as e:
        return {"path": path, "error": str(e)}


async def move_file(source: str, destination: str, workspace_root: str = "/workspace") -> dict:
    """Move or rename a file."""
    src = os.path.join(workspace_root, source.lstrip("/"))
    dst = os.path.join(workspace_root, destination.lstrip("/"))
    try:
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        os.rename(src, dst)
        return {"source": source, "destination": destination, "status": "moved"}
    except Exception as e:
        return {"error": str(e)}
