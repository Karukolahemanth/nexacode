"""Docker workspace manager — container lifecycle for isolated coding environments."""

import logging
from typing import Optional, Dict
from config import settings

logger = logging.getLogger("nexus.docker")


class WorkspaceManager:
    """Manages Docker containers for isolated user workspaces."""

    def __init__(self):
        self._client = None
        self._containers: Dict[str, str] = {}  # workspace_id -> container_id

    def _get_client(self):
        if self._client is None:
            try:
                import docker
                self._client = docker.from_env()
                logger.info("Docker client initialized")
            except Exception as e:
                logger.warning(f"Docker not available: {e}. Using mock mode.")
                self._client = None
        return self._client

    async def create_workspace(self, workspace_id: str, project_name: str) -> dict:
        """Create a new Docker workspace container."""
        client = self._get_client()
        if client is None:
            logger.info(f"Mock: Creating workspace {workspace_id}")
            self._containers[workspace_id] = f"mock-{workspace_id}"
            return {"id": workspace_id, "container_id": f"mock-{workspace_id}", "status": "running"}

        try:
            container = client.containers.run(
                settings.DOCKER_WORKSPACE_IMAGE,
                name=f"nexus-ws-{workspace_id}",
                detach=True,
                tty=True,
                stdin_open=True,
                mem_limit="2g",
                cpu_quota=100000,
                volumes={
                    f"nexus-vol-{workspace_id}": {"bind": "/workspace", "mode": "rw"}
                },
                network=settings.DOCKER_NETWORK,
                labels={"nexus.workspace_id": workspace_id, "nexus.project": project_name},
            )
            self._containers[workspace_id] = container.id
            return {"id": workspace_id, "container_id": container.id, "status": "running"}
        except Exception as e:
            logger.error(f"Failed to create workspace: {e}")
            raise

    async def stop_workspace(self, workspace_id: str) -> dict:
        """Stop a workspace container."""
        client = self._get_client()
        container_id = self._containers.get(workspace_id)
        if client and container_id and not container_id.startswith("mock-"):
            try:
                container = client.containers.get(container_id)
                container.stop(timeout=10)
            except Exception as e:
                logger.error(f"Failed to stop workspace: {e}")
        return {"id": workspace_id, "status": "stopped"}

    async def remove_workspace(self, workspace_id: str) -> dict:
        """Remove a workspace container and volume."""
        await self.stop_workspace(workspace_id)
        self._containers.pop(workspace_id, None)
        return {"id": workspace_id, "status": "removed"}

    async def exec_command(self, workspace_id: str, command: str) -> dict:
        """Execute a command in a workspace container."""
        client = self._get_client()
        container_id = self._containers.get(workspace_id)
        if client and container_id and not container_id.startswith("mock-"):
            try:
                container = client.containers.get(container_id)
                result = container.exec_run(command, demux=True)
                stdout = result.output[0].decode() if result.output[0] else ""
                stderr = result.output[1].decode() if result.output[1] else ""
                return {"exit_code": result.exit_code, "stdout": stdout, "stderr": stderr}
            except Exception as e:
                return {"exit_code": -1, "stdout": "", "stderr": str(e)}
        return {"exit_code": 0, "stdout": f"[mock] $ {command}\n", "stderr": ""}

    def list_workspaces(self) -> list:
        """List all active workspaces."""
        return [{"id": wid, "container_id": cid} for wid, cid in self._containers.items()]


# Singleton
workspace_manager = WorkspaceManager()
