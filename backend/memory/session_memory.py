"""Session memory — Redis-based short-term state management."""

import json
import logging
from typing import Optional, List
from config import settings

logger = logging.getLogger("nexus.memory.session")


class SessionMemory:
    """Short-term memory using Redis for conversation and workspace state."""

    def __init__(self):
        self._redis = None

    async def _get_redis(self):
        if self._redis is None:
            try:
                import redis.asyncio as aioredis
                self._redis = aioredis.from_url(settings.REDIS_URL)
                logger.info("Connected to Redis")
            except Exception as e:
                logger.warning(f"Redis not available: {e}")
        return self._redis

    async def set(self, key: str, value: dict, ttl: int = 3600):
        """Store a value with TTL."""
        r = await self._get_redis()
        if r:
            await r.setex(key, ttl, json.dumps(value))

    async def get(self, key: str) -> Optional[dict]:
        """Retrieve a value."""
        r = await self._get_redis()
        if r:
            data = await r.get(key)
            return json.loads(data) if data else None
        return None

    async def append_message(self, session_id: str, message: dict):
        """Append a message to a session's conversation history."""
        r = await self._get_redis()
        if r:
            key = f"chat:{session_id}:messages"
            await r.rpush(key, json.dumps(message))
            await r.expire(key, 86400)  # 24h TTL

    async def get_messages(self, session_id: str, limit: int = 50) -> List[dict]:
        """Get recent messages from a session."""
        r = await self._get_redis()
        if r:
            key = f"chat:{session_id}:messages"
            messages = await r.lrange(key, -limit, -1)
            return [json.loads(m) for m in messages]
        return []

    async def clear_session(self, session_id: str):
        """Clear a session's data."""
        r = await self._get_redis()
        if r:
            keys = await r.keys(f"chat:{session_id}:*")
            if keys:
                await r.delete(*keys)


# Singleton
session_memory = SessionMemory()
