"""WebSocket connection manager for real-time communication."""

from typing import Dict, Set
from fastapi import WebSocket
import logging
import json

logger = logging.getLogger("nexus.ws")


class ConnectionManager:
    """Manages WebSocket connections for streaming AI responses, terminal, etc."""

    def __init__(self):
        self._connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel: str = "default"):
        await websocket.accept()
        if channel not in self._connections:
            self._connections[channel] = set()
        self._connections[channel].add(websocket)
        logger.info(f"Client connected to channel: {channel}")

    def disconnect(self, websocket: WebSocket, channel: str = "default"):
        if channel in self._connections:
            self._connections[channel].discard(websocket)
            if not self._connections[channel]:
                del self._connections[channel]
        logger.info(f"Client disconnected from channel: {channel}")

    async def send_json(self, websocket: WebSocket, data: dict):
        await websocket.send_json(data)

    async def send_text(self, websocket: WebSocket, text: str):
        await websocket.send_text(text)

    async def broadcast(self, channel: str, data: dict):
        if channel in self._connections:
            disconnected = set()
            for ws in self._connections[channel]:
                try:
                    await ws.send_json(data)
                except Exception:
                    disconnected.add(ws)
            for ws in disconnected:
                self._connections[channel].discard(ws)

    async def stream_tokens(self, websocket: WebSocket, token: str):
        """Stream a single token to the client."""
        await self.send_json(websocket, {"type": "token", "data": token})

    async def send_agent_step(self, websocket: WebSocket, step: dict):
        """Send agent execution step update."""
        await self.send_json(websocket, {"type": "agent_step", "data": step})

    async def send_tool_call(self, websocket: WebSocket, tool_call: dict):
        """Send tool call notification."""
        await self.send_json(websocket, {"type": "tool_call", "data": tool_call})

    @property
    def active_connections(self) -> int:
        return sum(len(conns) for conns in self._connections.values())


# Singleton instance
ws_manager = ConnectionManager()
