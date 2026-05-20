"""Planner Agent — decomposes user tasks into executable steps."""

from agents.base_agent import BaseAgent, AgentState
from typing import List


class PlannerAgent(BaseAgent):
    def __init__(self, llm_service=None):
        super().__init__("planner", llm_service)

    def _system_prompt(self) -> str:
        return """You are the Planner Agent in NexusIDE.
Your job is to break down user coding tasks into clear, ordered execution steps.

For each step, specify:
1. What action to take (read file, write code, run command, etc.)
2. Which files are involved
3. What the expected outcome is

Output a JSON array of steps. Each step: {"action": "...", "target": "...", "description": "..."}"""

    async def run(self, state: AgentState) -> AgentState:
        self.logger.info(f"Planning task: {state['task']}")
        if self.llm_service:
            messages = self._build_prompt(state["task"], state.get("context"))
            response = await self.llm_service.generate(messages)
            # Parse plan from response
            state["plan"] = [response]  # TODO: parse JSON steps
        else:
            state["plan"] = [
                "1. Analyze the request",
                "2. Read relevant files",
                "3. Generate code changes",
                "4. Review and apply",
            ]
        state["status"] = "planning"
        state["current_step"] = 0
        return state
