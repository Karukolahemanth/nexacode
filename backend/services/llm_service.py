"""LLM service — connects to vLLM or Ollama. No demo mode."""

import httpx
import logging
import json
from typing import AsyncGenerator, List, Dict, Optional
from config import settings

logger = logging.getLogger("nexus.llm")

SYSTEM_PROMPT = """You are NexusAI, an expert AI coding assistant built into the NexusIDE platform.
You help developers write, debug, refactor, and understand code.

Your capabilities:
- Write clean, production-grade code
- Debug errors and suggest fixes
- Refactor code for better performance
- Explain complex code patterns
- Generate tests and documentation

Always respond with clear, well-structured answers. Use markdown formatting.
When writing code, use fenced code blocks with language tags."""

RAG_CONTEXT_TEMPLATE = """
## Relevant Codebase Context

The following code snippets were retrieved from the project codebase and may be relevant to the user's question:

{context}

---
Use the above code context to provide accurate, project-specific answers. Reference specific files and line numbers when applicable."""


def build_rag_prompt(base_prompt: str, rag_results: List[dict]) -> str:
    """Build a system prompt augmented with RAG-retrieved code context."""
    if not rag_results:
        return base_prompt

    context_parts = []
    for i, result in enumerate(rag_results, 1):
        meta = result.get("metadata", {})
        file_path = meta.get("file_path", "unknown")
        language = meta.get("language", "")
        start_line = meta.get("start_line", "")
        end_line = meta.get("end_line", "")
        symbols = meta.get("symbols", [])

        header = f"### [{i}] `{file_path}`"
        if start_line:
            header += f" (L{start_line}-{end_line})"
        if symbols:
            header += f" — {', '.join(symbols[:3])}"

        content = result.get("content", "")
        if len(content) > 800:
            content = content[:800] + "\n... (truncated)"

        context_parts.append(f"{header}\n```{language}\n{content}\n```")

    context_str = "\n\n".join(context_parts)
    rag_section = RAG_CONTEXT_TEMPLATE.format(context=context_str)
    return base_prompt + "\n" + rag_section


class LLMService:
    """Manages communication with LLM inference servers (vLLM or Ollama)."""

    def __init__(self):
        self.vllm_url = settings.VLLM_URL
        self.ollama_url = settings.OLLAMA_URL
        self.model = settings.VLLM_MODEL
        self.api_key = settings.VLLM_API_KEY or "not-needed"
        self.provider = settings.LLM_PROVIDER  # "vllm" or "ollama"
        self._verified = False

    async def _verify_connection(self):
        """Verify LLM backend is reachable on first call."""
        if self._verified:
            return

        if self.provider == "vllm":
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.get(
                        f"{self.vllm_url}/models",
                        headers={"Authorization": f"Bearer {self.api_key}"},
                    )
                    if resp.status_code == 200:
                        logger.info(f"✅ vLLM connected at {self.vllm_url}")
                        self._verified = True
                        return
            except Exception as e:
                logger.warning(f"⚠️ vLLM not reachable at {self.vllm_url}: {e}")

        if self.provider == "ollama" and self.ollama_url:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.get(f"{self.ollama_url}/api/tags")
                    if resp.status_code == 200:
                        logger.info(f"✅ Ollama connected at {self.ollama_url}")
                        self._verified = True
                        return
            except Exception as e:
                logger.warning(f"⚠️ Ollama not reachable at {self.ollama_url}: {e}")

        logger.warning("⚠️ LLM backend not verified — will attempt on first request")

    async def stream_generate(
        self,
        messages: List[Dict],
        max_tokens: int = 4096,
        temperature: float = 0.7,
        rag_context: Optional[List[dict]] = None,
    ) -> AsyncGenerator[str, None]:
        """Stream tokens from the LLM, optionally with RAG context."""
        system = build_rag_prompt(SYSTEM_PROMPT, rag_context) if rag_context else SYSTEM_PROMPT

        if self.provider == "ollama" and self.ollama_url:
            async for token in self._stream_ollama(messages, system, max_tokens, temperature):
                yield token
        else:
            # Default: vLLM (OpenAI-compatible)
            async for token in self._stream_vllm(messages, system, max_tokens, temperature):
                yield token

    async def generate(
        self,
        messages: List[Dict],
        max_tokens: int = 4096,
        temperature: float = 0.7,
        rag_context: Optional[List[dict]] = None,
    ) -> str:
        """Generate a complete response."""
        result = ""
        async for token in self.stream_generate(messages, max_tokens, temperature, rag_context):
            result += token
        return result

    # ── vLLM Backend (OpenAI-compatible) ─────────────

    async def _stream_vllm(
        self, messages: List[Dict], system: str, max_tokens: int, temperature: float
    ) -> AsyncGenerator[str, None]:
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                async with client.stream(
                    "POST",
                    f"{self.vllm_url}/chat/completions",
                    json={
                        "model": self.model,
                        "messages": [{"role": "system", "content": system}] + messages,
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                        "stream": True,
                    },
                    headers={"Authorization": f"Bearer {self.api_key}"},
                ) as response:
                    if response.status_code != 200:
                        body = await response.aread()
                        yield f"\n\n⚠️ LLM Error ({response.status_code}): {body.decode()}"
                        return

                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data = line[6:]
                            if data == "[DONE]":
                                break
                            try:
                                chunk = json.loads(data)
                                delta = chunk["choices"][0].get("delta", {})
                                if "content" in delta and delta["content"]:
                                    yield delta["content"]
                            except (json.JSONDecodeError, KeyError, IndexError):
                                continue
            except httpx.ConnectError:
                yield "\n\n⚠️ Cannot connect to LLM server. Please check VLLM_URL configuration."
            except Exception as e:
                logger.error(f"vLLM streaming failed: {e}")
                yield f"\n\n⚠️ LLM Error: {str(e)}"

    # ── Ollama Backend ───────────────────────────────

    async def _stream_ollama(
        self, messages: List[Dict], system: str, max_tokens: int, temperature: float
    ) -> AsyncGenerator[str, None]:
        ollama_messages = [{"role": "system", "content": system}] + messages
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                async with client.stream(
                    "POST",
                    f"{self.ollama_url}/api/chat",
                    json={
                        "model": self.model,
                        "messages": ollama_messages,
                        "stream": True,
                        "options": {
                            "temperature": temperature,
                            "num_predict": max_tokens,
                        },
                    },
                ) as response:
                    async for line in response.aiter_lines():
                        if line.strip():
                            try:
                                chunk = json.loads(line)
                                content = chunk.get("message", {}).get("content", "")
                                if content:
                                    yield content
                                if chunk.get("done", False):
                                    break
                            except json.JSONDecodeError:
                                continue
            except httpx.ConnectError:
                yield "\n\n⚠️ Cannot connect to Ollama. Please check OLLAMA_URL configuration."
            except Exception as e:
                logger.error(f"Ollama streaming failed: {e}")
                yield f"\n\n⚠️ Ollama Error: {str(e)}"


# Singleton
llm_service = LLMService()
