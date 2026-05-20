"""Project management API endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
import uuid

router = APIRouter()


class CreateProjectRequest(BaseModel):
    name: str
    description: Optional[str] = None
    template: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    status: str
    workspace_id: Optional[str]


@router.get("/")
async def list_projects():
    """List all projects for the current user."""
    return {
        "projects": [
            {
                "id": "demo-project",
                "name": "nexus-ide",
                "description": "NexusIDE Platform",
                "status": "active",
                "workspace_id": "ws-1",
            }
        ]
    }


@router.post("/")
async def create_project(request: CreateProjectRequest):
    """Create a new project with a Docker workspace."""
    project_id = str(uuid.uuid4())
    return {
        "id": project_id,
        "name": request.name,
        "description": request.description,
        "status": "creating",
        "workspace_id": f"ws-{project_id[:8]}",
    }


@router.get("/{project_id}")
async def get_project(project_id: str):
    """Get project details."""
    return {
        "id": project_id,
        "name": "nexus-ide",
        "status": "active",
    }


@router.delete("/{project_id}")
async def delete_project(project_id: str):
    """Delete a project and its workspace."""
    return {"id": project_id, "status": "deleted"}
