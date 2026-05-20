"""Git service — wrapper for Git operations in workspaces."""

import logging
from typing import Optional

logger = logging.getLogger("nexus.git")


class GitService:
    """High-level Git operations for workspace projects."""

    async def get_status(self, workspace_path: str) -> dict:
        from tools.git_tools import git_status
        return await git_status(workspace_path)

    async def get_diff(self, workspace_path: str, staged: bool = False) -> dict:
        from tools.git_tools import git_diff
        return await git_diff(workspace_path, staged)

    async def commit(self, workspace_path: str, message: str) -> dict:
        from tools.git_tools import git_commit
        return await git_commit(message, workspace_path)

    async def checkout_branch(self, workspace_path: str, branch: str, create: bool = False) -> dict:
        from tools.git_tools import git_checkout
        return await git_checkout(branch, create, workspace_path)

    async def list_branches(self, workspace_path: str) -> dict:
        from tools.git_tools import git_branch
        return await git_branch(workspace_path)


# Singleton
git_service = GitService()
