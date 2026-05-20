"""LangGraph agent workflow — orchestrates multi-agent coding pipeline."""

from langgraph.graph import StateGraph, END
from agents.base_agent import AgentState
from agents.planner_agent import PlannerAgent
from agents.coding_agent import CodingAgent
from agents.debug_agent import DebugAgent
from agents.review_agent import ReviewAgent
import logging

logger = logging.getLogger("nexus.agents.graph")


def should_debug(state: AgentState) -> str:
    """Route to debug agent if errors exist."""
    if state.get("errors") and len(state["errors"]) > 0:
        return "debug"
    return "review"


def should_continue(state: AgentState) -> str:
    """Check if workflow should continue or wait for approval."""
    if state.get("approval_required") and not state.get("user_approved"):
        return "wait_approval"
    if state.get("status") == "complete":
        return "end"
    return "continue"


def build_agent_graph(llm_service=None) -> StateGraph:
    """Build the LangGraph workflow for the coding pipeline."""
    planner = PlannerAgent(llm_service)
    coder = CodingAgent(llm_service)
    debugger = DebugAgent(llm_service)
    reviewer = ReviewAgent(llm_service)

    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("plan", planner.run)
    workflow.add_node("code", coder.run)
    workflow.add_node("debug", debugger.run)
    workflow.add_node("review", reviewer.run)

    # Define edges
    workflow.set_entry_point("plan")
    workflow.add_edge("plan", "code")
    workflow.add_conditional_edges("code", should_debug, {"debug": "debug", "review": "review"})
    workflow.add_edge("debug", "code")  # Retry after debug
    workflow.add_edge("review", END)

    return workflow


def create_initial_state(task: str, context: list = None) -> AgentState:
    """Create initial state for a new agent run."""
    return AgentState(
        messages=[],
        task=task,
        plan=None,
        current_step=0,
        context=context or [],
        files_read=[],
        files_modified=[],
        terminal_output=[],
        errors=[],
        status="pending",
        approval_required=False,
        user_approved=None,
    )
