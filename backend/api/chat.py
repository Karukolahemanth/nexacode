"""Chat API endpoints — AI conversation management."""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
import uuid

router = APIRouter()


class SendMessageRequest(BaseModel):
    session_id: Optional[str] = None
    content: str
    context: Optional[dict] = None


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    tool_calls: Optional[list] = None


@router.post("/sessions")
async def create_session(project_id: str = "default"):
    """Create a new chat session."""
    session_id = str(uuid.uuid4())
    return {"session_id": session_id, "project_id": project_id}


@router.get("/sessions/{session_id}/messages")
async def get_messages(session_id: str):
    """Get chat history for a session."""
    return {"session_id": session_id, "messages": []}


@router.post("/send")
async def send_message(request: SendMessageRequest):
    """Send a message and get AI response. (Phase 2: streaming via WebSocket)"""
    return {
        "id": str(uuid.uuid4()),
        "role": "assistant",
        "content": f"Echo: {request.content}\n\n*Real AI responses coming in Phase 2 with vLLM integration.*",
    }
