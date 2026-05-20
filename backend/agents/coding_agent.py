"""Coding Agent — generates and modifies code."""

from agents.base_agent import BaseAgent, AgentState


class CodingAgent(BaseAgent):
    def __init__(self, llm_service=None):
        super().__init__("coder", llm_service)

    def _system_prompt(self) -> str:
        return """You are the Coding Agent in NexusIDE.
You write clean, production-grade code based on the plan and context provided.
Always output complete file contents with proper formatting.
Use best practices, type annotations, and clear comments."""

    async def run(self, state: AgentState) -> AgentState:
        self.logger.info(f"Coding step {state['current_step']}")
        state["status"] = "coding"
        if self.llm_service:
            messages = self._build_prompt(state["task"], state.get("context"))
            response = await self.llm_service.generate(messages, max_tokens=8192)
            state["files_modified"].append({"content": response, "status": "pending_review"})
        state["approval_required"] = True
        return state
