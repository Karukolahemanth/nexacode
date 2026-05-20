"""RAG retriever — semantic search over code embeddings using Qdrant with fallback."""

import logging
from typing import List, Optional, Dict
from config import settings

logger = logging.getLogger("nexus.rag.retriever")


class CodeRetriever:
    """Retrieves relevant code context via semantic search (Qdrant) or text matching (fallback)."""

    def __init__(self):
        self._client = None
        self._qdrant_available = None
        self.collection = settings.QDRANT_COLLECTION
        # In-memory fallback store for when Qdrant is unavailable
        self._memory_store: List[Dict] = []

    def _get_client(self):
        if self._qdrant_available is False:
            return None
        if self._client is None:
            try:
                from qdrant_client import QdrantClient
                self._client = QdrantClient(url=settings.QDRANT_URL, timeout=3.0)
                # Test connection
                self._client.get_collections()
                self._qdrant_available = True
                logger.info(f"Connected to Qdrant at {settings.QDRANT_URL}")
            except Exception as e:
                self._qdrant_available = False
                self._client = None
                logger.info(f"Qdrant not available ({e}) — using in-memory fallback")
        return self._client

    async def ensure_collection(self, vector_size: int = 384):
        """Create collection if it doesn't exist."""
        client = self._get_client()
        if client is None:
            return
        try:
            from qdrant_client.models import Distance, VectorParams
            collections = client.get_collections().collections
            if not any(c.name == self.collection for c in collections):
                client.create_collection(
                    collection_name=self.collection,
                    vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
                )
                logger.info(f"Created collection: {self.collection}")
        except Exception as e:
            logger.warning(f"Failed to ensure collection: {e}")

    async def index_chunks(self, chunks: List[dict]):
        """Index code chunks into Qdrant or in-memory fallback."""
        client = self._get_client()

        if client is not None:
            try:
                from qdrant_client.models import PointStruct
                from rag.embedder import code_embedder
                texts = [c["content"] for c in chunks]
                embeddings = code_embedder.embed_texts(texts)
                points = [
                    PointStruct(
                        id=i + len(self._memory_store),
                        vector=emb,
                        payload={**c.get("metadata", {}), "content": c["content"]},
                    )
                    for i, (c, emb) in enumerate(zip(chunks, embeddings))
                ]
                client.upsert(collection_name=self.collection, points=points)
                logger.info(f"Indexed {len(points)} chunks in Qdrant")
                return
            except Exception as e:
                logger.warning(f"Qdrant indexing failed, using memory: {e}")

        # Fallback: store in memory
        for chunk in chunks:
            self._memory_store.append({
                "content": chunk["content"],
                "metadata": chunk.get("metadata", {}),
            })
        logger.info(f"Indexed {len(chunks)} chunks in memory (total: {len(self._memory_store)})")

    async def search(self, query: str, top_k: int = 5) -> List[dict]:
        """Semantic search for relevant code. Falls back to text matching."""
        client = self._get_client()

        if client is not None:
            try:
                from rag.embedder import code_embedder
                query_vector = code_embedder.embed_query(query)
                results = client.search(
                    collection_name=self.collection,
                    query_vector=query_vector,
                    limit=top_k,
                )
                return [
                    {
                        "content": r.payload.get("content", ""),
                        "score": r.score,
                        "metadata": {
                            k: v for k, v in r.payload.items() if k != "content"
                        },
                    }
                    for r in results
                ]
            except Exception as e:
                logger.warning(f"Qdrant search failed: {e}")

        # Fallback: basic text matching
        return self._memory_search(query, top_k)

    def _memory_search(self, query: str, top_k: int = 5) -> List[dict]:
        """Simple text-based search over in-memory chunks."""
        query_lower = query.lower()
        query_words = query_lower.split()
        scored = []

        for chunk in self._memory_store:
            content_lower = chunk["content"].lower()
            # Score based on word matches
            score = 0.0
            for word in query_words:
                if word in content_lower:
                    score += 1.0
                    # Bonus for exact symbol match
                    symbols = chunk.get("metadata", {}).get("symbols", [])
                    if any(word in s.lower() for s in symbols):
                        score += 2.0

            if score > 0:
                scored.append({
                    "content": chunk["content"],
                    "score": score / len(query_words),
                    "metadata": chunk.get("metadata", {}),
                })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_k]

    def get_indexed_count(self) -> int:
        """Return number of indexed chunks."""
        client = self._get_client()
        if client is not None:
            try:
                info = client.get_collection(self.collection)
                return info.points_count
            except Exception:
                pass
        return len(self._memory_store)


# Singleton
code_retriever = CodeRetriever()
