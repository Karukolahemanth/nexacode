"""Code chunker — splits source files into semantic chunks for RAG indexing."""

import os
import re
import logging
from typing import List, Dict, Optional
from dataclasses import dataclass, field

logger = logging.getLogger("nexus.rag.chunker")

# File extensions we support for indexing
SUPPORTED_EXTENSIONS = {
    ".py", ".js", ".ts", ".tsx", ".jsx", ".java", ".go", ".rs", ".rb",
    ".c", ".cpp", ".h", ".hpp", ".cs", ".php", ".swift", ".kt",
    ".html", ".css", ".scss", ".sql", ".sh", ".bash", ".yaml", ".yml",
    ".json", ".toml", ".md", ".txt", ".env", ".dockerfile",
}

# Files/dirs to skip
IGNORE_DIRS = {
    "node_modules", ".git", ".next", "__pycache__", ".venv", "venv",
    "dist", "build", ".cache", ".idea", ".vscode", "coverage",
    "target", "vendor", ".tox", "eggs",
}

IGNORE_FILES = {
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
    ".DS_Store", "Thumbs.db",
}

MAX_FILE_SIZE = 500_000  # 500KB max per file
CHUNK_SIZE = 800  # ~800 chars per chunk
CHUNK_OVERLAP = 100  # overlap between chunks


@dataclass
class CodeChunk:
    """A single chunk of code with metadata."""
    content: str
    file_path: str
    start_line: int
    end_line: int
    language: str
    chunk_type: str = "code"  # code, function, class, comment, config
    symbols: List[str] = field(default_factory=list)


def detect_language(file_path: str) -> str:
    """Detect language from file extension."""
    ext = os.path.splitext(file_path)[1].lower()
    lang_map = {
        ".py": "python", ".js": "javascript", ".ts": "typescript",
        ".tsx": "typescriptreact", ".jsx": "javascriptreact",
        ".java": "java", ".go": "go", ".rs": "rust", ".rb": "ruby",
        ".c": "c", ".cpp": "cpp", ".h": "c", ".hpp": "cpp",
        ".cs": "csharp", ".php": "php", ".swift": "swift", ".kt": "kotlin",
        ".html": "html", ".css": "css", ".scss": "scss",
        ".sql": "sql", ".sh": "shell", ".bash": "shell",
        ".yaml": "yaml", ".yml": "yaml", ".json": "json",
        ".toml": "toml", ".md": "markdown",
    }
    return lang_map.get(ext, "text")


def extract_symbols(content: str, language: str) -> List[str]:
    """Extract function/class names from code."""
    symbols = []
    patterns = {
        "python": [
            r"(?:def|class)\s+(\w+)",
            r"(\w+)\s*=\s*(?:lambda|async\s+def)",
        ],
        "javascript": [
            r"(?:function|class)\s+(\w+)",
            r"(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\(|async)",
            r"export\s+(?:default\s+)?(?:function|class)\s+(\w+)",
        ],
        "typescript": [
            r"(?:function|class|interface|type|enum)\s+(\w+)",
            r"(?:const|let|var)\s+(\w+)\s*(?::\s*\w+)?\s*=\s*(?:function|\(|async)",
            r"export\s+(?:default\s+)?(?:function|class|interface|type)\s+(\w+)",
        ],
        "typescriptreact": [
            r"(?:function|class|interface|type|enum)\s+(\w+)",
            r"(?:const|let|var)\s+(\w+)\s*(?::\s*\w+)?\s*=\s*(?:function|\(|async)",
            r"export\s+(?:default\s+)?(?:function|class)\s+(\w+)",
        ],
    }
    for pattern in patterns.get(language, patterns.get("javascript", [])):
        symbols.extend(re.findall(pattern, content))
    return list(set(symbols))


def chunk_by_functions(content: str, file_path: str, language: str) -> List[CodeChunk]:
    """Try to chunk by function/class boundaries."""
    lines = content.split("\n")
    chunks = []

    # Patterns for function/class boundaries
    boundary_patterns = {
        "python": r"^(class |def |async def )",
        "javascript": r"^(function |class |const \w+ = |export )",
        "typescript": r"^(function |class |interface |type |const \w+ = |export )",
        "typescriptreact": r"^(function |class |interface |type |const \w+ = |export )",
    }

    pattern = boundary_patterns.get(language)
    if not pattern:
        return chunk_by_size(content, file_path, language)

    current_chunk_lines = []
    current_start = 0

    for i, line in enumerate(lines):
        if re.match(pattern, line.strip()) and current_chunk_lines:
            chunk_content = "\n".join(current_chunk_lines)
            if len(chunk_content.strip()) > 20:
                symbols = extract_symbols(chunk_content, language)
                chunks.append(CodeChunk(
                    content=chunk_content,
                    file_path=file_path,
                    start_line=current_start + 1,
                    end_line=current_start + len(current_chunk_lines),
                    language=language,
                    chunk_type="function" if symbols else "code",
                    symbols=symbols,
                ))
            current_chunk_lines = [line]
            current_start = i
        else:
            current_chunk_lines.append(line)

    # Last chunk
    if current_chunk_lines:
        chunk_content = "\n".join(current_chunk_lines)
        if len(chunk_content.strip()) > 20:
            symbols = extract_symbols(chunk_content, language)
            chunks.append(CodeChunk(
                content=chunk_content,
                file_path=file_path,
                start_line=current_start + 1,
                end_line=current_start + len(current_chunk_lines),
                language=language,
                chunk_type="function" if symbols else "code",
                symbols=symbols,
            ))

    # If we got very few chunks, fall back to size-based
    if len(chunks) <= 1 and len(content) > CHUNK_SIZE:
        return chunk_by_size(content, file_path, language)

    return chunks


def chunk_by_size(content: str, file_path: str, language: str) -> List[CodeChunk]:
    """Chunk by character size with overlap."""
    chunks = []
    lines = content.split("\n")
    current_lines = []
    current_size = 0
    current_start = 0

    for i, line in enumerate(lines):
        current_lines.append(line)
        current_size += len(line) + 1

        if current_size >= CHUNK_SIZE:
            chunk_content = "\n".join(current_lines)
            symbols = extract_symbols(chunk_content, language)
            chunks.append(CodeChunk(
                content=chunk_content,
                file_path=file_path,
                start_line=current_start + 1,
                end_line=i + 1,
                language=language,
                symbols=symbols,
            ))
            # Keep overlap
            overlap_lines = current_lines[-3:] if len(current_lines) > 3 else []
            current_lines = overlap_lines
            current_size = sum(len(l) + 1 for l in current_lines)
            current_start = max(0, i - len(overlap_lines) + 1)

    # Final chunk
    if current_lines:
        chunk_content = "\n".join(current_lines)
        if len(chunk_content.strip()) > 20:
            symbols = extract_symbols(chunk_content, language)
            chunks.append(CodeChunk(
                content=chunk_content,
                file_path=file_path,
                start_line=current_start + 1,
                end_line=len(lines),
                language=language,
                symbols=symbols,
            ))

    return chunks


def chunk_file(file_path: str, content: Optional[str] = None) -> List[CodeChunk]:
    """Chunk a single file into semantic code chunks."""
    if content is None:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
        except Exception as e:
            logger.warning(f"Cannot read {file_path}: {e}")
            return []

    if len(content) > MAX_FILE_SIZE:
        logger.info(f"Skipping large file: {file_path} ({len(content)} bytes)")
        return []

    language = detect_language(file_path)
    return chunk_by_functions(content, file_path, language)


def chunk_repository(repo_path: str) -> List[CodeChunk]:
    """Chunk all supported files in a repository."""
    all_chunks = []
    file_count = 0

    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for fname in files:
            if fname in IGNORE_FILES:
                continue
            ext = os.path.splitext(fname)[1].lower()
            if ext not in SUPPORTED_EXTENSIONS:
                continue

            file_path = os.path.join(root, fname)
            rel_path = os.path.relpath(file_path, repo_path)
            chunks = chunk_file(file_path)

            for chunk in chunks:
                chunk.file_path = rel_path

            all_chunks.extend(chunks)
            file_count += 1

    logger.info(f"Chunked {file_count} files into {len(all_chunks)} chunks")
    return all_chunks
