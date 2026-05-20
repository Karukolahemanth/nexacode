"""RAG embedder — generates embeddings using FastEmbed BGE model."""

import logging
from typing import List
from fastembed import TextEmbedding

logger = logging.getLogger("nexus.rag.embedder")


class CodeEmbedder:
    """Generates embeddings for code chunks using BGE model."""

    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        self.model_name = model_name
        self._model = None

    def _get_model(self) -> TextEmbedding:
        if self._model is None:
            logger.info(f"Loading embedding model: {self.model_name}")
            self._model = TextEmbedding(model_name=self.model_name)
        return self._model

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts."""
        model = self._get_model()
        embeddings = list(model.embed(texts))
        return [e.tolist() for e in embeddings]

    def embed_query(self, query: str) -> List[float]:
        """Generate embedding for a single query."""
        return self.embed_texts([query])[0]


# Singleton
code_embedder = CodeEmbedder()
