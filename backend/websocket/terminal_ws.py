"""Terminal WebSocket handler — connects frontend xterm.js to a real PTY shell."""

import asyncio
import sys
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from terminal.pty_manager import pty_manager

logger = logging.getLogger("nexus.ws.terminal")

router = APIRouter()


def _get_shell() -> str:
    """Detect the best available shell for the current OS."""
    if sys.platform == "win32":
        return "powershell.exe"
    # On Linux/Mac, prefer bash
    import shutil
    for shell in ("/bin/bash", "/bin/sh"):
        if shutil.which(shell):
            return shell
    return "/bin/sh"


@router.websocket("/ws/terminal/{session_id}")
async def terminal_websocket(websocket: WebSocket, session_id: str):
    """WebSocket endpoint connecting xterm.js frontend to a real shell process."""
    await websocket.accept()
    logger.info(f"Terminal WebSocket connected: session={session_id}")

    shell = _get_shell()
    logger.info(f"Starting shell: {shell} for session {session_id}")

    # Create or reuse PTY session
    session = pty_manager.get_session(session_id)
    if not session or not session.is_active:
        try:
            session = await pty_manager.create_session(session_id, "default", command=shell)
        except Exception as e:
            await websocket.send_text(f"\r\nFailed to start terminal: {e}\r\n")
            await websocket.close()
            return

    # Background task: read from shell stdout and forward to WebSocket
    async def read_output():
        try:
            while session.is_active:
                output = await session.read()
                if output:
                    await websocket.send_text(output)
                else:
                    await asyncio.sleep(0.02)
        except Exception as e:
            logger.debug(f"Terminal read loop ended: {e}")

    reader_task = asyncio.create_task(read_output())

    try:
        while True:
            data = await websocket.receive_text()
            await session.write(data)
    except WebSocketDisconnect:
        logger.info(f"Terminal WebSocket disconnected: session={session_id}")
    except Exception as e:
        logger.error(f"Terminal WebSocket error: {e}")
    finally:
        reader_task.cancel()
        await pty_manager.remove_session(session_id)
