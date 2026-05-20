"""RAG Indexer — orchestrates chunking, embedding, and storing code in Qdrant."""

import logging
import uuid
from typing import List, Optional
from rag.chunker import chunk_repository, chunk_file, CodeChunk
from rag.embedder import code_embedder
from rag.retriever import code_retriever
from config import settings

logger = logging.getLogger("nexus.rag.indexer")


class CodeIndexer:
    """Indexes a codebase into Qdrant for semantic search."""

    def __init__(self):
        self.retriever = code_retriever
        self.embedder = code_embedder

    async def index_repository(self, repo_path: str, project_id: str = "default") -> dict:
        """Index an entire repository."""
        logger.info(f"Indexing repository: {repo_path}")

        # 1. Chunk the repo
        chunks = chunk_repository(repo_path)
        if not chunks:
            return {"status": "empty", "chunks": 0, "files": 0}

        # 2. Ensure collection exists
        await self.retriever.ensure_collection()

        # 3. Batch embed and store
        batch_size = 50
        total_indexed = 0

        for i in range(0, len(chunks), batch_size):
            batch = chunks[i : i + batch_size]
            await self._index_batch(batch, project_id)
            total_indexed += len(batch)
            logger.info(f"Indexed {total_indexed}/{len(chunks)} chunks")

        unique_files = len(set(c.file_path for c in chunks))
        logger.info(f"✅ Indexing complete: {len(chunks)} chunks from {unique_files} files")

        return {
            "status": "complete",
            "chunks": len(chunks),
            "files": unique_files,
            "project_id": project_id,
        }

    async def index_file(self, file_path: str, content: str, project_id: str = "default") -> dict:
        """Index a single file (for incremental updates)."""
        chunks = chunk_file(file_path, content)
        if not chunks:
            return {"status": "empty", "chunks": 0}

        await self.retriever.ensure_collection()
        await self._index_batch(chunks, project_id)

        return {"status": "indexed", "chunks": len(chunks), "file": file_path}

    async def _index_batch(self, chunks: List[CodeChunk], project_id: str):
        """Embed and store a batch of chunks."""
        # Build text for embedding (include metadata for better retrieval)
        texts = []
        for chunk in chunks:
            header = f"File: {chunk.file_path} | Language: {chunk.language}"
            if chunk.symbols:
                header += f" | Symbols: {', '.join(chunk.symbols)}"
            texts.append(f"{header}\n\n{chunk.content}")

        # Convert to retriever format
        indexed_chunks = [
            {
                "id": str(uuid.uuid4()),
                "content": text,
                "metadata": {
                    "file_path": chunk.file_path,
                    "start_line": chunk.start_line,
                    "end_line": chunk.end_line,
                    "language": chunk.language,
                    "chunk_type": chunk.chunk_type,
                    "symbols": chunk.symbols,
                    "project_id": project_id,
                },
            }
            for chunk, text in zip(chunks, texts)
        ]

        await self.retriever.index_chunks(indexed_chunks)

    async def search(self, query: str, top_k: int = 5) -> List[dict]:
        """Search indexed code."""
        return await self.retriever.search(query, top_k)


# Singleton
code_indexer = CodeIndexer()
