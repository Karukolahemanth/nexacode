"""Terminal tools — command execution in Docker workspaces."""

import asyncio
import subprocess
import logging
from typing import Optional

logger = logging.getLogger("nexus.tools.terminal")


async def run_command(command: str, cwd: str = "/workspace", timeout: int = 30) -> dict:
    """Execute a command and return output."""
    try:
        proc = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=cwd,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
        return {
            "command": command,
            "exit_code": proc.returncode,
            "stdout": stdout.decode("utf-8", errors="replace"),
            "stderr": stderr.decode("utf-8", errors="replace"),
        }
    except asyncio.TimeoutError:
        proc.kill()
        return {"command": command, "exit_code": -1, "error": "Command timed out"}
    except Exception as e:
        return {"command": command, "exit_code": -1, "error": str(e)}


async def kill_process(pid: int) -> dict:
    """Kill a running process."""
    try:
        import signal
        import os
        os.kill(pid, signal.SIGTERM)
        return {"pid": pid, "status": "terminated"}
    except Exception as e:
        return {"pid": pid, "error": str(e)}
