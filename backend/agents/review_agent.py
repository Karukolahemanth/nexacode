"""Review Agent — improves code quality."""

from agents.base_agent import BaseAgent, AgentState


class ReviewAgent(BaseAgent):
    def __init__(self, llm_service=None):
        super().__init__("reviewer", llm_service)

    def _system_prompt(self) -> str:
        return """You are the Review Agent in NexusIDE.
Review code for: correctness, performance, security, readability, best practices.
Provide specific, actionable suggestions with code examples."""

    async def run(self, state: AgentState) -> AgentState:
        self.logger.info("Reviewing code changes")
        state["status"] = "reviewing"
        return state
