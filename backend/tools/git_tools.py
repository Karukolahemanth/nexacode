"""Git tools for agent use — status, diff, commit, branch operations."""

import subprocess
import logging

logger = logging.getLogger("nexus.tools.git")


def _run_git(args: list, cwd: str = "/workspace") -> dict:
    """Run a git command and return output."""
    try:
        result = subprocess.run(
            ["git"] + args, capture_output=True, text=True, cwd=cwd, timeout=15
        )
        return {"exit_code": result.returncode, "stdout": result.stdout, "stderr": result.stderr}
    except Exception as e:
        return {"exit_code": -1, "error": str(e)}


async def git_status(cwd: str = "/workspace") -> dict:
    return _run_git(["status", "--porcelain"], cwd)


async def git_diff(cwd: str = "/workspace", staged: bool = False) -> dict:
    args = ["diff", "--staged"] if staged else ["diff"]
    return _run_git(args, cwd)


async def git_commit(message: str, cwd: str = "/workspace") -> dict:
    _run_git(["add", "."], cwd)
    return _run_git(["commit", "-m", message], cwd)


async def git_checkout(branch: str, create: bool = False, cwd: str = "/workspace") -> dict:
    args = ["checkout"]
    if create:
        args.append("-b")
    args.append(branch)
    return _run_git(args, cwd)


async def git_branch(cwd: str = "/workspace") -> dict:
    return _run_git(["branch", "-a"], cwd)


async def git_log(n: int = 10, cwd: str = "/workspace") -> dict:
    return _run_git(["log", f"-{n}", "--oneline", "--graph"], cwd)
