"""PTY Manager — manages pseudo-terminal sessions for Docker workspaces."""

import asyncio
import logging
from typing import Dict, Optional

logger = logging.getLogger("nexus.terminal")


class PTYSession:
    """Represents a single terminal session."""

    def __init__(self, session_id: str, workspace_id: str):
        self.session_id = session_id
        self.workspace_id = workspace_id
        self.process: Optional[asyncio.subprocess.Process] = None
        self.is_active = False

    async def start(self, command: str = "/bin/bash"):
        """Start a shell session."""
        self.process = await asyncio.create_subprocess_exec(
            command,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        self.is_active = True
        logger.info(f"PTY session {self.session_id} started")

    async def write(self, data: str):
        """Send input to the shell."""
        if self.process and self.process.stdin:
            self.process.stdin.write(data.encode())
            await self.process.stdin.drain()

    async def read(self) -> str:
        """Read output from the shell."""
        if self.process and self.process.stdout:
            try:
                data = await asyncio.wait_for(self.process.stdout.read(4096), timeout=0.1)
                return data.decode("utf-8", errors="replace")
            except asyncio.TimeoutError:
                return ""
        return ""

    async def kill(self):
        """Terminate the session."""
        if self.process:
            self.process.terminate()
            self.is_active = False
            logger.info(f"PTY session {self.session_id} terminated")


class PTYManager:
    """Manages multiple terminal sessions."""

    def __init__(self):
        self._sessions: Dict[str, PTYSession] = {}

    async def create_session(self, session_id: str, workspace_id: str, command: str = "/bin/bash") -> PTYSession:
        session = PTYSession(session_id, workspace_id)
        await session.start(command)
        self._sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[PTYSession]:
        return self._sessions.get(session_id)

    async def remove_session(self, session_id: str):
        session = self._sessions.pop(session_id, None)
        if session:
            await session.kill()

    @property
    def active_sessions(self) -> int:
        return sum(1 for s in self._sessions.values() if s.is_active)


# Singleton
pty_manager = PTYManager()
