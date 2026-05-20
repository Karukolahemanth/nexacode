"""Pydantic schemas for API request/response validation."""

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# --- Auth ---
class UserCreate(BaseModel):
    email: str
    password: str
    display_name: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: str
    display_name: Optional[str]
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# --- Project ---
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    status: str
    created_at: datetime


# --- Chat ---
class ChatMessageCreate(BaseModel):
    content: str
    context: Optional[dict] = None


class ChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    tool_calls: Optional[list] = None
    created_at: datetime


# --- File ---
class FileReadResponse(BaseModel):
    path: str
    content: str
    language: str
    size: int


class FileWriteRequest(BaseModel):
    path: str
    content: str


# --- Workspace ---
class WorkspaceResponse(BaseModel):
    id: str
    status: str
    container_id: Optional[str]
