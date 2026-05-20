"""Base agent class for LangGraph-based agents."""

from typing import TypedDict, List, Optional, Annotated
from langgraph.graph import StateGraph
import logging

logger = logging.getLogger("nexus.agents")


class AgentState(TypedDict):
    """Shared state across all agents in the workflow."""
    messages: List[dict]
    task: str
    plan: Optional[List[str]]
    current_step: int
    context: List[str]  # RAG retrieved context
    files_read: List[str]
    files_modified: List[dict]  # {path, original, modified, diff}
    terminal_output: List[str]
    errors: List[str]
    status: str  # planning, coding, reviewing, debugging, complete, failed
    approval_required: bool
    user_approved: Optional[bool]


class BaseAgent:
    """Base class for all NexusIDE agents."""

    def __init__(self, name: str, llm_service=None):
        self.name = name
        self.llm_service = llm_service
        self.logger = logging.getLogger(f"nexus.agents.{name}")

    async def run(self, state: AgentState) -> AgentState:
        """Execute the agent's logic. Override in subclasses."""
        raise NotImplementedError

    def _build_prompt(self, task: str, context: List[str] = None) -> List[dict]:
        """Build a prompt with optional RAG context."""
        messages = [{"role": "system", "content": self._system_prompt()}]
        if context:
            ctx_text = "\n\n---\n\n".join(context)
            messages.append({"role": "user", "content": f"Relevant code context:\n```\n{ctx_text}\n```"})
        messages.append({"role": "user", "content": task})
        return messages

    def _system_prompt(self) -> str:
        return f"You are the {self.name} agent in NexusIDE."
