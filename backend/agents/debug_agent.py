"""Debug Agent — analyzes errors and generates fixes."""

from agents.base_agent import BaseAgent, AgentState


class DebugAgent(BaseAgent):
    def __init__(self, llm_service=None):
        super().__init__("debugger", llm_service)

    def _system_prompt(self) -> str:
        return """You are the Debug Agent in NexusIDE.
You analyze error messages, stack traces, and failing tests.
Identify root causes and generate targeted fixes.
Explain what went wrong and why your fix resolves it."""

    async def run(self, state: AgentState) -> AgentState:
        self.logger.info(f"Debugging errors: {len(state.get('errors', []))}")
        state["status"] = "debugging"
        if self.llm_service and state.get("errors"):
            error_ctx = "\n".join(state["errors"])
            messages = self._build_prompt(
                f"Fix these errors:\n{error_ctx}\n\nOriginal task: {state['task']}",
                state.get("context"),
            )
            response = await self.llm_service.generate(messages)
            state["files_modified"].append({"content": response, "status": "debug_fix"})
        return state
